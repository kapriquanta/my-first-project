export type GameState = 'START' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export type Difficulty = 'chill' | 'classic' | 'hard';
export type TimeOfDay = 'auto' | 'day' | 'sunset' | 'night';

export type BirdSkinId = 'classic' | 'cyber' | 'phoenix' | 'raven' | 'pipit' | 'robo';

export interface BirdSkin {
  id: BirdSkinId;
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  bellyColor: string;
  eyeColor: string;
  beakColor: string;
  particleColor: string;
  cost: number; // in collected coins
  accentGlow?: string;
  hasVisor?: boolean;
  hasCrest?: boolean;
  hasPropeller?: boolean;
}

export const SKINS: Record<BirdSkinId, BirdSkin> = {
  classic: {
    id: 'classic',
    name: 'Classic Gold',
    description: 'The legendary golden pioneer of the skies.',
    primaryColor: '#FACC15',
    secondaryColor: '#CA8A04',
    bellyColor: '#FEF08A',
    eyeColor: '#1E293B',
    beakColor: '#EA580C',
    particleColor: '#FDE047',
    cost: 0,
  },
  cyber: {
    id: 'cyber',
    name: 'Cyber Neon',
    description: 'Synthwave aeronavigator with a neon visor.',
    primaryColor: '#06B6D4',
    secondaryColor: '#0891B2',
    bellyColor: '#67E8F9',
    eyeColor: '#EC4899',
    beakColor: '#F43F5E',
    particleColor: '#22D3EE',
    cost: 15,
    accentGlow: '#06B6D4',
    hasVisor: true,
  },
  phoenix: {
    id: 'phoenix',
    name: 'Phoenix Blaze',
    description: 'Reborn from embers, leaving fiery spark trails.',
    primaryColor: '#EF4444',
    secondaryColor: '#B91C1C',
    bellyColor: '#FDE047',
    eyeColor: '#78350F',
    beakColor: '#F59E0B',
    particleColor: '#FB923C',
    cost: 30,
    accentGlow: '#F97316',
    hasCrest: true,
  },
  raven: {
    id: 'raven',
    name: 'Midnight Raven',
    description: 'Sleek shadow flier draped in royal violet plumage.',
    primaryColor: '#581C87',
    secondaryColor: '#3B0764',
    bellyColor: '#7E22CE',
    eyeColor: '#A855F7',
    beakColor: '#94A3B8',
    particleColor: '#C084FC',
    cost: 45,
    accentGlow: '#9333EA',
  },
  pipit: {
    id: 'pipit',
    name: 'Pipit Bluebird',
    description: 'Soft pastel feathering and endless sky joy.',
    primaryColor: '#38BDF8',
    secondaryColor: '#0284C7',
    bellyColor: '#E0F2FE',
    eyeColor: '#0F172A',
    beakColor: '#F97316',
    particleColor: '#7DD3FC',
    cost: 60,
  },
  robo: {
    id: 'robo',
    name: 'Steampunk Cog',
    description: 'Brass plated with an active brass micro-propeller.',
    primaryColor: '#D97706',
    secondaryColor: '#92400E',
    bellyColor: '#FDE68A',
    eyeColor: '#06B6D4',
    beakColor: '#451A03',
    particleColor: '#FCD34D',
    cost: 80,
    hasPropeller: true,
  },
};

export interface DifficultyConfig {
  name: string;
  speed: number;
  gap: number;
  spawnFrames: number;
  gravity: number;
  jumpForce: number;
  description: string;
}

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  chill: {
    name: 'Chill',
    speed: 1.7,
    gap: 150,
    spawnFrames: 115,
    gravity: 0.32,
    jumpForce: -6.0,
    description: 'Wider pipe gaps & relaxed glide speed.',
  },
  classic: {
    name: 'Classic',
    speed: 2.2,
    gap: 126,
    spawnFrames: 92,
    gravity: 0.36,
    jumpForce: -6.6,
    description: 'Original arcade balance and tight timing.',
  },
  hard: {
    name: 'Hardcore',
    speed: 2.8,
    gap: 108,
    spawnFrames: 76,
    gravity: 0.40,
    jumpForce: -7.0,
    description: 'Fast winds & razor-thin pipe apertures.',
  },
};

export interface Medal {
  id: string;
  name: string;
  minScore: number;
  color: string;
  border: string;
  badge: string;
}

export const MEDALS: Medal[] = [
  { id: 'bronze', name: 'Bronze Wing', minScore: 10, color: '#CD7F32', border: '#8C4F1A', badge: '🥉' },
  { id: 'silver', name: 'Silver Wing', minScore: 25, color: '#E2E8F0', border: '#94A3B8', badge: '🥈' },
  { id: 'gold', name: 'Gold Feather', minScore: 50, color: '#FACC15', border: '#CA8A04', badge: '🥇' },
  { id: 'platinum', name: 'Platinum Ace', minScore: 75, color: '#38BDF8', border: '#0284C7', badge: '💎' },
  { id: 'legend', name: 'Sky Legend', minScore: 100, color: '#EC4899', border: '#9D174D', badge: '👑' },
];

export interface PlayerStats {
  highScores: Record<Difficulty, number>;
  coins: number;
  unlockedSkins: BirdSkinId[];
  totalGames: number;
  totalPipes: number;
  totalFlaps: number;
}
