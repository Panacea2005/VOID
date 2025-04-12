import * as THREE from 'three';
import { LevelDefinition, TileType, PowerUpType, EnemyType, AudioEventType, ParticleEffectType } from '../types/game-types';
import { PlayerController } from './player-controller';
import { EnemyController } from './enemy-controller';
import { ParticleSystem } from './particle-system';
import { AudioManager } from './audio-manager';
import { EchoRealmManager } from './echo-realm-manager';
import { getAllRealms, getRealm, RealmDefinition } from './realms';
import { RealmType } from './realm-system';

/**
 * RealmManager replaces the LevelManager to handle the realm-based game structure
 * It manages the current realm, its levels, and the transitions between realms
 */
export class RealmManager {
  private scene: THREE.Scene;
  private playerController: PlayerController;
  private enemyController: EnemyController;
  private particleSystem: ParticleSystem;
  private audioManager: AudioManager;
  
  // Specialized realm managers
  private echoRealmManager: EchoRealmManager | null = null;
  // TODO: Add other realm managers as they're implemented
  
  private currentRealm!: RealmDefinition;
  private currentLevel!: LevelDefinition;
  private currentLevelIndex: number = 0;
  private completedLevels: Set<number> = new Set();
  private unlockedRealms: Set<string> = new Set(['echo']); // Echo realm is always unlocked initially
  private totalEnergyCollected: number = 0;
  
  private gridSize: number;
  private cellSize: number;
  private tiles: (THREE.Mesh | null)[][] = [];
  private specialObjects: Map<string, THREE.Object3D> = new Map();
  private switchStates: Map<string, boolean> = new Map();
  private grid: TileType[][] = [];
  private keyCollected: boolean[] = [];
  private teleportUsed: boolean[] = [];
  private barrierStates: boolean[] = [];
  private completionCallback: () => void;
  private gameOverCallback: () => void;
  private messageCallback: (message: string, duration: number) => void;
  private levelStartTime: number = 0;
  private timeLimit: number = 0;
  private timerElement: HTMLElement | null = null;
  
  constructor(
    scene: THREE.Scene, 
    particleSystem: ParticleSystem,
    audioManager: AudioManager,
    completionCallback: () => void,
    gameOverCallback: () => void,
    messageCallback: (message: string, duration: number) => void
  ) {
    this.scene = scene;
    this.particleSystem = particleSystem;
    this.audioManager = audioManager;
    this.completionCallback = completionCallback;
    this.gameOverCallback = gameOverCallback;
    this.messageCallback = messageCallback;
    
    // Default values
    this.gridSize = 8;
    this.cellSize = 1.5;
    
    // Create empty grid for initial state
    this.grid = Array(this.gridSize).fill(0).map(() => Array(this.gridSize).fill(TileType.EMPTY));
    
    // Initialize controllers
    this.playerController = new PlayerController(scene, this.gridSize, this.cellSize, this.grid);
    this.enemyController = new EnemyController(scene, this.gridSize, this.cellSize, this.grid);
    
    // Initialize realm managers
    this.initializeRealmManagers();
    
    // Create timer element
    this.createTimerElement();
  }
  
  /**
   * Get the player controller instance
   */
  public getPlayerController(): PlayerController {
    return this.playerController;
  }
  
  /**
   * Initialize realm managers
   */
  private initializeRealmManagers(): void {
    // Initialize EchoRealmManager
    this.echoRealmManager = new EchoRealmManager(
      this.scene, 
      this.particleSystem, 
      this.gridSize, 
      this.cellSize
    );
    
    // TODO: Initialize other realm managers as they're implemented
  }
  
  /**
   * Initialize a realm and its first level
   */
  public initializeRealm(realmId: string): void {
    const realm = getRealm(realmId);
    if (!realm || realm.levels.length === 0) {
      console.error(`Realm ${realmId} not found or has no levels`);
      return;
    }
    
    this.currentRealm = realm;
    this.currentLevelIndex = 0;
    
    // Initialize the first level of the realm
    this.initializeLevel(realm.levels[0]);
    
    // Set up realm-specific environment
    this.setupRealmEnvironment(realm);
    
    // Show realm welcome message
    this.messageCallback(`Entering ${realm.name}: ${realm.description}`, 5000);
    
    // Play realm enter sound
    this.audioManager.playSound(AudioEventType.AMBIENT);
  }
  
  /**
   * Set up environment settings for the realm
   */
  private setupRealmEnvironment(realm: RealmDefinition): void {
    const settings = realm.environmentSettings;
    
    // Clear any existing environment
    this.clearEnvironment();
    
    // Set fog
    if (settings.fogColor) {
      this.scene.fog = new THREE.FogExp2(settings.fogColor, 0.03);
    }
    
    // Set ambient light
    if (settings.ambientLightColor) {
      const ambientLight = new THREE.AmbientLight(
        settings.ambientLightColor, 
        1.0
      );
      this.scene.add(ambientLight);
    }
    
    // Add realm-specific effects
    switch (realm.type) {
      case RealmType.ECHO:
        if (this.echoRealmManager) {
          // Initialize Echo Realm features
          const currentLevel = this.currentLevel;
          this.echoRealmManager.initializeEchoRealm(currentLevel);
        }
        break;
      case RealmType.SHADOW:
        // Add dim point lights for shadow realm
        this.addDimLights();
        break;
      case RealmType.CRYSTAL:
        // Add crystal light beams
        this.addCrystalLightBeams();
        break;
      case RealmType.VOID:
        // Add floating particles and gravity distortion
        this.addVoidDistortions();
        break;
      case RealmType.NEXUS:
        // Add nexus realm effects (combination of all realms)
        this.addNexusEffects();
        break;
    }
  }
  
