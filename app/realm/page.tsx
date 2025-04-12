"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import PixelHeading from "@/components/pixel-heading"
import AbstractShape from "@/components/abstract-shape"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Define the realms data
const realms = [
  {
    id: "echo",
    name: "ECHO",
    poem: "Whispers of forgotten code,\nEchoes in digital halls,\nMemories fragmented,\nReality dissolves.",
    theme: "Memory and Reflection",
    description:
      "A realm of reflective surfaces and echoing sounds, where players confront distorted versions of their past choices. The environment shifts and changes based on the player's actions, creating a unique experience with each visit.",
    color: "from-blue-400 to-purple-600",
    shapeType: "wave",
  },
  {
    id: "nexus",
    name: "NEXUS",
    poem: "Connections intertwined,\nThreads of fate unbound,\nPaths converge and diverge,\nDestiny is found.",
    theme: "Connection and Convergence",
    description:
      "The central hub where all realms connect. A vast network of pathways and nodes, representing the interconnectedness of all experiences within VOID. Players can glimpse other realms and the choices of other players.",
    color: "from-purple-400 to-pink-600",
    shapeType: "grid",
  },
  {
    id: "abyss",
    name: "ABYSS",
    poem: "Depths unfathomable,\nDarkness that consumes,\nIn absence, truth emerges,\nFrom void, light blooms.",
    theme: "Emptiness and Discovery",
    description:
      "A realm of vast emptiness punctuated by moments of intense beauty. Players must navigate through darkness, discovering hidden meanings and uncovering the secrets of the void itself.",
    color: "from-pink-400 to-blue-600",
    shapeType: "dots",
  },
  {
    id: "pulse",
    name: "PULSE",
    poem: "Rhythmic vibrations,\nHeartbeat of the machine,\nSynchronized motion,\nLife in the unseen.",
    theme: "Rhythm and Vitality",
    description:
      "A realm pulsing with energy and life. Players must synchronize with the rhythm of this world to progress, creating harmonies that reveal new paths and possibilities.",
    color: "from-blue-400 to-pink-600",
    shapeType: "complex",
  },
  {
    id: "cipher",
    name: "CIPHER",
    poem: "Symbols and patterns,\nLanguage beyond words,\nDecoding existence,\nTruth becomes blurred.",
    theme: "Mystery and Knowledge",
    description:
      "A realm of puzzles and cryptic messages. Players decipher ancient codes to unlock the secrets of VOID's creation and purpose, gaining insights that transcend the digital realm.",
    color: "from-purple-400 to-blue-600",
    shapeType: "noise",
  },
]

export default function RealmPage() {
  const [selectedRealm, setSelectedRealm] = useState(realms[0])

  return (
    <div className="relative min-h-screen bg-black text-white font-pixel">
      <Navigation />

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-black to-black"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <PixelHeading
                text="REALMS OF VOID"
                className="text-6xl md:text-7xl font-black tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500"
              />
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Explore the different dimensions that make up the VOID universe. Each realm has its own story, theme,
                and secrets to discover.
              </p>
            </motion.div>

            {/* Realm Navigation */}
            <div className="flex flex-wrap justify-center gap-4 mb-16">
              {realms.map((realm) => (
                <Button
                  key={realm.id}
                  onClick={() => setSelectedRealm(realm)}
                  variant="outline"
                  className={cn(
                    "border-2 rounded-none px-6 py-3 text-lg font-pixel tracking-wide transition-all duration-300",
                    selectedRealm.id === realm.id
                      ? "border-purple-500 bg-purple-950/30 text-white"
                      : "border-gray-700 hover:border-purple-500/50 hover:bg-purple-950/20 text-gray-400",
                  )}
                >
                  {realm.name}
                </Button>
              ))}
            </div>

            {/* Selected Realm Content */}
            <motion.div
              key={selectedRealm.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
            >
              {/* Realm Visualization */}
              <div className="relative order-2 lg:order-1">
                <div className="absolute -inset-4 bg-gradient-to-r opacity-70 blur-lg"></div>
                <div className="relative aspect-square overflow-hidden border border-purple-500/30">
                  <AbstractShape
                    className={`w-full h-full text-transparent bg-clip-text bg-gradient-to-r ${selectedRealm.color}`}
                    type={selectedRealm.shapeType as any}
                    animate
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 relative">
                    <motion.div
                      initial={{ rotateX: 0, rotateY: 0 }}
                      animate={{ rotateX: 360, rotateY: 360 }}
                      transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      style={{ perspective: 1000 }}
                      className="w-full h-full"
                    >
                      <div className="relative w-full h-full transform-style-preserve-3d">
                        {/* Cube faces */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-transparent border border-purple-500/50"
                          style={{ transform: "translateZ(50px)" }}
                        />
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-br from-pink-500/30 to-transparent border border-pink-500/50"
                          style={{ transform: "rotateY(180deg) translateZ(50px)" }}
                        />
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-transparent border border-blue-500/50"
                          style={{ transform: "rotateY(90deg) translateZ(50px)" }}
                        />
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-transparent border border-purple-500/50"
                          style={{ transform: "rotateY(-90deg) translateZ(50px)" }}
                        />
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-br from-pink-500/30 to-transparent border border-pink-500/50"
                          style={{ transform: "rotateX(90deg) translateZ(50px)" }}
                        />
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-transparent border border-blue-500/50"
                          style={{ transform: "rotateX(-90deg) translateZ(50px)" }}
                        />
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Realm Information */}
              <div className="order-1 lg:order-2">
                <PixelHeading
                  text={`REALM: ${selectedRealm.name}`}
                  className={`text-4xl md:text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r ${selectedRealm.color}`}
                />

                <div className="mb-8 p-6 bg-black/50 border border-purple-900/50">
                  <h3 className="text-xl font-bold text-purple-300 mb-4">THE POEM</h3>
                  <p className="text-gray-300 whitespace-pre-line font-pixel leading-relaxed">{selectedRealm.poem}</p>
                </div>

                <div className="mb-8">
                  <h3 className="text-xl font-bold text-purple-300 mb-4">THEME</h3>
                  <p className="text-gray-300 font-pixel">{selectedRealm.theme}</p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-purple-300 mb-4">LORE</h3>
                  <p className="text-gray-300 leading-relaxed">{selectedRealm.description}</p>
                </div>

                <div className="mt-8 p-4 bg-purple-900/20 border border-purple-500/30">
                  <h3 className="text-lg font-bold text-purple-300 mb-2">NFT CONNECTION</h3>
                  <p className="text-gray-400 text-sm">
                    Artifacts discovered in the {selectedRealm.name} realm become unique NFTs, each carrying a piece of
                    this realm's essence.
                    <span className="block mt-2 text-purple-300">
                      "This cube was born from Realm: {selectedRealm.name}"
                    </span>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Global styles for 3D transformations */}
      <style jsx global>{`
        .transform-style-preserve-3d {
          transform-style: preserve-3d;
        }
      `}</style>

      <Footer />
    </div>
  )
}
