import { NextResponse, type NextRequest } from "next/server"
import { SESSION_COOKIE, isValidSessionToken } from "@/lib/demo-auth"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes — no auth needed
  const isPublic =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/api")

  const authed = await isValidSessionToken(request.cookies.get(SESSION_COOKIE)?.value)

  if (!authed && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Already logged in → skip the login page, go to dashboard
  if (authed && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
