export type GameState = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export type ObstacleType =
  | 'STATIC_BLOCK'
  | 'MOVING_SWEEPER'
  | 'PULSE_LASER'
  | 'SPLITTER'
  | 'PRECISION_GATE'
  | 'ZIGZAG_PROWLER'
  | 'PINCER_GATES'
  | 'HOMING_MINE'
  | 'EXPANDING_WAVE';

export interface Obstacle {
  id: string;
  type: ObstacleType;
  x: number;
  y: number;
  width: number;
  height: number;
  speedY: number;
  speedX?: number;
  minX?: number;
  maxX?: number;
  baseX?: number;
  color: string;
  hasSplit?: boolean;
  pulsePhase?: number;
  sineFrequency?: number;
  sineAmplitude?: number;
  expansionRate?: number;
  targetWidth?: number;
  isPassed?: boolean;
  nearMissAwarded?: boolean;
  shape?: 'rect' | 'circle' | 'diamond' | 'gate';
}

export type PowerupType = 'SHIELD' | 'SLOW_MO' | 'SCORE_ORB' | 'DASH_RECHARGE';

export interface Powerup {
  id: string;
  type: PowerupType;
  x: number;
  y: number;
  radius: number;
  speedY: number;
  color: string;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  scale: number;
  life: number;
}

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  dashCooldown: number; // in seconds
  dashTimer: number; // current cooldown timer
  isDashing: boolean;
  dashDuration: number;
  hasShield: boolean;
  slowMoTimer: number;
}

export interface DifficultyTier {
  level: number;
  name: string;
  thresholdScore: number;
  baseSpeed: number;
  spawnInterval: number;
  allowedTypes: ObstacleType[];
  hazardColor: string;
  description: string;
}

export interface GameMetrics {
  score: number;
  highScore: number;
  multiplier: number;
  comboStreak: number;
  survivalTime: number; // in seconds
  level: number;
  levelName: string;
  speedMultiplier: number;
  stageProgress: number; // 0 to 100
  nearMisses: number;
  obstaclesAvoided: number;
  powerupsCollected: number;
  activeStormEvent?: string | null;
}

export interface ScoreEntry {
  id: string;
  playerName: string;
  score: number;
  survivalTime: number;
  nearMisses: number;
  obstaclesAvoided: number;
  maxMultiplier: number;
  levelReached: number;
  rank: 'S' | 'A' | 'B' | 'C';
  date: string;
}

export interface GameSettings {
  soundEnabled: boolean;
  volume: number; // 0 to 1
  musicEnabled: boolean;
  musicVolume: number; // 0 to 1
  screenShake: boolean;
  controlMode: 'keyboard' | 'mouse' | 'touch';
  sensitivity: number; // 0.5 to 2.0
}

export interface TouchInputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  dash: boolean;
  targetXRatio?: number | null;
}

