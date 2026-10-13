import { DifficultyTier, Obstacle, ObstacleType } from '../types/game';

export const DIFFICULTY_TIERS: DifficultyTier[] = [
  {
    level: 1,
    name: 'Pemanasan',
    thresholdScore: 0,
    baseSpeed: 210,
    spawnInterval: 1.25,
    allowedTypes: ['STATIC_BLOCK'],
    hazardColor: '#38bdf8',
    description: 'Orientasi manuver awal dengan balok-balok statis bercelah lebar.',
  },
  {
    level: 2,
    name: 'Akselerasi & Ayunan',
    thresholdScore: 400,
    baseSpeed: 260,
    spawnInterval: 1.05,
    allowedTypes: ['STATIC_BLOCK', 'MOVING_SWEEPER', 'ZIGZAG_PROWLER'],
    hazardColor: '#f97316',
    description: 'Penyapu horizontal dan prowler zig-zag mulai menguji ritme refleks.',
  },
  {
    level: 3,
    name: 'Gerbang Presisi & Laser',
    thresholdScore: 1100,
    baseSpeed: 315,
    spawnInterval: 0.90,
    allowedTypes: ['STATIC_BLOCK', 'MOVING_SWEEPER', 'ZIGZAG_PROWLER', 'PULSE_LASER', 'PRECISION_GATE'],
    hazardColor: '#ec4899',
    description: 'Laser berdenyut dan gerbang celah sempit menuntut akurasi posisi tinggi.',
  },
  {
    level: 4,
    name: 'Pecahan & Ranjau Pelacak',
    thresholdScore: 2300,
    baseSpeed: 375,
    spawnInterval: 0.76,
    allowedTypes: ['MOVING_SWEEPER', 'ZIGZAG_PROWLER', 'PULSE_LASER', 'SPLITTER', 'HOMING_MINE'],
    hazardColor: '#a855f7',
    description: 'Rintangan membelah diri serta ranjau pelacak yang membidik posisi pesawat.',
  },
  {
    level: 5,
    name: 'Tekanan Capit & Gelombang Kejut',
    thresholdScore: 4200,
    baseSpeed: 435,
    spawnInterval: 0.62,
    allowedTypes: ['MOVING_SWEEPER', 'PULSE_LASER', 'SPLITTER', 'HOMING_MINE', 'PINCER_GATES', 'EXPANDING_WAVE'],
    hazardColor: '#ef4444',
    description: 'Gerbang capit menjepit ke tengah dan balok gelombang kejut yang melebar.',
  },
  {
    level: 6,
    name: 'Zona Transenden Master',
    thresholdScore: 6800,
    baseSpeed: 495,
    spawnInterval: 0.48,
    allowedTypes: [
      'STATIC_BLOCK',
      'MOVING_SWEEPER',
      'PULSE_LASER',
      'SPLITTER',
      'PRECISION_GATE',
      'ZIGZAG_PROWLER',
      'PINCER_GATES',
      'HOMING_MINE',
      'EXPANDING_WAVE',
    ],
    hazardColor: '#e11d48',
    description: 'Kecepatan hiper dinamis dan formasi rintangan ganda tanpa henti.',
  },
];

/**
 * Calculates continuous speed multiplier as score climbs.
 * Formula ensures smooth logarithmic acceleration without abrupt jolts.
 */
export function calculateSpeedMultiplier(score: number): number {
  if (score <= 0) return 1.0;
  // Scaled logarithmic growth: 1.0 -> 2.5x
  const growth = Math.log10(1 + score / 900) * 0.95;
  return Math.min(2.65, Number((1.0 + growth).toFixed(2)));
}

/**
 * Calculates dynamic obstacle spawn interval (seconds).
 */
export function calculateSpawnInterval(score: number, level: number): number {
  const tier = getTierForScore(score);
  // Interval gradually compresses as score increases
  const scoreFactor = Math.min(0.4, (score / 10000) * 0.35);
  const interval = Math.max(0.42, tier.spawnInterval - scoreFactor);
  return interval;
}

/**
 * Retrieves current difficulty tier based on score.
 */
export function getTierForScore(score: number): DifficultyTier {
  for (let i = DIFFICULTY_TIERS.length - 1; i >= 0; i--) {
    if (score >= DIFFICULTY_TIERS[i].thresholdScore) {
      return DIFFICULTY_TIERS[i];
    }
  }
  return DIFFICULTY_TIERS[0];
}

