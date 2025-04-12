"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

type PixelHeadingProps = {
  text: string
  className?: string
  animate?: boolean
}

export default function PixelHeading({ text, className, animate = false }: PixelHeadingProps) {
  return (
    <h2 className={cn("font-pixel", className)}>
      {text.split("").map((char, index) => (
        <motion.span
          key={index}
          initial={animate ? { opacity: 0, y: 20 } : undefined}
          animate={animate ? { opacity: 1, y: 0 } : undefined}
          transition={
            animate
              ? {
                  duration: 0.3,
                  delay: index * 0.05,
                  ease: "easeOut",
                }
              : undefined
          }
          className="inline-block"
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </h2>
  )
}
