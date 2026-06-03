"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, X, Search } from "lucide-react"
import { cn } from "@/lib/utils"

function TeamIcon({ type, color = "#0043F1", size = 20 }: { type: string; color?: string; size?: number }) {
  const icons: Record<string, React.ReactNode> = {
    mail: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    mapPin: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
      </svg>
    ),
    plane: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
      </svg>
    ),
    calendar: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    globe: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  }
  return <span className="flex-shrink-0">{icons[type]}</span>
}

interface TeamMember {
  id: number
  displayName: string
  legalName: string
  workEmail: string
  country: string
  contractType: "US Employee" | "US Contractor" | "Foreign Contractor"
  startDate: string
  initials: string
  trips: number
  role?: string
}

const teamMembers: TeamMember[] = [
  // ── W2 Employees ────────────────────────────────────────────────────────────
  {
    id: 1,
    displayName: "Camila Z.",
    legalName: "Camila Sayuri Zancanella",
    workEmail: "camila@domu.ai",
    country: "Brazil",
    contractType: "US Employee",
    startDate: "Oct 3, 2025",
    initials: "CZ",
    trips: 0,
    role: "COO & Co-founder",
  },
  {
    id: 2,
    displayName: "Nick D.",
    legalName: "Nicolas Felipe Diaz Rodriguez",
    workEmail: "nicolas@domu.ai",
    country: "Colombia",
    contractType: "US Employee",
    startDate: "Oct 3, 2025",
    initials: "ND",
    trips: 0,
    role: "CEO & Founder",
  },
  {
    id: 3,
    displayName: "Isaac C.",
    legalName: "Robert Choate",
    workEmail: "isaac@domu.ai",
    country: "United States",
    contractType: "US Employee",
    startDate: "Aug 18, 2025",
    initials: "IC",
    trips: 0,
  },
  {
    id: 4,
    displayName: "Aidan C.",
    legalName: "Aidan Connors",
    workEmail: "aidan@domu.ai",
    country: "United States",
    contractType: "US Employee",
    startDate: "Jul 1, 2025",
    initials: "AC",
    trips: 0,
  },
  {
    id: 5,
    displayName: "Ashley J.",
    legalName: "Ashley Jinju Jung",
    workEmail: "ashley@domu.ai",
    country: "United States",
    contractType: "US Employee",
    startDate: "Nov 3, 2025",
    initials: "AJ",
    trips: 0,
  },
  {
    id: 6,
    displayName: "David H.",
    legalName: "David Helwich",
    workEmail: "david@domu.ai",
    country: "United States",
    contractType: "US Employee",
    startDate: "Nov 23, 2025",
    initials: "DH",
    trips: 0,
  },
  {
    id: 7,
    displayName: "Arushi Y.",
    legalName: "Arushi Yana Thakur",
    workEmail: "arushi@domu.ai",
    country: "India",
    contractType: "US Employee",
    startDate: "Feb 19, 2026",
    initials: "AY",
    trips: 0,
  },
  {
    id: 8,
    displayName: "Apoorva H.",
    legalName: "Apoorva Herle",
    workEmail: "apoorva@domu.ai",
    country: "India",
    contractType: "US Employee",
    startDate: "Feb 20, 2026",
    initials: "AH",
    trips: 0,
  },
  {
    id: 9,
    displayName: "Pedro D.",
    legalName: "Pedro Dias",
    workEmail: "pedro@domu.ai",
    country: "United States",
    contractType: "US Employee",
    startDate: "Mar 18, 2026",
    initials: "PD",
    trips: 0,
  },
  {
    id: 10,
    displayName: "Jewel A.",
    legalName: "Jewel Aw",
    workEmail: "jewel@domu.ai",
    country: "Singapore",
    contractType: "US Employee",
    startDate: "Jan 13, 2026",
    initials: "JA",
    trips: 0,
  },
  // ── Contractors ─────────────────────────────────────────────────────────────
  {
    id: 11,
    displayName: "Sebastian M.",
    legalName: "Sebastian Mellen",
    workEmail: "sebastian@domu.ai",
    country: "United States",
    contractType: "US Contractor",
    startDate: "Oct 1, 2025",
    initials: "SM",
    trips: 0,
  },
  {
    id: 12,
    displayName: "Alexandre S.",
    legalName: "Alexandre Sfez",
    workEmail: "alexsfez@domu.ai",
    country: "United States",
    contractType: "US Contractor",
    startDate: "Dec 11, 2025",
    initials: "AS",
    trips: 0,
  },
  {
    id: 13,
    displayName: "Cheryl L.",
    legalName: "Cheryl Lim",
    workEmail: "cheryl@domu.ai",
    country: "Singapore",
    contractType: "Foreign Contractor",
    startDate: "Jan 26, 2026",
    initials: "CL",
    trips: 0,
  },
  {
    id: 14,
    displayName: "Kai T.",
    legalName: "Kai Takami",
    workEmail: "kai@domu.ai",
    country: "Japan",
    contractType: "Foreign Contractor",
    startDate: "Jan 1, 2025",
    initials: "KT",
    trips: 0,
    role: "CTO",
  },
  {
    id: 15,
    displayName: "Angel L.",
    legalName: "Angel Yahir Loredo Lopez",
    workEmail: "angel@domu.ai",
    country: "Mexico",
    contractType: "Foreign Contractor",
    startDate: "Sep 10, 2025",
    initials: "AL",
    trips: 0,
  },
  {
    id: 16,
    displayName: "Vitor Z.",
    legalName: "Vitor Hiroshi Zancanella",
    workEmail: "vitor@domu.ai",
    country: "Brazil",
    contractType: "Foreign Contractor",
    startDate: "Jun 25, 2025",
    initials: "VZ",
    trips: 0,
  },
  {
    id: 17,
    displayName: "Alejandra P.",
    legalName: "Maria Alejandra Pulido",
    workEmail: "alejandra@domu.ai",
    country: "Colombia",
    contractType: "Foreign Contractor",
    startDate: "May 1, 2025",
    initials: "AP",
    trips: 0,
  },
  {
    id: 18,
    displayName: "Syndel C.",
    legalName: "Syndel Callisaya",
    workEmail: "syndel@domu.ai",
    country: "Bolivia",
    contractType: "Foreign Contractor",
    startDate: "Apr 10, 2025",
    initials: "SC",
    trips: 0,
  },
  {
    id: 19,
    displayName: "Manuel R.",
    legalName: "Manuel Santiago Romero Aragon",
    workEmail: "manuel@domu.ai",
    country: "Colombia",
    contractType: "Foreign Contractor",
    startDate: "Jul 26, 2025",
    initials: "MR",
    trips: 0,
  },
  {
    id: 20,
    displayName: "Adriana M.",
    legalName: "Adriana Maria Muñoz Vergara",
    workEmail: "adriana@domu.ai",
    country: "Colombia",
    contractType: "Foreign Contractor",
    startDate: "Oct 1, 2025",
    initials: "AM",
    trips: 0,
  },
  {
    id: 21,
    displayName: "Felipe C.",
    legalName: "Andres Felipe Cortes Bello",
    workEmail: "felipe@domu.ai",
    country: "Colombia",
    contractType: "Foreign Contractor",
    startDate: "Oct 1, 2025",
    initials: "FC",
    trips: 0,
    role: "CFO",
  },
  {
    id: 22,
    displayName: "Juan G.",
    legalName: "Juan Pablo Garzon Parra",
    workEmail: "juan@domu.ai",
    country: "Colombia",
    contractType: "Foreign Contractor",
    startDate: "Nov 4, 2025",
    initials: "JG",
    trips: 0,
  },
  {
    id: 23,
    displayName: "Sofia M.",
    legalName: "Julieth Sofia Moreno Ahumada",
    workEmail: "sofia@domu.ai",
    country: "Colombia",
    contractType: "Foreign Contractor",
    startDate: "Nov 7, 2025",
    initials: "SM",
    trips: 0,
  },
  {
    id: 24,
    displayName: "Ana F.",
    legalName: "Ana Maria Fonseca",
    workEmail: "ana@domu.ai",
    country: "Colombia",
    contractType: "Foreign Contractor",
    startDate: "Jan 28, 2026",
    initials: "AF",
    trips: 0,
  },
  {
    id: 25,
    displayName: "Lucas Z.",
    legalName: "Lucas Kenji Zancanella",
    workEmail: "lucas@domu.ai",
    country: "Brazil",
    contractType: "Foreign Contractor",
    startDate: "Nov 7, 2025",
    initials: "LZ",
    trips: 0,
  },
  {
    id: 26,
    displayName: "Marco L.",
    legalName: "Marco Antonio Lopez",
    workEmail: "marco@domu.ai",
    country: "Mexico",
    contractType: "Foreign Contractor",
    startDate: "Mar 14, 2026",
    initials: "ML",
    trips: 0,
  },
  {
    id: 27,
    displayName: "Miguel R.",
    legalName: "Miguel Rios Olaya",
    workEmail: "miguel@domu.ai",
    country: "Colombia",
    contractType: "Foreign Contractor",
    startDate: "Jan 1, 2026",
    initials: "MR",
    trips: 0,
  },
]

