"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import VoidResonanceGame from "./void-game";
import { AudioProvider } from "./contexts/audio-context"; // Import AudioProvider

export default function GamePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingPhase, setLoadingPhase] = useState(0); // 0: initial, 1: matrix
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [cursorHover, setCursorHover] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Control body overflow based on loading state
  useEffect(() => {
    if (isLoading) {
      // Disable scrolling during loading animations
      document.body.style.overflow = 'hidden';
    } else {
      // Re-enable scrolling after game loads
      document.body.style.overflow = '';
    }
    
    return () => {
      // Cleanup: ensure scrolling is re-enabled when component unmounts
      document.body.style.overflow = '';
    };
  }, [isLoading]);
  
  // Handle cursor effects
  useEffect(() => {
    const handleMouseMove = (e: { clientX: any; clientY: any; }) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseOver = () => {
      setCursorHover(true);
    };

    const handleMouseOut = () => {
      setCursorHover(false);
    };

    // Add event listeners for interactive elements
    const interactiveElements = document.querySelectorAll('button, a, [role="button"]');
    interactiveElements.forEach(el => {
      el.addEventListener('mouseover', handleMouseOver);
      el.addEventListener('mouseout', handleMouseOut);
    });

    window.addEventListener("mousemove", handleMouseMove);
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      interactiveElements.forEach(el => {
        el.removeEventListener('mouseover', handleMouseOver);
        el.removeEventListener('mouseout', handleMouseOut);
      });
    };
  }, []);

  // Circular Halftone Matrix Effect
  useEffect(() => {
    if (loadingPhase !== 1 || !canvasRef.current) return;
    
    // Canvas matrix animation implementation remains the same
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas to full window size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Define center point
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Compute the diagonal to ensure we cover the entire screen
    const maxDistance = Math.sqrt(Math.pow(Math.max(centerX, canvas.width - centerX), 2) + 
                                  Math.pow(Math.max(centerY, canvas.height - centerY), 2));
    
    // Symbols for the matrix effect
    const symbols = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ<>[]{}();:,.$/*-+=▓▒░█▄▀▐▌■□●○◆◇★✦✧✩✪✫✬✭✮✯✰✱✲✳✴✵✶✷✸✹✺✻✼✽✾✿❀❁❂❃❄❅❆❇❈❉❊❋☀☁☂♠♣♥♦';
    
    // Colors for symbols
    const colors = [
      '#a855f7', // Purple
      '#d946ef', // Fuchsia
      '#e879f9', // Pink
      '#c026d3', // Purple-pink
      '#ec4899', // Pink
      '#f0abfc', // Bright purple
      '#f472b6', // Bright pink
    ];

    // Create concentric rings with symbols
    const totalRings = 50; // More rings to ensure full screen coverage
    const rings: {
      radius: number; symbols: { x: number; y: number; symbol: string; color: string; size: number; glowing: boolean; }[]; appearanceThreshold: number; // Controls reveal timing
      disappearanceThreshold: number; // Controls fade-out timing
    }[] = [];
    
    function getRandomSymbol() {
      return symbols.charAt(Math.floor(Math.random() * symbols.length));
    }
    
    // Define the structure of the rings
    for (let i = 0; i < totalRings; i++) {
      // Calculate radius for each ring
      // Scale to ensure we cover the full screen
      const radius = maxDistance * (i + 1) / totalRings;
      
      // Calculate circumference to determine number of symbols
      const circumference = 2 * Math.PI * radius;
      
      // Calculate symbol density based on radius
      // More symbols for outer rings to maintain density
      const symbolCount = Math.max(8, Math.floor(circumference / 18));
      
      const symbols = [];
      for (let j = 0; j < symbolCount; j++) {
        const angle = (2 * Math.PI * j) / symbolCount;
        symbols.push({
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
          symbol: getRandomSymbol(),
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.floor(Math.random() * 4) + 10 + (i / totalRings) * 8,
          glowing: Math.random() > 0.8
        });
      }
      
      rings.push({
        radius,
        symbols,
        appearanceThreshold: (i / totalRings) * 0.6, // Controls reveal timing
        disappearanceThreshold: 0.6 + ((totalRings - i - 1) / totalRings) * 0.4 // Controls fade-out timing
      });
    }
    
    // Animation timing
    const totalDuration = 6000; // 6 seconds total
    let startTime = performance.now();
    
    // Animation loop
    const animate = (currentTime: number) => {
      // Calculate progress (0 to 1)
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / totalDuration, 1);
      
      // Clear canvas with full black background
      ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Animate each ring
      rings.forEach(ring => {
        // Determine if this ring should be visible
        let opacity = 0;
        
        // Appear from center
        if (progress > ring.appearanceThreshold && progress < ring.disappearanceThreshold) {
          // Fully visible in the middle phase
          opacity = 1;
          
          // Fade in
          if (progress - ring.appearanceThreshold < 0.05) {
            opacity = (progress - ring.appearanceThreshold) / 0.05;
          }
          
          // Fade out
          if (ring.disappearanceThreshold - progress < 0.05) {
            opacity = (ring.disappearanceThreshold - progress) / 0.05;
          }
          
          // Draw symbols for this ring
          ring.symbols.forEach(symbol => {
            ctx.save();
            ctx.globalAlpha = opacity;
            ctx.fillStyle = symbol.color;
            ctx.font = `${symbol.size}px monospace`;
            
            // Add glow effect for some symbols
            if (symbol.glowing) {
              ctx.shadowBlur = 8;
              ctx.shadowColor = symbol.color;
            }
            
            // Draw the symbol
            ctx.fillText(symbol.symbol, symbol.x, symbol.y);
            ctx.restore();
            
            // Randomly change some symbols for dynamic effect
            if (Math.random() > 0.98) {
              symbol.symbol = getRandomSymbol();
              // Sometimes change color too
              if (Math.random() > 0.7) {
                symbol.color = colors[Math.floor(Math.random() * colors.length)];
              }
            }
          });
        }
      });
      
      // Continue animation or end
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsLoading(false);
      }
    };
    
    // Start animation
    requestAnimationFrame(animate);
    
  }, [loadingPhase]);

  // Loading animation sequence
  useEffect(() => {
    const startSequence = async () => {
      // Start with initial loading spinner
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Then matrix phase
      setLoadingPhase(1);
    };
    
    startSequence();
  }, []);

  // Exit the game
  const exitGame = () => {
    console.log("Exiting game...");
    // In this version, we would redirect back to the home page
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden font-pixel">
      {/* Wrap with AudioProvider at the top level */}
      <AudioProvider>
        {/* Custom cursor */}
        <motion.div
          className="fixed w-8 h-8 pointer-events-none z-[100] hidden md:block"
          animate={{
            x: cursorPosition.x - 16,
            y: cursorPosition.y - 16,
            scale: cursorHover ? 1.5 : 1,
          }}
          transition={{
            type: "spring",
            damping: 10,
            mass: 0.1,
            stiffness: 100,
          }}
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
            <rect x="12" y="12" width="8" height="8" fill="#ec4899" />
          </svg>
        </motion.div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loader"
              className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black overflow-hidden"
              initial={{ opacity: 1 }}
              exit={{ 
                opacity: 0,
                filter: "blur(20px)",
                transition: { duration: 1, ease: "easeInOut" }
              }}
            >
              {/* Phase 0 - Initial loading spinner */}
              {loadingPhase === 0 && (
                <motion.div
                  className="relative w-32 h-32"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1, transition: { duration: 0.5 } }}
                >
                  <svg
                    viewBox="0 0 100 100"
                    className="w-full h-full text-purple-500"
                    style={{ animation: "rotate 2s linear infinite" }}
                  >
                    <rect
                      x="46"
                      y="10"
                      width="8"
                      height="20"
                      fill="currentColor"
                      opacity="0.9"
                    />
                    <rect
                      x="46"
                      y="70"
                      width="8"
                      height="20"
                      fill="currentColor"
                      opacity="0.3"
                    />
                    <rect
                      x="10"
                      y="46"
                      width="20"
                      height="8"
                      fill="currentColor"
                      opacity="0.7"
                    />
                    <rect
                      x="70"
                      y="46"
                      width="20"
                      height="8"
                      fill="currentColor"
                      opacity="0.5"
                    />
                    <rect
                      x="22"
                      y="22"
                      width="8"
                      height="20"
                      transform="rotate(45 26 32)"
                      fill="currentColor"
                      opacity="0.8"
                    />
                    <rect
                      x="70"
                      y="70"
                      width="8"
                      height="20"
                      transform="rotate(45 74 80)"
                      fill="currentColor"
                      opacity="0.4"
                    />
                    <rect
                      x="22"
                      y="70"
                      width="8"
                      height="20"
                      transform="rotate(-45 26 70)"
                      fill="currentColor"
                      opacity="0.6"
                    />
                    <rect
                      x="70"
                      y="22"
                      width="8"
                      height="20"
                      transform="rotate(-45 74 22)"
                      fill="currentColor"
                      opacity="0.2"
                    />
                  </svg>
                </motion.div>
              )}

              {/* Phase 1 - Circular Halftone Matrix */}
              {loadingPhase === 1 && (
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full"
                  style={{ background: 'black' }}
                />
              )}
            </motion.div>
          ) : (
            // Game container with entrance animation
            <motion.div
              key="game"
              initial={{ 
                opacity: 0,
                filter: "blur(10px)"
              }}
              animate={{ 
                opacity: 1,
                filter: "blur(0px)",
                transition: { 
                  duration: 1,
                  ease: "easeOut"
                }
              }}
              className="w-full h-full"
            >
              <VoidResonanceGame onExit={exitGame} />
            </motion.div>
          )}
        </AnimatePresence>
      </AudioProvider>

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

        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}