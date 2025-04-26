
"use client"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
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
          <Link href="/gallery">
            <motion.div
              className={`px-3 py-1 text-xs ${colorClass.text} border ${colorClass.border} opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 cursor-pointer`}
              animate={{ y: isHovered ? 0 : 10, opacity: isHovered ? 1 : 0 }}
              initial={{ y: 10, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <span>LEARN MORE</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </motion.div>
          </Link>
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

export default function GalleryDocsPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const containerRef = useRef(null)

  // Features data for FeatureCard components
  const features = [
    {
      title: "3D Banner",
      description: "A dynamic hero section with rotating 3D grids, animated rings, and parallax text effects for an immersive introduction.",
      color: "purple" as const,
    },
    {
      title: "Gallery Items",
      description: "Interactive cards with parallax tilt, hover scaling, particle effects, and category filtering for abstract art displays.",
      color: "pink" as const,
    },
    {
      title: "Interactive Cubes",
      description: "Selectable Realm Cubes with rotating animations, glowing effects, and hover interactions for a collectible experience.",
      color: "blue" as const,
    },
    {
      title: "Custom Cursor",
      description: "A pixel-styled animated cursor that scales and reacts to hovering over interactive gallery items and cubes.",
      color: "purple" as const,
    },
    {
      title: "Floating Particles",
      description: "Aesthetic particles floating across the page, enhancing the cyberpunk atmosphere with subtle animations.",
      color: "pink" as const,
    },
    {
      title: "Ambient Sound",
      description: "Subtle background audio that auto-plays to create an immersive and atmospheric user experience.",
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
          <DocsSidebar activeSection="gallery" />

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
                    text="VOID Gallery"
                    className="text-4xl lg:text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500"
                    animate
                  />
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-xl text-gray-300 mb-4"
                  >
                    IMMERSIVE ART & CUBE SHOWCASE
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
                  VOID Gallery is an interactive showcase of abstract art pieces and collectible Realm Cubes, featuring 3D animations, custom cursors, ambient sound, and a cyberpunk aesthetic.
                </motion.p>
              </div>
            </div>

            {/* Main documentation content */}
            <div className="container mx-auto px-6 py-16">
              {/* VOID Gallery Overview */}
              <div className="max-w-4xl mx-auto mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl font-bold mb-4">VOID Gallery - Overview</h2>
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
                    VOID Gallery is a visually stunning platform that showcases abstract art from the VOID experience and interactive 3D Realm Cubes. Built with Next.js and Framer Motion, it offers a cyberpunk-inspired interface with parallax effects, glowing animations, custom cursors, and ambient sound, creating an immersive digital portfolio for art and collectibles.
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
                    Explore the core features that make VOID Gallery an immersive showcase for art and interactive cubes.
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

              {/* 3D Banner section */}
              <div className="max-w-4xl mx-auto mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl font-bold mb-4">3D BANNER</h2>
                  <p className="text-gray-300 mb-4">
                    A dynamic hero section that sets the tone with animated 3D visuals.
                  </p>
                  <h3 className="text-xl font-bold mb-2 text-purple-400">Key Features:</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Rotating 3D grid for depth and immersion</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Animated rings with pulsating effects</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Parallax text effects for dynamic scrolling</span>
                    </li>
                  </ul>
                </motion.div>
              </div>

              {/* Gallery Items section */}
              <div className="max-w-4xl mx-auto mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl font-bold mb-4">GALLERY ITEMS</h2>
                  <p className="text-gray-300 mb-4">
                    Interactive cards showcasing abstract art with dynamic effects.
                  </p>
                  <h3 className="text-xl font-bold mb-2 text-pink-400">Key Features:</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-pink-500/20 mr-2 mt-2"></span>
                      <span>Parallax tilt on hover for 3D-like interaction</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-pink-500/20 mr-2 mt-2"></span>
                      <span>Scaling and particle effects on hover</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-pink-500/20 mr-2 mt-2"></span>
                      <span>Category filtering (all, gameplay, concept)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-pink-500/20 mr-2 mt-2"></span>
                      <span>Click to expand for detailed view</span>
                    </li>
                  </ul>
                </motion.div>
              </div>

              {/* Interactive Cubes section */}
              <div className="max-w-4xl mx-auto mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl font-bold mb-4">INTERACTIVE CUBES</h2>
                  <p className="text-gray-300 mb-4">
                    Collectible Realm Cubes with engaging animations and interactions.
                  </p>
                  <h3 className="text-xl font-bold mb-2 text-blue-400">Key Features:</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span>Rotating animations triggered on hover</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span>Glowing effects with customizable colors</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span>Selectable cubes update the RealmCube component</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span>Imported from <code>../game/cube/realm-cube</code></span>
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
                    A dynamic cursor that enhances the interactive experience.
                  </p>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Pixel-styled design with animation</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Scales when hovering interactive elements</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Tracks mouse position for precise feedback</span>
                    </li>
                  </ul>
                </motion.div>
              </div>

              {/* Floating Particles section */}
              <div className="max-w-4xl mx-auto mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl font-bold mb-4">FLOATING PARTICLES</h2>
                  <p className="text-gray-300 mb-4">
                    Subtle animations that enhance the cyberpunk aesthetic.
                  </p>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-pink-500/20 mr-2 mt-2"></span>
                      <span>Randomly generated particles across the page</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-pink-500/20 mr-2 mt-2"></span>
                      <span>Animated movement with Framer Motion</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-pink-500/20 mr-2 mt-2"></span>
                      <span>Colored in purple, pink, and blue hues</span>
                    </li>
                  </ul>
                </motion.div>
              </div>

              {/* Ambient Sound section */}
              <div className="max-w-4xl mx-auto mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl font-bold mb-4">AMBIENT SOUND</h2>
                  <p className="text-gray-300 mb-4">
                    Background audio that creates an immersive atmosphere.
                  </p>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span>Auto-plays subtle ambient sound</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span>Customizable audio file via <code>BackgroundAudio</code></span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span>Enhances the sci-fi experience</span>
                    </li>
                  </ul>
                </motion.div>
              </div>

              {/* Technical Stack section */}
              <div className="max-w-4xl mx-auto mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl font-bold mb-4">TECHNICAL STACK</h2>
                  <p className="text-gray-300 mb-4">
                    Built with modern technologies for performance and interactivity.
                  </p>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Next.js with client-side components for fast rendering</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Framer Motion for smooth animations and transitions</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>TailwindCSS with inline dynamic styles for flexibility</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>TypeScript for type-safe development</span>
                    </li>
                  </ul>
                </motion.div>
              </div>

              {/* Data Structures section */}
              <div className="max-w-4xl mx-auto mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl font-bold mb-4">DATA STRUCTURES</h2>
                  <p className="text-gray-300 mb-4">
                    Core data structures powering the gallery and cube interactions.
                  </p>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-pink-500/20 mr-2 mt-2"></span>
                      <span><code>galleryItems</code>: Array of 14 items (id, title, category, color, type)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-pink-500/20 mr-2 mt-2"></span>
                      <span><code>cubeCollection</code>: Imported from <code>../game/cube/realm-cube</code> with cube properties</span>
                    </li>
                  </ul>
                </motion.div>
              </div>

              {/* State Management section */}
              <div className="max-w-4xl mx-auto mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl font-bold mb-4">STATE MANAGEMENT</h2>
                  <p className="text-gray-300 mb-4">
                    Key states that drive the interactive experience.
                  </p>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span><code>cursorPosition</code>: Tracks mouse for custom cursor</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span><code>cursorHover</code>: Boolean for hover state on interactive elements</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span><code>activeImage</code>: Currently expanded gallery image</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span><code>filterCategory</code>: Selected category (all, gameplay, concept)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span><code>selectedCube</code>: User-selected cube ID</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span><code>activeCube</code>: Cube temporarily active for animations</span>
                    </li>
                  </ul>
                </motion.div>
              </div>

              {/* User Interactions section */}
              <div className="max-w-4xl mx-auto mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl font-bold mb-4">USER INTERACTIONS</h2>
                  <p className="text-gray-300 mb-4">
                    Engaging interactions that enhance the gallery experience.
                  </p>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Hover: Tilt cards, glow effects, scaling, particle movement</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Click: Expand gallery items or select Realm Cubes</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Scroll: Parallax effects and smooth transitions</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Audio: Auto-playing background sound for immersion</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-purple-500/20 mr-2 mt-2"></span>
                      <span>Cursor: Animated pixel-style cursor with hover feedback</span>
                    </li>
                  </ul>
                </motion.div>
              </div>

              {/* Customizable Areas section */}
              <div className="max-w-4xl mx-auto mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl font-bold mb-4">CUSTOMIZABLE AREAS</h2>
                  <p className="text-gray-300 mb-4">
                    Flexible components for easy customization and expansion.
                  </p>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-pink-500/20 mr-2 mt-2"></span>
                      <span>Add new <code>galleryItems</code> to expand the art collection</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-pink-500/20 mr-2 mt-2"></span>
                      <span>Extend <code>cubeCollection</code> with new cube designs</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-pink-500/20 mr-2 mt-2"></span>
                      <span>Adjust colors and effects via Tailwind classes and dynamic styles</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-pink-500/20 mr-2 mt-2"></span>
                      <span>Update background audio in <code>BackgroundAudio</code> component</span>
                    </li>
                  </ul>
                </motion.div>
              </div>

              {/* Developer Notes section */}
              <div className="max-w-4xl mx-auto mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl font-bold mb-4">DEVELOPER NOTES</h2>
                  <p className="text-gray-300 mb-4">
                    Considerations for performance, scalability, and maintenance.
                  </p>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span>Optimize Framer Motion animations for smooth performance on low-end devices</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span>Consider lazy-loading gallery items for large collections</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span>Ensure accessibility for custom cursor and audio controls</span>
                    </li>
                    <li className="flex items-start">
                      <span className="h-2 w-2 bg-blue-500/20 mr-2 mt-2"></span>
                      <span>Support dynamic cube imports for future extensibility</span>
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
                  VOID Gallery is an immersive platform that blends abstract art and interactive 3D cubes, offering a visually captivating experience with dynamic animations and a cyberpunk aesthetic.
                </p>
                <p className="text-gray-300">
                  Explore art. Collect cubes. Live in the VOID.
                </p>
                <div className="mt-8">
                  <Link href="/gallery">
                    <Button
                      size="lg"
                      className="bg-purple-500 hover:bg-purple-600 text-white rounded-none font-pixel"
                    >
                      EXPLORE GALLERY
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
        activeSection="gallery"
      />

      {/* Footer */}
      <Footer />
    </div>
  )
}
