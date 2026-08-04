"use client"

import { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

// ─── Types ────────────────────────────────────────────────────────────────────

type Sender = "syndel" | "eba" | "felipe"

interface Message {
  id: number
  sender: Sender
  content: string | "SCREENSHOT"
  delay: number   // ms from start of sequence
}

// ─── Conversation sequence ────────────────────────────────────────────────────

const SEQUENCE: Message[] = [
  { id: 1,  sender: "syndel",  content: "SCREENSHOT", delay: 400 },
  { id: 2,  sender: "eba",     content: "¡Hola! Encontré el vuelo ✈️\n\n*BOG → MIA* · Dom 28 Jun · Economy\nAmerican Airlines · ~$391 USD\n\n¿Para quién es este vuelo?", delay: 2400 },
  { id: 3,  sender: "syndel",  content: "Para mí, Syndel", delay: 4200 },
  { id: 4,  sender: "eba",     content: "✅ *Syndel Callisaya* encontrada en la base de datos.\n🎂 DOB: 1997-04-10 · 🌍 Bolivia\n\n✈️ BOG → MIA · Jun 28\n\n¿Aprobamos este vuelo? — *Felipe C.*", delay: 6000 },
  { id: 5,  sender: "felipe",  content: "sí, aprobado ✓", delay: 8200 },
  { id: 6,  sender: "eba",     content: "✅ *¡Vuelo confirmado!*\n\n🎫 Referencia: `AA7X2K`\n✈️ BOG → MIA · American Airlines\n👤 Syndel Callisaya\n\n_Check-in automático 24h antes._", delay: 10200 },
]

const LOOP_DURATION = 14_000

// ─── Avatar helpers ───────────────────────────────────────────────────────────

const SENDERS = {
  syndel: { name: "Syndel C.",  initials: "SC", color: "#7C3AED" },
  felipe: { name: "Felipe C.",  initials: "FC", color: "#059669" },
  eba:    { name: "eba-superwoman", initials: "E", color: null },
}

function Avatar({ sender }: { sender: Sender }) {
  const s = SENDERS[sender]
  if (sender === "eba") {
    return (
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
        style={{ background: "linear-gradient(135deg, #0043F1, #80A1F8)" }}
      >
        <svg width="16" height="16" viewBox="0 0 52 52" fill="none">
          <circle cx="26" cy="26" r="22" fill="white" opacity="0.9"/>
          <rect x="13" y="13" width="26" height="26" rx="10" stroke="#0043F1" strokeWidth="2.5" fill="none"/>
          <circle cx="22.5" cy="25" r="1.5" fill="#0043F1"/>
          <circle cx="29.5" cy="25" r="1.5" fill="#0043F1"/>
          <path d="M22 29 Q26 33 30 29" stroke="#0043F1" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        </svg>
      </div>
    )
  }
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
      style={{ backgroundColor: s.color! }}
    >
      {s.initials}
    </div>
  )
}

// ─── Flight screenshot mockup ─────────────────────────────────────────────────

