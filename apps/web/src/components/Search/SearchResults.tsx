import React from 'react';
import { Play, Plus, Clock, AlertCircle, Info, Disc } from 'lucide-react';
import { SearchResultItem, DeckId } from '../../types';
import { useDjStore } from '../../stores/useDjStore';
import { usePlaylistStore } from '../../stores/usePlaylistStore';
import { youtubeEngine } from '../../engines/YouTubeEngine';

interface SearchResultsProps {
  results: SearchResultItem[];
  warning?: string;
  source?: 'youtube-api' | 'demo-catalog';
  isLoading: boolean;
  onLoadMore?: () => void;
  hasNextPage?: boolean;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  warning,
  source,
  isLoading,
  onLoadMore,
  hasNextPage
}) => {
  const { setTrack, setPlaybackState } = useDjStore();
  const { addItem } = usePlaylistStore();

  const handleLoadDeck = (deckId: DeckId, item: SearchResultItem) => {
    setTrack(deckId, {
      id: item.id,
      title: item.title,
      artist: item.channelTitle,
      duration: 0,
      durationFormatted: item.duration,
      thumbnail: item.thumbnail,
      youtubeId: item.id,
      isLocal: false
    });

    setPlaybackState(deckId, 'LOADING');
    youtubeEngine.loadVideo(deckId, item.id, false);
  };

  const handleAddToQueue = (item: SearchResultItem) => {
    addItem({
      title: item.title,
      artist: item.channelTitle,
      duration: item.duration,
      thumbnail: item.thumbnail,
      source: 'youtube',
      youtubeId: item.id
    });
  };

  if (results.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <Disc className="w-10 h-10 mb-2 opacity-50 text-[#FF6B00] animate-spin-slow" />
        <p className="text-sm font-bold text-white">Escribe el nombre de cualquier canción o artista arriba.</p>
        <p className="text-xs text-slate-400 mt-1">Busca artistas como Avicii, Marshmello, Alan Walker, David Guetta o Reggaeton.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Alert banner if present */}
      {warning && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{warning}</span>
        </div>
      )}

      {source === 'demo-catalog' && !warning && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FF6B00]/10 border border-[#FF6B00]/30 text-amber-200 text-xs">
          <Info className="w-4 h-4 shrink-0 text-[#FF6B00]" />
          <span>Canciones populares verificadas listas para mezclar. Puedes buscar cualquier título arriba.</span>
        </div>
      )}

      {/* YouDJ Style Song Grid / Rows */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
        {results.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[#121722] border border-[#242f42] hover:border-slate-500 transition-all group shadow-md"
          >
            {/* Left: Thumbnail & Info */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-20 h-14 shrink-0 rounded-lg overflow-hidden bg-black/60 shadow">
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                {item.duration && (
                  <span className="absolute bottom-1 right-1 bg-black/85 text-[9px] px-1 py-0.5 rounded font-mono text-white flex items-center gap-0.5 font-bold">
                    <Clock className="w-2.5 h-2.5" />
                    {item.duration}
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <h4
                  className="text-xs font-bold text-white truncate group-hover:text-[#FF6B00] transition-colors"
                  title={item.title}
                >
                  {item.title}
                </h4>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {item.channelTitle}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#1c2536] text-amber-400 font-mono">
                    128 BPM
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Big YouDJ Action Buttons: [CARGAR A] [CARGAR B] [+] */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Load A (YouDJ Orange) */}
              <button
                onClick={() => handleLoadDeck('A', item)}
                className="px-3 py-1.5 rounded-lg bg-[#FF6B00]/20 hover:bg-[#FF6B00] text-[#FF6B00] hover:text-black font-black text-xs transition-all flex items-center gap-1 border border-[#FF6B00]/40 shadow-sm active:scale-95"
                title="Cargar en Plato Izquierdo A"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>DECK A</span>
              </button>

              {/* Load B (YouDJ Pink) */}
              <button
                onClick={() => handleLoadDeck('B', item)}
                className="px-3 py-1.5 rounded-lg bg-[#FF0055]/20 hover:bg-[#FF0055] text-[#FF0055] hover:text-white font-black text-xs transition-all flex items-center gap-1 border border-[#FF0055]/40 shadow-sm active:scale-95"
                title="Cargar en Plato Derecho B"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>DECK B</span>
              </button>

              {/* Add to Queue */}
              <button
                onClick={() => handleAddToQueue(item)}
                className="p-1.5 rounded-lg bg-[#1a2333] hover:bg-[#253248] text-slate-400 hover:text-white transition-colors"
                title="Añadir a la cola"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {hasNextPage && (
        <div className="text-center pt-2">
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className="px-5 py-2 rounded-xl bg-[#121722] hover:bg-[#1a2333] border border-[#242f42] text-xs font-bold text-slate-300 hover:text-white transition-all shadow-md disabled:opacity-50"
          >
            {isLoading ? 'Cargando más canciones...' : 'Cargar más canciones online'}
          </button>
        </div>
      )}
    </div>
  );
};
