import React from 'react';
import {
  ListMusic,
  Trash2,
  ChevronUp,
  ChevronDown,
  Play,
  Globe,
  HardDrive
} from 'lucide-react';
import { usePlaylistStore } from '../../stores/usePlaylistStore';
import { useDjStore } from '../../stores/useDjStore';
import { PlaylistItem, DeckId } from '../../types';
import { youtubeEngine } from '../../engines/YouTubeEngine';

export const Playlist: React.FC = () => {
  const { items, removeItem, clearPlaylist, moveItem } = usePlaylistStore();
  const { setTrack, setPlaybackState, appMode } = useDjStore();

  const handleLoadDeck = (deckId: DeckId, item: PlaylistItem) => {
    setTrack(deckId, {
      id: item.id,
      title: item.title,
      artist: item.artist,
      duration: 0,
      durationFormatted: item.duration,
      thumbnail: item.thumbnail,
      youtubeId: item.youtubeId,
      isLocal: item.source === 'local'
    });

    if (item.source === 'youtube' && item.youtubeId) {
      setPlaybackState(deckId, 'LOADING');
      youtubeEngine.loadVideo(deckId, item.youtubeId, false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Header with clear button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListMusic className="w-4 h-4 text-[#00B8FF]" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Cola de reproducción ({items.length})
          </span>
        </div>
        {items.length > 0 && (
          <button
            onClick={clearPlaylist}
            className="text-[11px] text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Vaciar cola
          </button>
        )}
      </div>

      {/* Playlist items */}
      {items.length === 0 ? (
        <div className="text-center py-8 text-slate-500 bg-[#0B101A] rounded-xl border border-[#2A384F]/50">
          <ListMusic className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-xs font-semibold">Tu lista de reproducción está vacía.</p>
          <p className="text-[11px] text-slate-600 mt-1">
            {appMode === 'youtube'
              ? 'Busca canciones arriba y haz clic en "+" para agregarlas.'
              : 'Carga archivos de audio locales en los platos.'}
          </p>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 p-2 rounded-xl bg-[#151D2B] border border-[#2A384F]/60 hover:border-slate-500 transition-all group"
            >
              {/* Left: Thumbnail & Info */}
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-[10px] font-mono text-slate-500 w-4 text-center">
                  {index + 1}
                </span>

                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-10 h-7 rounded object-cover shrink-0 bg-black/40"
                  />
                ) : (
                  <div className="w-10 h-7 rounded bg-[#1C2638] flex items-center justify-center shrink-0">
                    {item.source === 'youtube' ? (
                      <Globe className="w-4 h-4 text-[#00B8FF]" />
                    ) : (
                      <HardDrive className="w-4 h-4 text-[#00B8FF]" />
                    )}
                  </div>
                )}

                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate max-w-xs md:max-w-md">
                    {item.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 truncate">
                    {item.artist} {item.duration ? `• ${item.duration}` : ''}
                  </p>
                </div>
              </div>

              {/* Right: Load buttons & Reorder / Delete */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Load to A */}
                <button
                  onClick={() => handleLoadDeck('A', item)}
                  className="px-2 py-1 rounded bg-[#00B8FF]/15 hover:bg-[#00B8FF] text-[#00B8FF] hover:text-black font-semibold text-[10px] transition-all flex items-center gap-1 border border-[#00B8FF]/30"
                  title="Cargar en Deck A"
                >
                  <Play className="w-2.5 h-2.5 fill-current" />
                  Deck A
                </button>

                {/* Load to B */}
                <button
                  onClick={() => handleLoadDeck('B', item)}
                  className="px-2 py-1 rounded bg-[#FF3D91]/15 hover:bg-[#FF3D91] text-[#FF3D91] hover:text-black font-semibold text-[10px] transition-all flex items-center gap-1 border border-[#FF3D91]/30"
                  title="Cargar en Deck B"
                >
                  <Play className="w-2.5 h-2.5 fill-current" />
                  Deck B
                </button>

                {/* Move Up */}
                <button
                  onClick={() => moveItem(index, index - 1)}
                  disabled={index === 0}
                  className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                  title="Subir en la lista"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>

                {/* Move Down */}
                <button
                  onClick={() => moveItem(index, index + 1)}
                  disabled={index === items.length - 1}
                  className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                  title="Bajar en la lista"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {/* Remove */}
                <button
                  onClick={() => removeItem(item.id)}
                  className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                  title="Eliminar de la cola"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
