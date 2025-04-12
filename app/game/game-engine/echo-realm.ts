import { LevelDefinition, EnemyType, PowerUpType, TileType } from '../types/game-types';

export interface EchoTile {
  x: number;
  z: number;
  stepTime: number;
  fadeDelay: number;
  isVisible: boolean;
}

export class EchoRealm {
  private static readonly FADE_TIME = 3000; // Time before a tile starts to fade after stepping on it (in ms)
  
  // Echo Realm Level 1: The Path of Memories
  public static readonly LEVEL_1: LevelDefinition = {
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
      message: "Welcome to the Echo Realm. Step carefully, for your path fades behind you. Reach the portal before your memory is lost.",
      timeLimit: 45, // Add time pressure
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
      },
      interactiveObjects: undefined
  };

  // Echo Realm Level 2: Reflections
  public static readonly LEVEL_2: LevelDefinition = {
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
      teleports: [
          {
              entrance: { x: 5, z: 6 },
              exit: { x: 3, z: 3 },
          }
      ],
      message: "Teleporters create echoes across dimensions. Your path fades faster now. Time is running out.",
      timeLimit: 35, // Less time than before
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
      },
      interactiveObjects: undefined
  };

  // Echo Realm Level 3: Shattered Memories
  public static readonly LEVEL_3: LevelDefinition = {
      id: 3,
      name: "Echo Realm: Shattered Memories",
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
      powerUps: [
          {
              type: PowerUpType.SPEED,
              position: { x: 1, z: 2 }
          }
      ],
      message: "The Echoes are disrupted by strange entities. Be swift, be silent - your path crumbles ever faster.",
      timeLimit: 30, // Even less time
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
      },
      interactiveObjects: undefined
  };

  // Get all Echo Realm levels
  public static getLevels(): LevelDefinition[] {
    return [
      this.LEVEL_1,
      this.LEVEL_2,
      this.LEVEL_3
    ];
  }

  // Track which tiles have been stepped on and when
  private steppedTiles: Map<string, EchoTile> = new Map();
  
  constructor() {
    this.steppedTiles = new Map();
  }

  // Register that the player has stepped on a tile
  public registerTileStep(x: number, z: number): void {
    const tileKey = `${x}_${z}`;
    const currentTime = Date.now();
    
    this.steppedTiles.set(tileKey, {
      x,
      z,
      stepTime: currentTime,
      fadeDelay: EchoRealm.FADE_TIME,
      isVisible: true
    });
  }

  // Get all tiles that have been stepped on
  public getSteppedTiles(): EchoTile[] {
    return Array.from(this.steppedTiles.values());
  }

  // Update the fading state of tiles
  public updateFadingTiles(currentTime: number, levelProperties: any): EchoTile[] {
    const fadingTiles: EchoTile[] = [];
    const tileLifespan = levelProperties?.tileLifespan || EchoRealm.FADE_TIME;
    
    this.steppedTiles.forEach((tile, key) => {
      const elapsed = currentTime - tile.stepTime;
      
      if (elapsed > tileLifespan) {
        // Tile should now be invisible
        if (tile.isVisible) {
          tile.isVisible = false;
          this.steppedTiles.set(key, tile);
        }
        fadingTiles.push(tile);
      } else if (elapsed > tileLifespan * 0.7) {
        // Tile is starting to fade
        fadingTiles.push(tile);
      }
    });
    
    return fadingTiles;
  }

  // Reset the realm state
  public reset(): void {
    this.steppedTiles.clear();
  }
}