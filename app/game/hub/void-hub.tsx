import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import PixelHeading from "@/components/pixel-heading";
import AbstractShape from "@/components/abstract-shape";
import { cn } from "@/lib/utils";
import RealmCube, { cubeCollection } from "../cube/realm-cube";
import { useAudioController, AudioController } from "../manager/audio-manager";

// Realm data from the realm page
const realms = [
  {
    id: "echo",
    name: "ECHO",
    theme: "Memory and Reflection",
    description: "A realm of reflective surfaces and echoing sounds, where players confront distorted versions of their past choices.",
    color: "from-blue-400 to-purple-600",
    brightColor: "from-blue-300 to-purple-400",
    darkColor: "from-blue-900 to-purple-950",
    shapeType: "wave" as "wave",
    particleCount: 150,
    particleType: "mirror",
    ambientSound: "echo-ambient.mp3",
    modelType: "mirror-fragments",
    gameplayElements: ["Memory challenges", "Reflection puzzles", "Temporal distortions"],
    iconType: "ripple",
  },
  {
    id: "nexus",
    name: "NEXUS",
    theme: "Connection and Convergence",
    description: "The central hub where all realms connect. A vast network of pathways and nodes, representing the interconnectedness of all experiences.",
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
    theme: "Emptiness and Discovery",
    description: "A realm of vast emptiness punctuated by moments of intense beauty. Players navigate through darkness, discovering hidden meanings.",
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
    theme: "Rhythm and Vitality",
    description: "A realm pulsing with energy and life. Players must synchronize with the rhythm of this world to progress, creating harmonies.",
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
    theme: "Mystery and Knowledge",
    description: "A realm of puzzles and cryptic messages. Players decipher ancient codes to unlock the secrets of VOID's creation and purpose.",
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
  {
    id: "vortex",
    name: "???",
    theme: "Unknown Dimensions",
    description: "A mysterious realm at the edge of perception. Strange geometries and fractal patterns suggest access to dimensions beyond conventional understanding.",
    color: "from-emerald-400 to-cyan-600",
    brightColor: "from-emerald-300 to-cyan-400",
    darkColor: "from-emerald-950 to-cyan-950",
    shapeType: "complex" as "complex",
    particleCount: 160,
    particleType: "fractal",
    ambientSound: "vortex-ambient.mp3",
    modelType: "fractal-vortex",
    gameplayElements: ["Dimensional shifting", "Reality manipulation", "Perception challenges"],
    iconType: "vortex",
  },
];

// Particle background that changes based on selected realm
const ParticleBackground = ({ realm }: { realm: (typeof realms)[0] }) => {
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
  );
};

