"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { motion, useScroll, useTransform } from "framer-motion"
import { Button } from "@/components/ui/button"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import AbstractShape from "@/components/abstract-shape"
import PixelHeading from "@/components/pixel-heading"
import { cn } from "@/lib/utils"

export default function Home() {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const [cursorHover, setCursorHover] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const aboutRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const galleryRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll()

  const aboutTitleX = useTransform(scrollYProgress, [0.1, 0.2, 0.3], [-200, 0, 0])
  const featuresTitleX = useTransform(scrollYProgress, [0.3, 0.4, 0.5], [200, 0, 0])
  const galleryTitleX = useTransform(scrollYProgress, [0.5, 0.6, 0.7], [-200, 0, 0])

  // Handle cursor effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  return (
    <div className="relative bg-black text-white overflow-hidden font-pixel">
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
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-black to-black"></div>
        </div>

        {/* Abstract SVG Shapes */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <AbstractShape
            className="absolute top-[10%] left-[5%] w-[30vw] h-[30vw] text-purple-500/20"
            type="circle"
            animate
          />
          <AbstractShape
            className="absolute bottom-[15%] right-[10%] w-[25vw] h-[25vw] text-pink-500/20"
            type="square"
            animate
          />
          <AbstractShape
            className="absolute top-[30%] right-[20%] w-[15vw] h-[15vw] text-blue-500/20"
            type="triangle"
            animate
          />
        </div>

        <div className="container mx-auto px-4 z-10 relative">
          <div className="max-w-7xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="mb-6"
            >
              <PixelHeading
                text="VOID"
                className="text-8xl sm:text-9xl md:text-[12rem] font-black tracking-tighter mb-6 leading-none text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500"
              />
              <PixelHeading
                text="BEYOND IMAGINATION"
                className="text-3xl sm:text-4xl md:text-5xl mt-2 tracking-wide text-gray-300"
              />
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-10 font-light"
            >
              An immersive artistic experience that challenges your perception of reality
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-6"
              onMouseEnter={() => setCursorHover(true)}
              onMouseLeave={() => setCursorHover(false)}
            >
              <Button
                asChild
                size="lg"
                className="bg-transparent border-2 border-purple-500 hover:bg-purple-950/30 text-white rounded-none px-10 py-8 text-xl font-pixel tracking-wide transition-all duration-300"
              >
                <Link href="/game">ENTER THE VOID</Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-2 border-pink-500/50 text-pink-300 hover:bg-pink-950/30 rounded-none px-8 py-7 text-lg font-pixel tracking-wide"
              >
                <Link href="#about">DISCOVER</Link>
              </Button>
            </motion.div>
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

      {/* About Section */}
      <section id="about" ref={aboutRef} className="relative py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <motion.div style={{ x: aboutTitleX }} className="mb-20">
              <PixelHeading
                text="THE EXPERIENCE"
                className="text-7xl md:text-8xl font-black tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600"
              />
              <div className="w-20 h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-r from-purple-500 to-pink-500 opacity-30 blur-lg"></div>
                  <div className="relative aspect-square overflow-hidden">
                    <AbstractShape className="w-full h-full text-purple-500" type="complex" animate />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <PixelHeading
                  text="BEYOND BOUNDARIES"
                  className="text-4xl md:text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500"
                />
                <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                  VOID transcends traditional gaming experiences, blurring the line between art and interaction. Each
                  moment is a carefully crafted journey through abstract landscapes and emotional resonance.
                </p>

                <div className="space-y-6">
                  {[
                    {
                      title: "IMMERSIVE WORLDS",
                      description: "Explore surreal environments that respond to your presence",
                    },
                    {
                      title: "EMOTIONAL JOURNEY",
                      description: "Experience a narrative that adapts to your unique path",
                    },
                    {
                      title: "ARTISTIC VISION",
                      description: "Witness visuals that challenge perception and inspire wonder",
                    },
                  ].map((item, index) => (
                    <div key={index} className="flex items-start">
                      <div className="mr-4 mt-1">
                        <div className="w-4 h-4 bg-purple-500"></div>
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-white mb-1 font-pixel">{item.title}</h4>
                        <p className="text-gray-400">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-950/20 to-black"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div style={{ x: featuresTitleX }} className="mb-20">
            <PixelHeading
              text="FEATURES"
              className="text-7xl md:text-8xl font-black tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-600"
            />
            <div className="w-20 h-1 bg-gradient-to-r from-pink-500 to-purple-500 ml-auto"></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "DYNAMIC SOUNDSCAPES",
                description:
                  "Immerse yourself in audio that evolves based on your interactions and emotions, creating a unique auditory experience with each playthrough.",
                color: "from-purple-500 to-blue-500",
              },
              {
                title: "REACTIVE ENVIRONMENTS",
                description:
                  "Explore worlds that respond and transform to your presence, where every action influences the artistic landscape around you.",
                color: "from-pink-500 to-purple-500",
              },
              {
                title: "EMOTIONAL NARRATIVE",
                description:
                  "Experience a story that adapts to your personal journey, creating meaningful connections between your choices and the unfolding narrative.",
                color: "from-blue-500 to-purple-500",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true, margin: "-100px" }}
                className="relative group"
                onMouseEnter={() => setCursorHover(true)}
                onMouseLeave={() => setCursorHover(false)}
              >
                <div className="absolute -inset-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
                <div className="relative bg-black/80 border border-purple-900/50 p-8 h-full transition-transform duration-500 group-hover:-translate-y-2">
                  <AbstractShape
                    className={cn(
                      "w-16 h-16 mb-6",
                      index === 0 ? "text-purple-500" : index === 1 ? "text-pink-500" : "text-blue-500",
                    )}
                    type={index === 0 ? "wave" : index === 1 ? "grid" : "dots"}
                  />
                  <PixelHeading
                    text={feature.title}
                    className={`text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r ${feature.color}`}
                  />
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section ref={galleryRef} className="relative py-32">
        <div className="container mx-auto px-4">
          <motion.div style={{ x: galleryTitleX }} className="mb-20">
            <PixelHeading
              text="GALLERY"
              className="text-7xl md:text-8xl font-black tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-pink-600"
            />
            <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-pink-500"></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true, margin: "-100px" }}
                className="group relative overflow-hidden aspect-[4/3]"
                onMouseEnter={() => setCursorHover(true)}
                onMouseLeave={() => setCursorHover(false)}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-70 transition-opacity duration-300 z-10"></div>
                <div className="absolute inset-0 bg-black">
                  <AbstractShape
                    className={cn(
                      "w-full h-full",
                      index % 3 === 0
                        ? "text-purple-500/70"
                        : index % 3 === 1
                          ? "text-pink-500/70"
                          : "text-blue-500/70",
                    )}
                    type={
                      index % 5 === 0
                        ? "complex"
                        : index % 5 === 1
                          ? "grid"
                          : index % 5 === 2
                            ? "wave"
                            : index % 5 === 3
                              ? "dots"
                              : "noise"
                    }
                    animate
                  />
                </div>
                <div className="absolute bottom-0 left-0 p-6 z-20 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <PixelHeading text={`VOID SCENE ${index + 1}`} className="text-xl font-bold text-white mb-2" />
                  <p className="text-gray-300 text-sm font-pixel">EXPLORE THE MYSTERIES OF THE VOID</p>
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
                text="READY TO TRANSCEND?"
                className="text-6xl md:text-7xl font-black tracking-tighter mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500"
              />
              <p className="text-xl md:text-2xl text-gray-300 mb-10 font-pixel">BEGIN YOUR JOURNEY INTO THE VOID</p>

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

      {/* Global styles for animations */}
      <style jsx global>{`
        @font-face {
          font-family: 'PixelFont';
          src: url('/pixel-font.woff2') format('woff2');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
        
        .font-pixel {
          font-family: 'PixelFont', monospace;
          letter-spacing: 0.05em;
        }
      `}</style>
    </div>
  )
}
