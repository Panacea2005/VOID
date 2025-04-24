import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import AbstractShape from '@/components/abstract-shape';
import { Button } from '@/components/ui/button';

// Define the NFT shape interface
interface NFTCardProps {
  nft: {
    id: string;
    name: string;
    description?: string;
    image?: string;
    collection?: string;
    mintedAt?: string;
    type?: string;
    shapeType?: "complex" | "grid" | "wave" | "dots" | "noise";
    color?: string;
    rarity?: string;
    // 3D model properties
    model3d?: string;
    model3dHash?: string;
    modelViewerUrl?: string;
    fallbackModel3d?: string[];
    // Material properties
    materialParams?: any;
    colors?: string[];
    texture?: string;
    animation?: string;
  };
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onViewModelClick?: (nft: any) => void;
}

const NFTCard: React.FC<NFTCardProps> = ({ 
  nft, 
  onMouseEnter, 
  onMouseLeave, 
  onViewModelClick 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showModelButton, setShowModelButton] = useState(false);
  const cubeRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  
  // Derive colors for the cube
  const baseColor = nft.color || "#8b5cf6";
  const colors = nft.colors || [
    baseColor,
    adjustColorBrightness(baseColor, -0.1),
    adjustColorBrightness(baseColor, -0.2),
    adjustColorBrightness(baseColor, -0.3),
    adjustColorBrightness(baseColor, -0.4),
    adjustColorBrightness(baseColor, -0.5),
  ];
  
  // Check if NFT has 3D model
  const has3DModel = Boolean(nft.model3d || nft.model3dHash || nft.modelViewerUrl);
  
  // Check for 3D model availability
  useEffect(() => {
    // Detect if the NFT has a 3D model
    if (has3DModel) {
      setShowModelButton(true);
    } else {
      setShowModelButton(false);
    }
    
    // Check if the NFT is a cube type
    if (nft.type === "cube") {
      animateCube();
    }
    
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [nft, has3DModel]);
  
  // Function to animate the cube
  const animateCube = () => {
    if (!cubeRef.current) return;
    
    const animate = () => {
      if (!cubeRef.current) return;
      
      // Simple rotation animation
      const time = Date.now() * 0.001;
      
      // Different animation based on the NFT animation type
      if (nft.animation === "rotate") {
        cubeRef.current.style.transform = `rotateX(${Math.sin(time * 0.5) * 15}deg) rotateY(${time * 20}deg)`;
      } else if (nft.animation === "pulse") {
        const scale = 1 + Math.sin(time * 2) * 0.05;
        cubeRef.current.style.transform = `rotateX(${Math.sin(time * 0.5) * 15}deg) rotateY(${time * 10}deg) scale(${scale})`;
      } else if (nft.animation === "flow") {
        cubeRef.current.style.transform = `rotateX(${Math.sin(time * 0.8) * 15}deg) rotateY(${Math.sin(time * 0.5) * 15 + time * 10}deg)`;
      } else {
        // Default animation
        cubeRef.current.style.transform = `rotateX(${Math.sin(time * 0.5) * 15}deg) rotateY(${time * 10}deg)`;
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
  };
  
  // Handle view 3D model click
  const handleViewModelClick = () => {
    if (onViewModelClick) {
      onViewModelClick(nft);
    }
  };
  
  // Handle image load error
  const handleImageError = () => {
    console.error(`Error loading image for NFT: ${nft.name}`);
    setImageError(true);
    
    // Try fallback images if available
    if (nft.image && nft.model3dHash) {
      // Create a backup image URL from the model hash
      const backupImageUrl = `https://ipfs.io/ipfs/${nft.model3dHash}`;
      const img = new Image();
      img.src = backupImageUrl;
      img.onload = () => {
        if (!imageLoaded && !imageError) {
          nft.image = backupImageUrl;
          setImageError(false);
        }
      };
    }
  };
  
  // Determine card glow based on rarity
  const getCardGlow = () => {
    if (!nft.rarity) return "";
    
    switch(nft.rarity.toLowerCase()) {
      case "legendary":
        return "pixelate-legendary";
      case "epic":
        return "pixelate-epic";
      case "rare":
        return "pixelate-rare";
      default:
        return "";
    }
  };
  
  return (
    <motion.div
      className={`bg-black pixelate-border ${getCardGlow()} group hover:pixelate-glow transition-all duration-300 overflow-hidden`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onMouseEnter={() => {
        setIsHovered(true);
        if (onMouseEnter) onMouseEnter();
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        if (onMouseLeave) onMouseLeave();
      }}
    >
      <div className="aspect-square overflow-hidden relative">
        {/* 3D Cube for cube NFTs */}
        {nft.type === "cube" ? (
          <div className="w-full h-full flex items-center justify-center relative">
            {/* 3D Cube */}
            <div className="relative w-48 h-48 perspective-1000">
              <div
                ref={cubeRef}
                className="w-full h-full transform-style-3d group-hover:scale-110 transition-transform duration-500"
                style={{
                  transformStyle: 'preserve-3d',
                  transition: 'transform 0.2s ease-out'
                }}
              >
                {/* Cube Faces */}
                {colors.slice(0, 6).map((color, index) => {
                  // Calculate position for each face
                  let transform = '';
                  
                  switch (index) {
                    case 0: // front
                      transform = 'translateZ(75px)';
                      break;
                    case 1: // back
                      transform = 'rotateY(180deg) translateZ(75px)';
                      break;
                    case 2: // right
                      transform = 'rotateY(90deg) translateZ(75px)';
                      break;
                    case 3: // left
                      transform = 'rotateY(-90deg) translateZ(75px)';
                      break;
                    case 4: // top
                      transform = 'rotateX(90deg) translateZ(75px)';
                      break;
                    case 5: // bottom
                      transform = 'rotateX(-90deg) translateZ(75px)';
                      break;
                  }
                  
                  // Handle textures and effects based on NFT properties
                  let backgroundStyle = color;
                  let opacity = 1;
                  let boxShadow = "none";
                  let className = "w-40 h-40 absolute cube-face";
                  
                  // Texture effects based on NFT properties
                  if (nft.texture === "plasma") {
                    backgroundStyle = `linear-gradient(45deg, ${color}, ${adjustColorBrightness(color, 0.3)})`;
                    boxShadow = `inset 0 0 20px ${adjustColorBrightness(color, 0.3)}`;
                  } else if (nft.texture === "carbon") {
                    className += " carbon-texture";
                    boxShadow = `inset 0 0 10px ${adjustColorBrightness(color, -0.3)}`;
                  } else if (nft.texture === "hologram") {
                    opacity = 0.7;
                    backgroundStyle = `linear-gradient(45deg, transparent, ${color}50, transparent)`;
                    boxShadow = `0 0 15px ${color}`;
                  } else if (nft.texture === "nebula") {
                    backgroundStyle = `radial-gradient(circle, ${color}, ${adjustColorBrightness(color, -0.4)})`;
                    boxShadow = `inset 0 0 30px ${adjustColorBrightness(color, 0.1)}`;
                  }
                  
                  return (
                    <div
                      key={`face-${index}`}
                      className={className}
                      style={{
                        transform,
                        backgroundColor: nft.texture ? undefined : color,
                        background: typeof backgroundStyle === 'string' && backgroundStyle !== color ? backgroundStyle : undefined,
                        opacity,
                        boxShadow,
                        transformStyle: 'preserve-3d',
                        backfaceVisibility: 'hidden',
                      }}
                    ></div>
                  );
                })}
              </div>
            </div>
            
            {/* Info overlay */}
            <div 
              className={`absolute bottom-0 left-0 right-0 p-2 pixelate-bg transform transition-transform duration-300 ${
                isHovered ? 'translate-y-0' : 'translate-y-full'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-white font-pixel">
                    {nft.texture ? nft.texture.charAt(0).toUpperCase() + nft.texture.slice(1) : "Standard"}
                  </p>
                  {nft.animation && (
                    <p className="text-xs text-purple-400 font-pixel">
                      {nft.animation.charAt(0).toUpperCase() + nft.animation.slice(1)} animation
                    </p>
                  )}
                </div>
                {has3DModel && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 py-1 text-xs pixelate-button"
                    onClick={handleViewModelClick}
                  >
                    VIEW
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* For non-cube NFTs, show image or abstract shape */
          <>
            {nft.image && !imageError ? (
              <img
                src={nft.image}
                alt={nft.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                onError={handleImageError}
                onLoad={() => setImageLoaded(true)}
              />
            ) : (
              <AbstractShape
                className={`w-full h-full ${
                  nft.color === "purple"
                    ? "text-purple-500/70"
                    : nft.color === "pink"
                    ? "text-pink-500/70"
                    : "text-blue-500/70"
                }`}
                type={nft.shapeType || "complex"}
                animate
              />
            )}
            {nft.type === "music" && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 pixelate-bg rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-white"
                  >
                    <path
                      d="M8 5.14V19.14L19 12.14L8 5.14Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
              </div>
            )}
          </>
        )}
        
        {/* 3D model badge - show if NFT has a 3D model */}
        {has3DModel && !showModelButton && (
          <div className="absolute top-2 right-2 pixelate-badge">
            3D
          </div>
        )}
        
        {/* Rarity badge */}
        {nft.rarity && (
          <div 
            className={`absolute top-2 left-2 pixelate-badge ${
              nft.rarity === "legendary" 
                ? "pixelate-legendary-badge" 
                : nft.rarity === "epic" 
                ? "pixelate-epic-badge"
                : nft.rarity === "rare"
                ? "pixelate-rare-badge"
                : "pixelate-common-badge"
            }`}
          >
            {nft.rarity}
          </div>
        )}
      </div>
      
      <div className="p-4 pixelate-info">
        <h3 className="text-lg font-bold text-white mb-1 font-pixel truncate">
          {nft.name}
        </h3>
        <p className="text-purple-400 text-sm mb-3 font-pixel truncate">
          {nft.collection || "VOID Collection"}
        </p>
        
        {/* Show 3D model button with pixel styling */}
        {has3DModel && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 pixelate-view-button w-full font-pixel"
            onClick={handleViewModelClick}
          >
            EXPLORE 3D MODEL
          </Button>
        )}
        
        {/* Type badge with pixel styling */}
        <div className="mt-2 w-full pixelate-type-badge">
          {nft.type === "cube" ? "VOID CUBE" : nft.type === "music" ? "VOID MUSIC" : "VOID NFT"}
        </div>
      </div>
    </motion.div>
  );
};

// Helper function to adjust color brightness
function adjustColorBrightness(hexColor: string, factor: number): string {
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
}

export default NFTCard;

// Export CSS for cube rendering and pixel styling
export const cubeCssStyles = `
  .perspective-1000 {
    perspective: 1000px;
  }
  
  .transform-style-3d {
    transform-style: preserve-3d;
  }
  
  .backface-hidden {
    backface-visibility: hidden;
  }
  
  .carbon-texture {
    background-image: 
      repeating-linear-gradient(
        45deg, 
        rgba(0, 0, 0, 0.2), 
        rgba(0, 0, 0, 0.2) 2px, 
        rgba(0, 0, 0, 0) 2px, 
        rgba(0, 0, 0, 0) 8px
      );
  }
  
  /* Pixel art border styling */
  .pixelate-border {
    image-rendering: pixelated;
    border: 4px solid #a855f7;
    box-shadow: 
      0 0 0 2px #000, 
      0 0 0 4px #a855f7,
      inset 0 0 0 2px #000;
  }
  
  /* Glow effects */
  .pixelate-glow {
    box-shadow: 
      0 0 0 2px #000, 
      0 0 0 4px #a855f7,
      0 0 10px 4px #a855f7,
      inset 0 0 0 2px #000;
  }
  
  /* Rarity-based styling */
  .pixelate-legendary {
    border-color: #f59e0b;
  }
  
  .pixelate-epic {
    border-color: #a855f7;
  }
  
  .pixelate-rare {
    border-color: #3b82f6;
  }
  
  .pixelate-bg {
    background-color: rgba(0, 0, 0, 0.8);
    border: 2px solid #a855f7;
    image-rendering: pixelated;
  }
  
  /* Badge styling */
  .pixelate-badge {
    image-rendering: pixelated;
    padding: 4px 8px;
    font-family: 'Press Start 2P', monospace;
    font-size: 10px;
    text-transform: uppercase;
    background-color: rgba(0, 0, 0, 0.8);
    border: 2px solid #a855f7;
    color: white;
  }
  
  .pixelate-legendary-badge {
    border-color: #f59e0b;
    color: #f59e0b;
  }
  
  .pixelate-epic-badge {
    border-color: #a855f7;
    color: #a855f7;
  }
  
  .pixelate-rare-badge {
    border-color: #3b82f6;
    color: #3b82f6;
  }
  
  .pixelate-common-badge {
    border-color: #9ca3af;
    color: #9ca3af;
  }
  
  /* Button styling */
  .pixelate-button {
    background-color: rgba(0, 0, 0, 0.8);
    border: 2px solid #a855f7;
    color: #a855f7;
    font-family: 'Press Start 2P', monospace;
    font-size: 10px;
    text-transform: uppercase;
    image-rendering: pixelated;
    transition: all 0.2s;
  }
  
  .pixelate-button:hover {
    background-color: #a855f7;
    color: black;
  }
  
  /* Info section styling */
  .pixelate-info {
    border-top: 4px solid #a855f7;
    background-color: rgba(0, 0, 0, 0.8);
  }
  
  /* View 3D model button */
  .pixelate-view-button {
    background-color: rgba(0, 0, 0, 0.8);
    border: 2px solid #a855f7;
    color: #a855f7;
    font-family: 'Press Start 2P', monospace;
    font-size: 12px;
    text-transform: uppercase;
    image-rendering: pixelated;
    transition: all 0.2s;
    letter-spacing: -1px;
  }
  
  .pixelate-view-button:hover {
    background-color: #a855f7;
    color: black;
    transform: scale(1.05);
  }
  
  /* Type badge styling */
  .pixelate-type-badge {
    padding: 4px 8px;
    background-color: #000;
    border: 2px solid #4c1d95;
    font-family: 'Press Start 2P', monospace;
    font-size: 10px;
    text-transform: uppercase;
    text-align: center;
    color: #a855f7;
    image-rendering: pixelated;
  }
  
  /* Pixel animation for hover effects */
  @keyframes pixel-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.03); }
  }
  
  .group:hover .pixelate-type-badge {
    animation: pixel-pulse 2s infinite;
  }
`;