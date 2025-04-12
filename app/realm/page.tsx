"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import PixelHeading from "@/components/pixel-heading"
import AbstractShape from "@/components/abstract-shape"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ChevronDown, ExternalLink, Sparkles } from "lucide-react"

// Enhanced realms data with more detailed properties for 3D models
const realms = [
  {
    id: "echo",
    name: "ECHO",
    poem: "Whispers of forgotten code,\nEchoes in digital halls,\nMemories fragmented,\nReality dissolves.",
    theme: "Memory and Reflection",
    description:
      "A realm of reflective surfaces and echoing sounds, where players confront distorted versions of their past choices. The environment shifts and changes based on the player's actions, creating a unique experience with each visit.",
    color: "from-blue-400 to-purple-600",
    brightColor: "from-blue-300 to-purple-400",
    darkColor: "from-blue-900 to-purple-950",
    shapeType: "wave" as "wave",
    particleCount: 150,
    particleType: "mirror",
    ambientSound: "echo-ambient.mp3", // Would be implemented with a sound library
    modelType: "mirror-fragments",
    gameplayElements: ["Memory challenges", "Reflection puzzles", "Temporal distortions"],
    iconType: "ripple",
  },
  {
    id: "nexus",
    name: "NEXUS",
    poem: "Connections intertwined,\nThreads of fate unbound,\nPaths converge and diverge,\nDestiny is found.",
    theme: "Connection and Convergence",
    description:
      "The central hub where all realms connect. A vast network of pathways and nodes, representing the interconnectedness of all experiences within VOID. Players can glimpse other realms and the choices of other players.",
    color: "from-purple-400 to-pink-600",
    brightColor: "from-purple-300 to-pink-400",
    darkColor: "from-purple-900 to-pink-950",
    shapeType: "grid" as "grid",
    particleCount: 200,
    particleType: "node",
    ambientSound: "nexus-ambient.mp3",
    modelType: "nodal-network",
    gameplayElements: ["Connection challenges", "Path finding", "Community insights"],
    iconType: "network",
  },
  {
    id: "abyss",
    name: "ABYSS",
    poem: "Depths unfathomable,\nDarkness that consumes,\nIn absence, truth emerges,\nFrom void, light blooms.",
    theme: "Emptiness and Discovery",
    description:
      "A realm of vast emptiness punctuated by moments of intense beauty. Players must navigate through darkness, discovering hidden meanings and uncovering the secrets of the void itself.",
    color: "from-pink-400 to-blue-600",
    brightColor: "from-pink-300 to-blue-400",
    darkColor: "from-pink-950 to-blue-950",
    shapeType: "dots" as "dots",
    particleCount: 100,
    particleType: "void",
    ambientSound: "abyss-ambient.mp3",
    modelType: "void-sphere",
    gameplayElements: ["Darkness navigation", "Light discovery", "Hidden truths"],
    iconType: "void",
  },
  {
    id: "pulse",
    name: "PULSE",
    poem: "Rhythmic vibrations,\nHeartbeat of the machine,\nSynchronized motion,\nLife in the unseen.",
    theme: "Rhythm and Vitality",
    description:
      "A realm pulsing with energy and life. Players must synchronize with the rhythm of this world to progress, creating harmonies that reveal new paths and possibilities.",
    color: "from-blue-400 to-pink-600",
    brightColor: "from-blue-300 to-pink-400",
    darkColor: "from-blue-950 to-pink-950",
    shapeType: "complex" as "complex",
    particleCount: 180,
    particleType: "pulse",
    ambientSound: "pulse-ambient.mp3",
    modelType: "pulse-orb",
    gameplayElements: ["Rhythm matching", "Harmonic puzzles", "Synchronized movement"],
    iconType: "wave",
  },
  {
    id: "cipher",
    name: "CIPHER",
    poem: "Symbols and patterns,\nLanguage beyond words,\nDecoding existence,\nTruth becomes blurred.",
    theme: "Mystery and Knowledge",
    description:
      "A realm of puzzles and cryptic messages. Players decipher ancient codes to unlock the secrets of VOID's creation and purpose, gaining insights that transcend the digital realm.",
    color: "from-purple-400 to-blue-600",
    brightColor: "from-purple-300 to-blue-400",
    darkColor: "from-purple-950 to-blue-950",
    shapeType: "noise" as "noise",
    particleCount: 120,
    particleType: "symbol",
    ambientSound: "cipher-ambient.mp3",
    modelType: "glyph-cube",
    gameplayElements: ["Code breaking", "Pattern recognition", "Symbol translation"],
    iconType: "glyph",
  },
]

