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

  // Handle pixelated animated background
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

    // VOID theme colors - cyberpunk neon palette
    const voidColors = [
      "#ff2a6d", // Neon pink
      "#05d9e8", // Cyan
      "#d1f7ff", // Light blue
      "#7700a6", // Purple
      "#8900f2", // Bright purple
      "#b100e8", // Magenta
      "#ff00a0", // Hot pink
      "#01012b", // Dark blue
    ]

    // Set up pixelated grid
    const pixelSize = 20 // Size of each "pixel" in the background
    const cols = Math.ceil(canvas.width / pixelSize)
    const rows = Math.ceil(canvas.height / pixelSize)
    
    // Create pixel grid with initial colors and properties
    const pixels: {
      x: number; y: number; size: number; color: string; alpha: number // Different opacity levels
      pulseSpeed: number; pulsePhase: number // Random starting phase
      glitchTimer: number; glitchDuration: number; moveDirection: number // 0: right, 1: down, 2: left, 3: up
      moveSpeed: number; moveTimer: number; isGlowing: boolean
    }[] = []
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const isVisible = Math.random() > 0.7 // 30% of pixels are visible initially
        const colorIndex = Math.floor(Math.random() * voidColors.length)
        
        pixels.push({
          x: x * pixelSize,
          y: y * pixelSize,
          size: pixelSize,
          color: voidColors[colorIndex],
          alpha: isVisible ? (Math.random() * 0.3 + 0.1) : 0, // Different opacity levels
          pulseSpeed: Math.random() * 0.005 + 0.002,
          pulsePhase: Math.random() * Math.PI * 2, // Random starting phase
          glitchTimer: Math.random() * 100,
          glitchDuration: 0,
          moveDirection: Math.floor(Math.random() * 4), // 0: right, 1: down, 2: left, 3: up
          moveSpeed: Math.random() * 0.2 + 0.05,
          moveTimer: Math.random() * 100,
          isGlowing: Math.random() > 0.9, // 10% have glow effect
        })
      }
    }

    // Create grid lines
    const gridLines: { x1: number; y1: number; x2: number; y2: number; color: string; alpha: number; pulseSpeed: number }[] = []
    // Horizontal grid lines
    for (let y = 0; y <= rows; y++) {
      gridLines.push({
        x1: 0,
        y1: y * pixelSize,
        x2: canvas.width,
        y2: y * pixelSize,
        color: "#7700a620", // Semi-transparent purple
        alpha: 0.2 + Math.random() * 0.1,
        pulseSpeed: Math.random() * 0.005 + 0.001,
      })
    }
    // Vertical grid lines
    for (let x = 0; x <= cols; x++) {
      gridLines.push({
        x1: x * pixelSize,
        y1: 0,
        x2: x * pixelSize,
        y2: canvas.height,
        color: "#05d9e820", // Semi-transparent cyan
        alpha: 0.2 + Math.random() * 0.1,
        pulseSpeed: Math.random() * 0.005 + 0.001,
      })
    }

    // Create scan lines for retro effect
    const scanLines: { y: number; height: number; alpha: number }[] = []
    const scanLineHeight = 2
    for (let y = 0; y < canvas.height; y += scanLineHeight * 2) {
      scanLines.push({
        y,
        height: scanLineHeight,
        alpha: 0.1,
      })
    }

    // Create floating geometric shapes
    const shapes: { type: number; x: number; y: number; size: number; color: string; speedX: number; speedY: number; rotation: number; rotationSpeed: number; alpha: number; isGlowing: boolean }[] = []
    const shapeCount = 15
    for (let i = 0; i < shapeCount; i++) {
      const shapeType = Math.floor(Math.random() * 3) // 0: square, 1: circle, 2: triangle
      const size = Math.random() * 30 + 10
      shapes.push({
        type: shapeType,
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size,
        color: voidColors[Math.floor(Math.random() * voidColors.length)],
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.01,
        alpha: Math.random() * 0.3 + 0.2,
        isGlowing: Math.random() > 0.6, // 40% are glowing
      })
    }

    // Create random "glitch" effects
    const glitchEffects: { x: number; y: number; width: number; height: number; alpha: number; color: string; duration: number; cooldown: number }[] = []
    for (let i = 0; i < 5; i++) {
      glitchEffects.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        width: Math.random() * 300 + 50,
        height: Math.random() * 20 + 10,
        alpha: 0,
        color: voidColors[Math.floor(Math.random() * voidColors.length)],
        duration: 0,
        cooldown: Math.random() * 100 + 50,
      })
    }

    // Create "data streams" - vertical lines of falling pixels
    const dataStreams: { x: number; segments: { y: number; char: string; alpha: number }[]; speed: number; length: number; color: string; alpha: number; active: boolean; timer: number; restartDelay: number }[] = []
    for (let i = 0; i < 20; i++) {
      dataStreams.push({
        x: Math.random() * canvas.width,
        segments: [],
        speed: Math.random() * 2 + 1,
        length: Math.floor(Math.random() * 15 + 5),
        color: voidColors[Math.floor(Math.random() * voidColors.length)],
        alpha: Math.random() * 0.5 + 0.3,
        active: Math.random() > 0.5,
        timer: 0,
        restartDelay: Math.random() * 200 + 100,
      })
    }

    // Animation loop
    let time = 0
    const animate = () => {
      time += 0.016 // Approximate time increment (assuming 60fps)
      
      // Clear the canvas
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw grid lines with pulsing effect
      gridLines.forEach(line => {
        const pulseAlpha = line.alpha + Math.sin(time * line.pulseSpeed) * 0.05
        ctx.strokeStyle = line.color.substring(0, 7) + Math.floor(pulseAlpha * 255).toString(16).padStart(2, '0')
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(line.x1, line.y1)
        ctx.lineTo(line.x2, line.y2)
        ctx.stroke()
      })

      // Draw pixels
      pixels.forEach(pixel => {
        // Update pixel properties
        pixel.glitchTimer -= 0.016
        pixel.moveTimer -= 0.016
        
        // Randomly start glitch effect
        if (pixel.glitchTimer <= 0 && pixel.glitchDuration <= 0 && Math.random() > 0.995) {
          pixel.glitchDuration = Math.random() * 0.3 + 0.1
          pixel.color = voidColors[Math.floor(Math.random() * voidColors.length)]
          pixel.alpha = Math.random() * 0.6 + 0.2
        }
        
        // Handle glitch duration
        if (pixel.glitchDuration > 0) {
          pixel.glitchDuration -= 0.016
          if (pixel.glitchDuration <= 0) {
            pixel.glitchTimer = Math.random() * 5 + 2
            pixel.alpha = Math.random() > 0.7 ? (Math.random() * 0.3 + 0.1) : 0
          }
        }
        
        // Randomly change movement direction
        if (pixel.moveTimer <= 0) {
          pixel.moveDirection = Math.floor(Math.random() * 4)
          pixel.moveTimer = Math.random() * 5 + 3
        }
        
        // Move pixels slightly
        if (pixel.alpha > 0) {
          switch (pixel.moveDirection) {
            case 0: pixel.x += pixel.moveSpeed; break // right
            case 1: pixel.y += pixel.moveSpeed; break // down
            case 2: pixel.x -= pixel.moveSpeed; break // left
            case 3: pixel.y -= pixel.moveSpeed; break // up
          }
          
          // Wrap pixels around edges
          if (pixel.x < -pixel.size) pixel.x = canvas.width
          if (pixel.x > canvas.width) pixel.x = -pixel.size
          if (pixel.y < -pixel.size) pixel.y = canvas.height
          if (pixel.y > canvas.height) pixel.y = -pixel.size
        }
        
        // Pulse the alpha value
        const pulseAlpha = pixel.alpha + Math.sin(time + pixel.pulsePhase) * 0.1
        
        // Draw the pixel
        if (pulseAlpha > 0) {
          const alpha = Math.max(0, Math.min(1, pulseAlpha))
          ctx.fillStyle = pixel.color + Math.floor(alpha * 255).toString(16).padStart(2, '0')
          ctx.fillRect(pixel.x, pixel.y, pixel.size, pixel.size)
          
          // Add glow effect for some pixels
          if (pixel.isGlowing) {
            ctx.shadowColor = pixel.color
            ctx.shadowBlur = 10
            ctx.fillRect(pixel.x, pixel.y, pixel.size, pixel.size)
            ctx.shadowBlur = 0
          }
        }
      })

      // Draw the shapes
      shapes.forEach(shape => {
        // Update position
        shape.x += shape.speedX
        shape.y += shape.speedY
        shape.rotation += shape.rotationSpeed
        
        // Wrap around the screen
        if (shape.x < -shape.size) shape.x = canvas.width + shape.size
        if (shape.x > canvas.width + shape.size) shape.x = -shape.size
        if (shape.y < -shape.size) shape.y = canvas.height + shape.size
        if (shape.y > canvas.height + shape.size) shape.y = -shape.size
        
        ctx.save()
        ctx.translate(shape.x, shape.y)
        ctx.rotate(shape.rotation)
        
        // Set glow if needed
        if (shape.isGlowing) {
          ctx.shadowColor = shape.color
          ctx.shadowBlur = 15
        }
        
        ctx.fillStyle = shape.color + Math.floor(shape.alpha * 255).toString(16).padStart(2, '0')
        
        // Draw shape based on type
        switch (shape.type) {
          case 0: // Square
            ctx.fillRect(-shape.size / 2, -shape.size / 2, shape.size, shape.size)
            break
          case 1: // Circle
            ctx.beginPath()
            ctx.arc(0, 0, shape.size / 2, 0, Math.PI * 2)
            ctx.fill()
            break
          case 2: // Triangle
            ctx.beginPath()
            ctx.moveTo(0, -shape.size / 2)
            ctx.lineTo(shape.size / 2, shape.size / 2)
            ctx.lineTo(-shape.size / 2, shape.size / 2)
            ctx.closePath()
            ctx.fill()
            break
        }
        
        ctx.shadowBlur = 0
        ctx.restore()
      })

      // Update and draw glitch effects
      glitchEffects.forEach(glitch => {
        if (glitch.duration > 0) {
          glitch.duration -= 0.016
          glitch.alpha = Math.min(1, glitch.duration * 5)
          
          if (glitch.duration <= 0) {
            glitch.cooldown = Math.random() * 100 + 50
          }
        } else {
          glitch.cooldown -= 0.016
          if (glitch.cooldown <= 0) {
            glitch.x = Math.random() * canvas.width
            glitch.y = Math.random() * canvas.height
            glitch.width = Math.random() * 300 + 50
            glitch.height = Math.random() * 20 + 10
            glitch.duration = Math.random() * 0.4 + 0.1
            glitch.color = voidColors[Math.floor(Math.random() * voidColors.length)]
          }
        }
        
        if (glitch.alpha > 0) {
          ctx.fillStyle = glitch.color + Math.floor(glitch.alpha * 255).toString(16).padStart(2, '0')
          ctx.fillRect(glitch.x, glitch.y, glitch.width, glitch.height)
        }
      })

      // Update and draw data streams
      dataStreams.forEach(stream => {
        if (stream.active) {
          // Move existing segments
          for (let i = 0; i < stream.segments.length; i++) {
            stream.segments[i].y += stream.speed
          }
          
          // Add new segment at the top
          if (stream.segments.length === 0 || 
              stream.segments[0].y > pixelSize) {
            stream.segments.unshift({
              y: 0,
              char: Math.random() > 0.5 ? '1' : '0',
              alpha: 1
            })
          }
          
          // Remove segments that moved off screen
          if (stream.segments.length > 0 && 
              stream.segments[stream.segments.length - 1].y > canvas.height) {
            stream.segments.pop()
          }
          
          // Draw segments
          ctx.font = `${pixelSize - 4}px "Press Start 2P", monospace`
          ctx.textAlign = 'center'
          
          for (let i = 0; i < stream.segments.length; i++) {
            const segment = stream.segments[i]
            const alpha = stream.alpha * (1 - (i / stream.length))
            if (alpha > 0) {
              ctx.fillStyle = stream.color + Math.floor(alpha * 255).toString(16).padStart(2, '0')
              ctx.fillText(segment.char, stream.x, segment.y)
            }
          }
          
          // Check if stream should deactivate
          if (stream.segments.length >= stream.length && 
              Math.random() > 0.995) {
            stream.active = false
            stream.timer = stream.restartDelay
          }
        } else {
          // Handle inactive streams
          stream.timer -= 0.016
          if (stream.timer <= 0) {
            stream.active = true
            stream.x = Math.random() * canvas.width
            stream.speed = Math.random() * 2 + 1
            stream.length = Math.floor(Math.random() * 15 + 5)
            stream.color = voidColors[Math.floor(Math.random() * voidColors.length)]
            stream.segments = []
          }
        }
      })

      // Draw scan lines
      scanLines.forEach(line => {
        ctx.fillStyle = `rgba(0, 0, 0, ${line.alpha})`
        ctx.fillRect(0, line.y, canvas.width, line.height)
      })
      
      // Create a digital "noise" effect
      if (Math.random() > 0.97) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.02)'
        for (let i = 0; i < 20; i++) {
          const x = Math.random() * canvas.width
          const y = Math.random() * canvas.height
          const size = Math.random() * 4 + 1
          ctx.fillRect(x, y, size, size)
        }
      }

      // Draw a subtle vignette effect
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width / 1.5
      )
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.6)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Continue animation loop
      requestAnimationFrame(animate)
    }

    // Start animation
    const animationId = requestAnimationFrame(animate)

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Background Canvas */}
      <canvas
        ref={bgCanvasRef}
        className="absolute inset-0 w-full h-full opacity-90"
      />

      <Navigation />

      <div className="pt-20 pb-16 min-h-[calc(100vh-200px)] relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8 text-center"
        >
          <h1
            style={pixelFontStyle}
            className="text-3xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400 tracking-wider glitch-text"
            data-text="VOID DEVICE"
          >
            VOID DEVICE
          </h1>
          <p className="text-gray-400 mt-2 max-w-2xl mx-auto">
            Generate pixel art with AI. Describe your idea and watch it come to life.
          </p>
        </motion.div>

        {/* Main Content - Left-Right Layout */}
        <div className="max-w-7xl mx-auto px-4 flex flex-col lg:flex-row gap-8">
          {/* Left Column - Prompt Section */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="lg:w-2/5"
          >
            <div className="bg-gradient-to-br from-purple-900/30 to-black border border-purple-500/50 rounded-lg p-6 backdrop-blur-md shadow-lg shadow-purple-500/20">
              <div className="flex justify-between items-center mb-4">
                <h2
                  style={pixelFontStyle}
                  className="text-xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 tracking-wide"
                >
                  DESCRIBE YOUR PIXEL ART
                </h2>
                <div className="flex items-center space-x-2">
                  <span
                    style={pixelFontStyle}
                    className="text-sm text-gray-400"
                  >
                    Size:
                  </span>
                  <select
                    value={canvasSize}
                    onChange={(e) => setCanvasSize(Number(e.target.value))}
                    className="bg-black/60 border border-purple-500 text-white rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                    style={pixelFontStyle}
                  >
                    <option value={16}>16×16</option>
                    <option value={32}>32×32</option>
                    <option value={64}>64×64</option>
                  </select>
                </div>
              </div>

              <textarea
                className="w-full h-32 bg-black/50 border border-purple-500/50 rounded-md p-4 text-white resize-none focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-300"
                style={{ fontFamily: "sans-serif" }}
                placeholder="Enter your pixel art idea... (e.g., 'A cyberpunk cat with neon glasses', 'A pixel art sunset over mountains', 'An 8-bit spaceship with laser beams')"
              />

              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-black/40 border border-purple-500/30 rounded p-2 cursor-pointer hover:border-purple-500 transition-all duration-300">
                    <span className="text-xs text-gray-300 block mb-1">Style:</span>
                    <select className="w-full bg-black/60 border border-purple-500/50 text-white rounded px-2 py-1 text-sm focus:outline-none">
                      <option>Modern</option>
                      <option>Retro</option>
                      <option>Fantasy</option>
                      <option>Sci-Fi</option>
                    </select>
                  </div>
                  <div className="bg-black/40 border border-purple-500/30 rounded p-2 cursor-pointer hover:border-purple-500 transition-all duration-300">
                    <span className="text-xs text-gray-300 block mb-1">Colors:</span>
                    <select className="w-full bg-black/60 border border-purple-500/50 text-white rounded px-2 py-1 text-sm focus:outline-none">
                      <option>Vibrant</option>
                      <option>Pastel</option>
                      <option>Monochrome</option>
                      <option>Neon</option>
                    </select>
                  </div>
                  <div className="bg-black/40 border border-purple-500/30 rounded p-2 cursor-pointer hover:border-purple-500 transition-all duration-300">
                    <span className="text-xs text-gray-300 block mb-1">Detail:</span>
                    <select className="w-full bg-black/60 border border-purple-500/50 text-white rounded px-2 py-1 text-sm focus:outline-none">
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </div>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border border-purple-500/30 rounded-md px-6 py-3 font-pixel uppercase tracking-wider shadow-lg shadow-purple-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/30"
                  style={pixelFontStyle}
                >
                  Generate
                </Button>

                <p
                  className="text-xs text-gray-400 mt-2 text-center px-4"
                >
                  Powered by AI. No wallet needed. Your art will appear on the canvas.
                </p>
              </div>
            </div>

            {/* Recent Generations */}
            <div className="mt-6 bg-gradient-to-br from-purple-900/20 to-black/40 border border-purple-500/30 rounded-lg p-4 backdrop-blur-md">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">RECENT GENERATIONS</h3>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="aspect-square bg-black/50 border border-purple-500/30 rounded overflow-hidden hover:border-pink-500 transition-all duration-300 cursor-pointer">
                    {/* Placeholder for generated art */}
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-xs text-gray-500">Art #{i}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right Column - Canvas Section */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="lg:w-3/5"
          >
            <div className="relative w-full aspect-square max-h-[80vh] rounded-lg border-4 border-purple-500/50 overflow-hidden shadow-lg shadow-purple-500/20 backdrop-blur-md">
              <canvas ref={canvasRef} className="w-full h-full" />
              
              {/* Device frame effects */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 border-2 border-purple-600/70 rounded-lg"></div>
                
                {/* Top notch */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-3 bg-gradient-to-r from-purple-600/50 via-pink-500/50 to-purple-600/50 rounded-b-md"></div>
                
                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-cyan-500/50 rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-pink-500/50 rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-pink-500/50 rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-cyan-500/50 rounded-br-lg"></div>
                
                {/* Scanline effect */}
                <div className="absolute inset-0 bg-scanline opacity-10 pointer-events-none"></div>
                
                {/* Light reflection */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-30 pointer-events-none"></div>
              </div>
              
              {/* Controls overlay */}
              <div className="absolute bottom-4 right-4 flex space-x-2">
                <button className="bg-black/60 text-white p-2 rounded-full border border-purple-500/50 hover:border-purple-500 transition-all duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
                <button className="bg-black/60 text-white p-2 rounded-full border border-purple-500/50 hover:border-purple-500 transition-all duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                </button>
                <button className="bg-black/60 text-white p-2 rounded-full border border-purple-500/50 hover:border-purple-500 transition-all duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                    <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="mt-4 flex space-x-3 justify-end">
              <Button className="bg-black/60 hover:bg-black/80 border border-cyan-500/50 hover:border-cyan-500 text-white rounded px-4 py-2 font-pixel text-sm transition-all duration-300">
                Download
              </Button>
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded px-4 py-2 font-pixel text-sm transition-all duration-300">
                Share
              </Button>
              <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded px-4 py-2 font-pixel text-sm transition-all duration-300">
                Save to Gallery
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      <style jsx>{`
        .bg-scanline {
          background: linear-gradient(
            to bottom,
            transparent 50%,
            rgba(0, 0, 0, 0.1) 50%
          );
          background-size: 100% 4px;
        }
        
        @keyframes glitch {
          0% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
          100% { transform: translate(0); }
        }
        
        .glitch-text {
          position: relative;
          animation: glitch 0.5s infinite;
          animation-play-state: paused;
        }
        
        .glitch-text:hover {
          animation-play-state: running;
        }
        
        .glitch-text::before,
        .glitch-text::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: black;
        }
        
        .glitch-text::before {
          left: -2px;
          text-shadow: 2px 0 #ff2a6d;
          clip: rect(24px, 550px, 90px, 0);
          animation: glitch-anim 3s infinite linear alternate-reverse;
        }
        
        .glitch-text::after {
          left: 2px;
          text-shadow: -2px 0 #05d9e8;
          clip: rect(85px, 550px, 140px, 0);
          animation: glitch-anim2 2.5s infinite linear alternate-reverse;
        }
        
        @keyframes glitch-anim {
          0% { clip: rect(52px, 9999px, 21px, 0); }
          20% { clip: rect(35px, 9999px, 36px, 0); }
          40% { clip: rect(63px, 9999px, 44px, 0); }
          60% { clip: rect(14px, 9999px, 97px, 0); }
          80% { clip: rect(79px, 9999px, 53px, 0); }
          100% { clip: rect(45px, 9999px, 65px, 0); }
        }
        
        @keyframes glitch-anim2 {
          0% { clip: rect(78px, 9999px, 81px, 0); }
          20% { clip: rect(46px, 9999px, 15px, 0); }
          40% { clip: rect(13px, 9999px, 91px, 0); }
          60% { clip: rect(84px, 9999px, 67px, 0); }
          80% { clip: rect(36px, 9999px, 79px, 0); }
          100% { clip: rect(59px, 9999px, 27px, 0); }
        }
      `}</style>

      <Footer />
    </div>
  )
}