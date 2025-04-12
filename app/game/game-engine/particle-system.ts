import * as THREE from "three";
import { ParticleEffectType } from "../types/game-types";

export class ParticleSystem {
  private scene: THREE.Scene;
  private particleGroups: Map<string, THREE.Points> = new Map();
  private activeEffects: Map<
    string,
    {
      particles: THREE.Points;
      startTime: number;
      duration: number;
      update: (time: number) => void;
    }
  > = new Map();
  private nextEffectId: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  // Create a particle effect
  public createEffect(
    type: ParticleEffectType,
    position: THREE.Vector3,
    customOptions: any = {}
  ): string {
    const effectId = `effect_${this.nextEffectId++}`;

    switch (type) {
      case ParticleEffectType.PLAYER_TRAIL:
        this.createPlayerTrail(effectId, position, customOptions);
        break;
      case ParticleEffectType.ENEMY_TRAIL:
        this.createEnemyTrail(effectId, position, customOptions);
        break;
      case ParticleEffectType.POWERUP_COLLECT:
        this.createPowerupCollectEffect(effectId, position, customOptions);
        break;
      case ParticleEffectType.KEY_COLLECT:
        this.createKeyCollectEffect(effectId, position, customOptions);
        break;
      case ParticleEffectType.TELEPORT:
        this.createTeleportEffect(effectId, position, customOptions);
        break;
      case ParticleEffectType.ENEMY_ALERT:
        this.createEnemyAlertEffect(effectId, position, customOptions);
        break;
      case ParticleEffectType.LEVEL_COMPLETE:
        this.createLevelCompleteEffect(effectId, position, customOptions);
        break;
      case ParticleEffectType.SWITCH_ACTIVATE:
        this.createSwitchActivateEffect(effectId, position, customOptions);
        break;
      case ParticleEffectType.PLAYER_DAMAGE:
        this.createPlayerDamageEffect(effectId, position, customOptions);
        break;
      case ParticleEffectType.PLAYER_SHIELD:
        this.createPlayerShieldEffect(effectId, position, customOptions);
        break;
      case ParticleEffectType.PLAYER_INVISIBILITY:
        this.createPlayerInvisibilityEffect(effectId, position, customOptions);
        break;
    }

    return effectId;
  }

  // Update all active effects
  public update(currentTime: number): void {
    // Update all active effects
    for (const [id, effect] of this.activeEffects.entries()) {
      const elapsedTime = currentTime - effect.startTime;

      // Remove effect if duration has passed
      if (elapsedTime > effect.duration) {
        // Remove particles from scene
        this.scene.remove(effect.particles);

        // Dispose resources
        if (effect.particles.geometry) {
          effect.particles.geometry.dispose();
        }

        if (effect.particles.material instanceof THREE.Material) {
          effect.particles.material.dispose();
        }

        // Remove from active effects
        this.activeEffects.delete(id);
      } else {
        // Update effect
        effect.update(elapsedTime / effect.duration);
      }
    }
  }

  // Create player trail effect
  private createPlayerTrail(
    id: string,
    position: THREE.Vector3,
    options: any
  ): void {
    const particleCount = options.count || 20;
    const duration = options.duration || 1000;
    const color = options.color || 0xec4899; // Pink

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const colorObj = new THREE.Color(color);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Position particles in a short trail behind the player
      positions[i3] = position.x + (Math.random() - 0.5) * 0.3;
      positions[i3 + 1] = position.y + (Math.random() - 0.5) * 0.3;
      positions[i3 + 2] = position.z + (Math.random() - 0.5) * 0.3;

      // Set color (with slight variations)
      colors[i3] = colorObj.r * (0.8 + Math.random() * 0.2);
      colors[i3 + 1] = colorObj.g * (0.8 + Math.random() * 0.2);
      colors[i3 + 2] = colorObj.b * (0.8 + Math.random() * 0.2);

      // Set size (with variations)
      sizes[i] = 0.05 + Math.random() * 0.1;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);

