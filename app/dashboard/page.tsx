"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { TripFeedSection } from "@/components/sections/trip-feed-section"
import { LiveSection } from "@/components/sections/live-section"
import { TeamSection } from "@/components/sections/team-section"
import { ReportSection } from "@/components/sections/report-section"

const sectionTitles: Record<string, { title: string; subtitle: string }> = {
  "trip-feed": { title: "Trip Feed", subtitle: "All travel requests from Slack" },
  live: { title: "Live Tracker", subtitle: "Real-time status of travelers" },
  team: { title: "Team", subtitle: "Manage your travel team" },
  report: { title: "Reports", subtitle: "Analytics and spending insights" },
}

export default function DashboardPage() {
  const [activeSection, setActiveSection] = useState("trip-feed")
  const current = sectionTitles[activeSection]

  const renderSection = () => {
    switch (activeSection) {
      case "trip-feed": return <TripFeedSection />
      case "live":      return <LiveSection />
      case "team":      return <TeamSection />
      case "report":    return <ReportSection />
      default:          return <TripFeedSection />
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <div className="flex-1 ml-64">
        <TopBar title={current.title} subtitle={current.subtitle} />
        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderSection()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
