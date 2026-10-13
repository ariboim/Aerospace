import React, { useState } from 'react';
import { GameMetrics } from '../types/game';
import { RotateCcw, Trophy, Clock, Zap, Target, Flame, User, Check } from 'lucide-react';
import { sounds } from '../services/audio';

interface GameOverModalProps {
  metrics: GameMetrics;
  isNewHighScore: boolean;
  playerName: string;
  onUpdatePlayerName: (name: string) => void;
  onRestart: () => void;
  onOpenLeaderboard: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  metrics,
  isNewHighScore,
  playerName,
  onUpdatePlayerName,
  onRestart,
  onOpenLeaderboard,
}) => {
  const [currentName, setCurrentName] = useState<string>(playerName);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Determine Grade Rank
  const getRank = (): { grade: 'S' | 'A' | 'B' | 'C'; title: string; color: string } => {
    if (metrics.score >= 5000 || metrics.nearMisses >= 12) {
      return { grade: 'S', title: 'Refleks Legendaris', color: 'text-amber-400' };
    }
    if (metrics.score >= 3000 || metrics.nearMisses >= 8) {
      return { grade: 'A', title: 'Ketangkasan Unggul', color: 'text-cyan-400' };
    }
    if (metrics.score >= 1500) {
      return { grade: 'B', title: 'Refleks Tangguh', color: 'text-emerald-400' };
    }
    return { grade: 'C', title: 'Perlu Asah Refleks', color: 'text-slate-400' };
  };

  const rank = getRank();

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSaveName = () => {
    const clean = currentName.trim() || 'Pilot Antariksa';
    setCurrentName(clean);
    onUpdatePlayerName(clean);
    setIsSaved(true);
    sounds.playButton();
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-2xl my-auto">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="text-xs font-semibold text-rose-400 tracking-wider uppercase mb-1">
            Tabrakan Terjadi!
          </div>
          <h2 className="text-2xl font-extrabold text-white">PERMAINAN SELESAI</h2>

          {isNewHighScore && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold animate-pulse">
              <Trophy className="w-3.5 h-3.5" />
              <span>REKOR SKOR BARU!</span>
            </div>
          )}
        </div>

        {/* Primary Score & Rank Banner */}
        <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/80 mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">TOTAL SKOR AKHIR</div>
            <div className="text-3xl font-extrabold font-mono tabular-nums text-white mt-0.5">
              {metrics.score.toLocaleString('id-ID')}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Level {metrics.level} · {metrics.levelName} · Laju {(metrics.speedMultiplier || 1.0).toFixed(2)}x
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-400 font-medium">PERINGKAT</div>
            <div className={`text-4xl font-extrabold font-mono ${rank.color}`}>
              {rank.grade}
            </div>
            <div className="text-[11px] text-slate-300 font-medium mt-0.5">
              {rank.title}
            </div>
          </div>
        </div>

        {/* Player Name Input / Edit for Leaderboard */}
        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 mb-4 flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-cyan-400 shrink-0 text-xs font-semibold">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">NAMA:</span>
          </div>
          <input
            type="text"
            value={currentName}
            maxLength={18}
            onChange={(e) => setCurrentName(e.target.value)}
            onBlur={handleSaveName}
            placeholder="Nama pemain..."
            className="flex-1 bg-slate-800/80 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
          <button
            onClick={handleSaveName}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
              isSaved
                ? 'bg-emerald-600 text-white'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 active:scale-95'
            }`}
          >
            {isSaved ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Disimpan</span>
              </>
            ) : (
              <span>Simpan Nama</span>
            )}
          </button>
        </div>

        {/* Breakdown Performance Stats */}
        <div className="grid grid-cols-2 gap-2.5 mb-5 text-xs">
          <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800 flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <div className="text-slate-400">Waktu Bertahan</div>
              <div className="font-mono tabular-nums font-bold text-slate-200">
                {formatTime(metrics.survivalTime)}
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800 flex items-center gap-2.5">
            <Target className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="text-slate-400">Rintangan Dihindari</div>
              <div className="font-mono tabular-nums font-bold text-slate-200">
                {metrics.obstaclesAvoided}
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800 flex items-center gap-2.5">
            <Flame className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <div className="text-slate-400">Refleks Nyaris</div>
              <div className="font-mono tabular-nums font-bold text-amber-300">
                {metrics.nearMisses} kali
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800 flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <div className="text-slate-400">Pengganda Maks</div>
              <div className="font-mono tabular-nums font-bold text-cyan-300">
                {metrics.multiplier.toFixed(1)}x
              </div>
            </div>
          </div>
        </div>

        {/* Single-line Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={() => {
              handleSaveName();
              sounds.playButton();
              onRestart();
            }}
            className="w-full py-3.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-cyan-950 flex items-center justify-center gap-2 active:scale-98 whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Main Lagi (Skor Mulai 0)</span>
          </button>

          <button
            onClick={() => {
              handleSaveName();
              sounds.playButton();
              onOpenLeaderboard();
            }}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-colors border border-slate-700 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Lihat Papan Skor Leaderboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};
