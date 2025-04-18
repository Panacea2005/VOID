import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import RealmCube from "../../cube/realm-cube";
import { cubeCollection } from "../../cube/realm-cube";

// Pulse Realm: Enhanced Rhythm Game with MP3 Audio
interface PulseRealmProps {
  onReturn: () => void;
  selectedCubeId?: string;
}

// Game difficulty levels
enum Difficulty {
  Easy = "easy",
  Medium = "medium",
  Hard = "hard"
}

// Track interface for music
interface Track {
  id: string;
  name: string;
  artist: string;
  bpm: number;
  mp3Path: string;
  duration: number;
  difficulty: Difficulty;
  color: string;
  gradient: string;
}

// Pulse wave interface
interface PulseWave {
  id: string;
  timestamp: number; // When this wave should be hit
  radius: number;    // Current visual radius
  hit: boolean;      // If it's been hit
  missed: boolean;   // If it's been missed
  color: string;     // Wave color
  type: "normal" | "fast" | "slow"; // Wave type affecting timing
  size: "small" | "medium" | "large"; // Visual size variation
  inHitZone: boolean; // Whether the wave is currently in the hit zone
}

// Hit result types
type HitResultType = "perfect" | "good" | "miss" | "early";

// Game states
type GameState = "intro" | "tutorial" | "playing" | "paused" | "gameOver" | "levelComplete";

// Available music tracks
const tracks: Track[] = [
  {
    id: "track1",
    name: "DIGITAL HEARTBEAT",
    artist: "VOID RESONANCE",
    bpm: 120,
    mp3Path: "/audio/void-theme.mp3",
    duration: 120,
    difficulty: Difficulty.Easy,
    color: "#60a5fa", // blue-400
    gradient: "from-blue-400 to-pink-600"
  },
  {
    id: "track2",
    name: "NEURAL PULSE",
    artist: "VOID RESONANCE",
    bpm: 140,
    mp3Path: "/audio/echo-theme.mp3",
    duration: 180,
    difficulty: Difficulty.Medium,
    color: "#8b5cf6", // purple-500
    gradient: "from-purple-500 to-blue-600"
  },
  {
    id: "track3",
    name: "QUANTUM BEAT",
    artist: "VOID RESONANCE",
    bpm: 160,
    mp3Path: "/audio/nexus-theme.mp3",
    duration: 240,
    difficulty: Difficulty.Hard,
    color: "#ec4899", // pink-500
    gradient: "from-pink-500 to-purple-600"
  }
];

