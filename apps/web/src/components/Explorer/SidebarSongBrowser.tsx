import React, { useState } from 'react';
import {
  Search,
  Plus,
  Play,
  Trash2,
  Flame,
  Disc,
  X,
  Check,
  ListMusic,
  Headphones
} from 'lucide-react';
import { usePlaylistStore } from '../../stores/usePlaylistStore';
import { useDjStore } from '../../stores/useDjStore';
import { SearchResultItem, PlaylistItem, DeckId } from '../../types';
import { youtubeEngine } from '../../engines/YouTubeEngine';

interface SidebarSongBrowserProps {
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
  { id: 'cat-latin', name: '🌴 Salsa Urbana', query: 'salsa choque cumbia mix' },
  { id: 'cat-trap', name: '🚀 Trap Latino', query: 'trap latino hits' },
  { id: 'cat-retro', name: '📼 Retro 2000s', query: 'classic 2000s club dance' }
];

export const SidebarSongBrowser: React.FC<SidebarSongBrowserProps> = ({
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

  const [activeTab, setActiveTab] = useState<'search' | 'playlists'>('search');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('cat-tiktok');
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [addedToast, setAddedToast] = useState<string | null>(null);

  const activePlaylist = playlists.find((p) => p.id === activePlaylistId) || playlists[0];

  const handleSelectCategory = (cat: typeof CURATED_CATEGORIES[0]) => {
    setSelectedCategoryId(cat.id);
    setActiveTab('search');
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
    setActiveTab('playlists');
  };

  const handleLoadDeck = (deckId: DeckId, item: SearchResultItem | PlaylistItem) => {
    const ytId = (item as any).youtubeId || item.id;
    setTrack(deckId, {
      id: item.id,
      title: item.title,
      artist: (item as any).channelTitle || (item as any).artist,
      duration: 0,
      durationFormatted: item.duration,
      thumbnail: item.thumbnail,
      youtubeId: ytId,
      isLocal: false
    });

    setPlaybackState(deckId, 'LOADING');
    if (ytId) {
      youtubeEngine.loadVideo(deckId, ytId, false);
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

    setAddedToast(`¡Guardada en ${activePlaylist?.name || 'lista'}!`);
    setTimeout(() => setAddedToast(null), 2000);
  };

  return (
    <aside className="w-full h-full flex flex-col bg-[#0b0f19]/95 backdrop-blur-2xl border-r border-white/10 shrink-0 shadow-2xl overflow-hidden select-none z-20">
      {/* 1. Sidebar Brand Header & Search Input */}
      <div className="shrink-0 p-3 border-b border-white/10 bg-[#070a12]/80 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF6B00] to-[#FF0055] p-0.5 flex items-center justify-center shadow-lg">
              <div className="w-full h-full bg-[#090d14] rounded-[10px] flex items-center justify-center">
                <Headphones className="w-4 h-4 text-white" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-black text-lg tracking-tight text-white">Dj</span>
                <span className="font-black text-lg tracking-tight bg-gradient-to-r from-[#FF6B00] to-[#FF0055] bg-clip-text text-transparent">Az</span>
              </div>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block -mt-1 font-semibold">
                Explorador Musical
              </span>
            </div>
          </div>

          {/* Toast Notification */}
          {addedToast && (
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-lg animate-pulse">
              <Check className="w-3 h-3" />
              <span>{addedToast}</span>
            </div>
          )}
        </div>

        {/* Search Bar with BUSCAR Button */}
        <div className="relative flex items-center gap-1.5">
          <div className="relative flex-1 flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
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
              placeholder="Buscar canción, artista o título..."
              className="w-full bg-[#131924] border border-[#242f42] rounded-xl pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00B8FF] focus:ring-1 focus:ring-[#00B8FF] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  onSearch('DJ mix hits');
                }}
                className="absolute right-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => onSearch(searchQuery)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#FF0055] text-white text-[11px] font-black uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow shrink-0"
          >
            BUSCAR
          </button>
        </div>

        {/* View Switcher: Búsqueda vs Mis Listas */}
        <div className="flex items-center bg-[#131924] p-1 rounded-xl border border-[#242f42]">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'search'
                ? 'bg-[#FF6B00] text-black font-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Búsqueda & Géneros</span>
          </button>
          <button
            onClick={() => setActiveTab('playlists')}
            className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'playlists'
                ? 'bg-gradient-to-r from-[#FF6B00] to-[#FF0055] text-white font-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            <span>Mis Listas ({playlists.length})</span>
          </button>
        </div>
      </div>

      {/* 2. Categories / Playlists Quick Pills Bar */}
      <div className="shrink-0 p-2 bg-[#080b13] border-b border-white/5 overflow-x-auto flex items-center gap-1.5">
        {activeTab === 'search' ? (
          CURATED_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleSelectCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                selectedCategoryId === cat.id
                  ? 'bg-[#FF6B00]/25 text-[#FF6B00] border border-[#FF6B00]/50'
                  : 'bg-[#131924] text-slate-400 hover:text-white border border-[#242f42]'
              }`}
            >
              {cat.name}
            </button>
          ))
        ) : (
          <div className="flex items-center gap-1.5 w-full justify-between">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {playlists.map((pl) => (
                <button
                  key={pl.id}
                  onClick={() => setActivePlaylist(pl.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                    pl.id === activePlaylistId
                      ? 'bg-gradient-to-r from-[#FF6B00] to-[#FF0055] text-white'
                      : 'bg-[#131924] text-slate-400 hover:text-white border border-[#242f42]'
                  }`}
                >
                  {pl.name} ({pl.items.length})
                </button>
              ))}
            </div>
            {!isCreatingPlaylist && (
              <button
                onClick={() => setIsCreatingPlaylist(true)}
                className="p-1 rounded-lg bg-[#00B8FF]/20 text-[#00B8FF] hover:bg-[#00B8FF] hover:text-black shrink-0"
                title="Crear nueva lista"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Inline Create Playlist Form */}
      {isCreatingPlaylist && activeTab === 'playlists' && (
        <form onSubmit={handleCreatePlaylistSubmit} className="shrink-0 p-2 bg-[#131924] border-b border-[#00B8FF]/40 flex items-center gap-1.5">
          <input
            type="text"
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            placeholder="Nombre de la nueva lista..."
            autoFocus
            className="flex-1 bg-[#090d14] border border-[#242f42] rounded px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00B8FF]"
          />
          <button type="submit" className="px-2.5 py-1 bg-[#00B8FF] text-black font-bold text-xs rounded">
            Guardar
          </button>
          <button type="button" onClick={() => setIsCreatingPlaylist(false)} className="p-1 text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </form>
      )}

      {/* 3. Full-Height Scrollable Songs List (Massive Vertical Space) */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1.5">
        {activeTab === 'search' ? (
          isSearching ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Disc className="w-8 h-8 text-[#FF6B00] animate-spin mb-2" />
              <span className="text-xs font-bold">Buscando canciones online...</span>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Disc className="w-8 h-8 text-[#FF6B00] opacity-40 mb-2" />
              <span className="text-xs font-bold text-white">Escribe una canción arriba.</span>
            </div>
          ) : (
            <>
              {searchResults.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#131924]/85 border border-[#242f42]/70 hover:border-slate-500 hover:bg-[#1a2333] transition-all group"
                >
                  {/* Thumbnail & Title */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="relative w-12 h-9 shrink-0 rounded-lg overflow-hidden bg-black/60 shadow">
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate" title={item.title}>
                        {item.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate">
                        {item.channelTitle} {item.duration ? `• ${item.duration}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleLoadDeck('A', item)}
                      className="px-2 py-1 rounded bg-[#FF6B00]/20 hover:bg-[#FF6B00] text-[#FF6B00] hover:text-black font-extrabold text-[10px] transition-all flex items-center gap-0.5 border border-[#FF6B00]/40"
                      title="Cargar en Plato A"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      A
                    </button>
                    <button
                      onClick={() => handleLoadDeck('B', item)}
                      className="px-2 py-1 rounded bg-[#FF0055]/20 hover:bg-[#FF0055] text-[#FF0055] hover:text-white font-extrabold text-[10px] transition-all flex items-center gap-0.5 border border-[#FF0055]/40"
                      title="Cargar en Plato B"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      B
                    </button>
                    <button
                      onClick={() => handleSaveToActivePlaylist(item)}
                      className="p-1 rounded bg-[#1f2a3c] hover:bg-[#00B8FF]/20 text-slate-400 hover:text-[#00B8FF]"
                      title="Guardar en lista"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}

              {hasNextPage && (
                <div className="text-center pt-2 pb-3">
                  <button
                    onClick={onLoadMore}
                    disabled={isSearching}
                    className="w-full py-2 rounded-xl bg-[#151c28] hover:bg-[#1f293d] border border-[#242f42] text-xs font-bold text-slate-300 hover:text-white"
                  >
                    {isSearching ? 'Cargando más...' : 'Cargar más canciones'}
                  </button>
                </div>
              )}
            </>
          )
        ) : (
          /* Custom Playlists Tracks */
          <>
            <div className="flex items-center justify-between pb-1.5 border-b border-[#242f42] text-xs px-1">
              <span className="font-bold text-white uppercase tracking-wider truncate">
                {activePlaylist?.name} ({activePlaylistItems.length})
              </span>
              {activePlaylistItems.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm('¿Vaciar esta lista?')) clearPlaylist();
                  }}
                  className="text-[10px] text-slate-400 hover:text-red-400 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Vaciar
                </button>
              )}
            </div>

            {activePlaylistItems.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <ListMusic className="w-8 h-8 text-[#00B8FF] opacity-40 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-300">Esta lista está vacía.</p>
                <p className="text-[10px] text-slate-500 mt-1">Busca canciones y pulsa "+" para agregarlas.</p>
              </div>
            ) : (
              activePlaylistItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#131924]/85 border border-[#242f42]/70 hover:border-slate-500 transition-all group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-mono text-slate-500 w-3">{idx + 1}</span>
                    {item.thumbnail && (
                      <img src={item.thumbnail} alt={item.title} className="w-10 h-7 rounded object-cover shrink-0" />
                    )}
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                      <p className="text-[10px] text-slate-400 truncate">{item.artist}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleLoadDeck('A', item)}
                      className="px-2 py-1 rounded bg-[#FF6B00]/20 hover:bg-[#FF6B00] text-[#FF6B00] hover:text-black font-extrabold text-[10px]"
                      title="Cargar en Plato A"
                    >
                      A
                    </button>
                    <button
                      onClick={() => handleLoadDeck('B', item)}
                      className="px-2 py-1 rounded bg-[#FF0055]/20 hover:bg-[#FF0055] text-[#FF0055] hover:text-white font-extrabold text-[10px]"
                      title="Cargar en Plato B"
                    >
                      B
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1 text-slate-500 hover:text-red-400"
                      title="Eliminar de la lista"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </aside>
  );
};
