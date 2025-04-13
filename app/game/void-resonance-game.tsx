"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EchoRealmTPV } from './game-engine/echo-realm-tpv';
import { ParticleSystem } from './game-engine/particle-system';
import { EchoRealm } from './game-engine/echo-realm';

interface VoidResonanceGameProps {
  onExit: () => void;
}

const VoidResonanceGame: React.FC<VoidResonanceGameProps> = ({ onExit }) => {
  const [loading, setLoading] = useState(true);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [cursorHover, setCursorHover] = useState(false);
  const [health, setHealth] = useState(3);
  const [energy, setEnergy] = useState(0);
  const [keys, setKeys] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const echoRealmRef = useRef<EchoRealmTPV | null>(null);
  const particleSystemRef = useRef<ParticleSystem | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  
  // Handle cursor effects
  useEffect(() => {
    const handleMouseMove = (e: { clientX: number; clientY: number }) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Game setup and cleanup
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Start loading
    setLoading(true);
    
    // Initialize the game
    const initialize = async () => {
      try {
        // Create scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000);
        sceneRef.current = scene;
        
        // Create camera for third-person view
        const camera = new THREE.PerspectiveCamera(
          70, 
          window.innerWidth / window.innerHeight, 
          0.1, 
          1000
        );
        camera.position.set(5, 5, 5); // Initial position
        cameraRef.current = camera;
        
        // Create renderer
        const renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        if (containerRef.current) {
          containerRef.current.appendChild(renderer.domElement);
        }
        rendererRef.current = renderer;
        
        // Create controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.maxPolarAngle = Math.PI / 2;
        controls.minDistance = 3;
        controls.maxDistance = 15;
        controlsRef.current = controls;
        
        // Create lights
        const ambientLight = new THREE.AmbientLight(0x666666);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        scene.add(directionalLight);
        
        // Create particle system
        const particleSystem = new ParticleSystem(scene);
        particleSystemRef.current = particleSystem;
        
        // Create Echo Realm TPV
        const echoRealm = new EchoRealmTPV(
          scene,
          camera,
          controls,
          particleSystem,
          20, // gridSize
          1.0, // cellSize
          containerRef.current
        );
        echoRealmRef.current = echoRealm;
        
        // Initialize Echo Realm with first level
        const levels = EchoRealm.getLevels();
        if (levels.length > 0) {
          echoRealm.initializeEchoRealm(levels[0]);
        }
        
        // Handle window resize
        const handleResize = () => {
          if (cameraRef.current && rendererRef.current) {
            cameraRef.current.aspect = window.innerWidth / window.innerHeight;
            cameraRef.current.updateProjectionMatrix();
            rendererRef.current.setSize(window.innerWidth, window.innerHeight);
          }
        };
        
        // Start animation loop
        let lastTime = 0;
        const animate = (time: number) => {
          const delta = time - lastTime;
          lastTime = time;
          
          if (controlsRef.current) {
            controlsRef.current.update();
          }
          
          if (echoRealmRef.current) {
            echoRealmRef.current.update(time, delta);
          }
          
          if (particleSystemRef.current) {
            particleSystemRef.current.update(time);
          }
          
          if (rendererRef.current && sceneRef.current && cameraRef.current) {
            rendererRef.current.render(sceneRef.current, cameraRef.current);
          }
          
          animationFrameIdRef.current = requestAnimationFrame(animate);
        };
        
        // Add event listeners
        window.addEventListener('resize', handleResize);
        
        // Start animation
        animationFrameIdRef.current = requestAnimationFrame(animate);
        
        // Loading complete
        setLoading(false);
        
        // Return cleanup function
        return () => {
          window.removeEventListener('resize', handleResize);
          
          if (animationFrameIdRef.current) {
            cancelAnimationFrame(animationFrameIdRef.current);
          }
          
          if (echoRealmRef.current) {
            echoRealmRef.current.dispose();
          }
          
          if (particleSystemRef.current) {
            particleSystemRef.current.dispose();
          }
          
          if (rendererRef.current && containerRef.current) {
            containerRef.current.removeChild(rendererRef.current.domElement);
            rendererRef.current.dispose();
          }
        };
      } catch (error) {
        console.error("Error initializing game:", error);
        setLoading(false);
        return () => {};
      }
    };
    
    initialize();
  }, []);
  
  // Update player stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      // In a real implementation, we would get this from the player state
      setHealth(Math.min(health + 0.1, 3));
      setEnergy(Math.min(energy + 0.1, 10));
    }, 10000);
    
    return () => clearInterval(interval);
  }, [health, energy]);
  
  // Exit game handler
  const handleExitGame = () => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }
    
    onExit();
  };
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleExitGame();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onExit]);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden font-pixel">
      {/* Custom cursor */}
      <motion.div
        className="fixed w-8 h-8 pointer-events-none z-[100] hidden md:block"
        animate={{
          x: cursorPosition.x - 16,
          y: cursorPosition.y - 16,
          scale: cursorHover ? 1.5 : 1,
        }}
        transition={{
          type: "spring",
          damping: 10,
          mass: 0.1,
          stiffness: 100,
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="0" y="0" width="4" height="4" fill="#a855f7" />
          <rect x="28" y="0" width="4" height="4" fill="#a855f7" />
          <rect x="0" y="28" width="4" height="4" fill="#a855f7" />
          <rect x="28" y="28" width="4" height="4" fill="#a855f7" />
          <rect x="12" y="12" width="8" height="8" fill="#ec4899" />
        </svg>
      </motion.div>

      <AnimatePresence>
        {loading ? (
          <motion.div
            key="loader"
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
              ENTERING ECHO REALM...
            </motion.p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Game container */}
      <div
        ref={containerRef}
        className="w-full h-full"
      />
      
      {/* Game introduction overlay - shown briefly at start */}
      {!loading && (
        <AnimatePresence>
          <motion.div
            key="intro"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3, delay: 1 }}
            className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-black bg-opacity-90 pointer-events-none"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1 }}
              className="text-center max-w-2xl px-6"
            >
              <h1 className="text-4xl text-purple-400 font-pixel mb-6">ECHO REALM</h1>
              <p className="text-lg text-pink-300 font-pixel mb-4">
                A realm of reflective surfaces and echoing sounds, where you confront distorted versions of your past choices.
              </p>
              <p className="text-md text-purple-300 font-pixel">
                The environment shifts based on your actions, creating a unique experience with each step.
              </p>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}
      
      {/* Realm indicator */}
      <div className="absolute top-4 left-4 z-50">
        <div className="px-3 py-2 bg-black bg-opacity-50 border border-purple-700 font-pixel">
          <span className="text-purple-400">Echo Realm</span>
        </div>
      </div>
      
      {/* Player stats UI */}
      <div className="absolute top-16 left-4 z-50">
        <div className="px-3 py-2 bg-black bg-opacity-50 border border-purple-700 font-pixel">
          <div><span className="text-pink-400">HP:</span> <span className="text-white">{health.toFixed(1)}</span></div>
          <div><span className="text-purple-400">ENERGY:</span> <span className="text-white">{energy.toFixed(1)}</span></div>
          <div><span className="text-yellow-400">KEYS:</span> <span className="text-white">{keys}</span></div>
        </div>
      </div>
      
      {/* Game UI buttons */}
      <div className="absolute top-4 right-4 z-50 flex space-x-4">
        <button
          onClick={handleExitGame}
          className="px-3 py-2 text-sm bg-pink-900 bg-opacity-50 text-pink-300 border border-pink-700 hover:bg-pink-800 hover:text-white font-pixel"
        >
          EXIT
        </button>
      </div>
      
      {/* Controls hint */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center z-50">
        <div className="px-4 py-2 bg-black bg-opacity-50 inline-block font-pixel text-sm">
          <span className="text-pink-400">WASD:</span> <span className="text-gray-300">Move</span> &nbsp;
          <span className="text-pink-400">MOUSE:</span> <span className="text-gray-300">Camera</span> &nbsp;
          <span className="text-pink-400">ESC:</span> <span className="text-gray-300">Exit</span>
        </div>
      </div>

      {/* Global styles for animations */}
      <style jsx global>{`
        @font-face {
          font-family: "PixelFont";
          src: url("/pixel-font.woff2") format("woff2");
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }

        .font-pixel {
          font-family: "PixelFont", monospace;
          letter-spacing: 0.05em;
        }

        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default VoidResonanceGame;