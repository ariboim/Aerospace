import React from 'react';
import { GameSettings } from '../types/game';
import { Settings as SettingsIcon, X, Volume2, Sliders, Vibrate, Music } from 'lucide-react';
import { sounds } from '../services/audio';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">Pengaturan Permainan</h2>
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

        {/* Options */}
        <div className="space-y-4 text-sm mb-6">
          {/* Adrenaline Background Music Toggle & Volume */}
          <div className="space-y-2 p-3 bg-slate-800/40 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="flex items-center gap-2 text-slate-200 font-semibold text-xs">
                  <Music className="w-4 h-4 text-cyan-400" />
                  <span>Musik Latar Adrenalin (BGM)</span>
                </span>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Synthesizer elektro-arcade adaptif bertempo tinggi
                </div>
              </div>
              <button
                onClick={() => {
                  const next = !settings.musicEnabled;
                  onUpdateSettings({ musicEnabled: next });
                  sounds.setMusicEnabled(next);
                  if (next) sounds.playButton();
                }}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                  settings.musicEnabled ? 'bg-cyan-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.musicEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {settings.musicEnabled && (
              <div className="pt-2 border-t border-slate-800/60 mt-1">
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Volume Musik</span>
                  <span className="font-mono text-cyan-300 font-bold">{Math.round((settings.musicVolume ?? 0.45) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="1.0"
                  step="0.05"
                  value={settings.musicVolume ?? 0.45}
                  onChange={(e) => {
                    const vol = parseFloat(e.target.value);
                    onUpdateSettings({ musicVolume: vol });
                    sounds.setMusicVolume(vol);
                  }}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Sound FX Toggle & Volume */}
          <div className="space-y-2 p-3 bg-slate-800/40 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="flex items-center gap-2 text-slate-200 font-semibold text-xs">
                  <Volume2 className="w-4 h-4 text-amber-400" />
                  <span>Efek Suara Manuver (SFX)</span>
                </span>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Suara kilatan dash, near-miss, power-up, dan benturan
                </div>
              </div>
              <button
                onClick={() => {
                  const next = !settings.soundEnabled;
                  onUpdateSettings({ soundEnabled: next });
                  sounds.setEnabled(next);
                  if (next) sounds.playButton();
                }}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                  settings.soundEnabled ? 'bg-amber-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.soundEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {settings.soundEnabled && (
              <div className="pt-2 border-t border-slate-800/60 mt-1">
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Volume Efek Suara</span>
                  <span className="font-mono text-amber-300 font-bold">{Math.round(settings.volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={settings.volume}
                  onChange={(e) => {
                    const vol = parseFloat(e.target.value);
                    onUpdateSettings({ volume: vol });
                    sounds.setVolume(vol);
                  }}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Screen Shake */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <div>
              <div className="flex items-center gap-2 text-slate-300 font-medium text-xs">
                <Vibrate className="w-4 h-4 text-amber-400" />
                <span>Guncangan Layar (Screen Shake)</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Efek getaran visual saat nyaris atau terkena benturan
              </div>
            </div>
            <button
              onClick={() => {
                sounds.playButton();
                onUpdateSettings({ screenShake: !settings.screenShake });
              }}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                settings.screenShake ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.screenShake ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Sensitivity Slider */}
          <div className="pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-300 font-medium mb-1.5">
              <span className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>Sensitivitas Kendali Refleks</span>
              </span>
              <span className="font-mono text-emerald-400 font-bold">{settings.sensitivity.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.6"
              max="1.8"
              step="0.1"
              value={settings.sensitivity}
              onChange={(e) => {
                onUpdateSettings({ sensitivity: parseFloat(e.target.value) });
              }}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>Stabil (0.6x)</span>
              <span>Biasa (1.0x)</span>
              <span>Gesit Cepat (1.8x)</span>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={() => {
            sounds.playButton();
            onClose();
          }}
          className="w-full py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition-colors whitespace-nowrap"
        >
          Simpan &amp; Kembali
        </button>
      </div>
    </div>
  );
};