  /**
   * Clear environment elements
   */
  private clearEnvironment(): void {
    // Remove fog
    this.scene.fog = null;
    
    // Remove all lights except the default ones
    this.scene.children = this.scene.children.filter(child => {
      if (child instanceof THREE.Light && child.userData.isEnvironment) {
        return false;
      }
      return true;
    });
  }
  
  /**
   * Add dim lights for shadow realm
   */
  private addDimLights(): void {
    // Add a few dim point lights scattered around
    for (let i = 0; i < 3; i++) {
      const light = new THREE.PointLight(0x333366, 0.5, 10);
      light.position.set(
        (Math.random() - 0.5) * this.gridSize * this.cellSize,
        2 + Math.random(),
        (Math.random() - 0.5) * this.gridSize * this.cellSize
      );
      light.userData.isEnvironment = true;
      this.scene.add(light);
      
      // Create a slight glow effect at the light position
      const glowGeometry = new THREE.SphereGeometry(0.2, 16, 16);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x333366,
        transparent: true,
        opacity: 0.7
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.copy(light.position);
      this.scene.add(glow);
      
      // Animate the glow
      const animate = () => {
        requestAnimationFrame(animate);
        const time = Date.now() * 0.001;
        glow.scale.set(
          1 + Math.sin(time) * 0.2,
          1 + Math.sin(time) * 0.2,
          1 + Math.sin(time) * 0.2
        );
      };
      animate();
    }
  }
  
  /**
   * Add crystal light beams for crystal realm
   */
  private addCrystalLightBeams(): void {
    // Add a few crystal light beams
    for (let i = 0; i < 4; i++) {
      // Create beam cylinder
      const beamGeometry = new THREE.CylinderGeometry(0.1, 0.1, 10, 8);
      const beamMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.3
      });
      const beam = new THREE.Mesh(beamGeometry, beamMaterial);
      
      // Position beam
      beam.position.set(
        (Math.random() - 0.5) * this.gridSize * this.cellSize,
        5, // Half height
        (Math.random() - 0.5) * this.gridSize * this.cellSize
      );
      
      // Random rotation
      beam.rotation.set(
        Math.random() * 0.2,
        Math.random() * Math.PI * 2,
        Math.random() * 0.2
      );
      
      this.scene.add(beam);
      
      // Add light at top of beam
      const light = new THREE.PointLight(0x00ffff, 1, 8);
      light.position.copy(beam.position);
      light.position.y += 5; // Move to top of beam
      light.userData.isEnvironment = true;
      this.scene.add(light);
      
      // Animate the beam
      const animate = () => {
        requestAnimationFrame(animate);
        const time = Date.now() * 0.001;
        beamMaterial.opacity = 0.2 + Math.sin(time * 2) * 0.1;
        light.intensity = 0.8 + Math.sin(time * 2) * 0.2;
      };
      
