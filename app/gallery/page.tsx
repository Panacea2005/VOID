"use client"

import { useState, useEffect, useRef } from "react"
import { motion, useScroll, useTransform, AnimatePresence, useSpring } from "framer-motion"
import Link from "next/link"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import AbstractShape from "@/components/abstract-shape"
import PixelHeading from "@/components/pixel-heading"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import RealmCube, { cubeCollection } from "../game/cube/realm-cube"
import BackgroundAudio from "@/components/background-audio"

// Modified GalleryItem interface with fewer properties
interface GalleryItemProps {
  id: number;
  title: string;
  category: string;
  color: "purple" | "pink" | "blue";
  type: "circle" | "square" | "triangle" | "complex" | "wave" | "grid" | "dots" | "noise" | "loading" | "gamepad";
}

const GalleryItem = ({
  item,
  index,
  setCursorHover,
  activeImage,
  setActiveImage,
}: {
  item: GalleryItemProps;
  index: number;
  setCursorHover: (hover: boolean) => void;
  activeImage: number | null;
  setActiveImage: (id: number | null) => void;
}) => {
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)
  const itemRef = useRef<HTMLDivElement>(null)
  
  const handleMouseMove = (e: { clientX: number; clientY: number }) => {
    if (!itemRef.current) return
    
    const card = itemRef.current
    const rect = card.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const posX = e.clientX - centerX
    const posY = e.clientY - centerY
    
    // Calculate rotation values (limited to small angles)
    setRotateX(-posY * 0.01)
    setRotateY(posX * 0.01)
  }
  
  const handleMouseLeave = () => {
    // Reset rotation
    setRotateX(0)
    setRotateY(0)
    setCursorHover(false)
  }
  
  return (
    <motion.div
      ref={itemRef}
      layout
      key={item.id}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "relative aspect-square overflow-hidden group cursor-pointer perspective-1000 font-pixel",
        activeImage === item.id ? "md:col-span-2 md:row-span-2" : "",
      )}
      onClick={() => setActiveImage(activeImage === item.id ? null : item.id)}
      onMouseEnter={() => setCursorHover(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transformStyle: "preserve-3d",
        transition: "transform 0.1s ease-out",
      }}
    >
      {/* Background gradient */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-black to-purple-900/30 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        animate={{ opacity: activeImage === item.id ? 0.7 : 0 }}
      />

      {/* Glow effect on hover */}
      <motion.div
        className={`absolute -inset-1 opacity-0 group-hover:opacity-100 blur-md z-0 bg-gradient-to-r 
          ${item.color === "purple" ? "from-purple-500/30 to-purple-700/30" : 
            item.color === "pink" ? "from-pink-500/30 to-pink-700/30" : 
            "from-blue-500/30 to-blue-700/30"}`}
      />

      {/* Image container - replace placeholder URLs with your actual images */}
      <div className="absolute inset-0 bg-black">
        <div className="w-full h-full relative overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
            style={{
              // REPLACE THIS URL with your actual image paths
              backgroundImage: `url('/item-${item.id}.png')`,
              // Add a color overlay based on the item color
              backgroundBlendMode: "overlay",
              backgroundColor: item.color === "purple" ? "rgba(168, 85, 247, 0.3)" : 
                              item.color === "pink" ? "rgba(236, 72, 153, 0.3)" : 
                              "rgba(59, 130, 246, 0.3)",
            }}
          />
        </div>
        
        {/* Interactive particles */}
        {Array.from({ length: 10 }).map((_, i) => (
          <motion.div
            key={`particle-${item.id}-${i}`}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.3 + 0.2,
              backgroundColor: item.color === "purple" ? "#a855f7" : 
                              item.color === "pink" ? "#ec4899" : "#3b82f6",
              boxShadow: `0 0 5px ${item.color === "purple" ? "#a855f7" : 
                                    item.color === "pink" ? "#ec4899" : "#3b82f6"}`,
            }}
            animate={{
              y: [-(Math.random() * 20), Math.random() * 20],
              x: [-(Math.random() * 20), Math.random() * 20],
              scale: [1, Math.random() * 0.5 + 1, 1],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Simplified content overlay - just title and expand button */}
      <div className="absolute inset-0 z-20 p-4 flex flex-col justify-between transform transition-transform duration-500">
        <div className="transform translate-y-full group-hover:translate-y-0 transition-transform duration-500">
          <motion.div 
            className="inline-block px-3 py-1 mb-2 bg-black/90 backdrop-blur-sm text-xs uppercase tracking-wider text-gray-400 border-l-2 font-pixel"
            style={{
              borderColor: item.color === "purple" ? "#a855f7" : 
                item.color === "pink" ? "#ec4899" : "#3b82f6"
            }}
            whileHover={{ 
              x: 5, 
              backgroundColor: item.color === "purple" ? "rgba(168, 85, 247, 0.2)" : 
                item.color === "pink" ? "rgba(236, 72, 153, 0.2)" : "rgba(59, 130, 246, 0.2)" 
            }}
          >
            {item.category}
          </motion.div>
          <PixelHeading
            text={item.title}
            className={cn(
              "text-xl md:text-2xl font-bold mb-2",
              item.color === "purple"
                ? "text-purple-400"
                : item.color === "pink"
                  ? "text-pink-400"
                  : "text-blue-400",
            )}
          />
        </div>

        <div className="flex justify-end items-center font-pixel">
          <motion.div 
            className="w-8 h-8 border flex items-center justify-center"
            style={{
              borderColor: item.color === "purple" ? "#a855f7" : 
                item.color === "pink" ? "#ec4899" : "#3b82f6"
            }}
            whileHover={{ 
              scale: 1.1, 
              backgroundColor: item.color === "purple" ? "rgba(168, 85, 247, 0.2)" : 
                item.color === "pink" ? "rgba(236, 72, 153, 0.2)" : "rgba(59, 130, 246, 0.2)" 
            }}
            whileTap={{ scale: 0.95 }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={cn(
                "transition-transform duration-300",
                activeImage === item.id ? "rotate-45" : "",
              )}
              style={{
                color: item.color === "purple" ? "#a855f7" : 
                  item.color === "pink" ? "#ec4899" : "#3b82f6"
              }}
            >
              <rect x="5" y="0" width="2" height="12" fill="currentColor" />
              <rect x="0" y="5" width="12" height="2" fill="currentColor" />
            </svg>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

// Enhanced 3D Banner for Gallery Page
const Gallery3DBanner = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  
  // For tracking mouse movement
  useEffect(() => {
    const handleMouseMove = (e: { clientX: number; clientY: number }) => {
      // Calculate mouse position relative to the center of the viewport
      const x = (e.clientX / window.innerWidth - 0.5) * 2
      const y = (e.clientY / window.innerHeight - 0.5) * 2
      setMousePosition({ x, y })
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <div className="relative h-screen w-full flex items-center justify-center overflow-hidden font-pixel">
      {/* Background gradient and particles */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-black to-black z-0"></div>
      
      {/* 3D rotating grid */}
      <motion.div 
        className="absolute inset-0 z-0 opacity-20"
        style={{
          perspective: "1000px",
          transformStyle: "preserve-3d",
        }}
      >
        <motion.div
          className="w-full h-full grid grid-cols-12 grid-rows-12 gap-4"
          style={{
            rotateX: mousePosition.y * 5,
            rotateY: -mousePosition.x * 5,
            transformStyle: "preserve-3d",
          }}
          transition={{ type: "spring", damping: 15 }}
        >
          {Array.from({ length: 144 }).map((_, i) => (
            <motion.div
              key={`grid-${i}`}
              className="border border-purple-500/30"
              style={{
                translateZ: Math.sin(i * 0.1) * 20,
              }}
              animate={{
                opacity: [0.1, i % 10 === 0 ? 0.5 : 0.2, 0.1],
                borderColor: [
                  "rgba(168, 85, 247, 0.3)",
                  "rgba(236, 72, 153, 0.3)",
                  "rgba(168, 85, 247, 0.3)",
                ],
              }}
              transition={{
                duration: 4 + Math.random() * 6,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
          ))}
        </motion.div>
      </motion.div>

      {/* Animated rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        {[100, 200, 300, 400].map((size, i) => (
          <motion.div
            key={`ring-${i}`}
            className="absolute border border-purple-500/20 rounded-full"
            style={{
              width: size,
              height: size,
              borderRadius: "50%",
            }}
            animate={{
              rotate: [0, 360],
              scale: [1, 1.1, 1],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              rotate: { duration: 20 + i * 5, repeat: Infinity, ease: "linear" },
              scale: { duration: 3 + i, repeat: Infinity, repeatType: "reverse" },
              opacity: { duration: 4 + i, repeat: Infinity, repeatType: "reverse" },
            }}
          />
        ))}
      </div>

      {/* Floating particles */}
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={`banner-particle-${i}`}
          className="absolute w-1 h-1 rounded-full"
          style={{
            backgroundColor: i % 3 === 0 ? "#a855f7" : i % 3 === 1 ? "#ec4899" : "#3b82f6",
            boxShadow: `0 0 5px ${i % 3 === 0 ? "#a855f7" : i % 3 === 1 ? "#ec4899" : "#3b82f6"}`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [-(Math.random() * 200), Math.random() * 200],
            x: [-(Math.random() * 200), Math.random() * 200],
            scale: [1, Math.random() * 2 + 1, 1],
            opacity: [0, 0.7, 0],
          }}
          transition={{
            duration: 10 + Math.random() * 20,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Main title with parallax effect */}
      <div className="relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          style={{
            textShadow: "0 0 30px rgba(168, 85, 247, 0.5)",
          }}
        >
          <PixelHeading
            text="GALLERY"
            className="text-8xl sm:text-9xl font-black tracking-tighter mb-6 leading-none text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500"
            animate
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="relative"
        >
          <motion.div
            className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 opacity-75 blur-lg"
            animate={{
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <PixelHeading
            text="VISUAL EXPLORATION"
            className="text-3xl sm:text-4xl md:text-5xl mt-2 tracking-wide text-gray-300 relative"
            animate
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mt-10 mb-12 font-light font-pixel"
        >
          A collection of abstract visuals from the void experience
        </motion.p>
        
        {/* Decorative elements */}
        <motion.div 
          className="flex items-center justify-center gap-4 mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.6 }}
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <motion.div
              key={`decoration-${i}`}
              className="w-3 h-3 bg-purple-500"
              animate={{
                scale: [1, i % 2 === 0 ? 1.5 : 0.7, 1],
                opacity: [0.5, 1, 0.5],
                backgroundColor: [
                  "#a855f7",
                  "#ec4899",
                  "#a855f7",
                ],
              }}
              transition={{
                duration: 2 + i * 0.5,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 2 }}
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
      >
        <div className="flex flex-col items-center">
          <p className="text-sm text-gray-400 mb-2 font-pixel">SCROLL TO EXPLORE</p>
          <motion.div className="relative">
            <svg width="24" height="40" viewBox="0 0 24 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="0" y="0" width="24" height="40" rx="12" stroke="#a855f7" strokeWidth="2" />
              <motion.rect
                animate={{ y: [4, 28, 4] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                x="8"
                width="8"
                height="8"
                rx="4"
                fill="#ec4899"
              />
            </svg>
            
            {/* Glow effect */}
            <motion.div
              className="absolute -inset-4 bg-purple-500 opacity-20 blur-xl rounded-full"
              animate={{ opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
        </div>
      </motion.div>
    </div>
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
  
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    // Generate random particles after component mounts
    const generatedParticles = Array.from({ length: 40 }).map((_, i) => ({
      id: `particle-${i}`,
      width: Math.random() * 3 + 1,
      height: Math.random() * 3 + 1,
      backgroundColor:
        i % 3 === 0 ? "#a855f7" : i % 3 === 1 ? "#ec4899" : "#3b82f6",
      boxShadow: `0 0 ${Math.random() * 3 + 2}px ${
        i % 3 === 0 ? "#a855f7" : i % 3 === 1 ? "#ec4899" : "#3b82f6"
      }`,
      opacity: Math.random() * 0.5 + 0.2,
      initialX: Math.random() * 100,
      initialY: Math.random() * 100,
      destinationX: Math.random() * 100,
      destinationY: Math.random() * 100,
    }))

    setParticles(generatedParticles)
  }, [])

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

// RealmCube card component for interactive showcase
interface CubeProps {
  id: string;
  name: string;
  rarity: string;
  colors: string[];
  borderColor: string;
  glow: string;
  accentColor: string;
}

const RealmCubeCard = ({
  cube,
  index,
  setCursorHover,
  onSelect,
  isSelected,
}: {
  cube: CubeProps;
  index: number;
  setCursorHover: (hover: boolean) => void;
  onSelect: (id: string) => void;
  isSelected: boolean;
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [rotateX, setRotateX] = useState(15)
  const [rotateY, setRotateY] = useState(15)
  const [rotateZ, setRotateZ] = useState(0)
  
  // Auto-rotation animation
  useEffect(() => {
    if (!isHovered) return
    
    let frameId: number
    let angle = 0
    
    const autoRotate = () => {
      angle += 0.01
      setRotateY(15 + Math.sin(angle) * 25)
      setRotateX(15 + Math.cos(angle) * 15)
      setRotateZ(Math.sin(angle * 0.5) * 5)
      
      frameId = requestAnimationFrame(autoRotate)
    }
    
    frameId = requestAnimationFrame(autoRotate)
    
    return () => {
      cancelAnimationFrame(frameId)
    }
  }, [isHovered])
  
  const handleMouseEnter = () => {
    setCursorHover(true)
    setIsHovered(true)
  }
  
  const handleMouseLeave = () => {
    setCursorHover(false)
    setIsHovered(false)
    setRotateX(15)
    setRotateY(15)
    setRotateZ(0)
  }
  
  // Get rarity styles
  const getRarityStyles = (rarity: any) => {
    switch (rarity) {
      case "common":
        return { color: "#a1a1aa", label: "COMMON" }
      case "rare":
        return { color: "#3b82f6", label: "RARE" }
      case "epic":
        return { color: "#8b5cf6", label: "EPIC" }
      case "legendary":
        return { color: "#f59e0b", label: "LEGENDARY" }
      default:
        return { color: "#a1a1aa", label: "COMMON" }
    }
  }
  
  const rarity = getRarityStyles(cube.rarity)
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true, margin: "-100px" }}
      className="relative bg-black/30 border border-gray-800 rounded-lg overflow-hidden cursor-pointer transition-all group font-pixel"
      onClick={() => onSelect(cube.id)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      whileHover={{
        scale: 1.03,
        borderColor: cube.accentColor,
      }}
      whileTap={{ scale: 0.97 }}
      style={{
        boxShadow: isHovered ? `0 0 20px ${cube.accentColor}40` : "none",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40 pointer-events-none"></div>
      
      <div className="aspect-square w-full relative p-6 flex items-center justify-center">
        <div className="cube-scene perspective-1000" style={{ width: 110, height: 110 }}>
          <motion.div
            className="cube"
            style={{
              width: 110,
              height: 110,
              transformStyle: "preserve-3d",
              transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`,
              transition: "transform 0.1s ease-out",
            }}
            initial={{ 
              "--cube-size": "110px" 
            } as any}
          >
            {/* Front face */}
            <div
              className="cube-face cube-face-front"
              style={{
                backgroundColor: cube.colors[0],
                borderWidth: 1,
                borderColor: cube.borderColor,
                boxShadow: isHovered ? cube.glow : "none",
                position: "absolute",
                width: "100%",
                height: "100%",
                backfaceVisibility: "hidden",
                transform: "translateZ(55px)",
              }}
            />

            {/* Back face */}
            <div
              className="cube-face cube-face-back"
              style={{
                backgroundColor: cube.colors[1],
                borderWidth: 1,
                borderColor: cube.borderColor,
                position: "absolute",
                width: "100%",
                height: "100%",
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg) translateZ(55px)",
              }}
            />

            {/* Right face */}
            <div
              className="cube-face cube-face-right"
              style={{
                backgroundColor: cube.colors[2],
                borderWidth: 1,
                borderColor: cube.borderColor,
                position: "absolute",
                width: "100%",
                height: "100%",
                backfaceVisibility: "hidden",
                transform: "rotateY(90deg) translateZ(55px)",
              }}
            />

            {/* Left face */}
            <div
              className="cube-face cube-face-left"
              style={{
                backgroundColor: cube.colors[3],
                borderWidth: 1,
                borderColor: cube.borderColor,
                position: "absolute",
                width: "100%",
                height: "100%",
                backfaceVisibility: "hidden",
                transform: "rotateY(-90deg) translateZ(55px)",
              }}
            />

            {/* Top face */}
            <div
              className="cube-face cube-face-top"
              style={{
                backgroundColor: cube.colors[4],
                borderWidth: 1,
                borderColor: cube.borderColor,
                position: "absolute",
                width: "100%",
                height: "100%",
                backfaceVisibility: "hidden",
                transform: "rotateX(90deg) translateZ(55px)",
              }}
            />

            {/* Bottom face */}
            <div
              className="cube-face cube-face-bottom"
              style={{
                backgroundColor: cube.colors[5],
                borderWidth: 1,
                borderColor: cube.borderColor,
                position: "absolute",
                width: "100%",
                height: "100%",
                backfaceVisibility: "hidden",
                transform: "rotateX(-90deg) translateZ(55px)",
              }}
            />
          </motion.div>
        </div>
      </div>
      
      <div className="p-4 flex justify-between items-center border-t border-gray-800 relative z-10 bg-black/50 backdrop-blur-sm font-pixel">
        <h3 className="font-bold text-white">{cube.name}</h3>
        <span
          className="text-xs px-2 py-1 rounded border text-center transition-colors"
          style={{
            color: rarity.color,
            borderColor: rarity.color,
            background: `${rarity.color}10`,
          }}
        >
          {rarity.label}
        </span>
      </div>
      
      {isSelected && (
        <motion.div
          className="absolute top-3 right-3 bg-green-500 rounded-full p-1.5 shadow-lg"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 20 }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </motion.div>
      )}
      
      {/* Hover effect glow */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, ${cube.accentColor}20 0%, transparent 70%)`,
          transition: "opacity 0.3s ease",
        }}
      />
    </motion.div>
  )
}

// Updated gallery items array with 14 items (7 for each category)
const galleryItems: GalleryItemProps[] = [
  // Gameplay category (7 items)
  {
    id: 1,
    title: "ECHO REALM",
    category: "gameplay",
    color: "purple",
    type: "grid",
  },
  {
    id: 2,
    title: "NEXUS REALM",
    category: "gameplay",
    color: "blue",
    type: "complex",
  },
  {
    id: 3,
    title: "ABYSS REALM",
    category: "gameplay",
    color: "pink",
    type: "wave",
  },
  {
    id: 4,
    title: "PULSE REALM",
    category: "gameplay",
    color: "purple",
    type: "dots",
  },
  {
    id: 5,
    title: "CIPHER REALM",
    category: "gameplay",
    color: "blue",
    type: "noise",
  },
  {
    id: 6,
    title: "CRYPTIC REALM",
    category: "gameplay",
    color: "pink",
    type: "gamepad",
  },
  {
    id: 7,
    title: "VORTEX REALM",
    category: "gameplay",
    color: "purple",
    type: "complex",
  },

  // Concept category (7 items)
  {
    id: 8,
    title: "ECHO REALM",
    category: "concept",
    color: "blue",
    type: "dots",
  },
  {
    id: 9,
    title: "NEXUS REALM",
    category: "concept",
    color: "pink",
    type: "grid",
  },
  {
    id: 10,
    title: "ABYSS REALM",
    category: "concept",
    color: "purple",
    type: "complex",
  },
  {
    id: 11,
    title: "PULSE REALM",
    category: "concept",
    color: "blue",
    type: "wave",
  },
  {
    id: 12,
    title: "CIPHER REALM",
    category: "concept",
    color: "pink",
    type: "noise",
  },
  {
    id: 13,
    title: "CRYPTIC REALM",
    category: "concept",
    color: "purple",
    type: "triangle",
  },
  {
    id: 14,
    title: "VORTEX REALM",
    category: "concept",
    color: "blue",
    type: "circle",
  },
];

export default function GalleryPage() {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const [cursorHover, setCursorHover] = useState(false)
  const [activeImage, setActiveImage] = useState<number | null>(null)
  const [filterCategory, setFilterCategory] = useState("all")
  const [selectedCube, setSelectedCube] = useState("pink-neon")
  const [activeCube, setActiveCube] = useState<string | null>(null)

  const containerRef = useRef(null)
  const galleryRef = useRef(null)
  const cubeRef = useRef(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  })

  const galleryTitleX = useTransform(scrollYProgress, [0.1, 0.2, 0.3], [-300, 0, 0])
  const showcaseTitleX = useTransform(scrollYProgress, [0.4, 0.5, 0.6], [300, 0, 0])

  // Smoother parallax with spring physics
  const smoothGalleryTitleX = useSpring(galleryTitleX, {
    stiffness: 100,
    damping: 30,
  })
  
  const smoothShowcaseTitleX = useSpring(showcaseTitleX, {
    stiffness: 100,
    damping: 30,
  })
  
  // For background parallax effects
  const bgY1 = useTransform(scrollYProgress, [0, 1], [0, -200])
  const bgY2 = useTransform(scrollYProgress, [0, 1], [0, -100])

  // Handle cursor effects
  useEffect(() => {
    const handleMouseMove = (e: { clientX: any; clientY: any }) => {
      setCursorPosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  // Updated categories array - just 2 categories
  const categories = [
    { id: "all", name: "ALL" },
    { id: "gameplay", name: "GAMEPLAY" },
    { id: "concept", name: "CONCEPT" },
  ];

  const filteredItems =
    filterCategory === "all" ? galleryItems : galleryItems.filter((item) => item.category === filterCategory)

  // Handle cube selection
  const handleCubeSelect = (id: string) => {
    setSelectedCube(id)
    setActiveCube(id)
    
    // Auto-close after a few seconds
    setTimeout(() => {
      setActiveCube(null)
    }, 2000)
  }

  return (
    <div ref={containerRef} className="relative bg-black text-white overflow-hidden font-pixel">
      {/* Background Audio */}
      <BackgroundAudio />
      
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
          <rect 
            x="12" 
            y="12" 
            width="8" 
            height="8" 
            fill={cursorHover ? "#ec4899" : "#a855f7"} 
          />
        </svg>
      </motion.div>

      {/* Side floating cube */}
      <div ref={cubeRef} className="hidden lg:block">
        <RealmCube 
          position="corner" 
          size={80} 
          cubeId={selectedCube}
          onCubeChange={handleCubeSelect}
        />
      </div>

      {/* Navigation */}
      <Navigation />

      {/* Enhanced 3D Banner */}
      <Gallery3DBanner />

      {/* Gallery Section - UPDATED VERSION WITH 2 CATEGORIES */}
      <section ref={galleryRef} className="relative py-32 font-pixel">
        {/* Floating particles background */}
        <FloatingParticles />
        
        {/* Parallax background layers */}
        <motion.div
          className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none"
          style={{ y: bgY1 }}
        >
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-purple-900/30 blur-3xl" />
          <div className="absolute bottom-40 right-10 w-80 h-80 rounded-full bg-pink-900/20 blur-3xl" />
        </motion.div>
        
        <div className="container mx-auto px-4">
          <motion.div style={{ x: smoothGalleryTitleX }} className="mb-20">
            <PixelHeading
              text="EXPLORE THE VOID"
              className="text-6xl md:text-7xl font-black tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600"
            />
            
            {/* Animated separator line */}
            <div className="relative h-1 w-40">
              <div className="w-full h-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
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

          {/* Filter Categories - Just two categories now */}
          <div className="mb-16">
            <div className="flex flex-wrap justify-center gap-4">
              {categories.map((category) => (
                <motion.button
                  key={category.id}
                  onClick={() => setFilterCategory(category.id)}
                  className={cn(
                    "px-6 py-3 border-2 transition-all duration-300 font-pixel relative overflow-hidden",
                    filterCategory === category.id
                      ? "border-purple-500 bg-purple-900/30 text-white"
                      : "border-gray-800 text-gray-400 hover:border-purple-500/50 hover:text-gray-200",
                  )}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onMouseEnter={() => setCursorHover(true)}
                  onMouseLeave={() => setCursorHover(false)}
                >
                  {category.name}
                  
                  {/* Active indicator */}
                  {filterCategory === category.id && (
                    <motion.div
                      className="absolute bottom-0 left-0 h-0.5 bg-purple-500"
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                  
                  {/* Hover glow effect */}
                  <motion.div
                    className="absolute inset-0 opacity-0 hover:opacity-100"
                    transition={{ duration: 0.3 }}
                    style={{
                      background: "radial-gradient(circle at center, rgba(168, 85, 247, 0.2) 0%, transparent 70%)"
                    }}
                  />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {filteredItems.map((item, index) => (
                <GalleryItem 
                  key={item.id}
                  item={item}
                  index={index}
                  setCursorHover={setCursorHover}
                  activeImage={activeImage}
                  setActiveImage={setActiveImage}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Interactive Realm Cube Showcase */}
      <section className="relative py-32 overflow-hidden font-pixel">
        {/* Parallax grid background */}
        <motion.div
          className="absolute inset-0 grid grid-cols-12 grid-rows-12 gap-px opacity-10 pointer-events-none"
          style={{ y: bgY2 }}
        >
          {Array.from({ length: 144 }).map((_, i) => (
            <motion.div
              key={`grid-${i}`}
              className={`bg-gray-700`}
              initial={{ opacity: 0.05 }}
              animate={{
                opacity: [0.05, i % 5 === 0 ? 0.2 : 0.05, 0.05],
                backgroundColor:
                  i % 3 === 0
                    ? "#a855f7"
                    : i % 3 === 1
                    ? "#ec4899"
                    : "#3b82f6",
              }}
              transition={{
                duration: 4 + Math.random() * 6,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
          ))}
        </motion.div>
        
        <div className="container mx-auto px-4">
          <motion.div 
            style={{ x: smoothShowcaseTitleX }} 
            className="mb-20 text-center"
          >
            <PixelHeading
              text="REALITY CUBES"
              className="text-6xl md:text-7xl font-black tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-blue-600"
            />
            <div className="w-40 h-1 bg-gradient-to-r from-pink-500 to-blue-500 mx-auto relative overflow-hidden">
              <motion.div
                className="absolute top-0 right-0 h-full w-1/2 bg-white/50"
                animate={{
                  x: [0, -80, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-xl text-gray-300 mt-8 max-w-2xl mx-auto font-pixel"
            >
              Discover our collection of dimensional cubes, each representing a unique realm within the void. Click on any cube to add it to your collection.
            </motion.p>
          </motion.div>

          {/* Realm Cubes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {cubeCollection.map((cube, index) => (
              <RealmCubeCard
                key={cube.id}
                cube={cube}
                index={index}
                setCursorHover={setCursorHover}
                onSelect={handleCubeSelect}
                isSelected={selectedCube === cube.id}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 font-pixel">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-t from-purple-950/30 via-black to-black"></div>
        </div>
        
        {/* Animated circular elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute w-96 h-96 rounded-full border border-purple-500/20"
            style={{
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
            animate={{ 
              scale: [1, 1.2, 1], 
              opacity: [0.1, 0.2, 0.1],
              rotate: [0, 360]
            }}
            transition={{ 
              duration: 20, 
              repeat: Infinity,
              rotate: { ease: "linear" },
              scale: { repeatType: "reverse" }
            }}
          />

          <motion.div
            className="absolute w-64 h-64 rounded-full border border-pink-500/20"
            style={{
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
            animate={{ 
              scale: [1.2, 1, 1.2], 
              opacity: [0.1, 0.3, 0.1],
              rotate: [360, 0]
            }}
            transition={{ 
              duration: 15, 
              repeat: Infinity, 
              delay: 0.5,
              rotate: { ease: "linear" },
              scale: { repeatType: "reverse" }
            }}
          />

          {/* Particle system */}
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={`cta-particle-${i}`}
              className="absolute w-2 h-2"
              style={{
                top: "50%",
                left: "50%",
                background: i % 2 === 0 ? "#a855f7" : "#ec4899",
                boxShadow: `0 0 10px ${i % 2 === 0 ? "#a855f7" : "#ec4899"}`,
                borderRadius: "50%",
              }}
              initial={{
                x: 0,
                y: 0,
              }}
              animate={{
                x: [0, (Math.random() - 0.5) * 500],
                y: [0, (Math.random() - 0.5) * 500],
                opacity: [1, 0],
                scale: [1, Math.random() * 0.5 + 0.5],
              }}
              transition={{
                duration: Math.random() * 5 + 5,
                repeat: Infinity,
                repeatType: "loop",
                ease: "easeOut",
                delay: Math.random() * 5,
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <PixelHeading
                text="EXPERIENCE IT YOURSELF"
                className="text-3xl md:text-4xl font-black tracking-tighter mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500"
              />
              <p className="text-xl md:text-2xl text-gray-300 mb-10 font-pixel">BEYOND IMAGES LIES THE TRUE VOID</p>

              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                onMouseEnter={() => setCursorHover(true)}
                onMouseLeave={() => setCursorHover(false)}
                className="relative inline-block"
              >
                <Button
                  asChild
                  size="lg"
                  className="bg-transparent border-2 border-purple-500 hover:bg-purple-950/30 text-white rounded-none px-12 py-8 text-2xl font-pixel tracking-wide transition-all duration-300 relative overflow-hidden"
                >
                  <Link href="/game">
                    <span className="relative z-10">ENTER THE VOID</span>

                    {/* Button glow effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-purple-600/40 to-pink-600/40"
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  </Link>
                </Button>

                {/* Button corner decorations */}
                <motion.div
                  className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-purple-500"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.div
                  className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-purple-500"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                />
                <motion.div
                  className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-purple-500"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                />
                <motion.div
                  className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-purple-500"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
                />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
      
      {/* Global styles for animations */}
      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        
        .cube-face {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          border-style: solid;
        }
        
        /* Essential 3D cube styles */
        .cube-scene {
          perspective: 800px;
          perspective-origin: center center;
        }
        
        .cube {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
        }
      `}</style>
    </div>
  )
}