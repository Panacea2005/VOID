"use client"

import { useState, useRef } from "react"
import { motion, useScroll, useTransform, useSpring } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import AbstractShape from "@/components/abstract-shape"
import PixelHeading from "@/components/pixel-heading"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"

// DocSection component for different styled sections
interface DocSectionProps {
  title: string;
  description: string;
  icon: "circle" | "grid" | "square" | "dots" | "wave" | "triangle" | "complex" | "noise" | "loading" | "gamepad";
  color: "purple" | "pink" | "blue";
  index: number;
}

const DocSection: React.FC<DocSectionProps> = ({ title, description, icon, color, index }) => {
  const [isHovered, setIsHovered] = useState(false)

  // Define color classes based on color prop
  const colorClasses = {
    purple: {
      bg: "bg-purple-500/20",
      text: "text-purple-500",
      border: "border-purple-500/50",
      gradient: "from-purple-400 to-purple-600"
    },
    pink: {
      bg: "bg-pink-500/20",
      text: "text-pink-500",
      border: "border-pink-500/50",
      gradient: "from-pink-400 to-pink-600"
    },
    blue: {
      bg: "bg-blue-500/20",
      text: "text-blue-500",
      border: "border-blue-500/50",
      gradient: "from-blue-400 to-blue-600"
    }
  }

  const colorClass = colorClasses[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: index * 0.2 }}
      viewport={{ once: true, margin: "-50px" }}
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glow effect */}
      <motion.div
        className={`absolute -inset-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl z-0 bg-gradient-to-r ${colorClass.gradient}`}
        animate={{
          opacity: [0, 0.7, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />

      {/* Card content */}
      <div className={`relative bg-black/80 border ${colorClass.border} p-6 h-full z-10`}>
        <div className="flex items-start mb-4">
          <div className={`w-12 h-12 ${colorClass.bg} mr-4 overflow-hidden group-hover:animate-pulse-slow`}>
            <AbstractShape
              className={`w-full h-full ${colorClass.text}`}
              type={icon}
              animate
            />
          </div>
          <div>
            <h3 className={`text-xl font-bold mb-1 text-transparent bg-clip-text bg-gradient-to-r ${colorClass.gradient}`}>
              {title}
            </h3>
          </div>
        </div>

        <p className="text-gray-300 text-sm leading-relaxed">{description}</p>

        {/* Interactive elements */}
        <div className="mt-4 pt-4 border-t border-purple-900/30 flex justify-between items-center">
          <Link href="/game">
            <motion.div
              className={`px-3 py-1 text-xs ${colorClass.text} border ${colorClass.border} opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 cursor-pointer`}
              animate={{ y: isHovered ? 0 : 10, opacity: isHovered ? 1 : 0 }}
              initial={{ y: 10, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <span>READ MORE</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </motion.div>
          </Link>
        </div>
      </div>

      {/* Corner decorations */}
      <div className={`absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 ${colorClass.border} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className={`absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 ${colorClass.border} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className={`absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 ${colorClass.border} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className={`absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 ${colorClass.border} opacity-0 group-hover:opacity-100 transition-opacity`} />
    </motion.div>
  )
}

// Sidebar navigation component
const DocsSidebar = ({ activeSection }: { activeSection: string }) => {
  const sections = [
    { id: "overview", label: "OVERVIEW" },
    { id: "game", label: "GAME" },
    { id: "ai", label: "AI" },
    { id: "gallery", label: "GALLERY" },
    { id: "realm", label: "REALM" },
    { id: "art", label: "ART" },
    { id: "market", label: "MARKET" },
    { id: "rubiks", label: "RUBIKS" },
    { id: "canvas", label: "CANVAS" }
  ]

  return (
    <div className="w-80 border-r border-purple-900/30 h-full py-8 px-4 hidden lg:block">
      <div className="sticky top-24">
        <PixelHeading
          text="VOID Docs"
          className="text-xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500"
        />

        <div className="space-y-1">
          {sections.map((section) => (
            <Link
              key={section.id}
              href={`/docs/${section.id === "overview" ? "" : section.id}`}
              className={`block py-2 px-3 text-sm transition-colors duration-200 ${
                activeSection === section.id
                  ? "bg-purple-500/20 text-white border-l-2 border-purple-500"
                  : "text-gray-400 hover:text-white hover:bg-purple-900/20"
              }`}
            >
              {section.label}
            </Link>
          ))}
        </div>

        {/* Decorative element */}
        <div className="mt-8 w-full h-px bg-gradient-to-r from-purple-500/50 to-transparent"></div>

        <div className="mt-8 p-4 border border-purple-900/30 bg-purple-900/10">
          <p className="text-gray-400 text-xs mb-4">Need more help with the VOID platform?</p>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs border-purple-500/50 text-purple-400 hover:bg-purple-950/30"
          >
            CONTACT SUPPORT
          </Button>
        </div>
      </div>
    </div>
  )
}

// Mobile sidebar toggle
const MobileSidebarToggle = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="lg:hidden fixed bottom-6 right-6 w-12 h-12 rounded-full bg-purple-500 text-white flex items-center justify-center z-50 shadow-lg"
  >
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 6H21M3 12H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </button>
)

// Mobile sidebar dropdown
const MobileSidebar = ({ isOpen, onClose, activeSection }: { isOpen: boolean; onClose: () => void; activeSection: string }) => {
  const sections = [
    { id: "overview", label: "OVERVIEW" },
    { id: "game", label: "GAME" },
    { id: "ai", label: "AI" },
    { id: "gallery", label: "GALLERY" },
    { id: "realm", label: "REALM" },
    { id: "art", label: "ART" },
    { id: "market", label: "MARKET" },
    { id: "rubiks", label: "RUBIKS" },
    { id: "canvas", label: "CANVAS" }
  ]

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 lg:hidden"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        className="absolute right-0 top-0 h-full w-64 bg-black border-l border-purple-900/50 p-6"
      >
        <div className="flex justify-between items-center mb-6">
          <PixelHeading
            text="VOID Docs"
            className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500"
          />

          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="space-y-1">
          {sections.map((section) => (
            <Link
              key={section.id}
              href={`/docs/${section.id === "overview" ? "" : section.id}`}
              className={`block py-2 px-3 text-sm transition-colors duration-200 ${
                activeSection === section.id
                  ? "bg-purple-500/20 text-white border-l-2 border-purple-500"
                  : "text-gray-400 hover:text-white hover:bg-purple-900/20"
              }`}
              onClick={onClose}
            >
              {section.label}
            </Link>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

// Floating particles component
const FloatingParticles = () => {
  interface Particle {
    id: string;
    width: number;
    height: number;
    backgroundColor: string;
    boxShadow: string;
    opacity: number;
    initialX: number;
    initialY: number;
    destinationX: number;
    destinationY: number;
  }

  const particles: Particle[] = Array.from({ length: 20 }).map((_, i) => ({
    id: `particle-${i}`,
    width: Math.random() * 3 + 1,
    height: Math.random() * 3 + 1,
    backgroundColor:
      i % 3 === 0 ? "#a855f7" : i % 3 === 1 ? "#ec4899" : "#3b82f6",
    boxShadow: `0 0 ${Math.random() * 3 + 2}px ${i % 3 === 0 ? "#a855f7" : i % 3 === 1 ? "#ec4899" : "#3b82f6"}`,
    opacity: Math.random() * 0.5 + 0.2,
    initialX: Math.random() * 100,
    initialY: Math.random() * 100,
    destinationX: Math.random() * 100,
    destinationY: Math.random() * 100,
  }))

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            width: `${particle.width}px`,
            height: `${particle.height}px`,
            backgroundColor: particle.backgroundColor,
            boxShadow: particle.boxShadow,
            opacity: particle.opacity,
          }}
          animate={{
            x: [particle.initialX + "vw", particle.destinationX + "vw"],
            y: [particle.initialY + "vh", particle.destinationY + "vh"],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: Math.random() * 20 + 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  )
}

export default function GameDocsPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const containerRef = useRef(null)

  // Realms data for DocSection components
  const realms = [
    {
      title: "ECHO",
      description: "A reflective environment that mimics user behavior with challenges tied to past actions, featuring mirror-like particle effects and ambient echo loops.",
      icon: "wave" as const,
      color: "purple" as const,
    },
    {
      title: "NEXUS",
      description: "Grid-based logic puzzles representing network nodes, with community-focused hints, dynamic linking lines, and motion particles.",
      icon: "grid" as const,
      color: "pink" as const,
    },
    {
      title: "ABYSS",
      description: "A dark visual space with light-based goals, minimal UI, high contrast visuals, and a 'navigation in the dark' gameplay mechanic.",
      icon: "dots" as const,
      color: "blue" as const,
    },
    {
      title: "PULSE",
      description: "Sync-based interaction where users tap in time with music, featuring rhythm particles, a pulsing central orb, and a reactive audio-visual environment.",
      icon: "gamepad" as const,
      color: "purple" as const,
    },
    {
      title: "CIPHER",
      description: "Code-breaking and logic-based puzzles with floating symbols and glyphs around a rotating cube, engaging pattern recognition and deciphering skills.",
      icon: "square" as const,
      color: "pink" as const,
    },
    {
      title: "CRYPTIC",
      description: "Falling block puzzles inspired by retro games, where blocks must be manipulated to complete patterns, with procedural animations.",
      icon: "triangle" as const,
      color: "blue" as const,
    },
    {
      title: "VORTEX",
      description: "A digital canvas for drawing pixel art with palette customization, animation preview, and pixel blocks orbiting user-created content.",
      icon: "complex" as const,
      color: "purple" as const,
    },
    {
      title: "ENIGMA",
      description: "Abstract fractal-like visuals with gameplay based on perception, rotation, and spatial logic, featuring procedurally generated puzzles.",
      icon: "noise" as const,
      color: "blue" as const,
    }
  ]

  return (
    <div ref={containerRef} className="relative bg-black text-white min-h-screen font-pixel">
      {/* Background particles */}
      <FloatingParticles />

      {/* Navigation */}
      <Navigation />

      {/* Main content */}
      <div className="relative z-10 pt-24">
        <div className="flex">
          {/* Sidebar */}
          <DocsSidebar activeSection="game" />

          {/* Main content area */}
          <div className="flex-1 min-h-[calc(100vh-80px)]">
            {/* Hero section */}
            <div className="border-b border-purple-900/30 px-6 py-12 lg:py-16 relative overflow-hidden">
              {/* Decorative grid in background */}
              <div className="absolute inset-0 grid grid-cols-12 grid-rows-6 gap-px opacity-10 pointer-events-none">
                {Array.from({ length: 72 }).map((_, i) => (
                  <div
                    key={`grid-${i}`}
                    className={`bg-gray-700 ${i % 7 === 0 ? "bg-purple-700" : i % 5 === 0 ? "bg-pink-700" : ""}`}
                  />
                ))}
              </div>

              <div className="container mx-auto max-w-4xl relative z-10">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <PixelHeading
                    text="Games"
                    className="text-4xl lg:text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500"
                    animate
                  />

                  <div className="h-1 w-40 bg-gradient-to-r from-purple-500 to-pink-500 mb-6 relative overflow-hidden">
                    <motion.div
                      className="absolute top-0 left-0 h-full bg-white/50"
                      style={{ width: "20px" }}
                      animate={{
                        x: [0, 160, 0],
                        opacity: [0, 1, 0],
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                  </div>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="text-gray-300 text-lg max-w-3xl"
                >
                  Explore the various games available in the VOID ecosystem, starting with VOID Resonance, an immersive digital experience combining gameplay, artistry, and blockchain technology.
                </motion.p>
              </div>
            </div>

            {/* Main documentation content */}
            <div className="container mx-auto px-6 py-16">
              {/* VOID Resonance Feature Overview Document */}
              <div className="max-w-4xl mx-auto mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl font-bold mb-4">VOID Resonance Game - Feature Overview</h2>
                </motion.div>
              </div>

              {/* Introduction section */}
              <div className="max-w-4xl mx-auto mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl font-bold mb-4">INTRODUCTION</h2>
                  <p className="text-gray-300">
                    VOID Resonance is an immersive, interactive digital experience hosted within a web environment. It combines exploratory gameplay, audiovisual artistry, and blockchain integration into a cohesive, multidimensional interface. Users can navigate between themed realms, each offering distinct mechanics and aesthetic identities that align with a central conceptual theme. This feature not only serves as a recreational portal but also as a narrative-rich journey for users exploring identity, memory, rhythm, and perception.
                  </p>
                </motion.div>
              </div>

              {/* Core Concept section */}
              <div className="max-w-4xl mx-auto mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl font-bold mb-4">CORE CONCEPT</h2>
                  <p className="text-gray-300">
                    The core of the game revolves around a mysterious universe known as the VOID. Within the VOID exists a central HUB from which users can access various realms. These realms each represent a facet of human emotion, perception, or cognition, offering mini-games, puzzles, creative tools, or reflective challenges. Users interact through clicks, wallet connections, and audio feedback, experiencing transitions and animations that elevate the storytelling of each realm.
                  </p>
                </motion.div>
              </div>

              {/* The HUB section */}
              <div className="max-w-4xl mx-auto mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl font-bold mb-4">ENTRY POINT: THE HUB</h2>
                  <p className="text-gray-300 mb-4">
                    The HUB is the starting point of the VOID Resonance experience. It is a dynamic 3D space featuring animated cubes, each representing a different realm. Users can hover over or select a cube to transition into the associated realm. The interface employs Framer Motion for smooth visual effects, and a custom-designed RealmCube object provides both animated previews and clickable UI.
                  </p>
                  <h3 className="text-xl font-bold mb-2 text-purple-400">Features in the HUB:</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Animated particle backgrounds that reflect the selected cube's theme</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Real-time rotation and interaction effects based on cursor movement</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Ambient soundscapes specific to each cube</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Transition animations triggered on realm selection</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Cube selection system allowing users to modify visual presentation</span>
                    </li>
                  </ul>
                </motion.div>
              </div>

              {/* The Realms section */}
              <div className="max-w-4xl mx-auto mb-16">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                  className="mb-8"
                >
                  <h2 className="text-2xl font-bold mb-4">THE REALMS</h2>
                  <p className="text-gray-300 mb-4">
                    Each realm is a thematic space designed with its own visual design, audio theme, and interactive mechanic.
                  </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {realms.map((realm, index) => (
                    <DocSection
                      key={index}
                      title={realm.title}
                      description={realm.description}
                      icon={realm.icon}
                      color={realm.color}
                      index={index}
                    />
                  ))}
                </div>
              </div>

              {/* Wallet and Profile Integration section */}
              <div className="max-w-4xl mx-auto mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl font-bold mb-4">WALLET AND PROFILE INTEGRATION</h2>
                  <p className="text-gray-300 mb-4">
                    VOID Resonance includes Solana blockchain integration. Users can connect their wallets using the `@solana/wallet-adapter-react` package. The connection state is reflected in the top-right navigation panel.
                  </p>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span>WalletMultiButton enables connection/disconnection</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span>Public key display shows shortened wallet address</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span>Profile redirect sends connected users to `/profile`</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span>Enables potential NFT, token, or score tracking integration</span>
                    </li>
                  </ul>
                </motion.div>
              </div>

              {/* Audio Management section */}
              <div className="max-w-4xl mx-auto mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl font-bold mb-4">AUDIO MANAGEMENT</h2>
                  <p className="text-gray-300 mb-4">
                    A centralized audio context (`AudioProvider`) allows each realm to dynamically load and control music.
                  </p>
                  <h3 className="text-xl font-bold mb-2 text-pink-400">Audio Features:</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-pink-500/20 mr-2 mt-2"></span>
                      <span>Individual realm soundtracks</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-pink-500/20 mr-2 mt-2"></span>
                      <span>Toggle play/pause</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-pink-500/20 mr-2 mt-2"></span>
                      <span>Track progress and volume</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-pink-500/20 mr-2 mt-2"></span>
                      <span>Floating `AudioController` UI available across screens</span>
                    </li>
                  </ul>
                </motion.div>
              </div>

              {/* Transitions & Animations section */}
              <div className="max-w-4xl mx-auto mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl font-bold mb-4">TRANSITIONS & ANIMATIONS</h2>
                  <p className="text-gray-300 mb-4">
                    VOID uses `framer-motion` extensively to render various effects. Each realm transition is designed to reflect a conceptual "entry into the unknown"—usually a zooming effect with color change and fade-in music.
                  </p>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Entrance cube fly-in effects with rotation and scaling</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Page transitions using cross-fade or transform</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Particle and model animations on loop with variation</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Hover, click, and scroll-based feedback effects</span>
                    </li>
                  </ul>
                </motion.div>
              </div>

              {/* Modularity & Extensibility section */}
              <div className="max-w-4xl mx-auto mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl font-bold mb-4">MODULARITY & EXTENSIBILITY</h2>
                  <p className="text-gray-300 mb-4">
                    The game's architecture supports expansion, making it easy to add new features and realms.
                  </p>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span>Adding new realms requires creating a new component, soundscape, and animation model</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span>Custom cube designs can be dropped into the HUB</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span>Audio and gameplay logic modularized via context and props</span>
                    </li>
                  </ul>
                </motion.div>
              </div>

              {/* Summary section */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="max-w-4xl mx-auto mt-16 p-8 border border-purple-900/50 bg-purple-950/10"
              >
                <PixelHeading
                  text="SUMMARY"
                  className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500"
                />

                <p className="text-gray-300 mb-6">
                  VOID Resonance is more than a game; it is a universe of interactive art. It encourages exploration, creativity, self-reflection, and skill through a rich combination of technology and storytelling. From abstract puzzles to rhythmic interaction and expressive design, users are invited to explore not just a game world but their own resonance within the VOID.
                </p>
                <p className="text-gray-300">
                  Whether you're syncing with the beat in Pulse, drawing in Vortex, or deciphering ancient scripts in Cipher, each realm challenges a different facet of perception and cognition. Welcome to the VOID.
                </p>

                <div className="mt-8">
                  <Link href="/game">
                    <Button
                      size="lg"
                      className="bg-purple-500 hover:bg-purple-600 text-white rounded-none font-pixel"
                    >
                      EXPLORE THE VOID
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar toggle and sidebar */}
      <MobileSidebarToggle onClick={() => setMobileSidebarOpen(true)} />
      <MobileSidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        activeSection="game"
      />

      {/* Footer */}
      <Footer />
    </div>
  )
}