const PulseRealm: React.FC<PulseRealmProps> = ({ 
  onReturn, 
  selectedCubeId = "pink-neon" 
}) => {
  // Game state
  const [gameState, setGameState] = useState<GameState>("intro");
  const [selectedTrack, setSelectedTrack] = useState<Track>(tracks[0]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [pulseWaves, setPulseWaves] = useState<PulseWave[]>([]);
  const [hitCount, setHitCount] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [isCubeGlowing, setIsCubeGlowing] = useState(false);
  const [isCubeError, setIsCubeError] = useState(false);
  const [isCubeRotating, setIsCubeRotating] = useState(false);
  const [isCubePulsing, setIsCubePulsing] = useState(false);
  const [isCubeFloating, setIsCubeFloating] = useState(false);
  const [gameTime, setGameTime] = useState(0);
  const [lastHitResult, setLastHitResult] = useState<HitResultType | null>(null);
  const [showHitResult, setShowHitResult] = useState(false);
  const [isTrackLoading, setIsTrackLoading] = useState(false);
  const [showPerfectEffect, setShowPerfectEffect] = useState(false);
  const [hitEffectColor, setHitEffectColor] = useState("#4ade80"); // Green for perfect
  const [isOuterRingActive, setIsOuterRingActive] = useState(false);
  const [volume, setVolume] = useState(70);
  const [showVolume, setShowVolume] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [cubeEnergy, setCubeEnergy] = useState(0);
  
  // Refs
  const animationFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number>(0);
  const gameStartTimeRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const comboMultiplierRef = useRef<number>(1);
  const perfectHitZoneRef = useRef<number>(20); // Radius in pixels for a perfect hit
  const goodHitZoneRef = useRef<number>(40); // Radius in pixels for a good hit
  const beatGeneratorIntervalRef = useRef<number | null>(null);
  const beatPatternRef = useRef<number[]>([]);
  const activeBeatIndexRef = useRef<number>(0);
  const lastBeatTimeRef = useRef<number>(0);
  const waveSpeedMultiplierRef = useRef<number>(1.0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // Constants
  const CUBE_SIZE = 100; // Increased cube size for better visibility
  const WAVE_RADIUS_MAX = 400; // Starting radius for waves (top-down view)
  const CUBE_HIT_ZONE = 70; // Further increased hit zone radius for easier gameplay
  const HIT_ANIMATION_DURATION = 300; // Duration of hit animation in ms
  const MIN_BEAT_INTERVAL = 1500; // Minimum 1.5 seconds between waves
  const MAX_BEAT_INTERVAL = 4000; // Maximum 4 seconds between waves
  // Constants for hit zones
  const PERFECT_HIT_ZONE_SIZE = 60; // Visual size of perfect hit zone
  const GOOD_HIT_ZONE_SIZE = 100; // Visual size of good hit zone
  
  // Get selected cube info
  const selectedCube = cubeCollection.find(cube => cube.id === selectedCubeId) || cubeCollection[0];
  
  // Get cube colors for visual effects
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

  // Handle mouse movement for effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      setMousePosition({ x, y });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  // Format time for display (mm:ss)
  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Display the hit result text
  const displayHitResult = (result: HitResultType) => {
    setLastHitResult(result);
    setShowHitResult(true);
    
    setTimeout(() => {
      setShowHitResult(false);
    }, 500);
  };
  
  // Handle miss
  const handleMiss = () => {
    // Reset combo
    setCombo(0);
    comboMultiplierRef.current = 1;
    setCubeEnergy(Math.max(0, cubeEnergy - 10)); // Decrease cube energy
    
    // Increment miss count
    setMissCount(prev => prev + 1);
    
    // Update accuracy
    setAccuracy(prev => {
      const total = hitCount + missCount + 1;
      return Math.round((hitCount / total) * 100);
    });
    
    // Visual feedback - miss
    setIsCubeError(true);
    
    // Display hit result
    displayHitResult("miss");
    
    setTimeout(() => {
      setIsCubeError(false);
    }, HIT_ANIMATION_DURATION);
  };
  
  // Handle good hit
  const handleGoodHit = (wave: PulseWave) => {
    // Update wave as hit
    setPulseWaves(prev => 
      prev.map(w => 
        w.id === wave.id ? { ...w, hit: true, inHitZone: false } : w
      )
    );
    
    // Increase combo
    setCombo(prev => {
      const newCombo = prev + 1;
      if (newCombo > maxCombo) {
        setMaxCombo(newCombo);
      }
      // Update combo multiplier ref
      comboMultiplierRef.current = 1 + Math.min(Math.floor(newCombo / 10) * 0.5, 5);
      return newCombo;
    });
    
    // Add score with combo multiplier (good hit)
    let baseScore = 50;
    if (wave.type === "fast") baseScore = 75;
    setScore(prev => Math.floor(prev + (baseScore * comboMultiplierRef.current)));
    
    // Increment hit count
    setHitCount(prev => prev + 1);
    
    // Update accuracy
    setAccuracy(prev => {
      const total = hitCount + missCount + 1;
      return Math.round(((hitCount + 1) / total) * 100);
    });
    
    // Increase cube energy
    setCubeEnergy(Math.min(100, cubeEnergy + 5));
    
    // Visual feedback - good hit
    setIsCubeGlowing(true);
    setShowPerfectEffect(true);
    setHitEffectColor("#facc15"); // Yellow for good hit
    
    // Display hit result
    displayHitResult("good");
    
    // Reset cube state after animation
    setTimeout(() => {
      setIsCubeGlowing(false);
      setShowPerfectEffect(false);
    }, HIT_ANIMATION_DURATION);
  };
  
  // Handle perfect hit with enhanced visual feedback
  const handlePerfectHit = (wave: PulseWave) => {
    // Update wave as hit
    setPulseWaves(prev => 
      prev.map(w => 
        w.id === wave.id ? { ...w, hit: true, inHitZone: false } : w
      )
    );
    
    // Increase combo
    setCombo(prev => {
      const newCombo = prev + 1;
      if (newCombo > maxCombo) {
        setMaxCombo(newCombo);
      }
      // Update combo multiplier ref
      comboMultiplierRef.current = 1 + Math.min(Math.floor(newCombo / 10) * 0.5, 5);
      return newCombo;
    });
    
    // Add score with combo multiplier (perfect hit)
    // Bigger score for more difficult wave types
    let baseScore = 100;
    if (wave.type === "fast") baseScore = 150;
    setScore(prev => Math.floor(prev + (baseScore * comboMultiplierRef.current)));
    
    // Increment hit count
    setHitCount(prev => prev + 1);
    
    // Update accuracy
    setAccuracy(prev => {
      const total = hitCount + missCount + 1;
      return Math.round(((hitCount + 1) / total) * 100);
    });
    
    // Increase cube energy
    setCubeEnergy(Math.min(100, cubeEnergy + 10));
    
    // Enhanced visual feedback for perfect hit
    setIsCubeGlowing(true);
    setIsCubeRotating(true);
    setIsCubePulsing(true);
    setShowPerfectEffect(true);
    setHitEffectColor("#4ade80"); // Green for perfect hit
    
    // Add floating animation for consecutive perfect hits
    if (combo > 5) {
      setIsCubeFloating(true);
      setTimeout(() => setIsCubeFloating(false), HIT_ANIMATION_DURATION * 2);
    }
    
    // Display hit result
    displayHitResult("perfect");
    
    // Reset cube state after animation
    setTimeout(() => {
      setIsCubeGlowing(false);
      setIsCubeRotating(false);
      setIsCubePulsing(false);
      setShowPerfectEffect(false);
    }, HIT_ANIMATION_DURATION);
  };
  
  // Handle when player attempts to hit a pulse
  const handlePulseHit = () => {
    // Get current game time
    const currentTime = Date.now() - gameStartTimeRef.current;
    
    // Find active waves in the hit zone
    const activeWaves = pulseWaves.filter(wave => !wave.hit && !wave.missed);
    const wavesInHitZone = activeWaves.filter(wave => wave.inHitZone);
    
    if (wavesInHitZone.length > 0) {
      // We have at least one wave in the hit zone - prioritize these
      const closestWave = wavesInHitZone[0]; // Just take the first one in the zone
      
      // Calculate how close to perfect center
      const distanceFromPerfect = Math.abs(closestWave.radius - PERFECT_HIT_ZONE_SIZE);
      const distanceFromGood = Math.abs(closestWave.radius - GOOD_HIT_ZONE_SIZE);
      
      // Determine hit quality
      if (distanceFromPerfect < 15) {
        handlePerfectHit(closestWave);
      } else {
        handleGoodHit(closestWave);
      }
      
      // Turn off the outer ring highlight
      setIsOuterRingActive(false);
    } else if (activeWaves.length > 0) {
      // No waves in hit zone, but there are active waves - early or late hit
      const closestWave = activeWaves[0];
      const timeToImpact = closestWave.timestamp - currentTime;
      
      if (timeToImpact > 0) {
        // Wave hasn't reached hit zone yet - early hit
        displayHitResult("early");
        setIsCubeError(true);
        setTimeout(() => setIsCubeError(false), HIT_ANIMATION_DURATION);
      } else {
        // Wave has passed hit zone - late hit/miss
        displayHitResult("miss");
        setIsCubeError(true);
        setTimeout(() => setIsCubeError(false), HIT_ANIMATION_DURATION);
      }
    } else {
      // No active waves at all - early hit
      displayHitResult("early");
      setIsCubeError(true);
      setTimeout(() => setIsCubeError(false), HIT_ANIMATION_DURATION);
    }
  };
  
  // Update waves' positions based on current time
  const updateWaves = (currentTime: number) => {
    setPulseWaves(prevWaves => {
      return prevWaves.map(wave => {
        // Calculate how close this wave is to its hit time
        const timeToImpact = wave.timestamp - (Date.now() - gameStartTimeRef.current);
        
        // Adjust baseTravelTime based on wave type - much slower for better playability
        let baseTravelTime = 7000; // Default travel time increased to 7 seconds
        if (wave.type === "fast") baseTravelTime = 6000; // Fast is still 6 seconds
        if (wave.type === "slow") baseTravelTime = 8000; // Slow is 8 seconds
        
        // Apply difficulty multiplier
        baseTravelTime = baseTravelTime / waveSpeedMultiplierRef.current;
        
        // Calculate radius based on time to impact
        // Using a non-linear curve for more natural movement
        const progress = 1 - (timeToImpact / baseTravelTime);
        const easedProgress = 1 - Math.pow(1 - Math.max(0, Math.min(1, progress)), 2);
        const radius = (1 - easedProgress) * WAVE_RADIUS_MAX;
        
        // Check if wave is in the hit zone
        const inPerfectHitZone = Math.abs(radius - PERFECT_HIT_ZONE_SIZE) < 15;
        const inGoodHitZone = !inPerfectHitZone && Math.abs(radius - GOOD_HIT_ZONE_SIZE) < 20;
        const inHitZone = inPerfectHitZone || inGoodHitZone;
        
        // Update the outer ring highlight state if any wave is in the hit zone
        if (inHitZone && !wave.hit && !wave.missed) {
          // This will be used in the next render
          if (!isOuterRingActive) {
            setIsOuterRingActive(true);
          }
        }
        
        // Check if wave should be missed (if it's gone past the center and wasn't hit)
        if (!wave.hit && !wave.missed && timeToImpact < -200) {
          // Wave passed without being hit
          handleMiss();
          if (isOuterRingActive) {
            setIsOuterRingActive(false);
          }
          return { ...wave, radius, missed: true, inHitZone: false };
        }
        
        return { ...wave, radius, inHitZone };
      }).filter(wave => {
        // Remove waves that are way past or fully hit
        const timeToImpact = wave.timestamp - (Date.now() - gameStartTimeRef.current);
        return (timeToImpact > -500) || (!wave.hit && !wave.missed);
      });
    });
    
    // Check if we need to turn off the outer ring highlight
    // This happens when no waves are in the hit zone
    const anyWaveInHitZone = pulseWaves.some(wave => wave.inHitZone && !wave.hit && !wave.missed);
    if (isOuterRingActive && !anyWaveInHitZone) {
      setIsOuterRingActive(false);
    }
  };
  
  // Get different colors based on wave type
  const getWaveColor = (type: "normal" | "fast" | "slow") => {
    switch (type) {
      case "fast":
        return "#f472b6"; // pink-400
      case "slow":
        return "#818cf8"; // indigo-400
      default:
        return selectedTrack.color;
    }
  };

  // Create a new beat with randomized properties but limited to improve clarity
  const createNewBeat = () => {
    // Only create a new wave if there are fewer than 1 active waves
    // This ensures waves come one at a time
    const activeWaveCount = pulseWaves.filter(w => !w.hit && !w.missed).length;
    
    if (activeWaveCount < 1) {
      // Limit wave types based on difficulty to prevent overwhelming players
      const waveTypes = ["normal", "fast", "slow"] as const;
      const waveSizes = ["small", "medium", "large"] as const;
      
      // Limit variation based on difficulty
      let availableWaveTypes;
      let availableWaveSizes;
      
      if (selectedTrack.difficulty === Difficulty.Easy) {
        // Easy - only normal waves for simplicity
        availableWaveTypes = ["normal"];
        availableWaveSizes = ["medium"]; // Only medium size for consistency
      } else if (selectedTrack.difficulty === Difficulty.Medium) {
        // Medium - mostly normal with occasional variations
        availableWaveTypes = Math.random() > 0.8 ? ["fast", "slow"] : ["normal"];
        availableWaveSizes = ["medium"]; // Keep size consistent
      } else {
        // Hard - more variety but still controlled
        availableWaveTypes = waveTypes;
        availableWaveSizes = waveSizes;
      }
      
      // Randomly select from available options
      const waveType = availableWaveTypes[Math.floor(Math.random() * availableWaveTypes.length)] as "normal" | "fast" | "slow";
      const waveSize = availableWaveSizes[Math.floor(Math.random() * availableWaveSizes.length)] as "small" | "medium" | "large";
      
      // Calculate arrival time based on type - slower for better playability
      const baseArrivalTime = 6000; // Increase to 6 seconds to travel for better visibility
      let arrivalTimeMultiplier = 1.0;
      
      if (waveType === "fast") arrivalTimeMultiplier = 0.85; // Only slightly faster
      if (waveType === "slow") arrivalTimeMultiplier = 1.15; // Only slightly slower
      
      // Apply difficulty and get final arrival time
      const arrivalTime = baseArrivalTime * arrivalTimeMultiplier / waveSpeedMultiplierRef.current;
      
      // Get current time
      const currentTime = Date.now() - gameStartTimeRef.current;
      
      // Calculate when this wave should arrive at center
      const arrivalTimestamp = currentTime + arrivalTime;
      
      // Create wave with randomized properties
      const newWave: PulseWave = {
        id: `wave-${Date.now()}-${Math.random()}`,
        timestamp: arrivalTimestamp,
        radius: WAVE_RADIUS_MAX,
        hit: false,
        missed: false,
        color: getWaveColor(waveType),
        type: waveType,
        size: waveSize,
        inHitZone: false
      };
      
      setPulseWaves(prev => [...prev, newWave]);
    }
  };

  // Generate a random beat pattern based on difficulty
  const generateRandomBeatPattern = () => {
    const patternLength = 3 + Math.floor(Math.random() * 3); // 3-6 beats in a pattern (even shorter for better consistency)
    const newPattern: number[] = [];
    
    // Base interval affected by BPM and difficulty
    // Much longer base interval to ensure waves are well-spaced and one at a time
    const baseBeatInterval = Math.min(60000 / selectedTrack.bpm * 1.5, 2000); // Minimum 2 seconds between waves
    
    for (let i = 0; i < patternLength; i++) {
      // Very little randomness to timing between beats for consistent, predictable gameplay
      const variabilityFactor = Math.random() * 0.1 + 0.95; // 0.95-1.05 range (minimal variability)
      
      // More consistent intervals
      const interval = baseBeatInterval * variabilityFactor;
      
      // Ensure minimum and maximum interval constraints with wider bounds
      // At least 1.5 seconds between waves, at most 4 seconds
      const finalInterval = Math.max(1500, Math.min(4000, interval));
      
      newPattern.push(finalInterval);
    }
    
    // Ensure we have a valid pattern
    if (newPattern.length === 0) {
      newPattern.push(2000); // Fallback to 2 second interval
    }
    
    beatPatternRef.current = newPattern;
  };

  // Reset game state
  const resetGameState = () => {
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setAccuracy(100);
    setPulseWaves([]);
    setHitCount(0);
    setMissCount(0);
    setGameTime(0);
    setCubeEnergy(30); // Start with some energy
    lastTimestampRef.current = 0;
    gameStartTimeRef.current = 0;
    comboMultiplierRef.current = 1;
    beatPatternRef.current = [];
    activeBeatIndexRef.current = 0;
    lastBeatTimeRef.current = 0;
    
    // Set difficulty-based parameters with much slower speeds for one-wave-at-a-time gameplay
    switch (selectedTrack.difficulty) {
      case Difficulty.Easy:
        perfectHitZoneRef.current = 35; // Even larger perfect hit zone
        goodHitZoneRef.current = 70;    // Even larger good hit zone
        waveSpeedMultiplierRef.current = 0.4; // Extremely slow for easier gameplay
        break;
      case Difficulty.Medium:
        perfectHitZoneRef.current = 30;
        goodHitZoneRef.current = 60;
        waveSpeedMultiplierRef.current = 0.5; // Much slower
        break;
      case Difficulty.Hard:
        perfectHitZoneRef.current = 25;
        goodHitZoneRef.current = 50;
        waveSpeedMultiplierRef.current = 0.7; // Still challenging but slower
        break;
    }
    
    // Generate initial random beat pattern
    generateRandomBeatPattern();
  };

  // Game loop
  const gameLoop = (timestamp: number) => {
    if (!gameStartTimeRef.current) {
      gameStartTimeRef.current = timestamp;
      
      // Create just one initial wave to start with
      setTimeout(() => {
        createNewBeat();
      }, 1000); // Start first wave after 1 second
    }
    
    const elapsed = timestamp - (lastTimestampRef.current || gameStartTimeRef.current);
    lastTimestampRef.current = timestamp;
    
    // Calculate current game time
    const currentGameTime = !audioRef.current ? 0 : audioRef.current.currentTime * 1000;
    setGameTime(currentGameTime);
    
    // Check if it's time for a new beat
    const currentTime = Date.now();
    const timeSinceLastBeat = currentTime - lastBeatTimeRef.current;
    
    // Check if we need a new wave - but only if there are no active waves
    // This ensures one wave at a time
    const activeWaveCount = pulseWaves.filter(w => !w.hit && !w.missed).length;
    
    if (activeWaveCount === 0 && timeSinceLastBeat >= MIN_BEAT_INTERVAL) {
      // Create a new beat
      createNewBeat();
      
      // Update last beat time
      lastBeatTimeRef.current = currentTime;
      
      // Move to next beat in pattern
      activeBeatIndexRef.current = (activeBeatIndexRef.current + 1) % beatPatternRef.current.length;
      
      // Occasionally generate a new pattern for variety
      if (activeBeatIndexRef.current === 0 && Math.random() > 0.7) {
        generateRandomBeatPattern();
      }
    }
    
    // Update existing waves
    updateWaves(currentGameTime);
    
    // Check for game completion
    if (audioRef.current && audioRef.current.ended) {
      setGameState("levelComplete");
      return;
    }
    
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  };

  // Start game loop
  const startGameLoop = () => {
    // Create initial waves immediately to ensure the game isn't empty
    createNewBeat();
    
    // Set a brief delay before starting
    setTimeout(() => {
      // Start audio
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(error => {
          console.error("Audio playback failed:", error);
        });
        
        // Record start time
        gameStartTimeRef.current = Date.now();
        lastBeatTimeRef.current = Date.now();
        
        // Start animation loop
        animationFrameRef.current = requestAnimationFrame(gameLoop);
      }
    }, 500); // Reduced to 500ms to start gameplay sooner
  };

  // Start game after tutorial
  const startGameAfterTutorial = () => {
    setGameState("playing");
  };

  // Pause game
  const pauseGame = () => {
    if (gameState === "playing") {
      // Pause the game and audio
      setGameState("paused");
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    } else if (gameState === "paused") {
      // Resume the game and audio
      setGameState("playing");
      if (audioRef.current) {
        audioRef.current.play();
      }
      lastBeatTimeRef.current = Date.now(); // Reset beat timing
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }
  };

  // Restart game
  const restartGame = () => {
    // Reset and restart with same track
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    startGame(selectedTrack);
  };

  // Return to intro
  const returnToIntro = () => {
    // Pause audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    // Clear animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Reset game state
    setGameState("intro");
    setPulseWaves([]);
  };

  // Adjust volume
  const adjustVolume = (newVolume: number) => {
    // Clamp value between 0 and 100
    const clampedVolume = Math.max(0, Math.min(100, newVolume));
    setVolume(clampedVolume);
    
    // Apply to audio if it exists
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume / 100;
    }
  };

  // Start game
  const startGame = (track: Track) => {
    setIsTrackLoading(true);
    
    // Preload audio
    const audio = new Audio(track.mp3Path);
    audio.volume = volume / 100;
    
    // When audio is ready
    audio.oncanplaythrough = () => {
      audioRef.current = audio;
      setSelectedTrack(track);
      setIsTrackLoading(false);
      
      // Reset game state for new game
      resetGameState();
      
      // Show tutorial first for easier difficulty or start directly
      if (track.difficulty === Difficulty.Easy) {
        setGameState("tutorial");
      } else {
        setGameState("playing");
      }
    };
    
    // Handle errors
    audio.onerror = () => {
      console.error("Error loading audio:", track.mp3Path);
      setIsTrackLoading(false);
      // Show a notification to the user
      alert("Failed to load audio. Please try another track.");
    };
    
    // Start loading
    audio.load();
  };
  
  // Initialize game state and audio
  useEffect(() => {
    if (gameState === "playing") {
      // Create audio element if it doesn't exist
      if (!audioRef.current) {
        const audio = new Audio(selectedTrack.mp3Path);
        audio.volume = volume / 100;
        audioRef.current = audio;
      }
      
      // Start game loop
      startGameLoop();
    } else {
      // Pause audio and clean up when not playing
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      // Clean up animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // Clear beat generator interval
      if (beatGeneratorIntervalRef.current) {
        clearInterval(beatGeneratorIntervalRef.current);
        beatGeneratorIntervalRef.current = null;
      }
    }
    
    return () => {
      // Cleanup on unmount
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (beatGeneratorIntervalRef.current) {
        clearInterval(beatGeneratorIntervalRef.current);
      }
    };
  }, [gameState, selectedTrack]);
  
  // Handle key presses
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") return;
      
      // Handle spacebar press for hitting waves
      if (e.code === "Space") {
        e.preventDefault(); // Prevent page scroll
        handlePulseHit();
      }
      
      // Handle escape key for pausing
      if (e.code === "Escape") {
        setGameState(prev => prev === "playing" ? "paused" : "playing");
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [gameState, pulseWaves]);
  
  // Render the pulse waves with much clearer visual indicators
  const renderPulseWaves = () => {
    return pulseWaves.map(wave => {
      // Size multiplier based on wave size
      let sizeMultiplier = 1;
      if (wave.size === "small") sizeMultiplier = 0.9; // Less variance for better clarity
      if (wave.size === "large") sizeMultiplier = 1.1; // Less variance for better clarity
      
      // Different styles based on wave type with much clearer visual distinctions
      let borderWidth = 4; // Thicker border for better visibility
      let opacity = 0.85; // Higher opacity for better visibility
      let shadowSize = 15;
      
      // Clear visual indicators for different wave types
      let waveColor = wave.color;
      let waveStyle: { borderStyle?: string; animation?: string } = {};
      
      if (wave.type === "fast") {
        borderWidth = 5;
        shadowSize = 20;
        waveColor = '#f472b6'; // pink-400
        waveStyle = {
          borderStyle: 'dashed',
          animation: 'fastWavePulse 0.8s infinite'
        };
      } else if (wave.type === "slow") {
        borderWidth = 6;
        shadowSize = 15;
        waveColor = '#818cf8'; // indigo-400
        waveStyle = {
          borderStyle: 'dotted' 
        };
      } else {
        // Normal wave
        waveStyle = {
          borderStyle: 'solid'
        };
      }
      
      if (wave.hit) {
        opacity = 0.6;
      } else if (wave.missed) {
        opacity = 0.4;
      }
      
      // Calculate how close this wave is to the hit zone
      const isInHitZone = wave.inHitZone && !wave.hit && !wave.missed;
      
      // Add visual cue when wave is in hit zone
      if (isInHitZone) {
        opacity = 1;
        shadowSize = 25;
        borderWidth += 1;
      }
      
      return (
        <motion.div
          key={wave.id}
          className={`absolute rounded-full ${wave.hit ? 'opacity-60' : ''} ${wave.missed ? 'opacity-40' : ''}`}
          style={{
            width: `${Math.max(wave.radius * 2 * sizeMultiplier, 0)}px`,
            height: `${Math.max(wave.radius * 2 * sizeMultiplier, 0)}px`,
            border: `${borderWidth}px ${waveStyle.borderStyle || 'solid'} ${wave.hit ? cubeColor : wave.missed ? '#ef4444' : waveColor}`,
            boxShadow: `0 0 ${shadowSize}px ${wave.hit ? cubeColor : wave.missed ? '#ef4444' : waveColor}`,
            opacity: opacity,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 5,
            ...waveStyle
          }}
        />
      );
    });
  };
  
  // Render hit zone with much clearer visual indicators
  const renderHitZone = () => {
    return (
      <>
        {/* Perfect hit zone with prominent animation */}
        <motion.div
          className={`absolute rounded-full border-4 ${isOuterRingActive ? 'border-green-400' : 'border-green-400/70'}`}
          animate={{ 
            scale: isOuterRingActive ? [1.02, 1.07, 1.02] : [1, 1.05, 1],
            opacity: isOuterRingActive ? [0.9, 1, 0.9] : [0.8, 1, 0.8],
            boxShadow: isOuterRingActive ? [
              '0 0 20px rgba(74, 222, 128, 0.7)',
              '0 0 30px rgba(74, 222, 128, 0.9)',
              '0 0 20px rgba(74, 222, 128, 0.7)'
            ] : [
              '0 0 15px rgba(74, 222, 128, 0.4)',
              '0 0 25px rgba(74, 222, 128, 0.6)',
              '0 0 15px rgba(74, 222, 128, 0.4)'
            ]
          }}
          transition={{ 
            duration: isOuterRingActive ? 0.8 : 1.5, 
            repeat: Infinity,
            ease: "easeInOut" 
          }}
          style={{
            width: PERFECT_HIT_ZONE_SIZE * 2,
            height: PERFECT_HIT_ZONE_SIZE * 2,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 3,
            background: isOuterRingActive ? 
              'radial-gradient(circle, rgba(74,222,128,0.15) 0%, transparent 70%)' :
              'radial-gradient(circle, rgba(74,222,128,0.1) 0%, transparent 70%)'
          }}
        />
        
        {/* Good hit zone with clear visual indicator */}
        <motion.div
          className={`absolute rounded-full border-3 ${isOuterRingActive ? 'border-yellow-400' : 'border-yellow-400/60'}`}
          animate={{ 
            opacity: isOuterRingActive ? [0.8, 1, 0.8] : [0.6, 0.8, 0.6],
            boxShadow: isOuterRingActive ? [
              '0 0 15px rgba(250, 204, 21, 0.5)',
              '0 0 25px rgba(250, 204, 21, 0.8)',
              '0 0 15px rgba(250, 204, 21, 0.5)'
            ] : [
              '0 0 10px rgba(250, 204, 21, 0.3)',
              '0 0 20px rgba(250, 204, 21, 0.5)',
              '0 0 10px rgba(250, 204, 21, 0.3)'
            ]
          }}
          transition={{ 
            duration: isOuterRingActive ? 1 : 2, 
            repeat: Infinity,
            ease: "easeInOut" 
          }}
          style={{
            width: GOOD_HIT_ZONE_SIZE * 2,
            height: GOOD_HIT_ZONE_SIZE * 2,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 2
          }}
        />
        
        {/* Text indicators around the ring - only when active */}
        {isOuterRingActive && (
          <div className="absolute z-10 pointer-events-none">
            <div 
              className="absolute text-center font-bold text-green-400 text-sm bg-black/30 px-2 py-1 rounded"
              style={{
                top: '50%', 
                left: '50%',
                transform: 'translate(-50%, -140px)',
                textShadow: '0 0 5px rgba(74, 222, 128, 0.8)'
              }}
            >
              CLICK NOW!
            </div>
          </div>
        )}
        
        {/* Outer zone border for reference - make it more visible */}
        <div 
          className={`absolute rounded-full border ${isOuterRingActive ? 'border-white/60' : 'border-white/30'}`}
          style={{
            width: GOOD_HIT_ZONE_SIZE * 3,
            height: GOOD_HIT_ZONE_SIZE * 3,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1
          }}
        />
      </>
    );
  };
  
  // Generate background particles
  const renderBackgroundParticles = () => {
    return Array.from({ length: 30 }).map((_, i) => (
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
  
  // Render the game grid (top-down perspective)
  const renderGameGrid = () => {
    // Calculate a reactive background intensity based on combo
    const intensityFactor = Math.min(0.3 + (combo / 100) * 0.7, 1);
    
    return (
      <div 
        ref={containerRef}
        className="relative flex items-center justify-center h-screen bg-black overflow-hidden"
      >
        {/* Background particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {renderBackgroundParticles()}
        </div>
        
        {/* Circular grid lines for depth - more subtle for top-down view */}
        {[0.2, 0.4, 0.6, 0.8, 1.0].map((size, index) => (
          <div
            key={`grid-circle-${index}`}
            className="absolute rounded-full border border-blue-500/10"
            style={{
              width: `${WAVE_RADIUS_MAX * 2 * size}px`,
              height: `${WAVE_RADIUS_MAX * 2 * size}px`,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1
            }}
          />
        ))}
        
        {/* More subtle radial grid lines for top-down view */}
        {Array.from({ length: 12 }).map((_, index) => (
          <div
            key={`grid-line-${index}`}
            className="absolute bg-blue-500/5"
            style={{
              width: '1px',
              height: WAVE_RADIUS_MAX * 2,
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) rotate(${index * 30}deg)`,
              zIndex: 1
            }}
          />
        ))}
        
        {/* Pulse waves */}
        {renderPulseWaves()}
        
        {/* Hit zone */}
        {renderHitZone()}
        
        {/* Hit Result Text */}
        <AnimatePresence>
          {showHitResult && (
            <motion.div
              key="hit-result"
              initial={{ opacity: 0, y: 0, scale: 0.8 }}
              animate={{ opacity: 1, y: -50, scale: 1.2 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="absolute z-20"
              style={{
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: 
                  lastHitResult === "perfect" ? '#4ade80' : 
                  lastHitResult === "good" ? '#facc15' : 
                  '#ef4444',
                fontSize: lastHitResult === "perfect" ? '32px' : '24px',
                fontWeight: 'bold',
                textShadow: `0 0 15px ${
                  lastHitResult === "perfect" ? 'rgba(74, 222, 128, 0.7)' : 
                  lastHitResult === "good" ? 'rgba(250, 204, 21, 0.7)' : 
                  'rgba(239, 68, 68, 0.7)'
                }`
              }}
            >
              {lastHitResult === "perfect" ? "PERFECT!" : 
               lastHitResult === "good" ? "GOOD" : 
               lastHitResult === "early" ? "TOO EARLY" : 
               "MISS"}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Perfect/Good hit effect */}
        <AnimatePresence>
          {showPerfectEffect && (
            <motion.div
              key="perfect-effect"
              initial={{ scale: 0.8, opacity: 0.8 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7 }}
              className="absolute rounded-full z-15"
              style={{
                width: CUBE_SIZE * 2,
                height: CUBE_SIZE * 2,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                border: `3px solid ${hitEffectColor}`,
                boxShadow: `0 0 30px ${hitEffectColor}`,
              }}
            />
          )}
        </AnimatePresence>
        
        {/* Center cube with enhanced animations */}
        <div 
          className={`absolute z-10 transition-all duration-300 ${isCubeGlowing ? 'animate-pulse' : ''}`}
          style={{
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) 
              ${isCubePulsing ? 'scale(1.15)' : 'scale(1)'}
              ${isCubeRotating ? 'rotate(45deg)' : 'rotate(0)'}
              ${isCubeFloating ? 'translateY(-10px)' : 'translateY(0)'}`,
            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
          onClick={handlePulseHit}
        >
          <div className={isCubeError ? 'animate-shake' : ''}>
            <div className="relative">
              {/* Enhanced glow effect around cube */}
              <div 
                className="absolute rounded-full" 
                style={{
                  width: CUBE_SIZE * 2,
                  height: CUBE_SIZE * 2,
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  background: `radial-gradient(circle, ${cubeColor}${isCubeGlowing ? '80' : '30'} 0%, transparent 70%)`,
                  filter: `blur(${8 + combo / 8}px)`,
                  opacity: isCubeError ? 0.1 : (0.4 + intensityFactor * 0.6),
                  zIndex: 5
                }}
              />
              
              {/* Cube energy aura */}
              <motion.div
                className="absolute rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.4, 0.6, 0.4]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{
                  width: CUBE_SIZE * 2.5,
                  height: CUBE_SIZE * 2.5,
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  background: `radial-gradient(circle, ${cubeColor}${Math.floor((cubeEnergy/100) * 70 + 10).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
                  zIndex: 4,
                  filter: 'blur(10px)'
                }}
              />
              
              {/* Error effect */}
              {isCubeError && (
                <div 
                  className="absolute rounded-full" 
                  style={{
                    width: CUBE_SIZE * 2,
                    height: CUBE_SIZE * 2,
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'radial-gradient(circle, rgba(239, 68, 68, 0.6) 0%, transparent 70%)',
                    filter: 'blur(12px)',
                    zIndex: 6
                  }}
                />
              )}
              
              {/* Energy level indicator */}
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 z-20 w-20">
                <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${cubeEnergy}%`,
                      background: `linear-gradient(to right, ${
                        cubeEnergy > 70 ? '#4ade80' : 
                        cubeEnergy > 30 ? '#facc15' : 
                        '#ef4444'
                      }, ${
                        cubeEnergy > 70 ? '#10b981' : 
                        cubeEnergy > 30 ? '#eab308' : 
                        '#dc2626'
                      })`
                    }}
                  />
                </div>
              </div>
              
              {/* The cube with energy-based animation speed */}
              <RealmCube
                position="center"
                size={CUBE_SIZE}
                cubeId={selectedCubeId}
                isAnimated={isCubeGlowing || isCubeRotating || cubeEnergy > 50}
                onCubeClick={handlePulseHit} // Allow clicking the cube too
              />
              
              {/* Orbiting energy particles - only when energy is high */}
              {cubeEnergy > 50 && (
                <div className="absolute inset-0">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <motion.div
                      key={`cube-energy-${i}`}
                      className="absolute w-2 h-2 rounded-full"
                      animate={{
                        rotate: 360
                      }}
                      transition={{
                        duration: 3 - (i * 0.5),
                        repeat: Infinity,
                        ease: "linear"
                      }}
                      style={{
                        top: '50%',
                        left: '50%',
                        transformOrigin: 'center',
                        background: cubeColor,
                        boxShadow: `0 0 5px ${cubeColor}`,
                        transform: `translate(-50%, -50%) rotate(${i * 120}deg) translateX(${CUBE_SIZE * 0.8}px)`
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Circular pulse on space indicator */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm px-6 py-2 rounded-full border border-blue-500/30 z-20">
          <div className="flex items-center">
            <span className="text-blue-400 font-pixel text-sm">
              PRESS <span className="text-white bg-blue-900/50 px-2 py-0.5 rounded mx-1">SPACE</span> OR <span className="text-white bg-blue-900/50 px-2 py-0.5 rounded mx-1">CLICK</span> WHEN WAVES REACH RINGS
            </span>
          </div>
        </div>
        
        {/* Top header with track info */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full border border-blue-500/30 z-20">
          <div className="flex items-center gap-2">
            <span className="text-blue-300 font-pixel text-sm whitespace-nowrap">
              {selectedTrack.name}
            </span>
            <span className="h-3 w-px bg-blue-500/30"></span>
            <span className="text-blue-300 font-pixel text-sm">
              {selectedTrack.bpm} BPM
            </span>
            <span className="h-3 w-px bg-blue-500/30"></span>
            <span className={`font-pixel text-sm ${
              selectedTrack.difficulty === Difficulty.Easy ? 'text-green-400' :
              selectedTrack.difficulty === Difficulty.Medium ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {selectedTrack.difficulty.toUpperCase()}
            </span>
          </div>
        </div>
        
        {/* Audio controls - top right below exit */}
        <div className="absolute top-16 right-4 flex flex-col items-end z-30">
          <button 
            className="bg-black/70 backdrop-blur-sm border border-blue-500/30 rounded px-2 py-1.5 text-blue-400 hover:bg-blue-900/20 transition-colors"
            onClick={() => setShowVolume(!showVolume)}
          >
            {volume === 0 ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="1" y1="1" x2="23" y2="23"></line>
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
            ) : volume < 30 ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
              </svg>
            )}
          </button>
          
          {/* Volume slider */}
          <AnimatePresence>
            {showVolume && (
              <motion.div 
                className="mt-2 bg-black/70 backdrop-blur-sm border border-blue-500/30 rounded p-2 flex flex-col items-center"
                initial={{ opacity: 0, height: 0, width: 0 }}
                animate={{ opacity: 1, height: 'auto', width: 'auto' }}
                exit={{ opacity: 0, height: 0, width: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="h-32 w-6 bg-gray-800 rounded-full relative flex justify-center my-2">
                  <div 
                    className="absolute bottom-0 w-full rounded-full"
                    style={{ 
                      height: `${volume}%`,
                      background: `linear-gradient(to top, #3b82f6, #8b5cf6)`
                    }}
                  />
                  <div
                    className="absolute w-6 h-3 rounded-full bg-white cursor-pointer z-10"
                    style={{ bottom: `${volume}%`, transform: 'translateY(50%)' }}
                    onMouseDown={(e) => {
                      const handleDrag = (moveEvent: MouseEvent) => {
                        if (!e.currentTarget.parentElement) return;
                        
                        const rect = e.currentTarget.parentElement.getBoundingClientRect();
                        const height = rect.height;
                        const y = moveEvent.clientY - rect.top;
                        
                        // Calculate volume (0-100) from bottom to top
                        const newVolume = Math.round(100 - ((y / height) * 100));
                        adjustVolume(newVolume);
                      };
                      
                      const handleMouseUp = () => {
                        document.removeEventListener('mousemove', handleDrag);
                        document.removeEventListener('mouseup', handleMouseUp);
                      };
                      
                      document.addEventListener('mousemove', handleDrag);
                      document.addEventListener('mouseup', handleMouseUp);
                    }}
                  />
                </div>
                <div className="text-white text-xs">{volume}%</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Left sidebar with score, combo, etc. - compact circular displays */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-4 z-30">
          {/* Score display */}
          <div className="bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-blue-500/30 text-center shadow-lg w-36">
            <div className="text-blue-300 font-pixel text-xs mb-1">SCORE</div>
            <div className={`text-2xl font-bold transition-colors ${score > 5000 ? 'text-pink-400' : score > 2000 ? 'text-purple-400' : 'text-blue-400'}`}>
              {score.toLocaleString()}
            </div>
          </div>
          
          {/* Combo display */}
          <div className="bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-purple-500/30 text-center shadow-lg w-36">
            <div className="text-purple-300 font-pixel text-xs mb-1">COMBO</div>
            <div className={`text-2xl font-bold transition-colors ${combo > 20 ? 'text-pink-400' : combo > 10 ? 'text-purple-400' : 'text-blue-400'}`}>
              {combo}×
            </div>
            {combo > 0 && (
              <div className="w-full bg-gray-900 h-1 mt-1 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-pink-500 h-full"
                  style={{ width: `${Math.min((combo % 10) * 10, 100)}%` }}
                />
              </div>
            )}
          </div>
          
          {/* Accuracy display */}
          <div className="bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-green-500/30 text-center shadow-lg w-36">
            <div className="text-green-300 font-pixel text-xs mb-1">ACCURACY</div>
            <div className={`text-2xl font-bold transition-colors ${accuracy > 90 ? 'text-green-400' : accuracy > 70 ? 'text-yellow-400' : 'text-red-400'}`}>
              {accuracy}%
            </div>
          </div>
        </div>
        
        {/* Right sidebar - time and controls */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-4 z-30">
          {/* Time display */}
          <div className="bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-teal-500/30 text-center shadow-lg w-28">
            <div className="text-teal-300 font-pixel text-xs mb-1">TIME</div>
            <div className="text-xl font-bold text-white">
              {formatTime(gameTime)}
            </div>
          </div>
          
          {/* Pause button */}
          <button
            onClick={pauseGame}
            className="bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-amber-500/30 text-center shadow-lg hover:bg-blue-900/30 transition-colors"
            title="Pause Game"
          >
            <div className="flex justify-center">
              <div className="w-5 h-10 border-l-4 border-r-4 border-amber-400"></div>
            </div>
          </button>
        </div>
        
        {/* Background intensity effect based on combo */}
        <div 
          className="absolute inset-0 bg-gradient-to-r from-blue-900/10 to-pink-900/10 z-0 transition-opacity duration-500"
          style={{ 
            opacity: intensityFactor,
            background: `radial-gradient(circle, rgba(37, 99, 235, ${intensityFactor * 0.15}) 0%, rgba(219, 39, 119, ${intensityFactor * 0.1}) 60%, transparent 100%)` 
          }}
        />
        
        {/* Dynamic ambient light that follows mouse */}
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, ${cubeColor}15 0%, transparent 70%)`,
            filter: 'blur(40px)',
          }}
        />
      </div>
    );
  };
  
  // Render redesigned intro screen with 3D-inspired UI
  const renderIntroScreen = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-blue-900/20 via-black to-black text-white overflow-hidden">
      {/* 3D-inspired background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large glowing orb in background */}
        <div 
          className="absolute rounded-full"
          style={{
            width: '600px',
            height: '600px',
            top: '40%',
            left: '60%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(31, 41, 55, 0) 70%)',
            filter: 'blur(40px)',
            zIndex: 0
          }}
        />
        
        {/* Grid lines for depth */}
        <div 
          className="absolute w-screen h-screen"
          style={{
            background: 'linear-gradient(transparent 95%, rgba(59, 130, 246, 0.1) 100%), linear-gradient(90deg, transparent 95%, rgba(59, 130, 246, 0.1) 100%)',
            backgroundSize: '40px 40px',
            opacity: 0.4,
            transform: 'perspective(1000px) rotateX(60deg) scale(2) translateY(100px)',
            transformOrigin: 'center center',
            zIndex: 0
          }}
        />
        
        {/* Floating particles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={`particle-3d-${i}`}
            className="absolute rounded-full bg-gradient-to-r from-blue-400 to-pink-600"
            animate={{
              x: [
                Math.random() * window.innerWidth,
                Math.random() * window.innerWidth
              ],
              y: [
                Math.random() * window.innerHeight,
                Math.random() * window.innerHeight
              ],
              z: [0, Math.random() * 100]
            }}
            transition={{
              duration: Math.random() * 20 + 10,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              width: `${Math.random() * 6 + 2}px`,
              height: `${Math.random() * 6 + 2}px`,
              opacity: Math.random() * 0.5 + 0.2,
              boxShadow: `0 0 ${Math.random() * 10 + 5}px currentColor`,
              filter: 'blur(1px)'
            }}
          />
        ))}
      </div>
      
      <div className="max-w-4xl w-full mx-auto relative z-10">
        {/* Title with 3D-like effect */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-7xl font-bold tracking-widest mb-4 relative">
            <span className="absolute text-blue-900 blur-sm" style={{ left: '2px', top: '2px' }}>PULSE REALM</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-600">PULSE REALM</span>
          </h1>
          <p className="text-lg text-blue-300 max-w-2xl mx-auto">
            Synchronize with the rhythm of the void, feel its pulse, and become one with the beat.
          </p>
        </motion.div>
        
        {/* Track selection - redesigned with 3D-inspired cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {tracks.map((track, index) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              whileHover={{ 
                scale: 1.05, 
                rotateY: 5,
                translateZ: 20,
                transition: { duration: 0.3 } 
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => !isTrackLoading && startGame(track)}
              className={`relative overflow-hidden cursor-pointer group ${
                isTrackLoading ? 'opacity-50 cursor-not-allowed' : ''
              } ${selectedTrack.id === track.id ? 'ring-2 ring-blue-500' : ''}`}
              style={{
                background: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                transform: 'perspective(1000px)',
                transformStyle: 'preserve-3d'
              }}
            >
              {/* 3D lighting effect */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.2) 100%)'
                }}
              />
              
              {/* Glowing border effect on hover */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  boxShadow: 'inset 0 0 20px rgba(59, 130, 246, 0.5)',
                  pointerEvents: 'none'
                }}
              />
              
              {/* Track content */}
              <div className="p-6 relative">
                {/* Difficulty indicator */}
                <div className="h-20 mb-4 flex items-end gap-1 justify-center mx-auto">
                  {Array.from({ length: 16 }).map((_, i) => {
                    // Create dynamic wave pattern based on track properties
                    const height = 30 + Math.sin(i * (track.bpm / 60)) * 20 + Math.random() * 20;
                    
                    return (
                      <motion.div
                        key={`wave-${track.id}-${i}`}
                        initial={{ height: 5 }}
                        animate={{ height: height }}
                        transition={{ 
                          duration: 1.5, 
                          repeat: Infinity,
                          repeatType: "reverse",
                          delay: i * 0.05
                        }}
                        className="w-1 rounded-full"
                        style={{ 
                          background: `linear-gradient(to top, ${track.color}, transparent)`,
                          boxShadow: `0 0 5px ${track.color}`
                        }}
                      />
                    );
                  })}
                </div>
                
                {/* Track info */}
                <h3 className="text-xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-pink-600">
                  {track.name}
                </h3>
                <p className="text-sm text-blue-300 mb-4">{track.artist}</p>
                
                <div className="flex justify-between text-sm text-gray-400 mb-4">
                  <span>{track.bpm} BPM</span>
                  <span>{formatTime(track.duration * 1000)}</span>
                </div>
                
                {/* Play button */}
                <button 
                  disabled={isTrackLoading}
                  className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-600/90 to-purple-500/90 text-white font-bold text-sm hover:from-blue-500 hover:to-purple-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  style={{
                    boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)',
                    transform: 'translateZ(10px)'
                  }}
                >
                  {isTrackLoading ? "LOADING..." : "PLAY TRACK"}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Simplified instructions with 3D elements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative p-6 mb-8 rounded-xl overflow-hidden"
          style={{
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.1)'
          }}
        >
          <h3 className="text-xl font-bold mb-4 text-blue-400">HOW TO PLAY</h3>
          <div className="flex gap-6 items-center justify-center">
            {/* Single simplified instruction */}
            <div className="flex flex-col items-center text-center px-4">
              <motion.div 
                className="w-20 h-20 mb-4 rounded-full flex items-center justify-center"
                animate={{
                  boxShadow: ['0 0 10px rgba(59, 130, 246, 0.3)', '0 0 20px rgba(59, 130, 246, 0.6)', '0 0 10px rgba(59, 130, 246, 0.3)']
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{
                  background: 'rgba(37, 99, 235, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)'
                }}
              >
                <span className="text-3xl">⚡</span>
              </motion.div>
              <p className="text-gray-300 max-w-lg">
                Watch for the circular waves approaching the <span className="text-green-400 font-bold">colored rings</span>. Press <span className="text-blue-400 font-bold">SPACE</span> or click when the waves align with the highlighted rings for perfect timing. Build combos for higher scores!
              </p>
            </div>
          </div>
        </motion.div>
        
        {/* Return button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center"
        >
          <button
            onClick={onReturn}
            className="px-6 py-3 bg-black/50 backdrop-blur-md border border-blue-500/30 text-blue-400 hover:bg-blue-900/20 transition-colors rounded-lg shadow-lg"
            style={{
              boxShadow: '0 0 15px rgba(59, 130, 246, 0.2)'
            }}
          >
            RETURN TO HUB
          </button>
        </motion.div>
      </div>
    </div>
  );
  
  // Render redesigned pause screen
  const renderPauseScreen = () => (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-lg">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative p-8 rounded-2xl max-w-md w-full"
        style={{
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          transform: 'perspective(1000px) rotateX(0deg)'
        }}
      >
        <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-pink-600 text-center">
          GAME PAUSED
        </h2>
        
        <div className="grid grid-cols-1 gap-4 mb-8">
          <div className="flex justify-between items-center">
            <span className="text-blue-300">Score:</span>
            <span className="text-xl font-bold text-white">{score.toLocaleString()}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-blue-300">Combo:</span>
            <span className="text-xl font-bold text-white">{combo}×</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-blue-300">Max Combo:</span>
            <span className="text-xl font-bold text-white">{maxCombo}×</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-blue-300">Accuracy:</span>
            <span className={`text-xl font-bold ${accuracy > 90 ? 'text-green-400' : accuracy > 70 ? 'text-yellow-400' : 'text-red-400'}`}>
              {accuracy}%
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-blue-300">Time:</span>
            <span className="text-xl font-bold text-white">{formatTime(gameTime)}</span>
          </div>
        </div>
        
        <div className="flex flex-col gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={pauseGame}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-bold hover:from-blue-500 hover:to-blue-400 transition-all shadow-lg"
            style={{
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)'
            }}
          >
            RESUME
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={restartGame}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-bold hover:from-purple-500 hover:to-purple-400 transition-all shadow-lg"
            style={{
              boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)'
            }}
          >
            RESTART
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={returnToIntro}
            className="w-full py-3 bg-black/50 backdrop-blur-sm border border-blue-500/30 text-blue-400 hover:bg-blue-900/20 transition-colors rounded-lg mt-2 shadow-lg"
            style={{
              boxShadow: '0 0 15px rgba(59, 130, 246, 0.2)'
            }}
          >
            TRACK SELECTION
          </motion.button>
        </div>
      </motion.div>
    </div>
  );

  // Render tutorial screen
const renderTutorialScreen = () => (
  <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="relative p-8 rounded-2xl max-w-xl w-full tutorial-pulse"
      style={{
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        border: '2px solid rgba(59, 130, 246, 0.5)',
        boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)'
      }}
    >
      <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600 text-center">
        HOW TO PLAY
      </h2>
      
      <div className="space-y-6 text-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/30 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">👁️</span>
          </div>
          <p className="text-white">
            Sound waves will approach the center from the outside. <span className="text-green-400 font-bold">Watch</span> for the colored rings!
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-500/30 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">⏱️</span>
          </div>
          <p className="text-white">
            When a wave reaches the <span className="text-green-400 font-bold">green</span> or <span className="text-yellow-400 font-bold">yellow</span> rings, the rings will light up. That's your cue to press SPACE or click.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-500/30 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">🎯</span>
          </div>
          <p className="text-white">
            The green ring gives you <span className="text-green-400 font-bold">PERFECT</span> hits, while the yellow ring gives <span className="text-yellow-400 font-bold">GOOD</span> hits. Perfect timing = more points!
          </p>
        </div>
        
        <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-500/30 mt-6">
          <p className="text-white text-center">
            Different wave types:
          </p>
          <div className="flex justify-center gap-8 mt-3">
            <div className="text-center">
              <div className="w-8 h-8 rounded-full border-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-blue-400 text-sm">Normal</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 rounded-full border-2 border-dashed border-pink-500 mx-auto mb-2"></div>
              <p className="text-pink-400 text-sm">Fast</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 rounded-full border-2 border-dotted border-indigo-500 mx-auto mb-2"></div>
              <p className="text-indigo-400 text-sm">Slow</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center mt-8">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          onClick={startGameAfterTutorial}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-bold text-lg hover:from-blue-500 hover:to-blue-400 transition-all shadow-lg"
        >
          START GAME
        </motion.button>
      </div>
    </motion.div>
  </div>
);

// Render game over screen with 3D-inspired design
const renderGameOverScreen = () => (
  <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-lg">
    <motion.div
      initial={{ opacity: 0, scale: 0.9, rotateX: -10 }}
      animate={{ opacity: 1, scale: 1, rotateX: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="relative p-8 rounded-2xl max-w-md w-full"
      style={{
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
        transform: 'perspective(1000px)'
      }}
    >
      <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-600 text-center">
        GAME OVER
      </h2>
      
      {/* Pulsing red glow effect */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none opacity-20 z-0"
        animate={{
          boxShadow: ['0 0 20px rgba(239, 68, 68, 0.3)', '0 0 40px rgba(239, 68, 68, 0.5)', '0 0 20px rgba(239, 68, 68, 0.3)']
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <div className="grid grid-cols-1 gap-4 mb-8 relative z-10">
        <div className="flex justify-between items-center">
          <span className="text-blue-300">Final Score:</span>
          <span className="text-xl font-bold text-white">{score.toLocaleString()}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-blue-300">Max Combo:</span>
          <span className="text-xl font-bold text-white">{maxCombo}×</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-blue-300">Accuracy:</span>
          <span className={`text-xl font-bold ${accuracy > 90 ? 'text-green-400' : accuracy > 70 ? 'text-yellow-400' : 'text-red-400'}`}>
            {accuracy}%
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-blue-300">Perfect Hits:</span>
          <span className="text-xl font-bold text-green-400">{hitCount}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-blue-300">Misses:</span>
          <span className="text-xl font-bold text-red-400">{missCount}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-blue-300">Total Time:</span>
          <span className="text-xl font-bold text-white">{formatTime(gameTime)}</span>
        </div>
      </div>
      
      <div className="flex flex-col gap-3 relative z-10">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          onClick={restartGame}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-bold hover:from-purple-500 hover:to-purple-400 transition-all shadow-lg"
          style={{
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)'
          }}
        >
          TRY AGAIN
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          onClick={returnToIntro}
          className="w-full py-3 bg-black/50 backdrop-blur-sm border border-blue-500/30 text-blue-400 hover:bg-blue-900/20 transition-colors rounded-lg shadow-lg"
          style={{
            boxShadow: '0 0 15px rgba(59, 130, 246, 0.2)'
          }}
        >
          TRACK SELECTION
        </motion.button>
      </div>
    </motion.div>
  </div>
);

// Render level complete screen with celebratory effects
const renderLevelCompleteScreen = () => (
  <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-lg">
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="relative p-8 rounded-2xl max-w-md w-full overflow-hidden"
      style={{
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
        transform: 'perspective(1000px)'
      }}
    >
      {/* Success animation particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={`success-particle-${i}`}
            className="absolute rounded-full w-2 h-2"
            initial={{ 
              x: "50%", 
              y: "50%",
              opacity: 0 
            }}
            animate={{ 
              x: `${Math.random() * 100}%`, 
              y: `${Math.random() * 100}%`,
              opacity: [0, 1, 0],
              scale: [0, 1, 0]
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeOut"
            }}
            style={{
              background: `rgb(${Math.floor(Math.random() * 100 + 156)}, ${Math.floor(Math.random() * 100 + 156)}, 255)`,
              boxShadow: '0 0 10px currentColor'
            }}
          />
        ))}
      </div>
      
      <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-600 text-center relative z-10">
        LEVEL COMPLETE
      </h2>
      
      {/* Success glow effect */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none opacity-20 z-0"
        animate={{
          boxShadow: ['0 0 20px rgba(74, 222, 128, 0.3)', '0 0 40px rgba(56, 189, 248, 0.5)', '0 0 20px rgba(74, 222, 128, 0.3)']
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <div className="grid grid-cols-1 gap-4 mb-8 relative z-10">
        <div className="flex justify-between items-center">
          <span className="text-blue-300">Score:</span>
          <span className="text-xl font-bold text-white">{score.toLocaleString()}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-blue-300">Max Combo:</span>
          <span className="text-xl font-bold text-white">{maxCombo}×</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-blue-300">Accuracy:</span>
          <span className={`text-xl font-bold ${accuracy > 90 ? 'text-green-400' : accuracy > 70 ? 'text-yellow-400' : 'text-red-400'}`}>
            {accuracy}%
          </span>
        </div>
        
        <div className="mb-2 mt-4">
          <div className="text-xs text-blue-300 mb-1">PERFORMANCE RATING</div>
          <div className="relative">
            <motion.div
              className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-pink-600"
              animate={{
                filter: ['drop-shadow(0 0 8px rgba(56, 189, 248, 0.5))', 'drop-shadow(0 0 15px rgba(56, 189, 248, 0.8))', 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.5))']
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {accuracy >= 95 ? 'S+' : 
               accuracy >= 90 ? 'S' : 
               accuracy >= 85 ? 'A+' : 
               accuracy >= 80 ? 'A' : 
               accuracy >= 75 ? 'B+' :
               accuracy >= 70 ? 'B' :
               accuracy >= 65 ? 'C+' :
               accuracy >= 60 ? 'C' :
               'D'}
            </motion.div>
            
            {/* Rating shine effect */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1,
                ease: "easeInOut"
              }}
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                filter: 'blur(5px)'
              }}
            />
          </div>
        </div>
      </div>
      
      <div className="flex flex-col gap-3 relative z-10">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          onClick={restartGame}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-bold hover:from-purple-500 hover:to-purple-400 transition-all shadow-lg"
          style={{
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)'
          }}
        >
          PLAY AGAIN
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          onClick={returnToIntro}
          className="w-full py-3 bg-black/50 backdrop-blur-sm border border-blue-500/30 text-blue-400 hover:bg-blue-900/20 transition-colors rounded-lg shadow-lg"
          style={{
            boxShadow: '0 0 15px rgba(59, 130, 246, 0.2)'
          }}
        >
          TRACK SELECTION
        </motion.button>
      </div>
    </motion.div>
  </div>
);
  
  return (
    <div 
      className="min-h-screen bg-black text-white font-pixel overflow-hidden"
      ref={containerRef}
    >
      {/* Main content container */}
      <AnimatePresence mode="wait">
        {gameState === "intro" && renderIntroScreen()}
        
        {gameState === "tutorial" && (
          <>
            {renderGameGrid()}
            {renderTutorialScreen()}
          </>
        )}
        
        {gameState === "playing" && renderGameGrid()}
        
        {gameState === "paused" && (
          <>
            {renderGameGrid()}
            {renderPauseScreen()}
          </>
        )}
        
        {gameState === "gameOver" && (
          <>
            {renderGameGrid()}
            {renderGameOverScreen()}
          </>
        )}
        
        {gameState === "levelComplete" && (
          <>
            {renderGameGrid()}
            {renderLevelCompleteScreen()}
          </>
        )}
      </AnimatePresence>
      
      {/* Global styles */}
      <style jsx global>{`
        @keyframes pulse-fade {
          from { opacity: 0.3; }
          to { opacity: 0; }
        }
        
        .font-pixel {
          font-family: 'Press Start 2P', monospace;
          letter-spacing: 0.05em;
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          50% { transform: translateX(5px); }
          75% { transform: translateX(-5px); }
        }
        
        .animate-shake {
          animation: shake 0.3s linear;
        }
        
        @keyframes fastWavePulse {
          0% { opacity: 0.85; }
          50% { opacity: 1; }
          100% { opacity: 0.85; }
        }
        
        /* Tutorial popup animation */
        @keyframes tutorialPulse {
          0% { transform: scale(1); box-shadow: 0 0 10px rgba(59, 130, 246, 0.5); }
          50% { transform: scale(1.05); box-shadow: 0 0 20px rgba(59, 130, 246, 0.7); }
          100% { transform: scale(1); box-shadow: 0 0 10px rgba(59, 130, 246, 0.5); }
        }
        
        .tutorial-pulse {
          animation: tutorialPulse 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default PulseRealm;