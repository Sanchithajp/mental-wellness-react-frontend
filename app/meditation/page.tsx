"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Play, Pause, RotateCcw, Wind, Focus, Coffee, Plus, Minus } from "lucide-react"

export default function MeditationPage() {
  const [timerMode, setTimerMode] = useState<"focus" | "shortBreak" | "longBreak">("focus")
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isActive, setIsActive] = useState(false)
  const [breathPhase, setBreathPhase] = useState<"Inhale" | "Hold" | "Exhale" | "Hold ">("Inhale")
  const [breathProgress, setBreathProgress] = useState(0)
  const [inhaleDuration, setInhaleDuration] = useState(4)
  const [exhaleDuration, setExhaleDuration] = useState(4)

  const timerConfig = {
    focus: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
  }

  const switchMode = useCallback((mode: "focus" | "shortBreak" | "longBreak") => {
    setTimerMode(mode)
    setTimeLeft(timerConfig[mode])
    setIsActive(false)
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      setIsActive(false)
    }
    return () => clearInterval(interval)
  }, [isActive, timeLeft])

  // Breathing Visualizer Logic (4-4-4-4 Box Breathing)
  useEffect(() => {
    if (!isActive || timerMode !== "focus") return

    const startTime = Date.now()
    const phaseDuration = inhaleDuration * 1000

    const updateBreathing = () => {
      const elapsed = Date.now() - startTime
      const totalCycle = (inhaleDuration + inhaleDuration + exhaleDuration + exhaleDuration) * 1000
      const currentCycleTime = elapsed % totalCycle

      const inhaleMs = inhaleDuration * 1000
      const holdInMs = inhaleDuration * 1000
      const exhaleMs = exhaleDuration * 1000
      const holdExMs = exhaleDuration * 1000

      if (currentCycleTime < inhaleMs) {
        setBreathPhase("Inhale")
        setBreathProgress(currentCycleTime / inhaleMs)
      } else if (currentCycleTime < inhaleMs + holdInMs) {
        setBreathPhase("Hold")
        setBreathProgress(1)
      } else if (currentCycleTime < inhaleMs + holdInMs + exhaleMs) {
        setBreathPhase("Exhale")
        setBreathProgress(1 - (currentCycleTime - inhaleMs - holdInMs) / exhaleMs)
      } else {
        setBreathPhase("Hold ")
        setBreathProgress(0)
      }
    }

    const interval = setInterval(updateBreathing, 16)
    return () => clearInterval(interval)
  }, [isActive, timerMode, inhaleDuration, exhaleDuration])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-5xl md:text-6xl font-black tracking-tight text-white">Focus & Breathe</h1>
          <p className="text-xl text-white/60">Balance productivity with mindful moments of presence.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Pomodoro Section */}
          <div className="space-y-8 order-2 lg:order-1">
            <div className="flex gap-2 justify-center lg:justify-start">
              <Button
                onClick={() => switchMode("focus")}
                variant="ghost"
                className={`rounded-2xl px-6 h-12 transition-all ${
                  timerMode === "focus" ? "bg-white text-black" : "text-white/40 hover:bg-white/10"
                }`}
              >
                <Focus className="w-4 h-4 mr-2" /> Focus
              </Button>
              <Button
                onClick={() => switchMode("shortBreak")}
                variant="ghost"
                className={`rounded-2xl px-6 h-12 transition-all ${
                  timerMode === "shortBreak" ? "bg-white text-black" : "text-white/40 hover:bg-white/10"
                }`}
              >
                <Coffee className="w-4 h-4 mr-2" /> Short Break
              </Button>
              <Button
                onClick={() => switchMode("longBreak")}
                variant="ghost"
                className={`rounded-2xl px-6 h-12 transition-all ${
                  timerMode === "longBreak" ? "bg-white text-black" : "text-white/40 hover:bg-white/10"
                }`}
              >
                <Coffee className="w-4 h-4 mr-2" /> Long Break
              </Button>
            </div>

            <Card className="bg-white/5 backdrop-blur-2xl border-white/10 rounded-[3rem] p-16 text-center shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <span className="text-[10rem] font-black tracking-tighter text-white tabular-nums leading-none">
                  {formatTime(timeLeft)}
                </span>
                <div className="flex justify-center gap-6 mt-12">
                  <Button
                    size="lg"
                    onClick={() => setIsActive(!isActive)}
                    className="w-24 h-24 rounded-full bg-white text-black hover:bg-white/90 shadow-xl transition-transform active:scale-90"
                  >
                    {isActive ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setTimeLeft(timerConfig[timerMode])}
                    className="w-24 h-24 rounded-full border border-white/10 hover:bg-white/5 text-white/40 bg-transparent transition-transform active:rotate-180"
                  >
                    <RotateCcw className="w-6 h-6" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Breathing Visualizer Section */}
          <div className="space-y-8 order-1 lg:order-2 flex flex-col items-center">
            <div className="flex items-center gap-3 px-6 py-2 bg-white/5 rounded-full border border-white/10 text-white/40">
              <Wind className="w-4 h-4" />
              <span className="text-xs font-bold tracking-widest uppercase">Guided Breathing</span>
            </div>

            <div className="relative flex items-center justify-center w-80 h-80">
              {/* Outer ring */}
              <div className="absolute inset-0 rounded-full border border-white/5" />
              <div className="absolute inset-4 rounded-full border border-white/10" />

              {/* Breathing circle */}
              <div
                className="rounded-full bg-primary/20 backdrop-blur-3xl shadow-[0_0_80px_rgba(107,154,196,0.3)] border border-primary/40 transition-all duration-100 ease-linear flex items-center justify-center"
                style={{
                  width: `${60 + breathProgress * 40}%`,
                  height: `${60 + breathProgress * 40}%`,
                }}
              >
                <div className="text-center space-y-1">
                  <span className="text-2xl font-black text-white tracking-tight uppercase leading-none block">
                    {breathPhase}
                  </span>
                  <span className="text-xs text-white/40 font-mono tracking-widest">
                    {Math.ceil(4 - breathProgress * 4)}s
                  </span>
                </div>
              </div>
            </div>

            <div className="w-full max-w-xs space-y-4 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-white">Inhale</label>
                  <span className="text-lg font-black text-primary">{inhaleDuration}s</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setInhaleDuration(Math.max(1, inhaleDuration - 1))}
                    className="flex-1 border-white/10 hover:bg-white/5 text-white/40"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setInhaleDuration(Math.min(8, inhaleDuration + 1))}
                    className="flex-1 border-white/10 hover:bg-white/5 text-white/40"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-white">Exhale</label>
                  <span className="text-lg font-black text-primary">{exhaleDuration}s</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setExhaleDuration(Math.max(1, exhaleDuration - 1))}
                    className="flex-1 border-white/10 hover:bg-white/5 text-white/40"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setExhaleDuration(Math.min(8, exhaleDuration + 1))}
                    className="flex-1 border-white/10 hover:bg-white/5 text-white/40"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="max-w-xs text-center">
              <p className="text-sm text-white/40 leading-relaxed italic">
                Adjust inhale and exhale durations to customize your breathing pattern. Box breathing helps regulate
                your nervous system.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
