"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import React from "react"

type PixelHeadingProps = {
  text: string
  className?: string
  animate?: boolean
  as?: React.ElementType
}

export default function PixelHeading({ 
  text, 
  className, 
  animate = false,
  as: Component = 'h2'
}: PixelHeadingProps) {
  // Using style inheritance instead of class inheritance
  // This ensures the text sizing works correctly
  return (
    <Component className={cn("font-pixel", className)}>
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
          style={{ 
            // Ensure span doesn't interfere with parent text size
            fontSize: 'inherit',
            lineHeight: 'inherit'
          }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </Component>
  )
}