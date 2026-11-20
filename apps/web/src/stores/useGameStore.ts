import { create } from 'zustand';

export type GameId = 'runner' | 'beat-drop' | 'turntable-spinner' | 'neon-pong' | 'flappy-dj';

export interface GameInfo {
  id: GameId;
  title: string;
  category: 'ritmo' | 'reflejos' | 'retro';
  categoryLabel: string;
  description: string;
  tag: string;
  accentColor: string;
  bannerGradient: string;
  iconName: string;
}

export const CASUAL_GAMES: GameInfo[] = [
  {
    id: 'runner',
    title: 'DjAz Runner',
    category: 'ritmo',
    categoryLabel: 'Ritmo & Beat',
    description: 'Salta sobre ondas y parlantes al compás de la música en vivo. ¡Esquiva y mezcla!',
    tag: '🔥 TOP STREAM',
    accentColor: '#FF6B00',
    bannerGradient: 'from-[#FF6B00] to-[#FF0055]',
    iconName: 'Flame'
  },
  {
    id: 'beat-drop',
    title: 'Beat Drop & Catch',
    category: 'ritmo',
    categoryLabel: 'Ritmo Musical',
    description: 'Mueve la bandeja DJ de izquierda a derecha y atrapa los orbes de neón que caen al ritmo.',
    tag: '⚡ RÍTMICO',
    accentColor: '#00F0FF',
    bannerGradient: 'from-[#00F0FF] to-[#0072FF]',
    iconName: 'Disc'
  },
  {
    id: 'turntable-spinner',
    title: 'Vinyl Spinner 360°',
    category: 'reflejos',
    categoryLabel: 'Reflejos & Acción',
    description: 'Gira el plato vinilo arrastrando o usando flechas para desviar los rayos láseres de la fiesta.',
    tag: '💫 HABILIDAD',
    accentColor: '#B026FF',
    bannerGradient: 'from-[#B026FF] to-[#FF007A]',
    iconName: 'RotateCw'
  },
  {
    id: 'neon-pong',
    title: 'Soundwave Breakout',
    category: 'retro',
    categoryLabel: 'Retro Arcade',
    description: 'Haz rebotar el disco de vinilo y destruye las barras del ecualizador sin dejarlo caer.',
    tag: '🕹️ CLÁSICO',
    accentColor: '#10B981',
    bannerGradient: 'from-[#10B981] to-[#059669]',
    iconName: 'Trophy'
  },
  {
    id: 'flappy-dj',
    title: 'Flappy Headphones',
    category: 'reflejos',
    categoryLabel: 'Reflejos & Acción',
    description: 'Mantén flotando los audífonos DJ esquivando las torres del ecualizador. ¡Súper adictivo!',
    tag: '⭐ ADICTIVO',
    accentColor: '#F59E0B',
    bannerGradient: 'from-[#F59E0B] to-[#D97706]',
    iconName: 'Sparkles'
  }
];

const HIGHSCORES_STORAGE_KEY = 'djaz_game_highscores_v2';

interface GameStoreState {
  activeGameId: GameId;
  highScores: Record<GameId, number>;
  setActiveGame: (id: GameId) => void;
  saveHighScore: (id: GameId, score: number) => void;
}

const loadHighScores = (): Record<GameId, number> => {
  try {
    const raw = localStorage.getItem(HIGHSCORES_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    'runner': 250,
    'beat-drop': 180,
    'turntable-spinner': 120,
    'neon-pong': 340,
    'flappy-dj': 45
  };
};

export const useGameStore = create<GameStoreState>((set) => ({
  activeGameId: 'runner',
  highScores: loadHighScores(),

  setActiveGame: (id: GameId) => {
    set({ activeGameId: id });
  },

  saveHighScore: (id: GameId, score: number) => {
    set((state) => {
      const current = state.highScores[id] || 0;
      if (score > current) {
        const updated = { ...state.highScores, [id]: score };
        try {
          localStorage.setItem(HIGHSCORES_STORAGE_KEY, JSON.stringify(updated));
        } catch {}
        return { highScores: updated };
      }
      return state;
    });
  }
}));
