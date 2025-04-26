"use client"

import { motion } from "framer-motion"

type AbstractShapeProps = {
  className?: string
  type: "circle" | "square" | "triangle" | "complex" | "wave" | "grid" | "dots" | "noise" | "loading" | "gamepad"| "cube"
  animate?: boolean
  color?: "purple" | "pink" | "blue"
}

export default function AbstractShape({ className, type, animate = false }: AbstractShapeProps) {
  const renderShape = () => {
    switch (type) {
      case "circle":
        return (
          <motion.svg
            viewBox="0 0 100 100"
            className={className}
            animate={
              animate
                ? {
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, 0],
                }
                : undefined
            }
            transition={
              animate
                ? {
                  duration: 8,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }
                : undefined
            }
          >
            <circle cx="50" cy="50" r="40" fill="currentColor" />
          </motion.svg>
        )

      case "square":
        return (
          <motion.svg
            viewBox="0 0 100 100"
            className={className}
            animate={
              animate
                ? {
                  rotate: [0, 90, 0],
                }
                : undefined
            }
            transition={
              animate
                ? {
                  duration: 20,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }
                : undefined
            }
          >
            <rect x="20" y="20" width="60" height="60" fill="currentColor" />
          </motion.svg>
        )

      case "triangle":
        return (
          <motion.svg
            viewBox="0 0 100 100"
            className={className}
            animate={
              animate
                ? {
                  rotate: [0, 360],
                }
                : undefined
            }
            transition={
              animate
                ? {
                  duration: 30,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }
                : undefined
            }
          >
            <polygon points="50,20 80,80 20,80" fill="currentColor" />
          </motion.svg>
        )

      case "complex":
        return (
          <motion.svg
            viewBox="0 0 200 200"
            className={className}
            animate={
              animate
                ? {
                  scale: [1, 1.05, 1],
                  rotate: [0, 10, 0],
                }
                : undefined
            }
            transition={
              animate
                ? {
                  duration: 10,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }
                : undefined
            }
          >
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="1" />
                <stop offset="100%" stopColor="#ec4899" stopOpacity="1" />
              </linearGradient>
            </defs>
            <path d="M40,40 L160,40 L160,160 L40,160 Z" fill="none" stroke="url(#grad1)" strokeWidth="2" />
            <path d="M60,60 L140,60 L140,140 L60,140 Z" fill="none" stroke="url(#grad1)" strokeWidth="2" />
            <path d="M80,80 L120,80 L120,120 L80,120 Z" fill="url(#grad1)" />
            <circle cx="40" cy="40" r="5" fill="#a855f7" />
            <circle cx="160" cy="40" r="5" fill="#a855f7" />
            <circle cx="40" cy="160" r="5" fill="#a855f7" />
            <circle cx="160" cy="160" r="5" fill="#a855f7" />
            <circle cx="100" cy="100" r="5" fill="#ec4899" />
          </motion.svg>
        )

      case "wave":
        return (
          <motion.svg
            viewBox="0 0 100 100"
            className={className}
            animate={
              animate
                ? {
                  y: [0, 5, 0],
                }
                : undefined
            }
            transition={
              animate
                ? {
                  duration: 5,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }
                : undefined
            }
          >
            <path d="M10,50 Q25,30 40,50 T70,50 T100,50" fill="none" stroke="currentColor" strokeWidth="4" />
            <path d="M10,70 Q25,50 40,70 T70,70 T100,70" fill="none" stroke="currentColor" strokeWidth="4" />
            <path d="M10,30 Q25,10 40,30 T70,30 T100,30" fill="none" stroke="currentColor" strokeWidth="4" />
          </motion.svg>
        )

      case "grid":
        return (
          <svg viewBox="0 0 100 100" className={className}>
            <rect x="10" y="10" width="20" height="20" fill="currentColor" />
            <rect x="40" y="10" width="20" height="20" fill="currentColor" opacity="0.8" />
            <rect x="70" y="10" width="20" height="20" fill="currentColor" />
            <rect x="10" y="40" width="20" height="20" fill="currentColor" opacity="0.6" />
            <rect x="40" y="40" width="20" height="20" fill="currentColor" />
            <rect x="70" y="40" width="20" height="20" fill="currentColor" opacity="0.6" />
            <rect x="10" y="70" width="20" height="20" fill="currentColor" />
            <rect x="40" y="70" width="20" height="20" fill="currentColor" opacity="0.8" />
            <rect x="70" y="70" width="20" height="20" fill="currentColor" />
          </svg>
        )

      case "dots":
        return (
          <svg viewBox="0 0 100 100" className={className}>
            <circle cx="20" cy="20" r="5" fill="currentColor" />
            <circle cx="50" cy="20" r="5" fill="currentColor" />
            <circle cx="80" cy="20" r="5" fill="currentColor" />
            <circle cx="20" cy="50" r="5" fill="currentColor" />
            <circle cx="50" cy="50" r="5" fill="currentColor" />
            <circle cx="80" cy="50" r="5" fill="currentColor" />
            <circle cx="20" cy="80" r="5" fill="currentColor" />
            <circle cx="50" cy="80" r="5" fill="currentColor" />
            <circle cx="80" cy="80" r="5" fill="currentColor" />
          </svg>
        )

      case "noise":
        return (
          <svg viewBox="0 0 100 100" className={className}>
            {Array.from({ length: 50 }).map((_, i) => (
              <rect
                key={i}
                x={Math.random() * 100}
                y={Math.random() * 100}
                width={Math.random() * 10 + 2}
                height={Math.random() * 10 + 2}
                fill="currentColor"
                opacity={Math.random() * 0.5 + 0.1}
              />
            ))}
          </svg>
        )

      case "loading":
        return (
          <motion.svg
            viewBox="0 0 100 100"
            className={className}
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          >
            <rect x="46" y="10" width="8" height="20" fill="currentColor" opacity="0.9" />
            <rect x="46" y="70" width="8" height="20" fill="currentColor" opacity="0.3" />
            <rect x="10" y="46" width="20" height="8" fill="currentColor" opacity="0.7" />
            <rect x="70" y="46" width="20" height="8" fill="currentColor" opacity="0.5" />

            <rect x="22" y="22" width="8" height="20" transform="rotate(45 26 32)" fill="currentColor" opacity="0.8" />
            <rect x="70" y="70" width="8" height="20" transform="rotate(45 74 80)" fill="currentColor" opacity="0.4" />
            <rect x="22" y="70" width="8" height="20" transform="rotate(-45 26 70)" fill="currentColor" opacity="0.6" />
            <rect x="70" y="22" width="8" height="20" transform="rotate(-45 74 22)" fill="currentColor" opacity="0.2" />
          </motion.svg>
        )

      case "gamepad":
        return (
          <svg viewBox="0 0 100 100" className={className}>
            <rect x="20" y="30" width="60" height="40" rx="5" fill="currentColor" />
            <rect x="30" y="20" width="40" height="10" rx="5" fill="currentColor" />
            <rect x="30" y="70" width="40" height="10" rx="5" fill="currentColor" />
            <circle cx="35" cy="50" r="8" fill="black" />
            <circle cx="65" cy="50" r="8" fill="black" />
            <rect x="45" y="45" width="10" height="10" fill="black" />
          </svg>
        )

      default:
        return <div className={className}></div>
    }
  }

  return renderShape()
}
