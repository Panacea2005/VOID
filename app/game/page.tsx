"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import VoidResonanceGame from "./void-game";

export default function GamePage() {
  const [loading, setLoading] = useState(true);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [cursorHover, setCursorHover] = useState(false);

  // Handle cursor effects
  useEffect(() => {
    const handleMouseMove = (e: { clientX: any; clientY: any; }) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Loading animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Exit the game
  const exitGame = () => {
    console.log("Exiting game...");
    // In this version, we would redirect back to the home page
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden font-pixel">
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

      <AnimatePresence>
        {loading ? (
          <motion.div
            key="loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black"
          >
            <div className="relative w-32 h-32">
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
            </div>
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
              className="mt-8 text-2xl font-light tracking-widest text-purple-400 font-pixel"
            >
              LOADING VOID...
            </motion.p>
          </motion.div>
        ) : (
          // Game container - show immediately after loading
          <VoidResonanceGame onExit={exitGame} />
        )}
      </AnimatePresence>

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