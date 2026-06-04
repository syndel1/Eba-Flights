import { NextResponse } from "next/server"

export async function GET(): Promise<NextResponse> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    return NextResponse.json({ error: "Missing env vars", url: !!url, key: !!key })
  }

  try {
    const res = await fetch(`${url}/rest/v1/trips?order=created_at.desc&limit=3`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    })
    const status = res.status
    const body = await res.text()
    return NextResponse.json({
      status,
      urlPrefix: url.slice(0, 40),
      keyPrefix: key.slice(0, 25),
      body: body.slice(0, 1000),
    })
  } catch (err: any) {
    return NextResponse.json({ fetchError: err.message })
  }
}
