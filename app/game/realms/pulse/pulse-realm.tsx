import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import RealmCube from "../../cube/realm-cube";
import { cubeCollection } from "../../cube/realm-cube";

// Pulse Realm: Rhythm Game with MP3 Audio
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
  waveSpeed: number; // Wave speed factor
  // Beat timestamps in milliseconds, will be populated at runtime
  beatTimestamps?: number[];
}

// Pulse wave interface
interface PulseWave {
  id: string;
  timestamp: number; // When this wave should be hit
  radius: number;    // Current visual radius
  hit: boolean;      // If it's been hit
  missed: boolean;   // If it's been missed
  color: string;     // Wave color
}

// Hit result types
type HitResultType = "perfect" | "good" | "miss" | "early";

// Game states
type GameState = "intro" | "playing" | "paused" | "gameOver" | "levelComplete";

// Available music tracks (using MP3 files from public folder)
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
    gradient: "from-blue-400 to-pink-600",
    waveSpeed: 0.8 // Slower for easier difficulty
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
    gradient: "from-purple-500 to-blue-600",
    waveSpeed: 1.0 // Medium speed
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
    gradient: "from-pink-500 to-purple-600",
    waveSpeed: 1.3 // Faster for harder difficulty
  }
];

// Pre-calculate beat timestamps based on BPM
tracks.forEach(track => {
  const beatInterval = 60000 / track.bpm; // milliseconds per beat
  const beatCount = Math.ceil(track.duration * (track.bpm / 60));
  track.beatTimestamps = Array.from({ length: beatCount }, (_, i) => i * beatInterval);
});

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
  const [isExpanding, setIsExpanding] = useState(false);
  const [gameTime, setGameTime] = useState(0);
  const [lastHitResult, setLastHitResult] = useState<HitResultType | null>(null);
  const [showHitResult, setShowHitResult] = useState(false);
  const [isTrackLoading, setIsTrackLoading] = useState(false);
  const [showPerfectEffect, setShowPerfectEffect] = useState(false);
  const [hitEffectColor, setHitEffectColor] = useState("#4ade80"); // Green for perfect
  
  // Refs
  const animationFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number>(0);
  const gameStartTimeRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const comboMultiplierRef = useRef<number>(1);
  const perfectHitZoneRef = useRef<number>(20); // Radius in pixels for a perfect hit
  const goodHitZoneRef = useRef<number>(40); // Radius in pixels for a good hit
  const wavesGeneratedRef = useRef<Set<number>>(new Set());
  const futureBeatTimeRef = useRef<number>(3000); // Time in ms for waves to travel from outside to center
  const waveSpeedFactor = useRef<number>(1.0); // Default wave speed factor
  
  // Constants
  const CUBE_SIZE = 80; // Size of the cube
  const WAVE_RADIUS_MAX = 300; // Starting radius for waves
  const CUBE_HIT_ZONE = 40; // Radius of the cube hit zone
  const HIT_ANIMATION_DURATION = 300; // Duration of hit animation in ms
  
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
  
  // Initialize game state and audio
  useEffect(() => {
    if (gameState === "playing") {
      // Create audio element if it doesn't exist
      if (!audioRef.current) {
        const audio = new Audio(selectedTrack.mp3Path);
        audio.volume = 0.7;
        audioRef.current = audio;
      }
      
      // Set wave speed factor based on track
      waveSpeedFactor.current = selectedTrack.waveSpeed;
      
      // Reset game state for new game
      resetGameState();
      
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
    };
  }, [gameState, selectedTrack]);
  
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
    lastTimestampRef.current = 0;
    gameStartTimeRef.current = 0;
    comboMultiplierRef.current = 1;
    wavesGeneratedRef.current.clear();
    
    // Set difficulty-based parameters
    switch (selectedTrack.difficulty) {
      case Difficulty.Easy:
        perfectHitZoneRef.current = 20;
        goodHitZoneRef.current = 40;
        break;
      case Difficulty.Medium:
        perfectHitZoneRef.current = 15;
        goodHitZoneRef.current = 30;
        break;
      case Difficulty.Hard:
        perfectHitZoneRef.current = 10;
        goodHitZoneRef.current = 25;
        break;
    }
  };
  
  // Start game loop
  const startGameLoop = () => {
    // Set a brief delay before starting to give player time to prepare
    setTimeout(() => {
      // Start audio
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(error => {
          console.error("Audio playback failed:", error);
        });
        
        // Record start time
        gameStartTimeRef.current = Date.now();
        
        // Start animation loop
        animationFrameRef.current = requestAnimationFrame(gameLoop);
      }
    }, 1000); // 1 second to prepare
  };
  
  // Game loop
  const gameLoop = (timestamp: number) => {
    if (!gameStartTimeRef.current) {
      gameStartTimeRef.current = timestamp;
    }
    
    const elapsed = timestamp - (lastTimestampRef.current || gameStartTimeRef.current);
    lastTimestampRef.current = timestamp;
    
    // Calculate current game time
    const currentGameTime = !audioRef.current ? 0 : audioRef.current.currentTime * 1000;
    setGameTime(currentGameTime);
    
    // Generate waves based on beat timestamps
    if (selectedTrack.beatTimestamps) {
      // Adjust lookahead time based on track speed
      const lookaheadTime = currentGameTime + (futureBeatTimeRef.current / waveSpeedFactor.current);
      
      selectedTrack.beatTimestamps.forEach(beatTime => {
        // If the beat is coming up soon and we haven't created a wave for it yet
        if (beatTime > currentGameTime && beatTime <= lookaheadTime && !wavesGeneratedRef.current.has(beatTime)) {
          // Create a wave for this beat
          createWaveForBeat(beatTime);
          // Mark this beat as generated
          wavesGeneratedRef.current.add(beatTime);
        }
      });
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
  
  // Create a wave for a specific beat timestamp
  const createWaveForBeat = (beatTimestamp: number) => {
    const newWave: PulseWave = {
      id: `wave-${beatTimestamp}-${Math.random()}`,
      timestamp: beatTimestamp,
      radius: WAVE_RADIUS_MAX,
      hit: false,
      missed: false,
      color: selectedTrack.color
    };
    
    setPulseWaves(prev => [...prev, newWave]);
  };
  
  // Update waves' positions based on current time
  const updateWaves = (currentTime: number) => {
    setPulseWaves(prevWaves => {
      return prevWaves.map(wave => {
        // Calculate how close this wave is to its hit time
        // When timestamp === currentTime, radius should be close to 0 (at the cube)
        const timeToImpact = wave.timestamp - currentTime;
        
        // Calculate radius based on time to impact and speed factor
        // When timeToImpact equals the future beat time, radius should be max
        // When timeToImpact is 0, radius should be 0
        const radius = (timeToImpact / (futureBeatTimeRef.current / waveSpeedFactor.current)) * WAVE_RADIUS_MAX;
        
        // Check if wave should be missed (if it's gone past the center and wasn't hit)
        if (!wave.hit && !wave.missed && timeToImpact < -200) {
          // Wave passed without being hit
          handleMiss();
          return { ...wave, radius, missed: true };
        }
        
        return { ...wave, radius };
      }).filter(wave => wave.timestamp > currentTime - 500); // Remove waves that are way past
    });
  };
  
  // Handle key presses
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") return;
      
      // Handle spacebar press for hitting waves
      if (e.code === "Space") {
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
  
  // Handle when player attempts to hit a pulse
  const handlePulseHit = () => {
    if (!audioRef.current) return;
    
    const currentTime = audioRef.current.currentTime * 1000;
    
    // Find the closest wave to its hit time
    const activeWaves = pulseWaves.filter(wave => !wave.hit && !wave.missed);
    
    if (activeWaves.length === 0) {
      // No active waves to hit - early hit
      displayHitResult("early");
      setIsCubeError(true);
      setTimeout(() => setIsCubeError(false), HIT_ANIMATION_DURATION);
      return;
    }
    
    // Sort by absolute time difference to hit time
    const sortedWaves = [...activeWaves].sort((a, b) => {
      return Math.abs(a.timestamp - currentTime) - Math.abs(b.timestamp - currentTime);
    });
    
    const closestWave = sortedWaves[0];
    const timeDiff = Math.abs(closestWave.timestamp - currentTime);
    
    // Adjust hit windows based on difficulty
    // Check if the hit was close enough to the perfect timing
    if (timeDiff <= perfectHitZoneRef.current * 8) { // Convert pixel radius to time approximation
      handlePerfectHit(closestWave);
    } else if (timeDiff <= goodHitZoneRef.current * 10) {
      handleGoodHit(closestWave);
    } else if (closestWave.timestamp > currentTime && timeDiff <= goodHitZoneRef.current * 15) {
      // Early but not too early
      displayHitResult("early");
      setIsCubeError(true);
      setTimeout(() => setIsCubeError(false), HIT_ANIMATION_DURATION);
    } else {
      // Too early/late - miss
      displayHitResult("miss");
      setIsCubeError(true);
      setTimeout(() => setIsCubeError(false), HIT_ANIMATION_DURATION);
    }
  };
  
  // Handle perfect hit
  const handlePerfectHit = (wave: PulseWave) => {
    // Update wave as hit
    setPulseWaves(prev => 
      prev.map(w => 
        w.id === wave.id ? { ...w, hit: true } : w
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
    setScore(prev => Math.floor(prev + (100 * comboMultiplierRef.current)));
    
    // Increment hit count
    setHitCount(prev => prev + 1);
    
    // Update accuracy
    setAccuracy(prev => {
      const total = hitCount + missCount + 1;
      return Math.round(((hitCount + 1) / total) * 100);
    });
    
    // Visual feedback - perfect hit
    setIsCubeGlowing(true);
    setIsExpanding(true);
    setShowPerfectEffect(true);
    setHitEffectColor("#4ade80"); // Green for perfect hit
    
    // Display hit result
    displayHitResult("perfect");
    
    // Reset cube state after animation
    setTimeout(() => {
      setIsCubeGlowing(false);
      setIsExpanding(false);
      setShowPerfectEffect(false);
    }, HIT_ANIMATION_DURATION);
  };
  
  // Handle good hit
  const handleGoodHit = (wave: PulseWave) => {
    // Update wave as hit
    setPulseWaves(prev => 
      prev.map(w => 
        w.id === wave.id ? { ...w, hit: true } : w
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
    setScore(prev => Math.floor(prev + (50 * comboMultiplierRef.current)));
    
    // Increment hit count
    setHitCount(prev => prev + 1);
    
    // Update accuracy
    setAccuracy(prev => {
      const total = hitCount + missCount + 1;
      return Math.round(((hitCount + 1) / total) * 100);
    });
    
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
  
  // Handle miss
  const handleMiss = () => {
    // Reset combo
    setCombo(0);
    comboMultiplierRef.current = 1;
    
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
  
  // Display the hit result text
  const displayHitResult = (result: HitResultType) => {
    setLastHitResult(result);
    setShowHitResult(true);
    
    setTimeout(() => {
      setShowHitResult(false);
    }, 500);
  };
  
  // Game actions
  const startGame = (track: Track) => {
    setIsTrackLoading(true);
    
    // Preload audio
    const audio = new Audio(track.mp3Path);
    audio.volume = 0.7;
    
    // When audio is ready
    audio.oncanplaythrough = () => {
      audioRef.current = audio;
      setSelectedTrack(track);
      setIsTrackLoading(false);
      setGameState("playing");
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
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }
  };
  
  const restartGame = () => {
    // Reset and restart with same track
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    startGame(selectedTrack);
  };
  
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
  
  // Format time for display (mm:ss)
  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Render the pulse waves
  const renderPulseWaves = () => {
    return pulseWaves.map(wave => (
      <motion.div
        key={wave.id}
        className={`absolute rounded-full ${wave.hit ? 'opacity-50' : ''} ${wave.missed ? 'opacity-30' : ''}`}
        style={{
          width: `${Math.max(wave.radius * 2, 0)}px`,
          height: `${Math.max(wave.radius * 2, 0)}px`,
          border: `2px solid ${wave.hit ? cubeColor : wave.missed ? '#ef4444' : wave.color}`,
          boxShadow: `0 0 10px ${wave.hit ? cubeColor : wave.missed ? '#ef4444' : wave.color}`,
          opacity: wave.hit || wave.missed ? 0.3 : 0.7,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 5
        }}
      />
    ));
  };
  
  // Render hit zones
  const renderHitZones = () => {
    return (
      <>
        {/* Perfect hit zone with animation */}
        <div
          className="absolute rounded-full border-2 border-green-500/50"
          style={{
            width: perfectHitZoneRef.current * 2,
            height: perfectHitZoneRef.current * 2,
            boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 3
          }}
        />
        
        {/* Good hit zone with animation */}
        <div
          className="absolute rounded-full border-2 border-yellow-500/50"
          style={{
            width: goodHitZoneRef.current * 2,
            height: goodHitZoneRef.current * 2,
            boxShadow: '0 0 10px rgba(234, 179, 8, 0.4)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 2
          }}
        />
        
        {/* Pulsing indicator for click zone */}
        <motion.div
          className="absolute rounded-full border-2 border-white/30"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.6, 0.9, 0.6],
            boxShadow: [
              '0 0 5px rgba(255, 255, 255, 0.3)',
              '0 0 15px rgba(255, 255, 255, 0.5)',
              '0 0 5px rgba(255, 255, 255, 0.3)'
            ]
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity,
            ease: "easeInOut" 
          }}
          style={{
            width: goodHitZoneRef.current * 2.2,
            height: goodHitZoneRef.current * 2.2,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1
          }}
        />
        
        {/* "Click Here" text indicator */}
        <div 
          className="absolute text-white/70 font-bold text-sm"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textShadow: '0 0 5px rgba(255, 255, 255, 0.5)',
            zIndex: 4,
            pointerEvents: 'none'
          }}
        >
          CLICK HERE
        </div>
      </>
    );
  };
  
  // Render the game grid
  const renderGameGrid = () => {
    // Calculate a reactive background intensity based on combo
    const intensityFactor = Math.min(0.3 + (combo / 100) * 0.7, 1);
    
    return (
      <div className="relative flex items-center justify-center h-screen bg-black overflow-hidden">
        {/* Circular grid lines for depth */}
        {[0.2, 0.4, 0.6, 0.8, 1.0].map((size, index) => (
          <div
            key={`grid-circle-${index}`}
            className="absolute rounded-full border border-blue-500/20"
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
        
        {/* Radial grid lines */}
        {Array.from({ length: 12 }).map((_, index) => (
          <div
            key={`grid-line-${index}`}
            className="absolute bg-blue-500/10"
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
        
        {/* Hit zones */}
        {renderHitZones()}
        
        {/* Hit Result Text */}
        <AnimatePresence>
          {showHitResult && (
            <motion.div
              key="hit-result"
              initial={{ opacity: 0, y: 0, scale: 0.8 }}
              animate={{ opacity: 1, y: -40, scale: 1.2 }}
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
                fontSize: lastHitResult === "perfect" ? '28px' : '20px',
                fontWeight: 'bold',
                textShadow: `0 0 10px ${
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
              animate={{ scale: 1.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute rounded-full z-15"
              style={{
                width: CUBE_SIZE * 2,
                height: CUBE_SIZE * 2,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                border: `3px solid ${hitEffectColor}`,
                boxShadow: `0 0 20px ${hitEffectColor}`,
              }}
            />
          )}
        </AnimatePresence>
        
        {/* Center cube */}
        <div 
          className={`absolute z-10 ${isCubeGlowing ? 'animate-pulse' : ''}`}
          style={{
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) ${isExpanding ? 'scale(1.1)' : 'scale(1)'}`,
            transition: 'transform 0.2s ease-out'
          }}
        >
          <div className={isCubeError ? 'animate-shake' : ''}>
            <div className="relative">
              {/* Glow effect around cube */}
              <div 
                className="absolute rounded-full" 
                style={{
                  width: CUBE_SIZE * 1.5,
                  height: CUBE_SIZE * 1.5,
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  background: `radial-gradient(circle, ${cubeColor}${isCubeGlowing ? '80' : '30'} 0%, transparent 70%)`,
                  filter: `blur(${5 + combo / 10}px)`,
                  opacity: isCubeError ? 0.1 : (0.3 + intensityFactor * 0.7),
                  zIndex: 5
                }}
              />
              
              {/* Error effect */}
              {isCubeError && (
                <div 
                  className="absolute rounded-full" 
                  style={{
                    width: CUBE_SIZE * 1.5,
                    height: CUBE_SIZE * 1.5,
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'radial-gradient(circle, rgba(239, 68, 68, 0.5) 0%, transparent 70%)',
                    filter: 'blur(8px)',
                    zIndex: 6
                  }}
                />
              )}
              
              {/* The cube */}
              <RealmCube
                position="center"
                size={CUBE_SIZE}
                cubeId={selectedCubeId}
                isAnimated={false}
                onCubeClick={handlePulseHit} // Allow clicking the cube too
              />
            </div>
          </div>
        </div>
        
        {/* Pulse on space indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full border border-blue-500/30 z-20">
          <span className="text-blue-400 font-pixel">PRESS <span className="text-white bg-blue-900/50 px-2 rounded mx-1">SPACE</span> TO PULSE</span>
        </div>
        
        {/* Track info display */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full border border-blue-500/30 z-20">
          <span className="text-blue-300 font-pixel">
            {selectedTrack.name} 
            <span className="text-gray-400 mx-2">|</span> 
            <span className="text-gray-400">{selectedTrack.bpm} BPM</span>
            <span className="text-gray-400 mx-2">|</span>
            <span className={
              selectedTrack.difficulty === Difficulty.Easy ? 'text-green-400' :
              selectedTrack.difficulty === Difficulty.Medium ? 'text-yellow-400' :
              'text-red-400'
            }>
              {selectedTrack.difficulty.toUpperCase()}
            </span>
          </span>
        </div>
        
        {/* HUD - Score & Combo */}
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm p-4 rounded-lg border border-blue-500/30 z-20">
          <div className="flex flex-col gap-2">
            <div className="text-blue-300 font-pixel">SCORE</div>
            <div className={`text-4xl font-bold transition-colors ${score > 5000 ? 'text-pink-400' : score > 2000 ? 'text-purple-400' : 'text-blue-400'}`}>
              {score.toLocaleString()}
            </div>
            
            <div className="mt-2 text-blue-300 font-pixel">COMBO</div>
            <div className={`text-2xl font-bold transition-colors ${combo > 20 ? 'text-pink-400' : combo > 10 ? 'text-purple-400' : 'text-blue-400'}`}>
              {combo}×
            </div>
            
            {combo > 0 && (
              <div className="w-full bg-gray-900 h-1 mt-1">
                <div 
                  className="bg-gradient-to-r from-blue-400 to-pink-500 h-full"
                  style={{ width: `${Math.min((combo % 10) * 10, 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>
        
        {/* HUD - Accuracy & Time */}
        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm p-4 rounded-lg border border-blue-500/30 z-20">
          <div className="flex flex-col gap-2">
            <div className="text-blue-300 font-pixel">ACCURACY</div>
            <div className={`text-2xl font-bold transition-colors ${accuracy > 90 ? 'text-green-400' : accuracy > 70 ? 'text-yellow-400' : 'text-red-400'}`}>
              {accuracy}%
            </div>
            
            <div className="mt-2 text-blue-300 font-pixel">TIME</div>
            <div className="text-2xl font-bold text-white">
              {formatTime(gameTime)}
            </div>
          </div>
        </div>
        
        {/* Pause button */}
        <button
          onClick={pauseGame}
          className="absolute top-20 right-1/2 transform translate-x-1/2 bg-black/50 backdrop-blur-sm px-4 py-2 rounded border border-blue-500/30 text-white hover:bg-blue-900/30 transition-colors z-20"
        >
          II
        </button>
        
        {/* Background intensity effect based on combo */}
        <div 
          className="absolute inset-0 bg-gradient-to-r from-blue-900/10 to-pink-900/10 z-0 transition-opacity duration-500"
          style={{ 
            opacity: intensityFactor,
            background: `radial-gradient(circle, rgba(37, 99, 235, ${intensityFactor * 0.1}) 0%, rgba(219, 39, 119, ${intensityFactor * 0.05}) 70%, transparent 100%)` 
          }}
        />
      </div>
    );
  };
  
  // Render intro screen
  const renderIntroScreen = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-blue-900/20 via-black to-black text-white">
      <div className="max-w-4xl w-full mx-auto">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-6xl font-bold tracking-widest mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-pink-600">
            PULSE REALM
          </h1>
          <p className="text-lg text-blue-300 max-w-2xl mx-auto">
            Synchronize with the rhythm of this world to progress, matching your movements to the pulse of the void.
          </p>
        </motion.div>
        
        {/* Track selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {tracks.map(track => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: tracks.indexOf(track) * 0.1 }}
              whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.98 }}
              onClick={() => !isTrackLoading && startGame(track)}
              className={`relative bg-black/40 backdrop-blur-sm border border-blue-500/30 p-6 rounded-xl cursor-pointer overflow-hidden group ${
                isTrackLoading ? 'opacity-50 cursor-not-allowed' : ''
              } ${selectedTrack.id === track.id ? 'ring-2 ring-blue-500' : ''}`}
            >
              {/* Difficulty indicator */}
              <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold" 
                style={{ 
                  backgroundColor: 
                    track.difficulty === Difficulty.Easy ? 'rgba(74, 222, 128, 0.2)' : 
                    track.difficulty === Difficulty.Medium ? 'rgba(250, 204, 21, 0.2)' : 
                    'rgba(248, 113, 113, 0.2)',
                  color:
                    track.difficulty === Difficulty.Easy ? 'rgb(74, 222, 128)' : 
                    track.difficulty === Difficulty.Medium ? 'rgb(250, 204, 21)' : 
                    'rgb(248, 113, 113)'
                }}
              >
                {track.difficulty.toUpperCase()}
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
              
              {/* Speed indicator */}
              <div className="mb-4">
                <div className="text-xs text-gray-400 mb-1">SPEED</div>
                <div className="flex items-center gap-2">
                  <div className="h-1 bg-gray-800 rounded-full flex-grow">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-green-500 to-blue-500" 
                      style={{ width: `${track.waveSpeed * 60}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">{track.waveSpeed.toFixed(1)}x</span>
                </div>
              </div>
              
              {/* Play button */}
              <button 
                disabled={isTrackLoading}
                className="w-full py-2 rounded-lg bg-gradient-to-r from-blue-600/80 to-blue-500/80 text-white font-bold text-sm hover:from-blue-500 hover:to-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTrackLoading ? "LOADING..." : "PLAY TRACK"}
              </button>
              
              {/* Animated overlay */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-pink-500"></div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-pink-600"></div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-black/40 backdrop-blur-sm border border-blue-500/30 p-6 rounded-xl mb-8"
        >
          <h3 className="text-xl font-bold mb-4 text-blue-400">HOW TO PLAY</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 mb-4 rounded-full bg-blue-900/50 flex items-center justify-center">
                <span className="text-3xl">👁️</span>
              </div>
              <h4 className="text-lg font-bold mb-2 text-blue-300">WATCH</h4>
              <p className="text-gray-400 text-sm">Watch the pulse waves move toward the center cube.</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 mb-4 rounded-full bg-blue-900/50 flex items-center justify-center">
                <span className="text-3xl">⌨️</span>
              </div>
              <h4 className="text-lg font-bold mb-2 text-blue-300">PULSE</h4>
              <p className="text-gray-400 text-sm">Press SPACE or click cube when a wave reaches the center hit zone.</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 mb-4 rounded-full bg-blue-900/50 flex items-center justify-center">
                <span className="text-3xl">🔄</span>
              </div>
              <h4 className="text-lg font-bold mb-2 text-blue-300">COMBO</h4>
              <p className="text-gray-400 text-sm">Build combos for higher scores and visual effects.</p>
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
            className="px-6 py-3 bg-black/50 border border-blue-500/30 text-blue-400 hover:bg-blue-900/20 transition-colors rounded-lg"
          >
            RETURN TO HUB
          </button>
        </motion.div>
      </div>
      
      {/* Selected cube display */}
      <div className="absolute bottom-8 right-8 bg-black/40 backdrop-blur-sm p-4 rounded-lg border border-blue-500/30">
        <div className="text-xs text-blue-300 mb-2">SELECTED CUBE</div>
        <div className="flex justify-center">
          <RealmCube
            position="center"
            size={60}
            cubeId={selectedCubeId}
            isAnimated={true}
            onCubeClick={() => {}}
          />
        </div>
      </div>
      
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[-1]">
        {/* Circular pulse waves */}
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.div
            key={`bg-pulse-${i}`}
            className="absolute rounded-full border border-blue-500/20"
            initial={{ scale: 0, opacity: 0.3 }}
            animate={{
              scale: [0, 4],
              opacity: [0.3, 0]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: i * 0.8,
              ease: "linear"
            }}
            style={{
              width: '100px',
              height: '100px',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          />
        ))}
        
        {/* Random floating particles */}
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute rounded-full bg-gradient-to-r from-blue-400 to-pink-600"
            animate={{
              x: [
                Math.random() * window.innerWidth,
                Math.random() * window.innerWidth
              ],
              y: [
                Math.random() * window.innerHeight,
                Math.random() * window.innerHeight
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
              opacity: Math.random() * 0.5 + 0.1,
              boxShadow: `0 0 ${Math.random() * 5 + 2}px currentColor`
            }}
          />
        ))}
      </div>
    </div>
  );
  
  // Render pause screen
  const renderPauseScreen = () => (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="bg-black/70 border border-blue-500/30 p-8 rounded-xl max-w-md w-full">
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
          
          <div className="flex justify-between items-center">
            <span className="text-blue-300">Track:</span>
            <span className="text-xl font-bold text-white">{selectedTrack.name}</span>
          </div>
        </div>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={pauseGame}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-bold hover:from-blue-500 hover:to-blue-400 transition-all"
          >
            RESUME
          </button>
          
          <button
            onClick={restartGame}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-bold hover:from-purple-500 hover:to-purple-400 transition-all"
          >
            RESTART
          </button>
          
          <button
            onClick={returnToIntro}
            className="w-full py-3 bg-black/50 border border-blue-500/30 text-blue-400 hover:bg-blue-900/20 transition-colors rounded-lg mt-2"
          >
            TRACK SELECTION
          </button>
        </div>
      </div>
    </div>
  );
  
  // Render game over screen
  const renderGameOverScreen = () => (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="bg-black/70 border border-blue-500/30 p-8 rounded-xl max-w-md w-full">
        <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-600 text-center">
          GAME OVER
        </h2>
        
        <div className="grid grid-cols-1 gap-4 mb-8">
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
        
        <div className="flex flex-col gap-3">
          <button
            onClick={restartGame}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-bold hover:from-purple-500 hover:to-purple-400 transition-all"
          >
            TRY AGAIN
          </button>
          
          <button
            onClick={returnToIntro}
            className="w-full py-3 bg-black/50 border border-blue-500/30 text-blue-400 hover:bg-blue-900/20 transition-colors rounded-lg"
          >
            TRACK SELECTION
          </button>
        </div>
      </div>
    </div>
  );
  
  // Render level complete screen
  const renderLevelCompleteScreen = () => (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="bg-black/70 border border-blue-500/30 p-8 rounded-xl max-w-md w-full">
        <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-600 text-center">
          LEVEL COMPLETE
        </h2>
        
        <div className="grid grid-cols-1 gap-4 mb-8">
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
          
          <div className="mb-2 mt-2">
            <div className="text-xs text-blue-300 mb-1">PERFORMANCE RATING</div>
            <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-pink-600">
              {accuracy >= 95 ? 'S+' : 
               accuracy >= 90 ? 'S' : 
               accuracy >= 85 ? 'A+' : 
               accuracy >= 80 ? 'A' : 
               accuracy >= 75 ? 'B+' :
               accuracy >= 70 ? 'B' :
               accuracy >= 65 ? 'C+' :
               accuracy >= 60 ? 'C' :
               'D'}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={restartGame}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-bold hover:from-purple-500 hover:to-purple-400 transition-all"
          >
            PLAY AGAIN
          </button>
          
          <button
            onClick={returnToIntro}
            className="w-full py-3 bg-black/50 border border-blue-500/30 text-blue-400 hover:bg-blue-900/20 transition-colors rounded-lg"
          >
            TRACK SELECTION
          </button>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="min-h-screen bg-black text-white font-pixel overflow-hidden">
      {/* Main content container */}
      <AnimatePresence mode="wait">
        {gameState === "intro" && renderIntroScreen()}
        
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
          font-family: monospace;
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
      `}</style>
    </div>
  );
};

export default PulseRealm;