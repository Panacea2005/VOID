// echo-realm-tpv.ts
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  LevelDefinition,
  EnemyType,
  PowerUpType,
  TileType,
  PlayerState,
} from "../types/game-types";
import { ParticleSystem } from "./particle-system";
import { EchoRealm, EchoTile } from "./echo-realm";

export class EchoRealmTPV {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private particleSystem: ParticleSystem;
  private echoRealm: EchoRealm;
  private fadingTiles: Map<string, THREE.Mesh> = new Map();
  private rippleEffects: Map<string, THREE.Mesh> = new Map();
  private echoTrails: Map<string, THREE.Points> = new Map();
  private lastUpdateTime: number = 0;
  private currentLevel: LevelDefinition | null = null;
  private reflectiveMaterial: THREE.MeshStandardMaterial;
  private mirrorObjects: THREE.Mesh[] = [];
  private gridSize: number;
  private cellSize: number;
  private player: PlayerState;
  private playerMesh: THREE.Mesh;
  private playerVelocity: THREE.Vector3 = new THREE.Vector3();
  private playerDirection: THREE.Vector3 = new THREE.Vector3();
  private moveForward: boolean = false;
  private moveBackward: boolean = false;
  private moveLeft: boolean = false;
  private moveRight: boolean = false;
  private canJump: boolean = false;
  private previousPlayerPosition: THREE.Vector3 = new THREE.Vector3();
  private containerElement: HTMLElement | null = null;
  private pastPlayerPositions: THREE.Vector3[] = []; // Store past positions for echo effect
  private maxPastPositions: number = 30; // Maximum number of past positions to store
  private echoInterval: number = 5; // How often to create echo visual (in frames)
  private ghostTrails: THREE.Mesh[] = []; // Store ghost trails
  private frameCount: number = 0;
  private mazeSize: number = 20; // Larger maze size
  private wallHeight: number = 3; // Height of maze walls
  private visibleTiles: Set<string> = new Set(); // Currently visible tiles
  private hiddenTiles: Map<string, THREE.Object3D> = new Map(); // Hidden tiles/walls
  private visibilityRadius: number = 5; // How far the player can see in tiles
  private fadingDistance: number = 8; // Distance at which tiles start to fade
  private ambientMusic: THREE.Audio | null = null;
  private footstepSound: THREE.Audio | null = null;
  private echoSound: THREE.Audio | null = null;
  private audioListener: THREE.AudioListener;
  private reflectionShaderMaterial: THREE.ShaderMaterial | undefined;
  private glitchShaderMaterial!: THREE.ShaderMaterial;
  private postProcessingEnabled: boolean = true;

