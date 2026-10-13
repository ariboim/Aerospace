import React, { useEffect, useRef, useCallback } from 'react';
import {
  GameMetrics,
  GameSettings,
  GameState,
  Obstacle,
  Particle,
  FloatingText,
  Powerup,
  Player,
  TouchInputState,
} from '../types/game';
import { sounds } from '../services/audio';
import {
  calculateSpeedMultiplier,
  calculateSpawnInterval,
  calculateStageProgress,
  getTierForScore,
  generateObstacle,
  generateStormWave,
} from '../services/difficulty';

interface GameCanvasProps {
  gameState: GameState;
  settings: GameSettings;
  onUpdateMetrics: (updater: (prev: GameMetrics) => GameMetrics) => void;
  onGameOver: (finalMetrics: GameMetrics) => void;
  onTogglePause: () => void;
  touchInput: TouchInputState;
}

const ARENA_WIDTH = 580;
const ARENA_HEIGHT = 720;
const PLAYER_SIZE = 36;
const NEAR_MISS_THRESHOLD = 26; // px threshold for close call

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  settings,
  onUpdateMetrics,
  onGameOver,
  touchInput,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mutable Game Loop State
  const stateRef = useRef({
    player: {
      x: ARENA_WIDTH / 2,
      y: ARENA_HEIGHT - 100,
      width: PLAYER_SIZE,
      height: PLAYER_SIZE,
      speed: 400,
      dashCooldown: 3.0,
      dashTimer: 0,
      isDashing: false,
      dashDuration: 0,
      hasShield: false,
      slowMoTimer: 0,
    } as Player,
    obstacles: [] as Obstacle[],
    powerups: [] as Powerup[],
    particles: [] as Particle[],
    floatingTexts: [] as FloatingText[],
    backgroundStars: [] as { x: number; y: number; speed: number; size: number; alpha: number }[],
    keys: {
      left: false,
      right: false,
      up: false,
      down: false,
      dash: false,
    },
    metrics: {
      score: 0,
      highScore: 0,
      multiplier: 1.0,
      comboStreak: 0,
      survivalTime: 0,
      level: 1,
      levelName: 'Pemanasan',
      speedMultiplier: 1.0,
      stageProgress: 0,
      nearMisses: 0,
      obstaclesAvoided: 0,
      powerupsCollected: 0,
      activeStormEvent: null,
    } as GameMetrics,
    lastTime: 0,
    spawnTimer: 0,
    powerupSpawnTimer: 0,
    survivalScoreTimer: 0,
    hudSyncTimer: 0,
    shakeIntensity: 0,
    lastStormMilestone: 0,
    stageBannerTimer: 0,
    stageBannerText: '',
    directTargetX: null as number | null,
    isExploding: false,
    deathTimer: 0,
    deadMetrics: null as GameMetrics | null,
    powerupAuraTimer: 0,
    powerupAuraColor: '#06b6d4',
  });

  // Initialize stars once
  useEffect(() => {
    const stars: { x: number; y: number; speed: number; size: number; alpha: number }[] = [];
    for (let i = 0; i < 50; i++) {
      stars.push({
        x: Math.random() * ARENA_WIDTH,
        y: Math.random() * ARENA_HEIGHT,
        speed: 45 + Math.random() * 85,
        size: 1 + Math.random() * 2.2,
        alpha: 0.2 + Math.random() * 0.65,
      });
    }
    stateRef.current.backgroundStars = stars;
  }, []);

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'PLAYING') return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        stateRef.current.keys.left = true;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        stateRef.current.keys.right = true;
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        stateRef.current.keys.up = true;
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        stateRef.current.keys.down = true;
      } else if (e.key === ' ' || e.key === 'Shift') {
        stateRef.current.keys.dash = true;
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        stateRef.current.keys.left = false;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        stateRef.current.keys.right = false;
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        stateRef.current.keys.up = false;
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        stateRef.current.keys.down = false;
      } else if (e.key === ' ' || e.key === 'Shift') {
        stateRef.current.keys.dash = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  // Handle Touch Inputs passed from Mobile Overlay
  useEffect(() => {
    stateRef.current.keys.left = touchInput.left;
    stateRef.current.keys.right = touchInput.right;
    stateRef.current.keys.up = touchInput.up;
    stateRef.current.keys.down = touchInput.down;
    if (touchInput.dash) {
      stateRef.current.keys.dash = true;
    }
  }, [touchInput]);

  // Spawn Power-ups (Shield, Slow-Mo, Dash Recharge, Score Orb)
  const spawnPowerup = useCallback(() => {
    const id = Math.random().toString(36).substring(2, 9);
    const rand = Math.random();
    let type: Powerup['type'] = 'SCORE_ORB';
    let color = '#38bdf8';

    if (rand < 0.28) {
      type = 'SHIELD';
      color = '#06b6d4';
    } else if (rand < 0.52) {
      type = 'SLOW_MO';
      color = '#fbbf24';
    } else if (rand < 0.75) {
      type = 'DASH_RECHARGE';
      color = '#10b981';
    }

    stateRef.current.powerups.push({
      id,
      type,
      x: 35 + Math.random() * (ARENA_WIDTH - 70),
      y: -25,
      radius: 14,
      speedY: 160,
      color,
    });
  }, []);

  // Add Particle Burst
  const triggerParticles = useCallback((x: number, y: number, color: string, count: number = 12) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 160;
      stateRef.current.particles.push({
        id: Math.random().toString(36).substring(2, 8),
        type: 'spark',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 1.5 + Math.random() * 2.5,
        color,
        alpha: 1,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.3,
        drag: 0.94,
      });
    }
  }, []);

  // Spectacular Multi-Layer Ship Explosion
  const triggerShipExplosion = useCallback((x: number, y: number) => {
    const particles = stateRef.current.particles;

    // 1. Double Expanding Shockwave Rings
    particles.push(
      {
        id: Math.random().toString(36).substring(2, 8),
        type: 'shockwave',
        x,
        y,
        vx: 320,
        vy: 0,
        radius: 12,
        color: '#ffffff',
        alpha: 1,
        life: 0,
        maxLife: 0.45,
      },
      {
        id: Math.random().toString(36).substring(2, 8),
        type: 'shockwave',
        x,
        y,
        vx: 210,
        vy: 0,
        radius: 8,
        color: '#f97316',
        alpha: 0.9,
        life: 0,
        maxLife: 0.65,
      }
    );

    // 2. Spinning Aircraft Hull Debris & Shards (24 fragments)
    const hullColors = ['#ffffff', '#06b6d4', '#e2e8f0', '#f43f5e', '#38bdf8'];
    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 120 + Math.random() * 260;
      particles.push({
        id: Math.random().toString(36).substring(2, 8),
        type: 'shard',
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 16,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 3.5 + Math.random() * 4,
        color: hullColors[i % hullColors.length],
        alpha: 1,
        life: 0,
        maxLife: 0.6 + Math.random() * 0.4,
        drag: 0.94,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 16,
      });
    }

    // 3. Fiery Flame Embers & Billows (40 particles)
    const fireColors = ['#ffffff', '#fef08a', '#f59e0b', '#ef4444', '#dc2626', '#b91c1c'];
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 70 + Math.random() * 220;
      particles.push({
        id: Math.random().toString(36).substring(2, 8),
        type: 'ember',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 3.5 + Math.random() * 4.5,
        color: fireColors[Math.floor(Math.random() * fireColors.length)],
        alpha: 1,
        life: 0,
        maxLife: 0.45 + Math.random() * 0.35,
        drag: 0.93,
      });
    }

    // 4. High-Velocity Streaking Sparks (32 sparks)
    for (let i = 0; i < 32; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 180 + Math.random() * 280;
      particles.push({
        id: Math.random().toString(36).substring(2, 8),
        type: 'spark',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 1.8 + Math.random() * 1.5,
        color: Math.random() < 0.5 ? '#fef08a' : '#38bdf8',
        alpha: 1,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.25,
        drag: 0.91,
      });
    }

    // 5. Heavy Smoke Puffs (16 smoke particles)
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 70;
      particles.push({
        id: Math.random().toString(36).substring(2, 8),
        type: 'smoke',
        x: x + (Math.random() - 0.5) * 12,
        y: y + (Math.random() - 0.5) * 12,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 20,
        radius: 6 + Math.random() * 7,
        color: 'rgba(100, 116, 139, 0.65)',
        alpha: 0.8,
        life: 0,
        maxLife: 0.7 + Math.random() * 0.45,
        drag: 0.96,
      });
    }
  }, []);

  // Radiant Powerup Collection Impact
  const triggerPowerupImpact = useCallback((x: number, y: number, color: string) => {
    const particles = stateRef.current.particles;

    // 1. Expanding Glowing Aura Shockwave
    particles.push({
      id: Math.random().toString(36).substring(2, 8),
      type: 'shockwave',
      x,
      y,
      vx: 240,
      vy: 0,
      radius: 8,
      color,
      alpha: 1,
      life: 0,
      maxLife: 0.42,
    });

    // 2. Sparkling 4-Point Stars (24 stars)
    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 90 + Math.random() * 190;
      particles.push({
        id: Math.random().toString(36).substring(2, 8),
        type: 'star',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 3 + Math.random() * 3.5,
        color: i % 2 === 0 ? color : '#ffffff',
        alpha: 1,
        life: 0,
        maxLife: 0.45 + Math.random() * 0.3,
        drag: 0.93,
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 10,
      });
    }

    // 3. Ascending Energy Motes (16 motes)
    for (let i = 0; i < 16; i++) {
      particles.push({
        id: Math.random().toString(36).substring(2, 8),
        type: 'ember',
        x: x + (Math.random() - 0.5) * 24,
        y: y + (Math.random() - 0.5) * 14,
        vx: (Math.random() - 0.5) * 45,
        vy: -(80 + Math.random() * 120),
        radius: 2 + Math.random() * 2.5,
        color,
        alpha: 1,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.35,
        drag: 0.95,
      });
    }

    // 4. Bright High-Speed Sparks (14 sparks)
    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 140 + Math.random() * 180;
      particles.push({
        id: Math.random().toString(36).substring(2, 8),
        type: 'spark',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 1.5 + Math.random() * 1.5,
        color: '#ffffff',
        alpha: 1,
        life: 0,
        maxLife: 0.3 + Math.random() * 0.2,
        drag: 0.92,
      });
    }

    // Ship Aura Flash
    stateRef.current.powerupAuraTimer = 0.35;
    stateRef.current.powerupAuraColor = color;
  }, []);

  // Shield Shatter Crystalline Break
  const triggerShieldShatter = useCallback((x: number, y: number) => {
    const particles = stateRef.current.particles;

    // Electric cyan shockwave
    particles.push({
      id: Math.random().toString(36).substring(2, 8),
      type: 'shockwave',
      x,
      y,
      vx: 240,
      vy: 0,
      radius: 12,
      color: '#38bdf8',
      alpha: 1,
      life: 0,
      maxLife: 0.38,
    });

    // 24 Crystalline Shards
    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 130 + Math.random() * 220;
      particles.push({
        id: Math.random().toString(36).substring(2, 8),
        type: 'shard',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 3 + Math.random() * 3.5,
        color: i % 2 === 0 ? '#38bdf8' : '#e0f2fe',
        alpha: 1,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.3,
        drag: 0.93,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 12,
      });
    }

    // 18 Electric Sparks
    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 180 + Math.random() * 240;
      particles.push({
        id: Math.random().toString(36).substring(2, 8),
        type: 'spark',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 1.5 + Math.random() * 1.5,
        color: '#bae6fd',
        alpha: 1,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.2,
        drag: 0.91,
      });
    }
  }, []);

  // Add Floating Pop Text
  const addFloatingText = useCallback((text: string, x: number, y: number, color: string) => {
    stateRef.current.floatingTexts.push({
      id: Math.random().toString(36).substring(2, 8),
      text,
      x,
      y,
      color,
      alpha: 1,
      scale: 1.2,
      life: 0,
    });
  }, []);

  // Reset Game Function
  const resetGame = useCallback(() => {
    stateRef.current.player = {
      x: ARENA_WIDTH / 2,
      y: ARENA_HEIGHT - 100,
      width: PLAYER_SIZE,
      height: PLAYER_SIZE,
      speed: 420 * settings.sensitivity,
      dashCooldown: 3.0,
      dashTimer: 0,
      isDashing: false,
      dashDuration: 0,
      hasShield: false,
      slowMoTimer: 0,
    };
    stateRef.current.obstacles = [];
    stateRef.current.powerups = [];
    stateRef.current.particles = [];
    stateRef.current.floatingTexts = [];
    stateRef.current.spawnTimer = 0;
    stateRef.current.powerupSpawnTimer = 0;
    stateRef.current.survivalScoreTimer = 0;
    stateRef.current.shakeIntensity = 0;
    stateRef.current.lastStormMilestone = 0;
    stateRef.current.stageBannerTimer = 0;
    stateRef.current.stageBannerText = '';
    stateRef.current.isExploding = false;
    stateRef.current.deathTimer = 0;
    stateRef.current.deadMetrics = null;
    stateRef.current.powerupAuraTimer = 0;

    const initialMetrics: GameMetrics = {
      score: 0,
      highScore: stateRef.current.metrics.highScore,
      multiplier: 1.0,
      comboStreak: 0,
      survivalTime: 0,
      level: 1,
      levelName: 'Pemanasan',
      speedMultiplier: 1.0,
      stageProgress: 0,
      nearMisses: 0,
      obstaclesAvoided: 0,
      powerupsCollected: 0,
      activeStormEvent: null,
    };
    stateRef.current.metrics = initialMetrics;
    onUpdateMetrics(() => initialMetrics);
  }, [settings.sensitivity, onUpdateMetrics]);

  const prevGameStateRef = useRef<GameState>(gameState);

  // Restart trigger: whenever entering PLAYING from TITLE_MENU or GAME_OVER, ALWAYS reset game!
  useEffect(() => {
    if (gameState === 'PLAYING' && prevGameStateRef.current !== 'PLAYING') {
      resetGame();
    }
    prevGameStateRef.current = gameState;
  }, [gameState, resetGame]);

  // Main Game Loop
  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    stateRef.current.lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - stateRef.current.lastTime) / 1000, 0.1);
      stateRef.current.lastTime = time;

      if (gameState === 'PLAYING') {
        const { player, obstacles, powerups, particles, floatingTexts, keys, metrics } = stateRef.current;

        // Powerup Aura Timer
        if (stateRef.current.powerupAuraTimer > 0) {
          stateRef.current.powerupAuraTimer = Math.max(0, stateRef.current.powerupAuraTimer - dt);
        }

        // Fatal Explosion sequence in progress
        if (stateRef.current.isExploding) {
          stateRef.current.deathTimer -= dt;
          if (stateRef.current.deathTimer <= 0) {
            stateRef.current.isExploding = false;
            onGameOver(stateRef.current.deadMetrics || { ...metrics });
            return;
          }
        }

        // Apply Slow-mo factor if active
        const timeFactor = player.slowMoTimer > 0 ? 0.5 : 1.0;
        if (player.slowMoTimer > 0) {
          player.slowMoTimer -= dt;
        }

        // Screen Shake decay
        if (stateRef.current.shakeIntensity > 0) {
          stateRef.current.shakeIntensity = Math.max(0, stateRef.current.shakeIntensity - dt * 25);
        }

        // Stage Banner Timer
        if (stateRef.current.stageBannerTimer > 0) {
          stateRef.current.stageBannerTimer -= dt;
        }

        // Survival Time update & Points (only if not exploding)
        if (!stateRef.current.isExploding) {
          metrics.survivalTime += dt;
          stateRef.current.survivalScoreTimer += dt;
          if (stateRef.current.survivalScoreTimer >= 0.2) {
            stateRef.current.survivalScoreTimer = 0;
            const pointsEarned = Math.round(5 * metrics.level * metrics.multiplier);
            metrics.score += pointsEarned;
          }
        }

        // Dynamic Continuous Difficulty Calculation
        metrics.speedMultiplier = calculateSpeedMultiplier(metrics.score);
        metrics.stageProgress = calculateStageProgress(metrics.score);

        // Dynamically modulate adrenaline music intensity & tempo
        sounds.setMusicIntensity(metrics.level, metrics.speedMultiplier, player.slowMoTimer > 0);

        const currentTier = getTierForScore(metrics.score);
        const previousLevel = metrics.level;

        metrics.level = currentTier.level;
        metrics.levelName = currentTier.name;

        // Level Up Transition Event
        if (metrics.level > previousLevel) {
          sounds.playLevelUp();
          stateRef.current.shakeIntensity = settings.screenShake ? 7 : 0;
          stateRef.current.stageBannerText = `LEVEL ${metrics.level}: ${metrics.levelName}!`;
          stateRef.current.stageBannerTimer = 2.2;
          addFloatingText(`LEVEL UP!`, ARENA_WIDTH / 2, ARENA_HEIGHT * 0.38, currentTier.hazardColor);
          triggerParticles(ARENA_WIDTH / 2, ARENA_HEIGHT * 0.38, currentTier.hazardColor, 35);
        }

        // Milestone Reflex Storm Wave Event (every 1,400 points)
        const stormMilestone = Math.floor(metrics.score / 1400);
        if (stormMilestone > stateRef.current.lastStormMilestone && metrics.score >= 1400) {
          stateRef.current.lastStormMilestone = stormMilestone;
          sounds.playStormAlert();
          stateRef.current.stageBannerText = 'WASPADA: GELOMBANG BADAI REFLEKS!';
          stateRef.current.stageBannerTimer = 2.5;
          if (settings.screenShake) stateRef.current.shakeIntensity = 5;

          const stormHazards = generateStormWave(ARENA_WIDTH, metrics.score);
          obstacles.push(...stormHazards);
          triggerParticles(ARENA_WIDTH / 2, 40, '#f43f5e', 20);
        }

        // Dash Ability handling
        if (player.dashTimer > 0) {
          player.dashTimer = Math.max(0, player.dashTimer - dt);
        }

        if (keys.dash && player.dashTimer <= 0 && !player.isDashing) {
          player.isDashing = true;
          player.dashDuration = 0.28;
          player.dashTimer = player.dashCooldown;
          sounds.playDash();
          if (settings.screenShake) stateRef.current.shakeIntensity = 4;
          triggerParticles(player.x, player.y, '#06b6d4', 16);
          keys.dash = false;
        }

        if (player.isDashing) {
          player.dashDuration -= dt;
          if (player.dashDuration <= 0) {
            player.isDashing = false;
          }
        }

        // Player Movement
        const currentSpeed = (player.isDashing ? player.speed * 1.85 : player.speed) * settings.sensitivity;
        let moveX = 0;
        let moveY = 0;

        if (keys.left) moveX -= 1;
        if (keys.right) moveX += 1;
        if (keys.up) moveY -= 1;
        if (keys.down) moveY += 1;

        if (moveX !== 0 && moveY !== 0) {
          moveX *= 0.7071;
          moveY *= 0.7071;
        }

        player.x += moveX * currentSpeed * dt;
        player.y += moveY * currentSpeed * dt;

        // Controller Slider Pad or Direct Canvas Drag handling
        const activeTargetX =
          touchInput.targetXRatio !== undefined && touchInput.targetXRatio !== null
            ? touchInput.targetXRatio * ARENA_WIDTH
            : stateRef.current.directTargetX;

        if (activeTargetX !== null && activeTargetX !== undefined) {
          const diffX = activeTargetX - player.x;
          // Responsive analog glide towards target horizontal coordinate
          const glideSpeed = currentSpeed * 2.4;
          if (Math.abs(diffX) > 2) {
            player.x += Math.sign(diffX) * Math.min(Math.abs(diffX), glideSpeed * dt);
          }
        }

        // Arena Boundaries
        const halfSize = player.width / 2;
        player.x = Math.max(halfSize + 8, Math.min(ARENA_WIDTH - halfSize - 8, player.x));
        player.y = Math.max(ARENA_HEIGHT * 0.45, Math.min(ARENA_HEIGHT - halfSize - 12, player.y));

        // Player Thruster Trail
        if (Math.random() < 0.65) {
          particles.push({
            id: Math.random().toString(),
            x: player.x + (Math.random() - 0.5) * 12,
            y: player.y + halfSize,
            vx: (Math.random() - 0.5) * 30,
            vy: 60 + Math.random() * 80,
            radius: 1.5 + Math.random() * 2,
            color: player.isDashing ? '#06b6d4' : '#38bdf8',
            alpha: 0.8,
            life: 0,
            maxLife: 0.22,
          });
        }

        // Dynamic Spawn Timer based on continuous difficulty
        const dynamicInterval = calculateSpawnInterval(metrics.score, metrics.level);
        stateRef.current.spawnTimer += dt;
        if (stateRef.current.spawnTimer >= dynamicInterval) {
          stateRef.current.spawnTimer = 0;
          const newObstacles = generateObstacle(ARENA_WIDTH, metrics.score, player.x);
          obstacles.push(...newObstacles);
        }

        // Powerup Spawn Timers (every 10 - 13 seconds)
        stateRef.current.powerupSpawnTimer += dt;
        if (stateRef.current.powerupSpawnTimer >= 11) {
          stateRef.current.powerupSpawnTimer = 0;
          spawnPowerup();
        }

        // Update Obstacles Movement & Mechanics
        for (let i = obstacles.length - 1; i >= 0; i--) {
          const obs = obstacles[i];
          obs.y += obs.speedY * dt * timeFactor;

          // 1. Moving Sweepers
          if (obs.type === 'MOVING_SWEEPER' && obs.speedX && obs.minX !== undefined && obs.maxX !== undefined) {
            obs.x += obs.speedX * dt * timeFactor;
            if (obs.x <= obs.minX || obs.x >= obs.maxX) {
              obs.speedX *= -1;
            }
          }

          // 2. Zigzag Prowlers
          if (obs.type === 'ZIGZAG_PROWLER' && obs.baseX !== undefined && obs.pulsePhase !== undefined) {
            obs.pulsePhase += dt * (obs.sineFrequency || 3.0) * timeFactor;
            obs.x = obs.baseX + Math.sin(obs.pulsePhase) * (obs.sineAmplitude || 50);
            obs.x = Math.max(10, Math.min(ARENA_WIDTH - obs.width - 10, obs.x));
          }

          // 3. Homing Seeker Mine
          if (obs.type === 'HOMING_MINE' && obs.speedX) {
            const targetX = player.x - obs.width / 2;
            const diffX = targetX - obs.x;
            const trackStep = Math.sign(diffX) * Math.min(Math.abs(diffX), obs.speedX * dt * timeFactor);
            obs.x += trackStep;
            obs.x = Math.max(10, Math.min(ARENA_WIDTH - obs.width - 10, obs.x));
          }

          // 4. Expanding Wave
          if (obs.type === 'EXPANDING_WAVE' && obs.expansionRate && obs.targetWidth) {
            if (obs.width < obs.targetWidth) {
              const prevW = obs.width;
              obs.width = Math.min(obs.targetWidth, obs.width + obs.expansionRate * dt * timeFactor);
              obs.x -= (obs.width - prevW) / 2;
              obs.x = Math.max(10, Math.min(ARENA_WIDTH - obs.width - 10, obs.x));
            }
          }

          // 5. Pincer Gates
          if (obs.type === 'PINCER_GATES' && obs.speedX) {
            obs.x += obs.speedX * dt * timeFactor;
          }

          // 6. Laser gate pulse oscillation
          if (obs.type === 'PULSE_LASER' && obs.pulsePhase !== undefined) {
            obs.pulsePhase += dt * 3.5;
          }

          // 7. Splitter hazard split event
          if (obs.type === 'SPLITTER' && !obs.hasSplit && obs.y >= ARENA_HEIGHT * 0.38) {
            obs.hasSplit = true;
            obstacles.push(
              {
                id: obs.id + '_A',
                type: 'STATIC_BLOCK',
                x: obs.x - 20,
                y: obs.y,
                width: 32,
                height: 22,
                speedY: obs.speedY * 1.15,
                speedX: -110,
                minX: 10,
                maxX: ARENA_WIDTH - 42,
                color: '#c084fc',
              },
              {
                id: obs.id + '_B',
                type: 'STATIC_BLOCK',
                x: obs.x + obs.width - 12,
                y: obs.y,
                width: 32,
                height: 22,
                speedY: obs.speedY * 1.15,
                speedX: 110,
                minX: 10,
                maxX: ARENA_WIDTH - 42,
                color: '#c084fc',
              }
            );
            triggerParticles(obs.x + obs.width / 2, obs.y, '#c084fc', 8);
          }

          // Player Hitbox Collision
          const playerRadius = player.width * 0.42;
          const playerCenterX = player.x;
          const playerCenterY = player.y;

          const closestX = Math.max(obs.x, Math.min(playerCenterX, obs.x + obs.width));
          const closestY = Math.max(obs.y, Math.min(playerCenterY, obs.y + obs.height));
          const distX = playerCenterX - closestX;
          const distY = playerCenterY - closestY;
          const distance = Math.hypot(distX, distY);

          // Fatal Collision Check
          if (!stateRef.current.isExploding && distance < playerRadius) {
            if (player.isDashing) {
              triggerParticles(closestX, closestY, '#06b6d4', 8);
            } else if (player.hasShield) {
              player.hasShield = false;
              sounds.playShieldBreak();
              metrics.comboStreak = 0;
              metrics.multiplier = 1.0;
              stateRef.current.shakeIntensity = settings.screenShake ? 11 : 0;
              addFloatingText('PERISAI PECAH!', player.x, player.y - 20, '#38bdf8');
              triggerShieldShatter(player.x, player.y);
              obstacles.splice(i, 1);
              continue;
            } else {
              sounds.playGameOver();
              stateRef.current.isExploding = true;
              stateRef.current.deathTimer = 0.65;
              stateRef.current.deadMetrics = { ...metrics };
              stateRef.current.shakeIntensity = settings.screenShake ? 24 : 0;
              triggerShipExplosion(player.x, player.y);
              addFloatingText('HANCUR!', player.x, player.y - 30, '#f43f5e');
              break;
            }
          }

          // Near-Miss ("Refleks Nyaris") Detection
          if (
            !stateRef.current.isExploding &&
            !obs.nearMissAwarded &&
            distance <= playerRadius + NEAR_MISS_THRESHOLD &&
            distance >= playerRadius &&
            obs.y + obs.height >= playerCenterY - 10 &&
            obs.y <= playerCenterY + 25
          ) {
            obs.nearMissAwarded = true;
            metrics.nearMisses += 1;
            metrics.comboStreak += 1;

            const bonusMult = Math.min(5.0, 1.0 + Math.floor(metrics.comboStreak / 2) * 0.5);
            metrics.multiplier = bonusMult;

            const bonusPoints = Math.round(75 * metrics.multiplier);
            metrics.score += bonusPoints;

            sounds.playNearMiss();
            if (settings.screenShake) stateRef.current.shakeIntensity = 3.5;
            addFloatingText(`+${bonusPoints} NYARIS! (${metrics.multiplier.toFixed(1)}x)`, player.x, player.y - 32, '#fbbf24');
            triggerParticles(closestX, closestY, '#fbbf24', 12);
          }

          // Remove cleared obstacles
          if (obs.y > ARENA_HEIGHT + 50) {
            if (!obs.isPassed) {
              metrics.obstaclesAvoided += 1;
              metrics.score += Math.round(20 * metrics.multiplier);
            }
            obstacles.splice(i, 1);
          }
        }

        // Update Powerups
        for (let i = powerups.length - 1; i >= 0; i--) {
          const p = powerups[i];
          p.y += p.speedY * dt * timeFactor;

          const dist = Math.hypot(player.x - p.x, player.y - p.y);
          if (!stateRef.current.isExploding && dist < player.width / 2 + p.radius) {
            sounds.playPickup(p.type);
            metrics.powerupsCollected += 1;
            const points = Math.round(100 * metrics.multiplier);
            metrics.score += points;

            // Trigger Visual Explosion & Radiant Star Impact
            triggerPowerupImpact(p.x, p.y, p.color);

            if (p.type === 'SHIELD') {
              player.hasShield = true;
              addFloatingText(`+${points} PERISAI AKTIF!`, player.x, player.y - 25, '#06b6d4');
            } else if (p.type === 'SLOW_MO') {
              player.slowMoTimer = 4.0;
              addFloatingText(`+${points} PERLAMBAT WAKTU!`, player.x, player.y - 25, '#fbbf24');
            } else if (p.type === 'DASH_RECHARGE') {
              player.dashTimer = 0;
              addFloatingText(`+${points} REFLEKS KILAT SIAP!`, player.x, player.y - 25, '#10b981');
            } else {
              addFloatingText(`+${points} ENERGI REKOR!`, player.x, player.y - 25, '#38bdf8');
            }

            powerups.splice(i, 1);
            continue;
          }

          if (p.y > ARENA_HEIGHT + 30) {
            powerups.splice(i, 1);
          }
        }

        // Synchronize React HUD state (throttled to 10Hz to prevent React render queue saturation)
        stateRef.current.hudSyncTimer += dt;
        if (stateRef.current.hudSyncTimer >= 0.1) {
          stateRef.current.hudSyncTimer = 0;
          onUpdateMetrics((prev) => ({
            ...metrics,
            highScore: Math.max(prev.highScore, metrics.score),
          }));
        }
      }

      // Always update Particles (in PLAYING or GAME_OVER so explosions animate smoothly)
      for (let i = stateRef.current.particles.length - 1; i >= 0; i--) {
        const pt = stateRef.current.particles[i];
        pt.life += dt;

        if (pt.drag) {
          const dragFactor = Math.pow(pt.drag, dt * 60);
          pt.vx *= dragFactor;
          pt.vy *= dragFactor;
        }

        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;

        if (pt.vRot) {
          pt.rotation = (pt.rotation || 0) + pt.vRot * dt;
        }

        if (pt.type === 'shockwave') {
          pt.radius += (pt.vx || 240) * dt;
        } else if (pt.type === 'smoke') {
          pt.radius += 8 * dt;
        }

        pt.alpha = Math.max(0, 1 - pt.life / pt.maxLife);

        if (pt.life >= pt.maxLife) {
          stateRef.current.particles.splice(i, 1);
        }
      }

      // Always update Floating Texts
      for (let i = stateRef.current.floatingTexts.length - 1; i >= 0; i--) {
        const ft = stateRef.current.floatingTexts[i];
        ft.life += dt;
        ft.y -= 45 * dt;
        ft.alpha = Math.max(0, 1 - ft.life / 0.85);

        if (ft.life >= 0.85) {
          stateRef.current.floatingTexts.splice(i, 1);
        }
      }

      // ----------------------------------------------------
      // DRAW CANVAS
      // ----------------------------------------------------
      ctx.save();
      ctx.clearRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

      // Screen Shake Transform
      if (stateRef.current.shakeIntensity > 0) {
        const shakeX = (Math.random() - 0.5) * stateRef.current.shakeIntensity * 2;
        const shakeY = (Math.random() - 0.5) * stateRef.current.shakeIntensity * 2;
        ctx.translate(shakeX, shakeY);
      }

      // Draw Arena Backdrop
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

      // Starfield / Speed lines with dynamic speedMultiplier
      const speedMult = stateRef.current.metrics.speedMultiplier || 1.0;
      const starSpeedMultiplier = (stateRef.current.player.slowMoTimer > 0 ? 0.4 : 1.0) * speedMult * 1.2;
      ctx.fillStyle = '#94a3b8';
      stateRef.current.backgroundStars.forEach((star) => {
        star.y += star.speed * dt * starSpeedMultiplier;
        if (star.y > ARENA_HEIGHT) {
          star.y = 0;
          star.x = Math.random() * ARENA_WIDTH;
        }
        ctx.globalAlpha = star.alpha;
        ctx.fillRect(star.x, star.y, star.size, star.size * (1 + speedMult * 0.5));
      });
      ctx.globalAlpha = 1.0;

      // Subtle Lane Guidelines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let x = ARENA_WIDTH / 4; x < ARENA_WIDTH; x += ARENA_WIDTH / 4) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, ARENA_HEIGHT);
        ctx.stroke();
      }

      // Draw Obstacles
      stateRef.current.obstacles.forEach((obs) => {
        ctx.save();
        ctx.fillStyle = obs.color;
        ctx.shadowColor = obs.color;
        ctx.shadowBlur = 10;

        if (obs.shape === 'diamond') {
          // Diamond shape for Homing Seeker Mine
          const cx = obs.x + obs.width / 2;
          const cy = obs.y + obs.height / 2;
          const r = obs.width / 2;
          ctx.beginPath();
          ctx.moveTo(cx, cy - r);
          ctx.lineTo(cx + r, cy);
          ctx.lineTo(cx, cy + r);
          ctx.lineTo(cx - r, cy);
          ctx.closePath();
          ctx.fill();

          // Pulsing core
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(cx, cy, 4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Rounded box for barriers & sweepers
          const r = 6;
          ctx.beginPath();
          ctx.roundRect(obs.x, obs.y, obs.width, obs.height, r);
          ctx.fill();

          // Inner glowing core accent
          ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
          ctx.beginPath();
          ctx.roundRect(obs.x + 3, obs.y + 3, Math.max(1, obs.width - 6), Math.max(1, obs.height - 6), r - 2);
          ctx.fill();

          // Laser stripes
          if (obs.type === 'PULSE_LASER') {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(obs.x + 4, obs.y + obs.height / 2);
            ctx.lineTo(obs.x + obs.width - 4, obs.y + obs.height / 2);
            ctx.stroke();
          }
        }

        ctx.restore();
      });

      // Draw Powerups
      stateRef.current.powerups.forEach((p) => {
        ctx.save();
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 14;

        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label = p.type === 'SHIELD' ? 'S' : p.type === 'SLOW_MO' ? 'T' : p.type === 'DASH_RECHARGE' ? 'D' : '+';
        ctx.fillText(label, p.x, p.y);

        ctx.restore();
      });

      // Draw Particles with Dedicated Visual Types
      stateRef.current.particles.forEach((pt) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, pt.alpha));

        if (pt.type === 'shockwave') {
          ctx.strokeStyle = pt.color;
          ctx.lineWidth = Math.max(1, (1 - pt.life / pt.maxLife) * 4.5);
          ctx.shadowColor = pt.color;
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, Math.max(1, pt.radius), 0, Math.PI * 2);
          ctx.stroke();
        } else if (pt.type === 'spark') {
          ctx.strokeStyle = pt.color;
          ctx.lineWidth = Math.max(1.2, pt.radius);
          ctx.shadowColor = pt.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.moveTo(pt.x, pt.y);
          ctx.lineTo(pt.x - pt.vx * 0.035, pt.y - pt.vy * 0.035);
          ctx.stroke();
        } else if (pt.type === 'shard') {
          ctx.translate(pt.x, pt.y);
          ctx.rotate(pt.rotation || 0);
          ctx.fillStyle = pt.color;
          ctx.shadowColor = pt.color;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.moveTo(0, -pt.radius);
          ctx.lineTo(pt.radius * 0.8, pt.radius * 0.8);
          ctx.lineTo(-pt.radius * 0.8, pt.radius * 0.5);
          ctx.closePath();
          ctx.fill();
        } else if (pt.type === 'star') {
          ctx.translate(pt.x, pt.y);
          ctx.rotate(pt.rotation || 0);
          ctx.fillStyle = pt.color;
          ctx.shadowColor = pt.color;
          ctx.shadowBlur = 10;
          const r = pt.radius;
          ctx.beginPath();
          ctx.moveTo(0, -r);
          ctx.quadraticCurveTo(0, 0, r, 0);
          ctx.quadraticCurveTo(0, 0, 0, r);
          ctx.quadraticCurveTo(0, 0, -r, 0);
          ctx.quadraticCurveTo(0, 0, 0, -r);
          ctx.fill();
        } else if (pt.type === 'smoke') {
          ctx.fillStyle = pt.color;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, Math.max(1, pt.radius), 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Default / Ember
          ctx.fillStyle = pt.color;
          ctx.shadowColor = pt.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, Math.max(0.5, pt.radius), 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      // Draw Player Craft (only if not blown up in explosion)
      const player = stateRef.current.player;
      if (!stateRef.current.isExploding) {
        ctx.save();
        ctx.translate(player.x, player.y);

        // Powerup Collection Aura Pulse Halo
        if (stateRef.current.powerupAuraTimer > 0) {
          const auraAlpha = Math.min(1, stateRef.current.powerupAuraTimer / 0.35);
          ctx.strokeStyle = stateRef.current.powerupAuraColor;
          ctx.lineWidth = 3;
          ctx.globalAlpha = auraAlpha * 0.85;
          ctx.shadowColor = stateRef.current.powerupAuraColor;
          ctx.shadowBlur = 18;
          ctx.beginPath();
          ctx.arc(0, 0, player.width * 0.88, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        }

        if (player.isDashing) {
          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth = 3;
          ctx.shadowColor = '#06b6d4';
          ctx.shadowBlur = 20;
          ctx.beginPath();
          ctx.arc(0, 0, player.width * 0.75, 0, Math.PI * 2);
          ctx.stroke();
        }

        if (player.hasShield) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(0, 0, player.width * 0.8, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
          ctx.beginPath();
          ctx.arc(0, 0, player.width * 0.8, 0, Math.PI * 2);
          ctx.fill();
        }

        // Aerodynamic Craft Hull
        ctx.shadowColor = player.isDashing ? '#06b6d4' : '#38bdf8';
        ctx.shadowBlur = 12;

        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(0, -player.height * 0.55);
        ctx.lineTo(player.width * 0.5, player.height * 0.45);
        ctx.lineTo(player.width * 0.2, player.height * 0.25);
        ctx.lineTo(0, player.height * 0.35);
        ctx.lineTo(-player.width * 0.2, player.height * 0.25);
        ctx.lineTo(-player.width * 0.5, player.height * 0.45);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = player.isDashing ? '#06b6d4' : '#0ea5e9';
        ctx.beginPath();
        ctx.ellipse(0, -player.height * 0.12, 4, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // Draw Floating Pop Texts
      stateRef.current.floatingTexts.forEach((ft) => {
        ctx.save();
        ctx.globalAlpha = ft.alpha;
        ctx.fillStyle = ft.color;
        ctx.font = 'bold 13px system-ui';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      });

      // Stage / Storm Announcement Banner
      if (stateRef.current.stageBannerTimer > 0) {
        ctx.save();
        const bannerAlpha = Math.min(1, stateRef.current.stageBannerTimer);
        ctx.globalAlpha = bannerAlpha;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(0, ARENA_HEIGHT * 0.18, ARENA_WIDTH, 44);

        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(0, ARENA_HEIGHT * 0.18, ARENA_WIDTH, 44);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 8;
        ctx.fillText(stateRef.current.stageBannerText, ARENA_WIDTH / 2, ARENA_HEIGHT * 0.18 + 22);
        ctx.restore();
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    gameState,
    settings.sensitivity,
    settings.screenShake,
    onGameOver,
    onUpdateMetrics,
    spawnPowerup,
    addFloatingText,
    triggerParticles,
    triggerShipExplosion,
    triggerPowerupImpact,
    triggerShieldShatter,
  ]);

  return (
    <div className="relative w-full max-w-[580px] mx-auto aspect-[580/720] rounded-xl overflow-hidden shadow-2xl border border-slate-800 bg-[#090d16]">
      <canvas
        ref={canvasRef}
        width={ARENA_WIDTH}
        height={ARENA_HEIGHT}
        onPointerDown={(e) => {
          if (gameState !== 'PLAYING') return;
          const rect = e.currentTarget.getBoundingClientRect();
          const ratio = Math.max(0.04, Math.min(0.96, (e.clientX - rect.left) / rect.width));
          stateRef.current.directTargetX = ratio * ARENA_WIDTH;
        }}
        onPointerMove={(e) => {
          if (gameState !== 'PLAYING' || e.buttons === 0) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const ratio = Math.max(0.04, Math.min(0.96, (e.clientX - rect.left) / rect.width));
          stateRef.current.directTargetX = ratio * ARENA_WIDTH;
        }}
        onPointerUp={() => {
          stateRef.current.directTargetX = null;
        }}
        onPointerLeave={() => {
          stateRef.current.directTargetX = null;
        }}
        className="w-full h-full block cursor-crosshair touch-none"
      />
    </div>
  );
};
