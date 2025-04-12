"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import PixelHeading from "@/components/pixel-heading"
import Script from "next/script"

// Simple Canvas Experience Component
const CanvasExperience = ({ onExit }: { onExit: () => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const requestRef = useRef<number | null>(null)
  const playerRef = useRef({ x: 0, y: 0, speed: 5 })
  const keysRef = useRef({ up: false, down: false, left: false, right: false })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let particles: any[] = []
    
    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      playerRef.current.x = window.innerWidth / 2
      playerRef.current.y = window.innerHeight / 2
    }
    
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    
    // Handle keyboard input
    const handleKeyDown = (e: { key: string }) => {
      if (e.key === 'ArrowUp' || e.key === 'w') keysRef.current.up = true
      if (e.key === 'ArrowDown' || e.key === 's') keysRef.current.down = true
      if (e.key === 'ArrowLeft' || e.key === 'a') keysRef.current.left = true
      if (e.key === 'ArrowRight' || e.key === 'd') keysRef.current.right = true
      if (e.key === 'Escape') onExit()
    }
    
    const handleKeyUp = (e: { key: string }) => {
      if (e.key === 'ArrowUp' || e.key === 'w') keysRef.current.up = false
      if (e.key === 'ArrowDown' || e.key === 's') keysRef.current.down = false
      if (e.key === 'ArrowLeft' || e.key === 'a') keysRef.current.left = false
      if (e.key === 'ArrowRight' || e.key === 'd') keysRef.current.right = false
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    // Animation loop
    const animate = () => {
      ctx.fillStyle = 'black'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Update player position
      if (keysRef.current.up) playerRef.current.y -= playerRef.current.speed
      if (keysRef.current.down) playerRef.current.y += playerRef.current.speed
      if (keysRef.current.left) playerRef.current.x -= playerRef.current.speed
      if (keysRef.current.right) playerRef.current.x += playerRef.current.speed
      
      // Keep player on screen
      playerRef.current.x = Math.max(10, Math.min(canvas.width - 10, playerRef.current.x))
      playerRef.current.y = Math.max(10, Math.min(canvas.height - 10, playerRef.current.y))
      
      // Create particles
      if (Math.random() < 0.3) {
        particles.push({
          x: playerRef.current.x,
          y: playerRef.current.y,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          size: Math.random() * 5 + 1,
          life: 30,
          color: `rgba(${Math.floor(Math.random() * 100 + 155)}, ${Math.floor(Math.random() * 50)}, ${Math.floor(Math.random() * 100 + 155)}, 0.7)`
        })
      }
      
      // Update and draw particles
      particles.forEach((p, index) => {
        p.x += p.vx
        p.y += p.vy
        p.life--
        
        if (p.life <= 0) {
          particles.splice(index, 1)
          return
        }
        
        const alpha = p.life / 30
        ctx.fillStyle = p.color.replace('0.7', String(alpha))
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      })
      
      // Draw player
      ctx.fillStyle = '#ec4899' // Pink
      ctx.beginPath()
      ctx.arc(playerRef.current.x, playerRef.current.y, 10, 0, Math.PI * 2)
      ctx.fill()
      
      // Draw instructions
      ctx.fillStyle = '#a855f7' // Purple
      ctx.font = '20px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('VOID: RESONANCE', canvas.width / 2, canvas.height / 2 - 100)
      
      ctx.fillStyle = '#ec4899' // Pink
      ctx.font = '14px monospace'
      ctx.fillText('Use arrow keys to move', canvas.width / 2, canvas.height / 2 + 80)
      ctx.fillText('Press ESC to exit', canvas.width / 2, canvas.height / 2 + 100)
      
      requestRef.current = requestAnimationFrame(animate)
    }
    
    requestRef.current = requestAnimationFrame(animate)
    
    return () => {
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [onExit])
  
  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 z-50 bg-black"
      style={{ touchAction: 'none' }}
    />
  )
}

