"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, ArrowUp, ArrowDown, ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import type { StoredTrip } from "@/lib/trips-store"

// ─── Data derivation ──────────────────────────────────────────────────────────

function deriveReportData(trips: StoredTrip[]) {
  const booked = trips.filter(t => t.status === "booked")
  const totalTrips = trips.length
  const bookedTrips = booked.length

  // Total spend from booked trips with options
  const totalSpend = booked.reduce((sum, t) => {
    const price = t.options?.[0]?.price ?? 0
    return sum + price
  }, 0)

  const avgPerTrip = bookedTrips > 0 ? Math.round(totalSpend / bookedTrips) : 0

  // Total savings from booked trips
  const totalSaved = booked.reduce((sum, t) => {
    const options = t.options ?? []
    if (options.length < 2) return sum
    const cheapest = Math.min(...options.map(o => o.price))
    const chosen = options[0].price
    return sum + Math.max(0, chosen - cheapest)
  }, 0)

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
    .map(([route, count]) => ({ route, trips: count, totalCost: "$0", avg: "$0", savings: "$0" }))

  // Traveler breakdown
  const travelers = trips.slice(0, 6).map((t, i) => ({
    id: i + 1,
    name: t.slackUserName,
    dept: "Team",
    route: t.route ?? "TBD",
    cost: t.options?.[0]?.price ? `$${t.options[0].price}` : "$0",
    saved: "$0",
    status: (t.status === "booked" ? "completed" : "in-flight") as "completed" | "in-flight",
  }))

  // Monthly chart — group by month using created_at
  const monthMap: Record<string, number> = {}
  trips.forEach(t => {
    const d = new Date(t.createdAt)
    const key = d.toLocaleString("en", { month: "short" })
    monthMap[key] = (monthMap[key] ?? 0) + (t.options?.[0]?.price ?? 0)
  })
  const chartData = Object.entries(monthMap).slice(-6).map(([month, total]) => ({
    month,
    spend: Math.round(total),
  }))

  return { totalTrips, bookedTrips, totalSpend, avgPerTrip, totalSaved, topRoutes, travelers, chartData }
}

// ─── Count-up hook ────────────────────────────────────────────────────────────

function useCountUp(end: number, duration = 1200) {
  const [value, setValue] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prev = value
    if (end === prev) return
    setHasAnimated(false)
  }, [end])

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasAnimated) {
        setHasAnimated(true)
        const start = Date.now()
        const animate = () => {
          const p = Math.min((Date.now() - start) / duration, 1)
          const eased = 1 - Math.pow(1 - p, 3)
          setValue(Math.floor(end * eased))
          if (p < 1) requestAnimationFrame(animate)
        }
        requestAnimationFrame(animate)
      }
    }, { threshold: 0.1 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [end, duration, hasAnimated])

  return { value, ref }
}

// ─── KPI Icon ─────────────────────────────────────────────────────────────────

function KPIIcon({ type, color }: { type: "dollar" | "savings" | "plane" | "calculator"; color: string }) {
  const icons = {
    dollar: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    savings: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    plane: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg>,
    calculator: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="16" y2="18"/></svg>,
  }
  return <>{icons[type]}</>
}

