"use client"

import { useEffect, useRef, useState } from "react"
import Script from "next/script"

interface VoidResonanceProps {
  exitGame: () => void
}

export default function VoidResonance({ exitGame }: VoidResonanceProps) {
  const gameContainerRef = useRef<HTMLDivElement>(null)
  const [gameLoaded, setGameLoaded] = useState(false)
  const [phaserLoaded, setPhaserLoaded] = useState(false)

  useEffect(() => {
    // Only initialize the game after Phaser has been loaded
    if (!phaserLoaded || !window.Phaser) return

    console.log("Initializing game...")

    // Create a simple Phaser game
    const config = {
      type: window.Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: "#000000",
      parent: gameContainerRef.current || undefined,
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
    }

    let player: any
    let cursors: any
    let escKey: any
    let particles: any

    function preload(this: any) {
      console.log("Preloading game assets...")
      // Load the particle image
      this.load.image("particle", "https://labs.phaser.io/assets/particles/blue.png")
    }

    function create(this: any) {
      console.log("Creating game elements...")
      // Create a simple player rectangle
      player = this.add.rectangle(this.cameras.main.centerX, this.cameras.main.centerY, 20, 20, 0xec4899)

      // Add physics to player
      this.physics.add.existing(player)
      player.body.setCollideWorldBounds(true)

      // Set up keyboard input
      cursors = this.input.keyboard.createCursorKeys()
      escKey = this.input.keyboard.addKey("ESC")

      // Handle ESC key to exit game
      escKey.on("down", () => {
        console.log("ESC pressed, exiting game")
        exitGame()
      })

      // Add text to show the game is working
      this.add
        .text(this.cameras.main.centerX, this.cameras.main.centerY - 100, "VOID: RESONANCE", {
          fontFamily: "monospace",
          fontSize: "32px",
          color: "#a855f7",
        })
        .setOrigin(0.5)

      this.add
        .text(this.cameras.main.centerX, this.cameras.main.centerY + 100, "Use arrow keys to move\nPress ESC to exit", {
          fontFamily: "monospace",
          fontSize: "16px",
          color: "#ec4899",
          align: "center",
        })
        .setOrigin(0.5)

      // Create particle emitter
      particles = this.add.particles(0, 0, "particle", {
        speed: { min: 20, max: 100 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.6, end: 0 },
        lifespan: 800,
        quantity: 2,
        blendMode: "ADD",
        follow: player
      })

      setGameLoaded(true)
    }

    function update(this: any) {
      // Simple player movement
      const speed = 200
      player.body.setVelocity(0)

      if (cursors.left.isDown) {
        player.body.setVelocityX(-speed)
      } else if (cursors.right.isDown) {
        player.body.setVelocityX(speed)
      }

      if (cursors.up.isDown) {
        player.body.setVelocityY(-speed)
      } else if (cursors.down.isDown) {
        player.body.setVelocityY(speed)
      }
    }

    // Create game instance
    try {
      const game = new Phaser.Game(config)
      console.log("Game created successfully")

      // Clean up on unmount
      return () => {
        console.log("Destroying game")
        game.destroy(true)
      }
    } catch (error) {
      console.error("Error creating game:", error)
    }
  }, [exitGame, phaserLoaded])

  return (
    <>
      {/* Load Phaser script */}
      <Script 
        src="https://cdn.jsdelivr.net/npm/phaser@3.55.2/dist/phaser.min.js"
        onLoad={() => {
          console.log("Phaser loaded");
          setPhaserLoaded(true);
        }}
      />
      <div ref={gameContainerRef} className="w-full h-full">
        {!gameLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <p className="text-purple-400 font-pixel text-2xl">ENTERING THE VOID...</p>
          </div>
        )}
      </div>
    </>
  )
}