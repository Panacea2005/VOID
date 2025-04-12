import * as THREE from 'three';
import { EnemyState, EnemyType, PlayerState, TileType } from '../types/game-types';

export class EnemyController {
  private enemies: EnemyState[] = [];
  private scene: THREE.Scene;
  private gridSize: number;
  private cellSize: number;
  private grid: TileType[][];
  private lastUpdateTime: number = 0;
  private fovMeshes: THREE.Mesh[] = [];

  constructor(scene: THREE.Scene, gridSize: number, cellSize: number, grid: TileType[][]) {
    this.scene = scene;
    this.gridSize = gridSize;
    this.cellSize = cellSize;
    this.grid = grid;
  }

  // Initialize enemies based on level definition
  public initializeEnemies(enemiesConfig: any[]): EnemyState[] {
    this.enemies = [];
    
    enemiesConfig.forEach((config, index) => {
      // Calculate grid offset to center it
      const gridOffset = (this.gridSize * this.cellSize) / 2 - this.cellSize / 2;
      
      // Calculate position based on grid coordinates
      const startPosX = config.start.x * this.cellSize - gridOffset;
      const startPosZ = config.start.z * this.cellSize - gridOffset;
      
      // Create enemy based on type
      const enemy: EnemyState = {
        id: index,
        type: config.type,
        position: new THREE.Vector3(startPosX, 0.5, startPosZ),
        gridPosition: { x: config.start.x, z: config.start.z },
        targetPosition: new THREE.Vector3(startPosX, 0.5, startPosZ),
        mesh: null,
        glowMesh: null,
        isMoving: false,
        speed: config.speed || 0.05,
        detectionRadius: config.detectionRadius || 3,
        alertState: 'passive',
        stunDuration: 0,
        stunEnd: 0,
        isStunned: false
      };
      
      // Additional properties based on enemy type
      if (config.type === EnemyType.PATROLLER && config.patrolPath) {
        enemy.patrolPath = config.patrolPath;
        enemy.patrolIndex = 0;
        enemy.patrolDirection = 1;
      } else if (config.type === EnemyType.SENTINEL) {
        enemy.fieldOfView = config.fieldOfView || 90;
        enemy.viewDistance = config.viewDistance || 4;
      }
      
      // Create visual representation of the enemy
      this.createEnemyMesh(enemy);
      
      this.enemies.push(enemy);
    });
    
    return this.enemies;
  }

