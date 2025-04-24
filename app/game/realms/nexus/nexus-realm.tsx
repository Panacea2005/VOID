import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useAnimationControls } from "framer-motion";
import RealmCube from "../../cube/realm-cube";
import { cubeCollection } from "../../cube/realm-cube";

// Enhanced Nexus Realm - Advanced Frequency Resonance Game
interface NexusRealmProps {
  onReturn: () => void;
  selectedCubeId?: string;
}

// Node interface for energy nodes
interface Node {
  id: number;
  x: number;
  y: number;
  frequency: number;
  targetDistance: number;
  targetAngle?: number; // Now nodes can have a target angle too
  currentDistance: number;
  color: string;
  inResonance: boolean;
  pulseSize: number;
  isLocked?: boolean; // Some nodes can be locked in position
  requiredAlignment?: "radial" | "angular" | "both"; // Type of alignment needed
  fieldStrength?: number; // How strongly this node affects others
  isActivated?: boolean; // Whether the node is fully activated
}

// Connection between nodes
interface Connection {
  fromId: number;
  toId: number;
  strength: number;
  color: string;
  isActive: boolean;
}

const NexusRealm: React.FC<NexusRealmProps> = ({
  onReturn,
  selectedCubeId = "pink-neon",
}) => {
  // Game states
  const [gameState, setGameState] = useState<
    "intro" | "playing" | "success" | "failure"
  >("intro");
  const [currentLevel, setCurrentLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [moveCount, setMoveCount] = useState(0);
  const [pulseActive, setPulseActive] = useState(false);
  const [pulseStrength, setPulseStrength] = useState(0);
  const [cubeReady, setCubeReady] = useState(false);
  const [cubeRotation, setCubeRotation] = useState({ x: 0, y: 0, z: 0 });
  const [cubeScale, setCubeScale] = useState(1);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [showTargets, setShowTargets] = useState(false);
  const [pulseHistory, setPulseHistory] = useState<
    { x: number; y: number; size: number; color: string; opacity: number }[]
  >([]);
  const [networkEnergy, setNetworkEnergy] = useState(0);
  const [networkStability, setNetworkStability] = useState(0);
  const [cubeEngaged, setCubeEngaged] = useState(false);
  const [dragPath, setDragPath] = useState<{ x: number; y: number }[]>([]);
  const [gravitationalPull, setGravitationalPull] = useState(false);
  const [difficulty, setDifficulty] = useState<"normal" | "advanced">("normal");
  const [showHints, setShowHints] = useState(false);
  const [activeCubeMode, setActiveCubeMode] = useState<
    "pulse" | "attract" | "repel"
  >("pulse");
  const [cubeCharging, setCubeCharging] = useState(false);

  const [combinedCubeCollection, setCombinedCubeCollection] =
    useState<any[]>(cubeCollection);

  // Animation controls
  const gridControls = useAnimationControls();
  const cubeControls = useAnimationControls();

  // References
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pulseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cubeRef = useRef<HTMLDivElement | null>(null);

  // Grid size (play area)
  const gridSize = 600;
  const cellSize = 60;

  const handleCubeCollectionUpdate = (collection: any[]) => {
    console.log("Nexus Realm received cube collection:", collection.length);
    setCombinedCubeCollection(collection);
  };

  // Get the selected cube from combined collection
  const selectedCube =
    combinedCubeCollection.find((cube) => cube.id === selectedCubeId) ||
    combinedCubeCollection[0];
  const baseColors =
    selectedCube.colors.length > 0
      ? selectedCube.colors
      : ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF"];

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

  // Generate nodes for the current level with more challenging mechanics
  useEffect(() => {
    if (gameState === "intro") {
      console.log("Generating nodes for level", currentLevel);

      // Calculate base pulse frequency (A4 + offset per level)
      const basePulseFrequency = 440 + (currentLevel - 1) * 20;

      // Musical intervals for harmonious frequencies
      const musicalRatios = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2];

      // Clear existing nodes
      setNodes([]);
      setConnections([]);
      setSelectedNode(null);
      setDragPath([]);
      setGravitationalPull(false);
      setPulseHistory([]);

      // Number of nodes increases with level
      const nodeCount = 3 + Math.min(currentLevel, 5);

      // Determine grid boundaries, keeping space in center for cube
      const centerSpace = 150; // Space to leave in center
      const minPos = -gridSize / 2 + cellSize;
      const maxPos = gridSize / 2 - cellSize;

      // Set game mechanics based on level
      if (currentLevel >= 3) {
        setDifficulty("advanced");
      } else {
        setDifficulty("normal");
      }

      // Create nodes with appropriate attributes for the level
      const newNodes: Node[] = [];
      const newConnections: Connection[] = [];

      for (let i = 0; i < nodeCount; i++) {
        // Create random position that's not in the center
        let x, y, distFromCenter;

        do {
          x = Math.floor(Math.random() * (maxPos - minPos)) + minPos;
          y = Math.floor(Math.random() * (maxPos - minPos)) + minPos;
          distFromCenter = Math.sqrt(x * x + y * y);
        } while (distFromCenter < centerSpace);

        // Calculate node frequency based on musical ratios
        const ratio = musicalRatios[i % musicalRatios.length];
        const frequency = basePulseFrequency * ratio;

        // Target distance is derived from frequency
        // Higher frequencies resonate closer to the center
        const targetDistance = 100 + (1000 / frequency) * 80;

        // For advanced levels, some nodes need specific angles
        let targetAngle;
        let requiredAlignment: "radial" | "angular" | "both" | undefined;

        if (currentLevel >= 3 && i % 2 === 0) {
          // Every other node needs angular alignment as well
          targetAngle = (i / nodeCount) * 2 * Math.PI;
          requiredAlignment = "both";
        } else if (currentLevel >= 2 && i === 0) {
          // First node is locked in place in higher levels
          requiredAlignment = "radial";
        }

        // Create node
        newNodes.push({
          id: i,
          x: x,
          y: y,
          frequency: frequency,
          targetDistance: targetDistance,
          targetAngle: targetAngle,
          currentDistance: Math.sqrt(x * x + y * y),
          color: baseColors[i % baseColors.length],
          inResonance: false,
          pulseSize: 0,
          isLocked: currentLevel >= 4 && i === 0, // Lock first node in higher levels
          requiredAlignment,
          fieldStrength: 1 + currentLevel * 0.2, // Nodes have stronger effects in higher levels
          isActivated: false,
        });
      }

      // Create connections between nodes
      if (currentLevel >= 2) {
        for (let i = 0; i < newNodes.length; i++) {
          for (let j = i + 1; j < newNodes.length; j++) {
            // Only connect some nodes
            if ((i + j) % 2 === 0 || Math.random() > 0.7) {
              newConnections.push({
                fromId: i,
                toId: j,
                strength: 0.5 + Math.random() * 0.5,
                color: `${baseColors[i % baseColors.length]}80`, // Semi-transparent
                isActive: false,
              });
            }
          }
        }
      }

      setNodes(newNodes);
      setConnections(newConnections);
      setTimeRemaining(60 + currentLevel * 10); // More time for higher levels
      setMoveCount(0);
      setNetworkEnergy(0);
      setNetworkStability(0);
      setCubeEngaged(false);

      console.log(
        "Created",
        newNodes.length,
        "nodes and",
        newConnections.length,
        "connections"
      );
    }
  }, [currentLevel, gameState, baseColors]);

  // Game timer
  useEffect(() => {
    if (gameState === "playing") {
      console.log("Starting game timer with", timeRemaining, "seconds");

      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Time's up
            console.log("Time's up!");
            setGameState("failure");
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Start cube pulsing
      startPulseSequence();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    };
  }, [gameState]);

  // Pulse visualization system
  useEffect(() => {
    if (pulseHistory.length > 0) {
      const timer = setTimeout(() => {
        setPulseHistory((prev) =>
          prev
            .filter((p) => p.opacity > 0.05)
            .map((p) => ({
              ...p,
              size: p.size * 1.02,
              opacity: p.opacity * 0.95,
            }))
        );
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [pulseHistory]);

  // Handle mouse events for node dragging with enhanced physics
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Get grid position
      if (!gridRef.current) return;

      const rect = gridRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - gridSize / 2;
      const y = e.clientY - rect.top - gridSize / 2;

      setMousePosition({ x, y });

      // If dragging a node, update its position
      if (isDragging && selectedNode !== null) {
        // Get the node we're moving
        const nodeToMove = nodes.find((n) => n.id === selectedNode);
        if (!nodeToMove || nodeToMove.isLocked) return;

        // Record drag path for effects
        setDragPath((prev) => [...prev, { x, y }].slice(-20)); // Keep last 20 points

        // Calculate new position with physics
        let newX = x;
        let newY = y;

        // Add gravitational pull toward resonance distance
        if (gravitationalPull || currentLevel >= 3) {
          const centerDist = Math.sqrt(x * x + y * y);
          if (centerDist > 0) {
            // Avoid division by zero
            const targetDist = nodeToMove.targetDistance;
            const pullStrength = 0.1; // Strength of the pull

            // Calculate unit vector toward center
            const dirX = x / centerDist;
            const dirY = y / centerDist;

            // Apply pull based on distance difference
            const distDiff = targetDist - centerDist;
            newX += dirX * distDiff * pullStrength;
            newY += dirY * distDiff * pullStrength;
          }
        }

        // Apply repulsion from other nodes
        nodes.forEach((otherNode) => {
          if (otherNode.id !== selectedNode) {
            const dx = newX - otherNode.x;
            const dy = newY - otherNode.y;
            const distSq = dx * dx + dy * dy;

            if (distSq > 0 && distSq < 2500) {
              // Only apply when close
              const dist = Math.sqrt(distSq);
              const repulsionStrength = 500 / distSq; // Inverse square law

              newX += (dx / dist) * repulsionStrength;
              newY += (dy / dist) * repulsionStrength;
            }
          }
        });

        // Apply connection constraints
        const nodeConnections = connections.filter(
          (c) => c.fromId === selectedNode || c.toId === selectedNode
        );

        nodeConnections.forEach((conn) => {
          const otherNodeId =
            conn.fromId === selectedNode ? conn.toId : conn.fromId;
          const otherNode = nodes.find((n) => n.id === otherNodeId);

          if (otherNode) {
            const dx = newX - otherNode.x;
            const dy = newY - otherNode.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Apply elastic force
            const idealDist = 100 + conn.strength * 50;
            const elasticity = 0.05;
            const distDiff = dist - idealDist;

            if (dist > 0) {
              // Avoid division by zero
              newX -= (dx / dist) * distDiff * elasticity;
              newY -= (dy / dist) * distDiff * elasticity;
            }
          }
        });

        // For advanced difficulty, check if angle-based constraints apply
        if (difficulty === "advanced" && nodeToMove.requiredAlignment) {
          if (
            nodeToMove.requiredAlignment === "angular" ||
            nodeToMove.requiredAlignment === "both"
          ) {
            if (nodeToMove.targetAngle !== undefined) {
              // Calculate current angle
              let currentAngle = Math.atan2(newY, newX);
              if (currentAngle < 0) currentAngle += 2 * Math.PI;

              // Calculate target position at same distance but correct angle
              const dist = Math.sqrt(newX * newX + newY * newY);
              const targetX = Math.cos(nodeToMove.targetAngle) * dist;
              const targetY = Math.sin(nodeToMove.targetAngle) * dist;

              // Apply subtle pull toward correct angle
              const anglePullStrength = 0.1;
              newX =
                newX * (1 - anglePullStrength) + targetX * anglePullStrength;
              newY =
                newY * (1 - anglePullStrength) + targetY * anglePullStrength;
            }
          }
        }

        // Update node position
        setNodes((prev) =>
          prev.map((node) =>
            node.id === selectedNode ? { ...node, x: newX, y: newY } : node
          )
        );

        // Count as a move and check resonance
        setMoveCount((prev) => prev + 1);
        checkResonance();
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setDragPath([]);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    isDragging,
    selectedNode,
    nodes,
    connections,
    gravitationalPull,
    difficulty,
  ]);

  // Handle cube pulsing
  const startPulseSequence = () => {
    // Emit pulse every 2-3 seconds (random interval)
    const startPulsing = () => {
      if (gameState !== "playing") return;

      const interval = 2000 + Math.random() * 1000;

      pulseTimerRef.current = setTimeout(() => {
        if (gameState === "playing" && !cubeEngaged) {
          // Automatic pulse if cube isn't manually engaged
          emitPulse(1);
        }
        startPulsing();
      }, interval);
    };

    startPulsing();
  };

  // Emit a pulse from the cube
  const emitPulse = (strength = 1) => {
    // Don't pulse if cube is not ready
    if (!cubeReady && !cubeEngaged) return;

    // Activate pulse effect
    setPulseActive(true);
    setPulseStrength(strength);

    // Animate the cube
    setCubeScale(1.2);
    setCubeRotation({
      x: Math.random() * 360,
      y: Math.random() * 360,
      z: Math.random() * 60 - 30,
    });

    // Add pulse to history for visualization
    setPulseHistory((prev) => [
      ...prev,
      {
        x: 0,
        y: 0,
        size: 80,
        color: selectedCube.colors[0],
        opacity: 0.8,
      },
    ]);

    // Animate nodes' pulse size
    setNodes((prev) =>
      prev.map((node) => ({
        ...node,
        pulseSize: 1,
      }))
    );

    // Play pulse sound
    playSound(440, 0.3 * strength);

    // Check node resonance with this pulse
    checkResonance();

    // Reset cube after animation
    setTimeout(() => {
      setPulseActive(false);
      setCubeScale(1);
      setCubeRotation({ x: 0, y: 0, z: 0 });

      setNodes((prev) =>
        prev.map((node) => ({
          ...node,
          pulseSize: 0,
        }))
      );

      setCubeReady(false);
      setTimeout(() => setCubeReady(true), 500);
    }, 1000);
  };

  // Check if nodes are in resonance with enhanced criteria
  const checkResonance = () => {
    // For each node, check if it's at the correct distance and angle
    setNodes((prev) => {
      const updatedNodes = prev.map((node) => {
        // Calculate current distance from center
        const distanceFromCenter = Math.sqrt(node.x * node.x + node.y * node.y);

        // Calculate current angle
        let currentAngle = Math.atan2(node.y, node.x);
        if (currentAngle < 0) currentAngle += 2 * Math.PI;

        // Check if node is in resonance (within threshold of target distance)
        const distanceThreshold =
          node.targetDistance * (difficulty === "advanced" ? 0.05 : 0.1); // Tighter tolerance in advanced mode
        const distanceResonance =
          Math.abs(distanceFromCenter - node.targetDistance) <=
          distanceThreshold;

        // Check angle if required
        let angleResonance = true;
        if (
          node.requiredAlignment === "angular" ||
          node.requiredAlignment === "both"
        ) {
          if (node.targetAngle !== undefined) {
            const angleThreshold = 0.15; // About 8.6 degrees
            angleResonance =
              Math.abs(currentAngle - node.targetAngle) <= angleThreshold ||
              Math.abs(currentAngle - node.targetAngle - 2 * Math.PI) <=
                angleThreshold;
          }
        }

        // Determine if node is in full resonance
        const inResonance =
          node.requiredAlignment === "both"
            ? distanceResonance && angleResonance
            : node.requiredAlignment === "angular"
            ? angleResonance
            : distanceResonance;

        // Node activation state
        const isActivated = inResonance;

        if (inResonance && !node.inResonance) {
          // Node just entered resonance
          playSound(node.frequency, 0.5);

          // Add pulse to history at this node's position
          setPulseHistory((prev) => [
            ...prev,
            {
              x: node.x,
              y: node.y,
              size: 40,
              color: node.color,
              opacity: 0.7,
            },
          ]);
        }

        return {
          ...node,
          currentDistance: distanceFromCenter,
          inResonance,
          isActivated,
        };
      });

      // Update connections based on node states
      updateConnections(updatedNodes);

      return updatedNodes;
    });
  };

  // Update connection states
  const updateConnections = (updatedNodes: Node[]) => {
    setConnections((prev) =>
      prev.map((conn) => {
        const fromNode = updatedNodes.find((n) => n.id === conn.fromId);
        const toNode = updatedNodes.find((n) => n.id === conn.toId);

        // Connection is active if both nodes are in resonance
        const isActive = !!(fromNode?.inResonance && toNode?.inResonance);

        return {
          ...conn,
          isActive,
        };
      })
    );
  };

  // Calculate network energy based on resonant nodes and connections
  useEffect(() => {
    const resonantNodeCount = nodes.filter((n) => n.inResonance).length;
    const activeConnectionCount = connections.filter((c) => c.isActive).length;

    // Calculate energy percentage
    const totalPossibleEnergy = nodes.length + connections.length;
    const currentEnergy = resonantNodeCount + activeConnectionCount;

    const energyPercent =
      totalPossibleEnergy > 0 ? (currentEnergy / totalPossibleEnergy) * 100 : 0;

    setNetworkEnergy(energyPercent);

    // Calculate stability based on how many nodes and connections are active
    const stabilityPercent =
      nodes.length > 0 ? (resonantNodeCount / nodes.length) * 100 : 0;

    setNetworkStability(stabilityPercent);

    // Add gravitational pull when network stability increases
    if (stabilityPercent > 30 && !gravitationalPull) {
      setGravitationalPull(true);
    }
  }, [nodes, connections]);

  // Check level completion
  useEffect(() => {
    if (gameState === "playing") {
      // In advanced mode, network needs to be fully connected
      const winCondition =
        difficulty === "advanced"
          ? networkEnergy >= 90 // 90% of nodes and connections must be active
          : networkStability >= 90; // 90% of nodes must be in resonance

      if (winCondition) {
        // Level completed
        console.log(
          "Level complete! Network stable at",
          networkStability.toFixed(1) + "%"
        );
        setGameState("success");

        // Calculate score based on time and moves
        const timeBonus = timeRemaining * 5;
        const moveBonus = Math.max(0, 200 - moveCount * 10);
        setScore((prev) => prev + currentLevel * 100 + timeBonus + moveBonus);

        // Play success sound
        playSound(880, 0.8);
      }
    }
  }, [networkEnergy, networkStability, gameState, difficulty]);

  // Handle node selection via clicking
  const handleNodeClick = (id: number, e: React.MouseEvent) => {
    if (gameState !== "playing") return;

    e.stopPropagation();

    // Get the clicked node
    const node = nodes.find((n) => n.id === id);
    if (node?.isLocked) {
      // Play error sound for locked nodes
      playSound(220, 0.3);
      return;
    }

    // Select the node and start dragging
    setSelectedNode(id);
    setIsDragging(true);
    setDragPath([{ x: node?.x || 0, y: node?.y || 0 }]);
  };

  // Handle cube interaction with multiple modes
  const handleCubeClick = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (gameState === "playing" && (cubeReady || !cubeEngaged)) {
      // Toggle cube engagement state
      setCubeEngaged(!cubeEngaged);

      if (!cubeEngaged) {
        // Just engaging - start charging
        setCubeCharging(true);

        // Rotate cube while charging
        const chargeAnimation = () => {
          setCubeRotation((prev) => ({
            x: prev.x + 5,
            y: prev.y + 2,
            z: prev.z + 1,
          }));
        };

        const chargeInterval = setInterval(chargeAnimation, 50);

        // Emit a powerful pulse after charging
        setTimeout(() => {
          clearInterval(chargeInterval);
          setCubeCharging(false);
          emitPulse(2.5); // Stronger pulse
        }, 1500);
      }
    }
  };

  // Switch cube mode
  const switchCubeMode = (mode: "pulse" | "attract" | "repel") => {
    setActiveCubeMode(mode);

    // Play mode switch sound
    playSound(mode === "pulse" ? 440 : mode === "attract" ? 330 : 550, 0.3);

    // Visual effect for mode switch
    setPulseHistory((prev) => [
      ...prev,
      {
        x: 0,
        y: 0,
        size: 40,
        color:
          mode === "pulse"
            ? selectedCube.colors[0]
            : mode === "attract"
            ? "#4ade80" // Green
            : "#f87171", // Red
        opacity: 0.6,
      },
    ]);
  };

  // Play a sound effect
  const playSound = (frequency: number, volume: number) => {
    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      // Set waveform type based on frequency
      oscillator.type = frequency > 600 ? "sine" : "triangle";
      oscillator.frequency.value = frequency;

      gainNode.gain.value = volume;

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start();

      // Fade out
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + 0.5
      );
      setTimeout(() => oscillator.stop(), 500);
    } catch (e) {
      console.error("Audio not supported");
    }
  };

  // Generate background particles for Nexus realm theme
  const renderParticles = () => {
    return Array.from({ length: 60 }).map((_, i) => (
      <motion.div
        key={`particle-${i}`}
        className="absolute rounded-full bg-gradient-to-r from-pink-300 to-purple-400"
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
          boxShadow: `0 0 ${Math.random() * 8 + 2}px ${
            selectedCube.colors[0] || "#ec4899"
          }`,
        }}
      />
    ));
  };

  // Render pulse history visualizations
  const renderPulseHistory = () => {
    return pulseHistory.map((pulse, index) => (
      <div
        key={`pulse-${index}`}
        className="absolute rounded-full pointer-events-none"
        style={{
          width: `${pulse.size}px`,
          height: `${pulse.size}px`,
          left: "50%",
          top: "50%",
          marginLeft: `${pulse.x}px`,
          marginTop: `${pulse.y}px`,
          background: `radial-gradient(circle, ${pulse.color}${Math.floor(
            pulse.opacity * 255
          )
            .toString(16)
            .padStart(2, "0")} 0%, transparent 70%)`,
          transform: "translate(-50%, -50%)",
          opacity: pulse.opacity,
          zIndex: 5,
        }}
      />
    ));
  };

  // Render node drag path
  const renderDragPath = () => {
    if (dragPath.length < 2) return null;

    return dragPath.slice(0, -1).map((point, i) => {
      if (i < dragPath.length - 2) {
        const nextPoint = dragPath[i + 1];
        const opacity = 0.1 + (i / dragPath.length) * 0.4;

        // Draw line segment
        const dx = nextPoint.x - point.x;
        const dy = nextPoint.y - point.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        return (
          <div
            key={`path-${i}`}
            className="absolute rounded-full"
            style={{
              height: "2px",
              width: `${length}px`,
              left: "50%",
              top: "50%",
              marginLeft: `${point.x}px`,
              marginTop: `${point.y}px`,
              background:
                selectedNode !== null
                  ? nodes.find((n) => n.id === selectedNode)?.color || "#fff"
                  : "#fff",
              opacity: opacity,
              transform: `translate(0, -50%) rotate(${angle}deg)`,
              transformOrigin: "left center",
              zIndex: 5,
            }}
          />
        );
      }
      return null;
    });
  };

  // Start game
  const startGame = () => {
    console.log("Starting game!");
    setGameState("playing");
    setCubeReady(true);
    playSound(440, 0.5);

    // Animate the grid appearance
    gridControls.start({
      scale: [0.95, 1.02, 1],
      opacity: [0.8, 1],
      transition: { duration: 1 },
    });
  };

  // Next level
  const nextLevel = () => {
    console.log("Advancing to next level");
    setCurrentLevel((prev) => prev + 1);
    setGameState("intro");
    playSound(880, 0.5);
  };

  // Retry level
  const retryLevel = () => {
    console.log("Retrying level");
    setGameState("intro");
    playSound(660, 0.5);
  };

  // Toggle hint mode
  const toggleHints = () => {
    setShowHints((prev) => !prev);
    playSound(showHints ? 440 : 880, 0.2);
  };

  // Calculate percent of nodes in resonance
  const getProgressPercent = () => {
    if (nodes.length === 0) return 0;

    // In advanced mode, consider both nodes and connections
    if (difficulty === "advanced") {
      return networkEnergy;
    }

    // In normal mode, just look at node resonance
    return networkStability;
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
        <div className="absolute inset-0 bg-gradient-to-b from-pink-900/30 via-black to-black opacity-70"></div>

        {/* Dynamic ambient light based on network energy */}
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-1000"
          style={{
            background: `radial-gradient(circle at center, rgba(${hexToRgb(
              selectedCube.colors[0] || "#ec4899"
            )}, ${0.05 + networkEnergy / 200}) 0%, transparent 70%)`,
            filter: "blur(40px)",
          }}
        />
      </div>

      {/* Nexus atmosphere effect */}
      <div className="absolute inset-0 z-0 pointer-events-none">
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
            background: `radial-gradient(circle, rgba(${hexToRgb(
              selectedCube.colors[0] || "#ec4899"
            )}, 0.2) 0%, transparent 70%)`,
          }}
        />

        {/* Energy ripples */}
        {[1, 2, 3].map((i) => (
          <motion.div
            key={`ripple-${i}`}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-pink-500/10"
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
              borderColor: `${selectedCube.colors[0] || "#ec4899"}10`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-5xl">
        {/* Header with advanced styling */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="text-center mb-6"
        >
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-2 font-pixel tracking-wider">
            NEXUS REALM
          </h1>

          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-pink-500/50 to-transparent"></div>
            <p className="text-xl text-purple-300 font-light">
              Network Resonance
            </p>
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-pink-500/50 to-transparent"></div>
          </div>
        </motion.div>

        {/* Enhanced Status display */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mb-6 text-center backdrop-blur-sm bg-black/20 px-6 py-3 rounded-lg border border-pink-500/20"
        >
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="text-lg text-gray-300">Level</div>
            <div className="text-2xl text-pink-300 font-bold">
              {currentLevel}
            </div>
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
            {gameState === "playing" && (
              <>
                <div className="h-4 w-px bg-purple-500/30"></div>
                <div className="text-lg text-gray-300">Time</div>
                <div className="text-xl text-blue-300">
                  {Math.floor(timeRemaining / 60)}:
                  {(timeRemaining % 60).toString().padStart(2, "0")}
                </div>
                <div className="h-4 w-px bg-purple-500/30"></div>
                <div className="flex items-center gap-1">
                  <div className="text-lg text-gray-300">Energy</div>
                  <div className="text-xl text-amber-300">
                    {Math.floor(networkEnergy)}%
                  </div>
                </div>
              </>
            )}
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
                {difficulty === "advanced"
                  ? "Position the nodes in harmony with the central cube. Both distance and alignment matter."
                  : "Position the nodes at resonant distances from the central cube to create harmony."}
              </motion.p>
            )}
            {gameState === "playing" && (
              <motion.p
                key="playing-text"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-lg text-green-300 flex items-center justify-center gap-2"
              >
                {selectedNode !== null
                  ? `Moving Node ${
                      selectedNode + 1
                    } - Find its resonant position`
                  : "Click the cube to emit a stronger pulse"}
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
                Network resonance achieved! All nodes harmonized.
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
                Time's up! Network calibration failed.
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Progress bar */}
        {gameState === "playing" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-96 mb-6"
          >
            <div className="w-full bg-black/70 h-2 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500"
                initial={{ width: "0%" }}
                animate={{ width: `${getProgressPercent()}%` }}
                transition={{ duration: 0.5 }}
              ></motion.div>
            </div>
            <div className="flex justify-between text-xs text-white mt-1">
              <div>Resonance</div>
              <div>{Math.floor(getProgressPercent())}%</div>
            </div>
          </motion.div>
        )}

        <div className="flex gap-8">
          {/* Instructions panel - now on the left side */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="bg-black/50 backdrop-blur-md rounded-lg p-4 max-w-xs self-start border border-pink-500/20"
          >
            <h3 className="text-pink-400 font-bold mb-2 text-lg">
              {difficulty === "advanced" ? "Advanced Mode" : "Standard Mode"}
            </h3>
            <ul className="text-gray-300 text-sm space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-pink-400 mt-1">•</span>
                <span>Drag nodes to find their resonant positions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pink-400 mt-1">•</span>
                <span>
                  {difficulty === "advanced"
                    ? "Position matters in both distance and angle"
                    : "Each node has a unique resonant distance"}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pink-400 mt-1">•</span>
                <span>Click the cube to emit a stronger pulse</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pink-400 mt-1">•</span>
                <span>Nodes glow when in resonance</span>
              </li>
              {difficulty === "advanced" && (
                <li className="flex items-start gap-2">
                  <span className="text-pink-400 mt-1">•</span>
                  <span>Build a fully connected resonant network</span>
                </li>
              )}
            </ul>

            {gameState === "playing" && (
              <>
                <div className="mt-4 mb-2">
                  <div className="bg-black/30 rounded-lg p-2 text-xs text-white">
                    <div className="flex justify-between mb-1">
                      <span>Network Energy:</span>
                      <span>{Math.floor(networkEnergy)}%</span>
                    </div>
                    <div className="w-full bg-gray-800 h-1.5 rounded-full mb-3">
                      <div
                        className="h-full rounded-full bg-pink-500"
                        style={{ width: `${networkEnergy}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between mb-1">
                      <span>Node Stability:</span>
                      <span>{Math.floor(networkStability)}%</span>
                    </div>
                    <div className="w-full bg-gray-800 h-1.5 rounded-full">
                      <div
                        className="h-full rounded-full bg-purple-500"
                        style={{ width: `${networkStability}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between gap-2">
                  <button
                    onClick={toggleHints}
                    className="py-2 flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-md font-pixel transition-transform hover:scale-105 active:scale-95 text-sm"
                  >
                    {showHints ? "Hide Hints" : "Show Hints"}
                  </button>

                  <button
                    onClick={() =>
                      switchCubeMode(
                        activeCubeMode === "pulse"
                          ? "attract"
                          : activeCubeMode === "attract"
                          ? "repel"
                          : "pulse"
                      )
                    }
                    className="py-2 flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-md font-pixel transition-transform hover:scale-105 active:scale-95 text-sm"
                  >
                    Cube Mode
                  </button>
                </div>
              </>
            )}

            {gameState === "intro" && (
              <div className="mt-4">
                <button
                  onClick={startGame}
                  className="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-md font-pixel transition-transform hover:scale-105 active:scale-95"
                >
                  Start Calibration
                </button>
              </div>
            )}

            {gameState === "success" && (
              <div className="mt-4">
                <button
                  onClick={nextLevel}
                  className="w-full py-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white rounded-md font-pixel transition-transform hover:scale-105 active:scale-95"
                >
                  Next Level
                </button>
              </div>
            )}

            {gameState === "failure" && (
              <div className="mt-4">
                <button
                  onClick={retryLevel}
                  className="w-full py-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white rounded-md font-pixel transition-transform hover:scale-105 active:scale-95"
                >
                  Try Again
                </button>
              </div>
            )}

            <div className="mt-2">
              <button
                onClick={onReturn}
                className="w-full py-2 bg-black border border-purple-500/50 hover:bg-purple-900/20 text-white rounded-md font-pixel transition-transform hover:scale-105 active:scale-95"
              >
                Return to Hub
              </button>
            </div>
          </motion.div>

          {/* 3D Grid with Cube and Nodes - Enhanced with animations */}
          <motion.div
            ref={gridRef}
            className="relative w-[600px] h-[600px] mb-8 transform-gpu"
            style={{ perspective: "1000px" }}
            animate={gridControls}
          >
            {/* 3D Grid Container */}
            <motion.div
              className="relative w-full h-full rotate-x-20 transform-gpu"
              style={{
                transformStyle: "preserve-3d",
                border: "1px solid rgba(139, 92, 246, 0.3)",
                background: "rgba(0, 0, 0, 0.3)",
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              {/* Resonance visualization rings - only shown when hints are enabled */}
              {showHints &&
                gameState === "playing" &&
                nodes.map((node) => (
                  <div
                    key={`ring-${node.id}`}
                    className="absolute left-1/2 top-1/2 rounded-full"
                    style={{
                      width: `${node.targetDistance * 2}px`,
                      height: `${node.targetDistance * 2}px`,
                      transform: "translate(-50%, -50%)",
                      border: `1px dashed ${node.color}`,
                      opacity: 0.3,
                      zIndex: 5,
                    }}
                  />
                ))}

              {/* Grid lines for better depth perception */}
              <div className="absolute inset-0 z-1" style={{ opacity: 0.2 }}>
                {/* Horizontal lines */}
                {Array.from({ length: 11 }).map((_, i) => (
                  <div
                    key={`h-line-${i}`}
                    className="absolute left-0 w-full h-px bg-purple-500/30"
                    style={{ top: `${i * 10}%` }}
                  />
                ))}

                {/* Vertical lines */}
                {Array.from({ length: 11 }).map((_, i) => (
                  <div
                    key={`v-line-${i}`}
                    className="absolute top-0 h-full w-px bg-purple-500/30"
                    style={{ left: `${i * 10}%` }}
                  />
                ))}

                {/* Radial circles */}
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={`circle-${i}`}
                    className="absolute left-1/2 top-1/2 rounded-full border border-pink-500/20"
                    style={{
                      width: `${i * 120}px`,
                      height: `${i * 120}px`,
                      transform: "translate(-50%, -50%)",
                    }}
                  />
                ))}
              </div>

              {/* Angle guide lines for advanced mode - only shown when hints are enabled */}
              {difficulty === "advanced" &&
                showHints &&
                gameState === "playing" && (
                  <>
                    {Array.from({ length: 8 }).map((_, i) => {
                      const angle = (i / 8) * 2 * Math.PI;
                      const x1 = Math.cos(angle) * 300;
                      const y1 = Math.sin(angle) * 300;

                      return (
                        <div
                          key={`angle-${i}`}
                          className="absolute left-1/2 top-1/2 origin-center"
                          style={{
                            width: "1px",
                            height: "300px",
                            background: `rgba(${hexToRgb(
                              selectedCube.colors[0] || "#ec4899"
                            )}, 0.15)`,
                            transform: `translate(-50%, -50%) rotate(${
                              angle * (180 / Math.PI)
                            }deg)`,
                          }}
                        />
                      );
                    })}
                  </>
                )}

              {/* Visualization of node connections */}
              {connections.map((conn, index) => {
                const fromNode = nodes.find((n) => n.id === conn.fromId);
                const toNode = nodes.find((n) => n.id === conn.toId);

                if (!fromNode || !toNode) return null;

                // Calculate grid-relative positions
                const fromX = fromNode.x + gridSize / 2;
                const fromY = fromNode.y + gridSize / 2;
                const toX = toNode.x + gridSize / 2;
                const toY = toNode.y + gridSize / 2;

                // Calculate line properties
                const dx = toX - fromX;
                const dy = toY - fromY;
                const length = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx) * (180 / Math.PI);

                return (
                  <motion.div
                    key={`conn-${index}`}
                    className="absolute origin-left z-10"
                    style={{
                      width: length,
                      height: conn.isActive ? "3px" : "1px",
                      left: fromX,
                      top: fromY,
                      background: conn.isActive
                        ? `linear-gradient(to right, ${fromNode.color}, ${toNode.color})`
                        : conn.color,
                      opacity: conn.isActive ? 0.8 : 0.3,
                      transform: `rotate(${angle}deg) translateZ(5px)`,
                      boxShadow: conn.isActive
                        ? `0 0 8px ${conn.color}`
                        : "none",
                      transition: "all 0.3s ease-out",
                    }}
                    animate={{
                      opacity: conn.isActive ? [0.7, 1, 0.7] : 0.3,
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                );
              })}

              {/* Node drag path visualization */}
              {renderDragPath()}

              {/* Pulse history visualization */}
              {renderPulseHistory()}

              {/* Enhanced Central Cube with animations */}
              <motion.div
                ref={cubeRef}
                className={`absolute left-1/2 top-1/2 transition-all duration-300 cursor-pointer ${
                  !cubeReady && !cubeEngaged ? "opacity-80" : "opacity-100"
                }`}
                style={{
                  transformStyle: "preserve-3d",
                  transform: `translate(-50%, -50%) translateZ(${
                    pulseActive || cubeEngaged ? "50px" : "30px"
                  }) 
                             rotateX(${cubeRotation.x}deg) 
                             rotateY(${cubeRotation.y}deg) 
                             rotateZ(${cubeRotation.z}deg) 
                             scale(${cubeScale})`,
                  transition:
                    "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease-out",
                  zIndex: 20,
                }}
                onClick={handleCubeClick}
                whileHover={{ scale: 1.05 }}
              >
                {/* Use the RealmCube component with proper ID */}
                <RealmCube
                  position="center"
                  size={90}
                  cubeId={selectedCubeId}
                  isAnimated={pulseActive || cubeCharging}
                  onCubeClick={handleCubeClick}
                  onCubeCollectionUpdate={handleCubeCollectionUpdate}
                />

                {/* Cube mode indicator */}
                {gameState === "playing" && (
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs text-white bg-black/50 px-2 py-1 rounded-full">
                    {activeCubeMode === "pulse"
                      ? "Pulse Mode"
                      : activeCubeMode === "attract"
                      ? "Attract Mode"
                      : "Repel Mode"}
                  </div>
                )}

                {/* Cube energy field */}
                <motion.div
                  className="absolute left-1/2 top-1/2 -z-10 rounded-full opacity-70"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{
                    width: "100px",
                    height: "100px",
                    background: `radial-gradient(circle, ${selectedCube.colors[0]}80 0%, transparent 70%)`,
                    transform: "translate(-50%, -50%)",
                    filter: "blur(10px)",
                  }}
                />

                {/* Pulse effect */}
                {(pulseActive || cubeCharging) && (
                  <motion.div
                    className="absolute left-1/2 top-1/2 rounded-full"
                    animate={{
                      scale: [1, cubeCharging ? 1.5 : 2.5],
                      opacity: [0.8, 0],
                    }}
                    transition={{
                      duration: cubeCharging ? 1.5 : 1,
                      ease: "easeOut",
                      repeat: cubeCharging ? Infinity : 0,
                    }}
                    style={{
                      width: "90px",
                      height: "90px",
                      background: `radial-gradient(circle, ${selectedCube.colors[0]}90 0%, transparent 70%)`,
                      transform: "translate(-50%, -50%)",
                      boxShadow: `0 0 20px ${selectedCube.colors[0]}`,
                    }}
                  />
                )}

                {/* Interaction prompt */}
                {gameState === "playing" && !cubeEngaged && !pulseActive && (
                  <motion.div
                    className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 text-white text-xs"
                    animate={{
                      y: [0, -5, 0],
                      opacity: [0.6, 1, 0.6],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    Click to engage
                  </motion.div>
                )}
              </motion.div>

              {/* Nodes - Enhanced with animations and effects */}
              {nodes.map((node) => {
                const isSelected = selectedNode === node.id;
                const posX = node.x + gridSize / 2;
                const posY = node.y + gridSize / 2;

                // Calculate node activation glow intensity
                const glowIntensity = node.inResonance
                  ? 2
                  : node.isActivated
                  ? 1.5
                  : 1;

                // Calculate node size and elevation based on state
                const nodeSize =
                  40 * (node.isActivated ? 1.2 : 1) * (isSelected ? 1.3 : 1);
                const nodeElevation = node.inResonance
                  ? 35
                  : node.isActivated
                  ? 25
                  : isSelected
                  ? 30
                  : 15;

                return (
                  <motion.div
                    key={`node-${node.id}`}
                    className={`absolute rounded-full ${
                      node.isLocked ? "cursor-not-allowed" : "cursor-grab"
                    } 
                              ${isSelected ? "z-30 cursor-grabbing" : "z-20"}`}
                    style={{
                      width: `${nodeSize}px`,
                      height: `${nodeSize}px`,
                      left: `${posX - nodeSize / 2}px`,
                      top: `${posY - nodeSize / 2}px`,
                      backgroundColor: node.color,
                      boxShadow: `0 0 ${15 * glowIntensity}px ${node.color}`,
                      transform: `translateZ(${nodeElevation}px)`,
                      opacity: node.inResonance ? 1 : 0.9,
                      transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      border: node.isLocked
                        ? `2px solid rgba(255, 255, 255, 0.8)`
                        : node.inResonance
                        ? `2px solid rgba(255, 255, 255, 0.6)`
                        : "none",
                    }}
                    animate={
                      node.inResonance
                        ? {
                            boxShadow: [
                              `0 0 ${15 * glowIntensity}px ${node.color}`,
                              `0 0 ${20 * glowIntensity}px ${node.color}`,
                              `0 0 ${15 * glowIntensity}px ${node.color}`,
                            ],
                          }
                        : {}
                    }
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    onMouseDown={(e) => handleNodeClick(node.id, e)}
                    whileHover={
                      !node.isLocked ? { scale: 1.1, z: nodeElevation + 5 } : {}
                    }
                  >
                    {/* Node ID label */}
                    <div className="flex items-center justify-center h-full w-full font-bold text-black">
                      {node.id + 1}
                    </div>

                    {/* Resonance waves */}
                    {node.inResonance && (
                      <motion.div
                        className="absolute left-1/2 top-1/2 rounded-full border-2 pointer-events-none"
                        style={{
                          width: "100%",
                          height: "100%",
                          borderColor: node.color,
                          transform: "translate(-50%, -50%)",
                        }}
                        animate={{
                          scale: [1, 2, 1],
                          opacity: [0.8, 0, 0.8],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    )}

                    {/* Node activation indicator */}
                    {node.isActivated && !node.inResonance && (
                      <motion.div
                        className="absolute left-1/2 top-1/2 rounded-full"
                        style={{
                          width: "10px",
                          height: "10px",
                          backgroundColor: "white",
                          transform: "translate(-50%, -50%)",
                        }}
                        animate={{
                          opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    )}

                    {/* Locked node indicator */}
                    {node.isLocked && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-white text-xs">
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
                            <rect
                              x="3"
                              y="11"
                              width="18"
                              height="11"
                              rx="2"
                              ry="2"
                            ></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                          </svg>
                        </div>
                      </div>
                    )}

                    {/* Target hint for this node - only shown during hints */}
                    {showHints &&
                      gameState === "playing" &&
                      node.requiredAlignment === "both" &&
                      node.targetAngle !== undefined && (
                        <motion.div
                          className="absolute pointer-events-none"
                          style={{
                            width: "4px",
                            height: "4px",
                            left: `${
                              gridSize / 2 +
                              Math.cos(node.targetAngle) * node.targetDistance
                            }px`,
                            top: `${
                              gridSize / 2 +
                              Math.sin(node.targetAngle) * node.targetDistance
                            }px`,
                            backgroundColor: node.color,
                            transform: "translate(-50%, -50%)",
                            boxShadow: `0 0 5px ${node.color}`,
                            opacity: 0.6,
                            zIndex: 5,
                          }}
                          animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.6, 0.9, 0.6],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        />
                      )}
                  </motion.div>
                );
              })}

              {/* Energy field particles */}
              {gameState === "playing" &&
                Array.from({ length: 12 }).map((_, i) => (
                  <motion.div
                    key={`energy-particle-${i}`}
                    className="absolute rounded-full bg-white"
                    style={{
                      width: "3px",
                      height: "3px",
                      left: `${gridSize / 2}px`,
                      top: `${gridSize / 2}px`,
                      opacity: 0.6,
                      zIndex: 5,
                    }}
                    animate={{
                      x: [0, Math.cos((i * Math.PI) / 6) * 250],
                      y: [0, Math.sin((i * Math.PI) / 6) * 250],
                      opacity: [0, 0.8, 0],
                      scale: [0, 1, 0],
                    }}
                    transition={{
                      duration: 4 + (i % 3),
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: "easeOut",
                    }}
                  />
                ))}
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Global styles for 3D transformations */}
      <style jsx global>{`
        .rotate-x-20 {
          transform: rotateX(20deg);
        }
        .font-pixel {
          font-family: "Press Start 2P", monospace;
          letter-spacing: 0.05em;
        }
        .cursor-grab {
          cursor: grab;
        }
        .cursor-grabbing {
          cursor: grabbing;
        }
        .cursor-not-allowed {
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default NexusRealm;
