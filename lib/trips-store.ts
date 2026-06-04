// Uses Supabase REST API directly — no SDK dependency issues with new key format

const BASE = () => process.env.NEXT_PUBLIC_SUPABASE_URL!
const KEY = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function headers(extra: Record<string, string> = {}) {
  return {
    apikey: KEY(),
    Authorization: `Bearer ${KEY()}`,
    "Content-Type": "application/json",
    ...extra,
  }
}

export type TripStatus = "searching" | "awaiting" | "booked" | "smart-tip"

export interface TripOption {
  id: string
  type: string
  iconType: "plane" | "car" | "ride"
  provider: string
  details: string
  price: number
  time: string
  co2: number
  badge?: { text: string; color: "blue" | "green" | "gray" }
  savings?: string
  isMuted?: boolean
  priceBar: number
  timeBar: number
  co2Bar: number
}

export interface StoredTrip {
  id: string
  slackMessageTs: string
  slackChannelId: string
  slackUserId: string
  slackUserName: string
  quote: string
  channel: string
  status: TripStatus
  route?: string
  dates?: string
  travelers: { initials: string; name: string }[]
  options?: TripOption[]
  bookedInfo?: string
  smartTip?: string
  createdAt: number
}

function toRow(trip: StoredTrip) {
  return {
    id: trip.id,
    slack_message_ts: trip.slackMessageTs,
    slack_channel_id: trip.slackChannelId,
    slack_user_id: trip.slackUserId,
    slack_user_name: trip.slackUserName,
    quote: trip.quote,
    channel: trip.channel,
    status: trip.status,
    route: trip.route ?? null,
    dates: trip.dates ?? null,
    travelers: trip.travelers,
    options: trip.options ?? null,
    booked_info: trip.bookedInfo ?? null,
    smart_tip: trip.smartTip ?? null,
    created_at: trip.createdAt,
  }
}

function fromRow(row: any): StoredTrip {
  return {
    id: row.id,
    slackMessageTs: row.slack_message_ts,
    slackChannelId: row.slack_channel_id,
    slackUserId: row.slack_user_id,
    slackUserName: row.slack_user_name,
    quote: row.quote,
    channel: row.channel,
    status: row.status,
    route: row.route ?? undefined,
    dates: row.dates ?? undefined,
    travelers: row.travelers ?? [],
    options: row.options ?? undefined,
    bookedInfo: row.booked_info ?? undefined,
    smartTip: row.smart_tip ?? undefined,
    createdAt: row.created_at,
  }
}

export async function addTrip(trip: StoredTrip): Promise<void> {
  const res = await fetch(`${BASE()}/rest/v1/trips`, {
    method: "POST",
    headers: headers({ Prefer: "resolution=merge-duplicates,return=minimal" }),
    body: JSON.stringify(toRow(trip)),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`addTrip ${res.status}: ${text}`)
  }
}

export async function getTrips(): Promise<StoredTrip[]> {
  const res = await fetch(
    `${BASE()}/rest/v1/trips?order=created_at.desc&limit=100`,
    { headers: headers() }
  )
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`getTrips ${res.status}: ${text}`)
  }
  const rows: any[] = await res.json()
  return rows.map(fromRow)
}

export async function getTripById(id: string): Promise<StoredTrip | null> {
  const res = await fetch(
    `${BASE()}/rest/v1/trips?id=eq.${encodeURIComponent(id)}&limit=1`,
    { headers: headers() }
  )
  if (!res.ok) return null
  const rows: any[] = await res.json()
  return rows[0] ? fromRow(rows[0]) : null
}

export async function updateTrip(id: string, updates: Partial<StoredTrip>): Promise<boolean> {
  const row: any = {}
  if (updates.status     !== undefined) row.status      = updates.status
  if (updates.options    !== undefined) row.options      = updates.options
  if (updates.bookedInfo !== undefined) row.booked_info  = updates.bookedInfo
  if (updates.smartTip   !== undefined) row.smart_tip    = updates.smartTip
  if (updates.route      !== undefined) row.route        = updates.route
  if (updates.dates      !== undefined) row.dates        = updates.dates
  if (updates.travelers  !== undefined) row.travelers    = updates.travelers

  const res = await fetch(
    `${BASE()}/rest/v1/trips?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: headers({ Prefer: "return=minimal" }),
      body: JSON.stringify(row),
    }
  )
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`updateTrip ${res.status}: ${text}`)
  }
  return true
}
