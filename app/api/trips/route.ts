import { NextRequest, NextResponse } from "next/server"
import { getTrips, addTrip, StoredTrip } from "@/lib/trips-store"

export async function GET(): Promise<NextResponse> {
  try {
    const trips = await getTrips()
    console.log(`[GET /api/trips] returned ${trips.length} trips`)
    return NextResponse.json(trips)
  } catch (err) {
    console.error("[GET /api/trips] ERROR:", err)
    return NextResponse.json([], { status: 200 })
  }
}

// Manual trip creation (for testing without Slack)
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const trip: StoredTrip = {
      id: `manual-${Date.now()}`,
      slackMessageTs: `${Date.now()}`,
      slackChannelId: "manual",
      slackUserId: "manual",
      slackUserName: body.userName ?? "Manual",
      quote: body.quote ?? "",
      channel: body.channel ?? "#travel",
      status: body.status ?? "searching",
      route: body.route,
      dates: body.dates,
      travelers: body.travelers ?? [{ initials: "?", name: "Unknown" }],
      options: body.options,
      bookedInfo: body.bookedInfo,
      smartTip: body.smartTip,
      createdAt: Date.now(),
    }
    await addTrip(trip)
    return NextResponse.json(trip, { status: 201 })
  } catch (err) {
    console.error("[POST /api/trips]", err)
    return NextResponse.json({ error: "Failed to create trip" }, { status: 500 })
  }
}
