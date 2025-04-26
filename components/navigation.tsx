"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import AbstractShape from "./abstract-shape"
import { Button } from "@/components/ui/button"
import { useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [showLeftScroll, setShowLeftScroll] = useState(false)
  const [showRightScroll, setShowRightScroll] = useState(false)
  const navScrollRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()
  const { connected, publicKey, disconnect } = useWallet()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Check if nav scroll buttons should be visible
  useEffect(() => {
    const checkScroll = () => {
      if (navScrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = navScrollRef.current
        setShowLeftScroll(scrollLeft > 0)
        setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 10)
      }
    }

    checkScroll()
    window.addEventListener("resize", checkScroll)

    const navElement = navScrollRef.current
    if (navElement) {
      navElement.addEventListener("scroll", checkScroll)
    }

    return () => {
      window.removeEventListener("resize", checkScroll)
      if (navElement) {
        navElement.removeEventListener("scroll", checkScroll)
      }
    }
  }, [])

  const navLinks = [
    { name: "HOME", path: "/" },
    { name: "GAME", path: "/game" },
    { name: "ABOUT", path: "/about" },
    { name: "GALLERY", path: "/gallery" },
    { name: "REALM", path: "/realm" },
    { name: "ART", path: "/art" },
    { name: "AI", path: "/ai" },
    { name: "MARKET", path: "/market" },
    { name: "RUBIKS", path: "/rubiks" },
    { name: "CANVAS", path: "/canvas" },
  ]

  const handleWalletClick = () => {
    if (connected) {
      router.push("/profile")
    }
  }

  const scrollNav = (direction: "left" | "right") => {
    if (navScrollRef.current) {
      const scrollAmount = 200
      const currentScroll = navScrollRef.current.scrollLeft
      navScrollRef.current.scrollTo({
        left: direction === "left" ? currentScroll - scrollAmount : currentScroll + scrollAmount,
        behavior: "smooth",
      })
    }
  }

  // Format wallet address
  const shortenAddress = (address: string, chars = 4) => {
    return `${address.slice(0, chars)}...${address.slice(-chars)}`
  }

  const menuVariants = {
    closed: {
      opacity: 0,
      clipPath: "inset(0% 100% 0% 0%)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 40,
        when: "afterChildren",
        staggerChildren: 0.05,
        staggerDirection: -1,
      },
    },
    open: {
      opacity: 1,
      clipPath: "inset(0% 0% 0% 0%)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 40,
        when: "beforeChildren",
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    closed: { opacity: 0, x: -20 },
    open: { opacity: 1, x: 0 },
  }
  
  // 2D Pixel Menu Icon
  const PixelMenuIcon = ({ isOpen }: { isOpen: boolean }) => (
    <div className="w-8 h-8 grid grid-cols-4 grid-rows-4 gap-0.5">
      {/* Row 1 */}
      <motion.div
        className="col-span-4 bg-purple-500"
        animate={isOpen ? { scaleX: 0.6, x: 5 } : { scaleX: 1, x: 0 }}
      ></motion.div>
      
      {/* Row 2 - Spacing */}
      <div className="col-span-4 h-1"></div>
      
      {/* Row 3 */}
      <motion.div
        className="col-span-4 bg-purple-500"
        animate={isOpen ? { scaleX: 0.8, x: 2.5 } : { scaleX: 1, x: 0 }}
      ></motion.div>
      
      {/* Row 4 - Spacing */}
      <div className="col-span-4 h-1"></div>
      
      {/* Row 5 */}
      <motion.div
        className="col-span-4 bg-purple-500"
        animate={isOpen ? { scaleX: 0.6, x: 5 } : { scaleX: 1, x: 0 }}
      ></motion.div>
    </div>
  );
  
  // 2D Pixel Arrow
  const PixelArrow = ({ direction }: { direction: "left" | "right" }) => (
    <div className="w-5 h-5 grid grid-cols-5 grid-rows-5 gap-0.5">
      {Array.from({ length: 25 }).map((_, i) => {
        const row = Math.floor(i / 5);
        const col = i % 5;
        
        // Left arrow pattern
        const isLeftArrowBlock = direction === "left" && (
          (row === 2 && col <= 3) || 
          (row === 1 && col === 1) || 
          (row === 3 && col === 1) ||
          (row === 0 && col === 2) ||
          (row === 4 && col === 2)
        );
        
        // Right arrow pattern
        const isRightArrowBlock = direction === "right" && (
          (row === 2 && col >= 1) || 
          (row === 1 && col === 3) || 
          (row === 3 && col === 3) ||
          (row === 0 && col === 2) ||
          (row === 4 && col === 2)
        );
        
        return (
          <div 
            key={i} 
            className={`${(isLeftArrowBlock || isRightArrowBlock) 
              ? 'bg-purple-400' 
              : 'bg-transparent'}`}
          />
        );
      })}
    </div>
  );
  
  // 2D Pixel Void/Black Hole
  const PixelVoidCube = ({ primaryColor = "#9C27B0", accentColor = "#E040FB", size = 24 }: { primaryColor?: string, accentColor?: string, size?: number }) => (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Outer dark ring - darkest purple */}
        <rect x="6" y="0" width="8" height="1" fill="#4A1442" />
        <rect x="4" y="1" width="2" height="1" fill="#4A1442" />
        <rect x="14" y="1" width="2" height="1" fill="#4A1442" />
        <rect x="3" y="2" width="1" height="1" fill="#4A1442" />
        <rect x="16" y="2" width="1" height="1" fill="#4A1442" />
        <rect x="2" y="3" width="1" height="1" fill="#4A1442" />
        <rect x="17" y="3" width="1" height="1" fill="#4A1442" />
        <rect x="1" y="4" width="1" height="2" fill="#4A1442" />
        <rect x="18" y="4" width="1" height="2" fill="#4A1442" />
        <rect x="0" y="6" width="1" height="8" fill="#4A1442" />
        <rect x="19" y="6" width="1" height="8" fill="#4A1442" />
        <rect x="1" y="14" width="1" height="2" fill="#4A1442" />
        <rect x="18" y="14" width="1" height="2" fill="#4A1442" />
        <rect x="2" y="16" width="1" height="1" fill="#4A1442" />
        <rect x="17" y="16" width="1" height="1" fill="#4A1442" />
        <rect x="3" y="17" width="1" height="1" fill="#4A1442" />
        <rect x="16" y="17" width="1" height="1" fill="#4A1442" />
        <rect x="4" y="18" width="2" height="1" fill="#4A1442" />
        <rect x="14" y="18" width="2" height="1" fill="#4A1442" />
        <rect x="6" y="19" width="8" height="1" fill="#4A1442" />

        {/* Main circle - purple */}
        <rect x="4" y="2" width="12" height="2" fill="#9C27B0" />
        <rect x="2" y="4" width="2" height="2" fill="#9C27B0" />
        <rect x="16" y="4" width="2" height="2" fill="#9C27B0" />
        <rect x="1" y="6" width="1" height="8" fill="#9C27B0" />
        <rect x="18" y="6" width="1" height="8" fill="#9C27B0" />
        <rect x="2" y="14" width="2" height="2" fill="#9C27B0" />
        <rect x="16" y="14" width="2" height="2" fill="#9C27B0" />
        <rect x="4" y="16" width="12" height="2" fill="#9C27B0" />
        
        {/* Inner circle - lighter purple */}
        <rect x="4" y="4" width="12" height="12" fill="#AB47BC" />
        
        {/* Inner shape - bright magenta */}
        <rect x="6" y="3" width="8" height="1" fill="#E040FB" />
        <rect x="5" y="4" width="1" height="1" fill="#E040FB" />
        <rect x="14" y="4" width="1" height="1" fill="#E040FB" />
        <rect x="4" y="5" width="1" height="1" fill="#E040FB" />
        <rect x="15" y="5" width="1" height="1" fill="#E040FB" />
        <rect x="3" y="6" width="1" height="2" fill="#E040FB" />
        <rect x="16" y="6" width="1" height="2" fill="#E040FB" />
        <rect x="4" y="8" width="1" height="1" fill="#E040FB" />
        <rect x="15" y="8" width="1" height="1" fill="#E040FB" />
        <rect x="5" y="9" width="1" height="1" fill="#E040FB" />
        <rect x="14" y="9" width="1" height="1" fill="#E040FB" />
        <rect x="6" y="10" width="1" height="1" fill="#E040FB" />
        <rect x="13" y="10" width="1" height="1" fill="#E040FB" />
        <rect x="7" y="11" width="1" height="1" fill="#E040FB" />
        <rect x="12" y="11" width="1" height="1" fill="#E040FB" />
        <rect x="8" y="12" width="1" height="1" fill="#E040FB" />
        <rect x="11" y="12" width="1" height="1" fill="#E040FB" />
        <rect x="9" y="13" width="2" height="1" fill="#E040FB" />
        <rect x="9" y="14" width="2" height="1" fill="#E040FB" />
        <rect x="9" y="15" width="2" height="1" fill="#E040FB" />
        <rect x="9" y="16" width="2" height="1" fill="#E040FB" />
        
        {/* Center void - black */}
        <rect x="6" y="6" width="8" height="4" fill="#000000" />
        <rect x="7" y="10" width="6" height="1" fill="#000000" />
      </svg>
    </div>
  );

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4 ${isScrolled || isOpen ? "bg-black/80 backdrop-blur-md" : "bg-transparent"
          }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 z-50 font-pixel"
          >
            VOID
          </Link>

          <div className="flex items-center space-x-4">
            {/* Wallet Connection Button */}
            {connected ? (
              <Button
                onClick={handleWalletClick}
                className="bg-transparent border border-pink-500 hover:bg-pink-950/30 text-pink-400 rounded-none px-4 py-2 text-sm font-pixel tracking-wide z-50"
              >
                <span className="mr-2 w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                {publicKey ? shortenAddress(publicKey.toString()) : "CONNECTED"}
              </Button>
            ) : (
              <div className="wallet-adapter-button-wrapper">
                <WalletMultiButton className="bg-transparent border border-purple-500 hover:bg-purple-950/30 text-purple-400 rounded-none px-4 py-2 text-sm font-pixel tracking-wide z-50" />
              </div>
            )}

            {/* Pixelated Menu Button */}
            <motion.button
              onClick={() => setIsOpen(!isOpen)}
              className="w-12 h-12 flex items-center justify-center z-50 relative"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <PixelMenuIcon isOpen={isOpen} />
            </motion.button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={menuVariants}
            className="fixed inset-0 z-40 bg-black/95 backdrop-blur-md flex items-center justify-center overflow-hidden"
          >
            {/* Background pixel art elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  initial={{ 
                    x: Math.random() * window.innerWidth, 
                    y: Math.random() * window.innerHeight,
                    opacity: 0 
                  }}
                  animate={{ 
                    x: [
                      Math.random() * window.innerWidth - 50,
                      Math.random() * window.innerWidth + 50
                    ],
                    y: [
                      Math.random() * window.innerHeight - 50,
                      Math.random() * window.innerHeight + 50
                    ],
                    opacity: [0, 0.4, 0],
                  }}
                  transition={{
                    duration: Math.random() * 10 + 5,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "linear"
                  }}
                >
                  <div 
                    className="w-3 h-3 bg-purple-500/30"
                    style={{
                      boxShadow: "0 0 8px rgba(168, 85, 247, 0.5)"
                    }}
                  />
                </motion.div>
              ))}
            </div>
            
            <div className="max-w-7xl w-full mx-auto px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="flex flex-col justify-center">
                  <div className="relative">
                    {showLeftScroll && (
                      <button
                        onClick={() => scrollNav("left")}
                        className="absolute -left-8 top-1/2 -translate-y-1/2 z-10 p-1 text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        <PixelArrow direction="left" />
                      </button>
                    )}

                    <nav
                      ref={navScrollRef}
                      className="flex flex-col space-y-6 overflow-y-auto max-h-[60vh] pr-4 scrollbar-hide no-scrollbar"
                      style={{
                        scrollbarWidth: 'none', /* Firefox */
                        msOverflowStyle: 'none' /* IE and Edge */
                      }}
                    >
                      {navLinks.map((link, index) => (
                        <motion.div 
                          key={link.path} 
                          variants={itemVariants}
                          custom={index}
                        >
                          <Link
                            href={link.path}
                            className={`group relative text-5xl md:text-7xl font-black tracking-tighter transition-colors duration-300 font-pixel flex items-center ${pathname === link.path ? "text-purple-400" : "text-white hover:text-purple-300"
                              }`}
                          >
                            {/* Pixel indicator for current page */}
                            <div className="w-10 h-10 mr-4 flex justify-center items-center">
                              {pathname === link.path && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <div className="w-4 h-4 bg-purple-500"></div>
                                </motion.div>
                              )}
                            </div>
                            
                            <motion.span 
                              className="relative z-10"
                              whileHover={{ x: 5 }}
                              transition={{ type: "spring", stiffness: 300 }}
                            >
                              {link.name}
                            </motion.span>
                            
                            <motion.span 
                              className="absolute -left-8 top-2 text-sm text-purple-500 font-pixel"
                              initial={{ opacity: 0 }}
                              whileHover={{ opacity: 1 }}
                            >
                              0{index + 1}
                            </motion.span>
                            
                            {/* Animated underline */}
                            <motion.div 
                              className="absolute -bottom-2 left-0 h-2 bg-purple-500"
                              initial={{ width: pathname === link.path ? "100%" : "0%" }}
                              whileHover={{ width: "100%" }}
                              transition={{ duration: 0.2 }}
                              style={{ 
                                width: pathname === link.path ? "100%" : "0%",
                                left: "40px" 
                              }}
                            />
                          </Link>
                        </motion.div>
                      ))}
                    </nav>

                    {showRightScroll && (
                      <button
                        onClick={() => scrollNav("right")}
                        className="absolute -right-8 top-1/2 -translate-y-1/2 z-10 p-1 text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        <PixelArrow direction="right" />
                      </button>
                    )}
                  </div>
                </div>

                <motion.div 
                  variants={itemVariants} 
                  className="hidden md:flex items-center justify-center"
                >
                  <div className="relative">
                    {/* Large 2D pixel black hole */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ 
                        scale: [0, 1.1, 1],
                      }}
                      transition={{ 
                        duration: 0.5,
                        ease: "easeOut" 
                      }}
                      className="w-64 h-64 flex items-center justify-center"
                    >
                      <motion.div
                        animate={{ 
                          scale: [1, 1.05, 1],
                        }}
                        transition={{ 
                          scale: { 
                            duration: 2,
                            repeat: Infinity,
                            repeatType: "reverse",
                            ease: "easeInOut" 
                          }
                        }}
                      >
                        <PixelVoidCube size={200} />
                      </motion.div>
                    </motion.div>
                    
                    {/* Decorative smaller pixel elements */}
                    {[1, 2, 3, 4].map((i) => (
                      <motion.div
                        key={`pixel-${i}`}
                        className="absolute"
                        style={{
                          top: `${Math.sin(i * 1.5) * 100 + 120}px`,
                          left: `${Math.cos(i * 1.5) * 100 + 120}px`,
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ 
                          opacity: [0, 0.8, 0],
                          x: [0, Math.random() * 20 - 10],
                          y: [0, Math.random() * 20 - 10]
                        }}
                        transition={{
                          duration: 3 + i,
                          delay: i * 0.5,
                          repeat: Infinity,
                          repeatType: "reverse"
                        }}
                      >
                        <div className={`w-${i+2} h-${i+2} bg-purple-500/50`}
                             style={{ width: `${i*4 + 4}px`, height: `${i*4 + 4}px` }} />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        /* Hide scrollbar for IE, Edge and Firefox */
        .no-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
    </>
  )
}