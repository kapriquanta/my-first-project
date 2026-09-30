import React from 'react';
import { Play, RotateCcw, Shirt, Trophy } from 'lucide-react';
import { sound } from '../utils/audio';

interface PauseModalProps {
  isOpen: boolean;
  onResume: () => void;
  onRestart: () => void;
  onOpenSkins: () => void;
  onOpenStats: () => void;
  score: number;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  isOpen,
  onResume,
  onRestart,
  onOpenSkins,
  onOpenStats,
  score,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-[280px] bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl text-center space-y-3">
        <h3 className="text-xl font-bold text-white tracking-wide">Flight Paused</h3>
        <p className="text-xs text-slate-400">
          Current Altitude Score: <span className="font-mono font-bold text-amber-300 text-sm">{score}</span>
        </p>

        <div className="pt-2 space-y-2">
          <button
            onClick={() => {
              sound.playClick();
              onResume();
            }}
            className="w-full py-2.5 px-4 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            Resume Flight
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onRestart();
            }}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Restart Run
          </button>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => {
                sound.playClick();
                onOpenSkins();
              }}
              className="py-2 px-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer"
            >
              <Shirt className="w-3.5 h-3.5 text-sky-400" />
              Skins
            </button>
            <button
              onClick={() => {
                sound.playClick();
                onOpenStats();
              }}
              className="py-2 px-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              Records
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
