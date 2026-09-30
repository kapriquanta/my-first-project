import React from 'react';
import { GameState, Difficulty, BirdSkinId, SKINS, DIFFICULTIES } from '../types/game';
import { Pause, Play, Shirt } from 'lucide-react';
import { sound } from '../utils/audio';

interface HUDProps {
  gameState: GameState;
  score: number;
  highScore: number;
  coins: number;
  difficulty: Difficulty;
  onChangeDifficulty: (diff: Difficulty) => void;
  selectedSkin: BirdSkinId;
  onOpenSkins: () => void;
  onTogglePause: () => void;
  onStartGame: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  gameState,
  score,
  coins,
  difficulty,
  onChangeDifficulty,
  selectedSkin,
  onOpenSkins,
  onTogglePause,
  onStartGame,
}) => {
  const currentSkin = SKINS[selectedSkin];

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-4">
      {/* Top HUD Bar */}
      <div className="flex items-start justify-between w-full">
        {/* Left: Coin Bank */}
        <div className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/80 backdrop-blur rounded-full border border-slate-700/80 text-xs font-mono font-bold text-amber-300 shadow">
          <span className="text-amber-400 text-sm leading-none">★</span>
          <span>{coins}</span>
        </div>

        {/* Center: Live Running Score in Arcade Pixel Type */}
        {gameState === 'PLAYING' && (
          <div className="absolute left-1/2 -translate-x-1/2 top-4">
            <span
              className="text-4xl sm:text-5xl font-black text-white font-mono tracking-wider drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] select-none"
              style={{
                textShadow: '0 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000',
              }}
            >
              {score}
            </span>
          </div>
        )}

        {/* Right: Controls & Pause */}
        {gameState === 'PLAYING' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              sound.playClick();
              onTogglePause();
            }}
            className="pointer-events-auto p-2 bg-slate-900/80 backdrop-blur rounded-full border border-slate-700/80 text-white hover:bg-slate-800 transition-colors shadow cursor-pointer"
            title="Pause Flight (P)"
          >
            <Pause className="w-4 h-4" />
          </button>
        )}

        {gameState === 'PAUSED' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              sound.playClick();
              onTogglePause();
            }}
            className="pointer-events-auto p-2 bg-emerald-600 rounded-full border border-emerald-400 text-white hover:bg-emerald-500 transition-colors shadow cursor-pointer"
            title="Resume Flight"
          >
            <Play className="w-4 h-4 fill-current" />
          </button>
        )}
      </div>

      {/* Start State Overlay Content */}
      {gameState === 'START' && (
        <div className="flex-1 flex flex-col items-center justify-between py-6">
          {/* Title Banner */}
          <div className="text-center mt-6">
            <h1
              className="text-3xl sm:text-4xl font-black tracking-wider text-amber-400 uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)]"
              style={{
                textShadow: '0 3px 0 #78350F, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000',
              }}
            >
              FLAPPY BIRD
            </h1>
            <p className="text-xs font-semibold text-slate-200 mt-1 uppercase tracking-widest drop-shadow">
              Arcade Edition
            </p>
          </div>

          {/* Controls & Customization Pill Shelf */}
          <div className="pointer-events-auto flex flex-col items-center gap-3 w-full max-w-[280px]">
            {/* Difficulty Selector */}
            <div className="bg-slate-900/85 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/80 w-full flex items-center justify-between shadow-lg">
              {(['chill', 'classic', 'hard'] as const).map((diff) => {
                const isSelected = difficulty === diff;
                return (
                  <button
                    key={diff}
                    onClick={(e) => {
                      e.stopPropagation();
                      sound.playClick();
                      onChangeDifficulty(diff);
                    }}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-sky-500 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {DIFFICULTIES[diff].name}
                  </button>
                );
              })}
            </div>

            {/* Skin Selector Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                sound.playClick();
                onOpenSkins();
              }}
              className="w-full py-2 px-3 bg-slate-900/85 backdrop-blur-md hover:bg-slate-800/90 text-white rounded-xl border border-slate-700/80 transition-colors flex items-center justify-between text-xs shadow-lg cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Shirt className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-slate-300">Skin:</span>
                <span className="font-bold text-amber-300">{currentSkin.name}</span>
              </div>
              <span className="text-[10px] text-sky-400 uppercase font-semibold">Change</span>
            </button>

            {/* Launch Call To Action */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartGame();
              }}
              className="w-full py-3 px-4 bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-slate-950 font-black rounded-xl shadow-xl transition-all text-sm tracking-wide uppercase flex items-center justify-center gap-2 cursor-pointer mt-1"
            >
              <span>Tap or Space to Fly</span>
            </button>
          </div>
        </div>
      )}

      {/* Subtle bottom touch helper on mobile */}
      {gameState === 'PLAYING' && (
        <div className="w-full flex justify-center pb-2 opacity-60">
          <span className="text-[11px] text-white/90 bg-black/40 backdrop-blur px-3 py-1 rounded-full pointer-events-none font-medium">
            Tap screen or Press Space to Flap
          </span>
        </div>
      )}
    </div>
  );
};
