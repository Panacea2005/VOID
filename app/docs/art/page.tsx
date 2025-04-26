"use client"

import { useState, useRef } from "react"
import { motion, useScroll, useTransform, useSpring } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import PixelHeading from "@/components/pixel-heading"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"

// FeatureCard component for showcasing key features
interface FeatureCardProps {
  title: string;
  description: string;
  color: "purple" | "pink" | "blue";
  index: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, color, index }) => {
  const [isHovered, setIsHovered] = useState(false)

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
      <motion.div
        className={`absolute -inset-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl z-0 bg-gradient-to-r ${colorClass.gradient}`}
        animate={{ opacity: [0, 0.7, 0] }}
        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
      />
      <div className={`relative bg-black/80 border ${colorClass.border} p-6 h-full z-10`}>
        <div className="mb-4">
          <h3 className={`text-xl font-bold mb-1 text-transparent bg-clip-text bg-gradient-to-r ${colorClass.gradient}`}>
            {title}
          </h3>
        </div>
        <p className="text-gray-300 text-sm leading-relaxed">{description}</p>
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
    backgroundColor: i % 2 === 0 ? "#a855f7" : "#ec4899",
    boxShadow: `0 0 ${Math.random() * 3 + 2}px ${i % 2 === 0 ? "#a855f7" : "#ec4899"}`,
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

export default function ArtDocsPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const containerRef = useRef(null)

  // Features data for FeatureCard components
  const features = [
    {
      title: "AI-Powered Generation",
      description: "Create unique pixel art from text prompts, with customizable canvas sizes from 64x64 to 1024x1024, and a pixel-by-pixel reveal animation.",
      color: "purple" as const,
    },
    {
      title: "Interactive Canvas",
      description: "Dynamically resizes to fit any device, with a subtle purple grid, no anti-aliasing for true 8-bit aesthetics, and error display on the canvas.",
      color: "pink" as const,
    },
    {
      title: "Preset Prompts",
      description: "Explore instant inspiration with presets like 'Cyberpunk city skyline' or '8-bit fantasy hero,' auto-filling the prompt for quick creation.",
      color: "blue" as const,
    },
    {
      title: "Custom Cursor",
      description: "A pixel-themed animated cursor that scales and responds to hover events, enhancing the retro-futuristic user experience.",
      color: "purple" as const,
    },
    {
      title: "Download & Mint",
      description: "Export pixel art as high-resolution 2048x2048 PNGs, with future support for minting creations as NFTs on the Solana blockchain.",
      color: "pink" as const,
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
          <DocsSidebar activeSection="art" />

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
                    text="VOID Pixel Image Generator"
                    className="text-4xl lg:text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500"
                    animate
                  />
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-xl text-gray-300 mb-4"
                  >
                    AI-POWERED CREATOR
                  </motion.h2>
                  <div className="h-1 w-40 bg-gradient-to-r from-purple-500 to-pink-500 mb-6 relative overflow-hidden">
                    <motion.div
                      className="absolute top-0 left-0 h-full bg-white/50"
                      style={{ width: "20px" }}
                      animate={{ x: [0, 160, 0], opacity: [0, 1, 0] }}
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
                  The VOID Pixel Art Creator is an AI-powered platform where users craft nostalgic pixel art from text prompts, with customizable canvases, animated reveals, and future NFT minting.
                </motion.p>
              </div>
            </div>

            {/* Main documentation content */}
            <div className="container mx-auto px-6 py-16">
              {/* VOID Pixel Art Creator Overview */}
              <div className="max-w-4xl mx-auto mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl font-bold mb-4">VOID Pixel Art Creator - Overview</h2>
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
                    The VOID Pixel Art Creator blends retro 8-bit aesthetics with futuristic cyberpunk design, allowing users to generate unique pixel artwork from text descriptions. With dynamic canvas sizes, animated pixel reveals, and future NFT minting, it offers an immersive creative experience enhanced by parallax effects and a responsive UI.
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
                    Explore the core features that make the VOID Pixel Art Creator a powerful tool for artistic expression.
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

              {/* AI-Powered Pixel Art Generation section */}
              <div className="max-w-4xl mx-auto mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl font-bold mb-4">AI-POWERED PIXEL ART GENERATION</h2>
                  <p className="text-gray-300 mb-4">
                    Generate pixel art from descriptive text prompts, with customizable canvas sizes and a dynamic pixel-by-pixel reveal animation.
                  </p>
                  <h3 className="text-xl font-bold mb-2 text-purple-400">Key Features:</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Text prompt input for creative control (e.g., "neon dragon over retro city")</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Canvas sizes: 64x64, 128x128, 256x256, 512x512, 1024x1024</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Pixel-by-pixel animated reveal for engaging generation</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>High-resolution 2048x2048 PNG output with pixel integrity</span>
                    </li>
                  </ul>
                </motion.div>
              </div>

              {/* Interactive Canvas System section */}
              <div className="max-w-4xl mx-auto mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl font-bold mb-4">INTERACTIVE CANVAS SYSTEM</h2>
                  <p className="text-gray-300 mb-4">
                    A responsive canvas system designed for pixel-perfect artwork creation.
                  </p>
                  <h3 className="text-xl font-bold mb-2 text-pink-400">Key Features:</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-pink-500/20 mr-2 mt-2"></span>
                      <span>Real-time resizing to fit any device or window</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-pink-500/20 mr-2 mt-2"></span>
                      <span>Subtle purple grid for clear pixel structure</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-pink-500/20 mr-2 mt-2"></span>
                      <span>No anti-aliasing for authentic 8-bit aesthetics</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-pink-500/20 mr-2 mt-2"></span>
                      <span>Custom error messages rendered on canvas</span>
                    </li>
                  </ul>
                </motion.div>
              </div>

              {/* Preset Inspiration Prompts section */}
              <div className="max-w-4xl mx-auto mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl font-bold mb-4">PRESET INSPIRATION PROMPTS</h2>
                  <p className="text-gray-300 mb-4">
                    Quick-start prompts to spark creativity and streamline the generation process.
                  </p>
                  <h3 className="text-xl font-bold mb-2 text-blue-400">Examples:</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span>A cyberpunk city skyline with neon lights</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span>An 8-bit fantasy hero character</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span>Retro space invaders arcade scene</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span>Pixel art sunset over mountains</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span>Cyberpunk samurai with glowing katana</span>
                    </li>
                  </ul>
                </motion.div>
              </div>

              {/* Custom Cursor section */}
              <div className="max-w-4xl mx-auto mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl font-bold mb-4">CUSTOM CURSOR</h2>
                  <p className="text-gray-300 mb-4">
                    A pixel-themed cursor enhances the retro-futuristic experience.
                  </p>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Animated cursor with pixelated design</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Dynamic scaling on hover events</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Responsive visual feedback for UI interactions</span>
                    </li>
                  </ul>
                </motion.div>
              </div>

              {/* Download and Mint Options section */}
              <div className="max-w-4xl mx-auto mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl font-bold mb-4">DOWNLOAD AND MINT OPTIONS</h2>
                  <p className="text-gray-300 mb-4">
                    Save your creations or prepare them for blockchain minting.
                  </p>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-pink-500/20 mr-2 mt-2"></span>
                      <span>Download as 2048x2048 PNG with preserved pixel integrity</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-pink-500/20 mr-2 mt-2"></span>
                      <span>Future minting support for NFTs on Solana blockchain</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-pink-500/20 mr-2 mt-2"></span>
                      <span>Suitable for display, printing, or digital collectibles</span>
                    </li>
                  </ul>
                </motion.div>
              </div>

              {/* Visual Experience section */}
              <div className="max-w-4xl mx-auto mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl font-bold mb-4">VISUAL EXPERIENCE</h2>
                  <p className="text-gray-300 mb-4">
                    A retro-futuristic aesthetic with dynamic animations enhances the creative process.
                  </p>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span>Animated hero banner with neon glow and pulsating rings</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span>Parallax scrolling grids responsive to mouse and scroll</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span>Progressive pixel reveal animation for artwork generation</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span>Pulsing grid loading animation during generation</span>
                    </li>
                  </ul>
                </motion.div>
              </div>

              {/* Technical Architecture section */}
              <div className="max-w-4xl mx-auto mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl font-bold mb-4">TECHNICAL ARCHITECTURE</h2>
                  <p className="text-gray-300 mb-4">
                    Built with modern technologies for performance and scalability.
                  </p>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>React (Next.js) SPA with TypeScript for type safety</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Framer Motion for animations (scrolling, hover, load)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Canvas API for pixel grid, placement, and downloads</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Custom API route (/api/generate-pixel-art) for AI processing</span>
                    </li>
                  </ul>
                </motion.div>
              </div>

              {/* Extensibility Roadmap section */}
              <div className="max-w-4xl mx-auto mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl font-bold mb-4">EXTENSIBILITY ROADMAP</h2>
                  <p className="text-gray-300 mb-4">
                    Planned enhancements to expand the Pixel Art Creator's capabilities.
                  </p>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-pink-500/20 mr-2 mt-2"></span>
                      <span>NFT minting with Solana wallet integration</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-pink-500/20 mr-2 mt-2"></span>
                      <span>Support for pixel animation GIFs</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-pink-500/20 mr-2 mt-2"></span>
                      <span>Advanced prompt controls for style and color</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-pink-500/20 mr-2 mt-2"></span>
                      <span>Social sharing and collaborative grid mode</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-pink-500/20 mr-2 mt-2"></span>
                      <span>Procedural scene builder and pixel avatar generator</span>
                    </li>
                  </ul>
                </motion.div>
              </div>

              {/* Design and Aesthetic Notes section */}
              <div className="max-w-4xl mx-auto mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl font-bold mb-4">DESIGN AND AESTHETIC NOTES</h2>
                  <p className="text-gray-300 mb-4">
                    A cohesive visual language blending retro and futuristic elements.
                  </p>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span>Purple (#a855f7) and pink (#ec4899) color palette</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span>Press Start 2P pixel font for headings and labels</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span>Soft glowing borders and neon accents</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span>Retro-futuristic 1980s pixel art meets sci-fi minimalism</span>
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
                  The VOID Pixel Art Creator is a portal to artistic expression, combining nostalgic 8-bit aesthetics with AI-powered generation and future blockchain integration.
                </p>
                <p className="text-gray-300">
                  Craft your vision pixel by pixel. Welcome to the future of creation in VOID.
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
        activeSection="art"
      />

      {/* Footer */}
      <Footer />
    </div>
  )
}