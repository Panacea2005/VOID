"use client";

import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { AudioManager } from './game-engine/audio-manager';
import { PlayerController } from './game-engine/player-controller';
import { EnemyController } from './game-engine/enemy-controller';
import { LevelManager } from './game-engine/level-manager';
import { ParticleSystem } from './game-engine/particle-system';
import { getAllLevels } from './game-engine/levels';
import { 
  AudioEventType, 
  ParticleEffectType, 
  TileType, 
  PowerUpType, 
  LevelDefinition 
} from './types/game-types';

interface VoidResonanceGameProps {
  onExit: () => void;
}

const VoidResonanceGame: React.FC<VoidResonanceGameProps> = ({ onExit }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const audioManagerRef = useRef<AudioManager | null>(null);
  const particleSystemRef = useRef<ParticleSystem | null>(null);
  const levelManagerRef = useRef<LevelManager | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const deltaTimeRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const gameInitializedRef = useRef<boolean>(false);
  
  const [currentLevel, setCurrentLevel] = useState(1);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const [health, setHealth] = useState(3);
  const [energy, setEnergy] = useState(0);
  const [keys, setKeys] = useState(0);
  
  const allLevels = getAllLevels();

  // Initialize Three.js scene and game systems
  useEffect(() => {
    if (gameInitializedRef.current) return;
    
    console.log("Initializing game scene and systems...");
    
    try {
      // Scene setup
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000);
      sceneRef.current = scene;

      // Camera setup
      const camera = new THREE.PerspectiveCamera(
        60, 
        window.innerWidth / window.innerHeight, 
        0.1, 
        1000
      );
      // Position camera for a top-down view with slight angle
      camera.position.set(0, 15, 12);
      camera.lookAt(0, 0, 0);
      cameraRef.current = camera;

      // Renderer setup
      const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.setClearColor(0x000000, 1);
      
      if (containerRef.current) {
        // Clear any existing canvases first
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }
        containerRef.current.appendChild(renderer.domElement);
      }
      rendererRef.current = renderer;

      // Initialize audio manager
      const audioManager = new AudioManager();
      audioManagerRef.current = audioManager;

      // Initialize particle system
      const particleSystem = new ParticleSystem(scene);
      particleSystemRef.current = particleSystem;

      // Initialize level manager with callbacks
      const levelManager = new LevelManager(
        scene,
        particleSystem,
        audioManager,
        // Level completion callback
        handleLevelComplete,
        // Game over callback
        handleGameOver,
        // Message callback
        showGameMessage
      );
      levelManagerRef.current = levelManager;

      // Initialize first level
      const level = allLevels[currentLevel - 1];
      if (level) {
        levelManager.initializeLevel(level);
        // Play ambient music
        audioManager.playSound(AudioEventType.AMBIENT);
      }

      // Handle window resize
      const handleResize = () => {
        if (cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = window.innerWidth / window.innerHeight;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(window.innerWidth, window.innerHeight);
        }
      };
      
      window.addEventListener('resize', handleResize);

      // Set up keyboard event listeners
      const handleKeyDown = (e: KeyboardEvent) => {
        if (levelManagerRef.current) {
          levelManagerRef.current.handleKeyDown(e.key);
        }
        
        // Exit game on Escape
        if (e.key === 'Escape') {
          onExit();
        }
      };
      
      const handleKeyUp = (e: KeyboardEvent) => {
        if (levelManagerRef.current) {
          levelManagerRef.current.handleKeyUp(e.key);
        }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);

      // Set up game loop
      startGameLoop();
      
      gameInitializedRef.current = true;
      
      // Clean up on unmount
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        
        // Stop animation loop
        if (animationFrameIdRef.current) {
          cancelAnimationFrame(animationFrameIdRef.current);
        }
        
        // Dispose audio
        if (audioManagerRef.current) {
          audioManagerRef.current.dispose();
        }
        
        // Dispose particle system
        if (particleSystemRef.current) {
          particleSystemRef.current.dispose();
        }
        
        // Dispose level manager
        if (levelManagerRef.current) {
          levelManagerRef.current.dispose();
        }
        
        // Remove renderer
        if (rendererRef.current && containerRef.current) {
          containerRef.current.removeChild(rendererRef.current.domElement);
        }
        
        gameInitializedRef.current = false;
      };
    } catch (error) {
      console.error("Error in game initialization:", error);
      showGameMessage(`Error: ${error}`, 5000);
      return () => {};
    }
  }, [currentLevel, onExit, allLevels]);

  // Update level when currentLevel changes
  useEffect(() => {
    if (!gameInitializedRef.current || !levelManagerRef.current) return;
    
    console.log(`Loading level ${currentLevel}...`);
    
    // Get the level definition
    const level = allLevels[currentLevel - 1];
    if (level) {
      // Re-initialize with new level
      levelManagerRef.current.initializeLevel(level);
      
      // Reset game state
      setGameOver(false);
      setGameCompleted(false);
      
      // Play ambient music if it's not already playing
      if (audioManagerRef.current) {
        audioManagerRef.current.playSound(AudioEventType.AMBIENT);
      }
    } else {
      console.error(`Level ${currentLevel} not found`);
    }
  }, [currentLevel, allLevels]);

  // Game loop
  const startGameLoop = () => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }
    
    const animate = (time: number) => {
      animationFrameIdRef.current = requestAnimationFrame(animate);
      
      // Calculate delta time
      const deltaTime = time - (lastTimeRef.current || time);
      lastTimeRef.current = time;
      deltaTimeRef.current = deltaTime;
      
      // Update game systems
      if (levelManagerRef.current) {
        levelManagerRef.current.update(deltaTime);
      }
      
      if (particleSystemRef.current) {
        particleSystemRef.current.update(time);
      }
      
      // Update player stats from level manager
      updatePlayerStats();
      
      // Render scene
      if (rendererRef.current && cameraRef.current && sceneRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    
    animationFrameIdRef.current = requestAnimationFrame(animate);
  };

  // Update player stats UI
  const updatePlayerStats = () => {
    if (!levelManagerRef.current) return;
    
    // Get player state from level manager
    const playerState = levelManagerRef.current.getPlayerController()?.getPlayerState();
    if (playerState) {
      setHealth(playerState.health);
      setEnergy(playerState.energy);
      setKeys(playerState.keys);
    }
  };

  // Handle level completion
  const handleLevelComplete = () => {
    console.log("Level complete!");
    setGameCompleted(true);
    
    // Check if there are more levels
    setTimeout(() => {
      if (currentLevel < allLevels.length) {
        // Advance to next level
        setCurrentLevel(prev => prev + 1);
      } else {
        // Game completed - keep completion screen
        console.log("Game completed!");
      }
    }, 3000);
  };

  // Handle game over
  const handleGameOver = () => {
    console.log("Game over!");
    setGameOver(true);
    
    // Play game over sound
    if (audioManagerRef.current) {
      audioManagerRef.current.playSound(AudioEventType.GAME_OVER);
    }
  };

  // Show game message
  const showGameMessage = (message: string, duration: number) => {
    setMessageText(message);
    setShowMessage(true);
    
    // Clear message after duration
    setTimeout(() => {
      setShowMessage(false);
    }, duration);
  };

  // Handle restart level
  const handleRestartLevel = () => {
    if (!levelManagerRef.current) return;
    
    // Reset game states
    setGameOver(false);
    setGameCompleted(false);
    
    // Get the current level definition
    const level = allLevels[currentLevel - 1];
    if (level) {
      // Re-initialize level
      levelManagerRef.current.initializeLevel(level);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Game container */}
      <div
        ref={containerRef}
        className="w-full h-full"
      />
      
      {/* Player stats UI */}
      <div className="absolute top-16 left-4 z-50">
        <div className="px-3 py-2 bg-black bg-opacity-50 border border-purple-700 font-pixel">
          <div><span className="text-pink-400">HP:</span> <span className="text-white">{health}</span></div>
          <div><span className="text-purple-400">ENERGY:</span> <span className="text-white">{energy}</span></div>
          <div><span className="text-yellow-400">KEYS:</span> <span className="text-white">{keys}</span></div>
        </div>
      </div>
      
      {/* Level indicator */}
      <div className="absolute top-4 left-4 z-50">
        <div className="px-3 py-2 bg-black bg-opacity-50 border border-purple-700 font-pixel">
          <span className="text-purple-400">LEVEL</span> <span className="text-pink-500">{currentLevel}</span>
        </div>
      </div>
      
      {/* Game message overlay */}
      {showMessage && (
        <div className="absolute left-1/2 top-32 transform -translate-x-1/2 z-50 pointer-events-none">
          <div className="bg-black bg-opacity-70 px-6 py-3 rounded-sm border border-purple-700">
            <p className="text-xl text-pink-400 font-pixel text-center">{messageText}</p>
          </div>
        </div>
      )}
      
      {/* Game completion overlay */}
      {gameCompleted && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 pointer-events-none">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-4 text-purple-400 font-pixel" style={{ textShadow: "0 0 10px #a855f7" }}>
              {currentLevel < allLevels.length ? "LEVEL COMPLETE" : "VOID TRANSCENDED"}
            </h2>
            <p className="text-xl text-pink-500 font-pixel">
              {currentLevel < allLevels.length ? "Entering next level..." : "You have reached resonance with the void."}
            </p>
          </div>
        </div>
      )}
      
      {/* Game over overlay */}
      {gameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-4 text-red-500 font-pixel" style={{ textShadow: "0 0 10px #f87171" }}>
              GAME OVER
            </h2>
            <button
              onClick={handleRestartLevel}
              className="mt-6 px-6 py-3 bg-purple-900 bg-opacity-70 text-purple-300 border border-purple-700 hover:bg-purple-800 hover:text-white font-pixel"
            >
              RESTART LEVEL
            </button>
          </div>
        </div>
      )}
      
      {/* Game UI buttons */}
      <div className="absolute top-4 right-4 z-50 flex space-x-4">
        <button
          onClick={handleRestartLevel}
          className="px-3 py-2 text-sm bg-purple-900 bg-opacity-50 text-purple-300 border border-purple-700 hover:bg-purple-800 hover:text-white font-pixel"
        >
          RESTART
        </button>
        <button
          onClick={onExit}
          className="px-3 py-2 text-sm bg-pink-900 bg-opacity-50 text-pink-300 border border-pink-700 hover:bg-pink-800 hover:text-white font-pixel"
        >
          EXIT
        </button>
      </div>
      
      {/* Controls hint */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center z-50">
        <div className="px-4 py-2 bg-black bg-opacity-50 inline-block font-pixel text-sm">
          <span className="text-pink-400">WASD/ARROWS:</span> <span className="text-gray-300">MOVE</span> &nbsp;
          <span className="text-pink-400">ESC:</span> <span className="text-gray-300">EXIT</span>
        </div>
      </div>
    </div>
  );
};

export default VoidResonanceGame;