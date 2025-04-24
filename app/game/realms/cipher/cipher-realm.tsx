import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import RealmCube from "../../cube/realm-cube";
import { cubeCollection } from "../../cube/realm-cube";

// Cipher Realm: Symbol Sliding Puzzle Game
interface CipherSlidingPuzzleProps {
  onReturn: () => void;
  selectedCubeId?: string;
}

// Game states
type GameState = "intro" | "playing" | "solved" | "tutorial";

// Difficulty levels
enum Difficulty {
  Easy = "easy",
  Medium = "medium",
  Hard = "hard",
}

// Tile interface
interface Tile {
  id: number;
  symbol: string;
  position: number; // 0-based index of position in the grid
  correctPosition: number; // Where this tile should be in the solved state
  isBlank: boolean;
}

// Level interface
interface Level {
  id: number;
  name: string;
  gridSize: number; // 3 = 3x3 grid, 4 = 4x4 grid, etc.
  tiles: Tile[];
  difficulty: Difficulty;
  description: string;
  completionMessage: string;
  symbolType: "runes" | "glyphs" | "sigils" | "ciphers" | "mixed";
}

// Expanded symbol library with more symbols
const symbolLibrary = {
  runes: [
    "ᚠ",
    "ᚢ",
    "ᚦ",
    "ᚨ",
    "ᚱ",
    "ᚲ",
    "ᚷ",
    "ᚹ",
    "ᚺ",
    "ᚾ",
    "ᛁ",
    "ᛃ",
    "ᛇ",
    "ᛈ",
    "ᛉ",
    "ᛊ",
    "ᛏ",
    "ᛒ",
    "ᛖ",
    "ᛗ",
    "ᛚ",
    "ᛜ",
    "ᛟ",
    "ᛞ",
    "ᛡ",
    "ᛢ",
    "ᛣ",
    "ᛤ",
    "ᛥ",
    "ᛦ",
    "ᛧ",
    "ᛨ",
    "ᛩ",
    "ᛪ",
  ],
  glyphs: [
    "⚹",
    "⚶",
    "⚸",
    "⚵",
    "⚴",
    "♅",
    "♆",
    "♇",
    "⚯",
    "⚮",
    "⚭",
    "⚬",
    "⚪",
    "⚫",
    "⚰",
    "⚱",
    "⚲",
    "⚳",
    "✧",
    "✦",
    "✮",
    "✭",
    "✯",
    "✰",
    "⊝",
    "⊞",
    "⊟",
    "⊕",
    "⊖",
    "⊗",
    "⊘",
    "⊙",
    "⊛",
    "⊜",
  ],
  sigils: [
    "⛤",
    "⛥",
    "⛦",
    "⛧",
    "⚕",
    "⚚",
    "⚛",
    "⚜",
    "⚝",
    "⚞",
    "⚟",
    "⚠",
    "⚡",
    "⚢",
    "⚣",
    "⚤",
    "⚥",
    "⚦",
    "⚧",
    "⚨",
    "⚩",
    "⚪",
    "⚫",
    "⚬",
    "⚲",
    "⚴",
    "⚵",
    "⚾",
    "♁",
    "♇",
    "☉",
    "☿",
    "♃",
    "♄",
  ],
  ciphers: [
    "⊕",
    "⊖",
    "⊗",
    "⊘",
    "⊙",
    "⊚",
    "⊛",
    "⊜",
    "⊝",
    "⊞",
    "⊟",
    "⊠",
    "⊡",
    "⊢",
    "⊣",
    "⊤",
    "⊥",
    "⊦",
    "⊧",
    "⊨",
    "⊩",
    "⊪",
    "⊫",
    "⊬",
    "⊭",
    "⊮",
    "⊯",
    "⊰",
    "⊱",
    "⊲",
    "⊳",
    "⊴",
    "⊵",
    "⊶",
  ],
  // Additional mixed symbols for the most complex puzzles
  mixed: [
    "℀",
    "℁",
    "ℂ",
    "℃",
    "℄",
    "℅",
    "℆",
    "ℇ",
    "℈",
    "℉",
    "ℊ",
    "ℋ",
    "ℌ",
    "ℍ",
    "ℎ",
    "ℏ",
    "ℐ",
    "ℑ",
    "ℒ",
    "ℓ",
    "℔",
    "ℕ",
    "№",
    "℗",
    "℘",
    "ℙ",
    "ℚ",
    "ℛ",
    "ℜ",
    "ℝ",
    "℞",
    "℟",
    "℠",
    "℡",
  ],
};

