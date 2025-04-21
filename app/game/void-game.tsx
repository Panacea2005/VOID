import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import VoidHub from "./hub/void-hub";
import EchoRealm from "./realms/echo/echo-realm";
import NexusRealm from "./realms/nexus/nexus-realm";
import AbyssRealm from "./realms/abyss/abyss-realm";
import PulseRealm from "./realms/pulse/pulse-realm";
import CipherRealm from "./realms/cipher/cipher-realm";
import CrypticRealm from "./realms/cryptic/cryptic-realm";
import VortexRealm from "./realms/vortex/vortex-realm";
import RealmPlaceholder from "./realms/vortex/realm-placeholder";
import {
  AudioProvider,
  useAudio,
  AudioController,
} from "./contexts/audio-context";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";

// Main Game Component
interface VoidResonanceGameProps {
  onExit: () => void;
}

// Inner component that uses the audio context
const VoidGameInner: React.FC<VoidResonanceGameProps> = ({ onExit }) => {
  const [currentScreen, setCurrentScreen] = useState("hub"); // "hub", "echo", "abyss", "pulse", "cipher", "nexus", "vortex"
  const [loading, setLoading] = useState(true);
  const [enterAnimation, setEnterAnimation] = useState(false);
  // Add state for selectedCubeId
  const [selectedCubeId, setSelectedCubeId] = useState("pink-neon");

  // Access audio context
  const audio = useAudio();
  
  // Access wallet context
  const { connected, publicKey } = useWallet();
  
  // Format wallet address for display
  const shortenAddress = (address: string, chars = 4) => {
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
  };
  
  // Log wallet connection status for debugging
  useEffect(() => {
    console.log("VoidGame - Wallet status:", connected ? "Connected" : "Disconnected");
    if (publicKey) {
      console.log("Wallet public key:", publicKey.toString());
    }
  }, [connected, publicKey]);

  // Log the selected cube ID for debugging
  useEffect(() => {
    console.log("VoidResonanceGame - selectedCubeId:", selectedCubeId);
  }, [selectedCubeId]);

  // Initial loading
  useEffect(() => {
    console.log("VoidResonanceGame - Initial loading...");
    setTimeout(() => setLoading(false), 1000);
  }, []);

  // Handle wallet profile click
  const handleWalletClick = () => {
    if (connected) {
      // Navigate to profile page
      window.location.href = "/profile";
    }
  };

  // Handle realm selection and audio change
  const selectRealm = (realm: string) => {
    console.log(`VoidResonanceGame - Selecting realm: ${realm}`);
    setEnterAnimation(true);

    // Audio will be handled by the realm components through useAudio
    setTimeout(() => {
      setCurrentScreen(realm);
      setLoading(true);

      setTimeout(() => {
        setEnterAnimation(false);
        setLoading(false);
      }, 500);
    }, 1000); // Time to match the cube animation in void-hub
  };

  // Return to hub and change audio
  const returnToHub = () => {
    console.log("VoidResonanceGame - Returning to hub");
    setLoading(true);
    setTimeout(() => {
      setCurrentScreen("hub");
      setLoading(false);
    }, 800);
  };

  // Handle cube selection from hub
  const handleCubeChange = (cubeId: string) => {
    console.log("VoidResonanceGame - Cube changed to:", cubeId);
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
      case "vortex":
        return { color: "#10b981", gradient: "from-emerald-400 to-cyan-600" };
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

      {/* Include AudioController UI at top level */}
      <div className="z-50">
        <AudioController
          isPlaying={audio.isPlaying}
          currentTrackId={audio.currentTrackId}
          volume={audio.volume}
          progress={audio.progress}
          onTogglePlayback={audio.togglePlayback}
          onToggleMute={audio.toggleMute}
          onTrackChange={audio.changeTrack}
          onVolumeChange={audio.setVolume}
          onSeek={audio.seekTo}
        />
      </div>

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
                selectedCubeId={selectedCubeId}
              />
            )}
            {currentScreen === "nexus" && (
              <NexusRealm
                onReturn={returnToHub}
                selectedCubeId={selectedCubeId}
              />
            )}
            {currentScreen === "abyss" && (
              <AbyssRealm
                onReturn={returnToHub}
                selectedCubeId={selectedCubeId}
              />
            )}
            {currentScreen === "pulse" && (
              <PulseRealm
                onReturn={returnToHub}
                selectedCubeId={selectedCubeId}
              />
            )}
            {currentScreen === "cipher" && (
              <CipherRealm
                onReturn={returnToHub}
                selectedCubeId={selectedCubeId}
              />
            )}
            {currentScreen === "cryptic" && (
              <CrypticRealm
                onReturn={returnToHub}
                selectedCubeId={selectedCubeId}
              />
            )}
            {currentScreen === "vortex" && (
              <VortexRealm
              onReturn={returnToHub}
              selectedCubeId={selectedCubeId}
            />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Controls Panel - Contains Exit Button and Wallet Button */}
      <div className="fixed top-4 right-4 z-50 flex items-center space-x-2">
        {/* Wallet Connection Button - Styled to match navigation component */}
        {connected ? (
          <Button
            onClick={handleWalletClick}
            className="bg-transparent border border-pink-500 hover:bg-pink-950/30 text-pink-400 rounded-none px-4 py-2 text-sm font-pixel tracking-wide z-50"
          >
            <span className="mr-2 w-2 h-2 bg-green-500 rounded-full inline-block"></span>
            {publicKey ? shortenAddress(publicKey.toString()) : "CONNECTED"}
          </Button>
        ) : (
          <div className="wallet-adapter-button-wrapper">
            <WalletMultiButton className="bg-transparent border border-purple-500 hover:bg-purple-950/30 text-purple-400 rounded-none px-4 py-2 text-sm font-pixel tracking-wide z-50" />
          </div>
        )}
        
        {/* Exit Button */}
        <button
          onClick={onExit}
          className="bg-transparent border border-pink-500 hover:bg-pink-950/30 text-pink-400 rounded-none px-4 py-2 text-sm font-pixel tracking-wide z-50"
        >
          EXIT
        </button>
      </div>

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
          font-family: 'Press Start 2P', monospace;
          letter-spacing: 0.05em;
        }
      `}</style>
    </div>
  );
};

// The main game component
const VoidResonanceGame: React.FC<VoidResonanceGameProps> = (props) => {
  return <VoidGameInner {...props} />;
};

export default VoidResonanceGame;