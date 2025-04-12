"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PixelHeading from "@/components/pixel-heading"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import AbstractShape from "@/components/abstract-shape"

// NFT Types
type NFTType = "cube" | "music"
type Rarity = "common" | "rare" | "epic" | "legendary" | "mythic"

interface NFT {
  id: string
  name: string
  type: NFTType
  rarity: Rarity
  description: string
  attributes?: {
    [key: string]: string | number
  }
}

// Sample NFT data
const sampleNFTs: NFT[] = [
  {
    id: "cube-001",
    name: "Void Cube Alpha",
    type: "cube",
    rarity: "common",
    description: "A basic cube from the Void dimension.",
    attributes: {
      dimension: "Alpha",
      edges: 12,
      vertices: 8,
    },
  },
  {
    id: "cube-002",
    name: "Echo Resonance",
    type: "cube",
    rarity: "rare",
    description: "A cube that resonates with the Echo realm.",
    attributes: {
      dimension: "Echo",
      edges: 12,
      vertices: 8,
      resonance: 3.5,
    },
  },
  {
    id: "cube-003",
    name: "Nexus Prism",
    type: "cube",
    rarity: "epic",
    description: "A prismatic cube from the Nexus realm.",
    attributes: {
      dimension: "Nexus",
      edges: 18,
      vertices: 12,
      prismatic: "true",
    },
  },
  {
    id: "cube-004",
    name: "Abyss Tesseract",
    type: "cube",
    rarity: "legendary",
    description: "A 4D tesseract from the depths of the Abyss.",
    attributes: {
      dimension: "Abyss",
      edges: 32,
      vertices: 16,
      dimensional: 4,
    },
  },
  {
    id: "cube-005",
    name: "Cipher Hypercube",
    type: "cube",
    rarity: "mythic",
    description: "A hypercube encoded with the secrets of the Cipher realm.",
    attributes: {
      dimension: "Cipher",
      edges: 80,
      vertices: 32,
      dimensional: 5,
      encrypted: "true",
    },
  },
  {
    id: "music-001",
    name: "Void Ambient",
    type: "music",
    rarity: "common",
    description: "Ambient sounds from the Void dimension.",
    attributes: {
      genre: "Ambient",
      duration: "2:30",
      bpm: 80,
    },
  },
  {
    id: "music-002",
    name: "Echo Reverberations",
    type: "music",
    rarity: "rare",
    description: "Melodic echoes from the Echo realm.",
    attributes: {
      genre: "Ambient Techno",
      duration: "3:15",
      bpm: 95,
    },
  },
  {
    id: "music-003",
    name: "Nexus Synthesis",
    type: "music",
    rarity: "epic",
    description: "Synthesized melodies from the Nexus realm.",
    attributes: {
      genre: "Synthwave",
      duration: "4:20",
      bpm: 110,
    },
  },
  {
    id: "music-004",
    name: "Abyss Depths",
    type: "music",
    rarity: "legendary",
    description: "Deep bass from the Abyss realm.",
    attributes: {
      genre: "Dark Ambient",
      duration: "5:45",
      bpm: 70,
    },
  },
  {
    id: "music-005",
    name: "Cipher Encryption",
    type: "music",
    rarity: "mythic",
    description: "Encrypted melodies from the Cipher realm.",
    attributes: {
      genre: "Glitch",
      duration: "6:66",
      bpm: 128,
    },
  },
]

// Gacha probabilities
const rarityProbabilities = {
  common: 0.6,
  rare: 0.25,
  epic: 0.1,
  legendary: 0.04,
  mythic: 0.01,
}

// Rarity colors
const rarityColors = {
  common: "#a0a0a0",
  rare: "#3b82f6",
  epic: "#a855f7",
  legendary: "#f59e0b",
  mythic: "#ec4899",
}

