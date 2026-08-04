"use client"

import { useState } from "react"
import { Suspense } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

function LoginContent() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      router.push("/dashboard")
      router.refresh()
    } else {
      setError("Contraseña incorrecta.")
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-white px-4"
      style={{
        backgroundImage: "radial-gradient(circle, rgba(0,67,241,0.06) 1px, transparent 1px)",
        backgroundSize: "36px 36px",
      }}
    >
      {/* Gradient orbs */}
      <div className="fixed top-[15%] right-[20%] w-[300px] h-[300px] rounded-full bg-[#80A1F8] opacity-15 blur-[80px] pointer-events-none" />
      <div className="fixed bottom-[15%] left-[15%] w-[250px] h-[250px] rounded-full bg-[#0043F1] opacity-10 blur-[80px] pointer-events-none" />

      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Card */}
        <div
          className="bg-white rounded-2xl p-10 text-center"
          style={{
            border: "1.5px solid rgba(0,67,241,0.1)",
            boxShadow: "0 8px 40px rgba(0,67,241,0.08)",
          }}
        >
          {/* Logo */}
          <motion.div
            className="w-16 h-16 mx-auto mb-5 flex items-center justify-center relative"
            style={{
              borderRadius: "50%",
              background: "linear-gradient(135deg, #0043F1, #80A1F8)",
            }}
            initial={{ rotate: -180, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <svg width="32" height="32" viewBox="0 0 52 52" fill="none">
              <circle cx="26" cy="26" r="22" fill="white" />
              <rect x="13" y="13" width="26" height="26" rx="10" stroke="#0043F1" strokeWidth="2.5" fill="none" />
              <rect x="16" y="16" width="20" height="20" rx="7" stroke="#0043F1" strokeWidth="1" fill="none" opacity=".3" />
              <circle cx="22.5" cy="25" r="1.5" fill="#0043F1" />
              <circle cx="29.5" cy="25" r="1.5" fill="#0043F1" />
              <path d="M22 29 Q26 33 30 29" stroke="#0043F1" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M8 20 Q10 18 12 20 Q11 22 8 20Z" fill="#0043F1" opacity=".2" />
              <path d="M40 32 Q42 30 44 32 Q43 34 40 32Z" fill="#0043F1" opacity=".2" />
            </svg>
            {/* Sparkle */}
            <div
              className="absolute"
              style={{
                top: "-2px", right: "-2px",
                width: "8px", height: "8px",
                backgroundColor: "white",
                borderRadius: "50%",
                boxShadow: "0 0 6px rgba(0,67,241,0.4)",
              }}
            />
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <h1 className="text-2xl font-black text-black mb-1" style={{ letterSpacing: "-0.5px" }}>
              Eba Flights
            </h1>
            <p className="text-sm text-[#80A1F8] font-medium mb-8">by Domu</p>
          </motion.div>

          {/* Error message */}
          {error && (
            <motion.div
              className="mb-6 px-4 py-3 rounded-xl text-sm font-medium"
              style={{
                backgroundColor: "#FEF2F2",
                border: "1.5px solid #FCA5A5",
                color: "#DC2626",
              }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              {error}
            </motion.div>
          )}

          {/* Password form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              autoFocus
              className="w-full py-3.5 px-5 rounded-full text-sm text-center outline-none transition-all"
              style={{ border: "1.5px solid rgba(0,67,241,0.15)" }}
            />
            <motion.button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3.5 rounded-full font-semibold text-white text-sm flex items-center justify-center gap-3 transition-all disabled:opacity-60"
              style={{ backgroundColor: "#0043F1" }}
              whileHover={{ scale: loading ? 1 : 1.02, boxShadow: "0 8px 24px rgba(0,67,241,0.3)" }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
            >
              {loading ? (
                <>
                  <motion.span
                    className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  />
                  Entrando…
                </>
              ) : (
                "Entrar"
              )}
            </motion.button>
          </form>

          <p className="mt-6 text-xs text-gray-400">Acceso interno · Domu</p>
        </div>
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
