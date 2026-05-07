"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import MoodSelector from "@/components/mood-selector"
import CheckInHistory from "@/components/check-in-history"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"

interface CheckInEntry {
  id: string
  mood: string
  notes: string
  timestamp: Date
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"

export default function CheckInPage() {
  const [selectedMood, setSelectedMood] = useState<string>("")
  const [notes, setNotes] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [history, setHistory] = useState<CheckInEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notificationEmail, setNotificationEmail] = useState<string | null>(null)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)

  const moods = [
    { emoji: "😊", label: "Great", value: "great" },
    { emoji: "🙂", label: "Good", value: "good" },
    { emoji: "😐", label: "Neutral", value: "neutral" },
    { emoji: "😔", label: "Sad", value: "sad" },
    { emoji: "😤", label: "Stressed", value: "stressed" },
  ]

  useEffect(() => {
    // Load notification preferences from localStorage (shared with Settings page)
    try {
      const savedEmail = localStorage.getItem("notificationEmail")
      const savedNotifications = localStorage.getItem("notifications") !== "false"
      if (savedEmail) {
        setNotificationEmail(savedEmail)
      }
      setNotificationsEnabled(savedNotifications)
    } catch (e) {
      console.error("Failed to read notification settings from localStorage", e)
    }

    const fetchHistory = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const res = await fetch(`${BACKEND_URL}/api/checkins`)
        if (!res.ok) {
          throw new Error(`Failed to load history (${res.status})`)
        }

        const data = await res.json()
        const items = (data.items || []) as Array<{
          id: number | string
          mood: string
          notes: string
          created_at: string
        }>

        const mapped: CheckInEntry[] = items.map((item) => ({
          id: String(item.id),
          mood: item.mood,
          notes: item.notes,
          timestamp: new Date(item.created_at),
        }))

        setHistory(mapped)
      } catch (err) {
        console.error("Failed to fetch check-in history", err)
        setError("Could not load your previous check-ins. They will still be saved locally during this session.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchHistory()
  }, [])

  const handleSubmit = async () => {
    if (!selectedMood || !notes.trim()) return

    const moodEmoji = moods.find((m) => m.value === selectedMood)?.emoji || "😐"

    const optimisticEntry: CheckInEntry = {
      id: `temp-${Date.now()}`,
      mood: moodEmoji,
      notes,
      timestamp: new Date(),
    }

    setHistory((prev) => [optimisticEntry, ...prev])
    setSubmitted(true)
    setSelectedMood("")
    setNotes("")
    setTimeout(() => setSubmitted(false), 3000)

    try {
      setError(null)
      const res = await fetch(`${BACKEND_URL}/api/checkins`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mood: moodEmoji,
          notes: optimisticEntry.notes,
          email: notificationsEnabled && notificationEmail ? notificationEmail : undefined,
        }),
      })

      if (!res.ok) {
        throw new Error(`Failed to save check-in (${res.status})`)
      }

      const saved = await res.json()
      const savedEntry: CheckInEntry = {
        id: String(saved.id),
        mood: saved.mood,
        notes: saved.notes,
        timestamp: new Date(saved.created_at),
      }

      setHistory((prev) => {
        const withoutOptimistic = prev.filter((e) => e.id !== optimisticEntry.id)
        return [savedEntry, ...withoutOptimistic]
      })
    } catch (err) {
      console.error("Failed to persist check-in", err)
      setError("Your check-in was added locally but could not be saved to the server.")
    }
  }

  const getMoodScore = (mood: string): number => {
    const scores: Record<string, number> = {
      "😊": 5,
      "🙂": 4,
      "😐": 3,
      "😔": 2,
      "😤": 2,
      "😌": 4,
    }
    return scores[mood] || 3
  }

  const moodData = [...history]
    .reverse()
    .slice(-7)
    .map((entry, index) => ({
      day: new Date(entry.timestamp).toLocaleDateString("en-US", { weekday: "short" }),
      mood: getMoodScore(entry.mood),
      emoji: entry.mood,
    }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="animate-slide-up space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-foreground">Daily Check-In</h1>
            <p className="text-muted-foreground">How are you feeling today? Take a moment to reflect.</p>
          </div>

          <div className="bg-card rounded-2xl p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">What's your mood today?</h2>
              <MoodSelector moods={moods} selectedMood={selectedMood} onMoodChange={setSelectedMood} />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-3">What's on your mind?</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Share your thoughts, feelings, or anything on your mind..."
                className="w-full p-4 rounded-xl border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={5}
              />
            </div>

            <div className="flex gap-4 items-center">
              <Button
                onClick={handleSubmit}
                disabled={!selectedMood || !notes.trim()}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl py-6 text-base font-medium"
              >
                Submit Check-In
              </Button>
              {isLoading && <span className="text-xs text-muted-foreground">Loading your history...</span>}
            </div>

            {(submitted || error) && (
              <div className="space-y-2">
                {submitted && (
                  <div className="p-4 bg-secondary/20 border border-secondary rounded-xl text-center">
                    <p className="text-secondary-foreground font-medium">
                      Thank you for checking in. Your journey matters.
                    </p>
                  </div>
                )}
                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/40 rounded-xl text-xs text-destructive">
                    {error}
                  </div>
                )}
              </div>
            )}
          </div>

          {moodData.length > 0 && (
            <div className="bg-white/60 backdrop-blur-md rounded-3xl p-8 shadow-sm border border-white/40">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-1">Mood Analysis</h2>
                  <p className="text-sm text-muted-foreground">Your mood trends this week</p>
                </div>
                <ChartContainer
                  config={{
                    mood: {
                      label: "Mood",
                      color: "oklch(80% 0.12 340)",
                    },
                  }}
                  className="h-[300px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={moodData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(90% 0.02 240)" opacity={0.3} />
                      <XAxis
                        dataKey="day"
                        tick={{ fill: "oklch(45% 0.02 250)", fontSize: 12, fontWeight: 600 }}
                        stroke="oklch(88% 0.02 240)"
                      />
                      <YAxis
                        domain={[1, 5]}
                        ticks={[1, 2, 3, 4, 5]}
                        tick={{ fill: "oklch(45% 0.02 250)", fontSize: 12, fontWeight: 600 }}
                        stroke="oklch(88% 0.02 240)"
                      />
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white/90 backdrop-blur-md border border-border rounded-2xl px-4 py-3 shadow-xl">
                                <p className="text-sm font-bold text-foreground">{payload[0].payload.day}</p>
                                <p className="text-2xl">{payload[0].payload.emoji}</p>
                                <p className="text-xs text-muted-foreground">Mood Score: {payload[0].value}</p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="mood"
                        stroke="oklch(80% 0.12 340)"
                        strokeWidth={3}
                        dot={{ fill: "oklch(80% 0.12 340)", r: 6, strokeWidth: 2, stroke: "#fff" }}
                        activeDot={{ r: 8, stroke: "#fff", strokeWidth: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </div>
          )}

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Recent Check-Ins</h2>
            <CheckInHistory history={history} />
          </div>
        </div>
      </div>
    </div>
  )
}
