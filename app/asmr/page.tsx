"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Play, Pause, Volume2, VolumeX, Heart, Share2, Loader2, Search } from "lucide-react"
import { fetchASMRVideos, type YouTubeVideo } from "@/lib/youtube"
import { Input } from "@/components/ui/input"

export default function ASMRReelsPage() {
  const [videos, setVideos] = useState<YouTubeVideo[]>([])
  const [currentReel, setCurrentReel] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [likedReels, setLikedReels] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("ASMR")
  const [player, setPlayer] = useState<any>(null)
  const playerRef = useRef<HTMLDivElement>(null)

  // Initialize YouTube IFrame API
  useEffect(() => {
    if (videos.length === 0) return

    // Check if API is already loaded
    if (window.YT && window.YT.Player) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        initializePlayer()
      }, 100)
      return
    }

    // Load YouTube IFrame API only if not already loading
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
    }

    // @ts-ignore - YouTube API will be available globally
    window.onYouTubeIframeAPIReady = () => {
      setTimeout(() => {
        initializePlayer()
      }, 100)
    }

    return () => {
      // Cleanup
      if (player && typeof player.destroy === 'function') {
        try {
          player.destroy()
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }
  }, [videos.length])

  const initializePlayer = () => {
    if (playerRef.current && videos.length > 0 && window.YT && window.YT.Player) {
      try {
        // Destroy existing player if it exists
        if (player && typeof player.destroy === 'function') {
          try {
            player.destroy()
          } catch (e) {
            // Ignore cleanup errors
          }
        }

        // @ts-ignore
        const ytPlayer = new window.YT.Player(playerRef.current, {
          videoId: videos[currentReel]?.videoId || videos[0]?.videoId,
          playerVars: {
            autoplay: 0,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            iv_load_policy: 3,
            playsinline: 1,
          },
          events: {
            onReady: (event: any) => {
              console.log('YouTube player ready')
              setPlayer(event.target)
            },
            onStateChange: (event: any) => {
              // 0 = ended, 1 = playing, 2 = paused
              setIsPlaying(event.data === 1)
            },
            onError: (event: any) => {
              console.error('YouTube player error:', event.data)
            },
          },
        })
        setPlayer(ytPlayer)
      } catch (error) {
        console.error('Error initializing YouTube player:', error)
      }
    }
  }

  // Update player when current reel changes
  useEffect(() => {
    if (player && videos[currentReel] && typeof player.loadVideoById === 'function') {
      try {
        player.loadVideoById(videos[currentReel].videoId)
        setIsPlaying(false)
      } catch (error) {
        console.error('Error loading video:', error)
      }
    }
  }, [currentReel, player, videos])

  // Fetch videos on mount and when search changes
  useEffect(() => {
    loadVideos()
  }, [])

  const loadVideos = async (query: string = searchQuery) => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchASMRVideos(query, 20)
      if (data.videos && data.videos.length > 0) {
        setVideos(data.videos)
        setCurrentReel(0)
      } else {
        setError("No videos found. Try a different search term.")
      }
    } catch (err: any) {
      console.error("Error loading videos:", err)
      setError(err.message || "Failed to load videos. Please check your YouTube API key.")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      loadVideos(searchQuery)
    }
  }

  const handleLike = (videoId: string) => {
    setLikedReels((prev) => 
      prev.includes(videoId) 
        ? prev.filter((id) => id !== videoId) 
        : [...prev, videoId]
    )
  }

  const handlePlayPause = () => {
    if (!player || typeof player.pauseVideo !== 'function' || typeof player.playVideo !== 'function') return
    
    try {
      if (isPlaying) {
        player.pauseVideo()
      } else {
        player.playVideo()
      }
      setIsPlaying(!isPlaying)
    } catch (error) {
      console.error('Error controlling playback:', error)
    }
  }

  const handleMute = () => {
    if (!player || typeof player.unMute !== 'function' || typeof player.mute !== 'function') return
    
    try {
      if (isMuted) {
        player.unMute()
      } else {
        player.mute()
      }
      setIsMuted(!isMuted)
    } catch (error) {
      console.error('Error controlling volume:', error)
    }
  }

  const handleNext = () => {
    if (videos.length === 0) return
    setCurrentReel((prev) => (prev + 1) % videos.length)
  }

  const handlePrevious = () => {
    if (videos.length === 0) return
    setCurrentReel((prev) => (prev - 1 + videos.length) % videos.length)
  }

  const handleShare = (video: YouTubeVideo) => {
    const url = `https://www.youtube.com/watch?v=${video.videoId}`
    if (navigator.share) {
      navigator.share({
        title: video.title,
        text: video.description,
        url: url,
      })
    } else {
      navigator.clipboard.writeText(url)
      alert("Link copied to clipboard!")
    }
  }

  const currentVideo = videos[currentReel]

  if (loading && videos.length === 0) {
    return (
      <div className="min-h-screen py-12 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-white mx-auto" />
          <p className="text-white/60">Loading ASMR videos...</p>
        </div>
      </div>
    )
  }

  if (error && videos.length === 0) {
    return (
      <div className="min-h-screen py-12 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <p className="text-red-400">{error}</p>
          <p className="text-white/60 text-sm">
            Make sure YOUTUBE_API_KEY is set in your .env.local file.
            Get your API key from{" "}
            <a href="https://console.cloud.google.com/apis/credentials" className="text-primary underline">
              Google Cloud Console
            </a>
          </p>
          <Button onClick={() => loadVideos()} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-5xl md:text-6xl font-black tracking-tight text-white">ASMR Reels</h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Immerse yourself in calming sounds and visuals designed to help you relax and unwind.
          </p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-md mx-auto mt-6">
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ASMR videos..."
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
              <Button type="submit" className="bg-white text-black hover:bg-white/90">
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>

        {videos.length === 0 ? (
          <div className="text-center text-white/60">No videos found</div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Main Reel Player */}
            <div className="relative">
              <Card className="overflow-hidden bg-white/5 backdrop-blur-xl border-white/10 rounded-3xl shadow-2xl">
                <div className="relative aspect-[9/16] bg-gradient-to-br from-slate-900 to-slate-800">
                  {/* YouTube Player */}
                  <div ref={playerRef} className="w-full h-full" />
                  
                  {/* Fallback Thumbnail */}
                  {!player && currentVideo && (
                    <img
                      src={currentVideo.thumbnail}
                      alt={currentVideo.title}
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Overlay Controls */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none">
                    {/* Play/Pause Button */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
                      <Button
                        size="lg"
                        onClick={handlePlayPause}
                        className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 border-2 border-white/40"
                      >
                        {isPlaying ? (
                          <Pause className="w-8 h-8 text-white" />
                        ) : (
                          <Play className="w-8 h-8 text-white ml-1" />
                        )}
                      </Button>
                    </div>

                    {/* Bottom Info */}
                    {currentVideo && (
                      <div className="absolute bottom-0 left-0 right-0 p-6 space-y-4 pointer-events-auto">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <h3 className="text-2xl font-bold text-white line-clamp-2">{currentVideo.title}</h3>
                            <p className="text-white/70 text-sm">{currentVideo.creator}</p>
                            <div className="flex items-center gap-3 text-xs text-white/50 flex-wrap">
                              <span className="px-2 py-1 bg-white/10 rounded-full">{currentVideo.category}</span>
                              <span>{currentVideo.duration}</span>
                              <span>{currentVideo.likes.toLocaleString()} likes</span>
                              <span>{currentVideo.views.toLocaleString()} views</span>
                            </div>
                          </div>

                          {/* Side Actions */}
                          <div className="flex flex-col gap-4 ml-4">
                            <button
                              onClick={() => handleLike(currentVideo.videoId)}
                              className="flex flex-col items-center gap-1 text-white"
                            >
                              <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                  likedReels.includes(currentVideo.videoId) ? "bg-red-500" : "bg-white/20"
                                } backdrop-blur-md`}
                              >
                                <Heart
                                  className={`w-6 h-6 ${likedReels.includes(currentVideo.videoId) ? "fill-white" : ""}`}
                                  strokeWidth={2}
                                />
                              </div>
                              <span className="text-xs">{likedReels.includes(currentVideo.videoId) ? "Liked" : "Like"}</span>
                            </button>

                            <button 
                              onClick={() => handleShare(currentVideo)}
                              className="flex flex-col items-center gap-1 text-white"
                            >
                              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                                <Share2 className="w-5 h-5" />
                              </div>
                              <span className="text-xs">Share</span>
                            </button>

                            <button onClick={handleMute} className="flex flex-col items-center gap-1 text-white">
                              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                              </div>
                              <span className="text-xs">{isMuted ? "Unmute" : "Mute"}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Navigation Buttons */}
              <div className="flex gap-4 mt-6">
                <Button onClick={handlePrevious} className="flex-1 rounded-full bg-white/10 hover:bg-white/20 text-white">
                  Previous
                </Button>
                <Button onClick={handleNext} className="flex-1 rounded-full bg-white/10 hover:bg-white/20 text-white">
                  Next
                </Button>
              </div>
            </div>

            {/* Reel List */}
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-white mb-6">Browse Reels</h3>
              <div className="space-y-3 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                {videos.map((video, index) => (
                  <Card
                    key={video.id}
                    onClick={() => setCurrentReel(index)}
                    className={`p-4 cursor-pointer transition-all ${
                      currentReel === index
                        ? "bg-white/15 border-white/30"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    } backdrop-blur-xl rounded-2xl`}
                  >
                    <div className="flex gap-4 items-center">
                      <div className="relative w-20 h-28 rounded-xl overflow-hidden shrink-0">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-1 right-1 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded">
                          {video.duration}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-white text-sm mb-1 line-clamp-2">{video.title}</h4>
                        <p className="text-white/60 text-xs mb-2">{video.creator}</p>
                        <div className="flex items-center gap-2 text-xs text-white/50 flex-wrap">
                          <span className="px-2 py-0.5 bg-white/10 rounded-full">{video.category}</span>
                          <span>{video.likes.toLocaleString()} likes</span>
                          <span>{video.views.toLocaleString()} views</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