    // Add to active effects
    this.activeEffects.set(id, {
      particles,
      startTime: Date.now(),
      duration: duration,
      update: (progress: number) => {
        // Fade out particles
        if (material.opacity) {
          material.opacity = 0.8 * (1 - progress);
        }

        // Shrink particles
        const sizeAttr = geometry.getAttribute("size") as THREE.BufferAttribute;
        const originalSizes = Array.from(
          { length: particleCount },
          (_, i) => 0.05 + Math.random() * 0.1
        );

        for (let i = 0; i < particleCount; i++) {
          sizeAttr.setX(i, originalSizes[i] * (1 - progress));
        }

        sizeAttr.needsUpdate = true;
      },
    });
  }

  // Create enemy trail effect
  private createEnemyTrail(
    id: string,
    position: THREE.Vector3,
    options: any
  ): void {
    const particleCount = options.count || 15;
    const duration = options.duration || 800;
    const color = options.color || 0xff5500; // Orange

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const colorObj = new THREE.Color(color);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Position particles in a short trail behind the enemy
      positions[i3] = position.x + (Math.random() - 0.5) * 0.2;
      positions[i3 + 1] = position.y + (Math.random() - 0.5) * 0.2;
      positions[i3 + 2] = position.z + (Math.random() - 0.5) * 0.2;

      // Set color (with slight variations)
      colors[i3] = colorObj.r * (0.8 + Math.random() * 0.2);
      colors[i3 + 1] = colorObj.g * (0.8 + Math.random() * 0.2);
      colors[i3 + 2] = colorObj.b * (0.8 + Math.random() * 0.2);

      // Set size (with variations)
      sizes[i] = 0.04 + Math.random() * 0.08;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);

    // Add to active effects
    this.activeEffects.set(id, {
      particles,
      startTime: Date.now(),
      duration: duration,
      update: (progress: number) => {
        // Fade out particles
        if (material.opacity) {
          material.opacity = 0.7 * (1 - progress);
        }

        // Shrink particles
        const sizeAttr = geometry.getAttribute("size") as THREE.BufferAttribute;
        const originalSizes = Array.from(
          { length: particleCount },
          (_, i) => 0.04 + Math.random() * 0.08
        );

        for (let i = 0; i < particleCount; i++) {
          sizeAttr.setX(i, originalSizes[i] * (1 - progress));
        }

        sizeAttr.needsUpdate = true;
      },
    });
  }

  // Create power-up collect effect
  private createPowerupCollectEffect(
    id: string,
    position: THREE.Vector3,
    options: any
  ): void {
    const particleCount = options.count || 40;
    const duration = options.duration || 1500;
    const color = options.color || 0x00ffff; // Cyan

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const velocities: { x: number; y: number; z: number; }[] = []; // Store velocities separately

    const colorObj = new THREE.Color(color);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Position particles at the center
      positions[i3] = position.x;
      positions[i3 + 1] = position.y;
      positions[i3 + 2] = position.z;

      // Set color (with slight variations)
      colors[i3] = colorObj.r * (0.8 + Math.random() * 0.2);
      colors[i3 + 1] = colorObj.g * (0.8 + Math.random() * 0.2);
      colors[i3 + 2] = colorObj.b * (0.8 + Math.random() * 0.2);

      // Set size (with variations)
      sizes[i] = 0.1 + Math.random() * 0.15;

      // Set velocity (exploding outward)
      const speed = 0.02 + Math.random() * 0.08;
      const angle = Math.random() * Math.PI * 2;
      const inclination = Math.random() * Math.PI;

      velocities.push({
        x: speed * Math.sin(inclination) * Math.cos(angle),
        y: speed * Math.cos(inclination),
        z: speed * Math.sin(inclination) * Math.sin(angle),
      });
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);

    // Add to active effects
    // Add to active effects
    this.activeEffects.set(id, {
      particles,
      startTime: Date.now(),
      duration: duration,
      update: (progress: number) => {
        // Move particles outward
        const posAttr = geometry.getAttribute(
          "position"
        ) as THREE.BufferAttribute;

        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3;

          posAttr.setX(i, positions[i3] + velocities[i].x * progress * 40);
          posAttr.setY(i, positions[i3 + 1] + velocities[i].y * progress * 40);
          posAttr.setZ(i, positions[i3 + 2] + velocities[i].z * progress * 40);
        }

        posAttr.needsUpdate = true;

        // Fade out particles
        if (material.opacity) {
          material.opacity = 0.9 * (1 - Math.pow(progress, 2));
        }
      },
    });
  }

  // Create key collect effect
  private createKeyCollectEffect(
    id: string,
    position: THREE.Vector3,
    options: any
  ): void {
    const particleCount = options.count || 30;
    const duration = options.duration || 1200;
    const color = options.color || 0xffdd00; // Gold

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const colorObj = new THREE.Color(color);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Position particles around the key position
      const radius = 0.2 + Math.random() * 0.3;
      const angle = Math.random() * Math.PI * 2;

      positions[i3] = position.x + radius * Math.cos(angle);
      positions[i3 + 1] = position.y + Math.random() * 0.5;
      positions[i3 + 2] = position.z + radius * Math.sin(angle);

      // Set color (with slight variations)
      colors[i3] = colorObj.r * (0.8 + Math.random() * 0.2);
      colors[i3 + 1] = colorObj.g * (0.8 + Math.random() * 0.2);
      colors[i3 + 2] = colorObj.b * (0.8 + Math.random() * 0.2);

      // Set size (with variations)
      sizes[i] = 0.08 + Math.random() * 0.12;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);

    // Add to active effects
    this.activeEffects.set(id, {
      particles,
      startTime: Date.now(),
      duration: duration,
      update: (progress: number) => {
        // Move particles upward
        const posAttr = geometry.getAttribute(
          "position"
        ) as THREE.BufferAttribute;

        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3;
          posAttr.setY(i, positions[i3 + 1] + progress * 2);
        }

        posAttr.needsUpdate = true;

        // Fade out particles
        if (material.opacity) {
          material.opacity = 0.9 * (1 - progress);
        }
      },
    });
  }

  // Create teleport effect
  private createTeleportEffect(
    id: string,
    position: THREE.Vector3,
    options: any
  ): void {
    const particleCount = options.count || 50;
    const duration = options.duration || 1000;
    const color = options.color || 0x8800ff; // Purple

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const colorObj = new THREE.Color(color);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Position particles in a sphere around the teleport position
      const radius = Math.random() * 0.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      positions[i3] = position.x + radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = position.y + radius * Math.cos(phi);
      positions[i3 + 2] = position.z + radius * Math.sin(phi) * Math.sin(theta);

      // Set color (with slight variations)
      colors[i3] = colorObj.r * (0.8 + Math.random() * 0.2);
      colors[i3 + 1] = colorObj.g * (0.8 + Math.random() * 0.2);
      colors[i3 + 2] = colorObj.b * (0.8 + Math.random() * 0.2);

      // Set size (with variations)
      sizes[i] = 0.1 + Math.random() * 0.15;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);

    // Add to active effects
    this.activeEffects.set(id, {
      particles,
      startTime: Date.now(),
      duration: duration,
      update: (progress: number) => {
        // Make particles expand outward
        const posAttr = geometry.getAttribute(
          "position"
        ) as THREE.BufferAttribute;

        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3;

          const direction = new THREE.Vector3(
            positions[i3] - position.x,
            positions[i3 + 1] - position.y,
            positions[i3 + 2] - position.z
          ).normalize();

          posAttr.setX(i, positions[i3] + direction.x * progress * 2);
          posAttr.setY(i, positions[i3 + 1] + direction.y * progress * 2);
          posAttr.setZ(i, positions[i3 + 2] + direction.z * progress * 2);
        }

        posAttr.needsUpdate = true;

        // Fade out particles
        if (material.opacity) {
          material.opacity = 0.9 * (1 - progress);
        }
      },
    });
  }

  // Create enemy alert effect
  private createEnemyAlertEffect(
    id: string,
    position: THREE.Vector3,
    options: any
  ): void {
    const particleCount = options.count || 20;
    const duration = options.duration || 1000;
    const color = options.color || 0xff0000; // Red

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const colorObj = new THREE.Color(color);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Position particles above the enemy
      positions[i3] = position.x + (Math.random() - 0.5) * 0.4;
      positions[i3 + 1] = position.y + 0.5 + Math.random() * 0.5;
      positions[i3 + 2] = position.z + (Math.random() - 0.5) * 0.4;

      // Set color (with slight variations)
      colors[i3] = colorObj.r * (0.8 + Math.random() * 0.2);
      colors[i3 + 1] = colorObj.g * (0.8 + Math.random() * 0.2);
      colors[i3 + 2] = colorObj.b * (0.8 + Math.random() * 0.2);

      // Set size (with variations)
      sizes[i] = 0.08 + Math.random() * 0.1;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);

    // Add to active effects
    this.activeEffects.set(id, {
      particles,
      startTime: Date.now(),
      duration: duration,
      update: (progress: number) => {
        // Move particles upward
        const posAttr = geometry.getAttribute(
          "position"
        ) as THREE.BufferAttribute;

        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3;
          posAttr.setY(i, positions[i3 + 1] + progress * 0.5);
        }

        posAttr.needsUpdate = true;

        // Pulse opacity
        if (material.opacity) {
          material.opacity =
            0.9 * (1 - progress) * (0.7 + 0.3 * Math.sin(progress * 12));
        }
      },
    });
  }

  // Create level complete effect
  private createLevelCompleteEffect(
    id: string,
    position: THREE.Vector3,
    options: any
  ): void {
    const particleCount = options.count || 200;
    const duration = options.duration || 4000;

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const velocities: { x: number; y: number; z: number; }[] = [];

    // Use multiple colors for celebration effect
    const colorOptions = [
      new THREE.Color(0xff00ff), // Magenta
      new THREE.Color(0x00ffff), // Cyan
      new THREE.Color(0xffff00), // Yellow
      new THREE.Color(0x88ff00), // Lime
      new THREE.Color(0xff8800), // Orange
      new THREE.Color(0x00ff88), // Teal
    ];

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Position particles at the center
      positions[i3] = position.x;
      positions[i3 + 1] = position.y + 0.5;
      positions[i3 + 2] = position.z;

      // Randomly select a color
      const colorObj =
        colorOptions[Math.floor(Math.random() * colorOptions.length)];
      colors[i3] = colorObj.r;
      colors[i3 + 1] = colorObj.g;
      colors[i3 + 2] = colorObj.b;

      // Set size (with variations)
      sizes[i] = 0.1 + Math.random() * 0.2;

      // Set velocity (exploding outward in all directions)
      const speed = 0.01 + Math.random() * 0.04;
      const angle = Math.random() * Math.PI * 2;
      const inclination = Math.random() * Math.PI;

      velocities.push({
        x: speed * Math.sin(inclination) * Math.cos(angle),
        y: speed * Math.cos(inclination) + 0.01, // Slight upward bias
        z: speed * Math.sin(inclination) * Math.sin(angle),
      });
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);

    // Add to active effects
    this.activeEffects.set(id, {
      particles,
      startTime: Date.now(),
      duration: duration,
      update: (progress: number) => {
        // Move particles outward
        const posAttr = geometry.getAttribute(
          "position"
        ) as THREE.BufferAttribute;

        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3;

          posAttr.setX(i, positions[i3] + velocities[i].x * progress * 100);
          posAttr.setY(i, positions[i3 + 1] + velocities[i].y * progress * 100);
          posAttr.setZ(i, positions[i3 + 2] + velocities[i].z * progress * 100);
        }

        posAttr.needsUpdate = true;

        // Fade out particles
        if (material.opacity) {
          material.opacity = 0.9 * (1 - Math.pow(progress, 2));
        }
      },
    });
  }

  // Create switch activate effect
  private createSwitchActivateEffect(
    id: string,
    position: THREE.Vector3,
    options: any
  ): void {
    const particleCount = options.count || 30;
    const duration = options.duration || 1000;
    const color = options.color || 0x00ffff; // Cyan

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const colorObj = new THREE.Color(color);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Position particles in a circle around the switch
      const radius = 0.2 + Math.random() * 0.1;
      const angle = Math.random() * Math.PI * 2;

      positions[i3] = position.x + radius * Math.cos(angle);
      positions[i3 + 1] = position.y + 0.05 + Math.random() * 0.2;
      positions[i3 + 2] = position.z + radius * Math.sin(angle);

      // Set color (with slight variations)
      colors[i3] = colorObj.r * (0.8 + Math.random() * 0.2);
      colors[i3 + 1] = colorObj.g * (0.8 + Math.random() * 0.2);
      colors[i3 + 2] = colorObj.b * (0.8 + Math.random() * 0.2);

      // Set size (with variations)
      sizes[i] = 0.05 + Math.random() * 0.1;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);

    // Add to active effects
    this.activeEffects.set(id, {
      particles,
      startTime: Date.now(),
      duration: duration,
      update: (progress: number) => {
        // Expand circle outward
        const posAttr = geometry.getAttribute(
          "position"
        ) as THREE.BufferAttribute;

        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3;

          const direction = new THREE.Vector2(
            positions[i3] - position.x,
            positions[i3 + 2] - position.z
          ).normalize();

          posAttr.setX(i, positions[i3] + direction.x * progress * 2);
          posAttr.setZ(i, positions[i3 + 2] + direction.y * progress * 2);
        }

        posAttr.needsUpdate = true;

        // Fade out particles
        if (material.opacity) {
          material.opacity = 0.9 * (1 - progress);
        }
      },
    });
  }

  // Create player damage effect
  private createPlayerDamageEffect(
    id: string,
    position: THREE.Vector3,
    options: any
  ): void {
    const particleCount = options.count || 40;
    const duration = options.duration || 800;
    const color = options.color || 0xff0000; // Red

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const velocities: { x: number; y: number; z: number; }[] = [];

    const colorObj = new THREE.Color(color);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Position particles at the player position
      positions[i3] = position.x;
      positions[i3 + 1] = position.y;
      positions[i3 + 2] = position.z;

      // Set color (with slight variations)
      colors[i3] = colorObj.r * (0.8 + Math.random() * 0.2);
      colors[i3 + 1] = colorObj.g * (0.8 + Math.random() * 0.2);
      colors[i3 + 2] = colorObj.b * (0.8 + Math.random() * 0.2);

      // Set size (with variations)
      sizes[i] = 0.08 + Math.random() * 0.15;

      // Set velocity (exploding outward)
      const speed = 0.03 + Math.random() * 0.1;
      const angle = Math.random() * Math.PI * 2;
      const inclination = Math.random() * Math.PI;

      velocities.push({
        x: speed * Math.sin(inclination) * Math.cos(angle),
        y: speed * Math.cos(inclination),
        z: speed * Math.sin(inclination) * Math.sin(angle),
      });
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);

    // Add to active effects
    this.activeEffects.set(id, {
      particles,
      startTime: Date.now(),
      duration: duration,
      update: (progress: number) => {
        // Move particles outward
        const posAttr = geometry.getAttribute(
          "position"
        ) as THREE.BufferAttribute;

        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3;

          posAttr.setX(i, positions[i3] + velocities[i].x * progress * 30);
          posAttr.setY(i, positions[i3 + 1] + velocities[i].y * progress * 30);
          posAttr.setZ(i, positions[i3 + 2] + velocities[i].z * progress * 30);
        }

        posAttr.needsUpdate = true;

        // Fade out particles
        if (material.opacity) {
          material.opacity = 0.9 * (1 - progress);
        }
      },
    });
  }

  // Create player shield effect
  private createPlayerShieldEffect(
    id: string,
    position: THREE.Vector3,
    options: any
  ): void {
    const particleCount = options.count || 60;
    const duration = options.duration || 1500;
    const color = options.color || 0x00ff88; // Green

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const colorObj = new THREE.Color(color);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Position particles in a sphere around the player
      const radius = 0.7 + Math.random() * 0.1;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      positions[i3] = position.x + radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = position.y + radius * Math.cos(phi);
      positions[i3 + 2] = position.z + radius * Math.sin(phi) * Math.sin(theta);

      // Set color (with slight variations)
      colors[i3] = colorObj.r * (0.8 + Math.random() * 0.2);
      colors[i3 + 1] = colorObj.g * (0.8 + Math.random() * 0.2);
      colors[i3 + 2] = colorObj.b * (0.8 + Math.random() * 0.2);

      // Set size (with variations)
      sizes[i] = 0.06 + Math.random() * 0.08;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);

    // Add to active effects
    this.activeEffects.set(id, {
      particles,
      startTime: Date.now(),
      duration: duration,
      update: (progress: number) => {
        // Rotate particles around the player
        const posAttr = geometry.getAttribute(
          "position"
        ) as THREE.BufferAttribute;

        const rotationAngle = progress * Math.PI * 4; // Two full rotations
        const rotationMatrix = new THREE.Matrix4().makeRotationY(rotationAngle);

        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3;

          // Create a vector from the original position
          const point = new THREE.Vector3(
            positions[i3] - position.x,
            positions[i3 + 1] - position.y,
            positions[i3 + 2] - position.z
          );

          // Apply rotation
          point.applyMatrix4(rotationMatrix);

          // Update position
          posAttr.setX(i, position.x + point.x);
          posAttr.setY(i, position.y + point.y);
          posAttr.setZ(i, position.z + point.z);
        }

        posAttr.needsUpdate = true;

        // Pulse opacity
        if (material.opacity) {
          material.opacity =
            0.8 * (1 - progress) * (0.8 + 0.2 * Math.sin(progress * 10));
        }
      },
    });
  }

  // Create player invisibility effect
  private createPlayerInvisibilityEffect(
    id: string,
    position: THREE.Vector3,
    options: any
  ): void {
    const particleCount = options.count || 50;
    const duration = options.duration || 1200;
    const color = options.color || 0xaaaaff; // Light blue

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const colorObj = new THREE.Color(color);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Position particles in and around the player
      const radius = 0.3 + Math.random() * 0.3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      positions[i3] = position.x + radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = position.y + radius * Math.cos(phi);
      positions[i3 + 2] = position.z + radius * Math.sin(phi) * Math.sin(theta);

      // Set color (with slight variations)
      colors[i3] = colorObj.r * (0.8 + Math.random() * 0.2);
      colors[i3 + 1] = colorObj.g * (0.8 + Math.random() * 0.2);
      colors[i3 + 2] = colorObj.b * (0.8 + Math.random() * 0.2);

      // Set size (with variations)
      sizes[i] = 0.05 + Math.random() * 0.08;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);

    // Add to active effects
    this.activeEffects.set(id, {
      particles,
      startTime: Date.now(),
      duration: duration,
      update: (progress: number) => {
        // Fade out and shrink particles
        if (material.opacity) {
          material.opacity = 0.7 * (1 - progress);
        }

        const sizeAttr = geometry.getAttribute("size") as THREE.BufferAttribute;
        for (let i = 0; i < particleCount; i++) {
          sizeAttr.setX(i, sizes[i] * (1 - progress));
        }
        sizeAttr.needsUpdate = true;
      },
    });
  }

  // Clean up resources
  public dispose(): void {
    // Dispose all active effects
    for (const [id, effect] of this.activeEffects.entries()) {
      this.scene.remove(effect.particles);

      if (effect.particles.geometry) {
        effect.particles.geometry.dispose();
      }

      if (effect.particles.material instanceof THREE.Material) {
        effect.particles.material.dispose();
      }
    }

    // Clear effects map
    this.activeEffects.clear();

    // Dispose all particle groups
    for (const [id, particles] of this.particleGroups.entries()) {
      this.scene.remove(particles);

      if (particles.geometry) {
        particles.geometry.dispose();
      }

      if (particles.material instanceof THREE.Material) {
        particles.material.dispose();
      }
    }

    // Clear groups map
    this.particleGroups.clear();
  }
}
