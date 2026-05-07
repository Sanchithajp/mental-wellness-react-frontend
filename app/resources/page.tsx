"use client"

import { useState, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Search, Bookmark, Star } from "lucide-react"

interface Resource {
  id: string
  title: string
  author: string
  description: string
  category: string
  type: "book" | "article"
  rating: number
  icon: string
}

function ResourcesContent() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const resources: Resource[] = [
    {
      id: "1",
      title: "The Power of Now",
      author: "Eckhart Tolle",
      description:
        "A transformative guide to living in the present moment and finding inner peace through mindfulness.",
      category: "Mindfulness",
      type: "book",
      rating: 4.9,
      icon: "📖",
    },
    {
      id: "2",
      title: "Calm: Building Your Mental Resilience",
      author: "Michael Acton Smith",
      description: "Discover practical techniques to manage stress, anxiety, and build a peaceful mind.",
      category: "Mental Health",
      type: "book",
      rating: 4.8,
      icon: "📚",
    },
    {
      id: "3",
      title: "Meditation for Beginners",
      author: "Jack Kornfield",
      description: "A gentle introduction to meditation practices that cultivate inner peace and clarity.",
      category: "Meditation",
      type: "book",
      rating: 4.7,
      icon: "🧘",
    },
    {
      id: "4",
      title: "The Art of Breathing",
      author: "Dr. Belisa Vranich",
      description: "Master breathing techniques to reduce anxiety and enhance your overall wellbeing.",
      category: "Wellness",
      type: "book",
      rating: 4.6,
      icon: "💨",
    },
    {
      id: "5",
      title: "Finding Peace in a Chaotic World",
      author: "Psychology Today",
      description: "Expert insights on creating calm spaces and maintaining mental clarity.",
      category: "Mental Health",
      type: "article",
      rating: 4.8,
      icon: "✨",
    },
    {
      id: "6",
      title: "The Science of Happiness",
      author: "Greater Good Science Center",
      description: "Evidence-based practices to cultivate joy and sustainable peace in your life.",
      category: "Mindfulness",
      type: "article",
      rating: 4.9,
      icon: "😊",
    },
    {
      id: "7",
      title: "Sleep Better: A Complete Guide",
      author: "Sleep Foundation",
      description: "Comprehensive strategies for improving sleep quality and nighttime relaxation.",
      category: "Wellness",
      type: "article",
      rating: 4.7,
      icon: "😴",
    },
    {
      id: "8",
      title: "Atomic Habits",
      author: "James Clear",
      description: "Build peaceful routines and lasting habits that support your mental wellbeing.",
      category: "Self-Care",
      type: "book",
      rating: 4.9,
      icon: "🎯",
    },
  ]

  const categories = Array.from(new Set(resources.map((r) => r.category)))

  const filteredResources = resources.filter((resource) => {
    const matchesCategory = !selectedCategory || resource.category === selectedCategory
    const matchesSearch =
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.author.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12 space-y-4 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-black tracking-tight text-white">Books & Articles</h1>
          <p className="text-xl text-white/60">Curated reads to cultivate peace and inner tranquility.</p>
        </div>

        {/* Search Bar */}
        <div className="mb-12">
          <div className="relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
            <input
              type="text"
              placeholder="Search by title or author..."
              className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl h-16 pl-16 pr-6 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="mb-12 flex flex-wrap gap-3">
          <Button
            onClick={() => setSelectedCategory(null)}
            className={`rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
              selectedCategory === null
                ? "bg-white text-black hover:bg-white/90"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            All
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                selectedCategory === cat
                  ? "bg-white text-black hover:bg-white/90"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Resources Grid */}
        <div className="grid md:grid-cols-2 gap-8 animate-fade-in">
          {filteredResources.map((resource) => (
            <div
              key={resource.id}
              className="group p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-5xl">{resource.icon}</span>
                <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-bold text-white">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  {resource.rating}
                </div>
              </div>

              <h3 className="text-2xl font-black text-white mb-1 group-hover:text-white transition-colors">
                {resource.title}
              </h3>
              <p className="text-sm text-white/60 mb-4">{resource.author}</p>

              <p className="text-white/70 mb-6 leading-relaxed">{resource.description}</p>

              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
                    resource.type === "book" ? "bg-blue-500/20 text-blue-300" : "bg-purple-500/20 text-purple-300"
                  }`}
                >
                  {resource.type === "book" ? "Book" : "Article"}
                </span>
                <button className="text-white/40 hover:text-white/80 transition-colors">
                  <Bookmark className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredResources.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <p className="text-2xl font-black text-white">No resources found</p>
            <p className="text-white/60">Try adjusting your search or filters.</p>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-20 p-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] text-center space-y-6 animate-fade-in">
          <h2 className="text-3xl font-black text-white">Ready to start your journey?</h2>
          <p className="text-white/60 max-w-xl mx-auto">
            Pick a resource above and begin your path to a more peaceful mind today.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ResourcesPage() {
  return (
    <Suspense fallback={null}>
      <ResourcesContent />
    </Suspense>
  )
}
