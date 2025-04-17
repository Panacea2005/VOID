import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useAnimationControls } from "framer-motion";
import RealmCube from "../../cube/realm-cube";
import { cubeCollection } from "../../cube/realm-cube";

// Enhanced Abyss Realm: Void Snake Game with modern UI and improved 3D effects
interface AbyssRealmProps {
  onReturn: () => void;
  selectedCubeId?: string;
}

// Snake segment
interface SnakeSegment {
  x: number;
  y: number;
}

// Food position
interface FoodPosition {
  x: number;
  y: number;
}

// Portal position
interface PortalPosition {
  x: number;
  y: number;
}

// Direction type
type Direction = "up" | "down" | "left" | "right";

// Game states
type GameState = "intro" | "playing" | "paused" | "gameOver" | "levelComplete";

const AbyssRealm: React.FC<AbyssRealmProps> = ({
  onReturn,
  selectedCubeId = "pink-neon",
}) => {
  // Game state
  const [gameState, setGameState] = useState<GameState>("intro");
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [snake, setSnake] = useState<SnakeSegment[]>([]);
  const [direction, setDirection] = useState<Direction>("right");
  const [nextDirection, setNextDirection] = useState<Direction>("right");
  const [food, setFood] = useState<FoodPosition | null>(null);
  const [portal, setPortal] = useState<PortalPosition | null>(null);
  const [portalVisible, setPortalVisible] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const [cameraAngle, setCameraAngle] = useState({ x: 15, y: 0 });
  const [ambientLightPosition, setAmbientLightPosition] = useState({ x: 50, y: 50 });
  const [foodPulse, setFoodPulse] = useState(false);
  const [portalPulse, setPortalPulse] = useState(false);
  const [trailEffects, setTrailEffects] = useState<{x: number, y: number, opacity: number}[]>([]);

  // Animation controls
  const gridControls = useAnimationControls();
  const snakeHeadControls = useAnimationControls();

  // Game refs
  const gameLoopRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Constants
  const GRID_SIZE = 20; // Grid cells (20x20)
  const CELL_SIZE = 30; // Cell size in pixels
  const GRID_WIDTH = GRID_SIZE * CELL_SIZE;
  const GRID_HEIGHT = GRID_SIZE * CELL_SIZE;

  // Game speeds per level (milliseconds between moves)
  const speeds = [180, 160, 140, 120, 100, 80];
  const requiredLengthForPortal = 10;

  // Get selected cube info
  const selectedCube =
    cubeCollection.find((cube) => cube.id === selectedCubeId) ||
    cubeCollection[0];

  // Get cube colors
  const getCubeColor = () => {
    switch (selectedCubeId) {
      case "blue-electric":
        return "#3b82f6"; // blue-500
      case "green-matrix":
        return "#10b981"; // green-500
      default:
        return "#ec4899"; // pink-500 (default)
    }
  };

  const cubeColor = getCubeColor();
  const cubeGlow = selectedCube.glow || "rgba(236, 72, 153, 0.6)";
  const cubeSecondaryColor = selectedCube.colors[1] || "#8B5CF6"; 

  // Handle mouse movement for ambient lighting and parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      setAmbientLightPosition({ x, y });
      
      // Subtle camera shift based on mouse position
      const cameraShiftX = 15 + ((e.clientX - rect.left) / rect.width - 0.5) * 5;
      const cameraShiftY = ((e.clientY - rect.top) / rect.height - 0.5) * 5;
      
      setCameraAngle({
        x: cameraShiftX,
        y: cameraShiftY
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Initialize the game
  useEffect(() => {
    if (gameState === "intro") {
      initializeGame();
    }
  }, [gameState, level]);

  // Setup game
  const initializeGame = () => {
    // Create initial snake (3 segments, positioned in the middle)
    const centerX = Math.floor(GRID_SIZE / 2);
    const centerY = Math.floor(GRID_SIZE / 2);

    const initialSnake: SnakeSegment[] = [
      { x: centerX, y: centerY },
      { x: centerX - 1, y: centerY },
      { x: centerX - 2, y: centerY },
    ];

    setSnake(initialSnake);
    setDirection("right");
    setNextDirection("right");
    setPortal(null);
    setPortalVisible(false);
    setTrailEffects([]);
    generateFood(initialSnake);

    // Animate grid entering
    gridControls.start({
      opacity: [0, 1],
      scale: [0.9, 1],
      transition: { duration: 1.2, ease: "easeOut" }
    });
  };

  // Generate food in an empty cell
  const generateFood = (currentSnake: SnakeSegment[]) => {
    // Find empty cells
    const emptyCells: { x: number; y: number }[] = [];

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        // Check if this cell is occupied by snake
        if (
          !currentSnake.some((segment) => segment.x === x && segment.y === y)
        ) {
          emptyCells.push({ x, y });
        }
      }
    }

    if (emptyCells.length > 0) {
      // Pick a random empty cell
      const randomIndex = Math.floor(Math.random() * emptyCells.length);
      setFood(emptyCells[randomIndex]);
      
      // Animate food appearing
      setFoodPulse(true);
      setTimeout(() => setFoodPulse(false), 1000);
    }
  };

  // Generate portal to next level
  const generatePortal = () => {
    // Find empty cells
    const emptyCells: { x: number; y: number }[] = [];

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        // Check if this cell is occupied by snake or food
        if (
          !snake.some((segment) => segment.x === x && segment.y === y) &&
          !(food && food.x === x && food.y === y)
        ) {
          emptyCells.push({ x, y });
        }
      }
    }

    if (emptyCells.length > 0) {
      // Pick a random empty cell
      const randomIndex = Math.floor(Math.random() * emptyCells.length);
      setPortal(emptyCells[randomIndex]);
      setPortalVisible(true);
      setPortalPulse(true);
      setTimeout(() => setPortalPulse(false), 1500);

      // Play portal sound
      playSound("portal");
    }
  };

  // Track trail effects
  useEffect(() => {
    if (trailEffects.length > 0) {
      const timer = setTimeout(() => {
        setTrailEffects(prev => 
          prev.filter(effect => effect.opacity > 0.05)
             .map(effect => ({
                ...effect,
                opacity: effect.opacity * 0.92
             }))
        );
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [trailEffects]);

  // Game loop
  useEffect(() => {
    if (gameState !== "playing") {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      return;
    }

    // Set up the animation frame-based game loop
    const gameLoop = (timestamp: number) => {
      if (!lastUpdateTimeRef.current) {
        lastUpdateTimeRef.current = timestamp;
      }

      const gameSpeed = speeds[Math.min(level - 1, speeds.length - 1)];
      const elapsed = timestamp - lastUpdateTimeRef.current;

      if (elapsed > gameSpeed) {
        lastUpdateTimeRef.current = timestamp;
        updateGame();
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [
    gameState,
    snake,
    direction,
    nextDirection,
    food,
    portal,
    portalVisible,
    level,
  ]);

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") return;

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          if (direction !== "down") {
            setNextDirection("up");
          }
          break;
        case "ArrowDown":
        case "s":
        case "S":
          if (direction !== "up") {
            setNextDirection("down");
          }
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          if (direction !== "right") {
            setNextDirection("left");
          }
          break;
        case "ArrowRight":
        case "d":
        case "D":
          if (direction !== "left") {
            setNextDirection("right");
          }
          break;
        case " ":
          emitPulse();
          break;
        case "Escape":
          setGameState((prev) => (prev === "playing" ? "paused" : "playing"));
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [gameState, direction]);

  // Update game state
  const updateGame = () => {
    // Update direction
    setDirection(nextDirection);

    // Create new snake array
    const newSnake = [...snake];
    const head = { ...newSnake[0] };
    const prevHead = { ...head };

    // Move head based on direction
    switch (nextDirection) {
      case "up":
        head.y = (head.y - 1 + GRID_SIZE) % GRID_SIZE;
        break;
      case "down":
        head.y = (head.y + 1) % GRID_SIZE;
        break;
      case "left":
        head.x = (head.x - 1 + GRID_SIZE) % GRID_SIZE;
        break;
      case "right":
        head.x = (head.x + 1) % GRID_SIZE;
        break;
    }

    // Check if snake hit itself
    if (
      newSnake.some((segment) => segment.x === head.x && segment.y === head.y)
    ) {
      setGameState("gameOver");
      playSound("gameover");
      
      // Shake the grid
      gridControls.start({
        x: [0, -5, 5, -5, 5, 0],
        transition: { duration: 0.5 }
      });
      
      return;
    }

    // Add new head
    newSnake.unshift(head);

    // Add trail effect at the old tail position when moving
    if (newSnake.length > 3) {
      const tailPos = newSnake[newSnake.length - 1];
      setTrailEffects(prev => [...prev, {
        x: tailPos.x,
        y: tailPos.y,
        opacity: 0.7
      }]);
    }

    // Check if snake found food
    let foundFood = false;
    if (food && head.x === food.x && head.y === food.y) {
      foundFood = true;
      setScore((prev) => prev + 10);
      setFood(null);
      playSound("food");

      // Animate snake head when eating
      snakeHeadControls.start({
        scale: [1, 1.2, 1],
        transition: { duration: 0.3 }
      });

      // Generate new food
      generateFood(newSnake);

      // Check if snake is long enough to reveal portal
      if (newSnake.length >= requiredLengthForPortal && !portalVisible) {
        generatePortal();
      }
    } else {
      // Remove tail if no food was eaten
      newSnake.pop();
    }

    // Check if snake found portal
    if (portal && portalVisible && head.x === portal.x && head.y === portal.y) {
      setGameState("levelComplete");
      playSound("success");
      
      // Victory animation
      gridControls.start({
        scale: [1, 1.05, 1],
        transition: { duration: 0.8 }
      });
      
      return;
    }

    // Update snake
    setSnake(newSnake);
  };

  // Emit pulse for visibility
  const emitPulse = () => {
    if (isPulsing) return;

    setIsPulsing(true);
    playSound("pulse");

    // Animate grid on pulse
    gridControls.start({
      scale: [1, 1.02, 1],
      transition: { duration: 0.5 }
    });

    // Create energy waves radiating from center
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        setTrailEffects(prev => [...prev, 
          ...Array.from({ length: 8 }).map((_, j) => {
            const angle = (j / 8) * Math.PI * 2;
            const distance = 5 + i * 2;
            return {
              x: Math.floor(GRID_SIZE / 2) + Math.cos(angle) * distance,
              y: Math.floor(GRID_SIZE / 2) + Math.sin(angle) * distance,
              opacity: 0.8 - (i * 0.1)
            };
          })
        ]);
      }, i * 100);
    }

    setTimeout(() => {
      setIsPulsing(false);
    }, 1000);
  };

  // Play sound
  const playSound = (type: string) => {
    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      switch (type) {
        case "food":
          oscillator.type = "sine";
          oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(
            440,
            audioContext.currentTime + 0.2
          );
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioContext.currentTime + 0.3
          );
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.3);
          break;

        case "pulse":
          oscillator.type = "sine";
          oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(
            880,
            audioContext.currentTime + 0.3
          );
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioContext.currentTime + 0.4
          );
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.4);
          break;

        case "portal":
          oscillator.type = "sine";
          oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(
            880,
            audioContext.currentTime + 0.1
          );
          oscillator.frequency.setValueAtTime(
            1320,
            audioContext.currentTime + 0.2
          );
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioContext.currentTime + 0.5
          );
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.5);
          break;

        case "success":
          oscillator.type = "sine";
          oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(
            554,
            audioContext.currentTime + 0.2
          );
          oscillator.frequency.setValueAtTime(
            659,
            audioContext.currentTime + 0.4
          );
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioContext.currentTime + 0.6
          );
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.6);
          break;

        case "gameover":
          oscillator.type = "sawtooth";
          oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(
            110,
            audioContext.currentTime + 0.5
          );
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioContext.currentTime + 0.6
          );
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.6);
          break;
      }
    } catch (e) {
      console.error("Audio not supported", e);
    }
  };

  // Game actions
  const startGame = () => {
    setGameState("playing");
    
    // Animate the grid on game start
    gridControls.start({
      scale: [1, 1.05, 1],
      transition: { duration: 0.8 }
    });

    // Play start sound
    playSound("success");
  };

  const nextLevel = () => {
    setLevel((prev) => prev + 1);
    setGameState("intro");
    
    // Animate transition to next level
    gridControls.start({
      scale: [1, 1.1, 1],
      rotateZ: [0, 5, -5, 0],
      transition: { duration: 1.2 }
    });
  };

  const restartGame = () => {
    setLevel(1);
    setScore(0);
    setGameState("intro");
    
    // Reset animation
    gridControls.start({
      scale: [1, 0.95, 1],
      transition: { duration: 0.8 }
    });
  };

  const resumeGame = () => {
    setGameState("playing");
  };

  // Generate background particles for Abyss realm theme
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

  // Render trail effects
  const renderTrailEffects = () => {
    return trailEffects.map((effect, index) => (
      <div
        key={`trail-${index}`}
        className="absolute rounded-full pointer-events-none"
        style={{
          width: `${CELL_SIZE/2}px`,
          height: `${CELL_SIZE/2}px`,
          left: effect.x * CELL_SIZE + CELL_SIZE/4,
          top: effect.y * CELL_SIZE + CELL_SIZE/4,
          background: `radial-gradient(circle, ${cubeColor}${Math.floor(effect.opacity * 255).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
          opacity: effect.opacity,
          zIndex: 5
        }}
      />
    ));
  };

  // Render a enhanced 3D cube for snake body
  const renderSnakeCube = (isHead: boolean, rotation: number = 0, index: number) => {
    // Shadow color based on the main color
    const shadowColor = `${cubeColor}99`;
    const isNeck = index === 1; // The segment right after the head
    
    // Calculate animation properties based on segment position
    const hoverOffset = Math.sin(Date.now() * 0.003 + index * 0.5) * 3;
    const scaleVariation = isHead ? 1 : 0.9 - (index * 0.01);

    return (
      <div
        className={`w-full h-full relative transition-transform duration-200`}
        style={{ 
          transform: isHead 
            ? `rotate(${rotation}deg)` 
            : `translateZ(${5 + hoverOffset}px) scale(${scaleVariation})`,
        }}
      >
        {isHead ? (
          <motion.div
            animate={snakeHeadControls}
            className="w-full h-full"
          >
            {/* Use actual RealmCube component for head with advanced styling */}
            <RealmCube
              position="center"
              size={CELL_SIZE}
              cubeId={selectedCubeId}
              isAnimated={isPulsing}
              onCubeClick={() => {}}
            />
            
            {/* Head glow effect */}
            <div 
              className="absolute inset-0 rounded-sm" 
              style={{
                boxShadow: `0 0 10px ${cubeGlow}`,
                opacity: 0.8,
                transform: "scale(1.1)",
              }}
            />
            
            {/* Snake eyes for head */}
            <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-white"></div>
            <div className="absolute top-1/4 right-1/4 w-2 h-2 rounded-full bg-white"></div>
          </motion.div>
        ) : (
          // Enhanced 3D cube for body segments with better depth and shading
          <div className="w-full h-full relative transform-gpu">
            {/* Main body element with 3D transforms */}
            <div 
              className="absolute inset-0 rounded-sm transition-all duration-300"
              style={{
                background: `linear-gradient(135deg, ${cubeColor}, ${cubeSecondaryColor})`,
                boxShadow: `0 0 ${isNeck ? 8 : 5}px ${shadowColor}`,
                transform: `perspective(200px) rotateX(${hoverOffset}deg) rotateY(${hoverOffset * 0.5}deg)`
              }}
            >
              {/* Top face - lighter */}
              <div
                className="absolute top-0 left-0 right-0 h-1/4 rounded-t-sm"
                style={{
                  background: `linear-gradient(to bottom, ${cubeColor}, transparent)`,
                  opacity: 0.8,
                }}
              />

              {/* Right side - darker */}
              <div
                className="absolute top-0 right-0 bottom-0 w-1/4 rounded-r-sm"
                style={{
                  background: `linear-gradient(to left, ${cubeSecondaryColor}, transparent)`,
                  opacity: 0.7,
                }}
              />

              {/* Bottom side - darker */}
              <div
                className="absolute bottom-0 left-0 right-0 h-1/4 rounded-b-sm"
                style={{
                  background: `linear-gradient(to top, rgba(0,0,0,0.3), transparent)`,
                  opacity: 0.7,
                }}
              />
              
              {/* Left side - medium */}
              <div
                className="absolute top-0 left-0 bottom-0 w-1/4 rounded-l-sm"
                style={{
                  background: `linear-gradient(to right, rgba(0,0,0,0.2), transparent)`,
                  opacity: 0.6,
                }}
              />
              
              {/* Highlight effect */}
              <div
                className="absolute top-0 left-0 w-full h-full rounded-sm overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%)",
                  opacity: 0.5,
                }}
              />
            </div>
            
            {/* Connection point to next segment (subtle) */}
            {!isNeck && (
              <div 
                className="absolute inset-0 rounded-sm opacity-70"
                style={{
                  boxShadow: `0 0 5px ${cubeColor}`,
                  transform: "scale(0.85)",
                }}
              />
            )}
          </div>
        )}
      </div>
    );
  };

  // Render game grid
  const renderGameGrid = () => {
    return (
      <motion.div
        ref={gameAreaRef}
        className="relative rounded-lg overflow-hidden shadow-2xl backdrop-blur-sm border border-purple-500/30"
        style={{
          width: GRID_WIDTH,
          height: GRID_HEIGHT,
          transformStyle: "preserve-3d",
          perspective: "1000px",
          transform: `perspective(1200px) rotateX(${cameraAngle.x}deg) rotateY(${cameraAngle.y}deg)`,
          background: "rgba(7, 11, 23, 0.7)",
          boxShadow: "0 10px 40px rgba(0,0,0,0.7), inset 0 0 30px rgba(139, 92, 246, 0.1)",
          transition: "transform 0.5s ease-out",
        }}
        animate={gridControls}
      >
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 z-1 opacity-30 pointer-events-none">
          {/* Horizontal lines */}
          {Array.from({ length: 21 }).map((_, i) => (
            <div
              key={`h-line-${i}`}
              className="absolute left-0 w-full h-px bg-purple-500/30"
              style={{ top: `${i * CELL_SIZE}px` }}
            />
          ))}
          
          {/* Vertical lines */}
          {Array.from({ length: 21 }).map((_, i) => (
            <div
              key={`v-line-${i}`}
              className="absolute top-0 h-full w-px bg-purple-500/30"
              style={{ left: `${i * CELL_SIZE}px` }}
            />
          ))}
        </div>
        
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/10 to-purple-900/20 pointer-events-none"></div>
        
        {/* Dynamic ambient light that follows mouse */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${ambientLightPosition.x}% ${ambientLightPosition.y}%, ${cubeColor}20 0%, transparent 70%)`,
            filter: 'blur(40px)',
          }}
        />

        {/* Trail effects */}
        {renderTrailEffects()}

        {/* Food - Enhanced with animation and glow */}
        {food && (
          <motion.div
            className="absolute rounded-full flex items-center justify-center z-10"
            style={{
              left: food.x * CELL_SIZE,
              top: food.y * CELL_SIZE,
              width: CELL_SIZE,
              height: CELL_SIZE,
            }}
            animate={foodPulse ? {
              scale: [1, 1.2, 1],
              opacity: [0, 1, 1],
            } : {
              y: [0, -2, 0],
              rotateZ: [0, 5, 0, -5, 0],
            }}
            transition={foodPulse ? {
              duration: 0.5,
            } : {
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <div
              className="w-2/3 h-2/3 rounded-full relative"
              style={{
                background: `radial-gradient(circle, #a855f7 0%, #8b5cf6 70%)`,
                boxShadow: "0 0 15px rgba(168, 85, 247, 0.8), inset 0 0 8px rgba(255, 255, 255, 0.6)",
              }}
            >
              {/* Inner glow */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/50 to-transparent" style={{ transform: "scale(0.7)" }}></div>
              
              {/* Orbiting particles */}
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={`food-particle-${i}`}
                  className="absolute w-1.5 h-1.5 rounded-full bg-white"
                  animate={{
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear",
                    delay: i * 0.3,
                  }}
                  style={{
                    left: "50%",
                    top: "50%",
                    transform: `translate(-50%, -50%) rotate(${i * 120}deg) translateX(${CELL_SIZE/3}px)`,
                    boxShadow: "0 0 5px rgba(255, 255, 255, 0.8)",
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Portal - Enhanced with animation and effects */}
        {portal && portalVisible && (
          <motion.div
            className="absolute z-10"
            style={{
              left: portal.x * CELL_SIZE,
              top: portal.y * CELL_SIZE,
              width: CELL_SIZE,
              height: CELL_SIZE,
            }}
            animate={portalPulse ? {
              scale: [0, 1.2, 1],
              opacity: [0, 1, 1],
            } : {
              scale: [1, 1.05, 1],
              rotateZ: [0, 360],
            }}
            transition={portalPulse ? {
              duration: 0.8,
            } : {
              duration: 8,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <div className="w-full h-full flex items-center justify-center">
              <div
                className="w-4/5 h-4/5 rounded-full relative overflow-hidden"
                style={{
                  background: `conic-gradient(from 0deg, #047857, #0d9488, #0891b2, #0d9488, #047857)`,
                  boxShadow: `0 0 20px rgba(16, 185, 129, 0.8)`,
                  border: "2px solid rgba(16, 185, 129, 0.8)",
                }}
              >
                {/* Inner swirl effect */}
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background: `radial-gradient(circle at center, transparent 30%, #0d9488 100%)`,
                    mixBlendMode: "overlay",
                  }}
                  animate={{
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
                
                {/* Vortex center */}
                <div
                  className="absolute left-1/2 top-1/2 w-1/3 h-1/3 rounded-full"
                  style={{
                    background: "white",
                    transform: "translate(-50%, -50%)",
                    boxShadow: "0 0 10px white",
                  }}
                />
                
                {/* Orbiting energy dots */}
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={`portal-particle-${i}`}
                    className="absolute w-1 h-1 rounded-full bg-white"
                    animate={{
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                      delay: i * 0.5,
                    }}
                    style={{
                      left: "50%",
                      top: "50%",
                      transform: `translate(-50%, -50%) rotate(${i * 90}deg) translateX(${CELL_SIZE/3}px)`,
                      boxShadow: "0 0 5px rgba(255, 255, 255, 0.8)",
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Snake - Enhanced with more 3D styling and smoother transitions */}
        {snake.map((segment, index) => {
          // Calculate position
          const x = segment.x * CELL_SIZE;
          const y = segment.y * CELL_SIZE;

          // Is this the head?
          const isHead = index === 0;

          // Determine rotation for the head
          let rotation = 0;
          if (isHead) {
            switch (direction) {
              case "up":
                rotation = 0;
                break;
              case "right":
                rotation = 90;
                break;
              case "down":
                rotation = 180;
                break;
              case "left":
                rotation = -90;
                break;
            }
          }

          // Z-index higher for head and decreases for body
          const zIndex = 20 + (snake.length - index);

          return (
            <motion.div
              key={`snake-${index}`}
              className="absolute"
              style={{
                left: x,
                top: y,
                width: CELL_SIZE,
                height: CELL_SIZE,
                zIndex,
                transformStyle: "preserve-3d",
              }}
              initial={index === 0 && gameState === "intro" ? { scale: 0 } : { scale: 1 }}
              animate={index === 0 && gameState === "intro" ? { scale: 1 } : {}}
              transition={{ delay: gameState === "intro" ? 0.5 : 0 }}
            >
              {renderSnakeCube(isHead, rotation, index)}
            </motion.div>
          );
        })}

        {/* Enhanced Pulse effect with radial waves */}
        {isPulsing && (
          <>
            {/* Main pulse wave */}
            <motion.div
              className="absolute inset-0 z-30 pointer-events-none"
              initial={{ opacity: 0.3, scale: 1 }}
              animate={{ opacity: 0, scale: 1.5 }}
              transition={{ duration: 1 }}
              style={{
                background: `radial-gradient(circle, ${cubeColor}50 0%, transparent 70%)`,
              }}
            />
            
            {/* Secondary pulse waves */}
            {[1, 2, 3].map((i) => (
              <motion.div
                key={`pulse-wave-${i}`}
                className="absolute inset-0 rounded-full z-30 pointer-events-none"
                initial={{ opacity: 0.5, scale: 0.8 }}
                animate={{ opacity: 0, scale: 2 }}
                transition={{ 
                  duration: 1.5, 
                  delay: i * 0.2, 
                  ease: "easeOut"
                }}
                style={{
                  background: `radial-gradient(circle, ${cubeColor}30 0%, transparent 70%)`,
                  left: "50%",
                  top: "50%",
                  width: "100px",
                  height: "100px",
                  transform: "translate(-50%, -50%)",
                }}
              />
            ))}
          </>
        )}
      </motion.div>
    );
  };

  // Render modern intro screen
  const renderIntroScreen = () => (
    <div className="flex flex-col items-center justify-center h-full text-center">
      {/* Modern, gradient title */}
      <motion.div 
        className="text-gradient-animation mb-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-2">
          LEVEL {level}
        </div>
        <div className="h-1 w-24 mx-auto bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
      </motion.div>

      {/* Game description */}
      <motion.p 
        className="text-gray-300 max-w-md mb-10 text-xl leading-relaxed"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.3 }}
      >
        Navigate the void, collect light fragments, and find the portal to ascend to the next layer of the abyss.
      </motion.p>

      {/* Modern control panel */}
      <motion.div 
        className="grid grid-cols-2 gap-6 mb-12 max-w-md w-full mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        <div className="bg-purple-900/30 backdrop-blur rounded-xl p-5 border border-purple-500/20 transform hover:scale-105 transition-transform duration-300">
          <div className="text-purple-300 font-bold mb-3 text-left font-pixel">
            Movement
          </div>
          <div className="flex gap-2 text-gray-300 text-left">
            <div className="bg-black/40 p-1.5 rounded border border-purple-500/20 text-sm">Arrow Keys</div>
            <div className="bg-black/40 p-1.5 rounded border border-purple-500/20 text-sm">WASD</div>
          </div>
        </div>

        <div className="bg-blue-900/30 backdrop-blur rounded-xl p-5 border border-blue-500/20 transform hover:scale-105 transition-transform duration-300">
          <div className="text-blue-300 font-bold mb-3 text-left font-pixel">
            Light Pulse
          </div>
          <div className="bg-black/40 p-1.5 rounded border border-blue-500/20 text-gray-300 text-left inline-block text-sm">
            Spacebar
          </div>
          <div className="text-gray-400 text-xs mt-2">Reveals hidden paths</div>
        </div>

        <div className="bg-pink-900/30 backdrop-blur rounded-xl p-5 border border-pink-500/20 transform hover:scale-105 transition-transform duration-300">
          <div className="text-pink-300 font-bold mb-3 text-left font-pixel">
            Pause Game
          </div>
          <div className="bg-black/40 p-1.5 rounded border border-pink-500/20 text-gray-300 text-left inline-block text-sm">
            ESC Key
          </div>
        </div>

        <div className="bg-indigo-900/30 backdrop-blur rounded-xl p-5 border border-indigo-500/20 transform hover:scale-105 transition-transform duration-300">
          <div className="text-indigo-300 font-bold mb-3 text-left font-pixel">
            Selected Cube
          </div>
          <div className="flex justify-center items-center h-12">
            <div className="w-12 h-12 transform hover:scale-110 transition-transform">
              <RealmCube
                position="center"
                size={48}
                cubeId={selectedCubeId}
                isAnimated={true}
                onCubeClick={() => {}}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Start button with glow effect */}
      <motion.div 
        className="flex gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.7 }}
      >
        <button
          onClick={startGame}
          className="px-10 py-4 text-xl relative group overflow-hidden rounded-md"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:from-blue-500 group-hover:to-purple-500 rounded-md transition-all duration-300"></div>
          <div className="absolute inset-0 opacity-0 group-hover:opacity-50 transition-opacity duration-300 bg-[radial-gradient(closest-side_at_50%_50%,white,transparent)]"></div>
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
          <span className="relative text-white font-pixel text-lg tracking-wider">Enter the Void</span>
        </button>

        {/* Return to Hub button, matching Echo realm style */}
        <button
          onClick={onReturn}
          className="px-6 py-4 bg-black border border-purple-500/50 hover:bg-purple-900/20 text-white rounded-md flex items-center gap-2 font-pixel transition-transform hover:scale-105 active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"/>
            <path d="M12 19l-7-7 7-7"/>
          </svg>
          Return to Hub
        </button>
      </motion.div>
    </div>
  );

  // Render pause screen
  const renderPauseScreen = () => (
    <motion.div 
      className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50 backdrop-blur"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.h2 
        className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-blue-500 mb-8"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        Game Paused
      </motion.h2>

      <motion.div 
        className="flex flex-col gap-4 w-64"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <button
          onClick={resumeGame}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-bold hover:opacity-90 transition-all hover:shadow-lg hover:shadow-blue-500/20"
        >
          Resume
        </button>

        <button
          onClick={restartGame}
          className="px-6 py-3 bg-gradient-to-r from-purple-800 to-purple-600 text-white rounded-lg font-bold hover:opacity-90 transition-all hover:shadow-lg hover:shadow-purple-500/20"
        >
          Restart
        </button>
      </motion.div>
    </motion.div>
  );

  // Render game over screen
  const renderGameOverScreen = () => (
    <motion.div 
      className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50 backdrop-blur"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="text-center"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-purple-500 mb-2">
          Game Over
        </h2>
        
        {/* Red glowing line under title */}
        <div className="h-0.5 w-32 mx-auto bg-gradient-to-r from-red-500 to-purple-500 rounded-full mb-6"></div>
      </motion.div>

      <motion.p 
        className="text-gray-300 mb-8 text-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        Your cube has been lost to the depths of the void...
      </motion.p>

      <motion.div 
        className="bg-black/50 p-6 rounded-lg border border-purple-800/50 mb-8 backdrop-blur-sm"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="text-3xl text-center text-purple-400 font-bold mb-2">
          Score: {score}
        </div>
        <div className="text-xl text-center text-blue-400">Level: {level}</div>
        <div className="text-lg text-center text-pink-400 mt-2">
          Snake Length: {snake.length}
        </div>
        
        {/* Score stats separated by glowing line */}
        <div className="h-px w-full bg-purple-500/30 my-3"></div>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-gray-400">Highest Level</div>
          <div className="text-right text-blue-300">{level}</div>
          
          <div className="text-gray-400">Longest Snake</div>
          <div className="text-right text-pink-300">{snake.length} segments</div>
        </div>
      </motion.div>

      <motion.div 
        className="flex flex-col gap-4 w-64"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <button
          onClick={restartGame}
          className="px-6 py-3 bg-gradient-to-r from-purple-800 to-purple-600 text-white rounded-lg font-bold hover:opacity-90 transition-all hover:shadow-lg hover:shadow-purple-500/20 flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
            <path d="M21 3v5h-5"></path>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
            <path d="M8 16H3v5"></path>
          </svg>
          Try Again
        </button>

        <button
          onClick={onReturn}
          className="px-6 py-3 bg-gray-800 text-white rounded-lg font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          Exit to Hub
        </button>
      </motion.div>
    </motion.div>
  );

  // Render level complete screen
  const renderLevelCompleteScreen = () => (
    <motion.div 
      className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50 backdrop-blur"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="text-center"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-2">
          Level {level} Complete!
        </h2>
        
        {/* Green glowing line under title */}
        <div className="h-0.5 w-32 mx-auto bg-gradient-to-r from-green-500 to-blue-500 rounded-full mb-6"></div>
      </motion.div>

      <motion.p 
        className="text-gray-300 mb-8 text-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        You've found the portal to the next layer of the abyss.
      </motion.p>

      <motion.div 
        className="bg-black/50 p-6 rounded-lg border border-green-800/50 mb-8 backdrop-blur-sm"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="text-3xl text-center text-green-400 font-bold mb-2">
          Score: {score}
        </div>
        <div className="text-xl text-center text-blue-400">
          Level Completed: {level}
        </div>
        <div className="text-lg text-center text-pink-400 mt-2">
          Snake Length: {snake.length}
        </div>
        
        {/* Stats separated by glowing line */}
        <div className="h-px w-full bg-green-500/30 my-3"></div>
        
        {/* Level complete stats */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-gray-400">Next Level</div>
          <div className="text-right text-green-300">{level + 1}</div>
          
          <div className="text-gray-400">Speed</div>
          <div className="text-right text-blue-300">
            {Math.min(level, speeds.length)} / {speeds.length}
          </div>
        </div>
      </motion.div>

      <motion.button
        onClick={nextLevel}
        className="relative group overflow-hidden px-8 py-4 rounded-lg mb-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-blue-600 group-hover:from-green-500 group-hover:to-blue-500 rounded-lg transition-all duration-300"></div>
        <div className="absolute inset-0 opacity-0 group-hover:opacity-50 transition-opacity duration-300 bg-[radial-gradient(closest-side_at_50%_50%,white,transparent)]"></div>
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
        
        <span className="relative text-white font-pixel text-lg tracking-wider flex items-center gap-2">
          <span>Enter Next Level</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14"></path>
            <path d="m12 5 7 7-7 7"></path>
          </svg>
        </span>
      </motion.button>
    </motion.div>
  );

  // HUD elements positioned like in the screenshot
  const renderHUD = () => (
    <>
      {/* Score/Snake display - bottom left */}
      <motion.div
        className="absolute left-0 bottom-0 z-40 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg border border-purple-900/50"
        style={{ transform: "translate(-10px, 10px)" }}
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: -10 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-purple-300 font-bold">Score: {score}</div>
        <div className="text-pink-300 text-sm">Snake: {snake.length}</div>
      </motion.div>

      {/* Level/Portal info - bottom right */}
      <motion.div
        className="absolute right-0 bottom-0 z-40 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg border border-purple-900/50 text-right"
        style={{ transform: "translate(10px, 10px)" }}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 10 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-blue-300 font-bold">Level: {level}</div>
        <div className="text-green-300 text-sm">
          {portalVisible ? (
            <motion.span 
              animate={{ 
                color: ["#4ade80", "#34d399", "#4ade80"]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Portal is open!
            </motion.span>
          ) : (
            `Need ${Math.max(0, requiredLengthForPortal - snake.length)} more to open portal`
          )}
        </div>
      </motion.div>
    </>
  );

  // Generate background particles for Abyss realm theme
  const renderAbyssBackdrop = () => {
    return (
      <>
        {/* Parallax star field */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {/* Static stars */}
          {Array.from({ length: 100 }).map((_, i) => (
            <div
              key={`bg-star-${i}`}
              className="absolute rounded-full bg-white"
              style={{
                width: `${Math.random() * 2 + 1}px`,
                height: `${Math.random() * 2 + 1}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.5 + 0.1,
                boxShadow: i % 5 === 0 ? `0 0 ${Math.random() * 3 + 1}px white` : 'none',
              }}
            />
          ))}
          
          {/* Animated drifting stars */}
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={`drift-star-${i}`}
              className="absolute rounded-full bg-white"
              animate={{
                x: [0, Math.random() * 20 - 10],
                y: [0, Math.random() * 20 - 10],
                opacity: [0.2, 0.7, 0.2]
              }}
              transition={{
                duration: Math.random() * 20 + 10,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{
                width: `${Math.random() * 3 + 1}px`,
                height: `${Math.random() * 3 + 1}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                boxShadow: `0 0 ${Math.random() * 5 + 2}px rgba(255,255,255,0.7)`,
              }}
            />
          ))}
          
          {/* Nebula clouds */}
          <div className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 20% 30%, ${cubeColor}20 0%, transparent 50%), 
                          radial-gradient(circle at 80% 70%, ${cubeSecondaryColor}20 0%, transparent 40%)`,
              filter: 'blur(40px)',
            }}
          />
        </div>
        
        {/* Distant vortex effect */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 pointer-events-none"
          animate={{
            rotate: 360
          }}
          transition={{
            duration: 60,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{
            width: '800px',
            height: '800px',
            background: `conic-gradient(from 0deg, transparent, ${cubeColor}30, ${cubeSecondaryColor}20, transparent)`,
            filter: 'blur(40px)',
            zIndex: -1
          }}
        />
        
        {/* Energy pulses */}
        {[1, 2, 3].map((i) => (
          <motion.div
            key={`energy-pulse-${i}`}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
            initial={{ scale: 0, opacity: 0.7 }}
            animate={{
              scale: [0, 2.5],
              opacity: [0.7, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              delay: i * 2.5,
              ease: "easeOut"
            }}
            style={{
              width: '150px',
              height: '150px',
              border: `1px solid ${cubeColor}40`,
              zIndex: -1
            }}
          />
        ))}
      </>
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen flex flex-col items-center justify-center bg-black text-white overflow-hidden"
    >
      {/* Enhanced backdrop with animated elements */}
      {renderAbyssBackdrop()}
      
      {/* Additional ambient particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {renderParticles()}
      </div>

      {/* Header - Modern gradient text with animated underline */}
      <motion.div 
        className="absolute top-6 left-0 right-0 text-center z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-blue-600 tracking-wider mb-1">
          ABYSS REALM
        </h1>
        <motion.div 
          className="h-1 w-40 mx-auto bg-gradient-to-r from-pink-500 to-blue-600 rounded-full"
          animate={{
            opacity: [0.5, 1, 0.5],
            width: ["10%", "15%", "10%"]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>

      {/* Exit button - Modernized with hover effects */}
      <motion.button
        onClick={onReturn}
        className="absolute top-4 right-4 px-4 py-2 bg-black/50 border border-pink-900/50 text-pink-500 hover:text-pink-400 rounded z-30 transition-colors backdrop-blur-sm group"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full bg-pink-500/50 transition-all duration-300"></div>
      </motion.button>

      {/* Main game container - centered */}
      <div className="relative z-10">
        {/* Game states */}
        {gameState === "intro" && renderIntroScreen()}

        {gameState === "playing" && (
          <>
            {renderGameGrid()}
            {renderHUD()}
          </>
        )}

        {gameState === "paused" && (
          <>
            {renderGameGrid()}
            {renderHUD()}
            {renderPauseScreen()}
          </>
        )}

        {gameState === "gameOver" && (
          <>
            {renderGameGrid()}
            {renderHUD()}
            {renderGameOverScreen()}
          </>
        )}

        {gameState === "levelComplete" && (
          <>
            {renderGameGrid()}
            {renderHUD()}
            {renderLevelCompleteScreen()}
          </>
        )}
      </div>

      {/* Add global styles */}
      <style jsx global>{`
        @keyframes pulse-fade {
          from {
            opacity: 0.3;
          }
          to {
            opacity: 0;
          }
        }

        .text-gradient-animation {
          background: linear-gradient(
            -45deg,
            #ee7752,
            #e73c7e,
            #23a6d5,
            #23d5ab
          );
          background-size: 400% 400%;
          animation: gradient 15s ease infinite;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
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

export default AbyssRealm;