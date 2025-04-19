"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { motion, useAnimation, useScroll, useTransform, useInView } from "framer-motion"
import PixelHeading from "./pixel-heading"

// Enhanced social links with animated icons
interface SocialLinkProps {
  href: string;
  children: React.ReactNode;
  delay: number;
}

const SocialLink = ({ href, children, delay }: SocialLinkProps) => {
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <motion.a
      href={href}
      className="relative w-12 h-12 flex items-center justify-center text-purple-400 group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ scale: 1.1 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background pulse */}
      <motion.div 
        className="absolute inset-0 rounded-md bg-gradient-to-r from-purple-900/50 to-pink-900/50"
        animate={{ 
          opacity: isHovered ? 0.8 : 0,
          scale: isHovered ? [1, 1.2, 1] : 1,
        }}
        transition={{ duration: 0.8, repeat: isHovered ? Infinity : 0 }}
      />
      
      {/* Icon container */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
    </motion.a>
  )
}

// Enhanced navigation link with hover effects
interface FooterLinkProps {
  href: string;
  children: React.ReactNode;
  index: number;
}

const FooterLink = ({ href, children, index }: FooterLinkProps) => {
  const controls = useAnimation()
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.1 * index }}
    >
      <Link
        href={href}
        className="group relative inline-block text-gray-400 hover:text-purple-400 transition-colors duration-300 font-pixel py-1"
        onMouseEnter={() => controls.start({
          width: "100%",
          transition: { duration: 0.3 }
        })}
        onMouseLeave={() => controls.start({
          width: "0%",
          transition: { duration: 0.3 }
        })}
      >
        <span className="relative z-10 flex items-center">
          {/* Pixel accent */}
          <span className="w-2 h-2 bg-purple-500 opacity-0 group-hover:opacity-100 transition-opacity mr-2"></span>
          
          {children}
          
          {/* Arrow icon */}
          <svg
            className="ml-2 w-4 h-4 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-300"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="square"/>
          </svg>
        </span>
        
        {/* Animated underline */}
        <motion.div
          className="absolute bottom-0 left-0 h-px bg-gradient-to-r from-purple-500 to-pink-500"
          initial={{ width: "0%" }}
          animate={controls}
        />
      </Link>
    </motion.div>
  )
}

