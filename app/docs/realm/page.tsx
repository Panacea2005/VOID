"use client"

import { useState, useRef } from "react"
import { motion, useTransform, useSpring, useScroll } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import PixelHeading from "@/components/pixel-heading"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"

// RealmCard component for individual realm previews
interface RealmCardProps {
  name: string;
  poem: string[];
  description: string;
  color: "purple" | "pink" | "blue";
  Apparatus: "purple" | "pink" | "blue";
  modelType: string;
  index: number;
}

const RealmCard: React.FC<RealmCardProps> = ({ name, poem, description, color, modelType, index }) => {
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
        <div className="mb-4">
          <h3 className={`text-xl font-bold mb-1 text-transparent bg-clip-text bg-gradient-to-r ${colorClass.gradient}`}>
            {name}
          </h3>
          <p className="text-gray-400 text-xs italic">
            {poem.map((line, i) => (
              <span key={i} className="block">{line}</span>
            ))}
          </p>
        </div>

        <p className="text-gray-300 text-sm leading-relaxed mb-4">{description}</p>
        <p className="text-gray-400 text-xs">Model: {modelType}</p>

        {/* Interactive elements */}
        <div className="mt-4 pt-4 border-t border-purple-900/30 flex justify-between items-center">
          <Link href="/app/realm">
            <motion.div
              className={`px-3 py-1 text-xs ${colorClass.text} border ${colorClass.border} opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 cursor-pointer`}
              animate={{ y: isHovered ? 0 : 10, opacity: isHovered ? 1 : 0 }}
              initial={{ y: 10, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <span>ENTER REALM</span>
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
const FloatingParticles = ({ particleType }: { particleType: string }) => {
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

  const particleStyles = {
    ripple: { count: 15, colors: ["#a855f7", "#ec4899"] },
    nodes: { count: 20, colors: ["#3b82f6", "#ec4899"] },
    stars: { count: 25, colors: ["#ffffff", "#a855f7"] },
    pulses: { count: 10, colors: ["#ec4899", "#a855f7"] },
    glyphs: { count: 12, colors: ["#3b82f6", "#ffffff"] },
    blocks: { count: 18, colors: ["#a855f7", "#ec4899"] },
    pixels: { count: 22, colors: ["#ec4899", "#3b82f6"] },
    dust: { count: 30, colors: ["#ffffff", "#a855f7"] },
  }

  const style = particleStyles[particleType as keyof typeof particleStyles] || particleStyles.ripple

  const particles: Particle[] = Array.from({ length: style.count }).map((_, i) => ({
    id: `particle-${i}`,
    width: Math.random() * 3 + 1,
    height: Math.random() * 3 + 1,
    backgroundColor: style.colors[i % style.colors.length],
    boxShadow: `0 0 ${Math.random() * 3 + 2}px ${style.colors[i % style.colors.length]}`,
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

export default function RealmsDocsPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const containerRef = useRef(null)

  // Realms data
  const realms = [
    {
      name: "ECHO",
      poem: [
        "Reflections dance in silent light,",
        "Echoes of self in endless night,",
        "Mirrors show what once was known,",
        "Find your truth in shadows thrown."
      ],
      description: "A reflective environment that mimics user behavior with challenges tied to past actions, featuring mirror-like particle effects and ambient echo loops.",
      color: "purple" as const,
      modelType: "Mirror Fragments",
      particleType: "ripple",
    },
    {
      name: "NEXUS",
      poem: [
        "Nodes align in woven streams,",
        "Connections spark in lucid dreams,",
        "Logic binds the scattered core,",
        "Unite the paths to open more."
      ],
      description: "Grid-based logic puzzles representing network nodes, with community-focused hints, dynamic linking lines, and motion particles.",
      color: "pink" as const,
      modelType: "Nodal Network",
      particleType: "nodes",
    },
    {
      name: "ABYSS",
      poem: [
        "Darkness calls, a void so deep,",
        "Light emerges where shadows sleep,",
        "Navigate the unseen, embrace the stark,",
        "Find your way within the dark."
      ],
      description: "A dark visual space with light-based goals, minimal UI, high contrast visuals, and a 'navigation in the dark' gameplay mechanic.",
      color: "blue" as const,
      modelType: "Void Sphere",
      particleType: "stars",
    },
    {
      name: "PULSE",
      poem: [
        "Rhythm beats in vibrant flow,",
        "Sync your heart to pulsing glow,",
        "Time the dance, the world aligns,",
        "Feel the beat in sacred signs."
      ],
      description: "Sync-based interaction where users tap in time with music, featuring rhythm particles, a pulsing central orb, and a reactive audio-visual environment.",
      color: "purple" as const,
      modelType: "Pulse Orb",
      particleType: "pulses",
    },
    {
      name: "CIPHER",
      poem: [
        "Glyphs unfold in cryptic maze,",
        "Secrets carved in ancient blaze,",
        "Solve the code, the truth you'll see,",
        "Unlock the mind's own mystery."
      ],
      description: "Code-breaking and logic-based puzzles with floating symbols and glyphs around a rotating cube, engaging pattern recognition and deciphering skills.",
      color: "pink" as const,
      modelType: "Glyph Cube",
      particleType: "glyphs",
    },
    {
      name: "CRYPTIC",
      poem: [
        "Blocks descend in retro rain,",
        "Patterns form, then break again,",
        "Shape the chaos, make it fit,",
        "Master time with every hit."
      ],
      description: "Falling block puzzles inspired by retro games, where blocks must be manipulated to complete patterns, with procedural animations.",
      color: "blue" as const,
      modelType: "Tetris Blocks",
      particleType: "blocks",
    },
    {
      name: "VORTEX",
      poem: [
        "Pixels swirl in vibrant art,",
        "Craft your world, a beating heart,",
        "Draw the dreams that you conceive,",
        "In the vortex, all believe."
      ],
      description: "A digital canvas for drawing pixel art with palette customization, animation preview, and pixel blocks orbiting user-created content.",
      color: "purple" as const,
      modelType: "Pixel Canvas",
      particleType: "pixels",
    },
    {
      name: "ENIGMA",
      poem: [
        "Fractals spin in cosmic lore,",
        "Mysteries hide, yet beg for more,",
        "Twist the space, align the stars,",
        "Find the truth in what you are."
      ],
      description: "Abstract fractal-like visuals with gameplay based on perception, rotation, and spatial logic, featuring procedurally generated puzzles.",
      color: "blue" as const,
      modelType: "Fractal Vortex",
      particleType: "dust",
    }
  ]

  return (
    <div ref={containerRef} className="relative bg-black text-white min-h-screen font-pixel">
      {/* Background particles */}
      <FloatingParticles particleType={realms[0].particleType} />

      {/* Navigation */}
      <Navigation />

      {/* Main content */}
      <div className="relative z-10 pt-24">
        <div className="flex">
          {/* Sidebar */}
          <DocsSidebar activeSection="realm" />

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
                    text="VOID Realms"
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
                  Enter the VOID Realms, where each portal offers a unique blend of philosophy, gameplay, and artistry, brought to life with dynamic 3D previews, poetry, and ambient soundscapes.
                </motion.p>
              </div>
            </div>

            {/* Main documentation content */}
            <div className="container mx-auto px-6 py-16">
              {/* VOID Realms Overview */}
              <div className="max-w-4xl mx-auto mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl font-bold mb-4">VOID Resonance - Realms Selection Overview</h2>
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
                    The Realms Selection Page is the entry portal where users choose their journey into the VOID Resonance universe. Each realm offers a unique thematic experience, blending animated 3D models, poetry, music, and interactive particle systems to create an immersive introduction to the philosophical and gameplay elements of the VOID.
                  </p>
                </motion.div>
              </div>

              {/* Key Features section */}
              <div className="max-w-4xl mx-auto mb-16">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                  className="mb-8"
                >
                  <h2 className="text-2xl font-bold mb-4">KEY FEATURES</h2>
                  <p className="text-gray-300 mb-4">
                    Discover the core elements that make the Realms Selection Page a hypnotic gateway to the VOID universe.
                  </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {realms.map((realm, index) => (
                    <RealmCard
                          key={index}
                          name={realm.name}
                          poem={realm.poem}
                          description={realm.description}
                          color={realm.color}
                          modelType={realm.modelType}
                          index={index} Apparatus={"purple"}                    />
                  ))}
                </div>
              </div>

              {/* Realm Data System section */}
              <div className="max-w-4xl mx-auto mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl font-bold mb-4">REALM DATA SYSTEM</h2>
                  <p className="text-gray-300 mb-4">
                    Each realm is defined with a rich set of properties to create a cohesive and immersive experience.
                  </p>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Name, poem, theme, and full description</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Color gradients (bright, normal, dark)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Unique 3D model types (e.g., Mirror Fragments, Nodal Network)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Gameplay elements specific to each realm</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Ambient soundtrack for immersive audio</span>
                    </li>
                  </ul>
                </motion.div>
              </div>

              {/* Dynamic 3D Realm Previews section */}
              <div className="max-w-4xl mx-auto mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl font-bold mb-4">DYNAMIC 3D REALM PREVIEWS</h2>
                  <p className="text-gray-300 mb-4">
                    Each realm features a customized animated 3D model that responds to mouse movement, creating an engaging visual experience.
                  </p>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-pink-500/20 mr-2 mt-2"></span>
                      <span>Mirror Fragments for Echo, Nodal Network for Nexus, and more</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-pink-500/20 mr-2 mt-2"></span>
                      <span>Mouse-driven rotation using Framer Motion's useTransform and useSpring</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-pink-500/20 mr-2 mt-2"></span>
                      <span>High-fidelity WebGL rendering for smooth animations</span>
                    </li>
                  </ul>
                </motion.div>
              </div>

              {/* Particle Backgrounds section */}
              <div className="max-w-4xl mx-auto mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl font-bold mb-4">PARTICLE BACKGROUNDS</h2>
                  <p className="text-gray-300 mb-4">
                    Dynamic particle systems create vibrant, layered depth for each realm's preview.
                  </p>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span>Unique particle effects: ripples, nodes, stars, pulses, glyphs, blocks, pixels, dust</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span>Randomized Framer Motion transitions for dynamic movement</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span>Layered depth for immersive visual atmosphere</span>
                    </li>
                  </ul>
                </motion.div>
              </div>

              {/* Navigation UI section */}
              <div className="max-w-4xl mx-auto mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl font-bold mb-4">NAVIGATION UI</h2>
                  <p className="text-gray-300 mb-4">
                    A vertical menu provides seamless navigation between realms.
                  </p>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Animated icons for each realm</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Hover effects with ripple animations</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Smooth transitions between realm previews</span>
                    </li>
                  </ul>
                </motion.div>
              </div>

              {/* Ambient Sound Integration section */}
              <div className="max-w-4xl mx-auto mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl font-bold mb-4">AMBIENT SOUND INTEGRATION</h2>
                  <p className="text-gray-300 mb-4">
                    Each realm features a unique ambient soundtrack that enhances the immersive experience.
                  </p>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-pink-500/20 mr-2 mt-2"></span>
                      <span>Dynamic loading of soundscapes (e.g., echo-theme.mp3, nexus-theme.mp3)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-pink-500/20 mr-2 mt-2"></span>
                      <span>Instant music transitions on realm selection</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-pink-500/20 mr-2 mt-2"></span>
                      <span>Controlled via centralized AudioProvider context</span>
                    </li>
                  </ul>
                </motion.div>
              </div>

              {/* Poetry and Storytelling section */}
              <div className="max-w-4xl mx-auto mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl font-bold mb-4">POETRY AND STORYTELLING</h2>
                  <p className="text-gray-300 mb-4">
                    Each realm is introduced with a four-line poem, fostering emotional and philosophical engagement.
                  </p>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span>Animated text transitions for poetic presentation</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span>Themes reflecting identity, connection, perception, and more</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span>Encourages reflective and narrative-driven exploration</span>
                    </li>
                  </ul>
                </motion.div>
              </div>

              {/* Technology Stack section */}
              <div className="max-w-4xl mx-auto mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl font-bold mb-4">TECHNOLOGY STACK</h2>
                  <p className="text-gray-300 mb-4">
                    The Realms Selection Page is built with a robust set of modern technologies.
                  </p>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>React and TypeScript for scalable development</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Framer Motion for 3D animations and transitions</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Next.js for routing and client-side rendering</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Lucide-react icons for UI elements</span>
                    </li>
                  </ul>
                </motion.div>
              </div>

              {/* Future Extensibility section */}
              <div className="max-w-4xl mx-auto mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl font-bold mb-4">FUTURE EXTENSIBILITY</h2>
                  <p className="text-gray-300 mb-4">
                    The Realms Selection Page is designed for growth and expansion.
                  </p>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span>Add new realms by defining new realm objects</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span>Support for new shader-based 3D model types</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span>Dynamic particle enhancements like weather effects</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span>Sequential realm unlocking based on player achievements</span>
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
                  The Realms Selection Page is the gateway to VOID Resonance, blending poetry, dynamic 3D animations, and responsive music to create an immersive and emotional introduction to the VOID universe.
                </p>
                <p className="text-gray-300">
                  Step into a realm where every pixel is alive, and every choice shapes your journey.
                </p>

                <div className="mt-8">
                  <Link href="/app/realm">
                    <Button
                      size="lg"
                      className="bg-purple-500 hover:bg-purple-600 text-white rounded-none font-pixel"
                    >
                      EXPLORE REALMS
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
        activeSection="realm"
      />

      {/* Footer */}
      <Footer />
    </div>
  )
}