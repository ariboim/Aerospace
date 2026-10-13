import React, { useRef, useState, useCallback, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Zap, MoveHorizontal } from 'lucide-react';
import { TouchInputState } from '../types/game';

interface ControlsOverlayProps {
  onInputStateChange: (input: TouchInputState) => void;
  dashReady: boolean;
}

export const ControlsOverlay: React.FC<ControlsOverlayProps> = ({
  onInputStateChange,
}) => {
  const keysRef = useRef<TouchInputState>({
    left: false,
    right: false,
    up: false,
    down: false,
    dash: false,
    targetXRatio: null,
  });

  const [activeKeys, setActiveKeys] = useState({
    left: false,
    right: false,
    dash: false,
  });

  const [sliderRatio, setSliderRatio] = useState<number>(0.5);
  const [isDraggingSlider, setIsDraggingSlider] = useState<boolean>(false);
  const sliderTrackRef = useRef<HTMLDivElement | null>(null);

  // Helper to commit state changes to parent safely
  const commitState = useCallback(() => {
    onInputStateChange({ ...keysRef.current });
  }, [onInputStateChange]);

  const updateButtonState = (key: 'left' | 'right' | 'dash', value: boolean) => {
    if (keysRef.current[key] === value) return;
    keysRef.current[key] = value;
    setActiveKeys((prev) => ({ ...prev, [key]: value }));
    commitState();
  };

  // Handle pointer interactions on the horizontal slider track
  const handleSliderPointer = useCallback(
    (clientX: number) => {
      const track = sliderTrackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const rawRatio = (clientX - rect.left) / rect.width;
      const clampedRatio = Math.max(0.04, Math.min(0.96, rawRatio));

      setSliderRatio(clampedRatio);
      keysRef.current.targetXRatio = clampedRatio;
      commitState();
    },
    [commitState]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingSlider(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    handleSliderPointer(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingSlider) return;
    e.preventDefault();
    handleSliderPointer(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingSlider) return;
    e.preventDefault();
    setIsDraggingSlider(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    // Clear target ratio so ship stops gliding continuously
    keysRef.current.targetXRatio = null;
    commitState();
  };

  return (
    <div className="w-full max-w-[580px] mx-auto mt-2.5 px-1 select-none">
      {/* Controller Pad Shell */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-xl backdrop-blur-sm">
        {/* Header Label */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium px-1 mb-2">
          <div className="flex items-center gap-1.5 text-cyan-400 font-semibold tracking-wider uppercase">
            <MoveHorizontal className="w-3.5 h-3.5" />
            <span>Pad Kontrol Geser Pesawat</span>
          </div>
          <div className="text-slate-500 font-mono">
            {isDraggingSlider ? `Posisi: ${Math.round(sliderRatio * 100)}%` : 'Geser atau Sentuh Tombol'}
          </div>
        </div>

        {/* Primary Controller Pad: Left Bumper, Slider Track, Right Bumper, Dash */}
        <div className="flex items-center gap-2">
          {/* Left Steer Bumper */}
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              updateButtonState('left', true);
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              updateButtonState('left', false);
            }}
            onPointerLeave={() => updateButtonState('left', false)}
            className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center font-bold text-white transition-all active:scale-95 shrink-0 ${
              activeKeys.left
                ? 'bg-cyan-600 shadow-lg shadow-cyan-950 scale-95 ring-2 ring-cyan-400'
                : 'bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-slate-200'
            }`}
            aria-label="Geser Kiri"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-[10px] uppercase tracking-wider mt-0.5">Kiri</span>
          </button>

          {/* Interactive Slider Track (Analog horizontal sliding pad) */}
          <div
            ref={sliderTrackRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className={`flex-1 h-14 bg-slate-950 rounded-xl border border-slate-800 relative cursor-pointer flex items-center px-2 touch-none overflow-hidden transition-colors ${
              isDraggingSlider ? 'border-cyan-500/70 bg-slate-950/90' : 'hover:border-slate-700'
            }`}
          >
            {/* Guide Grid Markers */}
            <div className="absolute inset-0 flex justify-between items-center px-4 pointer-events-none opacity-20">
              <span className="w-px h-5 bg-slate-400" />
              <span className="w-px h-3 bg-slate-400" />
              <span className="w-px h-6 bg-cyan-400" />
              <span className="w-px h-3 bg-slate-400" />
              <span className="w-px h-5 bg-slate-400" />
            </div>

            {/* Draggable Controller Thumb Handle */}
            <div
              className={`absolute top-1 bottom-1 w-12 rounded-lg flex items-center justify-center transition-transform duration-75 shadow-md ${
                isDraggingSlider
                  ? 'bg-cyan-500 text-slate-950 shadow-cyan-950 ring-2 ring-cyan-300'
                  : 'bg-cyan-600 text-white hover:bg-cyan-500'
              }`}
              style={{
                left: `calc(${sliderRatio * 100}% - 24px)`,
              }}
            >
              <div className="flex items-center gap-0.5 pointer-events-none">
                <span className="w-0.5 h-3 bg-current opacity-60 rounded-full" />
                <span className="w-0.5 h-4 bg-current rounded-full" />
                <span className="w-0.5 h-3 bg-current opacity-60 rounded-full" />
              </div>
            </div>

            {/* Subtle Label Behind Knob */}
            <div className="w-full text-center text-[10px] font-medium text-slate-500 pointer-events-none uppercase tracking-widest">
              ◀ Geser Pad Kiri - Kanan ▶
            </div>
          </div>

          {/* Right Steer Bumper */}
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              updateButtonState('right', true);
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              updateButtonState('right', false);
            }}
            onPointerLeave={() => updateButtonState('right', false)}
            className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center font-bold text-white transition-all active:scale-95 shrink-0 ${
              activeKeys.right
                ? 'bg-cyan-600 shadow-lg shadow-cyan-950 scale-95 ring-2 ring-cyan-400'
                : 'bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-slate-200'
            }`}
            aria-label="Geser Kanan"
          >
            <ArrowRight className="w-5 h-5" />
            <span className="text-[10px] uppercase tracking-wider mt-0.5">Kanan</span>
          </button>

          {/* Kilatan Dash Action Button */}
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              updateButtonState('dash', true);
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              updateButtonState('dash', false);
            }}
            onPointerLeave={() => updateButtonState('dash', false)}
            className={`w-16 h-14 rounded-xl flex flex-col items-center justify-center font-bold transition-all active:scale-95 shrink-0 uppercase ${
              activeKeys.dash
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-950 scale-95 ring-2 ring-amber-300'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
            }`}
            aria-label="Dash Kilat"
          >
            <Zap className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="text-[10px] font-bold tracking-wider mt-0.5">Dash</span>
          </button>
        </div>
      </div>

      {/* Desktop Keyboard Quick Shortcuts Helper */}
      <div className="hidden sm:flex items-center justify-center gap-4 text-xs text-slate-400 py-1.5">
        <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">A</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">D</kbd> atau <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">←</kbd> <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">→</kbd> Geser</span>
        <span aria-hidden="true">·</span>
        <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">Spasi</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">Shift</kbd> Dash Kilatan</span>
        <span aria-hidden="true">·</span>
        <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">P</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">Esc</kbd> Jeda</span>
      </div>
    </div>
  );
};
