'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

type LoadingScreenProps = {
  children: React.ReactNode;
};

const LoadingScreen: React.FC<LoadingScreenProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [blackHoleProgress, setBlackHoleProgress] = useState(0);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // State to store window dimensions
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0
  });

  // Set window dimensions only after component mounts
  useEffect(() => {
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight
    });
    
    // Optional: Add resize listener if needed
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle route changes and initial load
  useEffect(() => {
    // Reset animation state
    setIsLoading(true);
    setBlackHoleProgress(0);
    
    // Skip animation if dimensions not set yet (server-side)
    if (dimensions.width === 0) return;
    
    // Extremely gradual black hole growth with smooth easing
    let startTime = Date.now();
    const duration = 4000; // 4 seconds total animation
    
    // Animation frame for ultra-smooth progress
    const animateBlackHole = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Custom easing function for natural growth
      // Starts very slow, accelerates gradually, then slows again at the end
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      
      setBlackHoleProgress(eased);
      
      if (progress < 1) {
        requestAnimationFrame(animateBlackHole);
      } else {
        // Complete loading with a small delay after animation completes
        setTimeout(() => {
          setIsLoading(false);
        }, 300);
      }
    };
    
    // Start the animation after a short delay
    const startTimer = setTimeout(() => {
      startTime = Date.now();
      requestAnimationFrame(animateBlackHole);
    }, 600);
    
    return () => {
      clearTimeout(startTimer);
    };
  }, [pathname, searchParams, dimensions.width]);

  // Calculate black hole size based on screen dimensions and progress
  const maxSize = Math.max(dimensions.width, dimensions.height) * 2;
  const blackHoleSize = blackHoleProgress * maxSize;
  
  // Calculate particle swallow progress - slightly delayed from the black hole growth
  const particleProgress = Math.max(0, (blackHoleProgress - 0.1) / 0.9);

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div 
            className="fixed inset-0 z-[100] overflow-hidden flex items-center justify-center"
            exit={{ 
              opacity: 0,
              transition: { duration: 0.5 }
            }}
          >
            {/* Full-screen gradient background */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(45deg, #2c3e90, #823dac, #e23498, #de2c65)',
                backgroundSize: '300% 300%',
              }}
              animate={{
                backgroundPosition: ['0% 0%', '100% 100%'],
                filter: blackHoleProgress > 0.8 ? 'blur(20px)' : 'blur(0px)',
              }}
              transition={{ 
                backgroundPosition: { 
                  duration: 8, 
                  repeat: Infinity, 
                  repeatType: 'mirror', 
                  ease: 'linear' 
                },
                filter: { duration: 1.2 }
              }}
            />
            
            {/* Heavy grain overlay */}
            <div 
              className="absolute inset-0 mix-blend-overlay"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 800 800' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                opacity: 0.25,
              }}
            />
            
            {/* Additional animated noise layer */}
            <motion.div 
              className="absolute inset-0 mix-blend-overlay"
              animate={{ opacity: [0.1, 0.2, 0.1] }}
              transition={{ duration: 4, repeat: Infinity }}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'repeat',
                backgroundSize: '200px 200px',
              }}
            />
            
            {/* Black hole effect - with gradient edge */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* Dark vignette around edges */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.4) 80%)',
                  opacity: blackHoleProgress * 0.8,
                }}
              />
              
              {/* Black hole with gradient edge */}
              <motion.div
                className="absolute rounded-full"
                style={{
                  width: blackHoleSize,
                  height: blackHoleSize,
                  background: 'radial-gradient(circle, black 90%, rgba(0,0,0,0) 100%)',
                  boxShadow: 'inset 0 0 50px 20px rgba(0, 0, 0, 0.8)'
                }}
              />
              
              {/* Subtle gradient ring around black hole */}
              {blackHoleProgress > 0 && blackHoleProgress < 0.8 && (
                <motion.div
                  className="absolute rounded-full overflow-hidden"
                  style={{
                    width: blackHoleSize * 1.05,
                    height: blackHoleSize * 1.05,
                    background: 'conic-gradient(from 0deg, rgba(44, 62, 144, 0.5), rgba(130, 61, 172, 0.5), rgba(226, 52, 152, 0.5), rgba(222, 44, 101, 0.5), rgba(44, 62, 144, 0.5))',
                    opacity: 0.6 - blackHoleProgress * 0.6, // Fade out as black hole grows
                  }}
                  animate={{ 
                    rotate: [0, 360],
                  }}
                  transition={{ 
                    duration: 20, 
                    repeat: Infinity,
                    ease: "linear" 
                  }}
                />
              )}
            </div>
            
            {/* Gradient particles getting swallowed gradually */}
            {typeof window !== 'undefined' && dimensions.width > 0 && (
              <div className="absolute inset-0 overflow-hidden">
                {Array.from({ length: 150 }).map((_, i) => {
                  const size = Math.random() * 4 + 1;
                  const distance = Math.random() * Math.min(dimensions.width, dimensions.height) * 0.4 + (Math.min(dimensions.width, dimensions.height) * 0.1);
                  const angle = Math.random() * Math.PI * 2;
                  const x = Math.cos(angle) * distance + dimensions.width/2;
                  const y = Math.sin(angle) * distance + dimensions.height/2;
                  
                  // Stagger particle animations - particles closer to center get swallowed first
                  // Normalized distance from 0-1 (0 = center, 1 = furthest)
                  const normalizedDistance = distance / (Math.min(dimensions.width, dimensions.height) * 0.5);
                  // Threshold based on current progress - particles get swallowed when progress exceeds their threshold
                  const swallowThreshold = normalizedDistance * 0.9; // 0-0.9 range
                  
                  // Determine if this particle should be getting swallowed
                  const isActive = particleProgress >= swallowThreshold;
                  
                  // Select color from gradient palette
                  const colors = ['#2c3e90', '#823dac', '#a43dac', '#c43d9c', '#e23498', '#de2c65'];
                  const color = colors[Math.floor(Math.random() * colors.length)];
                  
                  return (
                    <motion.div
                      key={`particle-${i}`}
                      className="absolute rounded-full"
                      style={{
                        width: `${size}px`,
                        height: `${size}px`,
                        x: x,
                        y: y,
                        backgroundColor: color,
                        boxShadow: `0 0 ${size}px ${color}50`,
                        opacity: Math.random() * 0.6 + 0.4,
                      }}
                      animate={isActive ? {
                        x: dimensions.width / 2,
                        y: dimensions.height / 2,
                        scale: 0,
                        opacity: 0
                      } : {}}
                      transition={{
                        duration: 1.5 + Math.random() * 1,
                        ease: [0.25, 0.1, 0.25, 1],
                      }}
                    />
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Main content */}
      <div 
        style={{ 
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.5s ease-in-out',
          visibility: isLoading ? 'hidden' : 'visible',
        }}
      >
        {children}
      </div>
    </>
  );
};

export default LoadingScreen;