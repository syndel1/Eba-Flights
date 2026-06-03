import { createAdminClient } from "@/lib/supabase/admin"

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
    route: trip.route,
    dates: trip.dates,
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
    route: row.route,
    dates: row.dates,
    travelers: row.travelers ?? [],
    options: row.options ?? undefined,
    bookedInfo: row.booked_info ?? undefined,
    smartTip: row.smart_tip ?? undefined,
    createdAt: row.created_at,
  }
}

export async function addTrip(trip: StoredTrip): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from("trips").upsert(toRow(trip))
  if (error) throw new Error(`addTrip: ${error.message}`)
}

export async function getTrips(): Promise<StoredTrip[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100)
  if (error) throw new Error(`getTrips: ${error.message}`)
  return (data ?? []).map(fromRow)
}

export async function getTripById(id: string): Promise<StoredTrip | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .single()
  if (error) return null
  return fromRow(data)
}

export async function updateTrip(id: string, updates: Partial<StoredTrip>): Promise<boolean> {
  const supabase = createAdminClient()
  const row: any = {}
  if (updates.status !== undefined) row.status = updates.status
  if (updates.options !== undefined) row.options = updates.options
  if (updates.bookedInfo !== undefined) row.booked_info = updates.bookedInfo
  if (updates.smartTip !== undefined) row.smart_tip = updates.smartTip
  if (updates.route !== undefined) row.route = updates.route
  if (updates.dates !== undefined) row.dates = updates.dates
  if (updates.travelers !== undefined) row.travelers = updates.travelers

  const { error } = await supabase.from("trips").update(row).eq("id", id)
  if (error) throw new Error(`updateTrip: ${error.message}`)
  return true
}
