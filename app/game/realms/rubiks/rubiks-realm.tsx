import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cubeCollection } from "../../cube/realm-cube";
import { useAudio } from "../../contexts/audio-context";

interface RubiksRealmProps {
  onReturn: () => void;
  selectedCubeId?: string;
}

// Interface for a color face
interface ColorFace {
  color: string;
  faceIndex: number; // 0-5 for the 6 faces
}

// Interface for a cubie (a single piece of the Rubik's Cube)
interface Cubie {
  // Position
  x: number;
  y: number;
  z: number;
  
  // Colors on each face (null if not visible)
  faces: {
    right: ColorFace | null;
    left: ColorFace | null;
    top: ColorFace | null;
    bottom: ColorFace | null;
    front: ColorFace | null;
    back: ColorFace | null;
  };
}

// Main Rubik's Cube component
const RubiksRealm: React.FC<RubiksRealmProps> = ({ onReturn, selectedCubeId = "pink-neon" }) => {
  // Game state
  const [gameState, setGameState] = useState<"intro" | "playing" | "success">("intro");
  const [cubeSize, setCubeSize] = useState(3); // 3x3 cube by default
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  
  // Cube interaction state
  const [viewRotation, setViewRotation] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [rotating, setRotating] = useState(false);
  const [selectedFace, setSelectedFace] = useState<number | null>(null);
  
  // References
  const containerRef = useRef<HTMLDivElement>(null);
  const cubeRef = useRef<HTMLDivElement>(null);
  
  // Get cube colors
  const defaultCube = cubeCollection[0];
  const selectedCube = cubeCollection.find(cube => cube.id === selectedCubeId) || defaultCube;
  const cubeColors = [...selectedCube.colors];
  
  // Ensure we have 6 colors for all faces
  while (cubeColors.length < 6) {
    cubeColors.push(defaultCube.colors[cubeColors.length % defaultCube.colors.length]);
  }
  
  // The state of the cube
  const [cubeState, setCubeState] = useState<Cubie[]>([]);
  
  // Audio context
  const audio = useAudio();
  
  // Initialize the cube
  useEffect(() => {
    try {
      audio.changeTrack("rubiks");
    } catch (error) {
      try {
        audio.changeTrack("hub");
      } catch (e) {
        console.log("Could not set audio track");
      }
    }
    
    // Initialize cube state
    initializeCube();
  }, []);
  
  // Update cube when size changes
  useEffect(() => {
    initializeCube();
  }, [cubeSize]);
  
  // Update colors when selected cube changes
  useEffect(() => {
    if (cubeState.length > 0) {
      updateCubeColors();
    }
  }, [selectedCubeId]);
  
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
    if (gameState === "playing" && !rotating && cubeState.length > 0 && moves > 0) {
      const isSolved = checkSolved();
      
      if (isSolved) {
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
      }
    }
  }, [cubeState, rotating, moves]);
  
  // Initialize cube - create all cubies with correct colors
  const initializeCube = () => {
    const size = cubeSize;
    const newCubies: Cubie[] = [];
    
    // Create cubies
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        for (let z = 0; z < size; z++) {
          // Skip interior cubies (not visible)
          const isOnSurface = x === 0 || x === size - 1 || 
                             y === 0 || y === size - 1 || 
                             z === 0 || z === size - 1;
          
          if (!isOnSurface) continue;
          
          // Create a new cubie
          const cubie: Cubie = {
            x, y, z,
            faces: {
              // Right face (x = size-1)
              right: x === size - 1 ? { color: cubeColors[0], faceIndex: 0 } : null,
              // Left face (x = 0)
              left: x === 0 ? { color: cubeColors[1], faceIndex: 1 } : null,
              // Top face (y = size-1)
              top: y === size - 1 ? { color: cubeColors[2], faceIndex: 2 } : null,
              // Bottom face (y = 0)
              bottom: y === 0 ? { color: cubeColors[3], faceIndex: 3 } : null,
              // Front face (z = size-1)
              front: z === size - 1 ? { color: cubeColors[4], faceIndex: 4 } : null,
              // Back face (z = 0)
              back: z === 0 ? { color: cubeColors[5], faceIndex: 5 } : null
            }
          };
          
          newCubies.push(cubie);
        }
      }
    }
    
    setCubeState(newCubies);
  };
  
  // Update cube colors when selected cube changes
  const updateCubeColors = () => {
    setCubeState(prev => {
      const updated = [...prev];
      
      // Update all color faces
      updated.forEach(cubie => {
        Object.entries(cubie.faces).forEach(([faceName, face]) => {
          if (face) {
            face.color = cubeColors[face.faceIndex];
          }
        });
      });
      
      return updated;
    });
  };
  
  // Mouse handlers for rotating the whole cube
  const handleMouseDown = (e: React.MouseEvent) => {
    if (gameState !== "playing" || rotating) return;
    
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
    
    // Rotate the entire cube
    setViewRotation(prev => ({
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
  
  // Start the game
  const startGame = () => {
    setMoves(0);
    setStartTime(Date.now());
    setCurrentTime(0);
    setGameState("playing");
  };
  
  // Reset the cube
  const resetCube = () => {
    initializeCube();
    setMoves(0);
    if (gameState === "playing") {
      setStartTime(Date.now());
      setCurrentTime(0);
    }
  };
  
  // Get cubies on a specific face
  const getCubiesOnFace = (faceIndex: number): Cubie[] => {
    const result: Cubie[] = [];
    
    cubeState.forEach(cubie => {
      // Check if this cubie has the specified face
      let hasFace = false;
      
      Object.values(cubie.faces).forEach(face => {
        if (face && face.faceIndex === faceIndex) {
          hasFace = true;
        }
      });
      
      if (hasFace) {
        result.push(cubie);
      }
    });
    
    return result;
  };
  
  // Rotate a face of the cube
  const rotateFace = (faceIndex: number, clockwise: boolean = true) => {
    if (rotating) return;
    setRotating(true);
    
    // Create a deep copy of the current cube state
    const newCubeState = JSON.parse(JSON.stringify(cubeState)) as Cubie[];
    
    // Get all cubies on this face
    const faceCubies = getCubiesOnFace(faceIndex);
    
    // The axis of rotation depends on the face
    let axis: 'x' | 'y' | 'z';
    let value: number;
    
    switch (faceIndex) {
      case 0: // Right face (x = size-1)
        axis = 'x';
        value = cubeSize - 1;
        break;
      case 1: // Left face (x = 0)
        axis = 'x';
        value = 0;
        break;
      case 2: // Top face (y = size-1)
        axis = 'y';
        value = cubeSize - 1;
        break;
      case 3: // Bottom face (y = 0)
        axis = 'y';
        value = 0;
        break;
      case 4: // Front face (z = size-1)
        axis = 'z';
        value = cubeSize - 1;
        break;
      case 5: // Back face (z = 0)
        axis = 'z';
        value = 0;
        break;
      default:
        setRotating(false);
        return;
    }
    
    // Filter cubies that are on this layer
    const cubiesOnLayer = newCubeState.filter(cubie => cubie[axis] === value);
    
    // Apply rotation to these cubies
    cubiesOnLayer.forEach(cubie => {
      rotateCubie(cubie, axis, clockwise);
    });
    
    // Update cube state
    setCubeState(newCubeState);
    setMoves(prev => prev + 1);
    
    // End rotation after a short delay
    setTimeout(() => {
      setRotating(false);
    }, 300);
  };
  
  // Rotate a single cubie
  const rotateCubie = (cubie: Cubie, axis: 'x' | 'y' | 'z', clockwise: boolean) => {
    // Store old coordinates
    const oldX = cubie.x;
    const oldY = cubie.y;
    const oldZ = cubie.z;
    
    // Calculate new coordinates based on the rotation axis
    switch (axis) {
      case 'x': // Rotation around X-axis
        if (clockwise) {
          cubie.y = oldZ;
          cubie.z = cubeSize - 1 - oldY;
        } else {
          cubie.y = cubeSize - 1 - oldZ;
          cubie.z = oldY;
        }
        break;
        
      case 'y': // Rotation around Y-axis
        if (clockwise) {
          cubie.x = cubeSize - 1 - oldZ;
          cubie.z = oldX;
        } else {
          cubie.x = oldZ;
          cubie.z = cubeSize - 1 - oldX;
        }
        break;
        
      case 'z': // Rotation around Z-axis
        if (clockwise) {
          cubie.x = oldY;
          cubie.y = cubeSize - 1 - oldX;
        } else {
          cubie.x = cubeSize - 1 - oldY;
          cubie.y = oldX;
        }
        break;
    }
    
    // Rotate the faces' colors
    const oldFaces = { ...cubie.faces };
    
    switch (axis) {
      case 'x': // Rotation around X-axis
        if (clockwise) {
          cubie.faces.top = oldFaces.front;
          cubie.faces.back = oldFaces.top;
          cubie.faces.bottom = oldFaces.back;
          cubie.faces.front = oldFaces.bottom;
        } else {
          cubie.faces.front = oldFaces.top;
          cubie.faces.top = oldFaces.back;
          cubie.faces.back = oldFaces.bottom;
          cubie.faces.bottom = oldFaces.front;
        }
        break;
        
      case 'y': // Rotation around Y-axis
        if (clockwise) {
          cubie.faces.front = oldFaces.right;
          cubie.faces.left = oldFaces.front;
          cubie.faces.back = oldFaces.left;
          cubie.faces.right = oldFaces.back;
        } else {
          cubie.faces.right = oldFaces.front;
          cubie.faces.front = oldFaces.left;
          cubie.faces.left = oldFaces.back;
          cubie.faces.back = oldFaces.right;
        }
        break;
        
      case 'z': // Rotation around Z-axis
        if (clockwise) {
          cubie.faces.top = oldFaces.left;
          cubie.faces.right = oldFaces.top;
          cubie.faces.bottom = oldFaces.right;
          cubie.faces.left = oldFaces.bottom;
        } else {
          cubie.faces.left = oldFaces.top;
          cubie.faces.top = oldFaces.right;
          cubie.faces.right = oldFaces.bottom;
          cubie.faces.bottom = oldFaces.left;
        }
        break;
    }
  };
  
  // Scramble the cube
  const scrambleCube = async () => {
    if (gameState !== "playing" || rotating) return;
    
    setRotating(true);
    
    // Execute random moves
    const moveCount = 20;
    
    for (let i = 0; i < moveCount; i++) {
      const face = Math.floor(Math.random() * 6); // 0-5 for the 6 faces
      const clockwise = Math.random() > 0.5;
      
      // Create a deep copy of the current cube state
      const newCubeState = JSON.parse(JSON.stringify(cubeState)) as Cubie[];
      
      // Get the axis and value based on the face
      let axis: 'x' | 'y' | 'z';
      let value: number;
      
      switch (face) {
        case 0: // Right face
          axis = 'x';
          value = cubeSize - 1;
          break;
        case 1: // Left face
          axis = 'x';
          value = 0;
          break;
        case 2: // Top face
          axis = 'y';
          value = cubeSize - 1;
          break;
        case 3: // Bottom face
          axis = 'y';
          value = 0;
          break;
        case 4: // Front face
          axis = 'z';
          value = cubeSize - 1;
          break;
        case 5: // Back face
          axis = 'z';
          value = 0;
          break;
        default:
          axis = 'x';
          value = 0;
      }
      
      // Filter cubies that are on this layer
      const cubiesOnLayer = newCubeState.filter(cubie => cubie[axis] === value);
      
      // Apply rotation
      cubiesOnLayer.forEach(cubie => {
        rotateCubie(cubie, axis, clockwise);
      });
      
      // Update cube state
      setCubeState(newCubeState);
      
      // Short delay for visual effect
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setRotating(false);
    setMoves(0); // Reset moves after scramble
  };
  
  // Check if the cube is solved
  const checkSolved = () => {
    // For each of the 6 faces, check if all visible faces have the same color
    for (let faceIndex = 0; faceIndex < 6; faceIndex++) {
      const faceCubies = getCubiesOnFace(faceIndex);
      
      if (faceCubies.length === 0) continue;
      
      // Get the color of the first cubie for comparison
      let firstColor = null;
      
      for (const cubie of faceCubies) {
        // Find the color of this cubie that corresponds to the current face
        let cubieColor = null;
        
        Object.values(cubie.faces).forEach(face => {
          if (face && face.faceIndex === faceIndex) {
            cubieColor = face.color;
          }
        });
        
        if (cubieColor === null) continue;
        
        if (firstColor === null) {
          firstColor = cubieColor;
        } else if (cubieColor !== firstColor) {
          // Colors don't match - not solved
          return false;
        }
      }
    }
    
    // If we get here, all faces have matching colors
    return true;
  };
  
  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle face click
  const handleFaceClick = (faceIndex: number) => {
    if (gameState !== "playing" || rotating) return;
    
    setSelectedFace(faceIndex);
    rotateFace(faceIndex, true);
  };
  
  // Render the cube
  const renderCube = () => {
    // Define the size of each face
    const faceSize = 200;
    
    return (
      <div 
        className="perspective-container"
        style={{
          perspective: '1200px',
          width: '300px',
          height: '300px'
        }}
      >
        <div 
          className="cube-container"
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            transformStyle: 'preserve-3d',
            transform: `rotateX(${viewRotation.x}deg) rotateY(${viewRotation.y}deg)`,
            transition: isDragging ? 'none' : 'transform 0.5s ease-out'
          }}
        >
          {/* Right Face (0) */}
          <div
            className="cube-face"
            style={{
              position: 'absolute',
              width: `${faceSize}px`,
              height: `${faceSize}px`,
              left: '50px',
              top: '50px',
              backgroundColor: cubeColors[0],
              transform: 'rotateY(90deg) translateZ(100px)',
              transformStyle: 'preserve-3d',
              border: '2px solid black',
              backfaceVisibility: 'visible'
            }}
            onClick={() => handleFaceClick(0)}
          >
            <div className="grid grid-cols-3 grid-rows-3 w-full h-full">
              {Array(9).fill(0).map((_, i) => (
                <div key={`face0-${i}`} className="border border-black" />
              ))}
            </div>
          </div>
          
          {/* Left Face (1) */}
          <div
            className="cube-face"
            style={{
              position: 'absolute',
              width: `${faceSize}px`,
              height: `${faceSize}px`,
              left: '50px',
              top: '50px',
              backgroundColor: cubeColors[1],
              transform: 'rotateY(-90deg) translateZ(100px)',
              transformStyle: 'preserve-3d',
              border: '2px solid black',
              backfaceVisibility: 'visible'
            }}
            onClick={() => handleFaceClick(1)}
          >
            <div className="grid grid-cols-3 grid-rows-3 w-full h-full">
              {Array(9).fill(0).map((_, i) => (
                <div key={`face1-${i}`} className="border border-black" />
              ))}
            </div>
          </div>
          
          {/* Top Face (2) */}
          <div
            className="cube-face"
            style={{
              position: 'absolute',
              width: `${faceSize}px`,
              height: `${faceSize}px`,
              left: '50px',
              top: '50px',
              backgroundColor: cubeColors[2],
              transform: 'rotateX(90deg) translateZ(100px)',
              transformStyle: 'preserve-3d',
              border: '2px solid black',
              backfaceVisibility: 'visible'
            }}
            onClick={() => handleFaceClick(2)}
          >
            <div className="grid grid-cols-3 grid-rows-3 w-full h-full">
              {Array(9).fill(0).map((_, i) => (
                <div key={`face2-${i}`} className="border border-black" />
              ))}
            </div>
          </div>
          
          {/* Bottom Face (3) */}
          <div
            className="cube-face"
            style={{
              position: 'absolute',
              width: `${faceSize}px`,
              height: `${faceSize}px`,
              left: '50px',
              top: '50px',
              backgroundColor: cubeColors[3],
              transform: 'rotateX(-90deg) translateZ(100px)',
              transformStyle: 'preserve-3d',
              border: '2px solid black',
              backfaceVisibility: 'visible'
            }}
            onClick={() => handleFaceClick(3)}
          >
            <div className="grid grid-cols-3 grid-rows-3 w-full h-full">
              {Array(9).fill(0).map((_, i) => (
                <div key={`face3-${i}`} className="border border-black" />
              ))}
            </div>
          </div>
          
          {/* Front Face (4) */}
          <div
            className="cube-face"
            style={{
              position: 'absolute',
              width: `${faceSize}px`,
              height: `${faceSize}px`,
              left: '50px',
              top: '50px',
              backgroundColor: cubeColors[4],
              transform: 'translateZ(100px)',
              transformStyle: 'preserve-3d',
              border: '2px solid black',
              backfaceVisibility: 'visible'
            }}
            onClick={() => handleFaceClick(4)}
          >
            <div className="grid grid-cols-3 grid-rows-3 w-full h-full">
              {Array(9).fill(0).map((_, i) => (
                <div key={`face4-${i}`} className="border border-black" />
              ))}
            </div>
          </div>
          
          {/* Back Face (5) */}
          <div
            className="cube-face"
            style={{
              position: 'absolute',
              width: `${faceSize}px`,
              height: `${faceSize}px`,
              left: '50px',
              top: '50px',
              backgroundColor: cubeColors[5],
              transform: 'rotateY(180deg) translateZ(100px)',
              transformStyle: 'preserve-3d',
              border: '2px solid black',
              backfaceVisibility: 'visible'
            }}
            onClick={() => handleFaceClick(5)}
          >
            <div className="grid grid-cols-3 grid-rows-3 w-full h-full">
              {Array(9).fill(0).map((_, i) => (
                <div key={`face5-${i}`} className="border border-black" />
              ))}
            </div>
          </div>
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
        {Array.from({ length: 60 }).map((_, i) => (
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
                : `Level ${cubeSize - 2}`
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
          
          <AnimatePresence mode="wait">
            {gameState === "intro" && (
              <motion.p 
                key="intro-text"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-lg text-gray-300"
              >
                Align the cube faces to match their original colors.
              </motion.p>
            )}
            {gameState === "playing" && (
              <motion.p 
                key="playing-text"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-lg text-blue-300 flex items-center justify-center gap-2"
              >
                <span>
                  Drag to rotate the cube. Click on a face to move it.
                </span>
              </motion.p>
            )}
            {gameState === "success" && (
              <motion.p 
                key="success-text"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-lg text-green-400 font-semibold"
              >
                Cube alignment complete! Score: {score}
              </motion.p>
            )}
          </AnimatePresence>
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
        
        {/* Game controls */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-6 flex gap-4 justify-center flex-wrap"
        >
          <AnimatePresence mode="wait">
            {gameState === "intro" && (
              <motion.button 
                key="start-button"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={startGame}
                className="px-8 py-3 relative group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:from-blue-500 group-hover:to-purple-500 rounded-md transition-all duration-300"></div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-50 transition-opacity duration-300 bg-[radial-gradient(closest-side_at_50%_50%,white,transparent)]"></div>
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                <span className="relative text-white font-pixel text-lg tracking-wider">Start Challenge</span>
              </motion.button>
            )}
            
            {gameState === "playing" && (
              <>
                <motion.button 
                  key="scramble-button"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={scrambleCube}
                  disabled={rotating}
                  className="px-8 py-3 relative group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 to-amber-600 group-hover:from-yellow-500 group-hover:to-amber-500 rounded-md transition-all duration-300"></div>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-50 transition-opacity duration-300 bg-[radial-gradient(closest-side_at_50%_50%,white,transparent)]"></div>
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                  <span className="relative text-white font-pixel text-lg tracking-wider">Scramble</span>
                </motion.button>
              
                <motion.button 
                  key="reset-button"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={resetCube}
                  className="px-8 py-3 relative group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-purple-600 group-hover:from-red-500 group-hover:to-purple-500 rounded-md transition-all duration-300"></div>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-50 transition-opacity duration-300 bg-[radial-gradient(closest-side_at_50%_50%,white,transparent)]"></div>
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                  <span className="relative text-white font-pixel text-lg tracking-wider">Reset Cube</span>
                </motion.button>
              </>
            )}
            
            {gameState === "success" && (
              <motion.button 
                key="next-button"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => {
                  setCubeSize(prev => Math.min(prev + 1, 5)); // Increase difficulty, max 5x5
                  setGameState("intro");
                }}
                className="px-8 py-3 relative group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-teal-600 group-hover:from-green-500 group-hover:to-teal-500 rounded-md transition-all duration-300"></div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-50 transition-opacity duration-300 bg-[radial-gradient(closest-side_at_50%_50%,white,transparent)]"></div>
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                <span className="relative text-white font-pixel text-lg tracking-wider">Next Level</span>
              </motion.button>
            )}
          </AnimatePresence>
          
          {/* Return to hub button */}
          <motion.button 
            onClick={onReturn}
            className="px-6 py-3 relative group overflow-hidden"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="absolute inset-0 bg-black border border-purple-500/50 group-hover:bg-purple-900/20 rounded-md transition-all duration-300"></div>
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>
            <span className="relative text-white font-pixel tracking-wider flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5"/>
                <path d="M12 19l-7-7 7-7"/>
              </svg>
              Return to Hub
            </span>
          </motion.button>
        </motion.div>
        
        {/* Difficulty selection (only in intro screen) */}
        {gameState === "intro" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 flex flex-col items-center"
          >
            <p className="text-gray-300 mb-3">Select Difficulty:</p>
            <div className="flex gap-3">
              {[3, 4, 5].map((size) => (
                <motion.button
                  key={`size-${size}`}
                  onClick={() => setCubeSize(size)}
                  className="px-5 py-2 rounded-md transition-all text-white font-pixel"
                  style={{
                    background: cubeSize === size 
                      ? `linear-gradient(to right, ${cubeColors[0]}80, ${cubeColors[1]}80)`
                      : 'rgba(0, 0, 0, 0.5)',
                    boxShadow: cubeSize === size ? '0 0 10px rgba(139, 92, 246, 0.3)' : 'none'
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {size}x{size}
                </motion.button>
              ))}
            </div>
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
        
        /* Ensure all CSS transforms maintain 3D context */
        * {
          transform-style: preserve-3d;
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

export default RubiksRealm;