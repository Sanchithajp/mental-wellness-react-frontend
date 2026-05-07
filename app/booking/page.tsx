"use client"

import { useState, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Star, Search } from "lucide-react"

const therapists = [
  {
    id: 1,
    name: "Dr. Sarah Mitchell",
    specialty: "Cognitive Behavioral Therapy",
    rating: 4.9,
    reviews: 124,
    price: "$120/hr",
    image: "/placeholder.svg?key=user1",
    availability: "Next: Tomorrow, 10:00 AM",
  },
  {
    id: 2,
    name: "Mark Johnson, LCSW",
    specialty: "Mindfulness & Anxiety",
    rating: 4.8,
    reviews: 89,
    price: "$95/hr",
    image: "/placeholder.svg?key=user2",
    availability: "Next: Monday, 2:00 PM",
  },
  {
    id: 3,
    name: "Dr. Emily Chen",
    specialty: "Trauma-Informed Care",
    rating: 5.0,
    reviews: 56,
    price: "$150/hr",
    image: "/placeholder.svg?key=user3",
    availability: "Next: Today, 4:30 PM",
  },
  {
    id: 4,
    name: "James Wilson, PsyD",
    specialty: "Relationship Counseling",
    rating: 4.7,
    reviews: 210,
    price: "$130/hr",
    image: "/placeholder.svg?key=user4",
    availability: "Next: Wednesday, 11:00 AM",
  },
]

function BookingContent() {
  const [search, setSearch] = useState("")

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-5xl md:text-6xl font-black tracking-tight text-white">Find Your Therapist</h1>
          <p className="text-xl text-white/60">Connect with professional care tailored to your specific needs.</p>
        </div>

        {/* Search Bar */}
        <Card className="mb-12 p-4 bg-white/5 backdrop-blur-xl border-white/10 rounded-3xl flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
            <input
              type="text"
              placeholder="Search by specialty, name, or concern..."
              className="w-full bg-white/5 border-none rounded-2xl h-14 pl-12 pr-6 text-white placeholder:text-white/20 focus:ring-white/20 outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button className="h-14 px-8 rounded-2xl bg-white text-black hover:bg-white/90 font-bold hidden md:flex">
            Search Professionals
          </Button>
        </Card>

        {/* Professionals Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {therapists.map((therapist) => (
            <Card
              key={therapist.id}
              className="group p-8 bg-white/5 backdrop-blur-xl border-white/10 rounded-[2.5rem] hover:bg-white/10 transition-all cursor-pointer border-t-white/20 shadow-xl"
            >
              <div className="flex gap-6 items-start">
                <div className="relative w-24 h-24 rounded-3xl overflow-hidden border-2 border-white/10 shrink-0">
                  <img
                    src={therapist.image || "/placeholder.svg"}
                    alt={therapist.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-3 flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-bold text-white">{therapist.name}</h3>
                      <p className="text-secondary font-medium text-sm">{therapist.specialty}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full text-xs font-bold text-white">
                      <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                      {therapist.rating}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 pt-2">
                    <div className="flex items-center gap-2 text-white/50 text-sm">
                      <Clock className="w-4 h-4" />
                      {therapist.availability}
                    </div>
                    <div className="flex items-center gap-2 text-white/50 text-sm">
                      <Badge variant="outline" className="border-white/10 text-white/60 bg-transparent">
                        {therapist.price}
                      </Badge>
                    </div>
                  </div>

                  <div className="pt-6 flex gap-3">
                    <Button className="flex-1 h-12 rounded-2xl bg-white text-black hover:bg-white/90 font-bold">
                      Book Session
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 h-12 rounded-2xl border-white/10 hover:bg-white/5 text-white/60 bg-transparent"
                    >
                      View Profile
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-20 text-center space-y-8 p-12 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[3rem]">
          <h2 className="text-3xl font-black text-white">Can't find what you're looking for?</h2>
          <p className="text-white/60 max-w-xl mx-auto">
            Our care coordinators can help you find the perfect match based on your preferences and insurance.
          </p>
          <Button
            size="lg"
            className="rounded-2xl px-12 h-16 bg-primary text-primary-foreground font-black uppercase tracking-widest hover:scale-105 transition-transform"
          >
            Chat with a Coordinator
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function BookingPage() {
  return (
    <Suspense fallback={null}>
      <BookingContent />
    </Suspense>
  )
}
