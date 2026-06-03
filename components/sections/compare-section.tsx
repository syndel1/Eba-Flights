"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { 
  Clock,
  Leaf,
  DollarSign,
  Check,
  ArrowUp
} from "lucide-react"
import { cn } from "@/lib/utils"

type SortOption = "price" | "time" | "co2"

interface TransportOption {
  id: string
  type: string
  iconType: "plane" | "car" | "ride"
  provider: string
  details: string
  price: number
  time: number
  timeLabel: string
  co2: number
  badge?: { text: string; color: "blue" | "green" | "red" | "gray" }
  savings?: string
  isMuted?: boolean
}

interface RouteData {
  id: number
  from: string
  to: string
  label: string
  insight: {
    recommendation: string
    savingsAmount: string
    savingsPercent: string
  }
  options: TransportOption[]
}

const routesData: RouteData[] = [
  {
    id: 1,
    from: "MIA",
    to: "NYC",
    label: "MIA → NYC",
    insight: {
      recommendation: "Take the flight — save $85 on this trip",
      savingsAmount: "$85",
      savingsPercent: "23% cheaper than alternatives"
    },
    options: [
      {
        id: "flight-mia-nyc",
        type: "Flight",
        iconType: "plane",
        provider: "American AA302",
        details: "Nonstop · overnight · 3h 25m",
        price: 289,
        time: 3.4,
        timeLabel: "3h 25m",
        co2: 180,
        badge: { text: "BEST PRICE", color: "blue" },
        savings: "-$85 saved",
      },
      {
        id: "rental-mia-nyc",
        type: "Rental Car",
        iconType: "car",
        provider: "Self-drive",
        details: "18h drive",
        price: 190,
        time: 18,
        timeLabel: "18h",
        co2: 290,
        badge: { text: "TOO LONG", color: "gray" },
        isMuted: true,
      },
      {
        id: "uber-mia-nyc",
        type: "Uber / Lyft",
        iconType: "ride",
        provider: "Ride",
        details: "~18h",
        price: 940,
        time: 18,
        timeLabel: "~18h",
        co2: 310,
        badge: { text: "NOT VIABLE", color: "gray" },
        isMuted: true,
      },
    ],
  },
  {
    id: 2,
    from: "MIA",
    to: "ORL",
    label: "MIA → ORL",
    insight: {
      recommendation: "Take Uber — save $335 on this trip",
      savingsAmount: "$335",
      savingsPercent: "82% cheaper than flying MIA → ORL"
    },
    options: [
      {
        id: "uber-mia-orl",
        type: "Uber / Lyft",
        iconType: "ride",
        provider: "Rideshare",
        details: "3.5h · no driving needed",
        price: 65,
        time: 3.5,
        timeLabel: "3h 30m",
        co2: 95,
        badge: { text: "BEST OPTION", color: "green" },
        savings: "-$335 saved",
      },
      {
        id: "rental-mia-orl",
        type: "Rental Car",
        iconType: "car",
        provider: "Self-drive",
        details: "3.5h drive · door to door",
        price: 85,
        time: 3.5,
        timeLabel: "3h 30m",
        co2: 85,
      },
      {
        id: "flight-mia-orl",
        type: "Flight",
        iconType: "plane",
        provider: "American AA1190",
        details: "1h flight + 2h airport = 3.5h total",
        price: 400,
        time: 3.5,
        timeLabel: "3h 30m",
        co2: 120,
        badge: { text: "OVERPRICED", color: "red" },
        isMuted: true,
      },
    ],
  },
]

