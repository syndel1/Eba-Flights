import { kv } from "@vercel/kv"

const TRIPS_KEY = "eba:trips"
const MAX_TRIPS = 100

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

export async function addTrip(trip: StoredTrip): Promise<void> {
  await kv.lpush(TRIPS_KEY, JSON.stringify(trip))
  await kv.ltrim(TRIPS_KEY, 0, MAX_TRIPS - 1)
}

export async function getTrips(): Promise<StoredTrip[]> {
  const raw = await kv.lrange<string>(TRIPS_KEY, 0, -1)
  return raw.map((r) => (typeof r === "string" ? JSON.parse(r) : r))
}

export async function updateTrip(id: string, updates: Partial<StoredTrip>): Promise<boolean> {
  const trips = await getTrips()
  const index = trips.findIndex((t) => t.id === id)
  if (index === -1) return false
  const updated = { ...trips[index], ...updates }
  await kv.lset(TRIPS_KEY, index, JSON.stringify(updated))
  return true
}

export async function getTripById(id: string): Promise<StoredTrip | null> {
  const trips = await getTrips()
  return trips.find((t) => t.id === id) ?? null
}
