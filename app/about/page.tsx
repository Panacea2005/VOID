"use client"

import { useState, useEffect, useRef } from "react"
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion"
import Link from "next/link"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import AbstractShape from "@/components/abstract-shape"
import PixelHeading from "@/components/pixel-heading"
import { Button } from "@/components/ui/button"
import BackgroundAudio from "@/components/background-audio"

// Enhanced TeamMember component with 3D tilt effect
interface TeamMemberProps {
  member: {
    name: string;
    realName: string;
    role: string;
    bio: string;
    color: "purple" | "pink" | "blue";
  };
  index: number;
  setCursorHover: (hover: boolean) => void;
}

const TeamMember: React.FC<TeamMemberProps> = ({ member, index, setCursorHover }) => {
  const memberRef = useRef<HTMLDivElement>(null)
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = (e: { clientX: number; clientY: number }) => {
    if (!memberRef.current) return
    
    const card = memberRef.current
    const rect = card.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const posX = e.clientX - centerX
    const posY = e.clientY - centerY
    
    // Calculate rotation values (limited to small angles)
    setRotateX(-posY * 0.02)
    setRotateY(posX * 0.02)
  }

  const handleMouseEnter = () => {
    setCursorHover(true)
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    setCursorHover(false)
    setIsHovered(false)
    // Reset rotation
    setRotateX(0)
    setRotateY(0)
  }

  // Define color classes based on member color
  const colorClasses = {
    purple: {
      bg: "bg-purple-500/20",
      text: "text-purple-500",
      border: "border-purple-500/50",
      gradient: "from-purple-400 to-purple-600"
    },
    pink: {
      bg: "bg-pink-500/20",
      text: "text-pink-500",
      border: "border-pink-500/50",
      gradient: "from-pink-400 to-pink-600"
    },
    blue: {
      bg: "bg-blue-500/20",
      text: "text-blue-500",
      border: "border-blue-500/50", 
      gradient: "from-blue-400 to-blue-600"
    }
  }

  const colorClass = colorClasses[member.color]
  
  return (
    <motion.div
      ref={memberRef}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: index * 0.2 }}
      viewport={{ once: true, margin: "-100px" }}
      className="relative group perspective-1000"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transformStyle: "preserve-3d",
        transition: "transform 0.1s ease-out",
      }}
    >
      {/* Animated glow effect */}
      <motion.div
        className={`absolute -inset-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl z-0 bg-gradient-to-r ${colorClass.gradient}`}
        animate={{
          opacity: [0, 0.7, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />

      {/* Card content */}
      <div className={`relative bg-black/80 border ${colorClass.border} p-8 h-full transition-transform duration-500 z-10`}>
        <div className="flex items-start mb-6">
          <div className={`w-16 h-16 ${colorClass.bg} mr-4 overflow-hidden group-hover:animate-pulse-slow`}>
            <AbstractShape
              className={`w-full h-full ${colorClass.text}`}
              type={index % 3 === 0 ? "grid" : index % 3 === 1 ? "dots" : "wave"}
              animate
            />
          </div>
          <div>
            <PixelHeading
              text={member.name}
              className={`text-2xl font-bold mb-1 text-transparent bg-clip-text bg-gradient-to-r ${colorClass.gradient}`}
            />
            <div className="text-sm text-gray-300 mb-1">{member.realName}</div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">{member.role}</div>
          </div>
        </div>
        <p className="text-gray-300 leading-relaxed">{member.bio}</p>

        {/* Interactive elements */}
        <div className="mt-6 pt-6 border-t border-purple-900/30 flex justify-between items-center">
          <motion.button
            className={`px-3 py-1 text-xs ${colorClass.text} border ${colorClass.border} opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1`}
            animate={{ y: isHovered ? 0 : 10, opacity: isHovered ? 1 : 0 }}
            initial={{ y: 10, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <span>GITHUB PROFILE</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </motion.button>
          
          <div className="flex space-x-3">
            {[1, 2, 3].map((i) => (
              <motion.div 
                key={i} 
                className="w-6 h-6"
                animate={{ rotate: isHovered ? [0, 90, 180, 270, 360] : 0 }}
                transition={{ duration: 2, ease: "linear", repeat: isHovered ? Infinity : 0 }}
              >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect
                    x="4"
                    y="4"
                    width="16"
                    height="16"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={colorClass.text}
                  />
                  <rect
                    x="8"
                    y="8"
                    width="8"
                    height="8"
                    fill="currentColor"
                    className={colorClass.text}
                  />
                </svg>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Card corner decorations */}
      <div className={`absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 ${colorClass.border} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className={`absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 ${colorClass.border} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className={`absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 ${colorClass.border} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className={`absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 ${colorClass.border} opacity-0 group-hover:opacity-100 transition-opacity`} />
    </motion.div>
  )
}

// Process Step component with enhanced animations
interface ProcessStepProps {
  step: {
    number: string;
    title: string;
    description: string;
  };
  index: number;
  setCursorHover: (hover: boolean) => void;
}

const ProcessStep: React.FC<ProcessStepProps> = ({ step, index, setCursorHover }) => {
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: index * 0.2 }}
      viewport={{ once: true, margin: "-100px" }}
      className={`relative mb-32 last:mb-0 flex ${index % 2 === 0 ? "justify-start" : "justify-end"}`}
    >
      {/* Connection point on the timeline */}
      <motion.div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 z-20"
        animate={{ 
          rotate: [0, 360],
          scale: [1, 1.2, 1]
        }}
        transition={{ 
          rotate: { duration: 8, repeat: Infinity, ease: "linear" },
          scale: { duration: 2, repeat: Infinity, repeatType: "reverse" }
        }}
      />
      
      <div className={`w-full md:w-[45%] ${index % 2 === 0 ? "md:pr-16" : "md:pl-16"}`}>
        <motion.div
          className="group border border-purple-900/50 p-8 transition-all duration-500 hover:-translate-y-2 relative overflow-hidden"
          onMouseEnter={() => {
            setCursorHover(true)
            setIsHovered(true)
          }}
          onMouseLeave={() => {
            setCursorHover(false)
            setIsHovered(false)
          }}
          whileHover={{ boxShadow: "0 0 30px rgba(168, 85, 247, 0.2)" }}
        >
          {/* Removing this connection point as we've added it to the ProcessStep component */}

          {/* Background particle effects */}
          <AnimatePresence>
            {isHovered && (
              <>
                {[...Array(10)].map((_, i) => (
                  <motion.div
                    key={`particle-${index}-${i}`}
                    className="absolute w-1 h-1 rounded-full bg-purple-500"
                    initial={{ 
                      x: 0, 
                      y: 0, 
                      opacity: 0 
                    }}
                    animate={{ 
                      x: (Math.random() - 0.5) * 200, 
                      y: (Math.random() - 0.5) * 200,
                      opacity: [0, 0.8, 0]
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5 }}
                    style={{
                      top: `${50 + (Math.random() - 0.5) * 20}%`,
                      left: `${50 + (Math.random() - 0.5) * 20}%`,
                    }}
                  />
                ))}
              </>
            )}
          </AnimatePresence>

          <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-4">
            {step.number}
          </div>
          <PixelHeading text={step.title} className="text-2xl font-bold mb-4 text-white" />
          <p className="text-gray-300 relative z-10">{step.description}</p>
          
          {/* Reveal more button */}
          <motion.button
            className="mt-6 px-4 py-2 text-xs flex items-center space-x-2 text-purple-400 border border-purple-500/30 opacity-0 group-hover:opacity-100 transition-opacity"
            animate={{ y: isHovered ? 0 : 10, opacity: isHovered ? 1 : 0 }}
            initial={{ y: 10, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <span>READ MORE</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  )
}

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
  
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    // Generate random particles after component mounts
    const generatedParticles = Array.from({ length: 50 }).map((_, i) => ({
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
    }))

    setParticles(generatedParticles)
  }, [])

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
  )
}

// 3D Banner for About Page
const About3DBanner = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  
  // For tracking mouse movement
  useEffect(() => {
    const handleMouseMove = (e: { clientX: number; clientY: number }) => {
      // Calculate mouse position relative to the center of the viewport
      const x = (e.clientX / window.innerWidth - 0.5) * 2
      const y = (e.clientY / window.innerHeight - 0.5) * 2
      setMousePosition({ x, y })
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

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
            text="VOID"
            className="text-8xl sm:text-9xl font-black tracking-tighter mb-6 leading-none text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500"
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
            text="THE JOURNEY BEYOND"
            className="text-3xl sm:text-4xl md:text-5xl mt-2 tracking-wide text-gray-300 relative"
            animate
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mt-10 mb-12 font-light"
        >
          An exploration of abstract digital art, emotional resonance, and interactive storytelling
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
          <p className="text-sm text-gray-400 mb-2 font-pixel">SCROLL TO DISCOVER</p>
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
  )
}

export default function AboutPage() {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const [cursorHover, setCursorHover] = useState(false)

  const containerRef = useRef(null)
  const conceptRef = useRef(null)
  const teamRef = useRef(null)
  const processRef = useRef(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  })

  // Smoother parallax with spring physics
  const conceptTitleX = useTransform(scrollYProgress, [0.1, 0.2, 0.3], [-300, 0, 0])
  const teamTitleX = useTransform(scrollYProgress, [0.3, 0.4, 0.5], [300, 0, 0])
  const processTitleX = useTransform(scrollYProgress, [0.5, 0.6, 0.7], [-300, 0, 0])

  const smoothConceptTitleX = useSpring(conceptTitleX, {
    stiffness: 100,
    damping: 30,
  })
  const smoothTeamTitleX = useSpring(teamTitleX, {
    stiffness: 100,
    damping: 30,
  })
  const smoothProcessTitleX = useSpring(processTitleX, {
    stiffness: 100,
    damping: 30,
  })

  // For background parallax effects
  const bgY1 = useTransform(scrollYProgress, [0, 1], [0, -200])
  const bgY2 = useTransform(scrollYProgress, [0, 1], [0, -100])
  const bgY3 = useTransform(scrollYProgress, [0, 1], [0, -300])

  // Handle cursor effects
  useEffect(() => {
    const handleMouseMove = (e: { clientX: any; clientY: any }) => {
      setCursorPosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  // Updated team members with new data
  const team: TeamMemberProps["member"][] = [
    {
      name: "Panacea",
      realName: "Le Truong Thien Nguyen",
      role: "GAME DEVELOPER",
      bio: "Experienced game developer focused on creating immersive web3 gaming experiences with expertise in interactive environments and blockchain integration for in-game assets.",
      color: "purple",
    },
    {
      name: "Menhmenh",
      realName: "Minh Phuong Anh Mai",
      role: "AI ENGINEER",
      bio: "AI specialist implementing advanced algorithms for procedural content generation, adaptive gameplay, and personalized user experiences within the NFT marketplace.",
      color: "pink",
    },
    {
      name: "Lindsay",
      realName: "Ngoc Huyen Truong",
      role: "BLOCKCHAIN SPECIALIST",
      bio: "Blockchain expert leading the development of secure NFT smart contracts, marketplace integration, and cross-chain compatibility to ensure asset ownership and transferability.",
      color: "blue",
    },
  ];

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
      <About3DBanner />

      {/* Concept Section with enhanced interactivity */}
      <section ref={conceptRef} className="relative py-32">
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
          <div className="max-w-7xl mx-auto">
            <motion.div style={{ x: smoothConceptTitleX }} className="mb-20">
              <PixelHeading
                text="THE CONCEPT"
                className="text-7xl md:text-8xl font-black tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true, margin: "-100px" }}
                className="relative"
                onMouseEnter={() => setCursorHover(true)}
                onMouseLeave={() => setCursorHover(false)}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative perspective-1000"
                >
                  <div className="absolute -inset-4 bg-gradient-to-r from-purple-500 to-pink-500 opacity-30 blur-lg"></div>
                  <div className="relative aspect-square overflow-hidden">
                    <AbstractShape className="w-full h-full text-purple-500" type="complex" animate />
                    
                    {/* Interactive particles */}
                    {Array.from({ length: 15 }).map((_, i) => (
                      <motion.div
                        key={`shape-particle-${i}`}
                        className="absolute w-2 h-2 rounded-full bg-purple-500"
                        style={{
                          top: `${Math.random() * 100}%`,
                          left: `${Math.random() * 100}%`,
                          opacity: Math.random() * 0.5 + 0.3,
                          boxShadow: "0 0 8px rgba(168, 85, 247, 0.8)",
                        }}
                        animate={{
                          y: [-(Math.random() * 20), Math.random() * 20],
                          x: [-(Math.random() * 20), Math.random() * 20],
                        }}
                        transition={{
                          duration: 3 + Math.random() * 2,
                          repeat: Infinity,
                          repeatType: "reverse",
                          ease: "easeInOut",
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <div className="relative">
                  <PixelHeading
                    text="BEYOND TRADITIONAL"
                    className="text-2xl md:text-3xl font-bold mb-1 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500"
                  />
                  <PixelHeading
                    text="GAMING"
                    className="text-2xl md:text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 relative"
                  />
                  <div className="absolute -bottom-2 left-0 w-24 h-1 bg-gradient-to-r from-purple-400 to-pink-500"></div>
                </div>
                <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                  VOID NFT is a web3 gaming platform that unites blockchain technology with AI to create
                  a vibrant ecosystem where players can create, own, and use their NFTs across multiple games.
                </p>
                <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                  Our marketplace enables true digital ownership, while our AI tools help generate unique in-game assets
                  that adapt to player preferences and gameplay styles. The result is a deeply personalized gaming experience
                  built on true asset ownership.
                </p>

                <div className="grid grid-cols-2 gap-4 mt-10">
                  <motion.div
                    className="border border-purple-900/50 p-6 group hover:bg-purple-900/20 transition-all duration-300 relative overflow-hidden"
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                    whileHover={{ 
                      boxShadow: "0 0 30px rgba(168, 85, 247, 0.2)",
                      y: -5
                    }}
                  >
                    <motion.div 
                      className="absolute -inset-1 opacity-0 group-hover:opacity-100 bg-purple-500/10"
                      animate={{
                        opacity: [0, 0.2, 0],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    
                    <motion.div 
                      className="text-4xl mb-4 font-bold text-purple-400"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      10K+
                    </motion.div>
                    <p className="text-gray-400">Unique NFTs actively traded on our marketplace</p>
                    
                    {/* Corner decorations */}
                    <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-purple-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-purple-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-purple-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-purple-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.div>
                  
                  <motion.div
                    className="border border-pink-900/50 p-6 group hover:bg-pink-900/20 transition-all duration-300 relative overflow-hidden"
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                    whileHover={{ 
                      boxShadow: "0 0 30px rgba(236, 72, 153, 0.2)",
                      y: -5
                    }}
                  >
                    <motion.div 
                      className="absolute -inset-1 opacity-0 group-hover:opacity-100 bg-pink-500/10"
                      animate={{
                        opacity: [0, 0.2, 0],
                      }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                    />
                    
                    <motion.div 
                      className="text-4xl mb-4 font-bold text-pink-400"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                    >
                      5+
                    </motion.div>
                    <p className="text-gray-400">Compatible games where NFTs can be used interchangeably</p>
                    
                    {/* Corner decorations */}
                    <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-pink-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-pink-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-pink-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-pink-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section with enhanced cards */}
      <section ref={teamRef} className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-950/20 to-black"></div>
          
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
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div style={{ x: smoothTeamTitleX }} className="mb-20">
            <PixelHeading
              text="THE TEAM"
              className="text-7xl md:text-8xl font-black tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-600"
            />
            
            {/* Animated separator line */}
            <div className="w-20 h-1 bg-gradient-to-r from-pink-500 to-purple-500 ml-auto relative overflow-hidden">
              <motion.div
                className="absolute top-0 right-0 h-full w-1/2 bg-white/50"
                animate={{
                  x: [0, 40, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </motion.div>

          {/* Updated for 3-person team layout */}
          <div className="flex flex-col gap-10 max-w-5xl mx-auto">
            {team.map((member, index) => (
              <TeamMember key={index} member={member} index={index} setCursorHover={setCursorHover} />
            ))}
          </div>
          
          {/* Web3 Game Platform Description */}
          <div className="mt-20 bg-black/50 border border-purple-900/50 p-8 max-w-4xl mx-auto">
            <PixelHeading
              text="WEB3 GAMING PLATFORM"
              className="text-2xl md:text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500"
            />
            <p className="text-gray-300 mb-6">
              Our platform combines cutting-edge blockchain technology with AI-powered game development to create a seamless ecosystem where players can create, own, and utilize their NFTs across multiple games.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="border border-purple-500/30 p-4 bg-purple-900/10">
                <h3 className="text-purple-400 font-bold mb-2">CREATE</h3>
                <p className="text-gray-400 text-sm">Design unique in-game assets powered by AI generation tools that respond to your creative vision</p>
              </div>
              <div className="border border-pink-500/30 p-4 bg-pink-900/10">
                <h3 className="text-pink-400 font-bold mb-2">OWN</h3>
                <p className="text-gray-400 text-sm">Securely mint and trade your gaming NFTs on our marketplace with full ownership rights and blockchain verification</p>
              </div>
              <div className="border border-blue-500/30 p-4 bg-blue-900/10">
                <h3 className="text-blue-400 font-bold mb-2">PLAY</h3>
                <p className="text-gray-400 text-sm">Use your NFTs across multiple compatible games, creating a unified gaming experience with real digital asset value</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section with animated timeline */}
      <section ref={processRef} className="relative py-32">
        {/* Parallax floating elements */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ y: bgY3 }}
        >
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={`float-${i}`}
              className="absolute rounded-full opacity-30"
              style={{
                width: `${50 + i * 30}px`,
                height: `${50 + i * 30}px`,
                border: "1px solid rgba(168, 85, 247, 0.3)",
                top: `${100 + i * 100}px`,
                left: `${100 + i * 150}px`,
                filter: "blur(1px)",
              }}
              animate={{
                rotate: [0, 360],
                scale: [1, 1.05, 1],
              }}
              transition={{
                rotate: {
                  duration: 20 + i * 5,
                  repeat: Infinity,
                  ease: "linear",
                },
                scale: {
                  duration: 3 + i,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                },
              }}
            />
          ))}
        </motion.div>
        
        <div className="container mx-auto px-4">
          <motion.div style={{ x: smoothProcessTitleX }} className="mb-20">
            <PixelHeading
              text="THE PROCESS"
              className="text-7xl md:text-8xl font-black tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-pink-600"
            />
            
            {/* Animated separator line */}
            <div className="relative h-1 w-40">
              <div className="w-full h-full bg-gradient-to-r from-blue-500 to-pink-500"></div>
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

          <div className="relative">
            {/* Animated timeline line */}
            <motion.div 
              className="absolute left-[50%] -ml-px top-0 bottom-0 w-px bg-purple-900/50 overflow-hidden"
              initial={{ height: 0 }}
              whileInView={{ height: "100%" }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              viewport={{ once: true }}
            >
              <motion.div
                className="absolute top-0 left-0 w-full bg-gradient-to-b from-purple-500 to-pink-500"
                style={{ height: "50%" }}
                animate={{ y: ["-100%", "200%"] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </motion.div>

            {process.map((step, index) => (
              <ProcessStep key={index} step={step} index={index} setCursorHover={setCursorHover} />
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="relative py-32 overflow-hidden">
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
              repeat: Infinity, 
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
                text="JOIN THE JOURNEY"
                className="text-4xl md:text-5xl font-black tracking-tighter mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500"
              />
              <p className="text-xl md:text-2xl text-gray-300 mb-10 font-pixel">EXPERIENCE THE VOID FOR YOURSELF</p>

              <motion.div
                className="flex flex-col sm:flex-row items-center justify-center gap-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
              >
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
                    <Link href="/game">
                      <span className="relative z-10">ENTER THE VOID</span>

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

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  onMouseEnter={() => setCursorHover(true)}
                  onMouseLeave={() => setCursorHover(false)}
                  className="relative inline-block"
                >
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="border-2 border-pink-500/50 text-pink-300 hover:bg-pink-950/30 rounded-none px-8 py-7 text-lg font-pixel tracking-wide relative overflow-hidden"
                  >
                    <Link href="/gallery">
                      <span className="relative z-10">VIEW GALLERY</span>
                      
                      {/* Button glow effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-pink-600/20 to-purple-600/20"
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    </Link>
                  </Button>
                  
                  {/* Button decorative pulse */}
                  <motion.div
                    className="absolute -inset-1 opacity-0 rounded-sm"
                    animate={{ 
                      scale: [1, 1.1, 1],
                      opacity: [0, 0.15, 0],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{
                      background: "radial-gradient(circle, rgba(236, 72, 153, 0.4) 0%, rgba(236, 72, 153, 0) 70%)",
                    }}
                  />
                </motion.div>
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
  )
}