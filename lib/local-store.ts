// Fallback store used when Supabase is unreachable (e.g. project paused).
//
// Tries Vercel KV first — it persists across serverless invocations, so this
// works correctly when deployed. If KV isn't configured (e.g. local dev
// without `vercel env pull`), falls back further to an in-memory store that
// only lives for the current process — fine for local testing, not for prod.

import { kv } from "@vercel/kv"
import type { StoredTrip } from "./trips-store"
import type { Booking, TravelCredit } from "./bookings-store"
import type { Traveler } from "./travelers-store"

let nextId = 1
function genId() {
  return `local-${Date.now()}-${nextId++}`
}

// ─── In-memory last resort (per-process only) ─────────────────────────────

const memTrips = new Map<string, StoredTrip>()
const memBookings: Booking[] = []
const memCredits: TravelCredit[] = []
const memTravelers: Traveler[] = []

// ─── Trips ──────────────────────────────────────────────────────────────────

export const localTrips = {
  async add(trip: StoredTrip): Promise<void> {
    try {
      await kv.set(`trip:${trip.id}`, trip)
      await kv.zadd("trips:index", { score: trip.createdAt, member: trip.id })
      await kv.hset("trips:by-ts", { [trip.slackMessageTs]: trip.id })
      return
    } catch (err) {
      console.warn("[localTrips.add] KV unavailable, using in-process memory:", err)
      memTrips.set(trip.id, trip)
    }
  },
  async getAll(): Promise<StoredTrip[]> {
    try {
      const ids = await kv.zrange<string[]>("trips:index", 0, 99, { rev: true })
      if (ids.length === 0 && memTrips.size === 0) return []
      const rows = await Promise.all(ids.map((id) => kv.get<StoredTrip>(`trip:${id}`)))
      return rows.filter((t): t is StoredTrip => !!t)
    } catch (err) {
      console.warn("[localTrips.getAll] KV unavailable, using in-process memory:", err)
      return [...memTrips.values()].sort((a, b) => b.createdAt - a.createdAt).slice(0, 100)
    }
  },
  async getById(id: string): Promise<StoredTrip | null> {
    try {
      return (await kv.get<StoredTrip>(`trip:${id}`)) ?? memTrips.get(id) ?? null
    } catch (err) {
      console.warn("[localTrips.getById] KV unavailable, using in-process memory:", err)
      return memTrips.get(id) ?? null
    }
  },
  async getByMessageTs(messageTs: string): Promise<StoredTrip | null> {
    try {
      const id = await kv.hget<string>("trips:by-ts", messageTs)
      if (id) {
        const trip = await kv.get<StoredTrip>(`trip:${id}`)
        if (trip) return trip
      }
    } catch (err) {
      console.warn("[localTrips.getByMessageTs] KV unavailable, using in-process memory:", err)
    }
    return [...memTrips.values()].find((t) => t.slackMessageTs === messageTs) ?? null
  },
  async update(id: string, updates: Partial<StoredTrip>): Promise<boolean> {
    try {
      const existing = await kv.get<StoredTrip>(`trip:${id}`)
      if (existing) {
        await kv.set(`trip:${id}`, { ...existing, ...updates })
        return true
      }
    } catch (err) {
      console.warn("[localTrips.update] KV unavailable, using in-process memory:", err)
    }
    const trip = memTrips.get(id)
    if (!trip) return false
    memTrips.set(id, { ...trip, ...updates })
    return true
  },
}

// ─── Bookings ───────────────────────────────────────────────────────────────

