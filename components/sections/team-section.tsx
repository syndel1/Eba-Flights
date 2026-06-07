"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ─── Notion-style avatar ──────────────────────────────────────────────────────

function NotionAvatar({ gender, size = 40 }: { gender: "m" | "f"; size?: number }) {
  const isFemale = gender === "f"
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background circle */}
      <circle cx="20" cy="20" r="20" fill={isFemale ? "#F5E6FF" : "#E6F0FF"} />
      {/* Head */}
      <circle cx="20" cy="15" r="7" fill={isFemale ? "#C084FC" : "#60A5FA"} />
      {/* Body */}
      <path
        d={isFemale
          ? "M8 38c0-6.627 5.373-12 12-12s12 5.373 12 12"
          : "M8 38c0-6.627 5.373-12 12-12s12 5.373 12 12"}
        fill={isFemale ? "#C084FC" : "#60A5FA"}
      />
      {isFemale && (
        // Dress shape
        <path d="M14 26 Q20 22 26 26 L28 38 H12 Z" fill="#E879F9" opacity="0.6" />
      )}
    </svg>
  )
}

// ─── Team data ────────────────────────────────────────────────────────────────

interface TeamMember {
  id: number
  legalName: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  country: string
  gender: "m" | "f"
  initials: string
  role?: string
}

