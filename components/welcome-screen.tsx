"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight } from "lucide-react"

interface WelcomeScreenProps {
  onGetStarted: () => void
}

export function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  const [isSpinning, setIsSpinning] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  const handleGlobeClick = useCallback(() => {
    if (!isSpinning) {
      setIsSpinning(true)
      setTimeout(() => setIsSpinning(false), 800)
    }
  }, [isSpinning])

  const handleEnterDashboard = useCallback(() => {
    setIsExiting(true)
    setTimeout(onGetStarted, 600)
  }, [onGetStarted])

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center"
        style={{ backgroundColor: "#FDFDFD" }}
        animate={isExiting ? { scale: 1.2, opacity: 0 } : { scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        {/* Very subtle dot grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(0, 67, 241, 0.04) 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />

        {/* Title section - compact, top area */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <h1 
            className="font-bold tracking-tight"
            style={{ fontSize: "34px", color: "#000000" }}
          >
            Eba Flights
          </h1>
          <p 
            className="mt-1 font-medium"
            style={{ fontSize: "13px", color: "#80A1F8" }}
          >
            by Domu
          </p>
        </motion.div>

        {/* Globe - smaller, centered */}
        <motion.div
          className="relative cursor-pointer"
          style={{ width: "280px", height: "280px" }}
          onClick={handleGlobeClick}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Globe sphere */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              backgroundColor: "#0043F1",
              boxShadow: "0 0 60px rgba(128, 161, 248, 0.25), 0 8px 32px rgba(0, 0, 0, 0.08)",
            }}
          >
            {/* Rotating container for continents and grid */}
            <motion.div
              className="absolute inset-0 rounded-full overflow-hidden"
              animate={{ rotate: 360 }}
              transition={{
                duration: isSpinning ? 0.8 : 20,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              {/* Grid lines */}
              <svg
                viewBox="0 0 280 280"
                className="absolute inset-0 w-full h-full"
              >
                {/* Latitude lines */}
                {[70, 105, 140, 175, 210].map((y) => (
                  <ellipse
                    key={`lat-${y}`}
                    cx="140"
                    cy={y}
                    rx={Math.sqrt(Math.max(0, 140 * 140 - (y - 140) * (y - 140)))}
                    ry={15}
                    fill="none"
                    stroke="white"
                    strokeWidth="0.5"
                    opacity="0.1"
                  />
                ))}
                {/* Longitude lines */}
                {[0, 30, 60, 90, 120, 150].map((angle) => (
                  <ellipse
                    key={`lon-${angle}`}
                    cx="140"
                    cy="140"
                    rx={12}
                    ry={130}
                    fill="none"
                    stroke="white"
                    strokeWidth="0.5"
                    opacity="0.1"
                    transform={`rotate(${angle} 140 140)`}
                  />
                ))}
              </svg>

              {/* Continents - simplified outlines */}
              <svg
                viewBox="0 0 280 280"
                className="absolute inset-0 w-full h-full"
              >
                {/* North America */}
                <path
                  d="M45 75 L55 65 L75 60 L95 65 L105 75 L100 95 L85 110 L65 115 L50 105 L45 90 Z"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  opacity="0.9"
                  strokeLinejoin="round"
                />
                {/* South America */}
                <path
                  d="M75 130 L90 125 L100 140 L98 170 L90 195 L75 205 L65 190 L68 155 L72 135 Z"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  opacity="0.9"
                  strokeLinejoin="round"
                />
                {/* Europe */}
                <path
                  d="M135 55 L150 50 L165 55 L170 70 L160 80 L145 78 L138 68 Z"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  opacity="0.9"
                  strokeLinejoin="round"
                />
                {/* Africa */}
                <path
                  d="M145 90 L165 85 L180 95 L185 120 L180 155 L165 175 L145 170 L140 140 L142 110 Z"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  opacity="0.9"
                  strokeLinejoin="round"
                />
                {/* Asia */}
                <path
                  d="M175 50 L195 45 L225 50 L240 65 L245 90 L235 105 L210 110 L185 100 L175 80 L178 60 Z"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  opacity="0.9"
                  strokeLinejoin="round"
                />
                {/* Australia */}
                <path
                  d="M210 160 L235 155 L250 165 L248 185 L235 195 L215 190 L210 175 Z"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  opacity="0.9"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.div>

            {/* Subtle highlight */}
            <div 
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.15) 0%, transparent 50%)",
              }}
            />
          </div>

          {/* Orbiting airplane with trail - tilted elliptical path */}
          <motion.div
            className="absolute inset-0"
            style={{ 
              transformStyle: "preserve-3d",
              transform: "rotateX(15deg) rotateZ(-10deg)",
            }}
            animate={{ rotate: 360 }}
            transition={{
              duration: isSpinning ? 1.5 : 8,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            {/* Trail dots */}
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: "4px",
                  height: "4px",
                  backgroundColor: "#80A1F8",
                  top: "50%",
                  left: "50%",
                  transform: `rotate(${-i * 18}deg) translateX(155px) translateY(-2px)`,
                  opacity: 0.7 - i * 0.1,
                }}
              />
            ))}
            
            {/* Airplane */}
            <div
              className="absolute"
              style={{
                top: "50%",
                left: "50%",
                transform: "translateX(150px) translateY(-8px)",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="white"
                style={{ transform: "rotate(90deg)" }}
              >
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
              </svg>
            </div>
          </motion.div>
        </motion.div>

        {/* Enter Dashboard button - pill, auto width */}
        <motion.button
          onClick={handleEnterDashboard}
          className="relative mt-10 rounded-full font-medium text-white overflow-hidden transition-all hover:shadow-lg active:scale-95"
          style={{ 
            backgroundColor: "#0043F1",
            padding: "12px 32px",
            fontSize: "14px",
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          whileHover={{ boxShadow: "0 8px 24px rgba(0, 67, 241, 0.3)" }}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 -translate-x-full"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
            }}
            animate={{ translateX: ["-100%", "100%"] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 2,
              ease: "easeInOut",
            }}
          />
          <span className="relative flex items-center gap-2">
            Enter dashboard
            <ArrowRight className="w-4 h-4" />
          </span>
        </motion.button>
      </motion.div>
    </AnimatePresence>
  )
}
