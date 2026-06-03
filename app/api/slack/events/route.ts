import { NextRequest, NextResponse, after } from "next/server"
import crypto from "crypto"
import { addTrip, updateTrip, StoredTrip } from "@/lib/trips-store"
import { searchFlights, offersToTripOptions, parseTripDateToISO } from "@/lib/duffel"

// ─── Slack signature verification ────────────────────────────────────────────

function verifySlackSignature(body: string, timestamp: string, signature: string): boolean {
  const secret = process.env.SLACK_SIGNING_SECRET
  if (!secret) return false
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - parseInt(timestamp)) > 300) return false
  const hmac = crypto.createHmac("sha256", secret)
  hmac.update(`v0:${timestamp}:${body}`)
  const expected = `v0=${hmac.digest("hex")}`
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

// ─── Slack API helpers ────────────────────────────────────────────────────────

async function getSlackUser(userId: string): Promise<{ name: string }> {
  try {
    const res = await fetch(`https://slack.com/api/users.info?user=${userId}`, {
      headers: { Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}` },
    })
    const data = await res.json()
    if (data.ok) return { name: data.user.real_name || data.user.name || userId }
  } catch {}
  return { name: userId }
}

async function getChannelName(channelId: string): Promise<string> {
  try {
    const res = await fetch(`https://slack.com/api/conversations.info?channel=${channelId}`, {
      headers: { Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}` },
    })
    const data = await res.json()
    if (data.ok) return `#${data.channel.name}`
  } catch {}
  return "#travel"
}

async function postSlackReply(channelId: string, threadTs: string, text: string): Promise<void> {
  try {
    await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
      },
      body: JSON.stringify({ channel: channelId, thread_ts: threadTs, text }),
    })
  } catch {}
}

// ─── Message parsing ──────────────────────────────────────────────────────────

const AIRPORT_CODES: Record<string, string> = {
  miami: "MIA", mia: "MIA",
  dallas: "DAL", dal: "DAL", dfw: "DFW",
  houston: "HOU", hou: "HOU",
  "new york": "NYC", nyc: "NYC", jfk: "JFK",
  bogota: "BOG", bog: "BOG",
  mexico: "MEX", mex: "MEX",
  orlando: "ORL", mco: "MCO",
  "san francisco": "SFO", sfo: "SFO",
  "los angeles": "LAX", lax: "LAX",
  chicago: "ORD", ord: "ORD",
  denver: "DEN", den: "DEN",
  seattle: "SEA", sea: "SEA",
  boston: "BOS", bos: "BOS",
  atlanta: "ATL", atl: "ATL",
  "new orleans": "MSY", msy: "MSY",
  austin: "AUS", aus: "AUS",
  medellin: "MDE", mde: "MDE",
  cartagena: "CTG", ctg: "CTG",
  cali: "CLO", clo: "CLO",
  lima: "LIM", lim: "LIM",
  santiago: "SCL", scl: "SCL",
  "buenos aires": "EZE", eze: "EZE",
}

function extractRoute(text: string): { route: string; origin?: string; destination?: string } {
  const explicit = text.match(/\b([A-Z]{3})\s*[→\-]\s*([A-Z]{3})\b/i)
  if (explicit) {
    const o = explicit[1].toUpperCase()
    const d = explicit[2].toUpperCase()
    return { route: `${o} → ${d}`, origin: o, destination: d }
  }
  const dest = text.match(
    /(?:ir a|volar a|viajar a|going to|flight to|to)\s+([a-záéíóúñ\s]+?)(?:\s+el|\s+on|\s+the|\s+from|\s*,|\.|\s*$)/i
  )
  if (dest) {
    const city = dest[1].trim().toLowerCase()
    const code = AIRPORT_CODES[city]
    if (code) return { route: `? → ${code}`, destination: code }
  }
  const words = text.toLowerCase()
  for (const [city, code] of Object.entries(AIRPORT_CODES)) {
    if (words.includes(city)) return { route: `? → ${code}`, destination: code }
  }
  return { route: "? → ?" }
}

function extractDates(text: string): string | undefined {
  const months: Record<string, string> = {
    enero: "Jan", january: "Jan", jan: "Jan",
    febrero: "Feb", february: "Feb", feb: "Feb",
    marzo: "Mar", march: "Mar", mar: "Mar",
    abril: "Apr", april: "Apr", apr: "Apr",
    mayo: "May", may: "May",
    junio: "Jun", june: "Jun", jun: "Jun",
    julio: "Jul", july: "Jul", jul: "Jul",
    agosto: "Aug", august: "Aug", aug: "Aug",
    septiembre: "Sep", september: "Sep", sep: "Sep",
    octubre: "Oct", october: "Oct", oct: "Oct",
    noviembre: "Nov", november: "Nov", nov: "Nov",
    diciembre: "Dec", december: "Dec", dec: "Dec",
  }
  const monthNames = Object.keys(months).join("|")
  const match = text.match(
    new RegExp(`(\\d{1,2})\\s+(?:de\\s+)?(${monthNames})(?:\\s+(?:al?|to|-|–)\\s+(\\d{1,2}))?`, "i")
  )
  if (match) {
    const start = match[1]
    const month = months[match[2].toLowerCase()] ?? match[2]
    return match[3] ? `${month} ${start}–${match[3]}` : `${month} ${start}`
  }
  return undefined
}

