// Game types for Void Resonance

import * as THREE from 'three';

// Tile types in the grid
export enum TileType {
  EMPTY = 0,
  PATH = 1,
  GOAL = 2,
  KEY = 3,
  SWITCH = 4,
  TRAP = 5,
  POWER_UP = 6,
  TELEPORT = 7,
  BARRIER = 8,
  ENERGY = 9
}

// Enemy types
export enum EnemyType {
  PATROLLER = 0,
  HUNTER = 1,
  SENTINEL = 2,
}

// Power-up types
export enum PowerUpType {
  SPEED = 0,
  INVISIBILITY = 1,
  SHIELD = 2,
  TELEPORT = 3,
}

// Player state
export interface PlayerState {
  position: THREE.Vector3;
  gridPosition: { x: number, z: number };
  isMoving: boolean;
  health: number;
  lives: number;
  powerUps: PowerUpState[];
  keys: number;
  energy: number;
  isInvisible: boolean;
  isShielded: boolean;
}

// Power-up state
export interface PowerUpState {
  type: PowerUpType;
  duration: number;
  startTime: number;
  isActive: boolean;
}

// Enemy state
export interface EnemyState {
  id: number;
  type: EnemyType;
  position: THREE.Vector3;
  gridPosition: { x: number, z: number };
  targetPosition: THREE.Vector3;
  mesh: THREE.Mesh | null;
  glowMesh: THREE.Mesh | null;
  isMoving: boolean;
  speed: number;
  detectionRadius: number;
  patrolPath?: { x: number, z: number }[];
  patrolIndex?: number;
  patrolDirection?: number;
  lastPlayerSighting?: { x: number, z: number };
  fieldOfView?: number;
  viewDistance?: number;
  alertState: 'passive' | 'suspicious' | 'alerted';
  stunDuration: number;
  stunEnd: number;
  isStunned: boolean;
}

// Level definition
export interface LevelDefinition {
  id: number;
  name: string;
  grid: number[][];
  start: { x: number, z: number };
  goal?: { x: number, z: number };
  enemies: {
    type: EnemyType;
    start: { x: number, z: number };
    patrolPath?: { x: number, z: number }[];
    fieldOfView?: number;
    viewDistance?: number;
    speed?: number;
    detectionRadius?: number; // Add this property
  }[];
  powerUps?: {
    type: PowerUpType;
    position: { x: number, z: number };
  }[];
  keys?: { x: number, z: number }[];
  switches?: {
    position: { x: number, z: number };
    target: { x: number, z: number };
  }[];
  timeLimit?: number;
  teleports?: {
    entrance: { x: number, z: number };
    exit: { x: number, z: number };
  }[];
  barriers?: { x: number, z: number }[];
  message?: string;
  energyRequired?: number;
}

// Game state
export interface GameState {
  currentLevel: number;
  player: PlayerState;
  enemies: EnemyState[];
  levelCompleted: boolean;
  gameOver: boolean;
  timer: number;
  score: number;
  keysCollected: number;
  switchesActivated: string[];
  teleportsActivated: string[];
  activePowerUps: PowerUpState[];
  message: string;
  messageTimeout: number;
}

// Game progression
export interface GameProgress {
  levelsCompleted: number[];
  currentLevel: number;
  totalScore: number;
  highScores: Record<number, number>;
  unlockedLevels: number[];
}

// Game settings
export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  volume: number;
  difficulty: 'easy' | 'normal' | 'hard';
  fullscreen: boolean;
  showFPS: boolean;
  particleEffects: 'low' | 'medium' | 'high';
}

// Audio event types
export enum AudioEventType {
  PLAYER_MOVE,
  PLAYER_COLLECT,
  PLAYER_TELEPORT,
  PLAYER_DAMAGE,
  PLAYER_POWERUP,
  ENEMY_ALERT,
  ENEMY_ATTACK,
  ENEMY_STUN,
  LEVEL_COMPLETE,
  GAME_OVER,
  SWITCH_ACTIVATE,
  TELEPORT_USE,
  BARRIER_TOGGLE,
  AMBIENT,
  UI_SELECT,
  UI_CONFIRM,
  UI_CANCEL
}

// Particle effect types
export enum ParticleEffectType {
  PLAYER_TRAIL,
  ENEMY_TRAIL,
  POWERUP_COLLECT,
  KEY_COLLECT,
  TELEPORT,
  ENEMY_ALERT,
  LEVEL_COMPLETE,
  SWITCH_ACTIVATE,
  PLAYER_DAMAGE,
  PLAYER_SHIELD,
  PLAYER_INVISIBILITY
}