"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  AnimatePresence,
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
      className="relative group perspective-1000"
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

        <p className="text-gray-400 leading-relaxed">{feature.description}</p>

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
      className="group relative overflow-hidden aspect-[4/3]"
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
          className="mt-4 px-4 py-2 bg-purple-600/80 text-white text-xs flex items-center space-x-2 border border-purple-400/30"
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

      {/* About Section with parallax effects */}
      <section
        id="about"
        ref={aboutRef}
        className="relative py-32 overflow-hidden"
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
                className="text-7xl md:text-8xl font-black tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600"
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
                      <AbstractShape
                        className="w-full h-full text-purple-500"
                        type="complex"
                        animate
                      />

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
              >
                <PixelHeading
                  text="BEYOND BOUNDARIES"
                  className="text-4xl md:text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500"
                />
                <p className="text-xl text-gray-300 mb-8 leading-relaxed">
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
                      className="flex items-start group"
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
                        <p className="text-gray-400">{item.description}</p>
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
      <section ref={featuresRef} className="relative py-32 overflow-hidden">
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

      {/* Gallery Section with enhanced cards */}
      <section ref={galleryRef} className="relative py-32">
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
                className="text-6xl md:text-7xl font-black tracking-tighter mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500"
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

      {/* Footer */}
      <Footer />

      {/* Global styles for animations */}
      <style jsx global>{`
        @font-face {
          font-family: "PixelFont";
          src: url("/pixel-font.woff2") format("woff2");
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }

        .font-pixel {
          font-family: "PixelFont", monospace;
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
