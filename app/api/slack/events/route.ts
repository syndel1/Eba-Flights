import { NextRequest, NextResponse, after } from "next/server"
import crypto from "crypto"
import { addTrip, updateTrip, getTripByMessageTs, StoredTrip } from "@/lib/trips-store"
import { searchFlights, offersToTripOptions, parseTripDateToISO, bookFlight } from "@/lib/duffel"
import { analyzeMessage } from "@/lib/eba-ai"
import { saveTraveler, findTravelerByName, updateTravelerById } from "@/lib/travelers-store"
import { createBooking, getActiveCredits } from "@/lib/bookings-store"
import { findEmployee, employeeToPassenger } from "@/lib/employees"

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

// ─── Resolve passenger data (employees list + travelers DB) ──────────────────

async function resolvePassenger(
  slackUserName: string,
  slackUserId: string,
  travelerName?: string
) {
  // If booking for a named third party, search travelers DB first
  if (travelerName) {
    const traveler = await findTravelerByName(travelerName)
    if (traveler) {
      return {
        firstName: traveler.first_name ?? travelerName.split(" ")[0],
        lastName: traveler.last_name ?? travelerName.split(" ").slice(-1)[0],
        email: traveler.email ?? "",
        dateOfBirth: traveler.date_of_birth ?? "1990-01-01",
        gender: ("m" as "m" | "f"),
      }
    }
  }

  // Try employees list by Slack real name or user ID
  const employee = findEmployee(slackUserName) ?? findEmployee(slackUserId)
  if (employee) return employeeToPassenger(employee)

  return null
}

// ─── Search Duffel + update trip ─────────────────────────────────────────────

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
        `⚠️ No encontré vuelos disponibles para *${origin ?? "?"} → ${destination}* el *${departureDate}*. Prueba otra fecha.`
      )
      return
    }

    const options = offersToTripOptions(offers)
    await updateTrip(trip.id, { status: "awaiting", options, route: `${origin ?? "?"} → ${destination}` })

    const lines = offers.slice(0, 3).map((o, i) =>
      `${i === 0 ? "✅ *Mejor precio*" : `${i + 1}.`} *${o.airline} ${o.flightNumber}* — $${Math.round(o.price)} · ${o.stops === 0 ? "Directo" : `${o.stops} escala`} · ${o.duration}`
    )

    await postSlackReply(channelId, threadTs,
      `🔍 Encontré *${offers.length} opciones* para *${origin ?? "?"} → ${destination}* el *${departureDate}*:\n\n${lines.join("\n")}\n\n¿Aprobamos? — *Felipe C.*`
    )
  } catch (err) {
    console.error("[searchAndUpdateTrip]", err)
    await postSlackReply(channelId, threadTs,
      `⚠️ Tuve un problema buscando vuelos. Intenta de nuevo en un momento.`
    )
  }
}

// ─── Handle approval → book ───────────────────────────────────────────────────

async function handleApproval(
  channelId: string,
  threadTs: string,
  approverName: string
) {
  const trip = await getTripByMessageTs(threadTs)
  if (!trip || trip.status !== "awaiting") return

  const offerId = trip.options?.[0]?.id
  if (!offerId) {
    await postSlackReply(channelId, threadTs,
      "⚠️ La oferta expiró. Busca el vuelo de nuevo para obtener precios actualizados."
    )
    return
  }

  const travelerName = trip.travelers?.[0]?.name
  const passenger = await resolvePassenger(trip.slackUserName, trip.slackUserId, travelerName)

  if (!passenger || !passenger.dateOfBirth) {
    await postSlackReply(channelId, threadTs,
      "⚠️ No encontré los datos completos del pasajero. ¿Me confirmas su email en Domu?"
    )
    return
  }

  await postSlackReply(channelId, threadTs,
    `✈️ Aprobado por *${approverName}*. Bookeando vuelo para *${passenger.firstName} ${passenger.lastName}*...`
  )

  try {
    const { orderId, bookingRef } = await bookFlight(offerId, [passenger])

    await updateTrip(trip.id, { status: "booked", bookedInfo: bookingRef })
    await createBooking({
      trip_id: trip.id,
      offer_id: offerId,
      pnr: bookingRef,
      duffel_order_id: orderId,
      traveler_name: `${passenger.firstName} ${passenger.lastName}`,
      traveler_email: passenger.email,
      slack_channel_id: channelId,
      slack_thread_ts: threadTs,
      route: trip.route,
      status: "booked",
    })

    await postSlackReply(channelId, threadTs,
      `✅ *¡Vuelo confirmado!*\n\n🎫 *Referencia:* \`${bookingRef}\`\n✈️ *Ruta:* ${trip.route ?? ""}\n👤 *Pasajero:* ${passenger.firstName} ${passenger.lastName}\n\n_Eba hará el check-in automáticamente 24 horas antes del vuelo._`
    )
  } catch (err: any) {
    console.error("[handleApproval]", err)
    await postSlackReply(channelId, threadTs,
      `⚠️ Error al confirmar el booking: ${err.message ?? "intenta de nuevo."}`
    )
  }
}

// ─── Handle credits check ────────────────────────────────────────────────────

