import React from 'react';
import { GameMetrics, GameSettings } from '../types/game';
import { Volume2, VolumeX, Pause, Play, Zap, Shield, Flame, Music } from 'lucide-react';
import { sounds } from '../services/audio';

interface GameHUDProps {
  metrics: GameMetrics;
  settings: GameSettings;
  isPaused: boolean;
  onTogglePause: () => void;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  dashTimer?: number;
  hasShield?: boolean;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  metrics,
  settings,
  isPaused,
  onTogglePause,
  onToggleSound,
  onToggleMusic,
}) => {
  // Format survival time into mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-[580px] mx-auto mb-2 px-1">
      {/* Top telemetry bar */}
      <div className="flex items-center justify-between py-2 border-b border-slate-800 text-sm">
        {/* Left: Score & Highscore */}
        <div>
          <div className="text-xs text-slate-400 font-medium">SKOR SAAT INI</div>
          <div className="text-2xl font-extrabold text-white font-mono tabular-nums tracking-tight">
            {metrics.score.toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
            <span>Rekor:</span>
            <span className="font-mono tabular-nums text-slate-300 font-semibold">
              {metrics.highScore.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Center: Multiplier & Combo */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-xs text-amber-400 font-semibold">
            <Flame className="w-3.5 h-3.5" />
            <span>PENGGANDA</span>
          </div>
          <div className="text-2xl font-extrabold text-amber-400 font-mono tabular-nums">
            {metrics.multiplier.toFixed(1)}x
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Combo: <span className="font-mono text-slate-200">{metrics.comboStreak}</span> Nyaris
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              sounds.playButton();
              onToggleMusic();
            }}
            className={`p-2 rounded-lg transition-colors ${
              settings.musicEnabled
                ? 'text-cyan-400 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/50'
                : 'text-slate-500 bg-slate-800/80 hover:bg-slate-700'
            }`}
            title={settings.musicEnabled ? 'Matikan Musik Latar Adrenalin' : 'Nyalakan Musik Latar Adrenalin'}
            aria-label="Toggle Music"
          >
            <Music className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              sounds.playButton();
              onToggleSound();
            }}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors"
            title={settings.soundEnabled ? 'Matikan Efek Suara' : 'Nyalakan Efek Suara'}
            aria-label="Toggle Sound"
          >
            {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => {
              sounds.playButton();
              onTogglePause();
            }}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors"
            title={isPaused ? 'Lanjutkan' : 'Jeda'}
            aria-label="Toggle Pause"
          >
            {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Sub HUD: Clean unboxed metadata with dividers */}
      <div className="flex flex-wrap items-center justify-between gap-y-1.5 pt-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="text-slate-300 font-semibold">Level {metrics.level}</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="text-cyan-400 font-medium">{metrics.levelName}</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="font-mono text-emerald-400 font-medium">Laju: {(metrics.speedMultiplier || 1.0).toFixed(2)}x</span>
        </div>

        <div className="flex items-center gap-2">
          <span>Waktu:</span>
          <span className="font-mono tabular-nums text-slate-200">{formatTime(metrics.survivalTime)}</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>Dihindari:</span>
          <span className="font-mono tabular-nums text-slate-200">{metrics.obstaclesAvoided}</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>Nyaris:</span>
          <span className="font-mono tabular-nums text-amber-300 font-semibold">{metrics.nearMisses}</span>
        </div>
      </div>

      {/* Progress Line towards next difficulty tier */}
      <div className="w-full bg-slate-800/80 h-1 rounded-full overflow-hidden mt-2">
        <div
          className="bg-gradient-to-r from-cyan-500 via-emerald-400 to-amber-400 h-full transition-all duration-300"
          style={{ width: `${metrics.stageProgress || 0}%` }}
        />
      </div>
    </div>
  );
};
