import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import RealmCube from "../../cube/realm-cube";
import { cubeCollection } from "../../cube/realm-cube";

// Nexus Realm - Frequency Resonance Game
interface NexusRealmProps {
  onReturn: () => void;
  selectedCubeId?: string;
}

// Node interface for energy nodes
interface Node {
  id: number;
  x: number;
  y: number;
  frequency: number;
  targetDistance: number;
  currentDistance: number;
  color: string;
  inResonance: boolean;
  pulseSize: number;
}

const NexusRealm: React.FC<NexusRealmProps> = ({ 
  onReturn, 
  selectedCubeId = "pink-neon" 
}) => {
  // Game states
  const [gameState, setGameState] = useState<"intro" | "playing" | "success" | "failure">("intro");
  const [currentLevel, setCurrentLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [moveCount, setMoveCount] = useState(0);
  const [pulseActive, setPulseActive] = useState(false);
  const [cubeReady, setCubeReady] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  // References
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pulseTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Grid size (play area)
  const gridSize = 600;
  const cellSize = 60;
  
  // Get the selected cube from collection
  const selectedCube = cubeCollection.find(cube => cube.id === selectedCubeId) || cubeCollection[0];
  const baseColors = selectedCube.colors.length > 0 
    ? selectedCube.colors 
    : ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF"];

  // Generate nodes for the current level
  useEffect(() => {
    if (gameState === "intro") {
      console.log("Generating nodes for level", currentLevel);
      
      // Calculate base pulse frequency (A4 + offset per level)
      const basePulseFrequency = 440 + (currentLevel - 1) * 20;
      
      // Musical intervals for harmonious frequencies
      const musicalRatios = [1, 9/8, 5/4, 3/2, 5/3, 2];
      
      // Clear existing nodes
      setNodes([]);
      setSelectedNode(null);
      
      // Number of nodes increases with level
      const nodeCount = 3 + Math.min(currentLevel, 5);
      
      // Determine grid boundaries, keeping space in center for cube
      const centerSpace = 150; // Space to leave in center
      const minPos = -gridSize / 2 + cellSize;
      const maxPos = gridSize / 2 - cellSize;
      
      // Create nodes with appropriate attributes for the level
      const newNodes: Node[] = [];
      
      for (let i = 0; i < nodeCount; i++) {
        // Create random position that's not in the center
        let x, y, distFromCenter;
        
        do {
          x = Math.floor(Math.random() * (maxPos - minPos)) + minPos;
          y = Math.floor(Math.random() * (maxPos - minPos)) + minPos;
          distFromCenter = Math.sqrt(x * x + y * y);
        } while (distFromCenter < centerSpace);
        
        // Calculate node frequency based on musical ratios
        const ratio = musicalRatios[i % musicalRatios.length];
        const frequency = basePulseFrequency * ratio;
        
        // Target distance is derived from frequency
        // Higher frequencies resonate closer to the center
        const targetDistance = 100 + (1000 / frequency) * 80;
        
        // Create node
        newNodes.push({
          id: i,
          x: x,
          y: y,
          frequency: frequency,
          targetDistance: targetDistance,
          currentDistance: Math.sqrt(x * x + y * y),
          color: baseColors[i % baseColors.length],
          inResonance: false,
          pulseSize: 0
        });
      }
      
      setNodes(newNodes);
      setTimeRemaining(60 + (currentLevel * 10)); // More time for higher levels
      setMoveCount(0);
      
      console.log("Created", newNodes.length, "nodes");
    }
  }, [currentLevel, gameState, baseColors]);
  
  // Game timer
  useEffect(() => {
    if (gameState === "playing") {
      console.log("Starting game timer with", timeRemaining, "seconds");
      
      if (timerRef.current) clearInterval(timerRef.current);
      
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Time's up
            console.log("Time's up!");
            setGameState("failure");
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      // Start cube pulsing
      startPulseSequence();
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    };
  }, [gameState]);
  
  // Handle cube pulsing
  const startPulseSequence = () => {
    // Emit pulse every 2 seconds
    const intervalId = setInterval(() => {
      if (gameState === "playing") {
        emitPulse();
      } else {
        clearInterval(intervalId);
      }
    }, 2000);
    
    return () => clearInterval(intervalId);
  };
  
  // Emit a pulse from the cube
  const emitPulse = () => {
    // Activate pulse effect
    setPulseActive(true);
    
    // Animate nodes' pulse size
    setNodes(prev => prev.map(node => ({
      ...node,
      pulseSize: 1
    })));
    
    // Play pulse sound
    playSound(440, 0.3);
    
    // Check node resonance with this pulse
    checkResonance();
    
    // Deactivate pulse after animation
    setTimeout(() => {
      setPulseActive(false);
      
      setNodes(prev => prev.map(node => ({
        ...node,
        pulseSize: 0
      })));
    }, 1000);
  };
  
  // Check if nodes are in resonance
  const checkResonance = () => {
    // For each node, check if it's at the correct distance
    setNodes(prev => prev.map(node => {
      // Calculate current distance from center
      const distanceFromCenter = Math.sqrt(node.x * node.x + node.y * node.y);
      
      // Check if node is in resonance (within threshold of target distance)
      const distanceDiff = Math.abs(distanceFromCenter - node.targetDistance);
      const resonanceThreshold = node.targetDistance * 0.1; // 10% margin
      const inResonance = distanceDiff <= resonanceThreshold;
      
      if (inResonance && !node.inResonance) {
        // Node just entered resonance
        playSound(node.frequency, 0.5);
      }
      
      return {
        ...node,
        currentDistance: distanceFromCenter,
        inResonance
      };
    }));
  };
  
  // Check level completion
  useEffect(() => {
    if (gameState === "playing") {
      const allNodesInResonance = nodes.length > 0 && nodes.every(node => node.inResonance);
      
      if (allNodesInResonance) {
        // Level completed
        console.log("Level complete! All nodes in resonance");
        setGameState("success");
        
        // Calculate score based on time and moves
        const timeBonus = timeRemaining * 5;
        const moveBonus = Math.max(0, 200 - (moveCount * 10));
        setScore(prev => prev + (currentLevel * 100) + timeBonus + moveBonus);
        
        // Play success sound
        playSound(880, 0.8);
      }
    }
  }, [nodes, gameState, timeRemaining, moveCount, currentLevel]);
  
  // Handle mouse events for node dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Get grid position
      if (!gridRef.current) return;
      
      const rect = gridRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - gridSize/2;
      const y = e.clientY - rect.top - gridSize/2;
      
      setMousePosition({ x, y });
      
      // If dragging a node, update its position
      if (isDragging && selectedNode !== null) {
        setNodes(prev => prev.map(node => 
          node.id === selectedNode 
            ? { ...node, x, y } 
            : node
        ));
        
        // Count as a move and check resonance
        setMoveCount(prev => prev + 1);
        checkResonance();
      }
    };
    
    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, selectedNode]);
  
  // Handle node selection via clicking
  const handleNodeClick = (id: number, e: React.MouseEvent) => {
    if (gameState !== "playing") return;
    
    e.stopPropagation();
    
    // Select the node and start dragging
    setSelectedNode(id);
    setIsDragging(true);
  };
  
  // Handle cube click (emit pulse)
  const handleCubeClick = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    if (gameState === "playing" && cubeReady) {
      emitPulse();
      setCubeReady(false);
      setTimeout(() => setCubeReady(true), 500);
    }
  };
  
  // Play a sound effect
  const playSound = (frequency: number, volume: number) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Set waveform type based on frequency
      oscillator.type = frequency > 600 ? 'sine' : 'triangle';
      oscillator.frequency.value = frequency;
      
      gainNode.gain.value = volume;
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.start();
      
      // Fade out
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
      setTimeout(() => oscillator.stop(), 500);
    } catch (e) {
      console.error("Audio not supported");
    }
  };
  
  // Generate background particles for Nexus realm theme
  const renderParticles = () => {
    return Array.from({ length: 30 }).map((_, i) => (
      <div
        key={`particle-${i}`}
        className="absolute rounded-full bg-gradient-to-r from-pink-300 to-purple-400"
        style={{
          width: `${Math.random() * 4 + 1}px`,
          height: `${Math.random() * 4 + 1}px`,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          opacity: Math.random() * 0.3 + 0.1,
          boxShadow: `0 0 ${Math.random() * 5 + 2}px #ec4899`
        }}
      />
    ));
  };
  
  // Start game
  const startGame = () => {
    console.log("Starting game!");
    setGameState("playing");
    setCubeReady(true);
    playSound(440, 0.5);
  };
  
  // Next level
  const nextLevel = () => {
    console.log("Advancing to next level");
    setCurrentLevel(prev => prev + 1);
    setGameState("intro");
    playSound(880, 0.5);
  };
  
  // Retry level
  const retryLevel = () => {
    console.log("Retrying level");
    setGameState("intro");
    playSound(660, 0.5);
  };
  
  // Show hint for node positioning
  const showHint = () => {
    if (gameState !== "playing") return;
    
    // Temporarily highlight target positions
    setNodes(prev => prev.map(node => {
      if (node.inResonance) return node;
      
      // Calculate distance from center to node
      const distance = Math.sqrt(node.x * node.x + node.y * node.y);
      if (distance === 0) return node;
      
      // Calculate direction vector
      const unitX = node.x / distance;
      const unitY = node.y / distance;
      
      // Calculate hint position
      const hintX = unitX * node.targetDistance;
      const hintY = unitY * node.targetDistance;
      
      return {
        ...node,
        hintX,
        hintY
      };
    }) as any);
    
    // Play hint sound
    playSound(660, 0.3);
    
    // Clear hints after 2 seconds
    setTimeout(() => {
      setNodes(nodes => nodes.map(node => {
        const { hintX, hintY, ...rest } = node as any;
        return rest;
      }));
    }, 2000);
  };
  
  // Calculate percent of nodes in resonance
  const getProgressPercent = () => {
    if (nodes.length === 0) return 0;
    return (nodes.filter(n => n.inResonance).length / nodes.length) * 100;
  };

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden bg-gradient-to-b from-purple-900/30 via-black to-black"
    >
      {/* Background particles */}
      {renderParticles()}
      
      {/* Gradient background specific to Nexus realm */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-pink-900/30 via-black to-black opacity-70"></div>
      </div>
      
      {/* Nexus atmosphere effect */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at center, rgba(236, 72, 153, 0.1) 0%, transparent 70%)",
        }}
      />
      
      <div className="relative z-10 flex flex-col items-center">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-4 font-pixel tracking-wider">NEXUS RESONANCE</h1>
        
        {/* Status display */}
        <div className="mb-6 text-center">
          <div className="flex items-center gap-6 bg-black/70 px-6 py-2 rounded-full border border-purple-500/30">
            <p className="text-lg text-pink-300">Level {currentLevel}</p>
            <div className="h-4 w-px bg-purple-500/50"></div>
            <p className="text-lg text-purple-300">Score: {score}</p>
            {gameState === "playing" && (
              <>
                <div className="h-4 w-px bg-purple-500/50"></div>
                <p className="text-lg text-blue-300">
                  {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, "0")}
                </p>
                <div className="h-4 w-px bg-purple-500/50"></div>
                <p className="text-lg text-amber-300">
                  Moves: {moveCount}
                </p>
              </>
            )}
          </div>
          
          {gameState === "intro" && (
            <p className="text-lg text-gray-300 mt-2">
              Position the nodes at their resonant distances from the central cube to create harmony.
            </p>
          )}
          {gameState === "playing" && (
            <p className="text-lg text-green-300 mt-2">
              {selectedNode !== null 
                ? `Moving Node ${selectedNode + 1} - Drag to position it` 
                : "Click and drag nodes to move them"}
            </p>
          )}
          {gameState === "success" && (
            <p className="text-lg text-green-400 mt-2">All nodes in resonance! Network complete!</p>
          )}
          {gameState === "failure" && (
            <p className="text-lg text-red-400 mt-2">Time's up! Network calibration failed.</p>
          )}
        </div>
        
        {/* Progress bar */}
        {gameState === "playing" && (
          <div className="w-96 mb-4">
            <div className="w-full bg-black/70 h-2 rounded-full">
              <div
                className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500"
                style={{ width: `${getProgressPercent()}%` }}
              ></div>
            </div>
            <p className="text-xs text-center text-white mt-1">
              {nodes.filter(n => n.inResonance).length} / {nodes.length} nodes in resonance
            </p>
          </div>
        )}
        
        <div className="flex">
          {/* Instructions panel - now on the left side */}
          <div className="mr-8 bg-black/50 rounded-lg p-4 max-w-xs self-start">
            <h3 className="text-pink-400 font-bold mb-2">How to Play:</h3>
            <ul className="text-gray-300 text-sm space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Click and drag nodes to position them</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Place nodes on the colored rings that match their color</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Click the cube to emit a pulse and check resonance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Nodes glow brightly when in perfect resonance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Create a complete resonant network to complete the level</span>
              </li>
            </ul>
            
            {gameState === "playing" && (
              <div className="mt-4">
                <button
                  onClick={showHint}
                  className="w-full py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-md font-pixel transition-transform hover:scale-105 active:scale-95"
                >
                  Show Hint
                </button>
              </div>
            )}
            
            {gameState === "intro" && (
              <div className="mt-4">
                <button 
                  onClick={startGame}
                  className="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-md font-pixel transition-transform hover:scale-105 active:scale-95"
                >
                  Start Calibration
                </button>
              </div>
            )}
            
            {gameState === "success" && (
              <div className="mt-4">
                <button 
                  onClick={nextLevel}
                  className="w-full py-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white rounded-md font-pixel transition-transform hover:scale-105 active:scale-95"
                >
                  Next Level
                </button>
              </div>
            )}
            
            {gameState === "failure" && (
              <div className="mt-4">
                <button 
                  onClick={retryLevel}
                  className="w-full py-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white rounded-md font-pixel transition-transform hover:scale-105 active:scale-95"
                >
                  Try Again
                </button>
              </div>
            )}
            
            <div className="mt-2">
              <button 
                onClick={onReturn}
                className="w-full py-2 bg-black border border-purple-500/50 hover:bg-purple-900/20 text-white rounded-md font-pixel transition-transform hover:scale-105 active:scale-95"
              >
                Return to Hub
              </button>
            </div>
          </div>
          
          {/* 3D Grid with Cube and Nodes */}
          <div 
            ref={gridRef}
            className="relative w-[600px] h-[600px] mb-8 transform-gpu"
            style={{ perspective: "800px" }}
          >
            {/* 3D Grid Container */}
            <div
              className="relative w-full h-full rotate-x-20 transform-gpu"
              style={{
                transformStyle: "preserve-3d",
                border: "1px solid rgba(139, 92, 246, 0.3)",
                background: "rgba(0, 0, 0, 0.3)",
              }}
            >
              {/* Resonance visualization rings */}
              {nodes.map((node) => (
                <div 
                  key={`ring-${node.id}`}
                  className="absolute left-1/2 top-1/2 rounded-full"
                  style={{
                    width: `${node.targetDistance * 2}px`,
                    height: `${node.targetDistance * 2}px`,
                    transform: "translate(-50%, -50%)",
                    border: `2px dashed ${node.color}`,
                    opacity: 0.4,
                    zIndex: 5
                  }}
                />
              ))}
              
              {/* Current position feedback rings */}
              {nodes.map((node) => {
                // Calculate position in grid coordinates
                const posX = node.x + gridSize / 2;
                const posY = node.y + gridSize / 2;
                
                // Calculate distance from center
                const distanceFromCenter = Math.sqrt(node.x * node.x + node.y * node.y);
                
                // Calculate difference from target
                const distanceDiff = Math.abs(distanceFromCenter - node.targetDistance);
                const resonanceQuality = Math.max(0, 1 - (distanceDiff / node.targetDistance));
                
                return (
                  <div 
                    key={`feedback-${node.id}`}
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      width: "40px",
                      height: "40px",
                      left: `${posX - 20}px`,
                      top: `${posY - 20}px`,
                      border: `2px solid ${node.color}`,
                      opacity: resonanceQuality,
                      transform: "translateZ(10px)",
                      transition: "all 0.2s ease-out"
                    }}
                  />
                );
              })}
              
              {/* Central Cube */}
              <div
                className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-300 cursor-pointer"
                style={{
                  transformStyle: "preserve-3d",
                  transform: `translate(-50%, -50%) translateZ(${pulseActive ? '40px' : '30px'})`,
                  transition: "transform 0.3s ease-out",
                  zIndex: 20
                }}
                onClick={handleCubeClick}
              >
                {/* Use the RealmCube component with proper ID */}
                <RealmCube 
                  position="center" 
                  size={80} 
                  cubeId={selectedCubeId}
                  isAnimated={pulseActive}
                  onCubeClick={handleCubeClick}
                />
                
                {/* Pulse effect */}
                {pulseActive && (
                  <div
                    className="absolute left-1/2 top-1/2 rounded-full animate-ping"
                    style={{
                      width: "80px",
                      height: "80px",
                      background: `radial-gradient(circle, ${selectedCube.colors[0]} 0%, transparent 70%)`,
                      transform: "translate(-50%, -50%)",
                      zIndex: -1
                    }}
                  ></div>
                )}
              </div>
              
              {/* Nodes */}
              {nodes.map((node) => {
                const isSelected = selectedNode === node.id;
                const posX = node.x + gridSize / 2;
                const posY = node.y + gridSize / 2;
                
                // For hint position display
                const hintX = (node as any).hintX !== undefined 
                  ? (node as any).hintX + gridSize / 2 
                  : null;
                const hintY = (node as any).hintY !== undefined 
                  ? (node as any).hintY + gridSize / 2 
                  : null;
                
                return (
                  <React.Fragment key={`node-${node.id}`}>
                    {/* Hint position marker (only visible during hint) */}
                    {hintX !== null && hintY !== null && (
                      <div
                        className="absolute rounded-full border-2 animate-pulse pointer-events-none"
                        style={{
                          width: "40px",
                          height: "40px",
                          left: `${hintX - 20}px`,
                          top: `${hintY - 20}px`,
                          borderColor: node.color,
                          backgroundColor: "transparent",
                          zIndex: 10,
                          transform: "translateZ(10px)"
                        }}
                      />
                    )}
                    
                    {/* Node */}
                    <div
                      className={`absolute rounded-full cursor-grab transition-all duration-300
                        ${isSelected ? 'z-30 cursor-grabbing' : 'z-20'}
                        ${node.inResonance ? 'animate-pulse' : ''}`}
                      style={{
                        width: "40px",
                        height: "40px",
                        left: `${posX - 20}px`,
                        top: `${posY - 20}px`,
                        backgroundColor: node.color,
                        boxShadow: node.inResonance 
                          ? `0 0 15px ${node.color}, 0 0 30px ${node.color}`
                          : `0 0 5px ${node.color}`,
                        transform: `translateZ(${node.inResonance ? '25px' : '15px'}) scale(${node.inResonance ? 1.2 : 1})`,
                        opacity: node.inResonance ? 1 : 0.8,
                        transition: "all 0.3s ease-out"
                      }}
                      onMouseDown={(e) => handleNodeClick(node.id, e)}
                    >
                      {/* Node ID label */}
                      <div className="flex items-center justify-center h-full w-full font-bold text-black">
                        {node.id + 1}
                      </div>
                      
                      {/* Resonance waves */}
                      {node.inResonance && (
                        <div
                          className="absolute left-1/2 top-1/2 rounded-full animate-ping pointer-events-none"
                          style={{
                            width: "100%",
                            height: "100%",
                            border: `2px solid ${node.color}`,
                            transform: "translate(-50%, -50%) scale(1.2)",
                            opacity: 0.6
                          }}
                        ></div>
                      )}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Global styles for 3D transformations */}
      <style jsx global>{`
        .rotate-x-20 {
          transform: rotateX(20deg);
        }
        .font-pixel {
          font-family: monospace;
          letter-spacing: 0.05em;
        }
        .animate-ping {
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes ping {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.8;
          }
          80%, 100% {
            transform: translate(-50%, -50%) scale(2);
            opacity: 0;
          }
        }
        .cursor-grab {
          cursor: grab;
        }
        .cursor-grabbing {
          cursor: grabbing;
        }
      `}</style>
    </div>
  );
};

export default NexusRealm;