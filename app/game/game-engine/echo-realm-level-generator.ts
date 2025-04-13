import * as THREE from 'three';
import { LevelDefinition, EnemyType, PowerUpType, TileType } from '../types/game-types';

export class EchoRealmLevelGenerator {
  // Echo Realm Level 1: Memory Challenge
  public static createLevel1(): LevelDefinition {
    return {
      id: 1,
      name: "Echo Realm: Path of Memories",
      grid: [
        [1, 1, 1, 1, 1, 0, 0, 0],
        [0, 0, 0, 0, 1, 0, 0, 0],
        [0, 0, 0, 0, 1, 1, 1, 0],
        [0, 0, 0, 0, 0, 0, 1, 0],
        [0, 0, 0, 0, 0, 0, 1, 0],
        [0, 0, 1, 1, 1, 1, 1, 0],
        [0, 0, 1, 0, 0, 0, 0, 0],
        [0, 0, 2, 0, 0, 0, 0, 0],
      ],
      start: { x: 0, z: 0 },
      enemies: [],
      interactiveObjects: [
        {
          type: "memory_trigger",
          position: { x: 2, z: 5 }
        }
      ],
      message: "Welcome to the Echo Realm. In this world, your memories create echoes around you. Find the memory fragments and repeat their sequence.",
      timeLimit: 0, // No time limit for the first level
      realmProperties: {
        type: "echo",
        tileLifespan: 3000, // Time in ms before a tile disappears after being stepped on
        hasMirrors: true,
        hasEchoes: true,
        environment: {
          fogColor: 0x8080ff,
          ambientLightColor: 0x444466,
          particleColor: 0xaabbff,
        }
      }
    };
  }

  // Echo Realm Level 2: Reflection Puzzle
  public static createLevel2(): LevelDefinition {
    return {
      id: 2,
      name: "Echo Realm: Reflections",
      grid: [
        [1, 1, 0, 0, 0, 0, 0, 0],
        [1, 0, 0, 1, 1, 1, 0, 0],
        [1, 0, 0, 1, 0, 1, 0, 0],
        [1, 0, 1, 1, 0, 1, 0, 0],
        [0, 0, 0, 0, 0, 1, 0, 0],
        [0, 0, 1, 1, 1, 1, 0, 0],
        [0, 0, 1, 0, 0, 7, 0, 0],
        [0, 0, 2, 0, 0, 0, 0, 0],
      ],
      start: { x: 0, z: 0 },
      enemies: [],
      interactiveObjects: [
        {
          type: "reflection_trigger",
          position: { x: 5, z: 3 }
        }
      ],
      teleports: [
        {
          entrance: { x: 5, z: 6 },
          exit: { x: 3, z: 3 },
        }
      ],
      message: "In this level, you must align the reflective surfaces to create a complete path of light. Solve the puzzle to progress.",
      timeLimit: 0,
      realmProperties: {
        type: "echo",
        tileLifespan: 2500, // Time in ms before a tile disappears after being stepped on (faster than level 1)
        hasMirrors: true,
        hasEchoes: true,
        environment: {
          fogColor: 0x8080ff,
          ambientLightColor: 0x444466,
          particleColor: 0xaabbff,
        }
      }
    };
  }

  // Echo Realm Level 3: Temporal Distortion
  public static createLevel3(): LevelDefinition {
    return {
      id: 3,
      name: "Echo Realm: Temporal Distortion",
      grid: [
        [1, 1, 1, 1, 0, 0, 0, 0],
        [0, 0, 0, 1, 0, 0, 0, 0],
        [0, 1, 1, 1, 0, 0, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 0],
        [0, 0, 0, 0, 0, 0, 1, 0],
        [0, 0, 0, 0, 0, 0, 2, 0],
      ],
      start: { x: 0, z: 0 },
      enemies: [
        {
          type: EnemyType.PATROLLER,
          start: { x: 3, z: 5 },
          patrolPath: [
            { x: 3, z: 5 },
            { x: 5, z: 5 },
          ],
          speed: 0.05,
          detectionRadius: 2
        }
      ],
      interactiveObjects: [
        {
          type: "temporal_trigger",
          position: { x: 1, z: 2 }
        },
        {
          type: "memory_trigger",
          position: { x: 3, z: 5 }
        },
        {
          type: "reflection_trigger",
          position: { x: 5, z: 5 }
        }
      ],
      powerUps: [
        {
          type: PowerUpType.SPEED,
          position: { x: 1, z: 2 }
        }
      ],
      message: "The final challenge combines all you've learned. Time flows differently in certain areas. Use temporal distortions to your advantage.",
      timeLimit: 0,
      realmProperties: {
        type: "echo",
        tileLifespan: 2000, // Even shorter lifespan
        hasMirrors: true,
        hasEchoes: true,
        hasResonanceDisruption: true, // New property for this level that creates visual distortions
        environment: {
          fogColor: 0x6060cc,
          ambientLightColor: 0x333355,
          particleColor: 0x99aaff,
        }
      }
    };
  }