function FlightScreenshot() {
  return (
    <div
      className="rounded-xl border border-gray-200 bg-white p-3 max-w-[260px] shadow-sm"
      style={{ fontSize: "11px" }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">American Airlines</span>
        <span className="text-[10px] text-gray-400">Economy</span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <div className="text-center">
          <div className="text-lg font-black text-black">BOG</div>
          <div className="text-[10px] text-gray-400">8:30 AM</div>
        </div>
        <div className="flex-1 flex flex-col items-center">
          <div className="text-[9px] text-gray-400 mb-0.5">4h 50m · Nonstop</div>
          <div className="relative w-full flex items-center">
            <div className="flex-1 h-px bg-gray-200" />
            <svg className="w-3 h-3 text-gray-400 mx-1" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
            </svg>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
        </div>
        <div className="text-center">
          <div className="text-lg font-black text-black">MIA</div>
          <div className="text-[10px] text-gray-400">11:20 AM</div>
        </div>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className="text-[10px] text-gray-500">Dom, Jun 28</span>
        <span className="font-black text-[#0043F1] text-sm">~$391</span>
      </div>
    </div>
  )
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function formatContent(text: string) {
  return text.split("\n").map((line, i) => {
    const parts = line.split(/(\*[^*]+\*|`[^`]+`)/g).map((part, j) => {
      if (part.startsWith("*") && part.endsWith("*"))
        return <strong key={j}>{part.slice(1, -1)}</strong>
      if (part.startsWith("`") && part.endsWith("`"))
        return <code key={j} className="bg-gray-100 px-1 rounded text-[11px] font-mono">{part.slice(1, -1)}</code>
      if (part.startsWith("_") && part.endsWith("_"))
        return <em key={j}>{part.slice(1, -1)}</em>
      return part
    })
    return <span key={i}>{parts}{i < text.split("\n").length - 1 && <br />}</span>
  })
}

function MessageBubble({ msg }: { msg: Message }) {
  const s = SENDERS[msg.sender]
  const isEba = msg.sender === "eba"

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex gap-2.5 items-start"
    >
      <Avatar sender={msg.sender} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span
            className="text-xs font-bold"
            style={{ color: isEba ? "#0043F1" : s.color ?? "#1d1d1f" }}
          >
            {s.name}
          </span>
          {isEba && (
            <span
              className="text-[9px] font-medium px-1.5 py-0.5 rounded"
              style={{ background: "#EEF2FF", color: "#0043F1" }}
            >
              App
            </span>
          )}
          <span className="text-[10px] text-gray-400">Ahora</span>
        </div>
        {msg.content === "SCREENSHOT" ? (
          <FlightScreenshot />
        ) : (
          <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-line">
            {formatContent(msg.content)}
          </p>
        )}
      </div>
    </motion.div>
  )
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex gap-2.5 items-center"
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "linear-gradient(135deg, #0043F1, #80A1F8)" }}
      >
        <svg width="14" height="14" viewBox="0 0 52 52" fill="none">
          <circle cx="26" cy="26" r="22" fill="white" opacity="0.9"/>
          <rect x="13" y="13" width="26" height="26" rx="10" stroke="#0043F1" strokeWidth="2.5" fill="none"/>
          <circle cx="22.5" cy="25" r="1.5" fill="#0043F1"/>
          <circle cx="29.5" cy="25" r="1.5" fill="#0043F1"/>
          <path d="M22 29 Q26 33 30 29" stroke="#0043F1" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        </svg>
      </div>
      <div className="flex items-center gap-1 px-3 py-2 bg-gray-100 rounded-xl">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-gray-400"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </motion.div>
  )
}

// ─── Main demo component ──────────────────────────────────────────────────────

export function SlackDemoSection() {
  const [visibleIds, setVisibleIds] = useState<number[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [started, setStarted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLDivElement>(null)

  const runSequence = () => {
    setVisibleIds([])
    setIsTyping(false)

    SEQUENCE.forEach((msg, i) => {
      // Show typing indicator before each Eba message
      if (msg.sender === "eba") {
        setTimeout(() => setIsTyping(true), msg.delay - 1200)
      }
      setTimeout(() => {
        setIsTyping(false)
        setVisibleIds((prev) => [...prev, msg.id])
      }, msg.delay)
    })
  }

  // Start when section enters viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started) {
          setStarted(true)
          runSequence()
        }
      },
      { threshold: 0.3 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [started])

  // Auto-loop
  useEffect(() => {
    if (!started) return
    const interval = setInterval(runSequence, LOOP_DURATION)
    return () => clearInterval(interval)
  }, [started])

  // Scroll to bottom as messages appear
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [visibleIds, isTyping])

  const visible = SEQUENCE.filter((m) => visibleIds.includes(m.id))

  return (
    <section ref={sectionRef} className="py-16 md:py-24 px-5 md:px-8 bg-white overflow-x-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 md:mb-14">
          <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">How it works</span>
          <h2 className="text-2xl md:text-5xl font-black text-black mt-3 mb-4">
            Book a flight in Slack.
            <br />
            <span style={{ background: "linear-gradient(135deg, #0043F1, #80A1F8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Done in 30 seconds.
            </span>
          </h2>
          <p className="text-gray-500 text-sm md:text-base max-w-md mx-auto">
            Send a screenshot, say who it&apos;s for. Eba looks up the traveler, asks Felipe to approve, and books automatically.
          </p>
        </div>

        {/* Two column layout */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center justify-center">
          {/* Steps */}
          <div className="flex flex-col gap-5 w-full md:w-56 flex-shrink-0">
            {[
              { n: "01", title: "Send screenshot", desc: "Any flight from any site" },
              { n: "02", title: "Eba reads it", desc: "Extracts airline, route, price" },
              { n: "03", title: "Says who it's for", desc: "One reply. Eba has the rest." },
              { n: "04", title: "Felipe approves", desc: "One word in the thread" },
              { n: "05", title: "Booked", desc: "PNR sent back to Slack" },
            ].map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                viewport={{ once: true }}
                className="flex gap-3 items-start"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0 mt-0.5"
                  style={{ background: "linear-gradient(135deg, #0043F1, #80A1F8)", color: "white" }}
                >
                  {step.n}
                </div>
                <div>
                  <p className="text-sm font-bold text-black">{step.title}</p>
                  <p className="text-xs text-gray-400">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Slack mock window */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="w-full max-w-[420px] rounded-2xl overflow-hidden shadow-2xl border border-gray-200 flex-shrink-0"
            style={{ minHeight: "460px" }}
          >
            {/* Slack titlebar */}
            <div className="bg-[#3F0E40] px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                <div className="w-3 h-3 rounded-full bg-[#28C840]" />
              </div>
              <div className="flex-1 flex items-center justify-center gap-1.5">
                <span className="text-white/60 text-xs">#</span>
                <span className="text-white text-xs font-semibold">travel</span>
                <span className="text-white/40 text-xs ml-2">· Domu</span>
              </div>
            </div>

            {/* Messages area */}
            <div
              className="bg-white p-4 flex flex-col gap-3 overflow-y-auto"
              style={{ minHeight: "400px", maxHeight: "400px" }}
            >
              {visible.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
              <AnimatePresence>
                {isTyping && <TypingIndicator />}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
