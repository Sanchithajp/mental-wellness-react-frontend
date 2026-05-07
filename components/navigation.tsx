"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
const navItems = [
  { href: "/", label: "Home" },
  { href: "/asmr", label: "ASMR" },
  { href: "/games", label: "Games" },
  { href: "/chatbot", label: "Companion" },
  { href: "/doodle", label: "Doodle" },
  { href: "/resources", label: "Resources" },
  { href: "/playlist", label: "Music" },
  { href: "/meditation", label: "Breathe" },
  { href: "/settings", label: "Settings" },
]

export default function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-40 w-full bg-black/40 backdrop-blur-2xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-8">
          <Link href="/" className="text-2xl font-black tracking-tighter text-white shrink-0">
            MindEase
          </Link>
          <div className="flex gap-1 overflow-x-auto no-scrollbar scroll-smooth">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase transition-all whitespace-nowrap",
                  pathname === item.href ? "bg-white text-black" : "text-white/60 hover:text-white hover:bg-white/10",
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
