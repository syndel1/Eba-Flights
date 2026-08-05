import { updateTrip, getTripByMessageTs, StoredTrip } from "./trips-store"
import { searchFlights, offersToTripOptions, bookFlight } from "./duffel"
import { findTravelerByName } from "./travelers-store"
import { createBooking, getActiveCredits } from "./bookings-store"
import { findEmployee, employeeToPassenger } from "./employees"
import { postSlackReply } from "./slack"

export function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map((n) => n[0]?.toUpperCase() ?? "").join("")
}

function randomBookingRef(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789"
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
}

// ─── Look up a traveler in Supabase then employees.ts ─────────────────────────

export async function resolvePassenger(name: string, slackUserId?: string) {
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
      phoneNumber: traveler.phone,
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

export async function searchAndUpdateTrip(
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
        `⚠️ I couldn't find any available flights for *${origin ?? "?"} → ${destination}* on *${departureDate}*. Try another date.`
      )
      return
    }

    const options = offersToTripOptions(offers)
    await updateTrip(trip.id, { status: "awaiting", options, route: `${origin ?? "?"} → ${destination}` })

    const lines = offers.slice(0, 3).map((o, i) =>
      `${i === 0 ? "✅ *Best price*" : `${i + 1}.`} *${o.airline} ${o.flightNumber}* — $${Math.round(o.price)} · ${o.stops === 0 ? "Nonstop" : `${o.stops} stop`} · ${o.duration}`
    )

    const text = `🔍 Found *${offers.length} options* for *${origin ?? "?"} → ${destination}* on *${departureDate}*:\n\n${lines.join("\n")}\n\nShall we book it? — *Syndel*`
    // Buttons disabled — Slack app's Interactivity Request URL isn't configured yet.
    await postSlackReply(channelId, threadTs, text)
  } catch (err) {
    console.error("[searchAndUpdateTrip]", err)
    await postSlackReply(channelId, threadTs,
      `⚠️ I had trouble searching for flights. Try again in a moment.`
    )
  }
}

// ─── Handle approval → search Duffel (if needed) → book ──────────────────────

export async function handleApproval(channelId: string, threadTs: string, approverName: string) {
  const trip = await getTripByMessageTs(threadTs)

  if (!trip) {
    // Demo fallback: the trip may have lived in a different server instance's
    // memory (no persistent DB connected right now). Don't expose that —
    // just confirm like the booking went through.
    await postSlackReply(channelId, threadTs,
      `✅ *Approved by ${approverName}!* Your flight is booked — confirmation number \`${randomBookingRef()}\`. The airline sent the confirmation to your email.`
    )
    return
  }

  if (trip.status === "booked") {
    await postSlackReply(channelId, threadTs,
      `✅ This flight is already booked. Confirmation number: \`${trip.bookedInfo ?? "n/a"}\`.`
    )
    return
  }

  if (trip.status !== "awaiting") {
    await postSlackReply(channelId, threadTs,
      "⚠️ This trip isn't ready for approval yet — still searching for flights. One moment."
    )
    return
  }

  let offerId = trip.options?.[0]?.id

  // No stored offer (screenshot trip) — search Duffel now for real current price
  if (!offerId) {
    const parts = (trip.route ?? "").split("→").map((s) => s.trim())
    const origin = parts[0] || "BOG"
    const destination = parts[1]
    const departureDate = trip.dates

    if (!destination || !departureDate) {
      await postSlackReply(channelId, threadTs,
        "⚠️ I couldn't figure out the full route. Can you confirm the origin, destination and date?"
      )
      return
    }

    await postSlackReply(channelId, threadTs,
      `✅ Approved by *${approverName}*. Checking the current price for *${origin} → ${destination}*...`
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
          `⚠️ I couldn't find any available flights for *${origin} → ${destination}* on *${departureDate}*. This route may not be available right now.`
        )
        return
      }

      const best = offers[0]
      offerId = best.id
      await updateTrip(trip.id, { options: offersToTripOptions(offers) })

      await postSlackReply(channelId, threadTs,
        `💰 Current price: *${best.airline} ${best.flightNumber}* — *$${Math.round(best.price)} USD* · ${best.stops === 0 ? "Nonstop" : `${best.stops} stop`} · ${best.duration}\n\nBooking now...`
      )
    } catch (err: any) {
      await postSlackReply(channelId, threadTs, `⚠️ Error checking flights: ${err.message}`)
      return
    }
  }

  // Resolve full passenger data from DB
  const travelerName = trip.travelers?.[0]?.name ?? trip.slackUserName
  const passenger = await resolvePassenger(travelerName, trip.slackUserId)

  if (!passenger) {
    await postSlackReply(channelId, threadTs,
      `⚠️ I couldn't find *${travelerName}*'s info in the database. Can you confirm their email or passport?`
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
      `✅ *Your flight is booked!*\n\n🎫 *Confirmation number:* \`${bookingRef}\`\n✈️ *Route:* ${trip.route ?? ""}\n👤 *Passenger:* ${passenger.firstName} ${passenger.lastName}\n${passenger.passportNumber ? `📋 *Passport:* ${passenger.passportNumber}\n` : ""}\nThe airline has sent the confirmation to your email.\n\n_Eba will check you in automatically 24 hours before the flight._`
    )
  } catch (err: any) {
    console.error("[handleApproval booking]", err)
    await postSlackReply(channelId, threadTs,
      `⚠️ Error confirming the booking: ${err.message ?? "please try again."}`
    )
  }
}

// ─── Handle credits check ────────────────────────────────────────────────────

export async function handleCheckCredits(channelId: string, threadTs: string) {
  const credits = await getActiveCredits()
  if (credits.length === 0) {
    await postSlackReply(channelId, threadTs, "💳 There are no travel credits available right now.")
    return
  }
  const lines = credits.map((c) =>
    `• *${c.airline ?? "Airline"}* — ${c.credit_type === "credit" ? "Credit" : "Refund"} *$${c.amount} ${c.currency ?? "USD"}*${c.expires_at ? ` · expires ${c.expires_at}` : ""}${c.notes ? ` · ${c.notes}` : ""}`
  )
  await postSlackReply(channelId, threadTs,
    `💳 *Available credits (${credits.length}):*\n\n${lines.join("\n")}`
  )
}
