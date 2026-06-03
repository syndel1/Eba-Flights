"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { 
  TrendingUp, 
  ArrowUp,
  ArrowDown,
  ChevronUp,
  ChevronDown
} from "lucide-react"
import { cn } from "@/lib/utils"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from "recharts"

const chartData = [
  { month: "Jan", sales: 8200, engineering: 4800, product: 3200 },
  { month: "Feb", sales: 7800, engineering: 5200, product: 2900 },
  { month: "Mar", sales: 9100, engineering: 4900, product: 3500 },
  { month: "Apr", sales: 8600, engineering: 5500, product: 3100 },
  { month: "May", sales: 10800, engineering: 6100, product: 4200 },
  { month: "Jun", sales: 9900, engineering: 5800, product: 3800 },
]

const topRoutes = [
  { route: "MIA → NYC", trips: 12, totalCost: "$3,468", avg: "$289", savings: "-$85/trip" },
  { route: "BOG → MEX", trips: 8, totalCost: "$3,280", avg: "$410", savings: "-$95/trip" },
  { route: "NYC → SF", trips: 6, totalCost: "$1,860", avg: "$310", savings: "-$120/trip" },
  { route: "LAX → SEA", trips: 9, totalCost: "$2,430", avg: "$270", savings: "-$65/trip" },
  { route: "DEN → CHI", trips: 7, totalCost: "$1,890", avg: "$270", savings: "-$45/trip" },
]

const smartInsights = [
  { 
    type: "green" as const, 
    text: "MIA → ORL: Team saved $335 choosing rental car over flight" 
  },
  { 
    type: "blue" as const, 
    text: "Best booking day this month: Tuesday — avg $42 cheaper" 
  },
  { 
    type: "amber" as const, 
    text: "Engineering budget at 61% — on track for month end" 
  },
]

const travelerBreakdown = [
  { id: 1, name: "Camila Zancanella", dept: "Sales", route: "MIA → NYC", cost: "$1,245", saved: "+$85", status: "completed" as const },
  { id: 2, name: "Felipe Cortés", dept: "Sales", route: "BOG → MEX", cost: "$1,640", saved: "+$120", status: "in-flight" as const },
  { id: 3, name: "Nick Diaz", dept: "Sales", route: "NYC → SF", cost: "$930", saved: "+$95", status: "completed" as const },
  { id: 4, name: "Kai Takami", dept: "Engineering", route: "LAX → SEA", cost: "$540", saved: "+$45", status: "completed" as const },
  { id: 5, name: "Camila Zancanella", dept: "Sales", route: "DEN → CHI", cost: "$540", saved: "+$65", status: "in-flight" as const },
  { id: 6, name: "Kai Takami", dept: "Engineering", route: "MIA → NYC", cost: "$578", saved: "+$85", status: "completed" as const },
]

const departments = [
  { name: "Sales", budget: 50000, spent: 35200, color: "#0043F1" },
  { name: "Engineering", budget: 30000, spent: 18400, color: "#80A1F8" },
  { name: "Product", budget: 20000, spent: 12100, color: "#C7D4FB" },
]

type SortKey = "name" | "dept" | "cost" | "saved"
type SortDir = "asc" | "desc"

// Stroke KPI icons - 2px stroke, 20px size
function KPIIcon({ type, color }: { type: "dollar" | "savings" | "plane" | "calculator"; color: string }) {
  const icons: Record<string, React.ReactNode> = {
    dollar: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    savings: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
      </svg>
    ),
    plane: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
      </svg>
    ),
    calculator: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" /><line x1="8" y1="10" x2="8" y2="10.01" /><line x1="12" y1="10" x2="12" y2="10.01" /><line x1="16" y1="10" x2="16" y2="10.01" /><line x1="8" y1="14" x2="8" y2="14.01" /><line x1="12" y1="14" x2="12" y2="14.01" /><line x1="16" y1="14" x2="16" y2="14.01" /><line x1="8" y1="18" x2="8" y2="18.01" /><line x1="12" y1="18" x2="16" y2="18" />
      </svg>
    ),
  }
  return <>{icons[type]}</>
}

function useCountUp(end: number, duration: number = 1500, delay: number = 0) {
  const [value, setValue] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          const startTime = Date.now() + delay
          const animate = () => {
            const now = Date.now()
            if (now < startTime) {
              requestAnimationFrame(animate)
              return
            }
            const elapsed = now - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setValue(Math.floor(end * eased))
            if (progress < 1) {
              requestAnimationFrame(animate)
            }
          }
          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [end, duration, delay, hasAnimated])

  return { value, ref }
}

interface KPICardProps {
  title: string
  value: number
  prefix?: string
  suffix?: string
  iconType: "dollar" | "savings" | "plane" | "calculator"
  iconColor: string
  change: number
  changeType: "good-up" | "good-down" | "bad-up" | "bad-down" | "neutral"
  delay?: number
}

