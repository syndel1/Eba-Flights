import { NextRequest, NextResponse } from "next/server"
import { updateTrip, getTripById } from "@/lib/trips-store"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    const updates = await request.json()
    const updated = await updateTrip(id, updates)
    if (!updated) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }
    const trip = await getTripById(id)
    return NextResponse.json(trip)
  } catch (err) {
    console.error("[PATCH /api/trips/:id]", err)
    return NextResponse.json({ error: "Failed to update trip" }, { status: 500 })
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    const trip = await getTripById(id)
    if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(trip)
  } catch (err) {
    console.error("[GET /api/trips/:id]", err)
    return NextResponse.json({ error: "Failed to fetch trip" }, { status: 500 })
  }
}
