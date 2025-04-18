"use client"

import { useState, useEffect, useRef } from "react"
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useParams } from "next/navigation"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import AbstractShape from "@/components/abstract-shape"
import PixelHeading from "@/components/pixel-heading"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import BackgroundAudio from "@/components/background-audio"

// NFT Item component with 3D hover effect for related NFTs
interface NFTItemProps {
  nft: {
    id: number;
    name: string;
    creator?: string;
    price: number;
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

            {/* Interactive particles */}
            {Array.from({ length: 6 }).map((_, i) => (
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
            <div className="flex justify-between items-center">
              <span className={cn(
                "font-bold", 
                nft.color === "purple" ? "text-purple-400" : 
                nft.color === "pink" ? "text-pink-400" : "text-blue-400"
              )}>
                {nft.price} SOL
              </span>
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

// Enhanced NFT Preview component with 3D interaction
const NFTPreview = ({ nft }: { nft: any }) => {
  const [rotateX, setRotateX] = useState(15);
  const [rotateY, setRotateY] = useState(15);
  const [isHovered, setIsHovered] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  
  // Auto-rotation animation when hovered
  useEffect(() => {
    if (!isHovered) return;
    
    let frameId: number;
    let angle = 0;
    
    const autoRotate = () => {
      angle += 0.01;
      setRotateY(15 + Math.sin(angle) * 15);
      setRotateX(15 + Math.cos(angle) * 10);
      
      frameId = requestAnimationFrame(autoRotate);
    };
    
    frameId = requestAnimationFrame(autoRotate);
    
    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [isHovered]);
  
  const handleMouseMove = (e: { clientX: number; clientY: number }) => {
    if (!previewRef.current || isHovered) return;
    
    const card = previewRef.current;
    const rect = card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const posX = e.clientX - centerX;
    const posY = e.clientY - centerY;
    
    // Calculate rotation values (limited to small angles)
    setRotateX(-posY * 0.01 + 15);
    setRotateY(posX * 0.01 + 15);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // Reset rotation to default position
    setRotateX(15);
    setRotateY(15);
  };
  
  return (
    <motion.div
      ref={previewRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
      className="relative aspect-square bg-black border-2 border-purple-900/50 overflow-hidden perspective-1000"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="w-full h-full"
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transition: "transform 0.2s ease-out",
        }}
      >
        <AbstractShape
          className={cn(
            "w-full h-full transform-gpu",
            nft.color === "purple"
              ? "text-purple-500/70"
              : nft.color === "pink"
                ? "text-pink-500/70"
                : "text-blue-500/70"
          )}
          type={nft.shapeType as any}
          animate
        />
        
        {/* Interactive particles */}
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={`main-particle-${i}`}
            className="absolute w-2 h-2 rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.5 + 0.3,
              backgroundColor: nft.color === "purple" ? "#a855f7" : 
                              nft.color === "pink" ? "#ec4899" : "#3b82f6",
              boxShadow: `0 0 8px ${nft.color === "purple" ? "#a855f7" : 
                                  nft.color === "pink" ? "#ec4899" : "#3b82f6"}`,
            }}
            animate={{
              y: [-(Math.random() * 30), Math.random() * 30],
              x: [-(Math.random() * 30), Math.random() * 30],
              scale: [1, Math.random() * 0.5 + 1, 1],
              opacity: [0.3, 0.7, 0.3],
              z: [0, Math.random() * 50, 0],
            }}
            transition={{
              duration: 6 + Math.random() * 6,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.div>
      
      {/* Play button for music NFTs */}
      {nft.type === "music" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div 
            className="w-20 h-20 bg-black/70 border border-purple-500 rounded-full flex items-center justify-center"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-white"
            >
              <path d="M8 5.14V19.14L19 12.14L8 5.14Z" fill="currentColor" />
            </svg>
          </motion.div>
        </div>
      )}
      
      {/* Glow shadow */}
      <motion.div
        className={cn(
          "absolute -inset-2 blur-xl opacity-30 rounded-full",
          nft.color === "purple" ? "bg-purple-500" : 
          nft.color === "pink" ? "bg-pink-500" : "bg-blue-500"
        )}
        animate={{ 
          opacity: [0.1, 0.3, 0.1],
          scale: [0.9, 1.05, 0.9],
        }}
        transition={{ duration: 4, repeat: Infinity }}
      />
    </motion.div>
  );
};

// Enhanced Attribute Card component
interface AttributeCardProps {
  trait: string;
  value: string;
  index: number;
}

const AttributeCard: React.FC<AttributeCardProps> = ({ trait, value, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
      className="relative group bg-black border border-purple-900/50 hover:border-purple-500/70 p-4 transition-colors duration-300"
    >
      <p className="text-gray-400 text-sm font-pixel">{trait}</p>
      <p className="text-white font-bold font-pixel">{value}</p>
      
      {/* Accent border animation */}
      <motion.div 
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500"
        initial={{ width: 0 }}
        whileHover={{ width: "100%" }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
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
    const generatedParticles = Array.from({ length: 30 }).map((_, i) => ({
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

export default function NFTDetailPage() {
  const params = useParams()
  const id = params?.id || '0'
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const [cursorHover, setCursorHover] = useState(false)
  const [showModelViewer, setShowModelViewer] = useState(false)
  const [modelUrl, setModelUrl] = useState("")
  
  const containerRef = useRef(null)
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // For background parallax effects
  const bgY1 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const bgY2 = useTransform(scrollYProgress, [0, 1], [0, -100]);

  // Handle cursor effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  // Mock NFT data - in a real app, you would fetch this based on the ID
  const nft = {
    id: Number(id),
    name: `VOID CUBE #${id}`,
    description:
      "A unique digital artifact from the VOID universe. This cube contains the essence of digital creativity and blockchain innovation.",
    creator: "VOID_OFFICIAL",
    owner: "VOID_COLLECTOR",
    price: 0.5,
    type: Number(id) % 2 === 0 ? "music" : "cube",
    shapeType:
      Number(id) % 5 === 0
        ? "complex"
        : Number(id) % 5 === 1
          ? "grid"
          : Number(id) % 5 === 2
            ? "wave"
            : Number(id) % 5 === 3
              ? "dots"
              : "noise",
    color: Number(id) % 3 === 0 ? "purple" : Number(id) % 3 === 1 ? "pink" : "blue",
    attributes: [
      { trait: "Rarity", value: "Rare" },
      { trait: "Edition", value: `${id}/1000` },
      { trait: "Generation", value: "Genesis" },
      { trait: "Dimension", value: "3D" },
      { trait: "Animation", value: "Dynamic" },
    ],
    history: [
      { event: "Minted", from: "VOID_OFFICIAL", to: "VOID_OFFICIAL", price: 0, date: "2023-10-15" },
      { event: "Listed", from: "VOID_OFFICIAL", to: null, price: 0.5, date: "2023-10-16" },
      { event: "Sold", from: "VOID_OFFICIAL", to: "VOID_COLLECTOR", price: 0.5, date: "2023-10-18" },
    ],
  }

  // Handle 3D model viewer
  const handleView3DModel = () => {
    try {
      console.log("Opening 3D model viewer for NFT:", nft.name);

      // Use GLB model based on NFT ID for variety
      let modelUrl;

      // Try to find in localStorage if NFT with this ID exists
      if (typeof window !== 'undefined') {
        try {
          const userNfts = JSON.parse(localStorage.getItem('userNfts') || '[]');
          const matchedNft = userNfts.find((item: any) => item.id === nft.id.toString() || item.id === `void-cube-${nft.id}`);

          if (matchedNft) {
            // Check direct modelViewerUrl if available
            if (matchedNft.modelViewerUrl) {
              console.log("Found modelViewerUrl in localStorage:", matchedNft.modelViewerUrl);
              modelUrl = matchedNft.modelViewerUrl;
            }
            // Check model3d URL
            else if (matchedNft.model3d) {
              console.log("Found model3d in localStorage:", matchedNft.model3d);
              // Check if it's already a model viewer URL
              if (matchedNft.model3d.includes('modelviewer.dev')) {
                modelUrl = matchedNft.model3d;
              } else {
                // Create model viewer URL from model3d URL
                modelUrl = `https://modelviewer.dev/viewer.html#src=${encodeURIComponent(matchedNft.model3d)}`;
              }
            }
            // Check model3dHash
            else if (matchedNft.model3dHash) {
              console.log("Found model3dHash in localStorage:", matchedNft.model3dHash);
              const directModelUrl = `https://ipfs.io/ipfs/${matchedNft.model3dHash}`;
              modelUrl = `https://modelviewer.dev/viewer.html#src=${encodeURIComponent(directModelUrl)}`;
            }
            // Check model in properties.files
            else if (matchedNft.properties?.files?.length > 0) {
              const modelFile = matchedNft.properties.files.find((file: any) =>
                file.type === 'model/gltf-binary' ||
                file.type === 'model/gltf+json'
              );

              if (modelFile && modelFile.uri) {
                console.log("Found model in properties.files:", modelFile.uri);
                modelUrl = `https://modelviewer.dev/viewer.html#src=${encodeURIComponent(modelFile.uri)}`;
              }
            }
          }

          // If not found, use a sample model based on ID
          if (!modelUrl) {
            const sampleModels = [
              "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
              "https://modelviewer.dev/shared-assets/models/Cube.gltf",
              "https://modelviewer.dev/shared-assets/models/NeilArmstrong.glb",
              "https://modelviewer.dev/shared-assets/models/RobotExpressive.glb",
            ];

            modelUrl = sampleModels[nft.id % sampleModels.length];
            console.log("No actual model found, using sample model:", modelUrl);
          }
        } catch (error) {
          console.error("Error finding NFT in localStorage:", error);
          modelUrl = "https://modelviewer.dev/shared-assets/models/Astronaut.glb";
        }
      } else {
        modelUrl = "https://modelviewer.dev/shared-assets/models/Astronaut.glb";
      }

      // Check if URL already has modelviewer.dev
      if (!modelUrl.includes('modelviewer.dev')) {
        modelUrl = `https://modelviewer.dev/viewer.html#src=${encodeURIComponent(modelUrl)}`;
      }

      console.log("Final model viewer URL:", modelUrl);
      setModelUrl(modelUrl);
      setShowModelViewer(true);
    } catch (error) {
      console.error("Error displaying 3D model:", error);
      alert("An error occurred while loading the 3D Model. Please try again later.");
      setModelUrl("https://modelviewer.dev/shared-assets/models/Astronaut.glb");
      setShowModelViewer(true);
    }
  };

  const handleCloseModelViewer = () => {
    setShowModelViewer(false);
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

      {/* NFT Detail Section */}
      <section className="relative pt-32 pb-20">
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
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Enhanced NFT Preview */}
              <div>
                <NFTPreview nft={nft} />
              </div>

              {/* NFT Info */}
              <div>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="mb-6"
                >
                  <Link
                    href="/market"
                    className="text-purple-400 hover:text-purple-300 transition-colors duration-300 font-pixel flex items-center"
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="mr-2"
                    >
                      <path
                        d="M19 12H5M5 12L12 19M5 12L12 5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    BACK TO MARKETPLACE</Link>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <PixelHeading
                    text={nft.name}
                    className="text-4xl md:text-5xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500"
                  />

                  <div className="flex items-center mb-6">
                    <span className="text-gray-400 font-pixel">CREATED BY</span>
                    <Link
                      href="#"
                      className="ml-2 text-purple-400 hover:text-purple-300 transition-colors duration-300 font-pixel"
                      onMouseEnter={() => setCursorHover(true)}
                      onMouseLeave={() => setCursorHover(false)}
                    >
                      {nft.creator}
                    </Link>
                  </div>

                  <p className="text-gray-300 mb-8 font-pixel leading-relaxed">{nft.description}</p>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="mb-8 p-6 bg-purple-950/10 border border-purple-900/50 relative overflow-hidden"
                >
                  {/* Animated gradient border */}
                  <motion.div 
                    className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300"
                    animate={{
                      background: [
                        "linear-gradient(to right, rgba(168, 85, 247, 0.1), rgba(236, 72, 153, 0.1))",
                        "linear-gradient(to right, rgba(236, 72, 153, 0.1), rgba(59, 130, 246, 0.1))",
                        "linear-gradient(to right, rgba(59, 130, 246, 0.1), rgba(168, 85, 247, 0.1))",
                      ]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-gray-400 font-pixel">CURRENT PRICE</p>
                      <p className="text-3xl font-bold text-white font-pixel">{nft.price} SOL</p>
                    </div>
                    <div className="flex space-x-4">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        onMouseEnter={() => setCursorHover(true)}
                        onMouseLeave={() => setCursorHover(false)}
                        className="relative"
                      >
                        <Button
                          className="bg-transparent border-2 border-purple-500 hover:bg-purple-950/30 text-white rounded-none px-8 py-4 text-lg font-pixel tracking-wide relative overflow-hidden z-10"
                        >
                          <span className="relative z-10">BUY NOW</span>
                          
                          {/* Button glow effect */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-purple-600/40 to-pink-600/40"
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          />
                        </Button>
                        
                        {/* Button corner decorations */}
                        <motion.div
                          className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-purple-500"
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                        <motion.div
                          className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-purple-500"
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                        />
                        <motion.div
                          className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-purple-500"
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                        />
                        <motion.div
                          className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-purple-500"
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
                        />
                      </motion.div>
                      
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        onMouseEnter={() => setCursorHover(true)}
                        onMouseLeave={() => setCursorHover(false)}
                        className="relative"
                      >
                        <Button
                          onClick={handleView3DModel}
                          className="bg-transparent border-2 border-blue-500 hover:bg-blue-950/30 text-white rounded-none px-8 py-4 text-lg font-pixel tracking-wide relative overflow-hidden z-10"
                        >
                          <span className="relative z-10">VIEW 3D MODEL</span>
                          
                          {/* Button glow effect */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-blue-600/40 to-purple-600/40"
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          />
                        </Button>
                        
                        {/* Button corner decorations */}
                        <motion.div
                          className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-blue-500"
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                        <motion.div
                          className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-blue-500"
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                        />
                        <motion.div
                          className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-blue-500"
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                        />
                        <motion.div
                          className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-blue-500"
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
                        />
                      </motion.div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <Tabs defaultValue="attributes" className="w-full">
                    <TabsList className="bg-black border-2 border-purple-900 p-1 rounded-none mb-6">
                      <TabsTrigger
                        value="attributes"
                        className="data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-400 rounded-none px-6 py-2 font-pixel transition-all duration-300"
                        onMouseEnter={() => setCursorHover(true)}
                        onMouseLeave={() => setCursorHover(false)}
                      >
                        ATTRIBUTES
                      </TabsTrigger>
                      <TabsTrigger
                        value="history"
                        className="data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-400 rounded-none px-6 py-2 font-pixel transition-all duration-300"
                        onMouseEnter={() => setCursorHover(true)}
                        onMouseLeave={() => setCursorHover(false)}
                      >
                        HISTORY
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="attributes" className="mt-0">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {nft.attributes.map((attr, index) => (
                          <AttributeCard key={index} trait={attr.trait} value={attr.value} index={index} />
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="history" className="mt-0">
                      <div className="border border-purple-900/50 relative overflow-hidden">
                        <motion.div 
                          className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300"
                          animate={{
                            background: [
                              "linear-gradient(to right, rgba(168, 85, 247, 0.05), rgba(236, 72, 153, 0.05))",
                              "linear-gradient(to right, rgba(236, 72, 153, 0.05), rgba(59, 130, 246, 0.05))",
                              "linear-gradient(to right, rgba(59, 130, 246, 0.05), rgba(168, 85, 247, 0.05))",
                            ]
                          }}
                          transition={{ duration: 3, repeat: Infinity }}
                        />
                        
                        <div className="grid grid-cols-4 gap-4 p-4 border-b border-purple-900/50 bg-purple-950/10">
                          <p className="text-gray-400 font-pixel">EVENT</p>
                          <p className="text-gray-400 font-pixel">FROM</p>
                          <p className="text-gray-400 font-pixel">TO</p>
                          <p className="text-gray-400 font-pixel">PRICE</p>
                        </div>
                        
                        {nft.history.map((item, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 + index * 0.1 }}
                            className="grid grid-cols-4 gap-4 p-4 border-b border-purple-900/50 last:border-0 hover:bg-purple-950/10 transition-colors"
                          >
                            <p className="text-white font-pixel">{item.event}</p>
                            <p className="text-purple-400 font-pixel">{item.from}</p>
                            <p className="text-purple-400 font-pixel">{item.to || "-"}</p>
                            <p className="text-white font-pixel">{item.price} SOL</p>
                          </motion.div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* More From Collection Section */}
      <section className="relative py-20 bg-purple-950/10">
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
          <div className="max-w-6xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <PixelHeading
                text="MORE FROM THIS COLLECTION"
                className="text-4xl md:text-5xl font-black tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600"
              />
              <div className="w-40 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto relative overflow-hidden">
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

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, index) => (
                <NFTItem
                  key={index}
                  nft={{
                    id: Number(id) + index + 1,
                    name: `VOID CUBE #${Number(id) + index + 1}`,
                    price: 0.5 + index * 0.1,
                    shapeType: index % 4 === 0 ? "complex" : index % 4 === 1 ? "grid" : index % 4 === 2 ? "dots" : "noise",
                    color: index % 3 === 0 ? "purple" : index % 3 === 1 ? "pink" : "blue"
                  }}
                  index={index}
                  setCursorHover={setCursorHover}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3D Model Viewer Modal with enhanced styling */}
      <AnimatePresence>
        {showModelViewer && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md"
            onClick={(e) => {
              // Close when clicking outside the modal content
              if (e.target === e.currentTarget) {
                handleCloseModelViewer();
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 20 }}
              className="bg-black border-2 border-purple-500 p-8 max-w-5xl w-full h-[80vh] relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <motion.button
                onClick={handleCloseModelViewer}
                className="absolute top-4 right-4 text-white hover:text-pink-500 transition-colors"
                title="Close 3D Model Viewer"
                aria-label="Close 3D Model Viewer"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.button>

              <h3 className="text-2xl font-bold text-white mb-6 font-pixel">3D MODEL VIEWER - {nft.name}</h3>

              <div className="w-full h-[90%] flex items-center justify-center bg-black/50 relative border border-purple-900/50">
                {/* Decorative corner elements */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-purple-500"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-purple-500"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-purple-500"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-purple-500"></div>
                
                {/* Glowing border effect */}
                <motion.div 
                  className="absolute inset-0 pointer-events-none"
                  animate={{
                    boxShadow: [
                      "inset 0 0 15px rgba(168, 85, 247, 0.3)",
                      "inset 0 0 15px rgba(236, 72, 153, 0.3)",
                      "inset 0 0 15px rgba(168, 85, 247, 0.3)"
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                
                {modelUrl ? (
                  <>
                    <iframe
                      src={modelUrl}
                      title="3D Model Viewer"
                      className="w-full h-full border-0"
                      allow="camera; microphone; fullscreen; autoplay; xr-spatial-tracking"
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                      loading="eager"
                      referrerPolicy="no-referrer"
                      onLoad={() => console.log("iframe loaded successfully!")}
                      onError={() => {
                        console.error("Error loading iframe");
                        setModelUrl("https://modelviewer.dev/shared-assets/models/Astronaut.glb");
                      }}
                    ></iframe>
                    <div className="absolute bottom-4 right-4 flex space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => window.open(modelUrl, '_blank')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded font-pixel"
                      >
                        Open in new window
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setModelUrl('https://modelviewer.dev/shared-assets/models/Astronaut.glb')}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded font-pixel"
                      >
                        Try sample model
                      </motion.button>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-8">
                    <p className="text-gray-400 mb-4">Could not load 3D model. Please try again later.</p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setModelUrl('https://modelviewer.dev/shared-assets/models/Astronaut.glb')}
                      className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-pixel"
                    >
                      Try sample model
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
  )
}