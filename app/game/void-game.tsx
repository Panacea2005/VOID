import React, { useState, useEffect, useRef } from "react";
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Main Game Component
interface VoidResonanceGameProps {
  onExit: () => void;
}

const VoidResonanceGame: React.FC<VoidResonanceGameProps> = ({ onExit }) => {
  const [currentScreen, setCurrentScreen] = useState("hub"); // "hub", "echo", "shadow", "crystal", "void", "nexus"
  const [loading, setLoading] = useState(true);
  
  // Handle exit button
  const handleExit = () => {
    onExit();
  };

  // Handle realm selection
  const selectRealm = (realm: React.SetStateAction<string>) => {
    setLoading(true);
    setTimeout(() => {
      setCurrentScreen(realm);
      setLoading(false);
    }, 800);
  };

  // Return to hub
  const returnToHub = () => {
    setLoading(true);
    setTimeout(() => {
      setCurrentScreen("hub");
      setLoading(false);
    }, 800);
  };

  // Show appropriate screen based on current selection
  useEffect(() => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden font-pixel">
      {/* Loading Screen */}
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black">
          <div className="relative w-32 h-32">
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full text-purple-500"
              style={{ animation: "rotate 2s linear infinite" }}
            >
              <rect x="46" y="10" width="8" height="20" fill="currentColor" opacity="0.9" />
              <rect x="46" y="70" width="8" height="20" fill="currentColor" opacity="0.3" />
              <rect x="10" y="46" width="20" height="8" fill="currentColor" opacity="0.7" />
              <rect x="70" y="46" width="20" height="8" fill="currentColor" opacity="0.5" />
              <rect x="22" y="22" width="8" height="20" transform="rotate(45 26 32)" fill="currentColor" opacity="0.8" />
              <rect x="70" y="70" width="8" height="20" transform="rotate(45 74 80)" fill="currentColor" opacity="0.4" />
              <rect x="22" y="70" width="8" height="20" transform="rotate(-45 26 70)" fill="currentColor" opacity="0.6" />
              <rect x="70" y="22" width="8" height="20" transform="rotate(-45 74 22)" fill="currentColor" opacity="0.2" />
            </svg>
          </div>
          <p className="mt-8 text-2xl font-light tracking-widest text-purple-400 font-pixel">
            ENTERING THE VOID...
          </p>
        </div>
      )}

      {/* Main Content */}
      {!loading && (
        <>
          {currentScreen === "hub" && <HubScreen onSelectRealm={selectRealm} />}
          {currentScreen === "echo" && <EchoRealmScreen onReturn={returnToHub} />}
          {currentScreen === "shadow" && <RealmScreen realmName="Shadow Realm" realmColor="#444466" onReturn={returnToHub} />}
          {currentScreen === "crystal" && <RealmScreen realmName="Crystal Realm" realmColor="#88ccff" onReturn={returnToHub} />}
          {currentScreen === "void" && <RealmScreen realmName="Void Realm" realmColor="#8800ff" onReturn={returnToHub} />}
          {currentScreen === "nexus" && <RealmScreen realmName="Nexus Realm" realmColor="#ff00ff" onReturn={returnToHub} />}
        </>
      )}

      {/* Exit Button - always visible */}
      <button
        onClick={handleExit}
        className="absolute top-4 right-4 z-50 px-3 py-2 text-sm bg-pink-900 bg-opacity-50 text-pink-300 border border-pink-700 hover:bg-pink-800 hover:text-white font-pixel"
      >
        EXIT
      </button>

      {/* Global styles */}
      <style jsx global>{`
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .font-pixel {
          font-family: monospace;
          letter-spacing: 0.05em;
        }
      `}</style>
    </div>
  );
};

// The Hub Screen with Realm Selection
interface HubScreenProps {
  onSelectRealm: (realm: string) => void;
}