// Custom 3D model components for each realm
interface Realm {
  id: string;
  name: string;
  poem: string;
  theme: string;
  description: string;
  color: string;
  brightColor: string;
  darkColor: string;
  shapeType: "circle" | "square" | "triangle" | "complex" | "wave" | "grid" | "dots" | "noise" | "loading" | "gamepad";
  particleCount: number;
  particleType: string;
  ambientSound: string;
  modelType: string;
  gameplayElements: string[];
  iconType: string;
}

const RealmModel = ({ realm, mouseX, mouseY }: { realm: Realm; mouseX: any; mouseY: any }) => {
  // Set up rotation based on mouse position
  const rotateX = useTransform(mouseY, [0, window.innerHeight], [15, -15])
  const rotateY = useTransform(mouseX, [0, window.innerWidth], [-15, 15])

  // Add spring physics for smoother motion
  const springRotateX = useSpring(rotateX, { stiffness: 100, damping: 30 })
  const springRotateY = useSpring(rotateY, { stiffness: 100, damping: 30 })

  if (realm.modelType === "mirror-fragments") {
    return (
      <motion.div
        className="w-full h-full relative"
        style={{ rotateX: springRotateX, rotateY: springRotateY, perspective: 1000 }}
      >
        <div className="transform-style-preserve-3d relative w-full h-full">
          {/* Echo realm - Fragmented mirrors that reflect and ripple */}
          {Array.from({ length: 9 }).map((_, i) => (
            <motion.div
              key={`echo-fragment-${i}`}
              className={`absolute w-24 h-24 rounded-sm bg-gradient-to-br ${realm.color} backdrop-blur-md`}
              animate={{
                x: Math.sin(i * 0.8) * 100,
                y: Math.cos(i * 0.8) * 100,
                z: Math.sin(i * 1.2) * 50,
                rotateX: Math.sin(i) * 45,
                rotateY: Math.cos(i) * 45,
                scale: [1, 1.05, 0.95, 1],
                opacity: [0.7, 0.8, 0.7]
              }}
              transition={{
                duration: 6 + i * 0.5,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }}
              style={{
                transformOrigin: "center center",
                transformStyle: "preserve-3d",
                boxShadow: "0 0 20px rgba(148, 0, 255, 0.4)",
                border: "1px solid rgba(255, 255, 255, 0.2)"
              }}
            />
          ))}
        </div>
      </motion.div>
    )
  }
  
  if (realm.modelType === "nodal-network") {
    return (
      <motion.div
        className="w-full h-full relative"
        style={{ rotateX: springRotateX, rotateY: springRotateY, perspective: 1200 }}
      >
        <div className="transform-style-preserve-3d relative w-full h-full">
          {/* Nexus realm - Interconnected network of nodes */}
          {Array.from({ length: 12 }).map((_, i) => (
            <React.Fragment key={`nexus-node-${i}`}>
              <motion.div
                className="absolute w-6 h-6 rounded-full bg-gradient-to-r from-purple-400 to-pink-600"
                animate={{
                  x: Math.sin(i * Math.PI / 6) * 150,
                  y: Math.cos(i * Math.PI / 6) * 150,
                  z: Math.sin(i * 1.2) * 60,
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                  delay: i * 0.2
                }}
                style={{
                  boxShadow: "0 0 15px rgba(236, 72, 153, 0.6)"
                }}
              />
              {/* Connection lines between nodes */}
              {Array.from({ length: 3 }).map((_, j) => {
                const connectedNodeIndex = (i + j + 1) % 12
                return (
                  <motion.div
                    key={`nexus-connection-${i}-${j}`}
                    className="absolute h-px bg-gradient-to-r from-purple-500/60 to-pink-500/60 origin-left"
                    animate={{
                      opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "easeInOut"
                    }}
                    style={{
                      width: "150px",
                      transformStyle: "preserve-3d",
                      left: `calc(50% + ${Math.sin(i * Math.PI / 6) * 150}px)`,
                      top: `calc(50% + ${Math.cos(i * Math.PI / 6) * 150}px)`,
                      transform: `rotateZ(${Math.atan2(
                        Math.cos(connectedNodeIndex * Math.PI / 6) - Math.cos(i * Math.PI / 6),
                        Math.sin(connectedNodeIndex * Math.PI / 6) - Math.sin(i * Math.PI / 6)
                      ) * 180 / Math.PI}deg)`,
                      boxShadow: "0 0 10px rgba(236, 72, 153, 0.4)"
                    }}
                  />
                )
              })}
            </React.Fragment>
          ))}
        </div>
      </motion.div>
    )
  }
  
  if (realm.modelType === "void-sphere") {
    return (
      <motion.div
        className="w-full h-full relative"
        style={{ rotateX: springRotateX, rotateY: springRotateY, perspective: 1000 }}
      >
        <div className="transform-style-preserve-3d relative w-full h-full">
          {/* Abyss realm - Deep void sphere with emerging light particles */}
          <motion.div 
            className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-black"
            style={{
              transform: "translate(-50%, -50%)",
              boxShadow: "inset 0 0 50px rgba(219, 39, 119, 0.3), 0 0 100px rgba(37, 99, 235, 0.3)",
              border: "1px solid rgba(219, 39, 119, 0.3)"
            }}
          />
          
          {/* Light particles emerging from the void */}
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={`abyss-particle-${i}`}
              className="absolute w-1 h-1 rounded-full bg-white"
              animate={{
                x: [0, Math.sin(i * Math.PI / 10) * 200],
                y: [0, Math.cos(i * Math.PI / 10) * 200],
                opacity: [0, 0.8, 0],
                scale: [0, 1.5, 0]
              }}
              transition={{
                duration: 6 + Math.random() * 4,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeOut"
              }}
              style={{
                left: "50%",
                top: "50%",
                boxShadow: `0 0 8px ${i % 2 === 0 ? "rgba(219, 39, 119, 0.8)" : "rgba(37, 99, 235, 0.8)"}`,
                zIndex: 10
              }}
            />
          ))}
          
          {/* Deep space stars background */}
          {Array.from({ length: 50 }).map((_, i) => (
            <motion.div
              key={`abyss-star-${i}`}
              className="absolute w-px h-px rounded-full bg-white"
              animate={{
                opacity: [0.3, 0.8, 0.3],
                scale: [1, 1.5, 1]
              }}
              transition={{
                duration: 2 + Math.random() * 3,
                repeat: Infinity,
                delay: i * 0.1,
                ease: "easeInOut"
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                boxShadow: "0 0 3px rgba(255, 255, 255, 0.8)"
              }}
            />
          ))}
        </div>
      </motion.div>
    )
  }
  
  if (realm.modelType === "pulse-orb") {
    return (
      <motion.div
        className="w-full h-full relative"
        style={{ rotateX: springRotateX, rotateY: springRotateY, perspective: 1000 }}
      >
        <div className="transform-style-preserve-3d relative w-full h-full">
          {/* Pulse realm - Pulsating orb with rhythm waves */}
          <motion.div
            className="absolute top-1/2 left-1/2 w-40 h-40 rounded-full bg-gradient-to-r from-blue-400 to-pink-600"
            animate={{
              scale: [1, 1.15, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              transform: "translate(-50%, -50%)",
              boxShadow: "0 0 60px rgba(59, 130, 246, 0.5)",
              zIndex: 10
            }}
          />
          
          {/* Orbital rings */}
          {Array.from({ length: 3 }).map((_, i) => (
            <motion.div
              key={`pulse-ring-${i}`}
              className="absolute top-1/2 left-1/2 rounded-full border"
              style={{
                width: `${180 + i * 60}px`,
                height: `${180 + i * 60}px`,
                borderColor: i % 2 === 0 ? "rgba(59, 130, 246, 0.4)" : "rgba(236, 72, 153, 0.4)",
                borderWidth: "2px",
                transform: "translate(-50%, -50%) rotateX(70deg)",
                boxShadow: i % 2 === 0 ? "0 0 15px rgba(59, 130, 246, 0.3)" : "0 0 15px rgba(236, 72, 153, 0.3)"
              }}
              animate={{
                rotate: [0, 360]
              }}
              transition={{
                duration: 15 + i * 5,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          ))}
          
          {/* Pulse wave particles */}
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={`pulse-particle-${i}`}
              className="absolute w-3 h-3 rounded-full bg-white"
              animate={{
                x: [
                  Math.cos(i * Math.PI / 6) * 100,
                  Math.cos(i * Math.PI / 6) * 130,
                  Math.cos(i * Math.PI / 6) * 100
                ],
                y: [
                  Math.sin(i * Math.PI / 6) * 100,
                  Math.sin(i * Math.PI / 6) * 130,
                  Math.sin(i * Math.PI / 6) * 100
                ],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut"
              }}
              style={{
                left: "50%",
                top: "50%",
                backgroundImage: `linear-gradient(to right, #60a5fa, #db2777)`,
                boxShadow: "0 0 10px rgba(255, 255, 255, 0.8)"
              }}
            />
          ))}
        </div>
      </motion.div>
    )
  }
  
  if (realm.modelType === "glyph-cube") {
    return (
      <motion.div
        className="w-full h-full relative"
        style={{ rotateX: springRotateX, rotateY: springRotateY, perspective: 1200 }}
      >
        <div className="transform-style-preserve-3d relative w-full h-full">
          {/* Cipher realm - Cube with glyphs and symbols */}
          {/* Cube faces */}
          {[0, 1, 2, 3, 4, 5].map((face) => {
            const transforms = [
              "translateZ(80px)",
              "rotateY(180deg) translateZ(80px)",
              "rotateY(90deg) translateZ(80px)",
              "rotateY(-90deg) translateZ(80px)",
              "rotateX(90deg) translateZ(80px)",
              "rotateX(-90deg) translateZ(80px)"
            ]
            
            return (
              <motion.div
                key={`cipher-face-${face}`}
                className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-purple-900/80 to-blue-900/80 border border-purple-500/50"
                animate={{
                  opacity: [0.7, 0.9, 0.7]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: face * 0.5,
                  ease: "easeInOut"
                }}
                style={{
                  transform: `${transforms[face]}`,
                  transformStyle: "preserve-3d",
                  backfaceVisibility: "hidden",
                  boxShadow: "0 0 20px rgba(91, 33, 182, 0.4)"
                }}
              >
                {/* Glyphs/Symbols */}
                {Array.from({ length: 3 }).map((_, i) => (
                  <motion.div
                    key={`glyph-${face}-${i}`}
                    className="absolute"
                    animate={{
                      opacity: [0.5, 1, 0.5],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      delay: i * 0.5,
                      ease: "easeInOut"
                    }}
                    style={{
                      left: `${25 + i * 20}%`,
                      top: `${25 + (i % 3) * 20}%`,
                      width: "20px", 
                      height: "20px",
                      fontFamily: "sans-serif",
                      fontSize: "18px",
                      color: "#a78bfa",
                      textShadow: "0 0 8px rgba(167, 139, 250, 0.8)"
                    }}
                  >
                    {["⌘", "⧗", "⏣", "⏢", "⌬", "⎔", "⍟", "⌖", "⌗"][face + i]}
                  </motion.div>
                ))}
              </motion.div>
            )
          })}
          
          {/* Floating symbols around the cube */}
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={`floating-symbol-${i}`}
              className="absolute text-purple-400 text-2xl font-bold"
              animate={{
                x: Math.sin(i * Math.PI / 4) * 150,
                y: Math.cos(i * Math.PI / 4) * 150,
                z: Math.sin(i * 0.8) * 50,
                opacity: [0.4, 0.8, 0.4],
                scale: [0.8, 1.2, 0.8]
              }}
              transition={{
                duration: 5 + i * 0.3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.2
              }}
              style={{
                left: "50%",
                top: "50%",
                textShadow: "0 0 8px rgba(167, 139, 250, 0.8)"
              }}
            >
              {["¤", "Ω", "Δ", "∑", "∞", "≠", "±", "⊕"][i]}
            </motion.div>
          ))}
        </div>
      </motion.div>
    )
  }
  
  // Default case - should never reach here since all realms have a model type
  return (
    <motion.div 
      className="w-full h-full flex items-center justify-center"
      style={{ rotateX: springRotateX, rotateY: springRotateY }}
    >
      <AbstractShape 
        className={`w-64 h-64 text-transparent bg-clip-text bg-gradient-to-r ${realm.color}`}
        type={realm.shapeType as "circle" | "square" | "triangle" | "complex" | "wave" | "grid" | "dots" | "noise" | "loading" | "gamepad"}
        animate
      />
    </motion.div>
  )
}

