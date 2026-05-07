"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Play, Pause, Volume2, Waves, Plus, Check } from "lucide-react"

type SoundOption = {
  id: string
  name: string
  category: "Nature" | "Cozy" | "Focus"
  description: string
  engine: "rain" | "wind" | "snow" | "fire" | "stream" | "forest" | "drone"
}

const SOUND_OPTIONS: SoundOption[] = [
  {
    id: "rain",
    name: "Gentle Rain",
    category: "Nature",
    description: "Soft steady rain bed.",
    engine: "rain",
  },
  {
    id: "wind",
    name: "Windy Breeze",
    category: "Nature",
    description: "Airy, smooth wind movement.",
    engine: "wind",
  },
  {
    id: "snow",
    name: "Soft Snowfall",
    category: "Nature",
    description: "Quiet, hushed winter texture.",
    engine: "snow",
  },
  {
    id: "stream",
    name: "Mountain Stream",
    category: "Nature",
    description: "Flowing water for deep focus.",
    engine: "stream",
  },
  {
    id: "forest",
    name: "Night Forest",
    category: "Nature",
    description: "Forest ambience with distant birds.",
    engine: "forest",
  },
  {
    id: "fire",
    name: "Fire Crackling",
    category: "Cozy",
    description: "Warm fireplace crackle.",
    engine: "fire",
  },
  {
    id: "heater",
    name: "Cozy Room Hum",
    category: "Cozy",
    description: "Low room hum and warmth.",
    engine: "drone",
  },
  {
    id: "deep-focus",
    name: "Deep Focus Drone",
    category: "Focus",
    description: "Steady low drone for concentration.",
    engine: "drone",
  },
  {
    id: "night-air",
    name: "Night Air",
    category: "Focus",
    description: "Quiet dark ambience for sleep.",
    engine: "wind",
  },
]

type Voice = {
  gain: GainNode
  cleanup: () => void
}

