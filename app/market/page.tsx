"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import AbstractShape from "@/components/abstract-shape";
import PixelHeading from "@/components/pixel-heading";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useWallet } from "@solana/wallet-adapter-react";
import { cn } from "@/lib/utils";
import BackgroundAudio from "@/components/background-audio";

// NFT Item component with 3D hover effect
interface NFTItemProps {
  nft: {
    id: number;
    name: string;
    creator: string;
    price: number;
    type: string;
    shapeType: string;
    color: "purple" | "pink" | "blue";
  };
  index: number;
  setCursorHover: (hover: boolean) => void;
}

const NFTItem: React.FC<NFTItemProps> = ({ nft, index, setCursorHover }) => {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);
  
  const handleMouseMove = (e: { clientX: number; clientY: number }) => {
    if (!itemRef.current) return;
    
    const card = itemRef.current;
    const rect = card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const posX = e.clientX - centerX;
    const posY = e.clientY - centerY;
    
    // Calculate rotation values (limited to small angles)
    setRotateX(-posY * 0.02);
    setRotateY(posX * 0.02);
  };

  const handleMouseEnter = () => {
    setCursorHover(true);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setCursorHover(false);
    setIsHovered(false);
    // Reset rotation
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <Link href={`/market/nft/${nft.id}`}>
      <motion.div
        ref={itemRef}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        viewport={{ once: true, margin: "-100px" }}
        className="relative group perspective-1000 font-pixel"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transformStyle: "preserve-3d",
          transition: "transform 0.1s ease-out",
        }}
      >
        {/* Background gradient */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-black to-purple-900/30 z-10 opacity-0 group-hover:opacity-70 transition-opacity duration-500"
          animate={{ opacity: isHovered ? 0.7 : 0 }}
        />

        {/* Glow effect on hover */}
        <motion.div
          className={`absolute -inset-1 opacity-0 group-hover:opacity-100 blur-md z-0 bg-gradient-to-r 
            ${nft.color === "purple" ? "from-purple-500/30 to-purple-700/30" : 
              nft.color === "pink" ? "from-pink-500/30 to-pink-700/30" : 
              "from-blue-500/30 to-blue-700/30"}`}
        />

        <div className="bg-black border-2 border-purple-900/50 group-hover:border-purple-500 transition-all duration-300 relative z-[5]">
          <div className="aspect-square overflow-hidden relative">
            <AbstractShape
              className={cn(
                "w-full h-full",
                nft.color === "purple"
                  ? "text-purple-500/70"
                  : nft.color === "pink"
                    ? "text-pink-500/70"
                    : "text-blue-500/70"
              )}
              type={nft.shapeType as any}
              animate
            />
            
            {/* Play button for music NFTs */}
            {nft.type === "music" && (
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div 
                  className="w-16 h-16 bg-black/70 border border-purple-500 rounded-full flex items-center justify-center"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg
                    width="24"
                    height="24"
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
                </motion.div>
              </div>
            )}

            {/* Interactive particles */}
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={`particle-${nft.id}-${i}`}
                className="absolute w-1.5 h-1.5 rounded-full"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  opacity: Math.random() * 0.3 + 0.2,
                  backgroundColor: nft.color === "purple" ? "#a855f7" : 
                                  nft.color === "pink" ? "#ec4899" : "#3b82f6",
                  boxShadow: `0 0 5px ${nft.color === "purple" ? "#a855f7" : 
                                      nft.color === "pink" ? "#ec4899" : "#3b82f6"}`,
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
          
          <div className="p-4 border-t border-purple-900/50 relative z-10 backdrop-blur-sm font-pixel">
            <h3 className="text-lg font-bold text-white mb-1">{nft.name}</h3>
            <p className="text-gray-400 text-sm mb-3">BY {nft.creator}</p>
            <div className="flex justify-between items-center">
              <span className={cn(
                "font-bold", 
                nft.color === "purple" ? "text-purple-400" : 
                nft.color === "pink" ? "text-pink-400" : "text-blue-400"
              )}>
                {nft.price} SOL
              </span>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  className="bg-transparent border border-pink-500/50 hover:bg-pink-950/30 text-pink-400 rounded-none px-3 py-1 text-xs tracking-wide"
                >
                  BUY NOW
                </Button>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Card corner decorations */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-purple-500 opacity-0 group-hover:opacity-100 transition-opacity z-20" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-purple-500 opacity-0 group-hover:opacity-100 transition-opacity z-20" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-purple-500 opacity-0 group-hover:opacity-100 transition-opacity z-20" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-purple-500 opacity-0 group-hover:opacity-100 transition-opacity z-20" />
      </motion.div>
    </Link>
  );
};