/**
 * Calculates progress percentage toward next level (0% to 100%).
 */
export function calculateStageProgress(score: number): number {
  const tierIndex = DIFFICULTY_TIERS.findIndex((t, i) => {
    const nextTier = DIFFICULTY_TIERS[i + 1];
    return !nextTier || score < nextTier.thresholdScore;
  });

  if (tierIndex === -1 || tierIndex >= DIFFICULTY_TIERS.length - 1) {
    return 100; // Max tier
  }

  const currentThreshold = DIFFICULTY_TIERS[tierIndex].thresholdScore;
  const nextThreshold = DIFFICULTY_TIERS[tierIndex + 1].thresholdScore;
  const range = nextThreshold - currentThreshold;
  const progress = ((score - currentThreshold) / range) * 100;
  return Math.min(100, Math.max(0, Math.round(progress)));
}

/**
 * Generator for individual obstacles based on current tier and parameters.
 */
export function generateObstacle(
  arenaWidth: number,
  score: number,
  playerX: number
): Obstacle[] {
  const tier = getTierForScore(score);
  const speedMult = calculateSpeedMultiplier(score);
  const baseSpeed = tier.baseSpeed * speedMult;
  const idPrefix = Math.random().toString(36).substring(2, 8);

  // Pick random allowed type weighted towards newer types in current tier
  const allowed = tier.allowedTypes;
  const chosenType: ObstacleType = allowed[Math.floor(Math.random() * allowed.length)];

  switch (chosenType) {
    case 'ZIGZAG_PROWLER': {
      // Sine wave prowler that sweeps back and forth smoothly
      const width = 64;
      const startX = 60 + Math.random() * (arenaWidth - 120);
      return [
        {
          id: `${idPrefix}_zigzag`,
          type: 'ZIGZAG_PROWLER',
          x: startX,
          baseX: startX,
          y: -40,
          width,
          height: 24,
          speedY: baseSpeed * 0.95,
          sineAmplitude: 60 + Math.random() * 40,
          sineFrequency: 2.8 + Math.random() * 1.4,
          pulsePhase: Math.random() * Math.PI * 2,
          color: '#f59e0b',
        },
      ];
    }

    case 'HOMING_MINE': {
      // Seeker mine: tracks player's X coordinate gently, demanding swift juke
      const size = 32;
      const startX = Math.random() * (arenaWidth - size);
      return [
        {
          id: `${idPrefix}_mine`,
          type: 'HOMING_MINE',
          x: startX,
          y: -40,
          width: size,
          height: size,
          speedY: baseSpeed * 0.85,
          speedX: 85, // max tracking speed
          color: '#ec4899',
          shape: 'diamond',
        },
      ];
    }

    case 'EXPANDING_WAVE': {
      // Starts as small bar, horizontally expands outward as it drops
      const initialWidth = 48;
      const startX = arenaWidth / 2 - initialWidth / 2;
      return [
        {
          id: `${idPrefix}_expand`,
          type: 'EXPANDING_WAVE',
          x: startX,
          y: -40,
          width: initialWidth,
          height: 22,
          speedY: baseSpeed * 0.9,
          expansionRate: 75 + Math.random() * 40,
          targetWidth: arenaWidth * 0.72,
          color: '#ef4444',
        },
      ];
    }

    case 'PINCER_GATES': {
      // Two converging walls from left and right towards center
      const wallWidth = arenaWidth * 0.42;
      return [
        {
          id: `${idPrefix}_pincerL`,
          type: 'PINCER_GATES',
          x: -40, // slides right towards center
          y: -40,
          width: wallWidth,
          height: 26,
          speedY: baseSpeed * 0.95,
          speedX: 55, // moving inward
          color: '#dc2626',
        },
        {
          id: `${idPrefix}_pincerR`,
          type: 'PINCER_GATES',
          x: arenaWidth - wallWidth + 40, // slides left towards center
          y: -40,
          width: wallWidth,
          height: 26,
          speedY: baseSpeed * 0.95,
          speedX: -55,
          color: '#dc2626',
        },
      ];
    }

    case 'PRECISION_GATE': {
      // A precision gate: two static blocks leaving a narrow corridor
      const gapWidth = Math.max(76, 120 - tier.level * 8);
      const gapX = 40 + Math.random() * (arenaWidth - gapWidth - 80);
      return [
        {
          id: `${idPrefix}_gateL`,
          type: 'PRECISION_GATE',
          x: 0,
          y: -40,
          width: gapX,
          height: 24,
          speedY: baseSpeed,
          color: '#06b6d4',
        },
        {
          id: `${idPrefix}_gateR`,
          type: 'PRECISION_GATE',
          x: gapX + gapWidth,
          y: -40,
          width: arenaWidth - (gapX + gapWidth),
          height: 24,
          speedY: baseSpeed,
          color: '#06b6d4',
        },
      ];
    }

    case 'PULSE_LASER': {
      const gapWidth = Math.max(88, 130 - tier.level * 7);
      const gateWidth = (arenaWidth - gapWidth) / 2;
      return [
        {
          id: `${idPrefix}_laserL`,
          type: 'PULSE_LASER',
          x: 0,
          y: -40,
          width: gateWidth,
          height: 24,
          speedY: baseSpeed * 0.92,
          pulsePhase: Math.random() * Math.PI * 2,
          color: '#ec4899',
        },
        {
          id: `${idPrefix}_laserR`,
          type: 'PULSE_LASER',
          x: arenaWidth - gateWidth,
          y: -40,
          width: gateWidth,
          height: 24,
          speedY: baseSpeed * 0.92,
          pulsePhase: Math.random() * Math.PI * 2,
          color: '#ec4899',
        },
      ];
    }

    case 'MOVING_SWEEPER': {
      const width = 85 + Math.random() * 45;
      const startX = Math.random() * (arenaWidth - width);
      return [
        {
          id: `${idPrefix}_sweep`,
          type: 'MOVING_SWEEPER',
          x: startX,
          y: -40,
          width,
          height: 25,
          speedY: baseSpeed,
          speedX: (Math.random() > 0.5 ? 1 : -1) * (100 + tier.level * 22),
          minX: 10,
          maxX: arenaWidth - width - 10,
          color: '#f97316',
        },
      ];
    }

    case 'SPLITTER': {
      const width = 56;
      const startX = 60 + Math.random() * (arenaWidth - 120);
      return [
        {
          id: `${idPrefix}_split`,
          type: 'SPLITTER',
          x: startX,
          y: -40,
          width,
          height: 26,
          speedY: baseSpeed * 1.05,
          color: '#a855f7',
          hasSplit: false,
        },
      ];
    }

    case 'STATIC_BLOCK':
    default: {
      const width = 75 + Math.random() * (arenaWidth * 0.32);
      const startX = Math.random() * (arenaWidth - width);
      return [
        {
          id: `${idPrefix}_block`,
          type: 'STATIC_BLOCK',
          x: startX,
          y: -40,
          width,
          height: 24 + Math.random() * 8,
          speedY: baseSpeed,
          color: tier.hazardColor,
        },
      ];
    }
  }
}

