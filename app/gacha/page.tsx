"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"

// Pixel font for the cyberpunk aesthetic
const pixelFontStyle = {
  fontFamily: "'Press Start 2P', cursive",
}

export default function PixelArtPage() {
  const [canvasSize, setCanvasSize] = useState(128)
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bgCanvasRef = useRef<HTMLCanvasElement>(null)

  // Handle main canvas initialization
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

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

      // Lighter, more transparent grid color
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)" // Faint white grid
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

  // Handle background canvas animation
  useEffect(() => {
    if (!bgCanvasRef.current) return

    const canvas = bgCanvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    const stars: any[] = []
    const starCount = 200
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1,
        color: ["#a855f7", "#ec4899", "#60a5fa", "#ffffff"][Math.floor(Math.random() * 4)],
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.5 + 0.5,
        glowSize: Math.random() * 3 + 1,
        pulseSpeed: Math.random() * 0.05 + 0.02,
      })
    }

    const smallDots: any[] = []
    const smallDotCount = 150
    for (let i = 0; i < smallDotCount; i++) {
      smallDots.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.5 + 0.5,
        color: ["#a855f7", "#ec4899", "#60a5fa", "#ffffff"][Math.floor(Math.random() * 4)],
        speedX: (Math.random() - 0.5) * 0.8,
        speedY: (Math.random() - 0.5) * 0.8,
        opacity: Math.random() * 0.3 + 0.3,
        glowSize: Math.random() * 1 + 0.5,
        pulseSpeed: Math.random() * 0.06 + 0.03,
      })
    }

    const nebulae: any[] = [
      { x: canvas.width * 0.3, y: canvas.height * 0.4, size: 250, color: "rgba(168, 85, 247, 0.15)" },
      { x: canvas.width * 0.7, y: canvas.height * 0.6, size: 200, color: "rgba(236, 72, 153, 0.15)" },
      { x: canvas.width * 0.5, y: canvas.height * 0.2, size: 220, color: "rgba(96, 165, 250, 0.15)" },
    ]

    let animationFrameId: number
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      gradient.addColorStop(0, "rgba(10, 10, 25, 0.9)")
      gradient.addColorStop(1, "rgba(20, 20, 40, 0.9)")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

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

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  // Handle download with a larger image size
  const handleDownload = () => {
    if (!generatedImageUrl || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Create a temporary canvas to draw the image
    const tempCanvas = document.createElement("canvas")
    tempCanvas.width = canvasSize
    tempCanvas.height = canvasSize
    const tempCtx = tempCanvas.getContext("2d")
    if (!tempCtx) return

    // Draw the generated image
    const img = new Image()
    img.crossOrigin = "Anonymous"
    img.src = generatedImageUrl
    img.onload = () => {
      tempCtx.drawImage(img, 0, 0, canvasSize, canvasSize)

      // Create a high-quality download canvas with a larger size
      const downloadSize = 2048 // Set to 2048x2048 for a "normal" image size
      const downloadCanvas = document.createElement("canvas")
      downloadCanvas.width = downloadSize
      downloadCanvas.height = downloadSize
      const downloadCtx = downloadCanvas.getContext("2d")
      if (!downloadCtx) return

      // Draw the image, scaled up
      downloadCtx.imageSmoothingEnabled = false // Preserve pixelated look
      downloadCtx.drawImage(tempCanvas, 0, 0, downloadSize, downloadSize)

      // Download the image without the grid to preserve colors
      const link = document.createElement("a")
      link.href = downloadCanvas.toDataURL("image/png", 1.0) // High quality
      link.download = `pixel-art-${downloadSize}x${downloadSize}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  // Handle mint (placeholder)
  const handleMint = () => {
    alert('Minting functionality not implemented yet.')
    // Add actual minting logic here (e.g., connect to blockchain/NFT platform)
  }

  // Generate pixel art and reveal pixel by pixel
  const generatePixelArt = async () => {
    if (!canvasRef.current || !prompt) return
    setIsGenerating(true)
    setErrorMessage("")
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    try {
      const formData = new FormData()
      formData.append('prompt', prompt)
      formData.append('canvasSize', canvasSize.toString())

      const response = await fetch('/api/generate-pixel-art', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch from API route')
      }

      const blob = await response.blob()
      const imageUrl = URL.createObjectURL(blob)
      setGeneratedImageUrl(imageUrl)
      const img = new Image()
      img.crossOrigin = "Anonymous"
      img.src = imageUrl
      img.onload = () => {
        const tempCanvas = document.createElement("canvas")
        tempCanvas.width = canvasSize
        tempCanvas.height = canvasSize
        const tempCtx = tempCanvas.getContext("2d")
        if (!tempCtx) return
        tempCtx.drawImage(img, 0, 0, canvasSize, canvasSize)
        const imageData = tempCtx.getImageData(0, 0, canvasSize, canvasSize).data
        ctx.fillStyle = "#1a1a1a"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        const cellWidth = canvas.width / canvasSize
        const cellHeight = canvas.height / canvasSize
        const pixelCount = canvasSize * canvasSize
        const pixelIndices = Array.from({ length: pixelCount }, (_, i) => i)
        for (let i = pixelCount - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[pixelIndices[i], pixelIndices[j]] = [pixelIndices[j], pixelIndices[i]]
        }
        let pixelIndex = 0
        const pixelsPerFrame = Math.max(100, Math.floor(canvasSize * canvasSize / 1000))
        const reveal = () => {
          for (let i = 0; i < pixelsPerFrame && pixelIndex < pixelCount; i++) {
            const idx = pixelIndices[pixelIndex]
            const x = idx % canvasSize
            const y = Math.floor(idx / canvasSize)
            const r = imageData[idx * 4]
            const g = imageData[idx * 4 + 1]
            const b = imageData[idx * 4 + 2]
            const a = imageData[idx * 4 + 3]
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`
            ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight)
            pixelIndex++
          }
          if (pixelIndex < pixelCount) {
            setTimeout(() => requestAnimationFrame(reveal), 10)
          } else {
            setIsGenerating(false)
          }
        }
        requestAnimationFrame(reveal)
      }
      img.onerror = () => {
        throw new Error('Failed to load generated image')
      }
    } catch (error: any) {
      console.error("Error generating pixel art:", error)
      const displayError = error.message.includes('Authentication error')
        ? 'API Error: Invalid API key or permissions'
        : error.message.includes('Rate limit exceeded')
        ? 'API Error: Rate limit exceeded, try again later'
        : error.message.includes('Stability API error')
        ? `API Error: ${error.message.split(' - ')[1] || 'Invalid request parameters'}`
        : 'Failed to generate pixel art'
      setErrorMessage(displayError)
      ctx.fillStyle = "#ffffff"
      ctx.font = "20px 'Press Start 2P'"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(`ERROR: ${displayError}`, canvas.width / 2, canvas.height / 2)
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white relative">
      <canvas
        ref={bgCanvasRef}
        className="absolute inset-0 w-full h-full opacity-70"
      />

      <Navigation />

      <div className="pt-24 pb-16 flex items-center justify-center min-h-[calc(100vh-200px)] relative z-10">
        <div className="w-full max-w-6xl mx-auto px-6 flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
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
                      disabled={isGenerating}
                    >
                      <option value={128}>128x</option>
                      <option value={356}>356x</option>
                      <option value={512}>512x</option>
                      <option value={1024}>1024x</option>
                    </select>
                  </div>
                </div>

                <textarea
                  className="w-full h-48 bg-black/50 border border-purple-500/50 rounded-md p-4 text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                  style={pixelFontStyle}
                  placeholder="Enter your pixel art idea (e.g., a cyberpunk city at night)..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={isGenerating}
                />

                <Button
                  className="w-full mt-6 bg-transparent text-white border-2 border-purple-500 hover:bg-purple-500/20 rounded-none px-6 py-3 font-pixel uppercase tracking-wider"
                  style={pixelFontStyle}
                  onClick={generatePixelArt}
                  disabled={isGenerating || !prompt}
                >
                  {isGenerating ? "GENERATING..." : "GENERATE"}
                </Button>

                <div className="flex space-x-4 mt-4">
                  <Button
                    className="w-1/2 bg-transparent text-white border-2 border-purple-500 hover:bg-purple-500/20 rounded-none px-6 py-3 font-pixel uppercase tracking-wider"
                    style={pixelFontStyle}
                    onClick={handleDownload}
                    disabled={!generatedImageUrl || isGenerating}
                  >
                    DOWNLOAD
                  </Button>
                  <Button
                    className="w-1/2 bg-transparent text-white border-2 border-purple-500 hover:bg-purple-500/20 rounded-none px-6 py-3 font-pixel uppercase tracking-wider"
                    style={pixelFontStyle}
                    onClick={handleMint}
                    disabled={!generatedImageUrl || isGenerating}
                  >
                    MINT
                  </Button>
                </div>

                {errorMessage && (
                  <p
                    style={pixelFontStyle}
                    className="text-xs text-red-400 mt-4 text-center"
                  >
                    {errorMessage}
                  </p>
                )}
              </div>
            </motion.div>
          </div>

          <div className="w-full md:w-1/2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="relative w-full aspect-square rounded-lg border-4 border-purple-500/50 overflow-hidden shadow-lg shadow-purple-500/20">
                <canvas ref={canvasRef} className="w-full h-full" />
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 border-2 border-purple-600/70 rounded-lg"></div>
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-2 bg-purple-600/50 rounded-b-sm"></div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}