function isTravelRequest(text: string): boolean {
  const keywords = [
    "vuelo", "volar", "viajar", "viaje", "ir a", "vamos a",
    "necesito ir", "necesito viajar", "flight", "fly", "travel", "trip",
    "quiero ir", "quiero viajar", "reservar", "book",
  ]
  const lower = text.toLowerCase()
  return keywords.some((k) => lower.includes(k))
}

function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map((n) => n[0]?.toUpperCase() ?? "").join("")
}

// ─── Background: search Duffel + update trip ──────────────────────────────────

async function searchAndUpdateTrip(
  trip: StoredTrip,
  origin: string | undefined,
  destination: string | undefined,
  slackChannelId: string,
  slackTs: string
): Promise<void> {
  if (!origin || !destination || origin === "?" || destination === "?") return

  const departureDate = parseTripDateToISO(trip.dates)
  if (!departureDate) return

  try {
    const offers = await searchFlights({
      origin,
      destination,
      departureDate,
      passengers: trip.travelers.length,
    })

    if (offers.length === 0) {
      await postSlackReply(
        slackChannelId, slackTs,
        `⚠️ No flights found for *${origin} → ${destination}* on *${departureDate}*. Try a different date or route.`
      )
      return
    }

    const options = offersToTripOptions(offers)
    await updateTrip(trip.id, { status: "awaiting", options })

    // Format top 3 options for Slack reply
    const topThree = offers.slice(0, 3)
    const lines = topThree.map(
      (o, i) =>
        `${i === 0 ? "✈️ *Best price*" : `${i + 1}.`} *${o.airline} ${o.flightNumber}* — $${Math.round(o.price)} · ${o.stops === 0 ? "Nonstop" : `${o.stops} stop`}`
    )

    await postSlackReply(
      slackChannelId,
      slackTs,
      `Found *${offers.length} options* for *${origin} → ${destination}*:\n\n${lines.join("\n")}\n\n👉 Review and approve in the Eba dashboard.`
    )
  } catch (err) {
    console.error("[searchAndUpdateTrip] Duffel error:", err)
    await postSlackReply(
      slackChannelId, slackTs,
      `⚠️ Had trouble searching flights right now. I'll retry shortly.`
    )
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.text()
  const timestamp = request.headers.get("x-slack-request-timestamp") ?? ""
  const signature = request.headers.get("x-slack-signature") ?? ""

  if (!verifySlackSignature(body, timestamp, signature)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const payload = JSON.parse(body)

  // URL verification challenge
  if (payload.type === "url_verification") {
    return NextResponse.json({ challenge: payload.challenge })
  }

  if (payload.type !== "event_callback") {
    return NextResponse.json({ ok: true })
  }

  const event = payload.event
  if (event?.type !== "message" || event?.subtype || event?.bot_id) {
    return NextResponse.json({ ok: true })
  }

  const text: string = event.text ?? ""
  if (!isTravelRequest(text)) {
    return NextResponse.json({ ok: true })
  }

  // Fetch user + channel in parallel
  const [user, channelName] = await Promise.all([
    getSlackUser(event.user),
    getChannelName(event.channel),
  ])

  const { route, origin, destination } = extractRoute(text)
  const dates = extractDates(text)

  const trip: StoredTrip = {
    id: `${event.ts}-${event.user}`,
    slackMessageTs: event.ts,
    slackChannelId: event.channel,
    slackUserId: event.user,
    slackUserName: user.name,
    quote: text,
    channel: channelName,
    status: "searching",
    route,
    dates,
    travelers: [{ initials: getInitials(user.name), name: user.name }],
    createdAt: Math.floor(parseFloat(event.ts) * 1000),
  }

  await addTrip(trip)

  // Immediate Slack reply — responds within Slack's 3-second window
  await postSlackReply(
    event.channel,
    event.ts,
    `✈️ Got it! Searching the best options for *${route}*${dates ? ` on *${dates}*` : ""}…`
  )

  // Search Duffel AFTER the response is sent (non-blocking)
  after(() =>
    searchAndUpdateTrip(trip, origin, destination, event.channel, event.ts)
  )

  return NextResponse.json({ ok: true })
}
