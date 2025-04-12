import * as THREE from 'three';
import { PlayerState, PowerUpType, PowerUpState, TileType } from '../types/game-types';

export class PlayerController {
  private player: PlayerState;
  private scene: THREE.Scene;
  private gridSize: number;
  private cellSize: number;
  private grid: TileType[][];
  private playerMesh: THREE.Mesh | null = null;
  private playerGlowMesh: THREE.Mesh | null = null;
  private trailParticles: THREE.Points | null = null;
  private trailPositions: Float32Array | null = null;
  private trailColors: Float32Array | null = null;
  private lastTrailTime: number = 0;
  private keysPressed = { up: false, down: false, left: false, right: false };
  private isMoving: boolean = false;
  private moveSpeed: number = 0.1;
  private baseSpeed: number = 0.1;
  private lastMoveTime: number = 0;
  private invincibilityEnd: number = 0;
  private powerUpEffects: Record<PowerUpType, THREE.Mesh | null> = {
    [PowerUpType.SPEED]: null,
    [PowerUpType.INVISIBILITY]: null,
    [PowerUpType.SHIELD]: null,
    [PowerUpType.TELEPORT]: null,
    [PowerUpType.PRISM]: null,
    [PowerUpType.LIGHT_AMPLIFIER]: null,
    [PowerUpType.GRAVITY_SHIFT]: null,
    [PowerUpType.REALITY_BEND]: null,
    [PowerUpType.VOID_STEP]: null,
    [PowerUpType.LIGHT_SOURCE]: null,
    [PowerUpType.SHADOW_BLEND]: null
  };

  constructor(scene: THREE.Scene, gridSize: number, cellSize: number, grid: TileType[][]) {
    this.scene = scene;
    this.gridSize = gridSize;
    this.cellSize = cellSize;
    this.grid = grid;
    
    // Initialize player state
    this.player = {
      position: new THREE.Vector3(0, 0, 0),
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
  }

  // Initialize player at start position
  public initializePlayer(startPosition: { x: number, z: number }): PlayerState {
    // Calculate grid offset to center it
    const gridOffset = (this.gridSize * this.cellSize) / 2 - this.cellSize / 2;
    
    // Calculate position based on grid coordinates
    const startPosX = startPosition.x * this.cellSize - gridOffset;
    const startPosZ = startPosition.z * this.cellSize - gridOffset;
    
    // Set player position
    this.player.position = new THREE.Vector3(startPosX, 0.5, startPosZ);
    this.player.gridPosition = { x: startPosition.x, z: startPosition.z };
    
    // Create visual representation
    this.createPlayerMesh();
    
    // Initialize trail particles
    this.createTrailParticles();
    
    return this.player;
  }

  // Create visual mesh for player
  private createPlayerMesh(): void {
    const playerSize = this.cellSize / 2;
    const playerColor = 0xec4899; // Pink
    
    // Create player mesh
    const geometry = new THREE.BoxGeometry(playerSize, playerSize, playerSize);
    const material = new THREE.MeshStandardMaterial({
      color: playerColor,
      metalness: 0.8,
      roughness: 0.2,
      emissive: playerColor,
      emissiveIntensity: 0.6,
    });
    
    this.playerMesh = new THREE.Mesh(geometry, material);
    this.playerMesh.position.copy(this.player.position);
    this.playerMesh.castShadow = true;
    this.playerMesh.receiveShadow = true;
    this.scene.add(this.playerMesh);
    
    // Create glow effect
    const glowGeometry = new THREE.BoxGeometry(
      playerSize + 0.3,
      playerSize + 0.3,
      playerSize + 0.3
    );
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: playerColor,
      transparent: true,
      opacity: 0.6,
    });
    
