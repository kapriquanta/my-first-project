import React, { useEffect, useState } from 'react';
import { Difficulty, MEDALS, Medal } from '../types/game';
import { sound } from '../utils/audio';
import { RotateCcw, Shirt, Trophy } from 'lucide-react';

interface ScoreBoardProps {
  score: number;
  highScore: number;
  isNewHigh: boolean;
  difficulty: Difficulty;
  coinsEarned: number;
  onRestart: () => void;
  onOpenSkins: () => void;
  onOpenStats: () => void;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  score,
  highScore,
  isNewHigh,
  difficulty,
  coinsEarned,
  onRestart,
  onOpenSkins,
  onOpenStats,
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  // Determine medal
  const currentMedal: Medal | null =
    [...MEDALS].reverse().find((m) => score >= m.minScore) || null;

  // Number ticker animation
  useEffect(() => {
    let start = 0;
    const duration = 650;
    const startTime = performance.now();

    if (score === 0) {
      setAnimatedScore(0);
      return;
    }

    const timer = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      const current = Math.floor(progress * score);
      setAnimatedScore(current);

      if (progress >= 1) {
        clearInterval(timer);
        if (isNewHigh || (currentMedal && score >= 10)) {
          sound.playMedalFanfare();
        }
      }
    }, 30);

    return () => clearInterval(timer);
  }, [score, isNewHigh, currentMedal]);

  // Space/Enter to restart
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        sound.playClick();
        onRestart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRestart]);

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
      {/* Plaque Container */}
      <div className="w-full max-w-[340px] bg-slate-900 border-2 border-slate-700/80 rounded-2xl p-5 shadow-2xl relative text-center">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-2xl font-black text-rose-500 tracking-wide uppercase drop-shadow-md">
            Flight Terminated
          </h2>
          <span className="text-xs text-slate-400 font-medium capitalize">
            {difficulty} Airspace
          </span>
        </div>

        {/* Scorecard Table */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 mb-4 space-y-3">
          {/* Main Score & Best */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
              <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider block">Score</span>
              <span className="text-3xl font-black text-white font-mono block mt-0.5">
                {animatedScore}
              </span>
            </div>

            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 relative">
              {isNewHigh && (
                <span className="absolute -top-2.5 right-1.5 bg-amber-500 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow">
                  NEW BEST
                </span>
              )}
              <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider block">Best</span>
              <span className="text-3xl font-black text-amber-300 font-mono block mt-0.5">
                {highScore}
              </span>
            </div>
          </div>

          {/* Medal & Coins Row */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Award:</span>
              {currentMedal ? (
                <span className="font-bold flex items-center gap-1 text-white">
                  <span>{currentMedal.badge}</span> {currentMedal.name}
                </span>
              ) : (
                <span className="text-slate-500">None (Reach 10)</span>
              )}
            </div>
            <div className="flex items-center gap-1 font-mono text-amber-300 font-semibold">
              <span className="text-amber-400">★</span> +{coinsEarned} Coins
            </div>
          </div>
        </div>

        {/* Primary Action Button: Play Again */}
        <button
          onClick={() => {
            sound.playClick();
            onRestart();
          }}
          className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-base cursor-pointer mb-2.5"
        >
          <RotateCcw className="w-4 h-4 stroke-[2.5]" />
          <span>Take Flight Again</span>
          <span className="text-xs bg-emerald-600/60 text-slate-950 font-semibold px-2 py-0.5 rounded ml-1">
            Space
          </span>
        </button>

        {/* Secondary Navigation Actions */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={() => {
              sound.playClick();
              onOpenSkins();
            }}
            className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 font-medium cursor-pointer"
          >
            <Shirt className="w-3.5 h-3.5 text-sky-400" />
            <span>Skins</span>
          </button>
          <button
            onClick={() => {
              sound.playClick();
              onOpenStats();
            }}
            className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 font-medium cursor-pointer"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Records</span>
          </button>
        </div>
      </div>
    </div>
  );
};
