"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import AbstractShape from "./abstract-shape"
import PixelHeading from "./pixel-heading"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [showLeftScroll, setShowLeftScroll] = useState(false)
  const [showRightScroll, setShowRightScroll] = useState(false)
  const navScrollRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()

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

  // Update the navLinks array to include GACHA
  const navLinks = [
    { name: "HOME", path: "/" },
    { name: "GAME", path: "/game" },
    { name: "ABOUT", path: "/about" },
    { name: "GALLERY", path: "/gallery" },
    { name: "REALM", path: "/realm" },
    { name: "GACHA", path: "/gacha" },
    { name: "AI", path: "/ai" },
    { name: "MARKET", path: "/market" },
  ]

  const connectWallet = () => {
    // This would be replaced with actual wallet connection logic
    console.log("Connecting wallet...")
    setIsWalletConnected(true)
  }

  const handleWalletClick = () => {
    if (isWalletConnected) {
      router.push("/profile")
    } else {
      connectWallet()
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

  const menuVariants = {
    closed: {
      opacity: 0,
      clipPath: "circle(0% at calc(100% - 3rem) 3rem)",
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
      clipPath: "circle(150% at calc(100% - 3rem) 3rem)",
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
    closed: { opacity: 0, y: 50 },
    open: { opacity: 1, y: 0 },
  }

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4 ${
          isScrolled || isOpen ? "bg-black/80 backdrop-blur-md" : "bg-transparent"
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
            <Button
              onClick={handleWalletClick}
              className={`bg-transparent border ${
                isWalletConnected
                  ? "border-pink-500 hover:bg-pink-950/30 text-pink-400"
                  : "border-purple-500 hover:bg-purple-950/30 text-purple-400"
              } rounded-none px-4 py-2 text-sm font-pixel tracking-wide z-50`}
            >
              {isWalletConnected ? (
                <>
                  <span className="mr-2 w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                  0x8F...3E4A
                </>
              ) : (
                "CONNECT"
              )}
            </Button>

            {/* Menu Toggle Button */}
            <motion.button
              onClick={() => setIsOpen(!isOpen)}
              className="w-12 h-12 flex items-center justify-center z-50 relative"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <motion.rect
                  animate={isOpen ? { y: 14, rotate: 45 } : { y: 6, rotate: 0 }}
                  x="4"
                  width="24"
                  height="4"
                  fill="#a855f7"
                />
                <motion.rect
                  animate={isOpen ? { opacity: 0 } : { opacity: 1 }}
                  x="4"
                  y="14"
                  width="24"
                  height="4"
                  fill="#a855f7"
                />
                <motion.rect
                  animate={isOpen ? { y: 14, rotate: -45 } : { y: 22, rotate: 0 }}
                  x="4"
                  width="24"
                  height="4"
                  fill="#a855f7"
                />
              </svg>
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
            className="fixed inset-0 z-40 bg-black/95 backdrop-blur-md flex items-center justify-center"
          >
            <div className="max-w-7xl w-full mx-auto px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="flex flex-col justify-center">
                  <motion.div variants={itemVariants} className="mb-8">
                    <PixelHeading text="NAVIGATION" className="text-3xl font-bold text-purple-400" />
                  </motion.div>

                  <div className="relative">
                    {showLeftScroll && (
                      <button
                        onClick={() => scrollNav("left")}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 p-1 rounded-full text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        <ChevronLeft size={20} />
                      </button>
                    )}

                    <nav
                      ref={navScrollRef}
                      className="flex flex-col space-y-6 overflow-y-auto max-h-[50vh] pr-4 scrollbar-hide no-scrollbar"
                      style={{
                        scrollbarWidth: 'none', /* Firefox */
                        msOverflowStyle: 'none' /* IE and Edge */
                      }}
                    >
                      {navLinks.map((link, index) => (
                        <motion.div key={link.path} variants={itemVariants}>
                          <Link
                            href={link.path}
                            className={`group relative text-5xl md:text-7xl font-black tracking-tighter transition-colors duration-300 font-pixel ${
                              pathname === link.path ? "text-purple-400" : "text-white hover:text-purple-300"
                            }`}
                          >
                            <span className="relative z-10">{link.name}</span>
                            <span className="absolute -left-4 top-0 text-sm text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-pixel">
                              0{index + 1}
                            </span>
                            <span className="absolute -bottom-2 left-0 w-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 group-hover:w-full transition-all duration-300"></span>
                          </Link>
                        </motion.div>
                      ))}
                    </nav>

                    {showRightScroll && (
                      <button
                        onClick={() => scrollNav("right")}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 p-1 rounded-full text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        <ChevronRight size={20} />
                      </button>
                    )}
                  </div>
                </div>

                <motion.div variants={itemVariants} className="hidden md:flex items-center justify-center">
                  <div className="relative">
                    <AbstractShape className="w-64 h-64 text-purple-500/50" type="complex" animate />
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