import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import RealmCube from "../../cube/realm-cube";
import { cubeCollection } from "../../cube/realm-cube";

// Echo Realm Screen - Memory game with light patterns and 3D cube interaction
interface EchoRealmProps {
  onReturn: () => void;
  selectedCubeId?: string; // Pass the selected cube ID from the hub
}

const EchoRealm: React.FC<EchoRealmProps> = ({ onReturn, selectedCubeId = "pink-neon" }) => {
  const [gameState, setGameState] = useState("intro"); // "intro", "watching", "repeating", "success", "failure"
  const [currentLevel, setCurrentLevel] = useState(1);
  const [pattern, setPattern] = useState<{ x: number; y: number }[]>([]);
  const [playerPattern, setPlayerPattern] = useState<{ x: number; y: number }[]>([]);
  const [highlightedCell, setHighlightedCell] = useState<{ x: number; y: number } | null>(null);
  const [cubePosition, setCubePosition] = useState<{ x: number; y: number } | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  
  // Reference for game container
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // Grid size
  const gridSize = 5;
  
  // Get the selected cube's color from collection (for cell highlights)
  const selectedCube = cubeCollection.find(cube => cube.id === selectedCubeId) || cubeCollection[0];
  const cubeColor = selectedCube.colors[0];
  const cubeGlow = selectedCube.glow;
  
  // Debug output to verify the selected cube
  useEffect(() => {
    console.log("Selected cube in Echo Realm:", selectedCubeId);
    console.log("Found cube:", selectedCube);
  }, [selectedCubeId, selectedCube]);
  
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
      
      // Reset cube position to outside the grid
      setCubePosition(null);
    }
  }, [currentLevel, gameState]);
  
  // Show pattern to player
  useEffect(() => {
    if (gameState === "watching") {
      setPlayerPattern([]);
      setHighlightedCell(null);
      
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
    if (gameState !== "repeating" || isMoving) return;
    
    const newPlayerPattern = [...playerPattern, { x, y }];
    setPlayerPattern(newPlayerPattern);
    
    // Briefly highlight the cell
    setHighlightedCell({ x, y });
    setTimeout(() => {
      setHighlightedCell(null);
    }, 300);
    
    // Move cube to the clicked cell
    setIsMoving(true);
    setCubePosition({ x, y });
    setTimeout(() => {
      setIsMoving(false);
    }, 500);
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

  // Calculate grid cell positions
  const getCellPosition = (x: number, y: number) => {
    const cellSize = 48; // 3rem = 48px
    const gapSize = 8; // 0.5rem = 8px
    const gridOffset = (cellSize + gapSize) * gridSize / 2;
    
    return {
      left: (x * (cellSize + gapSize) - gridOffset + (cellSize / 2)),
      top: (y * (cellSize + gapSize) - gridOffset + (cellSize / 2))
    };
  };

  // Generate background particles for Echo realm theme
  const renderParticles = () => {
    return Array.from({ length: 30 }).map((_, i) => (
      <div
        key={`particle-${i}`}
        className="absolute rounded-full bg-gradient-to-r from-blue-300 to-purple-400"
        style={{
          width: `${Math.random() * 4 + 1}px`,
          height: `${Math.random() * 4 + 1}px`,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          opacity: Math.random() * 0.3 + 0.1,
          boxShadow: `0 0 ${Math.random() * 5 + 2}px #8b5cf6`
        }}
      />
    ));
  };

  return (
    <div 
      ref={containerRef}
      className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden bg-gradient-to-b from-purple-900/30 via-black to-black"
    >
      {/* Background particles */}
      {renderParticles()}
      
      {/* Gradient background specific to Echo realm */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/30 via-black to-black opacity-70"></div>
      </div>
      
      {/* Echo atmosphere effect */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at center, rgba(139, 92, 246, 0.1) 0%, transparent 70%)",
        }}
      />
      
      <div className="relative z-10 flex flex-col items-center">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-4 font-pixel tracking-wider">ECHO REALM</h1>
        
        {/* Status display */}
        <div className="mb-6 text-center">
          <p className="text-xl text-pink-300 mb-2">Level {currentLevel}</p>
          {gameState === "intro" && (
            <p className="text-lg text-gray-300">Watch the pattern, then repeat it by clicking the cells in order.</p>
          )}
          {gameState === "watching" && (
            <p className="text-lg text-blue-300 animate-pulse">
              Memorize the pattern...
            </p>
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
        
        {/* 3D Grid */}
        <div className="relative w-full h-96 flex items-center justify-center mb-8 transform-gpu" style={{ perspective: "800px" }}>
          {/* 3D Grid Container */}
          <div 
            className="relative transform rotate-x-20"
            style={{ 
              width: `${gridSize * (48 + 8)}px`, 
              height: `${gridSize * (48 + 8)}px`,
              transformStyle: "preserve-3d",
            }}
          >
            {/* Grid cells */}
            {Array.from({ length: gridSize * gridSize }).map((_, index) => {
              const x = index % gridSize;
              const y = Math.floor(index / gridSize);
              
              const isHighlighted = highlightedCell && 
                                  highlightedCell.x === x && 
                                  highlightedCell.y === y;
              
              const cellPosition = getCellPosition(x, y);
              
              return (
                <div
                  key={`cell-${x}-${y}`}
                  className={`absolute w-12 h-12 cursor-pointer transition-all duration-300 ease-in-out
                    ${isHighlighted ? 'scale-110 -translate-z-4' : '-translate-z-1 hover:scale-105 hover:-translate-z-2'}`}
                  style={{
                    left: "50%",
                    top: "50%",
                    marginLeft: `${cellPosition.left}px`,
                    marginTop: `${cellPosition.top}px`,
                    background: isHighlighted 
                      ? `linear-gradient(to right, ${cubeColor}, ${selectedCube.colors[1]})`
                      : 'rgba(30, 30, 40, 0.6)',
                    border: `1px solid ${selectedCube.borderColor || 'rgba(139, 92, 246, 0.3)'}`,
                    boxShadow: isHighlighted 
                      ? cubeGlow || '0 0 15px rgba(139, 92, 246, 0.6)'
                      : 'none',
                    transform: `translate(-50%, -50%) translateZ(${isHighlighted ? '15px' : '-5px'})`,
                    transformStyle: "preserve-3d",
                  }}
                  onClick={() => handleCellClick(x, y)}
                />
              );
            })}
            
            {/* Moving RealmCube */}
            {gameState === "repeating" && (
              <div
                className="absolute transition-all duration-500 ease-in-out"
                style={{ 
                  left: "50%",
                  top: "50%",
                  marginLeft: cubePosition === null ? "-160px" : `${getCellPosition(cubePosition.x, cubePosition.y).left}px`,
                  marginTop: cubePosition === null ? "0" : `${getCellPosition(cubePosition.x, cubePosition.y).top}px`,
                  transform: "translate(-50%, -50%) translateZ(30px) scale(0.5)",
                  transformStyle: "preserve-3d",
                  zIndex: 20
                }}
              >
                {/* Use the RealmCube component with proper ID */}
                <RealmCube 
                  position="center" 
                  size={80} 
                  cubeId={selectedCubeId} // Make sure to pass the correct ID
                  onCubeClick={() => {}} // Prevent cube library from opening
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Show selected cube info - for debugging */}
        <div className="text-sm text-gray-400 mb-4">
          Selected Cube: {selectedCube.name}
        </div>
        
        {/* Controls */}
        <div className="mt-4 flex gap-4">
          {gameState === "intro" && (
            <button 
              onClick={startGame}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-md font-pixel transition-transform hover:scale-105 active:scale-95"
            >
              Start Pattern
            </button>
          )}
          
          {gameState === "success" && (
            <button 
              onClick={nextLevel}
              className="px-6 py-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white rounded-md font-pixel transition-transform hover:scale-105 active:scale-95"
            >
              Next Level
            </button>
          )}
          
          {gameState === "failure" && (
            <button 
              onClick={retryLevel}
              className="px-6 py-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white rounded-md font-pixel transition-transform hover:scale-105 active:scale-95"
            >
              Try Again
            </button>
          )}
          
          <button 
            onClick={onReturn}
            className="px-6 py-2 bg-black border border-purple-500/50 hover:bg-purple-900/20 text-white rounded-md flex items-center gap-2 font-pixel transition-transform hover:scale-105 active:scale-95"
          >
            Return to Hub
          </button>
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
      `}</style>
    </div>
  );
};

export default EchoRealm;