// Create levels with increasing difficulty
const generateLevels = (): Level[] => {
  const levels: Level[] = [];

  // 3x3 Easy Level (Runes)
  const level1Tiles = generateTiles(3, "runes");
  levels.push({
    id: 1,
    name: "RUNIC CIPHER",
    gridSize: 3,
    tiles: level1Tiles,
    difficulty: Difficulty.Easy,
    description:
      "Decode the ancient runic sequence by arranging the symbols in the correct order.",
    completionMessage: "Runic cipher decoded. Ancient knowledge unlocked.",
    symbolType: "runes",
  });

  // 4x4 Medium Level (Glyphs)
  const level2Tiles = generateTiles(4, "glyphs");
  levels.push({
    id: 2,
    name: "ASTRAL GLYPH MATRIX",
    gridSize: 4,
    tiles: level2Tiles,
    difficulty: Difficulty.Medium,
    description: "Align the astral glyphs to unlock the celestial pattern.",
    completionMessage: "Astral matrix aligned. Celestial wisdom revealed.",
    symbolType: "glyphs",
  });

  // 4x4 Hard Level (Sigils)
  const level3Tiles = generateTiles(4, "sigils");
  levels.push({
    id: 3,
    name: "ARCANE SIGIL NEXUS",
    gridSize: 4,
    tiles: level3Tiles,
    difficulty: Difficulty.Hard,
    description:
      "Reconfigure the arcane sigil nexus to open the dimensional gateway.",
    completionMessage:
      "Arcane nexus activated. Dimensional barriers transcended.",
    symbolType: "sigils",
  });

  // 5x5 Hard Level (Ciphers)
  const level4Tiles = generateTiles(5, "ciphers");
  levels.push({
    id: 4,
    name: "QUANTUM CIPHER LATTICE",
    gridSize: 5,
    tiles: level4Tiles,
    difficulty: Difficulty.Hard,
    description:
      "Arrange the quantum ciphers to decode the multidimensional pattern.",
    completionMessage:
      "Quantum lattice resolved. Ultimate cipher mastery achieved.",
    symbolType: "ciphers",
  });

  // 6x6 Expert Level (Mixed symbols)
  const level5Tiles = generateTiles(6, "mixed");
  levels.push({
    id: 5,
    name: "INTERDIMENSIONAL MATRIX",
    gridSize: 6,
    tiles: level5Tiles,
    difficulty: Difficulty.Hard,
    description:
      "Synchronize the interdimensional symbols to unlock the multiverse nexus.",
    completionMessage:
      "Dimensional synchronization complete. Multiverse nexus accessed.",
    symbolType: "mixed",
  });

  return levels;
};

// Generate tiles for a level based on grid size and symbol type
const generateTiles = (
  gridSize: number,
  symbolType: "runes" | "glyphs" | "sigils" | "ciphers" | "mixed"
): Tile[] => {
  const totalTiles = gridSize * gridSize;
  // Make sure we have enough symbols for the grid size
  const symbols = symbolLibrary[symbolType].slice(0, totalTiles - 1); // One less because of the blank tile

  const tiles: Tile[] = [];

  // Create all tiles in their correct positions first
  for (let i = 0; i < totalTiles - 1; i++) {
    tiles.push({
      id: i + 1,
      symbol: symbols[i],
      position: i,
      correctPosition: i,
      isBlank: false,
    });
  }

  // Add blank tile at the end
  tiles.push({
    id: totalTiles,
    symbol: "",
    position: totalTiles - 1,
    correctPosition: totalTiles - 1,
    isBlank: true,
  });

  return tiles;
};

// Shuffle the tiles to create a solvable puzzle
const shuffleTiles = (tiles: Tile[], gridSize: number): Tile[] => {
  // Clone the tiles array to avoid modifying the original
  let shuffled = [...tiles];

  // Perform random valid moves (increased number for better shuffling)
  const totalMoves = gridSize * gridSize * 10; // Double the moves for better shuffling

  for (let i = 0; i < totalMoves; i++) {
    // Find the blank tile
    const blankIndex = shuffled.findIndex((tile) => tile.isBlank);
    if (blankIndex === -1) continue; // Safety check

    const blankPosition = shuffled[blankIndex].position;

    // Find valid moves (adjacent tiles)
    const validMoves = getValidMoves(blankPosition, gridSize);
    if (validMoves.length === 0) continue; // Safety check

    // Pick a random valid move
    const randomMoveIndex = Math.floor(Math.random() * validMoves.length);
    const tileToMovePosition = validMoves[randomMoveIndex];

    // Find the tile at this position
    const tileToMoveIndex = shuffled.findIndex(
      (tile) => tile.position === tileToMovePosition
    );
    if (tileToMoveIndex === -1) continue; // Safety check

    // Swap positions
    shuffled[blankIndex].position = tileToMovePosition;
    shuffled[tileToMoveIndex].position = blankPosition;
  }

  return shuffled;
};

// Get valid moves for the blank tile
const getValidMoves = (blankPosition: number, gridSize: number): number[] => {
  const validMoves: number[] = [];

  // Check up
  if (blankPosition >= gridSize) {
    validMoves.push(blankPosition - gridSize);
  }

  // Check down
  if (blankPosition < gridSize * (gridSize - 1)) {
    validMoves.push(blankPosition + gridSize);
  }

  // Check left
  if (blankPosition % gridSize !== 0) {
    validMoves.push(blankPosition - 1);
  }

  // Check right
  if (blankPosition % gridSize !== gridSize - 1) {
    validMoves.push(blankPosition + 1);
  }

  return validMoves;
};

// Check if the puzzle is solved
const isPuzzleSolved = (tiles: Tile[]): boolean => {
  return tiles.every((tile) => tile.position === tile.correctPosition);
};

