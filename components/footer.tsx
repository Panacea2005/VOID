"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import PixelHeading from "./pixel-heading"

export default function Footer() {
  const [cursorHover, setCursorHover] = useState(false)

  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative py-20 border-t border-purple-900/30 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16">
          <div>
            <PixelHeading
              text="VOID"
              className="text-3xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600"
            />
            <p className="text-gray-400 mb-6 max-w-md font-pixel">
              AN IMMERSIVE ARTISTIC EXPERIENCE THAT CHALLENGES YOUR PERCEPTION OF REALITY
            </p>
            <div className="flex space-x-4">
              {[1, 2, 3].map((i) => (
                <motion.a
                  key={i}
                  href="#"
                  className="w-10 h-10 flex items-center justify-center text-purple-400 hover:text-purple-300 transition-colors duration-300"
                  whileHover={{ y: -3 }}
                  onMouseEnter={() => setCursorHover(true)}
                  onMouseLeave={() => setCursorHover(false)}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="4" y="4" width="16" height="16" stroke="currentColor" strokeWidth="2" />
                    <rect x="8" y="8" width="8" height="8" fill="currentColor" />
                  </svg>
                </motion.a>
              ))}
            </div>
          </div>

          <div>
            <PixelHeading text="QUICK LINKS" className="text-lg font-bold mb-6 text-white" />
            <ul className="space-y-3 font-pixel">
              {[
                { name: "HOME", path: "/" },
                { name: "GAME", path: "/game" },
                { name: "ABOUT", path: "/about" },
                { name: "GALLERY", path: "/gallery" },
              ].map((link) => (
                <li key={link.path}>
                  <Link
                    href={link.path}
                    className="text-gray-400 hover:text-purple-400 transition-colors duration-300 flex items-center group"
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                  >
                    <span>{link.name}</span>
                    <svg
                      className="ml-1 w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect x="0" y="0" width="4" height="4" fill="currentColor" />
                      <rect x="8" y="8" width="4" height="4" fill="currentColor" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <PixelHeading text="SUPPORT" className="text-lg font-bold mb-6 text-white" />
            <ul className="space-y-3 font-pixel">
              {[
                { name: "FAQ", path: "#" },
                { name: "CONTACT", path: "#" },
                { name: "PRIVACY", path: "#" },
                { name: "TERMS", path: "#" },
              ].map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.path}
                    className="text-gray-400 hover:text-purple-400 transition-colors duration-300 flex items-center group"
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                  >
                    <span>{link.name}</span>
                    <svg
                      className="ml-1 w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect x="0" y="0" width="4" height="4" fill="currentColor" />
                      <rect x="8" y="8" width="4" height="4" fill="currentColor" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm mb-4 md:mb-0 font-pixel">
            &copy; {currentYear} VOID. ALL RIGHTS RESERVED.
          </p>
          <div className="flex space-x-6">
            <Link
              href="#"
              className="text-gray-500 hover:text-purple-400 text-sm transition-colors duration-300 font-pixel"
              onMouseEnter={() => setCursorHover(true)}
              onMouseLeave={() => setCursorHover(false)}
            >
              PRIVACY
            </Link>
            <Link
              href="#"
              className="text-gray-500 hover:text-purple-400 text-sm transition-colors duration-300 font-pixel"
              onMouseEnter={() => setCursorHover(true)}
              onMouseLeave={() => setCursorHover(false)}
            >
              TERMS
            </Link>
            <Link
              href="#"
              className="text-gray-500 hover:text-purple-400 text-sm transition-colors duration-300 font-pixel"
              onMouseEnter={() => setCursorHover(true)}
              onMouseLeave={() => setCursorHover(false)}
            >
              COOKIES
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
