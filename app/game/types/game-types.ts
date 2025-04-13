// types/game-types.ts

// Enum for realm types
export enum RealmType {
  HUB = "hub",
  ECHO = "echo",
  SHADOW = "shadow",
  CRYSTAL = "crystal",
  VOID = "void",
  NEXUS = "nexus"
}

// Interface for the basic level pattern game
export interface LevelPattern {
  sequence: {x: number, y: number}[];
  gridSize: number;
  timeLimit?: number;
}

// Color themes for each realm
export const RealmColors = {
  [RealmType.HUB]: "#a855f7",      // Purple
  [RealmType.ECHO]: "#a855f7",     // Purple
  [RealmType.SHADOW]: "#444466",   // Dark Blue
  [RealmType.CRYSTAL]: "#88ccff",  // Light Blue
  [RealmType.VOID]: "#8800ff",     // Deep Purple
  [RealmType.NEXUS]: "#ff00ff"     // Magenta
};

// Description of each realm
export const RealmDescriptions = {
  [RealmType.HUB]: "The central nexus connecting all realms.",
  [RealmType.ECHO]: "A realm of memory and patterns. Watch the sequence, then repeat it exactly.",
  [RealmType.SHADOW]: "A realm of darkness and illusion. Find your way through the shadows.",
  [RealmType.CRYSTAL]: "A realm of light and reflection. Solve puzzles using crystal prisms.",
  [RealmType.VOID]: "A realm of emptiness and space. Navigate the void between dimensions.",
  [RealmType.NEXUS]: "The convergence of all realms. Master the combined challenges."
};