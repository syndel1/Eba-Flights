import { NextRequest, NextResponse } from "next/server"
import { searchFlights } from "@/lib/duffel"

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { origin, destination, departureDate, returnDate, passengers, cabinClass } = body

    if (!origin || !destination || !departureDate) {
      return NextResponse.json(
        { error: "origin, destination and departureDate are required" },
        { status: 400 }
      )
    }

    const offers = await searchFlights({
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      departureDate,
      returnDate,
      passengers: passengers ?? 1,
      cabinClass: cabinClass ?? "economy",
    })

    return NextResponse.json({ offers })
  } catch (err: any) {
    console.error("[POST /api/flights/search]", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
