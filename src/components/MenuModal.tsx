import React, { useState } from 'react';
import { Play, Zap, Trophy, User, Smartphone, MousePointer, Keyboard, Flame, Check } from 'lucide-react';
import { sounds } from '../services/audio';

interface MenuModalProps {
  onStartGame: () => void;
  onOpenLeaderboard: () => void;
  highScore: number;
  playerName: string;
  onUpdatePlayerName: (name: string) => void;
}

export const MenuModal: React.FC<MenuModalProps> = ({
  onStartGame,
  onOpenLeaderboard,
  highScore,
  playerName,
  onUpdatePlayerName,
}) => {
  const [inputName, setInputName] = useState<string>(playerName);
  const [nameSaved, setNameSaved] = useState<boolean>(false);
  const [instructionTab, setInstructionTab] = useState<'controls' | 'mechanics'>('controls');

  const handleSaveName = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = inputName.trim() || 'Pilot Antariksa';
    setInputName(clean);
    onUpdatePlayerName(clean);
    setNameSaved(true);
    sounds.playButton();
    setTimeout(() => setNameSaved(false), 2000);
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 text-white shadow-2xl my-auto">
        {/* Title */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 tracking-wider uppercase mb-1">
            <Zap className="w-4 h-4 fill-cyan-400" />
            <span>Game Ketangkasan &amp; Refleks</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-widest text-white">
            AEROSPACE
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
            Kendali pesawat antariksa menghindari rintangan bertahap dengan manuver ketangkasan presisi &amp; kombo nyaris.
          </p>

          {highScore > 0 && (
            <div className="mt-2 text-xs text-slate-400">
              Rekor Tertinggi:{' '}
              <span className="font-mono font-bold text-amber-400 tabular-nums text-sm">
                {highScore.toLocaleString('id-ID')}
              </span>
            </div>
          )}
        </div>

        {/* Player Name Input Bar for Leaderboard */}
        <form
          onSubmit={handleSaveName}
          className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 mb-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
        >
          <div className="flex items-center gap-2 text-cyan-400 shrink-0 text-xs font-semibold">
            <User className="w-4 h-4" />
            <span>NAMA PILOT:</span>
          </div>

          <input
            type="text"
            value={inputName}
            maxLength={18}
            onChange={(e) => setInputName(e.target.value)}
            onBlur={() => handleSaveName()}
            placeholder="Masukkan nama pemain..."
            className="flex-1 bg-slate-800/80 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-medium"
          />

          <button
            type="submit"
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center justify-center gap-1.5 ${
              nameSaved
                ? 'bg-emerald-600 text-white'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 active:scale-95'
            }`}
          >
            {nameSaved ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Tersimpan</span>
              </>
            ) : (
              <span>Simpan Nama</span>
            )}
          </button>
        </form>

        {/* Segmented Instruction Navigation */}
        <div className="flex items-center gap-1 p-1 bg-slate-800/80 rounded-lg mb-3 text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              sounds.playButton();
              setInstructionTab('controls');
            }}
            className={`flex-1 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              instructionTab === 'controls'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Instruksi Kendali (Touch &amp; Cursor)
          </button>
          <button
            type="button"
            onClick={() => {
              sounds.playButton();
              setInstructionTab('mechanics');
            }}
            className={`flex-1 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              instructionTab === 'mechanics'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Mekanik &amp; Skor Progresif
          </button>
        </div>

        {/* Tab 1: Comprehensive Control Instructions */}
        {instructionTab === 'controls' && (
          <div className="space-y-2.5 mb-5 text-xs">
            {/* Touch Screen */}
            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-800/60 text-cyan-400 shrink-0 mt-0.5">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-slate-200">Layar Sentuh (Touch Screen Smartphone / Tablet)</div>
                <div className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                  • Geser thumb pada <strong className="text-cyan-300">Pad Slider</strong> di bawah layar untuk meluncurkan pesawat ke kiri/kanan.<br />
                  • Sentuh tombol bumper <strong className="text-cyan-300">◀ Kiri</strong> atau <strong className="text-cyan-300">Kanan ▶</strong> untuk belokan cepat.<br />
                  • Sentuh atau seret langsung pada <strong className="text-cyan-300">kanvas arena</strong> untuk memandu posisi pesawat.<br />
                  • Ketuk tombol <strong className="text-amber-300">⚡ Dash</strong> untuk kekebalan kilat darurat.
                </div>
              </div>
            </div>

            {/* Manual Cursor */}
            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 shrink-0 mt-0.5">
                <MousePointer className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-slate-200">Kursor Manual (Mouse / Trackpad)</div>
                <div className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                  • Klik dan geser knob pada <strong className="text-emerald-300">Pad Kontrol Slider</strong>.<br />
                  • Atau klik &amp; tahan kursor langsung pada arena permainan untuk memandu pesawat meluncur mengikuti pointer secara analog.
                </div>
              </div>
            </div>

            {/* PC Keyboard */}
            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 shrink-0 mt-0.5">
                <Keyboard className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-slate-200">Keyboard PC</div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Gunakan <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-slate-200">A</kbd> / <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-slate-200">D</kbd> atau Panah <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-slate-200">←</kbd> <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-slate-200">→</kbd> untuk manuver, <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-slate-200">Spasi</kbd> untuk Dash, dan <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-slate-200">P</kbd> untuk Jeda.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Core Mechanics & Progression */}
        {instructionTab === 'mechanics' && (
          <div className="space-y-2.5 mb-5 text-xs">
            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800 flex items-start gap-3">
              <Flame className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-slate-200">Mekanik Refleks Nyaris ("Near-Miss")</div>
                <div className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                  Menghindari rintangan dalam jarak sangat tipis memberikan bonus besar <strong className="text-amber-300">+75 Poin x Multiplier</strong> dan menaikkan pengganda skor hingga <strong className="text-amber-400">5.0x</strong>.
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800 flex items-start gap-3">
              <Zap className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-slate-200">6 Tingkat Kesulitan Adaptif</div>
                <div className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                  Laju rintangan dan tempo musik bertambah secara halus seiring skor naik, menghadirkan rintangan laser berdenyut, prowler zig-zag, ranjau pelacak, dan gerbang capit.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={() => {
              handleSaveName();
              sounds.playButton();
              onStartGame();
            }}
            className="w-full py-3.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-cyan-950 flex items-center justify-center gap-2 active:scale-98 whitespace-nowrap"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Mulai Permainan ({inputName.trim() || 'Pilot Antariksa'})</span>
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