// Realm icon component for navigation buttons (matching realm page)
const RealmIcon = ({ realm, isSelected }: { realm: (typeof realms)[0]; isSelected: boolean }) => {
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
  
  if (realm.iconType === "vortex") {
    return (
      <div className="relative w-6 h-6 flex items-center justify-center">
        <motion.div 
          className={`absolute inset-0 opacity-80 rounded-full bg-gradient-to-r ${realm.color}`}
          animate={{ 
            rotate: isSelected ? [0, 360] : 0,
          }}
          transition={{ 
            duration: 8, 
            repeat: isSelected ? Infinity : 0,
            ease: "linear"
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-xs text-white font-bold">?</div>
          </div>
        </motion.div>
        
        {isSelected && (
          <motion.div
            className="absolute inset-0 rounded-full border border-white/30"
            animate={{
              scale: [1, 0.6, 1],
              opacity: [0.6, 1, 0.6],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </div>
    )
  }
  
  // Default icon
  return (
    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${realm.color}`}></div>
  )
};

// 3D Model components for each realm type (matching realm page)
const RealmModel = ({ realm, mouseX, mouseY }: { realm: (typeof realms)[0]; mouseX: any; mouseY: any }) => {
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
  
  if (realm.modelType === "fractal-vortex") {
    return (
      <motion.div
        className="w-full h-full relative flex items-center justify-center"
        style={{ rotateX: springRotateX, rotateY: springRotateY, perspective: 1500 }}
      >
        <div className="transform-style-preserve-3d relative w-full h-full flex items-center justify-center">
          {/* Black hole center - Centered in container */}
          <motion.div
            className="absolute w-40 h-40 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(0, 0, 0, 0.8) 30%, rgba(8, 8, 24, 0.9) 70%, rgba(20, 20, 35, 0.7) 85%, transparent 100%)",
              boxShadow: "0 0 60px 10px rgba(56, 189, 248, 0.15)",
              zIndex: 5,
            }}
            animate={{
              scale: [1, 1.03, 0.98, 1.02, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          
          {/* Accretion disk glow effect - Centered */}
          <motion.div
            className="absolute w-64 h-16 rounded-full opacity-60"
            style={{
              background: "linear-gradient(90deg, rgba(14, 165, 233, 0.2), rgba(167, 139, 250, 0.4), rgba(236, 72, 153, 0.3), rgba(14, 165, 233, 0.2))",
              transform: "rotateX(75deg)",
              boxShadow: "0 0 20px rgba(139, 92, 246, 0.4)",
              zIndex: 3,
            }}
            animate={{
              rotateZ: [0, 360],
            }}
            transition={{
              duration: 40,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          
          {/* Mirror fragments orbiting the black hole - Centered */}
          <motion.div
            className="absolute w-full h-full flex items-center justify-center"
            style={{
              transformStyle: "preserve-3d",
            }}
            animate={{
              rotateZ: [0, 360],
            }}
            transition={{
              duration: 80,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            {/* Inner orbit mirror fragments */}
            {Array.from({ length: 8 }).map((_, i) => {
              // Calculate position in circular orbit
              const angle = (i / 8) * Math.PI * 2;
              const radius = 80 + Math.sin(i * 0.5) * 10;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              const zOffset = Math.cos(i * 2.1) * 30;
              
              // Fragment size and rotation
              const width = 15 + Math.random() * 20;
              const height = 15 + Math.random() * 20;
              const rotateX = Math.random() * 360;
              const rotateY = Math.random() * 360;
              const rotateZ = Math.random() * 360;
              
              return (
                <motion.div
                  key={`inner-fragment-${i}`}
                  className="absolute"
                  style={{
                    width: `${width}px`,
                    height: `${height}px`,
                    left: `calc(50% + ${x}px)`,
                    top: `calc(50% + ${y}px)`,
                    transform: `translateZ(${zOffset}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`,
                    transformStyle: "preserve-3d",
                    zIndex: 4,
                  }}
                  animate={{
                    rotateX: [rotateX, rotateX + 180, rotateX + 360],
                    rotateY: [rotateY, rotateY + 180, rotateY + 360],
                  }}
                  transition={{
                    duration: 15 + i,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  {/* Mirror fragment with reflection effect */}
                  <div
                    className="w-full h-full backdrop-blur-sm"
                    style={{
                      background: "linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1))",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      boxShadow: "0 0 10px rgba(139, 92, 246, 0.2)",
                      clipPath: `polygon(
                        ${Math.random() * 20}% ${Math.random() * 20}%, 
                        ${80 + Math.random() * 20}% ${Math.random() * 20}%, 
                        ${80 + Math.random() * 20}% ${80 + Math.random() * 20}%, 
                        ${Math.random() * 20}% ${80 + Math.random() * 20}%
                      )`,
                    }}
                  />
                </motion.div>
              );
            })}
            
            {/* Outer orbit mirror fragments */}
            {Array.from({ length: 12 }).map((_, i) => {
              // Calculate position in circular orbit
              const angle = (i / 12) * Math.PI * 2;
              const radius = 150 + Math.sin(i * 0.8) * 20;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              const zOffset = Math.cos(i * 1.5) * 50;
              
              // Fragment size and rotation
              const width = 20 + Math.random() * 25;
              const height = 20 + Math.random() * 25;
              const rotateX = Math.random() * 360;
              const rotateY = Math.random() * 360;
              const rotateZ = Math.random() * 360;
              
              return (
                <motion.div
                  key={`outer-fragment-${i}`}
                  className="absolute"
                  style={{
                    width: `${width}px`,
                    height: `${height}px`,
                    left: `calc(50% + ${x}px)`,
                    top: `calc(50% + ${y}px)`,
                    transform: `translateZ(${zOffset}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`,
                    transformStyle: "preserve-3d",
                    zIndex: 2,
                  }}
                  animate={{
                    rotateX: [rotateX, rotateX + 180, rotateX + 360],
                    rotateY: [rotateY, rotateY + 180, rotateY + 360],
                  }}
                  transition={{
                    duration: 25 + i,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  {/* Mirror fragment with reflection effect */}
                  <div
                    className="w-full h-full backdrop-blur-sm"
                    style={{
                      background: "linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.05))",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      boxShadow: "0 0 10px rgba(139, 92, 246, 0.15)",
                      clipPath: `polygon(
                        ${Math.random() * 30}% ${Math.random() * 30}%, 
                        ${70 + Math.random() * 30}% ${Math.random() * 30}%, 
                        ${70 + Math.random() * 30}% ${70 + Math.random() * 30}%, 
                        ${Math.random() * 30}% ${70 + Math.random() * 30}%
                      )`,
                    }}
                  />
                </motion.div>
              );
            })}
          </motion.div>
          
          {/* Gravitational lensing light effects - Centered */}
          {Array.from({ length: 15 }).map((_, i) => {
            const size = 1 + Math.random() * 3;
            const angle = Math.random() * Math.PI * 2;
            const distance = 30 + Math.random() * 50;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            
            return (
              <motion.div
                key={`lensing-light-${i}`}
                className="absolute rounded-full bg-white"
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                  boxShadow: `0 0 ${size * 2}px ${size / 2}px rgba(255, 255, 255, 0.8)`,
                  zIndex: 6,
                }}
                animate={{
                  opacity: [0, 0.8, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 2 + Math.random() * 3,
                  repeat: Infinity,
                  delay: Math.random() * 5,
                  ease: "easeInOut",
                }}
              />
            );
          })}
          
          {/* Distant stars in space */}
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={`distant-star-${i}`}
              className="absolute rounded-full bg-white"
              style={{
                width: `${Math.random() + 0.5}px`,
                height: `${Math.random() + 0.5}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                boxShadow: "0 0 2px rgba(255, 255, 255, 0.6)",
                zIndex: 0,
              }}
              animate={{
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: 2 + Math.random() * 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </motion.div>
    );
  }
  
  // Default case - should never reach here since all realms have a model type
  return (
    <motion.div 
      className="w-full h-full flex items-center justify-center"
      style={{ rotateX: springRotateX, rotateY: springRotateY }}
    >
      <AbstractShape 
        className={`w-64 h-64 text-transparent bg-clip-text bg-gradient-to-r ${realm.color}`}
        type={realm.shapeType}
        animate
      />
    </motion.div>
  )
};

interface VoidHubProps {
  onSelectRealm: (realm: string) => void;
  onCubeChange?: (cubeId: string) => void; // New prop to handle cube changes
  selectedCubeId?: string; // New prop to receive selected cube ID
  onExit?: () => void;
}

const VoidHub: React.FC<VoidHubProps> = ({ 
  onSelectRealm, 
  onCubeChange,
  selectedCubeId = "pink-neon", 
  onExit 
}) => {
  const [selectedRealm, setSelectedRealm] = useState<(typeof realms)[0]>(realms[0]);
  const [isEntering, setIsEntering] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // Log the selected cube ID for debugging
  useEffect(() => {
    console.log("VoidHub - selectedCubeId:", selectedCubeId);
  }, [selectedCubeId]);
  
  // Audio management
  const audioController = useAudioController({ 
    enabled: true, 
    initialTrackId: "hub",
    volume: 0.7
  });
  
  // Mouse position for 3D effects
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Handle mouse movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        mouseX.set(e.clientX - centerX);
        mouseY.set(e.clientY - centerY);
      }
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  // Handle realm selection
  const selectRealm = (realm: (typeof realms)[0]) => {
    setSelectedRealm(realm);
    audioController.changeTrack(realm.id);
  };
  
  // Handle cube change
  const handleCubeChange = (cubeId: string) => {
    console.log("Cube changed in VoidHub:", cubeId);
    if (onCubeChange) {
      onCubeChange(cubeId);
    }
  };
  
  // Enter the selected realm with enhanced animation
  const enterRealm = () => {
    setIsEntering(true);
    
    // After animation completes, navigate to the realm
    setTimeout(() => {
      onSelectRealm(selectedRealm.id);
    }, 2000);
  };

  return (
    <div className="relative min-h-screen bg-black text-white font-pixel overflow-hidden" ref={containerRef}>
      
      {/* Animated particle background */}
      <ParticleBackground realm={selectedRealm} />
      
      {/* Gradient background specific to realm */}
      <div className="absolute inset-0 z-0">
        <div className={`absolute inset-0 bg-gradient-to-b ${selectedRealm.darkColor} via-black to-black opacity-70`}></div>
      </div>

      {/* Interactive 3D Cube */}
      <RealmCube 
        position="corner"
        size={80}
        primaryColor={selectedRealm.color.split(' ')[1]} // Use the second part of the color gradient
        cubeId={selectedCubeId} // Use the provided selectedCubeId
        onCubeChange={handleCubeChange} // Pass the change handler
      />

      {/* Audio Controller */}
      <AudioController
        isPlaying={audioController.isPlaying}
        currentTrackId={audioController.currentTrackId}
        volume={audioController.volume}
        progress={audioController.progress}
        onTogglePlayback={audioController.togglePlayback}
        onToggleMute={audioController.toggleMute}
        onTrackChange={audioController.changeTrack}
        onVolumeChange={audioController.setVolume}
        onSeek={audioController.seekTo}
      />
      
      {/* Enhanced Realm Entry Animation */}
      <AnimatePresence>
        {isEntering && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="relative flex items-center justify-center"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              {/* Animated cube that expands */}
              <motion.div
                initial={{ 
                  scale: 0.2, 
                  x: "40vw", 
                  y: "40vh", 
                  rotateX: 15, 
                  rotateY: 15, 
                  rotateZ: 0 
                }}
                animate={{ 
                  scale: 20, 
                  x: 0, 
                  y: 0, 
                  rotateX: 0, 
                  rotateY: 0, 
                  rotateZ: 720,
                  transition: { 
                    duration: 2, 
                    ease: "easeInOut" 
                  }
                }}
                style={{ perspective: 1000 }}
              >
                {/* The main rotating cube */}
                <div
                  className="relative w-40 h-40"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* 6 faces of the cube */}
                  {['front', 'back', 'right', 'left', 'top', 'bottom'].map((side, index) => {
                    const transforms = [
                      `translateZ(20px)`,
                      `rotateY(180deg) translateZ(20px)`,
                      `rotateY(90deg) translateZ(20px)`,
                      `rotateY(-90deg) translateZ(20px)`,
                      `rotateX(90deg) translateZ(20px)`,
                      `rotateX(-90deg) translateZ(20px)`
                    ];
                    
                    // Get the selected cube from collection
                    const cube = cubeCollection.find(c => c.id === selectedCubeId) || cubeCollection[0];
                    
                    return (
                      <div
                        key={side}
                        className="absolute w-full h-full"
                        style={{ 
                          transform: transforms[index],
                          backgroundColor: cube.colors[index],
                          boxShadow: cube.glow,
                          border: `1px solid ${cube.borderColor}`,
                          backfaceVisibility: 'hidden'
                        }}
                      />
                    );
                  })}
                </div>
                
                {/* Light rays emanating from the cube as it expands */}
                <motion.div
                  className="absolute inset-0 origin-center"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: [0, 0.8, 0],
                    scale: [1, 2, 3],
                  }}
                  transition={{
                    duration: 2,
                    times: [0, 0.7, 1],
                    ease: "easeOut"
                  }}
                >
                  {Array.from({ length: 12 }).map((_, i) => {
                    const rotation = i * 30;
                    const cube = cubeCollection.find(c => c.id === selectedCubeId) || cubeCollection[0];
                    
                    return (
                      <div
                        key={`ray-${i}`}
                        className="absolute top-1/2 left-1/2 h-px w-[200px] origin-left"
                        style={{
                          background: `linear-gradient(to right, ${cube.colors[0]}, transparent)`,
                          transform: `translateX(-50%) translateY(-50%) rotate(${rotation}deg)`,
                          boxShadow: `0 0 10px ${cube.colors[0]}`
                        }}
                      />
                    );
                  })}
                </motion.div>
              </motion.div>
              
              {/* Pulse rings that radiate outward */}
              {Array.from({ length: 3 }).map((_, i) => (
                <motion.div
                  key={`pulse-ring-${i}`}
                  className="absolute rounded-full border-2 border-white/30"
                  style={{ width: 300, height: 300 }}
                  initial={{ opacity: 0, scale: 0.3 }}
                  animate={{
                    opacity: [0, 0.5, 0],
                    scale: [0.5, 2.5],
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.3,
                    ease: "easeOut",
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content - Using Realm Page Layout */}
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
                text="VOID RESONANCE"
                className="text-6xl md:text-7xl font-black tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500"
              />
              <motion.p 
                className="text-xl text-gray-300 max-w-3xl mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                Select a realm to begin your journey through the VOID universe
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
                    onClick={() => selectRealm(realm)}
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
                {/* Left Content */}
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
                  
                  {/* Enter Realm Button and Info */}
                  <motion.div 
                    className="p-6 bg-black/50 backdrop-blur-md border border-purple-900/50 relative overflow-hidden group"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                  >
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
                    
                    <p className="text-gray-300 leading-relaxed mb-6">
                      {selectedRealm.description}
                    </p>
                    
                    {/* Enter Button */}
                    <motion.button
                      onClick={enterRealm}
                      disabled={isEntering}
                      className="w-full py-4 px-6 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 font-bold text-white shadow-lg shadow-purple-600/20 disabled:opacity-50 transition-all hover:shadow-xl hover:shadow-purple-600/40"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isEntering ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          ENTERING {selectedRealm.name}...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center">
                          ENTER {selectedRealm.name}
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
                            <path d="m9 18 6-6-6-6"></path>
                          </svg>
                        </span>
                      )}
                    </motion.button>
                    
                    <motion.div
                      className={`absolute -bottom-1 -right-1 w-20 h-20 bg-gradient-to-tl ${selectedRealm.color} opacity-20 rounded-tl-full`}
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.2, 1] }}
                      transition={{ delay: 0.5, duration: 1 }}
                    />
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

      {/* For debugging - show selected cube */}
      <div className="fixed bottom-2 left-2 text-xs text-gray-500 z-50">
        Active Cube: {selectedCubeId}
      </div>

      {/* Global styles for 3D transformations */}
      <style jsx global>{`
        .transform-style-preserve-3d {
          transform-style: preserve-3d;
        }
      `}</style>

    </div>
  );
};

export default VoidHub;