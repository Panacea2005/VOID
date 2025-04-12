"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import AbstractShape from "@/components/abstract-shape"
import PixelHeading from "@/components/pixel-heading"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"

export default function MarketPage() {
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

  // Mock NFT data
  const collections = [
    {
      id: 1,
      name: "VOID CUBES",
      creator: "VOID_OFFICIAL",
      items: 24,
      floorPrice: 0.5,
      bannerType: "complex",
      color: "purple",
    },
    {
      id: 2,
      name: "RESONANCE",
      creator: "VOID_MUSIC",
      items: 16,
      floorPrice: 0.3,
      bannerType: "wave",
      color: "pink",
    },
    {
      id: 3,
      name: "DIGITAL DREAMS",
      creator: "VOID_COMMUNITY",
      items: 32,
      floorPrice: 0.2,
      bannerType: "grid",
      color: "blue",
    },
    {
      id: 4,
      name: "NEON ARTIFACTS",
      creator: "VOID_LABS",
      items: 12,
      floorPrice: 0.8,
      bannerType: "dots",
      color: "purple",
    },
  ]

  const nfts = [
    {
      id: 1,
      name: "VOID CUBE #001",
      creator: "VOID_OFFICIAL",
      price: 0.5,
      type: "cube",
      shapeType: "complex",
      color: "purple",
    },
    {
      id: 2,
      name: "SYNTHWAVE DREAM",
      creator: "VOID_MUSIC",
      price: 0.3,
      type: "music",
      shapeType: "wave",
      color: "pink",
    },
    {
      id: 3,
      name: "VOID CUBE #002",
      creator: "VOID_OFFICIAL",
      price: 0.6,
      type: "cube",
      shapeType: "grid",
      color: "blue",
    },
    {
      id: 4,
      name: "DIGITAL ECHO",
      creator: "VOID_MUSIC",
      price: 0.4,
      type: "music",
      shapeType: "dots",
      color: "purple",
    },
    {
      id: 5,
      name: "VOID CUBE #003",
      creator: "VOID_COMMUNITY",
      price: 0.2,
      type: "cube",
      shapeType: "noise",
      color: "pink",
    },
    {
      id: 6,
      name: "AMBIENT VOID",
      creator: "VOID_COMMUNITY",
      price: 0.25,
      type: "music",
      shapeType: "wave",
      color: "blue",
    },
  ]

  const filteredNFTs = (type: string) => {
    return nfts
      .filter((nft) => nft.type === type)
      .filter(
        (nft) =>
          searchQuery === "" ||
          nft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          nft.creator.toLowerCase().includes(searchQuery.toLowerCase()),
      )
  }

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
          <rect x="28" y="0" />
          <rect x="0" y="28" width="4" height="4" fill="#a855f7" />
          <rect x="28" y="28" width="4" height="4" fill="#a855f7" />
          <rect x="12" y="12" width="8" height="8" fill="#ec4899" />
        </svg>
      </motion.div>

      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-black to-black"></div>
        </div>

        {/* Modern Market Banner */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {/* Grid Pattern */}
          <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 opacity-20">
            {Array.from({ length: 144 }).map((_, i) => (
              <div key={i} className="border border-purple-800/20"></div>
            ))}
          </div>

          {/* Blockchain Visualization */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <g opacity="0.2">
              {/* Horizontal lines */}
              <line x1="10" y1="30" x2="90" y2="30" stroke="#a855f7" strokeWidth="0.5" />
              <line x1="10" y1="50" x2="90" y2="50" stroke="#ec4899" strokeWidth="0.5" />
              <line x1="10" y1="70" x2="90" y2="70" stroke="#3b82f6" strokeWidth="0.5" />

              {/* Blockchain Nodes */}
              {[...Array(9)].map((_, i) => (
                <g key={`node-group-${i}`}>
                  <circle cx={10 + i * 10} cy="30" r="2" fill="#a855f7" />
                  <circle cx={10 + i * 10} cy="50" r="2" fill="#ec4899" />
                  <circle cx={10 + i * 10} cy="70" r="2" fill="#3b82f6" />
                </g>
              ))}

              {/* Vertical connections */}
              {[...Array(9)].map((_, i) => (
                <g key={`vert-conn-${i}`}>
                  <line
                    x1={10 + i * 10}
                    y1="30"
                    x2={10 + i * 10}
                    y2="50"
                    stroke="#a855f7"
                    strokeWidth="0.3"
                    strokeDasharray="2,2"
                  />
                  <line
                    x1={10 + i * 10}
                    y1="50"
                    x2={10 + i * 10}
                    y2="70"
                    stroke="#ec4899"
                    strokeWidth="0.3"
                    strokeDasharray="2,2"
                  />
                </g>
              ))}
            </g>
          </svg>

          {/* Animated gradient overlay */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-gradient-radial from-purple-500/20 to-transparent animate-pulse-slow"></div>
            <div className="absolute inset-0 bg-gradient-radial from-pink-500/10 to-transparent animate-pulse-slow delay-1000"></div>
          </div>
        </div>

        <div className="container mx-auto px-4 z-10 relative">
          <div className="max-w-7xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="mb-6"
            >
              <PixelHeading
                text="MARKETPLACE"
                className="text-8xl sm:text-9xl md:text-[12rem] font-black tracking-tighter mb-6 leading-none text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500"
                animate
              />
              <PixelHeading
                text="DISCOVER DIGITAL ARTIFACTS"
                className="text-3xl sm:text-4xl md:text-5xl mt-2 tracking-wide text-gray-300"
                animate
              />
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-10 font-light"
            >
              Explore and collect unique digital assets from the VOID universe
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-6"
              onMouseEnter={() => setCursorHover(true)}
              onMouseLeave={() => setCursorHover(false)}
            >
              <Button
                size="lg"
                className="bg-transparent border-2 border-purple-500 hover:bg-purple-950/30 text-white rounded-none px-10 py-8 text-xl font-pixel tracking-wide transition-all duration-300"
                onClick={() => document.getElementById("marketplace")?.scrollIntoView({ behavior: "smooth" })}
              >
                BROWSE COLLECTIONS
              </Button>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
        >
          <div className="flex flex-col items-center">
            <p className="text-sm text-gray-400 mb-2 font-pixel">SCROLL TO EXPLORE</p>
            <svg width="24" height="40" viewBox="0 0 24 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="0" y="0" width="24" height="40" stroke="#a855f7" strokeWidth="2" />
              <motion.rect
                animate={{ y: [4, 28, 4] }}
                transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
                x="8"
                width="8"
                height="8"
                fill="#ec4899"
              />
            </svg>
          </div>
        </motion.div>
      </section>

      {/* Marketplace Section */}
      <section id="marketplace" className="relative py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
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

            <Tabs defaultValue="collections" className="w-full">
              <div className="flex justify-center mb-10">
                <TabsList className="bg-black border-2 border-purple-900 p-1 rounded-none">
                  <TabsTrigger
                    value="collections"
                    className="data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-400 rounded-none px-6 py-3 font-pixel"
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                  >
                    COLLECTIONS
                  </TabsTrigger>
                  <TabsTrigger
                    value="cubes"
                    className="data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-400 rounded-none px-6 py-3 font-pixel"
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                  >
                    CUBES
                  </TabsTrigger>
                  <TabsTrigger
                    value="music"
                    className="data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-400 rounded-none px-6 py-3 font-pixel"
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                  >
                    MUSIC
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Collections Tab */}
              <TabsContent value="collections" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {collections.map((collection) => (
                    <Link href={`/market/collection/${collection.id}`} key={collection.id}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        viewport={{ once: true }}
                        className="bg-black border border-purple-900/50 group hover:border-purple-500 transition-colors duration-300"
                        onMouseEnter={() => setCursorHover(true)}
                        onMouseLeave={() => setCursorHover(false)}
                      >
                        <div className="h-48 overflow-hidden relative">
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
                          <div className="absolute bottom-4 left-4">
                            <h3 className="text-2xl font-bold text-white mb-1 font-pixel">{collection.name}</h3>
                            <p className="text-gray-400 text-sm font-pixel">BY {collection.creator}</p>
                          </div>
                        </div>
                        <div className="p-4 flex justify-between items-center">
                          <div>
                            <p className="text-gray-400 text-sm font-pixel">{collection.items} ITEMS</p>
                          </div>
                          <div>
                            <p className="text-white font-bold font-pixel">
                              FLOOR: <span className="text-purple-400">{collection.floorPrice} SOL</span>
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </TabsContent>

              {/* Cubes Tab */}
              <TabsContent value="cubes" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {filteredNFTs("cube").map((nft) => (
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
                        </div>
                        <div className="p-4">
                          <h3 className="text-lg font-bold text-white mb-1 font-pixel">{nft.name}</h3>
                          <p className="text-gray-400 text-sm mb-3 font-pixel">BY {nft.creator}</p>
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
              </TabsContent>

              {/* Music Tab */}
              <TabsContent value="music" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {filteredNFTs("music").map((nft) => (
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
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center">
                              <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="text-white"
                              >
                                <path d="M8 5.14V19.14L19 12.14L8 5.14Z" fill="currentColor" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="text-lg font-bold text-white mb-1 font-pixel">{nft.name}</h3>
                          <p className="text-gray-400 text-sm mb-3 font-pixel">BY {nft.creator}</p>
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
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      {/* Featured Section */}
      <section className="relative py-20 bg-purple-950/10">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <PixelHeading
              text="FEATURED COLLECTION"
              className="text-5xl md:text-6xl font-black tracking-tighter mb-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 text-center"
            />

            <div className="relative mb-12">
              <div className="h-64 overflow-hidden relative">
                <AbstractShape className="w-full h-full text-purple-500/50" type="complex" animate />
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
                <div className="absolute bottom-8 left-8">
                  <h3 className="text-4xl font-bold text-white mb-2 font-pixel">GENESIS VOID CUBES</h3>
                  <p className="text-gray-300 text-xl font-pixel">THE ORIGINAL COLLECTION</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-black border border-purple-900/50 group hover:border-purple-500 transition-colors duration-300"
                  onMouseEnter={() => setCursorHover(true)}
                  onMouseLeave={() => setCursorHover(false)}
                >
                  <div className="aspect-square overflow-hidden relative">
                    <AbstractShape
                      className={`w-full h-full ${
                        index % 3 === 0
                          ? "text-purple-500/70"
                          : index % 3 === 1
                            ? "text-pink-500/70"
                            : "text-blue-500/70"
                      }`}
                      type={index % 4 === 0 ? "complex" : index % 4 === 1 ? "grid" : index % 4 === 2 ? "dots" : "noise"}
                      animate
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-white mb-1 font-pixel">GENESIS CUBE #{index + 1}</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-purple-400 font-bold font-pixel">{(index + 1) * 0.25} SOL</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="text-center">
              <Button
                asChild
                className="bg-transparent border-2 border-purple-500 hover:bg-purple-950/30 text-white rounded-none px-8 py-4 text-lg font-pixel tracking-wide"
                onMouseEnter={() => setCursorHover(true)}
                onMouseLeave={() => setCursorHover(false)}
              >
                <Link href="/market/collection/1">VIEW COLLECTION</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: "TOTAL VOLUME", value: "1,245 SOL" },
                { label: "FLOOR PRICE", value: "0.2 SOL" },
                { label: "ITEMS", value: "1,024" },
                { label: "OWNERS", value: "512" },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-black border border-purple-900/50 p-6 text-center"
                >
                  <h3 className="text-gray-400 text-sm mb-2 font-pixel">{stat.label}</h3>
                  <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 font-pixel">
                    {stat.value}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-t from-purple-950/30 via-black to-black"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <PixelHeading
                text="CREATE YOUR OWN NFT"
                className="text-6xl md:text-7xl font-black tracking-tighter mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500"
              />
              <p className="text-xl md:text-2xl text-gray-300 mb-10 font-pixel">
                USE OUR AI TOOLS TO GENERATE UNIQUE DIGITAL ASSETS
              </p>

              <Button
                asChild
                size="lg"
                className="bg-transparent border-2 border-purple-500 hover:bg-purple-950/30 text-white rounded-none px-12 py-8 text-2xl font-pixel tracking-wide transition-all duration-300"
                onMouseEnter={() => setCursorHover(true)}
                onMouseLeave={() => setCursorHover(false)}
              >
                <Link href="/ai">CREATE NOW</Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