const teamMembers: TeamMember[] = [
  { id: 1,  legalName: "Camila Sayuri Zancanella",      firstName: "Camila Sayuri",   lastName: "Zancanella",       email: "camila@domu.ai",    phone: "", dateOfBirth: "", country: "Brazil",        gender: "f", initials: "CZ", role: "COO & Co-founder" },
  { id: 2,  legalName: "Nicolas Felipe Diaz Rodriguez", firstName: "Nicolas Felipe",  lastName: "Diaz Rodriguez",   email: "nicolas@domu.ai",   phone: "(954) 445-3188", dateOfBirth: "2000-04-27", country: "Colombia",      gender: "m", initials: "ND", role: "CEO & Founder" },
  { id: 3,  legalName: "Robert Choate",                 firstName: "Robert",          lastName: "Choate",           email: "isaac@domu.ai",     phone: "", dateOfBirth: "", country: "United States", gender: "m", initials: "IC" },
  { id: 4,  legalName: "Aidan Connors",                 firstName: "Aidan",           lastName: "Connors",          email: "aidan@domu.ai",     phone: "", dateOfBirth: "", country: "United States", gender: "m", initials: "AC" },
  { id: 5,  legalName: "Ashley Jinju Jung",             firstName: "Ashley Jinju",    lastName: "Jung",             email: "ashley@domu.ai",    phone: "", dateOfBirth: "", country: "United States", gender: "f", initials: "AJ" },
  { id: 6,  legalName: "David Helwich",                 firstName: "David",           lastName: "Helwich",          email: "david@domu.ai",     phone: "", dateOfBirth: "", country: "United States", gender: "m", initials: "DH" },
  { id: 7,  legalName: "Arushi Yana Thakur",            firstName: "Arushi Yana",     lastName: "Thakur",           email: "arushi@domu.ai",    phone: "", dateOfBirth: "", country: "India",         gender: "f", initials: "AY" },
  { id: 8,  legalName: "Apoorva Herle",                 firstName: "Apoorva",         lastName: "Herle",            email: "apoorva@domu.ai",   phone: "", dateOfBirth: "", country: "India",         gender: "f", initials: "AH" },
  { id: 9,  legalName: "Pedro Dias",                    firstName: "Pedro",           lastName: "Dias",             email: "pedro@domu.ai",     phone: "", dateOfBirth: "", country: "United States", gender: "m", initials: "PD" },
  { id: 10, legalName: "Jewel Aw",                      firstName: "Jewel",           lastName: "Aw",               email: "jewel@domu.ai",     phone: "", dateOfBirth: "", country: "Singapore",     gender: "f", initials: "JA" },
  { id: 11, legalName: "Sebastian Mellen",              firstName: "Sebastian",       lastName: "Mellen",           email: "sebastian@domu.ai", phone: "", dateOfBirth: "", country: "United States", gender: "m", initials: "SM" },
  { id: 12, legalName: "Alexandre Sfez",                firstName: "Alexandre",       lastName: "Sfez",             email: "alexsfez@domu.ai",  phone: "", dateOfBirth: "", country: "United States", gender: "m", initials: "AS" },
  { id: 13, legalName: "Cheryl Lim",                    firstName: "Cheryl",          lastName: "Lim",              email: "cheryl@domu.ai",    phone: "", dateOfBirth: "", country: "Singapore",     gender: "f", initials: "CL" },
  { id: 14, legalName: "Kai Takami",                    firstName: "Kai",             lastName: "Takami",           email: "kai@domu.ai",       phone: "", dateOfBirth: "", country: "Japan",         gender: "m", initials: "KT", role: "CTO" },
  { id: 15, legalName: "Angel Yahir Loredo Lopez",      firstName: "Angel Yahir",     lastName: "Loredo Lopez",     email: "angel@domu.ai",     phone: "", dateOfBirth: "", country: "Mexico",        gender: "m", initials: "AL" },
  { id: 16, legalName: "Vitor Hiroshi Zancanella",      firstName: "Vitor Hiroshi",   lastName: "Zancanella",       email: "vitor@domu.ai",     phone: "", dateOfBirth: "", country: "Brazil",        gender: "m", initials: "VZ" },
  { id: 17, legalName: "Maria Alejandra Pulido",        firstName: "Maria Alejandra", lastName: "Pulido",           email: "alejandra@domu.ai", phone: "", dateOfBirth: "", country: "Colombia",      gender: "f", initials: "AP" },
  { id: 18, legalName: "Syndel Callisaya",              firstName: "Syndel",          lastName: "Callisaya",        email: "syndel@domu.ai",    phone: "", dateOfBirth: "", country: "Bolivia",       gender: "f", initials: "SC" },
  { id: 19, legalName: "Manuel Santiago Romero Aragon", firstName: "Manuel Santiago", lastName: "Romero Aragon",    email: "manuel@domu.ai",    phone: "", dateOfBirth: "", country: "Colombia",      gender: "m", initials: "MR" },
  { id: 20, legalName: "Adriana Maria Muñoz Vergara",   firstName: "Adriana Maria",   lastName: "Muñoz Vergara",    email: "adriana@domu.ai",   phone: "", dateOfBirth: "", country: "Colombia",      gender: "f", initials: "AM" },
  { id: 21, legalName: "Andres Felipe Cortes Bello",    firstName: "Andres Felipe",   lastName: "Cortes Bello",     email: "felipe@domu.ai",    phone: "", dateOfBirth: "", country: "Colombia",      gender: "m", initials: "FC", role: "CFO" },
  { id: 22, legalName: "Juan Pablo Garzon Parra",       firstName: "Juan Pablo",      lastName: "Garzon Parra",     email: "juan@domu.ai",      phone: "", dateOfBirth: "", country: "Colombia",      gender: "m", initials: "JG" },
  { id: 23, legalName: "Julieth Sofia Moreno Ahumada",  firstName: "Julieth Sofia",   lastName: "Moreno Ahumada",   email: "sofia@domu.ai",     phone: "", dateOfBirth: "", country: "Colombia",      gender: "f", initials: "SM" },
  { id: 24, legalName: "Ana Maria Fonseca",             firstName: "Ana Maria",       lastName: "Fonseca",          email: "ana@domu.ai",       phone: "", dateOfBirth: "", country: "Colombia",      gender: "f", initials: "AF" },
  { id: 25, legalName: "Lucas Kenji Zancanella",        firstName: "Lucas Kenji",     lastName: "Zancanella",       email: "lucas@domu.ai",     phone: "", dateOfBirth: "", country: "Brazil",        gender: "m", initials: "LZ" },
  { id: 26, legalName: "Marco Antonio Lopez",           firstName: "Marco Antonio",   lastName: "Lopez",            email: "marco@domu.ai",     phone: "", dateOfBirth: "", country: "Mexico",        gender: "m", initials: "ML" },
  { id: 27, legalName: "Miguel Rios Olaya",             firstName: "Miguel",          lastName: "Rios Olaya",       email: "miguel@domu.ai",    phone: "", dateOfBirth: "", country: "Colombia",      gender: "m", initials: "MR" },
  { id: 28, legalName: "Sophia Rogoff",                firstName: "Sophia",           lastName: "Rogoff",           email: "sophierogoff@gmail.com", phone: "(630) 731-9569", dateOfBirth: "2002-04-10", country: "United States", gender: "f", initials: "SR" },
]

