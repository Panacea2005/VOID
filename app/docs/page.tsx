"use client";

import { useState, useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import AbstractShape from "@/components/abstract-shape";
import PixelHeading from "@/components/pixel-heading";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";

// DocSection component for different styled sections
interface DocSectionProps {
  title: string;
  description: string;
  icon:
    | "circle"
    | "grid"
    | "square"
    | "dots"
    | "wave"
    | "triangle"
    | "complex"
    | "noise"
    | "loading"
    | "gamepad";
  color: "purple" | "pink" | "blue";
  index: number;
}

const DocSection: React.FC<DocSectionProps> = ({
  title,
  description,
  icon,
  color,
  index,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Define color classes based on color prop
  const colorClasses = {
    purple: {
      bg: "bg-purple-500/20",
      text: "text-purple-500",
      border: "border-purple-500/50",
      gradient: "from-purple-400 to-purple-600",
    },
    pink: {
      bg: "bg-pink-500/20",
      text: "text-pink-500",
      border: "border-pink-500/50",
      gradient: "from-pink-400 to-pink-600",
    },
    blue: {
      bg: "bg-blue-500/20",
      text: "text-blue-500",
      border: "border-blue-500/50",
      gradient: "from-blue-400 to-blue-600",
    },
  };

  const colorClass = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: index * 0.2 }}
      viewport={{ once: true, margin: "-50px" }}
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glow effect */}
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
      <div
        className={`relative bg-black/80 border ${colorClass.border} p-6 h-full z-10`}
      >
        <div className="flex items-start mb-4">
          <div
            className={`w-12 h-12 ${colorClass.bg} mr-4 overflow-hidden group-hover:animate-pulse-slow`}
          >
            <AbstractShape
              className={`w-full h-full ${colorClass.text}`}
              type={icon}
              animate
            />
          </div>
          <div>
            <h3
              className={`text-xl font-bold mb-1 text-transparent bg-clip-text bg-gradient-to-r ${colorClass.gradient}`}
            >
              {title}
            </h3>
          </div>
        </div>

        <p className="text-gray-300 text-sm leading-relaxed">{description}</p>

        {/* Interactive elements */}
        <div className="mt-4 pt-4 border-t border-purple-900/30 flex justify-between items-center">
          <motion.div
            className={`px-3 py-1 text-xs ${colorClass.text} border ${colorClass.border} opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1`}
            animate={{ y: isHovered ? 0 : 10, opacity: isHovered ? 1 : 0 }}
            initial={{ y: 10, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <span>READ MORE</span>
            <svg
              width="12"
              height="12"
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
          </motion.div>
        </div>
      </div>

      {/* Corner decorations */}
      <div
        className={`absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 ${colorClass.border} opacity-0 group-hover:opacity-100 transition-opacity`}
      />
      <div
        className={`absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 ${colorClass.border} opacity-0 group-hover:opacity-100 transition-opacity`}
      />
      <div
        className={`absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 ${colorClass.border} opacity-0 group-hover:opacity-100 transition-opacity`}
      />
      <div
        className={`absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 ${colorClass.border} opacity-0 group-hover:opacity-100 transition-opacity`}
      />
    </motion.div>
  );
};

// Feature showcase component with animation
interface FeatureShowcaseProps {
  title: string;
  description: string;
  features: string[];
  color: "purple" | "pink" | "blue";
  index: number;
}

