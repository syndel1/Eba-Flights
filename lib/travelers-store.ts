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
  const res = await fetch(`${SUPABASE_URL()}/rest/v1/travelers`, {
    method: "POST",
    headers: headers({ Prefer: "return=representation" }),
    body: JSON.stringify(traveler),
  })
  if (!res.ok) {
    console.error("[saveTraveler]", res.status, await res.text())
    return null
  }
  const data = await res.json()
  return Array.isArray(data) ? data[0] : data
}

export async function findTravelerByName(name: string): Promise<Traveler | null> {
  const q = encodeURIComponent(`%${name}%`)
  const res = await fetch(
    `${SUPABASE_URL()}/rest/v1/travelers?legal_name=ilike.${q}&limit=1`,
    { headers: headers() }
  )
  if (!res.ok) return null
  const data = await res.json()
  return data[0] ?? null
}

export async function findTravelerByEmail(email: string): Promise<Traveler | null> {
  const res = await fetch(
    `${SUPABASE_URL()}/rest/v1/travelers?email=eq.${encodeURIComponent(email)}&limit=1`,
    { headers: headers() }
  )
  if (!res.ok) return null
  const data = await res.json()
  return data[0] ?? null
}

export async function updateTravelerById(id: string, updates: Partial<Traveler>): Promise<void> {
  await fetch(`${SUPABASE_URL()}/rest/v1/travelers?id=eq.${id}`, {
    method: "PATCH",
    headers: headers({ Prefer: "return=minimal" }),
    body: JSON.stringify(updates),
  })
}

export async function getTravelers(): Promise<Traveler[]> {
  const res = await fetch(
    `${SUPABASE_URL()}/rest/v1/travelers?order=created_at.desc`,
    { headers: headers() }
  )
  if (!res.ok) return []
  return res.json()
}
