import React, { useState, useEffect, useCallback } from 'react';
import { GameMetrics, GameSettings, GameState, ScoreEntry, TouchInputState } from './types/game';
import { GameCanvas } from './components/GameCanvas';
import { GameHUD } from './components/GameHUD';
import { ControlsOverlay } from './components/ControlsOverlay';
import { MenuModal } from './components/MenuModal';
import { GameOverModal } from './components/GameOverModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { SettingsModal } from './components/SettingsModal';
import { PanduanModal } from './components/PanduanModal';
import { sounds } from './services/audio';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Modals state
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showPanduan, setShowPanduan] = useState<boolean>(false);
  const [isNewHighScore, setIsNewHighScore] = useState<boolean>(false);

  // Settings
  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem('reflex_dodger_settings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      soundEnabled: true,
      volume: 0.6,
      musicEnabled: true,
      musicVolume: 0.45,
      screenShake: true,
      controlMode: 'keyboard',
      sensitivity: 1.0,
    };
  });

  // Local Leaderboard
  const [scoresHistory, setScoresHistory] = useState<ScoreEntry[]>(() => {
    try {
      const saved = localStorage.getItem('reflex_dodger_history');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // High Score
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('reflex_dodger_high_score');
      if (saved) return parseInt(saved, 10);
    } catch {}
    return 0;
  });

  // Player Name for Leaderboard
  const [playerName, setPlayerName] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('aerospace_player_name');
      if (saved) return saved;
    } catch {}
    return 'Pilot Antariksa';
  });

  const handleUpdatePlayerName = useCallback((name: string) => {
    const clean = name.trim() || 'Pilot Antariksa';
    setPlayerName(clean);
    try {
      localStorage.setItem('aerospace_player_name', clean);
    } catch {}
  }, []);

  // Game Metrics
  const [metrics, setMetrics] = useState<GameMetrics>({
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
  });

  // Mobile / Pad Touch Inputs
  const [touchInput, setTouchInput] = useState<TouchInputState>({
    left: false,
    right: false,
    up: false,
    down: false,
    dash: false,
    targetXRatio: null,
  });

  const handleTouchInputChange = useCallback((input: TouchInputState) => {
    setTouchInput(input);
  }, []);

  // Keep high score synced
  useEffect(() => {
    setMetrics((prev) => ({ ...prev, highScore }));
  }, [highScore]);

  // Sync Audio & Music settings with sound system
  useEffect(() => {
    sounds.setEnabled(settings.soundEnabled);
    sounds.setVolume(settings.volume);
    sounds.setMusicEnabled(settings.musicEnabled);
    sounds.setMusicVolume(settings.musicVolume);
  }, [settings.soundEnabled, settings.volume, settings.musicEnabled, settings.musicVolume]);

  // Manage Adrenaline Background Music playback based on game state
  useEffect(() => {
    if (gameState === 'PLAYING' && !isPaused) {
      sounds.startBgm();
    } else if (gameState === 'PAUSED') {
      sounds.pauseBgm();
    } else {
      sounds.stopBgm();
    }

    return () => {
      sounds.stopBgm();
    };
  }, [gameState, isPaused]);

  // Save settings to localStorage
  const handleUpdateSettings = (newSettings: Partial<GameSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('reflex_dodger_settings', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Start new game - guarantees complete reset to score 0
  const handleStartGame = useCallback(() => {
    sounds.playButton();
    setIsNewHighScore(false);
    setIsPaused(false);
    setMetrics((prev) => ({
      ...prev,
      score: 0,
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
    }));
    setGameState('PLAYING');
  }, []);

  // Pause / Resume
  const handleTogglePause = useCallback(() => {
    if (gameState === 'PLAYING') {
      setIsPaused(true);
      setGameState('PAUSED');
    } else if (gameState === 'PAUSED') {
      setIsPaused(false);
      setGameState('PLAYING');
    }
  }, [gameState]);

  // Game Over Handler
  const handleGameOver = useCallback((finalMetrics: GameMetrics) => {
    setMetrics(finalMetrics);
    setGameState('GAME_OVER');

    const isNewBest = finalMetrics.score > highScore;
    if (isNewBest) {
      setIsNewHighScore(true);
      setHighScore(finalMetrics.score);
      try {
        localStorage.setItem('reflex_dodger_high_score', finalMetrics.score.toString());
      } catch {}
    }

    // Determine Rank
    let rank: 'S' | 'A' | 'B' | 'C' = 'C';
    if (finalMetrics.score >= 5000 || finalMetrics.nearMisses >= 12) {
      rank = 'S';
    } else if (finalMetrics.score >= 3000 || finalMetrics.nearMisses >= 8) {
      rank = 'A';
    } else if (finalMetrics.score >= 1500) {
      rank = 'B';
    }

    // Format Date: e.g. "13 Okt 2026, 19:28"
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

    const newEntry: ScoreEntry = {
      id: Math.random().toString(36).substring(2, 9),
      playerName: playerName || 'Pilot Antariksa',
      score: finalMetrics.score,
      survivalTime: finalMetrics.survivalTime,
      nearMisses: finalMetrics.nearMisses,
      obstaclesAvoided: finalMetrics.obstaclesAvoided,
      maxMultiplier: finalMetrics.multiplier,
      levelReached: finalMetrics.level,
      rank,
      date: dateStr,
    };

    setScoresHistory((prev) => {
      const updated = [newEntry, ...prev]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
      try {
        localStorage.setItem('reflex_dodger_history', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, [highScore, playerName]);

  const handleUpdatePlayerNameFromGameOver = useCallback((name: string) => {
    handleUpdatePlayerName(name);
    setScoresHistory((prev) => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      updated[0] = { ...updated[0], playerName: name };
      try {
        localStorage.setItem('reflex_dodger_history', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, [handleUpdatePlayerName]);

  // Clear Leaderboard history
  const handleClearScores = useCallback(() => {
    setScoresHistory([]);
    setHighScore(0);
    try {
      localStorage.removeItem('reflex_dodger_history');
      localStorage.removeItem('reflex_dodger_high_score');
    } catch {}
  }, []);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 
        Top Bar Contract:
        [Brand title, one line] — [4–5 nav links, 1–2 word labels, single-line] — [1 primary action]
      */}
      <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800 bg-[#090d16]/90 backdrop-blur-md sticky top-0 z-20">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => {
            sounds.playButton();
            setGameState('TITLE_MENU');
          }}
          className="text-lg font-bold tracking-tight text-white hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 text-left"
        >
          AEROSPACE
        </button>

        {/* Zone 2: 4 clean single-line nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <button
            onClick={() => {
              sounds.playButton();
              if (gameState !== 'PLAYING') handleStartGame();
              else handleTogglePause();
            }}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            {gameState === 'PLAYING' ? 'Jeda' : 'Mulai'}
          </button>
          <button
            onClick={() => {
              sounds.playButton();
              setShowPanduan(true);
            }}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Panduan
          </button>
          <button
            onClick={() => {
              sounds.playButton();
              setShowLeaderboard(true);
            }}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Papan Skor
          </button>
          <button
            onClick={() => {
              sounds.playButton();
              setShowSettings(true);
            }}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Pengaturan
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              sounds.playButton();
              if (gameState === 'PLAYING') {
                handleTogglePause();
              } else {
                handleStartGame();
              }
            }}
            className="px-4 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-md shadow-cyan-950"
          >
            {gameState === 'PLAYING' ? (isPaused ? 'Lanjutkan' : 'Jeda Game') : 'Main Sekarang'}
          </button>
        </div>
      </header>

      {/* Main Game Arena Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 w-full max-w-4xl mx-auto">
        {/* HUD Area */}
        <GameHUD
          metrics={metrics}
          settings={settings}
          isPaused={isPaused}
          onTogglePause={handleTogglePause}
          onToggleSound={() => handleUpdateSettings({ soundEnabled: !settings.soundEnabled })}
          onToggleMusic={() => handleUpdateSettings({ musicEnabled: !settings.musicEnabled })}
        />

        {/* Canvas Surface with Modals */}
        <div className="relative w-full max-w-[580px]">
          <GameCanvas
            gameState={gameState}
            settings={settings}
            onUpdateMetrics={setMetrics}
            onGameOver={handleGameOver}
            onTogglePause={handleTogglePause}
            touchInput={touchInput}
          />

          {/* Title Menu Modal */}
          {gameState === 'TITLE_MENU' && (
            <MenuModal
              onStartGame={handleStartGame}
              onOpenLeaderboard={() => setShowLeaderboard(true)}
              highScore={highScore}
              playerName={playerName}
              onUpdatePlayerName={handleUpdatePlayerName}
            />
          )}

          {/* Pause Modal */}
          {gameState === 'PAUSED' && (
            <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
              <div className="w-full max-w-xs bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-white shadow-2xl">
                <div className="text-xs font-semibold text-cyan-400 tracking-wider uppercase mb-1">
                  Permainan Dijeda
                </div>
                <h3 className="text-xl font-bold mb-4">ISTIRAHAT SEJENAK</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      sounds.playButton();
                      handleTogglePause();
                    }}
                    className="w-full py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition-colors whitespace-nowrap"
                  >
                    Lanjutkan Permainan
                  </button>
                  <button
                    onClick={() => {
                      sounds.playButton();
                      handleStartGame();
                    }}
                    className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-colors border border-slate-700 whitespace-nowrap"
                  >
                    Ulang Dari Awal
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Game Over Modal */}
          {gameState === 'GAME_OVER' && (
            <GameOverModal
              metrics={metrics}
              isNewHighScore={isNewHighScore}
              playerName={playerName}
              onUpdatePlayerName={handleUpdatePlayerNameFromGameOver}
              onRestart={handleStartGame}
              onOpenLeaderboard={() => setShowLeaderboard(true)}
            />
          )}
        </div>

        {/* Tactical On-Screen Controls */}
        <ControlsOverlay
          onInputStateChange={handleTouchInputChange}
          dashReady={true}
        />
      </main>

      {/* Global Modals */}
      {showLeaderboard && (
        <LeaderboardModal
          scores={scoresHistory}
          onClose={() => setShowLeaderboard(false)}
          onClearScores={handleClearScores}
          playerName={playerName}
          onUpdatePlayerName={handleUpdatePlayerName}
        />
      )}

      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showPanduan && (
        <PanduanModal onClose={() => setShowPanduan(false)} />
      )}

      {/* Quiet Minimal Footer */}
      <footer className="py-4 border-t border-slate-900 text-center text-xs text-slate-400 select-none">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => {
              sounds.playButton();
              setShowPanduan(true);
            }}
            className="hover:text-slate-300 transition-colors"
          >
            Panduan Mekanik
          </button>
          <span aria-hidden="true">·</span>
          <button
            onClick={() => {
              sounds.playButton();
              setShowLeaderboard(true);
            }}
            className="hover:text-slate-300 transition-colors"
          >
            Papan Rekor
          </button>
          <span aria-hidden="true">·</span>
          <button
            onClick={() => {
              sounds.playButton();
              setShowSettings(true);
            }}
            className="hover:text-slate-300 transition-colors"
          >
            Pengaturan
          </button>
        </div>
      </footer>
    </div>
  );
}
