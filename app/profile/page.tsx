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

export default function ProfilePage() {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const [cursorHover, setCursorHover] = useState(false)
  const [activeTab, setActiveTab] = useState("owned")
  const [isEditing, setIsEditing] = useState(false)
  const [listingPrice, setListingPrice] = useState("")
  const [selectedNFT, setSelectedNFT] = useState<number | null>(null)

  // Mock user data
  const userData = {
    address: "0x8F3E4A7B2C1D5E6F9A8B7C6D5E4F3A2B1C0D9E8A",
    displayName: "VOID_COLLECTOR",
    joinedDate: "OCT 2023",
    balance: 12.45,
    totalValue: 24.8,
    transactions: 32,
    nftsOwned: 8,
    nftsMinted: 3,
  }

  // Mock NFT data
  const ownedNFTs = [
    {
      id: 1,
      name: "VOID CUBE #001",
      collection: "VOID CUBES",
      acquired: "2023-10-15",
      price: 0.5,
      type: "cube",
      shapeType: "complex",
      color: "purple",
    },
    {
      id: 2,
      name: "SYNTHWAVE DREAM",
      collection: "RESONANCE",
      acquired: "2023-10-18",
      price: 0.3,
      type: "music",
      shapeType: "wave",
      color: "pink",
    },
    {
      id: 3,
      name: "VOID CUBE #002",
      collection: "VOID CUBES",
      acquired: "2023-10-20",
      price: 0.6,
      type: "cube",
      shapeType: "grid",
      color: "blue",
    },
    {
      id: 4,
      name: "DIGITAL ECHO",
      collection: "RESONANCE",
      acquired: "2023-10-22",
      price: 0.4,
      type: "music",
      shapeType: "dots",
      color: "purple",
    },
  ]

  const mintedNFTs = [
    {
      id: 101,
      name: "VOID CUBE #101",
      collection: "VOID CUBES",
      minted: "2023-10-10",
      price: 0.5,
      type: "cube",
      shapeType: "noise",
      color: "pink",
    },
    {
      id: 102,
      name: "AMBIENT VOID",
      collection: "RESONANCE",
      minted: "2023-10-12",
      price: 0.25,
      type: "music",
      shapeType: "wave",
      color: "blue",
    },
    {
      id: 103,
      name: "VOID CUBE #102",
      collection: "VOID CUBES",
      minted: "2023-10-14",
      price: 0.45,
      type: "cube",
      shapeType: "complex",
      color: "purple",
    },
  ]

  const listedNFTs = [
    {
      id: 201,
      name: "VOID CUBE #201",
      collection: "VOID CUBES",
      listed: "2023-10-25",
      price: 0.8,
      type: "cube",
      shapeType: "grid",
      color: "blue",
    },
  ]

  // Handle cursor effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  const handleListNFT = (nftId: number) => {
    setSelectedNFT(nftId)
    setIsEditing(true)
  }

  const handleConfirmListing = () => {
    // This would be replaced with actual listing logic
    console.log(`Listing NFT #${selectedNFT} for ${listingPrice} SOL`)
    setIsEditing(false)
    setSelectedNFT(null)
    setListingPrice("")
  }

  const handleCancelListing = () => {
    setIsEditing(false)
    setSelectedNFT(null)
    setListingPrice("")
  }

  const handleDisconnect = () => {
    // This would be replaced with actual wallet disconnection logic
    console.log("Disconnecting wallet...")
    // Redirect to home page after disconnecting
    window.location.href = "/"
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
          <rect x="28" y="28" width="4" height="4" fill="#a855f7" />
          <rect x="12" y="12" width="8" height="8" fill="#ec4899" />
        </svg>
      </motion.div>

      {/* Navigation */}
      <Navigation />

      {/* Profile Header */}
      <section className="relative pt-32 pb-20">
        <div className="absolute inset-0 z-0 h-[50vh] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-black to-black"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <AbstractShape className="w-full h-full text-purple-500/10" type="grid" animate />
          </div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12">
              <div className="flex items-center mb-6 md:mb-0">
                <div className="w-20 h-20 mr-6 relative overflow-hidden">
                  <AbstractShape className="w-full h-full text-purple-500" type="complex" animate />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-white"
                      >
                        <path
                          d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2 font-pixel">{userData.displayName}</h1>
                  <div className="flex items-center">
                    <span className="text-gray-400 text-sm font-pixel mr-2">JOINED {userData.joinedDate}</span>
                    <div className="flex items-center bg-purple-900/30 px-2 py-1">
                      <span className="text-purple-400 text-xs font-pixel truncate max-w-[120px] md:max-w-none">
                        {userData.address.substring(0, 6)}...{userData.address.substring(userData.address.length - 4)}
                      </span>
                      <button
                        className="ml-2 text-gray-400 hover:text-white transition-colors"
                        onMouseEnter={() => setCursorHover(true)}
                        onMouseLeave={() => setCursorHover(false)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M8 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21H17C18.1046 21 19 20.1046 19 19V16M21 3H13V11H21V3Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button
                  className="bg-transparent border border-purple-500 hover:bg-purple-950/30 text-purple-400 rounded-none px-4 py-2 text-sm font-pixel tracking-wide"
                  onMouseEnter={() => setCursorHover(true)}
                  onMouseLeave={() => setCursorHover(false)}
                >
                  EDIT PROFILE
                </Button>
                <Button
                  onClick={handleDisconnect}
                  className="bg-transparent border border-pink-500 hover:bg-pink-950/30 text-pink-400 rounded-none px-4 py-2 text-sm font-pixel tracking-wide"
                  onMouseEnter={() => setCursorHover(true)}
                  onMouseLeave={() => setCursorHover(false)}
                >
                  DISCONNECT
                </Button>
              </div>
            </div>

            {/* Wallet Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
              {[
                { label: "BALANCE", value: `${userData.balance} SOL` },
                { label: "PORTFOLIO VALUE", value: `${userData.totalValue} SOL` },
                { label: "TRANSACTIONS", value: userData.transactions },
                { label: "NFTS OWNED", value: userData.nftsOwned },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-black border border-purple-900/50 p-6"
                >
                  <h3 className="text-gray-400 text-sm mb-2 font-pixel">{stat.label}</h3>
                  <p className="text-2xl font-bold text-white font-pixel">{stat.value}</p>
                </motion.div>
              ))}
            </div>

            {/* NFT Tabs */}
            <Tabs defaultValue="owned" className="w-full" onValueChange={(value) => setActiveTab(value)}>
              <div className="flex justify-center mb-10">
                <TabsList className="bg-black border-2 border-purple-900 p-1 rounded-none">
                  <TabsTrigger
                    value="owned"
                    className="data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-400 rounded-none px-6 py-3 font-pixel"
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                  >
                    OWNED NFTs
                  </TabsTrigger>
                  <TabsTrigger
                    value="minted"
                    className="data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-400 rounded-none px-6 py-3 font-pixel"
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                  >
                    MINTED NFTs
                  </TabsTrigger>
                  <TabsTrigger
                    value="listed"
                    className="data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-400 rounded-none px-6 py-3 font-pixel"
                    onMouseEnter={() => setCursorHover(true)}
                    onMouseLeave={() => setCursorHover(false)}
                  >
                    LISTED NFTs
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Owned NFTs Tab */}
              <TabsContent value="owned" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {ownedNFTs.map((nft) => (
                    <motion.div
                      key={nft.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
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
                        <p className="text-gray-400 text-sm mb-3 font-pixel">{nft.collection}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-purple-400 font-bold font-pixel">{nft.price} SOL</span>
                          <Button
                            onClick={() => handleListNFT(nft.id)}
                            className="bg-transparent border border-pink-500/50 hover:bg-pink-950/30 text-pink-400 rounded-none px-3 py-1 text-xs font-pixel tracking-wide"
                            onMouseEnter={() => setCursorHover(true)}
                            onMouseLeave={() => setCursorHover(false)}
                          >
                            LIST FOR SALE
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>

              {/* Minted NFTs Tab */}
              <TabsContent value="minted" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {mintedNFTs.map((nft) => (
                    <motion.div
                      key={nft.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
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
                        <p className="text-gray-400 text-sm mb-3 font-pixel">{nft.collection}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-purple-400 font-bold font-pixel">{nft.price} SOL</span>
                          <div className="text-xs text-gray-400 font-pixel">MINTED {nft.minted}</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>

              {/* Listed NFTs Tab */}
              <TabsContent value="listed" className="mt-0">
                {listedNFTs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {listedNFTs.map((nft) => (
                      <motion.div
                        key={nft.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
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
                          <p className="text-gray-400 text-sm mb-3 font-pixel">{nft.collection}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-purple-400 font-bold font-pixel">{nft.price} SOL</span>
                            <div className="flex items-center">
                              <div className="text-xs text-gray-400 font-pixel mr-2">LISTED {nft.listed}</div>
                              <Button
                                className="bg-transparent border border-red-500/50 hover:bg-red-950/30 text-red-400 rounded-none px-3 py-1 text-xs font-pixel tracking-wide"
                                onMouseEnter={() => setCursorHover(true)}
                                onMouseLeave={() => setCursorHover(false)}
                              >
                                CANCEL
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <AbstractShape className="w-24 h-24 mx-auto text-purple-500/30 mb-6" type="grid" />
                    <h3 className="text-2xl font-bold text-white mb-4 font-pixel">NO LISTED NFTS</h3>
                    <p className="text-gray-400 mb-6 font-pixel">You haven't listed any NFTs for sale yet.</p>
                    <Button
                      asChild
                      className="bg-transparent border-2 border-purple-500 hover:bg-purple-950/30 text-white rounded-none px-6 py-3 text-lg font-pixel tracking-wide"
                      onMouseEnter={() => setCursorHover(true)}
                      onMouseLeave={() => setCursorHover(false)}
                    >
                      <Link href="#owned">LIST AN NFT</Link>
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      {/* Listing Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-black border-2 border-purple-500 p-8 max-w-md w-full"
          >
            <h3 className="text-2xl font-bold text-white mb-6 font-pixel">LIST NFT FOR SALE</h3>
            <div className="mb-6">
              <label className="block text-gray-300 mb-2 font-pixel">PRICE (SOL)</label>
              <Input
                type="number"
                value={listingPrice}
                onChange={(e) => setListingPrice(e.target.value)}
                placeholder="0.00"
                className="bg-black border-2 border-purple-900 focus:border-purple-500 rounded-none p-4 text-white font-pixel w-full"
                onMouseEnter={() => setCursorHover(true)}
                onMouseLeave={() => setCursorHover(false)}
              />
            </div>
            <div className="flex space-x-4">
              <Button
                onClick={handleConfirmListing}
                disabled={!listingPrice}
                className="bg-transparent border-2 border-purple-500 hover:bg-purple-950/30 text-white rounded-none px-6 py-3 font-pixel tracking-wide flex-1"
                onMouseEnter={() => setCursorHover(true)}
                onMouseLeave={() => setCursorHover(false)}
              >
                CONFIRM
              </Button>
              <Button
                onClick={handleCancelListing}
                className="bg-transparent border-2 border-pink-500 hover:bg-pink-950/30 text-white rounded-none px-6 py-3 font-pixel tracking-wide flex-1"
                onMouseEnter={() => setCursorHover(true)}
                onMouseLeave={() => setCursorHover(false)}
              >
                CANCEL
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Activity Section */}
      <section className="relative py-20 bg-purple-950/10">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <PixelHeading
              text="RECENT ACTIVITY"
              className="text-4xl md:text-5xl font-black tracking-tighter mb-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600"
            />

            <div className="border border-purple-900/50">
              <div className="grid grid-cols-4 gap-4 p-4 border-b border-purple-900/50 bg-purple-950/10">
                <p className="text-gray-400 font-pixel">EVENT</p>
                <p className="text-gray-400 font-pixel">ITEM</p>
                <p className="text-gray-400 font-pixel">PRICE</p>
                <p className="text-gray-400 font-pixel">DATE</p>
              </div>
              {[
                { event: "Purchase", item: "VOID CUBE #001", price: 0.5, date: "2023-10-15" },
                { event: "Mint", item: "VOID CUBE #101", price: 0, date: "2023-10-10" },
                { event: "Purchase", item: "SYNTHWAVE DREAM", price: 0.3, date: "2023-10-18" },
                { event: "List", item: "VOID CUBE #201", price: 0.8, date: "2023-10-25" },
                { event: "Mint", item: "AMBIENT VOID", price: 0, date: "2023-10-12" },
              ].map((item, index) => (
                <div key={index} className="grid grid-cols-4 gap-4 p-4 border-b border-purple-900/50 last:border-0">
                  <p className="text-white font-pixel">{item.event}</p>
                  <p className="text-purple-400 font-pixel">{item.item}</p>
                  <p className="text-white font-pixel">{item.price} SOL</p>
                  <p className="text-gray-400 font-pixel">{item.date}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Analytics Section */}
      <section className="relative py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <PixelHeading
              text="PORTFOLIO ANALYTICS"
              className="text-4xl md:text-5xl font-black tracking-tighter mb-10 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-600"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-black border border-purple-900/50 p-6">
                <h3 className="text-xl font-bold text-white mb-4 font-pixel">COLLECTION DISTRIBUTION</h3>
                <div className="h-64 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-full flex">
                      <div className="h-full w-[60%] bg-purple-500/50"></div>
                      <div className="h-full w-[25%] bg-pink-500/50"></div>
                      <div className="h-full w-[15%] bg-blue-500/50"></div>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/70">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-purple-400 font-pixel text-sm">VOID CUBES</span>
                      <span className="text-white font-pixel text-sm">60%</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-pink-400 font-pixel text-sm">RESONANCE</span>
                      <span className="text-white font-pixel text-sm">25%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-400 font-pixel text-sm">OTHER</span>
                      <span className="text-white font-pixel text-sm">15%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-black border border-purple-900/50 p-6">
                <h3 className="text-xl font-bold text-white mb-4 font-pixel">PORTFOLIO VALUE OVER TIME</h3>
                <div className="h-64 relative">
                  <div className="absolute inset-0 flex items-end">
                    <div className="w-full h-full relative">
                      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                        <path
                          d="M0,100 L0,80 C10,75 20,85 30,70 C40,55 50,65 60,50 C70,35 80,45 90,30 L100,20 L100,100 Z"
                          fill="url(#gradient)"
                          opacity="0.5"
                        />
                        <path
                          d="M0,80 C10,75 20,85 30,70 C40,55 50,65 60,50 C70,35 80,45 90,30 L100,20"
                          fill="none"
                          stroke="url(#gradient)"
                          strokeWidth="1"
                        />
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#a855f7" />
                            <stop offset="100%" stopColor="#ec4899" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4 text-xs text-gray-400 font-pixel">
                        <span>OCT</span>
                        <span>NOV</span>
                        <span>DEC</span>
                        <span>JAN</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
