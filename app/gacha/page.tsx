"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
// Import icons from phosphor-icons
import { Planet, Star, Meteor, Sun, Moon, ShootingStar, Rocket, Airplane } from "@phosphor-icons/react"
// Import renderToStaticMarkup to render icons to SVG string
import { renderToStaticMarkup } from "react-dom/server"

// Pixel font for the cyberpunk aesthetic
const pixelFontStyle = {
  fontFamily: "'Press Start 2P', cursive",
}

export default function PixelArtPage() {
  const [canvasSize, setCanvasSize] = useState(32)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bgCanvasRef = useRef<HTMLCanvasElement>(null)

  // Handle main canvas initialization
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const resizeCanvas = () => {
      const container = canvas.parentElement
      if (!container) return
      canvas.width = container.clientWidth
      canvas.height = container.clientHeight

      // Draw grid
      const gridSize = canvasSize
      const cellWidth = canvas.width / gridSize
      const cellHeight = canvas.height / gridSize

      ctx.fillStyle = "#1a1a1a"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.strokeStyle = "#333333"
      ctx.lineWidth = 1

      for (let x = 0; x <= gridSize; x++) {
        ctx.beginPath()
        ctx.moveTo(x * cellWidth, 0)
        ctx.lineTo(x * cellWidth, canvas.height)
        ctx.stroke()
      }

      for (let y = 0; y <= gridSize; y++) {
        ctx.beginPath()
        ctx.moveTo(0, y * cellHeight)
        ctx.lineTo(canvas.width, y * cellHeight)
        ctx.stroke()
      }

      // Draw placeholder text
      ctx.fillStyle = "#ffffff"
      ctx.font = "20px 'Press Start 2P'"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      const text = "[ YOUR PIXEL ART WILL SHOW HERE ]"
      ctx.fillText(text, canvas.width / 2, canvas.height / 2)
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    return () => window.removeEventListener("resize", resizeCanvas)
  }, [canvasSize])

  // Handle background canvas animation with enhanced galaxy theme
  useEffect(() => {
    if (!bgCanvasRef.current) return

    const canvas = bgCanvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Create main starry dots
    const stars: any[] = []
    const starCount = 200
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1,
        color: ["#a855f7", "#ec4899", "#60a5fa", "#4ade80", "#f97316"][Math.floor(Math.random() * 5)],
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.5 + 0.5,
        glowSize: Math.random() * 3 + 1,
        pulseSpeed: Math.random() * 0.05 + 0.02,
      })
    }

    // Create smaller, faster-moving dots for depth
    const smallDots: any[] = []
    const smallDotCount = 150
    for (let i = 0; i < smallDotCount; i++) {
      smallDots.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.5 + 0.5,
        color: ["#a855f7", "#ec4899", "#60a5fa", "#4ade80", "#f97316"][Math.floor(Math.random() * 5)],
        speedX: (Math.random() - 0.5) * 0.8,
        speedY: (Math.random() - 0.5) * 0.8,
        opacity: Math.random() * 0.3 + 0.3,
        glowSize: Math.random() * 1 + 0.5,
        pulseSpeed: Math.random() * 0.06 + 0.03,
      })
    }

    // Create floating icons (using imported icons)
    const floaters: any[] = []
    const floaterCount = 60 // Increased from 40 to 60
    const iconTypes = [
      { icon: Planet, type: "planet" },
      { icon: Star, type: "star" },
      { icon: Meteor, type: "meteor" },
      { icon: Sun, type: "sun" },
      { icon: Moon, type: "moon" },
      { icon: ShootingStar, type: "shootingStar" },
      { icon: Rocket, type: "rocket" },
      { icon: Airplane, type: "airplane" },
    ]

    // Convert SVG icons to images for canvas rendering
    const iconImages: { [key: string]: HTMLImageElement } = {}
    const themeColors = ["#a855f7", "#ec4899", "#60a5fa", "#4ade80", "#f97316"]
    const loadIcons = async () => {
      for (const { icon: IconComponent, type } of iconTypes) {
        const color = themeColors[Math.floor(Math.random() * themeColors.length)]
        const svgString = renderToStaticMarkup(
          <IconComponent size={64} color={color} />
        )
        const img = new Image()
        img.src = `data:image/svg+xml;base64,${btoa(svgString)}`
        await new Promise((resolve) => (img.onload = resolve))
        iconImages[type] = img
      }
    }

    // Load icons before starting animation
    loadIcons().then(() => {
      for (let i = 0; i < floaterCount; i++) {
        const { type } = iconTypes[Math.floor(Math.random() * iconTypes.length)]
        floaters.push({
          type,
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 30 + 10, // Reduced size range (10 to 40 pixels)
          speedX: (Math.random() - 0.5) * 0.9,
          speedY: (Math.random() - 0.5) * 0.9,
          opacity: Math.random() * 0.4 + 0.5,
          glowSize: Math.random() * 10 + 5,
          scale: 1,
          scaleSpeed: Math.random() * 0.04 + 0.02,
        })
      }

      // Create more nebula-like clusters
      const nebulae: any[] = [
        { x: canvas.width * 0.3, y: canvas.height * 0.4, size: 250, color: "rgba(168, 85, 247, 0.15)" },
        { x: canvas.width * 0.7, y: canvas.height * 0.6, size: 200, color: "rgba(236, 72, 153, 0.15)" },
        { x: canvas.width * 0.5, y: canvas.height * 0.2, size: 220, color: "rgba(96, 165, 250, 0.15)" },
        { x: canvas.width * 0.2, y: canvas.height * 0.7, size: 180, color: "rgba(74, 222, 128, 0.15)" },
        { x: canvas.width * 0.8, y: canvas.height * 0.3, size: 200, color: "rgba(249, 115, 22, 0.15)" },
      ]

      // Background gradient animation
      let gradientOffset = 0

      // Animation loop
      let animationFrameId: number
      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Draw animated background gradient with more vibrant colors
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
        gradient.addColorStop(0, `rgba(26, 10, 41, ${0.9 + Math.sin(gradientOffset) * 0.1})`)
        gradient.addColorStop(0.3, `rgba(74, 222, 128, ${0.2 + Math.cos(gradientOffset) * 0.05})`)
        gradient.addColorStop(0.6, `rgba(249, 115, 22, ${0.2 + Math.sin(gradientOffset) * 0.05})`)
        gradient.addColorStop(1, `rgba(41, 10, 26, ${0.9 + Math.cos(gradientOffset) * 0.1})`)
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        gradientOffset += 0.015

        // Draw nebula-like background gradients
        nebulae.forEach((nebula) => {
          const gradient = ctx.createRadialGradient(
            nebula.x,
            nebula.y,
            0,
            nebula.x,
            nebula.y,
            nebula.size
          )
          gradient.addColorStop(0, nebula.color)
          gradient.addColorStop(1, "rgba(0, 0, 0, 0)")

          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(nebula.x, nebula.y, nebula.size, 0, Math.PI * 2)
          ctx.fill()
        })

        // Draw smaller dots (background layer)
        smallDots.forEach((dot) => {
          const gradient = ctx.createRadialGradient(
            dot.x,
            dot.y,
            0,
            dot.x,
            dot.y,
            dot.glowSize + dot.size
          )
          gradient.addColorStop(0, `${dot.color}80`)
          gradient.addColorStop(1, "rgba(0, 0, 0, 0)")

          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(dot.x, dot.y, dot.glowSize + dot.size, 0, Math.PI * 2)
          ctx.fill()

          ctx.globalAlpha = dot.opacity
          ctx.fillStyle = dot.color
          ctx.beginPath()
          ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2)
          ctx.fill()
          ctx.globalAlpha = 1

          dot.x += dot.speedX
          dot.y += dot.speedY

          if (dot.x < 0 || dot.x > canvas.width) dot.speedX *= -1
          if (dot.y < 0 || dot.y > canvas.height) dot.speedY *= -1

          dot.opacity = Math.max(0.3, Math.min(0.6, dot.opacity + Math.sin(Date.now() * dot.pulseSpeed) * 0.03))
        })

        // Draw main stars
        stars.forEach((star) => {
          const gradient = ctx.createRadialGradient(
            star.x,
            star.y,
            0,
            star.x,
            star.y,
            star.glowSize + star.size
          )
          gradient.addColorStop(0, `${star.color}80`)
          gradient.addColorStop(1, "rgba(0, 0, 0, 0)")

          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(star.x, star.y, star.glowSize + star.size, 0, Math.PI * 2)
          ctx.fill()

          ctx.globalAlpha = star.opacity
          ctx.fillStyle = star.color
          ctx.beginPath()
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
          ctx.fill()
          ctx.globalAlpha = 1

          star.x += star.speedX
          star.y += star.speedY

          if (star.x < 0 || star.x > canvas.width) star.speedX *= -1
          if (star.y < 0 || star.y > canvas.height) star.speedY *= -1

          star.opacity = Math.max(0.5, Math.min(1, star.opacity + Math.sin(Date.now() * star.pulseSpeed) * 0.03))
        })

        // Draw floating icons from dependency with glow
        floaters.forEach((floater) => {
          ctx.globalAlpha = floater.opacity

          const img = iconImages[floater.type]
          if (img) {
            // Add glow effect
            const glowGradient = ctx.createRadialGradient(
              floater.x,
              floater.y,
              0,
              floater.x,
              floater.y,
              floater.glowSize + floater.size / 2
            )
            glowGradient.addColorStop(0, `${themeColors[Math.floor(Math.random() * themeColors.length)]}40`)
            glowGradient.addColorStop(1, "rgba(0, 0, 0, 0)")

            ctx.fillStyle = glowGradient
            ctx.beginPath()
            ctx.arc(floater.x, floater.y, floater.glowSize + floater.size / 2, 0, Math.PI * 2)
            ctx.fill()

            // Apply pixelation by drawing at a low resolution and scaling up
            const pixelatedCanvas = document.createElement("canvas")
            const pixelatedCtx = pixelatedCanvas.getContext("2d")
            if (pixelatedCtx) {
              const pixelatedSize = 16
              pixelatedCanvas.width = pixelatedSize
              pixelatedCanvas.height = pixelatedSize
              pixelatedCtx.drawImage(img, 0, 0, pixelatedSize, pixelatedSize)

              ctx.imageSmoothingEnabled = false
              ctx.drawImage(
                pixelatedCanvas,
                floater.x - floater.size / 2,
                floater.y - floater.size / 2,
                floater.size,
                floater.size
              )
              ctx.imageSmoothingEnabled = true
            }
          }

          ctx.globalAlpha = 1

          floater.x += floater.speedX
          floater.y += floater.speedY
          floater.scale += Math.sin(Date.now() * floater.scaleSpeed) * 0.005

          if (floater.x < -floater.size || floater.x > canvas.width + floater.size) {
            floater.x = floater.x < 0 ? canvas.width + floater.size : -floater.size
          }
          if (floater.y < -floater.size || floater.y > canvas.height + floater.size) {
            floater.y = floater.y < 0 ? canvas.height + floater.size : -floater.size
          }
        })

        animationFrameId = requestAnimationFrame(animate)
      }

      animate()

      return () => {
        window.removeEventListener("resize", resizeCanvas)
        cancelAnimationFrame(animationFrameId)
      }
    })
  }, [])

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Background Canvas */}
      <canvas
        ref={bgCanvasRef}
        className="absolute inset-0 w-full h-full opacity-70"
      />

      <Navigation />

      <div className="pt-24 pb-16 flex flex-col items-center justify-center min-h-[calc(100vh-200px)] relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <h1
            style={pixelFontStyle}
            className="text-3xl md:text-4xl text-white tracking-wider"
          >
            VOID DEVICE
          </h1>
        </motion.div>

        {/* Canvas Section */}
        <div className="w-full max-w-4xl mx-auto px-6 mb-8">
          <div className="relative w-full aspect-square rounded-lg border-4 border-purple-500/50 overflow-hidden shadow-lg shadow-purple-500/20">
            <canvas ref={canvasRef} className="w-full h-full" />
            {/* Device frame effect */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 border-2 border-purple-600/70 rounded-lg"></div>
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-2 bg-purple-600/50 rounded-b-sm"></div>
            </div>
          </div>
        </div>

        {/* Prompt Section */}
        <div className="w-full max-w-2xl mx-auto px-6">
          <div className="bg-gradient-to-br from-purple-900/20 to-black border border-purple-500/50 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2
                style={pixelFontStyle}
                className="text-xl text-white tracking-wide"
              >
                DESCRIBE YOUR PIXEL ART IDEA
              </h2>
              <div className="flex items-center space-x-2">
                <span
                  style={pixelFontStyle}
                  className="text-sm text-gray-400"
                >
                  Canvas Size:
                </span>
                <select
                  value={canvasSize}
                  onChange={(e) => setCanvasSize(Number(e.target.value))}
                  className="bg-black border border-purple-500 text-white rounded px-2 py-1 text-sm"
                  style={pixelFontStyle}
                >
                  <option value={16}>16x</option>
                  <option value={32}>32x</option>
                  <option value={64}>64x</option>
                </select>
              </div>
            </div>

            <textarea
              className="w-full h-24 bg-black/50 border border-purple-500/50 rounded-md p-4 text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
              style={pixelFontStyle}
              placeholder="Enter your pixel art idea..."
            />

            <Button
              className="w-full mt-6 bg-purple-900 hover:bg-purple-800 text-white border border-purple-500 rounded-md px-6 py-3 font-pixel uppercase tracking-wider"
              style={pixelFontStyle}
            >
              Generate
            </Button>

            <p
              style={pixelFontStyle}
              className="text-xs text-gray-400 mt-4 text-center"
            >
              Powered by AI. No wallet needed.<br />
              Output will appear on the canvas above after prompt.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}