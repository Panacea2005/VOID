"use client"

import { useState, useEffect, useRef } from "react"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import Link from "next/link"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import AbstractShape from "@/components/abstract-shape"
import PixelHeading from "@/components/pixel-heading"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function GalleryPage() {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const [cursorHover, setCursorHover] = useState(false)
  const [activeImage, setActiveImage] = useState<number | null>(null)
  const [filterCategory, setFilterCategory] = useState("all")

  const containerRef = useRef<HTMLDivElement>(null)
  const galleryRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  })

  const galleryTitleX = useTransform(scrollYProgress, [0.1, 0.2, 0.3], [-300, 0, 0])

  // Handle cursor effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  // Gallery items
  const galleryItems = [
    {
      id: 1,
      title: "ETHEREAL VOID",
      category: "environment",
      description: "A surreal landscape where light and shadow dance in perpetual motion.",
      color: "purple",
      type: "complex",
    },
    {
      id: 2,
      title: "DIGITAL CONSCIOUSNESS",
      category: "concept",
      description: "Exploring the boundaries between human perception and digital existence.",
      color: "pink",
      type: "grid",
    },
    {
      id: 3,
      title: "EMOTIONAL RESONANCE",
      category: "gameplay",
      description: "Interactive elements that respond to the player's emotional state.",
      color: "blue",
      type: "wave",
    },
    {
      id: 4,
      title: "ABSTRACT JOURNEY",
      category: "environment",
      description: "A pathway through shifting geometric forms and evolving color palettes.",
      color: "purple",
      type: "dots",
    },
    {
      id: 5,
      title: "MEMORY FRAGMENTS",
      category: "concept",
      description: "Scattered pieces of narrative that form a unique story for each player.",
      color: "pink",
      type: "noise",
    },
    {
      id: 6,
      title: "REACTIVE SOUNDSCAPE",
      category: "gameplay",
      description: "Visualizing the dynamic audio environment that evolves with player actions.",
      color: "blue",
      type: "complex",
    },
    {
      id: 7,
      title: "LIMINAL SPACE",
      category: "environment",
      description: "The threshold between defined experiences, a place of transition and possibility.",
      color: "purple",
      type: "grid",
    },
    {
      id: 8,
      title: "DIGITAL DREAMS",
      category: "concept",
      description: "Manifestations of subconscious thought within the digital realm.",
      color: "pink",
      type: "wave",
    },
    {
      id: 9,
      title: "PLAYER ECHO",
      category: "gameplay",
      description: "Visualizing how player choices reverberate through the game world.",
      color: "blue",
      type: "dots",
    },
  ]

  const filteredItems =
    filterCategory === "all" ? galleryItems : galleryItems.filter((item) => item.category === filterCategory)

  const categories = [
    { id: "all", name: "ALL" },
    { id: "environment", name: "ENVIRONMENTS" },
    { id: "concept", name: "CONCEPTS" },
    { id: "gameplay", name: "GAMEPLAY" },
  ]

  return (
    <div ref={containerRef} className="relative bg-black text-white overflow-hidden font-pixel">
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
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="0" width="4" height="4" fill="#a855f7" />
          <rect x="28" y="0" width="4" height="4" fill="#a855f7" />
          <rect x="0" y="28" width="4" height="4" fill="#a855f7" />
          <rect x="28" y="28" width="4" height="4" fill="#a855f7" />
          <rect x="12" y="12" width="8" height="8" fill="#ec4899" />
        </svg>
      </motion.div>

      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-black to-black"></div>
        </div>

        {/* Abstract SVG Shapes */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <AbstractShape
            className="absolute top-[20%] left-[10%] w-[20vw] h-[20vw] text-purple-500/20"
            type="grid"
            animate
          />
          <AbstractShape
            className="absolute bottom-[15%] right-[5%] w-[25vw] h-[25vw] text-pink-500/20"
            type="dots"
            animate
          />
        </div>

        <div className="container mx-auto px-4 z-10 relative">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="mb-6 text-center"
            >
              <PixelHeading
                text="GALLERY"
                className="text-8xl sm:text-9xl md:text-[12rem] font-black tracking-tighter mb-6 leading-none text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500"
                animate
              />
              <PixelHeading
                text="VISUAL EXPLORATION"
                className="text-3xl sm:text-4xl md:text-5xl mt-2 tracking-wide text-gray-300"
                animate
              />
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-10 font-light text-center"
            >
              A collection of abstract visuals from the void experience
            </motion.p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
        >
          <div className="flex flex-col items-center">
            <p className="text-sm text-gray-400 mb-2 font-pixel">SCROLL TO EXPLORE</p>
            <svg width="24" height="40" viewBox="0 0 24 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="0" y="0" width="24" height="40" stroke="#a855f7" strokeWidth="2" />
              <motion.rect
                animate={{ y: [4, 28, 4] }}
                transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
                x="8"
                width="8"
                height="8"
                fill="#ec4899"
              />
            </svg>
          </div>
        </motion.div>
      </section>

      {/* Gallery Section */}
      <section ref={galleryRef} className="relative py-20">
        <div className="container mx-auto px-4">
          <motion.div style={{ x: galleryTitleX }} className="mb-20">
            <PixelHeading
              text="EXPLORE THE VOID"
              className="text-7xl md:text-8xl font-black tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600"
            />
            <div className="w-20 h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
          </motion.div>

          {/* Filter Categories */}
          <div className="mb-16">
            <div className="flex flex-wrap justify-center gap-4">
              {categories.map((category) => (
                <motion.button
                  key={category.id}
                  onClick={() => setFilterCategory(category.id)}
                  className={cn(
                    "px-6 py-3 border-2 transition-all duration-300 font-pixel",
                    filterCategory === category.id
                      ? "border-purple-500 bg-purple-900/30 text-white"
                      : "border-gray-800 text-gray-400 hover:border-purple-500/50 hover:text-gray-200",
                  )}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onMouseEnter={() => setCursorHover(true)}
                  onMouseLeave={() => setCursorHover(false)}
                >
                  {category.name}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {filteredItems.map((item, index) => (
                <motion.div
                  layout
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.5 }}
                  className={cn(
                    "relative aspect-square overflow-hidden group cursor-pointer",
                    activeImage === item.id ? "md:col-span-2 md:row-span-2" : "",
                  )}
                  onClick={() => setActiveImage(activeImage === item.id ? null : item.id)}
                  onMouseEnter={() => setCursorHover(true)}
                  onMouseLeave={() => setCursorHover(false)}
                >
                  {/* Background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-black to-purple-900/30 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  {/* Abstract shape */}
                  <div className="absolute inset-0 bg-black">
                    <AbstractShape
                      className={cn(
                        "w-full h-full",
                        item.color === "purple"
                          ? "text-purple-500/70"
                          : item.color === "pink"
                            ? "text-pink-500/70"
                            : "text-blue-500/70",
                      )}
                      type={item.type as any}
                      animate
                    />
                  </div>

                  {/* Content overlay */}
                  <div className="absolute inset-0 z-20 p-6 flex flex-col justify-between transform transition-transform duration-500">
                    <div className="transform translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                      <div className="inline-block px-3 py-1 mb-2 bg-black/80 text-xs uppercase tracking-wider text-gray-400">
                        {item.category}
                      </div>
                      <PixelHeading
                        text={item.title}
                        className={cn(
                          "text-xl md:text-2xl font-bold mb-2",
                          item.color === "purple"
                            ? "text-purple-400"
                            : item.color === "pink"
                              ? "text-pink-400"
                              : "text-blue-400",
                        )}
                      />
                    </div>

                    <div className="transform translate-y-20 group-hover:translate-y-0 transition-transform duration-500 delay-100">
                      <p className="text-gray-300 mb-4 bg-black/70 p-2 backdrop-blur-sm">{item.description}</p>
                      <div className="flex justify-between items-center">
                        <div className="text-xs uppercase tracking-wider text-gray-400">
                          {activeImage === item.id ? "Click to minimize" : "Click to expand"}
                        </div>
                        <div className="w-8 h-8 border border-gray-600 flex items-center justify-center">
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className={cn(
                              "transition-transform duration-300",
                              activeImage === item.id ? "rotate-45" : "",
                            )}
                          >
                            <rect x="5" y="0" width="2" height="12" fill="currentColor" />
                            <rect x="0" y="5" width="12" height="2" fill="currentColor" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Interactive Gallery Section */}
      <section className="relative py-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-100px" }}
            className="mb-20 text-center"
          >
            <PixelHeading
              text="INTERACTIVE SHOWCASE"
              className="text-5xl md:text-6xl font-black tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-blue-600"
            />
            <div className="w-20 h-1 bg-gradient-to-r from-pink-500 to-blue-500 mx-auto"></div>
          </motion.div>

          <div className="relative h-[70vh] overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <AbstractShape className="w-full h-full text-purple-500/30" type="complex" animate />
            </div>

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center max-w-2xl px-4">
                <PixelHeading text="COMING SOON" className="text-4xl md:text-5xl font-bold mb-6 text-white" />
                <p className="text-xl text-gray-300 mb-8">
                  An interactive 3D gallery experience is currently in development. Return soon to explore the void in a
                  completely new dimension.
                </p>
                <Button
                  size="lg"
                  className="bg-transparent border-2 border-purple-500 hover:bg-purple-950/30 text-white rounded-none px-8 py-6 text-xl font-pixel tracking-wide transition-all duration-300"
                  onMouseEnter={() => setCursorHover(true)}
                  onMouseLeave={() => setCursorHover(false)}
                >
                  GET NOTIFIED
                </Button>
              </div>
            </div>

            {/* Floating elements */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                initial={{
                  x: Math.random() * 100 - 50 + "%",
                  y: Math.random() * 100 - 50 + "%",
                  opacity: Math.random() * 0.5 + 0.3,
                  scale: Math.random() * 0.5 + 0.5,
                }}
                animate={{
                  x: [Math.random() * 100 - 50 + "%", Math.random() * 100 - 50 + "%", Math.random() * 100 - 50 + "%"],
                  y: [Math.random() * 100 - 50 + "%", Math.random() * 100 - 50 + "%", Math.random() * 100 - 50 + "%"],
                  rotate: [0, Math.random() * 360, 0],
                }}
                transition={{
                  duration: Math.random() * 20 + 20,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }}
              >
                <div className="w-8 h-8">
                  <AbstractShape
                    className={cn(
                      "w-full h-full",
                      i % 3 === 0 ? "text-purple-500/50" : i % 3 === 1 ? "text-pink-500/50" : "text-blue-500/50",
                    )}
                    type={
                      i % 5 === 0
                        ? "square"
                        : i % 5 === 1
                          ? "circle"
                          : i % 5 === 2
                            ? "triangle"
                            : i % 5 === 3
                              ? "dots"
                              : "grid"
                    }
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-t from-purple-950/30 via-black to-black"></div>
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
                text="EXPERIENCE IT YOURSELF"
                className="text-6xl md:text-7xl font-black tracking-tighter mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500"
              />
              <p className="text-xl md:text-2xl text-gray-300 mb-10 font-pixel">BEYOND IMAGES LIES THE TRUE VOID</p>

              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                onMouseEnter={() => setCursorHover(true)}
                onMouseLeave={() => setCursorHover(false)}
              >
                <Button
                  asChild
                  size="lg"
                  className="bg-transparent border-2 border-purple-500 hover:bg-purple-950/30 text-white rounded-none px-12 py-8 text-2xl font-pixel tracking-wide transition-all duration-300"
                >
                  <Link href="/game">ENTER THE VOID</Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