function KPICard({ title, value, prefix = "", iconType, iconColor, delay = 0 }: {
  title: string; value: number; prefix?: string
  iconType: "dollar" | "savings" | "plane" | "calculator"; iconColor: string; delay?: number
}) {
  const { value: display, ref } = useCountUp(value, 1200)
  return (
    <motion.div
      ref={ref}
      className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay / 1000 }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-11 h-11 flex items-center justify-center rounded-full" style={{ border: "2px solid rgba(0,67,241,0.15)" }}>
          <KPIIcon type={iconType} color={iconColor} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{prefix}{display.toLocaleString()}</p>
      <p className="text-sm text-gray-500 mt-0.5">{title}</p>
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

type SortKey = "name" | "dept" | "cost" | "saved"
type SortDir = "asc" | "desc"

export function ReportSection() {
  const [trips, setTrips] = useState<StoredTrip[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<"weekly" | "monthly">("monthly")
  const [sortKey, setSortKey] = useState<SortKey>("name")
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  const fetchTrips = useCallback(async () => {
    try {
      const res = await fetch("/api/trips")
      if (res.ok) setTrips(await res.json())
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { fetchTrips() }, [fetchTrips])

  const { totalTrips, bookedTrips, totalSpend, avgPerTrip, totalSaved, topRoutes, travelers, chartData } =
    deriveReportData(trips)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortKey(key); setSortDir("asc") }
  }

  const sortedTravelers = [...travelers].sort((a, b) => {
    let av: string | number = a[sortKey] ?? ""
    let bv: string | number = b[sortKey] ?? ""
    if (sortKey === "cost" || sortKey === "saved") {
      av = parseFloat(String(av).replace(/[^0-9.-]/g, ""))
      bv = parseFloat(String(bv).replace(/[^0-9.-]/g, ""))
    }
    return sortDir === "asc" ? (av < bv ? -1 : 1) : (av > bv ? -1 : 1)
  })

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey !== col ? null : sortDir === "asc"
      ? <ChevronUp className="h-3 w-3 inline ml-1" />
      : <ChevronDown className="h-3 w-3 inline ml-1" />

  return (
    <motion.div className="max-w-6xl mx-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900">Travel Report</h2>
          <div className="flex bg-gray-100 rounded-full p-1">
            {(["weekly", "monthly"] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all",
                  period === p ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >{p}</button>
            ))}
          </div>
        </div>
        <span className="text-sm text-gray-400">Live data from Slack</span>
      </div>

      {/* Savings banner */}
      <div className="rounded-2xl p-6 mb-6 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0043F1, #0055FF)" }}>
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className="text-white/80 text-sm mb-1">Total Activity</p>
            <p className="text-white text-2xl font-bold mb-2">
              {loading ? "Loading..." : totalTrips === 0 ? "No trips yet — request the first one in Slack!" : `${totalTrips} travel request${totalTrips > 1 ? "s" : ""} · ${bookedTrips} booked`}
            </p>
            {totalSaved > 0 && (
              <p className="text-white/70 text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> ${totalSaved.toLocaleString()} saved vs most expensive option
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-2">
              <ArrowUp className="h-8 w-8 text-white/80" />
              <span className="text-5xl font-bold text-white">{bookedTrips}</span>
            </div>
            <p className="text-white/60 text-sm mt-1">trips booked</p>
          </div>
        </div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KPICard title="Total Spend" value={totalSpend} prefix="$" iconType="dollar" iconColor="#DC2626" delay={0} />
        <KPICard title="Amount Saved" value={totalSaved} prefix="$" iconType="savings" iconColor="#059669" delay={100} />
        <KPICard title="Total Trips" value={totalTrips} iconType="plane" iconColor="#0043F1" delay={200} />
        <KPICard title="Avg Per Trip" value={avgPerTrip} prefix="$" iconType="calculator" iconColor="#6B7280" delay={300} />
      </div>

      {/* Chart row */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Spend Over Time</h3>
          {chartData.length === 0 ? (
            <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">No spend data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#6B7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6B7280", fontSize: 12 }} tickFormatter={v => `$${v}`} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #E5E7EB", borderRadius: "8px" }} formatter={(v: number) => [`$${v}`, "Spend"]} />
                <Bar dataKey="spend" fill="#0043F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Top Routes</h3>
          {topRoutes.length === 0 ? (
            <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">No routes yet</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 font-medium text-gray-500">Route</th>
                  <th className="text-center py-2 font-medium text-gray-500">Requests</th>
                </tr>
              </thead>
              <tbody>
                {topRoutes.map((r, i) => (
                  <tr key={i} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 font-medium text-gray-900">{r.route}</td>
                    <td className="py-3 text-center text-gray-600">{r.trips}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Traveler breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Traveler Breakdown</h3>
        {travelers.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">No activity yet</div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Traveler</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 cursor-pointer hover:text-gray-700" onClick={() => handleSort("dept")}>Dept <SortIcon col="dept" /></th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Route</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500 cursor-pointer hover:text-gray-700" onClick={() => handleSort("cost")}>Cost <SortIcon col="cost" /></th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedTravelers.map(t => (
                  <tr key={t.id} className="border-t border-gray-100">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#0043F1] flex items-center justify-center text-white text-xs font-medium">
                          {t.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{t.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4"><Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">{t.dept}</Badge></td>
                    <td className="py-3 px-4 text-gray-600">{t.route}</td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900">{t.cost}</td>
                    <td className="py-3 px-4 text-center">
                      {t.status === "completed"
                        ? <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-500">Completed</Badge>
                        : <Badge className="text-xs bg-blue-100 text-blue-700">Active</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  )
}
