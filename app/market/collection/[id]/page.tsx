"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useParams } from "next/navigation"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import AbstractShape from "@/components/abstract-shape"
import PixelHeading from "@/components/pixel-heading"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function CollectionDetailPage() {
  const params = useParams()
  const id = params.id
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const [cursorHover, setCursorHover] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Handle cursor effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  // Mock collection data - in a real app, you would fetch this based on the ID
  const collection = {
    id: Number(id),
    name: `VOID ${Number(id) % 2 === 0 ? "RESONANCE" : "CUBES"}`,
    description:
      "A unique collection of digital artifacts from the VOID universe. Each piece contains the essence of digital creativity and blockchain innovation.",
    creator: "VOID_OFFICIAL",
    items: 24,
    owners: 18,
    floorPrice: 0.5,
    volume: 120,
    bannerType: Number(id) % 3 === 0 ? "complex" : Number(id) % 3 === 1 ? "grid" : "wave",
    color: Number(id) % 3 === 0 ? "purple" : Number(id) % 3 === 1 ? "pink" : "blue",
  }

  // Generate mock NFTs for this collection
  const nfts = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    name: `${collection.name} #${i + 1}`,
    creator: collection.creator,
    price: collection.floorPrice + (i % 5) * 0.1,
    type: Number(id) % 2 === 0 ? "music" : "cube",
    shapeType: i % 5 === 0 ? "complex" : i % 5 === 1 ? "grid" : i % 5 === 2 ? "wave" : i % 5 === 3 ? "dots" : "noise",
    color: i % 3 === 0 ? "purple" : i % 3 === 1 ? "pink" : "blue",
  }))

  const filteredNFTs = nfts.filter(
    (nft) =>
      searchQuery === "" ||
      nft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nft.creator.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="relative bg-black text-white overflow-hidden font-pixel">
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
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="0" width="4" height="4" fill="#a855f7" />
          <rect x="28" y="0" width="4" height="4" fill="#a855f7" />
          <rect x="0" y="28" width="4" height="4" fill="#a855f7" />
          <rect x="28" y="28" width="4" height="4" fill="#a855f7" />
          <rect x="12" y="12" width="8" height="8" fill="#ec4899" />
        </svg>
      </motion.div>

      {/* Navigation */}
      <Navigation />

      {/* Collection Banner */}
      <section className="relative pt-20">
        <div className="h-80 overflow-hidden relative">
          <AbstractShape
            className={`w-full h-full ${
              collection.color === "purple"
                ? "text-purple-500/70"
                : collection.color === "pink"
                  ? "text-pink-500/70"
                  : "text-blue-500/70"
            }`}
            type={collection.bannerType as any}
            animate
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
        </div>
      </section>

      {/* Collection Info */}
      <section className="relative py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
              <div>
                <div className="mb-6">
                  <Link
                    href="/market"
                    className="text-purple-400 hover:text-purple-300 transition-colors duration-300 font-pixel flex items-center"
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="mr-2"
                    >
                      <path
                        d="M19 12H5M5 12L12 19M5 12L12 5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    BACK TO MARKETPLACE
                  </Link>
                </div>

                <PixelHeading
                  text={collection.name}
                  className="text-5xl md:text-6xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500"
                />

                <div className="flex items-center mb-6">
                  <span className="text-gray-400 font-pixel">CREATED BY</span>
                  <Link
                    href="#"
                    className="ml-2 text-purple-400 hover:text-purple-300 transition-colors duration-300 font-pixel"
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                  >
                    {collection.creator}
                  </Link>
                </div>

                <p className="text-gray-300 mb-8 font-pixel leading-relaxed max-w-2xl">{collection.description}</p>
              </div>
            </div>

            {/* Collection Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
              {[
                { label: "ITEMS", value: collection.items },
                { label: "OWNERS", value: collection.owners },
                { label: "FLOOR PRICE", value: `${collection.floorPrice} SOL` },
                { label: "VOLUME TRADED", value: `${collection.volume} SOL` },
              ].map((stat, index) => (
                <div key={index} className="bg-black border border-purple-900/50 p-6">
                  <h3 className="text-gray-400 text-sm mb-2 font-pixel">{stat.label}</h3>
                  <p className="text-2xl font-bold text-white font-pixel">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Search and Filter */}
            <div className="mb-12 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-96">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="SEARCH ITEMS..."
                  className="bg-black border-2 border-purple-900 focus:border-purple-500 rounded-none p-4 text-white font-pixel w-full"
                  onMouseEnter={() => setCursorHover(true)}
                  onMouseLeave={() => setCursorHover(false)}
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              <div className="flex space-x-4">
                <select
                  className="bg-black border-2 border-purple-900 focus:border-purple-500 rounded-none p-2 text-white font-pixel"
                  onMouseEnter={() => setCursorHover(true)}
                  onMouseLeave={() => setCursorHover(false)}
                >
                  <option value="recent">RECENTLY ADDED</option>
                  <option value="price-low">PRICE: LOW TO HIGH</option>
                  <option value="price-high">PRICE: HIGH TO LOW</option>
                </select>
              </div>
            </div>

            {/* Collection Items */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredNFTs.map((nft) => (
                <Link href={`/market/nft/${nft.id}`} key={nft.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                    className="bg-black border border-purple-900/50 group hover:border-purple-500 transition-colors duration-300"
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                  >
                    <div className="aspect-square overflow-hidden relative">
                      <AbstractShape
                        className={`w-full h-full ${
                          nft.color === "purple"
                            ? "text-purple-500/70"
                            : nft.color === "pink"
                              ? "text-pink-500/70"
                              : "text-blue-500/70"
                        }`}
                        type={nft.shapeType as any}
                        animate
                      />
                      {nft.type === "music" && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center">
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              className="text-white"
                            >
                              <path d="M8 5.14V19.14L19 12.14L8 5.14Z" fill="currentColor" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-white mb-1 font-pixel">{nft.name}</h3>
                      <div className="flex justify-between items-center">
                        <span className="text-purple-400 font-bold font-pixel">{nft.price} SOL</span>
                        <Button
                          className="bg-transparent border border-pink-500/50 hover:bg-pink-950/30 text-pink-400 rounded-none px-3 py-1 text-xs font-pixel tracking-wide"
                          onMouseEnter={() => setCursorHover(true)}
                          onMouseLeave={() => setCursorHover(false)}
                        >
                          BUY NOW
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
