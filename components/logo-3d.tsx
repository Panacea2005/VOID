"use client"

import { useRef, useEffect } from "react"

export default function Logo3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<any[]>([])
  const animationRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

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
      particlesRef.current = []
      const particleCount = 50

      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 2 + 1,
          color: getRandomColor(),
          velocity: {
            x: (Math.random() - 0.5) * 1,
            y: (Math.random() - 0.5) * 1,
          },
        })
      }
    }

    // Get random color from purple/pink palette
    const getRandomColor = () => {
      const colors = [
        "#c084fc",
        "#a855f7",
        "#9333ea",
        "#7e22ce", // Purples
        "#f472b6",
        "#ec4899",
        "#db2777", // Pinks
      ]
      return colors[Math.floor(Math.random() * colors.length)]
    }

    // Draw logo
    const drawLogo = (time: number) => {
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const size = Math.min(canvas.width, canvas.height) * 0.6
      const rotation = time * 0.0001

      // Save context state
      ctx.save()

      // Translate to center and rotate
      ctx.translate(centerX, centerY)
      ctx.rotate(rotation)

      // Outer square with circles at corners
      const outerSize = size
      ctx.strokeStyle = "#a855f7"
      ctx.lineWidth = 3

      // Draw outer square
      ctx.beginPath()
      ctx.rect(-outerSize / 2, -outerSize / 2, outerSize, outerSize)
      ctx.stroke()

      // Draw circles at corners
      const circleRadius = 8
      const corners = [
        { x: -outerSize / 2, y: -outerSize / 2 },
        { x: outerSize / 2, y: -outerSize / 2 },
        { x: outerSize / 2, y: outerSize / 2 },
        { x: -outerSize / 2, y: outerSize / 2 },
      ]

      corners.forEach((corner) => {
        ctx.beginPath()
        ctx.fillStyle = "#a855f7"
        ctx.arc(corner.x, corner.y, circleRadius, 0, Math.PI * 2)
        ctx.fill()
      })

      // Middle square
      const middleSize = size * 0.6
      ctx.beginPath()
      ctx.rect(-middleSize / 2, -middleSize / 2, middleSize, middleSize)
      ctx.stroke()

      // Inner square with gradient
      const innerSize = size * 0.3
      const gradient = ctx.createLinearGradient(-innerSize / 2, -innerSize / 2, innerSize / 2, innerSize / 2)
      gradient.addColorStop(0, "#a855f7")
      gradient.addColorStop(1, "#ec4899")

      ctx.fillStyle = gradient
      ctx.fillRect(-innerSize / 2, -innerSize / 2, innerSize, innerSize)

      // Center dot
      ctx.beginPath()
      ctx.fillStyle = "#ff5555"
      ctx.arc(0, 0, 4, 0, Math.PI * 2)
      ctx.fill()

      // Restore context state
      ctx.restore()
    }

    // Animation loop
    const animate = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw logo
      drawLogo(time)

      // Draw and update particles
      particlesRef.current.forEach((particle) => {
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
        ctx.fillStyle = particle.color
        ctx.fill()

        // Update position
        particle.x += particle.velocity.x
        particle.y += particle.velocity.y

        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) {
          particle.velocity.x = -particle.velocity.x
        }

        if (particle.y < 0 || particle.y > canvas.height) {
          particle.velocity.y = -particle.velocity.y
        }

        // Draw lines to logo center if close enough
        const dx = particle.x - canvas.width / 2
        const dy = particle.y - canvas.height / 2
        const distance = Math.sqrt(dx * dx + dy * dy)
        const maxDistance = Math.min(canvas.width, canvas.height) * 0.4

        if (distance < maxDistance) {
          ctx.beginPath()
          ctx.strokeStyle = `rgba(168, 85, 247, ${0.5 - distance / maxDistance / 2})`
          ctx.lineWidth = 0.5
          ctx.moveTo(particle.x, particle.y)
          ctx.lineTo(canvas.width / 2, canvas.height / 2)
          ctx.stroke()
        }
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    createParticles()
    animationRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationRef.current)
    }
  }, [])

  return (
    <div className="w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full"></canvas>
    </div>
  )
}
