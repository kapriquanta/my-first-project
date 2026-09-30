import React from 'react';
import { PlayerStats, MEDALS, DIFFICULTIES } from '../types/game';
import { sound } from '../utils/audio';
import { Trophy, Award, Flame, Zap, X } from 'lucide-react';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PlayerStats;
  currentScore: number;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  stats,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Pilot Career Records
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Your lifetime arcade performance & achievements</p>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* High Scores by Difficulty */}
        <div className="py-4 space-y-2 border-b border-slate-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">High Scores</span>
          <div className="grid grid-cols-3 gap-2">
            {(['chill', 'classic', 'hard'] as const).map((diff) => (
              <div key={diff} className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50 text-center">
                <span className="text-xs text-slate-400 block">{DIFFICULTIES[diff].name}</span>
                <span className="text-2xl font-bold text-amber-300 font-mono block mt-1">
                  {stats.highScores[diff] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Lifetime Metrics */}
        <div className="py-4 border-b border-slate-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">Career Totals</span>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="p-3 bg-slate-800/40 rounded-xl flex items-center gap-3">
              <Flame className="w-5 h-5 text-orange-400 shrink-0" />
              <div>
                <span className="text-xs text-slate-400 block">Total Games</span>
                <span className="font-bold text-white font-mono text-base">{stats.totalGames}</span>
              </div>
            </div>
            <div className="p-3 bg-slate-800/40 rounded-xl flex items-center gap-3">
              <Zap className="w-5 h-5 text-sky-400 shrink-0" />
              <div>
                <span className="text-xs text-slate-400 block">Pipes Cleared</span>
                <span className="font-bold text-white font-mono text-base">{stats.totalPipes}</span>
              </div>
            </div>
            <div className="p-3 bg-slate-800/40 rounded-xl flex items-center gap-3">
              <span className="text-amber-400 font-bold text-lg leading-none shrink-0">★</span>
              <div>
                <span className="text-xs text-slate-400 block">Total Coins</span>
                <span className="font-bold text-amber-300 font-mono text-base">{stats.coins}</span>
              </div>
            </div>
            <div className="p-3 bg-slate-800/40 rounded-xl flex items-center gap-3">
              <Award className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="text-xs text-slate-400 block">Skins Owned</span>
                <span className="font-bold text-white font-mono text-base">{stats.unlockedSkins.length} / 6</span>
              </div>
            </div>
          </div>
        </div>

        {/* Medals Showcase */}
        <div className="py-4 flex-1 overflow-y-auto">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">Medal Showcase</span>
          <div className="space-y-2">
            {MEDALS.map((medal) => {
              const maxBest = Math.max(
                stats.highScores.chill || 0,
                stats.highScores.classic || 0,
                stats.highScores.hard || 0
              );
              const isEarned = maxBest >= medal.minScore;

              return (
                <div
                  key={medal.id}
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    isEarned
                      ? 'bg-slate-800/60 border-slate-700'
                      : 'bg-slate-900/30 border-slate-800/60 opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{medal.badge}</span>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{medal.name}</h4>
                      <span className="text-xs text-slate-400">Score {medal.minScore}+ points</span>
                    </div>
                  </div>
                  <div>
                    {isEarned ? (
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-800/60">
                        UNLOCKED
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">Locked</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 mt-2 flex justify-end">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-5 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
