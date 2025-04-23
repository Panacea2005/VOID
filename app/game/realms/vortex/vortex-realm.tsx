import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useAnimationControls } from "framer-motion";
import { cubeCollection } from "../../cube/realm-cube";

// 3D Cube Art - Using the same 3D rendering technique as Cryptic Realm Tetris
interface VortexRealmProps {
  onReturn: () => void;
  selectedCubeId: string; // The cube ID selected from the hub
}

// Cell represents a single cube in the grid
interface Cell {
  colorIndex: number; // Index of the color from the palette
  id: string;
}

// Template represents a pre-defined pattern
interface Template {
  id: string;
  name: string;
  icon: string;
  grid: number[][];
}

const VortexRealm: React.FC<VortexRealmProps> = ({ onReturn, selectedCubeId }) => {
  // Grid dimensions
  const [gridSize, setGridSize] = useState({ width: 16, height: 16 });
  
  // The art grid
  const [grid, setGrid] = useState<Cell[][]>([]);
  
  // The currently selected color from the palette
  const [selectedColorIndex, setSelectedColorIndex] = useState(1);
  
  // Whether the user is currently drawing (for mouse drag)
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Whether the current operation is erasing (right-click or using eraser tool)
  const [isErasing, setIsErasing] = useState(false);
  
  // For mobile support
  const [isMobile, setIsMobile] = useState(false);
  
  // For showing/hiding tutorial
  const [showTutorial, setShowTutorial] = useState(true);
  
  // For showing export confirmation
  const [showExportMessage, setShowExportMessage] = useState(false);
  
  // 3D View settings
  const [viewSettings, setViewSettings] = useState({
    perspective: 1200,
    rotateX: 25, // Tilt angle for 3D effect
    rotateY: 5,
    translateZ: -100,
    scale: 0.9,
  });
  
  // Animation controls
  const gridControls = useAnimationControls();
  
  // References for canvas export and interaction
  const gridRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Mouse position for ambient lighting
  const [ambientLightPosition, setAmbientLightPosition] = useState({ x: 50, y: 50 });
  
  // Get selected cube from collection
  const defaultCube = cubeCollection[0];
  const selectedCube = cubeCollection.find(cube => cube.id === selectedCubeId) || defaultCube;
  
  // Create color palette from the selected cube
  const cubeColors = [...(selectedCube?.colors || ['#ec4899', '#8B5CF6', '#A78BFA'])];

  // Ensure we have enough colors
  while (cubeColors.length < 7) {
    cubeColors.push(cubeColors[cubeColors.length % cubeColors.length]);
  }
  
  // Create expanded palette with variations
  const colorPalette = [
    // Color 0: Empty/transparent
    'transparent',
    // Colors from the cube
    ...cubeColors,
    // Lighter and darker variations
    ...cubeColors.map(color => {
      // Convert to hex color object to manipulate it
      let r = parseInt(color.slice(1, 3), 16);
      let g = parseInt(color.slice(3, 5), 16);
      let b = parseInt(color.slice(5, 7), 16);
      
      // Lighter version (lighten by 30%)
      const lighter = `#${Math.min(255, r + 60).toString(16).padStart(2, '0')}${
        Math.min(255, g + 60).toString(16).padStart(2, '0')}${
        Math.min(255, b + 60).toString(16).padStart(2, '0')}`;
      
      // Darker version (darken by 30%)
      const darker = `#${Math.max(0, r - 60).toString(16).padStart(2, '0')}${
        Math.max(0, g - 60).toString(16).padStart(2, '0')}${
        Math.max(0, b - 60).toString(16).padStart(2, '0')}`;
      
      return [lighter, darker];
    }).flat(),
    // Add a few extra colors for flexibility
    '#FFFFFF', // White
    '#FFD700', // Gold
    '#C0C0C0', // Silver
  ];
  
  // Get border and glow settings from the cube
  const cubeBorderColor = selectedCube?.borderColor || 'rgba(255, 255, 255, 0.3)';
  const cubeGlow = selectedCube?.glow ? `0 0 15px ${cubeColors[0]}` : 'none';
  
  // Main color for background effects
  const mainColor = cubeColors[0] || "#ec4899";
  
  // Templates for users to start with
  const templates: Template[] = [
    {
      id: 'blank',
      name: 'Blank Canvas',
      icon: '🆕',
      grid: Array(gridSize.height).fill(Array(gridSize.width).fill(0))
    },
    {
      id: 'cube',
      name: 'Simple Cube',
      icon: '🧊',
      grid: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, 1, 3, 3, 1, 1, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, 3, 3, 3, 3, 1, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, 3, 3, 3, 3, 1, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      ]
    },
    {
      id: 'heart',
      name: 'Heart',
      icon: '❤️',
      grid: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
        [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      ]
    },
    {
      id: 'star',
      name: 'Star',
      icon: '⭐',
      grid: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
        [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0],
        [0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      ]
    },
    {
      id: 'spaceship',
      name: 'Spaceship',
      icon: '🚀',
      grid: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
        [0, 0, 0, 1, 2, 2, 1, 1, 1, 2, 2, 1, 0, 0, 0, 0],
        [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      ]
    },
    {
      id: 'mushroom',
      name: 'Mushroom',
      icon: '🍄',
      grid: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, 1, 1, 2, 2, 1, 1, 1, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, 1, 2, 2, 2, 2, 1, 1, 0, 0, 0, 0, 0],
        [0, 0, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 0, 0, 0, 0],
        [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 3, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 3, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      ]
    },
    {
      id: 'sword',
      name: 'Sword',
      icon: '⚔️',
      grid: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      ]
    },
    {
      id: 'skull',
      name: 'Skull',
      icon: '💀',
      grid: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      ]
    }
  ];
  
  // Initialize the grid
  useEffect(() => {
    createEmptyGrid();
    // Animate grid entrance
    gridControls.start({
      opacity: [0, 1],
      scale: [0.9, 1],
      transition: { duration: 1, ease: "easeOut" }
    });
    
    // Check if on mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  // Handle mouse movement for ambient lighting and 3D perspective effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      // Update ambient light position
      setAmbientLightPosition({ x, y });
      
      // Subtle adjustment to 3D perspective based on mouse position
      const maxRotateX = 35; // Base tilt
      const maxRotateY = 15; // Max rotation on y-axis
      
      setViewSettings(prev => ({
        ...prev,
        rotateX: maxRotateX - (((y / 100) - 0.5) * 10), // Adjust tilt based on mouse y
        rotateY: (((x / 100) - 0.5) * maxRotateY), // Rotate slightly based on mouse x
      }));
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);
  
  // Create empty grid
  const createEmptyGrid = () => {
    const newGrid: Cell[][] = [];
    
    for (let y = 0; y < gridSize.height; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < gridSize.width; x++) {
        row.push({
          colorIndex: 0, // Start with empty/transparent
          id: `cell-${x}-${y}`
        });
      }
      newGrid.push(row);
    }
    
    setGrid(newGrid);
  };
  
  // Apply a template
  const applyTemplate = (template: Template) => {
    const newGrid: Cell[][] = [];
    
    for (let y = 0; y < gridSize.height; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < gridSize.width; x++) {
        const colorIndex = template.grid[y]?.[x] ?? 0;
        row.push({
          colorIndex,
          id: `cell-${x}-${y}`
        });
      }
      newGrid.push(row);
    }
    
    setGrid(newGrid);
  };
  
  // Handle cell click/draw
  const handleCellInteraction = (rowIndex: number, colIndex: number, isErase = false) => {
    const newGrid = [...grid];
    
    // If erasing, set to transparent. Otherwise, use selected color
    const newColorIndex = isErase ? 0 : selectedColorIndex;
    
    if (newGrid[rowIndex][colIndex].colorIndex !== newColorIndex) {
      newGrid[rowIndex][colIndex] = {
        ...newGrid[rowIndex][colIndex],
        colorIndex: newColorIndex
      };
      
      setGrid(newGrid);
    }
  };
  
  // Handle mouse down on cell
  const handleMouseDown = (e: React.MouseEvent, rowIndex: number, colIndex: number) => {
    // Right-click for erasing
    const erase = e.button === 2 || isErasing;
    
    // Prevent default context menu on right-click
    if (e.button === 2) {
      e.preventDefault();
    }
    
    setIsDrawing(true);
    handleCellInteraction(rowIndex, colIndex, erase);
  };
  
  // Handle mouse enter (for drag drawing)
  const handleMouseEnter = (rowIndex: number, colIndex: number) => {
    if (isDrawing) {
      handleCellInteraction(rowIndex, colIndex, isErasing);
    }
  };
  
  // Handle mouse up
  const handleMouseUp = () => {
    setIsDrawing(false);
  };
  
  // Handle touch events for mobile
  const handleTouchStart = (e: React.TouchEvent, rowIndex: number, colIndex: number) => {
    e.preventDefault();
    setIsDrawing(true);
    handleCellInteraction(rowIndex, colIndex, isErasing);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDrawing) return;
    
    const touch = e.touches[0];
    const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
    
    // Find the first element that has a data-cell attribute
    const cellElement = elements.find(el => el.hasAttribute('data-cell'));
    
    if (cellElement) {
      const coords = cellElement.getAttribute('data-cell')?.split('-') || [];
      if (coords.length === 2) {
        const rowIndex = parseInt(coords[0]);
        const colIndex = parseInt(coords[1]);
        
        handleCellInteraction(rowIndex, colIndex, isErasing);
      }
    }
  };
  
  const handleTouchEnd = () => {
    setIsDrawing(false);
  };
  
  // Handle clear canvas
  const handleClearCanvas = () => {
    createEmptyGrid();
  };
  
  // Handle export as image
  const handleExport = () => {
    if (!gridRef.current) return;
    
    try {
      // Convert the grid to an image
      const gridElement = gridRef.current;
      
      // Create a canvas element
      const canvas = document.createElement('canvas');
      const scale = 20; // Each cell will be 20x20 in the exported image
      canvas.width = gridSize.width * scale;
      canvas.height = gridSize.height * scale;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Set background
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw each cell
      for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
          const cell = grid[y][x];
          const color = colorPalette[cell.colorIndex];
          
          // Skip transparent cells
          if (color === 'transparent') continue;
          
          ctx.fillStyle = color;
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
      
      // Convert canvas to data URL
      const dataURL = canvas.toDataURL('image/png');
      
      // Create temporary link and trigger download
      const link = document.createElement('a');
      link.download = `cube-art-3d-${new Date().getTime()}.png`;
      link.href = dataURL;
      link.click();
      
      // Show export confirmation
      setShowExportMessage(true);
      setTimeout(() => {
        setShowExportMessage(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error exporting image:', error);
    }
  };
  
  // Render 3D cube for the cell - exactly like Cryptic Realm Tetris
  const render3DCube = (color: string, x: number, y: number, z: number = 4) => {
    if (color === 'transparent') return null;
    
    const cubeSize = 25;
    const cellSize = 28;
    const gapSize = 1;
    
    // Calculate position
    const posX = x * (cellSize + gapSize);
    const posY = y * (cellSize + gapSize);
    
    // Calculate half of the cubeSize for translateZ values
    const halfSize = cubeSize / 2;
    
    return (
      <div 
        className="cube-scene absolute" 
        style={{ 
          width: cubeSize, 
          height: cubeSize,
          left: posX,
          top: posY,
          transformStyle: "preserve-3d",
          transform: `translateZ(${z}px)`,
          transition: "transform 0.2s ease-out",
          zIndex: 10
        }}
      >
        <div
          className="cube"
          style={{
            transform: `rotateX(0deg) rotateY(0deg) rotateZ(0deg)`,
            width: cubeSize,
            height: cubeSize,
            transformStyle: "preserve-3d",
            ["--cube-size" as string]: `${cubeSize}px`,
          }}
        >
          {/* Top face */}
          <div
            className="cube-face absolute"
            style={{
              width: cubeSize,
              height: cubeSize,
              backgroundColor: color,
              border: `1px solid ${cubeBorderColor}`,
              boxShadow: cubeGlow,
              transform: `translateZ(${halfSize}px)`,
              backfaceVisibility: "hidden",
            }}
          />

          {/* Bottom face */}
          <div
            className="cube-face absolute"
            style={{
              width: cubeSize,
              height: cubeSize,
              backgroundColor: color,
              border: `1px solid ${cubeBorderColor}`,
              opacity: 0.7,
              transform: `rotateX(180deg) translateZ(${halfSize}px)`,
              backfaceVisibility: "hidden",
            }}
          />

          {/* Front face */}
          <div
            className="cube-face absolute"
            style={{
              width: cubeSize,
              height: cubeSize,
              backgroundColor: color,
              border: `1px solid ${cubeBorderColor}`,
              opacity: 0.9,
              transform: `rotateX(90deg) translateZ(${halfSize}px)`,
              backfaceVisibility: "hidden",
            }}
          />

          {/* Back face */}
          <div
            className="cube-face absolute"
            style={{
              width: cubeSize,
              height: cubeSize,
              backgroundColor: color,
              border: `1px solid ${cubeBorderColor}`,
              opacity: 0.7,
              transform: `rotateX(-90deg) translateZ(${halfSize}px)`,
              backfaceVisibility: "hidden",
            }}
          />

          {/* Left face */}
          <div
            className="cube-face absolute"
            style={{
              width: cubeSize,
              height: cubeSize,
              backgroundColor: color,
              border: `1px solid ${cubeBorderColor}`,
              opacity: 0.8,
              transform: `rotateY(-90deg) translateZ(${halfSize}px)`,
              backfaceVisibility: "hidden",
            }}
          />

          {/* Right face */}
          <div
            className="cube-face absolute"
            style={{
              width: cubeSize,
              height: cubeSize,
              backgroundColor: color,
              border: `1px solid ${cubeBorderColor}`,
              opacity: 0.8,
              transform: `rotateY(90deg) translateZ(${halfSize}px)`,
              backfaceVisibility: "hidden",
            }}
          />
        </div>
      </div>
    );
  };
  
  // Render tutorial
  const renderTutorial = () => {
    if (!showTutorial) return null;
    
    return (
      <motion.div 
        className="absolute inset-0 bg-black/80 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="max-w-md p-6 rounded-lg bg-gray-900/90 border border-gray-700/50">
          <h2 className="text-2xl font-bold text-white mb-4">3D Cube Art</h2>
          
          <div className="space-y-4 text-gray-300">
            <p>
              Create beautiful 3D cube art inspired by your chosen cube! 
              The colors are derived from your selected cube's palette.
            </p>
            
            <div>
              <h3 className="text-lg font-semibold text-blue-300 mb-2">How to Use</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Click or drag to place cubes</li>
                <li>Select colors from the palette</li>
                <li>Use the eraser to remove cubes</li>
                <li>Choose a template to get started</li>
                <li>Move your mouse to adjust the 3D perspective</li>
                <li>Save your creation when finished!</li>
              </ul>
            </div>
          </div>
          
          <button 
            className="mt-6 w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-md text-white font-medium hover:from-blue-500 hover:to-purple-500 transition-all duration-300"
            onClick={() => setShowTutorial(false)}
          >
            Start Creating!
          </button>
        </div>
      </motion.div>
    );
  };
  
  // Prevent context menu on right-click
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    
    document.addEventListener('contextmenu', handleContextMenu);
    
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);
  
  return (
    <div
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-purple-900/30 via-black to-black"
    >
      {/* Retro grid background */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: "linear-gradient(rgba(30, 30, 60, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(30, 30, 60, 0.3) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            backgroundPosition: "-1px -1px",
            perspective: "1000px",
            transformStyle: "preserve-3d"
          }}
        ></div>
        
        {/* Glow line horizontal */}
        <div 
          className="absolute left-0 right-0 h-px top-1/2 transform -translate-y-1/2"
          style={{
            background: `linear-gradient(90deg, transparent, ${mainColor}, transparent)`,
            boxShadow: `0 0 15px 0 ${mainColor}`,
            opacity: 0.5
          }}
        ></div>
        
        {/* Glow line vertical */}
        <div 
          className="absolute top-0 bottom-0 w-px left-1/2 transform -translate-x-1/2"
          style={{
            background: `linear-gradient(0deg, transparent, ${mainColor}, transparent)`,
            boxShadow: `0 0 15px 0 ${mainColor}`,
            opacity: 0.5
          }}
        ></div>
        
        {/* Dynamic ambient light that follows mouse */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${ambientLightPosition.x}% ${ambientLightPosition.y}%, ${mainColor}20 0%, transparent 70%)`,
            filter: "blur(60px)",
          }}
        />
      </div>
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute top-4 left-0 right-0 text-center z-10"
      >
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-1 font-pixel tracking-wider">
          CUBE VOXEL ART
        </h1>
        
        <div className="flex items-center justify-center gap-4">
          <div className="h-px w-16 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
          <p className="text-blue-300 font-light">
            Create with {selectedCube?.name || selectedCubeId}
          </p>
          <div className="h-px w-16 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
        </div>
      </motion.div>
      
      {/* Main layout with side panels */}
      <div className="relative z-10 flex justify-center items-center h-full w-full max-w-7xl">
        {/* Left Panel - Tools */}
        <div className="absolute left-1 top-1/2 transform -translate-y-1/2">
          <div className="pixel-border p-1 bg-gray-900/80">
            <div className="flex flex-col gap-1">
              <button
                className={`pixel-button w-full p-2 text-center ${isErasing ? 'bg-pink-900/80' : 'bg-blue-900/80'}`}
                onClick={() => {
                  setIsErasing(!isErasing);
                  if (!isErasing) {
                    setSelectedColorIndex(0);
                  }
                }}
              >
                <span className="block mb-1">{isErasing ? '✏️' : '🧹'}</span>
                <span className="block text-xs font-pixel">{isErasing ? 'DRAW' : 'ERASE'}</span>
              </button>
              
              <button
                className="pixel-button w-full p-2 text-center bg-blue-900/80"
                onClick={handleClearCanvas}
              >
                <span className="block mb-1">🗑️</span>
                <span className="block text-xs font-pixel">CLEAR</span>
              </button>
              
              <button
                className="pixel-button w-full p-2 text-center bg-blue-900/80"
                onClick={handleExport}
              >
                <span className="block mb-1">💾</span>
                <span className="block text-xs font-pixel">SAVE</span>
              </button>
              
              <button
                onClick={onReturn}
                className="pixel-button w-full p-2 text-center bg-indigo-900/80 mt-1"
              >
                <span className="block mb-1">⬅️</span>
                <span className="block text-xs font-pixel">RETURN</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Center Panel - Canvas */}
        <div className="flex flex-col items-center justify-center">
          {/* 3D Grid with perspective - No border */}
          <motion.div
            ref={gridRef}
            className="relative overflow-visible game-grid-3d"
            style={{
              width: gridSize.width * 30,
              height: gridSize.height * 30,
              perspective: `${viewSettings.perspective}px`,
              transformStyle: "preserve-3d", 
            }}
            animate={gridControls}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchEnd={handleTouchEnd}
          >
              {/* 3D Playfield with perspective */}
              <div
                className="absolute inset-0 transform-gpu"
                style={{
                  transform: `rotateX(${viewSettings.rotateX}deg) rotateY(${viewSettings.rotateY}deg) translateZ(${viewSettings.translateZ}px) scale(${viewSettings.scale})`,
                  transformStyle: "preserve-3d",
                  transformOrigin: "center center",
                }}
              >
                {/* Grid background */}
                <div
                  className="absolute"
                  style={{
                    width: "100%",
                    height: "100%",
                    backgroundImage: "linear-gradient(rgba(30, 30, 50, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(30, 30, 50, 0.15) 1px, transparent 1px)",
                    backgroundSize: "30px 30px",
                    transformStyle: "preserve-3d",
                    transform: "translateZ(-5px)",
                    backfaceVisibility: "hidden",
                  }}
                />
                
                {/* Grid back wall */}
                <div
                  className="absolute"
                  style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: "rgba(10, 10, 20, 0.3)",
                    transformStyle: "preserve-3d",
                    transform: "translateZ(-10px)",
                    boxShadow: "inset 0 0 30px rgba(0, 0, 0, 0.4)",
                    backfaceVisibility: "hidden",
                  }}
                />
                
                {/* Grid left wall */}
                <div
                  className="absolute"
                  style={{
                    width: "10px",
                    height: "100%",
                    backgroundColor: "rgba(30, 30, 50, 0.4)",
                    transformStyle: "preserve-3d",
                    transform: "rotateY(90deg) translateZ(-5px)",
                    transformOrigin: "left",
                    backfaceVisibility: "hidden",
                  }}
                />
                
                {/* Grid right wall */}
                <div
                  className="absolute"
                  style={{
                    width: "10px",
                    height: "100%",
                    backgroundColor: "rgba(30, 30, 50, 0.4)",
                    transformStyle: "preserve-3d",
                    transform: `rotateY(-90deg) translateZ(${gridSize.width * 30 - 5}px)`,
                    transformOrigin: "right",
                    backfaceVisibility: "hidden",
                  }}
                />
                
                {/* Grid floor */}
                <div
                  className="absolute"
                  style={{
                    width: "100%",
                    height: "10px",
                    backgroundColor: "rgba(30, 30, 50, 0.4)",
                    transformStyle: "preserve-3d",
                    transform: `rotateX(90deg) translateZ(${gridSize.height * 30 - 5}px)`,
                    transformOrigin: "bottom",
                    backfaceVisibility: "hidden",
                  }}
                />

                {/* Interactive grid cells */}
                <div 
                  className="absolute inset-0 grid"
                  style={{ 
                    pointerEvents: "all",
                    gridTemplateColumns: `repeat(${gridSize.width}, 1fr)`,
                    gridTemplateRows: `repeat(${gridSize.height}, 1fr)`
                  }}
                >
                  {grid.map((row, rowIndex) => (
                    <React.Fragment key={`row-${rowIndex}`}>
                      {row.map((cell, colIndex) => (
                        <div
                          key={cell.id}
                          data-cell={`${rowIndex}-${colIndex}`}
                          className="w-full h-full"
                          style={{
                            cursor: 'pointer',
                          }}
                          onMouseDown={(e) => handleMouseDown(e, rowIndex, colIndex)}
                          onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                          onTouchStart={(e) => handleTouchStart(e, rowIndex, colIndex)}
                          onMouseUp={handleMouseUp}
                        />
                      ))}
                    </React.Fragment>
                  ))}
                </div>

                {/* 3D Cubes */}
                {grid.map((row, rowIndex) => (
                  <React.Fragment key={`cubes-${rowIndex}`}>
                    {row.map((cell, colIndex) => (
                      cell.colorIndex > 0 && render3DCube(colorPalette[cell.colorIndex], colIndex, rowIndex)
                    ))}
                  </React.Fragment>
                ))}
              </div>
          </motion.div>
        </div>
        
        {/* Right Panel - Colors and Templates */}
        <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
          <div className="flex flex-col gap-2">
            {/* Colors Panel */}
            <div className="pixel-border p-1 bg-gray-900/80">
              <h2 className="text-center text-xs font-pixel mb-1 text-white">COLORS</h2>
              <div className="grid grid-cols-4 gap-1">
                {colorPalette.slice(0, 24).map((color, index) => (
                  <button
                    key={`color-${index}`}
                    className={`w-7 h-7 transition-all ${selectedColorIndex === index ? 'ring-2 ring-white' : 'hover:scale-105'}`}
                    style={{
                      backgroundColor: color,
                      border: color === 'transparent' ? '1px dashed #666' : '1px solid rgba(255,255,255,0.1)',
                    }}
                    onClick={() => {
                      setSelectedColorIndex(index);
                      setIsErasing(false);
                    }}
                  >
                    {index === 0 && <span className="text-xs">🧹</span>}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Templates Panel */}
            <div className="pixel-border p-1 bg-gray-900/80">
              <h2 className="text-center text-xs font-pixel mb-1 text-white">TEMPLATES</h2>
              <div className="grid grid-cols-4 gap-1">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    className="w-7 h-7 bg-blue-900/60 flex items-center justify-center text-sm hover:bg-blue-800/60 transition-all"
                    onClick={() => applyTemplate(template)}
                    title={template.name}
                  >
                    {template.icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Export message */}
      <AnimatePresence>
        {showExportMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-10 left-1/2 transform -translate-x-1/2 px-3 py-2 bg-green-600/70 backdrop-blur-sm text-white z-50 pixel-border"
          >
            <span className="font-pixel text-sm">Image saved successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Tutorial overlay */}
      <AnimatePresence>
        {showTutorial && renderTutorial()}
      </AnimatePresence>
      
      {/* Global styles */}
      <style jsx global>{`
        .font-pixel {
          font-family: "Press Start 2P", monospace;
          letter-spacing: 0.05em;
        }
        
        .pixel-border {
          position: relative;
          box-shadow: 
            0 0 0 1px rgba(120, 120, 255, 0.5),
            0 0 0 2px rgba(0, 0, 0, 0.9),
            0 0 15px 0 rgba(100, 100, 255, 0.3);
        }
        
        .pixel-button {
          color: white;
          font-weight: bold;
          background-color: rgba(30, 30, 90, 0.6);
          border: 1px solid rgba(120, 120, 255, 0.5);
          box-shadow:
            0 0 0 1px rgba(0, 0, 0, 0.9),
            inset 0 0 8px rgba(80, 80, 255, 0.3);
          transition: all 0.1s;
        }
        
        .pixel-button:hover {
          transform: scale(1.02);
          box-shadow:
            0 0 0 1px rgba(0, 0, 0, 0.9),
            inset 0 0 12px rgba(100, 100, 255, 0.4);
        }
        
        .pixel-button:active {
          transform: scale(0.98);
          box-shadow:
            0 0 0 1px rgba(0, 0, 0, 0.9),
            inset 0 0 8px rgba(60, 60, 255, 0.5);
        }
        
        .cube-scene {
          perspective: 800px;
          perspective-origin: center center;
        }
        
        .cube {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
        }
        
        .cube-face {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
        }
        
        .game-grid-3d {
          transform-style: preserve-3d;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        
        @keyframes scan-line {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        
        .scan-line {
          animation: scan-line 8s linear infinite;
        }
      `}</style>
      
      {/* Animated scan line effect */}
      <div 
        className="absolute left-0 right-0 h-40 pointer-events-none z-30 opacity-10 scan-line"
        style={{
          background: `linear-gradient(0deg, transparent, ${mainColor}40, transparent)`,
        }}
      ></div>
    </div>
  );
};

export default VortexRealm;