// Main component
const CipherRealm: React.FC<CipherSlidingPuzzleProps> = ({
  onReturn,
  selectedCubeId = "pink-neon",
}) => {
  // Game state
  const [gameState, setGameState] = useState<GameState>("intro");
  const [levels] = useState<Level[]>(generateLevels());
  const [currentLevel, setCurrentLevel] = useState<number>(0);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [moveCount, setMoveCount] = useState<number>(0);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);
  const [isSolving, setIsSolving] = useState<boolean>(false);
  const [cubeGlowing, setCubeGlowing] = useState<boolean>(false);
  const [showSolvedMessage, setShowSolvedMessage] = useState<boolean>(false);
  const [linkStatus, setLinkStatus] = useState<number>(0); // 0: inactive, 1: partially active, 2: fully active

  // Audio refs
  const ambientSoundRef = useRef<HTMLAudioElement | null>(null);
  const tileMoveRef = useRef<HTMLAudioElement | null>(null);
  const solvedSoundRef = useRef<HTMLAudioElement | null>(null);

  // Add state for combined cube collection
  const [combinedCubeCollection, setCombinedCubeCollection] =
    useState<any[]>(cubeCollection);

  // Add handler for cube collection updates
  const handleCubeCollectionUpdate = (collection: any[]) => {
    console.log("Cipher Realm received cube collection:", collection.length);
    setCombinedCubeCollection(collection);
  };

  // Selected cube info
  const selectedCube =
    combinedCubeCollection.find((cube) => cube.id === selectedCubeId) ||
    combinedCubeCollection[0];

  // Helper to convert hex to rgb for rgba strings
  const hexToRgb = (hex: string) => {
    // Remove # if present
    hex = hex.replace(/^#/, "");

    // Parse hex values
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    return `${r}, ${g}, ${b}`;
  };

  // Get cube color based on selected cube
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

  // Setup audio effects
  useEffect(() => {
    // Create ambient sound
    const ambientSound = new Audio("/audio/cipher-ambient.mp3");
    ambientSound.loop = true;
    ambientSound.volume = 0.3;
    ambientSoundRef.current = ambientSound;

    // Tile move sound
    const tileMove = new Audio("/audio/select.mp3");
    tileMove.volume = 0.4;
    tileMoveRef.current = tileMove;

    // Solved sound
    const solvedSound = new Audio("/audio/level-complete.mp3");
    solvedSound.volume = 0.7;
    solvedSoundRef.current = solvedSound;

    // Start ambient sound if playing
    if (gameState === "playing" || gameState === "tutorial") {
      ambientSoundRef.current?.play().catch((error) => {
        console.error("Audio playback failed:", error);
      });
    }

    return () => {
      // Cleanup
      ambientSoundRef.current?.pause();
      ambientSoundRef.current = null;
      tileMoveRef.current = null;
      solvedSoundRef.current = null;
    };
  }, [gameState]);

  // Initialize level when starting or changing levels
  useEffect(() => {
    if (gameState === "playing") {
      // Immediately prevent completion checking
      setIsSolving(true);

      // Get the current level configuration
      const level = levels[currentLevel];

      // CRITICAL FIX: Generate completely fresh tiles instead of using cached ones
      // This ensures we don't have any stale state between levels
      const freshTiles = generateTiles(level.gridSize, level.symbolType);

      // Shuffle the tiles
      let shuffledTiles = shuffleTiles(freshTiles, level.gridSize);

      // CRITICAL FIX: Guarantee the puzzle is not solved by deliberately
      // swapping positions of at least two non-blank tiles
      const nonBlankTiles = shuffledTiles.filter((tile) => !tile.isBlank);
      if (nonBlankTiles.length >= 2) {
        // Find indices of the first two non-blank tiles
        const tile1Index = shuffledTiles.findIndex(
          (t) => t.id === nonBlankTiles[0].id
        );
        const tile2Index = shuffledTiles.findIndex(
          (t) => t.id === nonBlankTiles[1].id
        );

        // Swap their positions to ensure the puzzle is not solved
        const tempPosition = shuffledTiles[tile1Index].position;
        shuffledTiles[tile1Index].position = shuffledTiles[tile2Index].position;
        shuffledTiles[tile2Index].position = tempPosition;
      }

      // Add an additional third tile swap for extra insurance if needed
      if (nonBlankTiles.length >= 3) {
        const tile2Index = shuffledTiles.findIndex(
          (t) => t.id === nonBlankTiles[1].id
        );
        const tile3Index = shuffledTiles.findIndex(
          (t) => t.id === nonBlankTiles[2].id
        );

        const tempPosition = shuffledTiles[tile2Index].position;
        shuffledTiles[tile2Index].position = shuffledTiles[tile3Index].position;
        shuffledTiles[tile3Index].position = tempPosition;
      }

      // Reset the game state with our guaranteed unsolved puzzle
      setTiles(shuffledTiles);
      setMoveCount(0);
      setLinkStatus(0);

      // Use a longer delay before allowing completion checking
      // This ensures any state updates have fully settled
      setTimeout(() => {
        setIsSolving(false);
      }, 1000);
    }
  }, [gameState, currentLevel, levels]);

  // Calculate puzzle completion percentage for link visual
  useEffect(() => {
    if (gameState === "playing" && tiles.length > 0 && isPuzzleSolved(tiles)) {
      // Play solved sound
      solvedSoundRef.current?.play().catch((error) => {
        console.error("Audio playback failed:", error);
      });

      // Mark level as completed
      setCompletedLevels((prev) => {
        if (!prev.includes(currentLevel)) {
          return [...prev, currentLevel];
        }
        return prev;
      });

      // Show completion animation - only glow, no rotation
      setCubeGlowing(true);
      setShowSolvedMessage(true);
      setLinkStatus(2); // Fully active link

      // Move to solved state after delay
      setTimeout(() => {
        setGameState("solved");
        setCubeGlowing(false);
        setShowSolvedMessage(false);
      }, 3000);
    }
  }, [tiles, gameState, currentLevel, completedLevels]);

  // Check for puzzle completion
  useEffect(() => {
    // Only check for completion if:
    // 1. We're in playing state
    // 2. We're not in solving/initialization state
    // 3. We have tiles to check
    // 4. The move count is > 0 (player has made at least one move)
    if (
      gameState === "playing" &&
      !isSolving &&
      tiles.length > 0 &&
      moveCount > 0
    ) {
      // Check if puzzle is solved
      const solved = tiles.every(
        (tile) => tile.position === tile.correctPosition
      );

      if (solved) {
        // Prevent further interactions during completion animation
        setIsSolving(true);

        // Play solved sound
        solvedSoundRef.current?.play().catch((error) => {
          console.error("Audio playback failed:", error);
        });

        // Mark level as completed
        setCompletedLevels((prev) => {
          if (!prev.includes(currentLevel)) {
            return [...prev, currentLevel];
          }
          return prev;
        });

        // Show completion animation - only glow, no rotation
        setCubeGlowing(true);
        setShowSolvedMessage(true);
        setLinkStatus(2); // Fully active link

        // Move to solved state after delay
        setTimeout(() => {
          setGameState("solved");
          setCubeGlowing(false);
          setShowSolvedMessage(false);
        }, 3000);
      }
    }
  }, [tiles, gameState, currentLevel, completedLevels, isSolving, moveCount]);

  // Modify handleTileClick to also check for puzzle completion
  const handleTileClick = (tileId: number) => {
    // Don't allow moves during solving state or when not playing
    if (gameState !== "playing" || isSolving) return;

    const level = levels[currentLevel];
    const gridSize = level.gridSize;

    // Find the clicked tile
    const tileIndex = tiles.findIndex((tile) => tile.id === tileId);
    if (tileIndex === -1) return;

    const clickedTile = tiles[tileIndex];

    // Find the blank tile
    const blankTileIndex = tiles.findIndex((tile) => tile.isBlank);
    if (blankTileIndex === -1) return; // Extra safety check

    const blankTile = tiles[blankTileIndex];

    // Check if move is valid (tiles are adjacent)
    const validMoves = getValidMoves(blankTile.position, gridSize);
    if (!validMoves.includes(clickedTile.position)) return;

    // Play move sound
    tileMoveRef.current?.play().catch((error) => {
      console.error("Audio playback failed:", error);
    });

    // Update positions
    setTiles((prev) => {
      const updated = [...prev];
      updated[tileIndex] = { ...clickedTile, position: blankTile.position };
      updated[blankTileIndex] = {
        ...blankTile,
        position: clickedTile.position,
      };
      return updated;
    });

    // Increment move counter
    setMoveCount((prev) => prev + 1);
  };

  // Show or hide hint
  const toggleHint = () => {
    setShowHint(!showHint);
  };

  // Reset current level
  const restartLevel = () => {
    const level = levels[currentLevel];
    const shuffledTiles = shuffleTiles(level.tiles, level.gridSize);
    setTiles(shuffledTiles);
    setMoveCount(0);
    setLinkStatus(0);
  };

  // Move to next level
  const nextLevel = () => {
    if (currentLevel < levels.length - 1) {
      // First clear the current state
      setTiles([]);
      setIsSolving(true); // Prevent any completion checks during transition
      setCubeGlowing(false);
      setShowSolvedMessage(false);
      setMoveCount(0);

      // Use setTimeout to ensure state updates have propagated
      setTimeout(() => {
        // Increment the level
        setCurrentLevel((prev) => prev + 1);

        // Small delay before changing game state
        setTimeout(() => {
          setGameState("playing");
        }, 100);
      }, 100);
    } else {
      // All levels completed
      setGameState("intro");
    }
  };

  // Start game from intro
  const startGame = () => {
    setGameState("tutorial");
  };

  // Start playing after tutorial
  const startPlaying = () => {
    setGameState("playing");
  };

  // Render the intro screen
  // Complete fix for the intro screen layout to properly position the cube
  // This ensures the cube appears above the selection menu without overlapping

  const renderIntroScreen = () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white overflow-hidden p-8">
      <div className="max-w-3xl mx-auto text-center z-10 flex flex-col items-center">
        {/* Title */}
        <motion.h1
          className="text-6xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-600"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          CIPHER PUZZLE
        </motion.h1>

        <motion.p
          className="text-xl text-gray-300 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
        >
          Rearrange the mystic symbols to unlock ancient knowledge.
        </motion.p>

        {/* Cube positioned in its own section above the selection */}
        <motion.div
          className="w-full mb-10 relative"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
        >
          {/* Background animated symbols */}
          <div className="absolute inset-0 -z-10 opacity-30">
            {Object.values(symbolLibrary)
              .flat()
              .slice(0, 20)
              .map((symbol, i) => (
                <motion.div
                  key={`bg-symbol-${i}`}
                  className="absolute text-4xl text-blue-500 opacity-40"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    opacity: [0.2, 0.5, 0.2],
                    rotate: [0, Math.random() > 0.5 ? 360 : -360],
                  }}
                  transition={{
                    duration: 10 + Math.random() * 20,
                    repeat: Infinity,
                    delay: Math.random() * 5,
                  }}
                >
                  {symbol}
                </motion.div>
              ))}
          </div>

          <div className="relative flex justify-center h-[200px]">
            {/* Orbiting grid elements */}
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={`orbit-${i}`}
                className="absolute rounded-md border border-blue-500/50 bg-blue-900/10"
                animate={{
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 15,
                  repeat: Infinity,
                  ease: "linear",
                  delay: i * 2.5,
                }}
                style={{
                  width: 160 + i * 20,
                  height: 160 + i * 20,
                  top: "50%",
                  left: "50%",
                  marginLeft: -80 - i * 10,
                  marginTop: -80 - i * 10,
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Level selection section with clear separation */}
        <motion.div
          className="w-full mt-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.7 }}
        >
          <h3 className="text-xl font-bold text-indigo-300 mb-4">
            SELECT CIPHER DIFFICULTY
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {levels.map((level, index) => (
              <button
                key={level.id}
                onClick={() => {
                  setCurrentLevel(index);
                  startGame();
                }}
                className={`p-4 rounded-lg border transition-all duration-300 ${
                  completedLevels.includes(index)
                    ? "border-green-500 bg-green-900/20 text-green-300"
                    : "border-blue-700 bg-blue-900/20 text-blue-300 hover:bg-blue-800/30"
                }`}
              >
                <div className="text-sm font-bold">{level.name}</div>
                <div className="mt-1 text-xs opacity-70">
                  {level.difficulty === Difficulty.Easy
                    ? "Easy"
                    : level.difficulty === Difficulty.Medium
                    ? "Medium"
                    : "Hard"}
                </div>
                <div className="mt-2 text-xs">
                  {level.gridSize}×{level.gridSize} Grid
                </div>
                {completedLevels.includes(index) && (
                  <div className="mt-2 text-xs text-green-300">✓ Completed</div>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Return button */}
        <motion.button
          onClick={onReturn}
          className="px-6 py-3 mt-8 text-base bg-black/50 backdrop-blur-sm border border-blue-500/30 text-blue-400 hover:bg-blue-900/20 transition-colors rounded-lg shadow-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          style={{
            boxShadow: "0 0 15px rgba(59, 130, 246, 0.2)",
          }}
        >
          RETURN TO HUB
        </motion.button>
      </div>
    </div>
  );

  // Render the tutorial screen
  const renderTutorialScreen = () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-8">
      <div className="max-w-3xl mx-auto text-center relative z-10">
        <motion.h2
          className="text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-600"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          CIPHER PUZZLE PROTOCOLS
        </motion.h2>

        <motion.div
          className="bg-gray-800 bg-opacity-70 p-8 rounded-lg border border-indigo-500 shadow-lg mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className="text-2xl text-indigo-400 mb-4">Mission Directives:</h3>

          <ul className="text-left space-y-4 mb-6">
            <li className="flex items-start">
              <span className="text-indigo-300 text-xl mr-2 mt-1">⊛</span>
              <span>
                Rearrange the mystic symbols into their correct sequence by
                sliding them into the empty space.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-300 text-xl mr-2 mt-1">⊛</span>
              <span>
                You can only move tiles that are adjacent to the empty space
                (up, down, left, or right).
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-300 text-xl mr-2 mt-1">⊛</span>
              <span>
                The goal pattern is shown on the right side for reference.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-300 text-xl mr-2 mt-1">⊛</span>
              <span>
                As you solve the puzzle, the energy link between the puzzle,
                cube, and goal will activate.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-300 text-xl mr-2 mt-1">⊛</span>
              <span>
                When the puzzle is complete, the cube will activate and
                illuminate, channeling energy between both sides.
              </span>
            </li>
          </ul>

          <h3 className="text-2xl text-indigo-400 mb-4">Controls:</h3>

          <ul className="text-left space-y-4">
            <li className="flex items-start">
              <span className="text-indigo-300 text-xl mr-2 mt-1">⊛</span>
              <span>
                <span className="text-blue-400">Click</span> on a tile adjacent
                to the empty space to move it.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-300 text-xl mr-2 mt-1">⊛</span>
              <span>
                Use the <span className="text-blue-400">Hint</span> button to
                highlight correct tile positions.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-300 text-xl mr-2 mt-1">⊛</span>
              <span>
                Use <span className="text-blue-400">Restart</span> to reshuffle
                the current puzzle.
              </span>
            </li>
          </ul>
        </motion.div>

        <motion.div
          className="flex justify-center space-x-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <motion.button
            onClick={startPlaying}
            className="px-8 py-4 text-lg bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white rounded-lg shadow-lg transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            style={{
              boxShadow: "0 0 20px rgba(59, 130, 246, 0.3)",
            }}
          >
            BEGIN CIPHER PUZZLE
          </motion.button>

          <button
            onClick={() => setGameState("intro")}
            className="px-8 py-4 text-lg bg-black/50 backdrop-blur-sm border border-blue-500/30 text-blue-400 hover:bg-blue-900/20 transition-colors rounded-lg shadow-lg"
            style={{
              boxShadow: "0 0 15px rgba(59, 130, 246, 0.2)",
            }}
          >
            RETURN
          </button>
        </motion.div>
      </div>

      {/* Background symbols */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => {
          const symbolTypes = Object.keys(symbolLibrary) as Array<
            keyof typeof symbolLibrary
          >;
          const randomType =
            symbolTypes[Math.floor(Math.random() * symbolTypes.length)];
          const randomSymbol =
            symbolLibrary[randomType][
              Math.floor(Math.random() * symbolLibrary[randomType].length)
            ];

          return (
            <motion.div
              key={`tutorial-bg-${i}`}
              className="absolute text-3xl text-indigo-500 opacity-20"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0.1, 0.3, 0.1],
                y: [0, Math.random() * 30 - 15],
              }}
              transition={{
                duration: 5 + Math.random() * 10,
                repeat: Infinity,
                repeatType: "reverse",
                delay: Math.random() * 5,
              }}
            >
              {randomSymbol}
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  // Render the goal pattern grid (solution reference)
  const renderGoalGrid = (level: Level) => {
    const gridSize = level.gridSize;

    // Generate ordered tiles for the goal display
    const orderedTiles = [...level.tiles].sort(
      (a, b) => a.correctPosition - b.correctPosition
    );

    return (
      <div
        className="bg-gray-800 bg-opacity-50 p-4 rounded-lg border border-indigo-900 shadow-lg"
        style={{
          width: `${Math.min(300, Math.max(200, gridSize * 60))}px`,
          height: `${Math.min(300, Math.max(200, gridSize * 60))}px`,
        }}
      >
        <h3 className="text-center text-indigo-300 text-sm mb-2">
          GOAL PATTERN
        </h3>

        <div className="relative w-full h-[90%]">
          {/* Grid lines */}
          <div className="absolute inset-0 z-10 pointer-events-none">
            {/* Vertical lines */}
            {Array.from({ length: gridSize - 1 }).map((_, i) => (
              <div
                key={`goal-v-line-${i}`}
                className="absolute top-0 bottom-0 w-px bg-indigo-900/40"
                style={{
                  left: `${((i + 1) / gridSize) * 100}%`,
                }}
              />
            ))}

            {/* Horizontal lines */}
            {Array.from({ length: gridSize - 1 }).map((_, i) => (
              <div
                key={`goal-h-line-${i}`}
                className="absolute left-0 right-0 h-px bg-indigo-900/40"
                style={{
                  top: `${((i + 1) / gridSize) * 100}%`,
                }}
              />
            ))}
          </div>

          {/* Goal tiles */}
          {orderedTiles.map((tile) => {
            // Skip rendering the blank tile
            if (tile.isBlank) return null;

            // Calculate position based on grid
            const row = Math.floor(tile.correctPosition / gridSize);
            const col = tile.correctPosition % gridSize;

            return (
              <div
                key={`goal-tile-${tile.id}`}
                className="absolute"
                style={{
                  width: `${100 / gridSize}%`,
                  height: `${100 / gridSize}%`,
                  top: `${row * (100 / gridSize)}%`,
                  left: `${col * (100 / gridSize)}%`,
                }}
              >
                <div
                  className="w-[90%] h-[90%] mx-auto my-auto mt-[5%] rounded-md flex items-center justify-center 
                    text-xl md:text-2xl border-2 bg-gray-800/70 border-indigo-900/70 text-indigo-300/90"
                >
                  {tile.symbol}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render visual links between puzzle, cube, and goal
  const renderLinks = () => {
    const level = levels[currentLevel];
    const gridSize = level.gridSize;

    // Determine link color based on status
    const getLinkColor = (status: number) => {
      switch (status) {
        case 0: // Inactive
          return "rgba(99, 102, 241, 0.2)";
        case 1: // Partially active
          return "rgba(99, 102, 241, 0.5)";
        case 2: // Fully active
          return cubeGlowing ? cubeColor : "rgba(99, 102, 241, 0.8)";
        default:
          return "rgba(99, 102, 241, 0.2)";
      }
    };

    return (
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Left link (puzzle to cube) */}
        <svg
          className="absolute top-1/2 left-0 transform -translate-y-1/2"
          width="100%"
          height="10"
        >
          <motion.line
            x1="0"
            y1="5"
            x2="100%"
            y2="5"
            stroke={getLinkColor(linkStatus)}
            strokeWidth="2"
            strokeDasharray={linkStatus === 0 ? "5,5" : "none"}
            animate={{
              strokeWidth: cubeGlowing ? [2, 4, 2] : 2,
              opacity: cubeGlowing ? [0.8, 1, 0.8] : 1,
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Energy particles flowing from puzzle to cube when active */}
          {linkStatus > 0 &&
            [...Array(5)].map((_, i) => (
              <motion.circle
                key={`left-particle-${i}`}
                r="2"
                fill={getLinkColor(linkStatus)}
                animate={{
                  cx: ["0%", "100%"],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 2 + i * 0.5,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: "easeInOut",
                }}
              />
            ))}
        </svg>

        {/* Right link (cube to goal) */}
        <svg
          className="absolute top-1/2 right-0 transform -translate-y-1/2"
          width="100%"
          height="10"
        >
          <motion.line
            x1="0"
            y1="5"
            x2="100%"
            y2="5"
            stroke={getLinkColor(linkStatus)}
            strokeWidth="2"
            strokeDasharray={linkStatus === 0 ? "5,5" : "none"}
            animate={{
              strokeWidth: cubeGlowing ? [2, 4, 2] : 2,
              opacity: cubeGlowing ? [0.8, 1, 0.8] : 1,
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Energy particles flowing from cube to goal when active */}
          {linkStatus > 0 &&
            [...Array(5)].map((_, i) => (
              <motion.circle
                key={`right-particle-${i}`}
                r="2"
                fill={getLinkColor(linkStatus)}
                animate={{
                  cx: ["0%", "100%"],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 2 + i * 0.5,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: "easeInOut",
                }}
              />
            ))}
        </svg>
      </div>
    );
  };

  // Render the playing screen with the side-by-side layout
  const renderPlayingScreen = () => {
    const level = levels[currentLevel];
    const gridSize = level.gridSize;

    // Calculate the right dimension for the puzzle based on the grid size
    const getPuzzleDimension = (size: number): number => {
      switch (size) {
        case 3:
          return 280;
        case 4:
          return 320;
        case 5:
          return 350;
        case 6:
          return 380;
        default:
          return 300;
      }
    };

    const puzzleDimension = getPuzzleDimension(gridSize);

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
        {/* Header */}
        <div className="w-full max-w-6xl mb-6 px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <h2 className="text-xl md:text-2xl font-bold text-blue-400 mb-2 md:mb-0">
              {level.name}
              <span className="ml-2 text-sm text-gray-400">
                {level.difficulty === Difficulty.Easy
                  ? "LEVEL I"
                  : level.difficulty === Difficulty.Medium
                  ? "LEVEL II"
                  : "LEVEL III"}
              </span>
            </h2>

            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <span className="text-gray-400 mr-2">MOVES:</span>
                <span className="text-xl text-indigo-400 font-bold">
                  {moveCount}
                </span>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={toggleHint}
                  className="px-4 py-2 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-blue-200 text-sm rounded-md transition-colors shadow-md"
                  style={{
                    boxShadow: "0 0 10px rgba(59, 130, 246, 0.2)",
                  }}
                >
                  {showHint ? "HIDE HINT" : "HINT"}
                </button>

                <button
                  onClick={restartLevel}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm rounded-md transition-colors shadow-md"
                  style={{
                    boxShadow: "0 0 10px rgba(0, 0, 0, 0.3)",
                  }}
                >
                  RESTART
                </button>

                <button
                  onClick={() => setGameState("intro")}
                  className="px-4 py-2 bg-black/50 backdrop-blur-sm border border-blue-500/30 text-blue-400 hover:bg-blue-900/20 text-sm rounded-md transition-colors shadow-md"
                  style={{
                    boxShadow: "0 0 10px rgba(59, 130, 246, 0.2)",
                  }}
                >
                  EXIT
                </button>
              </div>
            </div>
          </div>

          <p className="text-gray-300 text-sm mt-2 text-center">
            {level.description}
          </p>
        </div>

        {/* Main content with the puzzle, cube, and goal */}
        <div className="w-full max-w-6xl relative flex flex-col md:flex-row items-center justify-between gap-0 p-4">
          {/* Links between elements */}
          {renderLinks()}

          {/* Left side - Current puzzle */}
          <div
            className="bg-gray-800 bg-opacity-50 p-4 rounded-lg border border-indigo-900 shadow-lg relative z-10"
            style={{
              width: `${puzzleDimension}px`,
              height: `${puzzleDimension}px`,
            }}
          >
            <h3 className="text-center text-indigo-300 text-sm mb-2">
              CURRENT ARRANGEMENT
            </h3>

            {/* Grid lines */}
            <div className="absolute inset-4 z-10 pointer-events-none">
              {/* Vertical lines */}
              {Array.from({ length: gridSize - 1 }).map((_, i) => (
                <div
                  key={`v-line-${i}`}
                  className="absolute top-0 bottom-0 w-px bg-indigo-900/40"
                  style={{
                    left: `${((i + 1) / gridSize) * 100}%`,
                  }}
                />
              ))}

              {/* Horizontal lines */}
              {Array.from({ length: gridSize - 1 }).map((_, i) => (
                <div
                  key={`h-line-${i}`}
                  className="absolute left-0 right-0 h-px bg-indigo-900/40"
                  style={{
                    top: `${((i + 1) / gridSize) * 100}%`,
                  }}
                />
              ))}
            </div>

            {/* Tiles */}
            <div className="relative w-full h-[90%]">
              {tiles.map((tile) => {
                // Calculate position based on grid
                const row = Math.floor(tile.position / gridSize);
                const col = tile.position % gridSize;

                // Skip rendering the blank tile
                if (tile.isBlank) return null;

                return (
                  <motion.div
                    key={tile.id}
                    className={`absolute cursor-pointer flex items-center justify-center
                      ${
                        showHint && tile.position !== tile.correctPosition
                          ? "opacity-50"
                          : "opacity-100"
                      }`}
                    style={{
                      width: `${100 / gridSize}%`,
                      height: `${100 / gridSize}%`,
                      top: `${row * (100 / gridSize)}%`,
                      left: `${col * (100 / gridSize)}%`,
                    }}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{
                      scale: 1,
                      opacity: 1,
                      backgroundColor:
                        showHint && tile.position === tile.correctPosition
                          ? "rgba(52, 211, 153, 0.2)" // Green tint for correct position
                          : "rgba(79, 70, 229, 0.2)", // Default background
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                      delay: tile.id * 0.05,
                    }}
                    onClick={() => handleTileClick(tile.id)}
                    whileHover={{ scale: 0.95 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <div
                      className={`w-[90%] h-[90%] rounded-md flex items-center justify-center 
                        text-2xl md:text-3xl border-2 bg-gray-800 bg-opacity-80
                        ${
                          showHint && tile.position === tile.correctPosition
                            ? "border-green-500 text-green-300"
                            : "border-indigo-900 text-indigo-300"
                        }`}
                    >
                      {tile.symbol}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Center - Cube */}
          <div className="mx-10 my-6 md:my-0 z-20">
            {/* Fixed-size container with explicit positioning */}
            <div
              className="relative"
              style={{ width: "140px", height: "140px" }}
            >
              {/* Outer glow effect */}
              {cubeGlowing && (
                <motion.div
                  className="absolute rounded-full"
                  style={{
                    width: "180px",
                    height: "180px",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    background: `radial-gradient(circle, ${selectedCube.colors[0]}90 0%, transparent 70%)`,
                    zIndex: -1,
                  }}
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.6, 0.9, 0.6],
                  }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              )}

              {/* Inner glow effect */}
              {cubeGlowing && (
                <motion.div
                  className="absolute rounded-full"
                  style={{
                    width: "130px",
                    height: "130px",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    background: `radial-gradient(circle, ${selectedCube.colors[0]} 0%, transparent 70%)`,
                    zIndex: -1,
                  }}
                  animate={{
                    scale: [1.1, 0.9, 1.1],
                    opacity: [0.7, 0.9, 0.7],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              )}

              {/* Centered RealmCube */}
              <div
                className="absolute"
                style={{
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              >
                <RealmCube
                  position="center"
                  size={70}
                  cubeId={selectedCubeId}
                  isAnimated={cubeGlowing}
                  onCubeClick={() => {}}
                  onCubeCollectionUpdate={handleCubeCollectionUpdate}
                />
              </div>
            </div>
          </div>

          {/* Right side - Goal pattern */}
          <div className="z-10">{renderGoalGrid(level)}</div>
        </div>

        {/* Hint text */}
        <AnimatePresence>
          {showHint && (
            <motion.div
              className="mt-6 p-4 bg-gray-800 bg-opacity-70 rounded-lg border border-indigo-900 max-w-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-indigo-300 text-sm">
                Rearrange the left puzzle to match the pattern on the right.
                <span className="block mt-2 text-xs text-gray-400">
                  Tiles highlighted in green are in their correct positions.
                </span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Completion message */}
        <AnimatePresence>
          {showSolvedMessage && (
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="bg-black bg-opacity-70 backdrop-blur-sm border border-indigo-500 p-6 rounded-lg shadow-lg text-center max-w-md"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-2xl font-bold text-indigo-400 mb-2">
                  Cipher Decoded
                </h3>
                <p className="text-gray-300">{level.completionMessage}</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // Render the solved screen
  const renderSolvedScreen = () => {
    const level = levels[currentLevel];

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-8">
        <div className="max-w-md mx-auto text-center">
          <motion.h2
            className="text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-500"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            CIPHER DECODED
          </motion.h2>

          <motion.div
            className="mb-8 p-6 bg-gray-800 bg-opacity-60 rounded-lg border border-green-500"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="mb-4">
              <h3 className="text-xl font-bold text-green-400 mb-2">
                {level.name}
              </h3>
              <p className="text-gray-300">{level.completionMessage}</p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-900 bg-opacity-50 p-3 rounded-lg">
                <p className="text-gray-400">Moves</p>
                <p className="text-xl text-indigo-300 font-bold">{moveCount}</p>
              </div>
              <div className="bg-gray-900 bg-opacity-50 p-3 rounded-lg">
                <p className="text-gray-400">Grid Size</p>
                <p className="text-xl text-indigo-300 font-bold">
                  {level.gridSize}×{level.gridSize}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="flex justify-center space-x-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {currentLevel < levels.length - 1 ? (
              <button
                onClick={nextLevel}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white rounded-lg shadow-lg transition-all duration-300"
                style={{
                  boxShadow: "0 0 20px rgba(16, 185, 129, 0.3)",
                }}
              >
                NEXT CIPHER
              </button>
            ) : (
              <button
                onClick={() => setGameState("intro")}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg shadow-lg transition-all duration-300"
                style={{
                  boxShadow: "0 0 20px rgba(139, 92, 246, 0.3)",
                }}
              >
                CIPHER MASTERY COMPLETE
              </button>
            )}

            <button
              onClick={() => setGameState("intro")}
              className="px-6 py-3 bg-black/50 backdrop-blur-sm border border-blue-500/30 text-blue-400 hover:bg-blue-900/20 transition-colors rounded-lg shadow-lg"
              style={{
                boxShadow: "0 0 15px rgba(59, 130, 246, 0.2)",
              }}
            >
              RETURN
            </button>
          </motion.div>
        </div>

        {/* Background celebration effect */}
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          {[...Array(50)].map((_, i) => {
            const symbolTypes = Object.keys(symbolLibrary) as Array<
              keyof typeof symbolLibrary
            >;
            const randomType =
              symbolTypes[Math.floor(Math.random() * symbolTypes.length)];
            const randomSymbol =
              symbolLibrary[randomType][
                Math.floor(Math.random() * symbolLibrary[randomType].length)
              ];
            const size = Math.random() * 20 + 20;
            const startPos = {
              x: Math.random() * 100,
              y: 120,
            };
            const xOffset = (Math.random() - 0.5) * 40;

            return (
              <motion.div
                key={`celebration-${i}`}
                className="absolute text-4xl"
                style={{
                  color: `hsl(${Math.random() * 60 + 200}, 80%, 60%, ${
                    Math.random() * 0.5 + 0.5
                  })`,
                  fontSize: `${size}px`,
                  left: `${startPos.x}%`,
                  bottom: `${startPos.y}%`,
                }}
                animate={{
                  y: [0, -window.innerHeight * 0.8 - Math.random() * 200],
                  x: [0, xOffset, xOffset * 1.5],
                  rotate: [0, Math.random() * 360 - 180],
                  opacity: [1, 1, 0],
                }}
                transition={{
                  duration: 4 + Math.random() * 3,
                  ease: "easeOut",
                  delay: Math.random() * 5,
                }}
              >
                {randomSymbol}
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  // Main component render
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <AnimatePresence mode="wait">
        {gameState === "intro" && renderIntroScreen()}
        {gameState === "tutorial" && renderTutorialScreen()}
        {gameState === "playing" && renderPlayingScreen()}
        {gameState === "solved" && renderSolvedScreen()}
      </AnimatePresence>

      {/* Global styles */}
      <style jsx global>{`
        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 0.95;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.02);
          }
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s infinite ease-in-out;
        }

        .font-pixel {
          font-family: "Press Start 2P", monospace;
          letter-spacing: 0.05em;
        }
      `}</style>
    </div>
  );
};

export default CipherRealm;
