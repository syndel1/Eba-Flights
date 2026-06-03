"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Flight {
  id: number
  traveler: {
    name: string
    avatar: string
    initials: string
  }
  flight: string
  from: string
  to: string
  departure: string
  arrival: string
  status: "in-flight" | "boarding" | "delayed" | "landed"
  progress: number
  altitude?: string
  speed?: string
  eta?: string
  delayReason?: string
}

const flights: Flight[] = [
  {
    id: 1,
    traveler: { name: "Camila Zancanella", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face", initials: "CZ" },
    flight: "UA 234",
    from: "SFO",
    to: "JFK",
    departure: "10:30 AM",
    arrival: "7:00 PM",
    status: "in-flight",
    progress: 65,
    altitude: "35,000 ft",
    speed: "540 mph",
    eta: "On time"
  },
  {
    id: 2,
    traveler: { name: "Nick Diaz", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face", initials: "ND" },
    flight: "AA 891",
    from: "LAX",
    to: "ORD",
    departure: "2:15 PM",
    arrival: "8:45 PM",
    status: "boarding",
    progress: 0,
  },
  {
    id: 3,
    traveler: { name: "Kai Takami", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face", initials: "KT" },
    flight: "DL 456",
    from: "SEA",
    to: "MIA",
    departure: "8:00 AM",
    arrival: "4:30 PM",
    status: "delayed",
    progress: 0,
    delayReason: "Weather conditions - 45 min delay"
  },
  {
    id: 4,
    traveler: { name: "Felipe Cortés", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face", initials: "FC" },
    flight: "SW 789",
    from: "DEN",
    to: "PHX",
    departure: "6:30 AM",
    arrival: "8:15 AM",
    status: "landed",
    progress: 100,
  },
]

const statusConfig = {
  "in-flight": { 
    label: "In Flight", 
    bgColor: "#0043F1", 
    textColor: "white",
  },
  "boarding": { 
    label: "Boarding", 
    bgColor: "#059669", 
    textColor: "white",
  },
  "delayed": { 
    label: "Delayed", 
    bgColor: "#F59E0B", 
    textColor: "white",
  },
  "landed": { 
    label: "Landed", 
    bgColor: "#9CA3AF", 
    textColor: "white",
  },
}

// Stroke status icons - 2px stroke
function StatusIcon({ status }: { status: keyof typeof statusConfig }) {
  const icons: Record<string, React.ReactNode> = {
    "in-flight": (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
      </svg>
    ),
    "boarding": (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
      </svg>
    ),
    "delayed": (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    "landed": (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  }
  return <span className="flex-shrink-0">{icons[status]}</span>
}

// Stroke stat icons - 2px stroke, 20px size
function StatIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    "in-flight": (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
      </svg>
    ),
    "boarding": (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
      </svg>
    ),
    "delayed": (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    "landed": (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  }
  return <span>{icons[type]}</span>
}

function StatusBadge({ status }: { status: keyof typeof statusConfig }) {
  const config = statusConfig[status]
  
  return (
    <div 
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
      style={{ backgroundColor: config.bgColor, color: config.textColor }}
    >
      {status === "in-flight" && (
        <motion.span
          animate={{ x: [0, 2, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <StatusIcon status={status} />
        </motion.span>
      )}
      {status === "boarding" && (
        <span className="relative flex h-2.5 w-2.5">
          <span 
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ backgroundColor: "white" }}
          />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
        </span>
      )}
      {status === "delayed" && <StatusIcon status={status} />}
      {status === "landed" && <StatusIcon status={status} />}
      {config.label}
    </div>
  )
}

function FlightProgress({ progress, status }: { progress: number; status: string }) {
  const [animatedProgress, setAnimatedProgress] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedProgress(progress), 300)
    return () => clearTimeout(timer)
  }, [progress])

  return (
    <div className="relative flex items-center gap-3 py-3">
      <div className="flex flex-col items-center">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0043F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
        </svg>
      </div>
      <div className="flex-1 h-2 bg-[#E5E7EB] rounded-full overflow-hidden relative">
        <motion.div
          className="h-full bg-[#0043F1] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${animatedProgress}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
        {status === "in-flight" && animatedProgress > 0 && (
          <motion.div
            className="absolute top-1/2 -translate-y-1/2"
            style={{ left: `calc(${animatedProgress}% - 10px)` }}
            animate={{ y: [-1, 1, -1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="w-5 h-5 bg-[#0043F1] rounded-full flex items-center justify-center shadow-md">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rotate-90">
                <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
              </svg>
            </div>
          </motion.div>
        )}
      </div>
      <div className="flex flex-col items-center">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
        </svg>
      </div>
    </div>
  )
}

export function LiveSection() {
  const stats = [
    { label: "In Flight", count: flights.filter(f => f.status === "in-flight").length, color: "#0043F1", type: "in-flight" },
    { label: "Boarding", count: flights.filter(f => f.status === "boarding").length, color: "#059669", type: "boarding" },
    { label: "Delayed", count: flights.filter(f => f.status === "delayed").length, color: "#F59E0B", type: "delayed" },
    { label: "Landed", count: flights.filter(f => f.status === "landed").length, color: "#9CA3AF", type: "landed" },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header Stats */}
      <motion.div 
        className="grid grid-cols-4 gap-4 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            className="bg-white rounded-2xl border border-[#EAEAEA] p-5 text-center shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            whileHover={{ scale: 1.03, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
          >
            {/* Icon in circle */}
            <div 
              className="w-11 h-11 mx-auto mb-3 flex items-center justify-center"
              style={{ 
                borderRadius: "50%", 
                border: "2px solid rgba(0,67,241,0.15)",
                color: stat.color
              }}
            >
              <StatIcon type={stat.type} />
            </div>
            <p className="text-3xl font-bold mb-1" style={{ color: stat.color }}>{stat.count}</p>
            <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Flight Cards */}
      <div className="space-y-4">
        {flights.map((flight, index) => (          
          <motion.div
            key={flight.id}
            className="bg-white rounded-2xl border border-[#EAEAEA] p-6 shadow-sm hover:shadow-md transition-shadow"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + index * 0.1, duration: 0.5, ease: "easeOut" }}
            whileHover={{ scale: 1.005 }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 ring-2 ring-offset-2 ring-[#0043F1]/20">
                  <AvatarImage src={flight.traveler.avatar} />
                  <AvatarFallback className="bg-[#80A1F8] text-white font-semibold">{flight.traveler.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg text-foreground" style={{ letterSpacing: "-0.5px" }}>{flight.traveler.name}</h3>
                  <p className="text-sm text-muted-foreground">{flight.flight}</p>
                </div>
              </div>
              <StatusBadge status={flight.status} />
            </div>

            <div className="flex items-center justify-between text-sm mb-1">
              <div className="text-center min-w-[80px]">
                <p className="font-bold text-xl text-foreground">{flight.from}</p>
                <p className="text-muted-foreground">{flight.departure}</p>
              </div>
              <div className="flex-1 mx-6">
                <FlightProgress progress={flight.progress} status={flight.status} />
              </div>
              <div className="text-center min-w-[80px]">
                <p className="font-bold text-xl text-foreground">{flight.to}</p>
                <p className="text-muted-foreground">{flight.arrival}</p>
              </div>
            </div>

            {flight.status === "in-flight" && flight.altitude && (
              <motion.div 
                className="mt-5 pt-4 border-t border-[#EAEAEA] flex items-center gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">Altitude:</span>
                  <span className="font-semibold text-sm">{flight.altitude}</span>
                </div>
                <div className="w-px h-4 bg-[#EAEAEA]" />
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">Speed:</span>
                  <span className="font-semibold text-sm">{flight.speed}</span>
                </div>
                <div className="w-px h-4 bg-[#EAEAEA]" />
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">ETA:</span>
                  <span className="font-semibold text-sm text-[#059669]">{flight.eta}</span>
                </div>
              </motion.div>
            )}

            {flight.status === "delayed" && flight.delayReason && (
              <motion.div 
                className="mt-5 pt-4 border-t border-[#EAEAEA]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <p className="text-sm text-[#F59E0B] flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  {flight.delayReason}
                </p>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