// Particle background that changes based on selected realm
const ParticleBackground = ({ realm }: { realm: Realm }) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: realm.particleCount }).map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className={`absolute rounded-full bg-gradient-to-r ${realm.brightColor}`}
          animate={{
            x: [
              Math.random() * window.innerWidth,
              Math.random() * window.innerWidth
            ],
            y: [
              Math.random() * window.innerHeight,
              Math.random() * window.innerHeight
            ],
            scale: [
              Math.random() * 0.5 + 0.5,
              Math.random() * 0.5 + 0.5
            ],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{
            duration: Math.random() * 20 + 10,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{
            width: `${Math.random() * 4 + 1}px`,
            height: `${Math.random() * 4 + 1}px`,
            boxShadow: `0 0 ${Math.random() * 5 + 2}px currentColor`
          }}
        />
      ))}
    </div>
  )
}

// Realm icon component for navigation buttons
const RealmIcon = ({ realm, isSelected }: { realm: Realm; isSelected: boolean }) => {
  if (realm.iconType === "ripple") {
    return (
      <div className="relative w-6 h-6">
        <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${realm.color} opacity-80`}></div>
        {isSelected && (
          <motion.div
            className={`absolute inset-0 rounded-full border border-white/30 opacity-60`}
            animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          ></motion.div>
        )}
      </div>
    )
  }
  
  if (realm.iconType === "network") {
    return (
      <div className="relative w-6 h-6">
        <div className={`absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-gradient-to-r ${realm.color} transform -translate-x-1/2 -translate-y-1/2`}></div>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={`network-ring-${i}`}
            className={`absolute top-1/2 left-1/2 border rounded-full border-current text-white/40 transform -translate-x-1/2 -translate-y-1/2`}
            animate={{ rotate: 360 }}
            transition={{ duration: 10 + i * 2, repeat: Infinity, ease: "linear" }}
            style={{ width: `${(i+1)*4}px`, height: `${(i+1)*4}px` }}
          ></motion.div>
        ))}
      </div>
    )
  }
  
  if (realm.iconType === "void") {
    return (
      <div className="relative w-6 h-6">
        <div className="absolute inset-0 rounded-full bg-black border border-current"></div>
        {isSelected && (
          <>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={`void-particle-${i}`}
                className={`absolute w-px h-px rounded-full bg-gradient-to-r ${realm.color}`}
                animate={{ 
                  x: [0, Math.cos(i * Math.PI / 4) * 10],
                  y: [0, Math.sin(i * Math.PI / 4) * 10],
                  opacity: [0, 0.8, 0],
                  scale: [0, 1.5, 0]
                }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                style={{ left: "50%", top: "50%", boxShadow: "0 0 3px currentColor" }}
              ></motion.div>
            ))}
          </>
        )}
      </div>
    )
  }
  
  if (realm.iconType === "wave") {
    return (
      <div className="relative w-6 h-6 flex items-center justify-center">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={`wave-${i}`}
            className={`absolute h-${i+1} bg-gradient-to-r ${realm.color} rounded-full`}
            style={{ width: `${(i+1) * 2}px` }}
            animate={{ 
              height: [2, 4, 2],
              opacity: [0.5, 1, 0.5] 
            }}
            transition={{ 
              duration: 0.5 + (i * 0.2), 
              repeat: Infinity, 
              repeatType: "reverse", 
              delay: i * 0.2 
            }}
          ></motion.div>
        ))}
      </div>
    )
  }
  
  if (realm.iconType === "glyph") {
    return (
      <div className="relative w-6 h-6 flex items-center justify-center">
        <motion.div 
          className={`text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r ${realm.color}`}
          animate={{ 
            rotate: isSelected ? [0, 180, 360] : 0,
            scale: isSelected ? [1, 1.2, 1] : 1
          }}
          transition={{ 
            duration: 4, 
            repeat: isSelected ? Infinity : 0
          }}
        >
          ⎔
        </motion.div>
      </div>
    )
  }
  
  // Default icon
  return (
    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${realm.color}`}></div>
  )
}