    this.playerGlowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    this.playerGlowMesh.position.copy(this.player.position);
    this.scene.add(this.playerGlowMesh);
  }

  // Create trail particles for player movement
  private createTrailParticles(): void {
    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = 30;
    
    this.trailPositions = new Float32Array(particleCount * 3);
    this.trailColors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      this.trailPositions[i3] = this.player.position.x;
      this.trailPositions[i3 + 1] = this.player.position.y;
      this.trailPositions[i3 + 2] = this.player.position.z;
      
      // Pink/purple trail color
      this.trailColors[i3] = 0.9;     // R
      this.trailColors[i3 + 1] = 0.2; // G
      this.trailColors[i3 + 2] = 0.8; // B
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(this.trailPositions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(this.trailColors, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
    });
    
    this.trailParticles = new THREE.Points(particlesGeometry, particlesMaterial);
    this.scene.add(this.trailParticles);
  }

  // Update player and associated effects
  public update(currentTime: number, deltaTime: number): void {
    if (!this.playerMesh || !this.playerGlowMesh) return;
    
    // Update movement
    this.updateMovement(deltaTime);
    
    // Update player mesh position
    this.playerMesh.position.copy(this.player.position);
    this.playerGlowMesh.position.copy(this.player.position);
    
    // Make glow pulse
    const pulseScale = 1.0 + Math.sin(currentTime * 0.003) * 0.1;
    this.playerGlowMesh.scale.set(pulseScale, pulseScale, pulseScale);
    
    // Update power-up effects
    this.updatePowerUps(currentTime);
    
    // Update trail particles (at lower frequency for performance)
    if (currentTime - this.lastTrailTime > 50 && this.trailParticles && this.trailPositions && this.isMoving) {
      this.updateTrailParticles();
      this.lastTrailTime = currentTime;
    }
    
    // Check invincibility timer
    if (this.invincibilityEnd > 0 && currentTime > this.invincibilityEnd) {
      this.invincibilityEnd = 0;
      // Visual indication of invincibility end
      if (this.playerMesh.material instanceof THREE.MeshStandardMaterial) {
        this.playerMesh.material.opacity = 1.0;
      }
    }
  }

  // Update player movement based on input
  private updateMovement(deltaTime: number): void {
    // Skip if already moving
    if (this.isMoving) return;
    
    let moved = false;
    const newPosition = this.player.position.clone();
    
    if (this.keysPressed.up) {
      newPosition.z -= this.moveSpeed * deltaTime;
      moved = true;
    } else if (this.keysPressed.down) {
      newPosition.z += this.moveSpeed * deltaTime;
      moved = true;
    } else if (this.keysPressed.left) {
      newPosition.x -= this.moveSpeed * deltaTime;
      moved = true;
    } else if (this.keysPressed.right) {
      newPosition.x += this.moveSpeed * deltaTime;
      moved = true;
    }
    
    if (moved) {
      this.isMoving = true;
      
      // Calculate grid coordinates of new position
      const newGridPos = this.worldToGrid(newPosition);
      
      // Check if new position is valid (on a walkable tile)
      if (
        newGridPos.x >= 0 && 
        newGridPos.x < this.gridSize && 
        newGridPos.z >= 0 && 
        newGridPos.z < this.gridSize && 
        this.grid[newGridPos.z][newGridPos.x] !== TileType.EMPTY &&
        this.grid[newGridPos.z][newGridPos.x] !== TileType.BARRIER
      ) {
        // Move to new position
        this.player.position.copy(newPosition);
        
        // Update grid position if it changed
        if (newGridPos.x !== this.player.gridPosition.x || newGridPos.z !== this.player.gridPosition.z) {
          this.player.gridPosition = newGridPos;
        }
      }
      
      // Reset moving state after a short delay
      setTimeout(() => {
        this.isMoving = false;
      }, 100);
    }
  }

  // Update trail particles
  private updateTrailParticles(): void {
    if (!this.trailParticles || !this.trailPositions || !this.trailColors) return;
    
    // Shift all particles one position forward
    for (let i = this.trailPositions.length / 3 - 1; i > 0; i--) {
      const i3 = i * 3;
      const prev3 = (i - 1) * 3;
      
      this.trailPositions[i3] = this.trailPositions[prev3];
      this.trailPositions[i3 + 1] = this.trailPositions[prev3 + 1];
      this.trailPositions[i3 + 2] = this.trailPositions[prev3 + 2];
      
      // Fade out particles
      if (this.trailColors[i3] > 0.2) this.trailColors[i3] -= 0.01;
      if (this.trailColors[i3 + 1] > 0.02) this.trailColors[i3 + 1] -= 0.01;
      if (this.trailColors[i3 + 2] > 0.1) this.trailColors[i3 + 2] -= 0.01;
    }
    
    // Set first particle to player's current position
    this.trailPositions[0] = this.player.position.x;
    this.trailPositions[1] = this.player.position.y - 0.3; // Slightly below player
    this.trailPositions[2] = this.player.position.z;
    
    // Reset color for new particle
    this.trailColors[0] = 0.9; // R
    this.trailColors[1] = 0.2; // G
    this.trailColors[2] = 0.8; // B
    
    // Update the buffers
    const posAttr = this.trailParticles.geometry.getAttribute('position');
    posAttr.needsUpdate = true;
    
    const colorAttr = this.trailParticles.geometry.getAttribute('color');
    colorAttr.needsUpdate = true;
  }

  // Update power-up effects
  private updatePowerUps(currentTime: number): void {
    // Remove expired power-ups
    this.player.powerUps = this.player.powerUps.filter(powerUp => {
      const isExpired = powerUp.isActive && (currentTime - powerUp.startTime > powerUp.duration);
      
      if (isExpired) {
        // Deactivate power-up
        powerUp.isActive = false;
        
        // Remove visual effect
        this.removePowerUpEffect(powerUp.type);
        
        // Reset special states based on power-up type
        switch (powerUp.type) {
          case PowerUpType.SPEED:
            this.moveSpeed = this.baseSpeed;
            break;
          case PowerUpType.INVISIBILITY:
            this.player.isInvisible = false;
            if (this.playerMesh && this.playerMesh.material instanceof THREE.MeshStandardMaterial) {
              this.playerMesh.material.opacity = 1.0;
            }
            break;
          case PowerUpType.SHIELD:
            this.player.isShielded = false;
            break;
        }
        
        return false; // Remove from array
      }
      
      return true; // Keep in array
    });
  }

  // Add a power-up to the player
  public addPowerUp(type: PowerUpType, duration: number): void {
    // Check if this power-up is already active
    const existingPowerUp = this.player.powerUps.find(p => p.type === type && p.isActive);
    
    if (existingPowerUp) {
      // Just extend the duration
      existingPowerUp.duration += duration;
    } else {
      // Add new power-up
      const powerUp: PowerUpState = {
        type,
        duration,
        startTime: Date.now(),
        isActive: true
      };
      
      this.player.powerUps.push(powerUp);
      
      // Apply power-up effect
      this.applyPowerUpEffect(type);
    }
  }

  // Apply a power-up effect
  private applyPowerUpEffect(type: PowerUpType): void {
    switch (type) {
      case PowerUpType.SPEED:
        this.moveSpeed = this.baseSpeed * 2;
        this.createSpeedEffect();
        break;
      case PowerUpType.INVISIBILITY:
        this.player.isInvisible = true;
        if (this.playerMesh && this.playerMesh.material instanceof THREE.MeshStandardMaterial) {
          this.playerMesh.material.opacity = 0.3;
        }
        this.createInvisibilityEffect();
        break;
      case PowerUpType.SHIELD:
        this.player.isShielded = true;
        this.createShieldEffect();
        break;
      case PowerUpType.TELEPORT:
        // Teleport is usually instant, so no persistent effect
        // Just create a visual flash
        this.createTeleportEffect();
        break;
    }
  }

  // Remove a power-up effect
  private removePowerUpEffect(type: PowerUpType): void {
    const effectMesh = this.powerUpEffects[type];
    if (effectMesh) {
      this.scene.remove(effectMesh);
      this.powerUpEffects[type] = null;
    }
  }

  // Create speed effect
  private createSpeedEffect(): void {
    if (this.powerUpEffects[PowerUpType.SPEED]) {
      this.scene.remove(this.powerUpEffects[PowerUpType.SPEED]!);
    }
    
    const trailGeo = new THREE.PlaneGeometry(0.8, 0.3);
    const trailMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    
    const trail = new THREE.Mesh(trailGeo, trailMat);
    trail.position.copy(this.player.position);
    trail.position.y = 0.1;
    trail.rotation.x = Math.PI / 2;
    
    this.scene.add(trail);
    this.powerUpEffects[PowerUpType.SPEED] = trail;
  }

  // Create invisibility effect
  private createInvisibilityEffect(): void {
    if (this.powerUpEffects[PowerUpType.INVISIBILITY]) {
      this.scene.remove(this.powerUpEffects[PowerUpType.INVISIBILITY]!);
    }
    
    const sphereGeo = new THREE.SphereGeometry(0.6, 16, 16);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0xaaaaff,
      transparent: true,
      opacity: 0.2,
      wireframe: true
    });
    
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.position.copy(this.player.position);
    
    this.scene.add(sphere);
    this.powerUpEffects[PowerUpType.INVISIBILITY] = sphere;
  }

  // Create shield effect
  private createShieldEffect(): void {
    if (this.powerUpEffects[PowerUpType.SHIELD]) {
      this.scene.remove(this.powerUpEffects[PowerUpType.SHIELD]!);
    }
    
    const sphereGeo = new THREE.SphereGeometry(0.7, 16, 16);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.4,
    });
    
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.position.copy(this.player.position);
    
    this.scene.add(sphere);
    this.powerUpEffects[PowerUpType.SHIELD] = sphere;
  }

  // Create teleport effect (temporary)
  private createTeleportEffect(): void {
    const ringGeo = new THREE.RingGeometry(0.5, 0.7, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x8800ff,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(this.player.position);
    ring.rotation.x = Math.PI / 2;
    
    this.scene.add(ring);
    
    // Animate and remove
    const startTime = Date.now();
    
    const animateRing = () => {
      const elapsed = Date.now() - startTime;
      const scale = 1 + elapsed * 0.005;
      
      ring.scale.set(scale, scale, scale);
      ring.position.copy(this.player.position);
      
      if (ringMat.opacity > 0.1) {
        ringMat.opacity = 0.8 - (elapsed * 0.002);
      }
      
      if (elapsed < 500) {
        requestAnimationFrame(animateRing);
      } else {
        this.scene.remove(ring);
      }
    };
    
    animateRing();
  }

  // Handle key down events
  public handleKeyDown(key: string): void {
    if (key === 'ArrowUp' || key === 'w') this.keysPressed.up = true;
    if (key === 'ArrowDown' || key === 's') this.keysPressed.down = true;
    if (key === 'ArrowLeft' || key === 'a') this.keysPressed.left = true;
    if (key === 'ArrowRight' || key === 'd') this.keysPressed.right = true;
  }

  // Handle key up events
  public handleKeyUp(key: string): void {
    if (key === 'ArrowUp' || key === 'w') this.keysPressed.up = false;
    if (key === 'ArrowDown' || key === 's') this.keysPressed.down = false;
    if (key === 'ArrowLeft' || key === 'a') this.keysPressed.left = false;
    if (key === 'ArrowRight' || key === 'd') this.keysPressed.right = false;
  }

  // Damage the player
  public damage(): boolean {
    // Check if shielded or invincible
    if (this.player.isShielded || Date.now() < this.invincibilityEnd) {
      return false;
    }
    
    // Reduce health
    this.player.health--;
    
    // Check if player still has health
    if (this.player.health <= 0) {
      this.player.lives--;
      this.player.health = 3; // Reset health
      
      return this.player.lives <= 0; // Return true if game over
    }
    
    // Set temporary invincibility
    this.setInvincibility(2000); // 2 seconds
    
    return false; // Not game over
  }

  // Set temporary invincibility
  public setInvincibility(duration: number): void {
    this.invincibilityEnd = Date.now() + duration;
    
    // Visual indication of invincibility
    if (this.playerMesh && this.playerMesh.material instanceof THREE.MeshStandardMaterial) {
      this.playerMesh.material.opacity = 0.5;
    }
  }

  // Collect item
  public collectItem(itemType: TileType, position: { x: number, z: number }): void {
    switch (itemType) {
      case TileType.KEY:
        this.player.keys++;
        break;
      case TileType.ENERGY:
        this.player.energy++;
        break;
      case TileType.POWER_UP:
        // Power-up type would be determined elsewhere
        break;
    }
  }

  // Convert world position to grid position
  private worldToGrid(position: THREE.Vector3): { x: number, z: number } {
    const gridOffset = (this.gridSize * this.cellSize) / 2 - this.cellSize / 2;
    
    const gridX = Math.floor((position.x + gridOffset) / this.cellSize);
    const gridZ = Math.floor((position.z + gridOffset) / this.cellSize);
    
    return { x: gridX, z: gridZ };
  }

  // Get player state
  public getPlayerState(): PlayerState {
    return this.player;
  }

  // Clean up resources
  public dispose(): void {
    if (this.playerMesh) {
      if (this.playerMesh.geometry) this.playerMesh.geometry.dispose();
      if (this.playerMesh.material instanceof THREE.Material) this.playerMesh.material.dispose();
      this.scene.remove(this.playerMesh);
    }
    
    if (this.playerGlowMesh) {
      if (this.playerGlowMesh.geometry) this.playerGlowMesh.geometry.dispose();
      if (this.playerGlowMesh.material instanceof THREE.Material) this.playerGlowMesh.material.dispose();
      this.scene.remove(this.playerGlowMesh);
    }
    
    if (this.trailParticles) {
      if (this.trailParticles.geometry) this.trailParticles.geometry.dispose();
      if (this.trailParticles.material instanceof THREE.Material) this.trailParticles.material.dispose();
      this.scene.remove(this.trailParticles);
    }
    
    // Clean up power-up effects
    Object.values(this.powerUpEffects).forEach(mesh => {
      if (mesh) {
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material instanceof THREE.Material) mesh.material.dispose();
        this.scene.remove(mesh);
      }
    });
  }
}