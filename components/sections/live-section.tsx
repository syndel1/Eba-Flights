"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import type { StoredTrip } from "@/lib/trips-store"

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60_000) return "Just now"
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}

function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map(n => n[0]?.toUpperCase() ?? "").join("")
}

function StatusBadge({ status }: { status: StoredTrip["status"] }) {
  const config = {
    "searching":  { label: "Searching",        bg: "#EEF2FF", color: "#0043F1" },
    "awaiting":   { label: "Awaiting approval", bg: "#FAEEDA", color: "#854F0B" },
    "booked":     { label: "Booked",            bg: "#ECFDF5", color: "#059669" },
    "smart-tip":  { label: "Smart tip",         bg: "#EEF2FF", color: "#0043F1" },
  }[status]
  return (
    <span
      className="px-3 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      {config.label}
    </span>
  )
}

export function LiveSection() {
  const [trips, setTrips] = useState<StoredTrip[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTrips = useCallback(async () => {
    try {
      const res = await fetch("/api/trips")
      if (res.ok) {
        const data: StoredTrip[] = await res.json()
        setTrips(data)
      }
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchTrips()
    const interval = setInterval(fetchTrips, 10_000)
    return () => clearInterval(interval)
  }, [fetchTrips])

  const booked    = trips.filter(t => t.status === "booked")
  const awaiting  = trips.filter(t => t.status === "awaiting")
  const searching = trips.filter(t => t.status === "searching")

  const stats = [
    { label: "Booked",    count: booked.length,    color: "#059669" },
    { label: "Awaiting",  count: awaiting.length,  color: "#854F0B" },
    { label: "Searching", count: searching.length,  color: "#0043F1" },
    { label: "Total",     count: trips.length,     color: "#6B7280" },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            className="bg-white rounded-2xl border border-[#EAEAEA] p-5 text-center shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <p className="text-3xl font-bold mb-1" style={{ color: stat.color }}>
              {loading ? "—" : stat.count}
            </p>
            <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Trip list */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : trips.length === 0 ? (
        <div className="text-center py-16">
          <div
            className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full"
            style={{ border: "2px solid rgba(0,67,241,0.15)" }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0043F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">No active trips yet</p>
          <p className="text-sm text-gray-400 mt-1">Trips from Slack will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {trips.map((trip, i) => (
            <motion.div
              key={trip.id}
              className="bg-white rounded-xl border border-[#EAEAEA] p-5 shadow-sm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #0043F1, #80A1F8)" }}
                  >
                    {getInitials(trip.slackUserName)}
                  </div>
                  <div>
                    <p className="font-semibold text-black">{trip.slackUserName}</p>
                    <p className="text-sm text-gray-500">{trip.route ?? "Route TBD"}{trip.dates ? ` · ${trip.dates}` : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={trip.status} />
                  <span className="text-xs text-gray-400">{timeAgo(trip.createdAt)}</span>
                </div>
              </div>
              {trip.quote && (
                <p className="mt-3 text-sm text-gray-600 italic border-l-2 border-[#80A1F8] pl-3 line-clamp-1">
                  "{trip.quote}"
                </p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
