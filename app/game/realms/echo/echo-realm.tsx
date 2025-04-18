import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useAnimationControls } from "framer-motion";
import RealmCube from "../../cube/realm-cube";
import { cubeCollection } from "../../cube/realm-cube";

// Enhanced Echo Realm - Advanced memory game with dynamic 3D cube interactions
interface EchoRealmProps {
  onReturn: () => void;
  selectedCubeId?: string; // Pass the selected cube ID from the hub
}

const EchoRealm: React.FC<EchoRealmProps> = ({ onReturn, selectedCubeId = "pink-neon" }) => {
  // Game state management
  const [gameState, setGameState] = useState("intro"); // "intro", "watching", "repeating", "success", "failure"
  const [currentLevel, setCurrentLevel] = useState(1);
  const [pattern, setPattern] = useState<{ x: number; y: number }[]>([]);
  const [playerPattern, setPlayerPattern] = useState<{ x: number; y: number }[]>([]);
  const [highlightedCell, setHighlightedCell] = useState<{ x: number; y: number } | null>(null);
  const [cubePosition, setCubePosition] = useState<{ x: number; y: number } | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  
  // Enhanced visual states
  const [cameraAngle, setCameraAngle] = useState({ x: 20, y: 0 });
  const [trailPoints, setTrailPoints] = useState<{
    start: {x: number, y: number};
    end: {x: number, y: number};
    opacity: number;
  }[]>([]);
  const [cubeHeight, setCubeHeight] = useState(0);
  const [cubeRotation, setCubeRotation] = useState({ x: 0, y: 0, z: 0 });
  const [patternLines, setPatternLines] = useState<{
    x1: number; y1: number; x2: number; y2: number; progress: number; color: string;
  }[]>([]);
  const [activeVisualizations, setActiveVisualizations] = useState<{
    id: string; type: string; position: {x: number, y: number}; duration: number;
  }[]>([]);
  const [cellElevations, setCellElevations] = useState<{[key: string]: number}>({});
  const [ambientLightPosition, setAmbientLightPosition] = useState({ x: 50, y: 50 });
  const [score, setScore] = useState(0);

  // Animation controls
  const gridControls = useAnimationControls();
  const cubeControls = useAnimationControls();
  
  // Refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  
  // Grid size
  const gridSize = 5;
  
  // Get the selected cube's color from collection (for cell highlights)
  const selectedCube = cubeCollection.find(cube => cube.id === selectedCubeId) || cubeCollection[0];
  const cubeColor = selectedCube.colors[0];
  const cubeSecondaryColor = selectedCube.colors[1] || "#8B5CF6";
  const cubeTertiaryColor = selectedCube.colors[2] || "#A78BFA";
  const cubeGlow = selectedCube.glow;
  
  // Debug output to verify the selected cube
  useEffect(() => {
    console.log("Selected cube in Echo Realm:", selectedCubeId);
    console.log("Found cube:", selectedCube);
    
    // Initialize cell elevations with random slight differences
    const initialElevations: {[key: string]: number} = {};
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        initialElevations[`${x}-${y}`] = Math.random() * 3 - 5;
      }
    }
    setCellElevations(initialElevations);
    
    // Animate grid entrance
    gridControls.start({
      opacity: [0, 1],
      scale: [0.9, 1],
      transition: { duration: 1.5, ease: "easeOut" }
    });
    
  }, [selectedCubeId, selectedCube, gridControls]);
  
  // Handle mouse movement for ambient lighting and parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      setAmbientLightPosition({ x, y });
      
      // Subtle camera shift based on mouse position
      const cameraShiftX = 20 + ((e.clientX - rect.left) / rect.width - 0.5) * 5;
      const cameraShiftY = ((e.clientY - rect.top) / rect.height - 0.5) * 5;
      
      setCameraAngle({
        x: cameraShiftX,
        y: cameraShiftY
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  // Generate a pattern for the level
  useEffect(() => {
    if (gameState === "intro") {
      setPatternLines([]);
      
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
      setCubeHeight(0);
      setCubeRotation({ x: 0, y: 0, z: 0 });
      setTrailPoints([]);
      
      // Reset all cell elevations to the same level
      const newElevations: {[key: string]: number} = {};
      for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
          newElevations[`${x}-${y}`] = -5;
        }
      }
      setCellElevations(newElevations);
    }
  }, [currentLevel, gameState]);
  
  // Show pattern to player with advanced cube movements
  useEffect(() => {
    if (gameState === "watching") {
      setPlayerPattern([]);
      setHighlightedCell(null);
      
      const showSequence = async () => {
        // First, teleport cube to starting position outside grid
        setCubePosition({ x: -2, y: Math.floor(gridSize/2) });
        setCubeHeight(30);
        setCubeRotation({ x: 45, y: 45, z: 0 });
        
        // Clear any previous pattern lines
        setPatternLines([]);
        
        // Wait for cube to appear
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Show each step in the pattern
        for (let step = 0; step < pattern.length; step++) {
          // Move cube to this position with animation
          setIsMoving(true);
          
          // Generate visual pulse
          setActiveVisualizations(prev => [
            ...prev,
            {
              id: `pulse-${step}`,
              type: 'pulse',
              position: pattern[step],
              duration: 1000
            }
          ]);
          
          // Highlight the cell
          setHighlightedCell(pattern[step]);
          
          // Animate cube movements with rotations
          const prevPosition = cubePosition;
          setCubePosition(pattern[step]);
          setCubeHeight(15 + Math.random() * 10);
          setCubeRotation({
            x: Math.random() * 360,
            y: Math.random() * 360,
            z: Math.random() * 90 - 45
          });
          
          // Create trail between positions if not first step
          if (prevPosition && step > 0) {
            // Add to trail points
            setTrailPoints(prev => [...prev, {
              start: prevPosition,
              end: pattern[step],
              opacity: 0.8
            }]);
            
            // Create animated connection line
            setPatternLines(prev => [
              ...prev,
              {
                x1: getCellPosition(prevPosition.x, prevPosition.y).left,
                y1: getCellPosition(prevPosition.x, prevPosition.y).top,
                x2: getCellPosition(pattern[step].x, pattern[step].y).left,
                y2: getCellPosition(pattern[step].x, pattern[step].y).top,
                progress: 0,
                color: getGradientColor(step, pattern.length)
              }
            ]);
            
            // Animate the progress of the most recent line
            const lineIndex = step - 1;
            const animateLineProgress = async () => {
              for (let progress = 0; progress <= 100; progress += 5) {
                setPatternLines(prev => 
                  prev.map((line, i) => 
                    i === lineIndex ? { ...line, progress: progress } : line
                  )
                );
                await new Promise(r => setTimeout(r, 25));
              }
            };
            
            animateLineProgress();
          }
          
          // Elevate the cell
          setCellElevations(prev => ({
            ...prev,
            [`${pattern[step].x}-${pattern[step].y}`]: 5
          }));
          
          // Wait for animation
          await new Promise(resolve => setTimeout(resolve, 800));
          
          // Reset highlight
          setHighlightedCell(null);
          setIsMoving(false);
          
          // Wait between steps
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        // After showing the entire pattern
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Fade out trails gradually
        setTrailPoints(prev => 
          prev.map(point => ({ ...point, opacity: 0.2 }))
        );
        
        // Clear all pattern lines to hide the pattern
        setPatternLines([]);
        
        // Reset all cell elevations to hide any elevation clues
        const resetElevations: {[key: string]: number} = {};
        for (let x = 0; x < gridSize; x++) {
          for (let y = 0; y < gridSize; y++) {
            resetElevations[`${x}-${y}`] = -5;
          }
        }
        setCellElevations(resetElevations);
        
        // Move cube to starting position for player
        setCubePosition({ x: -2, y: Math.floor(gridSize/2) });
        setCubeHeight(20);
        setCubeRotation({ x: 0, y: 0, z: 0 });
        
        // Switch to player input
        setGameState("repeating");
      };
      
      showSequence();
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
        // Wrong move - show failure effect
        setActiveVisualizations(prev => [
          ...prev,
          {
            id: `failure-${Date.now()}`,
            type: 'failure',
            position: playerPattern[lastIndex],
            duration: 1500
          }
        ]);
        
        // Shake the grid
        gridControls.start({
          x: [0, -5, 5, -5, 5, 0],
          transition: { duration: 0.5 }
        });
        
        // Wrong move
        setGameState("failure");
        return;
      }
      
      // Correct move - show success effect
      setActiveVisualizations(prev => [
        ...prev,
        {
          id: `success-${Date.now()}`,
          type: 'success',
          position: playerPattern[lastIndex],
          duration: 800
        }
      ]);
      
      // Check if pattern is complete
      if (playerPattern.length === pattern.length) {
        // Victory animation
        gridControls.start({
          scale: [1, 1.03, 1],
          transition: { duration: 0.8 }
        });
        
        // Add score
        setScore(prev => prev + (currentLevel * 50));
        
        // Success!
        setGameState("success");
      }
    }
  }, [playerPattern, pattern, gameState, gridControls]);
  
  // Clean up visualizations after they expire
  useEffect(() => {
    if (activeVisualizations.length > 0) {
      const timer = setTimeout(() => {
        setActiveVisualizations(prev => 
          prev.filter(v => Date.now() - parseInt(v.id.split('-')[1]) < v.duration)
        );
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [activeVisualizations]);
  
  // Handle cell click with enhanced cube animations
  const handleCellClick = async (x: number, y: number) => {
    if (gameState !== "repeating" || isMoving) return;
    
    // Create trail effect
    const prevPosition = cubePosition;
    
    // Update player pattern
    const newPlayerPattern = [...playerPattern, { x, y }];
    setPlayerPattern(newPlayerPattern);
    
    // Briefly highlight the cell
    setHighlightedCell({ x, y });
    
    // Move cube to the clicked cell with animation
    setIsMoving(true);
    
    if (prevPosition) {
      // Add to trail
      setTrailPoints(prev => [...prev, {
        start: prevPosition,
        end: { x, y },
        opacity: 0.6
      }]);
      
      // Fade out trails gradually
      setTimeout(() => {
        setTrailPoints(prev => 
          prev.map((p, i) => i === prev.length - 1 ? {...p, opacity: 0.2} : p)
        );
      }, 800);
    }
    
    // Cube movement animation
    setCubePosition({ x, y });
    setCubeHeight(20 + Math.random() * 10);
    
    // Rotate cube based on movement direction
    if (prevPosition) {
      const angleX = prevPosition.x < x ? -20 : prevPosition.x > x ? 20 : 0;
      const angleY = prevPosition.y < y ? 20 : prevPosition.y > y ? -20 : 0;
      
      setCubeRotation({
        x: angleX,
        y: angleY,
        z: Math.random() * 90 - 45
      });
    }
    
    // Elevate the cell
    setCellElevations(prev => ({
      ...prev,
      [`${x}-${y}`]: 5
    }));
    
    // Reset after animation
    setTimeout(() => {
      setHighlightedCell(null);
      setCubeRotation({ x: 0, y: 0, z: 0 });
      setIsMoving(false);
      
      // Return cell to normal height gradually
      setTimeout(() => {
        setCellElevations(prev => ({
          ...prev,
          [`${x}-${y}`]: -3
        }));
      }, 300);
    }, 500);
  };
  
  // Start the game with animation
  const startGame = () => {
    // Raise all cells
    const newElevations: {[key: string]: number} = {};
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        newElevations[`${x}-${y}`] = -2;
      }
    }
    setCellElevations(newElevations);
    
    // Animate grid
    gridControls.start({
      scale: [1, 1.05, 1],
      transition: { duration: 0.8 }
    });
    
    setGameState("watching");
  };
  
  // Next level with animation
  const nextLevel = () => {
    // Victory animation
    gridControls.start({
      scale: [1, 1.1, 1],
      rotateZ: [0, 5, -5, 0],
      transition: { duration: 1.2 }
    });
    
    setCurrentLevel(currentLevel + 1);
    setGameState("intro");
  };
  
  // Retry level with animation
  const retryLevel = () => {
    // Reset animation
    gridControls.start({
      scale: [1, 0.95, 1],
      transition: { duration: 0.8 }
    });
    
    setGameState("intro");
  };

  // Calculate grid cell positions
  const getCellPosition = (x: number, y: number) => {
    const cellSize = 54; // Increased from 48 for more space
    const gapSize = 8;
    const gridOffset = (cellSize + gapSize) * gridSize / 2;
    
    return {
      left: (x * (cellSize + gapSize) - gridOffset + (cellSize / 2)),
      top: (y * (cellSize + gapSize) - gridOffset + (cellSize / 2))
    };
  };

  // Generate dynamic color based on pattern step
  const getGradientColor = (step: number, totalSteps: number) => {
    const colors = [
      cubeColor,
      cubeSecondaryColor,
      cubeTertiaryColor,
      "#8b5cf6"
    ];
    
    const index = Math.min(step % colors.length, colors.length - 1);
    return colors[index];
  };

  // Generate background particles for Echo realm theme
  const renderParticles = () => {
    return Array.from({ length: 60 }).map((_, i) => (
      <motion.div
        key={`particle-${i}`}
        className="absolute rounded-full bg-gradient-to-r from-blue-300 to-purple-400"
        animate={{
          x: [
            Math.random() * window.innerWidth,
            Math.random() * window.innerWidth
          ],
          y: [
            Math.random() * window.innerHeight,
            Math.random() * window.innerHeight
          ],
          opacity: [0.1, 0.3, 0.1]
        }}
        transition={{
          duration: Math.random() * 20 + 10,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{
          width: `${Math.random() * 4 + 1}px`,
          height: `${Math.random() * 4 + 1}px`,
          boxShadow: `0 0 ${Math.random() * 8 + 2}px #8b5cf6`
        }}
      />
    ));
  };
  
  // Render trail connections
  const renderTrails = () => {
    return trailPoints.map((trail, index) => {
      const startPos = getCellPosition(trail.start.x, trail.start.y);
      const endPos = getCellPosition(trail.end.x, trail.end.y);
      
      // Calculate the angle and length for the line
      const dx = endPos.left - startPos.left;
      const dy = endPos.top - startPos.top;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      
      return (
        <motion.div
          key={`trail-${index}`}
          className="absolute top-1/2 left-1/2 origin-left h-0.5 z-10"
          style={{
            width: length,
            background: `linear-gradient(to right, ${cubeColor}50, ${cubeSecondaryColor}50)`,
            transform: `translate(-${length/2}px, 0) rotate(${angle}deg) translateZ(10px)`,
            opacity: trail.opacity,
            boxShadow: `0 0 8px ${cubeColor}`,
          }}
          animate={{ opacity: [trail.opacity, 0] }}
          transition={{ duration: 5, ease: "easeOut" }}
        />
      );
    });
  };
  
  // Render pattern connection lines with animation
  const renderPatternLines = () => {
    return patternLines.map((line, index) => {
      // Calculate the angle and length for the line
      const dx = line.x2 - line.x1;
      const dy = line.y2 - line.y1;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      
      // Calculate progress length
      const progressLength = (line.progress / 100) * length;
      
      return (
        <div
          key={`pattern-line-${index}`}
          className="absolute top-1/2 left-1/2 origin-left h-1 z-10"
          style={{
            width: progressLength,
            background: `linear-gradient(to right, ${line.color}, ${cubeSecondaryColor})`,
            transform: `translate(-${length/2}px, 0) rotate(${angle}deg) translateZ(10px)`,
            opacity: 0.7,
            boxShadow: `0 0 8px ${line.color}`,
          }}
        />
      );
    });
  };
  
  // Render active visualizations (pulses, success/failure effects)
  const renderVisualizations = () => {
    return activeVisualizations.map(viz => {
      const cellPos = getCellPosition(viz.position.x, viz.position.y);
      
      if (viz.type === 'pulse') {
        return (
          <motion.div
            key={viz.id}
            className="absolute rounded-full z-20"
            initial={{ opacity: 0.8, scale: 1 }}
            animate={{ opacity: 0, scale: 3 }}
            transition={{ duration: 1 }}
            style={{
              width: '30px',
              height: '30px',
              left: "50%",
              top: "50%",
              marginLeft: `${cellPos.left}px`,
              marginTop: `${cellPos.top}px`,
              background: `radial-gradient(circle, ${cubeColor}50 0%, ${cubeSecondaryColor}00 70%)`,
              transform: `translate(-50%, -50%) translateZ(20px)`,
            }}
          />
        );
      }
      
      if (viz.type === 'success') {
        return (
          <motion.div
            key={viz.id}
            className="absolute z-20"
            initial={{ opacity: 1, scale: 1 }}
            animate={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 0.8 }}
            style={{
              width: '40px',
              height: '40px',
              left: "50%",
              top: "50%",
              marginLeft: `${cellPos.left}px`,
              marginTop: `${cellPos.top}px`,
              background: `radial-gradient(circle, rgba(74, 222, 128, 0.6) 0%, rgba(74, 222, 128, 0) 70%)`,
              transform: `translate(-50%, -50%) translateZ(20px)`,
              boxShadow: '0 0 15px rgba(74, 222, 128, 0.8)',
            }}
          />
        );
      }
      
      if (viz.type === 'failure') {
        return (
          <motion.div
            key={viz.id}
            className="absolute z-20"
            initial={{ opacity: 1 }}
            animate={{ 
              opacity: [1, 0],
              scale: [1, 1.2, 0.8, 1.2, 0]
            }}
            transition={{ duration: 1, times: [0, 0.2, 0.4, 0.6, 1] }}
            style={{
              width: '40px',
              height: '40px',
              left: "50%",
              top: "50%",
              marginLeft: `${cellPos.left}px`,
              marginTop: `${cellPos.top}px`,
              background: `radial-gradient(circle, rgba(248, 113, 113, 0.6) 0%, rgba(248, 113, 113, 0) 70%)`,
              transform: `translate(-50%, -50%) translateZ(20px)`,
              boxShadow: '0 0 15px rgba(248, 113, 113, 0.8)',
            }}
          />
        );
      }
      
      return null;
    });
  };

  return (
    <div 
      ref={containerRef}
      className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden bg-gradient-to-b from-purple-900/30 via-black to-black"
    >
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {renderParticles()}
      </div>
      
      {/* Gradient background with dynamic lighting */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/30 via-black to-black opacity-70"></div>
        
        {/* Dynamic ambient light that follows mouse */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${ambientLightPosition.x}% ${ambientLightPosition.y}%, rgba(139, 92, 246, 0.15) 0%, transparent 70%)`,
            filter: 'blur(40px)',
          }}
        />
      </div>
      
      {/* Echo atmosphere effect with ripples */}
      <div
        className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
      >
        {/* Central echo pulse */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)',
          }}
        />
        
        {/* Echo ripples */}
        {[1, 2, 3].map((i) => (
          <motion.div
            key={`ripple-${i}`}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-purple-500/10"
            initial={{ scale: 0.1, opacity: 0.5 }}
            animate={{
              scale: [0.1, 3],
              opacity: [0.5, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              delay: i * 2,
              ease: "easeOut"
            }}
            style={{
              width: '100px',
              height: '100px',
            }}
          />
        ))}
      </div>
      
      <div className="relative z-10 flex flex-col items-center w-full max-w-4xl">
        {/* Header with advanced styling */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="text-center mb-6"
        >
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-2 font-pixel tracking-wider">
            ECHO REALM
          </h1>
          
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
            <p className="text-xl text-blue-300 font-light">Memory Resonance</p>
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
            <div className="text-lg text-gray-300">Level</div>
            <div className="text-2xl text-pink-300 font-bold">{currentLevel}</div>
            <div className="h-4 w-px bg-purple-500/30"></div>
            <div className="text-lg text-gray-300">Score</div>
            <motion.div 
              key={score}
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5 }}
              className="text-2xl text-green-300 font-bold"
            >
              {score}
            </motion.div>
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
                Watch the cube trace the pattern, then repeat it by clicking the cells in order.
              </motion.p>
            )}
            {gameState === "watching" && (
              <motion.p 
                key="watching-text"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-lg text-blue-300 flex items-center justify-center gap-2"
              >
                <span>Memorize the pattern</span>
                <span className="flex gap-1">
                  {[1, 2, 3].map(dot => (
                    <motion.span 
                      key={`dot-${dot}`}
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ 
                        duration: 1.5, 
                        repeat: Infinity, 
                        delay: dot * 0.2
                      }}
                    >•</motion.span>
                  ))}
                </span>
              </motion.p>
            )}
            {gameState === "repeating" && (
              <motion.p 
                key="repeating-text"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-lg text-green-300"
              >
                Now guide the cube along the pattern path!
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
                Pattern resonance achieved! Memory synchronized.
              </motion.p>
            )}
            {gameState === "failure" && (
              <motion.p 
                key="failure-text"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-lg text-red-400"
              >
                Pattern desynchronized. Cube connection lost.
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
        
        {/* Enhanced 3D Grid with dynamic lighting and effects */}
        <motion.div 
          className="relative w-full h-96 flex items-center justify-center mb-8 transform-gpu"
          style={{ perspective: "1000px" }}
          animate={gridControls}
        >
          {/* 3D Grid Container with dynamic camera angle */}
          <motion.div 
            ref={gridRef}
            className="relative transform"
            style={{ 
              width: `${gridSize * (54 + 8)}px`, 
              height: `${gridSize * (54 + 8)}px`,
              transformStyle: "preserve-3d",
              rotateX: `${cameraAngle.x}deg`,
              rotateY: `${cameraAngle.y}deg`,
              transition: "transform 0.5s ease-out",
            }}
          >
            {/* Grid cells with enhanced 3D effects */}
            {Array.from({ length: gridSize * gridSize }).map((_, index) => {
              const x = index % gridSize;
              const y = Math.floor(index / gridSize);
              
              const isHighlighted = highlightedCell && 
                                  highlightedCell.x === x && 
                                  highlightedCell.y === y;
              
              const cellPosition = getCellPosition(x, y);
              const elevation = cellElevations[`${x}-${y}`] || -5;
              
              // Dynamic color based on position and state
              const cellColor = isHighlighted 
                ? `linear-gradient(135deg, ${cubeColor}, ${selectedCube.colors[1] || '#a78bfa'})`
                : 'linear-gradient(135deg, rgba(30, 30, 60, 0.4), rgba(20, 20, 40, 0.2))';
              
              return (
                <motion.div
                  key={`cell-${x}-${y}`}
                  className="absolute cursor-pointer backdrop-blur-sm"
                  style={{
                    width: '54px',
                    height: '54px',
                    left: "50%",
                    top: "50%",
                    marginLeft: `${cellPosition.left}px`,
                    marginTop: `${cellPosition.top}px`,
                    background: cellColor,
                    border: `1px solid ${isHighlighted 
                      ? selectedCube.borderColor || 'rgba(139, 92, 246, 0.8)'
                      : 'rgba(30, 30, 50, 0.3)'}`,
                    boxShadow: isHighlighted 
                      ? `0 0 20px 3px ${cubeColor}` 
                      : `0 0 10px rgba(20, 20, 40, 0.5)`,
                    transform: `translate(-50%, -50%) translateZ(${elevation}px)`,
                    transformStyle: "preserve-3d",
                    transition: "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), border 0.3s, box-shadow 0.3s",
                  }}
                  whileHover={{
                    z: elevation + 5,
                    boxShadow: isHighlighted 
                      ? `0 0 25px 5px ${cubeColor}`
                      : `0 0 15px rgba(139, 92, 246, 0.3)`,
                    transition: { duration: 0.2 }
                  }}
                  onClick={() => handleCellClick(x, y)}
                >
                  {/* Inner glow effect on hover */}
                  <div className="absolute inset-0 opacity-0 hover:opacity-50 transition-opacity duration-300 pointer-events-none bg-gradient-to-br from-white/10 to-transparent"></div>
                </motion.div>
              );
            })}
            
            {/* Connection lines for showing pattern */}
            {renderPatternLines()}
            
            {/* Trailing effect lines */}
            {renderTrails()}
            
            {/* Visual effect animations */}
            {renderVisualizations()}
            
            {/* Enhanced Moving RealmCube with 3D effects */}
            <AnimatePresence>
              {(gameState === "repeating" || gameState === "watching") && (
                <motion.div
                  className="absolute transition-all duration-500 ease-out"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0, transition: { duration: 0.3 } }}
                  style={{ 
                    left: "50%",
                    top: "50%",
                    marginLeft: cubePosition === null ? "-170px" : `${getCellPosition(cubePosition.x, cubePosition.y).left}px`,
                    marginTop: cubePosition === null ? "0" : `${getCellPosition(cubePosition.x, cubePosition.y).top}px`,
                    transform: `translate(-50%, -50%) translateZ(${30 + cubeHeight}px) rotateX(${cubeRotation.x}deg) rotateY(${cubeRotation.y}deg) rotateZ(${cubeRotation.z}deg) scale(0.6)`,
                    transformStyle: "preserve-3d",
                    zIndex: 30,
                    transition: "transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), margin 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)"
                  }}
                >
                  {/* Cube glow effect */}
                  <div className="absolute inset-0 -m-6 rounded-full blur-lg" 
                    style={{ 
                      background: `radial-gradient(circle, ${cubeColor}40 0%, transparent 70%)`,
                      transform: "translateZ(-10px)"
                    }}
                  />
                  
                  {/* The cube component */}
                  <RealmCube 
                    position="center" 
                    size={95} 
                    cubeId={selectedCubeId}
                    onCubeClick={() => {}} // Prevent cube library from opening
                  />
                  
                  {/* Energy particles around the cube */}
                  <div className="absolute inset-0 -m-4 pointer-events-none">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <motion.div
                        key={`cube-particle-${i}`}
                        className="absolute w-1 h-1 rounded-full bg-white"
                        animate={{
                          x: [0, Math.sin(i * Math.PI / 4) * 30],
                          y: [0, Math.cos(i * Math.PI / 4) * 30],
                          opacity: [0, 0.8, 0],
                          scale: [0, 1.5, 0]
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: i * 0.1,
                          ease: "easeOut"
                        }}
                        style={{
                          left: "50%",
                          top: "50%",
                          boxShadow: `0 0 5px ${cubeColor}`
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
        
        {/* Game progress indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mb-4 flex items-center gap-2"
        >
          {pattern.map((_, index) => (
            <div 
              key={`progress-${index}`} 
              className="w-2 h-2 rounded-full transition-all duration-300"
              style={{
                backgroundColor: index < playerPattern.length 
                  ? cubeColor 
                  : 'rgba(139, 92, 246, 0.3)',
                transform: index < playerPattern.length 
                  ? 'scale(1.3)' 
                  : 'scale(1)',
                boxShadow: index < playerPattern.length 
                  ? `0 0 5px ${cubeColor}` 
                  : 'none'
              }}
            />
          ))}
        </motion.div>
        
        {/* Enhanced Controls with hover effects */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-6 flex gap-4 justify-center"
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
                <span className="relative text-white font-pixel text-lg tracking-wider">Start Pattern</span>
              </motion.button>
            )}
            
            {gameState === "success" && (
              <motion.button 
                key="next-button"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={nextLevel}
                className="px-8 py-3 relative group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-teal-600 group-hover:from-green-500 group-hover:to-teal-500 rounded-md transition-all duration-300"></div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-50 transition-opacity duration-300 bg-[radial-gradient(closest-side_at_50%_50%,white,transparent)]"></div>
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                <span className="relative text-white font-pixel text-lg tracking-wider">Next Level</span>
              </motion.button>
            )}
            
            {gameState === "failure" && (
              <motion.button 
                key="retry-button"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={retryLevel}
                className="px-8 py-3 relative group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-pink-600 group-hover:from-red-500 group-hover:to-pink-500 rounded-md transition-all duration-300"></div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-50 transition-opacity duration-300 bg-[radial-gradient(closest-side_at_50%_50%,white,transparent)]"></div>
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                <span className="relative text-white font-pixel text-lg tracking-wider">Try Again</span>
              </motion.button>
            )}
          </AnimatePresence>
          
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
      </div>
      
      {/* Global styles for 3D transformations */}
      <style jsx global>{`
        .rotate-x-20 {
          transform: rotateX(20deg);
        }
        .font-pixel {
          font-family: 'Press Start 2P', monospace;
          letter-spacing: 0.05em;
        }
      `}</style>
    </div>
  );
};

export default EchoRealm;