function KPICard({ title, value, prefix = "", iconType, iconColor, change, changeType, delay = 0 }: KPICardProps) {
  const { value: displayValue, ref } = useCountUp(value, 1500, delay)

  const getBadgeStyle = () => {
    switch (changeType) {
      case "good-up":
      case "good-down":
        return "bg-green-100 text-green-700"
      case "bad-up":
        return "bg-red-100 text-red-700"
      case "bad-down":
      case "neutral":
        return "bg-gray-100 text-gray-600"
      default:
        return "bg-blue-100 text-blue-700"
    }
  }

  const isUp = changeType === "good-up" || changeType === "bad-up"

  return (
    <motion.div
      ref={ref}
      className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay / 1000 }}
    >
      <div className="flex items-start justify-between mb-3">
        <div 
          className="w-11 h-11 flex items-center justify-center"
          style={{ 
            borderRadius: "50%",
            border: "2px solid rgba(0,67,241,0.15)"
          }}
        >
          <KPIIcon type={iconType} color={iconColor} />
        </div>
        <Badge className={cn("text-xs font-medium", getBadgeStyle())}>
          {isUp ? <ArrowUp className="h-3 w-3 mr-0.5" /> : <ArrowDown className="h-3 w-3 mr-0.5" />}
          {Math.abs(change)}%
        </Badge>
      </div>
      <p className="text-2xl font-bold text-gray-900">
        {prefix}{displayValue.toLocaleString()}
      </p>
      <p className="text-sm text-gray-500 mt-0.5">{title}</p>
    </motion.div>
  )
}

