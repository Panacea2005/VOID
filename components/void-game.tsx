"use client"

import { useEffect, useRef } from "react"
import Phaser from "phaser"

interface VoidGameProps {
  fullscreen: boolean
  setFullscreen: (fullscreen: boolean) => void
}

export default function VoidGame({ fullscreen, setFullscreen }: VoidGameProps) {
  const gameContainerRef = useRef<HTMLDivElement>(null)
  const gameInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window === "undefined" || !window.Phaser) {
      return
    }

    // Game configuration
    const config = {
      type: Phaser.AUTO as unknown as number,
      width: 600,
      height: 600,
      backgroundColor: "#000000",
      parent: gameContainerRef.current || undefined,
      scene: {
        preload: preload,
        create: create,
        update: update,
      },
      scale: {
        mode: Phaser.Scale.FIT as unknown as Phaser.Scale.ScaleModes,
        autoCenter: Phaser.Scale.Center.CENTER_BOTH,
      },
      physics: {
        default: "arcade",
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      pixelArt: true,
    }

    // Game variables
    let player: Phaser.GameObjects.Rectangle
    let voidGate: Phaser.GameObjects.Rectangle
    let tiles: (Phaser.GameObjects.Rectangle | null)[][] = []
    const gridSize = 5
    const tileSize = 600 / gridSize
    let playerPosition = { x: 0, y: 0 }
    let isMoving = false
    let cursors: Phaser.Types.Input.Keyboard.CursorKeys
    let wasdKeys: any
    let fKey: Phaser.Input.Keyboard.Key
    let rKey: Phaser.Input.Keyboard.Key
    let level = 1
    let music: Phaser.Sound.BaseSound
    let winText: Phaser.GameObjects.Text
    let playerGlow: Phaser.GameObjects.Rectangle
    let voidGateGlow: Phaser.GameObjects.Rectangle
    let fullscreenButton: Phaser.GameObjects.Rectangle
    let fullscreenText: Phaser.GameObjects.Text

    // Level data
    const levels = [
      {
        grid: [
          [1, 1, 1, 0, 0],
          [0, 0, 1, 0, 0],
          [0, 0, 1, 1, 1],
          [0, 0, 0, 0, 1],
          [0, 0, 0, 0, 2],
        ],
        start: { x: 0, y: 0 },
      },
      {
        grid: [
          [1, 0, 0, 0, 0],
          [1, 1, 1, 1, 0],
          [0, 0, 0, 1, 0],
          [0, 1, 1, 1, 0],
          [0, 1, 0, 0, 2],
        ],
        start: { x: 0, y: 0 },
      },
    ]

    function preload(this: Phaser.Scene) {
      // Load assets
      this.load.audio(
        "ambient",
        "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=cyberpunk-2099-10701.mp3",
      )
    }

    function create(this: Phaser.Scene) {
      // Set up keyboard input
      if (this.input) {
        cursors = this.input.keyboard.createCursorKeys()
      }
      wasdKeys = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D,
      })
      fKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F)
      rKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R)

      // Add background music
      music = this.sound.add("ambient", { loop: true, volume: 0.5 })
      music.play()

      // Create fullscreen button
      fullscreenButton = this.add
        .rectangle(550, 50, 40, 40, 0x000000, 0.5)
        .setStrokeStyle(2, 0xa855f7)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", toggleFullscreen)

      fullscreenText = this.add
        .text(550, 50, "[ ]", {
          fontFamily: "monospace",
          fontSize: "20px",
          color: "#a855f7",
        })
        .setOrigin(0.5)

      // Initialize level
      createLevel(this, level)
    }

    function update(this: Phaser.Scene) {
      if (isMoving) return

      // Handle keyboard input
      if ((cursors.left.isDown || wasdKeys.left.isDown) && playerPosition.x > 0) {
        movePlayer(this, -1, 0)
      } else if ((cursors.right.isDown || wasdKeys.right.isDown) && playerPosition.x < gridSize - 1) {
        movePlayer(this, 1, 0)
      } else if ((cursors.up.isDown || wasdKeys.up.isDown) && playerPosition.y > 0) {
        movePlayer(this, 0, -1)
      } else if ((cursors.down.isDown || wasdKeys.down.isDown) && playerPosition.y < gridSize - 1) {
        movePlayer(this, 0, 1)
      }

      // Handle fullscreen toggle
      if (Phaser.Input.Keyboard.JustDown(fKey)) {
        toggleFullscreen()
      }

      // Handle restart
      if (Phaser.Input.Keyboard.JustDown(rKey)) {
        restartLevel(this)
      }

      // Animate player glow
      if (playerGlow) {
        playerGlow.alpha = 0.5 + Math.sin(this.time.now / 200) * 0.2
      }

      // Animate void gate glow
      if (voidGateGlow) {
        voidGateGlow.alpha = 0.5 + Math.sin(this.time.now / 150) * 0.3
        voidGateGlow.scale = 1 + Math.sin(this.time.now / 300) * 0.1
      }
    }

    function createLevel(scene: Phaser.Scene, levelNum: number) {
      // Clear existing level
      if (tiles.length > 0) {
        for (let y = 0; y < gridSize; y++) {
          for (let x = 0; x < gridSize; x++) {
            // Fixed: Simplify the null check and safely call destroy()
            const tile = tiles[y][x]
            if (tile) {
              tile.destroy()
            }
          }
        }
      }

      if (player) player.destroy()
      if (playerGlow) playerGlow.destroy()
      if (voidGate) voidGate.destroy()
      if (voidGateGlow) voidGateGlow.destroy()
      if (winText) winText.destroy()

      // Get level data
      const levelData = levels[levelNum - 1]
      tiles = []

      // Create grid
      for (let y = 0; y < gridSize; y++) {
        tiles[y] = []
        for (let x = 0; x < gridSize; x++) {
          const tileType = levelData.grid[y][x]

          // Create tile based on type
          if (tileType > 0) {
            // Regular tile or void gate
            const tileColor = tileType === 2 ? 0x60a5fa : 0x3b0764
            const tile = scene.add
              .rectangle(
                x * tileSize + tileSize / 2,
                y * tileSize + tileSize / 2,
                tileSize - 10,
                tileSize - 10,
                tileColor,
              )
              .setStrokeStyle(2, tileType === 2 ? 0x60a5fa : 0xa855f7)

            tiles[y][x] = tile

            // Create void gate
            if (tileType === 2) {
              voidGate = tile
              voidGateGlow = scene.add
                .rectangle(x * tileSize + tileSize / 2, y * tileSize + tileSize / 2, tileSize, tileSize, 0x60a5fa, 0.5)
                .setDepth(-1)
            }
          } else {
            tiles[y][x] = null
          }
        }
      }

      // Create player
      playerPosition = { ...levelData.start }
      player = scene.add
        .rectangle(
          playerPosition.x * tileSize + tileSize / 2,
          playerPosition.y * tileSize + tileSize / 2,
          tileSize / 2,
          tileSize / 2,
          0xec4899,
        )
        .setStrokeStyle(2, 0xff99cc)

      // Create player glow
      playerGlow = scene.add
        .rectangle(
          playerPosition.x * tileSize + tileSize / 2,
          playerPosition.y * tileSize + tileSize / 2,
          tileSize / 1.5,
          tileSize / 1.5,
          0xec4899,
          0.5,
        )
        .setDepth(-1)
    }

    function movePlayer(scene: Phaser.Scene, dx: number, dy: number) {
      const newX = playerPosition.x + dx
      const newY = playerPosition.y + dy

      // Check if the move is valid
      if (newX >= 0 && newX < gridSize && newY >= 0 && newY < gridSize && tiles[newY][newX]) {
        isMoving = true

        // Animate player movement
        scene.tweens.add({
          targets: [player, playerGlow],
          x: newX * tileSize + tileSize / 2,
          y: newY * tileSize + tileSize / 2,
          duration: 200,
          ease: "Power2",
          onComplete: () => {
            playerPosition = { x: newX, y: newY }
            isMoving = false

            // Check if player reached the void gate
            if (tiles[newY][newX] === voidGate) {
              levelComplete(scene)
            }

            // Make the tile pulse when stepped on
            scene.tweens.add({
              targets: tiles[newY][newX],
              scaleX: 1.1,
              scaleY: 1.1,
              duration: 100,
              yoyo: true,
            })
          },
        })
      }
    }

    function levelComplete(scene: Phaser.Scene) {
      // Show win message
      winText = scene.add
        .text(300, 300, "LEVEL COMPLETE", {
          fontFamily: "monospace",
          fontSize: "32px",
          color: "#a855f7",
        })
        .setOrigin(0.5)

      // Animate win text
      scene.tweens.add({
        targets: winText,
        scale: 1.2,
        duration: 500,
        yoyo: true,
        repeat: 2,
        onComplete: () => {
          // Load next level or show game complete
          if (level < levels.length) {
            level++
            setTimeout(() => {
              createLevel(scene, level)
            }, 1000)
          } else {
            winText.setText("VOID TRANSCENDED")
            winText.setColor("#ec4899")
          }
        },
      })

      // Create particle effect
      const particles = scene.add.particles(0, 0, "particle", {
        x: voidGate.x,
        y: voidGate.y,
        speed: { min: 50, max: 150 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.5, end: 0 },
        lifespan: 1000,
        quantity: 20,
        blendMode: "ADD",
      })

      // Clean up particles
      setTimeout(() => {
        particles.destroy()
      }, 1000)
    }

    function restartLevel(scene: Phaser.Scene) {
      createLevel(scene, level)
    }

    function toggleFullscreen() {
      if (!document.fullscreenElement) {
        if (gameContainerRef.current?.requestFullscreen) {
          gameContainerRef.current.requestFullscreen()
          setFullscreen(true)
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen()
          setFullscreen(false)
        }
      }
    }

    // Create game instance
    gameInstanceRef.current = new Phaser.Game(config)

    // Clean up on unmount
    return () => {
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy(true)
      }
    }
  }, [setFullscreen])

  // Handle resize to make the game responsive in fullscreen
  useEffect(() => {
    const handleResize = () => {
      if (fullscreen && gameInstanceRef.current) {
        gameInstanceRef.current.scale.resize(window.innerWidth, window.innerHeight)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [fullscreen])

  return <div ref={gameContainerRef} className="w-full h-full" />
}