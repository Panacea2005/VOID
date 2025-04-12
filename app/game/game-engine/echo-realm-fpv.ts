// echo-realm-fpv.ts
import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { LevelDefinition, EnemyType, PowerUpType, TileType, PlayerState } from '../types/game-types';
import { ParticleSystem } from './particle-system';
import { EchoRealm, EchoTile } from './echo-realm';

export class EchoRealmFPV {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: PointerLockControls;
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
  private playerBody: THREE.Mesh;
  private playerVelocity: THREE.Vector3 = new THREE.Vector3();
  private playerDirection: THREE.Vector3 = new THREE.Vector3();
  private moveForward: boolean = false;
  private moveBackward: boolean = false;
  private moveLeft: boolean = false;
  private moveRight: boolean = false;
  private canJump: boolean = false;
  private previousPlayerPosition: THREE.Vector3 = new THREE.Vector3();
  private audioListener: THREE.AudioListener;
  private echoes: Map<string, THREE.PositionalAudio> = new Map();
  private memoryFragments: THREE.Mesh[] = [];
  private reflectionPuzzles: THREE.Group[] = [];
  private temporalDistortions: Map<string, THREE.Object3D> = new Map();
  private memorySequence: number[] = [];
  private playerMemorySequence: number[] = [];
  private reflectionPuzzleState: boolean[] = [];
  private temporalZones: THREE.Mesh[] = [];
  private inTemporalZone: boolean = false;
  private temporalZoneSpeed: number = 1;
  private echoSounds: {[key: string]: AudioBuffer} = {};
  private containerElement: HTMLElement | null = null;
  private playerHeight: number = 1.8;
  private pastPlayerPositions: THREE.Vector3[] = []; // Store past positions for echo effect
  private maxPastPositions: number = 30; // Maximum number of past positions to store
  private echoInterval: number = 15; // How often to create echo visual (in frames)
  private frameCount: number = 0;
  private lockControls: boolean = false;
  private isInReflectionPuzzle: boolean = false;
  private isInMemoryChallenge: boolean = false;
  private isInTemporalDistortion: boolean = false;
  private reflectionSurfaces: THREE.Mesh[] = [];
  private fogColor: THREE.Color = new THREE.Color(0x8080ff);
  private memoryFragmentHitSound: THREE.Audio | null = null;
  private reflectionSolvedSound: THREE.Audio | null = null;
  private temporalShiftSound: THREE.Audio | null = null;
  private playerEchoSound: THREE.Audio | null = null;
  private reflectionPuzzleHint: THREE.Group | null = null;
  private playerFootsteps: THREE.Audio | null = null;
  private footstepInterval: number = 0;

  constructor(
    scene: THREE.Scene, 
    camera: THREE.PerspectiveCamera, 
    controls: PointerLockControls,
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
      position: new THREE.Vector3(0, this.playerHeight, 0),
      gridPosition: { x: 0, z: 0 },
      isMoving: false,
      health: 3,
      lives: 3,
      powerUps: [],
      keys: 0,
      energy: 0,
      isInvisible: false,
      isShielded: false
    };
    
    // Create reflective material for mirror effects
    this.reflectiveMaterial = new THREE.MeshStandardMaterial({
      color: 0xaaaaff,
      metalness: 0.9,
      roughness: 0.1,
      envMapIntensity: 1.0,
      transparent: true,
      opacity: 0.7
    });
    
    // Add a cube environment map for reflections
    const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(128, {
      generateMipmaps: true,
      minFilter: THREE.LinearMipmapLinearFilter
    });
    const cubeCamera = new THREE.CubeCamera(0.1, 1000, cubeRenderTarget);
    this.scene.add(cubeCamera);
    this.reflectiveMaterial.envMap = cubeRenderTarget.texture;
    
    // Update the cubemap periodically
    const updateCubemap = () => {
      if (!this.currentLevel) return;
      
      cubeCamera.update(THREE.WebGLRenderer.prototype, this.scene);
      requestAnimationFrame(updateCubemap);
    };
    
    updateCubemap();
    
    // Initialize audio system
    this.audioListener = new THREE.AudioListener();
    this.camera.add(this.audioListener);
    
    // Create player physical body (invisible in first person)
    const playerGeometry = new THREE.BoxGeometry(0.8, this.playerHeight, 0.8);
    const playerMaterial = new THREE.MeshStandardMaterial({
      color: 0xec4899, // Pink
      transparent: true,
      opacity: 0.0 // Invisible in first person
    });
    
    this.playerBody = new THREE.Mesh(playerGeometry, playerMaterial);
    this.playerBody.position.set(0, this.playerHeight / 2, 0);
    this.playerBody.castShadow = true;
    this.scene.add(this.playerBody);
    
    // Set up event listeners for player controls
    this.setupEventListeners();
    
