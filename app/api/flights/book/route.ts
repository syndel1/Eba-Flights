import { NextRequest, NextResponse } from "next/server"
import { bookFlight } from "@/lib/duffel"
import { updateTrip } from "@/lib/trips-store"
import { findEmployee, employeeToPassenger } from "@/lib/employees"
import type { PassengerInfo } from "@/lib/duffel"

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { offerId, tripId, travelerNames } = body

    if (!offerId) {
      return NextResponse.json({ error: "offerId is required" }, { status: 400 })
    }

    // Build passenger list from traveler names/initials
    const travelers: string[] = travelerNames ?? []
    const passengers: PassengerInfo[] = travelers
      .map((name: string) => findEmployee(name))
      .filter(Boolean)
      .map((e) => employeeToPassenger(e!))

    // Fallback: if no match found, use a sandbox placeholder passenger
    if (passengers.length === 0) {
      passengers.push({
        firstName: "Eba",
        lastName: "Traveler",
        email: "travel@domu.ai",
        dateOfBirth: "1990-01-01",
        gender: "m",
      })
    }

    const { orderId, bookingRef } = await bookFlight(offerId, passengers)

    // Update trip status → booked
    if (tripId) {
      const names = passengers.map((p) => `${p.firstName} ${p.lastName}`).join(" & ")
      await updateTrip(tripId, {
        status: "booked",
        bookedInfo: `Conf: ${bookingRef} · Booked for ${names} · Approved via Eba`,
      })
    }

    return NextResponse.json({ orderId, bookingRef })
  } catch (err: any) {
    console.error("[POST /api/flights/book]", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
