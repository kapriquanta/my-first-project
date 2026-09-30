import React from 'react';
import { BirdSkinId, SKINS, BirdSkin } from '../types/game';
import { sound } from '../utils/audio';
import { Sparkles, Check, Lock, X } from 'lucide-react';

interface SkinModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSkin: BirdSkinId;
  onSelectSkin: (id: BirdSkinId) => void;
  coins: number;
  unlockedSkins: BirdSkinId[];
  onUnlockSkin: (skin: BirdSkin) => void;
  onUnlockAll: () => void;
}

export const SkinModal: React.FC<SkinModalProps> = ({
  isOpen,
  onClose,
  selectedSkin,
  onSelectSkin,
  coins,
  unlockedSkins,
  onUnlockSkin,
  onUnlockAll,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Aviary Wardrobe
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Customize your flier with unlockable feathers and effects</p>
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

        {/* Currency & Quick Unlock */}
        <div className="flex items-center justify-between py-3 px-4 my-4 bg-slate-800/60 rounded-xl border border-slate-700/50">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold text-lg">★</span>
            <div className="text-xs">
              <span className="text-slate-400">Bank Balance: </span>
              <span className="font-bold text-amber-300 font-mono text-sm">{coins} Coins</span>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playScore();
              onUnlockAll();
            }}
            className="text-xs text-sky-400 hover:text-sky-300 underline font-medium cursor-pointer"
          >
            Unlock All Skins
          </button>
        </div>

        {/* Skins Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto pr-1 py-1 flex-1">
          {Object.values(SKINS).map((skin) => {
            const isUnlocked = unlockedSkins.includes(skin.id);
            const isSelected = selectedSkin === skin.id;
            const canAfford = coins >= skin.cost;

            return (
              <div
                key={skin.id}
                onClick={() => {
                  if (isUnlocked) {
                    sound.playClick();
                    onSelectSkin(skin.id);
                  }
                }}
                className={`relative p-3.5 rounded-xl border transition-all text-left flex flex-col justify-between ${
                  isSelected
                    ? 'bg-sky-950/40 border-sky-400 ring-2 ring-sky-400/30'
                    : isUnlocked
                    ? 'bg-slate-800/40 border-slate-700/70 hover:border-slate-600 hover:bg-slate-800/80 cursor-pointer'
                    : 'bg-slate-900/60 border-slate-800 opacity-80'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Miniature Bird Preview */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border relative overflow-hidden"
                    style={{
                      backgroundColor: skin.secondaryColor,
                      borderColor: skin.primaryColor,
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-full relative"
                      style={{
                        backgroundColor: skin.primaryColor,
                        boxShadow: skin.accentGlow ? `0 0 10px ${skin.accentGlow}` : 'none',
                      }}
                    >
                      {/* Miniature Eye */}
                      <div
                        className="w-2 h-2 rounded-full bg-white absolute top-1 right-1"
                        style={{ border: '0.5px solid #000' }}
                      >
                        <div
                          className="w-1 h-1 rounded-full absolute top-0.5 right-0.5"
                          style={{ backgroundColor: skin.eyeColor }}
                        />
                      </div>
                      {/* Miniature Beak */}
                      <div
                        className="w-2.5 h-2 absolute top-2 -right-1.5 rounded-r-sm"
                        style={{ backgroundColor: skin.beakColor }}
                      />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm text-white truncate">{skin.name}</h3>
                      {isSelected && <span className="text-xs text-sky-400 font-bold">ACTIVE</span>}
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{skin.description}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                  {isUnlocked ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        sound.playClick();
                        onSelectSkin(skin.id);
                      }}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors w-full flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'bg-sky-500 text-white font-bold'
                          : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Equipped
                        </>
                      ) : (
                        'Equip'
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (canAfford) {
                          sound.playScore();
                          onUnlockSkin(skin);
                        } else {
                          sound.playHit();
                        }
                      }}
                      disabled={!canAfford}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors w-full flex items-center justify-center gap-1.5 ${
                        canAfford
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Unlock for {skin.cost} ★
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 mt-2 flex justify-end">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-5 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