export default function PlaylistPage() {
  const [mixName, setMixName] = useState("My Focus Mix")
  const [isPlaying, setIsPlaying] = useState(false)
  const [masterVolume, setMasterVolume] = useState(75)
  const [enabledSounds, setEnabledSounds] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(SOUND_OPTIONS.map((sound) => [sound.id, false])),
  )
  const [soundVolumes, setSoundVolumes] = useState<Record<string, number>>(() =>
    Object.fromEntries(SOUND_OPTIONS.map((sound) => [sound.id, 70])),
  )
  const contextRef = useRef<AudioContext | null>(null)
  const masterRef = useRef<GainNode | null>(null)
  const voicesRef = useRef<Record<string, Voice>>({})

  const createNoise = (ctx: AudioContext, seconds = 2) => {
    const frames = Math.floor(ctx.sampleRate * seconds)
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < frames; i += 1) {
      data[i] = Math.random() * 2 - 1
    }
    const src = ctx.createBufferSource()
    src.buffer = buffer
    src.loop = true
    return src
  }

  const makeVoice = (ctx: AudioContext, sound: SoundOption, destination: AudioNode): Voice => {
    const gain = ctx.createGain()
    gain.gain.value = 0
    gain.connect(destination)

    if (sound.engine === "drone") {
      const osc = ctx.createOscillator()
      const oscGain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.value = sound.id === "deep-focus" ? 90 : 120
      oscGain.gain.value = 0.2
      osc.connect(oscGain)
      oscGain.connect(gain)
      osc.start()
      return {
        gain,
        cleanup: () => {
          osc.stop()
          osc.disconnect()
          oscGain.disconnect()
          gain.disconnect()
        },
      }
    }

    const noise = createNoise(ctx, 3)
    const filter = ctx.createBiquadFilter()
    filter.type = "lowpass"
    filter.frequency.value = 1800
    const preGain = ctx.createGain()
    preGain.gain.value = 0.45
    noise.connect(filter)
    filter.connect(preGain)
    preGain.connect(gain)

    if (sound.engine === "wind") {
      filter.frequency.value = 900
      const mod = ctx.createOscillator()
      const modGain = ctx.createGain()
      mod.frequency.value = 0.1
      modGain.gain.value = 220
      mod.connect(modGain)
      modGain.connect(filter.frequency)
      mod.start()
      noise.start()
      return {
        gain,
        cleanup: () => {
          mod.stop()
          noise.stop()
          mod.disconnect()
          modGain.disconnect()
          noise.disconnect()
          filter.disconnect()
          preGain.disconnect()
          gain.disconnect()
        },
      }
    }

    if (sound.engine === "snow") {
      filter.frequency.value = 500
      preGain.gain.value = 0.25
      noise.start()
      return {
        gain,
        cleanup: () => {
          noise.stop()
          noise.disconnect()
          filter.disconnect()
          preGain.disconnect()
          gain.disconnect()
        },
      }
    }

    if (sound.engine === "fire") {
      filter.frequency.value = 2600
      preGain.gain.value = 0.18
      const crackle = ctx.createOscillator()
      const crackleGain = ctx.createGain()
      crackle.type = "square"
      crackle.frequency.value = 4
      crackleGain.gain.value = 0.03
      crackle.connect(crackleGain)
      crackleGain.connect(gain.gain)
      crackle.start()
      noise.start()
      return {
        gain,
        cleanup: () => {
          crackle.stop()
          noise.stop()
          crackle.disconnect()
          crackleGain.disconnect()
          noise.disconnect()
          filter.disconnect()
          preGain.disconnect()
          gain.disconnect()
        },
      }
    }

    if (sound.engine === "stream") {
      filter.frequency.value = 1400
      preGain.gain.value = 0.35
      const lfo = ctx.createOscillator()
      const lfoGain = ctx.createGain()
      lfo.type = "sine"
      lfo.frequency.value = 0.22
      lfoGain.gain.value = 0.06
      lfo.connect(lfoGain)
      lfoGain.connect(gain.gain)
      lfo.start()
      noise.start()
      return {
        gain,
        cleanup: () => {
          lfo.stop()
          noise.stop()
          lfo.disconnect()
          lfoGain.disconnect()
          noise.disconnect()
          filter.disconnect()
          preGain.disconnect()
          gain.disconnect()
        },
      }
    }

    if (sound.engine === "forest") {
      filter.frequency.value = 1200
      preGain.gain.value = 0.25
      const bird = ctx.createOscillator()
      const birdGain = ctx.createGain()
      bird.type = "triangle"
      bird.frequency.value = 1300
      birdGain.gain.value = 0.05
      bird.connect(birdGain)
      birdGain.connect(gain)
      bird.start()
      noise.start()
      return {
        gain,
        cleanup: () => {
          bird.stop()
          noise.stop()
          bird.disconnect()
          birdGain.disconnect()
          noise.disconnect()
          filter.disconnect()
          preGain.disconnect()
          gain.disconnect()
        },
      }
    }

    // rain
    filter.frequency.value = 1700
    preGain.gain.value = 0.35
    noise.start()
    return {
      gain,
      cleanup: () => {
        noise.stop()
        noise.disconnect()
        filter.disconnect()
        preGain.disconnect()
        gain.disconnect()
      },
    }
  }

  useEffect(() => {
    return () => {
      for (const voice of Object.values(voicesRef.current)) {
        voice.cleanup()
      }
      voicesRef.current = {}
      masterRef.current?.disconnect()
      void contextRef.current?.close()
      masterRef.current = null
      contextRef.current = null
    }
  }, [])

  const ensureContext = async () => {
    if (!contextRef.current) {
      const ctx = new window.AudioContext()
      const master = ctx.createGain()
      master.gain.value = masterVolume / 100
      master.connect(ctx.destination)
      contextRef.current = ctx
      masterRef.current = master
      const voices: Record<string, Voice> = {}
      for (const sound of SOUND_OPTIONS) {
        voices[sound.id] = makeVoice(ctx, sound, master)
      }
      voicesRef.current = voices
    }
    if (contextRef.current.state === "suspended") {
      await contextRef.current.resume()
    }
  }

  const selectedCount = useMemo(
    () => Object.values(enabledSounds).filter(Boolean).length,
    [enabledSounds],
  )
  const soundsByCategory = useMemo(
    () => ({
      Nature: SOUND_OPTIONS.filter((sound) => sound.category === "Nature"),
      Cozy: SOUND_OPTIONS.filter((sound) => sound.category === "Cozy"),
      Focus: SOUND_OPTIONS.filter((sound) => sound.category === "Focus"),
    }),
    [],
  )

  const applyVolumes = () => {
    if (masterRef.current) {
      masterRef.current.gain.setTargetAtTime(masterVolume / 100, contextRef.current?.currentTime ?? 0, 0.05)
    }
    for (const sound of SOUND_OPTIONS) {
      const voice = voicesRef.current[sound.id]
      if (!voice) continue
      const target = enabledSounds[sound.id] && isPlaying ? (soundVolumes[sound.id] ?? 0) / 100 : 0
      voice.gain.gain.setTargetAtTime(target, contextRef.current?.currentTime ?? 0, 0.08)
    }
  }

  const startMix = async () => {
    await ensureContext()
    applyVolumes()
    setIsPlaying(true)
  }

  const stopMix = () => {
    for (const voice of Object.values(voicesRef.current)) {
      voice.gain.gain.setTargetAtTime(0, contextRef.current?.currentTime ?? 0, 0.05)
    }
    setIsPlaying(false)
  }

  const resetMix = () => {
    stopMix()
    setMasterVolume(75)
    setSoundVolumes(Object.fromEntries(SOUND_OPTIONS.map((sound) => [sound.id, 70])))
    setEnabledSounds(Object.fromEntries(SOUND_OPTIONS.map((sound) => [sound.id, false])))
  }

  useEffect(() => {
    applyVolumes()
  }, [enabledSounds, soundVolumes, masterVolume, isPlaying])

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-6 space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-5xl md:text-6xl font-black tracking-tight text-white">Nature + ASMR Mixer</h1>
          <p className="text-lg text-white/60 max-w-3xl mx-auto">
            Build your own relaxing soundscape by combining multiple nature and ASMR sounds, then tune each layer with
            custom volume controls.
          </p>
        </div>

        <Card className="p-6 rounded-3xl bg-white/5 border-white/10">
          <div className="grid lg:grid-cols-[1fr_auto] gap-6 items-center">
            <div className="space-y-3">
              <label htmlFor="mix-name" className="text-xs font-bold tracking-widest uppercase text-white/45">
                Mix name
              </label>
              <Input
                id="mix-name"
                value={mixName}
                onChange={(e) => setMixName(e.target.value)}
                placeholder="Name your custom mix"
                className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/35"
              />
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <Waves className="w-4 h-4" />
                {selectedCount} sound{selectedCount === 1 ? "" : "s"} selected
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Button
                type="button"
                onClick={() => {
                  if (isPlaying) {
                    stopMix()
                  } else {
                    void startMix()
                  }
                }}
                className="rounded-2xl px-8 font-bold"
                disabled={selectedCount === 0}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause mix
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Play mix
                  </>
                )}
              </Button>
              <div className="flex items-center gap-3">
                <Volume2 className="w-4 h-4 text-white/60" />
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={masterVolume}
                  onChange={(e) => setMasterVolume(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <span className="text-xs text-white/60 w-10 text-right">{masterVolume}%</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-end">
          <Button type="button" variant="outline" className="rounded-xl" onClick={resetMix}>
            Reset mix
          </Button>
        </div>

        <div className="space-y-8">
          {(["Nature", "Cozy", "Focus"] as const).map((category) => (
            <section key={category} className="space-y-4">
              <h2 className="text-2xl font-black text-white">{category} Sounds</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {soundsByCategory[category].map((sound) => {
                  const enabled = !!enabledSounds[sound.id]
                  return (
                    <Card key={sound.id} className="p-5 rounded-3xl bg-white/5 border-white/10 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-bold text-white">{sound.name}</h3>
                          <p className="text-sm text-white/55">{sound.description}</p>
                        </div>
                        <Button
                          type="button"
                          variant={enabled ? "default" : "outline"}
                          className="rounded-xl"
                          onClick={() =>
                            setEnabledSounds((prev) => ({
                              ...prev,
                              [sound.id]: !prev[sound.id],
                            }))
                          }
                        >
                          {enabled ? <Check className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
                          {enabled ? "Added" : "Add"}
                        </Button>
                      </div>

                      <div className="flex items-center gap-3">
                        <Volume2 className="w-4 h-4 text-white/60" />
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={soundVolumes[sound.id] ?? 0}
                          onChange={(e) =>
                            setSoundVolumes((prev) => ({
                              ...prev,
                              [sound.id]: Number(e.target.value),
                            }))
                          }
                          className="w-full accent-primary"
                        />
                        <span className="text-xs text-white/60 w-10 text-right">{soundVolumes[sound.id] ?? 0}%</span>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
