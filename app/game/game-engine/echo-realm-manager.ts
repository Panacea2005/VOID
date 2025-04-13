import * as THREE from 'three';
import { LevelDefinition, TileType } from '../types/game-types';
import { ParticleSystem } from './particle-system';
import { EchoRealm, EchoTile } from './echo-realm';

export class EchoRealmManager {
  private scene: THREE.Scene;
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

  constructor(scene: THREE.Scene, particleSystem: ParticleSystem, gridSize: number, cellSize: number) {
    this.scene = scene;
    this.particleSystem = particleSystem;
    this.echoRealm = new EchoRealm();
    this.gridSize = gridSize;
    this.cellSize = cellSize;
    
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
    const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(128);
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
  }

  // Initialize the Echo Realm features for a level
  public initializeEchoRealm(level: LevelDefinition): void {
    console.log("Initializing Echo Realm for level:", level.name);
    this.currentLevel = level;
    this.echoRealm.reset();
    this.clearEffects();
    
    // Add realm-specific environment effects
    this.setupEnvironment(level);
    
    // Add floating mirror fragments
    if (level.realmProperties?.hasMirrors) {
      this.createMirrorFragments();
    }
  }

  // Register that the player has stepped on a tile
  public registerPlayerStep(x: number, z: number): void {
    this.echoRealm.registerTileStep(x, z);
  }

  // Update Echo Realm effects
  public update(currentTime: number): void {
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
  }

  // Set up environment effects for the Echo Realm
  private setupEnvironment(level: LevelDefinition): void {
    if (!level.realmProperties) return;
    
    // Add fog
    this.scene.fog = new THREE.FogExp2(
      level.realmProperties.environment.fogColor, 
      0.03
    );
    
    // Adjust lighting
    const ambientLight = new THREE.AmbientLight(
      level.realmProperties.environment.ambientLightColor, 
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
    
    // Reset fog
    this.scene.fog = null;
  }

  // Dispose resources
  public dispose(): void {
    this.clearEffects();
    
    if (this.reflectiveMaterial) {
      this.reflectiveMaterial.dispose();
    }
  }
}