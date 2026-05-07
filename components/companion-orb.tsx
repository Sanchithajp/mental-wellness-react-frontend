"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"

export default function CompanionOrb() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [mood, setMood] = useState<"happy" | "neutral" | "sad">("happy")

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  // Calculate eye look direction
  const orbRef = useRef<HTMLDivElement>(null)
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!orbRef.current) return
    const rect = orbRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const angle = Math.atan2(mousePos.y - centerY, mousePos.x - centerX)
    const distance = 4 // subtle movement

    setEyeOffset({
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
    })
  }, [mousePos])

  return (
    <div className="fixed bottom-10 right-10 z-50">
      <motion.div
        ref={orbRef}
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 4,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        className="relative w-28 h-28 cursor-pointer group"
        onClick={() => {
          const moods: ("happy" | "neutral" | "sad")[] = ["happy", "neutral", "sad"]
          const nextMood = moods[(moods.indexOf(mood) + 1) % moods.length]
          setMood(nextMood)
        }}
      >
        <div className="absolute inset-0 rounded-full bg-white blur-[2px]" />
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#FFD1DC] via-[#E0F7FA] to-[#FFF9C4] opacity-80 mix-blend-multiply group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 rounded-full shadow-[0_0_40px_rgba(255,255,255,0.6),inset_0_0_20px_rgba(255,209,220,0.4)]" />

        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
          <div
            className="flex gap-4 transition-transform duration-100 ease-out"
            style={{ transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)` }}
          >
            {/* Eyes */}
            <div className="w-1.5 h-3 bg-black/80 rounded-full" />
            <div className="w-1.5 h-3 bg-black/80 rounded-full" />
          </div>

          {/* Mouth */}
          <motion.div
            animate={{
              height: mood === "happy" ? 4 : mood === "neutral" ? 1 : 2,
              width: mood === "sad" ? 10 : 8,
              borderRadius: mood === "happy" ? "0 0 100px 100px" : "100px",
            }}
            className="mt-2 bg-black/80"
          />
        </div>

        {/* Glow effect around the orb */}
        <div className="absolute -inset-4 bg-white/20 blur-2xl rounded-full -z-10 group-hover:bg-white/30 transition-colors" />
      </motion.div>
    </div>
  )
}
