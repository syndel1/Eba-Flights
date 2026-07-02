"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { SlackDemoSection } from "@/components/sections/slack-demo"

export function LandingPage() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [statsVisible, setStatsVisible] = useState(false)
  const [featuresVisible, setFeaturesVisible] = useState(false)
  const [testimonialsVisible, setTestimonialsVisible] = useState(false)
  const [statsFinished, setStatsFinished] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const statsRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const testimonialsRef = useRef<HTMLDivElement>(null)
  const ctaSectionRef = useRef<HTMLElement>(null)

  // Cursor state
  const cursorRef = useRef<HTMLDivElement>(null)
  const cursorPos = useRef({ x: 0, y: 0 })
  const targetPos = useRef({ x: 0, y: 0 })
  const [isHoveringClickable, setIsHoveringClickable] = useState(false)

  // Scroll position for parallax
  const [scrollY, setScrollY] = useState(0)

  // Plane animation state
  const [planeLooping, setPlaneLooping] = useState(false)
  const [planeSpeedUp, setPlaneSpeedUp] = useState(false)

  // Feature card mouse tracking
  const featureCardRefs = useRef<(HTMLDivElement | null)[]>([])

  // Count-up animation values
  const [savedCount, setSavedCount] = useState(0)
  const [tripsCount, setTripsCount] = useState(0)
  const [reductionCount, setReductionCount] = useState(0)

  // Check if user is already logged in
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session)
    })
  }, [])

  // Custom cursor with lerp
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      targetPos.current = { x: e.clientX, y: e.clientY }
    }

    const animate = () => {
      cursorPos.current.x += (targetPos.current.x - cursorPos.current.x) * 0.15
      cursorPos.current.y += (targetPos.current.y - cursorPos.current.y) * 0.15
      
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${cursorPos.current.x}px, ${cursorPos.current.y}px)`
      }
      requestAnimationFrame(animate)
    }

    window.addEventListener("mousemove", handleMouseMove)
    const animationId = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      cancelAnimationFrame(animationId)
    }
  }, [])

  // Detect hovering over clickable elements
  useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const isClickable = target.closest("button, a, [role='button'], .clickable")
      setIsHoveringClickable(!!isClickable)
    }

    document.addEventListener("mouseover", handleMouseOver)
    return () => document.removeEventListener("mouseover", handleMouseOver)
  }, [])

  // Scroll handler for parallax
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Feature card glow effect
  const handleFeatureMouseMove = useCallback((e: React.MouseEvent, index: number) => {
    const card = featureCardRefs.current[index]
    if (!card) return
    
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    card.style.setProperty("--mouse-x", `${x}px`)
    card.style.setProperty("--mouse-y", `${y}px`)
  }, [])

  useEffect(() => {
    const observerOptions = { threshold: 0.3 }

    const statsObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !statsVisible) {
        setStatsVisible(true)
      }
    }, observerOptions)

    const featuresObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setFeaturesVisible(true)
      }
    }, observerOptions)

    const testimonialsObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setTestimonialsVisible(true)
      }
    }, observerOptions)

    if (statsRef.current) statsObserver.observe(statsRef.current)
    if (featuresRef.current) featuresObserver.observe(featuresRef.current)
    if (testimonialsRef.current) testimonialsObserver.observe(testimonialsRef.current)

    return () => {
      statsObserver.disconnect()
      featuresObserver.disconnect()
      testimonialsObserver.disconnect()
    }
  }, [statsVisible])

  // Count-up animation with easing
  useEffect(() => {
    if (statsVisible) {
      const duration = 2000
      const steps = 60
      const interval = duration / steps

      let step = 0
      const timer = setInterval(() => {
        step++
        const progress = step / steps
        // Ease out cubic
        const easeOut = 1 - Math.pow(1 - progress, 3)
        
        setSavedCount(Math.round(18 * easeOut))
        setTripsCount(Math.round(9 * easeOut))
        setReductionCount(Math.round(28 * easeOut))

        if (step >= steps) {
          clearInterval(timer)
          setStatsFinished(true)
        }
      }, interval)

      return () => clearInterval(timer)
    }
  }, [statsVisible])

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleEnterApp = () => {
    if (isLoggedIn) {
      router.push("/dashboard")
      return
    }
    setIsTransitioning(true)
    setTimeout(() => router.push("/login"), 600)
  }

  const handleCtaClick = () => {
    setPlaneLooping(true)
    setTimeout(() => setPlaneLooping(false), 1000)
  }

  const features = [
    { icon: "takeoff", title: "Book from Slack", desc: "Type /fly and get real flight options in 10 seconds.", metric: "10s", accentColor: "#0043F1" },
    { icon: "route", title: "Smart route optimizer", desc: "Compares flights, Uber and rental cars. Tells you when driving is 5x cheaper.", metric: "-28%", accentColor: "#80A1F8" },
    { icon: "report", title: "CEO report, auto-sent", desc: "Every Monday 8am — spend, savings, budget by team. Automatic.", metric: "Auto", accentColor: "#38BDF8" },
    { icon: "radar", title: "Live flight tracker", desc: "See who's in the air, who's delayed, who just landed. Real-time.", metric: "Live", accentColor: "#34D399" },
    { icon: "traveler", title: "Traveler profiles", desc: "Passport, TSA number, seat preference — stored once, used forever.", metric: "0 errors", accentColor: "#A78BFA" },
    { icon: "flightcard", title: "One card, all trips", desc: "All travel on the corporate card. Every spend tracked automatically.", metric: "100%", accentColor: "#C7D4FB" },
  ]

  const testimonials = [
    { initials: "CZ", name: "Camila Zancanella", role: "COO · Domu", quote: "I used to send screenshots of flights and wait. Now I type in Slack and it's done in 30 seconds." },
    { initials: "ND", name: "Nick Diaz", role: "CEO · Domu", quote: "The Monday report is exactly what I needed. Spend, savings, which team is over budget — one message." },
    { initials: "FC", name: "Felipe Cortés", role: "CFO · Domu", quote: "For MIA → Orlando, it recommended a rental car instead of the $400 flight. Saved $335 in one decision." },
  ]

  const floatingPills = [
    { text: "MIA → NYC · AA302", savings: "-$85 saved", position: "top-[20%] left-[8%]", parallaxSpeed: 0.15, floatDuration: 4, floatAmplitude: 12 },
    { text: "BOG → MEX · AV261", savings: "-$95 saved", position: "top-[15%] right-[10%]", parallaxSpeed: 0.1, floatDuration: 5, floatAmplitude: 8 },
    { text: "MIA → ORL · Rental car", savings: "-$335 saved", position: "bottom-[25%] left-[5%]", parallaxSpeed: 0.05, floatDuration: 6, floatAmplitude: 15 },
    { text: "NYC → SF · UA1", savings: "-$120 saved", position: "bottom-[20%] right-[8%]", parallaxSpeed: 0.08, floatDuration: 4.5, floatAmplitude: 10 },
  ]

  const titleLine1 = ["Travel", "smart."]
  const titleLine2Word = "Spend"

  return (
    <div 
      className="min-h-screen bg-[#FDFDFD] overflow-x-hidden cursor-none"
      style={{
        backgroundImage: "radial-gradient(circle, rgba(0,67,241,0.08) 1px, transparent 1px)",
        backgroundSize: "36px 36px"
      }}
    >
      {/* Custom Cursor - simple dot */}
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 pointer-events-none z-[9999]"
        style={{ marginLeft: "-4px", marginTop: "-4px" }}
      >
        <div
          className="rounded-full bg-[#0043F1] transition-all duration-150"
          style={{
            width:  isHoveringClickable ? "12px" : "7px",
            height: isHoveringClickable ? "12px" : "7px",
            boxShadow: isHoveringClickable ? "0 0 10px rgba(0,67,241,0.5)" : "none",
          }}
        />
      </div>

      {/* Page Transition Overlay */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ clipPath: "polygon(0 100%, 0 100%, 0 100%)" }}
            animate={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 bg-[#0043F1] z-[100]"
          />
        )}
      </AnimatePresence>

      {/* NAVBAR */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 px-4 md:px-8 py-3 md:py-4 flex items-center justify-between"
        style={{
          backgroundColor: "rgba(253,253,253,0.85)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(0,67,241,0.06)"
        }}
      >
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2 md:gap-3 flex-shrink-0 cursor-pointer group"
        >
          <motion.div
            initial={{ rotate: -180, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-7 h-7 md:w-10 md:h-10 flex items-center justify-center relative flex-shrink-0"
            style={{ 
              borderRadius: "50%", 
              background: "linear-gradient(135deg, #0043F1, #80A1F8)"
            }}
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 52 52" fill="none">
              <circle cx="26" cy="26" r="22" fill="white"/>
              <rect x="13" y="13" width="26" height="26" rx="10" stroke="#0043F1" strokeWidth="2.5" fill="none"/>
              <rect x="16" y="16" width="20" height="20" rx="7" stroke="#0043F1" strokeWidth="1" fill="none" opacity=".3"/>
              <circle cx="22.5" cy="25" r="1.5" fill="#0043F1"/>
              <circle cx="29.5" cy="25" r="1.5" fill="#0043F1"/>
              <path d="M22 29 Q26 33 30 29" stroke="#0043F1" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              <path d="M8 20 Q10 18 12 20 Q11 22 8 20Z" fill="#0043F1" opacity=".2"/>
              <path d="M40 32 Q42 30 44 32 Q43 34 40 32Z" fill="#0043F1" opacity=".2"/>
            </svg>
            <div 
              className="absolute hidden md:block"
              style={{
                top: "-2px",
                right: "-2px",
                width: "6px",
                height: "6px",
                backgroundColor: "white",
                borderRadius: "50%",
                boxShadow: "0 0 4px white"
              }}
            />
          </motion.div>
          <div className="flex items-baseline gap-1 md:gap-2 whitespace-nowrap">
            <span className="font-bold text-[13px] md:text-[15px] text-black transition-colors duration-200 group-hover:text-[#0043F1]">Eba Flights</span>
            <span className="text-[10px] md:text-[11px] text-[#80A1F8]">by Domu</span>
          </div>
        </button>
        <button
          onClick={() => router.push(isLoggedIn ? "/dashboard" : "/login")}
          className="clickable px-4 py-2 md:px-5 md:py-2.5 bg-black text-white text-[13px] md:text-sm font-medium rounded-full hover:bg-gray-800 transition-colors flex-shrink-0"
        >
          {isLoggedIn ? "Go to dashboard →" : "Sign in →"}
        </button>
      </motion.nav>

      {/* HERO */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-5 md:px-8 pt-20 overflow-x-hidden">
        {/* Gradient orbs with parallax */}
        <div 
          className="absolute top-[10%] right-[15%] w-[400px] h-[400px] rounded-full bg-[#80A1F8] opacity-20 blur-[100px]"
          style={{ transform: `translateY(${scrollY * 0.1}px)` }}
        />
        <div 
          className="absolute bottom-[10%] left-[10%] w-[350px] h-[350px] rounded-full bg-[#0043F1] opacity-15 blur-[100px]"
          style={{ transform: `translateY(${scrollY * 0.05}px)` }}
        />

        {/* Floating pills with parallax and hover effects */}
        {floatingPills.map((pill, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05, borderColor: "#0043F1", boxShadow: "0 4px 20px rgba(0,67,241,0.15)" }}
            whileTap={{ scale: 1.1 }}
            transition={{ 
              delay: 0.8 + i * 0.2, 
              duration: 0.5,
              scale: { type: "spring", stiffness: 400, damping: 17 }
            }}
            className={`clickable absolute ${pill.position} hidden md:hidden lg:flex items-center gap-2 px-4 py-2.5 bg-white rounded-full border border-[#0043F1]/20 shadow-sm cursor-pointer`}
            style={{ 
              transform: `translateY(${scrollY * pill.parallaxSpeed}px)`,
              animation: `float-pill-${i} ${pill.floatDuration}s ease-in-out infinite`
            }}
          >
            <div className="w-2 h-2 rounded-full bg-[#0043F1] animate-pulse-dot" />
            <span className="text-xs text-gray-600">{pill.text}</span>
            <span className="text-xs font-semibold text-[#0043F1]">{pill.savings}</span>
          </motion.div>
        ))}

        {/* Hero content */}
        <div className="relative z-10 text-center max-w-3xl mx-auto px-0 md:px-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-[#0043F1] animate-pulse-fast" />
            <span className="text-sm text-gray-600">Built for Domu&apos;s travel team</span>
          </motion.div>

          <h1
            className="font-black text-black mb-6 text-center max-w-[820px] mx-auto hero-title"
          >
            <span className="block">
              {titleLine1.map((word, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.08, duration: 0.5, ease: "easeOut" }}
                  className="inline-block mr-[0.25em]"
                >
                  {word}
                </motion.span>
              ))}
            </span>
            <span className="block">
              <motion.span
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + 2 * 0.08, duration: 0.5, ease: "easeOut" }}
                className="inline-block mr-[0.25em]"
              >
                {titleLine2Word}
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + 3 * 0.08, duration: 0.5, ease: "easeOut" }}
                className="inline-block"
                style={{
                  background: "linear-gradient(135deg, #0043F1, #80A1F8)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text"
                }}
              >
                less.
              </motion.span>
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="text-[15px] md:text-lg text-[#555555] max-w-[500px] mx-auto mb-10 px-4 md:px-0"
          >
            Book flights directly from Slack. Compare routes in seconds. Your CEO gets the savings report every Monday.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4 mb-12 px-6 md:px-0"
          >
            <button
              onClick={handleEnterApp}
              className="clickable group relative w-full md:w-auto px-6 py-3 bg-[#0043F1] text-white font-semibold rounded-full overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#0043F1]/25"
            >
              <span className="relative z-10 inline-flex items-center justify-center gap-2">
                Enter Eba Flights 
                <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
              </span>
              <div className="absolute inset-0 shimmer-button" />
            </button>
            <button
              onClick={scrollToFeatures}
              className="clickable relative w-full md:w-auto px-6 py-3 bg-transparent text-black font-medium rounded-full border border-gray-300 overflow-hidden group hover-border-draw"
            >
              <span className="relative z-10">How it works ↓</span>
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div
            ref={statsRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="flex items-center justify-center gap-4 md:gap-12"
          >
            <div className="text-center">
              <motion.div 
                className="text-[22px] md:text-4xl font-black text-black"
                animate={statsFinished ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                ${savedCount}k
              </motion.div>
              <div className="text-xs md:text-sm text-[#555555]">Saved this month</div>
            </div>
            <div className="w-px h-10 md:h-12 bg-gray-200" />
            <div className="text-center">
              <motion.div 
                className="text-[22px] md:text-4xl font-black text-black"
                animate={statsFinished ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                {tripsCount}
              </motion.div>
              <div className="text-xs md:text-sm text-[#555555]">Trips booked</div>
            </div>
            <div className="w-px h-10 md:h-12 bg-gray-200" />
            <div className="text-center">
              <motion.div 
                className="text-[22px] md:text-4xl font-black text-black"
                animate={statsFinished ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                {reductionCount}%
              </motion.div>
              <div className="text-xs md:text-sm text-[#555555]">Avg reduction</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* MARQUEE */}
      <section className="py-6 bg-[#f5f7ff] overflow-hidden group/marquee">
        <div className="flex marquee-container">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-6 px-6 whitespace-nowrap marquee-content">
              {[
                { iconType: "plane", text: "MIA → NYC · $289" },
                { iconType: "car", text: "MIA → ORL · $65" },
                { iconType: "plane", text: "BOG → MEX · $380" },
                { iconType: "pin", text: "Uber · Smart routing" },
                { iconType: "plane", text: "NYC → SF · $310" },
                { iconType: "chart", text: "Weekly report · Auto" },
                { iconType: "signal", text: "Live tracker · Real-time" },
                { iconType: "plane", text: "One card · All trips" },
              ].map((item, j) => (
                <span 
                  key={j} 
                  className="inline-flex items-center gap-2 text-sm text-gray-600 transition-all duration-200 hover:text-[#0043F1] hover:scale-105 cursor-default"
                >
                  <MarqueeIcon type={item.iconType} />
                  {item.text}
                  <span className="text-[#80A1F8] ml-4">·</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* SLACK DEMO */}
      <SlackDemoSection />

      {/* FEATURES */}
      <section
        ref={featuresRef}
        className="py-12 md:py-24 px-5 md:px-8 overflow-x-hidden"
        style={{
          backgroundColor: "#0A0A0A",
        }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-5xl font-black text-white mb-4">Everything in one place</h2>
            <p className="text-white/45 text-sm md:text-lg">No more screenshots. No more manual data entry.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                ref={(el) => { featureCardRefs.current[i] = el }}
                initial={{ opacity: 0, y: 40 }}
                animate={featuresVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                onMouseMove={(e) => handleFeatureMouseMove(e, i)}
                className="feature-card group p-4 md:p-6 transition-all duration-200 cursor-default relative overflow-hidden"
                style={{
                  backgroundColor: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderTop: `2px solid ${feature.accentColor}`,
                  borderRadius: "12px",
                  ["--mouse-x" as string]: "50%",
                  ["--mouse-y" as string]: "50%",
                }}
              >
                <div className="feature-glow" />
                <div className="relative z-10">
                  {/* Airplane-themed icon in 48px circle */}
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-5"
                    style={{ border: "1.5px solid rgba(255,255,255,0.2)" }}
                  >
                    <FeatureIcon icon={feature.icon} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2" style={{ fontSize: "18px", fontWeight: 700 }}>{feature.title}</h3>
                  <p className="mb-5" style={{ fontSize: "14px", color: "rgba(255,255,255,0.45)" }}>{feature.desc}</p>
                  <div 
                    className="font-bold"
                    style={{ 
                      fontSize: "28px",
                      background: "linear-gradient(135deg, #0043F1, #80A1F8)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text"
                    }}
                  >
                    {feature.metric}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section ref={testimonialsRef} className="py-12 md:py-24 px-5 md:px-8 overflow-x-hidden" style={{ backgroundColor: "#F8F9FF" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">What the team says</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                animate={testimonialsVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="group relative bg-white p-5 md:p-8 transition-all duration-200 cursor-default"
                style={{ 
                  borderRadius: "16px",
                  boxShadow: "0 2px 20px rgba(0,67,241,0.06)",
                  border: "1px solid transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)"
                  e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,67,241,0.12)"
                  e.currentTarget.style.border = "1px solid rgba(0,67,241,0.15)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = "0 2px 20px rgba(0,67,241,0.06)"
                  e.currentTarget.style.border = "1px solid transparent"
                }}
              >
                {/* Decorative quote mark */}
                <div 
                  className="absolute top-4 left-6"
                  style={{ fontSize: "48px", color: "rgba(0,67,241,0.1)", fontFamily: "Georgia, serif", lineHeight: 1 }}
                >
                  &ldquo;
                </div>
                <div className="relative z-10 pt-6">
                  <p className="mb-6" style={{ fontSize: "15px", lineHeight: 1.7, color: "#1a1a1a" }}>&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0043F1] flex items-center justify-center">
                      <span className="text-white font-semibold" style={{ fontSize: "13px" }}>{t.initials}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#000" }}>{t.name}</div>
                      <div style={{ fontSize: "12px", color: "#888" }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section 
        ref={ctaSectionRef}
        onClick={handleCtaClick}
        onMouseEnter={() => setPlaneSpeedUp(true)}
        onMouseLeave={() => setPlaneSpeedUp(false)}
        className="py-12 md:py-24 px-5 md:px-8 relative cursor-pointer overflow-x-hidden"
        style={{
          backgroundColor: "#0043F1",
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "36px 36px"
        }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <div 
            className={`mb-6 ${planeLooping ? "plane-loop" : planeSpeedUp ? "plane-fast" : "plane-float"}`}
          >
            <div 
              className="w-14 h-14 mx-auto flex items-center justify-center relative"
              style={{ 
                borderRadius: "50%", 
                backgroundColor: "white",
                border: "2px solid rgba(255,255,255,0.3)",
                boxShadow: "0 0 40px rgba(255,255,255,0.15)"
              }}
            >
              {/* Eba icon */}
              <svg width="28" height="28" viewBox="0 0 52 52" fill="none">
                <circle cx="26" cy="26" r="22" fill="white"/>
                <rect x="13" y="13" width="26" height="26" rx="10" stroke="#0043F1" strokeWidth="2.5" fill="none"/>
                <rect x="16" y="16" width="20" height="20" rx="7" stroke="#0043F1" strokeWidth="1" fill="none" opacity=".3"/>
                <circle cx="22.5" cy="25" r="1.5" fill="#0043F1"/>
                <circle cx="29.5" cy="25" r="1.5" fill="#0043F1"/>
                <path d="M22 29 Q26 33 30 29" stroke="#0043F1" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                <path d="M8 20 Q10 18 12 20 Q11 22 8 20Z" fill="#0043F1" opacity=".2"/>
                <path d="M40 32 Q42 30 44 32 Q43 34 40 32Z" fill="#0043F1" opacity=".2"/>
              </svg>
            </div>
          </div>
          <h2 className="text-2xl md:text-5xl font-black text-white mb-4">Ready to cut travel costs?</h2>
          <p className="text-white/60 text-sm md:text-lg mb-8">Built for Domu. Live in one week.</p>
          <button
            onClick={(e) => { e.stopPropagation(); handleEnterApp() }}
            className="clickable px-8 py-4 bg-white text-[#0043F1] font-bold rounded-full transition-all hover:scale-105 hover:shadow-xl"
          >
            {isLoggedIn ? "Go to dashboard →" : "Enter Eba Flights →"}
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-4 md:py-6 px-5 md:px-8 bg-white border-t border-gray-100 overflow-x-hidden">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 md:gap-0">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 flex items-center justify-center relative" 
              style={{ 
                borderRadius: "50%", 
                background: "linear-gradient(135deg, #0043F1, #80A1F8)"
              }}
            >
              <svg width="20" height="20" viewBox="0 0 52 52" fill="none">
                <circle cx="26" cy="26" r="22" fill="white"/>
                <rect x="13" y="13" width="26" height="26" rx="10" stroke="#0043F1" strokeWidth="2.5" fill="none"/>
                <rect x="16" y="16" width="20" height="20" rx="7" stroke="#0043F1" strokeWidth="1" fill="none" opacity=".3"/>
                <circle cx="22.5" cy="25" r="1.5" fill="#0043F1"/>
                <circle cx="29.5" cy="25" r="1.5" fill="#0043F1"/>
                <path d="M22 29 Q26 33 30 29" stroke="#0043F1" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                <path d="M8 20 Q10 18 12 20 Q11 22 8 20Z" fill="#0043F1" opacity=".2"/>
                <path d="M40 32 Q42 30 44 32 Q43 34 40 32Z" fill="#0043F1" opacity=".2"/>
              </svg>
              <div 
                className="absolute"
                style={{
                  top: "-1px",
                  right: "-1px",
                  width: "5px",
                  height: "5px",
                  backgroundColor: "white",
                  borderRadius: "50%",
                  boxShadow: "0 0 4px rgba(0,67,241,0.5)"
                }}
              />
            </div>
            <span className="text-sm text-gray-500">Eba Flights by Domu</span>
          </div>
          <span className="text-sm text-gray-400">© 2025 Domu · Internal tool</span>
        </div>
      </footer>

      <style jsx>{`
        /* Hero title responsive styling */
        .hero-title {
          font-size: clamp(36px, 10vw, 84px);
          font-weight: 900;
          letter-spacing: -2.5px;
          line-height: 1.05;
        }
        
        @media (max-width: 768px) {
          .hero-title {
            font-size: clamp(36px, 10vw, 52px);
            letter-spacing: -1.5px;
          }
        }
        
        @keyframes float-pill-0 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes float-pill-1 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes float-pill-2 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes float-pill-3 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes pulse-dot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }
        
        @keyframes pulse-fast {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.6; }
        }
        
        .animate-pulse-dot {
          animation: pulse-dot 2s ease-in-out infinite;
        }
        
        .animate-pulse-fast {
          animation: pulse-fast 1s ease-in-out infinite;
        }
        
        @keyframes shimmer-text {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        
        .shimmer-text {
          background: linear-gradient(90deg, #0043F1 0%, #80A1F8 50%, #0043F1 100%);
          background-size: 200% auto;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer-text 3s linear infinite;
        }
        
        @keyframes shimmer-button {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .shimmer-button {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          animation: shimmer-button 2s ease-in-out infinite;
        }
        
        .hover-border-draw {
          position: relative;
        }
        
        .hover-border-draw::before {
          content: '';
          position: absolute;
          inset: 0;
          border: 2px solid #0043F1;
          border-radius: 9999px;
          clip-path: polygon(0 0, 0 0, 0 100%, 0 100%);
          transition: clip-path 0.4s ease-out;
        }
        
        .hover-border-draw:hover::before {
          clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
        }
        
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        
        .marquee-container {
          animation: marquee 30s linear infinite;
        }
        
        .group\/marquee:hover .marquee-container {
          animation-duration: 60s;
        }
        
        .feature-card {
          position: relative;
        }
        
.feature-card:hover {
          border-color: rgba(255,255,255,0.15) !important;
          box-shadow: 0 0 30px rgba(255,255,255,0.05);
          transform: translateY(-3px);
        }
        
        .feature-glow {
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 0.3s ease;
          background: radial-gradient(
            300px circle at var(--mouse-x) var(--mouse-y),
            rgba(0, 67, 241, 0.15),
            transparent 40%
          );
          pointer-events: none;
        }
        
        .feature-card:hover .feature-glow {
          opacity: 1;
        }
        
        @keyframes plane-float {
          0%, 100% { 
            transform: translateY(0) translateX(0) rotate(-5deg); 
          }
          25% { 
            transform: translateY(-8px) translateX(5px) rotate(0deg); 
          }
          50% { 
            transform: translateY(-12px) translateX(0) rotate(5deg); 
          }
          75% { 
            transform: translateY(-8px) translateX(-5px) rotate(0deg); 
          }
        }
        
        @keyframes plane-fast {
          0%, 100% { 
            transform: translateY(0) translateX(0) rotate(-5deg); 
          }
          25% { 
            transform: translateY(-8px) translateX(5px) rotate(0deg); 
          }
          50% { 
            transform: translateY(-12px) translateX(0) rotate(5deg); 
          }
          75% { 
            transform: translateY(-8px) translateX(-5px) rotate(0deg); 
          }
        }
        
        @keyframes plane-loop {
          0% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-30px) rotate(90deg); }
          50% { transform: translateY(-50px) rotate(180deg); }
          75% { transform: translateY(-30px) rotate(270deg); }
          100% { transform: translateY(0) rotate(360deg); }
        }
        
        .plane-float {
          animation: plane-float 4s ease-in-out infinite;
        }
        
        .plane-fast {
          animation: plane-fast 2s ease-in-out infinite;
        }
        
        .plane-loop {
          animation: plane-loop 1s ease-in-out forwards;
        }
      `}</style>
    </div>
  )
}

// Airplane-themed feature icons - 2.5px stroke, 24px size
function FeatureIcon({ icon }: { icon: string }) {
  const icons: Record<string, React.ReactNode> = {
    // Airplane taking off (nose up 45deg)
    takeoff: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
      </svg>
    ),
    // Route split with arrow (branching path)
    route: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="19" r="3" /><circle cx="18" cy="5" r="3" /><path d="M6 16V8c0-2.2 1.8-4 4-4h4" /><path d="M14 4l4 4-4 4" />
      </svg>
    ),
    // Bar chart with trend line
    report: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" /><path d="M7 16v-4" /><path d="M11 16V8" /><path d="M15 16v-6" /><path d="M19 16V6" /><path d="M3 14l5-5 4 4 8-8" />
      </svg>
    ),
    // Airplane with radar circle
    radar: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" strokeDasharray="4 2" /><circle cx="12" cy="12" r="5" /><path d="M16 8L12 12L8 14L12 12L14 8" />
      </svg>
    ),
    // Person with airplane badge
    traveler: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="7" r="4" /><path d="M4 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" /><path d="M17 8l3 3-3 3" /><path d="M20 11h-6" />
      </svg>
    ),
    // Credit card with airplane embossed
    flightcard: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /><path d="M7 15h3" /><path d="M14 14l3 2-3 2" />
      </svg>
    ),
  }
  return <>{icons[icon] || null}</>
}

// Marquee strip icons - thin 10px SVGs in #0043F1
function MarqueeIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    plane: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0043F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
      </svg>
    ),
    car: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0043F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 16H9M3 11L5 6.5C5.3 5.6 6.1 5 7 5H17C17.9 5 18.7 5.6 19 6.5L21 11" />
        <path d="M21 11H3V16C3 17.1 3.9 18 5 18H19C20.1 18 21 17.1 21 16V11Z" />
        <circle cx="6.5" cy="15.5" r="1.5" /><circle cx="17.5" cy="15.5" r="1.5" />
      </svg>
    ),
    pin: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0043F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
      </svg>
    ),
    chart: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0043F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />
      </svg>
    ),
    signal: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0043F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.9 4.9C1.7 8.1 1.7 13.3 4.9 16.5" /><path d="M7.8 7.8C5.9 9.7 5.9 12.8 7.8 14.7" /><circle cx="12" cy="12" r="2" /><path d="M16.2 7.8C18.1 9.7 18.1 12.8 16.2 14.7" /><path d="M19.1 4.9C22.3 8.1 22.3 13.3 19.1 16.5" />
      </svg>
    ),
  }
  return <>{icons[type] || null}</>
}

// Feature metric count-up component
function FeatureMetric({ metric, visible, delay }: { metric: string; visible: boolean; delay: number }) {
  const [displayValue, setDisplayValue] = useState(metric)
  const numericMatch = metric.match(/^(-?\d+)(.*)$/)
  
  useEffect(() => {
    if (visible && numericMatch) {
      const targetNum = parseInt(numericMatch[1])
      const suffix = numericMatch[2]
      const duration = 1500
      const steps = 30
      const interval = duration / steps
      const startDelay = delay * 1000
      
      setTimeout(() => {
        let step = 0
        const timer = setInterval(() => {
          step++
          const progress = step / steps
          const easeOut = 1 - Math.pow(1 - progress, 3)
          const currentNum = Math.round(targetNum * easeOut)
          setDisplayValue(`${currentNum}${suffix}`)
          
          if (step >= steps) clearInterval(timer)
        }, interval)
      }, startDelay)
    }
  }, [visible, metric, numericMatch, delay])
  
  return (
    <div className="text-3xl font-black bg-gradient-to-r from-[#0043F1] to-white bg-clip-text text-transparent">
      {displayValue}
    </div>
  )
}