// Animated decoration element
const GlitchDecoration = ({ className }: { className: string }) => {
  return (
    <motion.div 
      className={`absolute ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.7, 0.4, 0.7, 0] }}
      transition={{ 
        duration: 3, 
        repeat: Infinity, 
        repeatType: "loop",
        times: [0, 0.2, 0.3, 0.5, 1]
      }}
    >
      {/* Random grid pattern */}
      <div className="grid grid-cols-4 gap-px">
        {Array.from({ length: 16 }).map((_, i) => (
          <motion.div
            key={i}
            className="w-1 h-1 bg-purple-500"
            initial={{ opacity: 0.1 }}
            animate={{ 
              opacity: [0.1, Math.random() > 0.7 ? 0.8 : 0.1, 0.1],
              backgroundColor: Math.random() > 0.5 ? "#a855f7" : "#ec4899"
            }}
            transition={{ 
              duration: 0.8 + Math.random(),
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}

// Newsletter subscription form with animations
const NewsletterForm = () => {
  return (
    <motion.div 
      className="relative z-10 bg-black/40 backdrop-blur-sm border border-purple-900/50 p-6 rounded-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      <PixelHeading text="JOIN THE VOID" className="text-xl font-bold mb-4 text-white" />
      <p className="text-gray-400 mb-6 font-pixel text-sm">Subscribe to receive updates and exclusive content.</p>
      
      <form className="relative">
        <input
          type="email"
          placeholder="ENTER YOUR EMAIL"
          className="w-full bg-gray-900/80 border border-purple-900/50 text-gray-200 px-4 py-3 font-pixel text-sm focus:outline-none focus:border-purple-500 transition-colors"
        />
        
        <button
          type="submit"
          className="absolute right-0 top-0 bottom-0 bg-gradient-to-r from-purple-600/80 to-pink-600/80 text-white px-4 text-sm font-bold font-pixel hover:from-purple-500 hover:to-pink-500 transition-all"
        >
          SUBSCRIBE
        </button>
        
        {/* Animated corners */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-purple-500"></div>
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-purple-500"></div>
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-purple-500"></div>
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-purple-500"></div>
      </form>
    </motion.div>
  )
}

// Main Footer component
export default function Footer() {
  const [cursorHover, setCursorHover] = useState(false)
  const currentYear = new Date().getFullYear()
  
  // For scroll animations
  const { scrollYProgress } = useScroll()
  const footerAnimation = useAnimation()
  const footerRef = useRef(null)
  const isInView = useInView(footerRef, { once: true, amount: 0.1 })
  
  // Parallax effect
  const bgY = useTransform(scrollYProgress, [0.7, 1], [0, -100])
  
  // Start animation when footer comes into view
  useEffect(() => {
    if (isInView) {
      footerAnimation.start("visible")
    }
  }, [isInView, footerAnimation])
  
  // Main footer variants
  const variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }
  
  // Footer row variants
  const rowVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }
  
  return (
    <footer 
      ref={footerRef}
      className="relative py-32 border-t border-purple-900/30 overflow-hidden bg-black"
    >
      {/* Animated background effect */}
      <motion.div 
        className="absolute inset-0 z-0 opacity-10"
        style={{ y: bgY }}
      >
        <div className="absolute inset-0 grid grid-cols-8 gap-px">
          {Array.from({ length: 64 }).map((_, i) => (
            <motion.div
              key={i}
              className="bg-gray-700"
              initial={{ opacity: 0.1 }}
              animate={{ 
                opacity: [0.1, 0.2, 0.1],
                backgroundColor: i % 3 === 0 ? "#a855f7" : i % 3 === 1 ? "#ec4899" : "#3b82f6"
              }}
              transition={{ 
                duration: 1 + Math.random() * 3, 
                repeat: Infinity,
                repeatType: "mirror"
              }}
            />
          ))}
        </div>
      </motion.div>
      
      {/* Separator line with animation */}
      <div className="absolute top-0 left-0 w-full overflow-hidden">
        <div className="relative h-px">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
          <motion.div 
            className="absolute top-0 left-0 h-px bg-gradient-to-r from-transparent via-pink-500 to-transparent"
            animate={{ 
              x: ['-100%', '100%'],
              opacity: [0, 1, 0]
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{ width: '50%' }}
          />
        </div>
      </div>
      
      {/* Glitch decorations */}
      <GlitchDecoration className="top-10 left-10" />
      <GlitchDecoration className="bottom-20 right-20" />
      <GlitchDecoration className="top-40 right-40" />
      <GlitchDecoration className="bottom-60 left-40" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          variants={variants}
          initial="hidden"
          animate={footerAnimation}
          className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-20"
        >
          {/* Brand column */}
          <motion.div variants={rowVariants} className="col-span-1 md:col-span-2">
            <div className="relative mb-6">
              <PixelHeading
                text="VOID"
                className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600"
              />
              <motion.div 
                className="absolute -bottom-2 left-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500"
                initial={{ width: 0 }}
                animate={{ width: '40%' }}
                transition={{ duration: 0.8, delay: 0.5 }}
              />
            </div>
            
            <p className="text-gray-400 mb-8 max-w-md font-pixel">
              AN IMMERSIVE ARTISTIC EXPERIENCE THAT CHALLENGES YOUR PERCEPTION OF REALITY
            </p>
            
            <div className="flex space-x-2">
              {/* Social media icons with animated effects */}
              <SocialLink href="#" delay={0.6}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 8V6C16 4.9 16.9 4 18 4H20V8H18C16.9 8 16 8.9 16 10V13H20V17H16V22H12V17H9V13H12V10C12 8.9 12.9 8 14 8H16Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </SocialLink>
              
              <SocialLink href="#" delay={0.7}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 5.79996C21.2 6.29996 20.4 6.59996 19.5 6.69996C20.4 6.09996 21.1 5.29996 21.4 4.19996C20.6 4.69996 19.7 5.09996 18.7 5.29996C17.9 4.39996 16.7 3.89996 15.5 3.89996C13.1 3.89996 11.2 5.79996 11.2 8.19996C11.2 8.59996 11.3 8.99996 11.4 9.29996C7.9 9.09996 4.7 7.39996 2.5 4.79996C2.1 5.49996 1.8 6.29996 1.8 7.19996C1.8 8.79996 2.6 10.2 3.8 11C3.1 11 2.4 10.8 1.8 10.4V10.5C1.8 12.6 3.3 14.4 5.3 14.8C4.9 14.9 4.5 15 4.1 15C3.8 15 3.5 14.9 3.2 14.9C3.8 16.6 5.4 17.9 7.3 17.9C5.8 19 4 19.7 2 19.7C1.6 19.7 1.2 19.7 0.8 19.6C2.7 20.8 5 21.5 7.3 21.5C15.5 21.5 20 14.9 20 9.19996C20 8.99996 20 8.79996 20 8.59996C20.8 7.99996 21.6 7.19996 22 5.79996Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </SocialLink>
              
              <SocialLink href="#" delay={0.8}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 2H8C4.68629 2 2 4.68629 2 8V16C2 19.3137 4.68629 22 8 22H16C19.3137 22 22 19.3137 22 16V8C22 4.68629 19.3137 2 16 2Z" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M17.5 7C18.3284 7 19 6.32843 19 5.5C19 4.67157 18.3284 4 17.5 4C16.6716 4 16 4.67157 16 5.5C16 6.32843 16.6716 7 17.5 7Z" fill="currentColor"/>
                </svg>
              </SocialLink>
              
              <SocialLink href="#" delay={0.9}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 11V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15 11V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15 7L15 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 7L9 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </SocialLink>
            </div>
          </motion.div>
          
          {/* Navigation links */}
          <motion.div variants={rowVariants}>
            <PixelHeading text="GAME" className="text-lg font-bold mb-6 text-white" />
            <div className="space-y-3 font-pixel">
              {[
                { name: "HOME", path: "/" },
                { name: "REALM", path: "/realm" },
                { name: "GAME", path: "/game" },
                { name: "ABOUT", path: "/about" },
              ].map((link, index) => (
                <FooterLink key={link.path} href={link.path} index={index}>
                  {link.name}
                </FooterLink>
              ))}
            </div>
          </motion.div>
          
          {/* Support links */}
          <motion.div variants={rowVariants}>
            <PixelHeading text="NFT" className="text-lg font-bold mb-6 text-white" />
            <div className="space-y-3 font-pixel">
              {[
                { name: "AI", path: "/ai" },
                { name: "MARKET", path: "/market" },
                { name: "GALLERY", path: "/gallery" },
                { name: "GACHA", path: "/gacha" },
              ].map((link, index) => (
                <FooterLink key={link.path} href={link.path} index={index}>
                  {link.name}
                </FooterLink>
              ))}
            </div>
          </motion.div>
        </motion.div>
        
        {/* Newsletter section */}
        <motion.div
          variants={variants}
          initial="hidden"
          animate={footerAnimation}
          className="mb-16"
        >
          <motion.div variants={rowVariants}>
            <NewsletterForm />
          </motion.div>
        </motion.div>
        
        {/* Copyright section */}
        <motion.div
          variants={variants}
          initial="hidden"
          animate={footerAnimation}
          className="pt-8 border-t border-gray-800/50 flex flex-col md:flex-row justify-between items-center"
        >
          <motion.p 
            variants={rowVariants}
            className="text-gray-500 text-sm mb-4 md:mb-0 font-pixel flex items-center"
          >
            <span className="w-2 h-2 bg-purple-500 mr-2"></span>
            &copy; {currentYear} VOID. ALL RIGHTS RESERVED.
          </motion.p>
          
          <motion.div 
            variants={rowVariants}
            className="flex space-x-6"
          >
            <Link
              href="#"
              className="group text-gray-500 hover:text-purple-400 text-sm transition-colors duration-300 font-pixel flex items-center"
              onMouseEnter={() => setCursorHover(true)}
              onMouseLeave={() => setCursorHover(false)}
            >
              <span>PRIVACY</span>
              <motion.span 
                className="ml-1 w-1 h-1 bg-purple-500 opacity-0 group-hover:opacity-100"
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </Link>
            
            <Link
              href="#"
              className="group text-gray-500 hover:text-purple-400 text-sm transition-colors duration-300 font-pixel flex items-center"
              onMouseEnter={() => setCursorHover(true)}
              onMouseLeave={() => setCursorHover(false)}
            >
              <span>TERMS</span>
              <motion.span 
                className="ml-1 w-1 h-1 bg-purple-500 opacity-0 group-hover:opacity-100"
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              />
            </Link>
            
            <Link
              href="#"
              className="group text-gray-500 hover:text-purple-400 text-sm transition-colors duration-300 font-pixel flex items-center"
              onMouseEnter={() => setCursorHover(true)}
              onMouseLeave={() => setCursorHover(false)}
            >
              <span>COOKIES</span>
              <motion.span 
                className="ml-1 w-1 h-1 bg-purple-500 opacity-0 group-hover:opacity-100"
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </footer>
  )
}