import type { TripOption } from "@/lib/trips-store"

const DUFFEL_BASE = "https://api.duffel.com"
const DUFFEL_VERSION = "v2"

function headers() {
  return {
    Authorization: `Bearer ${process.env.DUFFEL_API_KEY}`,
    "Content-Type": "application/json",
    "Duffel-Version": DUFFEL_VERSION,
    Accept: "application/json",
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FlightSearchParams {
  origin: string
  destination: string
  departureDate: string  // "YYYY-MM-DD"
  returnDate?: string    // "YYYY-MM-DD"
  passengers: number
  cabinClass?: "economy" | "premium_economy" | "business" | "first"
}

export interface FlightOffer {
  id: string
  airline: string
  flightNumber: string
  origin: string
  destination: string
  departureTime: string
  arrivalTime: string
  duration: string       // ISO 8601 e.g. "PT4H20M"
  stops: number
  price: number
  currency: string
  cabinClass: string
  expiresAt: string
}

export interface PassengerInfo {
  firstName: string
  lastName: string
  email: string
  dateOfBirth: string      // "YYYY-MM-DD"
  gender: "m" | "f"
  passportNumber?: string
  passportExpiry?: string  // "YYYY-MM-DD"
  nationality?: string     // ISO 3166-1 alpha-2, e.g. "CO", "BO", "US"
}

// ─── Duration helpers ─────────────────────────────────────────────────────────

export function parseDurationMinutes(duration: string): number {
  const hours = duration.match(/(\d+)H/)
  const mins = duration.match(/(\d+)M/)
  return (hours ? parseInt(hours[1]) * 60 : 0) + (mins ? parseInt(mins[1]) : 0)
}

function formatDuration(duration: string): string {
  const h = duration.match(/(\d+)H/)
  const m = duration.match(/(\d+)M/)
  const hours = h ? parseInt(h[1]) : 0
  const mins = m ? parseInt(m[1]) : 0
  return `${hours > 0 ? `${hours}h ` : ""}${mins > 0 ? `${mins}m` : ""}`.trim()
}

function formatTime(isoDatetime: string): string {
  const date = new Date(isoDatetime)
  return date
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    .toLowerCase()
}

// ─── Convert Duffel offers → TripOption[] (dashboard format) ─────────────────

export function offersToTripOptions(offers: FlightOffer[]): TripOption[] {
  if (offers.length === 0) return []

  const prices = offers.map((o) => o.price)
  const durations = offers.map((o) => parseDurationMinutes(o.duration))
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const minDur = Math.min(...durations)
  const maxDur = Math.max(...durations)
  const priceRange = maxPrice - minPrice || 1
  const durRange = maxDur - minDur || 1

  return offers.map((offer): TripOption => {
    const durationMins = parseDurationMinutes(offer.duration)
    const isCheapest = offer.price === minPrice
    const stopText = offer.stops === 0 ? "Nonstop" : `${offer.stops} stop${offer.stops > 1 ? "s" : ""}`

    // Normalize bars to 15–90 range so nothing looks 0% or 100%
    const priceBar = Math.round(((offer.price - minPrice) / priceRange) * 75 + 15)
    const timeBar = Math.round(((durationMins - minDur) / durRange) * 75 + 15)
    const co2Bar = Math.round(((durationMins - minDur) / durRange) * 75 + 15)
    const co2 = Math.round(160 + durationMins * 0.3)

    return {
      id: offer.id,
      type: "Flight",
      iconType: "plane",
      provider: `${offer.airline} ${offer.flightNumber}`,
      details: `${formatTime(offer.departureTime)} ${stopText} ${formatDuration(offer.duration)}`,
      price: Math.round(offer.price),
      time: formatDuration(offer.duration),
      co2,
      badge: isCheapest ? { text: "BEST PRICE", color: "blue" } : undefined,
      savings: isCheapest
        ? maxPrice > minPrice
          ? `-$${Math.round(maxPrice - minPrice)} vs most expensive`
          : undefined
        : `-$${Math.round(offer.price - minPrice)} above cheapest`,
      isMuted: false,
      priceBar,
      timeBar,
      co2Bar,
    }
  })
}

// ─── Date helper ──────────────────────────────────────────────────────────────

// Converts "Mar 24" or "Mar 24–27" → "2026-03-24"
export function parseTripDateToISO(datesStr: string | undefined): string | undefined {
  if (!datesStr) return undefined
  const MONTHS: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  }
  const match = datesStr.match(/^([A-Za-z]{3})\s+(\d{1,2})/)
  if (!match) return undefined
  const monthNum = MONTHS[match[1]]
  if (monthNum === undefined) return undefined
  const day = parseInt(match[2])
  const now = new Date()
  let year = now.getFullYear()
  const candidate = new Date(year, monthNum, day)
  if (candidate < now) year++
  return `${year}-${String(monthNum + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

// ─── Search flights ───────────────────────────────────────────────────────────

export async function searchFlights(params: FlightSearchParams): Promise<FlightOffer[]> {
  const slices: object[] = [
    { origin: params.origin, destination: params.destination, departure_date: params.departureDate },
  ]
  if (params.returnDate) {
    slices.push({
      origin: params.destination,
      destination: params.origin,
      departure_date: params.returnDate,
    })
  }

  const res = await fetch(`${DUFFEL_BASE}/air/offer_requests`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      data: {
        slices,
        passengers: Array.from({ length: params.passengers }, () => ({ type: "adult" })),
        cabin_class: params.cabinClass ?? "economy",
      },
    }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(`Duffel search error: ${JSON.stringify(err)}`)
  }

  const data = await res.json()
  const offers: any[] = data.data?.offers ?? []

  return offers.slice(0, 5).map((offer): FlightOffer => {
    const slice = offer.slices[0]
    const segment = slice.segments[0]
    return {
      id: offer.id,
      airline: segment.marketing_carrier.name,
      flightNumber: `${segment.marketing_carrier.iata_code}${segment.marketing_carrier_flight_number}`,
      origin: slice.origin.iata_code,
      destination: slice.destination.iata_code,
      departureTime: segment.departing_at,
      arrivalTime: segment.arriving_at,
      duration: slice.duration,
      stops: slice.segments.length - 1,
      price: parseFloat(offer.total_amount),
      currency: offer.total_currency,
      cabinClass:
        offer.slices[0].segments[0].passengers[0]?.cabin_class_marketing_name ?? "Economy",
      expiresAt: offer.expires_at,
    }
  })
}

// ─── Book a flight ────────────────────────────────────────────────────────────

export async function bookFlight(
  offerId: string,
  passengers: PassengerInfo[]
): Promise<{ orderId: string; bookingRef: string }> {
  const res = await fetch(`${DUFFEL_BASE}/air/orders`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      data: {
        selected_offers: [offerId],
        passengers: passengers.map((p) => ({
          given_name: p.firstName,
          family_name: p.lastName,
          email: p.email,
          born_on: p.dateOfBirth,
          gender: p.gender,
          type: "adult",
          ...(p.passportNumber && {
            identity_documents: [{
              type: "passport",
              number: p.passportNumber,
              ...(p.passportExpiry && { expires_on: p.passportExpiry }),
              ...(p.nationality && { issuing_country_code: p.nationality }),
            }],
          }),
        })),
        payments: [{ type: "balance", currency: "USD", amount: "0" }],
      },
    }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(`Duffel booking error: ${JSON.stringify(err)}`)
  }

  const data = await res.json()
  return {
    orderId: data.data.id,
    bookingRef: data.data.booking_reference,
  }
}