function AnimatedBar({ 
  value, 
  maxValue, 
  color, 
  delay = 0,
  isHighlighted = false 
}: { 
  value: number
  maxValue: number
  color: string
  delay?: number
  isHighlighted?: boolean
}) {
  const [animatedWidth, setAnimatedWidth] = useState(0)
  const percentage = Math.min((value / maxValue) * 100, 100)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedWidth(percentage)
    }, delay)
    return () => clearTimeout(timer)
  }, [percentage, delay])

  return (
    <div className="h-[6px] bg-muted rounded-full overflow-hidden">
      <motion.div
        className={cn(
          "h-full rounded-full transition-all duration-300",
          isHighlighted && "shadow-sm"
        )}
        style={{ 
          backgroundColor: color,
          opacity: isHighlighted ? 1 : 0.7
        }}
        initial={{ width: 0 }}
        animate={{ width: `${animatedWidth}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  )
}

// Stroke transport icons - 2px stroke
function TransportIcon({ type }: { type: "plane" | "car" | "ride" }) {
  const icons: Record<string, React.ReactNode> = {
    plane: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0043F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
      </svg>
    ),
    car: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0043F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 16H9M3 11L5 6.5C5.3 5.6 6.1 5 7 5H17C17.9 5 18.7 5.6 19 6.5L21 11" />
        <path d="M21 11H3V16C3 17.1 3.9 18 5 18H19C20.1 18 21 17.1 21 16V11Z" />
        <circle cx="6.5" cy="15.5" r="1.5" /><circle cx="17.5" cy="15.5" r="1.5" />
      </svg>
    ),
    ride: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0043F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    ),
  }
  return <>{icons[type]}</>
}

function getBadgeStyles(color: "blue" | "green" | "red" | "gray") {
  switch (color) {
    case "blue":
      return "bg-[#0043F1] text-white"
    case "green":
      return "bg-green-500 text-white"
    case "red":
      return "bg-red-500 text-white"
    case "gray":
      return "bg-gray-400 text-white"
  }
}

export function CompareSection() {
  const [selectedRoute, setSelectedRoute] = useState<RouteData | null>(() => routesData[0] || null)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [activeSort, setActiveSort] = useState<SortOption>("price")

  // Early return if no routes data available
  if (!routesData || routesData.length === 0) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center h-64">
        <p className="text-muted-foreground">No routes available</p>
      </div>
    )
  }

  // Get current route data with fallback
  const currentRoute = selectedRoute ?? routesData[0]
  
  // Safety check for current route
  if (!currentRoute) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading routes...</p>
      </div>
    )
  }

  // Safe access to nested properties
  const insight = currentRoute.insight ?? { recommendation: "", savingsAmount: "$0", savingsPercent: "" }
  const options = currentRoute.options ?? []

  // Loading / fallback state
  if (options.length === 0) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading routes...</p>
      </div>
    )
  }
  const maxPrice = Math.max(...options.map(o => o.price), 1)
  const maxTime = Math.max(...options.map(o => o.time), 1)
  const maxCo2 = Math.max(...options.map(o => o.co2), 1)

  const sortedOptions = [...options].sort((a, b) => {
    switch (activeSort) {
      case "price":
        return a.price - b.price
      case "time":
        return a.time - b.time
      case "co2":
        return a.co2 - b.co2
      default:
        return 0
    }
  })

  return (
    <motion.div
      className="max-w-4xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* HERO: Insight Banner */}
      <motion.div
        key={currentRoute.id}
        className="w-full bg-[#0043F1] rounded-2xl p-6 mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-white/70 text-sm font-medium">Smart recommendation</span>
            </div>
            <h2 className="text-white text-xl md:text-2xl font-bold mb-1">
              {insight.recommendation}
            </h2>
            <p className="text-white/80 text-sm">
              {insight.savingsPercent}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <motion.div
              initial={{ y: 5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <ArrowUp className="h-6 w-6 text-green-400" />
            </motion.div>
            <span className="text-white text-4xl md:text-5xl font-bold">
              {insight.savingsAmount}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Route Tabs */}
      <div className="flex gap-2 mb-4">
        {routesData.map((route) => (
          <motion.button
            key={route.id}
            onClick={() => {
              setSelectedRoute(route)
              setSelectedOption(null)
            }}
            className={cn(
              "px-5 py-2.5 rounded-full text-sm font-semibold transition-all",
              currentRoute.id === route.id
                ? "bg-[#0043F1] text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {route.label}
          </motion.button>
        ))}
      </div>

      {/* Sort Pills */}
      <div className="flex gap-2 mb-6">
        {[
          { key: "price" as SortOption, label: "Best price", icon: DollarSign },
          { key: "time" as SortOption, label: "Fastest", icon: Clock },
          { key: "co2" as SortOption, label: "Lowest CO2", icon: Leaf },
        ].map((sort) => (
          <motion.button
            key={sort.key}
            onClick={() => setActiveSort(sort.key)}
            className={cn(
              "flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all min-w-[120px]",
              activeSort === sort.key
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <sort.icon className="h-4 w-4" />
            {sort.label}
          </motion.button>
        ))}
      </div>

      {/* Transport Option Cards - ALL IDENTICAL DIMENSIONS */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {sortedOptions.map((option, index) => (
            <motion.div
              key={option.id}
              layout
              className={cn(
                "bg-card rounded-2xl border-2 transition-all cursor-pointer relative",
                selectedOption === option.id
                  ? "border-[#0043F1] bg-[#0043F1]/5"
                  : "border-border hover:border-[#80A1F8]",
                option.isMuted && selectedOption !== option.id && "opacity-60"
              )}
              style={{ padding: "24px" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setSelectedOption(option.id)}
              whileHover={{ scale: 1.005 }}
              whileTap={{ scale: 0.995 }}
            >
              {/* Badge - top right of card name area */}
              {option.badge && (
                <div 
                  className={cn(
                    "absolute top-6 right-6 px-2.5 py-1 rounded-full text-xs font-bold",
                    getBadgeStyles(option.badge.color)
                  )}
                >
                  {option.badge.text}
                </div>
              )}

              {/* Selection checkmark */}
              {selectedOption === option.id && (
                <motion.div 
                  className="absolute top-6 right-6 w-6 h-6 rounded-full bg-[#0043F1] flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500 }}
                >
                  <Check className="h-4 w-4 text-white" />
                </motion.div>
              )}

              <div className="flex items-start gap-4 mb-5">
                {/* Transport Icon - 48x48 circle */}
                <div 
                  className="flex-shrink-0 flex items-center justify-center"
                  style={{ 
                    width: "48px", 
                    height: "48px",
                    borderRadius: "50%",
                    border: "2px solid rgba(0,67,241,0.15)"
                  }}
                >
                  <TransportIcon type={option.iconType} />
                </div>
                
                {/* Title & Details */}
                <div className="flex-1 min-w-0">
                  <h3 
                    className="text-foreground mb-0.5"
                    style={{ fontSize: "16px", fontWeight: 700 }}
                  >
                    {option.type}
                  </h3>
                  <p 
                    className="text-muted-foreground"
                    style={{ fontSize: "13px", fontWeight: 400 }}
                  >
                    {option.provider} · {option.details}
                  </p>
                </div>

                {/* Price - top right, always same position */}
                <div className="flex-shrink-0 text-right" style={{ minWidth: "100px" }}>
                  <p 
                    className="text-foreground"
                    style={{ fontSize: "24px", fontWeight: 800 }}
                  >
                    ${option.price}
                  </p>
                  {option.savings && (
                    <p 
                      className="text-green-600"
                      style={{ fontSize: "13px", fontWeight: 600 }}
                    >
                      {option.savings}
                    </p>
                  )}
                </div>
              </div>

              {/* Metric Bars - identical height, spacing */}
              <div className="grid grid-cols-3 gap-6">
                {/* Price Bar */}
                <div className="space-y-1.5">
                  <p 
                    className="text-muted-foreground"
                    style={{ fontSize: "11px", fontWeight: 400 }}
                  >
                    Price
                  </p>
                  <AnimatedBar 
                    value={option.price} 
                    maxValue={maxPrice} 
                    color="#0043F1" 
                    delay={100 + index * 50}
                    isHighlighted={activeSort === "price"}
                  />
                  <p 
                    className="text-foreground"
                    style={{ fontSize: "14px", fontWeight: 600 }}
                  >
                    ${option.price}
                  </p>
                </div>

                {/* Time Bar */}
                <div className="space-y-1.5">
                  <p 
                    className="text-muted-foreground"
                    style={{ fontSize: "11px", fontWeight: 400 }}
                  >
                    Time
                  </p>
                  <AnimatedBar 
                    value={option.time} 
                    maxValue={maxTime} 
                    color="#80A1F8" 
                    delay={200 + index * 50}
                    isHighlighted={activeSort === "time"}
                  />
                  <p 
                    className="text-foreground"
                    style={{ fontSize: "14px", fontWeight: 600 }}
                  >
                    {option.timeLabel}
                  </p>
                </div>

                {/* CO2 Bar */}
                <div className="space-y-1.5">
                  <p 
                    className="text-muted-foreground"
                    style={{ fontSize: "11px", fontWeight: 400 }}
                  >
                    CO2
                  </p>
                  <AnimatedBar 
                    value={option.co2} 
                    maxValue={maxCo2} 
                    color="#C7D4FB" 
                    delay={300 + index * 50}
                    isHighlighted={activeSort === "co2"}
                  />
                  <p 
                    className="text-foreground"
                    style={{ fontSize: "14px", fontWeight: 600 }}
                  >
                    {option.co2}kg
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Confirm Button */}
      <AnimatePresence>
        {selectedOption && (
          <motion.div
            className="mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <Button
              className="w-full h-14 bg-[#0043F1] hover:bg-[#0035C0] text-white text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
            >
              <Check className="mr-2 h-5 w-5" />
              Confirm Selection
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
