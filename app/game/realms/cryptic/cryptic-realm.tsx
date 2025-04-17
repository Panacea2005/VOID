import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { cubeCollection } from '../../cube/realm-cube';
import { useAudio } from '../../contexts/audio-context';

interface CrypticRealmProps {
  onReturn: () => void;
  selectedCubeId?: string;
}

// Simplified Rubik's Cube model
// We'll use a more direct approach that models the cube as 6 faces with 9 stickers each
const CrypticRealm: React.FC<CrypticRealmProps> = ({ onReturn, selectedCubeId = "pink-neon" }) => {
  // Game state
  const [gameState, setGameState] = useState<"intro" | "playing" | "success">("intro");
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  
  // Cube size (simplified to 3x3 for now to ensure it works)
  const cubeSize = 3;
  
  // Cube rotation state
  const [cubeRotation, setCubeRotation] = useState({ x: 20, y: 20 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // References
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Get cube colors
  const defaultCube = cubeCollection[0];
  const selectedCube = cubeCollection.find(cube => cube.id === selectedCubeId) || defaultCube;
  const cubeColors = [...selectedCube.colors];
  
  // Ensure we have 6 colors for all faces
  while (cubeColors.length < 6) {
    cubeColors.push(defaultCube.colors[cubeColors.length % defaultCube.colors.length]);
  }
  
  // Individual face state
  // Each face has 9 cells (3x3)
  const [faces, setFaces] = useState<string[][]>([]);
  
  // Audio context
  const audio = useAudio();
  
  // Initialize the cube
  useEffect(() => {
    try {
      audio.changeTrack("rubiks");
    } catch (error) {
      console.log("Could not set audio track");
    }
    
    // Initialize cube state - each face has 9 cells of the same color
    initializeCube();
  }, []);
  
  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (gameState === "playing" && startTime) {
      interval = setInterval(() => {
        setCurrentTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameState, startTime]);
  
  // Check for solved state after moves
  useEffect(() => {
    if (gameState === "playing" && !isAnimating && faces.length > 0 && moves > 0) {
      if (checkSolved()) {
        // Success!
        const finalTime = Math.floor((Date.now() - (startTime || 0)) / 1000);
        
        // Update best time if better
        if (bestTime === null || finalTime < bestTime) {
          setBestTime(finalTime);
        }
        
        // Calculate score
        const timeBonus = Math.max(300 - finalTime, 0);
        const movesPenalty = moves * 2;
        const calculatedScore = Math.max(500 + timeBonus - movesPenalty, 100);
        
        setScore(calculatedScore);
        setGameState("success");
        
        try {
          audio.playSound("success");
        } catch (e) {
          console.log("Could not play success sound");
        }
      }
    }
  }, [faces, isAnimating, moves]);
  
  // Initialize cube with solved state
  const initializeCube = () => {
    const newFaces: string[][] = [];
    
    // Initialize 6 faces, each with 9 cells of the same color
    for (let i = 0; i < 6; i++) {
      const face: string[] = Array(9).fill(cubeColors[i]);
      newFaces.push(face);
    }
    
    setFaces(newFaces);
  };
  
  // Map face indices for convenience
  const FACE = {
    RIGHT: 0,
    LEFT: 1,
    TOP: 2,
    BOTTOM: 3,
    FRONT: 4,
    BACK: 5
  };
  
  // Start the game
  const startGame = () => {
    setMoves(0);
    setStartTime(Date.now());
    setCurrentTime(0);
    setGameState("playing");
    
    try {
      audio.playSound("start");
    } catch (e) {
      console.log("Could not play start sound");
    }
  };
  
  // Reset the cube
  const resetCube = () => {
    initializeCube();
    setMoves(0);
    if (gameState === "playing") {
      setStartTime(Date.now());
      setCurrentTime(0);
      
      try {
        audio.playSound("reset");
      } catch (e) {
        console.log("Could not play reset sound");
      }
    }
  };
  
  // Scramble the cube with random moves
  const scrambleCube = async () => {
    if (gameState !== "playing" || isAnimating) return;
    
    setIsAnimating(true);
    
    try {
      audio.playSound("scramble");
    } catch (e) {
      console.log("Could not play scramble sound");
    }
    
    // Perform 20 random moves
    const possibleMoves = ['R', 'L', 'U', 'D', 'F', 'B', 'R\'', 'L\'', 'U\'', 'D\'', 'F\'', 'B\''];
    
    for (let i = 0; i < 20; i++) {
      const move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
      const isClockwise = !move.includes('\'');
      const face = move.replace('\'', '');
      
      let faceIndex;
      switch (face) {
        case 'R': faceIndex = FACE.RIGHT; break;
        case 'L': faceIndex = FACE.LEFT; break;
        case 'U': faceIndex = FACE.TOP; break;
        case 'D': faceIndex = FACE.BOTTOM; break;
        case 'F': faceIndex = FACE.FRONT; break;
        case 'B': faceIndex = FACE.BACK; break;
        default: faceIndex = FACE.FRONT;
      }
      
      await performMove(faceIndex, isClockwise);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setIsAnimating(false);
    setMoves(0); // Reset moves after scramble
  };
  
  // Perform a move on the cube
  const performMove = async (faceIndex: number, clockwise: boolean = true) => {
    if (isAnimating) return;
    setIsAnimating(true);
    
    try {
      audio.playSound("rotate");
    } catch (e) {
      // Silent fail
    }
    
    // First, rotate the face itself
    setFaces(prevFaces => {
      const newFaces = [...prevFaces];
      const face = [...newFaces[faceIndex]];
      
      // Rotate the face (3x3 grid)
      // For a clockwise rotation:
      // 0 1 2    6 3 0
      // 3 4 5 -> 7 4 1
      // 6 7 8    8 5 2
      let rotatedFace;
      if (clockwise) {
        rotatedFace = [
          face[6], face[3], face[0],
          face[7], face[4], face[1],
          face[8], face[5], face[2]
        ];
      } else {
        rotatedFace = [
          face[2], face[5], face[8],
          face[1], face[4], face[7],
          face[0], face[3], face[6]
        ];
      }
      
      newFaces[faceIndex] = rotatedFace;
      return newFaces;
    });
    
    // Wait a bit for the animation
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Then, update the adjacent faces
    setFaces(prevFaces => {
      const newFaces = prevFaces.map(face => [...face]);
      
      // Define which cells are affected on each adjacent face
      let adjacentFaces: [number, number[]][] = [];
      let cycleOrder: number[] = []; // Initialize with a default value
      
      switch (faceIndex) {
        case FACE.RIGHT: // Right face
          // Adjacent: Top, Back, Bottom, Front (affected cells depend on orientation)
          adjacentFaces = [
            [FACE.TOP, [2, 5, 8]],      // Right column of Top face
            [FACE.BACK, [0, 3, 6]],     // Left column of Back face (in reverse)
            [FACE.BOTTOM, [2, 5, 8]],   // Right column of Bottom face
            [FACE.FRONT, [2, 5, 8]]     // Right column of Front face
          ];
          cycleOrder = clockwise ? [0, 3, 2, 1] : [0, 1, 2, 3];
          break;
          
        case FACE.LEFT: // Left face
          // Adjacent: Top, Front, Bottom, Back
          adjacentFaces = [
            [FACE.TOP, [0, 3, 6]],      // Left column of Top face
            [FACE.FRONT, [0, 3, 6]],    // Left column of Front face
            [FACE.BOTTOM, [0, 3, 6]],   // Left column of Bottom face
            [FACE.BACK, [2, 5, 8]]      // Right column of Back face (in reverse)
          ];
          cycleOrder = clockwise ? [0, 1, 2, 3] : [0, 3, 2, 1];
          break;
          
        case FACE.TOP: // Top face
          // Adjacent: Back, Right, Front, Left (top rows)
          adjacentFaces = [
            [FACE.BACK, [0, 1, 2]],     // Top row of Back face
            [FACE.RIGHT, [0, 1, 2]],    // Top row of Right face
            [FACE.FRONT, [0, 1, 2]],    // Top row of Front face
            [FACE.LEFT, [0, 1, 2]]      // Top row of Left face
          ];
          cycleOrder = clockwise ? [0, 1, 2, 3] : [0, 3, 2, 1];
          break;
          
        case FACE.BOTTOM: // Bottom face
          // Adjacent: Front, Right, Back, Left (bottom rows)
          adjacentFaces = [
            [FACE.FRONT, [6, 7, 8]],    // Bottom row of Front face
            [FACE.RIGHT, [6, 7, 8]],    // Bottom row of Right face
            [FACE.BACK, [6, 7, 8]],     // Bottom row of Back face
            [FACE.LEFT, [6, 7, 8]]      // Bottom row of Left face
          ];
          cycleOrder = clockwise ? [0, 1, 2, 3] : [0, 3, 2, 1];
          break;
          
        case FACE.FRONT: // Front face
          // Adjacent: Top, Right, Bottom, Left
          adjacentFaces = [
            [FACE.TOP, [6, 7, 8]],      // Bottom row of Top face
            [FACE.RIGHT, [0, 3, 6]],    // Left column of Right face
            [FACE.BOTTOM, [0, 1, 2]],   // Top row of Bottom face (in reverse)
            [FACE.LEFT, [2, 5, 8]]      // Right column of Left face
          ];
          cycleOrder = clockwise ? [0, 1, 2, 3] : [0, 3, 2, 1];
          break;
          
        case FACE.BACK: // Back face
          // Adjacent: Top, Left, Bottom, Right
          adjacentFaces = [
            [FACE.TOP, [0, 1, 2]],      // Top row of Top face
            [FACE.LEFT, [0, 3, 6]],     // Left column of Left face
            [FACE.BOTTOM, [6, 7, 8]],   // Bottom row of Bottom face (in reverse)
            [FACE.RIGHT, [2, 5, 8]]     // Right column of Right face
          ];
          cycleOrder = clockwise ? [0, 1, 2, 3] : [0, 3, 2, 1];
          break;
          
        default:
          break;
      }
      
      // Determine the cycle of faces
      let cycle: [number, number[]][] = [];
      
      // Make sure cycleOrder is defined even if switch case didn't set it
      if (!cycleOrder) {
        cycleOrder = clockwise ? [0, 1, 2, 3] : [0, 3, 2, 1];
      }
      
      for (let i = 0; i < adjacentFaces.length; i++) {
        cycle.push(adjacentFaces[cycleOrder[i]]);
      }
      
      // Temporary storage for the colors to be cycled
      let tempColors: string[] = Array(3).fill('');
      
      // Get initial colors from the first face
      for (let i = 0; i < 3; i++) {
        tempColors[i] = newFaces[cycle[0][0]][cycle[0][1][i]];
      }
      
      // Cycle the colors through all faces
      for (let i = 0; i < cycle.length - 1; i++) {
        const [currentFaceIdx, currentCells] = cycle[i];
        const [nextFaceIdx, nextCells] = cycle[i + 1];
        
        for (let j = 0; j < 3; j++) {
          // Special cases for reversal in some moves
          if ((faceIndex === FACE.RIGHT && nextFaceIdx === FACE.BACK) ||
              (faceIndex === FACE.LEFT && currentFaceIdx === FACE.BACK) ||
              (faceIndex === FACE.FRONT && nextFaceIdx === FACE.BOTTOM) ||
              (faceIndex === FACE.BACK && currentFaceIdx === FACE.BOTTOM)) {
            newFaces[currentFaceIdx][currentCells[j]] = newFaces[nextFaceIdx][nextCells[2 - j]];
          } else {
            newFaces[currentFaceIdx][currentCells[j]] = newFaces[nextFaceIdx][nextCells[j]];
          }
        }
      }
      
      // Complete the cycle by setting the last face with the saved colors
      const [lastFaceIdx, lastCells] = cycle[cycle.length - 1];
      for (let i = 0; i < 3; i++) {
        // Special cases for reversal in some moves
        if ((faceIndex === FACE.RIGHT && lastFaceIdx === FACE.BACK) ||
            (faceIndex === FACE.LEFT && cycle[0][0] === FACE.BACK) ||
            (faceIndex === FACE.FRONT && lastFaceIdx === FACE.BOTTOM) ||
            (faceIndex === FACE.BACK && cycle[0][0] === FACE.BOTTOM)) {
          newFaces[lastFaceIdx][lastCells[i]] = tempColors[2 - i];
        } else {
          newFaces[lastFaceIdx][lastCells[i]] = tempColors[i];
        }
      }
      
      return newFaces;
    });
    
    setMoves(prev => prev + 1);
    
    // Wait a bit for the animation to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    setIsAnimating(false);
  };
  
  // Check if the cube is solved (each face has all cells of the same color)
  const checkSolved = () => {
    for (const face of faces) {
      const firstColor = face[0];
      for (const cell of face) {
        if (cell !== firstColor) {
          return false;
        }
      }
    }
    return true;
  };
  
  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Mouse event handlers for rotating the cube view
  const handleMouseDown = (e: React.MouseEvent) => {
    if (gameState !== "playing" || isAnimating) return;
    
    // Start dragging to rotate the cube view
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY
    });
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || gameState !== "playing") return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    setCubeRotation(prev => ({
      x: prev.x - deltaY * 0.5,
      y: prev.y + deltaX * 0.5
    }));
    
    setDragStart({
      x: e.clientX,
      y: e.clientY
    });
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // Handle face click to rotate a face
  const handleFaceClick = (faceIndex: number, e: React.MouseEvent) => {
    if (gameState !== "playing" || isAnimating) return;
    
    // Determine if it's a left or right click to set rotation direction
    const isClockwise = e.button !== 2; // Right click = counter-clockwise
    
    // Rotate the face
    performMove(faceIndex, isClockwise);
    
    try {
      audio.playSound("click");
    } catch (e) {
      // Silent fail
    }
    
    // Prevent context menu on right-click
    e.preventDefault();
  };
  
  // Render a single face of the cube
  const renderFace = (faceIndex: number, transform: string) => {
    if (!faces[faceIndex]) return null;
    
    return (
      <div
        className="cube-face"
        style={{
          position: "absolute",
          width: "200px",
          height: "200px",
          left: "50px",
          top: "50px",
          transformStyle: "preserve-3d",
          transform,
          backfaceVisibility: "visible",
          cursor: isAnimating ? "not-allowed" : "pointer"
        }}
        onClick={(e) => handleFaceClick(faceIndex, e)}
        onContextMenu={(e) => handleFaceClick(faceIndex, e)}
      >
        <div className="grid grid-cols-3 grid-rows-3 w-full h-full">
          {faces[faceIndex].map((color, i) => (
            <div
              key={`face${faceIndex}-${i}`}
              className="border border-black transition-all duration-200"
              style={{
                backgroundColor: color,
                boxShadow: "inset 0 0 10px rgba(0,0,0,0.2)"
              }}
            />
          ))}
        </div>
      </div>
    );
  };
  
  // Render the cube
  const renderCube = () => {
    return (
      <div
        className="perspective-container"
        style={{
          perspective: "1200px",
          width: "300px",
          height: "300px"
        }}
      >
        <div
          className="cube-container"
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
            transformStyle: "preserve-3d",
            transform: `rotateX(${cubeRotation.x}deg) rotateY(${cubeRotation.y}deg)`,
            transition: isDragging ? "none" : "transform 0.5s ease-out"
          }}
        >
          {/* Right Face (0) */}
          {renderFace(FACE.RIGHT, "rotateY(90deg) translateZ(100px)")}
          
          {/* Left Face (1) */}
          {renderFace(FACE.LEFT, "rotateY(-90deg) translateZ(100px)")}
          
          {/* Top Face (2) */}
          {renderFace(FACE.TOP, "rotateX(90deg) translateZ(100px)")}
          
          {/* Bottom Face (3) */}
          {renderFace(FACE.BOTTOM, "rotateX(-90deg) translateZ(100px)")}
          
          {/* Front Face (4) */}
          {renderFace(FACE.FRONT, "translateZ(100px)")}
          
          {/* Back Face (5) */}
          {renderFace(FACE.BACK, "rotateY(180deg) translateZ(100px)")}
        </div>
      </div>
    );
  };
  
  return (
    <div
      ref={containerRef}
      className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden bg-gradient-to-b from-purple-900/30 via-black to-black"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute rounded-full"
            animate={{
              x: [
                Math.random() * window.innerWidth,
                Math.random() * window.innerWidth
              ],
              y: [
                Math.random() * window.innerHeight,
                Math.random() * window.innerHeight
              ],
              opacity: [0.1, 0.3, 0.1],
              scale: [
                Math.random() * 0.5 + 0.5,
                Math.random() * 0.5 + 0.5
              ]
            }}
            transition={{
              duration: Math.random() * 20 + 10,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              width: `${Math.random() * 4 + 1}px`,
              height: `${Math.random() * 4 + 1}px`,
              background: `linear-gradient(to right, ${cubeColors[0]}30, ${cubeColors[1]}30)`,
              boxShadow: `0 0 ${Math.random() * 8 + 2}px ${cubeColors[0]}`
            }}
          />
        ))}
      </div>
      
      <div className="relative z-10 flex flex-col items-center w-full max-w-4xl">
        {/* Header with realm styling */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="text-center mb-6"
        >
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-2 font-pixel tracking-wider">
            RUBIK'S REALM
          </h1>
          
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
            <p className="text-xl text-blue-300 font-light">
              {gameState === "intro" 
                ? "Pattern Harmonization"
                : gameState === "success"
                ? "Pattern Mastery Achieved"
                : "Master the Cube"
              }
            </p>
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
          </div>
        </motion.div>
        
        {/* Status display with enhanced UI */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mb-6 text-center backdrop-blur-sm bg-black/20 px-6 py-3 rounded-lg border border-purple-500/20"
        >
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="text-lg text-gray-300">Moves</div>
            <div className="text-2xl text-pink-300 font-bold">{moves}</div>
            <div className="h-4 w-px bg-purple-500/30"></div>
            <div className="text-lg text-gray-300">Time</div>
            <motion.div 
              key={currentTime}
              initial={{ scale: 1 }}
              animate={{ scale: currentTime % 10 === 0 && currentTime > 0 ? [1, 1.2, 1] : 1 }}
              transition={{ duration: 0.5 }}
              className="text-2xl text-green-300 font-bold"
            >
              {formatTime(currentTime)}
            </motion.div>
            
            {bestTime !== null && (
              <>
                <div className="h-4 w-px bg-purple-500/30"></div>
                <div className="text-lg text-gray-300">Best</div>
                <div className="text-xl text-yellow-300 font-bold">{formatTime(bestTime)}</div>
              </>
            )}
          </div>
          
          <motion.div>
            {gameState === "intro" && (
              <motion.p 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-lg text-gray-300"
              >
                Align each face to have all squares of the same color.
              </motion.p>
            )}
            {gameState === "playing" && (
              <motion.p 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-lg text-blue-300 flex items-center justify-center gap-2"
              >
                <span>
                  {isAnimating ? "Animating..." : "Left-click to rotate clockwise, right-click for counter-clockwise."}
                </span>
              </motion.p>
            )}
            {gameState === "success" && (
              <motion.p 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-lg text-green-400 font-semibold"
              >
                Cube alignment complete! Score: {score}
              </motion.p>
            )}
          </motion.div>
        </motion.div>
        
        {/* 3D Cube Display */}
        <motion.div 
          className="relative w-full h-96 flex items-center justify-center mb-8 transform-gpu"
          style={{ perspective: "1200px" }}
          onMouseDown={handleMouseDown}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          {renderCube()}
        </motion.div>
        
        {/* Instructions for drag rotation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 text-center"
        >
          <p className="text-gray-300">
            Drag anywhere to rotate the cube view.
          </p>
        </motion.div>
        
        {/* Game controls */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-2 flex gap-4 justify-center flex-wrap"
        >
          {gameState === "intro" && (
            <motion.button 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={startGame}
              className="px-8 py-3 relative group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:from-blue-500 group-hover:to-purple-500 rounded-md transition-all duration-300"></div>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-50 transition-opacity duration-300 bg-white/10 rounded-md"></div>
              <span className="relative text-white font-pixel text-lg tracking-wider">Start Challenge</span>
            </motion.button>
          )}
          
          {gameState === "playing" && (
            <>
              <motion.button 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={scrambleCube}
                disabled={isAnimating}
                className="px-8 py-3 relative group overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-r from-yellow-600 to-amber-600 ${!isAnimating ? 'group-hover:from-yellow-500 group-hover:to-amber-500' : 'opacity-50'} rounded-md transition-all duration-300`}></div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-50 transition-opacity duration-300 bg-white/10 rounded-md"></div>
                <span className="relative text-white font-pixel text-lg tracking-wider">{isAnimating ? "Scrambling..." : "Scramble"}</span>
              </motion.button>
            
              <motion.button 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={resetCube}
                disabled={isAnimating}
                className="px-8 py-3 relative group overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-r from-red-600 to-purple-600 ${!isAnimating ? 'group-hover:from-red-500 group-hover:to-purple-500' : 'opacity-50'} rounded-md transition-all duration-300`}></div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-50 transition-opacity duration-300 bg-white/10 rounded-md"></div>
                <span className="relative text-white font-pixel text-lg tracking-wider">Reset Cube</span>
              </motion.button>
            </>
          )}
          
          {gameState === "success" && (
            <motion.button 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => {
                resetCube();
                setGameState("playing");
              }}
              className="px-8 py-3 relative group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-teal-600 group-hover:from-green-500 group-hover:to-teal-500 rounded-md transition-all duration-300"></div>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-50 transition-opacity duration-300 bg-white/10 rounded-md"></div>
              <span className="relative text-white font-pixel text-lg tracking-wider">Play Again</span>
            </motion.button>
          )}
          
          {/* Return to hub button */}
          <motion.button 
            onClick={onReturn}
            className="px-6 py-3 relative group overflow-hidden"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="absolute inset-0 bg-black border border-purple-500/50 group-hover:bg-purple-900/20 rounded-md transition-all duration-300"></div>
            <span className="relative text-white font-pixel tracking-wider flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5"/>
                <path d="M12 19l-7-7 7-7"/>
              </svg>
              Return to Hub
            </span>
          </motion.button>
        </motion.div>
        
        {/* Help information */}
        {gameState === "playing" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 text-center max-w-md"
          >
            <h3 className="text-purple-300 mb-2 text-lg">How to Play:</h3>
            <ul className="text-gray-300 space-y-1 text-sm">
              <li>• Left-click on any face to rotate it clockwise</li>
              <li>• Right-click to rotate counter-clockwise</li>
              <li>• Drag anywhere to rotate the whole cube view</li>
              <li>• Arrange each face to have all squares of the same color</li>
            </ul>
          </motion.div>
        )}
      </div>
      
      {/* Critical CSS fixes for 3D rendering */}
      <style jsx global>{`
        /* Force preserve-3d on all elements that need it */
        .perspective-container, .cube-container, .cube-face {
          transform-style: preserve-3d !important;
          -webkit-transform-style: preserve-3d !important;
        }
        
        /* Fix for some browsers - ensure cube edges are visible */
        .cube-face {
          backface-visibility: visible !important;
          -webkit-backface-visibility: visible !important;
          opacity: 1 !important;
        }
        
        /* Font styling */
        .font-pixel {
          font-family: monospace;
          letter-spacing: 0.05em;
        }
      `}</style>
    </div>
  );
};

export default CrypticRealm;