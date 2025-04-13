import { LevelDefinition, EnemyType, PowerUpType, TileType } from '../types/game-types';
import { RealmType } from './realm-system';
import { EchoRealm } from './echo-realm';

// Define the base interface for all realms
export interface RealmDefinition {
  id: string;
  name: string;
  description: string;
  type: RealmType;
  levels: LevelDefinition[];
  unlockCriteria?: {
    requiredRealms: string[];
    requiredEnergy?: number;
  };
  environmentSettings: {
    fogColor?: number;
    ambientLightColor?: number;
    particleColor?: number;
    musicTrack?: string;
    specialEffects?: string[];
  };
}

// Collection of all game realms
const GAME_REALMS: RealmDefinition[] = [
  // Echo Realm - Already implemented
  {
    id: "echo",
    name: "Echo Realm",
    description: "A mysterious dimension where your path fades behind you. Listen to the echoes of your steps.",
    type: RealmType.ECHO,
    levels: EchoRealm.getLevels(),
    environmentSettings: {
      fogColor: 0x8080ff,
      ambientLightColor: 0x444466,
      particleColor: 0xaabbff,
      musicTrack: "echo_ambient",
      specialEffects: ["fading_tiles", "mirror_fragments"]
    }
  },
  
  // Shadow Realm
  {
    id: "shadow",
    name: "Shadow Realm",
    description: "A dark realm where light is scarce. Navigate with limited visibility and avoid shadow entities.",
    type: RealmType.SHADOW,
    levels: [
      // Level 1: Into the Shadows
      {
          id: 101,
          name: "Shadow Realm: Into the Shadows",
          grid: [
              [1, 1, 1, 0, 0, 0, 0, 0],
              [0, 0, 1, 0, 0, 0, 0, 0],
              [0, 0, 1, 1, 1, 1, 0, 0],
              [0, 0, 0, 0, 0, 1, 0, 0],
              [0, 0, 0, 0, 0, 1, 0, 0],
              [0, 0, 1, 1, 1, 1, 0, 0],
              [0, 0, 1, 0, 0, 0, 0, 0],
              [0, 0, 2, 0, 0, 0, 0, 0],
          ],
          start: { x: 0, z: 0 },
          enemies: [
              {
                  type: EnemyType.SHADOW_LURKER,
                  start: { x: 3, z: 5 },
                  patrolPath: [
                      { x: 3, z: 5 },
                      { x: 5, z: 5 },
                  ],
                  speed: 0.03,
                  detectionRadius: 2
              }
          ],
          powerUps: [
              {
                  type: PowerUpType.LIGHT_SOURCE,
                  position: { x: 2, z: 5 }
              }
          ],
          message: "The shadows grow thick here. Find a light source to see further.",
          realmProperties: {
              type: "shadow",
              visibilityRange: 2, // Limited visibility radius
              hasShadowEntities: true,
              environment: {
                  fogColor: 0x090909,
                  ambientLightColor: 0x111111,
                  particleColor: 0x444444,
              }
          },
          interactiveObjects: undefined
      },
      
      // Level 2: Deeper Darkness
      {
          id: 102,
          name: "Shadow Realm: Deeper Darkness",
          grid: [
              [1, 1, 1, 1, 0, 0, 0, 0],
              [0, 0, 0, 1, 0, 0, 0, 0],
              [0, 0, 0, 1, 1, 1, 0, 0],
              [0, 0, 0, 0, 0, 1, 0, 0],
              [0, 0, 1, 1, 0, 1, 0, 0],
              [0, 0, 1, 9, 1, 1, 0, 0],
              [0, 0, 1, 0, 0, 0, 0, 0],
              [0, 0, 2, 0, 0, 0, 0, 0],
          ],
          start: { x: 0, z: 0 },
          enemies: [
              {
                  type: EnemyType.SHADOW_STALKER,
                  start: { x: 4, z: 2 },
                  patrolPath: [
                      { x: 4, z: 2 },
                      { x: 5, z: 2 },
                      { x: 5, z: 5 },
                      { x: 4, z: 5 },
                  ],
                  speed: 0.04,
                  detectionRadius: 3
              }
          ],
          powerUps: [
              {
                  type: PowerUpType.LIGHT_SOURCE,
                  position: { x: 3, z: 5 }
              }
          ],
          message: "Shadow entities are drawn to the light. Be cautious with your illumination.",
          timeLimit: 60,
          realmProperties: {
              type: "shadow",
              visibilityRange: 1.5, // Even more limited visibility
              hasShadowEntities: true,
              hasInvertedShadows: true, // New mechanic: some areas become visible only when dark
              environment: {
                  fogColor: 0x050505,
                  ambientLightColor: 0x090909,
                  particleColor: 0x222222,
              }
          },
          interactiveObjects: undefined
      },
      
      // Level 3: Shadow's Embrace
      {
          id: 103,
          name: "Shadow Realm: Shadow's Embrace",
          grid: [
              [1, 1, 1, 0, 0, 0, 0, 0],
              [0, 0, 1, 0, 0, 1, 1, 1],
              [0, 0, 1, 0, 0, 1, 0, 1],
              [0, 0, 1, 1, 1, 1, 0, 1],
              [0, 0, 0, 0, 0, 0, 0, 1],
              [0, 0, 0, 0, 0, 0, 0, 1],
              [0, 0, 0, 0, 0, 0, 0, 1],
              [0, 0, 0, 0, 0, 0, 0, 2],
          ],
          start: { x: 0, z: 0 },
          enemies: [
              {
                  type: EnemyType.SHADOW_LURKER,
                  start: { x: 3, z: 3 },
                  patrolPath: [
                      { x: 3, z: 3 },
                      { x: 5, z: 3 },
                  ],
                  speed: 0.05,
                  detectionRadius: 2
              },
              {
                  type: EnemyType.SHADOW_STALKER,
                  start: { x: 6, z: 5 },
                  speed: 0.03,
                  detectionRadius: 4
              }
          ],
          powerUps: [
              {
                  type: PowerUpType.LIGHT_SOURCE,
                  position: { x: 2, z: 0 }
              },
              {
                  type: PowerUpType.SHADOW_BLEND,
                  position: { x: 6, z: 1 }
              }
          ],
          teleports: [
              {
                  entrance: { x: 5, z: 2 },
                  exit: { x: 7, z: 6 },
              }
          ],
          message: "Shadow-blend allows you to temporarily become one with the darkness, invisible to shadow entities.",
          timeLimit: 90,
          realmProperties: {
              type: "shadow",
              visibilityRange: 1,
              hasShadowEntities: true,
              hasInvertedShadows: true,
              hasShadowPockets: true, // Areas of complete darkness
              environment: {
                  fogColor: 0x020202,
                  ambientLightColor: 0x050505,
                  particleColor: 0x111111,
              }
          },
          interactiveObjects: undefined
      }
    ],
    unlockCriteria: {
      requiredRealms: ["echo"],
      requiredEnergy: 3
    },
    environmentSettings: {
      fogColor: 0x050505,
      ambientLightColor: 0x090909,
      particleColor: 0x222222,
      musicTrack: "shadow_ambient",
      specialEffects: ["limited_visibility", "shadow_entities"]
    }
  },
  
  // Crystal Realm
  {
    id: "crystal",
    name: "Crystal Realm",
    description: "A dazzling dimension of reflective surfaces and light-based puzzles. Manipulate light to progress.",
    type: RealmType.CRYSTAL,
    levels: [
      // Level 1: Refracted Light
      {
          id: 201,
          name: "Crystal Realm: Refracted Light",
          grid: [
              [1, 1, 1, 1, 0, 0, 0, 0],
              [0, 0, 0, 1, 0, 0, 0, 0],
              [0, 0, 4, 1, 0, 0, 0, 0],
              [0, 0, 1, 1, 1, 1, 0, 0],
              [0, 0, 1, 0, 0, 1, 0, 0],
              [0, 0, 1, 8, 0, 1, 1, 1],
              [0, 0, 1, 0, 0, 0, 0, 1],
              [0, 0, 1, 1, 1, 1, 1, 2],
          ],
          start: { x: 0, z: 0 },
          switches: [
              {
                  position: { x: 2, z: 2 },
                  target: { x: 3, z: 5 },
              }
          ],
          barriers: [{ x: 3, z: 5 }],
          message: "Crystal prisms can redirect light. Activate light switches to open pathways.",
          realmProperties: {
              type: "crystal",
              hasLightBeams: true, // Light beam mechanic
              hasReflectiveSurfaces: true,
              environment: {
                  fogColor: 0xcceeff,
                  ambientLightColor: 0x99ccff,
                  particleColor: 0xffffff,
              }
          },
          enemies: [],
          interactiveObjects: undefined
      },
      
      // Level 2: Prismatic Path
      {
          id: 202,
          name: "Crystal Realm: Prismatic Path",
          grid: [
              [1, 1, 1, 0, 0, 0, 0, 0],
              [0, 0, 1, 0, 0, 0, 0, 0],
              [0, 0, 1, 1, 1, 1, 1, 0],
              [0, 0, 0, 0, 0, 0, 1, 0],
              [0, 0, 0, 4, 0, 0, 1, 0],
              [0, 0, 1, 1, 1, 0, 1, 0],
              [0, 0, 1, 8, 1, 1, 1, 0],
              [0, 0, 2, 0, 0, 0, 0, 0],
          ],
          start: { x: 0, z: 0 },
          switches: [
              {
                  position: { x: 3, z: 4 },
                  target: { x: 3, z: 6 },
              }
          ],
          barriers: [{ x: 3, z: 6 }],
          powerUps: [
              {
                  type: PowerUpType.PRISM,
                  position: { x: 6, z: 2 }
              }
          ],
          message: "Collect prisms to bend light in new ways. Some crystals require specific light colors to activate.",
          realmProperties: {
              type: "crystal",
              hasLightBeams: true,
              hasReflectiveSurfaces: true,
              hasColoredLights: true, // New mechanic: colored light beams
              environment: {
                  fogColor: 0xccddff,
                  ambientLightColor: 0xaabbee,
                  particleColor: 0xeeeeff,
              }
          },
          enemies: [],
          interactiveObjects: undefined
      },
      
      // Level 3: Spectrum Nexus
      {
          id: 203,
          name: "Crystal Realm: Spectrum Nexus",
          grid: [
              [1, 1, 1, 1, 0, 0, 0, 0],
              [0, 0, 0, 1, 0, 0, 0, 0],
              [0, 4, 0, 1, 1, 1, 0, 0],
              [0, 1, 8, 0, 0, 1, 0, 0],
              [0, 0, 1, 0, 0, 1, 0, 0],
              [0, 0, 1, 1, 1, 1, 1, 0],
              [0, 0, 0, 0, 0, 0, 1, 0],
              [0, 0, 0, 0, 0, 0, 2, 0],
          ],
          start: { x: 0, z: 0 },
          switches: [
              {
                  position: { x: 1, z: 2 },
                  target: { x: 2, z: 3 },
              }
          ],
          barriers: [{ x: 2, z: 3 }],
          enemies: [
              {
                  type: EnemyType.CRYSTAL_GUARDIAN,
                  start: { x: 5, z: 5 },
                  patrolPath: [
                      { x: 5, z: 5 },
                      { x: 5, z: 2 },
                  ],
                  speed: 0.04,
                  detectionRadius: 3
              }
          ],
          powerUps: [
              {
                  type: PowerUpType.PRISM,
                  position: { x: 3, z: 0 }
              },
              {
                  type: PowerUpType.LIGHT_AMPLIFIER,
                  position: { x: 6, z: 6 }
              }
          ],
          message: "Crystal Guardians are vulnerable to their matching light frequency. Use the spectrum to defeat them.",
          realmProperties: {
              type: "crystal",
              hasLightBeams: true,
              hasReflectiveSurfaces: true,
              hasColoredLights: true,
              hasCrystalGuardians: true, // New mechanic: enemies vulnerable to specific light colors
              environment: {
                  fogColor: 0xddeeee,
                  ambientLightColor: 0xccddff,
                  particleColor: 0xffffff,
              }
          },
          interactiveObjects: undefined
      }
    ],
    unlockCriteria: {
      requiredRealms: ["echo", "shadow"],
      requiredEnergy: 5
    },
    environmentSettings: {
      fogColor: 0xccddff,
      ambientLightColor: 0xaabbee,
      particleColor: 0xffffff,
      musicTrack: "crystal_ambient",
      specialEffects: ["light_refraction", "crystal_resonance"]
    }
  },
  
  // Void Realm
  {
    id: "void",
    name: "Void Realm",
    description: "The space between spaces. Gravity is unpredictable, and reality itself can be manipulated.",
    type: RealmType.VOID,
    levels: [
      // Level 1: Gravity Flux
      {
          id: 301,
          name: "Void Realm: Gravity Flux",
          grid: [
              [1, 1, 1, 0, 0, 0, 0, 0],
              [0, 0, 1, 0, 0, 0, 0, 0],
              [0, 0, 1, 1, 1, 0, 0, 0],
              [0, 0, 0, 0, 1, 0, 0, 0],
              [0, 0, 0, 0, 1, 1, 1, 0],
              [0, 0, 0, 0, 0, 0, 1, 0],
              [0, 0, 0, 0, 0, 0, 1, 0],
              [0, 0, 0, 0, 0, 0, 2, 0],
          ],
          start: { x: 0, z: 0 },
          powerUps: [
              {
                  type: PowerUpType.GRAVITY_SHIFT,
                  position: { x: 2, z: 2 }
              }
          ],
          message: "In the Void, gravity is merely a suggestion. Use gravity shifts to reach new pathways.",
          realmProperties: {
              type: "void",
              hasGravityFields: true, // Areas with different gravity directions
              hasFloatingIslands: true,
              environment: {
                  fogColor: 0x110022,
                  ambientLightColor: 0x220033,
                  particleColor: 0x4400aa,
              }
          },
          enemies: [],
          interactiveObjects: undefined
      },
      
      // Level 2: Reality Fracture
      {
          id: 302,
          name: "Void Realm: Reality Fracture",
          grid: [
              [1, 1, 1, 0, 0, 0, 0, 0],
              [0, 0, 1, 0, 0, 0, 0, 0],
              [0, 0, 1, 1, 1, 0, 0, 0],
              [0, 0, 0, 0, 1, 1, 0, 0],
              [0, 0, 0, 0, 0, 1, 0, 0],
              [0, 0, 7, 1, 1, 1, 0, 0],
              [0, 0, 1, 0, 0, 0, 0, 0],
              [0, 0, 2, 0, 0, 0, 0, 0],
          ],
          start: { x: 0, z: 0 },
          teleports: [
              {
                  entrance: { x: 2, z: 5 },
                  exit: { x: 5, z: 3 },
              }
          ],
          enemies: [
              {
                  type: EnemyType.VOID_ANOMALY,
                  start: { x: 4, z: 2 },
                  patrolPath: [
                      { x: 4, z: 2 },
                      { x: 2, z: 2 },
                  ],
                  speed: 0.05,
                  detectionRadius: 2
              }
          ],
          powerUps: [
              {
                  type: PowerUpType.REALITY_BEND,
                  position: { x: 1, z: 0 }
              }
          ],
          message: "Reality fluctuates here. Some paths exist only when observed from certain angles.",
          realmProperties: {
              type: "void",
              hasGravityFields: true,
              hasFloatingIslands: true,
              hasRealityShifts: true, // New mechanic: paths appear/disappear based on perspective
              environment: {
                  fogColor: 0x110033,
                  ambientLightColor: 0x220044,
                  particleColor: 0x5500cc,
              }
          },
          interactiveObjects: undefined
      },
      
      // Level 3: Beyond Comprehension
      {
          id: 303,
          name: "Void Realm: Beyond Comprehension",
          grid: [
              [1, 1, 1, 0, 0, 0, 0, 0],
              [0, 0, 1, 0, 0, 0, 0, 0],
              [0, 0, 1, 1, 1, 1, 1, 0],
              [0, 0, 0, 0, 0, 0, 1, 0],
              [0, 0, 7, 0, 0, 0, 1, 0],
              [0, 0, 1, 0, 0, 0, 1, 0],
              [0, 0, 1, 0, 0, 0, 1, 0],
              [0, 0, 1, 1, 1, 1, 2, 0],
          ],
          start: { x: 0, z: 0 },
          teleports: [
              {
                  entrance: { x: 2, z: 4 },
                  exit: { x: 6, z: 3 },
              }
          ],
          enemies: [
              {
                  type: EnemyType.VOID_WATCHER,
                  start: { x: 5, z: 6 },
                  speed: 0.04,
                  viewDistance: 5,
                  fieldOfView: 120,
              }
          ],
          powerUps: [
              {
                  type: PowerUpType.VOID_STEP,
                  position: { x: 6, z: 2 }
              },
              {
                  type: PowerUpType.REALITY_BEND,
                  position: { x: 2, z: 6 }
              }
          ],
          keys: [{ x: 6, z: 2 }],
          barriers: [{ x: 3, z: 7 }],
          message: "The Void Watchers see through dimensions. Only Void Step can hide you from their gaze.",
          realmProperties: {
              type: "void",
              hasGravityFields: true,
              hasFloatingIslands: true,
              hasRealityShifts: true,
              hasDimensionalOverlaps: true, // New mechanic: multiple overlapping realities
              environment: {
                  fogColor: 0x220044,
                  ambientLightColor: 0x330066,
                  particleColor: 0x6600ff,
              }
          },
          interactiveObjects: undefined
      }
    ],
    unlockCriteria: {
      requiredRealms: ["echo", "shadow", "crystal"],
      requiredEnergy: 8
    },
    environmentSettings: {
      fogColor: 0x220044,
      ambientLightColor: 0x330066,
      particleColor: 0x6600ff,
      musicTrack: "void_ambient",
      specialEffects: ["gravity_distortion", "reality_warping"]
    }
  },
  
  // Nexus Realm - The Final Challenge
  {
    id: "nexus",
    name: "Nexus Realm",
    description: "The convergence of all realms. Master the mechanics of every dimension to reach the core.",
    type: RealmType.NEXUS,
    levels: [
      // Final Level: The Convergence
      {
          id: 401,
          name: "Nexus Realm: The Convergence",
          grid: [
              [1, 1, 1, 1, 1, 1, 1, 1],
              [1, 0, 0, 0, 0, 0, 0, 1],
              [1, 0, 1, 1, 1, 1, 0, 1],
              [1, 0, 1, 9, 9, 1, 0, 1],
              [1, 0, 1, 9, 9, 1, 0, 1],
              [1, 0, 1, 1, 1, 1, 0, 1],
              [1, 0, 0, 0, 0, 0, 0, 1],
              [1, 1, 1, 1, 2, 1, 1, 1],
          ],
          start: { x: 0, z: 0 },
          enemies: [
              {
                  type: EnemyType.SHADOW_LURKER,
                  start: { x: 1, z: 3 },
                  patrolPath: [
                      { x: 1, z: 3 },
                      { x: 1, z: 6 },
                  ],
                  speed: 0.06,
              },
              {
                  type: EnemyType.CRYSTAL_GUARDIAN,
                  start: { x: 6, z: 3 },
                  patrolPath: [
                      { x: 6, z: 3 },
                      { x: 6, z: 6 },
                  ],
                  speed: 0.06,
              },
              {
                  type: EnemyType.VOID_WATCHER,
                  start: { x: 3, z: 6 },
                  speed: 0.05,
                  viewDistance: 4,
                  fieldOfView: 120,
              }
          ],
          powerUps: [
              {
                  type: PowerUpType.LIGHT_SOURCE,
                  position: { x: 2, z: 2 }
              },
              {
                  type: PowerUpType.PRISM,
                  position: { x: 5, z: 2 }
              },
              {
                  type: PowerUpType.VOID_STEP,
                  position: { x: 3, z: 5 }
              }
          ],
          energyRequired: 10,
          message: "The Nexus contains elements from all realms. Use each realm's abilities strategically to reach the core.",
          realmProperties: {
              type: "nexus",
              // Combines mechanics from all realms
              tileLifespan: 4000,
              visibilityRange: 3,
              hasLightBeams: true,
              hasGravityFields: true,
              hasShadowEntities: true,
              hasReflectiveSurfaces: true,
              hasRealmTransitions: true, // New mechanic: sections of the level follow different realm rules
              environment: {
                  fogColor: 0x440088,
                  ambientLightColor: 0x550099,
                  particleColor: 0x8800ff,
              }
          },
          interactiveObjects: undefined
      }
    ],
    unlockCriteria: {
      requiredRealms: ["echo", "shadow", "crystal", "void"],
      requiredEnergy: 10
    },
    environmentSettings: {
      fogColor: 0x440088,
      ambientLightColor: 0x550099,
      particleColor: 0x8800ff,
      musicTrack: "nexus_ambient",
      specialEffects: ["realm_convergence", "reality_flux"]
    }
  }
];

// Helper functions
export const getRealm = (id: string): RealmDefinition | undefined => {
  return GAME_REALMS.find(realm => realm.id === id);
};

export const getAllRealms = (): RealmDefinition[] => {
  return GAME_REALMS;
};

export const getUnlockedRealms = (completedRealms: string[], totalEnergy: number): RealmDefinition[] => {
  return GAME_REALMS.filter(realm => {
    // The Echo Realm is always unlocked
    if (realm.id === "echo") return true;
    
    // Check unlock criteria
    if (realm.unlockCriteria) {
      // Check if all required realms are completed
      const hasRequiredRealms = realm.unlockCriteria.requiredRealms.every(
        requiredRealm => completedRealms.includes(requiredRealm)
      );
      
      // Check if player has enough energy
      const hasEnoughEnergy = !realm.unlockCriteria.requiredEnergy || 
                              totalEnergy >= realm.unlockCriteria.requiredEnergy;
      
      return hasRequiredRealms && hasEnoughEnergy;
    }
    
    return false;
  });
};

export default GAME_REALMS;