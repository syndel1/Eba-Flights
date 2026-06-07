const SUPABASE_URL = () => process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY!

function headers(extra: Record<string, string> = {}) {
  return {
    "Content-Type": "application/json",
    apikey: SUPABASE_KEY(),
    Authorization: `Bearer ${SUPABASE_KEY()}`,
    ...extra,
  }
}

export interface Booking {
  id?: string
  trip_id?: string
  offer_id: string
  pnr?: string
  duffel_order_id?: string
  traveler_name?: string
  traveler_email?: string
  slack_channel_id?: string
  slack_thread_ts?: string
  route?: string
  flight_date?: string
  card_type?: "sales" | "engineering"
  status: "booked" | "cancelled" | "checked_in"
  checkin_done?: boolean
  total_amount?: number
  currency?: string
  created_at?: string
}

export interface TravelCredit {
  id?: string
  booking_id?: string
  airline?: string
  credit_type: "refund" | "credit"
  amount: number
  currency?: string
  expires_at?: string
  is_used?: boolean
  notes?: string
  created_at?: string
}

export async function createBooking(booking: Omit<Booking, "id" | "created_at">): Promise<Booking | null> {
  const res = await fetch(`${SUPABASE_URL()}/rest/v1/bookings`, {
    method: "POST",
    headers: headers({ Prefer: "return=representation" }),
    body: JSON.stringify(booking),
  })
  if (!res.ok) {
    console.error("[createBooking]", res.status, await res.text())
    return null
  }
  const data = await res.json()
  return Array.isArray(data) ? data[0] : data
}

export async function getBookingByPNR(pnr: string): Promise<Booking | null> {
  const res = await fetch(
    `${SUPABASE_URL()}/rest/v1/bookings?pnr=eq.${encodeURIComponent(pnr)}&limit=1`,
    { headers: headers() }
  )
  if (!res.ok) return null
  const data = await res.json()
  return data[0] ?? null
}

export async function updateBookingByPNR(pnr: string, updates: Partial<Booking>): Promise<void> {
  await fetch(`${SUPABASE_URL()}/rest/v1/bookings?pnr=eq.${encodeURIComponent(pnr)}`, {
    method: "PATCH",
    headers: headers({ Prefer: "return=minimal" }),
    body: JSON.stringify(updates),
  })
}

export async function getActiveCredits(): Promise<TravelCredit[]> {
  const res = await fetch(
    `${SUPABASE_URL()}/rest/v1/travel_credits?is_used=eq.false&order=created_at.desc`,
    { headers: headers() }
  )
  if (!res.ok) return []
  return res.json()
}

export async function createTravelCredit(credit: Omit<TravelCredit, "id" | "created_at">): Promise<void> {
  await fetch(`${SUPABASE_URL()}/rest/v1/travel_credits`, {
    method: "POST",
    headers: headers({ Prefer: "return=minimal" }),
    body: JSON.stringify(credit),
  })
}
