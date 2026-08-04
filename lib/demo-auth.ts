// Lightweight shared-password gate — replaces Supabase/Google auth while
// that project is unreachable. Works in both the Edge middleware runtime
// and Node API routes via Web Crypto (no Node `crypto` module dependency).

export const SESSION_COOKIE = "eba_session"

async function hmac(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export async function computeSessionToken(): Promise<string | null> {
  const secret = process.env.DEMO_PASSWORD
  if (!secret) return null
  return hmac(secret, "eba-authenticated")
}

export async function isValidSessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false
  const expected = await computeSessionToken()
  return !!expected && token === expected
}
