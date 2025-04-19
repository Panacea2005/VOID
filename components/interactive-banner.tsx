"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from "next/link";
import { motion } from 'framer-motion';
import RealmCube, { cubeCollection } from '../app/game/cube/realm-cube';

export default function InteractiveBanner() {
  const [isHovering, setIsHovering] = useState(false);
  const [selectedCubeId, setSelectedCubeId] = useState("cosmic-void");
  const [isInteracting, setIsInteracting] = useState(false);
  
  const bannerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  
  // Update window size on mount and resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    // Set initial size
    if (typeof window !== 'undefined') {
      handleResize();
      window.addEventListener('resize', handleResize);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);
  
  // Track mouse position for subtle parallax effect
  const handleMouseMove = (e: React.MouseEvent) => {
    if (bannerRef.current) {
      const rect = bannerRef.current.getBoundingClientRect();
      setMousePosition({
        x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
        y: ((e.clientY - rect.top) / rect.height - 0.5) * 2
      });
    }
  };
  
  // Handle cube change
  const handleCubeChange = (cubeId: string) => {
    setSelectedCubeId(cubeId);
  };
  
  const selectedCube = cubeCollection.find(cube => cube.id === selectedCubeId) || cubeCollection[0];
  
  // Create CSS for gradient cube effect
  const cubeGradientStyles = `
    /* Top Purple Cube */
    .purple-cube .cube-face-front { background-color: #a855f7 !important; }
    .purple-cube .cube-face-back { background-color: #9333ea !important; }
    .purple-cube .cube-face-right { background-color: #7e22ce !important; }
    .purple-cube .cube-face-left { background-color: #6b21a8 !important; }
    .purple-cube .cube-face-top { background-color: #581c87 !important; }
    .purple-cube .cube-face-bottom { background-color: #4c1d95 !important; }
    
    /* Middle Purple-Pink Cube */
    .purple-pink-cube .cube-face-front { background-color: #c084fc !important; }
    .purple-pink-cube .cube-face-back { background-color: #a855f7 !important; }
    .purple-pink-cube .cube-face-right { background-color: #d946ef !important; }
    .purple-pink-cube .cube-face-left { background-color: #c026d3 !important; }
    .purple-pink-cube .cube-face-top { background-color: #db2777 !important; }
    .purple-pink-cube .cube-face-bottom { background-color: #e11d48 !important; }
    
    /* Bottom Pink Cube */
    .pink-cube .cube-face-front { background-color: #ec4899 !important; }
    .pink-cube .cube-face-back { background-color: #db2777 !important; }
    .pink-cube .cube-face-right { background-color: #be185d !important; }
    .pink-cube .cube-face-left { background-color: #9d174d !important; }
    .pink-cube .cube-face-top { background-color: #831843 !important; }
    .pink-cube .cube-face-bottom { background-color: #701a75 !important; }
    
    /* Enhanced glow effects */
    .purple-cube .cube-face-front { box-shadow: 0 0 20px rgba(168, 85, 247, 0.6) !important; }
    .purple-pink-cube .cube-face-front { box-shadow: 0 0 20px rgba(192, 132, 252, 0.6) !important; }
    .pink-cube .cube-face-front { box-shadow: 0 0 20px rgba(236, 72, 153, 0.6) !important; }
    
    /* Add Press Start 2P font globally */
    @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
    
    .font-pixel {
      font-family: 'Press Start 2P', monospace !important;
      letter-spacing: 0.05em;
    }
  `;
  
  return (
    <section 
      ref={bannerRef}
      className="relative w-full h-screen flex items-center justify-center overflow-hidden bg-[#07041A] font-pixel"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Enhanced Gradient Background with Parallax */}
      <motion.div 
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at 50% 50%, #a855f7, #f472b6, #ec4899, #07041A)`,
          x: mousePosition.x * -20,
          y: mousePosition.y * -20
        }}
      />
      
      {/* Grid Overlay with increased opacity */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-repeat opacity-10" />
      
      {/* Animated Particles with enhanced colors */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute rounded-full"
          initial={{
            x: Math.random() * windowSize.width,
            y: Math.random() * windowSize.height,
            opacity: Math.random() * 0.5 + 0.2,
            scale: Math.random() * 0.3 + 0.3
          }}
          animate={{
            x: [
              Math.random() * windowSize.width,
              Math.random() * windowSize.width
            ],
            y: [
              Math.random() * windowSize.height,
              Math.random() * windowSize.height
            ],
            opacity: [0.2, 0.5, 0.2]
          }}
          transition={{
            duration: Math.random() * 20 + 10,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{
            width: `${Math.random() * 4 + 1}px`,
            height: `${Math.random() * 4 + 1}px`,
            backgroundColor: i % 3 === 0 ? "#a855f7" : (i % 3 === 1 ? "#ec4899" : "#f472b6"),
            boxShadow: `0 0 ${Math.random() * 8 + 4}px ${i % 3 === 0 ? "#a855f7" : (i % 3 === 1 ? "#ec4899" : "#f472b6")}`
          }}
        />
      ))}
      
      {/* Full-width Content Container */}
      <div className="w-full flex justify-between px-12 lg:px-24 z-10">
        {/* Left text content */}
        <div className="w-1/2 max-w-xl text-white font-pixel">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-sm text-purple-400 font-mono mb-2 font-pixel">001</p>
            
            <h1 className="text-5xl md:text-6xl font-extrabold mb-4 font-pixel">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">VOID</span>
              <br />
              <span className="text-white">BEYOND</span>
              <br />
              <span className="text-white">IMAGINATION</span>
            </h1>
            
            <p className="text-gray-300 text-lg mb-10 font-pixel">
              An immersive experience that takes you on a journey through
              the cosmic void. Explore the unknown and discover the
              mysteries of the universe.
            </p>
            
            {/* Enhanced Buttons with matching colors */}
            <div className="flex flex-wrap gap-4">
              <Link 
                href="/game" 
                className="px-8 py-4 border border-[#a855f7] bg-[#a855f7]/20 hover:bg-gradient-to-r hover:from-[#a855f7]/30 hover:to-[#ec4899]/30 text-white font-medium uppercase tracking-wider transition-all font-pixel"
              >
                Enter the void
              </Link>
              
              <Link 
                href="#about" 
                className="px-8 py-4 border border-white text-white hover:bg-white/20 font-medium uppercase tracking-wider transition-all font-pixel"
              >
                Discover
              </Link>
            </div>
          </motion.div>
        </div>
        
        {/* Right side - 3 Realm Cubes in triangle formation with gradient colors */}
        <div className="w-1/2 flex justify-center items-center">
          <div className="relative" style={{ width: "300px", height: "300px" }}>
            {/* Top cube - Purple */}
            <motion.div
              animate={{
                y: isInteracting ? 0 : [0, 8, 0],
                rotateZ: isHovering && !isInteracting ? [0, 3, 0] : 0
              }}
              transition={{
                y: {
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut"
                },
                rotateZ: {
                  duration: 2,
                  ease: "easeInOut"
                }
              }}
              style={{
                position: "absolute",
                top: "0px",
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 3
              }}
              className="purple-cube"
            >
              <RealmCube 
                position="corner" 
                size={110}
                cubeId="cosmic-void"
                onCubeChange={() => {}}
                interactable={true}
                onCubeInteractionStart={() => setIsInteracting(true)}
                onCubeInteractionEnd={() => setIsInteracting(false)}
                onCubeClick={() => {}}
              />
            </motion.div>

            {/* Bottom Left - Medium Purple-Pink */}
            <motion.div
              animate={{
                y: isInteracting ? 0 : [0, 15, 0],
                rotateZ: isHovering && !isInteracting ? [0, -4, 0] : 0
              }}
              transition={{
                y: {
                  duration: 7,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5
                },
                rotateZ: {
                  duration: 3,
                  ease: "easeInOut"
                }
              }}
              style={{
                position: "absolute",
                bottom: "30px",
                left: "30px",
                zIndex: 2
              }}
              className="purple-pink-cube"
            >
              <RealmCube 
                position="corner" 
                size={100}
                cubeId="cosmic-void"
                onCubeChange={() => {}}
                interactable={false}
                onCubeInteractionStart={() => {}}
                onCubeInteractionEnd={() => {}}
                onCubeClick={() => {}}
              />
            </motion.div>

            {/* Bottom Right - Pink */}
            <motion.div
              animate={{
                y: isInteracting ? 0 : [0, 12, 0],
                rotateZ: isHovering && !isInteracting ? [0, 5, 0] : 0
              }}
              transition={{
                y: {
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                },
                rotateZ: {
                  duration: 2.5,
                  ease: "easeInOut"
                }
              }}
              style={{
                position: "absolute",
                bottom: "30px",
                right: "30px",
                zIndex: 1
              }}
              className="pink-cube"
            >
              <RealmCube 
                position="corner" 
                size={90}
                cubeId="cosmic-void"
                onCubeChange={() => {}}
                interactable={false}
                onCubeInteractionStart={() => {}}
                onCubeInteractionEnd={() => {}}
                onCubeClick={() => {}}
              />
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Technology label on left side with enhanced color */}
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20">
        <div className="text-[#a855f7]/70 transform -rotate-90 whitespace-nowrap text-xs tracking-widest font-mono font-pixel">
          GAMING
        </div>
      </div>
      
      {/* 360° indicator on right side with enhanced color */}
      <div className="absolute right-6 top-1/2 transform -translate-y-1/2 z-20">
        <div className="text-[#a855f7] font-bold font-pixel">360°</div>
      </div>
      
      {/* Fullscreen toggle in corner with enhanced hover effect */}
      <div className="absolute bottom-6 right-6 z-20">
        <button className="text-[#a855f7]/70 hover:text-[#a855f7] transition-colors duration-300">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 21L21 3M21 3H7M21 3V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      
      {/* Add the custom gradient styles */}
      <style jsx global>{cubeGradientStyles}</style>
    </section>
  );
}