const FeatureShowcase: React.FC<FeatureShowcaseProps> = ({
  title,
  description,
  features,
  color,
  index,
}) => {
  const colorClasses = {
    purple: {
      bg: "bg-purple-500/20",
      text: "text-purple-500",
      border: "border-purple-500/50",
      gradient: "from-purple-400 to-purple-600",
    },
    pink: {
      bg: "bg-pink-500/20",
      text: "text-pink-500",
      border: "border-pink-500/50",
      gradient: "from-pink-400 to-pink-600",
    },
    blue: {
      bg: "bg-blue-500/20",
      text: "text-blue-500",
      border: "border-blue-500/50",
      gradient: "from-blue-400 to-blue-600",
    },
  };

  const colorClass = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: index * 0.2 }}
      viewport={{ once: true, margin: "-50px" }}
      className={`border ${colorClass.border} p-6 relative overflow-hidden`}
    >
      {/* Animated background lines */}
      <div className="absolute inset-0 opacity-10">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={`line-${i}`}
            className="absolute h-px w-full bg-gradient-to-r from-transparent via-white to-transparent"
            style={{ top: `${i * 10}%` }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              left: ["-100%", "200%"],
            }}
            transition={{
              opacity: { duration: 3, repeat: Infinity },
              left: { duration: 10, repeat: Infinity, ease: "linear" },
              delay: i * 0.2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10">
        <h3
          className={`text-xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r ${colorClass.gradient}`}
        >
          {title}
        </h3>

        <p className="text-gray-300 mb-6 text-sm">{description}</p>

        <div className="space-y-3">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 + 0.3 }}
              viewport={{ once: true }}
              className="flex items-center"
            >
              <div className={`h-2 w-2 ${colorClass.bg} mr-2`}></div>
              <span className="text-gray-300 text-sm">{feature}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Decorative element */}
      <div
        className={`absolute bottom-0 right-0 w-32 h-32 opacity-10 -rotate-12`}
      >
        <AbstractShape
          className={colorClass.text}
          type={index % 3 === 0 ? "grid" : index % 3 === 1 ? "dots" : "wave"}
          animate
        />
      </div>
    </motion.div>
  );
};

// Sidebar navigation component
// Sidebar navigation component
const DocsSidebar = ({ activeSection }: { activeSection: string }) => {
  const sections = [
    { id: "overview", label: "OVERVIEW" },
    { id: "game", label: "GAME" },
    { id: "ai", label: "AI" },
    { id: "gallery", label: "GALLERY" },
    { id: "realm", label: "REALM" },
    { id: "art", label: "ART" },
    { id: "market", label: "MARKET" },
    { id: "rubiks", label: "RUBIKS" },
    { id: "canvas", label: "CANVAS" },
  ];

  return (
    <div className="w-80 border-r border-purple-900/30 h-full py-8 px-4 hidden lg:block">
      <div className="sticky top-24">
        <PixelHeading
          text="VOID Docs"
          className="text-xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500"
        />

        <div className="space-y-1">
          {sections.map((section) => (
            <Link
              key={section.id}
              href={`/docs/${section.id === "overview" ? "" : section.id}`}
              className={`block py-2 px-3 text-sm transition-colors duration-200 ${
                activeSection === section.id
                  ? "bg-purple-500/20 text-white border-l-2 border-purple-500"
                  : "text-gray-400 hover:text-white hover:bg-purple-900/20"
              }`}
            >
              {section.label}
            </Link>
          ))}
        </div>

        {/* Decorative element */}
        <div className="mt-8 w-full h-px bg-gradient-to-r from-purple-500/50 to-transparent"></div>

        <div className="mt-8 p-4 border border-purple-900/30 bg-purple-900/10">
          <p className="text-gray-400 text-xs mb-4">
            Need more help with the VOID platform?
          </p>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs border-purple-500/50 text-purple-400 hover:bg-purple-950/30"
          >
            CONTACT SUPPORT
          </Button>
        </div>
      </div>
    </div>
  );
};

// Mobile sidebar toggle
const MobileSidebarToggle = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="lg:hidden fixed bottom-6 right-6 w-12 h-12 rounded-full bg-purple-500 text-white flex items-center justify-center z-50 shadow-lg"
  >
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 6H21M3 12H21M3 18H21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </button>
);

