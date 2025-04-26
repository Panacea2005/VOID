"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { cubeCollection } from "../game/cube/realm-cube";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import RealmCube from "../game/cube/realm-cube";
import * as THREE from "three";

/**
 * 3D Banner for Cube Exhibition Page similar to About page
 */
const CubeExhibitionBanner = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cubeColors = useMemo(() => {
    const defaultCube = cubeCollection[0];
    return [...defaultCube.colors];
  }, []);
  
  // For tracking mouse movement
  useEffect(() => {
    const handleMouseMove = (e: { clientX: number; clientY: number; }) => {
      // Calculate mouse position relative to the center of the viewport
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMousePosition({ x, y });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Helper function to convert hex to rgb for rgba strings
  const hexToRgb = (hex: string) => {
    // Remove # if present
    hex = hex.replace(/^#/, "");

    // Parse hex values
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    return `${r}, ${g}, ${b}`;
  };

  return (
    <div className="relative h-screen w-full flex items-center justify-center overflow-hidden">
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
                  `rgba(${hexToRgb(cubeColors[0])}, 0.3)`,
                  `rgba(${hexToRgb(cubeColors[1])}, 0.3)`,
                  `rgba(${hexToRgb(cubeColors[0])}, 0.3)`,
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
            className="absolute border rounded-full"
            style={{
              width: size,
              height: size,
              borderRadius: "50%",
              borderColor: i % 2 === 0 ? cubeColors[0] : cubeColors[1],
              borderWidth: "1px",
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

      {/* Main title with parallax effect */}
      <div className="relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          style={{
            textShadow: `0 0 30px ${cubeColors[0]}80`,
          }}
        >
          <h1 className="text-8xl sm:text-9xl font-black tracking-tighter mb-6 leading-none text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500">
            VOID
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="relative"
        >
          <motion.div
            className="absolute -inset-1 bg-gradient-to-r opacity-75 blur-lg"
            style={{ 
              background: `linear-gradient(to right, ${cubeColors[0]}, ${cubeColors[1]})` 
            }}
            animate={{
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <h2 className="text-3xl sm:text-4xl md:text-5xl mt-2 tracking-wide text-gray-300 relative">
            CUBE EXHIBITION
          </h2>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mt-10 mb-12 font-light"
        >
          Experience the beauty and uniqueness of VOID cubes with interactive controls and visual effects
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
              className="w-3 h-3"
              animate={{
                scale: [1, i % 2 === 0 ? 1.5 : 0.7, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2 + i * 0.5,
                repeat: Infinity,
                repeatType: "reverse",
              }}
              style={{
                backgroundColor: cubeColors[i % cubeColors.length]
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
              <rect x="0" y="0" width="24" height="40" rx="12" stroke={cubeColors[0]} strokeWidth="2" />
              <motion.rect
                animate={{ y: [4, 28, 4] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                x="8"
                width="8"
                height="8"
                rx="4"
                fill={cubeColors[1]}
              />
            </svg>
            
            {/* Glow effect */}
            <motion.div
              className="absolute -inset-4 opacity-20 blur-xl rounded-full"
              style={{ backgroundColor: cubeColors[0] }}
              animate={{ opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

/**
 * Simplified Cube Exhibition Page - Displays a large Rubik's cube with colors based on the selected cube
 */
const CubeExhibition = () => {
  // State for cube rotation
  const [cubeRotation, setCubeRotation] = useState({ x: 20, y: 20 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  
  // State for selected cube
  const [selectedCubeId, setSelectedCubeId] = useState("pink-neon");
  
  // State for all available cubes (default + NFT)
  const [allCubes, setAllCubes] = useState(cubeCollection);
  
  // State for visual effects
  const [lightingMode, setLightingMode] = useState("default");
  const [rotationSpeed, setRotationSpeed] = useState(1);
  const [showParticles, setShowParticles] = useState(true);
  const [ambientLight, setAmbientLight] = useState(0.4);
  const [highlightEdges, setHighlightEdges] = useState(false);
  const [wobbleEffect, setWobbleEffect] = useState(false);
  const [viewMode, setViewMode] = useState("standard");
  
  // Wobble effect variables
  const wobblePhase = useRef(0);
  
  // Refs
  const containerRef = useRef(null);
  const standRef = useRef(null);
  const autoRotateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Get current cube colors
  const defaultCube = cubeCollection[0];
  const currentCube = allCubes.find(cube => cube.id === selectedCubeId) || defaultCube;
  const cubeColors = [...currentCube.colors];
  
  // Ensure we have 6 colors for all faces
  while (cubeColors.length < 6) {
    cubeColors.push(defaultCube.colors[cubeColors.length % defaultCube.colors.length]);
  }

  // Individual face state - each face has 9 cells (3x3) of the same color
  const [faces, setFaces] = useState<string[][]>([]);

  // Update cube collection when new NFT cubes are loaded
  const handleCubeCollectionUpdate = (updatedCollection: string | any[] | ((prevState: { id: string; name: string; colors: string[]; accentColor: string; borderColor: string; glow: string; rarity: string; model3d?: string | null; isNFT?: boolean; }[]) => { id: string; name: string; colors: string[]; accentColor: string; borderColor: string; glow: string; rarity: string; model3d?: string | null; isNFT?: boolean; }[])) => {
    if (updatedCollection.length > allCubes.length) {
      console.log('Updated cube collection with NFTs:', updatedCollection.length);
      if (Array.isArray(updatedCollection)) {
        setAllCubes(updatedCollection);
      } else {
        console.error("Invalid updatedCollection type:", updatedCollection);
      }
    }
  };

  // Initialize cube on mount and when the selected cube changes
  useEffect(() => {
    initializeCube();
  }, [selectedCubeId]);
  
  // Auto-rotate effect with speed control and wobble
  useEffect(() => {
    if (autoRotate && !isDragging) {
      autoRotateIntervalRef.current = setInterval(() => {
        wobblePhase.current += 0.01;
        
        // Apply variable speeds
        const speed = rotationSpeed * 0.2;
        
        // Apply wobble effect if enabled
        let wobbleX = 0;
        let wobbleY = 0;
        
        if (wobbleEffect) {
          wobbleX = Math.sin(wobblePhase.current * 2) * 1.5;
          wobbleY = Math.cos(wobblePhase.current * 3) * 1.5;
        }
        
        setCubeRotation(prev => ({
          x: prev.x + wobbleX,
          y: prev.y + (speed + wobbleY)
        }));
      }, 20);
    } else if (autoRotateIntervalRef.current) {
      clearInterval(autoRotateIntervalRef.current);
      autoRotateIntervalRef.current = null;
    }
    
    return () => {
      if (autoRotateIntervalRef.current) {
        clearInterval(autoRotateIntervalRef.current);
      }
    };
  }, [autoRotate, isDragging, rotationSpeed, wobbleEffect]);

  // Map face indices for convenience
  const FACE = {
    RIGHT: 0,
    LEFT: 1,
    TOP: 2,
    BOTTOM: 3,
    FRONT: 4,
    BACK: 5,
  };

  // Initialize cube with colors from the selected cube
  const initializeCube = () => {
    const newFaces = [];

    // Initialize 6 faces, each with 9 cells of the same color
    for (let i = 0; i < 6; i++) {
      const face = Array(9).fill(cubeColors[i]);
      newFaces.push(face);
    }

    setFaces(newFaces);
  };

  // Mouse event handlers for rotating the cube view
  const handleMouseDown = (e: { clientX: any; clientY: any; preventDefault: () => void; }) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
    });
    setAutoRotate(false);
    e.preventDefault();
  };

  const handleMouseMove = (e: { clientX: number; clientY: number; preventDefault: () => void; }) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    setCubeRotation((prev) => ({
      x: prev.x - deltaY * 0.5,
      y: prev.y + deltaX * 0.5,
    }));

    setDragStart({
      x: e.clientX,
      y: e.clientY,
    });

    e.preventDefault();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // Handle cube selection from realm cube
  const handleCubeChange = (cubeId: React.SetStateAction<string>) => {
    console.log("Selected cube changed to:", cubeId);
    setSelectedCubeId(cubeId);
  };

  // Helper function to convert hex to rgb for rgba strings
  const hexToRgb = (hex: string) => {
    // Remove # if present
    hex = hex.replace(/^#/, "");

    // Parse hex values
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    return `${r}, ${g}, ${b}`;
  };

  // Helper function to adjust color brightness
  const adjustColorBrightness = (hexColor: string, factor: number) => {
    // Remove # if present
    hexColor = hexColor.replace(/^#/, "");

    // Parse hex values
    let r = parseInt(hexColor.substring(0, 2), 16);
    let g = parseInt(hexColor.substring(2, 4), 16);
    let b = parseInt(hexColor.substring(4, 6), 16);

    // Adjust brightness
    r = Math.min(255, Math.max(0, Math.round(r + factor * 255)));
    g = Math.min(255, Math.max(0, Math.round(g + factor * 255)));
    b = Math.min(255, Math.max(0, Math.round(b + factor * 255)));

    // Convert back to hex
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  };

  // Render a single cell of the cube with enhanced lighting
  const renderCell = (faceIndex: any, cellIndex: number, color: string) => {
    // Lighting variations based on cell position and mode
    const row = Math.floor(cellIndex / 3);
    const col = cellIndex % 3;
    
    // Determine variation in lighting based on position
    let lightingFactor = 1;
    
    switch (lightingMode) {
      case "dramatic":
        // Corner cells are darker, center is brighter
        const distanceFromCenter = Math.sqrt(Math.pow((row-1), 2) + Math.pow((col-1), 2));
        lightingFactor = 0.7 + (1 - distanceFromCenter/1.5) * 0.6;
        break;
      case "edge":
        // Only edges are highlighted
        lightingFactor = (row === 0 || row === 2 || col === 0 || col === 2) ? 1.2 : 0.8;
        break;
      case "gradient":
        // Gradient across the face
        lightingFactor = 0.7 + (row + col) / 4;
        break;
      default:
        // Default lighting with slight variation
        lightingFactor = 0.9 + Math.random() * 0.2;
    }
    
    // Apply the lighting factor to the color
    const adjustedColor = adjustColorBrightness(color, lightingFactor - 1);
    
    // Add glow to edges if enabled
    const edgeGlow = (highlightEdges && (row === 0 || row === 2 || col === 0 || col === 2)) 
      ? `0 0 4px ${color}, 0 0 6px ${color}70` 
      : "";
      
    return (
      <div
        key={`face${faceIndex}-${cellIndex}`}
        className={`transition-all duration-300 border ${highlightEdges ? 'border-white/30' : 'border-black/70'}`}
        style={{
          backgroundColor: adjustedColor,
          boxShadow: `inset 0 0 5px rgba(0,0,0,0.3), ${edgeGlow}`,
        }}
      />
    );
  };

  // Render a single face of the cube with support for exploded view
  const renderFace = (faceIndex: number, baseTransform: string) => {
    if (!faces[faceIndex]) return null;
    
    // Calculate exploded view offset if enabled
    const explodeOffset = viewMode === "exploded" ? 30 : 0;
    
    // Determine direction vector for each face
    let explodeDirection = "";
    switch (faceIndex) {
      case FACE.RIGHT: explodeDirection = "translateX(VALUEpx)"; break;
      case FACE.LEFT: explodeDirection = "translateX(-VALUEpx)"; break;
      case FACE.TOP: explodeDirection = "translateY(-VALUEpx)"; break;
      case FACE.BOTTOM: explodeDirection = "translateY(VALUEpx)"; break;
      case FACE.FRONT: explodeDirection = "translateZ(VALUEpx)"; break;
      case FACE.BACK: explodeDirection = "translateZ(-VALUEpx)"; break;
    }
    
    // Apply explosion transform
    const explodeTransform = explodeOffset > 0 
      ? explodeDirection.replace("VALUE", explodeOffset.toString()) 
      : "";
    
    // Add ambient light effect
    const ambientFilter = `brightness(${0.6 + ambientLight * 0.7})`;

    return (
      <div
        className="cube-face transition-all duration-500"
        style={{
          position: "absolute",
          width: "200px",
          height: "200px",
          left: "50px",
          top: "50px",
          transformStyle: "preserve-3d",
          transform: `${baseTransform} ${explodeTransform}`,
          backfaceVisibility: "visible",
          filter: ambientFilter,
        }}
      >
        <div className="grid grid-cols-3 grid-rows-3 w-full h-full">
          {faces[faceIndex].map((color, i) => renderCell(faceIndex, i, color))}
        </div>
        
        {/* Edge glow effect */}
        {highlightEdges && (
          <div 
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              boxShadow: `0 0 15px ${cubeColors[faceIndex]}90`,
              opacity: 0.4,
            }}
          />
        )}
      </div>
    );
  };

  // Render the large Rubik's cube
  const renderCube = () => {
    return (
      <div
        className="perspective-container"
        style={{
          perspective: "1200px",
          width: "300px",
          height: "300px",
        }}
      >
        <div
          className="cube-container"
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
            transformStyle: "preserve-3d",
            transform: `rotateX(${cubeRotation.x}deg) rotateY(${cubeRotation.y}deg)`,
            transition: isDragging ? "none" : "transform 0.1s ease-out",
          }}
        >
          {/* Right Face (0) */}
          {renderFace(FACE.RIGHT, "rotateY(90deg) translateZ(100px)")}

          {/* Left Face (1) */}
          {renderFace(FACE.LEFT, "rotateY(-90deg) translateZ(100px)")}

          {/* Top Face (2) */}
          {renderFace(FACE.TOP, "rotateX(90deg) translateZ(100px)")}

          {/* Bottom Face (3) */}
          {renderFace(FACE.BOTTOM, "rotateX(-90deg) translateZ(100px)")}

          {/* Front Face (4) */}
          {renderFace(FACE.FRONT, "translateZ(100px)")}

          {/* Back Face (5) */}
          {renderFace(FACE.BACK, "rotateY(180deg) translateZ(100px)")}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-950 text-white font-pixel">
      <Navigation />

      {/* Enhanced Banner */}
      <CubeExhibitionBanner />

      {/* Main Content Area */}
      <main className="container mx-auto px-4 py-16 mb-20">
        {/* Cube Display Section */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 mb-20 max-w-7xl mx-auto">
          {/* Large Cube Display */}
          <motion.div 
            className="flex-1 relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div 
              className="aspect-square w-full max-w-md mx-auto flex items-center justify-center relative"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              ref={containerRef}
            >
              {/* Floating particles */}
              {showParticles && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <motion.div
                      key={`particle-${i}`}
                      className="absolute rounded-full"
                      animate={{
                        x: [
                          Math.random() * window.innerWidth * 0.5,
                          Math.random() * window.innerWidth * 0.5,
                        ],
                        y: [
                          Math.random() * window.innerHeight * 0.5,
                          Math.random() * window.innerHeight * 0.5,
                        ],
                        opacity: [0.1, 0.4, 0.1],
                        scale: [Math.random() * 0.5 + 0.5, Math.random() * 0.5 + 0.5],
                      }}
                      transition={{
                        duration: Math.random() * 20 + 10,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      style={{
                        width: `${Math.random() * 5 + 1}px`,
                        height: `${Math.random() * 5 + 1}px`,
                        background: i % 2 === 0 
                          ? cubeColors[0] 
                          : cubeColors[Math.floor(Math.random() * cubeColors.length)],
                        boxShadow: `0 0 ${Math.random() * 10 + 4}px ${cubeColors[0]}`,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Dynamic lighting effects */}
              <div
                className="absolute w-full h-full pointer-events-none"
                style={{
                  background: `radial-gradient(circle at center, transparent 20%, rgba(0,0,0,0.7) 100%)`,
                  opacity: 0.6,
                }}
              />

              {/* Glow effect behind cube */}
              <div
                className="absolute w-80 h-80 rounded-full transition-all duration-500"
                style={{
                  background: `radial-gradient(circle, ${cubeColors[0]}90, ${cubeColors[1]}40, transparent 70%)`,
                  filter: `blur(40px)`,
                  opacity: 0.2 + ambientLight * 0.3,
                  transform: 'translateZ(-50px)',
                }}
              />
              
              {/* Extra light source */}
              <div
                className="absolute w-20 h-20 rounded-full transition-all duration-300"
                style={{
                  background: 'white',
                  filter: 'blur(30px)',
                  opacity: ambientLight * 0.3,
                  top: '10%',
                  right: '15%',
                  transform: 'translateZ(-20px)',
                }}
              />
              
              {/* Light beams for dramatic effect */}
              {lightingMode === "dramatic" && (
                <>
                  <div
                    className="absolute w-20 h-80 rounded-full"
                    style={{
                      background: `linear-gradient(to bottom, ${cubeColors[0]}30, transparent)`,
                      filter: 'blur(15px)',
                      top: '-20%',
                      left: '40%',
                      transform: 'rotate(15deg)',
                      opacity: 0.2,
                    }}
                  />
                  <div
                    className="absolute w-20 h-80 rounded-full"
                    style={{
                      background: `linear-gradient(to bottom, ${cubeColors[1]}30, transparent)`,
                      filter: 'blur(15px)',
                      top: '-10%',
                      right: '30%',
                      transform: 'rotate(-15deg)',
                      opacity: 0.2,
                    }}
                  />
                </>
              )}

              {/* The 3D Cube with enhanced effects */}
              <div className="relative scale-125 transform-gpu">
                {/* Spotlight effect */}
                <div 
                  className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${lightingMode === 'dramatic' ? 'opacity-100' : 'opacity-0'}`}
                  style={{
                    background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15), transparent 60%)',
                  }}
                />
                
                {/* Cube with reflective platform beneath it */}
                <div className="relative">
                  {renderCube()}
                  
                  {/* Reflection effect */}
                  <div 
                    className="absolute top-full left-0 w-full opacity-25 overflow-hidden"
                    style={{
                      height: '80px',
                      transform: 'rotateX(180deg) scaleY(0.5) translateY(-40px)',
                      maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1), rgba(0,0,0,0))',
                      WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1), rgba(0,0,0,0))',
                    }}
                  >
                    {renderCube()}
                  </div>
                </div>
                
                {/* Animated ring effect */}
                <div className="absolute -inset-10 pointer-events-none z-10">
                  <motion.div
                    className="w-full h-full rounded-full opacity-20"
                    style={{
                      border: `2px solid ${cubeColors[0]}`,
                      boxShadow: `0 0 20px ${cubeColors[0]}80 inset, 0 0 15px ${cubeColors[0]}60`,
                    }}
                    animate={{
                      rotateZ: [0, 360],
                      scale: [0.8, 0.85, 0.8],
                    }}
                    transition={{
                      rotateZ: { duration: 20, repeat: Infinity, ease: "linear" },
                      scale: { duration: 3, repeat: Infinity, ease: "easeInOut", repeatType: "reverse" }
                    }}
                  />
                </div>
              </div>
            </div>
            
            {/* Interactive controls panel */}
            <div className="mt-32 bg-black/40 backdrop-blur-lg border border-purple-500/20 rounded-xl p-6 max-w-6xl mx-auto">
              <h3 className="text-xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                Control Panel
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {/* Auto-rotate toggle */}
                <div className="bg-black/50 p-4 rounded-lg border border-gray-800 hover:border-purple-500/30 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300">Auto-rotate</span>
                    <button 
                      onClick={() => setAutoRotate(!autoRotate)}
                      className={`w-12 h-6 rounded-full p-0.5 transition-colors ${autoRotate ? 'bg-purple-600' : 'bg-gray-800'}`}
                    >
                      <div 
                        className={`w-5 h-5 rounded-full bg-white transform transition-transform ${autoRotate ? 'translate-x-6' : 'translate-x-0'}`}
                      />
                    </button>
                  </div>
                  
                  {autoRotate && (
                    <div className="mt-2">
                      <label className="text-xs text-gray-400 block mb-1">Rotation Speed</label>
                      <input 
                        type="range" 
                        min="0.5" 
                        max="3" 
                        step="0.1" 
                        value={rotationSpeed} 
                        onChange={(e) => setRotationSpeed(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                    </div>
                  )}
                </div>
                
                {/* Lighting modes */}
                <div className="bg-black/50 p-4 rounded-lg border border-gray-800 hover:border-purple-500/30 transition-colors">
                  <label className="text-sm text-gray-300 block mb-2">Lighting Mode</label>
                  <select 
                    value={lightingMode}
                    onChange={(e) => setLightingMode(e.target.value)}
                    className="w-full bg-gray-900 text-white border border-gray-700 rounded px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                  >
                    <option value="default">Default</option>
                    <option value="dramatic">Dramatic</option>
                    <option value="edge">Edge Highlight</option>
                    <option value="gradient">Gradient</option>
                  </select>
                </div>
                
                {/* Visual effects toggles */}
                <div className="bg-black/50 p-4 rounded-lg border border-gray-800 hover:border-purple-500/30 transition-colors">
                  <span className="text-sm text-gray-300 block mb-2">Visual Effects</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setHighlightEdges(!highlightEdges)}
                      className={`text-xs px-3 py-1.5 rounded ${highlightEdges ? 'bg-purple-600 text-white' : 'bg-gray-900 text-gray-300 hover:bg-gray-800'}`}
                    >
                      Glow Edges
                    </button>
                    <button
                      onClick={() => setWobbleEffect(!wobbleEffect)}
                      className={`text-xs px-3 py-1.5 rounded ${wobbleEffect ? 'bg-purple-600 text-white' : 'bg-gray-900 text-gray-300 hover:bg-gray-800'}`}
                    >
                      Wobble
                    </button>
                    <button
                      onClick={() => setShowParticles(!showParticles)}
                      className={`text-xs px-3 py-1.5 rounded ${showParticles ? 'bg-purple-600 text-white' : 'bg-gray-900 text-gray-300 hover:bg-gray-800'}`}
                    >
                      Particles
                    </button>
                  </div>
                </div>
                
                {/* View mode */}
                <div className="bg-black/50 p-4 rounded-lg border border-gray-800 hover:border-purple-500/30 transition-colors">
                  <label className="text-sm text-gray-300 block mb-2">View Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setViewMode("standard")}
                      className={`text-xs px-3 py-1.5 rounded ${viewMode === "standard" ? 'bg-purple-600 text-white' : 'bg-gray-900 text-gray-300 hover:bg-gray-800'}`}
                    >
                      Standard
                    </button>
                    <button
                      onClick={() => setViewMode("exploded")}
                      className={`text-xs px-3 py-1.5 rounded ${viewMode === "exploded" ? 'bg-purple-600 text-white' : 'bg-gray-900 text-gray-300 hover:bg-gray-800'}`}
                    >
                      Exploded
                    </button>
                  </div>
                </div>
                
                {/* Ambient light */}
                <div className="bg-black/50 p-4 rounded-lg border border-gray-800 hover:border-purple-500/30 transition-colors">
                  <label className="text-sm text-gray-300 block mb-2">Ambient Light</label>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="1" 
                    step="0.1" 
                    value={ambientLight} 
                    onChange={(e) => setAmbientLight(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="mt-2 flex justify-between text-xs text-gray-500">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>
                
                {/* Reset button */}
                <div className="bg-black/50 p-4 rounded-lg border border-gray-800 hover:border-purple-500/30 transition-colors flex items-center justify-center">
                  <button
                    onClick={() => {
                      setCubeRotation({ x: 20, y: 20 });
                      setLightingMode("default");
                      setHighlightEdges(false);
                      setWobbleEffect(false);
                      setViewMode("standard");
                      setAmbientLight(0.4);
                      setRotationSpeed(1);
                    }}
                    className="w-full bg-gradient-to-r from-purple-700 to-pink-700 hover:from-purple-600 hover:to-pink-600 text-white py-2 px-3 rounded text-sm transition-colors"
                  >
                    Reset All Settings
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Cube Info */}
          <motion.div 
            className="flex-1 max-w-xl"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="p-6 bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-lg relative overflow-hidden">
              {/* Cube details */}
              <h2 className="text-2xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                {currentCube.name}
              </h2>
              
              <p className="text-gray-300 mb-6">
                {"A unique cube design from the VOID universe. Each face features a distinct color harmony that reflects the essence of digital reality."}
              </p>
              
              {/* Cube color palette */}
              <div className="mb-6">
                <h3 className="text-sm text-gray-400 mb-2">Color Palette</h3>
                <div className="flex gap-2 flex-wrap">
                  {cubeColors.map((color, i) => (
                    <div 
                      key={`color-${i}`}
                      className="w-8 h-8 rounded-sm border border-white/10"
                      style={{ 
                        backgroundColor: color,
                        boxShadow: `0 0 10px ${color}50`
                      }}
                    />
                  ))}
                </div>
              </div>
              
              {/* Cube attributes */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <h3 className="text-sm text-gray-400 mb-1">Type</h3>
                  <p className="text-white">{currentCube.isNFT ? "NFT Cube" : "Standard Cube"}</p>
                </div>
                <div>
                  <h3 className="text-sm text-gray-400 mb-1">Rarity</h3>
                  <p className="text-white capitalize">{currentCube.rarity || "Common"}</p>
                </div>
                <div>
                  <h3 className="text-sm text-gray-400 mb-1">Collection</h3>
                  <p className="text-white">VOID Cube Collection</p>
                </div>
                <div>
                  <h3 className="text-sm text-gray-400 mb-1">ID</h3>
                  <p className="text-white truncate">{currentCube.id}</p>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div 
                className="absolute bottom-0 right-0 w-48 h-48 opacity-10"
                style={{
                  background: `linear-gradient(135deg, transparent, ${cubeColors[0]})`,
                  borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%",
                }}
              />
            </div>
          </motion.div>
        </div>
      </main>

      {/* Additional Information Section with equal margins */}
      <section className="py-20 bg-black/30">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* About the Cubes */}
              <div className="bg-black/40 backdrop-blur-sm border border-purple-500/20 rounded-lg p-8 relative overflow-hidden">
                <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                  About VOID Cubes
                </h2>
                <p className="text-gray-300 mb-4 relative z-10">
                  VOID Cubes represent the intersection of digital art and blockchain technology. 
                  Each cube contains a unique color palette and properties that define its 
                  rarity and visual characteristics.
                </p>
                <p className="text-gray-300 mb-6 relative z-10">
                  The technology behind these cubes allows for seamless integration between 
                  traditional collection items and NFT-backed digital assets, creating a 
                  unified experience for collectors and enthusiasts.
                </p>
                
                {/* Animated cube preview */}
                <div className="flex items-center gap-3 mt-6 relative z-10">
                  <p className="text-sm text-gray-400">Available colors:</p>
                  <div className="flex gap-2">
                    {cubeColors.slice(0, 5).map((color, i) => (
                      <motion.div 
                        key={`showcase-color-${i}`}
                        className="w-6 h-6 rounded-sm border border-white/10"
                        style={{ 
                          backgroundColor: color,
                          boxShadow: `0 0 10px ${color}50`
                        }}
                        animate={{
                          scale: [1, 1.1, 1],
                          boxShadow: [
                            `0 0 5px ${color}50`,
                            `0 0 15px ${color}80`,
                            `0 0 5px ${color}50`
                          ]
                        }}
                        transition={{
                          duration: 2,
                          delay: i * 0.2,
                          repeat: Infinity,
                          repeatType: "reverse"
                        }}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Background decorative elements */}
                <div className="absolute -bottom-10 -right-10 w-64 h-64 opacity-10 transform rotate-12">
                  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M50 0 L100 50 L50 100 L0 50 Z" fill={cubeColors[0]} />
                    <path d="M25 25 L75 25 L75 75 L25 75 Z" fill={cubeColors[1]} />
                  </svg>
                </div>
              </div>
              
              {/* Technical specifications */}
              <div className="bg-black/40 backdrop-blur-sm border border-purple-500/20 rounded-lg p-8 relative overflow-hidden">
                <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                  Cube Specifications
                </h2>
                <div className="space-y-4 relative z-10">
                  {[
                    { label: "Dimensions", value: "3x3x3" },
                    { label: "Render Engine", value: "CSS 3D Transform" },
                    { label: "Lighting Method", value: "Dynamic Shaders" },
                    { label: "Interaction", value: "Fully Interactive" },
                    { label: "Visual Effects", value: "Multiple Lighting Modes" },
                    { label: "NFT Compatible", value: "Yes" },
                    { label: "Collection", value: "VOID Cubes" },
                    { label: "Current Selection", value: currentCube.name }
                  ].map((spec, index) => (
                    <motion.div 
                      key={`spec-${index}`}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className="flex justify-between pb-3 border-b border-gray-800 hover:border-purple-500/30 transition-colors"
                    >
                      <span className="text-gray-400">{spec.label}</span>
                      <span className="text-white font-medium">{spec.value}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Interactive tip */}
                <motion.div 
                  className="mt-6 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg"
                  animate={{
                    borderColor: [
                      "rgba(168, 85, 247, 0.3)",
                      "rgba(236, 72, 153, 0.3)",
                      "rgba(168, 85, 247, 0.3)"
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <p className="text-sm text-gray-300">
                    <span className="text-purple-400 font-semibold">Tip:</span> Click the cube in the bottom right corner to select a different cube design from your collection.
                  </p>
                </motion.div>
                
                {/* Background decorative element */}
                <div className="absolute -top-10 -left-10 w-64 h-64 opacity-5">
                  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="40" stroke={cubeColors[0]} strokeWidth="2" />
                    <circle cx="50" cy="50" r="30" stroke={cubeColors[1]} strokeWidth="2" />
                    <circle cx="50" cy="50" r="20" stroke={cubeColors[2]} strokeWidth="2" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Showcase Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 text-center">
              Cube Showcase Features
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Feature 1 */}
              <motion.div 
                className="bg-black/40 backdrop-blur-sm border border-gray-800 rounded-lg p-6 transition-all hover:border-purple-500/30 hover:bg-black/50"
                whileHover={{ y: -5, boxShadow: `0 10px 25px -5px ${cubeColors[0]}30` }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true, margin: "-50px" }}
              >
                <div className="w-12 h-12 bg-purple-900/50 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                    <circle cx="12" cy="12" r="10"></circle>
                    <circle cx="12" cy="12" r="4"></circle>
                    <line x1="21.17" y1="8" x2="12" y2="8"></line>
                    <line x1="3.95" y1="6.06" x2="8.54" y2="14"></line>
                    <line x1="10.88" y1="21.94" x2="15.46" y2="14"></line>
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-3 text-white">Interactive Controls</h3>
                <p className="text-gray-400 text-sm">
                  Manipulate the cube with intuitive controls for rotation, lighting, and special effects that enhance your viewing experience.
                </p>
              </motion.div>
              
              {/* Feature 2 */}
              <motion.div 
                className="bg-black/40 backdrop-blur-sm border border-gray-800 rounded-lg p-6 transition-all hover:border-purple-500/30 hover:bg-black/50"
                whileHover={{ y: -5, boxShadow: `0 10px 25px -5px ${cubeColors[1]}30` }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true, margin: "-50px" }}
              >
                <div className="w-12 h-12 bg-purple-900/50 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-3 text-white">Dynamic Lighting</h3>
                <p className="text-gray-400 text-sm">
                  Experience different lighting modes that highlight the unique characteristics of each cube design in your collection.
                </p>
              </motion.div>
              
              {/* Feature 3 */}
              <motion.div 
                className="bg-black/40 backdrop-blur-sm border border-gray-800 rounded-lg p-6 transition-all hover:border-purple-500/30 hover:bg-black/50"
                whileHover={{ y: -5, boxShadow: `0 10px 25px -5px ${cubeColors[2]}30` }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true, margin: "-50px" }}
              >
                <div className="w-12 h-12 bg-purple-900/50 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                    <circle cx="18" cy="18" r="3"></circle>
                    <circle cx="6" cy="6" r="3"></circle>
                    <path d="M13 6h3a2 2 0 0 1 2 2v7"></path>
                    <line x1="6" y1="9" x2="6" y2="21"></line>
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-3 text-white">Visual Effects</h3>
                <p className="text-gray-400 text-sm">
                  Add particles, edge glow, and other visual enhancements to create a unique and captivating viewing experience.
                </p>
              </motion.div>
              
              {/* Feature 4 */}
              <motion.div 
                className="bg-black/40 backdrop-blur-sm border border-gray-800 rounded-lg p-6 transition-all hover:border-purple-500/30 hover:bg-black/50"
                whileHover={{ y: -5, boxShadow: `0 10px 25px -5px ${cubeColors[3]}30` }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: true, margin: "-50px" }}
              >
                <div className="w-12 h-12 bg-purple-900/50 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <circle cx="10" cy="13" r="2"></circle>
                    <path d="M10 13v-4"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-3 text-white">NFT Integration</h3>
                <p className="text-gray-400 text-sm">
                  Explore your personal collection of standard and NFT cubes with seamless switching between different cube designs.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />

      {/* RealmCube in corner with customized styling */}
      <div className="fixed bottom-8 right-8 z-50">
        <div className="relative">
          {/* Animated highlight ring */}
          <motion.div 
            className="absolute -inset-3 rounded-full"
            animate={{
              boxShadow: [
                `0 0 15px ${cubeColors[0]}60, 0 0 30px ${cubeColors[0]}30`,
                `0 0 25px ${cubeColors[0]}90, 0 0 40px ${cubeColors[0]}50`,
                `0 0 15px ${cubeColors[0]}60, 0 0 30px ${cubeColors[0]}30`
              ],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity 
            }}
          />
          
          {/* Caption above the cube */}
          <motion.div
            className="absolute -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            <div className="px-3 py-1.5 bg-black/70 backdrop-blur-sm border border-purple-500/30 rounded-full shadow-xl">
              <p className="text-xs text-gray-300">
                Click to select a cube
              </p>
            </div>
            {/* Connector line */}
            <div className="w-px h-3 bg-purple-500/50 mx-auto" />
          </motion.div>
          
          <RealmCube
            position="corner"
            size={80}
            primaryColor={cubeColors[0]}
            cubeId={selectedCubeId}
            onCubeChange={handleCubeChange}
            onCubeCollectionUpdate={handleCubeCollectionUpdate}
          />
        </div>
      </div>

      {/* Global CSS for animations and 3D effects */}
      <style jsx global>{`
        /* Force preserve-3d on all elements that need it */
        .perspective-container,
        .cube-container,
        .cube-face {
          transform-style: preserve-3d !important;
          -webkit-transform-style: preserve-3d !important;
        }

        /* Fix for some browsers - ensure cube edges are visible */
        .cube-face {
          backface-visibility: visible !important;
          -webkit-backface-visibility: visible !important;
          opacity: 1 !important;
        }
        
        /* Animation for the stand's light */
        @keyframes pulseLight {
          0%, 100% {
            opacity: 0.7;
          }
          50% {
            opacity: 1;
          }
        }
        
        /* Add smooth transitions to elements */
        .transition-all {
          transition: all 0.3s ease-in-out;
        }
        
        /* Enhanced scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.5);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(168, 85, 247, 0.7);
        }
      `}</style>
    </div>
  );
};

export default CubeExhibition;