// Collection card component with enhanced visuals
interface CollectionCardProps {
  collection: {
    id: number;
    name: string;
    creator: string;
    items: number;
    floorPrice: number;
    bannerType: string;
    color: "purple" | "pink" | "blue";
  };
  index: number;
  setCursorHover: (hover: boolean) => void;
}

const CollectionCard: React.FC<CollectionCardProps> = ({ collection, index, setCursorHover }) => {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const handleMouseMove = (e: { clientX: number; clientY: number }) => {
    if (!cardRef.current) return;
    
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const posX = e.clientX - centerX;
    const posY = e.clientY - centerY;
    
    // Calculate rotation values (limited to small angles)
    setRotateX(-posY * 0.01);
    setRotateY(posX * 0.01);
  };

  const handleMouseEnter = () => {
    setCursorHover(true);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setCursorHover(false);
    setIsHovered(false);
    // Reset rotation
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <Link href={`/market/collection/${collection.id}`}>
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        viewport={{ once: true, margin: "-100px" }}
        className="relative group perspective-1000 font-pixel"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transformStyle: "preserve-3d",
          transition: "transform 0.1s ease-out",
        }}
      >
        {/* Glow effect on hover */}
        <motion.div
          className={`absolute -inset-1 opacity-0 group-hover:opacity-100 blur-md z-0 bg-gradient-to-r 
            ${collection.color === "purple" ? "from-purple-500/30 to-purple-700/30" : 
              collection.color === "pink" ? "from-pink-500/30 to-pink-700/30" : 
              "from-blue-500/30 to-blue-700/30"}`}
        />

        <div className="bg-black border-2 border-purple-900/50 group-hover:border-purple-500 transition-all duration-300 relative z-[5]">
          <div className="h-56 overflow-hidden relative">
            <AbstractShape
              className={cn(
                "w-full h-full",
                collection.color === "purple"
                  ? "text-purple-500/70"
                  : collection.color === "pink"
                    ? "text-pink-500/70"
                    : "text-blue-500/70"
              )}
              type={collection.bannerType as any}
              animate
            />
            
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
            
            {/* Interactive particles */}
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={`particle-${collection.id}-${i}`}
                className="absolute w-1.5 h-1.5 rounded-full"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  opacity: Math.random() * 0.3 + 0.2,
                  backgroundColor: collection.color === "purple" ? "#a855f7" : 
                                  collection.color === "pink" ? "#ec4899" : "#3b82f6",
                  boxShadow: `0 0 5px ${collection.color === "purple" ? "#a855f7" : 
                                      collection.color === "pink" ? "#ec4899" : "#3b82f6"}`,
                }}
                animate={{
                  y: [-(Math.random() * 30), Math.random() * 30],
                  x: [-(Math.random() * 30), Math.random() * 30],
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
            
            <div className="absolute bottom-4 left-4">
              <h3 className="text-2xl font-bold text-white mb-1 font-pixel">{collection.name}</h3>
              <p className="text-gray-400 text-sm font-pixel">BY {collection.creator}</p>
            </div>
          </div>
          
          <div className="p-4 flex justify-between items-center border-t border-purple-900/50 backdrop-blur-sm">
            <div>
              <p className="text-gray-400 text-sm font-pixel">{collection.items} ITEMS</p>
            </div>
            <div>
              <p className="text-white font-bold font-pixel">
                FLOOR:{" "}
                <span className={collection.color === "purple" ? "text-purple-400" : 
                                collection.color === "pink" ? "text-pink-400" : "text-blue-400"}>
                  {collection.floorPrice} SOL
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Card corner decorations */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-purple-500 opacity-0 group-hover:opacity-100 transition-opacity z-20" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-purple-500 opacity-0 group-hover:opacity-100 transition-opacity z-20" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-purple-500 opacity-0 group-hover:opacity-100 transition-opacity z-20" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-purple-500 opacity-0 group-hover:opacity-100 transition-opacity z-20" />
      </motion.div>
    </Link>
  );
};

