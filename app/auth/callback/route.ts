import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const ALLOWED_DOMAINS = ["domu.ai", "domu.com"]

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      const email = user?.email ?? ""
      const allowed = ALLOWED_DOMAINS.some((d) => email.endsWith(`@${d}`))

      if (!allowed) {
        await supabase.auth.signOut()
        return NextResponse.redirect(`${origin}/login?error=restricted`)
      }

      // ✅ Redirect to dashboard after successful login
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