export default function GachaPage() {
  const [userBalance, setUserBalance] = useState(1000) // SOL balance
  const [inventory, setInventory] = useState<NFT[]>([])
  const [isGachaActive, setIsGachaActive] = useState(false)
  const [currentNFT, setCurrentNFT] = useState<NFT | null>(null)
  const [isRevealed, setIsRevealed] = useState(false)
  const [gachaType, setGachaType] = useState<"cube" | "music">("cube")
  const [gachaPrice, setGachaPrice] = useState(100)
  const [portalOpened, setPortalOpened] = useState(false)
  const [portalSize, setPortalSize] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const particlesRef = useRef<any[]>([])
  const cursorPositionRef = useRef({ x: 0, y: 0 })
  const [cursorHover, setCursorHover] = useState(false)

  // Handle cursor effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      cursorPositionRef.current = { x: e.clientX, y: e.clientY }
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  // Initialize canvas animation
  useEffect(() => {
    if (!isGachaActive || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const resizeCanvas = () => {
      canvas.width = canvas.clientWidth
      canvas.height = canvas.clientHeight
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Create particles
    const createParticles = () => {
      const newParticles = []
      const particleCount = 100

      for (let i = 0; i < particleCount; i++) {
        newParticles.push({
          x: canvas.width / 2,
          y: canvas.height / 2,
          size: Math.random() * 4 + 1,
          color: getRandomColor(),
          speed: Math.random() * 3 + 1,
          angle: Math.random() * Math.PI * 2,
          spin: Math.random() * 0.2 - 0.1,
          opacity: Math.random() * 0.7 + 0.3,
        })
      }

      particlesRef.current = newParticles
    }

    // Get random color from purple/pink palette
    const getRandomColor = () => {
      const colors = [
        "#c084fc", // purple-400
        "#a855f7", // purple-500
        "#f472b6", // pink-400
        "#ec4899", // pink-500
        "#60a5fa", // blue-400
      ]
      return colors[Math.floor(Math.random() * colors.length)]
    }

    // Animation loop
    let currentPortalSize = 0
    const maxRadius = Math.min(canvas.width, canvas.height) * 0.4

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw portal
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2

      // Update portal size with easing
      if (portalOpened) {
        if (currentPortalSize < maxRadius) {
          currentPortalSize += (maxRadius - currentPortalSize) * 0.05
        } else {
          currentPortalSize = maxRadius
        }
      } else {
        if (currentPortalSize > 0) {
          currentPortalSize *= 0.9
        } else {
          currentPortalSize = 0
        }
      }

      // Draw portal glow
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, currentPortalSize * 1.5)
      gradient.addColorStop(0, "rgba(168, 85, 247, 0.8)")
      gradient.addColorStop(0.5, "rgba(236, 72, 153, 0.4)")
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)")

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(centerX, centerY, currentPortalSize * 1.5, 0, Math.PI * 2)
      ctx.fill()

      // Draw portal ring
      ctx.strokeStyle = "rgba(168, 85, 247, 0.8)"
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(centerX, centerY, currentPortalSize, 0, Math.PI * 2)
      ctx.stroke()

      // Draw inner portal ring
      ctx.strokeStyle = "rgba(236, 72, 153, 0.8)"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(centerX, centerY, currentPortalSize * 0.8, 0, Math.PI * 2)
      ctx.stroke()

      // Draw and update particles
      const particles = particlesRef.current
      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i]

        // Draw particle
        ctx.globalAlpha = particle.opacity
        ctx.fillStyle = particle.color
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1

        // Update particle position
        const newAngle = particle.angle + particle.spin
        const distance = particle.speed

        // Calculate new position
        let newX = particle.x + Math.cos(newAngle) * distance
        let newY = particle.y + Math.sin(newAngle) * distance

        // Check if particle is outside the portal
        const dx = newX - centerX
        const dy = newY - centerY
        const distanceFromCenter = Math.sqrt(dx * dx + dy * dy)

        if (distanceFromCenter > currentPortalSize * 1.2) {
          // Redirect particle back toward center
          const angleToCenter = Math.atan2(centerY - particle.y, centerX - particle.x)
          newX = particle.x + Math.cos(angleToCenter) * distance
          newY = particle.y + Math.sin(angleToCenter) * distance
        }

        // Update particle
        particles[i] = {
          ...particle,
          x: newX,
          y: newY,
          angle: newAngle,
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    createParticles()
    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationRef.current)
    }
  }, [isGachaActive, portalOpened])

  // Function to pull gacha
  const pullGacha = () => {
    if (userBalance < gachaPrice) {
      alert("Insufficient balance!")
      return
    }

    // Deduct price from balance
    setUserBalance((prev) => prev - gachaPrice)

    // Start gacha animation
    setIsGachaActive(true)
    setIsRevealed(false)
    setPortalOpened(false)

    // Open portal after a short delay
    setTimeout(() => {
      setPortalOpened(true)

      // Get random NFT after portal is fully opened
      setTimeout(() => {
        const nft = getRandomNFT()
        setCurrentNFT(nft)

        // Reveal NFT after a delay
        setTimeout(() => {
          setIsRevealed(true)
          setInventory((prev) => [...prev, nft])
        }, 1500)
      }, 2000)
    }, 500)
  }

  // Function to get random NFT based on rarity probabilities
  const getRandomNFT = (): NFT => {
    // Determine rarity
    const rand = Math.random()
    let selectedRarity: Rarity = "common"
    let cumulativeProbability = 0

    for (const [rarity, probability] of Object.entries(rarityProbabilities) as [Rarity, number][]) {
      cumulativeProbability += probability
      if (rand <= cumulativeProbability) {
        selectedRarity = rarity
        break
      }
    }

    // Filter NFTs by type and rarity
    const eligibleNFTs = sampleNFTs.filter((nft) => nft.type === gachaType && nft.rarity === selectedRarity)

    // Return random NFT from eligible pool
    return eligibleNFTs[Math.floor(Math.random() * eligibleNFTs.length)]
  }

  // Reset gacha state
  const resetGacha = () => {
    setPortalOpened(false)

    // Wait for portal to close before resetting other states
    setTimeout(() => {
      setIsGachaActive(false)
      setCurrentNFT(null)
      setIsRevealed(false)
    }, 500)
  }

  // Render NFT preview based on type and rarity
  const renderNFTPreview = (type: NFTType, rarity: Rarity) => {
    if (type === "cube") {
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="relative w-32 h-32 transform-style-preserve-3d">
            <motion.div
              className="absolute inset-0"
              style={{
                borderWidth: 2,
                borderStyle: "solid",
                borderColor: rarityColors[rarity],
                backgroundColor: `${rarityColors[rarity]}20`,
              }}
              animate={{
                rotateX: [0, 360],
                rotateY: [0, 360],
              }}
              transition={{
                duration: 10,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
            />
            <motion.div
              className="absolute inset-0"
              style={{
                borderWidth: 2,
                borderStyle: "solid",
                borderColor: rarityColors[rarity],
                backgroundColor: `${rarityColors[rarity]}10`,
              }}
              animate={{
                rotateX: [45, 405],
                rotateY: [45, 405],
                rotateZ: [0, 360],
              }}
              transition={{
                duration: 15,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 opacity-50" style={{ backgroundColor: rarityColors[rarity] }}>
              <motion.div
                className="w-full h-full"
                animate={{
                  opacity: [0.3, 0.7, 0.3],
                  scale: [0.8, 1.1, 0.8],
                }}
                transition={{
                  duration: 3,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              />
            </div>
          </div>
        </div>
      )
    } else {
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="relative w-32 h-32">
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                borderWidth: 2,
                borderStyle: "solid",
                borderColor: rarityColors[rarity],
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                borderWidth: 2,
                borderStyle: "solid",
                borderColor: rarityColors[rarity],
              }}
              animate={{
                scale: [0.6, 1, 0.6],
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: 4,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                delay: 0.5,
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="w-8 h-8 rounded-full"
                style={{ backgroundColor: rarityColors[rarity] }}
                animate={{
                  scale: [0.8, 1.2, 0.8],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              />
            </div>
          </div>

          {/* Audio wave visualization */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center items-end h-8 space-x-1">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 rounded-t-sm"
                style={{ backgroundColor: rarityColors[rarity] }}
                animate={{
                  height: [Math.random() * 10 + 5, Math.random() * 20 + 10, Math.random() * 10 + 5],
                }}
                transition={{
                  duration: 1 + Math.random(),
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                  ease: "easeInOut",
                  delay: i * 0.1,
                }}
              />
            ))}
          </div>
        </div>
      )
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Custom cursor */}
      <motion.div
        className="fixed w-8 h-8 pointer-events-none z-[100] hidden md:block"
        animate={{
          x: cursorPositionRef.current.x - 16,
          y: cursorPositionRef.current.y - 16,
          scale: cursorHover ? 1.5 : 1,
        }}
        transition={{ type: "spring", damping: 10, mass: 0.1, stiffness: 100 }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="0" width="4" height="4" fill="#a855f7" />
          <rect x="28" y="0" width="4" height="4" fill="#a855f7" />
          <rect x="0" y="28" width="4" height="4" fill="#a855f7" />
          <rect x="28" y="28" width="4" height="4" fill="#a855f7" />
          <rect x="12" y="12" width="8" height="8" fill="#ec4899" />
        </svg>
      </motion.div>

      <Navigation />

      <div className="pt-24 pb-16">
        {/* Hero Section */}
        <div className="relative w-full h-[40vh] overflow-hidden mb-12">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-black z-10"></div>

          {/* Background pattern */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 opacity-10">
              {Array.from({ length: 144 }).map((_, i) => (
                <div key={i} className="border border-purple-800/20"></div>
              ))}
            </div>

            {/* Animated gradient overlay */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute inset-0 bg-gradient-radial from-purple-500/20 to-transparent animate-pulse-slow"></div>
              <div className="absolute inset-0 bg-gradient-radial from-pink-500/10 to-transparent animate-pulse-slow delay-1000"></div>
            </div>
          </div>

          <div className="relative z-20 h-full flex flex-col items-center justify-center px-6">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <PixelHeading
                text="VOID GACHA"
                className="text-6xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-4 text-center"
                animate
              />
              <p className="text-center max-w-2xl text-gray-300 mb-8 font-pixel">
                DISCOVER RARE DIGITAL ARTIFACTS FROM THE VOID UNIVERSE
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex items-center space-x-6 bg-black/50 backdrop-blur-md p-4 border border-purple-500/30 rounded-lg"
              onMouseEnter={() => setCursorHover(true)}
              onMouseLeave={() => setCursorHover(false)}
            >
              <div className="px-4 py-2 bg-purple-900/30 border border-purple-500 font-pixel">
                <span className="text-sm text-gray-400">BALANCE</span>
                <div className="text-xl text-white">
                  {userBalance} <span className="text-purple-400">SOL</span>
                </div>
              </div>
              <Button
                onClick={() => setUserBalance((prev) => prev + 100)}
                className="bg-transparent border border-pink-500 hover:bg-pink-950/30 text-pink-400 rounded-none px-4 py-2 text-sm font-pixel"
              >
                + ADD SOL
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6">
          <Tabs defaultValue="gacha" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="gacha" className="font-pixel">
                GACHA
              </TabsTrigger>
              <TabsTrigger value="inventory" className="font-pixel">
                INVENTORY
              </TabsTrigger>
            </TabsList>

            <TabsContent value="gacha" className="w-full">
              {!isGachaActive ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-8"
                >
                  <motion.div
                    whileHover={{ y: -5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="bg-gradient-to-br from-purple-900/20 to-black border border-purple-500/50 rounded-lg overflow-hidden"
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-2xl font-pixel text-purple-400 mb-1">VOID CUBE</h3>
                          <p className="text-sm text-gray-400">Dimensional artifacts from the void</p>
                        </div>
                        <div className="bg-purple-900/30 px-3 py-1 rounded-full text-sm text-purple-300 font-pixel">
                          100 SOL
                        </div>
                      </div>

                      <div className="aspect-square relative mb-6 bg-black/50 border border-purple-800/50 rounded-lg overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center">
                          {renderNFTPreview("cube", "epic")}
                        </div>

                        {/* Rarity indicators */}
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                          {(["common", "rare", "epic", "legendary", "mythic"] as Rarity[]).map((rarity) => (
                            <div
                              key={rarity}
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: rarityColors[rarity] }}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-400 font-pixel">
                          <span className="text-purple-400">5</span> RARITIES AVAILABLE
                        </div>
                        <Button
                          onClick={() => {
                            setGachaType("cube")
                            setGachaPrice(100)
                            pullGacha()
                          }}
                          className="bg-purple-900 hover:bg-purple-800 text-white border border-purple-500 rounded-full px-6 py-2 font-pixel"
                          disabled={userBalance < 100}
                        >
                          PULL
                        </Button>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="bg-gradient-to-br from-pink-900/20 to-black border border-pink-500/50 rounded-lg overflow-hidden"
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-2xl font-pixel text-pink-400 mb-1">VOID MUSIC</h3>
                          <p className="text-sm text-gray-400">Ethereal sounds from beyond</p>
                        </div>
                        <div className="bg-pink-900/30 px-3 py-1 rounded-full text-sm text-pink-300 font-pixel">
                          150 SOL
                        </div>
                      </div>

                      <div className="aspect-square relative mb-6 bg-black/50 border border-pink-800/50 rounded-lg overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center">
                          {renderNFTPreview("music", "legendary")}
                        </div>

                        {/* Rarity indicators */}
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                          {(["common", "rare", "epic", "legendary", "mythic"] as Rarity[]).map((rarity) => (
                            <div
                              key={rarity}
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: rarityColors[rarity] }}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-400 font-pixel">
                          <span className="text-pink-400">5</span> RARITIES AVAILABLE
                        </div>
                        <Button
                          onClick={() => {
                            setGachaType("music")
                            setGachaPrice(150)
                            pullGacha()
                          }}
                          className="bg-pink-900 hover:bg-pink-800 text-white border border-pink-500 rounded-full px-6 py-2 font-pixel"
                          disabled={userBalance < 150}
                        >
                          PULL
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ) : (
                <div className="relative w-full h-[70vh] flex flex-col items-center justify-center">
                  {/* Portal Canvas */}
                  <canvas ref={canvasRef} className="absolute inset-0 w-full h-full"></canvas>

                  {/* NFT Reveal */}
                  <div className="relative z-10 flex flex-col items-center">
                    <AnimatePresence>
                      {currentNFT && isRevealed ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 20,
                          }}
                          className={`p-6 bg-black/80 backdrop-blur-md rounded-lg border-2 max-w-md`}
                          style={{
                            borderColor: rarityColors[currentNFT.rarity],
                            boxShadow: `0 0 20px ${rarityColors[currentNFT.rarity]}50`,
                          }}
                        >
                          <div className="text-center mb-4">
                            <div className="text-xl font-pixel mb-1" style={{ color: rarityColors[currentNFT.rarity] }}>
                              {currentNFT.name}
                            </div>
                            <div className="text-sm text-gray-300 mb-4">{currentNFT.description}</div>
                          </div>

                          <div className="aspect-square w-48 h-48 mx-auto mb-4 bg-black/50 rounded-lg overflow-hidden flex items-center justify-center">
                            {renderNFTPreview(currentNFT.type, currentNFT.rarity)}
                          </div>

                          <div className="flex justify-between items-center">
                            <div
                              className="text-xs uppercase font-pixel"
                              style={{ color: rarityColors[currentNFT.rarity] }}
                            >
                              {currentNFT.rarity}
                            </div>
                            <div className="text-xs text-gray-400">{currentNFT.id}</div>
                          </div>

                          <Button
                            onClick={resetGacha}
                            className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-md px-6 py-2 font-pixel"
                            onMouseEnter={() => setCursorHover(true)}
                            onMouseLeave={() => setCursorHover(false)}
                          >
                            CONTINUE
                          </Button>
                        </motion.div>
                      ) : (
                        <div className="text-center">
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="mb-8 text-2xl font-pixel text-white"
                          >
                            {portalOpened ? "Summoning from the void..." : "Opening portal..."}
                          </motion.div>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="inventory" className="w-full">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
              >
                <h2 className="text-3xl font-pixel text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-4">
                  YOUR COLLECTION
                </h2>
                <p className="text-gray-300">View and manage your NFT collection from the VOID universe.</p>
              </motion.div>

              {inventory.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-center py-16 border border-dashed border-gray-700 rounded-lg bg-black/30"
                >
                  <div className="mb-6">
                    <AbstractShape className="w-24 h-24 mx-auto text-purple-500/30" type="grid" />
                  </div>
                  <p className="text-2xl text-gray-400 mb-4 font-pixel">YOUR INVENTORY IS EMPTY</p>
                  <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    Pull from the gacha to discover unique digital artifacts from the VOID universe
                  </p>
                  <Button
                    onClick={() => {
                      const gachaTab = document.querySelector('[data-value="gacha"]') as HTMLElement | null;
                      gachaTab?.click();
                    }}
                    className="bg-transparent border-2 border-purple-500 hover:bg-purple-950/30 text-purple-400 rounded-none px-6 py-3 font-pixel"
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                  >
                    GO TO GACHA
                  </Button>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {inventory.map((nft, index) => (
                    <motion.div
                      key={`${nft.id}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                      whileHover={{ y: -5 }}
                      className="bg-black/50 rounded-lg overflow-hidden border"
                      style={{
                        borderColor: `${rarityColors[nft.rarity]}50`,
                      }}
                      onMouseEnter={() => setCursorHover(true)}
                      onMouseLeave={() => setCursorHover(false)}
                    >
                      <div className="p-4">
                        <div className="text-lg font-pixel mb-2" style={{ color: rarityColors[nft.rarity] }}>
                          {nft.name}
                        </div>
                        <div className="aspect-square bg-black/50 mb-4 rounded-lg overflow-hidden flex items-center justify-center">
                          {renderNFTPreview(nft.type, nft.rarity)}
                        </div>
                        <div className="text-xs text-gray-300 mb-2 line-clamp-2">{nft.description}</div>
                        <div className="flex justify-between items-center">
                          <div className="text-xs uppercase font-pixel" style={{ color: rarityColors[nft.rarity] }}>
                            {nft.rarity}
                          </div>
                          <div className="text-xs text-gray-400">{nft.id}</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
    </div>
  )
}

