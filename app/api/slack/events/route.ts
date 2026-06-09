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

// ─── Look up a traveler in Supabase then employees.ts ─────────────────────────

async function resolvePassenger(name: string, slackUserId?: string) {
  // 1. Supabase travelers table (real passport data, trials included)
  const traveler = await findTravelerByName(name)
  if (traveler) {
    return {
      firstName: traveler.first_name ?? name.split(" ")[0],
      lastName: traveler.last_name ?? name.split(" ").slice(-1)[0],
      email: traveler.email ?? "",
      dateOfBirth: traveler.date_of_birth ?? "1990-01-01",
      gender: ("m" as "m" | "f"),
      passportNumber: traveler.passport_number,
      passportExpiry: traveler.expiry_date,
      nationality: traveler.nationality,
    }
  }

  // 2. Hardcoded employees list (has DOB, no passport)
  const employee =
    findEmployee(name) ?? (slackUserId ? findEmployee(slackUserId) : undefined)
  if (employee) {
    return {
      ...employeeToPassenger(employee),
      passportNumber: undefined as string | undefined,
      passportExpiry: undefined as string | undefined,
      nationality: employee.country,
    }
  }

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

// ─── Handle approval → search Duffel (if needed) → book ──────────────────────

async function handleApproval(channelId: string, threadTs: string, approverName: string) {
  const trip = await getTripByMessageTs(threadTs)
  if (!trip || trip.status !== "awaiting") return

  let offerId = trip.options?.[0]?.id

  // No stored offer (screenshot trip) — search Duffel now for real current price
  if (!offerId) {
    const parts = (trip.route ?? "").split("→").map((s) => s.trim())
    const origin = parts[0] || "BOG"
    const destination = parts[1]
    const departureDate = trip.dates

    if (!destination || !departureDate) {
      await postSlackReply(channelId, threadTs,
        "⚠️ No pude determinar la ruta completa. ¿Me confirmas origen, destino y fecha?"
      )
      return
    }

    await postSlackReply(channelId, threadTs,
      `✅ Aprobado por *${approverName}*. Consultando precio actual para *${origin} → ${destination}*...`
    )

    try {
      const offers = await searchFlights({
        origin,
        destination,
        departureDate,
        passengers: 1,
        cabinClass: "economy",
      })

      if (offers.length === 0) {
        await postSlackReply(channelId, threadTs,
          `⚠️ No encontré vuelos disponibles para *${origin} → ${destination}* el *${departureDate}*. La ruta puede no estar disponible en este momento.`
        )
        return
      }

      const best = offers[0]
      offerId = best.id
      await updateTrip(trip.id, { options: offersToTripOptions(offers) })

      await postSlackReply(channelId, threadTs,
        `💰 Precio actual: *${best.airline} ${best.flightNumber}* — *$${Math.round(best.price)} USD* · ${best.stops === 0 ? "Directo" : `${best.stops} escala`} · ${best.duration}\n\nBookeando...`
      )
    } catch (err: any) {
      await postSlackReply(channelId, threadTs, `⚠️ Error consultando vuelos: ${err.message}`)
      return
    }
  }

  // Resolve full passenger data from DB
  const travelerName = trip.travelers?.[0]?.name ?? trip.slackUserName
  const passenger = await resolvePassenger(travelerName, trip.slackUserId)

  if (!passenger) {
    await postSlackReply(channelId, threadTs,
      `⚠️ No encontré los datos de *${travelerName}* en la base de datos. ¿Me confirmas su email o pasaporte?`
    )
    return
  }

  try {
    const { orderId, bookingRef } = await bookFlight(offerId!, [passenger])

    await updateTrip(trip.id, { status: "booked", bookedInfo: bookingRef })
    await createBooking({
      trip_id: trip.id,
      offer_id: offerId!,
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
      `✅ *¡Vuelo confirmado!*\n\n🎫 *Referencia:* \`${bookingRef}\`\n✈️ *Ruta:* ${trip.route ?? ""}\n👤 *Pasajero:* ${passenger.firstName} ${passenger.lastName}\n${passenger.passportNumber ? `📋 *Pasaporte:* ${passenger.passportNumber}\n` : ""}\n_Eba hará el check-in automáticamente 24 horas antes del vuelo._`
    )
  } catch (err: any) {
    console.error("[handleApproval booking]", err)
    await postSlackReply(channelId, threadTs,
      `⚠️ Error al confirmar el booking: ${err.message ?? "intenta de nuevo."}`
    )
  }
}

// ─── Handle credits check ────────────────────────────────────────────────────

async function handleCheckCredits(channelId: string, threadTs: string) {
  const credits = await getActiveCredits()
  if (credits.length === 0) {
    await postSlackReply(channelId, threadTs, "💳 No hay créditos de viaje disponibles actualmente.")
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

      // ── Approval → search Duffel (if needed) → book ─────────────────────────
      if (intent.action === "approve" && isThreadReply) {
        await handleApproval(channelId, threadTs, userName)
        return
      }

      // ── Credits check ────────────────────────────────────────────────────────
      if (intent.action === "check_credits") {
        await handleCheckCredits(channelId, threadTs)
        return
      }

      // ── Cancellation ─────────────────────────────────────────────────────────
      if (intent.action === "cancel_booking") {
        await postSlackReply(channelId, threadTs, intent.message)
        return
      }

      // ── Not travel → ignore in channels, answer in DMs ──────────────────────
      if (intent.action === "not_travel" && !isDM) return

      // ── Search: screenshot with no traveler → just ask "¿Para quién?" ────────
      if (intent.action === "search" && imageFile && !intent.flightParams?.travelerName) {
        // Claude extracted flight details but doesn't know who it's for.
        // Post Eba's message (which asks "¿Para quién es este vuelo?") and wait.
        await postSlackReply(channelId, threadTs, intent.message)
        return
      }

      // ── Search: we have flight + traveler name → look up DB, confirm, tag Felipe
      if (intent.action === "search" && intent.flightParams?.destination && intent.flightParams?.travelerName) {
        const fp = intent.flightParams
        const travelerName = fp.travelerName!
        const passenger = await resolvePassenger(travelerName, userId)

        const departureDate = fp.departureDate ?? parseTripDateToISO(undefined) ?? ""

        const trip: StoredTrip = {
          id: `${messageTs}-${userId}`,
          slackMessageTs: messageTs,
          slackChannelId: channelId,
          slackUserId: userId,
          slackUserName: userName,
          quote: text || (imageFile ? "[flight screenshot]" : ""),
          channel: channelName,
          status: "awaiting",
          route: `${fp.origin ?? "?"} → ${fp.destination}`,
          dates: departureDate,
          travelers: [{ initials: getInitials(travelerName), name: travelerName }],
          createdAt: Math.floor(parseFloat(messageTs) * 1000),
        }

        await addTrip(trip)

        if (!passenger) {
          // Traveler not in DB — inform and ask for their passport
          await postSlackReply(channelId, threadTs,
            `⚠️ No encontré a *${travelerName}* en la base de datos.\n\n¿Puedes enviarme una foto de su pasaporte para crear su perfil?`
          )
          return
        }

        // Confirm traveler data + tag Felipe for approval
        const passportLine = passenger.passportNumber
          ? `📋 Pasaporte: \`${passenger.passportNumber}\` · Vence: ${passenger.passportExpiry ?? "n/a"}\n`
          : ""
        const dobLine = `🎂 DOB: ${passenger.dateOfBirth}\n`

        await postSlackReply(channelId, threadTs,
          `✅ *${passenger.firstName} ${passenger.lastName}* encontrado/a en la base de datos.\n${dobLine}${passportLine}\n` +
          `✈️ *${fp.origin ?? "?"} → ${fp.destination}* · ${departureDate}\n\n` +
          `¿Aprobamos este vuelo? — *Felipe C.*`
        )
        return
      }

      // ── Search: text request (no image, no traveler name = booking for sender) ─
      if (intent.action === "search" && intent.flightParams?.destination) {
        const fp = intent.flightParams
        const departureDate = fp.departureDate ?? parseTripDateToISO(undefined) ?? ""
        const travelerDisplay = fp.travelerName ?? userName

        const trip: StoredTrip = {
          id: `${messageTs}-${userId}`,
          slackMessageTs: messageTs,
          slackChannelId: channelId,
          slackUserId: userId,
          slackUserName: userName,
          quote: text,
          channel: channelName,
          status: "searching",
          route: `${fp.origin ?? "?"} → ${fp.destination}`,
          dates: departureDate,
          travelers: [{ initials: getInitials(travelerDisplay), name: travelerDisplay }],
          createdAt: Math.floor(parseFloat(messageTs) * 1000),
        }

        await addTrip(trip)
        await postSlackReply(channelId, threadTs, intent.message)
        await searchAndUpdateTrip(
          trip, fp.origin, fp.destination!, departureDate,
          fp.passengers ?? 1, fp.cabinClass ?? "economy", channelId, threadTs
        )
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
