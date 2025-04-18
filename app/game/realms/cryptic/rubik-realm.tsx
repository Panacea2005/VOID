import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cubeCollection } from "../../cube/realm-cube";
import { useAudio } from "../../contexts/audio-context";

interface CrypticRealmProps {
  onReturn: () => void;
  selectedCubeId?: string;
}

// Improved Rubik's Cube with proper layer rotation mechanics
const CrypticRealm: React.FC<CrypticRealmProps> = ({
  onReturn,
  selectedCubeId = "pink-neon",
}) => {
  // Game state
  const [gameState, setGameState] = useState<"intro" | "playing" | "success">(
    "intro"
  );
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  // Cube size (3x3 standard Rubik's cube)
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
  const selectedCube =
    cubeCollection.find((cube) => cube.id === selectedCubeId) || defaultCube;
  const cubeColors = [...selectedCube.colors];

  // Ensure we have 6 colors for all faces
  while (cubeColors.length < 6) {
    cubeColors.push(
      defaultCube.colors[cubeColors.length % defaultCube.colors.length]
    );
  }

  // Individual face state
  // Each face has 9 cells (3x3)
  const [faces, setFaces] = useState<string[][]>([]);

  // Audio context
  const audio = useAudio();

  // Reference for raycaster and intersection detection
  const cubeRef = useRef<HTMLDivElement>(null);

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
    if (
      gameState === "playing" &&
      !isAnimating &&
      faces.length > 0 &&
      moves > 0
    ) {
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
    BACK: 5,
  };

  // Layer types for rotation
  const LAYER_TYPE = {
    ROW: "row", // Horizontal layers (parallel to TOP/BOTTOM faces)
    COLUMN: "column", // Vertical layers (parallel to LEFT/RIGHT faces)
    DEPTH: "depth", // Depth layers (parallel to FRONT/BACK faces)
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
    const possibleMoves = [
      "R",
      "L",
      "U",
      "D",
      "F",
      "B",
      "M",
      "E",
      "S",
      "R'",
      "L'",
      "U'",
      "D'",
      "F'",
      "B'",
      "M'",
      "E'",
      "S'",
    ];

    for (let i = 0; i < 20; i++) {
      const move =
        possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
      const isClockwise = !move.includes("'");
      const face = move.replace("'", "");

      let faceIndex;
      let layerType;
      let layerIndex;

      switch (face) {
        case "R": // Right face
          faceIndex = FACE.RIGHT;
          layerType = LAYER_TYPE.COLUMN;
          layerIndex = 2; // Rightmost column
          break;
        case "L": // Left face
          faceIndex = FACE.LEFT;
          layerType = LAYER_TYPE.COLUMN;
          layerIndex = 0; // Leftmost column
          break;
        case "U": // Top face
          faceIndex = FACE.TOP;
          layerType = LAYER_TYPE.ROW;
          layerIndex = 0; // Top row
          break;
        case "D": // Bottom face
          faceIndex = FACE.BOTTOM;
          layerType = LAYER_TYPE.ROW;
          layerIndex = 2; // Bottom row
          break;
        case "F": // Front face
          faceIndex = FACE.FRONT;
          layerType = LAYER_TYPE.DEPTH;
          layerIndex = 0; // Front depth layer
          break;
        case "B": // Back face
          faceIndex = FACE.BACK;
          layerType = LAYER_TYPE.DEPTH;
          layerIndex = 2; // Back depth layer
          break;
        case "M": // Middle slice (between L and R)
          layerType = LAYER_TYPE.COLUMN;
          layerIndex = 1; // Middle column
          faceIndex = -1; // No specific face
          break;
        case "E": // Equatorial slice (between U and D)
          layerType = LAYER_TYPE.ROW;
          layerIndex = 1; // Middle row
          faceIndex = -1; // No specific face
          break;
        case "S": // Standing slice (between F and B)
          layerType = LAYER_TYPE.DEPTH;
          layerIndex = 1; // Middle depth
          faceIndex = -1; // No specific face
          break;
        default:
          faceIndex = FACE.FRONT;
          layerType = LAYER_TYPE.DEPTH;
          layerIndex = 0;
      }

      await rotateLayer(layerType, layerIndex, isClockwise);
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    setIsAnimating(false);
    setMoves(0); // Reset moves after scramble
  };

  const handleLayerMouseUp = () => {
    if (layerDragState.isDragging) {
      setLayerDragState({
        isDragging: false,
        layerType: "",
        layerIndex: -1,
        startX: 0,
        startY: 0,
        currentRotation: 0,
        isCommitted: false,
      });
    }
  };

  const handleLayerMouseDown = (
    layerType: string,
    layerIndex: number,
    e: React.MouseEvent
  ) => {
    if (gameState !== "playing" || isAnimating) return;

    // Start dragging a layer
    setLayerDragState({
      isDragging: true,
      layerType,
      layerIndex,
      startX: e.clientX,
      startY: e.clientY,
      currentRotation: 0,
      isCommitted: false,
    });

    try {
      audio.playSound("click");
    } catch (e) {
      // Silent fail
    }

    // Prevent context menu on right-click
    e.preventDefault();
    e.stopPropagation(); // Prevent the cube drag from activating

    // Add window event listeners to ensure drag continues even if cursor leaves the element
    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);
  };

  // Perform a rotation of a specific layer
  const rotateLayer = async (
    layerType: string,
    layerIndex: number,
    clockwise: boolean = true
  ) => {
    if (isAnimating) return;
    setIsAnimating(true);

    try {
      audio.playSound("rotate");
    } catch (e) {
      // Silent fail
    }

    // Update the faces data
    setFaces((prevFaces) => {
      const newFaces = prevFaces.map((face) => [...face]);

      // Apply the rotation to the cube data
      switch (layerType) {
        case LAYER_TYPE.ROW:
          rotateHorizontalLayer(newFaces, layerIndex, clockwise);
          break;
        case LAYER_TYPE.COLUMN:
          rotateVerticalLayer(newFaces, layerIndex, clockwise);
          break;
        case LAYER_TYPE.DEPTH:
          rotateDepthLayer(newFaces, layerIndex, clockwise);
          break;
      }

      return newFaces;
    });

    setMoves((prev) => prev + 1);

    // Wait for the animation to complete
    await new Promise((resolve) => setTimeout(resolve, 300));
    setIsAnimating(false);
  };

  const rotateFaceData = (faceData: string[], clockwise: boolean): string[] => {
    if (clockwise) {
      return [
        faceData[6], faceData[3], faceData[0],
        faceData[7], faceData[4], faceData[1],
        faceData[8], faceData[5], faceData[2]
      ];
    } else {
      return [
        faceData[2], faceData[5], faceData[8],
        faceData[1], faceData[4], faceData[7],
        faceData[0], faceData[3], faceData[6]
      ];
    }
  };

  // Rotate a horizontal layer (row) of the cube
  const rotateHorizontalLayer = (faces: string[][], rowIndex: number, clockwise: boolean) => {
    // For a horizontal row rotation, we need to:
    // 1. Rotate the cells in this row across FRONT, RIGHT, BACK, LEFT
    // 2. If it's the top or bottom row, also rotate the TOP or BOTTOM face
  
    // Calculate row indices for the relevant faces
    const frontRowIndices = [rowIndex * 3, rowIndex * 3 + 1, rowIndex * 3 + 2];
    const rightRowIndices = [rowIndex * 3, rowIndex * 3 + 1, rowIndex * 3 + 2];
    const leftRowIndices = [rowIndex * 3, rowIndex * 3 + 1, rowIndex * 3 + 2];
    
    // For BACK face, we need to flip the row index and reverse the order
    // If rowIndex is 0 (top), we need row 2 of BACK, etc.
    const backRowIndex = 2 - rowIndex;
    const backRowIndices = [backRowIndex * 3, backRowIndex * 3 + 1, backRowIndex * 3 + 2];
  
    // Save the original values from each face
    const frontValues = frontRowIndices.map(idx => faces[FACE.FRONT][idx]);
    const rightValues = rightRowIndices.map(idx => faces[FACE.RIGHT][idx]);
    const backValues = backRowIndices.map(idx => faces[FACE.BACK][idx]);
    const leftValues = leftRowIndices.map(idx => faces[FACE.LEFT][idx]);
  
    // Apply the rotation based on direction
    if (clockwise) {
      // Clockwise: FRONT -> RIGHT -> BACK -> LEFT -> FRONT
      // FRONT gets values from LEFT
      frontRowIndices.forEach((idx, i) => {
        faces[FACE.FRONT][idx] = leftValues[i];
      });
      
      // RIGHT gets values from FRONT
      rightRowIndices.forEach((idx, i) => {
        faces[FACE.RIGHT][idx] = frontValues[i];
      });
      
      // BACK gets values from RIGHT (reversed)
      backRowIndices.forEach((idx, i) => {
        faces[FACE.BACK][idx] = rightValues[2 - i];
      });
      
      // LEFT gets values from BACK (reversed)
      leftRowIndices.forEach((idx, i) => {
        faces[FACE.LEFT][idx] = backValues[2 - i];
      });
      
      // Rotate the corresponding face if it's the top or bottom row
      if (rowIndex === 0) {
        // If rotating top row, also rotate TOP face clockwise
        faces[FACE.TOP] = rotateFaceData(faces[FACE.TOP], true);
      } else if (rowIndex === 2) {
        // If rotating bottom row, also rotate BOTTOM face clockwise
        faces[FACE.BOTTOM] = rotateFaceData(faces[FACE.BOTTOM], true);
      }
    } else {
      // Counter-clockwise: FRONT -> LEFT -> BACK -> RIGHT -> FRONT
      // FRONT gets values from RIGHT
      frontRowIndices.forEach((idx, i) => {
        faces[FACE.FRONT][idx] = rightValues[i];
      });
      
      // LEFT gets values from FRONT
      leftRowIndices.forEach((idx, i) => {
        faces[FACE.LEFT][idx] = frontValues[i];
      });
      
      // BACK gets values from LEFT (reversed)
      backRowIndices.forEach((idx, i) => {
        faces[FACE.BACK][idx] = leftValues[2 - i];
      });
      
      // RIGHT gets values from BACK (reversed)
      rightRowIndices.forEach((idx, i) => {
        faces[FACE.RIGHT][idx] = backValues[2 - i];
      });
      
      // Rotate the corresponding face if it's the top or bottom row
      if (rowIndex === 0) {
        // If rotating top row, also rotate TOP face counter-clockwise
        faces[FACE.TOP] = rotateFaceData(faces[FACE.TOP], false);
      } else if (rowIndex === 2) {
        // If rotating bottom row, also rotate BOTTOM face counter-clockwise
        faces[FACE.BOTTOM] = rotateFaceData(faces[FACE.BOTTOM], false);
      }
    }
  };

  // Rotate a vertical layer (column) of the cube
  const rotateVerticalLayer = (faces: string[][], colIndex: number, clockwise: boolean) => {
    // For a vertical column rotation, we need to:
    // 1. Rotate the cells in this column across TOP, FRONT, BOTTOM, BACK
    // 2. If it's the left or right column, also rotate the LEFT or RIGHT face
  
    // Calculate column indices for each face
    const topColIndices = [colIndex, colIndex + 3, colIndex + 6];
    const frontColIndices = [colIndex, colIndex + 3, colIndex + 6];
    const bottomColIndices = [colIndex, colIndex + 3, colIndex + 6];
    
    // For BACK face, we need to flip the column index and reverse the order
    const backColIndex = 2 - colIndex;
    const backColIndices = [backColIndex, backColIndex + 3, backColIndex + 6];
  
    // Save the original values from each face
    const topValues = topColIndices.map(idx => faces[FACE.TOP][idx]);
    const frontValues = frontColIndices.map(idx => faces[FACE.FRONT][idx]);
    const bottomValues = bottomColIndices.map(idx => faces[FACE.BOTTOM][idx]);
    const backValues = backColIndices.map(idx => faces[FACE.BACK][idx]);
  
    // Apply the rotation based on direction
    if (clockwise) {
      // Clockwise: TOP -> BACK (reversed) -> BOTTOM -> FRONT -> TOP
      // TOP gets values from FRONT
      topColIndices.forEach((idx, i) => {
        faces[FACE.TOP][idx] = frontValues[i];
      });
      
      // BACK gets values from TOP (reversed)
      backColIndices.forEach((idx, i) => {
        faces[FACE.BACK][idx] = topValues[2 - i];
      });
      
      // BOTTOM gets values from BACK (reversed)
      bottomColIndices.forEach((idx, i) => {
        faces[FACE.BOTTOM][idx] = backValues[2 - i];
      });
      
      // FRONT gets values from BOTTOM
      frontColIndices.forEach((idx, i) => {
        faces[FACE.FRONT][idx] = bottomValues[i];
      });
      
      // Rotate the corresponding face if it's the left or right column
      if (colIndex === 0) {
        // If rotating left column, also rotate LEFT face counter-clockwise
        faces[FACE.LEFT] = rotateFaceData(faces[FACE.LEFT], false);
      } else if (colIndex === 2) {
        // If rotating right column, also rotate RIGHT face clockwise
        faces[FACE.RIGHT] = rotateFaceData(faces[FACE.RIGHT], true);
      }
    } else {
      // Counter-clockwise: TOP -> FRONT -> BOTTOM -> BACK (reversed) -> TOP
      // TOP gets values from BACK (reversed)
      topColIndices.forEach((idx, i) => {
        faces[FACE.TOP][idx] = backValues[2 - i];
      });
      
      // FRONT gets values from TOP
      frontColIndices.forEach((idx, i) => {
        faces[FACE.FRONT][idx] = topValues[i];
      });
      
      // BOTTOM gets values from FRONT
      bottomColIndices.forEach((idx, i) => {
        faces[FACE.BOTTOM][idx] = frontValues[i];
      });
      
      // BACK gets values from BOTTOM (reversed)
      backColIndices.forEach((idx, i) => {
        faces[FACE.BACK][idx] = bottomValues[2 - i];
      });
      
      // Rotate the corresponding face if it's the left or right column
      if (colIndex === 0) {
        // If rotating left column, also rotate LEFT face clockwise
        faces[FACE.LEFT] = rotateFaceData(faces[FACE.LEFT], true);
      } else if (colIndex === 2) {
        // If rotating right column, also rotate RIGHT face counter-clockwise
        faces[FACE.RIGHT] = rotateFaceData(faces[FACE.RIGHT], false);
      }
    }
  };

  // Rotate a depth layer of the cube
  const rotateDepthLayer = (faces: string[][], depthIndex: number, clockwise: boolean) => {
    // For a depth layer rotation, we need to:
    // 1. Rotate the cells in this depth across TOP, RIGHT, BOTTOM, LEFT
    // 2. If it's the front or back depth, also rotate the FRONT or BACK face
    
    // Calculate indices for the depth on each face based on depthIndex
    let topIndices, rightIndices, bottomIndices, leftIndices;
    
    if (depthIndex === 0) { // Front depth
      topIndices = [6, 7, 8]; // Bottom row of TOP
      rightIndices = [0, 3, 6]; // Left column of RIGHT
      bottomIndices = [0, 1, 2]; // Top row of BOTTOM
      leftIndices = [2, 5, 8]; // Right column of LEFT
    } else if (depthIndex === 1) { // Middle depth
      topIndices = [3, 4, 5]; // Middle row of TOP
      rightIndices = [1, 4, 7]; // Middle column of RIGHT
      bottomIndices = [3, 4, 5]; // Middle row of BOTTOM
      leftIndices = [1, 4, 7]; // Middle column of LEFT
    } else { // Back depth (depthIndex === 2)
      topIndices = [0, 1, 2]; // Top row of TOP
      rightIndices = [2, 5, 8]; // Right column of RIGHT
      bottomIndices = [6, 7, 8]; // Bottom row of BOTTOM
      leftIndices = [0, 3, 6]; // Left column of LEFT
    }
    
    // Save the original values
    const topValues = topIndices.map(idx => faces[FACE.TOP][idx]);
    const rightValues = rightIndices.map(idx => faces[FACE.RIGHT][idx]);
    const bottomValues = bottomIndices.map(idx => faces[FACE.BOTTOM][idx]);
    const leftValues = leftIndices.map(idx => faces[FACE.LEFT][idx]);
    
    if (clockwise) {
      // Clockwise rotation: TOP -> RIGHT -> BOTTOM -> LEFT -> TOP
      // The tricky part is that we need to correct the orientation
      
      // TOP gets values from LEFT
      for (let i = 0; i < 3; i++) {
        faces[FACE.TOP][topIndices[i]] = leftValues[2 - i];
      }
      
      // RIGHT gets values from TOP
      for (let i = 0; i < 3; i++) {
        faces[FACE.RIGHT][rightIndices[i]] = topValues[i];
      }
      
      // BOTTOM gets values from RIGHT
      for (let i = 0; i < 3; i++) {
        faces[FACE.BOTTOM][bottomIndices[i]] = rightValues[2 - i];
      }
      
      // LEFT gets values from BOTTOM
      for (let i = 0; i < 3; i++) {
        faces[FACE.LEFT][leftIndices[i]] = bottomValues[i];
      }
      
      // Rotate the corresponding face if needed
      if (depthIndex === 0) {
        // Front face rotates clockwise
        faces[FACE.FRONT] = rotateFaceData(faces[FACE.FRONT], true);
      } else if (depthIndex === 2) {
        // Back face rotates counter-clockwise (because of orientation)
        faces[FACE.BACK] = rotateFaceData(faces[FACE.BACK], false);
      }
    } else {
      // Counter-clockwise rotation: TOP -> LEFT -> BOTTOM -> RIGHT -> TOP
      
      // TOP gets values from RIGHT
      for (let i = 0; i < 3; i++) {
        faces[FACE.TOP][topIndices[i]] = rightValues[i];
      }
      
      // LEFT gets values from TOP
      for (let i = 0; i < 3; i++) {
        faces[FACE.LEFT][leftIndices[i]] = topValues[2 - i];
      }
      
      // BOTTOM gets values from LEFT
      for (let i = 0; i < 3; i++) {
        faces[FACE.BOTTOM][bottomIndices[i]] = leftValues[i];
      }
      
      // RIGHT gets values from BOTTOM
      for (let i = 0; i < 3; i++) {
        faces[FACE.RIGHT][rightIndices[i]] = bottomValues[2 - i];
      }
      
      // Rotate the corresponding face if needed
      if (depthIndex === 0) {
        // Front face rotates counter-clockwise
        faces[FACE.FRONT] = rotateFaceData(faces[FACE.FRONT], false);
      } else if (depthIndex === 2) {
        // Back face rotates clockwise (because of orientation)
        faces[FACE.BACK] = rotateFaceData(faces[FACE.BACK], true);
      }
    }
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
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Layer drag state
  const [layerDragState, setLayerDragState] = useState({
    isDragging: false,
    layerType: "",
    layerIndex: -1,
    startX: 0,
    startY: 0,
    currentRotation: 0,
    isCommitted: false,
  });

  // Mouse event handlers for rotating the cube view
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only allow cube rotation when clicking outside the cube faces
    // Check if the target is part of the cube
    const target = e.target as HTMLElement;
    const isCubePiece = target.closest(".cube-face") !== null;

    if (
      isCubePiece ||
      gameState !== "playing" ||
      isAnimating ||
      layerDragState.isDragging
    ) {
      return;
    }

    // Start dragging to rotate the cube view
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
    });

    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Handle layer dragging
    if (layerDragState.isDragging) {
      handleLayerMouseMove(e);
      return;
    }

    // Handle cube rotation
    if (!isDragging || gameState !== "playing") return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    setCubeRotation((prev) => ({
      x: prev.x - deltaY * 0.5,
      y: prev.y + deltaX * 0.5,
    }));

    setDragStart({
      x: e.clientX,
      y: e.clientY,
    });

    e.preventDefault();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    handleLayerMouseUp(); // Call the correct function
  };

  // Handle layer drag operation with auto-layer detection
  const handleLayerDrag = (faceIndex: number, e: React.MouseEvent) => {
    if (gameState !== "playing" || isAnimating || layerDragState.isDragging) {
      e.stopPropagation();
      return;
    }

    // Get the face element and its dimensions
    const faceElement = e.currentTarget as HTMLElement;
    const faceRect = faceElement.getBoundingClientRect();

    // Calculate click position as percentage within face (0-1)
    const percentX = (e.clientX - faceRect.left) / faceRect.width;
    const percentY = (e.clientY - faceRect.top) / faceRect.height;

    // Determine which layer to rotate based on face and click position
    let selectedLayerType = "";
    let selectedLayerIndex = -1;

    // Edge threshold - how close to edge to consider it an edge click (0.2 = 20% from edge)
    const edgeThreshold = 0.25;

    // Determine if click is on edge of face
    const isLeftEdge = percentX < edgeThreshold;
    const isRightEdge = percentX > 1 - edgeThreshold;
    const isTopEdge = percentY < edgeThreshold;
    const isBottomEdge = percentY > 1 - edgeThreshold;

    // Based on which face was clicked and which edge was clicked,
    // determine the appropriate layer to rotate
    switch (faceIndex) {
      case FACE.FRONT:
        if (isTopEdge) {
          // Top edge of front face = top face's bottom row
          selectedLayerType = LAYER_TYPE.ROW;
          selectedLayerIndex = 2; // Bottom row of top face (connects to front face)
        } else if (isBottomEdge) {
          // Bottom edge of front face = bottom face's top row
          selectedLayerType = LAYER_TYPE.ROW;
          selectedLayerIndex = 0; // Top row of bottom face (connects to front face)
        } else if (isLeftEdge) {
          // Left edge of front face = left face's right column
          selectedLayerType = LAYER_TYPE.COLUMN;
          selectedLayerIndex = 2; // Right column of left face (connects to front face)
        } else if (isRightEdge) {
          // Right edge of front face = right face's left column
          selectedLayerType = LAYER_TYPE.COLUMN;
          selectedLayerIndex = 0; // Left column of right face (connects to front face)
        } else {
          // Middle of front face, rotate middle layer based on drag direction
          selectedLayerType = LAYER_TYPE.DEPTH;
          selectedLayerIndex = 0; // Front slice (will adjust in drag)
        }
        break;

      case FACE.BACK:
        if (isTopEdge) {
          // Top edge of back face = top face's top row
          selectedLayerType = LAYER_TYPE.ROW;
          selectedLayerIndex = 0; // Top row of top face (connects to back face)
        } else if (isBottomEdge) {
          // Bottom edge of back face = bottom face's bottom row
          selectedLayerType = LAYER_TYPE.ROW;
          selectedLayerIndex = 2; // Bottom row of bottom face (connects to back face)
        } else if (isLeftEdge) {
          // Left edge of back face = right face's right column (mirrored)
          selectedLayerType = LAYER_TYPE.COLUMN;
          selectedLayerIndex = 2; // Right column of right face (connects to back face)
        } else if (isRightEdge) {
          // Right edge of back face = left face's left column (mirrored)
          selectedLayerType = LAYER_TYPE.COLUMN;
          selectedLayerIndex = 0; // Left column of left face (connects to back face)
        } else {
          // Middle of back face, rotate middle layer based on drag direction
          selectedLayerType = LAYER_TYPE.DEPTH;
          selectedLayerIndex = 2; // Back slice (will adjust in drag)
        }
        break;

      case FACE.TOP:
        if (isTopEdge) {
          // Top edge of top face = back face's top edge
          selectedLayerType = LAYER_TYPE.ROW;
          selectedLayerIndex = 0; // Top row (connects top and back)
        } else if (isBottomEdge) {
          // Bottom edge of top face = front face's top edge
          selectedLayerType = LAYER_TYPE.ROW;
          selectedLayerIndex = 0; // Top row (connects top and front)
        } else if (isLeftEdge) {
          // Left edge of top face = left face's top edge
          selectedLayerType = LAYER_TYPE.COLUMN;
          selectedLayerIndex = 0; // Left column (connects top and left)
        } else if (isRightEdge) {
          // Right edge of top face = right face's top edge
          selectedLayerType = LAYER_TYPE.COLUMN;
          selectedLayerIndex = 2; // Right column (connects top and right)
        } else {
          // Middle of top face - equatorial layer based on drag
          selectedLayerType = LAYER_TYPE.ROW;
          selectedLayerIndex = 0; // Default to top row, will adjust
        }
        break;

      case FACE.BOTTOM:
        if (isTopEdge) {
          // Top edge of bottom face = front face's bottom edge
          selectedLayerType = LAYER_TYPE.ROW;
          selectedLayerIndex = 2; // Bottom row (connects bottom and front)
        } else if (isBottomEdge) {
          // Bottom edge of bottom face = back face's bottom edge
          selectedLayerType = LAYER_TYPE.ROW;
          selectedLayerIndex = 2; // Bottom row (connects bottom and back)
        } else if (isLeftEdge) {
          // Left edge of bottom face = left face's bottom edge
          selectedLayerType = LAYER_TYPE.COLUMN;
          selectedLayerIndex = 0; // Left column (connects bottom and left)
        } else if (isRightEdge) {
          // Right edge of bottom face = right face's bottom edge
          selectedLayerType = LAYER_TYPE.COLUMN;
          selectedLayerIndex = 2; // Right column (connects bottom and right)
        } else {
          // Middle of bottom face - equatorial layer based on drag
          selectedLayerType = LAYER_TYPE.ROW;
          selectedLayerIndex = 2; // Default to bottom row, will adjust
        }
        break;

      case FACE.LEFT:
        if (isTopEdge) {
          // Top edge of left face = top face's left edge
          selectedLayerType = LAYER_TYPE.ROW;
          selectedLayerIndex = 0; // Top row
        } else if (isBottomEdge) {
          // Bottom edge of left face = bottom face's left edge
          selectedLayerType = LAYER_TYPE.ROW;
          selectedLayerIndex = 2; // Bottom row
        } else if (isLeftEdge) {
          // Left edge of left face = back face's right edge (mirrored)
          selectedLayerType = LAYER_TYPE.DEPTH;
          selectedLayerIndex = 2; // Back layer
        } else if (isRightEdge) {
          // Right edge of left face = front face's left edge
          selectedLayerType = LAYER_TYPE.DEPTH;
          selectedLayerIndex = 0; // Front layer
        } else {
          // Middle of left face - use left column
          selectedLayerType = LAYER_TYPE.COLUMN;
          selectedLayerIndex = 0; // Left column
        }
        break;

      case FACE.RIGHT:
        if (isTopEdge) {
          // Top edge of right face = top face's right edge
          selectedLayerType = LAYER_TYPE.ROW;
          selectedLayerIndex = 0; // Top row
        } else if (isBottomEdge) {
          // Bottom edge of right face = bottom face's right edge
          selectedLayerType = LAYER_TYPE.ROW;
          selectedLayerIndex = 2; // Bottom row
        } else if (isLeftEdge) {
          // Left edge of right face = front face's right edge
          selectedLayerType = LAYER_TYPE.DEPTH;
          selectedLayerIndex = 0; // Front layer
        } else if (isRightEdge) {
          // Right edge of right face = back face's left edge (mirrored)
          selectedLayerType = LAYER_TYPE.DEPTH;
          selectedLayerIndex = 2; // Back layer
        } else {
          // Middle of right face - use right column
          selectedLayerType = LAYER_TYPE.COLUMN;
          selectedLayerIndex = 2; // Right column
        }
        break;
    }

    // Setup the layer dragging state
    console.log(
      `Starting drag on face ${faceIndex}, layer type ${selectedLayerType}, index ${selectedLayerIndex}`
    );

    handleLayerMouseDown(selectedLayerType, selectedLayerIndex, e);

    // Prevent cube rotation
    e.stopPropagation();
    e.preventDefault();
  };

  // Handle window mouse move (for layer drag that goes outside the element)
  const handleWindowMouseMove = (e: MouseEvent) => {
    // Convert MouseEvent to a React.MouseEvent-like object
    const syntheticEvent = {
      clientX: e.clientX,
      clientY: e.clientY,
      preventDefault: () => e.preventDefault(),
      stopPropagation: () => e.stopPropagation(),
    } as unknown as React.MouseEvent;

    handleLayerMouseMove(syntheticEvent);
  };

  // Handle window mouse up
  const handleWindowMouseUp = () => {
    handleLayerMouseUp(); // Call the correct function

    // Remove window event listeners
    window.removeEventListener("mousemove", handleWindowMouseMove);
    window.removeEventListener("mouseup", handleWindowMouseUp);
  };

  // Handle layer mouse move
  const handleLayerMouseMove = (e: React.MouseEvent) => {
    if (!layerDragState.isDragging || layerDragState.isCommitted || isAnimating)
      return;

    // Calculate drag distance
    const deltaX = e.clientX - layerDragState.startX;
    const deltaY = e.clientY - layerDragState.startY;

    // Determine dominant direction
    const isHorizontalDrag = Math.abs(deltaX) > Math.abs(deltaY);
    const dragDistance = isHorizontalDrag ? deltaX : deltaY;

    // Determine rotation direction based on layer type
    let rotation = 0;

    // Get current layer type
    const { layerType, layerIndex } = layerDragState;

    switch (layerType) {
      case LAYER_TYPE.ROW:
        // For rows, horizontal drag determines direction
        rotation = deltaX * 0.5;
        break;

      case LAYER_TYPE.COLUMN:
        // For columns, vertical drag determines direction
        rotation = deltaY * 0.5;
        break;

      case LAYER_TYPE.DEPTH:
        // For depth, select dominant direction
        rotation = isHorizontalDrag ? deltaX * 0.5 : deltaY * 0.5;
        break;
    }

    // Update rotation state for visual feedback
    setLayerDragState((prev) => ({
      ...prev,
      currentRotation: rotation,
    }));

    // If rotation exceeds threshold, commit the move
    if (Math.abs(rotation) > 30 && !layerDragState.isCommitted) {
      const isClockwise = rotation > 0;

      // Set as committed to prevent multiple moves
      setLayerDragState((prev) => ({
        ...prev,
        isCommitted: true,
      }));

      // Perform the actual move with the correct rotation direction
      rotateLayer(layerType, layerIndex, isClockwise);
    }

    // Prevent propagation to stop cube rotation
    e.stopPropagation();
    e.preventDefault();
  };

  // Calculate rotation for layer animation
  const getLayerRotationStyle = (layerType: string, layerIndex: number) => {
    if (
      !layerDragState.isDragging ||
      layerDragState.layerType !== layerType ||
      layerDragState.layerIndex !== layerIndex
    ) {
      return "";
    }

    const rotation = layerDragState.currentRotation;

    switch (layerType) {
      case LAYER_TYPE.ROW:
        return `rotateY(${rotation}deg)`;
      case LAYER_TYPE.COLUMN:
        return `rotateX(${-rotation}deg)`;
      case LAYER_TYPE.DEPTH:
        return `rotateZ(${rotation}deg)`;
      default:
        return "";
    }
  };

  // Render a single cell of the cube
  const renderCell = (faceIndex: number, cellIndex: number, color: string) => {
    // Calculate cell row and column
    const row = Math.floor(cellIndex / 3); // 0, 1, or 2
    const col = cellIndex % 3; // 0, 1, or 2

    // Determine which layer this cell belongs to
    const rowLayer = row;
    const colLayer = col;
    const depthLayer =
      faceIndex === FACE.FRONT ? 0 : faceIndex === FACE.BACK ? 2 : 1;

    // Calculate layer rotation for animations
    const rowRotation = getLayerRotationStyle(LAYER_TYPE.ROW, rowLayer);
    const colRotation = getLayerRotationStyle(LAYER_TYPE.COLUMN, colLayer);
    const depthRotation = getLayerRotationStyle(LAYER_TYPE.DEPTH, depthLayer);

    // Highlight active layers
    const isActiveRow =
      layerDragState.isDragging &&
      layerDragState.layerType === LAYER_TYPE.ROW &&
      layerDragState.layerIndex === rowLayer;

    const isActiveCol =
      layerDragState.isDragging &&
      layerDragState.layerType === LAYER_TYPE.COLUMN &&
      layerDragState.layerIndex === colLayer;

    const isActiveDepth =
      layerDragState.isDragging &&
      layerDragState.layerType === LAYER_TYPE.DEPTH &&
      layerDragState.layerIndex === depthLayer;

    const isActive = isActiveRow || isActiveCol || isActiveDepth;

    // Combine rotations if multiple apply
    const combinedRotation =
      `${rowRotation} ${colRotation} ${depthRotation}`.trim();

    return (
      <div
        key={`face${faceIndex}-${cellIndex}`}
        className={`border border-black transition-all duration-200 ${
          isActive ? "border-white" : ""
        }`}
        style={{
          backgroundColor: color,
          boxShadow: isActive
            ? "inset 0 0 15px rgba(255,255,255,0.7), 0 0 5px rgba(255,255,255,0.7)"
            : "inset 0 0 10px rgba(0,0,0,0.2)",
          transform: combinedRotation || "none",
          transformStyle: "preserve-3d",
          transition: isAnimating ? "transform 0.3s ease-out" : "none",
          zIndex: isActive ? 10 : 1,
        }}
      />
    );
  };

  // Render a single face of the cube
  const renderFace = (faceIndex: number, baseTransform: string) => {
    if (!faces[faceIndex]) return null;

    return (
      <div
        className="cube-face"
        data-face-index={faceIndex}
        style={{
          position: "absolute",
          width: "200px",
          height: "200px",
          left: "50px",
          top: "50px",
          transformStyle: "preserve-3d",
          transform: baseTransform,
          backfaceVisibility: "visible",
          cursor: isAnimating ? "not-allowed" : "grab",
          transition: isAnimating ? "transform 0.3s ease-out" : "none",
        }}
        onMouseDown={(e) => handleLayerDrag(faceIndex, e)}
      >
        <div className="grid grid-cols-3 grid-rows-3 w-full h-full">
          {faces[faceIndex].map((color, i) => renderCell(faceIndex, i, color))}
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
          height: "300px",
        }}
      >
        <div
          ref={cubeRef}
          className="cube-container"
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
            transformStyle: "preserve-3d",
            transform: `rotateX(${cubeRotation.x}deg) rotateY(${cubeRotation.y}deg)`,
            transition: isDragging ? "none" : "transform 0.5s ease-out",
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
                Math.random() * window.innerWidth,
              ],
              y: [
                Math.random() * window.innerHeight,
                Math.random() * window.innerHeight,
              ],
              opacity: [0.1, 0.3, 0.1],
              scale: [Math.random() * 0.5 + 0.5, Math.random() * 0.5 + 0.5],
            }}
            transition={{
              duration: Math.random() * 20 + 10,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              width: `${Math.random() * 4 + 1}px`,
              height: `${Math.random() * 4 + 1}px`,
              background: `linear-gradient(to right, ${cubeColors[0]}30, ${cubeColors[1]}30)`,
              boxShadow: `0 0 ${Math.random() * 8 + 2}px ${cubeColors[0]}`,
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
                : "Master the Cube"}
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
              animate={{
                scale:
                  currentTime % 10 === 0 && currentTime > 0 ? [1, 1.2, 1] : 1,
              }}
              transition={{ duration: 0.5 }}
              className="text-2xl text-green-300 font-bold"
            >
              {formatTime(currentTime)}
            </motion.div>

            {bestTime !== null && (
              <>
                <div className="h-4 w-px bg-purple-500/30"></div>
                <div className="text-lg text-gray-300">Best</div>
                <div className="text-xl text-yellow-300 font-bold">
                  {formatTime(bestTime)}
                </div>
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
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-lg text-blue-300 flex items-center justify-center gap-2"
              >
                <span>
                  {isAnimating
                    ? "Animating..."
                    : "Click and drag on any cube piece to rotate its layer"}
                </span>
              </motion.div>
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

        {/* Visual instruction guide */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 text-center"
        >
          <div className="flex items-center justify-center gap-6">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-black/30 border border-blue-500/30 rounded-md flex items-center justify-center mb-2">
                <motion.div
                  animate={{
                    rotateZ: [0, 90, 0, -90, 0],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 3,
                    ease: "easeInOut",
                  }}
                  className="w-10 h-10 grid grid-cols-3 grid-rows-3 gap-0.5"
                >
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-gradient-to-br from-purple-500/70 to-pink-500/70"
                      style={{
                        transform: i % 3 === 1 ? "translateZ(1px)" : "none",
                      }}
                    />
                  ))}
                </motion.div>
              </div>
              <p className="text-gray-300 text-xs">Drag on cells</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-black/30 border border-green-500/30 rounded-md flex items-center justify-center mb-2">
                <motion.div
                  animate={{
                    rotateY: [0, 45, 0, -45, 0],
                    rotateX: [0, 15, 0, -15, 0],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 5,
                    ease: "easeInOut",
                  }}
                  className="w-10 h-10 bg-gradient-to-br from-blue-500/70 to-teal-500/70 rounded-md"
                />
              </div>
              <p className="text-gray-300 text-xs">Drag elsewhere</p>
            </div>
          </div>
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
              <span className="relative text-white font-pixel text-lg tracking-wider">
                Start Challenge
              </span>
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
                <div
                  className={`absolute inset-0 bg-gradient-to-r from-yellow-600 to-amber-600 ${
                    !isAnimating
                      ? "group-hover:from-yellow-500 group-hover:to-amber-500"
                      : "opacity-50"
                  } rounded-md transition-all duration-300`}
                ></div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-50 transition-opacity duration-300 bg-white/10 rounded-md"></div>
                <span className="relative text-white font-pixel text-lg tracking-wider">
                  {isAnimating ? "Scrambling..." : "Scramble"}
                </span>
              </motion.button>

              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={resetCube}
                disabled={isAnimating}
                className="px-8 py-3 relative group overflow-hidden"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-r from-red-600 to-purple-600 ${
                    !isAnimating
                      ? "group-hover:from-red-500 group-hover:to-purple-500"
                      : "opacity-50"
                  } rounded-md transition-all duration-300`}
                ></div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-50 transition-opacity duration-300 bg-white/10 rounded-md"></div>
                <span className="relative text-white font-pixel text-lg tracking-wider">
                  Reset Cube
                </span>
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
              <span className="relative text-white font-pixel text-lg tracking-wider">
                Play Again
              </span>
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
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
              <li>• Click and drag on any colored piece to rotate its layer</li>
              <li>
                • Drag left/right for horizontal rotation, up/down for vertical
              </li>
              <li>
                • Click and drag empty space to rotate the entire cube view
              </li>
              <li>• Match all colors on each face to win</li>
              <li>• Stuck? Try using Reset or Scramble to restart</li>
            </ul>
          </motion.div>
        )}
      </div>

      {/* Critical CSS fixes for 3D rendering */}
      <style jsx global>{`
        /* Force preserve-3d on all elements that need it */
        .perspective-container,
        .cube-container,
        .cube-face {
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
          font-family: 'Press Start 2P', monospace;
          letter-spacing: 0.05em;
        }
      `}</style>
    </div>
  );
};

export default CrypticRealm;