export default function GamePage() {
  const [loading, setLoading] = useState(true)
  const [gameStarted, setGameStarted] = useState(false)
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const [cursorHover, setCursorHover] = useState(false)
  const [phaserLoaded, setPhaserLoaded] = useState(false)
  const [gameLoaded, setGameLoaded] = useState(false)
  const [useFallback, setUseFallback] = useState(false)
  const gameContainerRef = useRef<HTMLDivElement>(null)
  const gameInstanceRef = useRef<any>(null)

  // Handle cursor effects
  useEffect(() => {
    const handleMouseMove = (e: { clientX: number; clientY: number }) => {
      setCursorPosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  // Loading animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  // Start the game
  const startGame = () => {
    console.log("Starting game experience...")
    setGameStarted(true)
    
    // Use canvas fallback immediately, Phaser will take over when ready
    setUseFallback(true)
  }

  // Exit the game
  const exitGame = () => {
    console.log("Exiting game...")
    // Clean up game
    if (gameInstanceRef.current) {
      try {
        gameInstanceRef.current.destroy(true)
        gameInstanceRef.current = null
      } catch (error) {
        console.error("Error destroying game:", error)
      }
    }
    setGameStarted(false)
    setGameLoaded(false)
    setUseFallback(false)
  }

  // Initialize Phaser game when it's loaded and game is started
  useEffect(() => {
    if (!gameStarted || !phaserLoaded || typeof window === 'undefined') {
      return; // Exit early if conditions aren't met
    }
    
    // Make sure Phaser is available
    if (!window.Phaser) {
      console.error("Phaser is not available on window object");
      return; // Keep using fallback if Phaser isn't available
    }

    // Make sure the container element exists
    if (!gameContainerRef.current) {
      console.error("Game container ref is null");
      return; // Keep using fallback if container doesn't exist
    }
    
    console.log("Initializing Phaser game...");

    function preload(this: any) {
      console.log("Preloading game assets...");
      this.load.image("particle", "https://labs.phaser.io/assets/particles/blue.png");
    }
    
    function create(this: any) {
      console.log("Creating game elements...");
      
      // Create a simple player rectangle
      const player = this.add.rectangle(
        this.cameras.main.centerX, 
        this.cameras.main.centerY, 
        20, 
        20, 
        0xec4899
      );

      // Add physics to player
      this.physics.add.existing(player);
      player.body.setCollideWorldBounds(true);

      // Set up keyboard input
      const cursors = this.input.keyboard.createCursorKeys();
      const escKey = this.input.keyboard.addKey("ESC");

      // Store these in scene data to access in update
      this.data.set('player', player);
      this.data.set('cursors', cursors);

      // Handle ESC key to exit game
      escKey.on("down", () => {
        console.log("ESC pressed, exiting game");
        exitGame();
      });

      // Add text to show the game is working
      this.add
        .text(this.cameras.main.centerX, this.cameras.main.centerY - 100, "VOID: RESONANCE", {
          fontFamily: "monospace",
          fontSize: "32px",
          color: "#a855f7",
        })
        .setOrigin(0.5);

      this.add
        .text(this.cameras.main.centerX, this.cameras.main.centerY + 100, "Use arrow keys to move\nPress ESC to exit", {
          fontFamily: "monospace",
          fontSize: "16px",
          color: "#ec4899",
          align: "center",
        })
        .setOrigin(0.5);

      // Try to create particles if available
      try {
        if (this.add.particles) {
          const particles = this.add.particles(0, 0, "particle", {
            speed: { min: 20, max: 100 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.6, end: 0 },
            lifespan: 800,
            quantity: 2,
            blendMode: "ADD",
            follow: player
          });
        } else {
          console.log("Particles module not available");
        }
      } catch (error) {
        console.error("Error creating particles:", error);
      }

      console.log("Game elements created successfully");
      setGameLoaded(true);
      setUseFallback(false); // Hide fallback once Phaser is running
    }

    function update(this: any) {
      // Get player and cursors from scene data
      const player = this.data.get('player');
      const cursors = this.data.get('cursors');

      if (!player || !player.body) return;

      // Simple player movement
      const speed = 200;
      player.body.setVelocity(0);

      if (cursors.left.isDown) {
        player.body.setVelocityX(-speed);
      } else if (cursors.right.isDown) {
        player.body.setVelocityX(speed);
      }

      if (cursors.up.isDown) {
        player.body.setVelocityY(-speed);
      } else if (cursors.down.isDown) {
        player.body.setVelocityY(speed);
      }
    }

    // Create the Phaser config object
    const config = {
      type: window.Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: "#000000",
      parent: gameContainerRef.current,
      scene: {
        preload: preload,
        create: create,
        update: update,
      },
      physics: {
        default: "arcade",
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
    };

    // Create game instance with proper error handling
    try {
      console.log("Creating Phaser game instance...");
      gameInstanceRef.current = new window.Phaser.Game(config);
      console.log("Game created successfully");

      // Add window resize handler
      const handleResize = () => {
        if (gameInstanceRef.current && gameInstanceRef.current.scale) {
          gameInstanceRef.current.scale.resize(window.innerWidth, window.innerHeight);
        }
      };
      
      window.addEventListener("resize", handleResize);
      
      return () => {
        window.removeEventListener("resize", handleResize);
        if (gameInstanceRef.current) {
          gameInstanceRef.current.destroy(true);
          gameInstanceRef.current = null;
        }
      };
    } catch (error) {
      console.error("Error creating game:", error);
      // Continue using fallback if Phaser fails
      console.log("Continuing with canvas fallback due to Phaser initialization error");
      setUseFallback(true);
      return () => {};
    }
  }, [gameStarted, phaserLoaded, exitGame]);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden font-pixel">
      {/* Load Phaser script - this will always be loaded in the background */}
      <Script 
        src="https://cdn.jsdelivr.net/npm/phaser@3.55.2/dist/phaser.min.js"
        onLoad={() => {
          console.log("Phaser loaded successfully");
          setPhaserLoaded(true);
        }}
        onError={() => {
          console.error("Failed to load Phaser");
          // We'll keep using the fallback if Phaser fails to load
        }}
        strategy="beforeInteractive"
      />

      {/* Custom cursor - only show when game is not started */}
      {!gameStarted && (
        <motion.div
          className="fixed w-8 h-8 pointer-events-none z-[100] hidden md:block"
          animate={{
            x: cursorPosition.x - 16,
            y: cursorPosition.y - 16,
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
      )}

      {/* Navigation - only show when game is not started */}
      {!gameStarted && <Navigation />}

      <AnimatePresence>
        {loading ? (
          <motion.div
            key="loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black"
          >
            <div className="relative w-32 h-32">
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full text-purple-500"
                style={{ animation: "rotate 2s linear infinite" }}
              >
                <rect x="46" y="10" width="8" height="20" fill="currentColor" opacity="0.9" />
                <rect x="46" y="70" width="8" height="20" fill="currentColor" opacity="0.3" />
                <rect x="10" y="46" width="20" height="8" fill="currentColor" opacity="0.7" />
                <rect x="70" y="46" width="20" height="8" fill="currentColor" opacity="0.5" />
                <rect
                  x="22"
                  y="22"
                  width="8"
                  height="20"
                  transform="rotate(45 26 32)"
                  fill="currentColor"
                  opacity="0.8"
                />
                <rect
                  x="70"
                  y="70"
                  width="8"
                  height="20"
                  transform="rotate(45 74 80)"
                  fill="currentColor"
                  opacity="0.4"
                />
                <rect
                  x="22"
                  y="70"
                  width="8"
                  height="20"
                  transform="rotate(-45 26 70)"
                  fill="currentColor"
                  opacity="0.6"
                />
                <rect
                  x="70"
                  y="22"
                  width="8"
                  height="20"
                  transform="rotate(-45 74 22)"
                  fill="currentColor"
                  opacity="0.2"
                />
              </svg>
            </div>
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
              className="mt-8 text-2xl font-light tracking-widest text-purple-400 font-pixel"
            >
              LOADING VOID...
            </motion.p>
          </motion.div>
        ) : gameStarted ? (
          // Game container
          <>
            {/* Canvas fallback - shown immediately */}
            {useFallback && <CanvasExperience onExit={exitGame} />}
            
            {/* Phaser container - will take over when ready */}
              <motion.div
              key="game"
              initial={{ opacity: 0 }}  // Add this to fix the error
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="fixed inset-0 z-40 bg-black"
              ref={gameContainerRef}
              style={{ display: useFallback ? 'none' : 'block' }}
            >
              {!gameLoaded && !useFallback && (
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                  <p className="text-purple-400 font-pixel text-2xl">ENTERING THE VOID...</p>
                </div>
              )}
            </motion.div>
          </>
        ) : (
          // Game info page
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="pt-24"
          >
            <div className="container mx-auto px-4 py-12">
              <div className="mb-8">
                <Button
                  asChild
                  variant="ghost"
                  className="text-purple-400 hover:text-purple-300 hover:bg-purple-950/30 -ml-4 text-lg font-pixel"
                  onMouseEnter={() => setCursorHover(true)}
                  onMouseLeave={() => setCursorHover(false)}
                >
                  <Link href="/">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="mr-2"
                    >
                      <rect x="0" y="8" width="16" height="4" fill="currentColor" />
                      <rect x="4" y="4" width="4" height="4" fill="currentColor" />
                      <rect x="4" y="12" width="4" height="4" fill="currentColor" />
                    </svg>
                    BACK TO HOME
                  </Link>
                </Button>
              </div>

              <div className="max-w-6xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="mb-12 text-center"
                >
                  <PixelHeading
                    text="VOID: RESONANCE"
                    className="text-6xl md:text-7xl font-black tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500"
                    animate
                  />
                  <div className="w-20 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto mb-6"></div>
                  <p className="text-xl text-gray-300 max-w-3xl mx-auto font-pixel">
                    A MEDITATIVE JOURNEY THROUGH ABSTRACT DIGITAL SPACE
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="relative mb-12 flex justify-center"
                >
                  <div className="relative w-full max-w-[600px] aspect-square bg-black overflow-hidden border-2 border-purple-500/50">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button
                        onClick={startGame}
                        size="lg"
                        className="bg-transparent border-2 border-purple-500 hover:bg-purple-950/30 text-white rounded-none px-10 py-8 text-xl font-pixel tracking-wide transition-all duration-300"
                        onMouseEnter={() => setCursorHover(true)}
                        onMouseLeave={() => setCursorHover(false)}
                      >
                        START EXPERIENCE
                      </Button>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-black"></div>
                    <div className="absolute inset-0 grid grid-cols-5 grid-rows-5 opacity-30">
                      {Array.from({ length: 25 }).map((_, i) => (
                        <div key={i} className="border border-purple-800/20 flex items-center justify-center">
                          {i === 12 && <div className="w-4 h-4 bg-purple-500 animate-pulse"></div>}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12"
                >
                  <div className="bg-black border border-purple-900/30 p-6">
                    <PixelHeading
                      text="CONTROLS"
                      className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500"
                    />
                    <ul className="text-gray-300 space-y-3 font-pixel">
                      <li className="flex items-center">
                        <span className="inline-block w-32 font-bold text-purple-400">ARROW KEYS</span>
                        <span>MOVE THROUGH SPACE</span>
                      </li>
                      <li className="flex items-center">
                        <span className="inline-block w-32 font-bold text-purple-400">WASD</span>
                        <span>ALTERNATIVE MOVEMENT</span>
                      </li>
                      <li className="flex items-center">
                        <span className="inline-block w-32 font-bold text-purple-400">ESC</span>
                        <span>EXIT EXPERIENCE</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-black border border-purple-900/30 p-6">
                    <PixelHeading
                      text="EXPERIENCE"
                      className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500"
                    />
                    <p className="text-gray-300 mb-4 leading-relaxed font-pixel">
                      VOID: RESONANCE IS NOT A GAME BUT A MEDITATIVE JOURNEY:
                    </p>
                    <ul className="text-gray-300 space-y-2 font-pixel">
                      <li className="flex items-start">
                        <div className="mr-2 mt-1">
                          <div className="w-3 h-3 bg-purple-500"></div>
                        </div>
                        <span>MOVE FREELY THROUGH ABSTRACT DIGITAL SPACE</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mr-2 mt-1">
                          <div className="w-3 h-3 bg-pink-500"></div>
                        </div>
                        <span>OBSERVE HOW YOUR PRESENCE AFFECTS THE ENVIRONMENT</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mr-2 mt-1">
                          <div className="w-3 h-3 bg-blue-500"></div>
                        </div>
                        <span>DISCOVER HIDDEN RESONANCE POINTS THAT TRANSFORM THE SPACE</span>
                      </li>
                    </ul>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Footer */}
            <Footer />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global styles for animations */}
      <style jsx global>{`
        @font-face {
          font-family: 'PixelFont';
          src: url('/pixel-font.woff2') format('woff2');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
        
        .font-pixel {
          font-family: 'PixelFont', monospace;
          letter-spacing: 0.05em;
        }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}