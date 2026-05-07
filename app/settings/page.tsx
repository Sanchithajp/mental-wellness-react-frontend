"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function SettingsPage() {
  const [fontSize, setFontSize] = useState("base")
  const [notifications, setNotifications] = useState(true)
  const [email, setEmail] = useState("")
  const [saving, setSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"

  function applyFontSizeToDocument(size: string) {
    const root = document.documentElement
    root.dataset.fontSize = size

    const sizeMap: Record<string, string> = {
      sm: "14px",
      base: "16px",
      lg: "18px",
      xl: "20px",
    }
    root.style.fontSize = sizeMap[size] ?? sizeMap.base
  }

  useEffect(() => {
    setMounted(true)
    const savedFontSize = localStorage.getItem("fontSize") || "base"
    const savedNotifications = localStorage.getItem("notifications") !== "false"
    const savedEmail = localStorage.getItem("notificationEmail") || ""

    setFontSize(savedFontSize)
    setNotifications(savedNotifications)
    setEmail(savedEmail)
    applyFontSizeToDocument(savedFontSize)
  }, [])

  if (!mounted) return null

  const handleFontSizeChange = (size: string) => {
    setFontSize(size)
    localStorage.setItem("fontSize", size)
    applyFontSizeToDocument(size)
  }

  const handleNotificationsChange = () => {
    const newNotifications = !notifications
    setNotifications(newNotifications)
    localStorage.setItem("notifications", newNotifications.toString())
  }

  const handleSaveNotifications = async () => {
    if (!email || !email.includes("@")) {
      setStatusMessage("Please enter a valid email address.")
      return
    }

    try {
      setSaving(true)
      setStatusMessage(null)
      localStorage.setItem("notificationEmail", email)

      const res = await fetch(`${BACKEND_URL}/api/notifications/test-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      })

      if (!res.ok) {
        throw new Error(`Failed to send test email (${res.status})`)
      }

      setStatusMessage("Notification settings saved. A test email has been sent to your inbox.")
    } catch (err) {
      console.error("Failed to save notification settings", err)
      setStatusMessage("Could not send a test email. Please check your backend configuration.")
    } finally {
      setSaving(false)
    }
  }

  const handleDataReset = () => {
    if (confirm("Are you sure? This will clear all your check-in history.")) {
      localStorage.clear()
      alert("Your data has been reset.")
    }
  }

  const fontSizeOptions = [
    { label: "Small", value: "sm" },
    { label: "Base", value: "base" },
    { label: "Large", value: "lg" },
    { label: "Extra Large", value: "xl" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="animate-slide-up space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground">Customize your wellness experience.</p>
          </div>

          <div className="space-y-4">
            {/* Font Size Setting */}
            <div className="bg-card p-6 rounded-2xl border border-border">
              <h3 className="font-semibold text-foreground mb-4">Font Size</h3>
              <div className="grid grid-cols-2 gap-3">
                {fontSizeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleFontSizeChange(option.value)}
                    className={`py-3 px-4 rounded-lg font-medium transition-all ${
                      fontSize === option.value
                        ? "bg-foreground text-background"
                        : "bg-muted text-foreground hover:bg-muted/80"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notifications Setting */}
            <div className="bg-card p-6 rounded-2xl border border-border space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Email Notifications</h3>
                  <p className="text-sm text-muted-foreground">
                    Receive reminders and updates directly in your Gmail inbox.
                  </p>
                </div>
                <button
                  onClick={handleNotificationsChange}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    notifications ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      notifications ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">Notification Email (Gmail)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@gmail.com"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button
                  onClick={handleSaveNotifications}
                  disabled={!notifications || saving}
                  className="w-full rounded-lg mt-2"
                >
                  {saving ? "Saving..." : "Save & Send Test Email"}
                </Button>
                {statusMessage && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {statusMessage}
                  </p>
                )}
              </div>
            </div>

            {/* Data Reset */}
            <div className="bg-card p-6 rounded-2xl border border-border space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-1">Reset Data</h3>
                <p className="text-sm text-muted-foreground">Clear all your check-in history and settings.</p>
              </div>
              <Button
                onClick={handleDataReset}
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-lg w-full font-semibold bg-transparent"
              >
                Reset All Data
              </Button>
            </div>
          </div>

          <div className="bg-secondary/10 border border-secondary/30 rounded-2xl p-6">
            <h3 className="font-semibold text-foreground mb-2">About MindEase</h3>
            <p className="text-sm text-muted-foreground mb-4">
              A mental wellness companion designed to support your emotional well-being journey.
            </p>
            <p className="text-xs text-muted-foreground">Version 1.0.0 • Built with care for your wellness</p>
          </div>
        </div>
      </div>
    </div>
  )
}