const COUNTRY_FLAGS: Record<string, string> = {
  "Brazil": "🇧🇷", "Colombia": "🇨🇴", "United States": "🇺🇸",
  "Japan": "🇯🇵", "India": "🇮🇳", "Singapore": "🇸🇬",
  "Mexico": "🇲🇽", "Bolivia": "🇧🇴",
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TeamSection() {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "female" | "male">("all")

  const filtered = teamMembers.filter((m) => {
    const matchesSearch =
      m.legalName.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.country.toLowerCase().includes(search.toLowerCase())
    const matchesFilter =
      filter === "all" ||
      (filter === "female" && m.gender === "f") ||
      (filter === "male" && m.gender === "m")
    return matchesSearch && matchesFilter
  })

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Team Members</h2>
          <p className="text-sm text-muted-foreground">
            {teamMembers.length} registered travelers ·{" "}
            {teamMembers.filter(m => m.gender === "f").length} women ·{" "}
            {teamMembers.filter(m => m.gender === "m").length} men
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
        {(["all", "female", "male"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all capitalize",
              filter === f ? "bg-black text-white" : "bg-[#EAEAEA] text-gray-600 hover:bg-gray-200"
            )}
          >
            {f === "all" ? "All" : f === "female" ? "Women" : "Men"}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {filtered.map((member, index) => (
          <motion.div
            key={member.id}
            className={cn(
              "bg-white rounded-xl border border-[#EAEAEA] p-4 cursor-pointer transition-all hover:shadow-md hover:border-[#80A1F8]",
              selectedMember?.id === member.id && "ring-2 ring-[#0043F1] border-[#0043F1]"
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
            onClick={() => setSelectedMember(member)}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex flex-col items-center text-center gap-2">
              <NotionAvatar gender={member.gender} size={48} />
              <div>
                <p className="text-sm font-semibold text-black leading-tight">
                  {member.firstName}
                </p>
                <p className="text-xs text-gray-500 truncate">{member.lastName}</p>
              </div>
              <span className="text-sm">{COUNTRY_FLAGS[member.country] ?? "🌍"}</span>
            </div>
          </motion.div>
        ))}
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
              className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8"
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
              <div className="flex flex-col items-center text-center mb-6">
                <NotionAvatar gender={selectedMember.gender} size={72} />
                <h2 className="text-xl font-bold text-black mt-3">{selectedMember.legalName}</h2>
                {selectedMember.role && (
                  <p className="text-sm text-gray-500">{selectedMember.role}</p>
                )}
                <span className="text-lg mt-1">{COUNTRY_FLAGS[selectedMember.country] ?? "🌍"} {selectedMember.country}</span>
              </div>

              {/* Details */}
              <div className="space-y-3">
                <DetailRow icon="✉️" label="Email" value={selectedMember.email} />
                <DetailRow
                  icon="📱"
                  label="Phone"
                  value={selectedMember.phone || "—"}
                  muted={!selectedMember.phone}
                />
                <DetailRow
                  icon="🎂"
                  label="Date of birth"
                  value={selectedMember.dateOfBirth || "—"}
                  muted={!selectedMember.dateOfBirth}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function DetailRow({ icon, label, value, muted }: {
  icon: string; label: string; value: string; muted?: boolean
}) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
      <span className="text-base w-6 flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className={cn("text-sm font-medium truncate", muted ? "text-gray-300" : "text-gray-800")}>
          {value}
        </p>
      </div>
    </div>
  )
}
