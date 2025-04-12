"use client"

import { useEffect, useRef, useState } from "react"
import Phaser from "phaser"
import React from "react"

interface VoidResonanceProps {
  exitGame: () => void
}

export default function VoidResonance({ exitGame }: VoidResonanceProps) {
  const gameContainerRef = useRef<HTMLDivElement>(null)
  const [gameLoaded, setGameLoaded] = useState(false)

  useEffect(() => {
    // Make sure Phaser is available
    if (typeof window === "undefined" || !window.Phaser) {
      console.error("Phaser is not loaded")
      return
    }

    console.log("Initializing game...")

    // Create a simple Phaser game
    const config = {
      type: Phaser.AUTO as unknown as number,
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

    function preload(this: any) {
      console.log("Preloading game assets...")
      // Simple preload function
      this.load.setBaseURL("http://labs.phaser.io")
      this.load.image("particle", "assets/particles/blue.png")
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
  }, [exitGame])

  return (
    <div ref={gameContainerRef} className="w-full h-full">
      {!gameLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <p className="text-purple-400 font-pixel text-2xl">ENTERING THE VOID...</p>
        </div>
      )}
    </div>
  )
}
