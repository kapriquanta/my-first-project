/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { GameState, Difficulty, TimeOfDay, BirdSkinId, PlayerStats, BirdSkin, SKINS } from './types/game';
import { FlappyCanvas } from './components/FlappyCanvas';
import { HUD } from './components/HUD';
import { ScoreBoard } from './components/ScoreBoard';
import { PauseModal } from './components/PauseModal';
import { SkinModal } from './components/SkinModal';
import { StatsModal } from './components/StatsModal';
import { TopBar } from './components/TopBar';
import { sound } from './utils/audio';

const STATS_STORAGE_KEY = 'flappy_arcade_stats_v2';

const DEFAULT_STATS: PlayerStats = {
  highScores: {
    chill: 0,
    classic: 0,
    hard: 0,
  },
  coins: 0,
  unlockedSkins: ['classic'],
  totalGames: 0,
  totalPipes: 0,
  totalFlaps: 0,
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>('START');
  const [score, setScore] = useState(0);
  const [coinsEarnedThisRun, setCoinsEarnedThisRun] = useState(0);
  const [isNewHigh, setIsNewHigh] = useState(false);

  const [difficulty, setDifficulty] = useState<Difficulty>('classic');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('auto');
  const [selectedSkin, setSelectedSkin] = useState<BirdSkinId>('classic');

  const [isSkinModalOpen, setIsSkinModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  const [sfxMuted, setSfxMuted] = useState(false);
  const [musicMuted, setMusicMuted] = useState(true);

  // Load stats from localStorage
  const [stats, setStats] = useState<PlayerStats>(() => {
    try {
      const saved = localStorage.getItem(STATS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_STATS,
          ...parsed,
          highScores: { ...DEFAULT_STATS.highScores, ...parsed.highScores },
        };
      }
      // Migration check from user's original localStorage key
      const legacyScore = localStorage.getItem('flappy_highscore');
      if (legacyScore) {
        const num = parseInt(legacyScore, 10);
        if (!isNaN(num) && num > 0) {
          return {
            ...DEFAULT_STATS,
            highScores: { ...DEFAULT_STATS.highScores, classic: num },
          };
        }
      }
    } catch {
      // Fallback
    }
    return DEFAULT_STATS;
  });

  // Save stats to localStorage whenever changed
  useEffect(() => {
    try {
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
      // Keep legacy key in sync for backwards compatibility
      localStorage.setItem('flappy_highscore', String(stats.highScores.classic || 0));
    } catch {
      // Local storage unavailable or full
    }
  }, [stats]);

  // Audio settings sync
  const toggleSfx = useCallback(() => {
    setSfxMuted((prev) => {
      const next = !prev;
      sound.setSfx(!next);
      return next;
    });
  }, []);

  const toggleMusic = useCallback(() => {
    setMusicMuted((prev) => {
      const next = !prev;
      sound.setMusic(!next);
      return next;
    });
  }, []);

  // Time of Day cycler
  const toggleTimeOfDay = useCallback(() => {
    setTimeOfDay((prev) => {
      if (prev === 'auto') return 'day';
      if (prev === 'day') return 'sunset';
      if (prev === 'sunset') return 'night';
      return 'auto';
    });
  }, []);

  // Score update handler
  const handleScoreUpdate = useCallback((newScore: number) => {
    setScore(newScore);
    setStats((prev) => ({
      ...prev,
      totalPipes: prev.totalPipes + 1,
    }));
  }, []);

  // Coin collected handler
  const handleCoinCollected = useCallback(() => {
    setCoinsEarnedThisRun((prev) => prev + 1);
    setStats((prev) => ({
      ...prev,
      coins: prev.coins + 1,
    }));
  }, []);

  // Game start handler
  const handleGameStart = useCallback(() => {
    setGameState('PLAYING');
    setScore(0);
    setCoinsEarnedThisRun(0);
    setIsNewHigh(false);
    setStats((prev) => ({
      ...prev,
      totalGames: prev.totalGames + 1,
    }));
  }, []);

  // Game over handler
  const handleGameOver = useCallback(
    (finalScore: number) => {
      setGameState('GAMEOVER');
      const currentHigh = stats.highScores[difficulty] || 0;
      const beatRecord = finalScore > currentHigh;
      setIsNewHigh(beatRecord);

      setStats((prev) => {
        const newHighScores = {
          ...prev.highScores,
          [difficulty]: Math.max(prev.highScores[difficulty] || 0, finalScore),
        };
        return {
          ...prev,
          highScores: newHighScores,
        };
      });
    },
    [difficulty, stats.highScores]
  );

  // Restart game handler
  const handleRestart = useCallback(() => {
    setScore(0);
    setCoinsEarnedThisRun(0);
    setIsNewHigh(false);
    setGameState('PLAYING');
    setStats((prev) => ({
      ...prev,
      totalGames: prev.totalGames + 1,
    }));
  }, []);

  // Pause toggle
  const handleTogglePause = useCallback(() => {
    setGameState((prev) => {
      if (prev === 'PLAYING') return 'PAUSED';
      if (prev === 'PAUSED') return 'PLAYING';
      return prev;
    });
  }, []);

  // Global keyboard shortcuts (Pause, Music, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyP') {
        e.preventDefault();
        handleTogglePause();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        toggleMusic();
      } else if (e.code === 'Escape') {
        if (isSkinModalOpen) {
          setIsSkinModalOpen(false);
        } else if (isStatsModalOpen) {
          setIsStatsModalOpen(false);
        } else if (gameState === 'PLAYING') {
          setGameState('PAUSED');
        } else if (gameState === 'PAUSED') {
          setGameState('PLAYING');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePause, toggleMusic, isSkinModalOpen, isStatsModalOpen, gameState]);

  // Skin unlock handler
  const handleUnlockSkin = (skin: BirdSkin) => {
    if (stats.coins >= skin.cost) {
      setStats((prev) => ({
        ...prev,
        coins: prev.coins - skin.cost,
        unlockedSkins: [...prev.unlockedSkins, skin.id],
      }));
      setSelectedSkin(skin.id);
    }
  };

  // Instant sandbox unlock all
  const handleUnlockAll = () => {
    setStats((prev) => ({
      ...prev,
      unlockedSkins: Object.keys(SKINS) as BirdSkinId[],
    }));
  };

  const currentHigh = stats.highScores[difficulty] || 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-sky-500 selection:text-white">
      {/* 1. Header (Following Section 2 Top Bar Contract) */}
      <TopBar
        onOpenSkins={() => setIsSkinModalOpen(true)}
        onOpenStats={() => setIsStatsModalOpen(true)}
        timeOfDay={timeOfDay}
        onToggleTimeOfDay={toggleTimeOfDay}
        sfxMuted={sfxMuted}
        onToggleSfx={toggleSfx}
        musicMuted={musicMuted}
        onToggleMusic={toggleMusic}
      />

      {/* 2. Main Arcade Stage */}
      <main className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 max-w-5xl mx-auto w-full">
        {/* Game Console Frame */}
        <div className="relative w-full max-w-[390px] mx-auto select-none">
          {/* Canvas Engine */}
          <FlappyCanvas
            gameState={gameState}
            difficulty={difficulty}
            timeOfDay={timeOfDay}
            skinId={selectedSkin}
            onScoreUpdate={handleScoreUpdate}
            onCoinCollected={handleCoinCollected}
            onGameOver={handleGameOver}
            onGameStart={handleGameStart}
            score={score}
          />

          {/* Heads-up-Display Overlay */}
          <HUD
            gameState={gameState}
            score={score}
            highScore={currentHigh}
            coins={stats.coins}
            difficulty={difficulty}
            onChangeDifficulty={setDifficulty}
            selectedSkin={selectedSkin}
            onOpenSkins={() => setIsSkinModalOpen(true)}
            onTogglePause={handleTogglePause}
            onStartGame={handleGameStart}
          />

          {/* Paused Overlay */}
          {gameState === 'PAUSED' && (
            <PauseModal
              isOpen={gameState === 'PAUSED'}
              onResume={handleTogglePause}
              onRestart={handleRestart}
              onOpenSkins={() => setIsSkinModalOpen(true)}
              onOpenStats={() => setIsStatsModalOpen(true)}
              score={score}
            />
          )}

          {/* Game Over Scoreboard Plaque */}
          {gameState === 'GAMEOVER' && (
            <ScoreBoard
              score={score}
              highScore={currentHigh}
              isNewHigh={isNewHigh}
              difficulty={difficulty}
              coinsEarned={coinsEarnedThisRun}
              onRestart={handleRestart}
              onOpenSkins={() => setIsSkinModalOpen(true)}
              onOpenStats={() => setIsStatsModalOpen(true)}
            />
          )}
        </div>

        {/* Arcade Instruction & Key Legend */}
        <div className="mt-3 flex items-center justify-center gap-4 text-xs text-slate-400 text-center flex-wrap">
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[11px] font-mono text-slate-200">
              Space
            </kbd>{' '}
            / Tap to Flap
          </span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[11px] font-mono text-slate-200">
              P
            </kbd>{' '}
            Pause
          </span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[11px] font-mono text-slate-200">
              M
            </kbd>{' '}
            Music
          </span>
        </div>
      </main>

      {/* 3. Footer */}
      <footer className="py-2.5 px-4 text-center border-t border-slate-900 text-xs text-slate-500">
        Flappy Bird Arcade Deluxe · High-Performance Web Audio & Canvas Engine
      </footer>

      {/* Aviary Skin Selector Modal */}
      <SkinModal
        isOpen={isSkinModalOpen}
        onClose={() => setIsSkinModalOpen(false)}
        selectedSkin={selectedSkin}
        onSelectSkin={setSelectedSkin}
        coins={stats.coins}
        unlockedSkins={stats.unlockedSkins}
        onUnlockSkin={handleUnlockSkin}
        onUnlockAll={handleUnlockAll}
      />

      {/* Pilot Statistics & Medals Modal */}
      <StatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        stats={stats}
        currentScore={score}
      />
    </div>
  );
}
