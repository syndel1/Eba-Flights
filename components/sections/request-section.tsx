"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Plane, 
  CalendarDays, 
  Users, 
  ArrowRight,
  MapPin,
  Check
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

const travelers = [
  { id: 1, name: "Camila Zancanella", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face", initials: "CZ" },
  { id: 2, name: "Nick Diaz", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face", initials: "ND" },
  { id: 3, name: "Kai Takami", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face", initials: "KT" },
  { id: 4, name: "Felipe Cortés", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face", initials: "FC" },
]

const preferences = ["Overnight flight", "Non-stop", "Window seat", "Extra legroom", "Meal included"]

export function RequestSection() {
  const [origin, setOrigin] = useState("")
  const [destination, setDestination] = useState("")
  const [departDate, setDepartDate] = useState<Date>()
  const [returnDate, setReturnDate] = useState<Date>()
  const [selectedTravelers, setSelectedTravelers] = useState<number[]>([1])
  const [tripType, setTripType] = useState<"sales" | "engineering">("sales")
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([])

  const toggleTraveler = (id: number) => {
    setSelectedTravelers(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  const togglePreference = (pref: string) => {
    setSelectedPreferences(prev =>
      prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <motion.div
      className="max-w-3xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className="bg-card rounded-2xl shadow-sm border border-border p-8"
        variants={itemVariants}
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#0043F1]/10 flex items-center justify-center">
            <Plane className="h-6 w-6 text-[#0043F1]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">New Travel Request</h2>
            <p className="text-sm text-muted-foreground">Fill in the details for your trip</p>
          </div>
        </div>

        {/* Origin & Destination */}
        <motion.div 
          className="grid grid-cols-2 gap-4 mb-6"
          variants={itemVariants}
        >
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Origin</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="e.g. SFO, San Francisco"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="pl-10 h-12 bg-muted/50 border-border focus:border-[#0043F1] focus:ring-[#0043F1] transition-all"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Destination</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0043F1]" />
              <Input
                placeholder="e.g. JFK, New York"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="pl-10 h-12 bg-muted/50 border-border focus:border-[#0043F1] focus:ring-[#0043F1] transition-all"
              />
            </div>
          </div>
        </motion.div>

        {/* Dates */}
        <motion.div 
          className="grid grid-cols-2 gap-4 mb-6"
          variants={itemVariants}
        >
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Departure Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-12 justify-start text-left font-normal bg-muted/50 border-border hover:border-[#0043F1] transition-all",
                    !departDate && "text-muted-foreground"
                  )}
                >
                  <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                  {departDate ? format(departDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={departDate}
                  onSelect={setDepartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Return Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-12 justify-start text-left font-normal bg-muted/50 border-border hover:border-[#0043F1] transition-all",
                    !returnDate && "text-muted-foreground"
                  )}
                >
                  <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                  {returnDate ? format(returnDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={returnDate}
                  onSelect={setReturnDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </motion.div>

        {/* Travelers */}
        <motion.div className="mb-6" variants={itemVariants}>
          <Label className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Select Travelers
          </Label>
          <div className="flex flex-wrap gap-3 mt-2">
            {travelers.map((traveler) => {
              const isSelected = selectedTravelers.includes(traveler.id)
              return (
                <motion.button
                  key={traveler.id}
                  onClick={() => toggleTraveler(traveler.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all",
                    isSelected 
                      ? "border-[#0043F1] bg-[#0043F1]/5" 
                      : "border-border hover:border-[#80A1F8]"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={traveler.avatar} />
                    <AvatarFallback className="bg-[#80A1F8] text-white text-xs">{traveler.initials}</AvatarFallback>
                  </Avatar>
                  <span className={cn(
                    "text-sm font-medium",
                    isSelected ? "text-[#0043F1]" : "text-foreground"
                  )}>
                    {traveler.name}
                  </span>
                  {isSelected && (
                    <Check className="h-4 w-4 text-[#0043F1]" />
                  )}
                </motion.button>
              )
            })}
          </div>
        </motion.div>

        {/* Trip Type Toggle */}
        <motion.div className="mb-6" variants={itemVariants}>
          <Label className="text-sm font-medium text-foreground mb-3 block">Trip Type</Label>
          <div className="flex gap-2">
            {(["sales", "engineering"] as const).map((type) => (
              <motion.button
                key={type}
                onClick={() => setTripType(type)}
                className={cn(
                  "px-6 py-3 rounded-xl font-medium capitalize transition-all",
                  tripType === type
                    ? "bg-[#0043F1] text-white"
                    : "bg-muted text-foreground hover:bg-muted/80"
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {type}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Preferences */}
        <motion.div className="mb-8" variants={itemVariants}>
          <Label className="text-sm font-medium text-foreground mb-3 block">Preferences</Label>
          <div className="flex flex-wrap gap-2">
            {preferences.map((pref) => {
              const isSelected = selectedPreferences.includes(pref)
              return (
                <motion.button
                  key={pref}
                  onClick={() => togglePreference(pref)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all",
                    isSelected
                      ? "bg-[#80A1F8] text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  )}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {pref}
                </motion.button>
              )
            })}
          </div>
        </motion.div>

        {/* Submit Button */}
        <motion.div variants={itemVariants}>
          <Button
            className="w-full h-14 bg-[#0043F1] hover:bg-[#0035C0] text-white text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            Submit Request
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