  // Generate a complete 3D level from the level definition
  public static generateLevel(level: LevelDefinition, scene: THREE.Scene, gridSize: number, cellSize: number): void {
    // Calculate grid offset to center it
    const gridOffset = (gridSize * cellSize) / 2 - cellSize / 2;
    
    // Create the floor
    const floorGeometry = new THREE.PlaneGeometry(gridSize * cellSize, gridSize * cellSize);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x220033,
      roughness: 0.9,
      metalness: 0.1
    });
    
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2; // Lay flat
    floor.position.y = -0.1; // Slightly below the walkable tiles
    floor.receiveShadow = true;
    scene.add(floor);
    
    // Create grid tiles
    for (let z = 0; z < gridSize; z++) {
      for (let x = 0; x < gridSize; x++) {
        const tileType = level.grid[z][x];
        
        // Skip empty tiles
        if (tileType === TileType.EMPTY) {
          continue;
        }
        
        // Position adjusted to center the grid
        const posX = x * cellSize - gridOffset;
        const posZ = z * cellSize - gridOffset;
        
        // Create different tiles based on type
        switch (tileType) {
          case TileType.PATH:
            this.createPathTile(scene, x, z, posX, posZ, cellSize);
            break;
          case TileType.GOAL:
            this.createGoalTile(scene, x, z, posX, posZ, cellSize);
            break;
          case TileType.KEY:
            this.createKeyTile(scene, x, z, posX, posZ, cellSize);
            break;
          case TileType.SWITCH:
            this.createSwitchTile(scene, x, z, posX, posZ, cellSize);
            break;
          case TileType.TRAP:
            this.createTrapTile(scene, x, z, posX, posZ, cellSize);
            break;
          case TileType.POWER_UP:
            this.createPowerUpTile(scene, x, z, posX, posZ, cellSize, level);
            break;
          case TileType.TELEPORT:
            this.createTeleportTile(scene, x, z, posX, posZ, cellSize);
            break;
          case TileType.BARRIER:
            this.createBarrierTile(scene, x, z, posX, posZ, cellSize);
            break;
          case TileType.ENERGY:
            this.createEnergyTile(scene, x, z, posX, posZ, cellSize);
            break;
        }
      }
    }
    
    // Add interactive objects
    if (level.interactiveObjects) {
      level.interactiveObjects.forEach((obj: { position: { x: any; z: any; }; type: any; }) => {
        const x = obj.position.x;
        const z = obj.position.z;
        const posX = x * cellSize - gridOffset;
        const posZ = z * cellSize - gridOffset;
        
        switch (obj.type) {
          case "memory_trigger":
            this.createMemoryTrigger(scene, posX, posZ, cellSize);
            break;
          case "reflection_trigger":
            this.createReflectionTrigger(scene, posX, posZ, cellSize);
            break;
          case "temporal_trigger":
            this.createTemporalTrigger(scene, posX, posZ, cellSize);
            break;
        }
      });
    }
    
    // Add walls around the level for better immersion
    this.createLevelWalls(scene, gridSize, cellSize);
    
    // Add ceiling with holes for light to pass through
    this.createCeiling(scene, gridSize, cellSize);
  }
  
  // Create a path tile
  private static createPathTile(scene: THREE.Scene, x: number, z: number, posX: number, posZ: number, cellSize: number): void {
    const geometry = new THREE.BoxGeometry(cellSize - 0.1, 0.2, cellSize - 0.1);
    const material = new THREE.MeshStandardMaterial({
      color: 0x3b0764, // Dark purple
      metalness: 0.3,
      roughness: 0.7
    });
    
    const tile = new THREE.Mesh(geometry, material);
    tile.position.set(posX, -0.1, posZ);
    tile.receiveShadow = true;
    
    scene.add(tile);
  }
  
  // Create a goal tile
  private static createGoalTile(scene: THREE.Scene, x: number, z: number, posX: number, posZ: number, cellSize: number): void {
    const geometry = new THREE.BoxGeometry(cellSize - 0.1, 0.2, cellSize - 0.1);
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
    
    scene.add(tile);
    
    // Add portal effect
    const portalGeometry = new THREE.TorusGeometry(cellSize / 3, 0.05, 16, 32);
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
    scene.add(portal);
    
    // Animate portal
    const animate = () => {
      requestAnimationFrame(animate);
      const time = Date.now() * 0.001;
      portal.rotation.z = time;
      portal.position.y = 0.2 + Math.sin(time * 2) * 0.1;
    };
    animate();
    
    // Add light to the portal
    const light = new THREE.PointLight(0xec4899, 1, 5);
    light.position.set(posX, 1, posZ);
    scene.add(light);
  }
  
  // Create a key tile
  private static createKeyTile(scene: THREE.Scene, x: number, z: number, posX: number, posZ: number, cellSize: number): void {
    // First create base path tile
    this.createPathTile(scene, x, z, posX, posZ, cellSize);
    
    // Create key object
    const keyGeometry = new THREE.BoxGeometry(cellSize / 4, 0.1, cellSize / 4);
    const keyMaterial = new THREE.MeshStandardMaterial({
      color: 0xffdd00, // Gold
      emissive: 0xffdd00,
      emissiveIntensity: 0.5,
      metalness: 0.9,
      roughness: 0.1
    });
    
    const key = new THREE.Mesh(keyGeometry, keyMaterial);
    key.position.set(posX, 0.2, posZ);
    scene.add(key);
    
    // Mark as interactive
    key.userData = {
      interactive: true,
      type: "key"
    };
    
    // Animate key
    const animate = () => {
      requestAnimationFrame(animate);
      const time = Date.now() * 0.001;
      key.rotation.y = time;
      key.position.y = 0.2 + Math.sin(time * 2) * 0.05;
    };
    animate();
  }
  
  // Create a switch tile
  private static createSwitchTile(scene: THREE.Scene, x: number, z: number, posX: number, posZ: number, cellSize: number): void {
    // First create base path tile
    this.createPathTile(scene, x, z, posX, posZ, cellSize);
    
    // Create switch object
    const switchGeometry = new THREE.CylinderGeometry(cellSize / 4, cellSize / 4, 0.1, 16);
    const switchMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ffff, // Cyan
      emissive: 0x00ffff,
      emissiveIntensity: 0.5,
      metalness: 0.7,
      roughness: 0.3
    });
    
    const switchObj = new THREE.Mesh(switchGeometry, switchMaterial);
    switchObj.position.set(posX, 0.1, posZ);
    scene.add(switchObj);
    
    // Mark as interactive
    switchObj.userData = {
      interactive: true,
      type: "switch"
    };
    
    // Add light to the switch
    const light = new THREE.PointLight(0x00ffff, 0.5, 2);
    light.position.set(posX, 0.5, posZ);
    scene.add(light);
  }
  
  // Create a trap tile
  private static createTrapTile(scene: THREE.Scene, x: number, z: number, posX: number, posZ: number, cellSize: number): void {
    const geometry = new THREE.BoxGeometry(cellSize - 0.1, 0.2, cellSize - 0.1);
    const material = new THREE.MeshStandardMaterial({
      color: 0xff0000, // Red
      metalness: 0.6,
      roughness: 0.4
    });
    
    const tile = new THREE.Mesh(geometry, material);
    tile.position.set(posX, -0.1, posZ);
    tile.receiveShadow = true;
    
    scene.add(tile);
    
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
      const offsetX = (Math.random() - 0.5) * (cellSize - 0.2);
      const offsetZ = (Math.random() - 0.5) * (cellSize - 0.2);
      
      spike.position.set(offsetX, 0, offsetZ);
      spike.rotation.x = Math.PI; // Point up
      
      spikeGroup.add(spike);
    }
    
    scene.add(spikeGroup);
    
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
    
    // Mark as dangerous
    tile.userData = { trap: true };
  }
  
  // Create a power-up tile
  private static createPowerUpTile(scene: THREE.Scene, x: number, z: number, posX: number, posZ: number, cellSize: number, level: LevelDefinition): void {
    // First create base path tile
    this.createPathTile(scene, x, z, posX, posZ, cellSize);
    
    // Find power-up type from level definition
    const powerUp = level.powerUps?.find(
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
      case PowerUpType.PRISM:
        color = 0xffaaff; // Pink
        break;
      case PowerUpType.LIGHT_AMPLIFIER:
        color = 0xffffaa; // Yellow
        break;
      case PowerUpType.GRAVITY_SHIFT:
        color = 0xff88aa; // Salmon
        break;
      case PowerUpType.REALITY_BEND:
        color = 0xff00ff; // Magenta
        break;
      case PowerUpType.VOID_STEP:
        color = 0x440088; // Deep purple
        break;
      case PowerUpType.LIGHT_SOURCE:
        color = 0xffff88; // Light yellow
        break;
      case PowerUpType.SHADOW_BLEND:
        color = 0x444466; // Gray blue
        break;
    }
    
    // Create power-up object
    const powerUpGeometry = new THREE.SphereGeometry(cellSize / 5, 16, 16);
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
    scene.add(powerUpObj);
    
    // Mark as interactive with power-up type
    powerUpObj.userData = {
      interactive: true,
      type: "powerup",
      powerUpType: powerUp.type
    };
    
    // Animate power-up
    const animate = () => {
      requestAnimationFrame(animate);
      const time = Date.now() * 0.001;
      powerUpObj.rotation.y = time;
      powerUpObj.position.y = 0.3 + Math.sin(time * 3) * 0.1;
      powerUpMaterial.opacity = 0.6 + Math.sin(time * 2) * 0.2;
    };
    animate();
    
    // Add light to power-up
    const light = new THREE.PointLight(color, 0.7, 3);
    light.position.set(posX, 0.5, posZ);
    scene.add(light);
  }
  
  // Create a teleport tile
  private static createTeleportTile(scene: THREE.Scene, x: number, z: number, posX: number, posZ: number, cellSize: number): void {
    const geometry = new THREE.BoxGeometry(cellSize - 0.1, 0.2, cellSize - 0.1);
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
    
    scene.add(tile);
    
    // Add teleport swirl
    const swirlGeometry = new THREE.RingGeometry(cellSize / 6, cellSize / 3, 32);
    const swirlMaterial = new THREE.MeshBasicMaterial({
      color: 0x8800ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7
    });
    
    const swirl = new THREE.Mesh(swirlGeometry, swirlMaterial);
    swirl.position.set(posX, 0.1, posZ);
    swirl.rotation.x = -Math.PI / 2; // Lay flat
    
    scene.add(swirl);
    
    // Mark as teleport
    tile.userData = {
      interactive: true,
      type: "teleport",
      position: { x, z }
    };
    
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
    
    // Add light to teleport
    const light = new THREE.PointLight(0x8800ff, 0.8, 4);
    light.position.set(posX, 0.5, posZ);
    scene.add(light);
  }
  
  // Create a barrier tile
  private static createBarrierTile(scene: THREE.Scene, x: number, z: number, posX: number, posZ: number, cellSize: number): void {
    const geometry = new THREE.BoxGeometry(cellSize - 0.1, 1.8, cellSize - 0.1);
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
    tile.position.set(posX, 0.8, posZ); // Taller than player
    tile.castShadow = true;
    tile.receiveShadow = true;
    
    scene.add(tile);
    
    // Mark as barrier (solid object)
    tile.userData = { barrier: true, solid: true };
    
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
  
  // Create an energy tile
  private static createEnergyTile(scene: THREE.Scene, x: number, z: number, posX: number, posZ: number, cellSize: number): void {
    // First create base path tile
    this.createPathTile(scene, x, z, posX, posZ, cellSize);
    
    // Create energy crystal
    const energyGeometry = new THREE.OctahedronGeometry(cellSize / 5);
    const energyMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ff88, // Green
      emissive: 0x00ff88,
      emissiveIntensity: 0.7,
      metalness: 0.9,
      roughness: 0.1
    });
    
    const energy = new THREE.Mesh(energyGeometry, energyMaterial);
    energy.position.set(posX, 0.3, posZ);
    scene.add(energy);
    
    // Mark as interactive
    energy.userData = {
      interactive: true,
      type: "energy"
    };
    
    // Add glow effect
    const glowGeometry = new THREE.SphereGeometry(cellSize / 4);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.3
    });
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.copy(energy.position);
    scene.add(glow);
    
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
    
    // Add light to energy
    const light = new THREE.PointLight(0x00ff88, 0.7, 3);
    light.position.set(posX, 0.5, posZ);
    scene.add(light);
  }
  
  // Create memory trigger
  private static createMemoryTrigger(scene: THREE.Scene, posX: number, posZ: number, cellSize: number): void {
    // First create base path tile (if not already created)
    // this.createPathTile(scene, x, z, posX, posZ, cellSize);
    
    // Create memory trigger object
    const triggerGeometry = new THREE.DodecahedronGeometry(cellSize / 4);
    const triggerMaterial = new THREE.MeshStandardMaterial({
      color: 0xaaaaff,
      emissive: 0x6666aa,
      emissiveIntensity: 0.5,
      metalness: 0.7,
      roughness: 0.3,
      transparent: true,
      opacity: 0.9
    });
    
    const trigger = new THREE.Mesh(triggerGeometry, triggerMaterial);
    trigger.position.set(posX, 0.5, posZ);
    scene.add(trigger);
    
    // Mark as interactive memory trigger
    trigger.userData = {
      interactive: true,
      type: "memory_trigger"
    };
    
    // Animate trigger
    const animate = () => {
      requestAnimationFrame(animate);
      const time = Date.now() * 0.001;
      trigger.rotation.y = time * 0.5;
      trigger.rotation.x = Math.sin(time) * 0.5;
      trigger.position.y = 0.5 + Math.sin(time * 1.5) * 0.1;
    };
    animate();
    
    // Add subtle light
    const light = new THREE.PointLight(0xaaaaff, 0.5, 3);
    light.position.set(posX, 0.7, posZ);
    scene.add(light);
  }
  
  // Create reflection trigger
  private static createReflectionTrigger(scene: THREE.Scene, posX: number, posZ: number, cellSize: number): void {
    // Create reflection trigger object
    const triggerGeometry = new THREE.BoxGeometry(cellSize / 3, cellSize / 3, cellSize / 20);
    const triggerMaterial = new THREE.MeshStandardMaterial({
      color: 0x4466aa,
      emissive: 0x223355,
      emissiveIntensity: 0.5,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.8
    });
    
    const trigger = new THREE.Mesh(triggerGeometry, triggerMaterial);
    trigger.position.set(posX, 0.5, posZ);
    scene.add(trigger);
    
    // Mark as interactive reflection trigger
    trigger.userData = {
      interactive: true,
      type: "reflection_trigger"
    };
    
    // Animate trigger - rotating mirror
    const animate = () => {
      requestAnimationFrame(animate);
      const time = Date.now() * 0.001;
      trigger.rotation.y = time * 0.3;
      trigger.position.y = 0.5 + Math.sin(time) * 0.1;
    };
    animate();
    
    // Add subtle light
    const light = new THREE.PointLight(0x4466aa, 0.5, 3);
    light.position.set(posX, 0.7, posZ);
    scene.add(light);
  }
  
  // Create temporal trigger
  private static createTemporalTrigger(scene: THREE.Scene, posX: number, posZ: number, cellSize: number): void {
    // Create temporal trigger object
    const triggerGeometry = new THREE.TorusKnotGeometry(cellSize / 6, cellSize / 20, 32, 8);
    const triggerMaterial = new THREE.MeshStandardMaterial({
      color: 0x8800ff,
      emissive: 0x440088,
      emissiveIntensity: 0.5,
      metalness: 0.7,
      roughness: 0.2,
      transparent: true,
      opacity: 0.9
    });
    
    const trigger = new THREE.Mesh(triggerGeometry, triggerMaterial);
    trigger.position.set(posX, 0.5, posZ);
    scene.add(trigger);
    
    // Mark as interactive temporal trigger
    trigger.userData = {
      interactive: true,
      type: "temporal_trigger"
    };
    
    // Animate trigger
    const animate = () => {
      requestAnimationFrame(animate);
      const time = Date.now() * 0.001;
      trigger.rotation.y = time * 0.5;
      trigger.rotation.x = time * 0.3;
      trigger.position.y = 0.5 + Math.sin(time * 0.7) * 0.1;
    };
    animate();
    
    // Add subtle light
    const light = new THREE.PointLight(0x8800ff, 0.6, 3);
    light.position.set(posX, 0.7, posZ);
    scene.add(light);
  }
  
  // Create walls around the level
  private static createLevelWalls(scene: THREE.Scene, gridSize: number, cellSize: number): void {
    const wallHeight = 4; // Tall enough to contain the player
    const wallThickness = 0.5;
    const totalSize = gridSize * cellSize;
    const halfSize = totalSize / 2;
    
    // Create wall material
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x3b0764, // Dark purple
      metalness: 0.3,
      roughness: 0.8,
      side: THREE.DoubleSide
    });
    
    // Create four walls
    const wallGeometries = [
      // North wall
      new THREE.BoxGeometry(totalSize + wallThickness * 2, wallHeight, wallThickness),
      // South wall
      new THREE.BoxGeometry(totalSize + wallThickness * 2, wallHeight, wallThickness),
      // East wall
      new THREE.BoxGeometry(wallThickness, wallHeight, totalSize),
      // West wall
      new THREE.BoxGeometry(wallThickness, wallHeight, totalSize)
    ];
    
    const wallPositions = [
      [0, wallHeight / 2, -halfSize - wallThickness / 2], // North
      [0, wallHeight / 2, halfSize + wallThickness / 2],  // South
      [halfSize + wallThickness / 2, wallHeight / 2, 0],  // East
      [-halfSize - wallThickness / 2, wallHeight / 2, 0]  // West
    ];
    
    // Create and position walls
    for (let i = 0; i < 4; i++) {
      const wall = new THREE.Mesh(wallGeometries[i], wallMaterial);
      wall.position.set(wallPositions[i][0], wallPositions[i][1], wallPositions[i][2]);
      wall.castShadow = true;
      wall.receiveShadow = true;
      
      // Mark as solid object
      wall.userData = { solid: true };
      
      scene.add(wall);
    }
  }
  
  // Create ceiling with holes for light
  private static createCeiling(scene: THREE.Scene, gridSize: number, cellSize: number): void {
    const ceilingHeight = 4;
    const totalSize = gridSize * cellSize;
    
    // Create ceiling material
    const ceilingMaterial = new THREE.MeshStandardMaterial({
      color: 0x220033,
      metalness: 0.3,
      roughness: 0.9,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7
    });
    
    // Create ceiling with holes
    const ceilingGeometry = new THREE.PlaneGeometry(totalSize, totalSize, gridSize, gridSize);
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2; // Horizontal
    ceiling.position.y = ceilingHeight;
    
    scene.add(ceiling);
    
    // Add ambient light above ceiling
    const ambientLight = new THREE.AmbientLight(0x333366, 0.5);
    scene.add(ambientLight);
    
    // Add point lights to create light beams through ceiling
    for (let i = 0; i < 5; i++) {
      const light = new THREE.PointLight(0xaaaaff, 1, 20);
      light.position.set(
        (Math.random() - 0.5) * totalSize * 0.8,
        ceilingHeight + 1,
        (Math.random() - 0.5) * totalSize * 0.8
      );
      scene.add(light);
      
      // Add visible light beam
      const beamGeometry = new THREE.CylinderGeometry(0.1, 0.5, ceilingHeight, 8);
      const beamMaterial = new THREE.MeshBasicMaterial({
        color: 0xaaaaff,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide
      });
      
      const beam = new THREE.Mesh(beamGeometry, beamMaterial);
      beam.position.set(light.position.x, ceilingHeight / 2, light.position.z);
      
      scene.add(beam);
      
      // Animate light and beam
      const animate = () => {
        requestAnimationFrame(animate);
        const time = Date.now() * 0.001;
        
        light.intensity = 0.8 + Math.sin(time * 0.5 + i) * 0.3;
        beamMaterial.opacity = 0.1 + Math.sin(time * 0.5 + i) * 0.1;
      };
      
      animate();
    }
  }
}