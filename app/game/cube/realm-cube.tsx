import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";

// Enhanced cube collection with 3D properties
export const cubeCollection = [
  {
    id: "pink-neon",
    name: "Pink Neon",
    colors: ["#ff00ff", "#ec4899", "#f472b6", "#e879f9", "#d946ef", "#c026d3"],
    accentColor: "#ff00ff",
    borderColor: "rgba(255, 255, 255, 0.3)",
    glow: "0 0 20px rgba(236, 72, 153, 0.6)",
    rarity: "common"
  },
  {
    id: "cosmic-void",
    name: "Cosmic Void",
    colors: ["#8b5cf6", "#7c3aed", "#6d28d9", "#5b21b6", "#4c1d95", "#3a1078"],
    accentColor: "#8b5cf6",
    borderColor: "rgba(139, 92, 246, 0.5)",
    glow: "0 0 25px rgba(139, 92, 246, 0.7)",
    rarity: "rare"
  },
  {
    id: "crystal-blue",
    name: "Crystal Blue",
    colors: ["#0ea5e9", "#0284c7", "#0369a1", "#075985", "#0c4a6e", "#082f49"],
    accentColor: "#0ea5e9",
    borderColor: "rgba(14, 165, 233, 0.5)",
    glow: "0 0 25px rgba(14, 165, 233, 0.7)",
    rarity: "rare"
  },
  {
    id: "golden-relic",
    name: "Golden Relic",
    colors: ["#fbbf24", "#f59e0b", "#d97706", "#b45309", "#92400e", "#78350f"],
    accentColor: "#fbbf24", 
    borderColor: "rgba(251, 191, 36, 0.5)",
    glow: "0 0 25px rgba(251, 191, 36, 0.7)",
    rarity: "epic"
  },
  {
    id: "emerald-matrix",
    name: "Emerald Matrix",
    colors: ["#22c55e", "#16a34a", "#15803d", "#166534", "#14532d", "#052e16"],
    accentColor: "#22c55e",
    borderColor: "rgba(34, 197, 94, 0.5)",
    glow: "0 0 25px rgba(34, 197, 94, 0.7)",
    rarity: "epic"
  },
  {
    id: "obsidian-void",
    name: "Obsidian Void",
    colors: ["#18181b", "#27272a", "#3f3f46", "#52525b", "#71717a", "#a1a1aa"],
    accentColor: "#a1a1aa",
    borderColor: "rgba(255, 255, 255, 0.2)",
    glow: "0 0 15px rgba(161, 161, 170, 0.5)",
    rarity: "legendary"
  },
  {
    id: "holographic",
    name: "Holographic",
    colors: ["#f0abfc", "#e879f9", "#d946ef", "#c026d3", "#a21caf", "#86198f"],
    accentColor: "#c026d3",
    borderColor: "rgba(240, 171, 252, 0.6)",
    glow: "0 0 30px rgba(192, 38, 211, 0.8)",
    rarity: "legendary"
  }
];

// Custom styles for cube rendering and scrollbar
const cubeStyles = `
  .cube-collection-container::-webkit-scrollbar {
    width: 4px;
    background: transparent;
  }
  
  .cube-collection-container::-webkit-scrollbar-thumb {
    background-color: rgba(139, 92, 246, 0.5);
    border-radius: 20px;
  }
  
  .cube-collection-container::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .cube-collection-container {
    scrollbar-width: thin;
    scrollbar-color: rgba(139, 92, 246, 0.5) transparent;
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
  
  .cube-face {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    border-style: solid;
  }
  
  /* Face transforms - properly positioned in 3D space */
  .cube-face-front {
    transform: translateZ(calc(var(--cube-size) / 2));
  }
  
  .cube-face-back {
    transform: rotateY(180deg) translateZ(calc(var(--cube-size) / 2));
  }
  
  .cube-face-right {
    transform: rotateY(90deg) translateZ(calc(var(--cube-size) / 2));
  }
  
  .cube-face-left {
    transform: rotateY(-90deg) translateZ(calc(var(--cube-size) / 2));
  }
  
  .cube-face-top {
    transform: rotateX(90deg) translateZ(calc(var(--cube-size) / 2));
  }
  
  .cube-face-bottom {
    transform: rotateX(-90deg) translateZ(calc(var(--cube-size) / 2));
  }
`;

// Get rarity styles (color and label)
const getRarityStyles = (rarity: string) => {
  switch (rarity) {
    case "common":
      return { color: "#a1a1aa", label: "COMMON" };
    case "rare":
      return { color: "#3b82f6", label: "RARE" };
    case "epic":
      return { color: "#8b5cf6", label: "EPIC" };
    case "legendary":
      return { color: "#f59e0b", label: "LEGENDARY" };
    default:
      return { color: "#a1a1aa", label: "COMMON" };
  }
};

