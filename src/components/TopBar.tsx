import React from 'react';
import { Volume2, VolumeX, Music, Moon, Sun, Sunset } from 'lucide-react';
import { TimeOfDay } from '../types/game';
import { sound } from '../utils/audio';

interface TopBarProps {
  onOpenSkins: () => void;
  onOpenStats: () => void;
  timeOfDay: TimeOfDay;
  onToggleTimeOfDay: () => void;
  sfxMuted: boolean;
  onToggleSfx: () => void;
  musicMuted: boolean;
  onToggleMusic: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenSkins,
  onOpenStats,
  timeOfDay,
  onToggleTimeOfDay,
  sfxMuted,
  onToggleSfx,
  musicMuted,
  onToggleMusic,
}) => {
  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur w-full max-w-5xl mx-auto">
      {/* Zone 1: Single text element brand wordmark */}
      <div className="flex items-center gap-2">
        <span className="text-base sm:text-lg font-black tracking-tight text-white select-none">
          Flappy Arcade
        </span>
      </div>

      {/* Zone 2: Clean 4-6 text navigation links */}
      <nav className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm font-medium text-slate-300">
        <button
          onClick={() => {
            sound.playClick();
            onOpenSkins();
          }}
          className="hover:text-white transition-colors cursor-pointer whitespace-nowrap"
        >
          Skins
        </button>
        <button
          onClick={() => {
            sound.playClick();
            onOpenStats();
          }}
          className="hover:text-white transition-colors cursor-pointer whitespace-nowrap"
        >
          Records
        </button>
        <button
          onClick={() => {
            sound.playClick();
            onToggleTimeOfDay();
          }}
          className="hover:text-white transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5"
          title={`Cycle atmosphere (Current: ${timeOfDay})`}
        >
          {timeOfDay === 'day' && <Sun className="w-3.5 h-3.5 text-amber-400" />}
          {timeOfDay === 'sunset' && <Sunset className="w-3.5 h-3.5 text-orange-400" />}
          {timeOfDay === 'night' && <Moon className="w-3.5 h-3.5 text-indigo-400" />}
          {timeOfDay === 'auto' && <span className="text-xs text-sky-400 font-semibold">Auto Sky</span>}
          <span className="capitalize">{timeOfDay}</span>
        </button>
      </nav>

      {/* Zone 3: 1-2 primary actions (Audio & Sound controls) */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => {
            sound.playClick();
            onToggleMusic();
          }}
          className={`p-2 rounded-lg transition-colors cursor-pointer ${
            musicMuted ? 'text-slate-500 bg-slate-900' : 'text-emerald-400 bg-slate-800'
          }`}
          title={musicMuted ? 'Unmute 8-Bit Soundtrack' : 'Mute Soundtrack'}
        >
          <Music className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            sound.playClick();
            onToggleSfx();
          }}
          className={`p-2 rounded-lg transition-colors cursor-pointer ${
            sfxMuted ? 'text-slate-500 bg-slate-900' : 'text-sky-400 bg-slate-800'
          }`}
          title={sfxMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
        >
          {sfxMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
