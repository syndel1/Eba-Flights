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

export function ReportSection() {
  const [trips, setTrips] = useState<StoredTrip[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTrips = useCallback(async () => {
    try {
      const res = await fetch("/api/trips")
      if (res.ok) setTrips(await res.json())
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { fetchTrips() }, [fetchTrips])

  const booked   = trips.filter(t => t.status === "booked")
  const totalTrips = trips.length
  const bookedTrips = booked.length

  // Top routes
  const routeCounts: Record<string, number> = {}
  trips.forEach(t => {
    if (t.route && t.route !== "? → ?") {
      routeCounts[t.route] = (routeCounts[t.route] ?? 0) + 1
    }
  })
  const topRoutes = Object.entries(routeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const kpis = [
    { label: "Total Requests", value: totalTrips,  prefix: "",  color: "#0043F1" },
    { label: "Flights Booked", value: bookedTrips, prefix: "",  color: "#059669" },
    { label: "Pending Approval", value: trips.filter(t => t.status === "awaiting").length, prefix: "", color: "#854F0B" },
    { label: "Still Searching",  value: trips.filter(t => t.status === "searching").length, prefix: "", color: "#6B7280" },
  ]

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Travel Report</h2>
        <span className="text-sm text-gray-400">Real-time · from Slack</span>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            className="bg-white rounded-xl border border-[#EAEAEA] p-5 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <p className="text-3xl font-bold mb-1" style={{ color: kpi.color }}>
              {loading ? "—" : `${kpi.prefix}${kpi.value}`}
            </p>
            <p className="text-sm text-gray-500">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : trips.length === 0 ? (
        <div className="text-center py-16">
          <div
            className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full"
            style={{ border: "2px solid rgba(0,67,241,0.15)" }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0043F1" strokeWidth="2">
              <path d="M3 3v18h18"/><path d="M7 17v-5"/><path d="M11 17V9"/><path d="M15 17v-7"/><path d="M19 17V7"/>
            </svg>
          </div>
          <p className="text-gray-500 font-medium">No trip data yet</p>
          <p className="text-sm text-gray-400 mt-1">Reports will populate as the team uses Eba</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {/* Top routes */}
          <div className="bg-white rounded-xl border border-[#EAEAEA] p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Top Routes</h3>
            {topRoutes.length === 0 ? (
              <p className="text-sm text-gray-400">No routes yet</p>
            ) : (
              <div className="space-y-3">
                {topRoutes.map(([route, count]) => (
                  <div key={route} className="flex items-center justify-between">
                    <span className="font-medium text-sm text-gray-800">{route}</span>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: "#EEF2FF", color: "#0043F1" }}
                    >
                      {count} {count === 1 ? "request" : "requests"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent activity */}
          <div className="bg-white rounded-xl border border-[#EAEAEA] p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {trips.slice(0, 6).map(trip => (
                <div key={trip.id} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #0043F1, #80A1F8)" }}
                  >
                    {getInitials(trip.slackUserName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {trip.route ?? "Route TBD"}
                    </p>
                    <p className="text-xs text-gray-400">{trip.slackUserName}</p>
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                    style={{
                      backgroundColor: trip.status === "booked" ? "#ECFDF5" : "#EEF2FF",
                      color: trip.status === "booked" ? "#059669" : "#0043F1",
                    }}
                  >
                    {trip.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
