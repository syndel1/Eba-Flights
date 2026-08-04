import { localTravelers } from "./local-store"

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

export interface Traveler {
  id?: string
  legal_name: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  date_of_birth?: string
  passport_number?: string
  nationality?: string
  expiry_date?: string
  type: "employee" | "trial"
  slack_user_id?: string
  created_at?: string
}

export async function saveTraveler(traveler: Omit<Traveler, "id" | "created_at">): Promise<Traveler | null> {
  try {
    const res = await fetch(`${SUPABASE_URL()}/rest/v1/travelers`, {
      method: "POST",
      headers: headers({ Prefer: "return=representation" }),
      body: JSON.stringify(traveler),
    })
    if (!res.ok) throw new Error(`saveTraveler ${res.status}: ${await res.text()}`)
    const data = await res.json()
    return Array.isArray(data) ? data[0] : data
  } catch (err) {
    console.warn("[saveTraveler] Supabase unreachable, using local fallback:", err)
    return localTravelers.save(traveler)
  }
}

export async function findTravelerByName(name: string): Promise<Traveler | null> {
  try {
    const q = encodeURIComponent(`%${name}%`)
    const res = await fetch(
      `${SUPABASE_URL()}/rest/v1/travelers?legal_name=ilike.${q}&limit=1`,
      { headers: headers() }
    )
    if (!res.ok) throw new Error(`findTravelerByName ${res.status}`)
    const data = await res.json()
    return data[0] ?? null
  } catch (err) {
    console.warn("[findTravelerByName] Supabase unreachable, using local fallback:", err)
    return localTravelers.findByName(name)
  }
}

export async function findTravelerByEmail(email: string): Promise<Traveler | null> {
  try {
    const res = await fetch(
      `${SUPABASE_URL()}/rest/v1/travelers?email=eq.${encodeURIComponent(email)}&limit=1`,
      { headers: headers() }
    )
    if (!res.ok) throw new Error(`findTravelerByEmail ${res.status}`)
    const data = await res.json()
    return data[0] ?? null
  } catch (err) {
    console.warn("[findTravelerByEmail] Supabase unreachable, using local fallback:", err)
    return localTravelers.findByEmail(email)
  }
}

export async function updateTravelerById(id: string, updates: Partial<Traveler>): Promise<void> {
  try {
    const res = await fetch(`${SUPABASE_URL()}/rest/v1/travelers?id=eq.${id}`, {
      method: "PATCH",
      headers: headers({ Prefer: "return=minimal" }),
      body: JSON.stringify(updates),
    })
    if (!res.ok) throw new Error(`updateTravelerById ${res.status}`)
  } catch (err) {
    console.warn("[updateTravelerById] Supabase unreachable, using local fallback:", err)
    await localTravelers.updateById(id, updates)
  }
}

export async function getTravelers(): Promise<Traveler[]> {
  try {
    const res = await fetch(
      `${SUPABASE_URL()}/rest/v1/travelers?order=created_at.desc`,
      { headers: headers() }
    )
    if (!res.ok) throw new Error(`getTravelers ${res.status}`)
    return res.json()
  } catch (err) {
    console.warn("[getTravelers] Supabase unreachable, using local fallback:", err)
    return localTravelers.getAll()
  }
}
