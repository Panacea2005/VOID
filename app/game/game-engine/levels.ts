import { LevelDefinition, EnemyType, PowerUpType, TileType } from '../types/game-types';

// Define all levels for the game
const GAME_LEVELS: LevelDefinition[] = [
  // Level 1: Tutorial - Simple Path
  {
    id: 1,
    name: "First Steps",
    grid: [
      [1, 1, 1, 1, 1, 0, 0, 0],
      [0, 0, 0, 0, 1, 0, 0, 0],
      [0, 0, 0, 0, 1, 0, 0, 0],
      [0, 0, 0, 0, 1, 0, 0, 0],
      [0, 0, 0, 0, 1, 1, 1, 2],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ],
    start: { x: 0, z: 0 },
    enemies: [],
    message: "Use WASD or arrow keys to move. Reach the blue goal tile.",
  },

  // Level 2: Introduce Energy Pickups
  {
    id: 2,
    name: "Energy Flow",
    grid: [
      [1, 1, 0, 0, 0, 0, 0, 0],
      [1, 0, 0, 1, 1, 1, 0, 0],
      [1, 0, 0, 1, 0, 1, 0, 0],
      [1, 9, 1, 1, 0, 1, 0, 0],
      [0, 0, 0, 0, 0, 1, 0, 0],
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 0, 1, 0, 0, 0, 0, 0],
      [0, 0, 2, 0, 0, 0, 0, 0],
    ],
    start: { x: 0, z: 0 },
    enemies: [],
    message: "Purple tiles contain energy. Collect them to power your journey.",
  },

  // Level 3: First Enemy
  {
    id: 3,
    name: "First Contact",
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
      }
    ],
    message: "Beware of patrolling enemies. They follow fixed paths. Avoid them!",
  },

  // Level 4: Multiple Patrolling Enemies
  {
    id: 4,
    name: "Patrol Routes",
    grid: [
      [1, 1, 1, 0, 0, 0, 0, 0],
      [0, 0, 1, 0, 0, 0, 0, 0],
      [0, 0, 1, 0, 0, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 0, 0, 0, 0, 1, 0, 0],
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 0, 1, 0, 0, 0, 0, 0],
      [0, 0, 2, 0, 0, 0, 0, 0],
    ],
    start: { x: 0, z: 0 },
    enemies: [
      {
        type: EnemyType.PATROLLER,
        start: { x: 3, z: 3 },
        patrolPath: [
          { x: 3, z: 3 },
          { x: 5, z: 3 },
        ],
        speed: 0.05,
      },
      {
        type: EnemyType.PATROLLER,
        start: { x: 3, z: 5 },
        patrolPath: [
          { x: 3, z: 5 },
          { x: 5, z: 5 },
        ],
        speed: 0.08,
      }
    ],
    energyRequired: 0,
  },

  // Level 5: Introduce Hunter Enemy
  {
    id: 5,
    name: "The Hunter",
    grid: [
      [1, 1, 1, 1, 1, 1, 0, 0],
      [1, 0, 0, 0, 0, 1, 0, 0],
      [1, 0, 9, 9, 0, 1, 0, 0],
      [1, 0, 9, 9, 0, 1, 0, 0],
      [1, 0, 0, 0, 0, 1, 0, 0],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 0, 0, 0, 1],
      [0, 0, 0, 0, 0, 0, 2, 1],
    ],
    start: { x: 0, z: 0 },
    enemies: [
      {
        type: EnemyType.HUNTER,
        start: { x: 3, z: 3 },
        speed: 0.04,
        detectionRadius: 3,
      }
    ],
    powerUps: [
      {
        type: PowerUpType.SPEED,
        position: { x: 3, z: 2 }
      }
    ],
    message: "Hunter enemies will chase you if you get too close. Use speed power-ups to escape!",
  },

  // Level 6: Introduce Sentinel Enemy
  {
    id: 6,
    name: "Watchful Eyes",
    grid: [
      [1, 1, 1, 0, 0, 0, 0, 0],
      [0, 0, 1, 0, 0, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 1, 1],
      [0, 0, 1, 0, 0, 0, 0, 1],
      [0, 0, 1, 0, 0, 0, 0, 1],
      [0, 0, 1, 0, 0, 1, 1, 1],
      [0, 0, 1, 0, 0, 1, 0, 0],
      [0, 0, 1, 1, 1, 1, 2, 0],
    ],
    start: { x: 0, z: 0 },
    enemies: [
      {
        type: EnemyType.SENTINEL,
        start: { x: 5, z: 3 },
        fieldOfView: 90,
        viewDistance: 4,
      }
    ],
    powerUps: [
      {
        type: PowerUpType.INVISIBILITY,
        position: { x: 2, z: 6 }
      }
    ],
    message: "Sentinels stand guard with a field of view. Collect the invisibility power-up to slip past them undetected!",
  },

  // Level 7: Keys and Barriers
  {
    id: 7,
    name: "Locked Away",
    grid: [
      [1, 1, 1, 1, 1, 1, 0, 0],
      [1, 0, 0, 0, 0, 1, 0, 0],
      [1, 0, 0, 3, 0, 1, 0, 0],
      [1, 0, 0, 0, 0, 1, 0, 0],
      [1, 1, 1, 8, 1, 1, 0, 0],
      [0, 0, 1, 0, 0, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 1, 0],
      [0, 0, 0, 0, 0, 0, 2, 0],
    ],
    start: { x: 0, z: 0 },
    keys: [{ x: 3, z: 2 }],
    barriers: [{ x: 3, z: 4 }],
    enemies: [
      {
        type: EnemyType.PATROLLER,
        start: { x: 3, z: 6 },
        patrolPath: [
          { x: 2, z: 6 },
          { x: 5, z: 6 },
        ],
        speed: 0.07,
      }
    ],
    message: "Collect keys to remove barriers blocking your path.",
  },

  // Level 8: Switches and Teleporters
  {
    id: 8,
    name: "Mechanisms",
    grid: [
      [1, 1, 1, 0, 0, 0, 0, 0],
      [0, 0, 1, 0, 0, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 0, 0, 0, 0, 1, 0, 0],
      [0, 0, 0, 0, 4, 1, 0, 0],
      [0, 0, 0, 0, 0, 1, 0, 0],
      [0, 0, 0, 0, 8, 1, 0, 0],
      [0, 0, 0, 7, 1, 1, 2, 0],
    ],
    start: { x: 0, z: 0 },
    switches: [
      {
        position: { x: 4, z: 4 },
        target: { x: 4, z: 6 },
      }
    ],
    teleports: [
      {
        entrance: { x: 3, z: 7 },
        exit: { x: 5, z: 6 },
      }
    ],
    barriers: [{ x: 4, z: 6 }],
    enemies: [
      {
        type: EnemyType.HUNTER,
        start: { x: 4, z: 2 },
        speed: 0.05,
        detectionRadius: 2,
      }
    ],
    message: "Step on switches to toggle barriers. Use teleporters to quickly move across the level.",
  },

  // Level 9: Traps and Power-ups
  {
    id: 9,
    name: "Treacherous Path",
    grid: [
      [1, 5, 1, 5, 1, 0, 0, 0],
      [1, 0, 5, 0, 1, 0, 0, 0],
      [1, 0, 0, 0, 1, 0, 0, 0],
      [1, 5, 1, 1, 1, 0, 0, 0],
      [1, 0, 0, 0, 5, 0, 0, 0],
      [1, 0, 0, 0, 1, 1, 0, 0],
      [1, 6, 1, 5, 0, 1, 0, 0],
      [1, 1, 1, 1, 1, 2, 0, 0],
    ],
    start: { x: 0, z: 0 },
    enemies: [
      {
        type: EnemyType.PATROLLER,
        start: { x: 2, z: 7 },
        patrolPath: [
          { x: 2, z: 7 },
          { x: 2, z: 4 },
        ],
        speed: 0.06,
      }
    ],
    powerUps: [
      {
        type: PowerUpType.SHIELD,
        position: { x: 1, z: 6 }
      }
    ],
    message: "Watch out for traps! Shields will protect you, but only temporarily.",
  },

  // Level 10: Complex Level - All Elements Combined
  {
    id: 10,
    name: "Void Mastery",
    grid: [
      [1, 1, 1, 1, 5, 1, 1, 1],
      [1, 0, 0, 1, 0, 0, 0, 1],
      [1, 0, 3, 1, 0, 0, 6, 1],
      [1, 0, 0, 1, 0, 0, 0, 1],
      [1, 8, 1, 1, 5, 1, 1, 1],
      [1, 0, 0, 7, 0, 1, 0, 5],
      [1, 0, 4, 0, 0, 8, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 2],
    ],
    start: { x: 0, z: 0 },
    enemies: [
      {
        type: EnemyType.PATROLLER,
        start: { x: 2, z: 5 },
        patrolPath: [
          { x: 2, z: 5 },
          { x: 2, z: 7 },
        ],
        speed: 0.07,
      },
      {
        type: EnemyType.HUNTER,
        start: { x: 6, z: 1 },
        speed: 0.05,
        detectionRadius: 3,
      },
      {
        type: EnemyType.SENTINEL,
        start: { x: 5, z: 6 },
        fieldOfView: 120,
        viewDistance: 3,
      }
    ],
    keys: [{ x: 2, z: 2 }],
    barriers: [
      { x: 1, z: 4 },
      { x: 5, z: 6 }
    ],
    switches: [
      {
        position: { x: 2, z: 6 },
        target: { x: 5, z: 6 },
      }
    ],
    teleports: [
      {
        entrance: { x: 3, z: 5 },
        exit: { x: 7, z: 2 },
      }
    ],
    powerUps: [
      {
        type: PowerUpType.SHIELD,
        position: { x: 6, z: 2 }
      }
    ],
    timeLimit: 120,
    message: "This is the ultimate challenge. Use everything you've learned to reach the final goal!",
  },
];

// Helper function to get a specific level
export const getLevel = (id: number): LevelDefinition | undefined => {
  return GAME_LEVELS.find(level => level.id === id);
};

// Get all levels
export const getAllLevels = (): LevelDefinition[] => {
  return GAME_LEVELS;
};

// Get unlocked levels (based on progress)
export const getUnlockedLevels = (completedLevels: number[]): LevelDefinition[] => {
  // Filter levels that are unlocked (completed previous level or first level)
  return GAME_LEVELS.filter(level => {
    if (level.id === 1) return true; // First level is always unlocked
    return completedLevels.includes(level.id - 1);
  });
};

// Convert tile type number to enum for better type checking
export const convertGridToTileTypes = (grid: number[][]): TileType[][] => {
  return grid.map(row => 
    row.map(tile => tile as TileType)
  );
};

export default GAME_LEVELS;