import React, { useState } from 'react';
import { ScoreEntry } from '../types/game';
import { Trophy, X, Trash2, User, Check, Edit2 } from 'lucide-react';
import { sounds } from '../services/audio';

interface LeaderboardModalProps {
  scores: ScoreEntry[];
  onClose: () => void;
  onClearScores: () => void;
  playerName?: string;
  onUpdatePlayerName?: (name: string) => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  scores,
  onClose,
  onClearScores,
  playerName = 'Pilot Antariksa',
  onUpdatePlayerName,
}) => {
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [tempName, setTempName] = useState<string>(playerName);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSaveActiveName = () => {
    const clean = tempName.trim() || 'Pilot Antariksa';
    setTempName(clean);
    if (onUpdatePlayerName) {
      onUpdatePlayerName(clean);
    }
    setIsEditingName(false);
    sounds.playButton();
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Papan Rekor AEROSPACE</h2>
          </div>
          <button
            onClick={() => {
              sounds.playButton();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Player Name Banner */}
        <div className="py-2.5 px-3 bg-slate-950/70 rounded-xl border border-slate-800/80 my-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <User className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Pilot Aktif:</span>
            {isEditingName ? (
              <input
                type="text"
                value={tempName}
                maxLength={18}
                onChange={(e) => setTempName(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-bold"
                autoFocus
              />
            ) : (
              <strong className="text-cyan-300 font-bold">{playerName}</strong>
            )}
          </div>

          <div>
            {isEditingName ? (
              <button
                onClick={handleSaveActiveName}
                className="p-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-xs font-bold transition-colors"
                title="Simpan"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => {
                  sounds.playButton();
                  setIsEditingName(true);
                }}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Ganti Nama Pilot"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* List of Scores */}
        <div className="flex-1 overflow-y-auto py-1 space-y-2">
          {scores.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Belum ada riwayat permainan. Mulai mainkan dan cetak rekor refleks terbaikmu!
            </div>
          ) : (
            scores.map((entry, index) => {
              const medalColor =
                index === 0
                  ? 'text-amber-400 border-amber-400/40 bg-amber-400/10'
                  : index === 1
                  ? 'text-slate-300 border-slate-300/40 bg-slate-300/10'
                  : index === 2
                  ? 'text-amber-700 border-amber-700/40 bg-amber-700/10'
                  : 'text-slate-400 border-slate-800 bg-slate-800/40';

              return (
                <div
                  key={entry.id}
                  className="p-3 bg-slate-800/40 hover:bg-slate-800/70 rounded-xl border border-slate-800 transition-colors flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg border flex items-center justify-center font-mono font-bold text-xs shrink-0 ${medalColor}`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm font-mono tabular-nums text-white">
                          {entry.score.toLocaleString('id-ID')}
                        </span>
                        <span className="text-[11px] font-semibold text-cyan-300 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/50">
                          {entry.playerName || 'Pilot Antariksa'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <span>{entry.date}</span>
                        <span aria-hidden="true">·</span>
                        <span>{formatTime(entry.survivalTime)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-amber-300 text-xs mr-2">
                      Rank {entry.rank}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {entry.nearMisses}x Nyaris
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-800 shrink-0 flex items-center justify-between">
          {scores.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Hapus semua riwayat rekor skor?')) {
                  sounds.playButton();
                  onClearScores();
                }
              }}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-rose-950/30 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Riwayat</span>
            </button>
          )}

          <button
            onClick={() => {
              sounds.playButton();
              onClose();
            }}
            className="ml-auto py-2 px-4 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-xl transition-colors whitespace-nowrap"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
