"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Send, Sparkles } from "lucide-react"
import { sendChatMessage, type ChatMessage } from "@/lib/api"

interface Message {
  id: string
  text: string
  sender: "user" | "bot"
  timestamp: Date
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm your MindEase companion. How are you feeling today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const handleSend = async () => {
    if (!input.trim() || isTyping) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const currentInput = input
    setInput("")
    setIsTyping(true)
    setError(null)

    try {
      // Convert messages to ChatMessage format for API
      const chatHistory: ChatMessage[] = messages.map((msg) => ({
        sender: msg.sender === "user" ? "user" : "bot",
        text: msg.text,
      }))

      // Call Flask backend API
      const response = await sendChatMessage(currentInput, chatHistory)

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.response,
        sender: "bot",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botMessage])
    } catch (err) {
      console.error("Error sending message:", err)
      setError("Failed to get response. Please make sure the backend server is running.")
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble connecting right now. Please check your internet connection and try again.",
        sender: "bot",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleReset = () => {
    setMessages([
      {
        id: "1",
        text: "Hello! I'm your MindEase companion. How are you feeling today?",
        sender: "bot",
        timestamp: new Date(),
      },
    ])
    setError(null)
  }

  return (
    <div className="min-h-screen py-12 flex flex-col">
      <div className="max-w-4xl mx-auto w-full px-6 flex-1 flex flex-col">
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-5xl md:text-6xl font-black tracking-tight text-white">Wellness Companion</h1>
          <p className="text-xl text-white/60">Your safe space to talk, vent, or seek guidance anytime.</p>
        </div>

        <Card className="flex-1 min-h-[600px] bg-white/5 backdrop-blur-2xl border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col mb-12 shadow-2xl">
          <div className="p-6 border-b border-white/5 bg-white/5 backdrop-blur-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-white">MindEase AI</h3>
                <p className="text-xs text-secondary font-medium uppercase tracking-widest">Always Online</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              onClick={handleReset}
              className="text-white/40 hover:text-white hover:bg-white/5 rounded-xl"
            >
              Reset Chat
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] p-5 rounded-[2rem] text-sm leading-relaxed shadow-lg ${
                    msg.sender === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-white/10 text-white backdrop-blur-md border border-white/10 rounded-tl-none"
                  }`}
                >
                  {msg.text}
                  <div
                    className={`text-[10px] mt-2 opacity-50 ${
                      msg.sender === "user" ? "text-right" : "text-left"
                    } font-mono`}
                  >
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-[2rem] rounded-tl-none">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {error && (
            <div className="px-6 py-2 bg-red-500/20 border-t border-red-500/30">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <div className="p-6 border-t border-white/5 bg-white/5">
            <div className="flex gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                placeholder="Share your thoughts..."
                className="flex-1 bg-white/5 border-white/10 rounded-2xl h-14 px-6 text-white placeholder:text-white/20 focus:ring-primary focus:border-primary transition-all"
              />
              <Button
                onClick={handleSend}
                disabled={isTyping || !input.trim()}
                size="icon"
                className="w-14 h-14 rounded-2xl bg-white text-black hover:bg-white/90 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