// 3D Banner for Market Page
const Market3DBanner = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // For tracking mouse movement
  useEffect(() => {
    const handleMouseMove = (e: { clientX: number; clientY: number }) => {
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

      {/* Blockchain Visualization */}
      <svg
        className="absolute inset-0 w-full h-full z-0 opacity-20"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <g>
          {/* Horizontal lines */}
          <motion.line
            x1="10"
            y1="30"
            x2="90"
            y2="30"
            stroke="#a855f7"
            strokeWidth="0.5"
            animate={{ opacity: [0.2, 0.8, 0.2] }}
            transition={{ duration: 5, repeat: Infinity }}
          />
          <motion.line
            x1="10"
            y1="50"
            x2="90"
            y2="50"
            stroke="#ec4899"
            strokeWidth="0.5"
            animate={{ opacity: [0.2, 0.6, 0.2] }}
            transition={{ duration: 7, repeat: Infinity, delay: 0.5 }}
          />
          <motion.line
            x1="10"
            y1="70"
            x2="90"
            y2="70"
            stroke="#3b82f6"
            strokeWidth="0.5"
            animate={{ opacity: [0.2, 0.7, 0.2] }}
            transition={{ duration: 6, repeat: Infinity, delay: 1 }}
          />

          {/* Blockchain Nodes */}
          {[...Array(9)].map((_, i) => (
            <g key={`node-group-${i}`}>
              <motion.circle 
                cx={10 + i * 10} 
                cy="30" 
                r="1.5" 
                fill="#a855f7"
                animate={{ 
                  r: [1.5, 2.5, 1.5],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 3 + i * 0.5, 
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
              <motion.circle 
                cx={10 + i * 10} 
                cy="50" 
                r="1.5" 
                fill="#ec4899"
                animate={{ 
                  r: [1.5, 2.5, 1.5],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 4 + i * 0.3, 
                  repeat: Infinity,
                  delay: i * 0.3
                }}
              />
              <motion.circle 
                cx={10 + i * 10} 
                cy="70" 
                r="1.5" 
                fill="#3b82f6"
                animate={{ 
                  r: [1.5, 2.5, 1.5],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 5 + i * 0.2, 
                  repeat: Infinity,
                  delay: i * 0.4
                }}
              />
            </g>
          ))}

          {/* Connection pulses */}
          {[...Array(3)].map((_, i) => (
            <motion.circle
              key={`pulse-${i}`}
              cx={10 + i * 30}
              cy={30 + i * 20}
              r="0.5"
              fill="#fff"
              animate={{
                cx: [10 + i * 30, 90 - i * 10],
                opacity: [1, 0],
                r: [0.5, 3, 0.5]
              }}
              transition={{
                duration: 10 + i * 2,
                repeat: Infinity,
                delay: i * 3
              }}
            />
          ))}
        </g>
      </svg>

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
            text="MARKETPLACE"
            className="text-7xl sm:text-8xl md:text-9xl font-black tracking-tighter mb-6 leading-none text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500"
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
            text="DISCOVER DIGITAL ARTIFACTS"
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
          Explore and collect unique digital assets from the void
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
  );
};

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
  
  const [particles, setParticles] = useState<Particle[]>([]);

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
    }));

    setParticles(generatedParticles);
  }, []);

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
  );
};

