"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import type { StoredTrip } from "@/lib/trips-store"

type TripStatus = "searching" | "awaiting" | "booked" | "smart-tip"
type FilterOption = "all" | "searching" | "pending" | "booked" | "smart-tips"

interface Trip {
  id: string
  travelers: { initials: string; name: string }[]
  route: string
  dates: string
  status: TripStatus
  quote: string
  channel: string
  timeAgo: string
  bookedInfo?: string
  smartTip?: string
  options?: TripOption[]
}

interface TripOption {
  id: string
  type: string
  iconType: "plane" | "car" | "ride"
  provider: string
  details: string
  price: number
  time: string
  co2: number
  badge?: { text: string; color: "blue" | "green" | "gray" }
  savings?: string
  isMuted?: boolean
  priceBar: number
  timeBar: number
  co2Bar: number
}

// ─── Fallback demo trips (shown when no real data yet) ────────────────────────

const DEMO_TRIPS: Trip[] = [
  {
    id: "demo-1",
    travelers: [
      { initials: "IM", name: "Isaac M." },
      { initials: "AK", name: "Aidan K." },
    ],
    route: "BOG → DAL",
    dates: "Mar 24–27",
    status: "awaiting",
    quote: "vamos a viajar el 24 de marzo en la tarde, de preferencia a las 6 a dallas y volver el 27 en la noche, somos yo y aidan",
    channel: "#travel",
    timeAgo: "2 min ago",
    options: [
      {
        id: "av402",
        type: "Flight",
        iconType: "plane",
        provider: "Avianca AV402",
        details: "6:10pm Nonstop 4h20m",
        price: 310,
        time: "4h 20m",
        co2: 180,
        badge: { text: "BEST PRICE", color: "blue" },
        savings: "-$95 saved",
        priceBar: 33,
        timeBar: 24,
        co2Bar: 58,
      },
      {
        id: "la2201",
        type: "Flight",
        iconType: "plane",
        provider: "LATAM LA2201",
        details: "6:45pm Nonstop 4h35m",
        price: 405,
        time: "4h 35m",
        co2: 185,
        priceBar: 43,
        timeBar: 26,
        co2Bar: 60,
      },
      {
        id: "uber-demo",
        type: "Uber / Lyft",
        iconType: "ride",
        provider: "Rideshare",
        details: "~18h",
        price: 940,
        time: "~18h",
        co2: 310,
        badge: { text: "NOT VIABLE", color: "gray" },
        isMuted: true,
        priceBar: 100,
        timeBar: 100,
        co2Bar: 100,
      },
    ],
  },
  {
    id: "demo-2",
    travelers: [{ initials: "CZ", name: "Camila Z." }],
    route: "MIA → NYC",
    dates: "Mar 21–23",
    status: "booked",
    quote: "necesito ir a nueva york el 21, vuelo nocturno sin escala",
    channel: "#travel",
    timeAgo: "1 hour ago",
    bookedInfo: "AA302 · Conf: XK291A · Approved by Nick D.",
  },
  {
    id: "demo-3",
    travelers: [{ initials: "FC", name: "Felipe C." }],
    route: "BOG → HOU",
    dates: "Mar 25",
    status: "searching",
    quote: "vamos a ir el 25 a houston",
    channel: "#travel",
    timeAgo: "Just now",
  },
  {
    id: "demo-4",
    travelers: [{ initials: "KT", name: "Kai T." }],
    route: "MIA → ORL",
    dates: "Mar 22",
    status: "smart-tip",
    quote: "tengo reunion en orlando el 22",
    channel: "#travel",
    timeAgo: "3 hours ago",
    smartTip: "Rental car saves $335 vs flying",
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60_000) return "Just now"
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`
  if (diff < 86_400_000) {
    const h = Math.floor(diff / 3_600_000)
    return `${h} hour${h > 1 ? "s" : ""} ago`
  }
  const d = Math.floor(diff / 86_400_000)
  return `${d} day${d > 1 ? "s" : ""} ago`
}

function storedTripToTrip(stored: StoredTrip): Trip {
  return {
    id: stored.id,
    travelers: stored.travelers,
    route: stored.route ?? "? → ?",
    dates: stored.dates ?? "",
    status: stored.status,
    quote: stored.quote,
    channel: stored.channel,
    timeAgo: timeAgo(stored.createdAt),
    bookedInfo: stored.bookedInfo,
    smartTip: stored.smartTip,
    options: stored.options as TripOption[] | undefined,
  }
}

const filterOptions: { key: FilterOption; label: string }[] = [
  { key: "all", label: "All" },
  { key: "searching", label: "Searching" },
  { key: "pending", label: "Pending" },
  { key: "booked", label: "Booked" },
  { key: "smart-tips", label: "Smart tips" },
]

// ─── Icons ────────────────────────────────────────────────────────────────────

function TripFeedIcon({ type, size = 18 }: { type: string; size?: number }) {
  const icons: Record<string, React.ReactNode> = {
    plane: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#0043F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
      </svg>
    ),
    car: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#0043F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 16H9M3 11L5 6.5C5.3 5.6 6.1 5 7 5H17C17.9 5 18.7 5.6 19 6.5L21 11" />
        <path d="M21 11H3V16C3 17.1 3.9 18 5 18H19C20.1 18 21 17.1 21 16V11Z" />
        <circle cx="6.5" cy="15.5" r="1.5" /><circle cx="17.5" cy="15.5" r="1.5" />
      </svg>
    ),
    ride: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#0043F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    ),
    search: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#0043F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
      </svg>
    ),
    close: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 6L6 18" /><path d="M6 6l12 12" />
      </svg>
    ),
  }
  return <>{icons[type] || null}</>
}

function getStatusBadge(status: TripStatus) {
  switch (status) {
    case "searching":
      return { text: "Searching", bg: "#EEF2FF", color: "#80A1F8", showPulse: true }
    case "awaiting":
      return { text: "Awaiting approval", bg: "#FAEEDA", color: "#854F0B", showPulse: false }
    case "booked":
      return { text: "Booked", bg: "#ECFDF5", color: "#059669", showPulse: false }
    case "smart-tip":
      return { text: "Smart tip", bg: "#EEF2FF", color: "#0043F1", showPulse: false }
  }
}

// ─── AnimatedBar ──────────────────────────────────────────────────────────────

function AnimatedBar({ value, color, delay = 0 }: { value: number; color: string; delay?: number }) {
  const [animatedWidth, setAnimatedWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setAnimatedWidth(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return (
    <div className="h-[5px] bg-[#EAEAEA] rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${animatedWidth}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  )
}

// ─── TripCard ─────────────────────────────────────────────────────────────────

function TripCard({ trip, isSelected, onClick }: { trip: Trip; isSelected: boolean; onClick: () => void }) {
  const badge = getStatusBadge(trip.status)
  return (
    <motion.div
      onClick={onClick}
      className={cn(
        "p-4 bg-white cursor-pointer transition-all duration-200",
        isSelected ? "border-[#0043F1] bg-[#EEF2FF]" : "border-[#EAEAEA] hover:border-[#80A1F8]"
      )}
      style={{ borderWidth: "1.5px", borderStyle: "solid", borderRadius: "14px" }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-start gap-3">
        <div className="flex -space-x-2 flex-shrink-0">
          {trip.travelers.map((t, i) => (
            <div
              key={i}
              className="w-[34px] h-[34px] rounded-full bg-[#0043F1] flex items-center justify-center text-white text-xs font-semibold"
              style={{ border: "2px solid white", zIndex: trip.travelers.length - i }}
            >
              {t.initials}
            </div>
          ))}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div>
              <span className="font-bold text-sm text-black">{trip.route}</span>
              {trip.dates && <span className="text-[11px] text-gray-500 ml-2">{trip.dates}</span>}
            </div>
            <div
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{ backgroundColor: badge.bg, color: badge.color }}
            >
              {badge.showPulse && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: badge.color }} />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: badge.color }} />
                </span>
              )}
              {badge.text}
            </div>
          </div>
          <div className="p-2.5 mt-2" style={{ backgroundColor: "#F8F9FF", borderLeft: "3px solid #80A1F8", borderRadius: "0 8px 8px 0" }}>
            <p className="text-[10px] font-semibold mb-1" style={{ color: "#80A1F8" }}>{trip.channel}</p>
            <p className="text-xs italic text-gray-700 line-clamp-2">{trip.quote}</p>
          </div>
          {trip.bookedInfo && <p className="text-xs mt-2" style={{ color: "#059669" }}>{trip.bookedInfo}</p>}
          {trip.smartTip && (
            <div className="p-2 mt-2 text-xs" style={{ backgroundColor: "#ECFDF5", color: "#059669", borderLeft: "3px solid #059669", borderRadius: "0 8px 8px 0" }}>
              {trip.smartTip}
            </div>
          )}
          <div className="flex items-center justify-between mt-2">
            <div className="flex gap-1">
              {trip.travelers.map((t, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ backgroundColor: "#EEF2FF", color: "#0043F1" }}>
                  {t.name}
                </span>
              ))}
            </div>
            <span className="text-[11px] text-gray-400">{trip.timeAgo}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── DetailPanel helpers ──────────────────────────────────────────────────────

function Header({ trip, onClose }: { trip: Trip; onClose: () => void }) {
  const travelerNames = trip.travelers.map((t) => t.name).join(" & ")
  return (
    <div className="flex items-center justify-between p-6 border-b border-[#EAEAEA]">
      <div>
        <h2 className="text-lg font-extrabold text-black">{trip.route}</h2>
        <p className="text-sm text-gray-500">{trip.dates && `${trip.dates} · `}{travelerNames}</p>
      </div>
      <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
        <TripFeedIcon type="close" size={16} />
      </button>
    </div>
  )
}

function SlackThread({ trip }: { trip: Trip }) {
  const authorName = trip.travelers[0]?.name || "Unknown"
  return (
    <div className="p-4" style={{ backgroundColor: "#F8F9FF", borderLeft: "3px solid #0043F1", borderRadius: "0 12px 12px 0" }}>
      <p className="text-[10px] font-bold mb-2" style={{ color: "#0043F1" }}>{trip.channel} · {trip.timeAgo}</p>
      <p className="text-[13px] italic text-gray-700 mb-2">{trip.quote}</p>
      <p className="text-[11px] text-gray-400">{authorName}</p>
    </div>
  )
}

// ─── DetailPanel ──────────────────────────────────────────────────────────────

type BookingState = "idle" | "loading" | "success" | "error"

function DetailPanel({ trip, onClose }: { trip: Trip; onClose: () => void }) {
  const [approvals, setApprovals] = useState({ traveler: false, executive: false })
  const [showBookButton, setShowBookButton] = useState(false)
  const [bookingState, setBookingState] = useState<BookingState>("idle")
  const [bookingRef, setBookingRef] = useState<string | null>(null)

  useEffect(() => {
    if (approvals.traveler && approvals.executive) {
      const t = setTimeout(() => setShowBookButton(true), 300)
      return () => clearTimeout(t)
    } else {
      setShowBookButton(false)
    }
  }, [approvals])

  async function handleBook() {
    if (!trip.options?.[0] || bookingState === "loading") return
    setBookingState("loading")
    try {
      const res = await fetch("/api/flights/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerId: trip.options[0].id,
          tripId: trip.id,
          travelerNames: trip.travelers.map((t) => t.name),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setBookingRef(data.bookingRef)
      setBookingState("success")
    } catch {
      setBookingState("error")
      setTimeout(() => setBookingState("idle"), 3000)
    }
  }

  const travelerNames = trip.travelers.map((t) => t.name).join(" & ")

  if (trip.status === "searching") {
    return (
      <motion.div className="h-full flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Header trip={trip} onClose={onClose} />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ border: "2px solid rgba(0,67,241,0.15)" }}>
            <TripFeedIcon type="search" size={24} />
          </div>
          <p className="text-sm font-bold mb-1" style={{ color: "#0043F1" }}>Eba is searching</p>
          <p className="text-xs text-gray-500 mb-4 text-center">Checking Google Flights, Kayak and ground options</p>
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: "#0043F1" }}
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    )
  }

  if (trip.status === "booked") {
    return (
      <motion.div className="h-full flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Header trip={trip} onClose={onClose} />
        <div className="flex-1 p-6">
          <SlackThread trip={trip} />
          <div className="p-5 mt-6" style={{ border: "1.5px solid #059669", backgroundColor: "#ECFDF5", borderRadius: "12px" }}>
            <p className="font-extrabold text-[15px] mb-1" style={{ color: "#059669" }}>Booked by Eba</p>
            <p className="text-xs text-gray-600 mb-1">{trip.bookedInfo}</p>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div className="h-full flex flex-col overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Header trip={trip} onClose={onClose} />
      <div className="flex-1 overflow-y-auto p-6">
        <SlackThread trip={trip} />

        {trip.options && trip.options.length > 0 && (
          <div className="mt-6">
            <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-3">Options found by Eba</p>
            <div className="space-y-3">
              {trip.options.map((option, index) => (
                <motion.div
                  key={option.id}
                  className={cn("p-4 bg-white relative", option.isMuted && "opacity-50")}
                  style={{ border: "1.5px solid #EAEAEA", borderRadius: "12px" }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {option.badge && (
                    <div
                      className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{
                        backgroundColor: option.badge.color === "blue" ? "#0043F1" : option.badge.color === "green" ? "#059669" : "#9CA3AF",
                        color: "white",
                      }}
                    >
                      {option.badge.text}
                    </div>
                  )}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ border: "1.5px solid rgba(0,67,241,0.15)" }}>
                      <TripFeedIcon type={option.iconType} size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-black">{option.type}</p>
                      <p className="text-[11px] text-gray-500">{option.provider} · {option.details}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-extrabold text-black">${option.price}</p>
                      {option.savings && <p className="text-[11px] font-semibold" style={{ color: "#059669" }}>{option.savings}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-[10px] text-gray-400 mb-1">Price</p>
                      <AnimatedBar value={option.priceBar} color="#0043F1" delay={100 + index * 50} />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 mb-1">Time</p>
                      <AnimatedBar value={option.timeBar} color="#80A1F8" delay={200 + index * 50} />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 mb-1">CO2</p>
                      <AnimatedBar value={option.co2Bar} color="#C7D4FB" delay={300 + index * 50} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {trip.status === "awaiting" && (
          <div className="mt-6">
            <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-3">Approvals needed</p>
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                onClick={() => setApprovals((prev) => ({ ...prev, traveler: !prev.traveler }))}
                className={cn("p-4 text-left transition-all duration-200 relative", approvals.traveler ? "bg-[#ECFDF5] border-[#059669]" : "bg-white border-[#EAEAEA] hover:border-[#80A1F8]")}
                style={{ borderWidth: "1.5px", borderStyle: "solid", borderRadius: "12px" }}
                whileTap={{ scale: 0.98 }}
              >
                <p className="text-[11px] text-gray-400 mb-0.5">Traveler</p>
                <p className={cn("text-sm font-semibold", approvals.traveler ? "text-[#059669]" : "text-black")}>{travelerNames}</p>
                {approvals.traveler && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-2 right-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </motion.div>
                )}
              </motion.button>
              <motion.button
                onClick={() => setApprovals((prev) => ({ ...prev, executive: !prev.executive }))}
                className={cn("p-4 text-left transition-all duration-200 relative", approvals.executive ? "bg-[#ECFDF5] border-[#059669]" : "bg-white border-[#EAEAEA] hover:border-[#80A1F8]")}
                style={{ borderWidth: "1.5px", borderStyle: "solid", borderRadius: "12px" }}
                whileTap={{ scale: 0.98 }}
              >
                <p className="text-[11px] text-gray-400 mb-0.5">Executive</p>
                <p className={cn("text-sm font-semibold", approvals.executive ? "text-[#059669]" : "text-black")}>Nick Diaz</p>
                <p className="text-[10px] text-gray-400">CEO</p>
                {approvals.executive && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-2 right-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </motion.div>
                )}
              </motion.button>
            </div>
            <AnimatePresence>
              {showBookButton && trip.options && trip.options[0] && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mt-4"
                >
                  {bookingState === "success" ? (
                    <div
                      className="w-full py-3 rounded-full text-center font-semibold text-sm"
                      style={{ backgroundColor: "#ECFDF5", color: "#059669" }}
                    >
                      ✓ Booked! Conf: {bookingRef}
                    </div>
                  ) : (
                    <motion.button
                      onClick={handleBook}
                      disabled={bookingState === "loading"}
                      className="w-full py-3 rounded-full text-white font-semibold text-sm disabled:opacity-60"
                      style={{
                        backgroundColor: bookingState === "error" ? "#DC2626" : "#0043F1",
                      }}
                      whileHover={{ scale: bookingState === "loading" ? 1 : 1.02 }}
                      whileTap={{ scale: bookingState === "loading" ? 1 : 0.98 }}
                    >
                      {bookingState === "loading" ? (
                        <span className="flex items-center justify-center gap-2">
                          <motion.span
                            className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                          />
                          Booking…
                        </span>
                      ) : bookingState === "error" ? (
                        "Failed — try again"
                      ) : (
                        `Book now · $${trip.options[0].price} →`
                      )}
                    </motion.button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── TripFeedSection (main) ───────────────────────────────────────────────────

export function TripFeedSection() {
  const [trips, setTrips] = useState<Trip[]>(DEMO_TRIPS)
  const [selectedTrip, setSelectedTrip] = useState<Trip>(DEMO_TRIPS[0])
  const [activeFilter, setActiveFilter] = useState<FilterOption>("all")
  const [isLive, setIsLive] = useState(false)

  const fetchTrips = useCallback(async () => {
    try {
      const res = await fetch("/api/trips")
      if (!res.ok) return
      const stored: StoredTrip[] = await res.json()
      if (stored.length > 0) {
        const mapped = stored.map(storedTripToTrip)
        setTrips(mapped)
        setIsLive(true)
        setSelectedTrip((prev) => {
          // Keep selection if still present, else default to first
          const still = mapped.find((t) => t.id === prev.id)
          return still ?? mapped[0]
        })
      }
    } catch {
      // silently fall back to demo data
    }
  }, [])

  // Initial fetch + 5s polling
  useEffect(() => {
    fetchTrips()
    const interval = setInterval(fetchTrips, 5_000)
    return () => clearInterval(interval)
  }, [fetchTrips])

  const filteredTrips = trips.filter((trip) => {
    if (activeFilter === "all") return true
    if (activeFilter === "searching") return trip.status === "searching"
    if (activeFilter === "pending") return trip.status === "awaiting"
    if (activeFilter === "booked") return trip.status === "booked"
    if (activeFilter === "smart-tips") return trip.status === "smart-tip"
    return true
  })

  return (
    <div className="h-[calc(100vh-120px)]">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-extrabold text-black">Trip Feed</h1>
          <p className="text-xs text-gray-500">All travel requests from Slack · live</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-75", isLive ? "animate-ping bg-green-400" : "bg-gray-300")} />
            <span className={cn("relative inline-flex rounded-full h-2 w-2", isLive ? "bg-green-500" : "bg-gray-400")} />
          </span>
          <span className="text-xs font-semibold" style={{ color: isLive ? "#059669" : "#9CA3AF" }}>
            {isLive ? "Live · synced with Slack" : "Demo data"}
          </span>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-4">
        {filterOptions.map((filter) => (
          <motion.button
            key={filter.key}
            onClick={() => setActiveFilter(filter.key)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all",
              activeFilter === filter.key ? "bg-black text-white" : "bg-[#EAEAEA] text-gray-600 hover:bg-gray-200"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {filter.label}
          </motion.button>
        ))}
      </div>

      {/* Two column layout */}
      <div className="flex gap-6 h-[calc(100%-80px)]">
        <div className="w-[40%] overflow-y-auto pr-2 space-y-3">
          <AnimatePresence>
            {filteredTrips.map((trip, index) => (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <TripCard trip={trip} isSelected={selectedTrip.id === trip.id} onClick={() => setSelectedTrip(trip)} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="w-[60%] bg-white overflow-hidden" style={{ border: "1.5px solid #EAEAEA", borderRadius: "20px" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedTrip.id}
              className="h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <DetailPanel trip={selectedTrip} onClose={() => {}} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
