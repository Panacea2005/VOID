"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import AbstractShape from "./abstract-shape"
import PixelHeading from "./pixel-heading"

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()

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

  const navLinks = [
    { name: "HOME", path: "/" },
    { name: "GAME", path: "/game" },
    { name: "ABOUT", path: "/about" },
    { name: "GALLERY", path: "/gallery" },
  ]

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

                  <nav className="flex flex-col space-y-6">
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
    </>
  )
}