  // Create visual mesh for enemy
  private createEnemyMesh(enemy: EnemyState): void {
    const enemySize = this.cellSize / 2;
    let enemyColor: number;
    
    // Different colors for different enemy types
    switch (enemy.type) {
      case EnemyType.PATROLLER:
        enemyColor = 0xff5500; // Orange
        break;
      case EnemyType.HUNTER:
        enemyColor = 0xff0000; // Red
        break;
      case EnemyType.SENTINEL:
        enemyColor = 0xffff00; // Yellow
        break;
      default:
        enemyColor = 0xff0000; // Default red
    }
    
    // Create enemy mesh
    const geometry = new THREE.BoxGeometry(enemySize, enemySize, enemySize);
    const material = new THREE.MeshStandardMaterial({
      color: enemyColor,
      metalness: 0.8,
      roughness: 0.2,
      emissive: enemyColor,
      emissiveIntensity: 0.5,
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(enemy.position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    enemy.mesh = mesh;
    
    // Create glow effect
    const glowGeometry = new THREE.BoxGeometry(
      enemySize + 0.3,
      enemySize + 0.3,
      enemySize + 0.3
    );
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: enemyColor,
      transparent: true,
      opacity: 0.6,
    });
    
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    glowMesh.position.copy(enemy.position);
    this.scene.add(glowMesh);
    enemy.glowMesh = glowMesh;
    
    // Add visual indicator for sentinel's field of view
    if (enemy.type === EnemyType.SENTINEL && enemy.fieldOfView && enemy.viewDistance) {
      const fovAngle = THREE.MathUtils.degToRad(enemy.fieldOfView);
      const fovGeometry = new THREE.ConeGeometry(
        enemy.viewDistance * 0.8, 
        enemy.viewDistance * this.cellSize, 
        8, 
        1, 
        true
      );
      fovGeometry.rotateX(Math.PI / 2);
      
      const fovMaterial = new THREE.MeshBasicMaterial({
        color: enemyColor,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide,
      });
      
      const fovMesh = new THREE.Mesh(fovGeometry, fovMaterial);
      fovMesh.position.copy(enemy.position);
      fovMesh.position.y = 0.1; // Just above the ground
      
      this.scene.add(fovMesh);
      this.fovMeshes.push(fovMesh);
    }
  }
  
  // Update all enemies
  public update(player: PlayerState, currentTime: number, deltaTime: number): void {
    // Only update at certain intervals for performance
    if (currentTime - this.lastUpdateTime < 16) {
      return;
    }
    
    this.lastUpdateTime = currentTime;
    
    this.enemies.forEach(enemy => {
      if (enemy.isStunned) {
        // Check if stun duration has ended
        if (currentTime > enemy.stunEnd) {
          enemy.isStunned = false;
          if (enemy.mesh && enemy.mesh.material instanceof THREE.MeshStandardMaterial) {
            enemy.mesh.material.opacity = 1.0;
          }
        } else {
          // Enemy is still stunned, make it pulse
          if (enemy.glowMesh) {
            enemy.glowMesh.scale.set(
              1.0 + Math.sin(currentTime * 0.01) * 0.2,
              1.0 + Math.sin(currentTime * 0.01) * 0.2,
              1.0 + Math.sin(currentTime * 0.01) * 0.2
            );
          }
          return; // Skip rest of update for stunned enemy
        }
      }
      
      // Calculate distance to player
      const distanceToPlayer = this.calculateDistanceToPlayer(enemy, player);
      
      // Update enemy behavior based on type
      switch (enemy.type) {
        case EnemyType.PATROLLER:
          this.updatePatroller(enemy, deltaTime);
          break;
        case EnemyType.HUNTER:
          this.updateHunter(enemy, player, distanceToPlayer, deltaTime);
          break;
        case EnemyType.SENTINEL:
          this.updateSentinel(enemy, player, distanceToPlayer, deltaTime);
          break;
      }
      
      // Update mesh positions
      if (enemy.mesh) {
        enemy.mesh.position.copy(enemy.position);
      }
      
      if (enemy.glowMesh) {
        enemy.glowMesh.position.copy(enemy.position);
        
        // Make glow pulse
        const pulseScale = 1.0 + Math.sin(currentTime * 0.003) * 0.1;
        enemy.glowMesh.scale.set(pulseScale, pulseScale, pulseScale);
      }
    });
    
    // Update FOV meshes for sentinels
    this.updateFOVMeshes();
  }
  
  // Update patroller enemy
  private updatePatroller(enemy: EnemyState, deltaTime: number): void {
    if (!enemy.patrolPath || enemy.patrolPath.length < 2 || enemy.isMoving) {
      return;
    }
    
    // Calculate grid offset
    const gridOffset = (this.gridSize * this.cellSize) / 2 - this.cellSize / 2;
    
    // Get current target in patrol path
    const currentTarget = enemy.patrolPath[enemy.patrolIndex as number];
    const targetX = currentTarget.x * this.cellSize - gridOffset;
    const targetZ = currentTarget.z * this.cellSize - gridOffset;
    
    // Set target position
    enemy.targetPosition.set(targetX, enemy.position.y, targetZ);
    
    // Check if we've reached the target
    const distanceToTarget = enemy.position.distanceTo(enemy.targetPosition);
    if (distanceToTarget < 0.1) {
      // Update patrol index
      if (enemy.patrolDirection === 1) {
        enemy.patrolIndex = (enemy.patrolIndex as number) + 1;
        if ((enemy.patrolIndex as number) >= enemy.patrolPath.length) {
          enemy.patrolIndex = enemy.patrolPath.length - 2;
          enemy.patrolDirection = -1;
        }
      } else {
        enemy.patrolIndex = (enemy.patrolIndex as number) - 1;
        if ((enemy.patrolIndex as number) < 0) {
          enemy.patrolIndex = 1;
          enemy.patrolDirection = 1;
        }
      }
    } else {
      // Move towards target
      const direction = new THREE.Vector3()
        .subVectors(enemy.targetPosition, enemy.position)
        .normalize();
        
      enemy.position.add(
        direction.multiplyScalar(enemy.speed * deltaTime * 0.1)
      );
      
      // Update grid position
      enemy.gridPosition = this.worldToGrid(enemy.position);
    }
  }
  
  // Update hunter enemy
  private updateHunter(enemy: EnemyState, player: PlayerState, distanceToPlayer: number, deltaTime: number): void {
    // Check if player is within detection radius
    if (distanceToPlayer <= enemy.detectionRadius && !player.isInvisible) {
      // Player detected - update alert state
      if (enemy.alertState === 'passive') {
        enemy.alertState = 'alerted';
        // Visual feedback for alerted state
        if (enemy.glowMesh && enemy.glowMesh.material instanceof THREE.MeshBasicMaterial) {
          enemy.glowMesh.material.color.setHex(0xff0000);
          enemy.glowMesh.scale.set(1.5, 1.5, 1.5);
        }
      }
      
      // Chase player
      const direction = new THREE.Vector3()
        .subVectors(player.position, enemy.position)
        .normalize();
      
      // Predict next position
      const nextPosition = enemy.position.clone().add(
        direction.multiplyScalar(enemy.speed * deltaTime * 0.1)
      );
      
      // Check if next position is walkable
      const nextGridPos = this.worldToGrid(nextPosition);
      if (
        nextGridPos.x >= 0 && 
        nextGridPos.x < this.gridSize && 
        nextGridPos.z >= 0 && 
        nextGridPos.z < this.gridSize && 
        this.grid[nextGridPos.z][nextGridPos.x] !== TileType.EMPTY &&
        this.grid[nextGridPos.z][nextGridPos.x] !== TileType.BARRIER
      ) {
        enemy.position.copy(nextPosition);
        enemy.gridPosition = nextGridPos;
      }
    } else if (enemy.alertState === 'alerted') {
      // Lost track of player - return to passive
      enemy.alertState = 'passive';
      if (enemy.glowMesh && enemy.glowMesh.material instanceof THREE.MeshBasicMaterial) {
        enemy.glowMesh.material.color.setHex(0xff0000);
        enemy.glowMesh.scale.set(1.0, 1.0, 1.0);
      }
    }
  }
  
  // Update sentinel enemy
  private updateSentinel(enemy: EnemyState, player: PlayerState, distanceToPlayer: number, deltaTime: number): void {
    if (!enemy.fieldOfView || !enemy.viewDistance) {
      return;
    }
    
    // Check if player is within view distance
    if (distanceToPlayer <= enemy.viewDistance && !player.isInvisible) {
      // Calculate angle to player
      const directionToPlayer = new THREE.Vector3()
        .subVectors(player.position, enemy.position)
        .normalize();
      
      // Sentinel's forward direction (assuming facing positive Z)
      const forwardDirection = new THREE.Vector3(0, 0, 1);
      
      // Calculate angle between sentinel's forward and direction to player
      const angle = Math.acos(forwardDirection.dot(directionToPlayer)) * (180 / Math.PI);
      
      // Check if player is within field of view
      if (angle <= enemy.fieldOfView / 2) {
        // Player detected - update alert state
        if (enemy.alertState === 'passive') {
          enemy.alertState = 'alerted';
          // Visual feedback for alerted state
          if (enemy.glowMesh && enemy.glowMesh.material instanceof THREE.MeshBasicMaterial) {
            enemy.glowMesh.material.color.setHex(0xff0000);
            enemy.glowMesh.scale.set(1.5, 1.5, 1.5);
          }
        }
        
        // Optionally rotate to face player
        if (enemy.mesh) {
          enemy.mesh.lookAt(player.position);
        }
      } else if (enemy.alertState === 'alerted') {
        // Lost track of player - return to passive
        enemy.alertState = 'passive';
        if (enemy.glowMesh && enemy.glowMesh.material instanceof THREE.MeshBasicMaterial) {
          enemy.glowMesh.material.color.setHex(0xffff00);
          enemy.glowMesh.scale.set(1.0, 1.0, 1.0);
        }
      }
    }
  }
  
  // Update field of view meshes for sentinels
  private updateFOVMeshes(): void {
    let fovIndex = 0;
    
    this.enemies.forEach(enemy => {
      if (enemy.type === EnemyType.SENTINEL && enemy.mesh) {
        // Update FOV mesh position and rotation
        if (fovIndex < this.fovMeshes.length) {
          const fovMesh = this.fovMeshes[fovIndex];
          fovMesh.position.copy(enemy.position);
          fovMesh.rotation.copy(enemy.mesh.rotation);
          
          // Change color based on alert state
          if (enemy.alertState === 'alerted' && fovMesh.material instanceof THREE.MeshBasicMaterial) {
            fovMesh.material.color.setHex(0xff0000);
            fovMesh.material.opacity = 0.3;
          } else if (fovMesh.material instanceof THREE.MeshBasicMaterial) {
            fovMesh.material.color.setHex(0xffff00);
            fovMesh.material.opacity = 0.2;
          }
          
          fovIndex++;
        }
      }
    });
  }
  
  // Calculate distance between enemy and player
  private calculateDistanceToPlayer(enemy: EnemyState, player: PlayerState): number {
    return enemy.position.distanceTo(player.position);
  }
  
  // Check if any enemy can see the player
  public canSeePlayer(player: PlayerState): boolean {
    for (const enemy of this.enemies) {
      if (enemy.isStunned) continue;
      
      const distanceToPlayer = this.calculateDistanceToPlayer(enemy, player);
      
      // Check based on enemy type
      if (enemy.type === EnemyType.HUNTER && distanceToPlayer <= enemy.detectionRadius && !player.isInvisible) {
        return true;
      } else if (enemy.type === EnemyType.SENTINEL && enemy.fieldOfView && enemy.viewDistance) {
        if (distanceToPlayer <= enemy.viewDistance && !player.isInvisible) {
          // Calculate angle to player
          const directionToPlayer = new THREE.Vector3()
            .subVectors(player.position, enemy.position)
            .normalize();
          
          // Sentinel's forward direction
          const forwardDirection = new THREE.Vector3(0, 0, 1);
          if (enemy.mesh) {
            enemy.mesh.getWorldDirection(forwardDirection);
          }
          
          // Calculate angle between sentinel's forward and direction to player
          const angle = Math.acos(forwardDirection.dot(directionToPlayer)) * (180 / Math.PI);
          
          // Check if player is within field of view
          if (angle <= enemy.fieldOfView / 2) {
            return true;
          }
        }
      }
    }
    
    return false;
  }
  
  // Check collision with player
  public checkPlayerCollision(player: PlayerState): boolean {
    for (const enemy of this.enemies) {
      if (enemy.isStunned) continue;
      
      const distanceToPlayer = this.calculateDistanceToPlayer(enemy, player);
      
      // Collision threshold based on cell size
      const collisionThreshold = this.cellSize * 0.4;
      
      if (distanceToPlayer < collisionThreshold) {
        return true;
      }
    }
    
    return false;
  }
  
  // Stun an enemy
  public stunEnemy(enemyId: number, duration: number): void {
    const enemy = this.enemies.find(e => e.id === enemyId);
    if (enemy) {
      enemy.isStunned = true;
      enemy.stunDuration = duration;
      enemy.stunEnd = Date.now() + duration;
      
      // Visual feedback for stunned state
      if (enemy.mesh && enemy.mesh.material instanceof THREE.MeshStandardMaterial) {
        enemy.mesh.material.opacity = 0.5;
      }
      
      if (enemy.glowMesh && enemy.glowMesh.material instanceof THREE.MeshBasicMaterial) {
        enemy.glowMesh.material.color.setHex(0x0088ff);
      }
    }
  }
  
  // Convert world position to grid position
  private worldToGrid(position: THREE.Vector3): { x: number, z: number } {
    const gridOffset = (this.gridSize * this.cellSize) / 2 - this.cellSize / 2;
    
    const gridX = Math.floor((position.x + gridOffset) / this.cellSize);
    const gridZ = Math.floor((position.z + gridOffset) / this.cellSize);
    
    return { x: gridX, z: gridZ };
  }
  
  // Clean up resources
  public dispose(): void {
    this.enemies.forEach(enemy => {
      if (enemy.mesh) {
        if (enemy.mesh.geometry) enemy.mesh.geometry.dispose();
        if (enemy.mesh.material instanceof THREE.Material) enemy.mesh.material.dispose();
        this.scene.remove(enemy.mesh);
      }
      
      if (enemy.glowMesh) {
        if (enemy.glowMesh.geometry) enemy.glowMesh.geometry.dispose();
        if (enemy.glowMesh.material instanceof THREE.Material) enemy.glowMesh.material.dispose();
        this.scene.remove(enemy.glowMesh);
      }
    });
    
    this.fovMeshes.forEach(mesh => {
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material instanceof THREE.Material) mesh.material.dispose();
      this.scene.remove(mesh);
    });
    
    this.enemies = [];
    this.fovMeshes = [];
  }
}