async function handleCheckCredits(channelId: string, threadTs: string) {
  const credits = await getActiveCredits()
  if (credits.length === 0) {
    await postSlackReply(channelId, threadTs,
      "💳 No hay créditos de viaje disponibles actualmente."
    )
    return
  }
  const lines = credits.map((c) =>
    `• *${c.airline ?? "Aerolínea"}* — ${c.credit_type === "credit" ? "Crédito" : "Reembolso"} *$${c.amount} ${c.currency ?? "USD"}*${c.expires_at ? ` · vence ${c.expires_at}` : ""}${c.notes ? ` · ${c.notes}` : ""}`
  )
  await postSlackReply(channelId, threadTs,
    `💳 *Créditos disponibles (${credits.length}):*\n\n${lines.join("\n")}`
  )
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
  const isFileShare = event?.subtype === "file_share"
  if (!event || (event.subtype && !isFileShare) || event.bot_id || event.hidden) {
    return NextResponse.json({ ok: true })
  }

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
  const imageFile = event.files?.find((f: any) => f.mimetype?.startsWith("image/"))

  const shouldProcess = isDM || isMentioned || !event.thread_ts || isThreadReply
  if (!shouldProcess && !imageFile) return NextResponse.json({ ok: true })

  // Return 200 immediately — all processing in after() to prevent Slack retries
  after(async () => {
    try {
      const [userName, channelName, threadHistory] = await Promise.all([
        getSlackUserName(userId),
        isDM ? Promise.resolve("DM") : getChannelName(channelId),
        event.thread_ts ? getThreadHistory(channelId, threadTs) : Promise.resolve([]),
      ])

      let imageData: { data: string; mimeType: string } | undefined
      if (imageFile?.url_private) {
        imageData = (await downloadSlackFile(imageFile.url_private)) ?? undefined
      }

      const intent = await analyzeMessage(text, threadHistory, imageData?.data, imageData?.mimeType)

      // ── Passport reading → save traveler ────────────────────────────────────
      if (intent.action === "passport_read") {
        const pd = intent.passportData
        if (pd?.legal_name) {
          await saveTraveler({
            legal_name: pd.legal_name,
            first_name: pd.first_name ?? pd.legal_name.split(" ")[0],
            last_name: pd.last_name ?? pd.legal_name.split(" ").slice(-1)[0],
            date_of_birth: pd.date_of_birth,
            passport_number: pd.passport_number,
            nationality: pd.nationality,
            expiry_date: pd.expiry_date,
            type: "trial",
          })
        }
        await postSlackReply(channelId, threadTs, intent.message)
        return
      }

      // ── Traveler update (phone/email after passport) ─────────────────────────
      if (intent.action === "traveler_update" && intent.travelerUpdate?.identifier) {
        const tu = intent.travelerUpdate
        const traveler = await findTravelerByName(tu.identifier!)
        if (traveler?.id) {
          await updateTravelerById(traveler.id, {
            ...(tu.phone && { phone: tu.phone }),
            ...(tu.email && { email: tu.email }),
          })
        }
        await postSlackReply(channelId, threadTs, intent.message)
        return
      }

      // ── Approval → book flight ───────────────────────────────────────────────
      if (intent.action === "approve" && isThreadReply) {
        await handleApproval(channelId, threadTs, userName)
        return
      }

      // ── Credits check ────────────────────────────────────────────────────────
      if (intent.action === "check_credits") {
        await handleCheckCredits(channelId, threadTs)
        return
      }

      // ── Cancellation (V2) ────────────────────────────────────────────────────
      if (intent.action === "cancel_booking") {
        await postSlackReply(channelId, threadTs, intent.message)
        return
      }

      // ── Not travel → ignore in channels, answer in DMs ──────────────────────
      if (intent.action === "not_travel" && !isDM) return

      // ── Search flights ───────────────────────────────────────────────────────
      if (intent.action === "search" && intent.flightParams?.destination) {
        const fp = intent.flightParams
        const departureDate = fp.departureDate ?? parseTripDateToISO(undefined)
        const travelerDisplay = fp.travelerName ?? userName

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
          travelers: [{ initials: getInitials(travelerDisplay), name: travelerDisplay }],
          createdAt: Math.floor(parseFloat(messageTs) * 1000),
        }

        await addTrip(trip)

        if (imageFile) {
          // Screenshot: Claude already extracted the details — skip Duffel search,
          // set trip to awaiting and wait for Felipe's approval before searching.
          await updateTrip(trip.id, { status: "awaiting" })
          await postSlackReply(channelId, threadTs, intent.message)
        } else {
          // Text request: post Claude's reply then search Duffel immediately.
          await postSlackReply(channelId, threadTs, intent.message)
          await searchAndUpdateTrip(
            trip, fp.origin, fp.destination!, departureDate,
            fp.passengers ?? 1, fp.cabinClass ?? "economy", channelId, threadTs
          )
        }
        return
      }

      // ── Conversational reply ─────────────────────────────────────────────────
      await postSlackReply(channelId, threadTs, intent.message)
    } catch (err) {
      console.error("[slack/events after()]", err)
    }
  })

  return NextResponse.json({ ok: true })
}
