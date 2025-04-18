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
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import BackgroundAudio from "@/components/background-audio"

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

// Enhanced Collection Banner component
const CollectionBanner = ({ collection }: { collection: any }) => {
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
    <div className="relative h-80 w-full overflow-hidden">
      {/* Background shape with parallax effect */}
      <motion.div 
        className="absolute inset-0"
        style={{
          x: mousePosition.x * -20,
          y: mousePosition.y * -20,
        }}
        transition={{ type: "spring", damping: 15 }}
      >
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
      </motion.div>
      
      {/* Interactive particles */}
      {Array.from({ length: 15 }).map((_, i) => (
        <motion.div
          key={`banner-particle-${i}`}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: collection.color === "purple" ? "#a855f7" : 
                            collection.color === "pink" ? "#ec4899" : "#3b82f6",
            boxShadow: `0 0 10px ${collection.color === "purple" ? "#a855f7" : 
                                  collection.color === "pink" ? "#ec4899" : "#3b82f6"}`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [-(Math.random() * 100), Math.random() * 100],
            x: [-(Math.random() * 100), Math.random() * 100],
            scale: [1, Math.random() * 2 + 1, 1],
            opacity: [0, 0.7, 0],
          }}
          transition={{
            duration: 10 + Math.random() * 10,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />
      ))}
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent z-10"></div>
      
      {/* Center title */}
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-center"
        >
          <PixelHeading
            text={collection.name}
            className="text-5xl md:text-7xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500"
            animate
          />
          <motion.div
            className="w-40 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto relative overflow-hidden"
            initial={{ width: 0 }}
            animate={{ width: 160 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <motion.div
              className="absolute top-0 left-0 h-full bg-white/50"
              style={{ width: "20px" }}
              animate={{
                x: [0, 160, 0],
                opacity: [0, 1, 0],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

// Enhanced stats card component
interface StatCardProps {
  label: string;
  value: string | number;
  index: number;
  setCursorHover: (hover: boolean) => void;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, index, setCursorHover }) => {
  return (
    <motion.div
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
        <h3 className="text-gray-400 text-sm mb-2 font-pixel">{label}</h3>
        <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 font-pixel">{value}</p>
        
        {/* Card corner decorations */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-purple-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-purple-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-purple-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-purple-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </motion.div>
  );
};

export default function CollectionDetailPage() {
  const params = useParams()
  const id = params?.id || "1"
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const [cursorHover, setCursorHover] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
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

  // Mock collection data - in a real app, you would fetch this based on the ID
  const collection = {
    id: Number(id),
    name: `VOID ${Number(id) % 2 === 0 ? "RESONANCE" : "CUBES"}`,
    description:
      "A unique collection of digital artifacts from the VOID universe. Each piece contains the essence of digital creativity and blockchain innovation.",
    creator: "VOID_OFFICIAL",
    items: 24,
    owners: 18,
    floorPrice: 0.5,
    volume: 120,
    bannerType: Number(id) % 3 === 0 ? "complex" : Number(id) % 3 === 1 ? "grid" : "wave",
    color: Number(id) % 3 === 0 ? "purple" : Number(id) % 3 === 1 ? "pink" : "blue",
  }

  // Generate mock NFTs for this collection
  const nfts = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    name: `${collection.name} #${i + 1}`,
    creator: collection.creator,
    price: collection.floorPrice + (i % 5) * 0.1,
    type: Number(id) % 2 === 0 ? "music" : "cube",
    shapeType: i % 5 === 0 ? "complex" : i % 5 === 1 ? "grid" : i % 5 === 2 ? "wave" : i % 5 === 3 ? "dots" : "noise",
    color: i % 3 === 0 ? "purple" as const : i % 3 === 1 ? "pink" as const : "blue" as const,
  }))

  const filteredNFTs = nfts.filter(
    (nft) =>
      searchQuery === "" ||
      nft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nft.creator.toLowerCase().includes(searchQuery.toLowerCase()),
  )

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

      {/* Enhanced Collection Banner */}
      <section className="relative pt-20">
        <CollectionBanner collection={collection} />
      </section>

      {/* Collection Info */}
      <section className="relative py-20">
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
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12"
            >
              <div>
                <div className="mb-6">
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
                    BACK TO MARKETPLACE
                  </Link>
                </div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="text-gray-300 mb-8 font-pixel leading-relaxed max-w-2xl"
                >
                  {collection.description}
                </motion.p>
              </div>
            </motion.div>

            {/* Collection Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
              {[
                { label: "ITEMS", value: collection.items },
                { label: "OWNERS", value: collection.owners },
                { label: "FLOOR PRICE", value: `${collection.floorPrice} SOL` },
                { label: "VOLUME TRADED", value: `${collection.volume} SOL` },
              ].map((stat, index) => (
                <StatCard 
                  key={index}
                  label={stat.label}
                  value={stat.value}
                  index={index}
                  setCursorHover={setCursorHover}
                />
              ))}
            </div>

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

            {/* Collection Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredNFTs.map((nft, index) => (
                <NFTItem 
                  key={nft.id} 
                  nft={nft} 
                  index={index} 
                  setCursorHover={setCursorHover} 
                />
              ))}
            </div>
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
  )
}