const HubScreen: React.FC<HubScreenProps> = ({ onSelectRealm }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cubeRef = useRef<THREE.Mesh | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  // Initialize 3D scene with cube
  useEffect(() => {
    if (!containerRef.current) return;

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      70, 
      window.innerWidth / window.innerHeight, 
      0.1, 
      1000
    );
    camera.position.set(0, 0, 5);
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth / 2, window.innerHeight / 2);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 3;
    controls.maxDistance = 10;

    // Create cube
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const materials = [
      new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.8 }), // Echo - Purple
      new THREE.MeshBasicMaterial({ color: 0x444466, transparent: true, opacity: 0.8 }), // Shadow - Dark blue
      new THREE.MeshBasicMaterial({ color: 0x88ccff, transparent: true, opacity: 0.8 }), // Crystal - Light blue
      new THREE.MeshBasicMaterial({ color: 0x8800ff, transparent: true, opacity: 0.8 }), // Void - Deep purple
      new THREE.MeshBasicMaterial({ color: 0xff00ff, transparent: true, opacity: 0.8 }), // Nexus - Magenta
      new THREE.MeshBasicMaterial({ color: 0xec4899, transparent: true, opacity: 0.8 })  // Pink
    ];
    const cube = new THREE.Mesh(geometry, materials);
    scene.add(cube);
    cubeRef.current = cube;

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Animation loop
    const animate = () => {
      if (cubeRef.current) {
        cubeRef.current.rotation.x += 0.005;
        cubeRef.current.rotation.y += 0.007;
      }

      controls.update();
      renderer.render(scene, camera);
      animationFrameIdRef.current = requestAnimationFrame(animate);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = window.innerWidth / window.innerHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(window.innerWidth / 2, window.innerHeight / 2);
      }
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      scene.remove(cube);
      geometry.dispose();
      materials.forEach(material => material.dispose());
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-pixel text-purple-400 mb-6">THE HUB</h1>
      
      {/* 3D Cube Container */}
      <div ref={containerRef} className="mb-8 flex justify-center items-center w-full h-64" />
      
      {/* Realm Selection */}
      <div className="grid grid-cols-3 gap-4 max-w-4xl mx-auto">
        <RealmButton name="Echo Realm" color="bg-purple-600 hover:bg-purple-500" onClick={() => onSelectRealm("echo")} />
        <RealmButton name="Shadow Realm" color="bg-blue-900 hover:bg-blue-800" onClick={() => onSelectRealm("shadow")} />
        <RealmButton name="Crystal Realm" color="bg-blue-400 hover:bg-blue-300" onClick={() => onSelectRealm("crystal")} />
        <RealmButton name="Void Realm" color="bg-purple-800 hover:bg-purple-700" onClick={() => onSelectRealm("void")} />
        <RealmButton name="Nexus Realm" color="bg-pink-600 hover:bg-pink-500" onClick={() => onSelectRealm("nexus")} />
      </div>

      <div className="mt-8 text-gray-400 max-w-lg text-center">
        <p>Select a realm to enter its challenge. In each realm, you must master its unique pattern.</p>
      </div>
    </div>
  );
};

// Realm Button Component
interface RealmButtonProps {
  name: string;
  color: string;
  onClick: () => void;
}

const RealmButton: React.FC<RealmButtonProps> = ({ name, color, onClick }) => (
  <button 
    onClick={onClick}
    className={`p-4 ${color} text-white border border-white border-opacity-20 transition duration-300 ease-in-out transform hover:scale-105`}
  >
    {name}
  </button>
);

// Echo Realm Screen - Memory game with light patterns
interface EchoRealmScreenProps {
  onReturn: () => void;
}

