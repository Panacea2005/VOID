import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import VoidHub from "./hub/void-hub";
import EchoRealm from "./realms/echo/echo-realm";
import NexusRealm from "./realms/nexus/nexus-realm";
import AbyssRealm from "./realms/abyss/abyss-realm";
import RealmPlaceholder from "./realms/cipher/realm-placeholder";
import PulseRealm from "./realms/pulse/pulse-realm";

// Main Game Component
interface VoidResonanceGameProps {
  onExit: () => void;
}

const VoidResonanceGame: React.FC<VoidResonanceGameProps> = ({ onExit }) => {
  const [currentScreen, setCurrentScreen] = useState("hub"); // "hub", "echo", "abyss", "pulse", "cipher", "nexus"
  const [loading, setLoading] = useState(true);
  const [enterAnimation, setEnterAnimation] = useState(false);
  // Add state for selectedCubeId
  const [selectedCubeId, setSelectedCubeId] = useState("pink-neon");

  // Log the selected cube ID for debugging
  useEffect(() => {
    console.log("VoidResonanceGame - selectedCubeId:", selectedCubeId);
  }, [selectedCubeId]);

  // Handle realm selection
  const selectRealm = (realm: string) => {
    setEnterAnimation(true);
    setTimeout(() => {
      setCurrentScreen(realm);
      setLoading(true);

      setTimeout(() => {
        setEnterAnimation(false);
        setLoading(false);
      }, 500);
    }, 1000); // Time to match the cube animation in void-hub
  };

  // Return to hub
  const returnToHub = () => {
    setLoading(true);
    setTimeout(() => {
      setCurrentScreen("hub");
      setLoading(false);
    }, 800);
  };

  // Initial loading
  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  // Handle cube selection from hub
  const handleCubeChange = (cubeId: string) => {
    console.log("Cube changed to:", cubeId);
    setSelectedCubeId(cubeId);
  };

  // Get realm colors for animation
  const getRealmColors = (realmId: string) => {
    switch (realmId) {
      case "echo":
        return { color: "#a855f7", gradient: "from-blue-400 to-purple-600" };
      case "nexus":
        return { color: "#ff00ff", gradient: "from-purple-400 to-pink-600" };
      case "abyss":
        return { color: "#db2777", gradient: "from-pink-400 to-blue-600" };
      case "pulse":
        return { color: "#60a5fa", gradient: "from-blue-400 to-pink-600" };
      case "cipher":
        return { color: "#8b5cf6", gradient: "from-purple-400 to-blue-600" };
      default:
        return { color: "#a855f7", gradient: "from-blue-400 to-purple-600" };
    }
  };

  const realmColors = getRealmColors(currentScreen);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden font-pixel">
      {/* Loading Screen */}
      <AnimatePresence>
        {loading && (
          <motion.div
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
              ENTERING THE VOID...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Entrance animation - cube flying in from corner */}
      <AnimatePresence>
        {enterAnimation && (
          <motion.div
            className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className={`w-24 h-24 bg-gradient-to-br ${realmColors.gradient} rounded-lg shadow-lg`}
              initial={{ scale: 0.2, x: "40vw", y: "40vh", rotate: 0 }}
              animate={{
                scale: 15,
                x: 0,
                y: 0,
                rotate: 720,
              }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {!loading && (
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen w-full"
          >
            {currentScreen === "hub" && (
              <VoidHub
                onSelectRealm={selectRealm}
                onCubeChange={handleCubeChange}
                selectedCubeId={selectedCubeId}
              />
            )}
            {currentScreen === "echo" && (
              <EchoRealm
                onReturn={returnToHub}
                selectedCubeId={selectedCubeId} // Pass the selected cube ID to EchoRealm
              />
            )}
            {currentScreen === "nexus" && (
              <NexusRealm
                onReturn={returnToHub}
                selectedCubeId={selectedCubeId} // Pass the selected cube ID to NexusRealm
              />
            )}
            {currentScreen === "abyss" && (
              <AbyssRealm
                onReturn={returnToHub}
                selectedCubeId={selectedCubeId} // Pass the selected cube ID to NexusRealm
              />
            )}
            {currentScreen === "pulse" && (
              <PulseRealm
              onReturn={returnToHub}
              selectedCubeId={selectedCubeId} // Pass the selected cube ID to NexusRealm
              />
            )}
            {currentScreen === "cipher" && (
              <RealmPlaceholder
                realmName="Cipher Realm"
                realmColor="#8b5cf6"
                realmGradient="from-purple-400 to-blue-600"
                onReturn={returnToHub}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exit Button - always visible */}
      <button
        onClick={onExit}
        className="fixed top-4 right-4 z-50 px-3 py-2 text-sm bg-black/50 backdrop-blur-sm text-pink-300 border border-pink-700 hover:bg-pink-800 hover:text-white transition-all duration-300 font-pixel"
      >
        EXIT
      </button>

      {/* Global styles */}
      <style jsx global>{`
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .font-pixel {
          font-family: monospace;
          letter-spacing: 0.05em;
        }
      `}</style>
    </div>
  );
};

export default VoidResonanceGame;