function BudgetBar({ department, delay = 0 }: { department: typeof departments[0]; delay?: number }) {
  const [animatedWidth, setAnimatedWidth] = useState(0)
  const percentage = Math.round((department.spent / department.budget) * 100)
  const isOverBudget = percentage > 80

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedWidth(percentage), delay)
    return () => clearTimeout(timer)
  }, [percentage, delay])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-900">{department.name}</span>
        <span className="text-gray-500">
          ${department.spent.toLocaleString()} / ${department.budget.toLocaleString()}
        </span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: isOverBudget ? "#F59E0B" : department.color }}
          initial={{ width: 0 }}
          animate={{ width: `${animatedWidth}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
      <div className="flex justify-end">
        <span className={cn(
          "text-xs font-medium",
          isOverBudget ? "text-amber-600" : "text-gray-500"
        )}>
          {percentage}%
        </span>
      </div>
    </div>
  )
}

function InsightCard({ type, text }: { type: "green" | "blue" | "amber"; text: string }) {
  const borderColor = {
    green: "#059669",
    blue: "#0043F1",
    amber: "#F59E0B"
  }

  return (
    <div 
      className="bg-white rounded-lg p-4 border border-gray-200"
      style={{ borderLeftWidth: 4, borderLeftColor: borderColor[type] }}
    >
      <p className="text-sm text-gray-700">{text}</p>
    </div>
  )
}

export function ReportSection() {
  const [period, setPeriod] = useState<"weekly" | "monthly">("monthly")
  const [sortKey, setSortKey] = useState<SortKey>("name")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [savingsArrowY, setSavingsArrowY] = useState(0)

  // Animated upward arrow for savings
  useEffect(() => {
    const interval = setInterval(() => {
      setSavingsArrowY(prev => prev === 0 ? -4 : 0)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const sortedTravelers = [...travelerBreakdown].sort((a, b) => {
    let aVal: string | number = a[sortKey]
    let bVal: string | number = b[sortKey]
    
    if (sortKey === "cost" || sortKey === "saved") {
      aVal = parseFloat(a[sortKey].replace(/[^0-9.-]/g, ""))
      bVal = parseFloat(b[sortKey].replace(/[^0-9.-]/g, ""))
    }
    
    if (sortDir === "asc") {
      return aVal < bVal ? -1 : 1
    }
    return aVal > bVal ? -1 : 1
  })

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return null
    return sortDir === "asc" ? 
      <ChevronUp className="h-3 w-3 inline ml-1" /> : 
      <ChevronDown className="h-3 w-3 inline ml-1" />
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <motion.div
      className="max-w-6xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header Row */}
      <motion.div 
        className="flex items-center justify-between mb-6"
        variants={itemVariants}
      >
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900">Travel Report</h2>
          <div className="flex bg-gray-100 rounded-full p-1">
            {(["weekly", "monthly"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all",
                  period === p
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <span className="text-sm text-gray-400">Next report in 3 days</span>
      </motion.div>

      {/* Insight Banner */}
      <motion.div
        className="rounded-2xl p-6 mb-6 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0043F1 0%, #0055FF 100%)"
        }}
        variants={itemVariants}
      >
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className="text-white/80 text-sm mb-1">Monthly Savings Highlight</p>
            <p className="text-white text-2xl font-bold mb-2">
              This month you saved $8,450 vs last month
            </p>
            <p className="text-white/70 text-sm flex items-center gap-2">
              <span className="inline-flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" />
                23% improvement
              </span>
              <span>·</span>
              <span>Sales team drove most savings</span>
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-2">
              <motion.div
                animate={{ y: savingsArrowY }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                <ArrowUp className="h-8 w-8 text-white/80" />
              </motion.div>
              <span className="text-5xl font-bold text-white">$8,450</span>
            </div>
            <p className="text-white/60 text-sm mt-1">saved this period</p>
          </div>
        </div>
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Total Spend"
          value={65700}
          prefix="$"
          iconType="dollar"
          iconColor="#DC2626"
          change={12}
          changeType="bad-up"
          delay={0}
        />
        <KPICard
          title="Amount Saved"
          value={8450}
          prefix="$"
          iconType="savings"
          iconColor="#059669"
          change={23}
          changeType="good-up"
          delay={100}
        />
        <KPICard
          title="Total Trips"
          value={142}
          iconType="plane"
          iconColor="#0043F1"
          change={8}
          changeType="good-up"
          delay={200}
        />
        <KPICard
          title="Avg Per Trip"
          value={462}
          prefix="$"
          iconType="calculator"
          iconColor="#6B7280"
          change={5}
          changeType="good-down"
          delay={300}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Spend by Department Chart */}
        <motion.div
          className="bg-white rounded-xl border border-gray-200 p-6"
          variants={itemVariants}
        >
          <h3 className="font-semibold text-gray-900 mb-4">Spend by Department</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} tickFormatter={(v) => `$${v/1000}k`} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
              />
              <Legend wrapperStyle={{ paddingTop: 16 }} />
              <Bar 
                dataKey="sales" 
                stackId="a" 
                fill="#0043F1" 
                name="Sales"
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="engineering" 
                stackId="a" 
                fill="#80A1F8" 
                name="Engineering"
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="product" 
                stackId="a" 
                fill="#C7D4FB" 
                name="Product"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Budget Progress */}
        <motion.div
          className="bg-white rounded-xl border border-gray-200 p-6"
          variants={itemVariants}
        >
          <h3 className="font-semibold text-gray-900 mb-6">Budget Progress</h3>
          <div className="space-y-6">
            {departments.map((dept, index) => (
              <BudgetBar key={dept.name} department={dept} delay={index * 200} />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Top Routes Table */}
        <motion.div
          className="bg-white rounded-xl border border-gray-200 p-6"
          variants={itemVariants}
        >
          <h3 className="font-semibold text-gray-900 mb-4">Top Routes</h3>
          <div className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 font-medium text-gray-500">Route</th>
                  <th className="text-center py-2 font-medium text-gray-500">Trips</th>
                  <th className="text-right py-2 font-medium text-gray-500">Total Cost</th>
                  <th className="text-right py-2 font-medium text-gray-500">Avg</th>
                  <th className="text-right py-2 font-medium text-gray-500">Savings</th>
                </tr>
              </thead>
              <tbody>
                {topRoutes.map((route, index) => (
                  <motion.tr
                    key={route.route}
                    className="border-b border-gray-100 last:border-0"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    <td className="py-3 font-medium text-gray-900">{route.route}</td>
                    <td className="py-3 text-center text-gray-600">{route.trips}</td>
                    <td className="py-3 text-right text-gray-600">{route.totalCost}</td>
                    <td className="py-3 text-right text-gray-600">{route.avg}</td>
                    <td className="py-3 text-right font-medium text-green-600">{route.savings}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Smart Insights */}
        <motion.div
          className="bg-white rounded-xl border border-gray-200 p-6"
          variants={itemVariants}
        >
          <h3 className="font-semibold text-gray-900 mb-4">Smart Insights</h3>
          <div className="space-y-3">
            {smartInsights.map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.15 }}
              >
                <InsightCard type={insight.type} text={insight.text} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Traveler Breakdown Table */}
      <motion.div
        className="bg-white rounded-xl border border-gray-200 p-6"
        variants={itemVariants}
      >
        <h3 className="font-semibold text-gray-900 mb-4">Traveler Breakdown</h3>
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Traveler</th>
                <th 
                  className="text-left py-3 px-4 font-medium text-gray-500 cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort("dept")}
                >
                  Dept <SortIcon column="dept" />
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Route</th>
                <th 
                  className="text-right py-3 px-4 font-medium text-gray-500 cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort("cost")}
                >
                  Cost <SortIcon column="cost" />
                </th>
                <th 
                  className="text-right py-3 px-4 font-medium text-gray-500 cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort("saved")}
                >
                  Saved <SortIcon column="saved" />
                </th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedTravelers.map((traveler, index) => (
                <motion.tr
                  key={traveler.id}
                  className="border-t border-gray-100"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 + index * 0.08 }}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#0043F1] flex items-center justify-center text-white text-xs font-medium">
                        {traveler.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <span className="font-medium text-gray-900">{traveler.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                      {traveler.dept}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{traveler.route}</td>
                  <td className="py-3 px-4 text-right text-gray-900 font-medium">{traveler.cost}</td>
                  <td className="py-3 px-4 text-right font-medium text-green-600">{traveler.saved}</td>
                  <td className="py-3 px-4 text-center">
                    {traveler.status === "completed" ? (
                      <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-500">
                        Completed
                      </Badge>
                    ) : (
                      <Badge className="text-xs bg-blue-100 text-blue-700 animate-pulse">
                        In Flight
                      </Badge>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  )
}
