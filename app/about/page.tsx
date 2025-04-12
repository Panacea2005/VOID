"use client"

import { useState, useEffect, useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import Link from "next/link"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import AbstractShape from "@/components/abstract-shape"
import PixelHeading from "@/components/pixel-heading"
import { Button } from "@/components/ui/button"

export default function AboutPage() {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const [cursorHover, setCursorHover] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const conceptRef = useRef<HTMLDivElement>(null)
  const teamRef = useRef<HTMLDivElement>(null)
  const processRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  })

  const conceptTitleX = useTransform(scrollYProgress, [0.1, 0.2, 0.3], [-300, 0, 0])
  const teamTitleX = useTransform(scrollYProgress, [0.3, 0.4, 0.5], [300, 0, 0])
  const processTitleX = useTransform(scrollYProgress, [0.5, 0.6, 0.7], [-300, 0, 0])

  // Handle cursor effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  const team = [
    {
      name: "ALEX VOID",
      role: "CREATIVE DIRECTOR",
      bio: "Visionary artist with a background in experimental digital art and game design. Alex pushes the boundaries of interactive experiences.",
      color: "purple",
    },
    {
      name: "SARA PIXEL",
      role: "LEAD DEVELOPER",
      bio: "Code architect and technical artist who blends programming expertise with a passion for creating immersive digital worlds.",
      color: "pink",
    },
    {
      name: "MARCUS ECHO",
      role: "SOUND DESIGNER",
      bio: "Audio engineer specializing in procedural soundscapes and interactive music that responds to player emotions and actions.",
      color: "blue",
    },
    {
      name: "ELENA DRIFT",
      role: "NARRATIVE DESIGNER",
      bio: "Storyteller focused on non-linear narratives and emotional journeys that adapt to each player's unique path through the void.",
      color: "purple",
    },
  ]

  const process = [
    {
      number: "01",
      title: "CONCEPT",
      description:
        "The initial spark came from exploring the intersection of abstract art, emotional resonance, and interactive storytelling.",
    },
    {
      number: "02",
      title: "PROTOTYPE",
      description:
        "Early experiments focused on creating responsive environments that could adapt to player presence and emotional states.",
    },
    {
      number: "03",
      title: "REFINEMENT",
      description:
        "Iterative development with a focus on the feeling of exploration and discovery, ensuring each moment feels meaningful.",
    },
    {
      number: "04",
      title: "POLISH",
      description:
        "Fine-tuning the audiovisual experience to create a seamless journey through abstract digital landscapes.",
    },
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
                text="ABOUT"
                className="text-8xl sm:text-9xl md:text-[12rem] font-black tracking-tighter mb-6 leading-none text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500"
                animate
              />
              <PixelHeading
                text="THE VOID PROJECT"
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
              An exploration of abstract digital art, emotional resonance, and interactive storytelling
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
            <p className="text-sm text-gray-400 mb-2 font-pixel">SCROLL TO DISCOVER</p>
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

      {/* Concept Section */}
      <section ref={conceptRef} className="relative py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <motion.div style={{ x: conceptTitleX }} className="mb-20">
              <PixelHeading
                text="THE CONCEPT"
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
                  text="BEYOND TRADITIONAL GAMING"
                  className="text-4xl md:text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500"
                />
                <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                  VOID began as an experiment in creating spaces that respond to human emotion. We wanted to challenge
                  the conventional understanding of what a game can be, blurring the boundaries between interactive art,
                  emotional journey, and personal reflection.
                </p>
                <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                  Each environment in VOID is designed to evoke specific emotional responses while adapting to the
                  player's presence and choices. The abstract visuals and reactive soundscapes work together to create a
                  unique experience that feels alive and deeply personal.
                </p>

                <div className="grid grid-cols-2 gap-4 mt-10">
                  <div
                    className="border border-purple-900/50 p-6 group hover:bg-purple-900/20 transition-colors duration-300"
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                  >
                    <div className="text-4xl mb-4 font-bold text-purple-400">84%</div>
                    <p className="text-gray-400">Unique emotional responses recorded during playtesting</p>
                  </div>
                  <div
                    className="border border-pink-900/50 p-6 group hover:bg-pink-900/20 transition-colors duration-300"
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                  >
                    <div className="text-4xl mb-4 font-bold text-pink-400">3.2M</div>
                    <p className="text-gray-400">Possible unique paths through the experience</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section ref={teamRef} className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-950/20 to-black"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div style={{ x: teamTitleX }} className="mb-20">
            <PixelHeading
              text="THE TEAM"
              className="text-7xl md:text-8xl font-black tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-600"
            />
            <div className="w-20 h-1 bg-gradient-to-r from-pink-500 to-purple-500 ml-auto"></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {team.map((member, index) => (
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
                <div
                  className={`absolute inset-0 bg-${member.color}-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                ></div>
                <div className="relative border border-purple-900/50 p-8 h-full transition-transform duration-500 group-hover:-translate-y-2">
                  <div className="flex items-start mb-6">
                    <div className={`w-16 h-16 bg-${member.color}-500/20 mr-4 overflow-hidden`}>
                      <AbstractShape
                        className={`w-full h-full text-${member.color}-500`}
                        type={index % 2 === 0 ? "grid" : "dots"}
                        animate={true}
                      />
                    </div>
                    <div>
                      <PixelHeading
                        text={member.name}
                        className={`text-2xl font-bold mb-1 text-transparent bg-clip-text bg-gradient-to-r from-${member.color}-400 to-${member.color}-600`}
                      />
                      <div className="text-sm text-gray-400 uppercase tracking-wider">{member.role}</div>
                    </div>
                  </div>
                  <p className="text-gray-300 leading-relaxed">{member.bio}</p>

                  <div className="mt-6 pt-6 border-t border-purple-900/30 flex justify-end">
                    <div className="flex space-x-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="w-6 h-6">
                          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect
                              x="4"
                              y="4"
                              width="16"
                              height="16"
                              stroke="currentColor"
                              strokeWidth="2"
                              className={`text-${member.color}-500`}
                            />
                            <rect
                              x="8"
                              y="8"
                              width="8"
                              height="8"
                              fill="currentColor"
                              className={`text-${member.color}-500`}
                            />
                          </svg>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section ref={processRef} className="relative py-32">
        <div className="container mx-auto px-4">
          <motion.div style={{ x: processTitleX }} className="mb-20">
            <PixelHeading
              text="THE PROCESS"
              className="text-7xl md:text-8xl font-black tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-pink-600"
            />
            <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-pink-500"></div>
          </motion.div>

          <div className="relative">
            <div className="absolute left-[50%] top-0 bottom-0 w-px bg-purple-900/50"></div>

            {process.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true, margin: "-100px" }}
                className={`relative mb-32 last:mb-0 flex ${index % 2 === 0 ? "justify-start" : "justify-end"}`}
              >
                <div className={`w-full md:w-[45%] ${index % 2 === 0 ? "md:pr-16" : "md:pl-16"}`}>
                  <div
                    className="group border border-purple-900/50 p-8 transition-transform duration-500 hover:-translate-y-2"
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                  >
                    <div className="absolute top-1/2 -translate-y-1/2 w-8 h-8 bg-purple-500 left-[50%] -translate-x-1/2 md:block hidden"></div>

                    <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-4">
                      {step.number}
                    </div>
                    <PixelHeading text={step.title} className="text-2xl font-bold mb-4 text-white" />
                    <p className="text-gray-300">{step.description}</p>
                  </div>
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
                text="JOIN THE JOURNEY"
                className="text-6xl md:text-7xl font-black tracking-tighter mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500"
              />
              <p className="text-xl md:text-2xl text-gray-300 mb-10 font-pixel">EXPERIENCE THE VOID FOR YOURSELF</p>

              <div
                className="flex flex-col sm:flex-row items-center justify-center gap-6"
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

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-2 border-pink-500/50 text-pink-300 hover:bg-pink-950/30 rounded-none px-8 py-7 text-lg font-pixel tracking-wide"
                >
                  <Link href="/gallery">VIEW GALLERY</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
