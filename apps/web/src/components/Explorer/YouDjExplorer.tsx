import React, { useState } from 'react';
import {
  ListMusic,
  Search,
  Plus,
  Play,
  Trash2,
  Flame,
  Disc,
  X,
  Check
} from 'lucide-react';
import { usePlaylistStore } from '../../stores/usePlaylistStore';
import { useDjStore } from '../../stores/useDjStore';
import { SearchResultItem, PlaylistItem, DeckId } from '../../types';
import { youtubeEngine } from '../../engines/YouTubeEngine';

interface YouDjExplorerProps {
  searchResults: SearchResultItem[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onSearch: (q: string) => void;
  isSearching: boolean;
  onLoadMore?: () => void;
  hasNextPage?: boolean;
}

const CURATED_CATEGORIES = [
  { id: 'cat-tiktok', name: '🔥 TikTok Hits', query: 'tiktok viral hits 2026' },
  { id: 'cat-reggaeton', name: '💃 Reggaeton & Perreo', query: 'reggaeton mix 2026' },
  { id: 'cat-electro', name: '⚡ Electrónica / EDM', query: 'electronic dance music edm' },
  { id: 'cat-tech', name: '🎧 Tech House & Techno', query: 'tech house techno mix' },
  { id: 'cat-latin', name: '🌴 Salsa & Cumbia Urbana', query: 'salsa choque cumbia mix' },
  { id: 'cat-trap', name: '🚀 Trap & Urbano', query: 'trap latino hits' },
  { id: 'cat-retro', name: '📼 Retro 2000s & 90s', query: 'classic 2000s club dance' },
  { id: 'cat-rock', name: '🎸 Rock Clásicos', query: 'classic rock anthems' }
];

export const YouDjExplorer: React.FC<YouDjExplorerProps> = ({
  searchResults,
  searchQuery,
  setSearchQuery,
  onSearch,
  isSearching,
  onLoadMore,
  hasNextPage
}) => {
  const {
    playlists,
    activePlaylistId,
    setActivePlaylist,
    createPlaylist,
    items: activePlaylistItems,
    addItem,
    removeItem,
    clearPlaylist
  } = usePlaylistStore();

  const { setTrack, setPlaybackState } = useDjStore();

  const [activeTab, setActiveTab] = useState<'category' | 'playlist'>('category');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('cat-tiktok');
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [addedToast, setAddedToast] = useState<string | null>(null);

  const activePlaylist = playlists.find((p) => p.id === activePlaylistId) || playlists[0];

  const handleSelectCategory = (cat: typeof CURATED_CATEGORIES[0]) => {
    setSelectedCategoryId(cat.id);
    setActiveTab('category');
    setSearchQuery(cat.query);
    onSearch(cat.query);
  };

  const handleCreatePlaylistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    const newId = createPlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    setIsCreatingPlaylist(false);
    setActivePlaylist(newId);
    setActiveTab('playlist');
  };

