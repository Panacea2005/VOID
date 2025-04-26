"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  AnimatePresence,
  useMotionValue,
  animate,
} from "framer-motion";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import AbstractShape from "@/components/abstract-shape";
import PixelHeading from "@/components/pixel-heading";
import Banner3D from "@/components/interactive-banner";
import BackgroundAudio from "@/components/background-audio";
import { cn } from "@/lib/utils";

// Define interface for feature prop
interface Feature {
  title: string;
  description: string;
  color: string;
}

// Enhanced feature card with 3D rotation effect
const FeatureCard = ({
  index,
  feature,
  setCursorHover,
}: {
  index: number;
  feature: Feature;
  setCursorHover: (hover: boolean) => void;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: { clientX: number; clientY: number }) => {
    if (!cardRef.current) return;

    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const posX = e.clientX - centerX;
    const posY = e.clientY - centerY;

    // Calculate rotation values (limited to small angles)
    setRotateX(-posY * 0.02);
    setRotateY(posX * 0.02);
  };

  const handleMouseLeave = () => {
    // Reset rotation
    setRotateX(0);
    setRotateY(0);
    setCursorHover(false);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: index * 0.2 }}
      viewport={{ once: true, margin: "-100px" }}
      className="relative group perspective-1000 font-pixel"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setCursorHover(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transformStyle: "preserve-3d",
        transition: "transform 0.1s ease-out",
      }}
    >
      {/* Animated background effect */}
      <motion.div
        className="absolute -inset-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl z-0"
        style={{
          backgroundImage: `linear-gradient(to right, ${
            index === 0
              ? "#8b5cf6, #6366f1"
              : index === 1
              ? "#ec4899, #9333ea"
              : "#3b82f6, #8b5cf6"
          })`,
        }}
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
      <div className="relative bg-black/80 border border-purple-900/50 p-8 h-full transition-transform duration-500 z-10">
        <div className="group-hover:animate-pulse-slow">
          <AbstractShape
            className={cn(
              "w-16 h-16 mb-6",
              index === 0
                ? "text-purple-500"
                : index === 1
                ? "text-pink-500"
                : "text-blue-500"
            )}
            type={index === 0 ? "wave" : index === 1 ? "grid" : "dots"}
          />
        </div>

        <PixelHeading
          text={feature.title}
          className={`text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r ${feature.color}`}
        />

        <p className="text-gray-400 leading-relaxed font-pixel">
          {feature.description}
        </p>

        {/* Interactive elements that appear on hover */}
        <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <motion.div
            className="w-10 h-10 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
            style={{
              background: `radial-gradient(circle, ${
                index === 0 ? "#8b5cf6" : index === 1 ? "#ec4899" : "#3b82f6"
              }, transparent)`,
            }}
          />
        </div>
      </div>

      {/* Card corner decorations */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
};

