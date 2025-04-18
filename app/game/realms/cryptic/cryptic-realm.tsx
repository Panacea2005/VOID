import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useAnimationControls } from "framer-motion";
import { cubeCollection } from "../../cube/realm-cube";
import { useAudio } from "../../contexts/audio-context";

interface CrypticRealmProps {
  onReturn: () => void;
  selectedCubeId?: string;
}

// Classic 2D Tetris Game with realm cube colors
const CrypticRealm: React.FC<CrypticRealmProps> = ({
  onReturn,
  selectedCubeId = "pink-neon",
}) => {
  // Game states
  const [gameState, setGameState] = useState<
    "waiting" | "playing" | "paused" | "gameOver"
  >("waiting");
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const gameStateRef = useRef("waiting");
  const isAnimatingRef = useRef(false);
  const lastDropTimeRef = useRef(0);
  const dropIntervalRef = useRef(1000);

  // Game grid dimensions
  const gridWidth = 10;
  const gridHeight = 20;

  // Grid state
  const [grid, setGrid] = useState<number[][]>([]);

  // Current tetromino state
  const [currentPiece, setCurrentPiece] = useState<{
    shape: number[][];
    position: { x: number; y: number };
    color: string;
    rotation: number;
  } | null>(null);

  // Next piece preview
  const [nextPiece, setNextPiece] = useState<{
    shape: number[][];
    color: string;
  } | null>(null);

  // Held piece
  const [heldPiece, setHeldPiece] = useState<{
    shape: number[][];
    color: string;
  } | null>(null);
  const [canHold, setCanHold] = useState(true);

  // Game speed - milliseconds per drop
  const [dropInterval, setDropInterval] = useState(1000);
  const [lastDropTime, setLastDropTime] = useState(0);

  // Animation state
  const [isAnimating, setIsAnimating] = useState(false);
  const [clearedLines, setClearedLines] = useState<number[]>([]);

  // Help overlay
  const [showControls, setShowControls] = useState(false);

  // Animation controls
  const gridControls = useAnimationControls();

  // Grid background reference
  const gridRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Game loop interval
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const requestRef = useRef<number>(0);

  // Mouse position for ambient lighting
  const [ambientLightPosition, setAmbientLightPosition] = useState({
    x: 50,
    y: 50,
  });

  // Audio context
  const audio = useAudio();

  // Get selected cube from collection
  const defaultCube = cubeCollection[0];
  const selectedCube =
    cubeCollection.find((cube) => cube.id === selectedCubeId) || defaultCube;
  const cubeColors = [...selectedCube.colors];

  // Background gradient based on cube colors
  const mainColor = cubeColors[0] || "#ec4899";
  const secondaryColor = cubeColors[1] || "#8B5CF6";

  // Ensure we have enough colors
  while (cubeColors.length < 7) {
    cubeColors.push(cubeColors[cubeColors.length % cubeColors.length]);
  }

  // Define Tetromino shapes
  const tetrominoes = [
    {
      // I piece
      shape: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      color: cubeColors[0],
    },
    {
      // O piece
      shape: [
        [1, 1],
        [1, 1],
      ],
      color: cubeColors[1],
    },
    {
      // T piece
      shape: [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
      color: cubeColors[2],
    },
    {
      // L piece
      shape: [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0],
      ],
      color: cubeColors[3],
    },
    {
      // J piece
      shape: [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
      color: cubeColors[4],
    },
    {
      // S piece
      shape: [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0],
      ],
      color: cubeColors[5],
    },
    {
      // Z piece
      shape: [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0],
      ],
      color: cubeColors[6],
    },
  ];

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);
  
  useEffect(() => {
    isAnimatingRef.current = isAnimating;
  }, [isAnimating]);
  
  useEffect(() => {
    lastDropTimeRef.current = lastDropTime;
  }, [lastDropTime]);
  
  useEffect(() => {
    dropIntervalRef.current = dropInterval;
  }, [dropInterval]);

  // Handle mouse movement for ambient lighting and parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      setAmbientLightPosition({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Initialize game
  useEffect(() => {
    try {
      audio.changeTrack("tetris");
    } catch (error) {
      console.log("Could not set audio track");
    }

    // Initialize grid
    initializeGrid();

    // Load high score from localStorage
    const savedHighScore = localStorage.getItem("tetrisHighScore");
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore));
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // Initialize the grid
  const initializeGrid = () => {
    const newGrid: number[][] = [];

    for (let y = 0; y < gridHeight; y++) {
      const row: number[] = [];
      for (let x = 0; x < gridWidth; x++) {
        row.push(0); // 0 means empty
      }
      newGrid.push(row);
    }

    setGrid(newGrid);
  };

  // Start game
  const startGame = () => {
    if (gameState === "playing") return;

    try {
      audio.playSound("start");
    } catch (e) {
      console.log("Could not play start sound");
    }

    // Reset game state
    setScore(0);
    setLevel(1);
    setLines(0);
    setDropInterval(1000);
    setHeldPiece(null);
    setCanHold(true);
    initializeGrid();
    setGameState("playing");

    // CRITICAL: Set the initial lastDropTime to current time
    setLastDropTime(Date.now());

    // Animate grid
    gridControls.start({
      scale: [0.95, 1.05, 1],
      opacity: [0.8, 1],
      transition: { duration: 1 },
    });

    // Generate first and next pieces
    generateNewPiece();

    // Start game loop
    startGameLoop();

    // Show controls briefly
    setShowControls(true);
    setTimeout(() => setShowControls(false), 3000);
  };

  // Start the game loop
  const startGameLoop = () => {
    // Clear any existing interval
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
    }

    // Set new interval
    gameLoopRef.current = setInterval(() => {
      if (gameState === "playing" && !isAnimating) {
        const now = Date.now();
        if (now - lastDropTime >= dropInterval) {
          const moved = moveDown();
          // Only update lastDropTime if we actually moved down
          if (moved) {
            setLastDropTime(now);
          }
        }
      }
    }, 16); // Check at ~60fps for smoother gameplay

    // Start animation frame for smoother animations
    const animate = () => {
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
  };

  // Generate a new tetromino piece
  const generateNewPiece = () => {
    // Use next piece if available, otherwise generate new
    let newShape, newColor;

    if (nextPiece) {
      newShape = nextPiece.shape;
      newColor = nextPiece.color;
    } else {
      const randomIndex = Math.floor(Math.random() * tetrominoes.length);
      newShape = tetrominoes[randomIndex].shape;
      newColor = tetrominoes[randomIndex].color;
    }

    // Generate next piece for preview
    const nextIndex = Math.floor(Math.random() * tetrominoes.length);
    setNextPiece({
      shape: tetrominoes[nextIndex].shape,
      color: tetrominoes[nextIndex].color,
    });

    // Set the new current piece
    const newPiece = {
      shape: newShape,
      position: {
        x: Math.floor(gridWidth / 2) - Math.floor(getWidth(newShape) / 2),
        y: gridHeight - getHeight(newShape),
      },
      color: newColor,
      rotation: 0,
    };

    // Check if the new piece can be placed (game over check)
    if (!isValidPosition(newPiece)) {
      // Game over
      setGameState("gameOver");

      try {
        audio.playSound("gameover");
      } catch (e) {
        console.log("Could not play game over sound");
      }

      // Update high score if needed
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem("tetrisHighScore", score.toString());
      }

      return;
    }

    setCurrentPiece(newPiece);
  };

  // Get piece dimensions
  const getHeight = (shape: number[][]) => {
    let height = 0;
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          height = Math.max(height, y + 1);
        }
      }
    }
    return height;
  };

  const getWidth = (shape: number[][]) => {
    let width = 0;
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          width = Math.max(width, x + 1);
        }
      }
    }
    return width;
  };

  // Check if position is valid for the current piece
  const isValidPosition = (piece = currentPiece) => {
    if (!piece) return false;

    const { shape, position } = piece;

    // Check each cell of the piece
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        // If this cell has a block
        if (shape[y][x]) {
          // Calculate the position on the grid
          const gridX = position.x + x;
          const gridY = position.y - y;

          // Check boundaries
          if (
            gridX < 0 ||
            gridX >= gridWidth ||
            gridY < 0 ||
            gridY >= gridHeight
          ) {
            return false;
          }

          // Check collision with existing blocks
          if (gridY >= 0 && grid[gridY][gridX] !== 0) {
            return false;
          }
        }
      }
    }

    return true;
  };

  // Move the current piece down
  const moveDown = () => {
    if (!currentPiece || isAnimating) return false;

    const newPosition = {
      ...currentPiece.position,
      y: currentPiece.position.y - 1,
    };

    const newPiece = {
      ...currentPiece,
      position: newPosition,
    };

    if (isValidPosition(newPiece)) {
      setCurrentPiece(newPiece);
      return true; // Movement was successful
    } else {
      // Lock the piece in place
      lockPiece();
      return false; // Movement was blocked
    }
  };

  // Move the current piece left
  const moveLeft = () => {
    if (!currentPiece || isAnimating) return;

    const newPosition = {
      ...currentPiece.position,
      x: currentPiece.position.x - 1,
    };

    const newPiece = {
      ...currentPiece,
      position: newPosition,
    };

    if (isValidPosition(newPiece)) {
      setCurrentPiece(newPiece);

      try {
        audio.playSound("move");
      } catch (e) {
        // Silent fail
      }
    }
  };

  // Move the current piece right
  const moveRight = () => {
    if (!currentPiece || isAnimating) return;

    const newPosition = {
      ...currentPiece.position,
      x: currentPiece.position.x + 1,
    };

    const newPiece = {
      ...currentPiece,
      position: newPosition,
    };

    if (isValidPosition(newPiece)) {
      setCurrentPiece(newPiece);

      try {
        audio.playSound("move");
      } catch (e) {
        // Silent fail
      }
    }
  };

  // Rotate the current piece
  const rotatePiece = () => {
    if (!currentPiece || isAnimating) return;

    // Create a new rotated shape matrix
    const { shape } = currentPiece;
    const size = shape.length;
    const rotatedShape = Array(size)
      .fill(0)
      .map(() => Array(size).fill(0));

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        rotatedShape[x][size - 1 - y] = shape[y][x];
      }
    }

    const newPiece = {
      ...currentPiece,
      shape: rotatedShape,
      rotation: (currentPiece.rotation + 90) % 360,
    };

    // Try to rotate, and if it fails due to boundary, adjust position
    if (isValidPosition(newPiece)) {
      setCurrentPiece(newPiece);

      try {
        audio.playSound("rotate");
      } catch (e) {
        // Silent fail
      }
    } else {
      // Try wall kicking
      const kicks = [
        { x: -1, y: 0 }, // move left
        { x: 1, y: 0 }, // move right
        { x: 2, y: 0 }, // move 2 right
        { x: -2, y: 0 }, // move 2 left
        { x: 0, y: 1 }, // move up
        { x: -1, y: 1 }, // move up and left
        { x: 1, y: 1 }, // move up and right
      ];

      for (const kick of kicks) {
        const kickedPiece = {
          ...newPiece,
          position: {
            x: newPiece.position.x + kick.x,
            y: newPiece.position.y + kick.y,
          },
        };

        if (isValidPosition(kickedPiece)) {
          setCurrentPiece(kickedPiece);

          try {
            audio.playSound("rotate");
          } catch (e) {
            // Silent fail
          }

          break;
        }
      }
    }
  };

  // Hold the current piece
  const holdPiece = () => {
    if (!currentPiece || isAnimating || !canHold) return;

    const currentShape = currentPiece.shape;
    const currentColor = currentPiece.color;

    try {
      audio.playSound("hold");
    } catch (e) {
      // Silent fail
    }

    if (heldPiece) {
      // Swap with held piece
      const newPiece = {
        shape: heldPiece.shape,
        position: {
          x:
            Math.floor(gridWidth / 2) -
            Math.floor(getWidth(heldPiece.shape) / 2),
          y: gridHeight - getHeight(heldPiece.shape),
        },
        color: heldPiece.color,
        rotation: 0,
      };

      setCurrentPiece(newPiece);
    } else {
      // No held piece yet, generate a new piece
      generateNewPiece();
    }

    setHeldPiece({
      shape: currentShape,
      color: currentColor,
    });

    setCanHold(false);
  };

  // Hard drop - move piece all the way down
  const hardDrop = () => {
    if (!currentPiece || isAnimating) return;

    try {
      // Create a deep copy of the current piece
      const piece = JSON.parse(JSON.stringify(currentPiece));

      // Find the lowest valid position
      let newY = piece.position.y;
      let foundBottom = false;

      // Move down until collision
      while (!foundBottom) {
        newY -= 1;

        const testPosition = {
          x: piece.position.x,
          y: newY,
        };

        const testPiece = {
          ...piece,
          position: testPosition,
        };

        if (!isValidPosition(testPiece)) {
          // We found the bottom position, move back up one
          newY += 1;
          foundBottom = true;
        }
      }

      // Create final position
      const finalPosition = {
        x: piece.position.x,
        y: newY,
      };

      // First update the position
      setCurrentPiece((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          position: finalPosition,
        };
      });

      // Then lock piece in new position - use immediate callback to avoid race conditions
      // Ensure we're using current grid state
      setTimeout(() => {
        // Manually create the updated grid
        const newGrid = JSON.parse(JSON.stringify(grid));
        const { shape, color } = piece;

        // Convert the color to a number representation (index + 1)
        const colorIndex = cubeColors.indexOf(color) + 1;

        // Add the piece to the grid at final position
        for (let y = 0; y < shape.length; y++) {
          for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
              const gridY = finalPosition.y - y;
              const gridX = finalPosition.x + x;

              // Make sure we're within bounds
              if (
                gridY >= 0 &&
                gridY < gridHeight &&
                gridX >= 0 &&
                gridX < gridWidth
              ) {
                newGrid[gridY][gridX] = colorIndex;
              }
            }
          }
        }

        // Update the grid
        setGrid(newGrid);
        setCurrentPiece(null);
        setCanHold(true);

        // Play lock sound
        try {
          audio.playSound("lock");
        } catch (e) {
          // Silent fail
        }

        // Check lines with the new grid
        checkLines(newGrid);
      }, 10);

      try {
        audio.playSound("drop");
      } catch (e) {
        // Silent fail
      }
    } catch (e) {
      console.error("Error during hard drop:", e);
    }
  };

  // Lock the current piece in place
  const lockPiece = () => {
    if (!currentPiece) return;

    // Create a new grid with the piece locked in
    const newGrid = JSON.parse(JSON.stringify(grid)); // Deep copy
    const { shape, position, color } = currentPiece;

    // Convert the color to a number representation (index + 1)
    const colorIndex = cubeColors.indexOf(color) + 1;

    // Add the piece to the grid
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const gridY = position.y - y;
          const gridX = position.x + x;

          // Make sure we're within bounds
          if (
            gridY >= 0 &&
            gridY < gridHeight &&
            gridX >= 0 &&
            gridX < gridWidth
          ) {
            newGrid[gridY][gridX] = colorIndex;
          }
        }
      }
    }

    setGrid(newGrid);
    setCurrentPiece(null); // Important: clear current piece immediately

    try {
      audio.playSound("lock");
    } catch (e) {
      // Silent fail
    }

    // Reset can hold
    setCanHold(true);

    // Check for completed lines
    checkLines(newGrid);
  };

  // Check for and clear completed lines
  const checkLines = (currentGrid: number[][]) => {
    setIsAnimating(true);

    // Find completed lines
    const completedLines: number[] = [];

    for (let y = 0; y < gridHeight; y++) {
      let lineComplete = true;
      for (let x = 0; x < gridWidth; x++) {
        if (currentGrid[y][x] === 0) {
          lineComplete = false;
          break;
        }
      }

      if (lineComplete) {
        completedLines.push(y);
      }
    }

    if (completedLines.length > 0) {
      // Animate line clearing
      setClearedLines(completedLines);

      try {
        if (completedLines.length >= 4) {
          audio.playSound("tetris");
        } else {
          audio.playSound("lineclear");
        }
      } catch (e) {
        // Silent fail
      }

      // After animation, clear the lines and continue
      setTimeout(() => {
        clearLines(completedLines, currentGrid);
      }, 500);
    } else {
      // IMPORTANT: No completed lines, reset animation flag immediately
      setIsAnimating(false);

      // Generate new piece immediately
      generateNewPiece();
    }
  };

  // Clear the completed lines and update score
  const clearLines = (completedLines: number[], currentGrid: number[][]) => {
    let newGrid = [...currentGrid.map((row) => [...row])];

    // Sort lines from top to bottom
    completedLines.sort((a, b) => b - a);

    // Remove completed lines
    completedLines.forEach((line) => {
      // Remove this line
      newGrid.splice(line, 1);

      // Add a new empty line at the top
      newGrid.push(Array(gridWidth).fill(0));
    });

    setGrid(newGrid);
    setClearedLines([]);

    // Update score, lines and level
    const newLines = lines + completedLines.length;
    const newLevel = Math.floor(newLines / 10) + 1;

    // Calculate score (more points for more lines at once)
    let lineScore = 0;
    switch (completedLines.length) {
      case 1:
        lineScore = 100;
        break;
      case 2:
        lineScore = 300;
        break;
      case 3:
        lineScore = 500;
        break;
      case 4:
        lineScore = 800;
        break;
      default:
        lineScore = completedLines.length * 100;
        break;
    }

    const newScore = score + lineScore * level;

    setScore(newScore);
    setLines(newLines);

    // Level up if needed
    if (newLevel > level) {
      setLevel(newLevel);

      // Use an exponential difficulty curve for more dynamic gameplay
      // This formula makes higher levels dramatically harder:
      // Level 1: 1000ms (1 drop/second)
      // Level 5: ~409ms (2.44 drops/second)
      // Level 10: ~134ms (7.46 drops/second)
      // Level 15+: 50ms (20 drops/second)
      const newDropInterval = Math.max(
        50,
        Math.floor(1000 * Math.pow(0.8, newLevel - 1))
      );
      setDropInterval(newDropInterval);

      try {
        audio.playSound("levelup");
      } catch (e) {
        // Silent fail
      }
    }

    setIsAnimating(false);

    // Generate new piece
    generateNewPiece();
  };

  useEffect(() => {
    // This makes sure the game loop is stopped when not playing
    if (gameState !== "playing" && gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }

    // Restart the game loop when going back to playing
    if (gameState === "playing" && !gameLoopRef.current) {
      startGameLoop();
    }
  }, [gameState]);

  // Calculate the position for the ghost piece
  const getGhostPosition = () => {
    if (!currentPiece) return null;

    let ghostPosition = { ...currentPiece.position };
    let testPiece = { ...currentPiece, position: ghostPosition };

    // Keep moving down until invalid
    while (isValidPosition(testPiece)) {
      ghostPosition.y -= 1;
      testPiece.position = { ...ghostPosition };
    }

    // Move back up one (to last valid position)
    ghostPosition.y += 1;

    return ghostPosition;
  };

  // Format score with commas
  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Render piece preview (next or held)
  const renderPiecePreview = (
    pieceData: { shape: number[][]; color: string } | null,
    label: string
  ) => {
    if (!pieceData)
      return (
        <div className="flex flex-col items-center">
          <h3 className="text-gray-300 mb-2">{label}</h3>
          <div className="bg-black/30 border border-gray-700 w-24 h-24 flex items-center justify-center">
            <span className="text-gray-500">Empty</span>
          </div>
        </div>
      );

    const { shape, color } = pieceData;

    // Calculate display dimensions
    const cellSize = 18;
    const maxDimension = Math.max(shape.length, shape[0]?.length || 0);
    const previewSize = maxDimension * cellSize;

    return (
      <div className="flex flex-col items-center">
        <h3 className="text-gray-300 mb-2">{label}</h3>
        <div
          className="bg-black/30 border border-gray-700 p-2 flex items-center justify-center"
          style={{ width: "80px", height: "80px" }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${shape[0].length}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${shape.length}, ${cellSize}px)`,
              gap: "1px",
            }}
          >
            {shape.map((row, y) =>
              row.map((cell, x) => (
                <div
                  key={`${label}-${y}-${x}`}
                  style={{
                    width: `${cellSize}px`,
                    height: `${cellSize}px`,
                    backgroundColor: cell ? color : "transparent",
                    border: cell ? `1px solid rgba(255,255,255,0.5)` : "none",
                    boxShadow: cell
                      ? `inset 0 0 5px rgba(255,255,255,0.3)`
                      : "none",
                  }}
                />
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  // Generate background particles
  const renderParticles = () => {
    return Array.from({ length: 60 }).map((_, i) => (
      <motion.div
        key={`particle-${i}`}
        className="absolute rounded-full bg-gradient-to-r from-blue-300 to-purple-400"
        animate={{
          x: [
            Math.random() * window.innerWidth,
            Math.random() * window.innerWidth,
          ],
          y: [
            Math.random() * window.innerHeight,
            Math.random() * window.innerHeight,
          ],
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{
          duration: Math.random() * 20 + 10,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{
          width: `${Math.random() * 4 + 1}px`,
          height: `${Math.random() * 4 + 1}px`,
          boxShadow: `0 0 ${Math.random() * 8 + 2}px ${mainColor}`,
        }}
      />
    ));
  };

  // Handle key presses
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === "waiting") {
        if (e.key === "Enter") {
          startGame();
        }
        return;
      }

      if (gameState === "gameOver") {
        if (e.key === "Enter") {
          startGame();
        }
        return;
      }

      if (gameState === "paused") {
        if (e.key === "p" || e.key === "P" || e.key === "Escape") {
          setGameState("playing");
        }
        return;
      }

      if (gameState !== "playing" || isAnimating) return;

      switch (e.key) {
        case "ArrowLeft":
          moveLeft();
          break;
        case "ArrowRight":
          moveRight();
          break;
        case "ArrowDown":
          moveDown();
          setLastDropTime(Date.now());
          break;
        case "z":
        case "Z":
          rotatePiece();
          break;
        case " ": // Space
          hardDrop();
          break;
        case "c":
        case "C":
          holdPiece();
          break;
        case "p":
        case "P":
        case "Escape":
          // Toggle pause
          setGameState("paused");
          break;
        case "h":
        case "H":
          // Toggle help
          setShowControls(!showControls);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    gameState,
    currentPiece,
    isAnimating,
    grid,
    showControls,
    canHold,
    heldPiece,
  ]);

  // Render the game grid with all pieces
  const renderGrid = () => {
    // Ghost position calculation
    const ghostPosition = getGhostPosition();

    return (
      <motion.div
        ref={gridRef}
        className="relative border-2 border-gray-800 bg-black/70 overflow-hidden"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${gridWidth}, 30px)`,
          gridTemplateRows: `repeat(${gridHeight}, 30px)`,
          gap: "1px",
        }}
        animate={gridControls}
      >
        {/* Background grid cells */}
        {Array.from({ length: gridHeight }).map((_, y) =>
          Array.from({ length: gridWidth }).map((_, x) => (
            <div
              key={`cell-${y}-${x}`}
              className="bg-gray-900/50"
              style={{ width: "30px", height: "30px" }}
            />
          ))
        )}

        {/* Ghost piece */}
        {currentPiece &&
          ghostPosition &&
          currentPiece.shape.map((row, y) =>
            row.map((cell, x) =>
              cell ? (
                <div
                  key={`ghost-${y}-${x}`}
                  className="absolute border border-white/30"
                  style={{
                    width: "28px",
                    height: "28px",
                    backgroundColor: `${currentPiece.color}30`,
                    border: `1px dashed ${currentPiece.color}`,
                    left: `${(ghostPosition.x + x) * 31}px`,
                    bottom: `${(ghostPosition.y - y) * 31}px`,
                    zIndex: 1,
                  }}
                />
              ) : null
            )
          )}

        {/* Placed blocks */}
        {grid.map((row, y) =>
          row.map((cell, x) =>
            cell ? (
              <div
                key={`block-${y}-${x}`}
                className={`absolute ${
                  clearedLines.includes(y) ? "animate-pulse" : ""
                }`}
                style={{
                  width: "28px",
                  height: "28px",
                  backgroundColor: cubeColors[cell - 1],
                  border: `1px solid ${cubeColors[cell - 1]}99`,
                  boxShadow: `inset 0 0 8px rgba(255,255,255,0.5)${
                    clearedLines.includes(y) ? ", 0 0 10px white" : ""
                  }`,
                  left: `${x * 31}px`,
                  bottom: `${y * 31}px`,
                  zIndex: 2,
                }}
              />
            ) : null
          )
        )}

        {/* Current piece */}
        {currentPiece &&
          currentPiece.shape.map((row, y) =>
            row.map((cell, x) =>
              cell ? (
                <div
                  key={`current-${y}-${x}`}
                  className="absolute"
                  style={{
                    width: "28px",
                    height: "28px",
                    backgroundColor: currentPiece.color,
                    border: `1px solid ${currentPiece.color}99`,
                    boxShadow: "inset 0 0 8px rgba(255,255,255,0.5)",
                    left: `${(currentPiece.position.x + x) * 31}px`,
                    bottom: `${(currentPiece.position.y - y) * 31}px`,
                    zIndex: 3,
                  }}
                />
              ) : null
            )
          )}
      </motion.div>
    );
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
            background: `radial-gradient(circle at ${ambientLightPosition.x}% ${ambientLightPosition.y}%, ${mainColor}20 0%, transparent 70%)`,
            filter: "blur(40px)",
          }}
        />
      </div>

      {/* Atmosphere effect with ripples */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Central energy pulse */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            width: "300px",
            height: "300px",
            background: `radial-gradient(circle, ${mainColor}30 0%, transparent 70%)`,
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
              ease: "easeOut",
            }}
            style={{
              width: "100px",
              height: "100px",
            }}
          />
        ))}
      </div>

      {/* Header with advanced styling */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.3 }}
        className="text-center mb-6"
      >
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-2 font-pixel tracking-wider">
          CRYPTIC REALM
        </h1>

        <div className="flex items-center justify-center gap-4">
          <div className="h-px w-16 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
          <p className="text-xl text-blue-300 font-light">Tetris Evolution</p>
          <div className="h-px w-16 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
        </div>
      </motion.div>

      {/* Main game layout */}
      <div className="relative z-10 flex flex-row items-start justify-center gap-8">
        {/* Left panel - Game information */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="bg-black/50 backdrop-blur-md rounded-lg p-4 max-w-xs self-start border border-purple-500/20"
        >
          <h3 className="text-purple-400 font-bold mb-2 text-lg">
            {gameState === "playing" ? "Game Status" : "Tetris Evolution"}
          </h3>

          {gameState === "waiting" && (
            <ul className="text-gray-300 text-sm space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Arrange falling blocks to create complete lines</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>
                  Use arrow keys to move the pieces left, right and down
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Press Z to rotate and Space for hard drop</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>Hold pieces with C key for strategic gameplay</span>
              </li>
            </ul>
          )}

          {(gameState === "playing" ||
            gameState === "paused" ||
            gameState === "gameOver") && (
            <div className="bg-black/30 p-3 rounded-lg text-sm">
              <div className="grid grid-cols-2 gap-y-2">
                <div className="text-gray-300">Score:</div>
                <div className="text-right text-pink-300 font-bold">
                  {formatNumber(score)}
                </div>

                <div className="text-gray-300">Level:</div>
                <div className="text-right text-green-300 font-bold">
                  {level}
                </div>

                <div className="text-gray-300">Lines:</div>
                <div className="text-right text-blue-300 font-bold">
                  {lines}
                </div>

                <div className="text-gray-300">High Score:</div>
                <div className="text-right text-yellow-300 font-bold">
                  {formatNumber(highScore)}
                </div>
              </div>
            </div>
          )}

          {/* Held piece and next piece previews */}
          <div className="flex flex-col gap-4 mt-4">
            <div className="flex flex-col items-center p-3 bg-black/40 border border-gray-800 rounded-lg backdrop-blur-sm">
              {renderPiecePreview(heldPiece, "HOLD (C)")}
            </div>

            <div className="flex flex-col items-center p-3 bg-black/40 border border-gray-800 rounded-lg backdrop-blur-sm">
              {renderPiecePreview(nextPiece, "NEXT")}
            </div>
          </div>

          {/* Game controls */}
          <div className="mt-4 flex flex-col gap-2">
            {gameState === "waiting" && (
              <button
                onClick={startGame}
                className="w-full py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-md font-pixel transition-transform hover:scale-105 active:scale-95"
              >
                Start Game
              </button>
            )}

            {gameState === "playing" && (
              <button
                onClick={() => setGameState("paused")}
                className="w-full py-2 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white rounded-md font-pixel transition-transform hover:scale-105 active:scale-95"
              >
                Pause Game
              </button>
            )}

            {gameState === "paused" && (
              <button
                onClick={() => setGameState("playing")}
                className="w-full py-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white rounded-md font-pixel transition-transform hover:scale-105 active:scale-95"
              >
                Resume Game
              </button>
            )}

            {gameState === "gameOver" && (
              <button
                onClick={startGame}
                className="w-full py-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white rounded-md font-pixel transition-transform hover:scale-105 active:scale-95"
              >
                Play Again
              </button>
            )}

            <button
              onClick={onReturn}
              className="w-full py-2 bg-black border border-purple-500/50 hover:bg-purple-900/20 text-white rounded-md font-pixel transition-transform hover:scale-105 active:scale-95"
            >
              Return to Hub
            </button>

            <button
              onClick={() => setShowControls(!showControls)}
              className="w-full py-2 bg-black border border-blue-500/50 hover:bg-blue-900/20 text-white rounded-md font-pixel transition-transform hover:scale-105 active:scale-95"
            >
              {showControls ? "Hide Controls" : "Show Controls"}
            </button>
          </div>
        </motion.div>

        {/* Center - Game Grid */}
        <div className="flex flex-col">
          {/* Game status indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mb-2 text-center backdrop-blur-sm bg-black/20 px-6 py-2 rounded-lg border border-purple-500/20"
          >
            <div className="flex items-center justify-center gap-4 mb-1">
              <div className="text-lg text-gray-300">Status</div>
              <div className="text-lg font-medium">
                {gameState === "waiting" ? (
                  <span className="text-blue-300">Ready to Start</span>
                ) : gameState === "playing" ? (
                  <span className="text-green-300">Playing</span>
                ) : gameState === "paused" ? (
                  <span className="text-amber-300">Paused</span>
                ) : (
                  <span className="text-red-300">Game Over</span>
                )}
              </div>
              <div className="h-4 w-px bg-purple-500/30"></div>
              <div className="text-lg text-gray-300">Level</div>
              <motion.div
                key={level}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5 }}
                className="text-lg text-pink-300 font-bold"
              >
                {level}
              </motion.div>
            </div>
          </motion.div>

          {/* Game grid */}
          <div className="relative flex justify-center">{renderGrid()}</div>

          {/* Controls hint below the grid */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-4 text-center text-gray-300 text-sm bg-black/30 py-2 px-4 rounded-md border border-purple-500/20"
          >
            <span className="flex items-center justify-center gap-2">
              Move: Arrow Keys &nbsp;|&nbsp; Rotate: Z &nbsp;|&nbsp; Hard Drop:
              Space &nbsp;|&nbsp; Hold: C
            </span>
          </motion.div>
        </div>
      </div>

      {/* Controls help overlay */}
      {showControls && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center p-6 rounded-lg backdrop-blur-sm bg-black/80 border border-blue-500/30 max-w-md"
          >
            <h2 className="text-2xl font-bold text-blue-400 mb-4">
              KEYBOARD CONTROLS
            </h2>

            <div className="flex flex-col gap-3 mb-4 text-left">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-gray-300">←</div>
                <div className="text-white">Move Left</div>

                <div className="text-gray-300">→</div>
                <div className="text-white">Move Right</div>

                <div className="text-gray-300">↓</div>
                <div className="text-white">Move Down</div>

                <div className="text-gray-300">Z</div>
                <div className="text-white">Rotate</div>

                <div className="text-gray-300">C</div>
                <div className="text-white">Hold Piece</div>

                <div className="text-gray-300">Space</div>
                <div className="text-white">Hard Drop</div>

                <div className="text-gray-300">P / Esc</div>
                <div className="text-white">Pause/Resume</div>

                <div className="text-gray-300">H</div>
                <div className="text-white">Show/Hide Help</div>
              </div>
            </div>

            <button
              onClick={() => setShowControls(false)}
              className="px-6 py-2 bg-blue-600 rounded-md text-white font-bold hover:bg-blue-500 transition-all duration-300"
            >
              CLOSE
            </button>
          </motion.div>
        </div>
      )}

      {/* Global styles */}
      <style jsx global>{`
        .font-pixel {
          font-family: "Press Start 2P", monospace;
          letter-spacing: 0.05em;
        }
      `}</style>
    </div>
  );
};

export default CrypticRealm;
