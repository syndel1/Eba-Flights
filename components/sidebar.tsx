"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

const navItems = [
  { id: "trip-feed", label: "Trip Feed" },
  { id: "live", label: "Live" },
  { id: "team", label: "Team" },
  { id: "report", label: "Report" },
]

function NavIcon({ id, className }: { id: string; className?: string }) {
  const icons: Record<string, React.ReactNode> = {
    "trip-feed": (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 6h12" /><path d="M5 12h16" /><path d="M5 18h16" />
        <path d="M3 5l2 1.5L3 8l1-1.5L3 5Z" fill="currentColor" />
        <circle cx="2" cy="12" r="1" fill="currentColor" /><circle cx="2" cy="18" r="1" fill="currentColor" />
      </svg>
    ),
    live: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.9 4.9C1.7 8.1 1.7 13.3 4.9 16.5" />
        <path d="M7.8 7.8C5.9 9.7 5.9 12.8 7.8 14.7" />
        <circle cx="12" cy="12" r="2" />
        <path d="M16.2 7.8C18.1 9.7 18.1 12.8 16.2 14.7" />
        <path d="M19.1 4.9C22.3 8.1 22.3 13.3 19.1 16.5" />
      </svg>
    ),
    team: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
        <circle cx="17" cy="7" r="3" /><path d="M21 21v-2a3 3 0 0 0-3-3h-1" />
      </svg>
    ),
    report: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" /><path d="M7 17v-5" /><path d="M11 17V9" /><path d="M15 17v-7" /><path d="M19 17V7" />
        <path d="M4 14l4-4 4 3 8-7" />
      </svg>
    ),
  }
  return <span className={className}>{icons[id] || null}</span>
}

interface SidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const router = useRouter()
  const [userName, setUserName] = useState<string | null>(null)
  const [userInitials, setUserInitials] = useState("?")
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "User"
        setUserName(name)
        setUserInitials(
          name.split(" ").slice(0, 2).map((n: string) => n[0]?.toUpperCase() ?? "").join("")
        )
      }
    })
  }, [])

  async function handleLogout() {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0043F1] flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <motion.div
          className="w-10 h-10 flex items-center justify-center relative"
          style={{
            borderRadius: "50%",
            background: "linear-gradient(135deg, #0043F1, #80A1F8)",
            border: "2px solid rgba(255,255,255,0.3)",
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg width="20" height="20" viewBox="0 0 52 52" fill="none">
            <circle cx="26" cy="26" r="22" fill="white" />
            <rect x="13" y="13" width="26" height="26" rx="10" stroke="#0043F1" strokeWidth="2.5" fill="none" />
            <rect x="16" y="16" width="20" height="20" rx="7" stroke="#0043F1" strokeWidth="1" fill="none" opacity=".3" />
            <circle cx="22.5" cy="25" r="1.5" fill="#0043F1" />
            <circle cx="29.5" cy="25" r="1.5" fill="#0043F1" />
            <path d="M22 29 Q26 33 30 29" stroke="#0043F1" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M8 20 Q10 18 12 20 Q11 22 8 20Z" fill="#0043F1" opacity=".2" />
            <path d="M40 32 Q42 30 44 32 Q43 34 40 32Z" fill="#0043F1" opacity=".2" />
          </svg>
          <div
            className="absolute"
            style={{
              top: "-2px", right: "-2px",
              width: "6px", height: "6px",
              backgroundColor: "white",
              borderRadius: "50%",
              boxShadow: "0 0 4px white",
            }}
          />
        </motion.div>
        <div>
          <h2 className="text-white font-bold text-lg" style={{ letterSpacing: "-0.5px" }}>Eba Flights</h2>
          <p className="text-[#80A1F8] text-xs font-medium">by Domu</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = activeSection === item.id
            return (
              <li key={item.id}>
                <motion.button
                  onClick={() => onSectionChange(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-left",
                    isActive ? "bg-white text-[#0043F1]" : "text-white hover:bg-[#80A1F8]/30"
                  )}
                  whileHover={{ x: isActive ? 0 : 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <NavIcon id={item.id} />
                  <span className="font-medium">{item.label}</span>
                  {item.id === "live" && (
                    <span className="ml-auto relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                    </span>
                  )}
                </motion.button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User + Logout */}
      <div className="p-4 border-t border-[#3366F4]">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div
            className="w-8 h-8 flex items-center justify-center flex-shrink-0 text-[#0043F1] text-xs font-bold"
            style={{
              borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.9)",
            }}
          >
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-[13px] font-medium truncate">{userName ?? "Loading…"}</p>
            <p className="text-[#80A1F8] text-[11px]">@domu.ai</p>
          </div>
        </div>

        <motion.button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[13px] font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
          whileTap={{ scale: 0.97 }}
        >
          {loggingOut ? (
            <>
              <motion.span
                className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
              Signing out…
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign out
            </>
          )}
        </motion.button>
      </div>
    </aside>
  )
}
