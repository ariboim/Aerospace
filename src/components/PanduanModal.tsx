import React, { useState } from 'react';
import { X, Shield, Zap, Flame, Clock, Target, AlertTriangle, Layers } from 'lucide-react';
import { sounds } from '../services/audio';
import { DIFFICULTY_TIERS } from '../services/difficulty';

interface PanduanModalProps {
  onClose: () => void;
}

export const PanduanModal: React.FC<PanduanModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'tiers' | 'obstacles' | 'items'>('tiers');

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-2xl flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white">Sistem Kesulitan &amp; Panduan</h2>
            <div className="text-xs text-slate-400 mt-0.5">
              Skalabilitas tantangan adaptif &amp; pola rintangan progresif
            </div>
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

        {/* Segmented Filter Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-800/80 rounded-lg mt-3 shrink-0 text-xs font-medium">
          <button
            onClick={() => {
              sounds.playButton();
              setActiveTab('tiers');
            }}
            className={`flex-1 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'tiers' ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Tingkat Kesulitan (Tiers)
          </button>
          <button
            onClick={() => {
              sounds.playButton();
              setActiveTab('obstacles');
            }}
            className={`flex-1 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'obstacles' ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Pola Rintangan
          </button>
          <button
            onClick={() => {
              sounds.playButton();
              setActiveTab('items');
            }}
            className={`flex-1 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'items' ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Skor &amp; Daya
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3 text-xs">
          {activeTab === 'tiers' && (
            <div className="space-y-2.5">
              <p className="text-slate-400 leading-relaxed">
                Tantangan permainan meningkat secara mulus (*continuous logarithmic curve*) seiring skor bertambah. Setiap tingkatan membuka jenis rintangan baru dan mempercepat laju proyektil.
              </p>

              {DIFFICULTY_TIERS.map((tier) => (
                <div
                  key={tier.level}
                  className="p-3 bg-slate-800/50 rounded-xl border border-slate-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: tier.hazardColor }}
                      />
                      <span className="font-bold text-slate-200 text-sm">
                        Level {tier.level}: {tier.name}
                      </span>
                    </div>
                    <span className="font-mono text-cyan-400 font-semibold text-[11px]">
                      {tier.thresholdScore === 0 ? 'Mulai' : `Skor ${tier.thresholdScore.toLocaleString('id-ID')}+`}
                    </span>
                  </div>

                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    {tier.description}
                  </p>

                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                    <span>Kecepatan Dasar: {tier.baseSpeed} px/s</span>
                    <span aria-hidden="true">·</span>
                    <span>Jeda Muncul: {tier.spawnInterval.toFixed(2)} dtk</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'obstacles' && (
            <div className="space-y-2.5">
              <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 flex items-start gap-3">
                <div className="w-6 h-6 rounded bg-sky-500/20 border border-sky-400/40 flex items-center justify-center font-bold text-sky-400 shrink-0">
                  1
                </div>
                <div>
                  <div className="font-semibold text-slate-200">Balok Statis &amp; Celah Presisi</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Rintangan balok dengan celah jalur yang semakin sempit pada level tinggi, menuntut manuver presisi.
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 flex items-start gap-3">
                <div className="w-6 h-6 rounded bg-amber-500/20 border border-amber-400/40 flex items-center justify-center font-bold text-amber-400 shrink-0">
                  2
                </div>
                <div>
                  <div className="font-semibold text-slate-200">Penyapu Bergerak (Moving Sweeper)</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Meluncur horizontal bolak-balik saat jatuh. Cari celah di sisi pembalik arahnya.
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 flex items-start gap-3">
                <div className="w-6 h-6 rounded bg-orange-500/20 border border-orange-400/40 flex items-center justify-center font-bold text-orange-400 shrink-0">
                  3
                </div>
                <div>
                  <div className="font-semibold text-slate-200">Penyusup Zig-Zag (Sine Prowler)</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Mengayun bergelombang dengan kurva sinus halus. Antisipasi ritme ayunannya sebelum melintas.
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 flex items-start gap-3">
                <div className="w-6 h-6 rounded bg-pink-500/20 border border-pink-400/40 flex items-center justify-center font-bold text-pink-400 shrink-0">
                  4
                </div>
                <div>
                  <div className="font-semibold text-slate-200">Laser Berdenyut (Pulse Gate)</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Dua bilah laser dari kiri dan kanan dengan gerbang aman di tengah yang berosilasi secara dinamis.
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 flex items-start gap-3">
                <div className="w-6 h-6 rounded bg-rose-500/20 border border-rose-400/40 flex items-center justify-center font-bold text-rose-400 shrink-0">
                  5
                </div>
                <div>
                  <div className="font-semibold text-slate-200">Ranjau Pelacak (Homing Mine)</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Ranjau berbentuk belah ketupat yang secara perlahan mengarahkan posisi X mengikuti pesawatmu.
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 flex items-start gap-3">
                <div className="w-6 h-6 rounded bg-red-500/20 border border-red-400/40 flex items-center justify-center font-bold text-red-400 shrink-0">
                  6
                </div>
                <div>
                  <div className="font-semibold text-slate-200">Gerbang Capit (Pincer Gates)</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Dua dinding bergerak masuk dari tepi layar menjepit ke arah tengah. Terobos sebelum gerbang menutup!
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 flex items-start gap-3">
                <div className="w-6 h-6 rounded bg-purple-500/20 border border-purple-400/40 flex items-center justify-center font-bold text-purple-400 shrink-0">
                  7
                </div>
                <div>
                  <div className="font-semibold text-slate-200">Pecahan Dinamis &amp; Gelombang Kejut</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Rintangan yang membelah diri menjadi 2 proyektil diagonal di tengah arena, serta balok yang melebar horizontal saat jatuh.
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'items' && (
            <div className="space-y-3">
              <div>
                <div className="font-bold text-slate-200 mb-1">Mekanik Refleks Nyaris ("Near-Miss")</div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  Saat pesawatmu berjarak sangat dekat dengan sisi rintangan tanpa bertabrakan, kamu memperoleh bonus <strong className="text-amber-300">+75 Poin x Pengganda</strong> serta meningkatkan Streak Multiplier hingga <strong className="text-amber-400">5.0x</strong>.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 bg-slate-800/40 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-1.5 font-semibold text-cyan-300">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Perisai (S)</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Menyerap 1 benturan fatal yang seharusnya mengakhiri game.</div>
                </div>

                <div className="p-2.5 bg-slate-800/40 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Slow-Mo (T)</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Memperlambat laju rintangan selama 4 detik saat kondisi padat.</div>
                </div>

                <div className="p-2.5 bg-slate-800/40 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-300">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Isi Dash (D)</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Mereset cooldown kemampuan Kilatan Dash secara instan.</div>
                </div>

                <div className="p-2.5 bg-slate-800/40 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-1.5 font-semibold text-sky-300">
                    <Target className="w-3.5 h-3.5" />
                    <span>Orb Energi (+)</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Memberikan 100 poin ekstra yang dikalikan dengan skor multiplier.</div>
                </div>
              </div>

              <div className="p-3 bg-rose-950/30 rounded-xl border border-rose-900/40 mt-2">
                <div className="flex items-center gap-2 font-bold text-rose-300 text-xs">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Gelombang Badai Refleks Kilat</span>
                </div>
                <div className="text-slate-400 text-[11px] mt-1 leading-relaxed">
                  Setiap kelipatan 1.400 poin, alarm badai akan berbunyi dan formasi gelombang khusus akan turun bersamaan. Bertahan melewati formasi ini memberikan lonjakan poin dan pengujian ketangkasan puncak!
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 shrink-0">
          <button
            onClick={() => {
              sounds.playButton();
              onClose();
            }}
            className="w-full py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition-colors whitespace-nowrap"
          >
            Mengerti &amp; Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
