import * as THREE from 'three';
import { LevelDefinition, TileType, PowerUpType, EnemyType } from '../types/game-types';
import { PlayerController } from './player-controller';
import { EnemyController } from './enemy-controller';
import { ParticleSystem } from './particle-system';
import { AudioManager } from './audio-manager';
import { AudioEventType, ParticleEffectType } from '../types/game-types';

export class LevelManager {
  private scene: THREE.Scene;
  private playerController: PlayerController;
  private enemyController: EnemyController;
  private particleSystem: ParticleSystem;
  private audioManager: AudioManager;
  private currentLevel!: LevelDefinition;
  private gridSize: number;
  private cellSize: number;
  private tiles: (THREE.Mesh | null)[][] = [];
  private specialObjects: Map<string, THREE.Mesh> = new Map();
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
    
    // Create timer element
    this.createTimerElement();
  }

  public getPlayerController(): PlayerController {
    return this.playerController;
  }

  // Initialize a level
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
    this.enemyController.initializeEnemies(level.enemies);
    
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
    
    // Play background music
    this.audioManager.playSound(AudioEventType.AMBIENT);
  }

  // Create level geometry
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

  // Create path tile
  private createPathTile(x: number, z: number, posX: number, posZ: number): void {
    const geometry = new THREE.BoxGeometry(
      this.cellSize - 0.2,
      0.2,
      this.cellSize - 0.2
    );
    
    const material = new THREE.MeshStandardMaterial({
      color: 0x3b0764,
      metalness: 0.5,
      roughness: 0.2,
      emissive: 0x3b0764,
      emissiveIntensity: 0.2,
    });
    
    const tile = new THREE.Mesh(geometry, material);
    tile.position.set(posX, 0, posZ);
    tile.castShadow = true;
    tile.receiveShadow = true;
    this.scene.add(tile);
    
    this.tiles[z][x] = tile;
  }

  // Create goal tile
  private createGoalTile(x: number, z: number, posX: number, posZ: number): void {
    // Create base tile
    const geometry = new THREE.BoxGeometry(
      this.cellSize - 0.2,
      0.2,
      this.cellSize - 0.2
    );
    
    const material = new THREE.MeshStandardMaterial({
      color: 0x60a5fa,
      metalness: 0.7,
      roughness: 0.2,
      emissive: 0x60a5fa,
      emissiveIntensity: 0.4,
    });
    
    const tile = new THREE.Mesh(geometry, material);
    tile.position.set(posX, 0, posZ);
    tile.castShadow = true;
    tile.receiveShadow = true;
    this.scene.add(tile);
    
    this.tiles[z][x] = tile;
    
    // Create glow effect
    const glowGeometry = new THREE.BoxGeometry(
      this.cellSize - 0.2 + 0.3,
      0.1,
      this.cellSize - 0.2 + 0.3
    );
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.7,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.set(posX, -0.05, posZ);
    this.scene.add(glow);
    
    // Store reference to the glow
    this.specialObjects.set(`goal_glow_${x}_${z}`, glow);
    
    // Add a floating symbol
    const symbolGeo = new THREE.TorusGeometry(0.3, 0.05, 16, 32);
    const symbolMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
    });
    
    const symbol = new THREE.Mesh(symbolGeo, symbolMat);
    symbol.position.set(posX, 0.5, posZ);
    symbol.rotation.x = Math.PI / 2;
    this.scene.add(symbol);
    
    // Store reference to the symbol
    this.specialObjects.set(`goal_symbol_${x}_${z}`, symbol);
    
    // Animate the goal symbol
    const animate = () => {
      requestAnimationFrame(animate);
      
      const time = Date.now() * 0.001;
      symbol.position.y = 0.5 + Math.sin(time * 2) * 0.1;
      symbol.rotation.z = time * 0.5;
      
      glow.scale.x = 1.0 + Math.sin(time * 1.5) * 0.2;
      glow.scale.z = 1.0 + Math.sin(time * 1.5) * 0.2;
    };
    
    animate();
  }

  // Create key tile
  private createKeyTile(x: number, z: number, posX: number, posZ: number): void {
    // Create base tile (path)
    this.createPathTile(x, z, posX, posZ);
    
    // Add key object
    const keyGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.4, 8);
    const keyMat = new THREE.MeshStandardMaterial({
      color: 0xffdd00,
      metalness: 1.0,
      roughness: 0.3,
      emissive: 0xffdd00,
      emissiveIntensity: 0.5,
    });
    
    const key = new THREE.Mesh(keyGeo, keyMat);
    key.position.set(posX, 0.4, posZ);
    key.rotation.x = Math.PI / 2;
    this.scene.add(key);
    
    // Store reference to the key
    const keyId = this.currentLevel.keys?.findIndex(k => k.x === x && k.z === z) ?? -1;
    this.specialObjects.set(`key_${keyId}`, key);
    
    // Animate the key
    const animate = () => {
      requestAnimationFrame(animate);
      
      const time = Date.now() * 0.001;
      key.position.y = 0.4 + Math.sin(time * 2) * 0.1;
      key.rotation.z = time;
    };
    
    animate();
  }

  // Create switch tile
  private createSwitchTile(x: number, z: number, posX: number, posZ: number): void {
    // Create base tile (path)
    this.createPathTile(x, z, posX, posZ);
    
    // Add switch object
    const switchGeo = new THREE.BoxGeometry(0.6, 0.1, 0.6);
    const switchMat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      metalness: 0.7,
      roughness: 0.2,
      emissive: 0x00ffff,
      emissiveIntensity: 0.3,
    });
    
    const switchObj = new THREE.Mesh(switchGeo, switchMat);
    switchObj.position.set(posX, 0.15, posZ);
    this.scene.add(switchObj);
    
    // Store reference to the switch
    const switchId = this.currentLevel.switches?.findIndex(s => s.position.x === x && s.position.z === z) ?? -1;
    this.specialObjects.set(`switch_${switchId}`, switchObj);
    this.switchStates.set(`switch_${switchId}`, false);
    
    // Animate the switch
    const animate = () => {
      requestAnimationFrame(animate);
      
      const time = Date.now() * 0.001;
      const isActive = this.switchStates.get(`switch_${switchId}`);
      
      if (isActive) {
        switchObj.material.color.setHex(0xff0000);
        switchObj.position.y = 0.1;
      } else {
        switchObj.material.color.setHex(0x00ffff);
        switchObj.position.y = 0.15 + Math.sin(time * 3) * 0.05;
      }
    };
    
    animate();
  }

  // Create trap tile
  private createTrapTile(x: number, z: number, posX: number, posZ: number): void {
    // Create base tile (slightly different color)
    const geometry = new THREE.BoxGeometry(
      this.cellSize - 0.2,
      0.2,
      this.cellSize - 0.2
    );
    
    const material = new THREE.MeshStandardMaterial({
      color: 0x4c0519,
      metalness: 0.5,
      roughness: 0.3,
      emissive: 0x4c0519,
      emissiveIntensity: 0.2,
    });
    
    const tile = new THREE.Mesh(geometry, material);
    tile.position.set(posX, 0, posZ);
    tile.castShadow = true;
    tile.receiveShadow = true;
    this.scene.add(tile);
    
    this.tiles[z][x] = tile;
    
    // Add warning markings
    const warningGeo = new THREE.PlaneGeometry(0.8, 0.8);
    const warningMat = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    
    const warning = new THREE.Mesh(warningGeo, warningMat);
    warning.position.set(posX, 0.11, posZ);
    warning.rotation.x = -Math.PI / 2;
    this.scene.add(warning);
    
    // Create X marking
    const lineMat = new THREE.LineBasicMaterial({ color: 0xff0000 });
    
    const points1 = [];
    points1.push(new THREE.Vector3(-0.3, 0, -0.3));
    points1.push(new THREE.Vector3(0.3, 0, 0.3));
    
    const points2 = [];
    points2.push(new THREE.Vector3(0.3, 0, -0.3));
    points2.push(new THREE.Vector3(-0.3, 0, 0.3));
    
    const line1Geo = new THREE.BufferGeometry().setFromPoints(points1);
    const line2Geo = new THREE.BufferGeometry().setFromPoints(points2);
    
    const line1 = new THREE.Line(line1Geo, lineMat);
    const line2 = new THREE.Line(line2Geo, lineMat);
    
    warning.add(line1);
    warning.add(line2);
    
    // Store reference
    this.specialObjects.set(`trap_${x}_${z}`, warning);
    
    // Animate the warning
    const animate = () => {
      requestAnimationFrame(animate);
      
      const time = Date.now() * 0.001;
      warningMat.opacity = 0.3 + Math.sin(time * 5) * 0.2;
    };
    
    animate();
  }

  // Create power-up tile
  private createPowerUpTile(x: number, z: number, posX: number, posZ: number): void {
    // Create base tile (path)
    this.createPathTile(x, z, posX, posZ);
    
    // Determine power-up type from level definition
    const powerUp = this.currentLevel.powerUps?.find(p => p.position.x === x && p.position.z === z);
    const powerUpType = powerUp ? powerUp.type : PowerUpType.SPEED; // Default to speed
    
    let powerUpColor = 0xffffff;
    let powerUpGeometry;
    
    switch (powerUpType) {
      case PowerUpType.SPEED:
        powerUpColor = 0x00ffff; // Cyan
        powerUpGeometry = new THREE.OctahedronGeometry(0.25);
        break;
      case PowerUpType.INVISIBILITY:
        powerUpColor = 0xaaaaff; // Light blue
        powerUpGeometry = new THREE.DodecahedronGeometry(0.25);
        break;
      case PowerUpType.SHIELD:
        powerUpColor = 0x00ff88; // Green
        powerUpGeometry = new THREE.IcosahedronGeometry(0.25);
        break;
      case PowerUpType.TELEPORT:
        powerUpColor = 0x8800ff; // Purple
        powerUpGeometry = new THREE.TetrahedronGeometry(0.25);
        break;
    }
    
    const powerUpMat = new THREE.MeshStandardMaterial({
      color: powerUpColor,
      metalness: 0.8,
      roughness: 0.2,
      emissive: powerUpColor,
      emissiveIntensity: 0.5,
    });
    
    const powerUpObj = new THREE.Mesh(powerUpGeometry, powerUpMat);
    powerUpObj.position.set(posX, 0.4, posZ);
    this.scene.add(powerUpObj);
    
    // Add glow effect
    const glowGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: powerUpColor,
      transparent: true,
      opacity: 0.3,
    });
    
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.copy(powerUpObj.position);
    this.scene.add(glow);
    
    // Store references
    const powerUpId = this.currentLevel.powerUps?.findIndex(p => p.position.x === x && p.position.z === z) ?? -1;
    this.specialObjects.set(`powerup_${powerUpId}`, powerUpObj);
    this.specialObjects.set(`powerup_glow_${powerUpId}`, glow);
    
    // Animate the power-up
    const animate = () => {
      requestAnimationFrame(animate);
      
      const time = Date.now() * 0.001;
      powerUpObj.position.y = 0.4 + Math.sin(time * 2) * 0.1;
      powerUpObj.rotation.y = time;
      powerUpObj.rotation.x = time * 0.5;
      
      glow.position.copy(powerUpObj.position);
      glow.scale.set(
        1.0 + Math.sin(time * 3) * 0.1,
        1.0 + Math.sin(time * 3) * 0.1,
        1.0 + Math.sin(time * 3) * 0.1
      );
    };
    
    animate();
  }

  // Create teleport tile
  private createTeleportTile(x: number, z: number, posX: number, posZ: number): void {
    // Create base tile (different color)
    const geometry = new THREE.BoxGeometry(
      this.cellSize - 0.2,
      0.2,
      this.cellSize - 0.2
    );
    
    const material = new THREE.MeshStandardMaterial({
      color: 0x8800ff,
      metalness: 0.7,
      roughness: 0.2,
      emissive: 0x8800ff,
      emissiveIntensity: 0.3,
    });
    
    const tile = new THREE.Mesh(geometry, material);
    tile.position.set(posX, 0, posZ);
    tile.castShadow = true;
    tile.receiveShadow = true;
    this.scene.add(tile);
    
    this.tiles[z][x] = tile;
    
    // Add portal effect
    const portalGeo = new THREE.TorusGeometry(0.4, 0.1, 16, 32);
    const portalMat = new THREE.MeshStandardMaterial({
      color: 0x8800ff,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x8800ff,
      emissiveIntensity: 0.5,
    });
    
    const portal = new THREE.Mesh(portalGeo, portalMat);
    portal.position.set(posX, 0.25, posZ);
    portal.rotation.x = Math.PI / 2;
    this.scene.add(portal);
    
    // Store reference
    const teleportId = this.currentLevel.teleports?.findIndex(
      t => t.entrance.x === x && t.entrance.z === z || t.exit.x === x && t.exit.z === z
    ) ?? -1;
    this.specialObjects.set(`teleport_${teleportId}_${x}_${z}`, portal);
    
    // Animate the portal
    const animate = () => {
      requestAnimationFrame(animate);
      
      const time = Date.now() * 0.001;
      portal.rotation.z = time;
      portal.scale.set(
        1.0 + Math.sin(time * 2) * 0.1,
        1.0 + Math.sin(time * 2) * 0.1,
        1.0
      );
    };
    
    animate();
  }

  // Create barrier tile
  private createBarrierTile(x: number, z: number, posX: number, posZ: number): void {
    // Create base tile (slightly darker)
    const geometry = new THREE.BoxGeometry(
      this.cellSize - 0.2,
      0.2,
      this.cellSize - 0.2
    );
    
    const material = new THREE.MeshStandardMaterial({
      color: 0x1c1917,
      metalness: 0.5,
      roughness: 0.4,
      emissive: 0x1c1917,
      emissiveIntensity: 0.1,
    });
    
    const tile = new THREE.Mesh(geometry, material);
    tile.position.set(posX, 0, posZ);
    tile.castShadow = true;
    tile.receiveShadow = true;
    this.scene.add(tile);
    
    this.tiles[z][x] = tile;
    
    // Add barrier object
    const barrierGeo = new THREE.BoxGeometry(0.8, 1.0, 0.8);
    const barrierMat = new THREE.MeshStandardMaterial({
      color: 0xff3300,
      metalness: 0.6,
      roughness: 0.2,
      emissive: 0xff3300,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.8,
    });
    
    const barrier = new THREE.Mesh(barrierGeo, barrierMat);
    barrier.position.set(posX, 0.5, posZ);
    this.scene.add(barrier);
    
    // Store reference
    const barrierId = this.currentLevel.barriers?.findIndex(b => b.x === x && b.z === z) ?? -1;
    this.specialObjects.set(`barrier_${barrierId}`, barrier);
    
    // Animate the barrier
    const animate = () => {
      requestAnimationFrame(animate);
      
      const time = Date.now() * 0.001;
      const isActive = this.barrierStates[barrierId];
      
      if (isActive) {
        barrier.visible = true;
        barrier.position.y = 0.5 + Math.sin(time * 2) * 0.1;
        barrier.rotation.y = time * 0.5;
        barrierMat.opacity = 0.7 + Math.sin(time * 3) * 0.2;
      } else {
        barrier.visible = false;
      }
    };
    
    animate();
  }

  // Create energy tile
  private createEnergyTile(x: number, z: number, posX: number, posZ: number): void {
    // Create base tile (path)
    this.createPathTile(x, z, posX, posZ);
    
    // Add energy object
    const energyGeo = new THREE.SphereGeometry(0.25, 16, 16);
    const energyMat = new THREE.MeshStandardMaterial({
      color: 0xaa00ff,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0xaa00ff,
      emissiveIntensity: 0.6,
    });
    
    const energy = new THREE.Mesh(energyGeo, energyMat);
    energy.position.set(posX, 0.4, posZ);
    this.scene.add(energy);
    
    // Add glow effect
    const glowGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xaa00ff,
      transparent: true,
      opacity: 0.4,
    });
    
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.copy(energy.position);
    this.scene.add(glow);
    
    // Store references
    this.specialObjects.set(`energy_${x}_${z}`, energy);
    this.specialObjects.set(`energy_glow_${x}_${z}`, glow);
    
    // Animate the energy
    const animate = () => {
      requestAnimationFrame(animate);
      
      const time = Date.now() * 0.001;
      energy.position.y = 0.4 + Math.sin(time * 3) * 0.1;
      energy.rotation.y = time * 2;
      
      glow.position.copy(energy.position);
      glow.scale.set(
        1.0 + Math.sin(time * 4) * 0.2,
        1.0 + Math.sin(time * 4) * 0.2,
        1.0 + Math.sin(time * 4) * 0.2
      );
    };
    
    animate();
  }

  // Create timer element
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

  // Update timer display
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

  // Update level
  public update(deltaTime: number): void {
    // Update timer if active
    if (this.timeLimit > 0) {
      this.updateTimerDisplay();
    }
    
    // Check for player interactions
    this.checkPlayerInteractions();
    
    // Update player controller
    this.playerController.update(Date.now(), deltaTime);
    
    // Update enemy controller
    this.enemyController.update(this.playerController.getPlayerState(), Date.now(), deltaTime);
    
    // Check for enemy collisions
    this.checkEnemyCollisions();
  }
  
  // Check player interactions with level elements
  private checkPlayerInteractions(): void {
    const player = this.playerController.getPlayerState();
    const playerGridPos = player.gridPosition;
    
    // Check tile at player's position
    const tileType = this.grid[playerGridPos.z][playerGridPos.x];
    
    switch (tileType) {
      case TileType.GOAL:
        this.handleGoalReached();
        break;
      case TileType.KEY:
        this.handleKeyCollected(playerGridPos.x, playerGridPos.z);
        break;
      case TileType.SWITCH:
        this.handleSwitchActivated(playerGridPos.x, playerGridPos.z);
        break;
      case TileType.TRAP:
        this.handleTrapTriggered();
        break;
      case TileType.POWER_UP:
        this.handlePowerUpCollected(playerGridPos.x, playerGridPos.z);
        break;
      case TileType.TELEPORT:
        this.handleTeleport(playerGridPos.x, playerGridPos.z);
        break;
      case TileType.ENERGY:
        this.handleEnergyCollected(playerGridPos.x, playerGridPos.z);
        break;
    }
  }
  
  // Handle player reaching the goal
  private handleGoalReached(): void {
    // Check if level requires energy to complete
    if (this.currentLevel.energyRequired && this.playerController.getPlayerState().energy < this.currentLevel.energyRequired) {
      this.messageCallback(`Need ${this.currentLevel.energyRequired} energy to proceed`, 2000);
      return;
    }
    
    // Play level complete sound
    this.audioManager.playSound(AudioEventType.LEVEL_COMPLETE);
    
    // Show level complete particle effect
    const player = this.playerController.getPlayerState();
    this.particleSystem.createEffect(
      ParticleEffectType.LEVEL_COMPLETE,
      player.position.clone()
    );
    
    // Show completion message
    this.messageCallback("Level Complete!", 3000);
    
    // Call completion callback after a delay
    setTimeout(() => {
      this.completionCallback();
    }, 2000);
  }
  
  // Handle key collection
  private handleKeyCollected(x: number, z: number): void {
    // Find the key index
    const keyId = this.currentLevel.keys?.findIndex(k => k.x === x && k.z === z) ?? -1;
    
    // Check if key is already collected
    if (keyId >= 0 && !this.keyCollected[keyId]) {
      // Mark key as collected
      this.keyCollected[keyId] = true;
      
      // Remove key object from scene
      const keyObj = this.specialObjects.get(`key_${keyId}`);
      if (keyObj) {
        this.scene.remove(keyObj);
        this.specialObjects.delete(`key_${keyId}`);
      }
      
      // Update player state
      this.playerController.collectItem(TileType.KEY, { x, z });
      
      // Play sound
      this.audioManager.playSound(AudioEventType.PLAYER_COLLECT);
      
      // Create particle effect
      const player = this.playerController.getPlayerState();
      this.particleSystem.createEffect(
        ParticleEffectType.KEY_COLLECT,
        player.position.clone()
      );
      
      // Update grid type to regular path
      this.grid[z][x] = TileType.PATH;
      
      // Open all barriers if all keys collected
      if (this.keyCollected.every(k => k)) {
        this.openAllBarriers();
      }
      
      // Show message
      this.messageCallback("Key collected!", 1500);
    }
  }
  
  // Handle switch activation
  private handleSwitchActivated(x: number, z: number): void {
    // Find the switch
    const switchId = this.currentLevel.switches?.findIndex(s => s.position.x === x && s.position.z === z) ?? -1;
    
    // Check if switch exists and not already activated
    if (switchId >= 0 && !this.switchStates.get(`switch_${switchId}`)) {
      // Mark switch as activated
      this.switchStates.set(`switch_${switchId}`, true);
      
      // Play sound
      this.audioManager.playSound(AudioEventType.SWITCH_ACTIVATE);
      
      // Create particle effect
      const switchPosition = new THREE.Vector3();
      const switchObj = this.specialObjects.get(`switch_${switchId}`);
      if (switchObj) {
        switchPosition.copy(switchObj.position);
      } else {
        // Calculate position if object not found
        const gridOffset = (this.gridSize * this.cellSize) / 2 - this.cellSize / 2;
        switchPosition.set(
          x * this.cellSize - gridOffset,
          0.2,
          z * this.cellSize - gridOffset
        );
      }
      
      this.particleSystem.createEffect(
        ParticleEffectType.SWITCH_ACTIVATE,
        switchPosition
      );
      
      // Toggle the associated barrier
      const switchData = this.currentLevel.switches?.[switchId];
      if (switchData) {
        const barrierId = this.currentLevel.barriers?.findIndex(
          b => b.x === switchData.target.x && b.z === switchData.target.z
        ) ?? -1;
        
        if (barrierId >= 0) {
          this.toggleBarrier(barrierId);
        }
      }
      
      // Show message
      this.messageCallback("Switch activated!", 1500);
    }
  }
  
  // Handle trap triggering
  private handleTrapTriggered(): void {
    // Only trigger trap if player doesn't have shield
    if (!this.playerController.getPlayerState().isShielded) {
      // Damage player
      const isGameOver = this.playerController.damage();
      
      // Play sound
      this.audioManager.playSound(AudioEventType.PLAYER_DAMAGE);
      
      // Create particle effect
      const player = this.playerController.getPlayerState();
      this.particleSystem.createEffect(
        ParticleEffectType.PLAYER_DAMAGE,
        player.position.clone()
      );
      
      // Check for game over
      if (isGameOver) {
        this.gameOverCallback();
      } else {
        // Show message
        this.messageCallback("Trap triggered!", 1500);
      }
    } else {
      // Shield absorbed damage
      this.messageCallback("Shield absorbed trap damage!", 1500);
    }
  }
  
  // Handle power-up collection
  private handlePowerUpCollected(x: number, z: number): void {
    // Find the power-up
    const powerUp = this.currentLevel.powerUps?.find(p => p.position.x === x && p.position.z === z);
    const powerUpId = this.currentLevel.powerUps?.findIndex(p => p.position.x === x && p.position.z === z) ?? -1;
    
    // Check if power-up exists and not already collected
    if (powerUp && powerUpId >= 0 && this.specialObjects.has(`powerup_${powerUpId}`)) {
      // Remove power-up object from scene
      const powerUpObj = this.specialObjects.get(`powerup_${powerUpId}`);
      const glowObj = this.specialObjects.get(`powerup_glow_${powerUpId}`);
      
      if (powerUpObj) {
        this.scene.remove(powerUpObj);
        this.specialObjects.delete(`powerup_${powerUpId}`);
      }
      
      if (glowObj) {
        this.scene.remove(glowObj);
        this.specialObjects.delete(`powerup_glow_${powerUpId}`);
      }
      
      // Add power-up to player
      this.playerController.addPowerUp(powerUp.type, 15000); // 15 seconds duration
      
      // Play sound
      this.audioManager.playSound(AudioEventType.PLAYER_POWERUP);
      
      // Create particle effect
      const player = this.playerController.getPlayerState();
      this.particleSystem.createEffect(
        ParticleEffectType.POWERUP_COLLECT,
        player.position.clone()
      );
      
      // Update grid type to regular path
      this.grid[z][x] = TileType.PATH;
      
      // Show message based on power-up type
      let message = "";
      switch (powerUp.type) {
        case PowerUpType.SPEED:
          message = "Speed power-up collected!";
          break;
        case PowerUpType.INVISIBILITY:
          message = "Invisibility power-up collected!";
          break;
        case PowerUpType.SHIELD:
          message = "Shield power-up collected!";
          break;
        case PowerUpType.TELEPORT:
          message = "Teleport power-up collected!";
          break;
      }
      
      this.messageCallback(message, 2000);
    }
  }
  
  // Handle teleportation
  private handleTeleport(x: number, z: number): void {
    // Find the teleport
    const teleport = this.currentLevel.teleports?.find(
      t => (t.entrance.x === x && t.entrance.z === z) || (t.exit.x === x && t.exit.z === z)
    );
    
    const teleportId = this.currentLevel.teleports?.findIndex(
      t => (t.entrance.x === x && t.entrance.z === z) || (t.exit.x === x && t.exit.z === z)
    ) ?? -1;
    
    // Check if teleport exists and not on cooldown
    if (teleport && teleportId >= 0 && !this.teleportUsed[teleportId]) {
      // Determine destination (entrance -> exit or exit -> entrance)
      let dest;
      if (teleport.entrance.x === x && teleport.entrance.z === z) {
        dest = teleport.exit;
      } else {
        dest = teleport.entrance;
      }
      
      // Set teleport on cooldown
      this.teleportUsed[teleportId] = true;
      setTimeout(() => {
        this.teleportUsed[teleportId] = false;
      }, 2000); // 2 second cooldown
      
      // Play sound
      this.audioManager.playSound(AudioEventType.PLAYER_TELEPORT);
      
      // Create particle effect at both locations
      const player = this.playerController.getPlayerState();
      this.particleSystem.createEffect(
        ParticleEffectType.TELEPORT,
        player.position.clone()
      );
      
      // Calculate destination position
      const gridOffset = (this.gridSize * this.cellSize) / 2 - this.cellSize / 2;
      const destPosition = new THREE.Vector3(
        dest.x * this.cellSize - gridOffset,
        0.5,
        dest.z * this.cellSize - gridOffset
      );
      
      // Create particle effect at destination
      this.particleSystem.createEffect(
        ParticleEffectType.TELEPORT,
        destPosition
      );
      
      // Teleport player (with a slight delay)
      setTimeout(() => {
        this.playerController.initializePlayer(dest);
      }, 100);
      
      // Show message
      this.messageCallback("Teleported!", 1500);
    }
  }
  
  // Handle energy collection
  private handleEnergyCollected(x: number, z: number): void {
    // Check if energy is not already collected
    if (this.specialObjects.has(`energy_${x}_${z}`)) {
      // Remove energy object from scene
      const energyObj = this.specialObjects.get(`energy_${x}_${z}`);
      const glowObj = this.specialObjects.get(`energy_glow_${x}_${z}`);
      
      if (energyObj) {
        this.scene.remove(energyObj);
        this.specialObjects.delete(`energy_${x}_${z}`);
      }
      
      if (glowObj) {
        this.scene.remove(glowObj);
        this.specialObjects.delete(`energy_glow_${x}_${z}`);
      }
      
      // Update player state
      this.playerController.collectItem(TileType.ENERGY, { x, z });
      
      // Play sound
      this.audioManager.playSound(AudioEventType.PLAYER_COLLECT);
      
      // Create particle effect
      const player = this.playerController.getPlayerState();
      this.particleSystem.createEffect(
        ParticleEffectType.POWERUP_COLLECT,
        player.position.clone()
      );
      
      // Update grid type to regular path
      this.grid[z][x] = TileType.PATH;
      
      // Show message
      this.messageCallback("Energy collected!", 1500);
    }
  }
  
  // Check for enemy collisions
  private checkEnemyCollisions(): void {
    const player = this.playerController.getPlayerState();
    
    // Skip if player is invisible
    if (player.isInvisible) return;
    
    // Check for collision with enemies
    if (this.enemyController.checkPlayerCollision(player)) {
      // Only take damage if not shielded
      if (!player.isShielded) {
        // Damage player
        const isGameOver = this.playerController.damage();
        
        // Play sound
        this.audioManager.playSound(AudioEventType.PLAYER_DAMAGE);
        
        // Create particle effect
        this.particleSystem.createEffect(
          ParticleEffectType.PLAYER_DAMAGE,
          player.position.clone()
        );
        
        // Check for game over
        if (isGameOver) {
          this.gameOverCallback();
        } else {
          // Set temporary invincibility
          this.playerController.setInvincibility(2000); // 2 seconds
          
          // Show message
          this.messageCallback("Enemy hit you!", 1500);
        }
      } else {
        // Shield absorbed damage
        this.messageCallback("Shield protected you!", 1500);
      }
    }
  }
  
  // Toggle a barrier
  private toggleBarrier(barrierId: number): void {
    if (barrierId >= 0 && barrierId < this.barrierStates.length) {
      // Toggle state
      this.barrierStates[barrierId] = !this.barrierStates[barrierId];
      
      // Update grid type if barrier is removed
      if (!this.barrierStates[barrierId]) {
        // Find barrier position
        const barrier = this.currentLevel.barriers?.[barrierId];
        if (barrier) {
          this.grid[barrier.z][barrier.x] = TileType.PATH;
        }
      }
    }
  }
  
  // Open all barriers
  private openAllBarriers(): void {
    for (let i = 0; i < this.barrierStates.length; i++) {
      this.barrierStates[i] = false;
      
      // Update grid type
      const barrier = this.currentLevel.barriers?.[i];
      if (barrier) {
        this.grid[barrier.z][barrier.x] = TileType.PATH;
      }
    }
    
    // Show message
    this.messageCallback("All barriers opened!", 2000);
  }
  
  // Clean up level
  private cleanupLevel(): void {
    // Remove all objects from scene
    for (let z = 0; z < this.tiles.length; z++) {
      for (let x = 0; x < this.tiles[z].length; x++) {
        const tile = this.tiles[z][x];
        if (tile) {
          if (tile.geometry) tile.geometry.dispose();
          if (tile.material instanceof THREE.Material) tile.material.dispose();
          this.scene.remove(tile);
        }
      }
    }
    
    // Clear tiles array
    this.tiles = [];
    
    // Clean up special objects
    for (const [key, obj] of this.specialObjects.entries()) {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material instanceof THREE.Material) obj.material.dispose();
      this.scene.remove(obj);
    }
    
    // Clear special objects map
    this.specialObjects.clear();
    
    // Reset switch states
    this.switchStates.clear();
    
    // Dispose player and enemy controllers
    this.playerController.dispose();
    this.enemyController.dispose();
  }
  
  // Handle keyboard events
  public handleKeyDown(key: string): void {
    // Pass to player controller
    this.playerController.handleKeyDown(key);
    
    // Additional game controls
    if (key === 'r' || key === 'R') {
      // Restart level
      this.initializeLevel(this.currentLevel);
    }
  }
  
  // Handle key up events
  public handleKeyUp(key: string): void {
    // Pass to player controller
    this.playerController.handleKeyUp(key);
  }
  
  // Dispose all resources
  public dispose(): void {
    // Clean up level
    this.cleanupLevel();
    
    // Remove timer element
    if (this.timerElement && this.timerElement.parentNode) {
      this.timerElement.parentNode.removeChild(this.timerElement);
      this.timerElement = null;
    }
  }
}