// Mobile sidebar dropdown
const MobileSidebar = ({
  isOpen,
  onClose,
  activeSection,
}: {
  isOpen: boolean;
  onClose: () => void;
  activeSection: string;
}) => {
  const sections = [
    { id: "overview", label: "OVERVIEW" },
    { id: "game", label: "GAME" },
    { id: "ai", label: "AI" },
    { id: "gallery", label: "GALLERY" },
    { id: "realm", label: "REALM" },
    { id: "art", label: "ART" },
    { id: "market", label: "MARKET" },
    { id: "rubiks", label: "RUBIKS" },
    { id: "canvas", label: "CANVAS" },
  ];

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 lg:hidden"
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        className="absolute right-0 top-0 h-full w-64 bg-black border-l border-purple-900/50 p-6"
      >
        <div className="flex justify-between items-center mb-6">
          <PixelHeading
            text="VOID Docs"
            className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500"
          />

          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-1">
          {sections.map((section) => (
            <Link
              key={section.id}
              href={`/docs/${section.id === "overview" ? "" : section.id}`}
              className={`block py-2 px-3 text-sm transition-colors duration-200 ${
                activeSection === section.id
                  ? "bg-purple-500/20 text-white border-l-2 border-purple-500"
                  : "text-gray-400 hover:text-white hover:bg-purple-900/20"
              }`}
              onClick={onClose}
            >
              {section.label}
            </Link>
          ))}
        </div>
      </motion.div>
    </motion.div>
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

  const particles: Particle[] = Array.from({ length: 20 }).map((_, i) => ({
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

export default function DocsPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const containerRef = useRef(null);

  // Mock data for documentation sections
  const docSections: Array<{
    title: string;
    description: string;
    icon:
      | "circle"
      | "grid"
      | "square"
      | "dots"
      | "wave"
      | "triangle"
      | "complex"
      | "noise"
      | "loading"
      | "gamepad";
    color: "purple" | "pink" | "blue";
  }> = [
    {
      title: "GAME",
      description:
        "Explore the various games available in the VOID ecosystem, from immersive VR experiences to browser-based adventures.",
      icon: "grid",
      color: "purple",
    },
    {
      title: "AI",
      description:
        "Learn about the AI systems that power asset generation, gameplay adaptation, and personalized experiences.",
      icon: "dots",
      color: "pink",
    },
    {
      title: "GALLERY",
      description:
        "View and share creations in our community gallery, featuring the best artwork and assets from the VOID.",
      icon: "wave",
      color: "blue",
    },
    {
      title: "REALM",
      description:
        "Understand the interconnected world of VOID, where multiple games share a common universe and economy.",
      icon: "grid",
      color: "purple",
    },
    {
      title: "ART",
      description:
        "Discover the tools and techniques for creating unique digital art that can be minted as NFTs within our ecosystem.",
      icon: "dots",
      color: "pink",
    },
    {
      title: "MARKET",
      description:
        "Navigate the NFT marketplace where you can buy, sell, and trade your digital assets across different games.",
      icon: "wave",
      color: "blue",
    },
    {
      title: "RUBIKS",
      description:
        "Discover our library for exploring the features and structural patterns of a Rubik's Cube, including visualization tools and pattern analysis.",
      icon: "square",
      color: "purple",
    },
    {
      title: "CANVAS",
      description:
        "Join a collaborative digital canvas where users can color pixels to create massive, community-driven pixel art masterpieces.",
      icon: "dots",
      color: "blue",
    },
  ];

  // Feature showcases
  const featureShowcases = [
    {
      title: "GAME INTEGRATION",
      description:
        "How assets from the VOID marketplace can be used across multiple game environments:",
      features: [
        "Cross-game asset compatibility",
        "Unified player inventory system",
        "Game-specific attribute adaptations",
        "Progression tracking across environments",
      ],
      color: "purple" as const,
    },
    {
      title: "AI GENERATION",
      description:
        "The AI systems that power content creation in the VOID ecosystem:",
      features: [
        "Procedural world generation",
        "Character customization with generative AI",
        "Dynamic storyline adaptation",
        "Environment response to player behavior",
      ],
      color: "pink" as const,
    },
    {
      title: "BLOCKCHAIN FOUNDATION",
      description:
        "The secure blockchain infrastructure that powers digital ownership:",
      features: [
        "Secure NFT minting process",
        "Multi-chain compatibility",
        "Gas-efficient transactions",
        "Verifiable ownership history",
      ],
      color: "blue" as const,
    },
  ];

  return (
    <div
      ref={containerRef}
      className="relative bg-black text-white min-h-screen font-pixel"
    >
      {/* Background particles */}
      <FloatingParticles />

      {/* Navigation */}
      <Navigation />

      {/* Main content */}
      <div className="relative z-10 pt-24">
        <div className="flex">
          {/* Sidebar */}
          <DocsSidebar activeSection="overview" />

          {/* Main content area */}
          <div className="flex-1 min-h-[calc(100vh-80px)]">
            {/* Hero section */}
            <div className="border-b border-purple-900/30 px-6 py-12 lg:py-16 relative overflow-hidden">
              {/* Decorative grid in background */}
              <div className="absolute inset-0 grid grid-cols-12 grid-rows-6 gap-px opacity-10 pointer-events-none">
                {Array.from({ length: 72 }).map((_, i) => (
                  <div
                    key={`grid-${i}`}
                    className={`bg-gray-700 ${
                      i % 7 === 0
                        ? "bg-purple-700"
                        : i % 5 === 0
                        ? "bg-pink-700"
                        : ""
                    }`}
                  />
                ))}
              </div>

              <div className="container mx-auto max-w-4xl relative z-10">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <PixelHeading
                    text="VOID Docs"
                    className="text-4xl lg:text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500"
                    animate
                  />

                  <div className="h-1 w-40 bg-gradient-to-r from-purple-500 to-pink-500 mb-6 relative overflow-hidden">
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

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="text-gray-300 text-lg max-w-3xl"
                >
                  Welcome to the comprehensive documentation for the VOID
                  ecosystem. Here you'll find everything you need to understand
                  and navigate our web3 gaming platform, NFT marketplace, and
                  creative tools.
                </motion.p>
              </div>
            </div>

            {/* Main documentation content */}
            <div className="container mx-auto px-6 py-16">
              {/* Section header */}
              <div className="max-w-4xl mx-auto mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-2xl font-bold mb-4">PLATFORM OVERVIEW</h2>
                  <p className="text-gray-300">
                    The VOID ecosystem consists of several interconnected
                    components that work together to create a seamless web3
                    gaming experience. Explore each area to learn more about
                    specific features and capabilities.
                  </p>
                </motion.div>
              </div>

              {/* Doc sections grid with centered RUBIKS and CANVAS */}
              <div className="max-w-4xl mx-auto mb-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {docSections.slice(0, 6).map((section, index) => (
                    <DocSection
                      key={index}
                      title={section.title}
                      description={section.description}
                      icon={section.icon}
                      color={section.color}
                      index={index}
                    />
                  ))}
                </div>
                {/* Centered row for RUBIKS and CANVAS */}
                <div className="flex justify-center gap-6 mt-6 flex-col md:flex-row">
                  {docSections.slice(6).map((section, index) => (
                    <div
                      key={index}
                      className="w-full md:w-1/2 lg:w-[calc(33.333%-1.5rem)]"
                    >
                      <DocSection
                        title={section.title}
                        description={section.description}
                        icon={section.icon}
                        color={section.color}
                        index={index + 6}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Feature showcases */}
              <div className="max-w-4xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                  className="mb-8"
                >
                  <h2 className="text-2xl font-bold mb-4">KEY FEATURES</h2>
                  <p className="text-gray-300">
                    Explore the core technologies and capabilities that make the
                    VOID platform unique in the web3 gaming space.
                  </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {featureShowcases.map((showcase, index) => (
                    <FeatureShowcase
                      key={index}
                      title={showcase.title}
                      description={showcase.description}
                      features={showcase.features}
                      color={showcase.color}
                      index={index}
                    />
                  ))}
                </div>

                {/* Getting started section */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                  className="mt-16 p-8 border border-blue-900/50 bg-blue-950/10 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-40 h-40 opacity-10 -rotate-12">
                    <AbstractShape
                      className="text-blue-500"
                      type="grid"
                      animate
                    />
                  </div>

                  <div className="relative z-10">
                    <PixelHeading
                      text="GETTING STARTED"
                      className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500"
                    />

                    <p className="text-gray-300 mb-6">
                      Ready to dive into the VOID? Follow these steps to begin
                      your journey into our web3 gaming ecosystem:
                    </p>

                    <ol className="space-y-4 text-gray-300">
                      <li className="flex">
                        <span className="text-blue-400 font-bold mr-2">1.</span>
                        <span>
                          Create your VOID account and set up your digital
                          wallet
                        </span>
                      </li>
                      <li className="flex">
                        <span className="text-blue-400 font-bold mr-2">2.</span>
                        <span>
                          Explore the marketplace and acquire your first NFT
                          asset
                        </span>
                      </li>
                      <li className="flex">
                        <span className="text-blue-400 font-bold mr-2">3.</span>
                        <span>
                          Choose a game from our ecosystem and use your assets
                          in-game
                        </span>
                      </li>
                      <li className="flex">
                        <span className="text-blue-400 font-bold mr-2">4.</span>
                        <span>
                          Experiment with our AI tools to create custom content
                        </span>
                      </li>
                    </ol>

                    <div className="mt-8">
                      <Button
                        size="lg"
                        className="bg-blue-500 hover:bg-blue-600 text-white rounded-none font-pixel"
                      >
                        COMPLETE TUTORIAL
                      </Button>
                    </div>
                  </div>
                </motion.div>

                {/* Community resources section */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                  className="mt-16 p-8 border border-purple-900/50 bg-purple-950/10"
                >
                  <PixelHeading
                    text="COMMUNITY RESOURCES"
                    className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500"
                  />

                  <p className="text-gray-300 mb-6">
                    Join our vibrant community to get help, share your
                    creations, and collaborate with other VOID users.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link
                      href="/community/discord"
                      className="border border-purple-900/50 p-4 hover:bg-purple-900/20 transition-colors group"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-purple-900/30 flex items-center justify-center mr-4">
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M9 11.5C9 12.3284 8.32843 13 7.5 13C6.67157 13 6 12.3284 6 11.5C6 10.6716 6.67157 10 7.5 10C8.32843 10 9 10.6716 9 11.5Z"
                              fill="#a855f7"
                            />
                            <path
                              d="M16.5 13C17.3284 13 18 12.3284 18 11.5C18 10.6716 17.3284 10 16.5 10C15.6716 10 15 10.6716 15 11.5C15 12.3284 15.6716 13 16.5 13Z"
                              fill="#a855f7"
                            />
                            <path
                              d="M18.9488 7.19933C17.5466 6.55218 16.0464 6.09796 14.5 5.86376C14.3722 6.09178 14.2028 6.39125 14.0837 6.62928C12.4263 6.41371 10.7927 6.41371 9.13538 6.62928C9.01625 6.39125 8.84688 6.09178 8.71913 5.86376C7.17181 6.09793 5.67067 6.55307 4.26787 7.20112C1.87128 10.685 1.18284 14.0543 1.52478 17.366C3.37995 18.7256 5.14826 19.5791 6.88162 20.1324C7.27202 19.5841 7.6172 18.999 7.91152 18.385C7.31813 18.1545 6.74855 17.8643 6.21077 17.5196C6.32965 17.434 6.44687 17.3437 6.56075 17.2489C9.54346 18.6497 12.7788 18.6497 15.7229 17.2489C15.8379 17.3437 15.9551 17.434 16.074 17.5196C15.5355 17.8652 14.965 18.1558 14.3707 18.386C14.6648 18.9993 15.0099 19.5837 15.4006 20.1315C17.1348 19.5782 18.9038 18.7247 20.7589 17.3651C21.1631 13.4959 20.0721 10.1607 18.9488 7.19933ZM8.02155 15.0283C7.04399 15.0283 6.24271 14.1267 6.24271 13.0086C6.24271 11.8904 7.0266 10.9889 8.02155 10.9889C9.0165 10.9889 9.81788 11.8904 9.80038 13.0086C9.80038 14.1267 9.0165 15.0283 8.02155 15.0283ZM15.9784 15.0283C15.0009 15.0283 14.1996 14.1267 14.1996 13.0086C14.1996 11.8904 14.9835 10.9889 15.9784 10.9889C16.9734 10.9889 17.7747 11.8904 17.7572 13.0086C17.7572 14.1267 16.9734 15.0283 15.9784 15.0283Z"
                              fill="#a855f7"
                            />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-bold text-white group-hover:text-purple-400 transition-colors">
                            Discord Community
                          </h4>
                          <p className="text-gray-400 text-sm">
                            Join 50k+ members in our Discord server
                          </p>
                        </div>
                      </div>
                    </Link>

                    <Link
                      href="/community/forum"
                      className="border border-purple-900/50 p-4 hover:bg-purple-900/20 transition-colors group"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-purple-900/30 flex items-center justify-center mr-4">
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M4 12H20M4 12C2.89543 12 2 11.1046 2 10V6C2 4.89543 2.89543 4 4 4H20C21.1046 4 22 4.89543 22 6V10C22 11.1046 21.1046 12 20 12M4 12V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V12"
                              stroke="#a855f7"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-bold text-white group-hover:text-purple-400 transition-colors">
                            Developer Forum
                          </h4>
                          <p className="text-gray-400 text-sm">
                            Technical discussions and support
                          </p>
                        </div>
                      </div>
                    </Link>

                    <Link
                      href="/community/workshops"
                      className="border border-purple-900/50 p-4 hover:bg-purple-900/20 transition-colors group"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-purple-900/30 flex items-center justify-center mr-4">
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M19 14C19 16.7614 16.7614 19 14 19H10C7.23858 19 5 16.7614 5 14V10C5 7.23858 7.23858 5 10 5H14C16.7614 5 19 7.23858 19 10V14Z"
                              stroke="#a855f7"
                              strokeWidth="2"
                            />
                            <path
                              d="M7 10.5H9.5M9.5 10.5H12M9.5 10.5V8M9.5 10.5V13"
                              stroke="#a855f7"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                            <path
                              d="M16 11H14M16 14H14"
                              stroke="#a855f7"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-bold text-white group-hover:text-purple-400 transition-colors">
                            Live Workshops
                          </h4>
                          <p className="text-gray-400 text-sm">
                            Weekly tutorials and demonstrations
                          </p>
                        </div>
                      </div>
                    </Link>

                    <Link
                      href="/community/github"
                      className="border border-purple-900/50 p-4 hover:bg-purple-900/20 transition-colors group"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-purple-900/30 flex items-center justify-center mr-4">
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5229 6.47715 22 12 22C17.5229 22 22 17.5229 22 12C22 6.47715 17.5229 2 12 2Z"
                              stroke="#a855f7"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M14.3333 19V17.137C14.3583 16.8275 14.3154 16.5163 14.2073 16.2242C14.0993 15.9321 13.9286 15.6657 13.7067 15.4428C15.8 15.2156 18 14.4428 18 10.8885C17.9998 9.89772 17.6418 8.94773 17 8.22276C17.3039 7.33893 17.2824 6.36969 16.94 5.50033C16.94 5.50033 16.0933 5.2731 14.3333 6.42033C12.8691 6.02553 11.3309 6.02553 9.86667 6.42033C8.10667 5.2731 7.26 5.50033 7.26 5.50033C6.91757 6.36969 6.89607 7.33893 7.2 8.22276C6.55514 8.95077 6.19723 9.90676 6.2 10.8885C6.2 14.4351 8.4 15.2079 10.4933 15.4428C10.2733 15.6637 10.1037 15.9274 9.99502 16.2165C9.88632 16.5055 9.84211 16.8138 9.86667 17.1217V19"
                              stroke="#a855f7"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M9.86667 17.1216C7.20001 18.0001 7.20001 15.4428 6 15.0001L9.86667 17.1216Z"
                              stroke="#a855f7"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-bold text-white group-hover:text-purple-400 transition-colors">
                            GitHub Repos
                          </h4>
                          <p className="text-gray-400 text-sm">
                            Open source tools and examples
                          </p>
                        </div>
                      </div>
                    </Link>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar toggle and sidebar */}
      <MobileSidebarToggle onClick={() => setMobileSidebarOpen(true)} />
      <MobileSidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        activeSection="overview"
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