      animate();
    }
  }
  
  /**
   * Add void distortions for void realm
   */
  private addVoidDistortions(): void {
    // Create floating particles
    const particleCount = 200;
    const particlesGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      particlePositions[i3] = (Math.random() - 0.5) * this.gridSize * this.cellSize * 2;
      particlePositions[i3 + 1] = Math.random() * 5;
      particlePositions[i3 + 2] = (Math.random() - 0.5) * this.gridSize * this.cellSize * 2;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
      color: 0x8800ff,
      size: 0.1,
      transparent: true,
      opacity: 0.7
    });
    
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    this.scene.add(particles);
    
    // Animate particles
    const animate = () => {
      requestAnimationFrame(animate);
      const time = Date.now() * 0.001;
      
      const positions = particlesGeometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        positions[i3 + 1] += Math.sin(time + i * 0.1) * 0.005;
        
        // Wrap particles that go out of bounds
        if (positions[i3 + 1] > 10) positions[i3 + 1] = 0;
        if (positions[i3 + 1] < 0) positions[i3 + 1] = 10;
      }
      
      particlesGeometry.attributes.position.needsUpdate = true;
    };
    
    animate();
    
    // Add a few void lights
    for (let i = 0; i < 3; i++) {
      const light = new THREE.PointLight(0x8800ff, 0.8, 12);
      light.position.set(
        (Math.random() - 0.5) * this.gridSize * this.cellSize,
        3 + Math.random() * 3,
        (Math.random() - 0.5) * this.gridSize * this.cellSize
      );
      light.userData.isEnvironment = true;
      this.scene.add(light);
    }
  }
  
  /**
   * Add Nexus realm effects (combines elements from all realms)
   */
  private addNexusEffects(): void {
    // Add elements from each realm
    this.addDimLights(); // Shadow realm
    this.addCrystalLightBeams(); // Crystal realm
    this.addVoidDistortions(); // Void realm
    
    // Add nexus-specific effects - portal in the center
    const portalGeometry = new THREE.TorusGeometry(2, 0.3, 16, 32);
    const portalMaterial = new THREE.MeshStandardMaterial({
      color: 0xff00ff,
      emissive: 0xff00ff,
      emissiveIntensity: 0.8,
      metalness: 0.9,
      roughness: 0.1,
      side: THREE.DoubleSide
    });
    
    const portal = new THREE.Mesh(portalGeometry, portalMaterial);
    portal.position.set(0, 5, 0);
    portal.rotation.x = Math.PI / 2;
    this.scene.add(portal);
    
    // Add light inside portal
    const portalLight = new THREE.PointLight(0xff00ff, 1.5, 10);
    portalLight.position.copy(portal.position);
    portalLight.userData.isEnvironment = true;
    this.scene.add(portalLight);
    
    // Animate portal
    const animate = () => {
      requestAnimationFrame(animate);
      const time = Date.now() * 0.001;
      portal.rotation.z = time * 0.5;
      portal.scale.set(
        1 + Math.sin(time) * 0.1,
        1 + Math.sin(time) * 0.1,
        1
      );
      portalLight.intensity = 1.5 + Math.sin(time * 2) * 0.5;
    };
    animate();
  }
  
  /**
   * Initialize a level in the current realm
   */
  public initializeLevel(level: LevelDefinition): void {
    // Clean up existing level
    this.cleanupLevel();
    
    // Set new level
    this.currentLevel = level;
    this.gridSize = level.grid.length;
    
    // Convert level grid to TileType enum grid
    this.grid = level.grid.map(row => 
      row.map(tile => tile as TileType)
    );
    
    // Create the level geometry
    this.createLevel();
    
    // Initialize player at start position
    this.playerController = new PlayerController(this.scene, this.gridSize, this.cellSize, this.grid);
    const playerState = this.playerController.initializePlayer(level.start);
    
    // Initialize enemies
    this.enemyController = new EnemyController(this.scene, this.gridSize, this.cellSize, this.grid);
    this.enemyController.initializeEnemies(level.enemies || []);
    
    // Initialize collection tracking arrays
    if (level.keys) this.keyCollected = Array(level.keys.length).fill(false);
    if (level.teleports) this.teleportUsed = Array(level.teleports.length).fill(false);
    if (level.barriers) this.barrierStates = Array(level.barriers.length).fill(true); // Barriers start active
    
    // Show level message if provided
    if (level.message) {
      this.messageCallback(level.message, 5000);
    }
    
    // Set up time limit if provided
    this.timeLimit = level.timeLimit || 0;
    this.levelStartTime = Date.now();
    this.updateTimerDisplay();
    
    // Initialize realm-specific features
    this.initializeRealmFeatures(level);
    
    // Play background music
    this.audioManager.playSound(AudioEventType.AMBIENT);
  }
  
  /**
   * Initialize realm-specific features for the level
   */
  private initializeRealmFeatures(level: LevelDefinition): void {
    if (!level.realmProperties) return;
    
    switch (level.realmProperties.type) {
      case "echo":
        if (this.echoRealmManager) {
          this.echoRealmManager.initializeEchoRealm(level);
        }
        break;
      case "shadow":
        // TODO: Initialize shadow realm features
        break;
      case "crystal":
        // TODO: Initialize crystal realm features
        break;
      case "void":
        // TODO: Initialize void realm features
        break;
      case "nexus":
        // TODO: Initialize nexus realm features
        break;
    }
  }
  
  /**
   * Move to the next level in the current realm, or to the next realm if at the end
   */
  public nextLevel(): void {
    // Mark current level as completed
    this.completedLevels.add(this.currentLevel.id);
    
    // Check if there are more levels in the current realm
    if (this.currentLevelIndex < this.currentRealm.levels.length - 1) {
      // Move to the next level in the current realm
      this.currentLevelIndex++;
      this.initializeLevel(this.currentRealm.levels[this.currentLevelIndex]);
      
      // Show transition message
      this.messageCallback(`Level ${this.currentLevelIndex + 1}: ${this.currentLevel.name}`, 3000);
    } else {
      // We've completed all levels in the current realm
      
      // Mark current realm as completed
      this.unlockedRealms.add(this.currentRealm.id);
      
      // Check for newly unlocked realms
      this.checkForUnlockedRealms();
      
      // Play realm completion sound
      this.audioManager.playSound(AudioEventType.REALM_COMPLETE);
      
      // Show realm completion message
      this.messageCallback(`You have mastered the ${this.currentRealm.name}!`, 5000);
      
      // Call completion callback after a delay to return to realm selection
      setTimeout(() => {
        this.completionCallback();
      }, 5000);
    }
  }
  
  /**
   * Check if new realms are unlocked based on completed realms and energy
   */
  private checkForUnlockedRealms(): void {
    const allRealms = getAllRealms();
    
    for (const realm of allRealms) {
      // Skip already unlocked realms
      if (this.unlockedRealms.has(realm.id)) continue;
      
      // Check unlock criteria
      if (realm.unlockCriteria) {
        // Check required realms
        const hasRequiredRealms = realm.unlockCriteria.requiredRealms.every(
          requiredRealm => this.unlockedRealms.has(requiredRealm)
        );
        
        // Check energy requirement
        const hasEnoughEnergy = !realm.unlockCriteria.requiredEnergy ||
                               this.totalEnergyCollected >= realm.unlockCriteria.requiredEnergy;
        
        if (hasRequiredRealms && hasEnoughEnergy) {
          // Unlock the realm
          this.unlockedRealms.add(realm.id);
          
          // Show notification
          this.messageCallback(`New Realm Unlocked: ${realm.name}!`, 5000);
        }
      }
    }
  }
  
  /**
   * Get all unlocked realms
   */
  public getUnlockedRealms(): string[] {
    return Array.from(this.unlockedRealms);
  }
  
  /**
   * Get completion status of all levels
   */
  public getCompletedLevels(): number[] {
    return Array.from(this.completedLevels);
  }
  
  /**
   * Get total energy collected
   */
  public getTotalEnergy(): number {
    return this.totalEnergyCollected;
  }
  
  /**
   * Create timer element
   */
  private createTimerElement(): void {
    // Create timer element if it doesn't exist
    if (!this.timerElement) {
      this.timerElement = document.createElement('div');
      this.timerElement.style.position = 'absolute';
      this.timerElement.style.top = '80px';
      this.timerElement.style.left = '50%';
      this.timerElement.style.transform = 'translateX(-50%)';
      this.timerElement.style.padding = '5px 10px';
      this.timerElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      this.timerElement.style.border = '1px solid #a855f7';
      this.timerElement.style.color = '#ec4899';
      this.timerElement.style.fontFamily = 'monospace';
      this.timerElement.style.fontSize = '18px';
      this.timerElement.style.zIndex = '1000';
      this.timerElement.style.display = 'none';
      
      document.body.appendChild(this.timerElement);
    }
  }
  
  /**
   * Update timer display
   */
  private updateTimerDisplay(): void {
    if (!this.timerElement || this.timeLimit <= 0) {
      if (this.timerElement) {
        this.timerElement.style.display = 'none';
      }
      return;
    }
    
    this.timerElement.style.display = 'block';
    
    const currentTime = Date.now();
    const elapsedTime = Math.floor((currentTime - this.levelStartTime) / 1000);
    const remainingTime = Math.max(0, this.timeLimit - elapsedTime);
    
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    
    this.timerElement.textContent = `TIME: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    
    // Change color when time is running low
    if (remainingTime <= 10) {
      this.timerElement.style.color = '#ff0000';
    } else if (remainingTime <= 30) {
      this.timerElement.style.color = '#ff8800';
    } else {
      this.timerElement.style.color = '#ec4899';
    }
    
    // Game over if time runs out
    if (remainingTime <= 0) {
      this.gameOverCallback();
    }
  }
  
  /**
   * Update game state
   */
  public update(deltaTime: number): void {
    // Update controllers
    this.playerController.update(Date.now(), deltaTime);
    this.enemyController.update(this.playerController.getPlayerState(), Date.now(), deltaTime);
    
    // Update realm-specific features
    this.updateRealmFeatures(Date.now());
    
    // Update timer
    this.updateTimerDisplay();
    
    // Check if player reached the goal
    this.checkGoalReached();
    
    // Check player collision with enemies
    this.checkEnemyCollision();
    
    // Check for powerup collection
    this.checkPowerUpCollection();
    
    // Check for key collection
    this.checkKeyCollection();
    
    // Check for teleport usage
    this.checkTeleportUsage();
    
    // Check for switch activation
    this.checkSwitchActivation();
  }
  
  /**
   * Update realm-specific features
   */
  private updateRealmFeatures(currentTime: number): void {
    // Update Echo Realm features
    if (this.currentRealm.type === RealmType.ECHO && this.echoRealmManager) {
      this.echoRealmManager.update(currentTime);
      
      // Register player position with echo realm
      const playerPos = this.playerController.getPlayerState().gridPosition;
      this.echoRealmManager.registerPlayerStep(playerPos.x, playerPos.z);
    }
    
    // Other realm updates would go here
  }
  
  /**
   * Check if player reached the goal
   */
  private checkGoalReached(): void {
    const playerPos = this.playerController.getPlayerState().gridPosition;
    
    // Check if the player is on a goal tile
    if (this.grid[playerPos.z][playerPos.x] === TileType.GOAL) {
      // Check if level requires energy
      if (this.currentLevel.energyRequired && 
          this.playerController.getPlayerState().energy < this.currentLevel.energyRequired) {
        // Not enough energy
        this.messageCallback(`You need ${this.currentLevel.energyRequired} energy to progress!`, 3000);
        return;
      }
      
      // Level completed!
      console.log("Goal reached!");
      
      // Create particles at goal
      this.particleSystem.createEffect(
        ParticleEffectType.LEVEL_COMPLETE,
        this.playerController.getPlayerState().position
      );
      
      // Play completion sound
      this.audioManager.playSound(AudioEventType.LEVEL_COMPLETE);
      
      // Update total energy collected
      this.totalEnergyCollected += this.playerController.getPlayerState().energy;
      
      // Go to next level
      this.nextLevel();
    }
  }
  
  /**
   * Check for collision with enemies
   */
  private checkEnemyCollision(): void {
    if (this.enemyController.checkPlayerCollision(this.playerController.getPlayerState())) {
      console.log("Player collided with enemy!");
      
      // Create particles
      this.particleSystem.createEffect(
        ParticleEffectType.PLAYER_DAMAGE,
        this.playerController.getPlayerState().position
      );
      
      // Play damage sound
      this.audioManager.playSound(AudioEventType.PLAYER_DAMAGE);
      
      // Damage player
      const isDead = this.playerController.damage();
      
      if (isDead) {
        // Game over
        this.gameOverCallback();
      }
    }
  }
  
  /**
   * Check for powerup collection
   */
  private checkPowerUpCollection(): void {
    const playerPos = this.playerController.getPlayerState().gridPosition;
    
    // Check if the player is on a powerup tile
    if (this.grid[playerPos.z][playerPos.x] === TileType.POWER_UP) {
      // Find the power up in the level definition
      const powerUp = this.currentLevel.powerUps?.find(
        p => p.position.x === playerPos.x && p.position.z === playerPos.z
      );
      
      if (powerUp) {
        console.log("Power up collected:", PowerUpType[powerUp.type]);
        
        // Create particles
        this.particleSystem.createEffect(
          ParticleEffectType.POWERUP_COLLECT,
          this.playerController.getPlayerState().position,
          { color: this.getPowerUpColor(powerUp.type) }
        );
        
        // Play powerup sound
        this.audioManager.playSound(AudioEventType.PLAYER_POWERUP);
        
        // Add power up to player
        this.playerController.addPowerUp(powerUp.type, 10000); // 10 seconds duration
        
        // Clear the grid tile
        this.grid[playerPos.z][playerPos.x] = TileType.PATH;
        
        // Remove the visual from the scene
        if (this.tiles[playerPos.z][playerPos.x]) {
          this.scene.remove(this.tiles[playerPos.z][playerPos.x]!);
          this.tiles[playerPos.z][playerPos.x] = null;
        }
      }
    }
  }
  
  /**
   * Get color for power up type
   */
  private getPowerUpColor(type: PowerUpType): number {
    switch (type) {
      case PowerUpType.SPEED:
        return 0x00ffff; // Cyan
      case PowerUpType.INVISIBILITY:
        return 0xaaaaff; // Light blue
      case PowerUpType.SHIELD:
        return 0x00ff88; // Green
      case PowerUpType.TELEPORT:
        return 0x8800ff; // Purple
      default:
        return 0xffffff; // White
    }
  }
  
  /**
   * Check for key collection
   */
  private checkKeyCollection(): void {
    const playerPos = this.playerController.getPlayerState().gridPosition;
    
    // Check if the player is on a key tile
    if (this.grid[playerPos.z][playerPos.x] === TileType.KEY) {
      // Find the key index
      const keyIndex = this.currentLevel.keys?.findIndex(
        k => k.x === playerPos.x && k.z === playerPos.z
      );
      
      if (keyIndex !== undefined && keyIndex >= 0) {
        console.log("Key collected:", keyIndex);
        
        // Create particles
        this.particleSystem.createEffect(
          ParticleEffectType.KEY_COLLECT,
          this.playerController.getPlayerState().position,
          { color: 0xffdd00 } // Gold color
        );
        
        // Play collect sound
        this.audioManager.playSound(AudioEventType.PLAYER_COLLECT);
        
        // Mark key as collected
        this.keyCollected[keyIndex] = true;
        
        // Update player keys
        this.playerController.collectItem(TileType.KEY, playerPos);
        
        // Clear the grid tile
        this.grid[playerPos.z][playerPos.x] = TileType.PATH;
        
        // Remove the visual from the scene
        if (this.tiles[playerPos.z][playerPos.x]) {
          this.scene.remove(this.tiles[playerPos.z][playerPos.x]!);
          this.tiles[playerPos.z][playerPos.x] = null;
        }
      }
    }
  }
  
  /**
   * Check for teleport usage
   */
  private checkTeleportUsage(): void {
    const playerPos = this.playerController.getPlayerState().gridPosition;
    
    // Check if the player is on a teleport tile
    if (this.grid[playerPos.z][playerPos.x] === TileType.TELEPORT) {
      // Find the teleport in the level definition
      const teleportIndex = this.currentLevel.teleports?.findIndex(
        t => t.entrance.x === playerPos.x && t.entrance.z === playerPos.z
      );
      
      if (teleportIndex !== undefined && teleportIndex >= 0 && !this.teleportUsed[teleportIndex]) {
        console.log("Teleport used:", teleportIndex);
        
        // Create teleport effect
        this.particleSystem.createEffect(
          ParticleEffectType.TELEPORT,
          this.playerController.getPlayerState().position
        );
        
        // Play teleport sound
        this.audioManager.playSound(AudioEventType.TELEPORT_USE);
        
        // Mark teleport as used if it's one-time use
        this.teleportUsed[teleportIndex] = true;
        
        // Get destination
        const destination = this.currentLevel.teleports![teleportIndex].exit;
        
        // Calculate position in world space
        const gridOffset = (this.gridSize * this.cellSize) / 2 - this.cellSize / 2;
        const destX = destination.x * this.cellSize - gridOffset;
        const destZ = destination.z * this.cellSize - gridOffset;
        
        // Update player position
        this.playerController.getPlayerState().position.set(destX, 0.5, destZ);
        this.playerController.getPlayerState().gridPosition = { x: destination.x, z: destination.z };
        
        // Create teleport effect at destination
        setTimeout(() => {
          this.particleSystem.createEffect(
            ParticleEffectType.TELEPORT,
            new THREE.Vector3(destX, 0.5, destZ)
          );
        }, 100);
      }
    }
  }
  
  /**
   * Check for switch activation
   */
  private checkSwitchActivation(): void {
    const playerPos = this.playerController.getPlayerState().gridPosition;
    
    // Check if the player is on a switch tile
    if (this.grid[playerPos.z][playerPos.x] === TileType.SWITCH) {
      // Find the switch in the level definition
      const switchObj = this.currentLevel.switches?.find(
        s => s.position.x === playerPos.x && s.position.z === playerPos.z
      );
      
      if (switchObj) {
        const switchKey = `${playerPos.x}_${playerPos.z}`;
        
        // Only activate if not already active
        if (!this.switchStates.get(switchKey)) {
          console.log("Switch activated:", switchKey);
          
          // Create particles
          this.particleSystem.createEffect(
            ParticleEffectType.SWITCH_ACTIVATE,
            this.playerController.getPlayerState().position
          );
          
          // Play switch sound
          this.audioManager.playSound(AudioEventType.SWITCH_ACTIVATE);
          
          // Mark switch as active
          this.switchStates.set(switchKey, true);
          
          // Toggle barrier at target position
          const targetX = switchObj.target.x;
          const targetZ = switchObj.target.z;
          
          // Find the barrier index
          const barrierIndex = this.currentLevel.barriers?.findIndex(
            b => b.x === targetX && b.z === targetZ
          );
          
          if (barrierIndex !== undefined && barrierIndex >= 0) {
            // Toggle barrier state
            this.barrierStates[barrierIndex] = !this.barrierStates[barrierIndex];
            
            // Update grid
            this.grid[targetZ][targetX] = this.barrierStates[barrierIndex] ? 
              TileType.BARRIER : TileType.PATH;
            
            // Update visual
            if (this.tiles[targetZ][targetX]) {
              this.scene.remove(this.tiles[targetZ][targetX]!);
              this.tiles[targetZ][targetX] = null;
            }
            
            if (this.barrierStates[barrierIndex]) {
              // Recreate barrier
              this.createBarrierTile(targetX, targetZ, 
                targetX * this.cellSize - (this.gridSize * this.cellSize) / 2 + this.cellSize / 2,
                targetZ * this.cellSize - (this.gridSize * this.cellSize) / 2 + this.cellSize / 2
              );
            } else {
              // Create path tile
              this.createPathTile(targetX, targetZ,
                targetX * this.cellSize - (this.gridSize * this.cellSize) / 2 + this.cellSize / 2,
                targetZ * this.cellSize - (this.gridSize * this.cellSize) / 2 + this.cellSize / 2
              );
            }
            
            // Play barrier toggle sound
            this.audioManager.playSound(AudioEventType.BARRIER_TOGGLE);
            
            // Create effect at barrier
            const barrierX = targetX * this.cellSize - (this.gridSize * this.cellSize) / 2 + this.cellSize / 2;
            const barrierZ = targetZ * this.cellSize - (this.gridSize * this.cellSize) / 2 + this.cellSize / 2;
            
            this.particleSystem.createEffect(
              ParticleEffectType.SWITCH_ACTIVATE,
              new THREE.Vector3(barrierX, 0.5, barrierZ),
              { color: this.barrierStates[barrierIndex] ? 0xff0000 : 0x00ff00 }
            );
          }
        }
      }
    }
  }
  
  /**
   * Create level geometry based on the grid
   */
  private createLevel(): void {
    // Calculate grid offset to center it
    const gridOffset = (this.gridSize * this.cellSize) / 2 - this.cellSize / 2;
    
    // Initialize tiles array
    this.tiles = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(null));
    
    // Create grid cells
    for (let z = 0; z < this.gridSize; z++) {
      for (let x = 0; x < this.gridSize; x++) {
        const tileType = this.grid[z][x];
        
        // Skip empty tiles
        if (tileType === TileType.EMPTY) {
          this.tiles[z][x] = null;
          continue;
        }
        
        // Position adjusted to center the grid
        const posX = x * this.cellSize - gridOffset;
        const posZ = z * this.cellSize - gridOffset;
        
        // Create different tiles based on type
        switch (tileType) {
          case TileType.PATH:
            this.createPathTile(x, z, posX, posZ);
            break;
          case TileType.GOAL:
            this.createGoalTile(x, z, posX, posZ);
            break;
          case TileType.KEY:
            this.createKeyTile(x, z, posX, posZ);
            break;
          case TileType.SWITCH:
            this.createSwitchTile(x, z, posX, posZ);
            break;
          case TileType.TRAP:
            this.createTrapTile(x, z, posX, posZ);
            break;
          case TileType.POWER_UP:
            this.createPowerUpTile(x, z, posX, posZ);
            break;
          case TileType.TELEPORT:
            this.createTeleportTile(x, z, posX, posZ);
            break;
          case TileType.BARRIER:
            this.createBarrierTile(x, z, posX, posZ);
            break;
          case TileType.ENERGY:
            this.createEnergyTile(x, z, posX, posZ);
            break;
        }
      }
    }
    
    // Create grid lines
    const gridLineHelper = new THREE.GridHelper(
      this.gridSize * this.cellSize,
      this.gridSize,
      0x444444,
      0x333333
    );
    gridLineHelper.position.y = -0.1;
    this.scene.add(gridLineHelper);
  }
  
  /**
   * Create a path tile
   */
  private createPathTile(x: number, z: number, posX: number, posZ: number): void {
    const geometry = new THREE.BoxGeometry(this.cellSize - 0.1, 0.2, this.cellSize - 0.1);
    const material = new THREE.MeshStandardMaterial({
      color: 0x3b0764, // Dark purple
      metalness: 0.3,
      roughness: 0.7
    });
    
    const tile = new THREE.Mesh(geometry, material);
    tile.position.set(posX, -0.1, posZ);
    tile.receiveShadow = true;
    
    this.scene.add(tile);
    this.tiles[z][x] = tile;
  }
  
  /**
   * Create a goal tile
   */
  private createGoalTile(x: number, z: number, posX: number, posZ: number): void {
    const geometry = new THREE.BoxGeometry(this.cellSize - 0.1, 0.2, this.cellSize - 0.1);
    const material = new THREE.MeshStandardMaterial({
      color: 0xec4899, // Pink
      emissive: 0xec4899,
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2
    });
    
    const tile = new THREE.Mesh(geometry, material);
    tile.position.set(posX, -0.1, posZ);
    tile.receiveShadow = true;
    
    this.scene.add(tile);
    this.tiles[z][x] = tile;
    
    // Add portal effect
    const portalGeometry = new THREE.TorusGeometry(this.cellSize / 3, 0.05, 16, 32);
    const portalMaterial = new THREE.MeshStandardMaterial({
      color: 0xec4899,
      emissive: 0xec4899,
      emissiveIntensity: 0.8,
      metalness: 0.9,
      roughness: 0.1,
      side: THREE.DoubleSide
    });
    
    const portal = new THREE.Mesh(portalGeometry, portalMaterial);
    portal.position.set(posX, 0.2, posZ);
    portal.rotation.x = Math.PI / 2;
    this.scene.add(portal);
    
    // Store reference for cleanup
    this.specialObjects.set(`portal_${x}_${z}`, portal);
    
    // Animate portal
    const animate = () => {
      requestAnimationFrame(animate);
      const time = Date.now() * 0.001;
      portal.rotation.z = time;
      portal.position.y = 0.2 + Math.sin(time * 2) * 0.1;
    };
    animate();
  }
  
  /**
   * Create a key tile
   */
  private createKeyTile(x: number, z: number, posX: number, posZ: number): void {
    // First create base path tile
    this.createPathTile(x, z, posX, posZ);
    
    // Create key object
    const keyGeometry = new THREE.BoxGeometry(this.cellSize / 4, 0.1, this.cellSize / 4);
    const keyMaterial = new THREE.MeshStandardMaterial({
      color: 0xffdd00, // Gold
      emissive: 0xffdd00,
      emissiveIntensity: 0.5,
      metalness: 0.9,
      roughness: 0.1
    });
    
    const key = new THREE.Mesh(keyGeometry, keyMaterial);
    key.position.set(posX, 0.2, posZ);
    this.scene.add(key);
    
    // Store reference for cleanup
    this.specialObjects.set(`key_${x}_${z}`, key);
    
    // Animate key
    const animate = () => {
      requestAnimationFrame(animate);
      const time = Date.now() * 0.001;
      key.rotation.y = time;
      key.position.y = 0.2 + Math.sin(time * 2) * 0.05;
    };
    animate();
  }
  
  /**
   * Create a switch tile
   */
  private createSwitchTile(x: number, z: number, posX: number, posZ: number): void {
    // First create base path tile
    this.createPathTile(x, z, posX, posZ);
    
    // Create switch object
    const switchGeometry = new THREE.CylinderGeometry(this.cellSize / 4, this.cellSize / 4, 0.1, 16);
    const switchMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ffff, // Cyan
      emissive: 0x00ffff,
      emissiveIntensity: 0.5,
      metalness: 0.7,
      roughness: 0.3
    });
    
    const switchObj = new THREE.Mesh(switchGeometry, switchMaterial);
    switchObj.position.set(posX, 0.1, posZ);
    this.scene.add(switchObj);
    
    // Store reference for cleanup
    this.specialObjects.set(`switch_${x}_${z}`, switchObj);
  }
  
  /**
   * Create a trap tile
   */
  private createTrapTile(x: number, z: number, posX: number, posZ: number): void {
    const geometry = new THREE.BoxGeometry(this.cellSize - 0.1, 0.2, this.cellSize - 0.1);
    const material = new THREE.MeshStandardMaterial({
      color: 0xff0000, // Red
      metalness: 0.6,
      roughness: 0.4
    });
    
    const tile = new THREE.Mesh(geometry, material);
    tile.position.set(posX, -0.1, posZ);
    tile.receiveShadow = true;
    
    this.scene.add(tile);
    this.tiles[z][x] = tile;
    
    // Add spikes
    const spikeGroup = new THREE.Group();
    spikeGroup.position.set(posX, 0, posZ);
    
    for (let i = 0; i < 5; i++) {
      const spikeGeometry = new THREE.ConeGeometry(0.05, 0.2, 4);
      const spikeMaterial = new THREE.MeshStandardMaterial({
        color: 0x999999, // Silver
        metalness: 0.9,
        roughness: 0.1
      });
      
      const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
      
      // Position spikes in different parts of the tile
      const offsetX = (Math.random() - 0.5) * (this.cellSize - 0.2);
      const offsetZ = (Math.random() - 0.5) * (this.cellSize - 0.2);
      
      spike.position.set(offsetX, 0, offsetZ);
      spike.rotation.x = Math.PI; // Point up
      
      spikeGroup.add(spike);
    }
    
    this.scene.add(spikeGroup);
    
    // Store reference for cleanup
    this.specialObjects.set(`trap_${x}_${z}`, spikeGroup);
    
    // Animate spikes
    const animate = () => {
      requestAnimationFrame(animate);
      const time = Date.now() * 0.001;
      
      // Make spikes move up and down
      spikeGroup.children.forEach((spike, index) => {
        spike.position.y = -0.1 + Math.max(0, Math.sin(time * 2 + index) * 0.15);
      });
    };
    animate();
  }
  
  /**
   * Create a power-up tile
   */
  private createPowerUpTile(x: number, z: number, posX: number, posZ: number): void {
    // First create base path tile
    this.createPathTile(x, z, posX, posZ);
    
    // Find power-up type from level definition
    const powerUp = this.currentLevel.powerUps?.find(
      p => p.position.x === x && p.position.z === z
    );
    
    if (!powerUp) return;
    
    // Choose color based on power-up type
    let color = 0xffffff;
    
    switch (powerUp.type) {
      case PowerUpType.SPEED:
        color = 0x00ffff; // Cyan
        break;
      case PowerUpType.INVISIBILITY:
        color = 0xaaaaff; // Light blue
        break;
      case PowerUpType.SHIELD:
        color = 0x00ff88; // Green
        break;
      case PowerUpType.TELEPORT:
        color = 0x8800ff; // Purple
        break;
    }
    
    // Create power-up object
    const powerUpGeometry = new THREE.SphereGeometry(this.cellSize / 5, 16, 16);
    const powerUpMaterial = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2,
      transparent: true,
      opacity: 0.8
    });
    
    const powerUpObj = new THREE.Mesh(powerUpGeometry, powerUpMaterial);
    powerUpObj.position.set(posX, 0.3, posZ);
    this.scene.add(powerUpObj);
    
    // Store reference for cleanup
    this.specialObjects.set(`powerup_${x}_${z}`, powerUpObj);
    
    // Animate power-up
    const animate = () => {
      requestAnimationFrame(animate);
      const time = Date.now() * 0.001;
      powerUpObj.rotation.y = time;
      powerUpObj.position.y = 0.3 + Math.sin(time * 3) * 0.1;
      powerUpMaterial.opacity = 0.6 + Math.sin(time * 2) * 0.2;
    };
    animate();
  }
  
  /**
   * Create a teleport tile
   */
  private createTeleportTile(x: number, z: number, posX: number, posZ: number): void {
    const geometry = new THREE.BoxGeometry(this.cellSize - 0.1, 0.2, this.cellSize - 0.1);
    const material = new THREE.MeshStandardMaterial({
      color: 0x8800ff, // Purple
      emissive: 0x8800ff,
      emissiveIntensity: 0.3,
      metalness: 0.7,
      roughness: 0.3
    });
    
    const tile = new THREE.Mesh(geometry, material);
    tile.position.set(posX, -0.1, posZ);
    tile.receiveShadow = true;
    
    this.scene.add(tile);
    this.tiles[z][x] = tile;
    
    // Add teleport swirl
    const swirlGeometry = new THREE.RingGeometry(this.cellSize / 6, this.cellSize / 3, 32);
    const swirlMaterial = new THREE.MeshBasicMaterial({
      color: 0x8800ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7
    });
    
    const swirl = new THREE.Mesh(swirlGeometry, swirlMaterial);
    swirl.position.set(posX, 0.1, posZ);
    swirl.rotation.x = -Math.PI / 2; // Lay flat
    
    this.scene.add(swirl);
    
    // Store reference for cleanup
    this.specialObjects.set(`teleport_${x}_${z}`, swirl);
    
    // Animate teleport swirl
    const animate = () => {
      requestAnimationFrame(animate);
      const time = Date.now() * 0.001;
      swirl.rotation.z = time * 2;
      swirl.scale.set(
        1 + Math.sin(time * 3) * 0.1,
        1 + Math.sin(time * 3) * 0.1,
        1
      );
    };
    animate();
  }
  
  /**
   * Create a barrier tile
   */
  private createBarrierTile(x: number, z: number, posX: number, posZ: number): void {
    const geometry = new THREE.BoxGeometry(this.cellSize - 0.1, 1.0, this.cellSize - 0.1);
    const material = new THREE.MeshStandardMaterial({
      color: 0xff0000, // Red
      emissive: 0xff0000,
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.8,
      metalness: 0.6,
      roughness: 0.4
    });
    
    const tile = new THREE.Mesh(geometry, material);
    tile.position.set(posX, 0.4, posZ);
    tile.castShadow = true;
    tile.receiveShadow = true;
    
    this.scene.add(tile);
    this.tiles[z][x] = tile;
    
    // Animate barrier
    const animate = () => {
      requestAnimationFrame(animate);
      const time = Date.now() * 0.001;
      
      if (material.opacity) {
        material.opacity = 0.7 + Math.sin(time * 2) * 0.1;
      }
    };
    animate();
  }
  
  /**
   * Create an energy tile
   */
  private createEnergyTile(x: number, z: number, posX: number, posZ: number): void {
    // First create base path tile
    this.createPathTile(x, z, posX, posZ);
    
    // Create energy crystal
    const energyGeometry = new THREE.OctahedronGeometry(this.cellSize / 5);
    const energyMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ff88, // Green
      emissive: 0x00ff88,
      emissiveIntensity: 0.7,
      metalness: 0.9,
      roughness: 0.1
    });
    
    const energy = new THREE.Mesh(energyGeometry, energyMaterial);
    energy.position.set(posX, 0.3, posZ);
    this.scene.add(energy);
    
    // Add glow effect
    const glowGeometry = new THREE.SphereGeometry(this.cellSize / 4);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.3
    });
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.copy(energy.position);
    this.scene.add(glow);
    
    // Store references for cleanup
    this.specialObjects.set(`energy_${x}_${z}`, energy);
    this.specialObjects.set(`energy_glow_${x}_${z}`, glow);
    
    // Animate energy crystal
    const animate = () => {
      requestAnimationFrame(animate);
      const time = Date.now() * 0.001;
      energy.rotation.y = time;
      energy.rotation.z = time * 0.5;
      energy.position.y = 0.3 + Math.sin(time * 2) * 0.05;
      
      // Pulse glow
      glow.scale.set(
        1 + Math.sin(time * 3) * 0.2,
        1 + Math.sin(time * 3) * 0.2,
        1 + Math.sin(time * 3) * 0.2
      );
    };
    animate();
  }
  
  /**
   * Clean up the current level
   */
  private cleanupLevel(): void {
    // Remove all tiles
    for (let z = 0; z < this.tiles.length; z++) {
      for (let x = 0; x < this.tiles[z].length; x++) {
        if (this.tiles[z][x]) {
          this.scene.remove(this.tiles[z][x]!);
          
          // Dispose geometry and material
          if (this.tiles[z][x]?.geometry) {
            this.tiles[z][x]!.geometry.dispose();
          }
          
          const material = this.tiles[z][x]!.material;
          if (material instanceof THREE.Material) {
            material.dispose();
          } else if (Array.isArray(material)) {
            material.forEach((mat) => mat.dispose());
          }
        }
      }
    }
    
    // Clear tiles array
    this.tiles = [];
    
    // Remove all special objects
    this.specialObjects.forEach((obj) => {
      this.scene.remove(obj);
      
      // Dispose geometry and material
      if (obj instanceof THREE.Mesh && obj.geometry) {
        obj.geometry.dispose();
      }
      
      if ('material' in obj) {
        if (obj.material instanceof THREE.Material) {
          obj.material.dispose();
        } else if (Array.isArray(obj.material)) {
          (obj.material as THREE.Material[]).forEach((material) => material.dispose());
        }
      }
    });
    
    // Clear special objects map
    this.specialObjects.clear();
    
    // Remove grid helper
    this.scene.children = this.scene.children.filter(child => {
      if (child instanceof THREE.GridHelper) {
        return false;
      }
      return true;
    });
    
    // Clean up player controller
    if (this.playerController) {
      this.playerController.dispose();
    }
    
    // Clean up enemy controller
    if (this.enemyController) {
      this.enemyController.dispose();
    }
    
    // Reset state tracking
    this.switchStates.clear();
    this.keyCollected = [];
    this.teleportUsed = [];
    this.barrierStates = [];
  }
  
  /**
   * Handle key down event
   */
  public handleKeyDown(key: string): void {
    // Pass to player controller
    this.playerController.handleKeyDown(key);
  }
  
  /**
   * Handle key up event
   */
  public handleKeyUp(key: string): void {
    // Pass to player controller
    this.playerController.handleKeyUp(key);
  }
  
  /**
   * Clean up all resources
   */
  public dispose(): void {
    // Clean up current level
    this.cleanupLevel();
    
    // Clean up realm managers
    if (this.echoRealmManager) {
      this.echoRealmManager.dispose();
    }
    
    // Remove timer element
    if (this.timerElement && this.timerElement.parentNode) {
      this.timerElement.parentNode.removeChild(this.timerElement);
    }
    
    // Clean up environment
    this.clearEnvironment();
  }
}