const EchoRealmScreen: React.FC<EchoRealmScreenProps> = ({ onReturn }) => {
  const [gameState, setGameState] = useState("intro"); // "intro", "watching", "repeating", "success", "failure"
  const [currentLevel, setCurrentLevel] = useState(1);
  const [pattern, setPattern] = useState<{ x: number; y: number }[]>([]);
  const [playerPattern, setPlayerPattern] = useState<{ x: number; y: number }[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedCell, setHighlightedCell] = useState<{ x: number; y: number } | null>(null);
  
  // Grid size
  const gridSize = 5;
  
  // Generate a pattern for the level
  useEffect(() => {
    if (gameState === "intro") {
      const newPatternLength = currentLevel + 2; // Pattern length increases with level
      const newPattern = [];
      
      for (let i = 0; i < newPatternLength; i++) {
        const cell = {
          x: Math.floor(Math.random() * gridSize),
          y: Math.floor(Math.random() * gridSize)
        };
        newPattern.push(cell);
      }
      
      setPattern(newPattern);
    }
  }, [currentLevel, gameState]);
  
  // Show pattern to player
  useEffect(() => {
    if (gameState === "watching") {
      setCurrentStep(0);
      setHighlightedCell(null);
      setPlayerPattern([]);
      
      const showSequence = () => {
        let step = 0;
        
        const intervalId = setInterval(() => {
          if (step < pattern.length) {
            setHighlightedCell(pattern[step]);
            
            // Clear highlight after 500ms
            setTimeout(() => {
              setHighlightedCell(null);
            }, 500);
            
            step++;
          } else {
            clearInterval(intervalId);
            setGameState("repeating");
          }
        }, 1000);
        
        return () => clearInterval(intervalId);
      };
      
      const timerId = setTimeout(showSequence, 1000);
      return () => clearTimeout(timerId);
    }
  }, [gameState, pattern]);
  
  // Check player input
  useEffect(() => {
    if (gameState === "repeating" && playerPattern.length > 0) {
      const lastIndex = playerPattern.length - 1;
      
      // Check if the latest move is correct
      if (
        playerPattern[lastIndex].x !== pattern[lastIndex].x ||
        playerPattern[lastIndex].y !== pattern[lastIndex].y
      ) {
        // Wrong move
        setGameState("failure");
        return;
      }
      
      // Check if pattern is complete
      if (playerPattern.length === pattern.length) {
        // Success!
        setGameState("success");
      }
    }
  }, [playerPattern, pattern, gameState]);
  
  // Handle cell click
  const handleCellClick = (x: number, y: number) => {
    if (gameState !== "repeating") return;
    
    const newPlayerPattern = [...playerPattern, { x, y }];
    setPlayerPattern(newPlayerPattern);
    
    // Briefly highlight the cell
    setHighlightedCell({ x, y });
    setTimeout(() => {
      setHighlightedCell(null);
    }, 300);
  };
  
  // Start the game
  const startGame = () => {
    setGameState("watching");
  };
  
  // Next level
  const nextLevel = () => {
    setCurrentLevel(currentLevel + 1);
    setGameState("intro");
  };
  
  // Retry level
  const retryLevel = () => {
    setGameState("intro");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl text-purple-400 mb-4">Echo Realm</h1>
      
      {/* Status display */}
      <div className="mb-6 text-center">
        <p className="text-xl text-pink-300 mb-2">Level {currentLevel}</p>
        {gameState === "intro" && (
          <p className="text-lg text-gray-300">Watch the pattern, then repeat it by clicking the cells in order.</p>
        )}
        {gameState === "watching" && (
          <p className="text-lg text-blue-300 animate-pulse">Memorize the pattern...</p>
        )}
        {gameState === "repeating" && (
          <p className="text-lg text-green-300">Now repeat the pattern!</p>
        )}
        {gameState === "success" && (
          <p className="text-lg text-green-400">Success! Pattern matched!</p>
        )}
        {gameState === "failure" && (
          <p className="text-lg text-red-400">Pattern incorrect. Try again.</p>
        )}
      </div>
      
      {/* Grid */}
      <div 
        className="grid gap-2 bg-gray-900 p-4 border border-purple-800"
        style={{ 
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`, 
          width: `${gridSize * 60}px`
        }}
      >
        {Array.from({ length: gridSize * gridSize }).map((_, index) => {
          const x = index % gridSize;
          const y = Math.floor(index / gridSize);
          
          const isHighlighted = highlightedCell && 
                                highlightedCell.x === x && 
                                highlightedCell.y === y;
          
          return (
            <div
              key={index}
              className={`w-12 h-12 flex items-center justify-center cursor-pointer transition-colors duration-300 ease-in-out 
                        ${isHighlighted ? 'bg-purple-500' : 'bg-gray-800 hover:bg-gray-700'}`}
              onClick={() => handleCellClick(x, y)}
            />
          );
        })}
      </div>
      
      {/* Controls */}
      <div className="mt-8 flex gap-4">
        {gameState === "intro" && (
          <button 
            onClick={startGame}
            className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white"
          >
            Start Pattern
          </button>
        )}
        
        {gameState === "success" && (
          <button 
            onClick={nextLevel}
            className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white"
          >
            Next Level
          </button>
        )}
        
        {gameState === "failure" && (
          <button 
            onClick={retryLevel}
            className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white"
          >
            Try Again
          </button>
        )}
        
        <button 
          onClick={onReturn}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white"
        >
          Return to Hub
        </button>
      </div>
    </div>
  );
};

// Generic Realm Screen (placeholder for other realms)
interface RealmScreenProps {
  realmName: string;
  realmColor: string;
  onReturn: () => void;
}

const RealmScreen: React.FC<RealmScreenProps> = ({ realmName, realmColor, onReturn }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-pixel mb-8" style={{ color: realmColor }}>{realmName}</h1>
      
      <div className="max-w-lg text-center mb-8 p-6 border border-gray-700 bg-black bg-opacity-50">
        <p className="text-lg text-gray-300 mb-4">
          This realm is under construction. The challenge awaits implementation.
        </p>
        <p className="text-gray-400">
          Each realm will feature a unique puzzle or challenge related to its theme.
        </p>
      </div>
      
      <button 
        onClick={onReturn}
        className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white border border-gray-600"
      >
        Return to Hub
      </button>
    </div>
  );
};

export default VoidResonanceGame;