export const localBookings = {
  async create(booking: Omit<Booking, "id" | "created_at">): Promise<Booking> {
    const row: Booking = { ...booking, id: genId(), created_at: new Date().toISOString() }
    try {
      await kv.set(`booking:${row.id}`, row)
      if (row.pnr) await kv.hset("bookings:by-pnr", { [row.pnr]: row.id })
      return row
    } catch (err) {
      console.warn("[localBookings.create] KV unavailable, using in-process memory:", err)
      memBookings.push(row)
      return row
    }
  },
  async getByPNR(pnr: string): Promise<Booking | null> {
    try {
      const id = await kv.hget<string>("bookings:by-pnr", pnr)
      if (id) {
        const booking = await kv.get<Booking>(`booking:${id}`)
        if (booking) return booking
      }
    } catch (err) {
      console.warn("[localBookings.getByPNR] KV unavailable, using in-process memory:", err)
    }
    return memBookings.find((b) => b.pnr === pnr) ?? null
  },
  async updateByPNR(pnr: string, updates: Partial<Booking>): Promise<void> {
    try {
      const id = await kv.hget<string>("bookings:by-pnr", pnr)
      if (id) {
        const existing = await kv.get<Booking>(`booking:${id}`)
        if (existing) {
          await kv.set(`booking:${id}`, { ...existing, ...updates })
          return
        }
      }
    } catch (err) {
      console.warn("[localBookings.updateByPNR] KV unavailable, using in-process memory:", err)
    }
    const i = memBookings.findIndex((b) => b.pnr === pnr)
    if (i !== -1) memBookings[i] = { ...memBookings[i], ...updates }
  },
}

export const localCredits = {
  async getActive(): Promise<TravelCredit[]> {
    try {
      const ids = await kv.smembers("credits:active:ids")
      const rows = await Promise.all(ids.map((id) => kv.get<TravelCredit>(`credit:${id}`)))
      return rows
        .filter((c): c is TravelCredit => !!c && !c.is_used)
        .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
    } catch (err) {
      console.warn("[localCredits.getActive] KV unavailable, using in-process memory:", err)
      return memCredits
        .filter((c) => !c.is_used)
        .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
    }
  },
  async create(credit: Omit<TravelCredit, "id" | "created_at">): Promise<void> {
    const row: TravelCredit = { ...credit, id: genId(), created_at: new Date().toISOString() }
    try {
      await kv.set(`credit:${row.id}`, row)
      await kv.sadd("credits:active:ids", row.id!)
      return
    } catch (err) {
      console.warn("[localCredits.create] KV unavailable, using in-process memory:", err)
      memCredits.push(row)
    }
  },
}

// ─── Travelers ──────────────────────────────────────────────────────────────

export const localTravelers = {
  async save(traveler: Omit<Traveler, "id" | "created_at">): Promise<Traveler> {
    const row: Traveler = { ...traveler, id: genId(), created_at: new Date().toISOString() }
    try {
      await kv.set(`traveler:${row.id}`, row)
      await kv.sadd("travelers:all:ids", row.id!)
      return row
    } catch (err) {
      console.warn("[localTravelers.save] KV unavailable, using in-process memory:", err)
      memTravelers.push(row)
      return row
    }
  },
  async getAll(): Promise<Traveler[]> {
    try {
      const ids = await kv.smembers("travelers:all:ids")
      const rows = await Promise.all(ids.map((id) => kv.get<Traveler>(`traveler:${id}`)))
      return rows
        .filter((t): t is Traveler => !!t)
        .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
    } catch (err) {
      console.warn("[localTravelers.getAll] KV unavailable, using in-process memory:", err)
      return [...memTravelers].sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
    }
  },
  async findByName(name: string): Promise<Traveler | null> {
    const needle = name.toLowerCase()
    const all = await this.getAll()
    return all.find((t) => t.legal_name.toLowerCase().includes(needle)) ?? null
  },
  async findByEmail(email: string): Promise<Traveler | null> {
    const all = await this.getAll()
    return all.find((t) => t.email === email) ?? null
  },
  async updateById(id: string, updates: Partial<Traveler>): Promise<void> {
    try {
      const existing = await kv.get<Traveler>(`traveler:${id}`)
      if (existing) {
        await kv.set(`traveler:${id}`, { ...existing, ...updates })
        return
      }
    } catch (err) {
      console.warn("[localTravelers.updateById] KV unavailable, using in-process memory:", err)
    }
    const i = memTravelers.findIndex((t) => t.id === id)
    if (i !== -1) memTravelers[i] = { ...memTravelers[i], ...updates }
  },
}
