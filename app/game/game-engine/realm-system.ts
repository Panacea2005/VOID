import { LevelDefinition } from '../types/game-types';
import { EchoRealm } from './echo-realm';

// Enum for realm types
export enum RealmType {
  ECHO = "echo",
  SHADOW = "shadow",
  CRYSTAL = "crystal",
  VOID = "void",
  NEXUS = "nexus"
}

/**
 * RealmSystem manages the different realms in the game
 * Each realm has its own set of levels and unique mechanics
 */
export class RealmSystem {
  private realms: Map<RealmType, LevelDefinition[]> = new Map();
  private currentRealmType: RealmType = RealmType.ECHO;
  
  constructor() {
    this.initializeRealms();
  }

  /**
   * Initialize all realms and their levels
   */
  private initializeRealms(): void {
    // Add Echo Realm levels
    this.realms.set(RealmType.ECHO, EchoRealm.getLevels());
    
    // TODO: Add other realms when they are implemented
    // this.realms.set(RealmType.SHADOW, ShadowRealm.getLevels());
    // this.realms.set(RealmType.CRYSTAL, CrystalRealm.getLevels());
    // this.realms.set(RealmType.VOID, VoidRealm.getLevels());
    // this.realms.set(RealmType.NEXUS, NexusRealm.getLevels());
  }

  /**
   * Get all levels from all realms
   */
  public getAllLevels(): LevelDefinition[] {
    const allLevels: LevelDefinition[] = [];
    
    // Add levels from each realm
    this.realms.forEach((levels) => {
      allLevels.push(...levels);
    });
    
    return allLevels;
  }

  /**
   * Get levels for a specific realm
   */
  public getRealmLevels(realmType: RealmType): LevelDefinition[] {
    return this.realms.get(realmType) || [];
  }

  /**
   * Set the current realm
   */
  public setCurrentRealm(realmType: RealmType): void {
    this.currentRealmType = realmType;
  }

  /**
   * Get the current realm type
   */
  public getCurrentRealmType(): RealmType {
    return this.currentRealmType;
  }

  /**
   * Get a level by ID
   */
  public getLevelById(id: number): LevelDefinition | undefined {
    for (const levels of this.realms.values()) {
      const level = levels.find(level => level.id === id);
      if (level) return level;
    }
    return undefined;
  }

  /**
   * Get the next level after the given level ID
   */
  public getNextLevel(currentId: number): LevelDefinition | undefined {
    // Get current realm's levels
    const currentRealmLevels = this.getRealmLevels(this.currentRealmType);
    
    // Find the current level's index
    const currentIndex = currentRealmLevels.findIndex(level => level.id === currentId);
    
    if (currentIndex === -1) return undefined;
    
    // Check if there's a next level in the current realm
    if (currentIndex < currentRealmLevels.length - 1) {
      return currentRealmLevels[currentIndex + 1];
    }
    
    // If we've completed all levels in the current realm, move to the next realm
    const realmTypes = Array.from(this.realms.keys());
    const currentRealmIndex = realmTypes.indexOf(this.currentRealmType);
    
    if (currentRealmIndex < realmTypes.length - 1) {
      // Move to the next realm
      const nextRealmType = realmTypes[currentRealmIndex + 1];
      this.setCurrentRealm(nextRealmType);
      
      // Return the first level of the next realm
      const nextRealmLevels = this.getRealmLevels(nextRealmType);
      return nextRealmLevels.length > 0 ? nextRealmLevels[0] : undefined;
    }
    
    // We've completed all realms and levels
    return undefined;
  }

  /**
   * Determine if a level is from a specific realm
   */
  public isLevelFromRealm(level: LevelDefinition, realmType: RealmType): boolean {
    return level.realmProperties?.type === realmType;
  }
  
  /**
   * Get the name of the current realm
   */
  public getCurrentRealmName(): string {
    switch (this.currentRealmType) {
      case RealmType.ECHO:
        return "Echo Realm";
      case RealmType.SHADOW:
        return "Shadow Realm";
      case RealmType.CRYSTAL:
        return "Crystal Realm";
      case RealmType.VOID:
        return "Void Realm";
      case RealmType.NEXUS:
        return "Nexus Realm";
      default:
        return "Unknown Realm";
    }
  }
}