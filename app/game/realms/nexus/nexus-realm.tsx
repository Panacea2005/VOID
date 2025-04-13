import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import RealmCube from "../../cube/realm-cube";
import { cubeCollection } from "../../cube/realm-cube";

// Enhanced node type for 3D gameplay
interface Node {
  id: number;
  position: THREE.Vector3;
  color: string;
  symbol: string;
  pattern: string;
  attributes: {
    [key: string]: any; // Dynamic attributes for rule matching
  };
  isConnected: boolean;
  isHighlighted: boolean;
  mesh?: THREE.Mesh | THREE.Group; // Reference to THREE.js mesh or group
}

interface Connection {
  source: number;
  target: number;
  color: string;
  valid: boolean;
  beamMesh?: THREE.Mesh; // Reference to the beam mesh
  bridgeMesh?: THREE.Mesh | THREE.Group | THREE.Line; // Reference to the permanent bridge mesh or group
}

interface LogicRule {
  name: string;
  description: string;
  validate: (node1: Node, node2: Node) => boolean;
  hint: string;
}

// Cube Connector - 3D Puzzle Game
interface NexusRealmProps {
  onReturn: () => void;
  selectedCubeId?: string;
}

const NexusRealm: React.FC<NexusRealmProps> = ({
  onReturn,
  selectedCubeId = "pink-neon",
}) => {
  console.log("NexusRealm rendering with selectedCubeId:", selectedCubeId);

  // Game states
  const [gameState, setGameState] = useState<
    "intro" | "playing" | "success" | "failure"
  >("intro");
  const [currentLevel, setCurrentLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [activeNodes, setActiveNodes] = useState<number[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [hintVisible, setHintVisible] = useState(false);
  const [currentRule, setCurrentRule] = useState<LogicRule | null>(null);
  const [isFiringBeam, setIsFiringBeam] = useState(false);
  const [successfulConnections, setSuccessfulConnections] = useState(0);
  const [discoveredRules, setDiscoveredRules] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // References
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cubeRef = useRef<THREE.Group | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Get the selected cube from collection
  const selectedCube =
    cubeCollection.find((cube) => cube.id === selectedCubeId) ||
    cubeCollection[0];
  const baseColors = selectedCube.colors;

  // Define the logic rules (different for each level)
  const logicRules: LogicRule[] = [
    {
      name: "Same Color",
      description: "Connect nodes with the same color",
      validate: (node1, node2) => node1.color === node2.color,
      hint: "Look for nodes with matching colors",
    },
    {
      name: "Same Symbol",
      description: "Connect nodes with the same symbol",
      validate: (node1, node2) => node1.symbol === node2.symbol,
      hint: "Match identical symbols regardless of color",
    },
    {
      name: "Complementary Colors",
      description: "Connect nodes with complementary colors",
      validate: (node1, node2) => {
        const complementaryPairs: { [key: string]: string } = {
          "#FF0000": "#00FFFF", // Red & Cyan
          "#00FFFF": "#FF0000",
          "#00FF00": "#FF00FF", // Green & Magenta
          "#FF00FF": "#00FF00",
          "#0000FF": "#FFFF00", // Blue & Yellow
          "#FFFF00": "#0000FF",
        };
        return complementaryPairs[node1.color] === node2.color;
      },
      hint: "Connect nodes with opposite colors on the color wheel",
    },
    {
      name: "Mirrored Position",
      description: "Connect nodes that are positioned as mirror images",
      validate: (node1, node2) => {
        // Nodes are mirrored if one coordinate is opposite (e.g., +x and -x)
        return (
          Math.abs(node1.position.x + node2.position.x) < 0.1 ||
          Math.abs(node1.position.y + node2.position.y) < 0.1 ||
          Math.abs(node1.position.z + node2.position.z) < 0.1
        );
      },
      hint: "Find nodes that are positioned as reflections of each other",
    },
    {
      name: "Opposite Patterns",
      description: "Connect nodes with opposite patterns (filled vs outline)",
      validate: (node1, node2) => {
        const opposites: { [key: string]: string } = {
          filled: "outline",
          outline: "filled",
          solid: "hollow",
          hollow: "solid",
        };
        return (
          opposites[node1.attributes.patternType] ===
          node2.attributes.patternType
        );
      },
      hint: "Pair filled shapes with their outline versions",
    },
    {
      name: "Size Sequence",
      description: "Connect nodes in ascending or descending size order",
      validate: (node1, node2) => {
        // The second node should be exactly one size larger than the first
        return node2.attributes.size === node1.attributes.size + 1;
      },
      hint: "Connect nodes in order of increasing size",
    },
    {
      name: "Element Chain",
      description:
        "Connect nodes that form elemental chains (water→earth→fire→air→water)",
      validate: (node1, node2) => {
        const elementChain: { [key: string]: string } = {
          water: "earth",
          earth: "fire",
          fire: "air",
          air: "water",
        };
        return (
          elementChain[node1.attributes.element] === node2.attributes.element
        );
      },
      hint: "Create a chain of elements following natural transitions",
    },
  ];

  // Initialize 3D scene
  useEffect(() => {
    console.log("Initializing 3D scene with canvas:", canvasRef.current);

    if (!canvasRef.current) return;

    // Setup Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Add point lights for dramatic lighting
    const pointLight1 = new THREE.PointLight(0x7047fa, 1, 10);
    pointLight1.position.set(2, 2, 2);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff47a3, 1, 10);
    pointLight2.position.set(-2, -1, 3);
    scene.add(pointLight2);

    // Setup camera
    const aspect = window.innerWidth / window.innerHeight;
    const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    camera.position.z = 8;
    cameraRef.current = camera;

    // Setup renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Setup mouse controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.rotateSpeed = 0.7;
    controls.zoomSpeed = 0.8;
    controls.panSpeed = 0.8;
    controls.minDistance = 3;
    controls.maxDistance = 12;
    controls.enablePan = false;
    controlsRef.current = controls;

    console.log("Creating central cube with colors:", baseColors);

    // Create central cube
    const cubeGroup = new THREE.Group();
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);

    // Add subtle geometry details to the cube
    const cubeEdgesGeometry = new THREE.EdgesGeometry(cubeGeometry);
    const cubeEdges = new THREE.LineSegments(
      cubeEdgesGeometry,
      new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.5,
      })
    );

    const cubeMaterials = selectedCube.colors.map((color) => {
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness: 0.3,
        metalness: 0.7,
        emissive: new THREE.Color(color),
        emissiveIntensity: 0.3,
      });
      return mat;
    });

    // Create the cube with 6 materials (one for each face)
    const cubeMesh = new THREE.Mesh(
      cubeGeometry,
      cubeMaterials.length >= 6
        ? cubeMaterials.slice(0, 6)
        : Array(6).fill(cubeMaterials[0])
    );
    cubeMesh.castShadow = true;
    cubeMesh.receiveShadow = true;
    cubeGroup.add(cubeMesh);
    cubeGroup.add(cubeEdges);

    // Add glow effect to cube
    const glowGeometry = new THREE.BoxGeometry(1.1, 1.1, 1.1);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: selectedCube.colors[0],
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide,
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    cubeGroup.add(glowMesh);

    // Add cube to scene
    scene.add(cubeGroup);
    cubeRef.current = cubeGroup;

    // Instead of loading texture, create a gradient background
    const galaxyGeometry = new THREE.SphereGeometry(80, 32, 32);
    const galaxyMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      side: THREE.BackSide,
      fog: false,
      wireframe: false,
      transparent: true,
      opacity: 0.5,
    });

    // Try to create a gradient for the background
    const galaxy = new THREE.Mesh(galaxyGeometry, galaxyMaterial);
    scene.add(galaxy);

    console.log("Adding background particles");

    // Add background particles
    for (let i = 0; i < 200; i++) {
      const particleGeometry = new THREE.SphereGeometry(
        0.05 + Math.random() * 0.05,
        8,
        8
      );
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(
          selectedCube.colors[
            Math.floor(Math.random() * selectedCube.colors.length)
          ]
        ),
        transparent: true,
        opacity: Math.random() * 0.5 + 0.1,
      });
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);

      // Position randomly in a larger sphere
      const radius = 30 + Math.random() * 40;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      particle.position.x = radius * Math.sin(phi) * Math.cos(theta);
      particle.position.y = radius * Math.sin(phi) * Math.sin(theta);
      particle.position.z = radius * Math.cos(phi);

      // Add subtle random motion
      particle.userData = {
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.01
        ),
      };

      scene.add(particle);
    }

    console.log("Setting up mouse interaction");

    const handleMouseMove = (event: MouseEvent) => {
      // Calculate mouse position in normalized device coordinates
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouseRef.current.y =
          -((event.clientY - rect.top) / rect.height) * 2 + 1;
      }
    };

    // Find and replace this function in nexus-realm.tsx

    const handleMouseClick = (event: MouseEvent) => {
      if (!sceneRef.current || !cameraRef.current) return;

      console.log("Mouse click detected, gameState:", gameState);

      // Update the picking ray with the camera and mouse position
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

      // First, check if we're in playing state
      if (gameState !== "playing") {
        return;
      }

      // Check if we're already firing a beam
      if (isFiringBeam) {
        return;
      }

      // Get all intersected objects
      const intersects = raycasterRef.current.intersectObjects(
        sceneRef.current.children,
        true
      );
      console.log("Intersects found:", intersects.length);

      // If we have two active nodes, see if we clicked the central cube to fire a beam
      if (activeNodes.length === 2) {
        // Check if we clicked the central cube or any part of it
        for (let i = 0; i < intersects.length; i++) {
          const intersectedObject = intersects[i].object;

          // Check if the object is part of the cube group
          let isPartOfCube = false;
          let currentObj = intersectedObject;

          // Traverse up the parent chain to see if we're part of the cube group
          while (currentObj && !isPartOfCube) {
            if (currentObj === cubeRef.current) {
              isPartOfCube = true;
            }
            const parentObj = currentObj.parent;
            if (!parentObj) break;
            currentObj = parentObj;
          }

          if (
            isPartOfCube ||
            // Also check by position - the cube should be at or very near the origin
            (Math.abs(intersectedObject.position.x) < 0.5 &&
              Math.abs(intersectedObject.position.y) < 0.5 &&
              Math.abs(intersectedObject.position.z) < 0.5)
          ) {
            console.log("Central cube clicked with two nodes selected");
            fireBeam();
            return;
          }
        }
      }

      // Check for node selection
      for (let i = 0; i < intersects.length; i++) {
        const intersectedObject = intersects[i].object;

        // Get the parent group if this is a child object
        let targetObject = intersectedObject;

        // Traverse up to find the group with nodeId userData
        while (
          targetObject.parent &&
          !(targetObject.userData && targetObject.userData.nodeId !== undefined)
        ) {
          targetObject = targetObject.parent;
        }

        // Check if we found a node
        if (
          targetObject.userData &&
          targetObject.userData.nodeId !== undefined
        ) {
          const nodeId = targetObject.userData.nodeId;
          console.log("Node clicked:", nodeId);
          highlightNode(nodeId);
          return;
        }
      }
    };

    // Add event listeners
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("click", handleMouseClick);

    // Animation loop
    const animate = () => {
      if (!sceneRef.current || !rendererRef.current || !cameraRef.current)
        return;

      // Update orbit controls
      if (controlsRef.current) {
        controlsRef.current.update();
      }

      // Animate background particles
      sceneRef.current.children.forEach((child) => {
        if (
          child instanceof THREE.Mesh &&
          child.geometry instanceof THREE.SphereGeometry &&
          child.geometry.parameters.radius <= 0.1
        ) {
          // Rotate particles
          child.rotation.x += 0.001;
          child.rotation.y += 0.002;

          // Move particles with their velocity
          if (child.userData && child.userData.velocity) {
            child.position.add(child.userData.velocity);

            // If particle moves too far, reset it
            if (child.position.length() > 100) {
              const radius = 30 + Math.random() * 40;
              const theta = Math.random() * Math.PI * 2;
              const phi = Math.acos(2 * Math.random() - 1);

              child.position.x = radius * Math.sin(phi) * Math.cos(theta);
              child.position.y = radius * Math.sin(phi) * Math.sin(theta);
              child.position.z = radius * Math.cos(phi);
            }
          }
        }
      });

      // Gently rotate the galaxy background
      if (galaxy) {
        galaxy.rotation.y += 0.0001;
      }

      // Gently pulse the cube's glow
      if (cubeRef.current && cubeRef.current.children.length >= 3) {
        const glow = cubeRef.current.children[2];
        glow.scale.x = 1.1 + Math.sin(Date.now() * 0.001) * 0.05;
        glow.scale.y = 1.1 + Math.sin(Date.now() * 0.001) * 0.05;
        glow.scale.z = 1.1 + Math.sin(Date.now() * 0.001) * 0.05;
      }

      // Render scene
      rendererRef.current.render(sceneRef.current, cameraRef.current);

      // Continue animation loop
      animationFrameRef.current = requestAnimationFrame(animate);
      makeNodesMoreVisible();
    };

    // Start animation
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;

      const width = window.innerWidth;
      const height = window.innerHeight;

      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    // Mark as initialized
    setIsInitialized(true);
    console.log("3D scene initialization complete");

    // Cleanup function
    return () => {
      console.log("Cleaning up 3D scene");
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleMouseClick);
      window.removeEventListener("resize", handleResize);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Dispose geometries and materials to prevent memory leaks
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();

          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });

      // Dispose renderer
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }

      // Dispose controls
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
    };
  }, [selectedCubeId]);

  // Generate nodes for the current level
  useEffect(() => {
    console.log(
      "Node generation effect running - gameState:",
      gameState,
      "scene initialized:",
      isInitialized,
      "sceneRef:",
      !!sceneRef.current
    );

    if (gameState === "intro" && sceneRef.current && isInitialized) {
      console.log("Generating nodes for level", currentLevel);

      // Clear existing nodes and connections
      nodes.forEach((node) => {
        if (node.mesh && sceneRef.current) {
          sceneRef.current.remove(node.mesh);
        }
      });

      connections.forEach((conn) => {
        if (conn.beamMesh && sceneRef.current) {
          sceneRef.current.remove(conn.beamMesh);
        }
        if (conn.bridgeMesh && sceneRef.current) {
          sceneRef.current.remove(conn.bridgeMesh);
        }
      });

      setConnections([]);
      setActiveNodes([]);
      setHintVisible(false);
      setSuccessfulConnections(0);
      setDiscoveredRules([]);

      // Choose a logic rule for this level
      const levelRule =
        logicRules[Math.min(currentLevel - 1, logicRules.length - 1)];
      setCurrentRule(levelRule);
      console.log("Selected rule:", levelRule.name);

      // Generate new nodes
      const newNodes: Node[] = [];
      const nodeCount = 6 + Math.min(currentLevel, 6); // 6-12 nodes based on level
      console.log("Creating", nodeCount, "nodes");

      // Define node attributes based on the current rule
      const symbols = ["●", "■", "★", "♦", "▲", "◆"];
      const colors =
        baseColors.length > 0
          ? baseColors
          : ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF"];
      const patternTypes = ["filled", "outline", "solid", "hollow"];
      const elements = ["water", "earth", "fire", "air"];
      const sizes = [1, 2, 3, 4];

      console.log("Using colors:", colors);

      // Create nodes with appropriate attributes for the level's rule
      for (let i = 0; i < nodeCount; i++) {
        // Create a position on a sphere around the central cube
        const radius = 3.5; // Distance from center
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        const position = new THREE.Vector3(
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.sin(phi) * Math.sin(theta),
          radius * Math.cos(phi)
        );

        // Initialize node attributes based on the current rule
        let nodeColor = colors[Math.floor(Math.random() * colors.length)];
        let nodeSymbol = symbols[Math.floor(Math.random() * symbols.length)];
        const nodePatternType =
          patternTypes[Math.floor(Math.random() * patternTypes.length)];
        const nodeElement =
          elements[Math.floor(Math.random() * elements.length)];
        const nodeSize = sizes[Math.floor(Math.random() * sizes.length)];

        // Create the node
        const newNode: Node = {
          id: i,
          position: position,
          color: nodeColor,
          symbol: nodeSymbol,
          pattern: `${nodeSymbol}-${nodePatternType}`,
          attributes: {
            patternType: nodePatternType,
            element: nodeElement,
            size: nodeSize,
          },
          isConnected: false,
          isHighlighted: false,
        };

        // Create Three.js mesh for the node
        if (sceneRef.current) {
          console.log("Creating mesh for node", i);

          // Create a more visually interesting node
          const nodeGroup = new THREE.Group();

          // Base sphere for the node
          const coreSize = 0.3;
          const nodeGeometry = new THREE.SphereGeometry(coreSize, 16, 16);
          const nodeMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(newNode.color),
            emissive: new THREE.Color(newNode.color),
            emissiveIntensity: 0.5,
            metalness: 0.7,
            roughness: 0.2,
            transparent: true,
            opacity: 0.9,
          });

          const nodeMesh = new THREE.Mesh(nodeGeometry, nodeMaterial);
          nodeGroup.add(nodeMesh);

          // Add visual indicator for node type (simple version)
          // For simplicity, just add a ring around the node
          const ringGeometry = new THREE.TorusGeometry(
            coreSize * 1.5,
            coreSize * 0.1,
            8,
            24
          );
          const ringMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(newNode.color),
            transparent: true,
            opacity: 0.5,
          });

          const ring = new THREE.Mesh(ringGeometry, ringMaterial);
          ring.rotation.x = Math.PI / 2;
          nodeGroup.add(ring);

          // Position the node group
          nodeGroup.position.copy(newNode.position);
          nodeGroup.userData = { nodeId: newNode.id };

          nodeGroup.children.forEach((child) => {
            child.userData = { ...child.userData, nodeId: newNode.id };
          });

          // Add to scene
          sceneRef.current.add(nodeGroup);
          newNode.mesh = nodeGroup;
        }

        newNodes.push(newNode);
      }

      console.log("Created nodes:", newNodes.length);

      // Ensure there are valid connections possible based on the level's logic rule
      // (Create at least nodeCount/2 valid pairs)
      const requiredPairs = Math.floor(nodeCount / 2);
      let validPairsCount = 0;

      // Count existing valid pairs
      for (let i = 0; i < newNodes.length; i++) {
        for (let j = i + 1; j < newNodes.length; j++) {
          if (levelRule.validate(newNodes[i], newNodes[j])) {
            validPairsCount++;
          }
        }
      }

      console.log(
        "Valid pairs found:",
        validPairsCount,
        "required:",
        requiredPairs
      );

      // If we don't have enough valid pairs, modify nodes to create them
      while (validPairsCount < requiredPairs) {
        // Pick two random nodes
        const index1 = Math.floor(Math.random() * newNodes.length);
        let index2;
        do {
          index2 = Math.floor(Math.random() * newNodes.length);
        } while (index2 === index1);

        // Modify the second node to match the rule with the first node
        const node1 = newNodes[index1];
        const node2 = newNodes[index2];

        console.log("Creating valid pair between nodes", index1, "and", index2);

        // Apply modifications based on rule type
        if (levelRule.name === "Same Color") {
          node2.color = node1.color;
          if (node2.mesh instanceof THREE.Group) {
            const mainMesh = node2.mesh.children[0] as THREE.Mesh;
            if (
              mainMesh &&
              mainMesh.material instanceof THREE.MeshStandardMaterial
            ) {
              mainMesh.material.color.set(node1.color);
              mainMesh.material.emissive.set(node1.color);
            }
            // Update ring color too
            const ring = node2.mesh.children[1] as THREE.Mesh;
            if (ring && ring.material instanceof THREE.MeshBasicMaterial) {
              ring.material.color.set(node1.color);
            }
          }
        } else if (levelRule.name === "Same Symbol") {
          node2.symbol = node1.symbol;
          node2.pattern = `${node1.symbol}-${node2.attributes.patternType}`;
        } else if (levelRule.name === "Complementary Colors") {
          const complementary: { [key: string]: string } = {
            "#FF0000": "#00FFFF", // Red & Cyan
            "#00FF00": "#FF00FF", // Green & Magenta
            "#0000FF": "#FFFF00", // Blue & Yellow
          };
          node2.color = complementary[node1.color] || "#FFFFFF";
          if (node2.mesh instanceof THREE.Group) {
            const mainMesh = node2.mesh.children[0] as THREE.Mesh;
            if (
              mainMesh &&
              mainMesh.material instanceof THREE.MeshStandardMaterial
            ) {
              mainMesh.material.color.set(node2.color);
              mainMesh.material.emissive.set(node2.color);
            }
            // Update ring color too
            const ring = node2.mesh.children[1] as THREE.Mesh;
            if (ring && ring.material instanceof THREE.MeshBasicMaterial) {
              ring.material.color.set(node2.color);
            }
          }
        } else if (levelRule.name === "Mirrored Position") {
          // Make positions mirrored
          node2.position.x = -node1.position.x;
          if (node2.mesh) {
            node2.mesh.position.x = node2.position.x;
          }
        } else if (levelRule.name === "Opposite Patterns") {
          const opposite =
            node1.attributes.patternType === "filled" ? "outline" : "filled";
          node2.attributes.patternType = opposite;
          node2.pattern = `${node2.symbol}-${opposite}`;
        } else if (levelRule.name === "Size Sequence") {
          node2.attributes.size = node1.attributes.size + 1;
          if (node2.mesh) {
            const scale = 0.7 + node2.attributes.size * 0.2;
            node2.mesh.scale.set(scale, scale, scale);
          }
        } else if (levelRule.name === "Element Chain") {
          const elementChain: { [key: string]: string } = {
            water: "earth",
            earth: "fire",
            fire: "air",
            air: "water",
          };
          node2.attributes.element = elementChain[node1.attributes.element];
        }

        validPairsCount++;
      }

      setNodes(newNodes);
      setTimeRemaining(60 + currentLevel * 10); // More time for higher levels

      console.log("Node generation complete with", newNodes.length, "nodes");
    }
  }, [currentLevel, gameState, baseColors, isInitialized]);

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
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  // Check for level completion
  useEffect(() => {
    // Count connected nodes and check if all are connected
    if (gameState === "playing") {
      const connectedNodeCount = nodes.filter(
        (node) => node.isConnected
      ).length;

      if (connectedNodeCount === nodes.length && nodes.length > 0) {
        // All nodes connected - level completed
        console.log("Level complete! All nodes connected");
        setGameState("success");
        setScore((prev) => prev + currentLevel * 150 + timeRemaining * 10);

        // Play success sound
        playSound(700, 0.8, "success");
      }
    }
  }, [nodes, gameState]);

  // Add visual indicator for cube interactivity
  // Add this useEffect to your component to make the cube more interactive
  // Add this after your other useEffects

  // Enhanced cube interactivity
  useEffect(() => {
    if (
      gameState === "playing" &&
      activeNodes.length === 2 &&
      cubeRef.current
    ) {
      console.log("Enhancing cube interactivity for connection");

      // Make the cube more prominent when ready to connect
      const cubeGroup = cubeRef.current;

      // Add a pulsing glow effect
      const glowMesh = cubeGroup.children.find(
        (child) =>
          child instanceof THREE.Mesh &&
          child.material instanceof THREE.MeshBasicMaterial &&
          child.material.transparent
      );

      if (glowMesh) {
        // Enhance glow
        (glowMesh as THREE.Mesh).material = new THREE.MeshBasicMaterial({
          color: 0x00ff00,
          transparent: true,
          opacity: 0.3,
          side: THREE.BackSide,
        });

        // Make glow larger
        glowMesh.scale.set(1.3, 1.3, 1.3);
      }

      // Add event listeners to highlight cube on hover
      const handleMouseMove = (event: MouseEvent) => {
        if (activeNodes.length !== 2 || !cameraRef.current || !sceneRef.current)
          return;

        // Update mouse position
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          mouseRef.current.x =
            ((event.clientX - rect.left) / rect.width) * 2 - 1;
          mouseRef.current.y =
            -((event.clientY - rect.top) / rect.height) * 2 + 1;
        }

        // Cast ray
        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
        const intersects = raycasterRef.current.intersectObjects(
          sceneRef.current.children,
          true
        );

        // Check if hovering over cube
        let isHoveringCube = false;
        for (let i = 0; i < intersects.length; i++) {
          const obj = intersects[i].object;
          let parent = obj.parent;
          while (parent) {
            if (parent === cubeRef.current) {
              isHoveringCube = true;
              break;
            }
            parent = parent.parent;
          }

          if (isHoveringCube) break;
        }

        // Update cube appearance based on hover state
        if (isHoveringCube) {
          document.body.style.cursor = "pointer";
          cubeGroup.scale.set(1.1, 1.1, 1.1);
        } else {
          document.body.style.cursor = "grab";
          cubeGroup.scale.set(1.0, 1.0, 1.0);
        }
      };

      window.addEventListener("mousemove", handleMouseMove);

      // Cleanup
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        document.body.style.cursor = "default";

        // Reset cube appearance
        if (glowMesh && glowMesh instanceof THREE.Mesh && glowMesh.material instanceof THREE.MeshBasicMaterial) {
          glowMesh.material.color.set(selectedCube.colors[0]);
          glowMesh.material.opacity = 0.2;
          glowMesh.scale.set(1.1, 1.1, 1.1);
        }

        if (cubeRef.current) {
          cubeRef.current.scale.set(1.0, 1.0, 1.0);
        }
      };
    }
  }, [gameState, activeNodes.length]);

  // Add this component to your render function to display a clearer instruction
  // Add this inside your return statement near other UI elements

  {
    /* Visual indicator when two nodes are selected */
  }
  {
    gameState === "playing" && activeNodes.length === 2 && (
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="bg-black/80 px-6 py-3 rounded-lg border border-green-500 animate-pulse">
          <p className="text-green-400 font-bold text-xl text-center">
            Click the center cube to connect!
          </p>
          <p className="text-white text-center mt-1">
            <span className="inline-block animate-bounce">⬇️</span>
          </p>
        </div>
      </div>
    );
  }

  // Update Game UI overlay to include a "Click cube to connect" message:
  // When two nodes are selected, add this to your instructions display:

  {
    activeNodes.length === 2 && (
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-bounce">
        <div className="bg-black/80 px-4 py-2 rounded-lg border border-pink-500">
          <p className="text-pink-400 font-bold text-xl">
            Click the cube to connect!
          </p>
          <p className="text-white text-center">
            <span className="inline-block animate-ping">⬇️</span>
          </p>
        </div>
      </div>
    );
  }

  // Add better debugging:
  // Update the debug panel to include more information:

  {
    process.env.NODE_ENV !== "production" && (
      <div className="absolute bottom-24 left-8 bg-black/70 p-3 rounded-lg border border-red-500/30 max-w-xs pointer-events-auto">
        <h4 className="text-red-400 font-bold text-sm mb-2">Debug:</h4>
        <ul className="text-gray-300 text-xs space-y-1">
          <li>Game State: {gameState}</li>
          <li>Nodes: {nodes.length}</li>
          <li>Active Nodes: {activeNodes.length}</li>
          <li>Active Node IDs: {activeNodes.join(", ")}</li>
          <li>Connected: {nodes.filter((n) => n.isConnected).length}</li>
          <li>Rule: {currentRule?.name || "None"}</li>
          <li>Firing Beam: {isFiringBeam ? "Yes" : "No"}</li>
          <li>
            <button
              onClick={() => {
                console.log("Active nodes:", activeNodes);
                console.log("Nodes:", nodes);
                console.log("Current rule:", currentRule);
              }}
              className="bg-red-800 text-white px-2 py-1 rounded text-xs mt-1"
            >
              Log Debug Info
            </button>
          </li>
        </ul>
      </div>
    );
  }

  const highlightNode = (nodeId: number) => {
    if (gameState !== "playing" || isFiringBeam) return;

    console.log("Highlighting node:", nodeId);

    // If already two nodes are highlighted, reset
    if (activeNodes.length >= 2) {
      setActiveNodes([]);

      // Update nodes highlight state
      setNodes(
        nodes.map((node) => ({
          ...node,
          isHighlighted: false,
        }))
      );

      // Reset node meshes visual state
      nodes.forEach((node) => {
        if (node.mesh) {
          // Reset scale
          if (node.mesh instanceof THREE.Group) {
            node.mesh.scale.set(1, 1, 1);

            // Find the core node mesh (first child)
            node.mesh.children.forEach((child) => {
              if (
                child instanceof THREE.Mesh &&
                child.material instanceof THREE.MeshStandardMaterial
              ) {
                child.material.emissiveIntensity = 0.5;
              }
            });
          }
        }
      });

      return;
    }

    // Check if node is already connected
    const node = nodes.find((n) => n.id === nodeId);
    if (!node || node.isConnected) return;

    // If node already highlighted, unhighlight it
    if (activeNodes.includes(nodeId)) {
      setActiveNodes(activeNodes.filter((id) => id !== nodeId));

      // Update node highlight state
      setNodes(
        nodes.map((node) =>
          node.id === nodeId ? { ...node, isHighlighted: false } : node
        )
      );

      // Reset node visual state
      if (node.mesh) {
        if (node.mesh instanceof THREE.Group) {
          node.mesh.scale.set(1, 1, 1);

          // Find all meshes in the group
          node.mesh.children.forEach((child) => {
            if (
              child instanceof THREE.Mesh &&
              child.material instanceof THREE.MeshStandardMaterial
            ) {
              child.material.emissiveIntensity = 0.5;
            }
          });
        }
      }

      return;
    }

    // Add node to active nodes
    setActiveNodes([...activeNodes, nodeId]);

    // Update node highlight state
    setNodes(
      nodes.map((node) =>
        node.id === nodeId ? { ...node, isHighlighted: true } : node
      )
    );

    // Play highlight sound
    playSound(400 + nodeId * 30, 0.3, "digital");

    // Update node visual state to show it's highlighted
    if (node.mesh) {
      if (node.mesh instanceof THREE.Group) {
        // Scale up the entire group
        node.mesh.scale.set(1.2, 1.2, 1.2);

        // Make all meshes in the group glow
        node.mesh.children.forEach((child) => {
          if (
            child instanceof THREE.Mesh &&
            child.material instanceof THREE.MeshStandardMaterial
          ) {
            child.material.emissiveIntensity = 1.0;
          }
        });
      }
    }
  };

  // Fire beam between two selected nodes
  // Replace the fireBeam function with this enhanced version

  const fireBeam = () => {
    if (gameState !== "playing" || activeNodes.length !== 2 || isFiringBeam) {
      console.log("Cannot fire beam: conditions not met", {
        gameState,
        activeNodesCount: activeNodes.length,
        isFiringBeam,
      });
      return;
    }

    console.log("Firing beam between nodes", activeNodes);
    setIsFiringBeam(true);

    const [nodeId1, nodeId2] = activeNodes;
    const node1 = nodes.find((n) => n.id === nodeId1);
    const node2 = nodes.find((n) => n.id === nodeId2);

    if (!node1 || !node2 || !sceneRef.current) {
      console.error("Missing nodes or scene for beam firing");
      setIsFiringBeam(false);
      return;
    }

    // Determine if connection is valid according to current rule
    let isValid = false;
    if (currentRule) {
      isValid = currentRule.validate(node1, node2);
      console.log("Connection validity:", isValid, "rule:", currentRule.name);
    }

    // Get the positions of the nodes for beam
    const beamStart = node1.position.clone();
    const beamEnd = node2.position.clone();

    // Create a beam from cube to first node
    const beamMaterial = new THREE.LineBasicMaterial({
      color: isValid ? 0x00ff00 : 0xff0000,
      linewidth: 3,
      opacity: 0.9,
      transparent: true,
    });

    // Create path from cube center to node 1
    const beam1Geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0), // Cube center
      beamStart, // Node 1 position
    ]);

    const beam1 = new THREE.Line(beam1Geometry, beamMaterial);
    sceneRef.current.add(beam1);

    // Play sound effect
    playSound(
      isValid ? 500 : 200,
      isValid ? 0.6 : 0.4,
      isValid ? "success" : "error"
    );

    // First beam animation (cube to node 1)
    setTimeout(() => {
      // Remove first beam
      if (sceneRef.current) {
        sceneRef.current.remove(beam1);
        beam1.geometry.dispose();
        (beam1.material as THREE.Material).dispose();

        // Create second beam (cube to node 2)
        const beam2Geometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, 0), // Cube center
          beamEnd, // Node 2 position
        ]);

        const beam2 = new THREE.Line(beam2Geometry, beamMaterial);
        sceneRef.current.add(beam2);

        // Handle result after both beams
        setTimeout(() => {
          if (sceneRef.current) {
            // Remove second beam
            sceneRef.current.remove(beam2);
            beam2.geometry.dispose();
            (beam2.material as THREE.Material).dispose();

            if (isValid) {
              // Create permanent connection
              const connectionGeometry =
                new THREE.BufferGeometry().setFromPoints([beamStart, beamEnd]);

              const connectionMaterial = new THREE.LineBasicMaterial({
                color: new THREE.Color(node1.color),
                linewidth: 2,
                opacity: 0.7,
                transparent: true,
              });

              const connection = new THREE.Line(
                connectionGeometry,
                connectionMaterial
              );
              sceneRef.current.add(connection);

              // Update connection record
              setConnections((prev) => [
                ...prev,
                {
                  source: nodeId1,
                  target: nodeId2,
                  color: node1.color,
                  valid: true,
                  bridgeMesh: connection,
                },
              ]);

              // Mark nodes as connected
              setNodes((prev) =>
                prev.map((node) =>
                  node.id === nodeId1 || node.id === nodeId2
                    ? { ...node, isConnected: true, isHighlighted: false }
                    : node
                )
              );

              // Increment successful connections counter
              setSuccessfulConnections((prevCount) => prevCount + 1);

              // If this is the first successful connection, add rule to discovered rules
              if (successfulConnections === 0 && currentRule) {
                setDiscoveredRules([currentRule.name]);
              }

              // Pulse the cube to indicate success
              if (cubeRef.current) {
                cubeRef.current.scale.set(1.2, 1.2, 1.2);
                setTimeout(() => {
                  if (cubeRef.current) {
                    cubeRef.current.scale.set(1, 1, 1);
                  }
                }, 200);
              }
            } else {
              // Flash cube red for error
              if (cubeRef.current) {
                const mainCubeMesh = cubeRef.current.children.find(
                  (c) =>
                    c instanceof THREE.Mesh &&
                    c.geometry instanceof THREE.BoxGeometry
                ) as THREE.Mesh;

                if (mainCubeMesh) {
                  const originalMaterials = Array.isArray(mainCubeMesh.material)
                    ? [...mainCubeMesh.material]
                    : [mainCubeMesh.material];

                  // Create red materials
                  const redMaterial = new THREE.MeshStandardMaterial({
                    color: 0xff0000,
                    emissive: 0xff0000,
                    emissiveIntensity: 0.7,
                  });

                  // Apply red material to all faces
                  mainCubeMesh.material = Array.isArray(originalMaterials)
                    ? Array(originalMaterials.length).fill(redMaterial)
                    : redMaterial;

                  // Revert after a short time
                  setTimeout(() => {
                    mainCubeMesh.material = originalMaterials;
                  }, 300);
                }
              }

              // Reset node highlighting
              setNodes((prev) =>
                prev.map((node) => ({
                  ...node,
                  isHighlighted: false,
                }))
              );
            }
          }

          // Reset active nodes and firing state
          setActiveNodes([]);
          setIsFiringBeam(false);
        }, 500); // Time between second beam and completion
      }
    }, 500); // Time between first and second beam
  };

  // Play a sound effect
  const playSound = (
    frequency: number,
    volume: number,
    type: "digital" | "mechanical" | "success" | "error" = "digital"
  ) => {
    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      if (type === "digital") {
        oscillator.type = "sine";
      } else if (type === "mechanical") {
        oscillator.type = "triangle";
      } else if (type === "success") {
        oscillator.type = "sine";

        // Create success chord
        const oscillator2 = audioContext.createOscillator();
        oscillator2.type = "sine";
        oscillator2.frequency.value = frequency * 1.5;

        const gainNode2 = audioContext.createGain();
        gainNode2.gain.value = volume * 0.7;

        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);

        oscillator2.start();
        gainNode2.gain.exponentialRampToValueAtTime(
          0.001,
          audioContext.currentTime + 1
        );

        setTimeout(() => oscillator2.stop(), 1000);
      } else if (type === "error") {
        oscillator.type = "sawtooth";
      }

      oscillator.frequency.value = frequency;
      gainNode.gain.value = volume;

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start();

      if (type === "success") {
        gainNode.gain.exponentialRampToValueAtTime(
          0.001,
          audioContext.currentTime + 1
        );
        setTimeout(() => oscillator.stop(), 1000);
      } else if (type === "error") {
        // Create descending error tone
        oscillator.frequency.exponentialRampToValueAtTime(
          frequency * 0.5,
          audioContext.currentTime + 0.5
        );
        gainNode.gain.exponentialRampToValueAtTime(
          0.001,
          audioContext.currentTime + 0.5
        );
        setTimeout(() => oscillator.stop(), 500);
      } else {
        gainNode.gain.exponentialRampToValueAtTime(
          0.001,
          audioContext.currentTime + 0.3
        );
        setTimeout(() => oscillator.stop(), 300);
      }
    } catch (e) {
      console.error("Audio not supported");
    }
  };

  // Helper function to make nodes more visible
  const makeNodesMoreVisible = () => {
    if (gameState === "playing" && nodes.length > 0) {
      // Add pulsing effect to nodes
      nodes.forEach((node) => {
        if (node.mesh && !node.isConnected && !node.isHighlighted) {
          // Make nodes pulse slightly to draw attention
          if (node.mesh instanceof THREE.Group) {
            const time = Date.now() * 0.001;
            const pulseFactor = 1.0 + Math.sin(time + node.id) * 0.1;
            node.mesh.scale.set(pulseFactor, pulseFactor, pulseFactor);

            // Also increase emissive intensity
            node.mesh.children.forEach((child) => {
              if (
                child instanceof THREE.Mesh &&
                child.material instanceof THREE.MeshStandardMaterial
              ) {
                child.material.emissiveIntensity =
                  0.6 + Math.sin(time + node.id) * 0.2;
              }
            });
          }
        }
      });
    }
  };

  // Start game
  const startGame = () => {
    console.log("Starting game!");
    setGameState("playing");

    // Play start game sound
    playSound(600, 0.6, "success");
  };

  // Next level
  const nextLevel = () => {
    console.log("Advancing to next level");
    setCurrentLevel((prev) => prev + 1);
    setGameState("intro");

    // Play level up sound
    playSound(800, 0.7, "success");
  };

  // Retry level
  const retryLevel = () => {
    console.log("Retrying level");
    setGameState("intro");

    // Play retry sound
    playSound(400, 0.5, "digital");
  };

  // Show hint
  const showHint = () => {
    console.log("Showing hint");
    setHintVisible(true);

    // If no rules discovered yet, give a hint about the rule
    if (discoveredRules.length === 0 && currentRule) {
      // Play hint sound
      playSound(600, 0.3, "digital");

      // Find a valid pair of nodes to highlight briefly
      let validPair: [number, number] | null = null;

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          if (
            !nodes[i].isConnected &&
            !nodes[j].isConnected &&
            currentRule.validate(nodes[i], nodes[j])
          ) {
            validPair = [nodes[i].id, nodes[j].id];
            break;
          }
        }
        if (validPair) break;
      }

      // If found a valid pair, highlight them briefly
      if (validPair) {
        const [id1, id2] = validPair;
        console.log("Highlighting valid pair:", id1, id2);

        // Highlight nodes
        setNodes(
          nodes.map((node) =>
            node.id === id1 || node.id === id2
              ? { ...node, isHighlighted: true }
              : node
          )
        );

        // Update node meshes
        nodes.forEach((node) => {
          if (
            (node.id === id1 || node.id === id2) &&
            node.mesh instanceof THREE.Group
          ) {
            // Make node glow
            const coreMesh = node.mesh.children[0] as THREE.Mesh;
            if (
              coreMesh &&
              coreMesh.material instanceof THREE.MeshStandardMaterial
            ) {
              coreMesh.material.emissiveIntensity = 1.0;
            }
          }
        });

        setTimeout(() => {
          setNodes(
            nodes.map((node) =>
              node.id === id1 || node.id === id2
                ? { ...node, isHighlighted: false }
                : node
            )
          );

          // Reset node meshes
          nodes.forEach((node) => {
            if (
              (node.id === id1 || node.id === id2) &&
              node.mesh instanceof THREE.Group
            ) {
              const coreMesh = node.mesh.children[0] as THREE.Mesh;
              if (
                coreMesh &&
                coreMesh.material instanceof THREE.MeshStandardMaterial
              ) {
                coreMesh.material.emissiveIntensity = 0.5;
              }
            }
          });

          setHintVisible(false);
        }, 2000);
      } else {
        console.log("No valid pairs found for hint");
        setHintVisible(false);
      }
    } else {
      // Hide hint after 3 seconds
      setTimeout(() => setHintVisible(false), 3000);
    }
  };

  // Calculate percent of nodes connected
  const getProgressPercent = () => {
    if (nodes.length === 0) return 0;
    return (nodes.filter((n) => n.isConnected).length / nodes.length) * 100;
  };

  console.log("Rendering with gameState:", gameState, "nodes:", nodes.length);

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen w-full overflow-hidden"
    >
      {/* Three.js Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />

      {/* Game UI overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="relative h-full flex flex-col items-center">
          {/* Header */}
          <div className="mt-4 mb-2 text-center pointer-events-auto">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 font-pixel tracking-wider">
              CUBE CONNECTOR
            </h1>

            {/* Game status panel */}
            <div className="flex justify-center mt-2">
              <div className="flex items-center gap-4 bg-black/70 px-6 py-2 rounded-full border border-purple-500/30">
                <p className="text-lg text-pink-300">Level {currentLevel}</p>
                <div className="h-4 w-px bg-purple-500/50"></div>
                <p className="text-lg text-purple-300">Score: {score}</p>
                {gameState === "playing" && (
                  <>
                    <div className="h-4 w-px bg-purple-500/50"></div>
                    <p className="text-lg text-blue-300">
                      {Math.floor(timeRemaining / 60)}:
                      {(timeRemaining % 60).toString().padStart(2, "0")}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Rule display */}
            {gameState === "playing" &&
              discoveredRules.length > 0 &&
              currentRule && (
                <div className="mt-2 bg-black/70 py-1 px-4 rounded-full border border-green-500/30 inline-block">
                  <p className="text-green-300">
                    Rule: {currentRule.description}
                  </p>
                </div>
              )}
          </div>

          {/* Game status messages and instructions */}
          <div className="absolute top-32 left-1/2 transform -translate-x-1/2 pointer-events-none flex flex-col items-center">
            {gameState === "playing" && (
              <div className="mb-2">
                {activeNodes.length === 0 ? (
                  <p className="text-white bg-black/70 px-4 py-2 rounded-full">
                    Click on nodes to select them
                  </p>
                ) : activeNodes.length === 1 ? (
                  <p className="text-pink-300 bg-black/70 px-4 py-2 rounded-full animate-pulse">
                    Select second node
                  </p>
                ) : (
                  <p className="text-green-300 bg-black/70 px-4 py-2 rounded-full animate-pulse">
                    Click the central cube to connect!
                  </p>
                )}
              </div>
            )}

            {gameState === "intro" && (
              <div className="max-w-lg bg-black/80 p-4 rounded-lg mt-4 border border-purple-500/30">
                <p className="text-lg text-gray-200 mb-4">
                  Discover the hidden connection logic and link nodes using the
                  central cube.
                </p>
                <div className="text-gray-300 space-y-2">
                  <p className="flex items-center gap-2">
                    <span className="text-pink-400 font-bold">•</span>
                    <span>Rotate the scene by dragging the mouse</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-pink-400 font-bold">•</span>
                    <span>Click on nodes to select them (maximum 2)</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-pink-400 font-bold">•</span>
                    <span>
                      Click on the cube to fire a beam and test your connection
                    </span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-pink-400 font-bold">•</span>
                    <span>
                      Each level has a different rule for valid connections
                    </span>
                  </p>
                </div>
              </div>
            )}

            {gameState === "success" && (
              <div className="bg-black/80 p-4 rounded-lg border border-green-500/50">
                <p className="text-lg text-green-400 mb-2">
                  Network connections established!
                </p>
                <p className="text-md text-gray-300">
                  You discovered the {currentRule?.name} rule.
                </p>
              </div>
            )}

            {gameState === "failure" && (
              <div className="bg-black/80 p-4 rounded-lg border border-red-500/50">
                <p className="text-lg text-red-400 mb-2">
                  Connection timeout. The Nexus network has collapsed.
                </p>
                {currentRule && (
                  <p className="text-md text-gray-300">
                    The rule was: {currentRule.description}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Progress bar */}
          {gameState === "playing" && (
            <div className="absolute top-24 left-1/2 transform -translate-x-1/2 w-64">
              <div className="w-full bg-black/70 h-2 rounded-full">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500"
                  style={{ width: `${getProgressPercent()}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Game controls */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4 pointer-events-auto">
            {gameState === "intro" && (
              <button
                onClick={startGame}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-md font-pixel transition-transform hover:scale-105 active:scale-95"
              >
                Start Connection
              </button>
            )}

            {gameState === "playing" && (
              <button
                onClick={showHint}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-md font-pixel transition-transform hover:scale-105 active:scale-95"
              >
                {discoveredRules.length === 0
                  ? "Show Hint"
                  : "Highlight Valid Pair"}
              </button>
            )}

            {gameState === "success" && (
              <button
                onClick={nextLevel}
                className="px-6 py-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white rounded-md font-pixel transition-transform hover:scale-105 active:scale-95"
              >
                Next Level
              </button>
            )}

            {gameState === "failure" && (
              <button
                onClick={retryLevel}
                className="px-6 py-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white rounded-md font-pixel transition-transform hover:scale-105 active:scale-95"
              >
                Try Again
              </button>
            )}

            <button
              onClick={onReturn}
              className="px-6 py-2 bg-black border border-purple-500/50 hover:bg-purple-900/20 text-white rounded-md flex items-center gap-2 font-pixel transition-transform hover:scale-105 active:scale-95"
            >
              Return to Hub
            </button>
          </div>

          {/* Hint popup */}
          {hintVisible && currentRule && discoveredRules.length === 0 && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/90 border border-blue-500 rounded-lg p-6 max-w-lg">
              <h3 className="text-blue-400 font-bold mb-2">Hint:</h3>
              <p className="text-gray-300">{currentRule.hint}</p>
            </div>
          )}

          {/* Mouse interaction instructions */}
          <div className="absolute bottom-24 right-8 bg-black/70 p-3 rounded-lg border border-purple-500/30 max-w-xs">
            <h4 className="text-pink-400 font-bold text-sm mb-2">Controls:</h4>
            <ul className="text-gray-300 text-xs space-y-1">
              <li className="flex items-start gap-2">
                <span className="text-purple-400">•</span>
                <span>Left-click: Select nodes / Connect</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400">•</span>
                <span>Drag: Rotate view</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400">•</span>
                <span>Scroll: Zoom in/out</span>
              </li>
            </ul>
          </div>

          {/* Debug info - remove in production */}
          {process.env.NODE_ENV !== "production" && (
            <div className="absolute bottom-24 left-8 bg-black/70 p-3 rounded-lg border border-red-500/30 max-w-xs">
              <h4 className="text-red-400 font-bold text-sm mb-2">Debug:</h4>
              <ul className="text-gray-300 text-xs space-y-1">
                <li>Game State: {gameState}</li>
                <li>Nodes: {nodes.length}</li>
                <li>Active Nodes: {activeNodes.length}</li>
                <li>Connected: {nodes.filter((n) => n.isConnected).length}</li>
                <li>Rule: {currentRule?.name || "None"}</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Global styles for animations */}
      <style jsx global>{`
        @keyframes pulse {
          0% {
            transform: scale(0.95);
            opacity: 0.7;
          }
          100% {
            transform: scale(1.05);
            opacity: 1;
          }
        }

        @keyframes fadeIn {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }

        @keyframes glowPulse {
          0% {
            box-shadow: 0 0 5px rgba(236, 72, 153, 0.5);
          }
          50% {
            box-shadow: 0 0 20px rgba(236, 72, 153, 0.8);
          }
          100% {
            box-shadow: 0 0 5px rgba(236, 72, 153, 0.5);
          }
        }

        .animate-pulse {
          animation: pulse 1.5s infinite alternate ease-in-out;
        }

        .animate-fade-in {
          animation: fadeIn 0.5s ease-in-out;
        }

        .animate-glow-pulse {
          animation: glowPulse 2s infinite ease-in-out;
        }

        .font-pixel {
          font-family: monospace;
          letter-spacing: 0.05em;
        }

        body {
          margin: 0;
          overflow: hidden;
          cursor: default;
        }

        canvas {
          cursor: grab;
        }

        canvas:active {
          cursor: grabbing;
        }
      `}</style>
    </div>
  );
};

export default NexusRealm;