export default function RealmPage() {
  const [selectedRealm, setSelectedRealm] = useState<Realm>(realms[0])
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  
  // Mouse position for 3D effect
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  
  // Handle mouse movement for 3D effect
  useEffect(() => {
    const handleMouseMove = (e: { clientX: number; clientY: number }) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        mouseX.set(e.clientX - centerX)
        mouseY.set(e.clientY - centerY)
      }
    }
    
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [mouseX, mouseY])
  
  // Smooth transition when changing realms
  const changeRealm = (realm: Realm) => {
    setSelectedRealm(realm)
    setIsDetailsOpen(false)
  }

  return (
    <div className="relative min-h-screen bg-black text-white font-pixel overflow-hidden" ref={containerRef}>
      <Navigation />
      
      {/* Animated particle background */}
      <ParticleBackground realm={selectedRealm} />
      
      {/* Gradient background specific to realm */}
      <div className="absolute inset-0 z-0">
        <div className={`absolute inset-0 bg-gradient-to-b ${selectedRealm.darkColor} via-black to-black opacity-70`}></div>
      </div>

      {/* Hero Section with improved layout */}
      <section className="relative pt-32 pb-16 min-h-screen flex flex-col">
        <div className="container mx-auto px-4 relative z-10 flex-grow flex flex-col">
          <div className="max-w-7xl mx-auto w-full flex-grow flex flex-col">
            {/* Page Title */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-8"
            >
              <PixelHeading
                text="REALMS OF VOID"
                className="text-6xl md:text-7xl font-black tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500"
              />
              <motion.p 
                className="text-xl text-gray-300 max-w-3xl mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                Explore the different dimensions that make up the VOID universe. Each realm has its own story, theme,
                and secrets to discover.
              </motion.p>
            </motion.div>

            {/* Realm Navigation - Horizontal Scrolling Menu */}
            <div className="flex justify-center mb-16">
              <motion.div 
                className="flex gap-2 md:gap-4 py-2 px-4 bg-black/40 backdrop-blur-md border border-purple-500/20 rounded-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                {realms.map((realm) => (
                  <motion.button
                    key={realm.id}
                    onClick={() => changeRealm(realm)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "relative flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300",
                      selectedRealm.id === realm.id
                        ? "bg-gradient-to-r from-purple-900/50 to-purple-800/40 text-white shadow-lg shadow-purple-900/20"
                        : "bg-transparent hover:bg-purple-950/30 text-gray-400 hover:text-white"
                    )}
                  >
                    <RealmIcon realm={realm} isSelected={selectedRealm.id === realm.id} />
                    <span className="hidden sm:inline">{realm.name}</span>
                    {selectedRealm.id === realm.id && (
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-purple-500/50"
                        layoutId="selected-realm"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </motion.button>
                ))}
              </motion.div>
            </div>

            {/* Main Content Area */}
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={`realm-content-${selectedRealm.id}`}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ duration: 0.5 }}
                  className="order-2 md:order-1 flex flex-col"
                >
                  {/* Realm Title */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <PixelHeading
                      text={selectedRealm.name}
                      className={`text-6xl md:text-7xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r ${selectedRealm.color}`}
                    />
                    <p className={`text-transparent bg-clip-text bg-gradient-to-r ${selectedRealm.brightColor} text-xl mb-8`}>
                      {selectedRealm.theme}
                    </p>
                  </motion.div>
                  
                  {/* Poem Section */}
                  <motion.div 
                    className="mb-8 p-6 bg-black/50 backdrop-blur-md border border-purple-900/50 relative overflow-hidden group"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                  >
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
                    <h3 className={`text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${selectedRealm.brightColor} mb-4`}>THE POEM</h3>
                    <p className="text-gray-300 whitespace-pre-line font-pixel leading-relaxed">{selectedRealm.poem}</p>
                    <motion.div
                      className={`absolute -bottom-1 -right-1 w-20 h-20 bg-gradient-to-tl ${selectedRealm.color} opacity-20 rounded-tl-full`}
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.2, 1] }}
                      transition={{ delay: 0.5, duration: 1 }}
                    />
                  </motion.div>
                  
                  {/* Collapsible Description Section */}
                  <motion.div 
                    className="relative"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                  >
                    <Button
                      onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                      className={`w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-900/30 to-black border border-purple-500/30 mb-4 group`}
                    >
                      <span className={`text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${selectedRealm.brightColor}`}>
                        REALM DETAILS
                      </span>
                      <motion.div
                        animate={{ rotate: isDetailsOpen ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown className="text-purple-400 group-hover:text-white transition-colors" />
                      </motion.div>
                    </Button>
                    
                    <AnimatePresence>
                      {isDetailsOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="p-6 bg-black/50 backdrop-blur-md border border-purple-900/50 mb-6">
                            <h3 className={`text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${selectedRealm.brightColor} mb-4`}>LORE</h3>
                            <p className="text-gray-300 leading-relaxed mb-6">{selectedRealm.description}</p>
                            
                            <h3 className={`text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${selectedRealm.brightColor} mb-4`}>GAMEPLAY</h3>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {selectedRealm.gameplayElements.map((element, index) => (
                                <li key={index} className="flex items-center gap-2">
                                  <Sparkles size={16} className="text-purple-400" />
                                  <span className="text-gray-300">{element}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div className="p-6 bg-gradient-to-br from-purple-900/20 to-black border border-purple-500/30 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div>
                              <h3 className="text-lg font-bold text-purple-300 mb-2">NFT CONNECTION</h3>
                              <p className="text-gray-400 text-sm">
                                Artifacts discovered in this realm become unique NFTs, carrying a piece of
                                the {selectedRealm.name} essence.
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              className="border-purple-500 bg-purple-950/30 hover:bg-purple-900/50 text-purple-300 group flex items-center gap-2"
                            >
                              <span>EXPLORE NFTs</span>
                              <ExternalLink size={14} className="transition-transform group-hover:translate-x-1" />
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </motion.div>
                
                {/* 3D Model Visualization */}
                <motion.div
                  key={`realm-model-${selectedRealm.id}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5 }}
                  className="order-1 md:order-2 aspect-square relative"
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <RealmModel realm={selectedRealm} mouseX={mouseX} mouseY={mouseY} />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* Global styles for 3D transformations */}
      <style jsx global>{`
        .transform-style-preserve-3d {
          transform-style: preserve-3d;
        }
      `}</style>

      <Footer />
    </div>
  )
}