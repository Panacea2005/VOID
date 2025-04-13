// fpv-game-interface.ts
import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { EchoRealmFPV } from './game-engine/echo-realm-fpv';
import { EchoRealmLevelGenerator } from './game-engine/echo-realm-level-generator';
import { LevelDefinition, AudioEventType } from './types/game-types';
import { ParticleSystem } from './game-engine/particle-system';
import { AudioManager } from './game-engine/audio-manager';
import { EchoRealm } from './game-engine/echo-realm';

export class FPVGameInterface {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: PointerLockControls;
  private audioManager: AudioManager;
  private particleSystem: ParticleSystem;
  private echoRealmFPV: EchoRealmFPV | null = null;
  private currentLevel: LevelDefinition | null = null;
  private levels: LevelDefinition[] = [];
  private currentLevelIndex: number = 0;
  private container: HTMLElement;
  private animationFrameId: number | null = null;
  private messageCallback: (message: string, duration: number) => void;
  private player: {
    health: number;
    energy: number;
    keys: number;
  } = { health: 3, energy: 0, keys: 0 };
  private gameOver: boolean = false;
  private gameCompleted: boolean = false;
  private paused: boolean = false;
  
  constructor(container: HTMLElement, messageCallback: (message: string, duration: number) => void) {
    this.container = container;
    this.messageCallback = messageCallback;
    
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    
    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      75, // Wide FOV for first-person
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 1.8, 0); // Eye height
    
    // Create renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(0x000000, 1);
    
    // Add renderer to container
    this.container.appendChild(this.renderer.domElement);
    
    // Create first-person controls
    this.controls = new PointerLockControls(this.camera, this.renderer.domElement);
    this.scene.add(this.controls.getObject());
    
    // Create audio manager
    this.audioManager = new AudioManager();
    
