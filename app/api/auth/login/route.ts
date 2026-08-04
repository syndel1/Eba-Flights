import { NextRequest, NextResponse } from "next/server"
import { SESSION_COOKIE, computeSessionToken } from "@/lib/demo-auth"

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { password } = await request.json().catch(() => ({ password: "" }))

  if (!process.env.DEMO_PASSWORD || password !== process.env.DEMO_PASSWORD) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 })
  }

  const token = await computeSessionToken()
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, token!, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  })
  return res
}