/**
 * Creates a choreographed "Reflex Storm Wave" triggered at milestone scores.
 */
export function generateStormWave(arenaWidth: number, score: number): Obstacle[] {
  const speed = 320 * calculateSpeedMultiplier(score);
  const idPrefix = 'storm_' + Math.random().toString(36).substring(2, 6);
  const obstacles: Obstacle[] = [];

  // Alternating Slalom Gate or Double Pincer
  const gap = 110;
  const leftX = (arenaWidth - gap) / 2;

  // Staggered corridor: Left bar, then slightly delayed Right bar
  obstacles.push(
    {
      id: `${idPrefix}_L`,
      type: 'STATIC_BLOCK',
      x: 0,
      y: -50,
      width: leftX,
      height: 26,
      speedY: speed,
      color: '#f43f5e',
    },
    {
      id: `${idPrefix}_R`,
      type: 'STATIC_BLOCK',
      x: leftX + gap,
      y: -50,
      width: arenaWidth - (leftX + gap),
      height: 26,
      speedY: speed,
      color: '#f43f5e',
    },
    // Follow-up center obstacle requiring weave
    {
      id: `${idPrefix}_C`,
      type: 'MOVING_SWEEPER',
      x: leftX + 15,
      y: -190,
      width: gap - 30,
      height: 24,
      speedY: speed * 1.1,
      speedX: 80,
      minX: 20,
      maxX: arenaWidth - 100,
      color: '#fbbf24',
    }
  );

  return obstacles;
}