// Cube component for rendering a single 3D cube
const Cube: React.FC<{
  colors: string[];
  size?: number;
  borderWidth?: number;
  borderColor?: string;
  glow?: string;
  isHovered?: boolean;
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
}> = ({ 
  colors, 
  size = 64,
  borderWidth = 1,
  borderColor = "rgba(255, 255, 255, 0.3)",
  glow = "",
  isHovered = false,
  rotateX = 15,
  rotateY = 15,
  rotateZ = 0
}) => {
  // Calculate half of the size for translateZ values
  const halfSize = size / 2;
  
  return (
    <div className="cube-scene" style={{ width: size, height: size }}>
      <div 
        className="cube"
        style={{ 
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`,
          width: size,
          height: size,
          ["--cube-size" as string]: `${size}px`,
        }}
      >
        {/* Front face */}
        <div 
          className="cube-face cube-face-front" 
          style={{ 
            backgroundColor: colors[0],
            borderWidth,
            borderColor,
            boxShadow: isHovered ? glow : 'none'
          }}
        />
        
        {/* Back face */}
        <div 
          className="cube-face cube-face-back" 
          style={{ 
            backgroundColor: colors[1],
            borderWidth,
            borderColor,
          }}
        />
        
        {/* Right face */}
        <div 
          className="cube-face cube-face-right" 
          style={{ 
            backgroundColor: colors[2],
            borderWidth,
            borderColor,
          }}
        />
        
        {/* Left face */}
        <div 
          className="cube-face cube-face-left" 
          style={{ 
            backgroundColor: colors[3],
            borderWidth,
            borderColor,
          }}
        />
        
        {/* Top face */}
        <div 
          className="cube-face cube-face-top" 
          style={{ 
            backgroundColor: colors[4],
            borderWidth,
            borderColor,
          }}
        />
        
        {/* Bottom face */}
        <div 
          className="cube-face cube-face-bottom" 
          style={{ 
            backgroundColor: colors[5],
            borderWidth,
            borderColor,
          }}
        />
      </div>
    </div>
  );
};

// Animated Cube component using Framer Motion
const AnimatedCube: React.FC<{
  colors: string[];
  size?: number;
  borderWidth?: number;
  borderColor?: string;
  glow?: string;
  isHovered?: boolean;
  animate?: boolean;
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
}> = ({ 
  colors, 
  size = 64, 
  borderWidth = 1,
  borderColor = "rgba(255, 255, 255, 0.3)",
  glow = "",
  isHovered = false,
  animate = false,
  rotateX = 15,
  rotateY = 15,
  rotateZ = 0,
}) => {
  return (
    <motion.div 
      className="cube-scene" 
      style={{ width: size, height: size }}
    >
      <motion.div 
        className="cube"
        style={{ 
          width: size, 
          height: size,
          // Set CSS variable using correct TypeScript syntax for custom properties
          ["--cube-size" as string]: `${size}px`,
        }}
        animate={animate ? {
          rotateX: rotateX,
          rotateY: isHovered ? [0, 360] : rotateY,
          rotateZ: rotateZ,
        } : {
          rotateX,
          rotateY,
          rotateZ,
        }}
        transition={isHovered ? {
          rotateY: { 
            duration: 5,
            repeat: Infinity,
            ease: "linear"
          }
        } : {
          duration: 0.5,
        }}
      >
        {/* Front face */}
        <div 
          className="cube-face cube-face-front" 
          style={{ 
            backgroundColor: colors[0],
            borderWidth,
            borderColor,
            boxShadow: isHovered ? glow : 'none'
          }}
        />
        
        {/* Back face */}
        <div 
          className="cube-face cube-face-back" 
          style={{ 
            backgroundColor: colors[1],
            borderWidth,
            borderColor,
          }}
        />
        
        {/* Right face */}
        <div 
          className="cube-face cube-face-right" 
          style={{ 
            backgroundColor: colors[2],
            borderWidth,
            borderColor,
          }}
        />
        
        {/* Left face */}
        <div 
          className="cube-face cube-face-left" 
          style={{ 
            backgroundColor: colors[3],
            borderWidth,
            borderColor,
          }}
        />
        
        {/* Top face */}
        <div 
          className="cube-face cube-face-top" 
          style={{ 
            backgroundColor: colors[4],
            borderWidth,
            borderColor,
          }}
        />
        
        {/* Bottom face */}
        <div 
          className="cube-face cube-face-bottom" 
          style={{ 
            backgroundColor: colors[5],
            borderWidth,
            borderColor,
          }}
        />
      </motion.div>
    </motion.div>
  );
};

interface RealmCubeProps {
  position?: "corner" | "center"; // Position on screen
  size?: number; // Size in pixels
  primaryColor?: string; // Primary color override
  cubeId?: string; // Selected cube
  isAnimated?: boolean;
  onCubeChange?: (cubeId: string) => void; // Cube change handler
  onCubeClick?: () => void; // Alternative click handler
  interactable?: boolean;
  onCubeInteractionStart?: () => void;
  onCubeInteractionEnd?: () => void;
  colors?: string[];
}

const RealmCube: React.FC<RealmCubeProps> = ({
  position = "corner",
  size = 64,
  primaryColor,
  cubeId = "pink-neon",
  onCubeChange,
  onCubeClick
}) => {
  // States
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [selectedCubeId, setSelectedCubeId] = useState(cubeId);
  const [hoveredCubeId, setHoveredCubeId] = useState<string | null>(null);
  
  // Get the selected cube
  const selectedCube = cubeCollection.find(cube => cube.id === selectedCubeId) || cubeCollection[0];
  
  // Apply primary color override if provided
  const colors = [...selectedCube.colors];
  if (primaryColor) {
    colors[0] = primaryColor;
  }
  
  // Refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // Motion values for smooth animation
  const cubeRotateX = useMotionValue(15);
  const cubeRotateY = useMotionValue(15);
  const cubeRotateZ = useMotionValue(0);
  
  // Spring animations for smoother motion
  const springRotateX = useSpring(cubeRotateX, { stiffness: 200, damping: 20 });
  const springRotateY = useSpring(cubeRotateY, { stiffness: 200, damping: 20 });
  const springRotateZ = useSpring(cubeRotateZ, { stiffness: 200, damping: 20 });
  
  // Auto-rotation animation
  useEffect(() => {
    let frameId: number;
    let angle = 0;
    
    const autoRotate = () => {
      angle += 0.01;
      cubeRotateY.set(15 + Math.sin(angle) * 25);
      cubeRotateX.set(15 + Math.cos(angle) * 15);
      cubeRotateZ.set(Math.sin(angle * 0.5) * 5);
      
      frameId = requestAnimationFrame(autoRotate);
    };
    
    frameId = requestAnimationFrame(autoRotate);
    
    return () => {
      cancelAnimationFrame(frameId);
    };
  }, []);

  // Update parent component when selected cube changes
  useEffect(() => {
    if (cubeId !== selectedCubeId && cubeId) {
      setSelectedCubeId(cubeId);
    }
  }, [cubeId]);
  
  // Handle cube selection
  const handleCubeSelect = (id: string) => {
    setSelectedCubeId(id);
    if (onCubeChange) {
      onCubeChange(id);
    }
    setIsLibraryOpen(false);
  };
  
  // Handle cube click
  const handleCubeClick = () => {
    if (onCubeClick) {
      onCubeClick();
    } else {
      setIsLibraryOpen(true);
    }
  };
  
  // Position styles
  const positionStyles = position === "corner" 
    ? "fixed bottom-8 right-8"
    : "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";
  
  const zIndexStyle = position === "corner" 
    ? "z-50" 
    : "z-[100]";
  
  // Prevent background from scrolling when library is open
  useEffect(() => {
    if (isLibraryOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isLibraryOpen]);
  
  return (
    <>
      {/* The 3D Cube */}
      <motion.div
        ref={containerRef}
        className={`${positionStyles} ${zIndexStyle} cursor-pointer`}
        animate={{ scale: isLibraryOpen ? 0 : 1 }}
        onClick={handleCubeClick}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Cube 
          colors={colors}
          size={size}
          borderWidth={1}
          borderColor={selectedCube.borderColor}
          glow={selectedCube.glow}
          rotateX={springRotateX.get()}
          rotateY={springRotateY.get()}
          rotateZ={springRotateZ.get()}
        />
      </motion.div>
      
      {/* Cube Library Overlay */}
      <AnimatePresence>
        {isLibraryOpen && (
          <motion.div
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsLibraryOpen(false)}
          >
            <motion.div
              className="bg-black border border-gray-800 rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Cube Collection</h2>
                <button 
                  className="text-gray-400 hover:text-white"
                  onClick={() => setIsLibraryOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              
              <div className="cube-collection-container overflow-y-auto max-h-[calc(80vh-100px)]">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {cubeCollection.map((cube) => {
                    const isSelected = selectedCubeId === cube.id;
                    const isHovered = hoveredCubeId === cube.id;
                    const rarity = getRarityStyles(cube.rarity);
                    
                    return (
                      <motion.div
                        key={cube.id}
                        className="relative bg-black border border-gray-800 rounded-lg overflow-hidden cursor-pointer transition-all"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleCubeSelect(cube.id)}
                        onMouseEnter={() => setHoveredCubeId(cube.id)}
                        onMouseLeave={() => setHoveredCubeId(null)}
                      >
                        <div className="aspect-square w-full relative p-6 flex items-center justify-center">
                          <AnimatedCube
                            colors={cube.colors}
                            size={120}  
                            borderWidth={1}
                            borderColor={cube.borderColor}
                            glow={cube.glow}
                            isHovered={isHovered}
                            animate={true}
                            rotateX={15}
                            rotateY={25}
                            rotateZ={0}
                          />
                        </div>
                        
                        <div className="p-3 flex justify-between items-center border-t border-gray-800">
                          <h3 className="font-bold text-white">{cube.name}</h3>
                          <span 
                            className="text-xs px-2 py-1 rounded border text-center"
                            style={{ 
                              color: rarity.color, 
                              borderColor: rarity.color
                            }}
                          >
                            {rarity.label}
                          </span>
                        </div>
                        
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global styles */}
      <style jsx global>{cubeStyles}</style>
    </>
  );
};

export default RealmCube;