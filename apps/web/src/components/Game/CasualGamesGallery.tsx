import React, { useState } from 'react';
import {
  Flame,
  Disc,
  RotateCw,
  Trophy,
  Sparkles,
  Gamepad2,
  Play,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useGameStore, CASUAL_GAMES, GameId } from '../../stores/useGameStore';

interface CasualGamesGalleryProps {
  onGameSelected?: (gameId: GameId) => void;
}

export const CasualGamesGallery: React.FC<CasualGamesGalleryProps> = ({ onGameSelected }) => {
  const { activeGameId, setActiveGame, highScores } = useGameStore();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'ritmo' | 'reflejos' | 'retro'>('all');
  const [isExpanded, setIsExpanded] = useState(true);

  const filteredGames = CASUAL_GAMES.filter((g) => {
    if (selectedFilter === 'all') return true;
    return g.category === selectedFilter;
  });

  const handleSelectGame = (id: GameId) => {
    setActiveGame(id);
    if (onGameSelected) onGameSelected(id);
  };

  const getIcon = (name: string, color: string) => {
    const className = "w-5 h-5";
    switch (name) {
      case 'Flame':
        return <Flame className={className} style={{ color }} />;
      case 'Disc':
        return <Disc className={className} style={{ color }} />;
      case 'RotateCw':
        return <RotateCw className={className} style={{ color }} />;
      case 'Trophy':
        return <Trophy className={className} style={{ color }} />;
      case 'Sparkles':
      default:
        return <Sparkles className={className} style={{ color }} />;
    }
  };

  return (
    <div className="w-full bg-[#0a0e17]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-2xl transition-all duration-300">
      {/* 1. Header Bar: Title, Category Pills & Expand Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#FF6B00] to-[#FF0055] p-0.5 flex items-center justify-center shadow-lg">
            <Gamepad2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                GALERÍA DE JUEGOS CASUALES
                <span className="text-[10px] font-bold text-red-400 bg-red-950/80 border border-red-500/30 px-1.5 py-0.2 rounded-md animate-pulse">
                  TIKTOK LIVE
                </span>
              </h3>
            </div>
            <p className="text-[10px] text-slate-400">
              Selecciona un juego para jugarlo en la pantalla central mientras suena tu música
            </p>
          </div>
        </div>

        {/* Categories & Filter Tabs */}
        <div className="flex items-center gap-1 bg-[#131924] p-1 rounded-xl border border-[#242f42]">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
              selectedFilter === 'all'
                ? 'bg-gradient-to-r from-[#FF6B00] to-[#FF0055] text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos ({CASUAL_GAMES.length})
          </button>
          <button
            onClick={() => setSelectedFilter('ritmo')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
              selectedFilter === 'ritmo'
                ? 'bg-[#00F0FF] text-black font-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🎵 Ritmo
          </button>
          <button
            onClick={() => setSelectedFilter('reflejos')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
              selectedFilter === 'reflejos'
                ? 'bg-[#B026FF] text-white font-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ⚡ Reflejos
          </button>
          <button
            onClick={() => setSelectedFilter('retro')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
              selectedFilter === 'retro'
                ? 'bg-[#10B981] text-black font-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🕹️ Retro
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-slate-400 hover:text-white ml-1 border-l border-white/10 pl-2"
            title={isExpanded ? 'Contraer galería' : 'Expandir galería'}
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. Organized Game Cards Grid */}
      {isExpanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-3">
          {filteredGames.map((game) => {
            const isActive = activeGameId === game.id;
            const score = highScores[game.id] || 0;

            return (
              <div
                key={game.id}
                onClick={() => handleSelectGame(game.id)}
                className={`group relative rounded-xl p-2.5 flex flex-col justify-between cursor-pointer transition-all duration-200 border ${
                  isActive
                    ? 'bg-[#151c2c] border-[#00F0FF] shadow-[0_0_16px_rgba(0,240,255,0.35)] scale-[1.02]'
                    : 'bg-[#0e131f]/90 border-white/10 hover:border-white/25 hover:bg-[#141b2b]'
                }`}
              >
                {/* Top Badge & Score */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md"
                    style={{
                      backgroundColor: `${game.accentColor}20`,
                      color: game.accentColor,
                      border: `1px solid ${game.accentColor}40`
                    }}
                  >
                    {game.tag}
                  </span>

                  <div className="flex items-center gap-1 text-[10px] text-amber-400 font-bold bg-black/40 px-1.5 py-0.5 rounded-md">
                    <Trophy className="w-2.5 h-2.5" />
                    <span>{score}</span>
                  </div>
                </div>

                {/* Game Icon & Title */}
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-white/10"
                    style={{
                      background: `linear-gradient(135deg, ${game.accentColor}30, #090d14)`
                    }}
                  >
                    {getIcon(game.iconName, game.accentColor)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-white truncate group-hover:text-amber-300 transition-colors">
                      {game.title}
                    </h4>
                    <span className="text-[9px] text-slate-400 block truncate">
                      {game.categoryLabel}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-[10px] text-slate-400 line-clamp-2 mb-2.5 min-h-[28px] leading-snug">
                  {game.description}
                </p>

                {/* Action Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectGame(game.id);
                  }}
                  className={`w-full py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow ${
                    isActive
                      ? 'bg-gradient-to-r from-[#00F0FF] to-[#0072FF] text-black shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                      : 'bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10'
                  }`}
                >
                  {isActive ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-black" />
                      <span>EN CABINA AHORA</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 fill-current" />
                      <span>JUGAR EN EL CENTRO</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