    // Load audio
    this.loadAudio();
  }
  
  private loadAudio(): void {
    const audioLoader = new THREE.AudioLoader();
    
    // Load common sounds
    audioLoader.load('/sounds/memory_fragment.mp3', (buffer) => {
      this.memoryFragmentHitSound = new THREE.Audio(this.audioListener);
      this.memoryFragmentHitSound.setBuffer(buffer);
      this.memoryFragmentHitSound.setVolume(0.5);
    });
    
    audioLoader.load('/sounds/reflection_solved.mp3', (buffer) => {
      this.reflectionSolvedSound = new THREE.Audio(this.audioListener);
      this.reflectionSolvedSound.setBuffer(buffer);
      this.reflectionSolvedSound.setVolume(0.6);
    });
    
    audioLoader.load('/sounds/temporal_shift.mp3', (buffer) => {
      this.temporalShiftSound = new THREE.Audio(this.audioListener);
      this.temporalShiftSound.setBuffer(buffer);
      this.temporalShiftSound.setVolume(0.8);
    });
    
    audioLoader.load('/sounds/player_echo.mp3', (buffer) => {
      this.playerEchoSound = new THREE.Audio(this.audioListener);
      this.playerEchoSound.setBuffer(buffer);
      this.playerEchoSound.setVolume(0.4);
    });
    
    audioLoader.load('/sounds/footstep.mp3', (buffer) => {
      this.playerFootsteps = new THREE.Audio(this.audioListener);
      this.playerFootsteps.setBuffer(buffer);
      this.playerFootsteps.setVolume(0.3);
    });
    
    // Load echo sounds
    const echoNames = ['echo1', 'echo2', 'echo3', 'echo4'];
    echoNames.forEach(name => {
      audioLoader.load(`/sounds/${name}.mp3`, (buffer) => {
        this.echoSounds[name] = buffer;
      });
    });
  }
  
  private setupEventListeners(): void {
    document.addEventListener('keydown', (event) => {
      if (this.lockControls) return;
      
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
          this.moveForward = true;
          break;
          
        case 'ArrowLeft':
        case 'KeyA':
          this.moveLeft = true;
          break;
          
        case 'ArrowDown':
        case 'KeyS':
          this.moveBackward = true;
          break;
          
        case 'ArrowRight':
        case 'KeyD':
          this.moveRight = true;
          break;
          
        case 'Space':
          if (this.canJump) {
            this.playerVelocity.y = 10;
            this.canJump = false;
          }
          break;
          
        case 'KeyE':
          // Interact with the environment
          this.interact();
          break;
      }
    });
    
    document.addEventListener('keyup', (event) => {
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
          this.moveForward = false;
          break;
          
        case 'ArrowLeft':
        case 'KeyA':
          this.moveLeft = false;
          break;
          
        case 'ArrowDown':
        case 'KeyS':
          this.moveBackward = false;
          break;
          
        case 'ArrowRight':
        case 'KeyD':
          this.moveRight = false;
          break;
      }
    });
    
    // Click event for memory fragments and reflection puzzles
    if (this.containerElement) {
      this.containerElement.addEventListener('click', () => {
        this.handleClick();
      });
    }
  }
  
  // Handle click events (for memory fragments and reflection puzzles)
  private handleClick(): void {
    if (this.lockControls) return;
    
    // Create raycaster for interaction
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    
    // Check intersections with memory fragments
    const memoryIntersects = raycaster.intersectObjects(this.memoryFragments);
    if (memoryIntersects.length > 0 && memoryIntersects[0].distance < 5) {
      const fragment = memoryIntersects[0].object;
      const index = this.memoryFragments.indexOf(fragment as THREE.Mesh);
      
      // Add to player sequence
      this.playerMemorySequence.push(index);
      
      // Play sound
      if (this.memoryFragmentHitSound) {
        this.memoryFragmentHitSound.play();
      }
      
      // Animate the fragment
      this.animateMemoryFragment(fragment as THREE.Mesh);
      
      // Check if complete
      this.checkMemorySequence();
      return;
    }
    
    // Check intersections with reflection surfaces
    const reflectionIntersects = raycaster.intersectObjects(this.reflectionSurfaces);
    if (reflectionIntersects.length > 0 && reflectionIntersects[0].distance < 5) {
      const surface = reflectionIntersects[0].object;
      const index = this.reflectionSurfaces.indexOf(surface as THREE.Mesh);
      
      // Toggle reflection state
      this.toggleReflectionSurface(index);
      
      // Check if puzzle solved
      this.checkReflectionPuzzle();
      return;
    }
  }
  
  // Animate memory fragment when clicked
  private animateMemoryFragment(fragment: THREE.Mesh): void {
    // Pulse effect
    const originalScale = fragment.scale.clone();
    const timeline = { scale: 1.0 };
    
    // Save original color and material
    const material = fragment.material as THREE.MeshStandardMaterial;
    const originalColor = material.color.clone();
    const originalEmissive = material.emissive.clone();
    
    // Change color
    material.emissive.setRGB(1, 0.5, 1);
    material.color.setRGB(1, 0.5, 1);
    
    // Pulse animation
    const animate = () => {
      timeline.scale += 0.1;
      fragment.scale.set(
        originalScale.x * (1 + Math.sin(timeline.scale) * 0.2),
        originalScale.y * (1 + Math.sin(timeline.scale) * 0.2),
        originalScale.z * (1 + Math.sin(timeline.scale) * 0.2)
      );
      
      if (timeline.scale < 10) {
        requestAnimationFrame(animate);
      } else {
        // Reset scale and color
        fragment.scale.copy(originalScale);
        material.emissive.copy(originalEmissive);
        material.color.copy(originalColor);
      }
    };
    
    animate();
  }
  
  // Toggle reflection surface state
  private toggleReflectionSurface(index: number): void {
    if (index >= 0 && index < this.reflectionPuzzleState.length) {
      this.reflectionPuzzleState[index] = !this.reflectionPuzzleState[index];
      
      // Update visual state
      const surface = this.reflectionSurfaces[index];
      const material = surface.material as THREE.MeshStandardMaterial;
      
      if (this.reflectionPuzzleState[index]) {
        material.emissive.setRGB(0.5, 0.5, 1);
        material.color.setRGB(0.6, 0.6, 1);
      } else {
        material.emissive.setRGB(0.2, 0.2, 0.5);
        material.color.setRGB(0.4, 0.4, 0.8);
      }
    }
  }
  
  // Check if memory sequence is correct
  private checkMemorySequence(): void {
    const playerSeqLength = this.playerMemorySequence.length;
    
    // Check if the current sequence matches so far
    for (let i = 0; i < playerSeqLength; i++) {
      if (this.playerMemorySequence[i] !== this.memorySequence[i]) {
        // Reset sequence if wrong
        this.playerMemorySequence = [];
        
        // Show failure effect
        this.showMemoryFailEffect();
        return;
      }
    }
    
    // If complete sequence entered and correct
    if (playerSeqLength === this.memorySequence.length) {
      // Reset for the next challenge
      this.playerMemorySequence = [];
      
      // Show success effect
      this.showMemorySuccessEffect();
      
      // Give player a reward
      this.player.energy += 1;
      
      // Exit memory challenge mode
      this.isInMemoryChallenge = false;
    }
  }
  
  // Show effect when memory sequence fails
  private showMemoryFailEffect(): void {
    // Red flash effect
    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
    overlay.style.pointerEvents = 'none';
    overlay.style.transition = 'opacity 0.5s';
    overlay.style.zIndex = '1000';
    
    document.body.appendChild(overlay);
    
    // Memory fragments show failure
    this.memoryFragments.forEach(fragment => {
      const material = fragment.material as THREE.MeshStandardMaterial;
      material.emissive.setRGB(1, 0, 0);
    });
    
    // Fade out
    setTimeout(() => {
      overlay.style.opacity = '0';
      this.memoryFragments.forEach(fragment => {
        const material = fragment.material as THREE.MeshStandardMaterial;
        material.emissive.setRGB(0.2, 0.2, 0.5);
      });
      
      setTimeout(() => {
        document.body.removeChild(overlay);
      }, 500);
    }, 1000);
  }
  
  // Show effect when memory sequence succeeds
  private showMemorySuccessEffect(): void {
    // Green flash effect
    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
    overlay.style.pointerEvents = 'none';
    overlay.style.transition = 'opacity 0.5s';
    overlay.style.zIndex = '1000';
    
    document.body.appendChild(overlay);
    
    // Memory fragments show success
    this.memoryFragments.forEach(fragment => {
      const material = fragment.material as THREE.MeshStandardMaterial;
      material.emissive.setRGB(0, 1, 0);
    });
    
    // Play success sound
    if (this.reflectionSolvedSound) {
      this.reflectionSolvedSound.play();
    }
    
    // Fade out
    setTimeout(() => {
      overlay.style.opacity = '0';
      
      // Remove memory fragments from scene
      this.memoryFragments.forEach(fragment => {
        this.scene.remove(fragment);
      });
      
      this.memoryFragments = [];
      
      setTimeout(() => {
        document.body.removeChild(overlay);
      }, 500);
    }, 1500);
  }
  
  // Check if reflection puzzle is solved
  private checkReflectionPuzzle(): void {
    // Check if all reflections are in correct state
    const isSolved = this.reflectionPuzzleState.every(state => state === true);
    
    if (isSolved) {
      // Play solved sound
      if (this.reflectionSolvedSound) {
        this.reflectionSolvedSound.play();
      }
      
      // Show success effect
      this.showReflectionSuccessEffect();
      
      // Give player a reward (energy)
      this.player.energy += 1;
      
      // Exit reflection puzzle mode
      this.isInReflectionPuzzle = false;
    }
  }
  
  // Show effect when reflection puzzle is solved
  private showReflectionSuccessEffect(): void {
    // Create particles at each reflection surface
    this.reflectionSurfaces.forEach(surface => {
      // Get position
      const position = surface.position.clone();
      
      // Create particle effect
      const particleCount = 50;
      const particlesGeometry = new THREE.BufferGeometry();
      const particlePositions = new Float32Array(particleCount * 3);
      const particleColors = new Float32Array(particleCount * 3);
      
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        particlePositions[i3] = position.x + (Math.random() - 0.5) * 2;
        particlePositions[i3 + 1] = position.y + (Math.random() - 0.5) * 2;
        particlePositions[i3 + 2] = position.z + (Math.random() - 0.5) * 2;
        
        particleColors[i3] = 0.5 + Math.random() * 0.5; // R
        particleColors[i3 + 1] = 0.5 + Math.random() * 0.5; // G
        particleColors[i3 + 2] = 1.0; // B (fully blue)
      }
      
      particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
      particlesGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
      
      const particlesMaterial = new THREE.PointsMaterial({
        size: 0.15,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
      });
      
      const particles = new THREE.Points(particlesGeometry, particlesMaterial);
      this.scene.add(particles);
      
      // Animate particles
      const startPos = particlePositions.slice();
      const duration = 2000; // 2 seconds
      const startTime = Date.now();
      
      const animateParticles = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Move particles outward
        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3;
          
          // Get direction from start position to surface center
          const dir = new THREE.Vector3(
            startPos[i3] - position.x,
            startPos[i3 + 1] - position.y,
            startPos[i3 + 2] - position.z
          ).normalize();
          
          // Move in that direction
          particlePositions[i3] = startPos[i3] + dir.x * progress * 5;
          particlePositions[i3 + 1] = startPos[i3 + 1] + dir.y * progress * 5;
          particlePositions[i3 + 2] = startPos[i3 + 2] + dir.z * progress * 5;
        }
        
        particlesGeometry.attributes.position.needsUpdate = true;
        
        // Fade out
        particlesMaterial.opacity = 0.8 * (1 - progress);
        
        if (progress < 1) {
          requestAnimationFrame(animateParticles);
        } else {
          // Remove particles
          this.scene.remove(particles);
          particlesGeometry.dispose();
          particlesMaterial.dispose();
        }
      };
      
      animateParticles();
    });
    
    // Remove reflection surfaces after animation
    setTimeout(() => {
      this.reflectionSurfaces.forEach(surface => {
        this.scene.remove(surface);
      });
      
      this.reflectionSurfaces = [];
    }, 2000);
  }
  
  // Initialize the Echo Realm features for a level
  public initializeEchoRealm(level: LevelDefinition): void {
    console.log("Initializing Echo Realm FPV for level:", level.name);
    this.currentLevel = level;
    this.echoRealm.reset();
    this.clearEffects();
    
    // Position player at start position
    const gridOffset = (this.gridSize * this.cellSize) / 2 - this.cellSize / 2;
    const startX = level.start.x * this.cellSize - gridOffset;
    const startZ = level.start.z * this.cellSize - gridOffset;
    
    this.player.position.set(startX, this.playerHeight, startZ);
    this.player.gridPosition = { x: level.start.x, z: level.start.z };
    this.playerBody.position.set(startX, this.playerHeight / 2, startZ);
    this.controls.getObject().position.set(startX, this.playerHeight, startZ);
    
    // Reset player velocity
    this.playerVelocity.set(0, 0, 0);
    
    // Add realm-specific environment effects
    this.setupEnvironment(level);
    
    // Add floating mirror fragments
    if (level.realmProperties?.hasMirrors) {
      this.createMirrorFragments();
    }
    
    // Initialize gameplay elements
    this.setupLevelChallenges(level);
    
    // Reset control state
    this.lockControls = false;
    this.isInMemoryChallenge = false;
    this.isInReflectionPuzzle = false;
    this.isInTemporalDistortion = false;
    
    // Reset tracking variables
    this.pastPlayerPositions = [];
    this.frameCount = 0;
  }
  
  // Set up level-specific challenges
  private setupLevelChallenges(level: LevelDefinition): void {
    // Choose challenges based on level
    const levelId = level.id;
    
    if (levelId === 1) {
      // Level 1: Simple reflections and memory challenge
      this.createSimpleMemoryChallenge();
      this.createSimpleReflectionPuzzle();
    }
    else if (levelId === 2) {
      // Level 2: More complex challenges
      this.createAdvancedMemoryChallenge();
      this.createAdvancedReflectionPuzzle();
      this.createTemporalDistortionZone();
    }
    else if (levelId === 3) {
      // Level 3: Combination of all challenge types
      this.createComplexMemoryChallenge();
      this.createComplexReflectionPuzzle();
      this.createMultipleTemporalDistortionZones();
    }
  }
  
  // Create simple memory challenge
  private createSimpleMemoryChallenge(): void {
    // Create 4 memory fragments in a circle
    const radius = 5;
    const centerX = 0;
    const centerZ = 0;
    this.memoryFragments = [];
    
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * radius;
      const z = centerZ + Math.sin(angle) * radius;
      
      const geometry = new THREE.OctahedronGeometry(0.5);
      const material = new THREE.MeshStandardMaterial({
        color: 0x88aaff,
        emissive: 0x4466aa,
        emissiveIntensity: 0.5,
        metalness: 0.7,
        roughness: 0.3
      });
      
      const fragment = new THREE.Mesh(geometry, material);
      fragment.position.set(x, this.playerHeight, z);
      fragment.userData.index = i;
      
      this.scene.add(fragment);
      this.memoryFragments.push(fragment);
    }
    
    // Generate simple memory sequence
    this.memorySequence = [0, 2, 1, 3]; // Simple fixed pattern for level 1
    this.playerMemorySequence = [];
    
    // Add hint to show the sequence to the player
    this.showMemorySequenceHint();
  }
  
  // Create advanced memory challenge
  private createAdvancedMemoryChallenge(): void {
    // Create 6 memory fragments in a more complex arrangement
    const positions = [
      { x: 5, y: this.playerHeight - 0.5, z: 5 },
      { x: -5, y: this.playerHeight, z: 5 },
      { x: 0, y: this.playerHeight + 1, z: 0 },
      { x: 5, y: this.playerHeight, z: -5 },
      { x: -5, y: this.playerHeight + 0.5, z: -5 },
      { x: 0, y: this.playerHeight - 0.5, z: -8 }
    ];
    
    this.memoryFragments = [];
    
    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      
      const geometry = new THREE.TetrahedronGeometry(0.5);
      const material = new THREE.MeshStandardMaterial({
        color: 0x88aaff,
        emissive: 0x4466aa,
        emissiveIntensity: 0.5,
        metalness: 0.7,
        roughness: 0.3
      });
      
      const fragment = new THREE.Mesh(geometry, material);
      fragment.position.set(pos.x, pos.y, pos.z);
      fragment.userData.index = i;
      
      // Random rotation
      fragment.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      this.scene.add(fragment);
      this.memoryFragments.push(fragment);
    }
    
    // Generate random memory sequence
    this.memorySequence = [];
    for (let i = 0; i < 4; i++) {
      this.memorySequence.push(Math.floor(Math.random() * positions.length));
    }
    this.playerMemorySequence = [];
    
    // Add hint to show the sequence to the player
    this.showMemorySequenceHint();
  }
  
  // Create complex memory challenge
  private createComplexMemoryChallenge(): void {
    // Create 8 memory fragments in a complex 3D arrangement
    const positions = [
      { x: 7, y: this.playerHeight - 0.5, z: 7 },
      { x: -7, y: this.playerHeight, z: 7 },
      { x: 0, y: this.playerHeight + 1.5, z: 0 },
      { x: 7, y: this.playerHeight, z: -7 },
      { x: -7, y: this.playerHeight + 0.5, z: -7 },
      { x: 0, y: this.playerHeight - 0.5, z: -10 },
      { x: 10, y: this.playerHeight + 1, z: 0 },
      { x: -10, y: this.playerHeight - 1, z: 0 }
    ];
    
    this.memoryFragments = [];
    
    // Create different geometric shapes for fragments
    const geometries = [
      new THREE.TetrahedronGeometry(0.5),
      new THREE.OctahedronGeometry(0.5),
      new THREE.IcosahedronGeometry(0.5),
      new THREE.DodecahedronGeometry(0.5),
      new THREE.TetrahedronGeometry(0.6),
      new THREE.OctahedronGeometry(0.6),
      new THREE.IcosahedronGeometry(0.6),
      new THREE.DodecahedronGeometry(0.6)
    ];
    
    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      
      const material = new THREE.MeshStandardMaterial({
        color: 0x88aaff,
        emissive: 0x4466aa,
        emissiveIntensity: 0.5,
        metalness: 0.7,
        roughness: 0.3
      });
      
      const fragment = new THREE.Mesh(geometries[i], material);
      fragment.position.set(pos.x, pos.y, pos.z);
      fragment.userData.index = i;
      
      // Random rotation
      fragment.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      this.scene.add(fragment);
      this.memoryFragments.push(fragment);
    }
    
    // Generate longer random memory sequence
    this.memorySequence = [];
    for (let i = 0; i < 6; i++) {
      this.memorySequence.push(Math.floor(Math.random() * positions.length));
    }
    this.playerMemorySequence = [];
    
    // Add hint to show the sequence to the player
    this.showMemorySequenceHint();
  }
  
  // Show memory sequence hint to the player
  private showMemorySequenceHint(): void {
    // Create visual effect to show the sequence
    const showSequence = () => {
      let index = 0;
      
      const flashNext = () => {
        if (index < this.memorySequence.length) {
          const fragmentIndex = this.memorySequence[index];
          const fragment = this.memoryFragments[fragmentIndex];
          
          // Highlight the fragment
          this.animateMemoryFragment(fragment);
          
          // Play sound
          if (this.memoryFragmentHitSound) {
            this.memoryFragmentHitSound.play();
          }
          
          index++;
          setTimeout(flashNext, 1000);
        }
      };
      
      flashNext();
    };
    
    // Start showing sequence after a delay
    setTimeout(showSequence, 2000);
  }
  
  // Create simple reflection puzzle
  private createSimpleReflectionPuzzle(): void {
    // Create 3 reflective surfaces
    const positions = [
      { x: 10, y: this.playerHeight, z: 0, rotation: 0 },
      { x: -5, y: this.playerHeight, z: 10, rotation: Math.PI / 2 },
      { x: 0, y: this.playerHeight, z: -10, rotation: Math.PI }
    ];
    
    this.reflectionSurfaces = [];
    this.reflectionPuzzleState = positions.map(() => false); // All start inactive
    
    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      
      const geometry = new THREE.PlaneGeometry(2, 3);
      const material = new THREE.MeshStandardMaterial({
        color: 0x4466aa,
        emissive: 0x223355,
        emissiveIntensity: 0.5,
        metalness: 0.8,
        roughness: 0.2,
        side: THREE.DoubleSide
      });
      
      const surface = new THREE.Mesh(geometry, material);
      surface.position.set(pos.x, pos.y, pos.z);
      surface.rotation.y = pos.rotation;
      
      this.scene.add(surface);
      this.reflectionSurfaces.push(surface);
    }
    
    // Create hint for puzzle
    this.createReflectionPuzzleHint();
  }
  
  // Create advanced reflection puzzle
  private createAdvancedReflectionPuzzle(): void {
    // Create 5 reflective surfaces in a star pattern
    const positions = [
      { x: 12, y: this.playerHeight, z: 0, rotation: 0 },
      { x: 4, y: this.playerHeight, z: 11, rotation: Math.PI / 2.5 },
      { x: -10, y: this.playerHeight, z: 7, rotation: Math.PI / 1.25 },
      { x: -10, y: this.playerHeight, z: -7, rotation: -Math.PI / 1.25 },
      { x: 4, y: this.playerHeight, z: -11, rotation: -Math.PI / 2.5 }
    ];
    
    this.reflectionSurfaces = [];
    this.reflectionPuzzleState = positions.map(() => false); // All start inactive
    
    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      
      const geometry = new THREE.PlaneGeometry(2, 3);
      const material = new THREE.MeshStandardMaterial({
        color: 0x4466aa,
        emissive: 0x223355,
        emissiveIntensity: 0.5,
        metalness: 0.8,
        roughness: 0.2,
        side: THREE.DoubleSide
      });
      
      const surface = new THREE.Mesh(geometry, material);
      surface.position.set(pos.x, pos.y, pos.z);
      surface.rotation.y = pos.rotation;
      
      this.scene.add(surface);
      this.reflectionSurfaces.push(surface);
    }
    
    // Create hint for puzzle
    this.createReflectionPuzzleHint();
  }
  
  // Create complex reflection puzzle
  private createComplexReflectionPuzzle(): void {
    // Create 7 reflective surfaces in a complex 3D arrangement
    const positions = [
      { x: 12, y: this.playerHeight, z: 0, rotation: 0, tilt: 0 },
      { x: 8, y: this.playerHeight - 1, z: 8, rotation: Math.PI / 4, tilt: Math.PI / 12 },
      { x: 0, y: this.playerHeight + 2, z: 12, rotation: Math.PI / 2, tilt: -Math.PI / 12 },
      { x: -8, y: this.playerHeight + 1, z: 8, rotation: Math.PI * 3/4, tilt: Math.PI / 10 },
      { x: -12, y: this.playerHeight, z: 0, rotation: Math.PI, tilt: 0 },
      { x: -8, y: this.playerHeight - 1, z: -8, rotation: -Math.PI * 3/4, tilt: -Math.PI / 10 },
      { x: 8, y: this.playerHeight - 2, z: -8, rotation: -Math.PI / 4, tilt: Math.PI / 8 }
    ];
    
    this.reflectionSurfaces = [];
    this.reflectionPuzzleState = positions.map(() => false); // All start inactive
    
    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      
      const geometry = new THREE.PlaneGeometry(2, 3);
      const material = new THREE.MeshStandardMaterial({
        color: 0x4466aa,
        emissive: 0x223355,
        emissiveIntensity: 0.5,
        metalness: 0.8,
        roughness: 0.2,
        side: THREE.DoubleSide
      });
      
      const surface = new THREE.Mesh(geometry, material);
      surface.position.set(pos.x, pos.y, pos.z);
      surface.rotation.y = pos.rotation;
      surface.rotation.x = pos.tilt;
      
      this.scene.add(surface);
      this.reflectionSurfaces.push(surface);
    }
    
    // Create hint for puzzle
    this.createReflectionPuzzleHint();
  }
  
  // Create visual hint for reflection puzzle
  private createReflectionPuzzleHint(): void {
    // Create a central light beam that should be reflected to all surfaces
    const beamGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 8);
    const beamMaterial = new THREE.MeshStandardMaterial({
      color: 0xaaaaff,
      emissive: 0xaaaaff,
      emissiveIntensity: 1.0,
      transparent: true,
      opacity: 0.7
    });
    
    const beam = new THREE.Mesh(beamGeometry, beamMaterial);
    beam.position.set(0, this.playerHeight, 0);
    beam.rotation.x = Math.PI / 2; // Make cylinder horizontal
    
    // Add a point light at the center
    const light = new THREE.PointLight(0xaaaaff, 1, 20);
    light.position.set(0, this.playerHeight, 0);
    
    // Create a group for the hint
    this.reflectionPuzzleHint = new THREE.Group();
    this.reflectionPuzzleHint.add(beam);
    this.reflectionPuzzleHint.add(light);
    
    // Add rays pointing toward each reflection surface
    this.reflectionSurfaces.forEach(surface => {
      const direction = new THREE.Vector3()
        .subVectors(surface.position, new THREE.Vector3(0, this.playerHeight, 0))
        .normalize();
      
      const rayLength = surface.position.distanceTo(new THREE.Vector3(0, this.playerHeight, 0)) * 0.8;
      
      const rayGeometry = new THREE.CylinderGeometry(0.05, 0.01, rayLength, 8);
      const rayMaterial = new THREE.MeshBasicMaterial({
        color: 0xaaaaff,
        transparent: true,
        opacity: 0.3
      });
      
      const ray = new THREE.Mesh(rayGeometry, rayMaterial);
      ray.position.copy(new THREE.Vector3().addVectors(
        new THREE.Vector3(0, this.playerHeight, 0),
        direction.multiplyScalar(rayLength / 2)
      ));
      
      // Point cylinder along direction
      ray.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
      
      if (this.reflectionPuzzleHint) {
        this.reflectionPuzzleHint.add(ray);
      }
    });
    
    this.scene.add(this.reflectionPuzzleHint);
    
    // Animate the hint
    const animate = () => {
      if (!this.reflectionPuzzleHint) return;
      
      const time = Date.now() * 0.001;
      
      // Pulse the central beam
      beam.scale.set(
        1 + Math.sin(time * 2) * 0.2,
        1 + Math.sin(time * 2) * 0.2,
        1 + Math.sin(time * 2) * 0.2
      );
      
      // Rotate the entire hint
      this.reflectionPuzzleHint.rotation.y = time * 0.2;
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }
  
  // Create a temporal distortion zone
  private createTemporalDistortionZone(): void {
    // Create a visible zone where time flows differently
    const zoneGeometry = new THREE.CircleGeometry(4, 32);
    const zoneMaterial = new THREE.MeshBasicMaterial({
      color: 0x8800ff,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide
    });
    
    const zone = new THREE.Mesh(zoneGeometry, zoneMaterial);
    zone.position.set(0, 0.05, 0); // Just above the floor
    zone.rotation.x = -Math.PI / 2; // Lay flat
    
    this.scene.add(zone);
    this.temporalZones.push(zone);
    
    // Add visual effects to the zone
    const particleCount = 100;
    const particlesGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const radius = Math.random() * 4;
      const angle = Math.random() * Math.PI * 2;
      
      particlePositions[i3] = Math.cos(angle) * radius;
      particlePositions[i3 + 1] = Math.random() * 2;
      particlePositions[i3 + 2] = Math.sin(angle) * radius;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
      color: 0x8800ff,
      size: 0.1,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    particles.position.y = 0.1; // Just above the floor
    this.scene.add(particles);
    
    // Animate particles
    const animate = () => {
      const time = Date.now() * 0.001;
      const positions = particlesGeometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        // Get current position in polar coordinates
        const x = positions[i3];
        const z = positions[i3 + 2];
        const radius = Math.sqrt(x * x + z * z);
        let angle = Math.atan2(z, x);
        
        // Rotate based on distance from center (temporal distortion)
        const rotationSpeed = 0.5 - (radius / 8); // Faster rotation near center
        angle += rotationSpeed * 0.05;
        
        // Convert back to Cartesian
        positions[i3] = Math.cos(angle) * radius;
        positions[i3 + 2] = Math.sin(angle) * radius;
        
        // Oscillate height
        positions[i3 + 1] = Math.random() * 2 + Math.sin(time * 3 + i * 0.1) * 0.2;
      }
      
      particlesGeometry.attributes.position.needsUpdate = true;
      
      // Pulse zone
      zone.scale.set(
        1 + Math.sin(time) * 0.1,
        1 + Math.sin(time) * 0.1,
        1 + Math.sin(time) * 0.1
      );
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }
  
  // Create multiple temporal distortion zones
  private createMultipleTemporalDistortionZones(): void {
    // Create three temporal zones with different time effects
    const zonePositions = [
      { x: 10, z: 10, speed: 0.5 }, // Slow zone
      { x: -10, z: -10, speed: 2.0 }, // Fast zone
      { x: 0, z: 0, speed: -0.5 }  // Reverse zone
    ];
    
    zonePositions.forEach(pos => {
      // Create zone
      const zoneGeometry = new THREE.CircleGeometry(4, 32);
      const zoneMaterial = new THREE.MeshBasicMaterial({
        color: pos.speed < 0 ? 0xff0088 : 0x8800ff, // Different color for reverse zone
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide
      });
      
      const zone = new THREE.Mesh(zoneGeometry, zoneMaterial);
      zone.position.set(pos.x, 0.05, pos.z); // Just above the floor
      zone.rotation.x = -Math.PI / 2; // Lay flat
      zone.userData.timeSpeed = pos.speed; // Store time speed in user data
      
      this.scene.add(zone);
      this.temporalZones.push(zone);
      
      // Add visual effects to the zone
      const particleCount = 100;
      const particlesGeometry = new THREE.BufferGeometry();
      const particlePositions = new Float32Array(particleCount * 3);
      
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const radius = Math.random() * 4;
        const angle = Math.random() * Math.PI * 2;
        
        particlePositions[i3] = pos.x + Math.cos(angle) * radius;
        particlePositions[i3 + 1] = Math.random() * 2;
        particlePositions[i3 + 2] = pos.z + Math.sin(angle) * radius;
      }
      
      particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
      
      const particlesMaterial = new THREE.PointsMaterial({
        color: pos.speed < 0 ? 0xff0088 : 0x8800ff,
        size: 0.1,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending
      });
      
      const particles = new THREE.Points(particlesGeometry, particlesMaterial);
      particles.position.y = 0.1; // Just above the floor
      this.scene.add(particles);
      
      // Store reference to particles
      this.temporalDistortions.set(`zone_${pos.x}_${pos.z}`, particles);
      
      // Animate particles based on time speed
      const animate = () => {
        const time = Date.now() * 0.001 * Math.abs(pos.speed);
        const positions = particlesGeometry.attributes.position.array as Float32Array;
        
        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3;
          
          // Get current position in polar coordinates
          const x = positions[i3] - pos.x;
          const z = positions[i3 + 2] - pos.z;
          const radius = Math.sqrt(x * x + z * z);
          let angle = Math.atan2(z, x);
          
          // Rotate based on time speed (negative for counterclockwise)
          angle += pos.speed > 0 ? 0.05 : -0.05;
          
          // Convert back to Cartesian
          positions[i3] = pos.x + Math.cos(angle) * radius;
          positions[i3 + 2] = pos.z + Math.sin(angle) * radius;
          
          // Oscillate height
          positions[i3 + 1] = Math.random() * 2 + Math.sin(time * 3 + i * 0.1) * 0.2;
        }
        
        particlesGeometry.attributes.position.needsUpdate = true;
        
        // Pulse zone
        zone.scale.set(
          1 + Math.sin(time) * 0.1,
          1 + Math.sin(time) * 0.1,
          1 + Math.sin(time) * 0.1
        );
        
        requestAnimationFrame(animate);
      };
      
      animate();
    });
  }
  
  // Interact with the environment
  private interact(): void {
    // Create raycaster for interaction
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    
    // Check intersections with objects
    const intersects = raycaster.intersectObjects(this.scene.children, true);
    
    if (intersects.length > 0 && intersects[0].distance < 5) {
      const object = intersects[0].object;
      
      // Check if it's a memory fragment
      if (this.memoryFragments.includes(object as THREE.Mesh)) {
        this.handleClick();
        return;
      }
      
      // Check if it's a reflection surface
      if (this.reflectionSurfaces.includes(object as THREE.Mesh)) {
        this.handleClick();
        return;
      }
      
      // Check if it's something else interactive
      if (object.userData && object.userData.interactive) {
        console.log("Interacting with", object.userData.type);
        
        // Handle based on type
        switch (object.userData.type) {
          case "memory_trigger":
            this.startMemoryChallenge();
            break;
          case "reflection_trigger":
            this.startReflectionPuzzle();
            break;
          case "temporal_trigger":
            this.activateTemporalDistortion(object);
            break;
        }
      }
    }
  }
  
  // Start memory challenge
  private startMemoryChallenge(): void {
    this.isInMemoryChallenge = true;
    
    // Show UI message
    this.showMessageOverlay("Memory Challenge: Repeat the sequence shown");
    
    // Create the memory fragments
    if (this.currentLevel?.id === 1) {
      this.createSimpleMemoryChallenge();
    } else if (this.currentLevel?.id === 2) {
      this.createAdvancedMemoryChallenge();
    } else {
      this.createComplexMemoryChallenge();
    }
  }
  
  // Start reflection puzzle
  private startReflectionPuzzle(): void {
    this.isInReflectionPuzzle = true;
    
    // Show UI message
    this.showMessageOverlay("Reflection Puzzle: Align all mirrors to reflect light");
    
    // Create the reflection puzzle
    if (this.currentLevel?.id === 1) {
      this.createSimpleReflectionPuzzle();
    } else if (this.currentLevel?.id === 2) {
      this.createAdvancedReflectionPuzzle();
    } else {
      this.createComplexReflectionPuzzle();
    }
  }
  
  // Activate temporal distortion
  private activateTemporalDistortion(trigger: THREE.Object3D): void {
    // Show UI message
    this.showMessageOverlay("Temporal Distortion: Time flows differently here");
    
    if (this.temporalShiftSound) {
      this.temporalShiftSound.play();
    }
    
    // Create visual effect
    this.isInTemporalDistortion = true;
    
    // Create temporal zone
    if (this.currentLevel?.id === 1) {
      // Simple slow time
      this.temporalZoneSpeed = 0.5;
    } else if (this.currentLevel?.id === 2) {
      this.createTemporalDistortionZone();
      this.temporalZoneSpeed = 2.0;
    } else {
      this.createMultipleTemporalDistortionZones();
    }
  }
  
  // Show message overlay to the player
  private showMessageOverlay(message: string): void {
    // Create overlay if it doesn't exist
    if (!document.getElementById('echoRealmMessage')) {
      const overlay = document.createElement('div');
      overlay.id = 'echoRealmMessage';
      overlay.style.position = 'absolute';
      overlay.style.top = '20%';
      overlay.style.left = '50%';
      overlay.style.transform = 'translateX(-50%)';
      overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      overlay.style.color = '#aaaaff';
      overlay.style.padding = '1rem 2rem';
      overlay.style.borderRadius = '5px';
      overlay.style.fontFamily = 'monospace';
      overlay.style.fontSize = '1.2rem';
      overlay.style.zIndex = '1000';
      overlay.style.textAlign = 'center';
      overlay.style.transition = 'opacity 0.5s';
      
      document.body.appendChild(overlay);
    }
    
    // Update message
    const messageElement = document.getElementById('echoRealmMessage');
    if (messageElement) {
      messageElement.textContent = message;
      messageElement.style.opacity = '1';
      
      // Hide after 4 seconds
      setTimeout(() => {
        if (messageElement) {
          messageElement.style.opacity = '0';
        }
      }, 4000);
    }
  }
  
  // Set up environment effects for the Echo Realm
  private setupEnvironment(level: LevelDefinition): void {
    if (!level.realmProperties) return;
    
    // Add fog
    this.fogColor = new THREE.Color(level.realmProperties.environment.fogColor || 0x8080ff);
    this.scene.fog = new THREE.FogExp2(
      level.realmProperties.environment.fogColor || 0x8080ff, 
      0.03
    );
    
    // Adjust lighting
    const ambientLight = new THREE.AmbientLight(
      level.realmProperties.environment.ambientLightColor || 0x444466, 
      1.0
    );
    this.scene.add(ambientLight);
    
    // Add ethereal point lights
    for (let i = 0; i < 3; i++) {
      const light = new THREE.PointLight(0xaaaaff, 0.8, 15);
      light.position.set(
        (Math.random() - 0.5) * 10,
        3 + Math.random() * 5,
        (Math.random() - 0.5) * 10
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

  // Create floating mirror fragments
  private createMirrorFragments(): void {
    const fragmentCount = 20;
    
    for (let i = 0; i < fragmentCount; i++) {
      // Create random mirror fragment
      const size = 0.5 + Math.random() * 1.5;
      let geometry;
      
      // Different fragment shapes
      const shapeType = Math.floor(Math.random() * 3);
      switch(shapeType) {
        case 0:
          geometry = new THREE.PlaneGeometry(size, size);
          break;
        case 1:
          geometry = new THREE.CircleGeometry(size/2, 5);
          break;
        case 2:
          const points = [];
          for (let j = 0; j < 5; j++) {
            const angle = (j / 5) * Math.PI * 2;
            const radius = size/2 * (0.7 + Math.random() * 0.3);
            points.push(new THREE.Vector2(Math.cos(angle) * radius, Math.sin(angle) * radius));
          }
          geometry = new THREE.ShapeGeometry(new THREE.Shape(points));
          break;
      }
      
      const mirror = new THREE.Mesh(geometry, this.reflectiveMaterial.clone());
      
      // Position around the play area
      const gridExtent = this.gridSize * this.cellSize;
      mirror.position.set(
        (Math.random() - 0.5) * gridExtent * 1.5,
        Math.random() * 10,
        (Math.random() - 0.5) * gridExtent * 1.5
      );
      
      // Random rotation
      mirror.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );
      
      this.scene.add(mirror);
      this.mirrorObjects.push(mirror);
    }
  }

  // Register that the player has stepped on a tile
  public registerPlayerStep(x: number, z: number): void {
    this.echoRealm.registerTileStep(x, z);
    
    // Play echo sound when player steps on a new tile
    this.playEchoSound(x, z);
  }
  
  // Play echo sound at position
  private playEchoSound(x: number, z: number): void {
    const tileKey = `${x}_${z}`;
    
    // Check if we already have an echo sound for this position
    if (this.echoes.has(tileKey)) {
      // Replay the sound
      const echo = this.echoes.get(tileKey)!;
      echo.play();
      return;
    }
    
    // Create new positional audio
    if (this.audioListener && Object.keys(this.echoSounds).length > 0) {
      const echo = new THREE.PositionalAudio(this.audioListener);
      
      // Randomly choose one of the echo sounds
      const echoKeys = Object.keys(this.echoSounds);
      const randomKey = echoKeys[Math.floor(Math.random() * echoKeys.length)];
      
      echo.setBuffer(this.echoSounds[randomKey]);
      echo.setRefDistance(5);
      echo.setRolloffFactor(1);
      echo.setVolume(0.5);
      
      // Create position for the sound
      const gridOffset = (this.gridSize * this.cellSize) / 2 - this.cellSize / 2;
      const posX = x * this.cellSize - gridOffset;
      const posZ = z * this.cellSize - gridOffset;
      
      // Create a dummy object to hold the sound
      const soundObject = new THREE.Object3D();
      soundObject.position.set(posX, 0.5, posZ);
      soundObject.add(echo);
      this.scene.add(soundObject);
      
      // Play the sound
      echo.play();
      
      // Store reference
      this.echoes.set(tileKey, echo);
    }
  }
  
  // Update Echo Realm effects
  // Update Echo Realm effects (continued)
  public update(currentTime: number, delta: number): void {
    if (!this.currentLevel || !this.currentLevel.realmProperties) return;
    
    // Only update at certain intervals for performance
    if (currentTime - this.lastUpdateTime < 100) {
      return;
    }
    
    this.lastUpdateTime = currentTime;
    
    // Update fading tiles
    const fadingTiles = this.echoRealm.updateFadingTiles(currentTime, this.currentLevel.realmProperties);
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
    
    // Update player position and movement
    this.updatePlayer(currentTime, delta);
    
    // Update frame counter
    this.frameCount++;
  }
  
  // Update player position and movement
  private updatePlayer(currentTime: number, delta: number): void {
    // Skip if controls are locked
    if (this.lockControls) return;
    
    // Store previous position for echo effect
    if (this.frameCount % 5 === 0) {
      this.previousPlayerPosition.copy(this.player.position);
    }
    
    // Get the camera direction
    this.playerDirection.set(0, 0, -1).applyQuaternion(this.camera.quaternion);
    
    // Modify speed based on temporal distortion zones
    let moveSpeed = 0.1 * this.temporalZoneSpeed;
    
    // Check if in a temporal distortion zone
    this.inTemporalZone = false;
    this.temporalZoneSpeed = 1.0;
    
    for (const zone of this.temporalZones) {
      const distance = new THREE.Vector2(
        this.player.position.x - zone.position.x, 
        this.player.position.z - zone.position.z
      ).length();
      
      if (distance < 4) { // Zone radius
        this.inTemporalZone = true;
        this.temporalZoneSpeed = zone.userData.timeSpeed || 1.0;
        
        // Play temporal shift sound if entering zone
        if (!this.isInTemporalDistortion && this.temporalShiftSound) {
          this.temporalShiftSound.play();
          this.isInTemporalDistortion = true;
        }
        
        // Apply visual effect
        if (this.temporalZoneSpeed < 0) {
          // Reverse time effect - backward echo
          if (this.pastPlayerPositions.length > 0 && this.frameCount % 30 === 0) {
            const pastPos = this.pastPlayerPositions.pop();
            if (pastPos) {
              // Create backward echo effect
              this.createEchoEffect(pastPos, 0xff0088);
            }
          }
        }
        
        break;
      }
    }
    
    // Reset temporal distortion flag if not in any zone
    if (!this.inTemporalZone) {
      this.isInTemporalDistortion = false;
    }
    
    // Calculate movement speed based on input
    const velocity = this.playerVelocity;
    
    // Reset velocity
    velocity.x = 0;
    velocity.z = 0;
    
    // Apply movement based on key states
    if (this.moveForward) {
      velocity.z = -moveSpeed;
    } else if (this.moveBackward) {
      velocity.z = moveSpeed;
    }
    
    if (this.moveLeft) {
      velocity.x = -moveSpeed;
    } else if (this.moveRight) {
      velocity.x = moveSpeed;
    }
    
    // Convert velocity to camera direction
    if (velocity.x !== 0 || velocity.z !== 0) {
      const angle = Math.atan2(this.playerDirection.x, this.playerDirection.z);
      
      const moveX = velocity.x * Math.cos(angle) - velocity.z * Math.sin(angle);
      const moveZ = velocity.x * Math.sin(angle) + velocity.z * Math.cos(angle);
      
      velocity.x = moveX;
      velocity.z = moveZ;
      
      // Apply the movement to player position
      this.player.position.x += velocity.x * delta;
      this.player.position.z += velocity.z * delta;
      
      // Update player's grid position
      this.player.gridPosition = this.worldToGrid(this.player.position);
      
      // Update player body position
      this.playerBody.position.x = this.player.position.x;
      this.playerBody.position.z = this.player.position.z;
      
      // Play footstep sound
      this.footstepInterval += delta;
      if (this.footstepInterval > 300 && this.playerFootsteps) {
        this.playerFootsteps.play();
        this.footstepInterval = 0;
      }
      
      // Register step on new tile
      const gridPos = this.player.gridPosition;
      this.registerPlayerStep(gridPos.x, gridPos.z);
      
      // Store past position for echo trail
      if (this.frameCount % this.echoInterval === 0) {
        this.pastPlayerPositions.push(this.player.position.clone());
        
        // Limit the array size
        if (this.pastPlayerPositions.length > this.maxPastPositions) {
          this.pastPlayerPositions.shift();
        }
        
        // Create echo effect
        this.createEchoEffect(this.player.position.clone());
      }
    }
    
    // Update camera position
    this.controls.getObject().position.copy(this.player.position);
  }
  
  // Create echo effect at position
  private createEchoEffect(position: THREE.Vector3, color: number = 0xaaaaff): void {
    // Create a fading echo of the player
    const echoGeometry = new THREE.BoxGeometry(0.8, this.playerHeight, 0.8);
    const echoMaterial = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.5
    });
    
    const echo = new THREE.Mesh(echoGeometry, echoMaterial);
    echo.position.copy(position);
    echo.position.y = this.playerHeight / 2;
    this.scene.add(echo);
    
    // Play echo sound
    if (this.playerEchoSound && Math.random() < 0.3) {
      this.playerEchoSound.play();
    }
    
    // Fade out and remove
    const startTime = Date.now();
    const duration = 2000; // 2 seconds
    
    const animateEcho = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Fade out
      echoMaterial.opacity = 0.5 * (1 - progress);
      
      if (progress < 1) {
        requestAnimationFrame(animateEcho);
      } else {
        // Remove echo
        this.scene.remove(echo);
        echoGeometry.dispose();
        echoMaterial.dispose();
      }
    };
    
    animateEcho();
  }
  
  // Update the visual effects for fading tiles
  private updateFadingTileEffects(fadingTiles: EchoTile[], currentTime: number): void {
    const time = currentTime * 0.001;
    
    fadingTiles.forEach(tile => {
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
        const fadeProgress = Math.min(1, Math.max(0, (elapsed - tile.fadeDelay * 0.7) / (tile.fadeDelay * 0.3)));
        
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
    
    // Calculate position
    const gridOffset = (this.gridSize * this.cellSize) / 2 - this.cellSize / 2;
    const posX = x * this.cellSize - gridOffset;
    const posZ = z * this.cellSize - gridOffset;
    
    // Create ripple mesh
    const rippleGeometry = new THREE.CircleGeometry(this.cellSize / 2, 32);
    const rippleMaterial = new THREE.MeshBasicMaterial({
      color: 0xaaddff,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
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
      // Gentle floating motion
      mirror.position.y = mirror.position.y + Math.sin(time * 0.5 + index * 0.2) * 0.01;
      
      // Slow rotation
      mirror.rotation.x = time * 0.1 + index * 0.05;
      mirror.rotation.y = time * 0.08 + index * 0.05;
      
      // Subtle opacity pulse
      if (mirror.material instanceof THREE.MeshStandardMaterial) {
        mirror.material.opacity = 0.4 + Math.sin(time * 0.3 + index) * 0.1;
      }
    });
  }
  
  // Update echo trails
  private updateEchoTrails(currentTime: number): void {
    // Create and update echo trails that follow the player's path
    // These are particle effects that trace where the player has been
    const steppedTiles = this.echoRealm.getSteppedTiles();
    
    steppedTiles.forEach(tile => {
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
        const trailAge = Math.min(1, Math.max(0, elapsed / (tile.fadeDelay * 1.2)));
        
        // Fade trail based on age
        if (trail.material instanceof THREE.PointsMaterial) {
          trail.material.opacity = 0.6 * (1 - trailAge);
          
          // Animate trail particles
          const positions = (trail.geometry as THREE.BufferGeometry).getAttribute('position');
          const count = positions.count;
          
          for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            const y = positions.getY(i);
            positions.setY(i, y + Math.sin(currentTime * 0.001 * 2 + i * 0.1) * 0.002);
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
    
    // Calculate position
    const gridOffset = (this.gridSize * this.cellSize) / 2 - this.cellSize / 2;
    const posX = x * this.cellSize - gridOffset;
    const posZ = z * this.cellSize - gridOffset;
    
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
    
    trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    trailGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // Create point cloud
    const trailMaterial = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    
    const trail = new THREE.Points(trailGeometry, trailMaterial);
    this.scene.add(trail);
    this.echoTrails.set(tileKey, trail);
  }
  
  // Update resonance disruption effect
  private updateResonanceDisruption(currentTime: number): void {
    const time = currentTime * 0.001;
    
    // Create random distortion waves that move through the environment
    if (Math.random() < 0.01) { // Occasionally create a new disruption
      const disruptionCenter = new THREE.Vector3(
        (Math.random() - 0.5) * this.gridSize * this.cellSize,
        0,
        (Math.random() - 0.5) * this.gridSize * this.cellSize
      );
      
      // Visual distortion effect
      const disruptionGeometry = new THREE.RingGeometry(0.5, 0.8, 32);
      const disruptionMaterial = new THREE.MeshBasicMaterial({
        color: 0xff00ff,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
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
          disruptionMaterial.opacity = 0.3 - (elapsed * 0.0003);
          requestAnimationFrame(animate);
        } else {
          this.scene.remove(disruption);
          disruptionMaterial.dispose();
          disruptionGeometry.dispose();
        }
      };
      
      animate();
    }
    
    // Apply camera distortion effect
    if (this.isInReflectionPuzzle || this.isInMemoryChallenge) {
      // Subtle camera sway
      const sway = Math.sin(time * 0.5) * 0.01;
      this.camera.rotation.z = sway;
    }
  }
  
  // Convert world position to grid position
  private worldToGrid(position: THREE.Vector3): { x: number, z: number } {
    const gridOffset = (this.gridSize * this.cellSize) / 2 - this.cellSize / 2;
    
    const gridX = Math.floor((position.x + gridOffset) / this.cellSize);
    const gridZ = Math.floor((position.z + gridOffset) / this.cellSize);
    
    return { x: gridX, z: gridZ };
  }
  
  // Clear all effects
  private clearEffects(): void {
    // Clear fading tiles
    this.fadingTiles.forEach(mesh => {
      this.scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material instanceof THREE.Material) mesh.material.dispose();
    });
    this.fadingTiles.clear();
    
    // Clear ripple effects
    this.rippleEffects.forEach(mesh => {
      this.scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material instanceof THREE.Material) mesh.material.dispose();
    });
    this.rippleEffects.clear();
    
    // Clear echo trails
    this.echoTrails.forEach(points => {
      this.scene.remove(points);
      if (points.geometry) points.geometry.dispose();
      if (points.material instanceof THREE.Material) points.material.dispose();
    });
    this.echoTrails.clear();
    
    // Clear mirror objects
    this.mirrorObjects.forEach(mirror => {
      this.scene.remove(mirror);
      if (mirror.geometry) mirror.geometry.dispose();
      if (mirror.material instanceof THREE.Material) mirror.material.dispose();
    });
    this.mirrorObjects = [];
    
    // Clear memory fragments
    this.memoryFragments.forEach(fragment => {
      this.scene.remove(fragment);
      if (fragment.geometry) fragment.geometry.dispose();
      if (fragment.material instanceof THREE.Material) fragment.material.dispose();
    });
    this.memoryFragments = [];
    
    // Clear reflection surfaces
    this.reflectionSurfaces.forEach(surface => {
      this.scene.remove(surface);
      if (surface.geometry) surface.geometry.dispose();
      if (surface.material instanceof THREE.Material) surface.material.dispose();
    });
    this.reflectionSurfaces = [];
    
    // Clear temporal zones
    this.temporalZones.forEach(zone => {
      this.scene.remove(zone);
      if (zone.geometry) zone.geometry.dispose();
      if (zone.material instanceof THREE.Material) zone.material.dispose();
    });
    this.temporalZones = [];
    
    // Clear temporal distortions
    this.temporalDistortions.forEach((distortion) => {
      this.scene.remove(distortion);
      if (distortion instanceof THREE.Points && distortion.geometry) {
        distortion.geometry.dispose();
      }
      if (distortion instanceof THREE.Mesh) {
        if (distortion.geometry) distortion.geometry.dispose();
        if (distortion.material instanceof THREE.Material) distortion.material.dispose();
      }
    });
    this.temporalDistortions.clear();
    
    // Clear reflection puzzle hint
    if (this.reflectionPuzzleHint) {
      this.scene.remove(this.reflectionPuzzleHint);
      this.reflectionPuzzleHint = null;
    }
    
    // Reset fog
    this.scene.fog = null;
  }
  
  // Dispose resources
  public dispose(): void {
    this.clearEffects();
    
    // Remove playerBody
    if (this.playerBody) {
      this.scene.remove(this.playerBody);
      if (this.playerBody.geometry) this.playerBody.geometry.dispose();
      if (this.playerBody.material instanceof THREE.Material) {
        this.playerBody.material.dispose();
      }
    }
    
    // Dispose audio
    if (this.memoryFragmentHitSound) this.memoryFragmentHitSound.disconnect();
    if (this.reflectionSolvedSound) this.reflectionSolvedSound.disconnect();
    if (this.temporalShiftSound) this.temporalShiftSound.disconnect();
    if (this.playerEchoSound) this.playerEchoSound.disconnect();
    if (this.playerFootsteps) this.playerFootsteps.disconnect();
    
    // Clear echoes
    this.echoes.forEach(echo => {
      echo.disconnect();
    });
    this.echoes.clear();
    
    // Remove event listeners
    document.removeEventListener('keydown', () => {});
    document.removeEventListener('keyup', () => {});
    
    if (this.containerElement) {
      this.containerElement.removeEventListener('click', () => {});
    }
    
    // Remove message overlay
    const messageElement = document.getElementById('echoRealmMessage');
    if (messageElement && messageElement.parentNode) {
      messageElement.parentNode.removeChild(messageElement);
    }
    
    if (this.reflectiveMaterial) {
      this.reflectiveMaterial.dispose();
    }
  }
}