const PixelVoidCube = ({ className }: { className?: string }) => {
  return (
    <div className={`relative ${className}`}>
      {/* SVG Void Cube - Enhanced with animation capabilities */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Animated outer dark ring - darkest purple */}
        <motion.g
          animate={{
            scale: [1, 1.02, 1],
            opacity: [0.9, 1, 0.9],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        >
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
        </motion.g>

        {/* Main circle - purple */}
        <motion.g
          animate={{
            scale: [1, 1.01, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        >
          <rect x="4" y="2" width="12" height="2" fill="#9C27B0" />
          <rect x="2" y="4" width="2" height="2" fill="#9C27B0" />
          <rect x="16" y="4" width="2" height="2" fill="#9C27B0" />
          <rect x="1" y="6" width="1" height="8" fill="#9C27B0" />
          <rect x="18" y="6" width="1" height="8" fill="#9C27B0" />
          <rect x="2" y="14" width="2" height="2" fill="#9C27B0" />
          <rect x="16" y="14" width="2" height="2" fill="#9C27B0" />
          <rect x="4" y="16" width="12" height="2" fill="#9C27B0" />
        </motion.g>

        {/* Inner circle - lighter purple */}
        <rect x="4" y="4" width="12" height="12" fill="#AB47BC" />

        {/* Inner shape - bright magenta - with pulse animation */}
        <motion.g
          animate={{
            opacity: [0.9, 1, 0.9],
            scale: [1, 1.03, 1],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        >
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
        </motion.g>

        {/* Center void - black - with subtle animation */}
        <motion.g
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.9, 1, 0.9],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        >
          <rect x="6" y="6" width="8" height="4" fill="#000000" />
          <rect x="7" y="10" width="6" height="1" fill="#000000" />
        </motion.g>
      </svg>

      {/* Animated particles around the cube */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute rounded-full bg-purple-300"
            style={{
              width: `${1 + Math.random() * 2}px`,
              height: `${1 + Math.random() * 2}px`,
              top: `${20 + Math.random() * 60}%`,
              left: `${20 + Math.random() * 60}%`,
              opacity: 0.5 + Math.random() * 0.5,
              boxShadow: "0 0 4px rgba(168, 85, 247, 0.8)",
            }}
            animate={{
              y: [-(Math.random() * 20), Math.random() * 20],
              x: [-(Math.random() * 20), Math.random() * 20],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Enhanced glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        animate={{
          boxShadow: [
            "0 0 0px rgba(168, 85, 247, 0)",
            "0 0 20px rgba(168, 85, 247, 0.3)",
            "0 0 0px rgba(168, 85, 247, 0)",
          ],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />
    </div>
  );
};

// Enhanced gallery card with hover animation and parallax effect
const GalleryCard = ({
  index,
  setCursorHover,
}: {
  index: number;
  setCursorHover: (hover: boolean) => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const backgroundVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.1, transition: { duration: 0.5 } },
  };

  const overlayVariants = {
    initial: { opacity: 0 },
    hover: { opacity: 0.7, transition: { duration: 0.3 } },
  };

  const contentVariants = {
    initial: { opacity: 0, y: 20 },
    hover: { opacity: 1, y: 0, transition: { duration: 0.3, delay: 0.1 } },
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true, margin: "-100px" }}
      className="group relative overflow-hidden aspect-[4/3] font-pixel"
      onMouseEnter={() => {
        setCursorHover(true);
        setIsHovered(true);
      }}
      onMouseLeave={() => {
        setCursorHover(false);
        setIsHovered(false);
      }}
    >
      {/* Background shape */}
      <motion.div
        className="absolute inset-0 bg-black"
        variants={backgroundVariants}
        initial="initial"
        animate={isHovered ? "hover" : "initial"}
      >
        <AbstractShape
          className={cn(
            "w-full h-full",
            index % 3 === 0
              ? "text-purple-500/70"
              : index % 3 === 1
              ? "text-pink-500/70"
              : "text-blue-500/70"
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
      </motion.div>

      {/* Overlay gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-t from-black to-transparent"
        variants={overlayVariants}
        initial="initial"
        animate={isHovered ? "hover" : "initial"}
      />

      {/* Content */}
      <motion.div
        className="absolute bottom-0 left-0 p-6 z-20"
        variants={contentVariants}
        initial="initial"
        animate={isHovered ? "hover" : "initial"}
      >
        <PixelHeading
          text={`VOID SCENE ${index + 1}`}
          className="text-xl font-bold text-white mb-2"
        />
        <p className="text-gray-300 text-sm font-pixel">
          EXPLORE THE MYSTERIES OF THE VOID
        </p>

        {/* View button */}
        <motion.button
          className="mt-4 px-4 py-2 bg-purple-600/80 text-white text-xs flex items-center space-x-2 border border-purple-400/30 font-pixel"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span>VIEW DETAILS</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 12H19M19 12L12 5M19 12L12 19"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </motion.button>
      </motion.div>

      {/* Decorative elements */}
      <div className="absolute top-4 left-4 w-3 h-3 border-t border-l border-purple-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute top-4 right-4 w-3 h-3 border-t border-r border-purple-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-4 left-4 w-3 h-3 border-b border-l border-purple-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-4 right-4 w-3 h-3 border-b border-r border-purple-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
};

// Custom floating particles component
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

  // Generate particles only on the client side
  useEffect(() => {
    // Generate random particles only after component mounts (client-side)
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

const ScrollingTextSection = () => {
  const { scrollYProgress } = useScroll();
  const [hoverText, setHoverText] = useState<number | null>(null);
  const sectionRef = useRef(null);

  // More extreme scroll-based animations with varied ranges for staggered effect
  const textLine1X = useTransform(scrollYProgress, [0.05, 0.25], [0, -800]);
  const textLine2X = useTransform(scrollYProgress, [0.08, 0.28], [0, 700]);
  const textLine3X = useTransform(scrollYProgress, [0.12, 0.32], [0, -900]);
  const textLine4X = useTransform(scrollYProgress, [0.15, 0.35], [0, 800]);
  const textLine5X = useTransform(scrollYProgress, [0.18, 0.38], [0, -750]);

  // Background parallax effects
  const bgParallax1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const bgParallax2 = useTransform(scrollYProgress, [0, 1], [0, -200]);

  // Rotation and scale effects for enhanced dynamism
  const rotation1 = useTransform(scrollYProgress, [0.05, 0.25], [0, -2]);
  const rotation2 = useTransform(scrollYProgress, [0.08, 0.28], [0, 1.5]);
  const rotation3 = useTransform(scrollYProgress, [0.12, 0.32], [0, -1.8]);
  const scale1 = useTransform(scrollYProgress, [0.1, 0.3], [1, 1.05]);

  // Smoother movement with spring physics - varied settings for more organic feeling
  const smoothLine1X = useSpring(textLine1X, { stiffness: 90, damping: 20 });
  const smoothLine2X = useSpring(textLine2X, { stiffness: 80, damping: 25 });
  const smoothLine3X = useSpring(textLine3X, { stiffness: 70, damping: 20 });
  const smoothLine4X = useSpring(textLine4X, { stiffness: 75, damping: 15 });
  const smoothLine5X = useSpring(textLine5X, { stiffness: 85, damping: 30 });

  const smoothRotation1 = useSpring(rotation1, { stiffness: 60, damping: 15 });
  const smoothRotation2 = useSpring(rotation2, { stiffness: 60, damping: 15 });
  const smoothRotation3 = useSpring(rotation3, { stiffness: 60, damping: 15 });
  const smoothScale1 = useSpring(scale1, { stiffness: 70, damping: 20 });

  // Enhanced animation for content reveal with sequence
  const contentOpacity = useTransform(scrollYProgress, [0.05, 0.15], [0, 1]);
  const contentY = useTransform(scrollYProgress, [0.05, 0.15], [100, 0]);

  // Glitch effect state for random text distortion
  const [glitchIndices, setGlitchIndices] = useState<number[]>([]);

  // Letters for glitch effect
  const glitchLetters = "01XYZABC#$@%&!?*";

  useEffect(() => {
    const glitchInterval = setInterval(() => {
      // Random number of characters to glitch (1-5)
      const numGlitches = Math.floor(Math.random() * 5) + 1;

      // Create random indices
      const newGlitchIndices = Array.from({ length: numGlitches }, () =>
        Math.floor(Math.random() * 20)
      );

      setGlitchIndices(newGlitchIndices);

      // Reset after a short time
      setTimeout(() => {
        setGlitchIndices([]);
      }, 200);
    }, 2000);

    return () => clearInterval(glitchInterval);
  }, []);

  // Function to apply glitch effect to text
  const applyGlitchEffect = (text: string, lineIndex: number) => {
    if (glitchIndices.length === 0) return text;

    return text
      .split("")
      .map((char, i) => {
        // Check if this character should be glitched
        if (glitchIndices.includes((i + lineIndex * 5) % 20) && char !== " ") {
          // Replace with a random glitch character
          return glitchLetters[
            Math.floor(Math.random() * glitchLetters.length)
          ];
        }
        return char;
      })
      .join("");
  };

  // Scrolling progress indicator
  const progressBarWidth = useTransform(
    scrollYProgress,
    [0.05, 0.4],
    ["0%", "100%"]
  );

  // Text lines with more varied and intriguing content
  const textLines = [
    "NEW ERA OF GAMING. DIGITAL EVOLUTION. NEW AGE",
    "BORDERLESS EXPERIENCE. BEYOND DIMENSIONS.",
    "VOID UNIVERSE. INFINITE POSSIBILITIES. VOID",
    "REALITY REDEFINED. PERCEPTION ALTERED. GAMING",
    "BEYOND EXISTENCE. TRANSCEND REALITY. EVOLVE.",
  ];

  return (
    <section
      ref={sectionRef}
      className="relative py-32 bg-black overflow-hidden"
    >
      {/* Background gradients with parallax */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-black to-purple-950/30 z-0 opacity-70"
        style={{ y: bgParallax1 }}
      />

      <motion.div
        className="absolute inset-0 z-0 overflow-hidden"
        style={{ y: bgParallax2 }}
      >
        {/* Animated mesh grid background */}
        <div className="absolute inset-0 grid grid-cols-[repeat(40,1fr)] grid-rows-[repeat(40,1fr)] opacity-20">
          {Array.from({ length: 1600 }).map((_, i) => (
            <motion.div
              key={`grid-${i}`}
              className="border border-purple-500/10"
              animate={{
                borderColor:
                  i % 20 === 0
                    ? [
                        "rgba(168, 85, 247, 0.1)",
                        "rgba(168, 85, 247, 0.3)",
                        "rgba(168, 85, 247, 0.1)",
                      ]
                    : undefined,
              }}
              transition={{
                duration: 3 + (i % 5),
                repeat: Infinity,
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Enhanced vertical light beams */}
      <div className="absolute inset-0 z-1 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.div
            key={`beam-${i}`}
            className="absolute top-0 bottom-0 w-px bg-gradient-to-b from-purple-500/0 via-purple-500/30 to-purple-500/0"
            style={{
              left: `${15 + i * 18}%`,
              opacity: 0.4 + (i % 3) * 0.2,
            }}
            animate={{
              opacity: [0.2, 0.6, 0.2],
              height: ["70%", "90%", "70%"],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

      {/* Digital scan line effect */}
      <motion.div
        className="absolute inset-0 z-2 pointer-events-none overflow-hidden"
        initial={{ opacity: 0.15 }}
        animate={{ opacity: [0.15, 0.2, 0.15] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {Array.from({ length: 50 }).map((_, i) => (
          <motion.div
            key={`scanline-${i}`}
            className="w-full h-px bg-gradient-to-r from-purple-500/0 via-purple-500/30 to-purple-500/0"
            style={{
              top: `${i * 2}%`,
              position: "absolute",
              boxShadow: "0 0 2px rgba(168, 85, 247, 0.3)",
              filter: "blur(0.5px)",
            }}
          />
        ))}
      </motion.div>

      <div className="absolute inset-0 z-5 overflow-hidden">
        {/* Text rows that move horizontally as user scrolls - enhanced with rotation and scale */}
        <motion.div
          className="whitespace-nowrap text-[160px] leading-none font-bold text-gray-900 opacity-70 py-4 font-pixel transform-gpu"
          style={{
            x: smoothLine1X,
            rotate: smoothRotation1,
            scale: smoothScale1,
            transformOrigin: "left center",
          }}
          onMouseEnter={() => setHoverText(0)}
          onMouseLeave={() => setHoverText(null)}
        >
          <motion.span
            animate={
              hoverText === 0
                ? {
                    color: ["#111111", "#332244", "#111111"],
                  }
                : {}
            }
            transition={{ duration: 1.5 }}
          >
            {applyGlitchEffect(textLines[0], 0)}
          </motion.span>
        </motion.div>

        <motion.div
          className="whitespace-nowrap text-[160px] leading-none font-bold text-gray-900 opacity-70 py-4 font-pixel transform-gpu"
          style={{
            x: smoothLine2X,
            rotate: smoothRotation2,
            transformOrigin: "right center",
          }}
          onMouseEnter={() => setHoverText(1)}
          onMouseLeave={() => setHoverText(null)}
        >
          <motion.span
            animate={
              hoverText === 1
                ? {
                    color: ["#111111", "#442266", "#111111"],
                  }
                : {}
            }
            transition={{ duration: 1.5 }}
          >
            {applyGlitchEffect(textLines[1], 1)}
          </motion.span>
        </motion.div>

        <motion.div
          className="whitespace-nowrap text-[160px] leading-none font-bold text-gray-900 opacity-70 py-4 font-pixel transform-gpu"
          style={{
            x: smoothLine3X,
            rotate: smoothRotation3,
            scale: smoothScale1,
            transformOrigin: "left center",
          }}
          onMouseEnter={() => setHoverText(2)}
          onMouseLeave={() => setHoverText(null)}
        >
          <motion.span
            animate={
              hoverText === 2
                ? {
                    color: ["#111111", "#663399", "#111111"],
                  }
                : {}
            }
            transition={{ duration: 1.5 }}
          >
            {applyGlitchEffect(textLines[2], 2)}
          </motion.span>
        </motion.div>

        <motion.div
          className="whitespace-nowrap text-[160px] leading-none font-bold text-gray-900 opacity-70 py-4 font-pixel transform-gpu"
          style={{
            x: smoothLine4X,
            transformOrigin: "right center",
          }}
          onMouseEnter={() => setHoverText(3)}
          onMouseLeave={() => setHoverText(null)}
        >
          <motion.span
            animate={
              hoverText === 3
                ? {
                    color: ["#111111", "#442266", "#111111"],
                  }
                : {}
            }
            transition={{ duration: 1.5 }}
          >
            {applyGlitchEffect(textLines[3], 3)}
          </motion.span>
        </motion.div>

        <motion.div
          className="whitespace-nowrap text-[160px] leading-none font-bold text-gray-900 opacity-70 py-4 font-pixel transform-gpu"
          style={{
            x: smoothLine5X,
            transformOrigin: "left center",
          }}
          onMouseEnter={() => setHoverText(4)}
          onMouseLeave={() => setHoverText(null)}
        >
          <motion.span
            animate={
              hoverText === 4
                ? {
                    color: ["#111111", "#332244", "#111111"],
                  }
                : {}
            }
            transition={{ duration: 1.5 }}
          >
            {applyGlitchEffect(textLines[4], 4)}
          </motion.span>
        </motion.div>
      </div>

      {/* Enhanced animated particles - more variety and animation types */}
      <div className="absolute inset-0 z-4 overflow-hidden pointer-events-none">
        {/* Square particles */}
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={`square-particle-${i}`}
            className="absolute bg-purple-500"
            style={{
              width: `${3 + Math.random() * 7}px`,
              height: `${3 + Math.random() * 7}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: 0.3 + Math.random() * 0.4,
              boxShadow: "0 0 3px rgba(168, 85, 247, 0.6)",
            }}
            animate={{
              x: [0, Math.random() * 150 - 75],
              y: [0, Math.random() * 150 - 75],
              opacity: [0.3, 0.7, 0.3],
              rotate: [0, Math.random() * 180],
            }}
            transition={{
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        ))}

        {/* Line particles */}
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={`line-particle-${i}`}
            className="absolute bg-pink-500"
            style={{
              width: `${1 + Math.random() * 2}px`,
              height: `${10 + Math.random() * 20}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: 0.3 + Math.random() * 0.3,
              boxShadow: "0 0 3px rgba(236, 72, 153, 0.5)",
            }}
            animate={{
              x: [0, Math.random() * 120 - 60],
              y: [0, Math.random() * 120 - 60],
              opacity: [0.3, 0.6, 0.3],
              rotate: [0, 360],
              scale: [1, 1 + Math.random() * 0.5, 1],
            }}
            transition={{
              duration: 7 + Math.random() * 4,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        ))}

        {/* Circle particles */}
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={`circle-particle-${i}`}
            className="absolute rounded-full bg-blue-500"
            style={{
              width: `${4 + Math.random() * 6}px`,
              height: `${4 + Math.random() * 6}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: 0.3 + Math.random() * 0.3,
              boxShadow: "0 0 4px rgba(59, 130, 246, 0.5)",
            }}
            animate={{
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 6 + Math.random() * 5,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex justify-center items-center min-h-[80vh]">
          <motion.div
            className="max-w-4xl text-center relative"
            style={{
              opacity: contentOpacity,
              y: contentY,
            }}
          >
            {/* Digital glitch effect overlay */}
            <motion.div
              className="absolute -inset-10 opacity-10 pointer-events-none"
              animate={{
                background: [
                  "radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, rgba(0, 0, 0, 0) 70%)",
                  "radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, rgba(0, 0, 0, 0) 70%)",
                  "radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, rgba(0, 0, 0, 0) 70%)",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />

            <PixelHeading
              text="THE NEXT STAGE"
              className="text-7xl md:text-8xl font-black tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-500 to-pink-600"
            />

            {/* Enhanced animated separator with particles */}
            <div className="relative h-2 mx-auto mb-10 overflow-hidden">
              <motion.div
                className="h-2 bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500"
                initial={{ width: "0%" }}
                whileInView={{ width: "80%" }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                viewport={{ once: true }}
              />

              {/* Animated light beam on the line */}
              <motion.div
                className="absolute top-0 left-0 h-full w-20 bg-white/70 blur-sm"
                animate={{
                  x: ["-100%", "500%"],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
              />

              {/* Floating particles above line */}
              {Array.from({ length: 5 }).map((_, i) => (
                <motion.div
                  key={`line-dot-${i}`}
                  className="absolute bg-white rounded-full w-1 h-1"
                  style={{
                    left: `${15 + i * 15}%`,
                    top: i % 2 === 0 ? -4 : 4,
                  }}
                  animate={{
                    y: [0, i % 2 === 0 ? -5 : 5, 0],
                    opacity: [0.5, 1, 0.5],
                    boxShadow: [
                      "0 0 2px rgba(255, 255, 255, 0.3)",
                      "0 0 4px rgba(255, 255, 255, 0.6)",
                      "0 0 2px rgba(255, 255, 255, 0.3)",
                    ],
                  }}
                  transition={{
                    duration: 1.5 + i * 0.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>

            {/* Enhanced description text */}
            <div className="mb-12 relative">
              <motion.p
                className="text-2xl text-white/90 font-pixel leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                viewport={{ once: true }}
              >
                VOID transcends conventional boundaries, merging art,
                technology, and perception. Shape the universe through your
                choices and forge a path uniquely your own.
              </motion.p>

              {/* Enhanced subtle digital noise overlay */}
              <motion.div
                className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-10"
                animate={{
                  backgroundPosition: ["0% 0%", "100% 100%"],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 250 250' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
                  backgroundSize: "150px 150px",
                }}
              />
            </div>

            {/* Enhanced feature cards with more interactive elements */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {[
                {
                  icon: "✧",
                  title: "IMMERSIVE",
                  desc: "Experience a sensory revolution",
                  color: "from-purple-400 to-blue-500",
                  delay: 0,
                },
                {
                  icon: "⬡",
                  title: "INNOVATIVE",
                  desc: "Powered by quantum algorithms",
                  color: "from-pink-500 to-purple-500",
                  delay: 0.2,
                },
                {
                  icon: "⟐",
                  title: "INTERACTIVE",
                  desc: "Your decisions reshape reality",
                  color: "from-blue-500 to-purple-500",
                  delay: 0.4,
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  className="relative group bg-black/60 border border-purple-500/40 p-6 backdrop-blur-sm overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: item.delay, duration: 0.8 }}
                  whileHover={{
                    y: -5,
                    boxShadow: "0 10px 30px -10px rgba(168, 85, 247, 0.3)",
                    borderColor: "rgba(168, 85, 247, 0.6)",
                  }}
                >
                  {/* Background glow effect */}
                  <motion.div
                    className="absolute -inset-px rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"
                    animate={{
                      background: [
                        `radial-gradient(circle at center, rgba(168, 85, 247, 0.15) 0%, rgba(0, 0, 0, 0) 70%)`,
                        `radial-gradient(circle at center, rgba(168, 85, 247, 0.25) 0%, rgba(0, 0, 0, 0) 70%)`,
                        `radial-gradient(circle at center, rgba(168, 85, 247, 0.15) 0%, rgba(0, 0, 0, 0) 70%)`,
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />

                  <div className="relative z-10">
                    <motion.div
                      className={`text-3xl mb-4 bg-gradient-to-r ${item.color} text-transparent bg-clip-text`}
                      whileHover={{ scale: 1.2, rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      {item.icon}
                    </motion.div>

                    <h3 className="text-xl mb-2 font-pixel text-white">
                      {item.title}
                    </h3>

                    <p className="text-sm text-gray-400 font-pixel">
                      {item.desc}
                    </p>

                    {/* Interactive corner elements */}
                    <motion.div
                      className="absolute top-0 right-0 w-0 h-0 border-t-8 border-r-8 border-transparent border-r-purple-500/0 group-hover:border-r-purple-500/70 transition-colors duration-500"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />

                    <motion.div
                      className="absolute bottom-0 left-0 w-0 h-0 border-b-8 border-l-8 border-transparent border-l-purple-500/0 group-hover:border-l-purple-500/70 transition-colors duration-500"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* New: Interactive scrolling progress indicator */}
            <div className="relative h-1 mx-auto w-40 mt-16 overflow-hidden">
              <div className="w-full h-full bg-gray-800/50"></div>
              <motion.div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500"
                style={{ width: progressBarWidth }}
              />

              <motion.div
                className="absolute -top-2 h-4 w-1 bg-white/80 rounded-full shadow-lg shadow-purple-500/50"
                style={{ left: progressBarWidth }}
              />

              <div className="absolute -top-8 left-0 text-xs font-mono text-purple-400">
                SECTOR_01
              </div>
              <div className="absolute -top-8 right-0 text-xs font-mono text-purple-400">
                SECTOR_02
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// Redesigned Roadmap Section with dark theme and proper scroll behavior
const RoadmapSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll();

  // Define roadmap items
  const roadmapItems = [
    {
      phase: "01",
      title: "LAUNCH OFFICIAL WEBSITE",
      items: ["START SOCIAL MEDIA", "START MARKETING"],
    },
    {
      phase: "02",
      title: "CONNECT WALLET",
      items: ["SOLANA INTEGRATION", "PROFILE CREATION", "SECURE ACCESS SYSTEM"],
    },
    {
      phase: "03",
      title: "3D CUBE CREATION",
      items: [
        "UNIQUE CUBE DESIGNS",
        "CUSTOMIZATION OPTIONS",
        "SPECIAL ABILITIES",
      ],
    },
    {
      phase: "04",
      title: "MUSIC NFTs",
      items: [
        "DYNAMIC SOUNDSCAPES",
        "INTERACTIVE AUDIO",
        "COMPOSER COLLABORATIONS",
      ],
    },
    {
      phase: "05",
      title: "NFT MINTING",
      items: [
        "LIMITED COLLECTIONS",
        "SPECIAL EDITIONS",
        "REALM-SPECIFIC ITEMS",
      ],
    },
    {
      phase: "06",
      title: "MARKETPLACE",
      items: ["NFT TRADING", "CUBE ENHANCEMENT", "COLLECTIBLE SHOWCASE"],
    },
    {
      phase: "07",
      title: "GAMEPLAY EXPANSION",
      items: [
        "MULTI-REALM ADVENTURES",
        "COMPETITIVE MODES",
        "COMMUNITY EVENTS",
      ],
    },
  ];

  // Set up scroll-based phase change with waypoints using useState and useEffect
  useEffect(() => {
    // Get the section element height to calculate waypoints
    if (!sectionRef.current) return;

    const unsubscribe = scrollYProgress.onChange((value) => {
      // If roadmap is in viewport (approx between 0.3-0.7 of scroll progress)
      if (value > 0.3 && value < 0.7) {
        // Map overall scroll to phases
        const scrollRange = 0.4; // 0.7 - 0.3
        const relativeProgress = (value - 0.3) / scrollRange;
        const newIndex = Math.min(
          Math.floor(relativeProgress * roadmapItems.length),
          roadmapItems.length - 1
        );

        // Only update if changed
        if (newIndex !== activeIndex) {
          setActiveIndex(newIndex);
        }
      }
    });

    return () => unsubscribe();
  }, [scrollYProgress, activeIndex]);

  return (
    <section
      ref={sectionRef}
      className="relative py-32 bg-black overflow-hidden"
      id="roadmap"
    >
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 text-center">
            <PixelHeading
              text="ROADMAP"
              className="text-6xl md:text-7xl font-black tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600"
            />
            <div className="w-40 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto"></div>
            <div className="mt-4 text-lg font-pixel text-purple-400 uppercase">
              PHASE__
              {activeIndex + 1 < 10 ? "0" + (activeIndex + 1) : activeIndex + 1}
            </div>
          </div>

          <div className="relative min-h-[50vh] flex items-center justify-center">
            {/* Left side phase numbers */}
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 flex flex-col items-start space-y-6">
              {roadmapItems.map((_, index) => (
                <motion.div
                  key={`left-num-${index}`}
                  className={`flex items-center ${
                    index === activeIndex ? "opacity-100" : "opacity-30"
                  }`}
                >
                  <motion.div
                    animate={{
                      scale: index === activeIndex ? [1, 1.2, 1] : 1,
                      opacity: index === activeIndex ? 1 : 0.3,
                    }}
                    transition={{
                      duration: 1,
                      repeat: index === activeIndex ? Infinity : 0,
                    }}
                    className="w-6 h-6 flex items-center justify-center"
                  >
                    {index === activeIndex ? (
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M5 12H19"
                          stroke="#a855f7"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path
                          d="M12 5L19 12L12 19"
                          stroke="#a855f7"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <div className="w-2 h-2 bg-purple-500/50"></div>
                    )}
                  </motion.div>
                  <div
                    className={`ml-2 font-mono text-sm text-purple-500 ${
                      index === activeIndex ? "font-bold" : ""
                    }`}
                  >
                    {(index + 1).toString().padStart(2, "0")}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Right side phase numbers */}
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 flex flex-col items-end space-y-6">
              {roadmapItems.map((_, index) => (
                <motion.div
                  key={`right-num-${index}`}
                  className={`flex items-center ${
                    index === activeIndex ? "opacity-100" : "opacity-30"
                  }`}
                >
                  <div
                    className={`mr-2 font-mono text-sm text-purple-500 ${
                      index === activeIndex ? "font-bold" : ""
                    }`}
                  >
                    {(index + 1).toString().padStart(2, "0")}
                  </div>
                  <motion.div
                    animate={{
                      scale: index === activeIndex ? [1, 1.2, 1] : 1,
                      opacity: index === activeIndex ? 1 : 0.3,
                    }}
                    transition={{
                      duration: 1,
                      repeat: index === activeIndex ? Infinity : 0,
                    }}
                    className="w-6 h-6 flex items-center justify-center"
                  >
                    {index === activeIndex ? (
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M19 12H5"
                          stroke="#a855f7"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path
                          d="M12 5L5 12L12 19"
                          stroke="#a855f7"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <div className="w-2 h-2 bg-purple-500/50"></div>
                    )}
                  </motion.div>
                </motion.div>
              ))}
            </div>

            {/* Main content with animations */}
            <div className="w-full max-w-5xl mx-auto">
              <AnimatePresence mode="wait">
                {roadmapItems.map(
                  (item, index) =>
                    index === activeIndex && (
                      <motion.div
                        key={`roadmap-${index}`}
                        className="w-full"
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -100 }}
                        transition={{ duration: 0.5 }}
                      >
                        <div className="text-center mb-8">
                          <motion.div
                            className="text-6xl md:text-7xl font-black mb-16 text-white font-pixel"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                          >
                            {item.title}
                          </motion.div>

                          <div className="mt-8 flex flex-col space-y-6">
                            {item.items.map((subItem, idx) => (
                              <motion.div
                                key={idx}
                                className="text-center"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: idx === 0 ? 1 : 0.6, y: 0 }}
                                transition={{
                                  delay: 0.4 + idx * 0.2,
                                  duration: 0.5,
                                }}
                              >
                                <p className="text-2xl md:text-3xl font-pixel text-gray-400">
                                  {subItem}
                                </p>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Progress indicators */}
          <div className="flex justify-center space-x-3 mt-14">
            {roadmapItems.map((_, idx) => (
              <motion.div
                key={`dot-${idx}`}
                className="group cursor-pointer"
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setActiveIndex(idx)}
              >
                <div
                  className={`w-4 h-4 border-2 ${
                    idx === activeIndex
                      ? "bg-purple-600 border-purple-400"
                      : "bg-transparent border-purple-600"
                  }`}
                />
                <motion.div
                  className={`w-4 h-4 absolute -mt-4 bg-purple-500/30 scale-0 group-hover:scale-100 transition-transform duration-200`}
                />
              </motion.div>
            ))}
          </div>

          {/* Background elements */}
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 grid grid-cols-[repeat(40,1fr)] grid-rows-[repeat(20,1fr)] opacity-10">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={`grid-${i}`}
                  className="border border-purple-500/10"
                  animate={{
                    borderColor:
                      i % 10 === 0
                        ? [
                            "rgba(168, 85, 247, 0.1)",
                            "rgba(168, 85, 247, 0.3)",
                            "rgba(168, 85, 247, 0.1)",
                          ]
                        : undefined,
                  }}
                  transition={{
                    duration: 3 + (i % 5),
                    repeat: Infinity,
                  }}
                />
              ))}
            </div>

            {/* Animated particles */}
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={`particle-${i}`}
                className="absolute rounded-none bg-purple-500"
                style={{
                  width: `${4 + Math.random() * 4}px`,
                  height: `${4 + Math.random() * 4}px`,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  opacity: 0.2 + Math.random() * 0.2,
                }}
                animate={{
                  x: [0, Math.random() * 50 - 25],
                  y: [0, Math.random() * 50 - 25],
                  opacity: [0.2, 0.3, 0.2],
                }}
                transition={{
                  duration: 5 + Math.random() * 5,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// Enhanced Fullscreen Ticket Section
const TicketSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center py-16 bg-black overflow-hidden">
      {/* Enhanced background particles - more of them */}
      <div className="absolute inset-0 z-0">
        {/* Large glowing circles in background */}
        <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] rounded-full bg-purple-900/10 blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[30vw] h-[30vw] rounded-full bg-pink-900/10 blur-3xl"></div>

        {/* Animated particles */}
        {Array.from({ length: 80 }).map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute rounded-none bg-purple-500"
            style={{
              width: `${1 + Math.random() * 4}px`,
              height: `${1 + Math.random() * 4}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: 0.2 + Math.random() * 0.4,
            }}
            animate={{
              x: [0, Math.random() * 80 - 40],
              y: [0, Math.random() * 80 - 40],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 5 + Math.random() * 10,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        ))}
      </div>

      {/* Grid overlay for background */}
      <div className="absolute inset-0 grid grid-cols-[repeat(40,1fr)] grid-rows-[repeat(40,1fr)] opacity-10 pointer-events-none">
        {Array.from({ length: 1600 }).map((_, i) => (
          <div key={`grid-${i}`} className="border border-purple-500/5" />
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10 max-w-6xl">
        {/* Section heading */}
        <div className="text-center mb-12">
          <PixelHeading
            text="JOIN THE VOID"
            className="text-5xl md:text-6xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600"
          />

          <motion.div
            className="h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto w-40 relative overflow-hidden"
            initial={{ width: "0%" }}
            animate={{ width: "200px" }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          >
            <motion.div
              className="absolute top-0 left-0 h-full w-20 bg-white/50"
              animate={{ x: [0, 200, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
        </div>

        {/* Enhanced ticket container - much bigger */}
        <motion.div
          className="relative overflow-hidden mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Main ticket content */}
          <div className="bg-black/80 backdrop-blur-sm border-2 border-purple-600 rounded-lg overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.15)]">
            <div className="relative p-8 md:p-12">
              {/* Ticket header - enhanced with more elements */}
              <div className="flex flex-col md:flex-row justify-between items-center mb-12 border-b border-purple-600/50 pb-8">
                <div className="flex items-center mb-6 md:mb-0">
                  <div>
                    <PixelHeading
                      text="JOIN US"
                      className="text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500"
                    />
                    <div className="text-purple-400 text-sm mt-1 font-pixel">
                      BECOME PART OF THE VOID UNIVERSE
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <div className="uppercase font-bold text-purple-400 text-lg">
                    ETERNAL PASS
                  </div>
                  <div className="text-gray-400 font-pixel text-sm">
                    (for void_collector)
                  </div>

                  {/* Serial number */}
                  <div className="mt-3 font-mono text-xs text-gray-500">
                    #VOID-
                    {Math.floor(Math.random() * 10000)
                      .toString()
                      .padStart(4, "0")}
                  </div>
                </div>
              </div>

              {/* Ticket content - restructured for more space */}
              <div className="flex flex-col md:flex-row">
                {/* Left section - expanded with more details */}
                <div className="flex-1 border-r border-purple-600/30 pr-6 md:pr-16">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                    <div className="space-y-2">
                      <div className="text-sm text-purple-400 uppercase font-pixel">
                        DATE
                      </div>
                      <div className="text-2xl font-bold text-white">
                        RIGHT NOW
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm text-purple-400 uppercase font-pixel">
                        PROJECT
                      </div>
                      <div className="text-2xl font-bold text-white">
                        VOID
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm text-purple-400 uppercase font-pixel">
                        PLACE
                      </div>
                      <div className="text-2xl font-bold text-white">
                        OUR X ACCOUNT
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm text-purple-400 uppercase font-pixel">
                        SEAT
                      </div>
                      <div className="text-2xl font-bold text-white">
                        FIRST CLASS
                      </div>
                    </div>
                  </div>

                  {/* Benefits list - new section */}
                  <div className="mt-12">
                    <div className="text-sm text-purple-400 uppercase font-pixel mb-4">
                      BENEFITS
                    </div>
                    <div className="space-y-4">
                      {[
                        "EXCLUSIVE ACCESS TO FUTURE DROPS",
                        "EARLY NOTIFICATIONS FOR NEW RELEASES",
                        "COMMUNITY PRIVILEGES & SPECIAL EVENTS",
                      ].map((benefit, idx) => (
                        <div key={idx} className="flex items-start">
                          <div className="w-4 h-4 mr-3 bg-purple-600 mt-1 flex-shrink-0"></div>
                          <div className="text-gray-300 font-pixel text-sm">
                            {benefit}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right section - enhanced for more impact */}
                <div className="mt-12 md:mt-0 md:w-2/5 md:pl-16 flex flex-col items-center justify-center">
                  {/* QR Code placeholder with enhanced glowing effect */}
                  <div className="relative">
                    <motion.div
                      className="absolute -inset-4 bg-purple-500/20 blur-xl rounded-full"
                      animate={{
                        opacity: [0.2, 0.5, 0.2],
                        scale: [0.95, 1.05, 0.95],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                      }}
                    />
                    <div className="relative w-48 h-48 border-2 border-purple-500 p-2 mb-6">
                      <div className="w-full h-full grid grid-cols-10 grid-rows-10 gap-px bg-black">
                        {Array.from({ length: 100 }).map((_, i) => (
                          <div
                            key={`qr-${i}`}
                            className={`${
                              Math.random() > 0.5 ? "bg-purple-500" : "bg-black"
                            }`}
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="text-center text-lg font-bold text-purple-400 font-pixel mb-8">
                    @VOID_COLLECTOR
                  </div>

                  {/* Enhanced button with X link */}
                  <motion.a
                    href="https://x.com/VOID_COLLECTOR" // Replace with your actual X profile URL
                    target="_blank" // Opens in a new tab
                    rel="noopener noreferrer" // Security best practice for external links
                    className="bg-transparent border-2 border-purple-500 text-white py-4 px-10 flex items-center justify-center font-pixel relative overflow-hidden group cursor-pointer"
                    whileHover={{
                      backgroundColor: "rgba(168, 85, 247, 0.2)",
                      boxShadow: "0 0 20px rgba(168, 85, 247, 0.5)",
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Button glow effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-purple-600/20 to-purple-600/0 -translate-x-full"
                      animate={{
                        x: ["0%", "200%"],
                      }}
                      transition={{
                        duration: 1.5,
                        ease: "easeInOut",
                        repeat: Infinity,
                        repeatDelay: 1,
                      }}
                    />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-3"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    FOLLOW US
                  </motion.a>
                </div>
              </div>
            </div>
          </div>

          {/* Corner decorative elements - larger and more pronounced */}
          <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-purple-500"></div>
          <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-purple-500"></div>
          <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-purple-500"></div>
          <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-purple-500"></div>

          {/* Dashed perforation line */}
          <div className="absolute top-0 bottom-0 md:left-[60%] w-0 border-l-2 border-dashed border-purple-600/50"></div>
        </motion.div>
      </div>
    </section>
  );
};

// Improved VOID Logo Section with pixel style background
const VoidLogoSection = () => {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Thin static lines */}
      <div className="absolute inset-0 z-5 opacity-20">
        <div className="absolute h-full w-px bg-purple-500 left-[10%]"></div>
        <div className="absolute h-full w-px bg-purple-500 right-[10%]"></div>
        <div className="absolute w-full h-px bg-purple-500 top-[10%]"></div>
        <div className="absolute w-full h-px bg-purple-500 bottom-[10%]"></div>
      </div>

      {/* Fullscreen VOID text with neon effect */}
      <div className="relative z-10 flex items-center justify-center w-full h-full">
        {/* Main glowing text */}
        <motion.div
          className="text-[30vh] md:text-[40vh] font-pixel text-transparent font-black leading-none"
          style={{
            WebkitTextStroke: "2px rgba(216, 180, 254, 0.9)",
            filter:
              "drop-shadow(0 0 15px rgba(168, 85, 247, 0.8)) drop-shadow(0 0 40px rgba(139, 92, 246, 0.6))",
          }}
          animate={{
            filter: [
              "drop-shadow(0 0 15px rgba(168, 85, 247, 0.8)) drop-shadow(0 0 40px rgba(139, 92, 246, 0.6))",
              "drop-shadow(0 0 20px rgba(168, 85, 247, 1)) drop-shadow(0 0 60px rgba(139, 92, 246, 0.8))",
              "drop-shadow(0 0 15px rgba(168, 85, 247, 0.8)) drop-shadow(0 0 40px rgba(139, 92, 246, 0.6))",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          VOID
        </motion.div>
      </div>
    </section>
  );
};

// Main Home component
export default function Home() {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [cursorHover, setCursorHover] = useState(false);
  const [scrollIndicator, setScrollIndicator] = useState(true);

  const containerRef = useRef(null);
  const aboutRef = useRef(null);
  const featuresRef = useRef(null);
  const galleryRef = useRef(null);

  const { scrollYProgress } = useScroll();

  // Parallax and scroll-based animations
  const aboutTitleX = useTransform(
    scrollYProgress,
    [0.1, 0.2, 0.3],
    [-200, 0, 0]
  );
  const featuresTitleX = useTransform(
    scrollYProgress,
    [0.3, 0.4, 0.5],
    [200, 0, 0]
  );
  const galleryTitleX = useTransform(
    scrollYProgress,
    [0.5, 0.6, 0.7],
    [-200, 0, 0]
  );

  // Smoother parallax values with spring physics
  const smoothAboutTitleX = useSpring(aboutTitleX, {
    stiffness: 100,
    damping: 30,
  });
  const smoothFeaturesTitleX = useSpring(featuresTitleX, {
    stiffness: 100,
    damping: 30,
  });
  const smoothGalleryTitleX = useSpring(galleryTitleX, {
    stiffness: 100,
    damping: 30,
  });

  // For background parallax effects
  const bgY1 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const bgY2 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const bgY3 = useTransform(scrollYProgress, [0, 1], [0, -300]);

  // Hide scroll indicator after scrolling
  useEffect(() => {
    const unsubscribe = scrollYProgress.onChange((v) => {
      if (v > 0.05) setScrollIndicator(false);
      else setScrollIndicator(true);
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  // Handle cursor effects
  useEffect(() => {
    const handleMouseMove = (e: { clientX: any; clientY: any }) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="relative bg-black text-white overflow-hidden font-pixel">
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

      {/* Hero Section with 3D Banner */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* 3D Banner */}
        <Banner3D />
      </section>

      {/* New Enhanced Scrolling Text Section */}
      <ScrollingTextSection />

      {/* About Section with parallax effects */}
      <section
        id="about"
        ref={aboutRef}
        className="relative py-32 overflow-hidden font-pixel"
      >
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

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-7xl mx-auto">
            <motion.div style={{ x: smoothAboutTitleX }} className="mb-20">
              <PixelHeading
                text="THE EXPERIENCE"
                className="text-5xl md:text-6xl font-black tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600"
              />

              {/* Animated separator line */}
              <div className="relative h-1 w-60">
                <div className="w-full h-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
                <motion.div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500"
                  style={{ width: "30%" }}
                  animate={{
                    x: ["-100%", "250%"],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <div className="relative perspective-1000">
                  {/* Interactive 3D shape */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative"
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                  >
                    <div className="absolute -inset-4 bg-gradient-to-r from-purple-500 to-pink-500 opacity-30 blur-lg"></div>
                    <div className="relative aspect-square overflow-hidden">
                      <PixelVoidCube className="w-full h-full" />

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
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true, margin: "-100px" }}
                className="font-pixel"
              >
                <PixelHeading
                  text="BEYOND BOUNDARIES"
                  className="text-2xl md:text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500"
                />
                <p className="text-xl text-gray-300 mb-8 leading-relaxed font-pixel">
                  VOID transcends traditional gaming experiences, blurring the
                  line between art and interaction. Each moment is a carefully
                  crafted journey through abstract landscapes and emotional
                  resonance.
                </p>

                <div className="space-y-6">
                  {[
                    {
                      title: "IMMERSIVE WORLDS",
                      description:
                        "Explore surreal environments that respond to your presence",
                    },
                    {
                      title: "EMOTIONAL JOURNEY",
                      description:
                        "Experience a narrative that adapts to your unique path",
                    },
                    {
                      title: "ARTISTIC VISION",
                      description:
                        "Witness visuals that challenge perception and inspire wonder",
                    },
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      className="flex items-start group font-pixel"
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 + index * 0.2 }}
                      viewport={{ once: true }}
                      whileHover={{ x: 5 }}
                    >
                      <motion.div
                        className="mr-4 mt-1"
                        animate={{ rotate: [0, 360] }}
                        transition={{
                          duration: 10,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <motion.div
                          className="w-4 h-4 bg-purple-500"
                          whileHover={{
                            scale: [1, 1.5, 1],
                            rotate: [0, 180, 0],
                          }}
                          transition={{ duration: 1 }}
                        />
                      </motion.div>
                      <div>
                        <h4 className="text-xl font-bold text-white mb-1 font-pixel group-hover:text-purple-400 transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-gray-400 font-pixel">
                          {item.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section with enhanced cards */}
      <section
        ref={featuresRef}
        className="relative py-32 overflow-hidden font-pixel"
      >
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
          <motion.div style={{ x: smoothFeaturesTitleX }} className="mb-20">
            <PixelHeading
              text="FEATURES"
              className="text-5xl md:text-6xl font-black tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-600"
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
              <FeatureCard
                key={index}
                index={index}
                feature={feature}
                setCursorHover={setCursorHover}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Updated Roadmap Section */}
      <RoadmapSection />

      {/* Gallery Section with enhanced cards */}
      <section ref={galleryRef} className="relative py-32 font-pixel">
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
          <motion.div style={{ x: smoothGalleryTitleX }} className="mb-20">
            <PixelHeading
              text="GALLERY"
              className="text-5xl md:text-6xl font-black tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-pink-600"
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <GalleryCard
                key={index}
                index={index}
                setCursorHover={setCursorHover}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section with enhanced effects */}
      <section className="relative py-32 overflow-hidden font-pixel">
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
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 5, repeat: Infinity }}
          />

          <motion.div
            className="absolute w-64 h-64 rounded-full border border-pink-500/20"
            style={{
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
          />

          <motion.div
            className="absolute"
            style={{
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          >
            <motion.div
              className="w-2 h-2 bg-purple-500 rounded-full absolute"
              style={{
                top: "0px",
                left: "0px",
                transform: "translate(-50%, -50%)",
              }}
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />

            <motion.div
              className="w-2 h-2 bg-pink-500 rounded-full absolute"
              style={{
                bottom: "0px",
                right: "0px",
                transform: "translate(50%, 50%)",
              }}
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            />
          </motion.div>
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
                className="text-3xl md:text-4xl font-black tracking-tighter mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500"
              />
              <p className="text-xl md:text-2xl text-gray-300 mb-10 font-pixel">
                BEGIN YOUR JOURNEY INTO THE VOID
              </p>

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

                {/* Button decorative corners */}
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

      <TicketSection />

      {/* Full Screen VOID Logo Section */}
      <VoidLogoSection />

      {/* Footer */}
      <Footer />

      {/* Global styles for animations */}
      <style jsx global>{`
        .font-pixel {
          font-family: "Press Start 2P", monospace;
          letter-spacing: 0.05em;
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s infinite ease-in-out;
        }

        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 0.95;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.02);
          }
        }

        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </div>
  );
}