const contractTypeColors: Record<TeamMember["contractType"], { bg: string; text: string }> = {
  "US Employee":       { bg: "#EEF2FF", text: "#0043F1" },
  "US Contractor":     { bg: "#ECFDF5", text: "#059669" },
  "Foreign Contractor": { bg: "#FFF7ED", text: "#C2410C" },
}

const COUNTRY_FLAGS: Record<string, string> = {
  "Brazil": "🇧🇷",
  "Colombia": "🇨🇴",
  "United States": "🇺🇸",
  "Japan": "🇯🇵",
  "India": "🇮🇳",
  "Singapore": "🇸🇬",
  "Mexico": "🇲🇽",
  "Bolivia": "🇧🇴",
}

export function TeamSection() {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "employee" | "contractor">("all")

  const filtered = teamMembers.filter((m) => {
    const matchesSearch =
      m.legalName.toLowerCase().includes(search.toLowerCase()) ||
      m.workEmail.toLowerCase().includes(search.toLowerCase()) ||
      m.country.toLowerCase().includes(search.toLowerCase())
    const matchesFilter =
      filter === "all" ||
      (filter === "employee" && m.contractType === "US Employee") ||
      (filter === "contractor" && m.contractType !== "US Employee")
    return matchesSearch && matchesFilter
  })

  const w2Count = teamMembers.filter((m) => m.contractType === "US Employee").length
  const contractorCount = teamMembers.filter((m) => m.contractType !== "US Employee").length

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Team Members</h2>
          <p className="text-sm text-muted-foreground">
            {teamMembers.length} registered travelers · {w2Count} W2s · {contractorCount} contractors
          </p>
        </div>
        <Button className="bg-[#0043F1] hover:bg-[#0035C0] text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add Traveler
        </Button>
      </div>

      {/* Search + filter */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, country…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-[#EAEAEA] rounded-full focus:outline-none focus:border-[#0043F1] transition-colors"
          />
        </div>
        {(["all", "employee", "contractor"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all capitalize",
              filter === f ? "bg-black text-white" : "bg-[#EAEAEA] text-gray-600 hover:bg-gray-200"
            )}
          >
            {f === "all" ? "All" : f === "employee" ? "W2 Employees" : "Contractors"}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map((member, index) => {
          const typeStyle = contractTypeColors[member.contractType]
          const flag = COUNTRY_FLAGS[member.country] ?? "🌍"
          return (
            <motion.div
              key={member.id}
              className={cn(
                "bg-white rounded-xl border border-[#EAEAEA] p-4 cursor-pointer transition-all hover:shadow-md hover:border-[#80A1F8]",
                selectedMember?.id === member.id && "ring-2 ring-[#0043F1] border-[#0043F1]"
              )}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => setSelectedMember(member)}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #0043F1, #80A1F8)" }}
                >
                  {member.initials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-black truncate">{member.legalName.split(" ").slice(0, 2).join(" ")}</p>
                  {member.role && <p className="text-[11px] text-gray-500 truncate">{member.role}</p>}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                  style={{ backgroundColor: typeStyle.bg, color: typeStyle.text }}
                >
                  {member.contractType === "US Employee" ? "W2" : member.contractType === "US Contractor" ? "US Contractor" : "Intl. Contractor"}
                </span>
                <span className="text-sm">{flag}</span>
              </div>
            </motion.div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400 text-sm">No members match your search.</div>
      )}

      {/* Detail modal */}
      <AnimatePresence>
        {selectedMember && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div className="absolute inset-0 bg-black/50" onClick={() => setSelectedMember(null)} />
            <motion.div
              className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
            >
              <button
                onClick={() => setSelectedMember(null)}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>

              {/* Avatar + name */}
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #0043F1, #80A1F8)" }}
                >
                  {selectedMember.initials}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-black">{selectedMember.legalName}</h2>
                  {selectedMember.role && <p className="text-sm text-gray-500">{selectedMember.role}</p>}
                  <span
                    className="inline-block mt-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                    style={{
                      backgroundColor: contractTypeColors[selectedMember.contractType].bg,
                      color: contractTypeColors[selectedMember.contractType].text,
                    }}
                  >
                    {selectedMember.contractType}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <TeamIcon type="mail" color="#6B7280" size={16} />
                  <span className="text-gray-700">{selectedMember.workEmail}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <TeamIcon type="globe" color="#6B7280" size={16} />
                  <span className="text-gray-700">
                    {COUNTRY_FLAGS[selectedMember.country] ?? "🌍"} {selectedMember.country}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <TeamIcon type="calendar" color="#6B7280" size={16} />
                  <span className="text-gray-700">Started {selectedMember.startDate}</span>
                </div>
              </div>

              {/* Trips stat */}
              <div className="mt-6 bg-[#EEF2FF] rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <TeamIcon type="plane" color="#0043F1" size={18} />
                  <p className="text-3xl font-bold text-[#0043F1]">{selectedMember.trips}</p>
                </div>
                <p className="text-sm text-gray-500">Trips booked via Eba</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
