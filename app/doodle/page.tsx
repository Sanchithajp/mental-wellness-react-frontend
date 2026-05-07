"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Trash2, Download, Eraser, Pen } from "lucide-react"

export default function DoodlePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState("#FFFFFF")
  const [brushSize, setBrushSize] = useState(5)
  const [mode, setMode] = useState<"pen" | "eraser">("pen")

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext("2d")
    if (!context) return

    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect()
      if (rect) {
        canvas.width = rect.width
        canvas.height = rect.height
        // Keep drawing clear on resize (ideally would save data)
        context.lineCap = "round"
        context.lineJoin = "round"
      }
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)
    return () => window.removeEventListener("resize", resizeCanvas)
  }, [])

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true)
    draw(e)
  }

  const stopDrawing = () => {
    const context = canvasRef.current?.getContext("2d")
    context?.beginPath()
    setIsDrawing(false)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    const context = canvas?.getContext("2d")
    if (!canvas || !context) return

    const rect = canvas.getBoundingClientRect()
    let clientX, clientY

    if ("touches" in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    const x = clientX - rect.left
    const y = clientY - rect.top

    context.lineWidth = brushSize
    context.strokeStyle = mode === "eraser" ? "#000000" : color
    // If eraser, we use globalCompositeOperation to clear pixels if background was transparent,
    // but here we are drawing on a dark surface. To make it simpler for a "wellness" app:
    if (mode === "eraser") {
      context.globalCompositeOperation = "destination-out"
    } else {
      context.globalCompositeOperation = "source-over"
    }

    context.lineTo(x, y)
    context.stroke()
    context.beginPath()
    context.moveTo(x, y)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const context = canvas?.getContext("2d")
    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  const downloadImage = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const link = document.createElement("a")
      link.download = "mindease-doodle.png"
      link.href = canvas.toDataURL()
      link.click()
    }
  }

  const colors = ["#FFFFFF", "#6B9AC4", "#A3C9A8", "#FFCAB1", "#F87171", "#FBBF24"]

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-5xl md:text-6xl font-black tracking-tight text-white">Doodle Pad</h1>
          <p className="text-xl text-white/60">Let your creativity flow. Draw freely and clear your mind.</p>
        </div>

        <div className="grid lg:grid-cols-[1fr_280px] gap-8">
          <Card className="relative aspect-video bg-black/40 backdrop-blur-2xl border-white/10 rounded-[2.5rem] overflow-hidden cursor-crosshair group">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-full block"
            />

            {/* Overlay instruction */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold tracking-widest uppercase text-white/40 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
              Tap and drag to draw
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="p-6 bg-white/5 backdrop-blur-xl border-white/10 rounded-3xl space-y-8">
              <div className="space-y-4">
                <h4 className="text-xs font-bold tracking-widest uppercase text-white/40">Tools</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => setMode("pen")}
                    variant={mode === "pen" ? "default" : "secondary"}
                    className={`rounded-xl h-12 ${mode === "pen" ? "bg-white text-black" : "bg-white/5 hover:bg-white/10 text-white"}`}
                  >
                    <Pen className="w-4 h-4 mr-2" /> Pen
                  </Button>
                  <Button
                    onClick={() => setMode("eraser")}
                    variant={mode === "eraser" ? "default" : "secondary"}
                    className={`rounded-xl h-12 ${mode === "eraser" ? "bg-white text-black" : "bg-white/5 hover:bg-white/10 text-white"}`}
                  >
                    <Eraser className="w-4 h-4 mr-2" /> Eraser
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold tracking-widest uppercase text-white/40">Colors</h4>
                <div className="grid grid-cols-3 gap-3">
                  {colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setColor(c)
                        setMode("pen")
                      }}
                      className={`w-full aspect-square rounded-xl border-2 transition-all ${
                        color === c && mode === "pen"
                          ? "border-white scale-110"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold tracking-widest uppercase text-white/40">Brush Size</h4>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number.parseInt(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-white"
                />
              </div>

              <div className="pt-4 space-y-3">
                <Button
                  onClick={downloadImage}
                  className="w-full rounded-xl h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                >
                  <Download className="w-4 h-4 mr-2" /> Save Doodle
                </Button>
                <Button
                  onClick={clearCanvas}
                  variant="outline"
                  className="w-full rounded-xl h-12 border-white/10 hover:bg-white/5 text-white/60 font-bold bg-transparent"
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Clear All
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
