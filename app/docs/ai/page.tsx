
"use client"

import { useState, useRef } from "react"
import { motion, useScroll, useTransform, useSpring } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import PixelHeading from "@/components/pixel-heading"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"

// FeatureCard component for different styled sections
interface FeatureCardProps {
  title: string;
  description: string;
  color: "purple" | "pink" | "blue";
  index: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, color, index }) => {
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
            {title}
          </h3>
        </div>

        <p className="text-gray-300 text-sm leading-relaxed">{description}</p>

        {/* Interactive elements */}
        <div className="mt-4 pt-4 border-t border-purple-900/30 flex justify-between items-center">
          <motion.div
            className={`px-3 py-1 text-xs ${colorClass.text} border ${colorClass.border} opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1`}
            animate={{ y: isHovered ? 0 : 10, opacity: isHovered ? 1 : 0 }}
            initial={{ y: 10, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <span>LEARN MORE</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </motion.div>
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

export default function AIDocsPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const containerRef = useRef(null)

  // Features data for FeatureCard components
  const features = [
    {
      title: "3D Cube Skins",
      description: "Generate unique cube skins using AI, with customizable prompts for style, texture, and shader effects, rendered in real-time with WebGL.",
      color: "purple" as const,
    },
    {
      title: "Music Composition",
      description: "Create original music tracks from text prompts, supporting styles like EDM, Lo-Fi, and Cinematic, with instant playback and NFT minting.",
      color: "pink" as const,
    },
    {
      title: "NFT Minting",
      description: "Mint your AI-generated cubes and music as NFTs on the Solana blockchain, with metadata for title, style, and creator details.",
      color: "blue" as const,
    },
    {
      title: "Interactive UI",
      description: "Explore a dynamic interface with 3D previews, floating particles, and parallax effects, designed for seamless creation and customization.",
      color: "purple" as const,
    },
    {
      title: "Shader Effects",
      description: "Apply advanced shaders like Hologram, Flow, and Gradient to cube skins, with dynamic color and animation controls.",
      color: "pink" as const,
    },
    {
      title: "Scalablibity",
      description: "Built for future growth, supporting new shader styles, textures, and features like text-to-scene generation and avatar creation.",
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
          <DocsSidebar activeSection="ai" />

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
                    text="VOID Creator AI"
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
                  VOID Creator AI empowers users to generate stunning 3D assets and music compositions using AI, with seamless blockchain integration for digital ownership.
                </motion.p>
              </div>
            </div>

            {/* Main documentation content */}
            <div className="container mx-auto px-6 py-16">
              {/* VOID Creator AI Feature Overview */}
              <div className="max-w-4xl mx-auto mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl font-bold mb-4">VOID Creator AI - Feature Overview</h2>
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
                    VOID Creator AI is an integrated creative platform designed to empower users to generate original, high-quality 3D assets and music compositions using the power of Artificial Intelligence. Built into the VOID ecosystem, it bridges the gap between imagination and digital ownership, enabling anyone to become a creator without specialized technical skills.
                  </p>
                </motion.div>
              </div>

              {/* Core Features section */}
              <div className="max-w-4xl mx-auto mb-16">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                  className="mb-8"
                >
                  <h2 className="text-2xl font-bold mb-4">CORE FEATURES</h2>
                  <p className="text-gray-300 mb-4">
                    Explore the key features of VOID Creator AI, from AI-generated 3D cube skins to music composition and NFT minting.
                  </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {features.map((feature, index) => (
                    <FeatureCard
                      key={index}
                      title={feature.title}
                      description={feature.description}
                      color={feature.color}
                      index={index}
                    />
                  ))}
                </div>
              </div>

              {/* AI-Generated 3D Cube Skins section */}
              <div className="max-w-4xl mx-auto mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl font-bold mb-4">AI-GENERATED 3D CUBE SKINS</h2>
                  <p className="text-gray-300 mb-4">
                    Users can create unique cube skins by submitting textual prompts, which are processed to generate a variety of material parameters and visual variants.
                  </p>
                  <h3 className="text-xl font-bold mb-2 text-purple-400">Key Features:</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Prompt-based material synthesis for colors, textures, and shaders</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Six auto-generated variants: Crystal, Chrome, Plasma, Hologram, Carbon Fiber, Nebula</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Real-time 3D previews with HDR lighting and bloom effects</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Special shader effects like Hologram, Flow, and Gradient</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt contradictingmt-2"></span>
                      <span>Mint as NFTs on the Solana blockchain</span>
                    </li>
                  </ul>
                </motion.div>
              </div>

              {/* AI-Generated Music section */}
              <div className="max-w-4xl mx-auto mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl font-bold mb-4">AI-GENERATED MUSIC</h2>
                  <p className="text-gray-300 mb-4">
                    Generate original music tracks from text prompts, with support for various styles and instant playback through an HTML5 audio player.
                  </p>
                  <h3 className="text-xl font-bold mb-2 text-pink-400">Key Features:</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-pink-500/20 mr-2 mt-2"></span>
                      <span>Supports styles like Lo-Fi, EDM, Cinematic, Ambient, and Synthwave</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-pink-500/20 mr-2 mt-2"></span>
                      <span>Metadata customization for title, style, and instrumental/vocal settings</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-pink-500/20 mr-2 mt-2"></span>
                      <span>Instant playback with HTML5 audio player</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-pink-500/20 mr-2 mt-2"></span>
                      <span>Mint as NFTs with audio files and metadata</span>
                    </li>
                  </ul>
                </motion.div>
              </div>

              {/* User Interface Highlights section */}
              <div className="max-w-4xl mx-auto mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl font-bold mb-4">USER INTERFACE HIGHLIGHTS</h2>
                  <p className="text-gray-300 mb-4">
                    VOID Creator AI features a dynamic and interactive interface designed for ease of use and visual appeal.
                  </p>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span>Dynamic tabs for switching between Cube and Music creation</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span>Interactive 3D environment with rotating models and advanced shading</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span>Customization controls for fine-tuning materials and music</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span>Real-time wallet feedback and profile linking</span>
                    </li>
                  </ul>
                </motion.div>
              </div>

              {/* Blockchain and NFT Integration section */}
              <div className="max-w-4xl mx-auto mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl font-bold mb-4">BLOCKCHAIN AND NFT INTEGRATION</h2>
                  <p className="text-gray-300 mb-4">
                    Seamlessly connect to the Solana blockchain to mint your creations as NFTs, with comprehensive metadata storage.
                  </p>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Wallet connection via @solana/wallet-adapter-react</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Mint cube skins as GLB 3D files and music as audio files</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Metadata includes title, style, creator address, and generation parameters</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Support for mock and real minting modes</span>
                    </li>
                  </ul>
                </motion.div>
              </div>

              {/* Visual and Animation Systems section */}
              <div className="max-w-4xl mx-auto mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl font-bold mb-4">VISUAL AND ANIMATION SYSTEMS</h2>
                  <p className="text-gray-300 mb-4">
                    Advanced visual effects and animations enhance the creative experience in VOID Creator AI.
                  </p>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-pink-500/20 mr-2 mt-2"></span>
                      <span>Procedurally animated floating particles for a cosmic atmosphere</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-pink-500/20 mr-2 mt-2"></span>
                      <span>Parallax rotating 3D grid in the banner section</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-pink-500/20 mr-2 mt-2"></span>
                      <span>Shader-based materials with dynamic color and glow effects</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-pink-500/20 mr-2 mt-2"></span>
                      <span>Bloom and HDR-based environment reflections</span>
                    </li>
                  </ul>
                </motion.div>
              </div>

              {/* Extensibility and Roadmap section */}
              <div className="max-w-4xl mx-auto mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl font-bold mb-4">EXTENSIBILITY AND ROADMAP</h2>
                  <p className="text-gray-300 mb-4">
                    VOID Creator AI is designed for future growth, with planned enhancements and modular architecture.
                  </p>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span>Text-to-scene 3D generation and avatar creator</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span>Music remixing tool for beat-based modifications</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span>Enhanced NFT marketplace integration</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span>Support for new shader styles and procedural textures</span>
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
                  VOID Creator AI is a revolutionary platform that combines AI-driven creativity with blockchain technology, enabling users to create and own unique 3D assets and music compositions.
                </p>
                <p className="text-gray-300">
                  Create boldly. Mint forever. Live in the VOID.
                </p>

                <div className="mt-8">
                  <Button
                    size="lg"
                    className="bg-purple-500 hover:bg-purple-600 text-white rounded-none font-pixel"
                  >
                    START CREATING
                  </Button>
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
        activeSection="ai"
      />

      {/* Footer */}
      <Footer />
    </div>
  )
}
