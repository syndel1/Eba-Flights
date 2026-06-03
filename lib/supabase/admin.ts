import { createClient } from "@supabase/supabase-js"

// Server-side admin client — bypasses RLS, never use in browser
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
