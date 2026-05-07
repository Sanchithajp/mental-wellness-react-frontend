"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"

const affirmations = [
  "I am doing my best, and that is more than enough.",
  "I trust myself and the path I am on.",
  "I deserve love, success, and peace—just as I am.",
  "Every day, I grow stronger, wiser, and more confident.",
  "Good things are finding their way to me effortlessly.",
  "I am brave, I am confident, and I am enough.",
]

const CUSTOM_AFFIRMATIONS_KEY = "mindease_custom_affirmations"

const moods = [
  { emoji: "😫", label: "Awful", color: "bg-red-400" },
  { emoji: "😕", label: "Bad", color: "bg-orange-400" },
  { emoji: "😐", label: "Okay", color: "bg-yellow-400" },
  { emoji: "🙂", label: "Good", color: "bg-green-400" },
  { emoji: "😊", label: "Great", color: "bg-emerald-500" },
]

export default function HomePage() {
  const [affirmation, setAffirmation] = useState("")
  const [selectedMood, setSelectedMood] = useState<number | null>(null)
  const [customAffirmations, setCustomAffirmations] = useState<string[]>([])
  const [newAffirmation, setNewAffirmation] = useState("")

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CUSTOM_AFFIRMATIONS_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((item) => typeof item === "string" && item.trim().length > 0)
          setCustomAffirmations(cleaned)
        }
      }
    } catch {
      // Ignore local storage parse issues.
    }
  }, [])

  useEffect(() => {
    const allAffirmations = [...affirmations, ...customAffirmations]
    if (allAffirmations.length === 0) return
    setAffirmation(allAffirmations[Math.floor(Math.random() * allAffirmations.length)])
  }, [customAffirmations])

  const getRandomAffirmation = () => {
    const allAffirmations = [...affirmations, ...customAffirmations]
    if (allAffirmations.length === 0) return
    setAffirmation(allAffirmations[Math.floor(Math.random() * allAffirmations.length)])
  }

  const addCustomAffirmation = () => {
    const value = newAffirmation.trim()
    if (!value) return
    if (customAffirmations.some((item) => item.toLowerCase() === value.toLowerCase())) {
      setNewAffirmation("")
      return
    }
    const updated = [value, ...customAffirmations]
    setCustomAffirmations(updated)
    setNewAffirmation("")
    setAffirmation(value)
    localStorage.setItem(CUSTOM_AFFIRMATIONS_KEY, JSON.stringify(updated))
  }

  return (
    <div className="min-h-screen relative overflow-hidden font-sans selection:bg-primary/40">
      <div className="aurora-container pointer-events-none">
        <div className="aurora-blob aurora-1" />
        <div className="aurora-blob aurora-2" />
        <div className="aurora-blob aurora-3" />
        <div className="absolute inset-0 bg-transparent backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        <div className="text-center space-y-16 animate-fade-in">
          <div className="space-y-4">
            <h1 className="text-7xl md:text-9xl font-black tracking-tightest text-foreground leading-[0.85] drop-shadow-sm">
              MindEase
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto font-medium tracking-tight">
              A light, supportive space for your daily peace.
            </p>
          </div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
            <Card className="bg-white/5 backdrop-blur-3xl border-white/10 p-16 rounded-[4rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] border-t-white/20 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-magenta-500 to-yellow-400 opacity-60" />
              <div className="space-y-10">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20">
                  Daily Affirmation
                </span>
                <h2 className="text-4xl md:text-6xl font-serif italic text-foreground leading-[1.15] text-pretty px-4">
                  "{affirmation}"
                </h2>
                <div className="pt-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={getRandomAffirmation}
                    className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-pink-500 hover:bg-pink-50/50 transition-all rounded-full h-10 px-6 border border-transparent hover:border-pink-100"
                  >
                    Refresh my soul
                  </Button>
                </div>
                <div className="pt-2 max-w-2xl mx-auto space-y-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Add your own affirmation</p>
                  <div className="flex gap-2">
                    <Input
                      value={newAffirmation}
                      onChange={(e) => setNewAffirmation(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addCustomAffirmation()
                        }
                      }}
                      placeholder="e.g. I move through this day with calm and clarity."
                      className="h-11 rounded-2xl border-white/15 bg-white/5 text-foreground placeholder:text-muted-foreground/70"
                    />
                    <Button
                      type="button"
                      onClick={addCustomAffirmation}
                      className="h-11 rounded-2xl px-5 font-bold whitespace-nowrap"
                    >
                      Add
                    </Button>
                  </div>
                  {customAffirmations.length > 0 && (
                    <p className="text-[11px] text-muted-foreground">
                      Your custom affirmations: {customAffirmations.length}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>

          <div className="max-w-xl mx-auto space-y-10 py-12">
            <div className="space-y-3">
              <h3 className="text-2xl font-bold tracking-tight text-white">How are you today?</h3>
              <div className="h-1 w-12 bg-primary/50 mx-auto rounded-full opacity-50 shadow-[0_0_20px_rgba(var(--primary),0.5)]" />
            </div>

            <div className="flex justify-between items-center px-2">
              {moods.map((mood, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedMood(idx)}
                  className="group flex flex-col items-center gap-4 transition-all"
                >
                  <div
                    className={`
                    w-14 h-14 md:w-20 md:h-20 rounded-full flex items-center justify-center text-3xl md:text-4xl
                    transition-all duration-700 ease-out shadow-[0_12px_24px_-8px_rgba(0,0,0,0.3)]
                    ${selectedMood === idx ? `${mood.color} scale-125 ring-8 ring-white/10 -translate-y-2 shadow-[0_0_40px_rgba(255,255,255,0.2)]` : "bg-white/5 border border-white/10 grayscale-[0.8] hover:grayscale-0 hover:scale-110 hover:-translate-y-1 hover:bg-white/10"}
                  `}
                  >
                    {mood.emoji}
                  </div>
                  <span
                    className={`text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${selectedMood === idx ? "text-foreground translate-y-1" : "text-muted-foreground opacity-60"}`}
                  >
                    {mood.label}
                  </span>
                </button>
              ))}
            </div>

            <AnimatePresence>
              {selectedMood !== null && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="pt-8"
                >
                  <Link href="/check-in">
                    <Button
                      size="lg"
                      className="w-full bg-black text-white hover:bg-black/90 rounded-2xl h-16 text-lg font-bold shadow-xl shadow-black/10"
                    >
                      Complete Full Check-In
                    </Button>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12">
            {[
              { label: "Breathe", href: "/meditation", icon: "🌬️" },
              { label: "ASMR", href: "/asmr", icon: "🎧" },
              { label: "Games", href: "/games", icon: "🧩" },
              { label: "Doodle", href: "/doodle", icon: "🎨" },
            ].map((action) => (
              <Link key={action.label} href={action.href}>
                <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl hover:bg-white/10 hover:border-white/20 transition-all text-center space-y-2 group shadow-lg">
                  <span className="text-2xl group-hover:scale-110 transition-transform block drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                    {action.icon}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-widest text-primary group-hover:text-white transition-colors">
                    {action.label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
