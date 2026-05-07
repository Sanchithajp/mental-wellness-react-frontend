"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import { ExternalLink, Maximize2, Minimize2 } from "lucide-react"

type GameType = 
  | "menu" 
  | "slimeSimulator"
  | "cookieClicker"
  | "agar"
  | "2048"
  | "wordle"
  | "sudoku"
  | "tetris"
  | "snake"
  | "flappyBird"
  | "pianoTiles"

interface Game {
  id: GameType
  name: string
  description: string
  icon: string
  color: string
  url: string
  source?: string
}

const games: Game[] = [
  { 
    id: "slimeSimulator", 
    name: "Slime Simulator", 
    description: "Satisfying slime simulation game", 
    icon: "🟢", 
    color: "from-green-500/20 to-emerald-500/20",
    url: "https://www.slimerancher.com/",
    source: "Slime Rancher"
  },
  { 
    id: "cookieClicker", 
    name: "Cookie Clicker", 
    description: "Classic idle clicking game", 
    icon: "🍪", 
    color: "from-amber-500/20 to-yellow-500/20",
    url: "https://orteil.dashnet.org/cookieclicker/",
    source: "Orteil"
  },
  { 
    id: "2048", 
    name: "2048", 
    description: "Relaxing number puzzle game", 
    icon: "🔢", 
    color: "from-blue-500/20 to-cyan-500/20",
    url: "https://play2048.co/",
    source: "Gabriele Cirulli"
  },
  { 
    id: "wordle", 
    name: "Wordle", 
    description: "Daily word puzzle game", 
    icon: "📝", 
    color: "from-purple-500/20 to-pink-500/20",
    url: "https://www.nytimes.com/games/wordle/index.html",
    source: "NY Times"
  },
  { 
    id: "sudoku", 
    name: "Sudoku", 
    description: "Classic number puzzle", 
    icon: "🧩", 
    color: "from-indigo-500/20 to-violet-500/20",
    url: "https://sudoku.com/",
    source: "Sudoku.com"
  },
  { 
    id: "tetris", 
    name: "Tetris", 
    description: "Classic block stacking game", 
    icon: "🎮", 
    color: "from-red-500/20 to-orange-500/20",
    url: "https://tetris.com/play-tetris",
    source: "Tetris"
  },
  { 
    id: "snake", 
    name: "Snake Game", 
    description: "Classic snake game", 
    icon: "🐍", 
    color: "from-green-500/20 to-teal-500/20",
    url: "https://www.google.com/search?q=play+snake+game",
    source: "Google"
  },
  { 
    id: "flappyBird", 
    name: "Flappy Bird", 
    description: "Simple flying game", 
    icon: "🐦", 
    color: "from-yellow-500/20 to-orange-500/20",
    url: "https://flappybird.io/",
    source: "Flappy Bird"
  },
  { 
    id: "pianoTiles", 
    name: "Piano Tiles", 
    description: "Music rhythm game", 
    icon: "🎹", 
    color: "from-pink-500/20 to-rose-500/20",
    url: "https://www.agame.com/game/piano-tiles",
    source: "A-Game"
  },
  { 
    id: "agar", 
    name: "Agar.io", 
    description: "Cell eating game", 
    icon: "🔴", 
    color: "from-blue-500/20 to-indigo-500/20",
    url: "https://agar.io/",
    source: "Agar.io"
  },
]

// Embeddable game URLs - using sources that allow iframe embedding
const embeddableGames: Record<GameType, string> = {
  menu: "",
  slimeSimulator: "https://www.crazygames.com/embed/slime-simulator",
  cookieClicker: "https://orteil.dashnet.org/cookieclicker/",
  2048: "https://play2048.co/",
  wordle: "https://www.nytimes.com/games/wordle/index.html",
  sudoku: "https://sudoku.com/",
  tetris: "https://tetris.com/play-tetris",
  snake: "https://www.google.com/search?q=play+snake+game",
  flappyBird: "https://flappybird.io/",
  pianoTiles: "https://www.agame.com/game/piano-tiles",
  agar: "https://agar.io/",
}

// Direct game URLs for games that don't allow iframe embedding
const directGameUrls: Record<GameType, string> = {
  menu: "",
  slimeSimulator: "https://www.crazygames.com/game/slime-simulator",
  cookieClicker: "https://orteil.dashnet.org/cookieclicker/",
  2048: "https://play2048.co/",
  wordle: "https://www.nytimes.com/games/wordle/index.html",
  sudoku: "https://sudoku.com/",
  tetris: "https://tetris.com/play-tetris",
  snake: "https://www.google.com/search?q=play+snake+game",
  flappyBird: "https://flappybird.io/",
  pianoTiles: "https://www.agame.com/game/piano-tiles",
  agar: "https://agar.io/",
}

