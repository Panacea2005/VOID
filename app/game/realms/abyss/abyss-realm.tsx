import React, { useState, useEffect, useRef } from "react";
import RealmCube from "../../cube/realm-cube";
import { cubeCollection } from "../../cube/realm-cube";

// Abyss Realm: Void Snake Game
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
type Direction = 'up' | 'down' | 'left' | 'right';

// Game states
type GameState = "intro" | "playing" | "paused" | "gameOver" | "levelComplete";

const AbyssRealm: React.FC<AbyssRealmProps> = ({ 
  onReturn, 
  selectedCubeId = "pink-neon" 
}) => {
  // Game state
  const [gameState, setGameState] = useState<GameState>("intro");
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [snake, setSnake] = useState<SnakeSegment[]>([]);
  const [direction, setDirection] = useState<Direction>('right');
  const [nextDirection, setNextDirection] = useState<Direction>('right');
  const [food, setFood] = useState<FoodPosition | null>(null);
  const [portal, setPortal] = useState<PortalPosition | null>(null);
  const [portalVisible, setPortalVisible] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  
  // Game refs
  const gameLoopRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  
  // Constants
  const GRID_SIZE = 20; // Grid cells (20x20)
  const CELL_SIZE = 30; // Cell size in pixels
  const GRID_WIDTH = GRID_SIZE * CELL_SIZE;
  const GRID_HEIGHT = GRID_SIZE * CELL_SIZE;
  
  // Game speeds per level (milliseconds between moves)
  const speeds = [180, 160, 140, 120, 100, 80];
  const requiredLengthForPortal = 10;
  
  // Get selected cube info
  const selectedCube = cubeCollection.find(cube => cube.id === selectedCubeId) || cubeCollection[0];
  
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
      { x: centerX - 2, y: centerY }
    ];
    
    setSnake(initialSnake);
    setDirection('right');
    setNextDirection('right');
    setPortal(null);
    setPortalVisible(false);
    generateFood(initialSnake);
  };
  
  // Generate food in an empty cell
  const generateFood = (currentSnake: SnakeSegment[]) => {
    // Find empty cells
    const emptyCells: {x: number, y: number}[] = [];
    
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        // Check if this cell is occupied by snake
        if (!currentSnake.some(segment => segment.x === x && segment.y === y)) {
          emptyCells.push({ x, y });
        }
      }
    }
    
    if (emptyCells.length > 0) {
      // Pick a random empty cell
      const randomIndex = Math.floor(Math.random() * emptyCells.length);
      setFood(emptyCells[randomIndex]);
    }
  };
  
  // Generate portal to next level
  const generatePortal = () => {
    // Find empty cells
    const emptyCells: {x: number, y: number}[] = [];
    
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        // Check if this cell is occupied by snake or food
        if (
          !snake.some(segment => segment.x === x && segment.y === y) &&
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
      
      // Play portal sound
      playSound('portal');
    }
  };
  
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
  }, [gameState, snake, direction, nextDirection, food, portal, portalVisible, level]);
  
  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") return;
      
      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          if (direction !== 'down') {
            setNextDirection('up');
          }
          break;
        case "ArrowDown":
        case "s":
        case "S":
          if (direction !== 'up') {
            setNextDirection('down');
          }
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          if (direction !== 'right') {
            setNextDirection('left');
          }
          break;
        case "ArrowRight":
        case "d":
        case "D":
          if (direction !== 'left') {
            setNextDirection('right');
          }
          break;
        case " ":
          emitPulse();
          break;
        case "Escape":
          setGameState(prev => prev === "playing" ? "paused" : "playing");
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
    
    // Move head based on direction
    switch (nextDirection) {
      case 'up':
        head.y = (head.y - 1 + GRID_SIZE) % GRID_SIZE;
        break;
      case 'down':
        head.y = (head.y + 1) % GRID_SIZE;
        break;
      case 'left':
        head.x = (head.x - 1 + GRID_SIZE) % GRID_SIZE;
        break;
      case 'right':
        head.x = (head.x + 1) % GRID_SIZE;
        break;
    }
    
    // Check if snake hit itself
    if (newSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
      setGameState("gameOver");
      playSound('gameover');
      return;
    }
    
    // Add new head
    newSnake.unshift(head);
    
    // Check if snake found food
    let foundFood = false;
    if (food && head.x === food.x && head.y === food.y) {
      foundFood = true;
      setScore(prev => prev + 10);
      setFood(null);
      playSound('food');
      
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
      playSound('success');
      return;
    }
    
    // Update snake
    setSnake(newSnake);
  };
  
  // Emit pulse for visibility
  const emitPulse = () => {
    if (isPulsing) return;
    
    setIsPulsing(true);
    playSound('pulse');
    
    setTimeout(() => {
      setIsPulsing(false);
    }, 1000);
  };
  
  // Play sound
  const playSound = (type: string) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      switch (type) {
        case 'food':
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.2);
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.3);
          break;
          
        case 'pulse':
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.3);
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.4);
          break;
          
        case 'portal':
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.1);
          oscillator.frequency.setValueAtTime(1320, audioContext.currentTime + 0.2);
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.5);
          break;
          
        case 'success':
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(554, audioContext.currentTime + 0.2);
          oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.4);
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.6);
          break;
          
        case 'gameover':
          oscillator.type = 'sawtooth';
          oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(110, audioContext.currentTime + 0.5);
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
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
  };
  
  const nextLevel = () => {
    setLevel(prev => prev + 1);
    setGameState("intro");
  };
  
  const restartGame = () => {
    setLevel(1);
    setScore(0);
    setGameState("intro");
  };
  
  const resumeGame = () => {
    setGameState("playing");
  };
  
  // Render a simple 3D-style cube for snake body
  const renderSnakeCube = (isHead: boolean, rotation: number = 0) => {
    // Shadow color based on the main color
    const shadowColor = `${cubeColor}99`;
    
    return (
      <div 
        className="w-full h-full relative"
        style={{ transform: isHead ? `rotate(${rotation}deg)` : '' }}
      >
        {isHead ? (
          // Use actual cube for head
          <RealmCube
            position="center"
            size={CELL_SIZE}
            cubeId={selectedCubeId}
            isAnimated={false}
            onCubeClick={() => {}}
          />
        ) : (
          // Simple 3D cube for body segments
          <div className="w-full h-full relative">
            {/* Top face - lighter */}
            <div
              className="absolute top-0 left-0 right-0 h-1/3 rounded-t-sm"
              style={{ 
                backgroundColor: cubeColor,
                boxShadow: `inset 0 1px 1px rgba(255,255,255,0.3)`
              }}
            />
            
            {/* Main face */}
            <div
              className="absolute inset-0 rounded-sm"
              style={{ 
                backgroundColor: cubeColor,
                boxShadow: `0 0 5px ${shadowColor}`
              }}
            />
            
            {/* Right side - darker */}
            <div
              className="absolute top-0 right-0 bottom-0 w-1/3 rounded-r-sm"
              style={{ 
                backgroundColor: cubeColor,
                opacity: 0.7
              }}
            />
            
            {/* Bottom side - darker */}
            <div
              className="absolute bottom-0 left-0 right-0 h-1/3 rounded-b-sm"
              style={{ 
                backgroundColor: cubeColor,
                opacity: 0.7
              }}
            />
          </div>
        )}
      </div>
    );
  };
  
  // Render game grid
  const renderGameGrid = () => {
    return (
      <div 
        ref={gameAreaRef}
        className="relative border border-blue-500/30"
        style={{
          width: GRID_WIDTH,
          height: GRID_HEIGHT,
          transform: "perspective(800px) rotateX(15deg)",
          transformStyle: "preserve-3d",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          backgroundColor: "#070b17"
        }}
      >
        {/* Food */}
        {food && (
          <div 
            className="absolute"
            style={{
              left: food.x * CELL_SIZE,
              top: food.y * CELL_SIZE,
              width: CELL_SIZE,
              height: CELL_SIZE,
              zIndex: 10
            }}
          >
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-1/2 h-1/2 relative rounded-full bg-purple-500" 
                style={{ boxShadow: '0 0 8px rgba(168, 85, 247, 0.8)' }} 
              />
            </div>
          </div>
        )}
        
        {/* Portal */}
        {portal && portalVisible && (
          <div 
            className="absolute"
            style={{
              left: portal.x * CELL_SIZE,
              top: portal.y * CELL_SIZE,
              width: CELL_SIZE,
              height: CELL_SIZE,
              zIndex: 10
            }}
          >
            <div className="w-full h-full flex items-center justify-center">
              <div 
                className="w-3/4 h-3/4 rounded-full"
                style={{
                  background: `radial-gradient(circle, #10b981, #047857)`,
                  boxShadow: `0 0 10px rgba(16, 185, 129, 0.8)`,
                  border: "1px solid rgba(16, 185, 129, 0.8)"
                }}
              />
            </div>
          </div>
        )}
        
        {/* Snake */}
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
              case 'up': rotation = 0; break;
              case 'right': rotation = 90; break;
              case 'down': rotation = 180; break;
              case 'left': rotation = -90; break;
            }
          }
          
          return (
            <div
              key={`snake-${index}`}
              className="absolute"
              style={{
                left: x,
                top: y,
                width: CELL_SIZE,
                height: CELL_SIZE,
                zIndex: 20,
                transformStyle: "preserve-3d"
              }}
            >
              {renderSnakeCube(isHead, rotation)}
            </div>
          );
        })}
        
        {/* Pulse effect overlay */}
        {isPulsing && (
          <div 
            className="absolute inset-0 bg-white/30 z-30"
            style={{
              animation: "pulse-fade 1s forwards"
            }}
          />
        )}
      </div>
    );
  };
  
  // Render modern intro screen
  const renderIntroScreen = () => (
    <div className="flex flex-col items-center justify-center h-full text-center">
      {/* Modern, gradient title */}
      <div className="text-gradient-animation mb-10">
        <h1 className="text-6xl font-bold tracking-wider mb-2">
          Void Snake
        </h1>
        <div className="text-3xl font-light text-blue-300">Level {level}</div>
      </div>

      {/* Game description */}
      <p className="text-gray-300 max-w-md mb-10 text-xl leading-relaxed">
        Navigate the void, collect light fragments, and find the portal to the next level.
      </p>
      
      {/* Modern control panel */}
      <div className="grid grid-cols-2 gap-6 mb-12 max-w-md w-full mx-auto">
        <div className="bg-purple-900/30 backdrop-blur rounded-xl p-5 border border-purple-500/20">
          <div className="text-purple-300 font-bold mb-3 text-left">Movement</div>
          <div className="text-gray-300 text-left">Arrow Keys / WASD</div>
        </div>
        
        <div className="bg-blue-900/30 backdrop-blur rounded-xl p-5 border border-blue-500/20">
          <div className="text-blue-300 font-bold mb-3 text-left">Light Pulse</div>
          <div className="text-gray-300 text-left">Spacebar</div>
        </div>
        
        <div className="bg-pink-900/30 backdrop-blur rounded-xl p-5 border border-pink-500/20">
          <div className="text-pink-300 font-bold mb-3 text-left">Pause Game</div>
          <div className="text-gray-300 text-left">ESC Key</div>
        </div>
        
        <div className="bg-indigo-900/30 backdrop-blur rounded-xl p-5 border border-indigo-500/20">
          <div className="text-indigo-300 font-bold mb-3 text-left">Selected Cube</div>
          <div className="flex justify-center items-center h-10">
            <div className="w-10 h-10">
              <RealmCube
                position="center"
                size={40}
                cubeId={selectedCubeId} 
                isAnimated={true}
                onCubeClick={() => {}}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Start button with glow effect */}
      <button
        onClick={startGame}
        className="px-10 py-4 text-xl bg-purple-600 text-white rounded-full font-bold transition-all hover:bg-purple-500 relative overflow-hidden group"
      >
        <span className="relative z-10">Enter the Void</span>
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </button>
    </div>
  );
  
  // Render pause screen
  const renderPauseScreen = () => (
    <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50 backdrop-blur">
      <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-blue-500 mb-8">
        Game Paused
      </h2>
      
      <div className="flex flex-col gap-4 w-64">
        <button
          onClick={resumeGame}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-bold hover:opacity-90 transition-all"
        >
          Resume
        </button>
        
        <button
          onClick={restartGame}
          className="px-6 py-3 bg-gradient-to-r from-purple-800 to-purple-600 text-white rounded-lg font-bold hover:opacity-90 transition-all"
        >
          Restart
        </button>
        
        <button
          onClick={onReturn}
          className="px-6 py-3 bg-gray-800 text-white rounded-lg font-bold hover:opacity-90 transition-all"
        >
          Exit
        </button>
      </div>
    </div>
  );
  
  // Render game over screen
  const renderGameOverScreen = () => (
    <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50">
      <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-purple-500 mb-6">
        Game Over
      </h2>
      
      <p className="text-gray-300 mb-8 text-xl">Your cube has been lost to the void...</p>
      
      <div className="bg-black/50 p-6 rounded-lg border border-purple-800/50 mb-8">
        <div className="text-3xl text-center text-purple-400 font-bold mb-2">Score: {score}</div>
        <div className="text-xl text-center text-blue-400">Level: {level}</div>
        <div className="text-lg text-center text-pink-400 mt-2">Snake Length: {snake.length}</div>
      </div>
      
      <div className="flex flex-col gap-4 w-64">
        <button
          onClick={restartGame}
          className="px-6 py-3 bg-gradient-to-r from-purple-800 to-purple-600 text-white rounded-lg font-bold hover:opacity-90 transition-all"
        >
          Try Again
        </button>
        
        <button
          onClick={onReturn}
          className="px-6 py-3 bg-gray-800 text-white rounded-lg font-bold hover:opacity-90 transition-all"
        >
          Exit
        </button>
      </div>
    </div>
  );
  
  // Render level complete screen
  const renderLevelCompleteScreen = () => (
    <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50">
      <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-6">
        Level {level} Complete!
      </h2>
      
      <p className="text-gray-300 mb-8 text-xl">You've found the portal to the next layer of the abyss.</p>
      
      <div className="bg-black/50 p-6 rounded-lg border border-green-800/50 mb-8">
        <div className="text-3xl text-center text-green-400 font-bold mb-2">Score: {score}</div>
        <div className="text-xl text-center text-blue-400">Level Completed: {level}</div>
        <div className="text-lg text-center text-pink-400 mt-2">Snake Length: {snake.length}</div>
      </div>
      
      <button
        onClick={nextLevel}
        className="px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-bold hover:opacity-90 transition-all mb-4"
      >
        Enter Next Level
      </button>
    </div>
  );
  
  // HUD elements positioned like in the screenshot
  const renderHUD = () => (
    <>
      {/* Score/Snake display - bottom left */}
      <div 
        className="absolute left-0 bottom-0 z-40 bg-black/70 px-4 py-2 rounded-lg border border-purple-900/50"
        style={{ transform: "translate(-10px, 10px)" }}
      >
        <div className="text-purple-300 font-bold">Score: {score}</div>
        <div className="text-pink-300 text-sm">Snake: {snake.length}</div>
      </div>
      
      {/* Level/Portal info - bottom right */}
      <div 
        className="absolute right-0 bottom-0 z-40 bg-black/70 px-4 py-2 rounded-lg border border-purple-900/50 text-right"
        style={{ transform: "translate(10px, 10px)" }}
      >
        <div className="text-blue-300 font-bold">Level: {level}</div>
        <div className="text-green-300 text-sm">
          {portalVisible ? "Portal is open!" : `Need ${Math.max(0, requiredLengthForPortal - snake.length)} more to open portal`}
        </div>
      </div>
      
      {/* Controls - positioned below game area */}
      <div 
        className="absolute bottom-0 left-1/2 z-40 bg-black/70 px-4 py-2 rounded-lg border border-purple-900/50 whitespace-nowrap"
        style={{ transform: "translate(-50%, 50px)" }}
      >
        WASD/Arrows: Move | Space: Pulse | ESC: Pause
      </div>
    </>
  );
  
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-black text-white overflow-hidden">
      {/* Animated background with stars effect */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Static stars */}
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={`bg-star-${i}`}
            className="absolute rounded-full bg-white"
            style={{
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.5 + 0.1
            }}
          />
        ))}
      </div>
      
      {/* Header */}
      <div className="absolute top-6 left-0 right-0 text-center z-10">
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-blue-600 tracking-wider">
          ABYSS REALM
        </h1>
        
        {/* ESC hint */}
        <div className="text-gray-500 text-sm mt-1">To exit full screen, press and hold <span className="bg-gray-800 text-gray-300 px-1 rounded">Esc</span></div>
      </div>
      
      {/* Exit button */}
      <button
        onClick={onReturn}
        className="absolute top-4 right-4 px-4 py-2 bg-black/50 border border-pink-900/50 text-pink-500 hover:text-pink-400 rounded z-30 transition-colors"
      >
        EXIT
      </button>
      
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
          from { opacity: 0.3; }
          to { opacity: 0; }
        }
        
        .text-gradient-animation {
          background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
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
      `}</style>
    </div>
  );
};

export default AbyssRealm;