  const handleLoadDeckFromSearch = (deckId: DeckId, item: SearchResultItem) => {
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

  const handleLoadDeckFromPlaylist = (deckId: DeckId, item: PlaylistItem) => {
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

  const handleSaveToActivePlaylist = (item: SearchResultItem) => {
    addItem({
      title: item.title,
      artist: item.channelTitle,
      duration: item.duration,
      thumbnail: item.thumbnail,
      source: 'youtube',
      youtubeId: item.id
    });

    setAddedToast(`¡Añadida a ${activePlaylist?.name || 'la lista'}!`);
    setTimeout(() => setAddedToast(null), 2500);
  };

  return (
    <div className="flex-1 min-h-0 bg-[#0c1017]/85 backdrop-blur-xl rounded-2xl border border-white/10 flex flex-col shadow-2xl overflow-hidden select-none">
      {/* 1. Top Search & Controls Bar */}
      <div className="shrink-0 p-2 sm:p-2.5 border-b border-white/10 flex items-center justify-between gap-3 bg-[#090d14]/70">
        {/* Search Input (YouDJ style) */}
        <div className="flex-1 max-w-xl relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onSearch(searchQuery);
              }
            }}
            placeholder="Buscar música en línea (canción, artista, mix)..."
            className="w-full bg-[#131924] border border-[#242f42] rounded-xl pl-9 pr-8 py-1.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00B8FF] focus:ring-1 focus:ring-[#00B8FF] transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                onSearch('DJ mix hits');
              }}
              className="absolute right-3 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* View Switcher Pills */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setActiveTab('category')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              activeTab === 'category'
                ? 'bg-[#FF6B00] text-black shadow-md'
                : 'bg-[#151c28] text-slate-400 hover:text-white border border-[#242f42]'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Géneros & Búsqueda</span>
          </button>
          <button
            onClick={() => setActiveTab('playlist')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              activeTab === 'playlist'
                ? 'bg-gradient-to-r from-[#FF6B00] to-[#FF0055] text-white shadow-md'
                : 'bg-[#151c28] text-slate-400 hover:text-white border border-[#242f42]'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            <span>Mis Listas</span>
            <span className="text-[10px] bg-black/40 px-1.5 py-0.2 rounded-full font-mono">
              {playlists.length}
            </span>
          </button>
        </div>

        {/* Toast confirmation */}
        {addedToast && (
          <div className="hidden md:flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-1 rounded-lg animate-pulse">
            <Check className="w-3.5 h-3.5" />
            <span>{addedToast}</span>
          </div>
        )}
      </div>

      {/* 2. Main Two-Column Explorer Body */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
        {/* Left Column: Categories / Playlists Sidebar (YouDJ style) */}
        <div className="w-full md:w-56 lg:w-64 border-b md:border-b-0 md:border-r border-white/10 bg-[#0a0d14]/80 p-2 flex flex-col gap-1.5 overflow-y-auto shrink-0">
          {activeTab === 'category' ? (
            <>
              <div className="px-2 py-1 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                GÉNEROS / CATEGORÍAS
              </div>
              <div className="space-y-0.5">
                {CURATED_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleSelectCategory(cat)}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between ${
                      selectedCategoryId === cat.id
                        ? 'bg-[#FF6B00]/25 text-[#FF6B00] border border-[#FF6B00]/40 shadow-sm'
                        : 'text-slate-300 hover:bg-[#151c28] hover:text-white'
                    }`}
                  >
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between px-2 py-1 border-b border-[#242f42] pb-1.5">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  MIS LISTAS ({playlists.length})
                </span>
                {!isCreatingPlaylist && (
                  <button
                    onClick={() => setIsCreatingPlaylist(true)}
                    className="p-1 rounded bg-[#00B8FF]/20 text-[#00B8FF] hover:bg-[#00B8FF] hover:text-black transition-colors"
                    title="Crear nueva lista de reproducción"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Inline Create Playlist input */}
              {isCreatingPlaylist && (
                <form onSubmit={handleCreatePlaylistSubmit} className="p-1.5 bg-[#151c28] rounded-lg border border-[#00B8FF]/50 flex flex-col gap-1.5">
                  <input
                    type="text"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    placeholder="Nombre de la lista..."
                    autoFocus
                    className="w-full bg-[#0a0d14] border border-[#242f42] rounded px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00B8FF]"
                  />
                  <div className="flex justify-end gap-1">
                    <button
                      type="submit"
                      className="px-2 py-0.5 bg-[#00B8FF] text-black font-bold text-[10px] rounded"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreatingPlaylist(false)}
                      className="px-1.5 py-0.5 text-slate-400 hover:text-white text-[10px]"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}

              {/* Playlist items list */}
              <div className="space-y-0.5 pt-1">
                {playlists.map((pl) => (
                  <button
                    key={pl.id}
                    onClick={() => setActivePlaylist(pl.id)}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between ${
                      pl.id === activePlaylistId
                        ? 'bg-gradient-to-r from-[#FF6B00]/30 to-[#FF0055]/30 text-white border border-[#FF6B00]/50 shadow-sm'
                        : 'text-slate-300 hover:bg-[#151c28] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <ListMusic className="w-3.5 h-3.5 shrink-0 text-[#00B8FF]" />
                      <span className="truncate">{pl.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      {pl.items.length}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right Column: Song Results / Playlist Table with Smooth Scroll */}
        <div className="flex-1 min-h-0 flex flex-col p-2.5 overflow-hidden">
          {activeTab === 'category' ? (
            /* Search Results / Category Songs */
            <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-1.5">
              {isSearching ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <Disc className="w-8 h-8 text-[#FF6B00] animate-spin mb-2" />
                  <span className="text-xs font-bold">Buscando canciones online...</span>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                  <Disc className="w-8 h-8 text-[#FF6B00] opacity-40 mb-2" />
                  <span className="text-xs font-bold text-white">Escribe cualquier canción en el buscador arriba.</span>
                  <span className="text-[11px] text-slate-400 mt-1">O selecciona una categoría a la izquierda.</span>
                </div>
              ) : (
                <>
                  {searchResults.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 p-2 rounded-xl bg-[#131924]/80 border border-[#242f42]/70 hover:border-slate-500 hover:bg-[#1a2333]/90 transition-all group"
                    >
                      {/* Left: Thumbnail & Title */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative w-14 h-10 shrink-0 rounded-lg overflow-hidden bg-black/60 shadow">
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate max-w-sm lg:max-w-md" title={item.title}>
                            {item.title}
                          </h4>
                          <p className="text-[10px] text-slate-400 truncate">
                            {item.channelTitle} {item.duration ? `• ${item.duration}` : ''}
                          </p>
                        </div>
                      </div>

                      {/* Right: Load Buttons & Add to Playlist */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Load in Deck A */}
                        <button
                          onClick={() => handleLoadDeckFromSearch('A', item)}
                          className="px-2.5 py-1 rounded-lg bg-[#FF6B00]/20 hover:bg-[#FF6B00] text-[#FF6B00] hover:text-black font-extrabold text-[10px] transition-all flex items-center gap-1 border border-[#FF6B00]/40 shadow-sm"
                          title="Cargar en Plato A"
                        >
                          <Play className="w-2.5 h-2.5 fill-current" />
                          DECK A
                        </button>

                        {/* Load in Deck B */}
                        <button
                          onClick={() => handleLoadDeckFromSearch('B', item)}
                          className="px-2.5 py-1 rounded-lg bg-[#FF0055]/20 hover:bg-[#FF0055] text-[#FF0055] hover:text-white font-extrabold text-[10px] transition-all flex items-center gap-1 border border-[#FF0055]/40 shadow-sm"
                          title="Cargar en Plato B"
                        >
                          <Play className="w-2.5 h-2.5 fill-current" />
                          DECK B
                        </button>

                        {/* Add to Active Playlist */}
                        <button
                          onClick={() => handleSaveToActivePlaylist(item)}
                          className="p-1.5 rounded-lg bg-[#1f2a3c] hover:bg-[#00B8FF]/20 text-slate-400 hover:text-[#00B8FF] transition-colors"
                          title="Guardar en tu lista de reproducción"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Load More Button */}
                  {hasNextPage && (
                    <div className="text-center pt-2 pb-4">
                      <button
                        onClick={onLoadMore}
                        disabled={isSearching}
                        className="px-5 py-2 rounded-xl bg-[#151c28] hover:bg-[#1f293d] border border-[#242f42] text-xs font-bold text-slate-300 hover:text-white transition-all shadow"
                      >
                        {isSearching ? 'Cargando más...' : 'Cargar más canciones online'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            /* Custom Playlist Track Table */
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between pb-2 border-b border-[#242f42] mb-1.5 shrink-0 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white uppercase tracking-wider">
                    {activePlaylist?.name}
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    ({activePlaylistItems.length} pistas)
                  </span>
                </div>
                {activePlaylistItems.length > 0 && (
                  <button
                    onClick={() => {
                      if (window.confirm('¿Vaciar todas las canciones de esta lista?')) {
                        clearPlaylist();
                      }
                    }}
                    className="text-[11px] text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Vaciar lista
                  </button>
                )}
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-1.5">
                {activePlaylistItems.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <ListMusic className="w-8 h-8 text-[#00B8FF] opacity-40 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-300">Esta lista está vacía.</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Haz clic en "Géneros & Búsqueda" y pulsa "+" en cualquier canción para guardarla aquí.
                    </p>
                  </div>
                ) : (
                  activePlaylistItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 p-2 rounded-xl bg-[#131924]/80 border border-[#242f42]/70 hover:border-slate-500 transition-all group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[10px] font-mono text-slate-500 w-4 text-center">
                          {idx + 1}
                        </span>
                        {item.thumbnail && (
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            className="w-12 h-8 rounded object-cover shrink-0 bg-black/40"
                          />
                        )}
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate max-w-sm lg:max-w-md">
                            {item.title}
                          </h4>
                          <p className="text-[10px] text-slate-400 truncate">
                            {item.artist} {item.duration ? `• ${item.duration}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleLoadDeckFromPlaylist('A', item)}
                          className="px-2.5 py-1 rounded-lg bg-[#FF6B00]/20 hover:bg-[#FF6B00] text-[#FF6B00] hover:text-black font-extrabold text-[10px] transition-all flex items-center gap-1 border border-[#FF6B00]/40 shadow-sm"
                          title="Cargar en Plato A"
                        >
                          <Play className="w-2.5 h-2.5 fill-current" />
                          DECK A
                        </button>
                        <button
                          onClick={() => handleLoadDeckFromPlaylist('B', item)}
                          className="px-2.5 py-1 rounded-lg bg-[#FF0055]/20 hover:bg-[#FF0055] text-[#FF0055] hover:text-white font-extrabold text-[10px] transition-all flex items-center gap-1 border border-[#FF0055]/40 shadow-sm"
                          title="Cargar en Plato B"
                        >
                          <Play className="w-2.5 h-2.5 fill-current" />
                          DECK B
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                          title="Eliminar de esta lista"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