export default function GamesPage() {
  const [activeGame, setActiveGame] = useState<GameType>("menu")
  const [isFullscreen, setIsFullscreen] = useState(false)

  const currentGame = games.find(g => g.id === activeGame)

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-background via-card to-background">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-5xl md:text-6xl font-black tracking-tight text-white">Mind Games</h1>
          <p className="text-xl text-white/60">Relaxing games to help you unwind and have fun.</p>
        </div>

        <AnimatePresence mode="wait">
          {activeGame === "menu" ? (
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {games.map((game) => (
                <Card
                  key={game.id}
                  onClick={() => setActiveGame(game.id)}
                  className={`group relative overflow-hidden bg-gradient-to-br ${game.color} backdrop-blur-xl border-white/10 p-8 rounded-[2rem] hover:bg-white/10 transition-all cursor-pointer h-64 flex flex-col justify-end hover:scale-105`}
                >
                  <div className="absolute top-8 left-8 text-5xl group-hover:scale-110 transition-transform">
                    {game.icon}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-white">{game.name}</h3>
                    <p className="text-white/60 text-sm">{game.description}</p>
                    {game.source && (
                      <p className="text-white/40 text-xs">by {game.source}</p>
                    )}
                  </div>
                </Card>
              ))}
            </motion.div>
          ) : (
            <GameRenderer 
              game={activeGame} 
              onBack={() => setActiveGame("menu")}
              isFullscreen={isFullscreen}
              onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function GameRenderer({ 
  game, 
  onBack, 
  isFullscreen,
  onToggleFullscreen 
}: { 
  game: GameType
  onBack: () => void
  isFullscreen: boolean
  onToggleFullscreen: () => void
}) {
  const gameUrl = embeddableGames[game] || directGameUrls[game]
  const directUrl = directGameUrls[game]
  const gameInfo = games.find(g => g.id === game)

  // Games that typically don't allow iframe embedding
  const gamesThatNeedDirectLink = ["wordle", "sudoku", "snake", "tetris", "pianoTiles"]

  if (gamesThatNeedDirectLink.includes(game)) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative aspect-square md:aspect-video bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] overflow-hidden"
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-6 z-20">
          <div className="text-6xl">{gameInfo?.icon}</div>
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">{gameInfo?.name}</h2>
            <p className="text-white/60 mb-6">{gameInfo?.description}</p>
          </div>
          <div className="flex gap-4">
            <Button
              variant="ghost"
              onClick={onBack}
              className="text-white/60 hover:text-white hover:bg-white/10 rounded-full"
            >
              ← Back to Menu
            </Button>
            <Button
              onClick={() => window.open(directUrl, '_blank')}
              className="bg-white text-black hover:bg-white/90 rounded-full"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Play on {gameInfo?.source || "Original Site"}
            </Button>
          </div>
          <p className="text-white/40 text-sm">
            This game opens in a new tab due to embedding restrictions
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`relative ${isFullscreen ? 'fixed inset-0 z-50' : 'aspect-square md:aspect-video'} bg-black/40 backdrop-blur-2xl border border-white/10 ${isFullscreen ? '' : 'rounded-[2.5rem]'} overflow-hidden`}
    >
      <div className="absolute top-6 left-6 z-20 flex gap-2">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-white/60 hover:text-white hover:bg-white/10 rounded-full"
        >
          ← Back
        </Button>
        <Button
          variant="ghost"
          onClick={onToggleFullscreen}
          className="text-white/60 hover:text-white hover:bg-white/10 rounded-full"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </Button>
        <Button
          variant="ghost"
          onClick={() => window.open(directUrl, '_blank')}
          className="text-white/60 hover:text-white hover:bg-white/10 rounded-full"
        >
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>

      <div className="absolute top-6 right-6 z-20">
        <div className="text-xl font-bold text-white">{gameInfo?.name}</div>
      </div>

      <iframe
        src={gameUrl}
        className="w-full h-full border-0"
        allow="fullscreen; autoplay; encrypted-media; gyroscope; accelerometer"
        allowFullScreen
        style={{ minHeight: isFullscreen ? '100vh' : '600px' }}
        title={gameInfo?.name}
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
        onError={() => {
          console.error('Failed to load game in iframe')
        }}
      />

      <div className="absolute inset-0 pointer-events-none">
        <div className="w-full h-full bg-gradient-to-b from-transparent via-transparent to-primary/5" />
      </div>
    </motion.div>
  )
}
