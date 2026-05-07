"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Navigation from "@/components/navigation"
import CompanionOrb from "@/components/companion-orb"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <>
      <div className="aurora-container fixed inset-0 overflow-hidden pointer-events-none">
        <div className="aurora-blob aurora-1 absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#6B9AC4]/20 blur-[120px] rounded-full animate-pulse" />
        <div className="aurora-blob aurora-2 absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#A3C9A8]/20 blur-[120px] rounded-full animate-pulse [animation-delay:2s]" />
        <div className="aurora-blob aurora-3 absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-[#FFCAB1]/10 blur-[120px] rounded-full animate-pulse [animation-delay:4s]" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 w-full max-w-7xl mx-auto px-6">{children}</main>
      </div>
      <CompanionOrb />
    </>
  )
}
