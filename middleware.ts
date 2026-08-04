import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const ALLOWED_DOMAINS = ["domu.ai", "domu.com"]

function isAllowedEmail(email: string | undefined): boolean {
  if (!email) return false
  return ALLOWED_DOMAINS.some((d) => email.endsWith(`@${d}`))
}

export async function middleware(request: NextRequest) {
  // Dev-only bypass for when Supabase auth is unreachable (e.g. project paused).
  // Never set SKIP_AUTH in production.
  if (process.env.SKIP_AUTH === "true") {
    return NextResponse.next({ request })
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Public routes — no auth needed
  const isPublic =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api")

  // Protected route without session → /login
  if (!user && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Valid session but wrong domain → sign out + error
  if (user && !isAllowedEmail(user.email)) {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL("/login?error=restricted", request.url))
  }

  // Already logged in → skip login page or landing page, go to dashboard
  if (user && (pathname === "/login" || pathname === "/")) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