    // Create particle system
    this.particleSystem = new ParticleSystem(this.scene);
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Initialize Echo Realm levels
    this.levels = EchoRealm.getLevels();
  }
  
  // Set up event listeners
  private setupEventListeners(): void {
    // Handle window resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    // Handle pointer lock change
    document.addEventListener('pointerlockchange', () => {
      this.paused = document.pointerLockElement !== this.renderer.domElement;
    });
    
    // Handle click to lock pointer
    this.renderer.domElement.addEventListener('click', () => {
      if (!this.controls.isLocked) {
        this.controls.lock();
      }
    });
    
    // Handle escape key to pause game
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // Pausing is handled by PointerLockControls
      }
      
      // Handle R key to restart level
      if (e.key === 'r' || e.key === 'R') {
        this.restartLevel();
      }
    });
  }
  
  // Initialize the game
  public async initialize(): Promise<void> {
    try {
      // Add basic lighting
      this.addBasicLighting();
      
      // Load resources
      await this.loadResources();
      
      // Initialize first level
      this.initializeLevel(0);
      
      // Start game loop
      this.startGameLoop();
      
      // Welcome message
      this.messageCallback("Welcome to the Echo Realm: A world of reflections and memory. Look around and use WASD to move.", 5000);
    } catch (error) {
      console.error("Error initializing game:", error);
      this.messageCallback(`Error initializing game: ${error}`, 5000);
    }
  }
  
  // Add basic lighting to the scene
  private addBasicLighting(): void {
    // Ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0x666666);
    this.scene.add(ambientLight);
    
    // Directional light for shadows
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    this.scene.add(directionalLight);
    
    // Add point light to follow player (like a flashlight)
    const flashlight = new THREE.PointLight(0xffffff, 1, 10);
    flashlight.position.set(0, 0, 0);
    
    // Add flashlight to camera
    this.camera.add(flashlight);
    flashlight.position.set(0, 0, -1); // Slightly in front of camera
  }
  
  // Load game resources
  private async loadResources(): Promise<void> {
    // Load audio
    // This would be more extensive in a real game
    return new Promise<void>((resolve) => {
      // Simulate loading time
      setTimeout(() => {
        resolve();
      }, 1000);
    });
  }
  
  // Initialize a level
  private initializeLevel(levelIndex: number): void {
    // Ensure level index is valid
    if (levelIndex < 0 || levelIndex >= this.levels.length) {
      console.error("Invalid level index:", levelIndex);
      return;
    }
    
    // Set current level
    this.currentLevelIndex = levelIndex;
    this.currentLevel = this.levels[levelIndex];
    
    // Clear previous scene elements
    this.clearLevel();
    
    // Create level geometry
    EchoRealmLevelGenerator.generateLevel(this.currentLevel, this.scene, 8, 1.5);
    
    // Create Echo Realm FPV
    this.echoRealmFPV = new EchoRealmFPV(
      this.scene,
      this.camera,
      this.controls,
      this.particleSystem,
      8, // gridSize
      1.5, // cellSize
      this.container
    );
    
    // Initialize Echo Realm FPV with level
    this.echoRealmFPV.initializeEchoRealm(this.currentLevel);
    
    // Reset player state
    this.player = { health: 3, energy: 0, keys: 0 };
    
    // Reset game state
    this.gameOver = false;
    this.gameCompleted = false;
    
    // Play ambient sound
    this.audioManager.playSound(AudioEventType.AMBIENT);
    
    // Position player at start position
    const gridOffset = (8 * 1.5) / 2 - 1.5 / 2;
    const startX = this.currentLevel.start.x * 1.5 - gridOffset;
    const startZ = this.currentLevel.start.z * 1.5 - gridOffset;
    
    this.controls.getObject().position.set(startX, 1.8, startZ);
    
    // Show level message
    if (this.currentLevel.message) {
      this.messageCallback(this.currentLevel.message, 5000);
    }
  }
  
  // Clear the current level
  private clearLevel(): void {
    // Remove all meshes except camera and lights
    const objectsToRemove: THREE.Object3D[] = [];
    
    this.scene.traverse((object) => {
      // Keep camera, lights, and specific objects
      if (
        object instanceof THREE.PerspectiveCamera ||
        object instanceof THREE.AmbientLight ||
        object instanceof THREE.DirectionalLight ||
        object === this.controls.getObject()
      ) {
        return;
      }
      
      // Queue for removal
      objectsToRemove.push(object);
    });
    
    // Remove objects
    objectsToRemove.forEach(object => {
      this.scene.remove(object);
      
      // Dispose geometry and materials
      if (object instanceof THREE.Mesh) {
        if (object.geometry) {
          object.geometry.dispose();
        }
        
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        } else if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        }
      }
    });
    
    // Dispose Echo Realm FPV
    if (this.echoRealmFPV) {
      this.echoRealmFPV.dispose();
      this.echoRealmFPV = null;
    }
  }
  
  // Start game loop
  private startGameLoop(): void {
    const animate = (time: number) => {
      this.animationFrameId = requestAnimationFrame(animate);
      
      // Skip updates if game is paused
      if (this.paused) {
        return;
      }
      
      // Update Echo Realm FPV
      if (this.echoRealmFPV) {
        this.echoRealmFPV.update(time, 16.7); // Assuming ~60fps
      }
      
      // Update particle system
      this.particleSystem.update(time);
      
      // Render scene
      this.renderer.render(this.scene, this.camera);
    };
    
    this.animationFrameId = requestAnimationFrame(animate);
  }
  
  // Handle game over
  private handleGameOver(): void {
    this.gameOver = true;
    this.paused = true;
    
    // Play game over sound
    this.audioManager.playSound(AudioEventType.GAME_OVER);
    
    // Show game over message
    this.messageCallback("GAME OVER - Your connection to the Echo Realm has been lost.", 5000);
  }
  
  // Handle level completion
  private handleLevelComplete(): void {
    // Check if there are more levels
    if (this.currentLevelIndex < this.levels.length - 1) {
      // Play level complete sound
      this.audioManager.playSound(AudioEventType.LEVEL_COMPLETE);
      
      // Show completion message
      this.messageCallback("Level Complete! Advancing to the next challenge...", 3000);
      
      // Load next level after delay
      setTimeout(() => {
        this.initializeLevel(this.currentLevelIndex + 1);
      }, 3000);
    } else {
      // All levels complete
      this.gameCompleted = true;
      
      // Play game complete sound
      this.audioManager.playSound(AudioEventType.LEVEL_COMPLETE);
      
      // Show completion message
      this.messageCallback("Congratulations! You have mastered the Echo Realm and harmonized with its resonance.", 5000);
    }
  }
  
  // Restart the current level
  private restartLevel(): void {
    if (this.currentLevel) {
      this.initializeLevel(this.currentLevelIndex);
    }
  }
  
  // Lock pointer to enable controls
  public lockControls(): void {
    this.controls.lock();
  }
  
  // Get player state
  public getPlayerState(): { health: number; energy: number; keys: number } {
    return this.player;
  }
  
  // Dispose resources
  public dispose(): void {
    // Stop animation loop
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    // Dispose Echo Realm FPV
    if (this.echoRealmFPV) {
      this.echoRealmFPV.dispose();
    }
    
    // Dispose particle system
    this.particleSystem.dispose();
    
    // Dispose audio manager
    this.audioManager.dispose();
    
    // Remove renderer from container
    if (this.renderer && this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
    
    // Dispose renderer
    this.renderer.dispose();
    
    // Remove event listeners
    window.removeEventListener('resize', () => {});
    document.removeEventListener('pointerlockchange', () => {});
  }
}