  // Maze generations
  private maze: number[][] = []; // 0 = wall, 1 = path

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    controls: OrbitControls,
    particleSystem: ParticleSystem,
    gridSize: number,
    cellSize: number,
    containerElement: HTMLElement | null
  ) {
    this.scene = scene;
    this.camera = camera;
    this.controls = controls;
    this.particleSystem = particleSystem;
    this.echoRealm = new EchoRealm();
    this.gridSize = gridSize;
    this.cellSize = cellSize;
    this.containerElement = containerElement;

    // Initialize player
    this.player = {
      position: new THREE.Vector3(0, 0.5, 0),
      gridPosition: { x: 0, z: 0 },
      isMoving: false,
      health: 3,
      lives: 3,
      powerUps: [],
      keys: 0,
      energy: 0,
      isInvisible: false,
      isShielded: false,
    };

    // Create reflective material for mirror effects
    this.reflectiveMaterial = new THREE.MeshStandardMaterial({
      color: 0xaaaaff,
      metalness: 0.9,
      roughness: 0.1,
      envMapIntensity: 1.0,
      transparent: true,
      opacity: 0.7,
    });

    // Create cube environment map for reflections
    const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(128, {
      generateMipmaps: true,
      minFilter: THREE.LinearMipmapLinearFilter,
    });
    const cubeCamera = new THREE.CubeCamera(0.1, 1000, cubeRenderTarget);
    this.scene.add(cubeCamera);
    this.reflectiveMaterial.envMap = cubeRenderTarget.texture;

    // Create player mesh (cube)
    const playerGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const playerMaterial = new THREE.MeshStandardMaterial({
      color: 0xec4899, // Pink
      emissive: 0xec4899,
      emissiveIntensity: 0.3,
      metalness: 0.7,
      roughness: 0.3,
    });

    this.playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);
    this.playerMesh.position.copy(this.player.position);
    this.playerMesh.castShadow = true;
    this.playerMesh.receiveShadow = true;
    this.scene.add(this.playerMesh);

    // Initialize audio
    this.audioListener = new THREE.AudioListener();
    this.camera.add(this.audioListener);

    // Create shader materials
    this.createShaderMaterials();

    // Set up event listeners for player controls
    this.setupEventListeners();

    // Update cubemap periodically
    const updateCubemap = () => {
      if (!this.currentLevel) return;

      cubeCamera.update(THREE.WebGLRenderer.prototype, this.scene);
      requestAnimationFrame(updateCubemap);
    };

    updateCubemap();
  }

  // Create custom shader materials
  private createShaderMaterials(): void {
    // Reflection shader
    const reflectionVertexShader = `
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec2 vUv;
      
      void main() {
        vPosition = position;
        vNormal = normal;
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const reflectionFragmentShader = `
      uniform float time;
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec2 vUv;
      
      void main() {
        // Create a shimmering effect based on time
        float shimmer = sin(vUv.x * 10.0 + time) * sin(vUv.y * 10.0 + time * 0.7) * 0.1 + 0.9;
        
        // Create a reflective color with blue tint
        vec3 color = vec3(0.6, 0.8, 1.0) * shimmer;
        
        // Add edge highlighting
        float edge = 1.0 - max(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 0.0);
        edge = pow(edge, 3.0) * 0.5;
        
        // Combine effects
        gl_FragColor = vec4(color + edge, 0.7);
      }
    `;

    this.reflectionShaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
      },
      vertexShader: reflectionVertexShader,
      fragmentShader: reflectionFragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
    });

    // Glitch shader for walls and floors
    const glitchVertexShader = `
      varying vec2 vUv;
      varying vec3 vPosition;
      uniform float time;
      
      void main() {
        vUv = uv;
        vPosition = position;
        
        // Add slight vertex displacement for a glitching effect
        vec3 pos = position;
        float glitchAmount = sin(time * 2.0 + position.y * 20.0) * 0.02;
        pos.x += glitchAmount * sin(time * 10.0 + position.z * 5.0);
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `;

    const glitchFragmentShader = `
      uniform float time;
      uniform vec3 color;
      uniform float opacity;
      varying vec2 vUv;
      varying vec3 vPosition;
      
      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
      }
      
      void main() {
        // Create base color with scanlines effect
        vec3 baseColor = color;
        float scanline = sin(vUv.y * 50.0) * 0.04 + 0.96;
        baseColor *= scanline;
        
        // Add noise and glitch effect
        float noise = random(vUv + vec2(time * 0.1, 0.0));
        float glitch = step(0.98, noise) * random(vUv + time);
        
        // Add horizontal lines that move over time
        float line = step(0.98, fract(vPosition.y * 5.0 + time));
        
        // Combine effects
        vec3 finalColor = mix(baseColor, vec3(1.0), glitch * 0.2 + line * 0.1);
        
        // Adjust opacity based on distance from edges
        float edgeFade = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)) * 5.0;
        edgeFade = clamp(edgeFade, 0.0, 1.0);
        
        gl_FragColor = vec4(finalColor, opacity * edgeFade);
      }
    `;

    this.glitchShaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        color: { value: new THREE.Color(0x3b0764) },
        opacity: { value: 0.6 },
      },
      vertexShader: glitchVertexShader,
      fragmentShader: glitchFragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
    });
  }

  private setupEventListeners(): void {
    document.addEventListener("keydown", (event) => {
      switch (event.code) {
        case "ArrowUp":
        case "KeyW":
          this.moveForward = true;
          break;

        case "ArrowLeft":
        case "KeyA":
          this.moveLeft = true;
          break;

        case "ArrowDown":
        case "KeyS":
          this.moveBackward = true;
          break;

        case "ArrowRight":
        case "KeyD":
          this.moveRight = true;
          break;

        case "Space":
          if (this.canJump) {
            this.playerVelocity.y = 5;
            this.canJump = false;
          }
          break;
      }
    });

    document.addEventListener("keyup", (event) => {
      switch (event.code) {
        case "ArrowUp":
        case "KeyW":
          this.moveForward = false;
          break;

        case "ArrowLeft":
        case "KeyA":
          this.moveLeft = false;
          break;

        case "ArrowDown":
        case "KeyS":
          this.moveBackward = false;
          break;

        case "ArrowRight":
        case "KeyD":
          this.moveRight = false;
          break;
      }
    });
  }

  // Generate random maze using depth-first search algorithm
  private generateMaze(width: number, height: number): number[][] {
    // Initialize maze with walls
    const maze: number[][] = Array(height)
      .fill(null)
      .map(() => Array(width).fill(0));

    // Define recursive function to carve paths
    const carve = (x: number, y: number) => {
      // Mark current cell as path
      maze[y][x] = 1;

      // Define direction vectors (up, right, down, left)
      const directions = [
        [0, -2],
        [2, 0],
        [0, 2],
        [-2, 0],
      ];

      // Shuffle directions
      for (let i = directions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [directions[i], directions[j]] = [directions[j], directions[i]];
      }

      // Try each direction
      for (const [dx, dy] of directions) {
        const nx = x + dx;
        const ny = y + dy;

        // Check if next cell is within bounds and not visited
        if (
          nx >= 0 &&
          nx < width &&
          ny >= 0 &&
          ny < height &&
          maze[ny][nx] === 0
        ) {
          // Carve path between current cell and next cell
          maze[y + dy / 2][x + dx / 2] = 1;

          // Recursively carve from next cell
          carve(nx, ny);
        }
      }
    };

    // Start from a random position (must be odd coordinates)
    const startX = Math.floor(Math.random() * Math.floor(width / 2)) * 2 + 1;
    const startY = Math.floor(Math.random() * Math.floor(height / 2)) * 2 + 1;

    carve(startX, startY);

    // Create entrance and exit
    maze[0][1] = 1; // Entrance at top
    maze[height - 1][width - 2] = 1; // Exit at bottom

    // Add some random loops for more interesting paths
    for (let i = 0; i < (width * height) / 20; i++) {
      const x = Math.floor(Math.random() * (width - 2)) + 1;
      const y = Math.floor(Math.random() * (height - 2)) + 1;
      if (x % 2 === 0 || y % 2 === 0) {
        // Only add loops at wall positions
        maze[y][x] = 1;
      }
    }

    return maze;
  }

  // Initialize the Echo Realm features for a level
  public initializeEchoRealm(level: LevelDefinition): void {
    console.log("Initializing Echo Realm TPV for level:", level.name);
    this.currentLevel = level;
    this.echoRealm.reset();
    this.clearEffects();

    // Generate maze
    this.maze = this.generateMaze(this.mazeSize, this.mazeSize);

    // Position player at the entrance
    const entranceX = 1 * this.cellSize;
    const entranceZ = 0;

    this.player.position.set(entranceX, 0.5, entranceZ);
    this.player.gridPosition = { x: 1, z: 0 };
    this.playerMesh.position.copy(this.player.position);

    // Reset player velocity
    this.playerVelocity.set(0, 0, 0);

    // Position camera for third-person view
    this.positionCamera();

    // Create the maze geometry
    this.createMazeGeometry();

    // Add realm-specific environment effects
    this.setupEnvironment(level);

    // Add floating mirror fragments
    if (level.realmProperties?.hasMirrors) {
      this.createMirrorFragments();
    }

    // Load and play ambient music
    this.setupAudio();

    // Reset tracking variables
    this.pastPlayerPositions = [];
    this.ghostTrails = [];
    this.frameCount = 0;
  }

  // Position the camera for third-person view
  private positionCamera(): void {
    // Set camera position behind and above the player
    const offset = new THREE.Vector3(-5, 5, -5); // Behind and above
    this.camera.position.copy(this.player.position).add(offset);

    // Look at the player
    this.camera.lookAt(this.player.position);

    // Update controls target
    if (this.controls) {
      this.controls.target.copy(this.player.position);
      this.controls.update();
    }
  }

  // Create maze geometry based on the generated maze
  private createMazeGeometry(): void {
    // Group for all maze elements
    const mazeGroup = new THREE.Group();
    this.scene.add(mazeGroup);

    // Create floor
    const floorGeometry = new THREE.PlaneGeometry(
      this.mazeSize * this.cellSize,
      this.mazeSize * this.cellSize
    );
    const floorMaterial = this.glitchShaderMaterial.clone();
    floorMaterial.uniforms.color.value = new THREE.Color(0x220033);
    floorMaterial.uniforms.opacity.value = 0.7;

    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2; // Lay flat
    floor.position.y = -0.01; // Slightly below walls
    floor.receiveShadow = true;
    mazeGroup.add(floor);

    // Create walls based on maze
    for (let z = 0; z < this.mazeSize; z++) {
      for (let x = 0; x < this.mazeSize; x++) {
        if (this.maze[z][x] === 0) {
          // Wall
          const wallGeometry = new THREE.BoxGeometry(
            this.cellSize,
            this.wallHeight,
            this.cellSize
          );

          // Use glitch shader material
          const wallMaterial = this.glitchShaderMaterial.clone();
          wallMaterial.uniforms.color.value = new THREE.Color(0x3b0764);
          wallMaterial.uniforms.opacity.value = 0.6;

          const wall = new THREE.Mesh(wallGeometry, wallMaterial);
          const posX = x * this.cellSize;
          const posZ = z * this.cellSize;
          wall.position.set(posX, this.wallHeight / 2, posZ);

          wall.castShadow = true;
          wall.receiveShadow = true;

          // Store wall in hidden tiles map
          const key = `${x}_${z}`;
          this.hiddenTiles.set(key, wall);

          // Don't add to scene yet, will be added based on visibility
        }

        // Add reflective panels at various locations
        if (this.maze[z][x] === 1 && Math.random() < 0.1) {
          this.addReflectivePanel(
            x * this.cellSize,
            z * this.cellSize,
            mazeGroup
          );
        }
      }
    }

    // Add goal/exit marker
    const exitX = (this.mazeSize - 2) * this.cellSize;
    const exitZ = (this.mazeSize - 1) * this.cellSize;

    const goalGeometry = new THREE.BoxGeometry(
      this.cellSize,
      0.2,
      this.cellSize
    );
    const goalMaterial = new THREE.MeshStandardMaterial({
      color: 0xec4899,
      emissive: 0xec4899,
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2,
    });

    const goal = new THREE.Mesh(goalGeometry, goalMaterial);
    goal.position.set(exitX, 0, exitZ);
    mazeGroup.add(goal);

    // Add portal effect at goal
    const portalGeometry = new THREE.TorusGeometry(
      this.cellSize / 3,
      0.05,
      16,
      32
    );
    const portalMaterial = new THREE.MeshStandardMaterial({
      color: 0xec4899,
      emissive: 0xec4899,
      emissiveIntensity: 0.8,
      metalness: 0.9,
      roughness: 0.1,
      side: THREE.DoubleSide,
    });

    const portal = new THREE.Mesh(portalGeometry, portalMaterial);
    portal.position.set(exitX, 1, exitZ);
    portal.rotation.x = Math.PI / 2;
    mazeGroup.add(portal);

    // Animate portal
    const animate = () => {
      requestAnimationFrame(animate);
      const time = Date.now() * 0.001;
      portal.rotation.z = time;
      portal.position.y = 1 + Math.sin(time * 2) * 0.1;
    };
    animate();

    // Add light to the portal
    const light = new THREE.PointLight(0xec4899, 1, 5);
    light.position.set(exitX, 1.5, exitZ);
    mazeGroup.add(light);
  }

  // Add reflective panel (part of the mirror maze)
  private addReflectivePanel(
    x: number,
    z: number,
    parent: THREE.Object3D
  ): void {
    // Random orientation
    const vertical = Math.random() > 0.5;

    // Panel size
    const width = vertical ? this.cellSize / 4 : this.cellSize;
    const height = this.wallHeight * 0.8;
    const depth = vertical ? this.cellSize : this.cellSize / 4;

    // Create panel
    const panelGeometry = new THREE.BoxGeometry(width, height, depth);
    const panelMaterial = this.reflectionShaderMaterial
      ? this.reflectionShaderMaterial.clone()
      : new THREE.MeshStandardMaterial({
          color: 0xaaaaff,
          transparent: true,
          opacity: 0.7,
        });

    const panel = new THREE.Mesh(panelGeometry, panelMaterial);
    panel.position.set(
      x + (vertical ? 0 : (Math.random() - 0.5) * this.cellSize * 0.5),
      height / 2,
      z + (vertical ? (Math.random() - 0.5) * this.cellSize * 0.5 : 0)
    );

    // Random slight rotation
    panel.rotation.y = (Math.random() - 0.5) * Math.PI * 0.25;

    // Add to scene
    parent.add(panel);

    // Add to reflective surfaces
    this.mirrorObjects.push(panel);

    // Make it slowly float up and down
    const startY = panel.position.y;
    const floatAmplitude = 0.1 + Math.random() * 0.2;
    const floatSpeed = 0.5 + Math.random() * 1;
    const startTime = Math.random() * Math.PI * 2; // Random phase

    // Animate floating motion
    const animate = () => {
      requestAnimationFrame(animate);
      const time = Date.now() * 0.001;
      panel.position.y =
        startY + Math.sin(time * floatSpeed + startTime) * floatAmplitude;

      // Update shader time uniform
      if ((panelMaterial as THREE.ShaderMaterial).uniforms?.time) {
        (panelMaterial as THREE.ShaderMaterial).uniforms.time.value = time;
      }
    };

    animate();
  }

  // Set up environment effects for the Echo Realm
  private setupEnvironment(level: LevelDefinition): void {
    if (!level.realmProperties) return;

    // Add fog
    this.scene.fog = new THREE.FogExp2(
      level.realmProperties.environment.fogColor || 0x8080ff,
      0.05 // Denser fog
    );

    // Adjust lighting
    const ambientLight = new THREE.AmbientLight(
      level.realmProperties.environment.ambientLightColor || 0x444466,
      0.8
    );
    this.scene.add(ambientLight);

    // Add ethereal point lights
    for (let i = 0; i < 5; i++) {
      const light = new THREE.PointLight(0xaaaaff, 0.8, 15);
      light.position.set(
        (Math.random() - 0.5) * this.mazeSize * this.cellSize,
        3 + Math.random() * 5,
        (Math.random() - 0.5) * this.mazeSize * this.cellSize
      );
      this.scene.add(light);

      // Animate light
      const animate = () => {
        const time = Date.now() * 0.001;
        light.position.y = 3 + Math.sin(time * 0.5 + i) * 2;
        light.intensity = 0.5 + Math.sin(time * 0.3) * 0.3;
        requestAnimationFrame(animate);
      };

      animate();
    }
  }

  // Set up audio for the level
  private setupAudio(): void {
    // Create audio listener if not already present
    if (!this.audioListener) {
      this.audioListener = new THREE.AudioListener();
      this.camera.add(this.audioListener);
    }

    // Load ambient music
    const audioLoader = new THREE.AudioLoader();

    // Create ambient music
    this.ambientMusic = new THREE.Audio(this.audioListener);
    audioLoader.load("/sounds/ambient_echo.mp3", (buffer) => {
      if (this.ambientMusic) {
        this.ambientMusic.setBuffer(buffer);
        this.ambientMusic.setLoop(true);
        this.ambientMusic.setVolume(0.5);
        this.ambientMusic.play();
      }
    });

    // Load footstep sound
    this.footstepSound = new THREE.Audio(this.audioListener);
    audioLoader.load("/sounds/footstep_echo.mp3", (buffer) => {
      if (this.footstepSound) {
        this.footstepSound.setBuffer(buffer);
        this.footstepSound.setVolume(0.3);
      }
    });

    // Load echo sound
    this.echoSound = new THREE.Audio(this.audioListener);
    audioLoader.load("/sounds/echo.mp3", (buffer) => {
      if (this.echoSound) {
        this.echoSound.setBuffer(buffer);
        this.echoSound.setVolume(0.2);
      }
    });
  }

  // Create floating mirror fragments
  private createMirrorFragments(): void {
    const fragmentCount = 30;

    for (let i = 0; i < fragmentCount; i++) {
      // Create random mirror fragment
      const size = 0.5 + Math.random() * 1.5;
      let geometry;

      // Different fragment shapes
      const shapeType = Math.floor(Math.random() * 3);
      switch (shapeType) {
        case 0:
          geometry = new THREE.PlaneGeometry(size, size);
          break;
        case 1:
          geometry = new THREE.CircleGeometry(size / 2, 5);
          break;
        case 2:
          const points = [];
          for (let j = 0; j < 5; j++) {
            const angle = (j / 5) * Math.PI * 2;
            const radius = (size / 2) * (0.7 + Math.random() * 0.3);
            points.push(
              new THREE.Vector2(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius
              )
            );
          }
          geometry = new THREE.ShapeGeometry(new THREE.Shape(points));
          break;
      }

      // Use reflection shader or material
      const material =
        Math.random() > 0.5 && this.reflectionShaderMaterial
          ? this.reflectionShaderMaterial.clone()
          : this.reflectiveMaterial.clone();

      const mirror = new THREE.Mesh(geometry, material);

      // Position randomly throughout the maze
      const x = Math.random() * this.mazeSize * this.cellSize;
      const z = Math.random() * this.mazeSize * this.cellSize;
      const y = 1 + Math.random() * 3;

      mirror.position.set(x, y, z);

      // Random rotation
      mirror.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );

      this.scene.add(mirror);
      this.mirrorObjects.push(mirror);

      // Make it float and rotate
      const startPos = mirror.position.clone();
      const rotateSpeed = Math.random() * 0.5;
      const floatSpeed = 0.2 + Math.random() * 0.3;
      const floatAmount = 0.3 + Math.random() * 0.5;

      // Animation loop
      const animate = () => {
        requestAnimationFrame(animate);
        const time = Date.now() * 0.001;

        // Gentle floating motion
        mirror.position.y =
          startPos.y + Math.sin(time * floatSpeed) * floatAmount;

        // Slow rotation
        mirror.rotation.x += 0.002 * rotateSpeed;
        mirror.rotation.y += 0.003 * rotateSpeed;

        // Update shader time if using shader material
        if ((mirror.material as THREE.ShaderMaterial).uniforms?.time) {
          (mirror.material as THREE.ShaderMaterial).uniforms.time.value = time;
        }

        // Subtle opacity pulse if using standard material
        if (
          mirror.material instanceof THREE.MeshStandardMaterial &&
          mirror.material.opacity
        ) {
          mirror.material.opacity = 0.4 + Math.sin(time * 0.3) * 0.1;
        }
      };

      animate();
    }
  }

  // Register that the player has stepped on a tile
  public registerPlayerStep(x: number, z: number): void {
    this.echoRealm.registerTileStep(x, z);

    // Play echo sound
    this.playEchoSound();
  }

  // Play echo sound effect
  private playEchoSound(): void {
    if (this.echoSound && !this.echoSound.isPlaying && Math.random() > 0.7) {
      // Create delay effect by offsetting playback start
      setTimeout(() => {
        if (this.echoSound) {
          this.echoSound.play();
        }
      }, 300 + Math.random() * 500);
    }
  }

  // Update Echo Realm effects
  public update(currentTime: number, delta: number): void {
    if (!this.currentLevel || !this.currentLevel.realmProperties) return;

    // Update shader time uniforms globally for all materials
    this.updateShaderTimeUniforms(currentTime);

    // Only update certain effects at intervals for performance
    if (currentTime - this.lastUpdateTime > 100) {
      this.lastUpdateTime = currentTime;

      // Update fading tiles
      const fadingTiles = this.echoRealm.updateFadingTiles(
        currentTime,
        this.currentLevel.realmProperties
      );
      this.updateFadingTileEffects(fadingTiles, currentTime);

      // Update mirror fragments
      this.updateMirrorFragments(currentTime);

      // Create echo trails
      if (this.currentLevel.realmProperties.hasEchoes) {
        this.updateEchoTrails(currentTime);
      }

      // Add distortion effects if needed
      if (this.currentLevel.realmProperties.hasResonanceDisruption) {
        this.updateResonanceDisruption(currentTime);
      }

      // Update visibility of maze elements based on player position
      this.updateVisibility();
    }

    // Update player position and movement (every frame)
    this.updatePlayer(delta);

    // Update ghost trails
    this.updateGhostTrails(currentTime);

    // Update frame counter
    this.frameCount++;
  }

  // Update all shader materials' time uniforms
  private updateShaderTimeUniforms(currentTime: number): void {
    const time = currentTime * 0.001;

    // Update reflection shader
    if (this.reflectionShaderMaterial?.uniforms?.time) {
      this.reflectionShaderMaterial.uniforms.time.value = time;
    }

    // Update glitch shader
    if (this.glitchShaderMaterial.uniforms?.time) {
      this.glitchShaderMaterial.uniforms.time.value = time;
    }

    // Update all mirror objects if they use shader materials
    this.mirrorObjects.forEach((mirror) => {
      if ((mirror.material as THREE.ShaderMaterial).uniforms?.time) {
        (mirror.material as THREE.ShaderMaterial).uniforms.time.value = time;
      }
    });
  }

  // Update player position and movement - Fixed version
  private updatePlayer(delta: number): void {
    if (!this.camera || !this.playerMesh) return;

    // Store previous position for comparison
    if (this.player && this.player.position && this.previousPlayerPosition) {
      this.previousPlayerPosition.copy(this.player.position);
    }

    // Calculate movement direction based on camera orientation
    const cameraDirection = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0; // Keep movement horizontal
    cameraDirection.normalize();

    // Calculate camera right vector
    const cameraRight = new THREE.Vector3(
      -cameraDirection.z,
      0,
      cameraDirection.x
    );

    // Reset velocity
    const velocity = this.playerVelocity;
    if (!velocity) return;

    velocity.x = 0;
    velocity.z = 0;

    // Movement speed
    const speed = 0.05 * delta;

    // Apply movement based on input
    if (this.moveForward) {
      velocity.add(cameraDirection.clone().multiplyScalar(speed));
    }
    if (this.moveBackward) {
      velocity.add(cameraDirection.clone().multiplyScalar(-speed));
    }
    if (this.moveLeft) {
      velocity.add(cameraRight.clone().multiplyScalar(-speed));
    }
    if (this.moveRight) {
      velocity.add(cameraRight.clone().multiplyScalar(speed));
    }

    // Apply velocity to position
    if (
      (velocity.x !== 0 || velocity.z !== 0) &&
      this.player &&
      this.player.position
    ) {
      // Calculate new position
      const newPosition = this.player.position.clone();
      newPosition.add(velocity);

      // Check for collision with walls
      if (this.isValidPosition(newPosition)) {
        this.player.position.copy(newPosition);

        // Update player's grid position
        const gridPos = this.worldToGrid(this.player.position);
        if (gridPos) {
          this.player.gridPosition = gridPos;
        }

        // Update player mesh position
        this.playerMesh.position.copy(this.player.position);

        // Play footstep sound
        this.playFootstepSound();

        // Register step on grid
        if (this.player.gridPosition) {
          this.registerPlayerStep(
            this.player.gridPosition.x,
            this.player.gridPosition.z
          );
        }

        // Store position for ghost trail
        if (this.frameCount % this.echoInterval === 0) {
          // Make sure we have a valid position before storing it
          if (
            this.player.position.x !== undefined &&
            this.player.position.y !== undefined &&
            this.player.position.z !== undefined
          ) {
            this.pastPlayerPositions.push(this.player.position.clone());

            // Limit the array size
            if (this.pastPlayerPositions.length > this.maxPastPositions) {
              this.pastPlayerPositions.shift();
            }

            // Create ghost trail at intervals
            if (this.frameCount % (this.echoInterval * 3) === 0) {
              this.createGhostTrail();
            }
          }
        }
      }
    }

    // Update camera position to follow player
    this.updateCameraPosition();
  }

  // Play footstep sound with echo effect
  private playFootstepSound(): void {
    if (
      this.footstepSound &&
      !this.footstepSound.isPlaying &&
      (this.moveForward || this.moveBackward || this.moveLeft || this.moveRight)
    ) {
      this.footstepSound.play();

      // Create echo effect by playing the sound again with delay and lower volume
      setTimeout(() => {
        if (this.footstepSound) {
          const volume = this.footstepSound.getVolume();
          this.footstepSound.setVolume(volume * 0.5);
          this.footstepSound.play();

          // Reset volume after echo
          setTimeout(() => {
            if (this.footstepSound) {
              this.footstepSound.setVolume(volume);
            }
          }, 300);
        }
      }, 200);
    }
  }

  // Check if position is valid (not inside a wall) - Fixed version
  private isValidPosition(position: THREE.Vector3): boolean {
    // Check if position is valid
    if (!position || position.x === undefined || position.z === undefined) {
      return false;
    }

    // Convert to grid coordinates
    const gridPos = this.worldToGrid(position);
    if (!gridPos) return false;

    // Check if within maze bounds
    if (
      gridPos.x < 0 ||
      gridPos.x >= this.mazeSize ||
      gridPos.z < 0 ||
      gridPos.z >= this.mazeSize
    ) {
      return false;
    }

    // Check if the maze is initialized
    if (!this.maze || !this.maze[gridPos.z]) {
      return false;
    }

    // Check if position is a wall
    return this.maze[gridPos.z][gridPos.x] === 1;
  }

  // Update camera to follow player - Fixed version
  private updateCameraPosition(): void {
    if (!this.camera || !this.controls || !this.player || !this.player.position)
      return;

    // Validate player position
    if (
      typeof this.player.position.x !== "number" ||
      typeof this.player.position.y !== "number" ||
      typeof this.player.position.z !== "number"
    ) {
      return;
    }

    // Smooth following with damping
    const targetPosition = new THREE.Vector3();

    // Position camera behind and above the player
    const offset = new THREE.Vector3(-5, 5, -5);
    targetPosition.copy(this.player.position).add(offset);

    // Smooth transition - use lerp only if camera position is valid
    if (
      typeof this.camera.position.x === "number" &&
      typeof this.camera.position.y === "number" &&
      typeof this.camera.position.z === "number"
    ) {
      this.camera.position.lerp(targetPosition, 0.05);
    } else {
      // If camera position is invalid, just set it directly
      this.camera.position.copy(targetPosition);
    }

    // Look at the player
    this.controls.target.copy(this.player.position);
    this.controls.update();
  }

  // Create a ghost trail of the player
  private createGhostTrail(): void {
    // Clone the player mesh
    const ghostGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const ghostMaterial = new THREE.MeshStandardMaterial({
      color: 0xec4899,
      emissive: 0xec4899,
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.5,
    });

    const ghost = new THREE.Mesh(ghostGeometry, ghostMaterial);
    ghost.position.copy(this.player.position);

    // Store current time with ghost for animation
    ghost.userData = {
      createTime: Date.now(),
      duration: 5000, // 5 seconds lifetime
    };

    this.scene.add(ghost);
    this.ghostTrails.push(ghost);
  }

  // Update ghost trails - Fixed version
  private updateGhostTrails(currentTime: number): void {
    // Update existing ghost trails
    const ghostsToRemove: THREE.Mesh[] = [];

    this.ghostTrails.forEach((ghost) => {
      const elapsed = currentTime - ghost.userData.createTime;
      const progress = Math.min(elapsed / ghost.userData.duration, 1);

      // Fade out ghost
      if (ghost.material instanceof THREE.Material) {
        ghost.material.opacity = 0.5 * (1 - progress);
      }

      // Move ghost along a path of past positions
      if (this.pastPlayerPositions.length > 0) {
        const index = Math.floor(progress * this.pastPlayerPositions.length);
        if (index < this.pastPlayerPositions.length) {
          const pastPosition = this.pastPlayerPositions[index];
          // Verify that the past position is valid before using lerp
          if (
            pastPosition &&
            typeof pastPosition.x === "number" &&
            typeof pastPosition.y === "number" &&
            typeof pastPosition.z === "number"
          ) {
            ghost.position.lerp(pastPosition, 0.1);
          }
        }
      }

      // Mark for removal if expired
      if (progress >= 1) {
        ghostsToRemove.push(ghost);
      }
    });

    // Remove expired ghosts
    ghostsToRemove.forEach((ghost) => {
      this.scene.remove(ghost);
      if (ghost.geometry) ghost.geometry.dispose();
      if (ghost.material instanceof THREE.Material) ghost.material.dispose();

      const index = this.ghostTrails.indexOf(ghost);
      if (index >= 0) {
        this.ghostTrails.splice(index, 1);
      }
    });
  }

  // Update visibility of maze elements based on player position
  private updateVisibility(): void {
    const playerGrid = this.worldToGrid(this.player.position);
    
    // If playerGrid is null, we can't update visibility
    if (!playerGrid) return;

    // Reset visible tiles set
    this.visibleTiles.clear();

    // Mark tiles as visible based on distance from player
    for (let z = 0; z < this.mazeSize; z++) {
      for (let x = 0; x < this.mazeSize; x++) {
        const distX = Math.abs(x - playerGrid.x);
        const distZ = Math.abs(z - playerGrid.z);
        const dist = Math.sqrt(distX * distX + distZ * distZ);

        if (dist <= this.visibilityRadius) {
          const key = `${x}_${z}`;
          this.visibleTiles.add(key);

          // Add tile to scene if it's not already there
          if (this.hiddenTiles.has(key)) {
            const tile = this.hiddenTiles.get(key)!;

            // Only add to scene if not already added
            if (!tile.parent) {
              this.scene.add(tile);
            }

            // Set opacity based on distance
            if (tile instanceof THREE.Mesh) {
              const material = tile.material;

              if (
                material instanceof THREE.ShaderMaterial &&
                material.uniforms.opacity
              ) {
                const fadeAmount = 1 - dist / this.fadingDistance;
                material.uniforms.opacity.value = Math.max(
                  0.1,
                  Math.min(0.7, fadeAmount)
                );
              } else if (material instanceof THREE.Material) {
                const fadeAmount = 1 - dist / this.fadingDistance;
                material.opacity = Math.max(0.1, Math.min(0.7, fadeAmount));
              }
            }
          }
        } else {
          // Remove tiles that are too far
          const key = `${x}_${z}`;
          if (this.hiddenTiles.has(key)) {
            const tile = this.hiddenTiles.get(key)!;

            // Only remove if it's in the scene
            if (tile.parent) {
              this.scene.remove(tile);
            }
          }
        }
      }
    }
  }

  // Update the visual effects for fading tiles
  private updateFadingTileEffects(
    fadingTiles: EchoTile[],
    currentTime: number
  ): void {
    const time = currentTime * 0.001;

    fadingTiles.forEach((tile) => {
      const tileKey = `${tile.x}_${tile.z}`;

      // If the tile has just become invisible, create a ripple effect
      if (!tile.isVisible && !this.rippleEffects.has(tileKey)) {
        this.createRippleEffect(tile.x, tile.z);
      }

      // Update existing fading tile effect
      if (this.fadingTiles.has(tileKey)) {
        const fadeMesh = this.fadingTiles.get(tileKey)!;

        // Calculate fade progress
        const elapsed = currentTime - tile.stepTime;
        const fadeProgress = Math.min(
          1,
          Math.max(0, (elapsed - tile.fadeDelay * 0.7) / (tile.fadeDelay * 0.3))
        );

        // Adjust opacity
        if (fadeMesh.material instanceof THREE.Material) {
          fadeMesh.material.opacity = 1 - fadeProgress;

          // Distortion effect
          if (fadeMesh.scale) {
            const distortAmount = 0.1 * fadeProgress;
            fadeMesh.scale.set(
              1 + distortAmount * Math.sin(time * 5),
              1,
              1 + distortAmount * Math.cos(time * 5)
            );
          }

          // Remove when fully faded
          if (fadeProgress >= 1) {
            this.scene.remove(fadeMesh);
            this.fadingTiles.delete(tileKey);
          }
        }
      }

      // Update ripple effects
      if (this.rippleEffects.has(tileKey)) {
        const ripple = this.rippleEffects.get(tileKey)!;

        // Calculate ripple progress
        const elapsed = currentTime - tile.stepTime - tile.fadeDelay;
        const rippleProgress = Math.min(1, Math.max(0, elapsed / 2000)); // 2 seconds ripple effect

        // Expand and fade the ripple
        ripple.scale.set(1 + rippleProgress * 2, 1, 1 + rippleProgress * 2);

        if (ripple.material instanceof THREE.Material) {
          ripple.material.opacity = 0.7 * (1 - rippleProgress);

          // Remove when fully expanded
          if (rippleProgress >= 1) {
            this.scene.remove(ripple);
            this.rippleEffects.delete(tileKey);
          }
        }
      }
    });
  }

  // Create ripple effect when a tile vanishes
  private createRippleEffect(x: number, z: number): void {
    const tileKey = `${x}_${z}`;

    // Calculate position in world coordinates
    const gridPos = this.mazeSize / 2;
    const posX = (x - gridPos) * this.cellSize;
    const posZ = (z - gridPos) * this.cellSize;

    // Create ripple mesh
    const rippleGeometry = new THREE.CircleGeometry(this.cellSize / 2, 32);
    const rippleMaterial = new THREE.MeshBasicMaterial({
      color: 0xaaddff,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    });

    const ripple = new THREE.Mesh(rippleGeometry, rippleMaterial);
    ripple.position.set(posX, 0.05, posZ);
    ripple.rotation.x = -Math.PI / 2; // Lay flat

    this.scene.add(ripple);
    this.rippleEffects.set(tileKey, ripple);
  }

  // Update mirror fragments animation
  private updateMirrorFragments(currentTime: number): void {
    const time = currentTime * 0.001;

    this.mirrorObjects.forEach((mirror, index) => {
      // Already handled in their individual animation loops

      // Update shader time uniforms
      if ((mirror.material as THREE.ShaderMaterial).uniforms?.time) {
        (mirror.material as THREE.ShaderMaterial).uniforms.time.value = time;
      }
    });
  }

  // Update echo trails
  private updateEchoTrails(currentTime: number): void {
    // Create and update echo trails that follow the player's path
    // These are particle effects that trace where the player has been
    const steppedTiles = this.echoRealm.getSteppedTiles();

    steppedTiles.forEach((tile) => {
      const tileKey = `${tile.x}_${tile.z}`;

      // Create echo trail if it doesn't exist
      if (!this.echoTrails.has(tileKey) && tile.isVisible) {
        this.createEchoTrail(tile.x, tile.z);
      }

      // Update existing echo trails
      if (this.echoTrails.has(tileKey)) {
        const trail = this.echoTrails.get(tileKey)!;

        // Calculate trail age
        const elapsed = currentTime - tile.stepTime;
        const trailAge = Math.min(
          1,
          Math.max(0, elapsed / (tile.fadeDelay * 1.2))
        );

        // Fade trail based on age
        if (trail.material instanceof THREE.PointsMaterial) {
          trail.material.opacity = 0.6 * (1 - trailAge);

          // Animate trail particles
          const positions = (
            trail.geometry as THREE.BufferGeometry
          ).getAttribute("position");
          const count = positions.count;

          for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            const y = positions.getY(i);
            positions.setY(
              i,
              y + Math.sin(currentTime * 0.001 * 2 + i * 0.1) * 0.002
            );
          }

          positions.needsUpdate = true;

          // Remove when faded
          if (trailAge >= 1 || !tile.isVisible) {
            this.scene.remove(trail);
            this.echoTrails.delete(tileKey);
          }
        }
      }
    });
  }

  // Create echo trail for a tile
  private createEchoTrail(x: number, z: number): void {
    const tileKey = `${x}_${z}`;

    // Calculate position in world coordinates
    const gridPos = this.mazeSize / 2;
    const posX = (x - gridPos) * this.cellSize;
    const posZ = (z - gridPos) * this.cellSize;

    // Create particle system for trail
    const particleCount = 20;
    const trailGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    // Set positions and colors
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Random position within the tile
      positions[i3] = posX + (Math.random() - 0.5) * this.cellSize * 0.8;
      positions[i3 + 1] = 0.1 + Math.random() * 0.3; // Slightly above the floor
      positions[i3 + 2] = posZ + (Math.random() - 0.5) * this.cellSize * 0.8;

      // Blue-purple color
      colors[i3] = 0.7 + Math.random() * 0.3; // R
      colors[i3 + 1] = 0.7 + Math.random() * 0.3; // G
      colors[i3 + 2] = 1.0; // B
    }

    trailGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );
    trailGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    // Create point cloud
    const trailMaterial = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });

    const trail = new THREE.Points(trailGeometry, trailMaterial);
    this.scene.add(trail);
    this.echoTrails.set(tileKey, trail);
  }

  // Update resonance disruption effect
  private updateResonanceDisruption(currentTime: number): void {
    const time = currentTime * 0.001;

    // Create random distortion waves that move through the environment
    if (Math.random() < 0.01) {
      // Occasionally create a new disruption
      const disruptionCenter = new THREE.Vector3(
        (Math.random() - 0.5) * this.mazeSize * this.cellSize,
        0,
        (Math.random() - 0.5) * this.mazeSize * this.cellSize
      );

      // Visual distortion effect
      const disruptionGeometry = new THREE.RingGeometry(0.5, 0.8, 32);
      const disruptionMaterial = new THREE.MeshBasicMaterial({
        color: 0xff00ff,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
      });

      const disruption = new THREE.Mesh(disruptionGeometry, disruptionMaterial);
      disruption.position.copy(disruptionCenter);
      disruption.position.y = 0.1;
      disruption.rotation.x = -Math.PI / 2; // Lay flat

      this.scene.add(disruption);

      // Animate and remove
      const startTime = currentTime;
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const scale = 1 + elapsed * 0.002;

        disruption.scale.set(scale, scale, 1);

        if (disruptionMaterial.opacity > 0.05) {
          disruptionMaterial.opacity = 0.3 - elapsed * 0.0003;
          requestAnimationFrame(animate);
        } else {
          this.scene.remove(disruption);
          disruptionMaterial.dispose();
          disruptionGeometry.dispose();
        }
      };

      animate();
    }
  }

  // Convert world position to grid position - Fixed version
  private worldToGrid(
    position: THREE.Vector3
  ): { x: number; z: number } | null {
    // Check if position is valid
    if (!position || position.x === undefined || position.z === undefined) {
      return null;
    }

    // Check if cellSize is valid to avoid division by zero
    if (!this.cellSize || this.cellSize === 0) {
      return null;
    }

    // Convert from world coordinates to grid indices
    const x = Math.floor(position.x / this.cellSize + this.mazeSize / 2);
    const z = Math.floor(position.z / this.cellSize + this.mazeSize / 2);

    return { x, z };
  }

  // Clear all effects
  private clearEffects(): void {
    // Clear fading tiles
    this.fadingTiles.forEach((mesh) => {
      this.scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material instanceof THREE.Material) mesh.material.dispose();
    });
    this.fadingTiles.clear();

    // Clear ripple effects
    this.rippleEffects.forEach((mesh) => {
      this.scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material instanceof THREE.Material) mesh.material.dispose();
    });
    this.rippleEffects.clear();

    // Clear echo trails
    this.echoTrails.forEach((points) => {
      this.scene.remove(points);
      if (points.geometry) points.geometry.dispose();
      if (points.material instanceof THREE.Material) points.material.dispose();
    });
    this.echoTrails.clear();

    // Clear mirror objects
    this.mirrorObjects.forEach((mirror) => {
      this.scene.remove(mirror);
      if (mirror.geometry) mirror.geometry.dispose();
      if (mirror.material instanceof THREE.Material) mirror.material.dispose();
    });
    this.mirrorObjects = [];

    // Clear ghost trails
    this.ghostTrails.forEach((ghost) => {
      this.scene.remove(ghost);
      if (ghost.geometry) ghost.geometry.dispose();
      if (ghost.material instanceof THREE.Material) ghost.material.dispose();
    });
    this.ghostTrails = [];

    // Clear all hidden tiles
    this.hiddenTiles.forEach((tile) => {
      if (tile.parent) {
        this.scene.remove(tile);
      }

      if (tile instanceof THREE.Mesh) {
        if (tile.geometry) tile.geometry.dispose();
        if (tile.material instanceof THREE.Material) tile.material.dispose();
      }
    });
    this.hiddenTiles.clear();

    // Clear fog
    this.scene.fog = null;
  }

  // Dispose resources
  public dispose(): void {
    this.clearEffects();

    // Remove player mesh
    if (this.playerMesh) {
      this.scene.remove(this.playerMesh);
      if (this.playerMesh.geometry) this.playerMesh.geometry.dispose();
      if (this.playerMesh.material instanceof THREE.Material)
        this.playerMesh.material.dispose();
    }

    // Stop and remove audio
    if (this.ambientMusic) {
      this.ambientMusic.stop();
      this.ambientMusic.disconnect();
    }

    if (this.footstepSound) {
      this.footstepSound.stop();
      this.footstepSound.disconnect();
    }

    if (this.echoSound) {
      this.echoSound.stop();
      this.echoSound.disconnect();
    }

    // Remove the audio listener
    if (this.audioListener) {
      this.camera.remove(this.audioListener);
    }

    // Dispose shader materials
    if (this.reflectionShaderMaterial) {
      this.reflectionShaderMaterial.dispose();
    }

    if (this.glitchShaderMaterial) {
      this.glitchShaderMaterial.dispose();
    }

    // Dispose reflective material
    if (this.reflectiveMaterial) {
      this.reflectiveMaterial.dispose();
    }
  }
}
