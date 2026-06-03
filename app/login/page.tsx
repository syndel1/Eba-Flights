"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { motion } from "framer-motion"

export default function LoginPage() {
  const searchParams = useSearchParams()
  const errorParam = searchParams.get("error")
  const [loading, setLoading] = useState(false)

  const errorMessage =
    errorParam === "restricted"
      ? "Access restricted to Domu team"
      : errorParam === "auth_failed"
      ? "Authentication failed. Please try again."
      : null

  async function handleGoogleSignIn() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    // Loading stays true while browser redirects
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
          {errorMessage && (
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
              {errorMessage}
            </motion.div>
          )}

          {/* Sign in button */}
          <motion.button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3.5 rounded-full font-semibold text-white text-sm flex items-center justify-center gap-3 transition-all disabled:opacity-60"
            style={{ backgroundColor: "#0043F1" }}
            whileHover={{ scale: loading ? 1 : 1.02, boxShadow: "0 8px 24px rgba(0,67,241,0.3)" }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            {loading ? (
              <>
                <motion.span
                  className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
                Redirecting…
              </>
            ) : (
              <>
                {/* Google G icon */}
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="rgba(255,255,255,0.8)" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="rgba(255,255,255,0.6)" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="rgba(255,255,255,0.7)" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
              </>
            )}
          </motion.button>

          <p className="mt-6 text-xs text-gray-400">
            Only <span className="font-medium text-gray-500">@domu.ai</span> accounts can access this tool
          </p>
        </div>
      </motion.div>
    </div>
  )
}
