"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import AbstractShape from "@/components/abstract-shape"
import PixelHeading from "@/components/pixel-heading"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"

export default function AIPage() {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const [cursorHover, setCursorHover] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState("cube")
  const canvasRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Handle cursor effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  const handleGenerate = () => {
    if (!prompt.trim()) return

    setIsGenerating(true)

    // Simulate generation process
    setTimeout(() => {
      setIsGenerating(false)
    }, 3000)
  }

  const handleMint = () => {
    console.log("Minting AI creation...")
    // This would be replaced with actual minting logic
  }

  return (
    <div className="relative bg-black text-white overflow-hidden font-pixel">
      {/* Custom cursor */}
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

      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-black to-black"></div>
        </div>

        {/* Modern AI Banner */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {/* Grid Pattern */}
          <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 opacity-20">
            {Array.from({ length: 144 }).map((_, i) => (
              <div key={i} className="border border-purple-800/20"></div>
            ))}
          </div>

          {/* Neural Network Visualization */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <g opacity="0.2">
              {[...Array(10)].map((_, i) => (
                <line
                  key={`line1-${i}`}
                  x1={10 + i * 8}
                  y1="20"
                  x2={50 + (i - 5) * 10}
                  y2="50"
                  stroke="#a855f7"
                  strokeWidth="0.5"
                />
              ))}
              {[...Array(10)].map((_, i) => (
                <line
                  key={`line2-${i}`}
                  x1={50 + (i - 5) * 10}
                  y1="50"
                  x2={10 + i * 8}
                  y2="80"
                  stroke="#ec4899"
                  strokeWidth="0.5"
                />
              ))}
              {[...Array(10)].map((_, i) => (
                <circle key={`node1-${i}`} cx={10 + i * 8} cy="20" r="1.5" fill="#a855f7" />
              ))}
              {[...Array(10)].map((_, i) => (
                <circle key={`node2-${i}`} cx={50 + (i - 5) * 10} cy="50" r="1.5" fill="#ec4899" />
              ))}
              {[...Array(10)].map((_, i) => (
                <circle key={`node3-${i}`} cx={10 + i * 8} cy="80" r="1.5" fill="#a855f7" />
              ))}
            </g>
          </svg>

          {/* Animated gradient overlay */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-gradient-radial from-purple-500/20 to-transparent animate-pulse-slow"></div>
            <div className="absolute inset-0 bg-gradient-radial from-pink-500/10 to-transparent animate-pulse-slow delay-1000"></div>
          </div>
        </div>

        <div className="container mx-auto px-4 z-10 relative">
          <div className="max-w-7xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="mb-6"
            >
              <PixelHeading
                text="AI CREATOR"
                className="text-8xl sm:text-9xl md:text-[12rem] font-black tracking-tighter mb-6 leading-none text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500"
                animate
              />
              <PixelHeading
                text="GENERATE UNIQUE DIGITAL ASSETS"
                className="text-3xl sm:text-4xl md:text-5xl mt-2 tracking-wide text-gray-300"
                animate
              />
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-10 font-light"
            >
              Create and mint AI-generated 3D cubes and music with your prompts
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-6"
              onMouseEnter={() => setCursorHover(true)}
              onMouseLeave={() => setCursorHover(false)}
            >
              <Button
                size="lg"
                className="bg-transparent border-2 border-purple-500 hover:bg-purple-950/30 text-white rounded-none px-10 py-8 text-xl font-pixel tracking-wide transition-all duration-300"
                onClick={() => document.getElementById("creator")?.scrollIntoView({ behavior: "smooth" })}
              >
                START CREATING
              </Button>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
        >
          <div className="flex flex-col items-center">
            <p className="text-sm text-gray-400 mb-2 font-pixel">SCROLL TO CREATE</p>
            <svg width="24" height="40" viewBox="0 0 24 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="0" y="0" width="24" height="40" stroke="#a855f7" strokeWidth="2" />
              <motion.rect
                animate={{ y: [4, 28, 4] }}
                transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
                x="8"
                width="8"
                height="8"
                fill="#ec4899"
              />
            </svg>
          </div>
        </motion.div>
      </section>

      {/* AI Creator Section */}
      <section id="creator" className="relative py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <Tabs defaultValue="cube" className="w-full" onValueChange={(value) => setActiveTab(value)}>
              <div className="flex justify-center mb-10">
                <TabsList className="bg-black border-2 border-purple-900 p-1 rounded-none">
                  <TabsTrigger
                    value="cube"
                    className="data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-400 rounded-none px-8 py-3 font-pixel"
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                  >
                    3D CUBE GENERATOR
                  </TabsTrigger>
                  <TabsTrigger
                    value="music"
                    className="data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-400 rounded-none px-8 py-3 font-pixel"
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                  >
                    MUSIC GENERATOR
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Prompt Input Section */}
                <div className="bg-black border border-purple-900/50 p-8">
                  <PixelHeading
                    text={activeTab === "cube" ? "DESIGN YOUR CUBE" : "COMPOSE YOUR SOUND"}
                    className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500"
                  />

                  <div className="mb-6">
                    <label className="block text-gray-300 mb-2 font-pixel">ENTER YOUR PROMPT</label>
                    <div className="relative">
                      <Input
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={
                          activeTab === "cube"
                            ? "A neon cyberpunk cube with glitchy textures..."
                            : "Ambient synthwave with deep bass and ethereal pads..."
                        }
                        className="bg-black border-2 border-purple-900 focus:border-purple-500 rounded-none p-4 text-white font-pixel w-full"
                        onMouseEnter={() => setCursorHover(true)}
                        onMouseLeave={() => setCursorHover(false)}
                      />
                    </div>
                  </div>

                  {activeTab === "cube" && (
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-gray-300 mb-2 font-pixel">TEXTURE STYLE</label>
                        <select
                          className="bg-black border-2 border-purple-900 focus:border-purple-500 rounded-none p-2 text-white font-pixel w-full"
                          onMouseEnter={() => setCursorHover(true)}
                          onMouseLeave={() => setCursorHover(false)}
                        >
                          <option value="abstract">ABSTRACT</option>
                          <option value="glitch">GLITCH</option>
                          <option value="neon">NEON</option>
                          <option value="pixel">PIXEL</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-2 font-pixel">ANIMATION</label>
                        <select
                          className="bg-black border-2 border-purple-900 focus:border-purple-500 rounded-none p-2 text-white font-pixel w-full"
                          onMouseEnter={() => setCursorHover(true)}
                          onMouseLeave={() => setCursorHover(false)}
                        >
                          <option value="rotate">ROTATE</option>
                          <option value="pulse">PULSE</option>
                          <option value="morph">MORPH</option>
                          <option value="glitch">GLITCH</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {activeTab === "music" && (
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-gray-300 mb-2 font-pixel">GENRE</label>
                        <select
                          className="bg-black border-2 border-purple-900 focus:border-purple-500 rounded-none p-2 text-white font-pixel w-full"
                          onMouseEnter={() => setCursorHover(true)}
                          onMouseLeave={() => setCursorHover(false)}
                        >
                          <option value="ambient">AMBIENT</option>
                          <option value="synthwave">SYNTHWAVE</option>
                          <option value="cyberpunk">CYBERPUNK</option>
                          <option value="glitch">GLITCH</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-2 font-pixel">DURATION</label>
                        <select
                          className="bg-black border-2 border-purple-900 focus:border-purple-500 rounded-none p-2 text-white font-pixel w-full"
                          onMouseEnter={() => setCursorHover(true)}
                          onMouseLeave={() => setCursorHover(false)}
                        >
                          <option value="30">30 SECONDS</option>
                          <option value="60">1 MINUTE</option>
                          <option value="120">2 MINUTES</option>
                          <option value="180">3 MINUTES</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-4">
                    <Button
                      onClick={handleGenerate}
                      disabled={isGenerating || !prompt.trim()}
                      className="bg-transparent border-2 border-purple-500 hover:bg-purple-950/30 text-white rounded-none px-6 py-3 font-pixel tracking-wide flex-1"
                      onMouseEnter={() => setCursorHover(true)}
                      onMouseLeave={() => setCursorHover(false)}
                    >
                      {isGenerating ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          GENERATING...
                        </>
                      ) : (
                        "GENERATE"
                      )}
                    </Button>

                    <Button
                      onClick={handleMint}
                      disabled={isGenerating}
                      className="bg-transparent border-2 border-pink-500 hover:bg-pink-950/30 text-white rounded-none px-6 py-3 font-pixel tracking-wide"
                      onMouseEnter={() => setCursorHover(true)}
                      onMouseLeave={() => setCursorHover(false)}
                    >
                      MINT
                    </Button>
                  </div>
                </div>

                {/* Output Display Section */}
                <div className="bg-black border border-purple-900/50 p-8">
                  <PixelHeading
                    text={activeTab === "cube" ? "3D PREVIEW" : "AUDIO PREVIEW"}
                    className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500"
                  />

                  {activeTab === "cube" ? (
                    <div
                      ref={canvasRef}
                      className="w-full aspect-square bg-black/50 border-2 border-purple-900/50 flex items-center justify-center"
                    >
                      {isGenerating ? (
                        <AbstractShape className="w-32 h-32 text-purple-500" type="loading" animate />
                      ) : (
                        <div className="text-center">
                          <AbstractShape className="w-40 h-40 mx-auto text-purple-500/50" type="complex" animate />
                          <p className="text-gray-400 mt-4 font-pixel">ENTER A PROMPT AND CLICK GENERATE</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full aspect-square bg-black/50 border-2 border-purple-900/50 flex flex-col items-center justify-center">
                      {isGenerating ? (
                        <AbstractShape className="w-32 h-32 text-purple-500" type="loading" animate />
                      ) : (
                        <div className="text-center">
                          <AbstractShape className="w-40 h-40 mx-auto text-purple-500/50" type="wave" animate />
                          <p className="text-gray-400 mt-4 font-pixel">ENTER A PROMPT AND CLICK GENERATE</p>
                          <audio ref={audioRef} controls className="mt-6 hidden"></audio>
                          <Button
                            className="mt-4 bg-transparent border border-blue-500 hover:bg-blue-950/30 text-blue-400 rounded-none px-4 py-2 text-sm font-pixel tracking-wide hidden"
                            onMouseEnter={() => setCursorHover(true)}
                            onMouseLeave={() => setCursorHover(false)}
                          >
                            DOWNLOAD AUDIO
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Tabs>
          </div>
        </div>
      </section>

      {/* Examples Section */}
      <section className="relative py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <PixelHeading
              text="INSPIRATION GALLERY"
              className="text-5xl md:text-6xl font-black tracking-tighter mb-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 text-center"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-black border border-purple-900/50 p-4 group hover:border-purple-500 transition-colors duration-300"
                  onMouseEnter={() => setCursorHover(true)}
                  onMouseLeave={() => setCursorHover(false)}
                >
                  <div className="aspect-square bg-black/50 mb-4 overflow-hidden">
                    <AbstractShape
                      className={`w-full h-full ${
                        index % 3 === 0
                          ? "text-purple-500/70"
                          : index % 3 === 1
                            ? "text-pink-500/70"
                            : "text-blue-500/70"
                      }`}
                      type={
                        index % 2 === 0
                          ? "complex"
                          : index % 5 === 1
                            ? "grid"
                            : index % 5 === 2
                              ? "wave"
                              : index % 5 === 3
                                ? "dots"
                                : "noise"
                      }
                      animate
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1 font-pixel">
                      {index % 2 === 0 ? "CUBE" : "MUSIC"} #{index + 1}
                    </h3>
                    <p className="text-gray-400 text-sm mb-3 font-pixel">
                      {index % 2 === 0
                        ? "Neon cyberpunk cube with glitchy textures"
                        : "Ambient synthwave with deep bass"}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-purple-400 font-pixel">BY VOID_USER</span>
                      <Button
                        className="bg-transparent border border-pink-500/50 hover:bg-pink-950/30 text-pink-400 rounded-none px-2 py-1 text-xs font-pixel tracking-wide"
                        onMouseEnter={() => setCursorHover(true)}
                        onMouseLeave={() => setCursorHover(false)}
                      >
                        REMIX
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-t from-purple-950/30 via-black to-black"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <PixelHeading
                text="CREATE YOUR DIGITAL LEGACY"
                className="text-6xl md:text-7xl font-black tracking-tighter mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500"
              />
              <p className="text-xl md:text-2xl text-gray-300 mb-10 font-pixel">
                MINT YOUR CREATIONS AND JOIN THE VOID MARKETPLACE
              </p>

              <Button
                asChild
                size="lg"
                className="bg-transparent border-2 border-purple-500 hover:bg-purple-950/30 text-white rounded-none px-12 py-8 text-2xl font-pixel tracking-wide transition-all duration-300"
                onMouseEnter={() => setCursorHover(true)}
                onMouseLeave={() => setCursorHover(false)}
              >
                <Link href="/market">EXPLORE MARKETPLACE</Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