export default function MarketPage() {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [cursorHover, setCursorHover] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { connected } = useWallet();
  
  const containerRef = useRef(null);
  const marketplaceRef = useRef(null);
  const featuredRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Smoother parallax with spring physics
  const marketTitleX = useTransform(scrollYProgress, [0.1, 0.2, 0.3], [-300, 0, 0]);
  const featuredTitleX = useTransform(scrollYProgress, [0.4, 0.5, 0.6], [300, 0, 0]);

  const smoothMarketTitleX = useSpring(marketTitleX, {
    stiffness: 100,
    damping: 30,
  });
  
  const smoothFeaturedTitleX = useSpring(featuredTitleX, {
    stiffness: 100,
    damping: 30,
  });
  
  // For background parallax effects
  const bgY1 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const bgY2 = useTransform(scrollYProgress, [0, 1], [0, -100]);

  // Handle cursor effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Mock NFT data
  const collections: {
    id: number;
    name: string;
    creator: string;
    items: number;
    floorPrice: number;
    bannerType: string;
    color: "purple" | "pink" | "blue";
  }[] = [
    {
      id: 1,
      name: "VOID CUBES",
      creator: "VOID_OFFICIAL",
      items: 24,
      floorPrice: 0.5,
      bannerType: "complex",
      color: "purple",
    },
    {
      id: 2,
      name: "RESONANCE",
      creator: "VOID_MUSIC",
      items: 16,
      floorPrice: 0.3,
      bannerType: "wave",
      color: "pink",
    },
    {
      id: 3,
      name: "DIGITAL DREAMS",
      creator: "VOID_COMMUNITY",
      items: 32,
      floorPrice: 0.2,
      bannerType: "grid",
      color: "blue",
    },
    {
      id: 4,
      name: "NEON ARTIFACTS",
      creator: "VOID_LABS",
      items: 12,
      floorPrice: 0.8,
      bannerType: "dots",
      color: "purple",
    },
  ];

  const nfts: {
    id: number;
    name: string;
    creator: string;
    price: number;
    type: string;
    shapeType: string;
    color: "purple" | "pink" | "blue";
  }[] = [
    {
      id: 1,
      name: "VOID CUBE #001",
      creator: "VOID_OFFICIAL",
      price: 0.5,
      type: "cube",
      shapeType: "complex",
      color: "purple",
    },
    {
      id: 2,
      name: "SYNTHWAVE DREAM",
      creator: "VOID_MUSIC",
      price: 0.3,
      type: "music",
      shapeType: "wave",
      color: "pink",
    },
    {
      id: 3,
      name: "VOID CUBE #002",
      creator: "VOID_OFFICIAL",
      price: 0.6,
      type: "cube",
      shapeType: "grid",
      color: "blue",
    },
    {
      id: 4,
      name: "DIGITAL ECHO",
      creator: "VOID_MUSIC",
      price: 0.4,
      type: "music",
      shapeType: "dots",
      color: "purple",
    },
    {
      id: 5,
      name: "VOID CUBE #003",
      creator: "VOID_COMMUNITY",
      price: 0.2,
      type: "cube",
      shapeType: "noise",
      color: "pink",
    },
    {
      id: 6,
      name: "AMBIENT VOID",
      creator: "VOID_COMMUNITY",
      price: 0.25,
      type: "music",
      shapeType: "wave",
      color: "blue",
    },
  ];

  const filteredNFTs = (type: string) => {
    return nfts
      .filter((nft) => nft.type === type)
      .filter(
        (nft) =>
          searchQuery === "" ||
          nft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          nft.creator.toLowerCase().includes(searchQuery.toLowerCase())
      );
  };

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
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
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

      {/* Navigation */}
      <Navigation />

      {/* Enhanced 3D Banner */}
      <Market3DBanner />

      {/* Marketplace Section */}
      <section ref={marketplaceRef} id="marketplace" className="relative py-32">
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
          <motion.div style={{ x: smoothMarketTitleX }} className="mb-20">
            <PixelHeading
              text="EXPLORE COLLECTIONS"
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

          <div className="max-w-7xl mx-auto">
            {/* Enhanced Search and Filter */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="mb-16 flex flex-col md:flex-row gap-4 items-center justify-between"
            >
              <div className="relative w-full md:w-96 group">
                <motion.div 
                  className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 rounded-sm blur-sm transition-opacity duration-300"
                  animate={{ opacity: [0, 0.3, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="SEARCH ITEMS..."
                  className="bg-black border-2 border-purple-900 focus:border-purple-500 rounded-none p-4 text-white font-pixel w-full relative"
                  onMouseEnter={() => setCursorHover(true)}
                  onMouseLeave={() => setCursorHover(false)}
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              <motion.div 
                className="flex space-x-4"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <select
                  title="sort"
                  className="bg-black border-2 border-purple-900 focus:border-purple-500 rounded-none p-2 text-white font-pixel"
                  onMouseEnter={() => setCursorHover(true)}
                  onMouseLeave={() => setCursorHover(false)}
                >
                  <option value="recent">RECENTLY ADDED</option>
                  <option value="price-low">PRICE: LOW TO HIGH</option>
                  <option value="price-high">PRICE: HIGH TO LOW</option>
                </select>
              </motion.div>
            </motion.div>

            <Tabs defaultValue="collections" className="w-full">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="flex justify-center mb-16"
              >
                <TabsList className="bg-black border-2 border-purple-900 p-1 rounded-none">
                  <TabsTrigger
                    value="collections"
                    className="data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-400 rounded-none px-6 py-3 font-pixel transition-all duration-300"
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                  >
                    COLLECTIONS
                  </TabsTrigger>
                  <TabsTrigger
                    value="cubes"
                    className="data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-400 rounded-none px-6 py-3 font-pixel transition-all duration-300"
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                  >
                    CUBES
                  </TabsTrigger>
                  <TabsTrigger
                    value="music"
                    className="data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-400 rounded-none px-6 py-3 font-pixel transition-all duration-300"
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                  >
                    MUSIC
                  </TabsTrigger>
                </TabsList>
              </motion.div>

              {/* Collections Tab */}
              <TabsContent value="collections" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {collections.map((collection, index) => (
                    <CollectionCard 
                      key={collection.id} 
                      collection={collection} 
                      index={index} 
                      setCursorHover={setCursorHover} 
                    />
                  ))}
                </div>
              </TabsContent>

              {/* Cubes Tab */}
              <TabsContent value="cubes" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {filteredNFTs("cube").map((nft, index) => (
                    <NFTItem 
                      key={nft.id} 
                      nft={nft} 
                      index={index} 
                      setCursorHover={setCursorHover} 
                    />
                  ))}
                </div>
              </TabsContent>

              {/* Music Tab */}
              <TabsContent value="music" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {filteredNFTs("music").map((nft, index) => (
                    <NFTItem 
                      key={nft.id} 
                      nft={nft} 
                      index={index} 
                      setCursorHover={setCursorHover} 
                    />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      {/* Featured Section */}
      <section ref={featuredRef} className="relative py-32 bg-purple-950/10">
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
          <motion.div style={{ x: smoothFeaturedTitleX }} className="mb-20 text-center">
            <PixelHeading
              text="FEATURED COLLECTION"
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
          </motion.div>

          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative mb-16 overflow-hidden perspective-1000"
              onMouseEnter={() => setCursorHover(true)}
              onMouseLeave={() => setCursorHover(false)}
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/30 to-pink-600/30 blur-md opacity-70"></div>
              <div className="h-72 overflow-hidden relative border-2 border-purple-900/50">
                <AbstractShape
                  className="w-full h-full text-purple-500/50"
                  type="complex"
                  animate
                />
                
                {/* Interactive particles */}
                {Array.from({ length: 20 }).map((_, i) => (
                  <motion.div
                    key={`feature-particle-${i}`}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                      opacity: Math.random() * 0.3 + 0.2,
                      backgroundColor: i % 3 === 0 ? "#a855f7" : i % 3 === 1 ? "#ec4899" : "#3b82f6",
                      boxShadow: `0 0 8px ${i % 3 === 0 ? "#a855f7" : i % 3 === 1 ? "#ec4899" : "#3b82f6"}`,
                    }}
                    animate={{
                      y: [-(Math.random() * 30), Math.random() * 30],
                      x: [-(Math.random() * 30), Math.random() * 30],
                      scale: [1, Math.random() * 0.5 + 1, 1],
                      opacity: [0, 0.7, 0],
                    }}
                    transition={{
                      duration: 5 + Math.random() * 5,
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "easeInOut",
                    }}
                  />
                ))}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
                <div className="absolute bottom-8 left-8">
                  <h3 className="text-4xl font-bold text-white mb-2 font-pixel">
                    GENESIS VOID CUBES
                  </h3>
                  <p className="text-gray-300 text-xl font-pixel">
                    THE ORIGINAL COLLECTION
                  </p>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
              {Array.from({ length: 4 }).map((_, index) => (
                <NFTItem
                  key={`featured-${index}`}
                  nft={{
                    id: 100 + index,
                    name: `GENESIS CUBE #${index + 1}`,
                    creator: "VOID_OFFICIAL",
                    price: (index + 1) * 0.25,
                    type: "cube",
                    shapeType: index % 4 === 0 ? "complex" : index % 4 === 1 ? "grid" : index % 4 === 2 ? "dots" : "noise",
                    color: index % 3 === 0 ? "purple" : index % 3 === 1 ? "pink" : "blue"
                  }}
                  index={index}
                  setCursorHover={setCursorHover}
                />
              ))}
            </div>

            <div className="text-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                onMouseEnter={() => setCursorHover(true)}
                onMouseLeave={() => setCursorHover(false)}
                className="relative inline-block"
              >
                <Button
                  asChild
                  className="bg-transparent border-2 border-purple-500 hover:bg-purple-950/30 text-white rounded-none px-8 py-4 text-lg font-pixel tracking-wide relative overflow-hidden"
                >
                  <Link href="/market/collection/1">
                    <span className="relative z-10">VIEW COLLECTION</span>

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
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: "TOTAL VOLUME", value: "1,245 SOL" },
                { label: "FLOOR PRICE", value: "0.2 SOL" },
                { label: "ITEMS", value: "1,024" },
                { label: "OWNERS", value: "512" },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  className="relative group"
                  onMouseEnter={() => setCursorHover(true)}
                  onMouseLeave={() => setCursorHover(false)}
                >
                  <motion.div
                    className="absolute -inset-0.5 bg-gradient-to-r from-purple-600/20 to-pink-600/20 opacity-0 group-hover:opacity-100 blur-sm"
                    animate={{ opacity: [0, 0.3, 0] }}
                    transition={{ duration: 3, repeat: Infinity, delay: index * 0.5 }}
                  />
                  <div className="bg-black border-2 border-purple-900/50 group-hover:border-purple-500 p-6 text-center transition-colors duration-300 relative">
                    <h3 className="text-gray-400 text-sm mb-2 font-pixel">{stat.label}</h3>
                    <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 font-pixel">{stat.value}</p>
                    
                    {/* Card corner decorations */}
                    <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-purple-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-purple-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-purple-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-purple-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32">
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
              repeat:Infinity, 
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
                text="CREATE YOUR OWN NFT"
                className="text-4xl md:text-5xl font-black tracking-tighter mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500"
              />
              <p className="text-xl md:text-2xl text-gray-300 mb-10 font-pixel">USE OUR AI TOOLS TO GENERATE UNIQUE DIGITAL ASSETS</p>

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
                  <Link href="/ai">
                    <span className="relative z-10">CREATE NOW</span>

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
        
        .animate-pulse-slow {
          animation: pulse-slow 3s infinite ease-in-out;
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.95;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.02);
          }
        }
      `}</style>
    </div>
  );
}