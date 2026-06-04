import { NextRequest, NextResponse, after } from "next/server"
import crypto from "crypto"
import { addTrip, updateTrip, StoredTrip } from "@/lib/trips-store"
import { searchFlights, offersToTripOptions, parseTripDateToISO } from "@/lib/duffel"
import { analyzeMessage } from "@/lib/eba-ai"

// ─── Signature verification ───────────────────────────────────────────────────

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

async function slackGet(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`https://slack.com/api/${endpoint}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}` },
  })
  return res.json()
}

async function postSlackReply(channelId: string, threadTs: string, text: string) {
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

async function getSlackUserName(userId: string): Promise<string> {
  try {
    const data = await slackGet("users.info", { user: userId })
    return data.user?.real_name || data.user?.name || userId
  } catch {
    return userId
  }
}

async function getChannelName(channelId: string): Promise<string> {
  try {
    const data = await slackGet("conversations.info", { channel: channelId })
    return `#${data.channel?.name ?? "travel"}`
  } catch {
    return "#travel"
  }
}

async function getThreadHistory(channelId: string, threadTs: string) {
  try {
    const data = await slackGet("conversations.replies", {
      channel: channelId,
      ts: threadTs,
      limit: "10",
    })
    const messages: any[] = data.messages ?? []
    return messages
      .filter((m) => m.ts !== threadTs)
      .slice(-8)
      .map((m) => ({
        role: (m.bot_id ? "assistant" : "user") as "user" | "assistant",
        content: m.text ?? "",
      }))
  } catch {
    return []
  }
}

async function downloadSlackFile(url: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}` },
    })
    const buffer = await res.arrayBuffer()
    const base64 = Buffer.from(buffer).toString("base64")
    const mimeType = res.headers.get("content-type") ?? "image/jpeg"
    return { data: base64, mimeType }
  } catch {
    return null
  }
}

function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map((n) => n[0]?.toUpperCase() ?? "").join("")
}

// ─── Background: search Duffel + update trip ─────────────────────────────────

async function searchAndUpdateTrip(
  trip: StoredTrip,
  origin: string | undefined,
  destination: string | undefined,
  departureDate: string | undefined,
  passengers: number,
  cabinClass: string,
  channelId: string,
  threadTs: string
) {
  if (!destination || !departureDate) return

  try {
    const offers = await searchFlights({
      origin: origin ?? "BOG",
      destination,
      departureDate,
      passengers,
      cabinClass: cabinClass as any,
    })

    if (offers.length === 0) {
      await postSlackReply(channelId, threadTs,
        `⚠️ No encontré vuelos disponibles para *${origin ?? "??"} → ${destination}* el *${departureDate}*. Prueba otra fecha.`
      )
      return
    }

    const options = offersToTripOptions(offers)
    await updateTrip(trip.id, { status: "awaiting", options, route: `${origin ?? "?"} → ${destination}` })

    const lines = offers.slice(0, 3).map((o, i) =>
      `${i === 0 ? "✅ *Mejor precio*" : `${i + 1}.`} *${o.airline} ${o.flightNumber}* — $${Math.round(o.price)} · ${o.stops === 0 ? "Directo" : `${o.stops} escala`} · ${o.duration}`
    )

    await postSlackReply(channelId, threadTs,
      `🔍 Encontré *${offers.length} opciones* para *${origin ?? "?"} → ${destination}*:\n\n${lines.join("\n")}\n\n👉 Revisa y aprueba en el *dashboard de Eba*.`
    )
  } catch (err) {
    console.error("[searchAndUpdateTrip]", err)
    await postSlackReply(channelId, threadTs,
      `⚠️ Tuve un problema buscando vuelos. Intenta de nuevo en un momento.`
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

  if (payload.type === "url_verification") {
    return NextResponse.json({ challenge: payload.challenge })
  }

  if (payload.type !== "event_callback") {
    return NextResponse.json({ ok: true })
  }

  const event = payload.event
  // Ignore bot messages and edited messages — but allow file_share (image uploads)
  const isFileShare = event?.subtype === "file_share"
  if (!event || (event.subtype && !isFileShare) || event.bot_id || event.hidden) {
    return NextResponse.json({ ok: true })
  }

  // Only handle message events
  if (event.type !== "message") {
    return NextResponse.json({ ok: true })
  }

  const text: string = (event.text ?? "").trim()
  const channelId: string = event.channel
  const userId: string = event.user
  const messageTs: string = event.ts
  const threadTs: string = event.thread_ts ?? event.ts
  const isDM: boolean = event.channel_type === "im"
  const isMentioned: boolean = text.includes(`<@${payload.authorizations?.[0]?.user_id}>`)
  const isThreadReply: boolean = !!event.thread_ts && event.ts !== event.thread_ts

  // Get image attachment if any
  const imageFile = event.files?.find((f: any) =>
    f.mimetype?.startsWith("image/")
  )

  // Process: DMs, mentions, new top-level messages, OR replies in threads
  // Thread replies continue the booking conversation naturally
  const shouldProcess = isDM || isMentioned || !event.thread_ts || isThreadReply
  if (!shouldProcess && !imageFile) return NextResponse.json({ ok: true })

  // ── Respond to Slack IMMEDIATELY (before any async work) ──────────────────
  // Slack requires a 200 within 3s or it retries → causing duplicate responses.
  // All processing happens in after() which runs after the response is sent.

  after(async () => {
    try {
      const [userName, channelName, threadHistory] = await Promise.all([
        getSlackUserName(userId),
        isDM ? Promise.resolve("DM") : getChannelName(channelId),
        event.thread_ts ? getThreadHistory(channelId, threadTs) : Promise.resolve([]),
      ])

      // Download image if present
      let imageData: { data: string; mimeType: string } | undefined
      if (imageFile?.url_private) {
        imageData = (await downloadSlackFile(imageFile.url_private)) ?? undefined
      }

      // Analyze with Claude AI
      const intent = await analyzeMessage(
        text,
        threadHistory,
        imageData?.data,
        imageData?.mimeType
      )

      if (intent.action === "not_travel" && !isDM) return

      await postSlackReply(channelId, threadTs, intent.message)

      if (intent.action === "search" && intent.flightParams?.destination) {
        const fp = intent.flightParams
        const departureDate = fp.departureDate ?? parseTripDateToISO(undefined)

        const trip: StoredTrip = {
          id: `${messageTs}-${userId}`,
          slackMessageTs: messageTs,
          slackChannelId: channelId,
          slackUserId: userId,
          slackUserName: userName,
          quote: text || (imageFile ? "[flight screenshot]" : ""),
          channel: channelName,
          status: "searching",
          route: `${fp.origin ?? "?"} → ${fp.destination}`,
          dates: fp.departureDate,
          travelers: [{ initials: getInitials(userName), name: userName }],
          createdAt: Math.floor(parseFloat(messageTs) * 1000),
        }

        await addTrip(trip)
        await searchAndUpdateTrip(
          trip, fp.origin, fp.destination!, departureDate,
          fp.passengers ?? 1, fp.cabinClass ?? "economy", channelId, threadTs
        )
      }
    } catch (err) {
      console.error("[slack/events after()]", err)
    }
  })

  return NextResponse.json({ ok: true })
}
