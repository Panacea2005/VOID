"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Volume2, VolumeX } from "lucide-react"

export default function BackgroundAudio() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Create audio element
    audioRef.current = new Audio("/audio/void-theme.mp3")
    audioRef.current.loop = true
    audioRef.current.volume = 0.3

    // Set up event listeners
    const handleCanPlayThrough = () => {
      setIsLoaded(true)
    }

    if (audioRef.current) {
      audioRef.current.addEventListener("canplaythrough", handleCanPlayThrough)
    }

    // Clean up
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.removeEventListener("canplaythrough", handleCanPlayThrough)
      }
    }
  }, [])

  // Toggle play/pause
  const toggleAudio = () => {
    if (!audioRef.current || !isLoaded) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      // Some browsers require user interaction before playing audio
      const playPromise = audioRef.current.play()

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Audio started playing successfully
          })
          .catch((error) => {
            console.error("Audio playback failed:", error)
          })
      }
    }

    setIsPlaying(!isPlaying)
  }

  return (
    <Button
      onClick={toggleAudio}
      variant="ghost"
      size="icon"
      className="fixed bottom-6 right-6 z-50 bg-black/50 backdrop-blur-md rounded-full w-12 h-12 flex items-center justify-center hover:bg-purple-900/50"
      disabled={!isLoaded}
    >
      {isPlaying ? <Volume2 className="h-6 w-6 text-purple-400" /> : <VolumeX className="h-6 w-6 text-gray-400" />}
    </Button>
  )
}
