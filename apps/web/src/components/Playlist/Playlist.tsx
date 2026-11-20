import React, { useState } from 'react';
import {
  ListMusic,
  Trash2,
  ChevronUp,
  ChevronDown,
  Play,
  Globe,
  HardDrive,
  Plus,
  FolderPlus,
  Edit2,
  Check,
  X
} from 'lucide-react';
import { usePlaylistStore } from '../../stores/usePlaylistStore';
import { useDjStore } from '../../stores/useDjStore';
import { PlaylistItem, DeckId } from '../../types';
import { youtubeEngine } from '../../engines/YouTubeEngine';

export const Playlist: React.FC = () => {
  const {
    playlists,
    activePlaylistId,
    setActivePlaylist,
    createPlaylist,
    deletePlaylist,
    renamePlaylist,
    items,
    removeItem,
    clearPlaylist,
    moveItem
  } = usePlaylistStore();

  const { setTrack, setPlaybackState } = useDjStore();

  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  const activePlaylist = playlists.find((p) => p.id === activePlaylistId) || playlists[0];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    createPlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    setIsCreating(false);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameValue.trim() || !activePlaylist) return;
    renamePlaylist(activePlaylist.id, renameValue.trim());
    setIsRenaming(false);
  };

  const handleStartRename = () => {
    if (!activePlaylist) return;
    setRenameValue(activePlaylist.name);
    setIsRenaming(true);
  };

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
    <div className="flex flex-col h-full space-y-2.5 min-h-0 overflow-hidden">
      {/* 1. Playlists Management Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-[#0d121c] rounded-xl border border-[#242f42]">
        {/* Playlist Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full">
          {playlists.map((pl) => (
            <button
              key={pl.id}
              onClick={() => {
                setActivePlaylist(pl.id);
                setIsRenaming(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                pl.id === activePlaylistId
                  ? 'bg-gradient-to-r from-[#FF6B00] to-[#FF0055] text-white shadow-md'
                  : 'bg-[#151d2b] hover:bg-[#1f293d] text-slate-400 hover:text-white border border-[#242f42]'
              }`}
            >
              <ListMusic className="w-3.5 h-3.5" />
              <span>{pl.name}</span>
              <span className="text-[10px] opacity-75 font-mono">({pl.items.length})</span>
            </button>
          ))}

          {/* New Playlist Button */}
          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#151d2b] hover:bg-[#00B8FF]/20 text-[#00B8FF] border border-[#00B8FF]/40 transition-all flex items-center gap-1 shrink-0"
              title="Crear nueva lista de reproducción"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Lista</span>
            </button>
          )}
        </div>

        {/* Action Controls for Current Playlist */}
        <div className="flex items-center gap-1.5 text-xs">
          {activePlaylist && !isRenaming && (
            <>
              <button
                onClick={handleStartRename}
                className="p-1.5 rounded-lg bg-[#151d2b] hover:bg-[#1f293d] text-slate-400 hover:text-white transition-colors"
                title="Renombrar lista actual"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              {playlists.length > 1 && (
                <button
                  onClick={() => {
                    if (window.confirm(`¿Seguro que deseas eliminar la lista "${activePlaylist.name}"?`)) {
                      deletePlaylist(activePlaylist.id);
                    }
                  }}
                  className="p-1.5 rounded-lg bg-[#151d2b] hover:bg-red-950 text-slate-400 hover:text-red-400 transition-colors"
                  title="Eliminar esta lista"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Inline Create Playlist Form */}
      {isCreating && (
        <form onSubmit={handleCreateSubmit} className="flex items-center gap-2 p-2 bg-[#121722] rounded-xl border border-[#00B8FF]/50 shadow-lg">
          <FolderPlus className="w-4 h-4 text-[#00B8FF] shrink-0" />
          <input
            type="text"
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            placeholder="Nombre de la nueva lista (ej: Perreo 2026, TikTok Live Set...)"
            autoFocus
            className="flex-1 bg-[#090d14] border border-[#242f42] rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00B8FF]"
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-[#00B8FF] text-black font-bold text-xs hover:brightness-110 flex items-center gap-1"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Crear</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCreating(false)}
            className="p-1.5 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* Inline Rename Form */}
      {isRenaming && (
        <form onSubmit={handleRenameSubmit} className="flex items-center gap-2 p-2 bg-[#121722] rounded-xl border border-amber-500/50 shadow-lg">
          <input
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="Nuevo nombre de la lista..."
            autoFocus
            className="flex-1 bg-[#090d14] border border-[#242f42] rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-amber-500 text-black font-bold text-xs hover:brightness-110 flex items-center gap-1"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Guardar</span>
          </button>
          <button
            type="button"
            onClick={() => setIsRenaming(false)}
            className="p-1.5 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* 2. Track List Header */}
      <div className="flex items-center justify-between text-xs px-1">
        <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <span>{activePlaylist?.name || 'Lista'}</span>
          <span className="text-slate-500 font-normal">({items.length} canciones)</span>
        </span>
        {items.length > 0 && (
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

      {/* 3. Playlist items */}
      {items.length === 0 ? (
        <div className="text-center py-10 text-slate-500 bg-[#0B101A] rounded-xl border border-[#2A384F]/50">
          <ListMusic className="w-9 h-9 mx-auto mb-2 opacity-40 text-[#FF6B00]" />
          <p className="text-xs font-bold text-slate-300">Esta lista está vacía.</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Busca cualquier canción en el buscador superior y haz clic en "+" para agregarla a esta lista.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5 overflow-y-auto flex-1 pr-1 pb-2">
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
                    loading="lazy"
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
                {/* Load to Deck A */}
                <button
                  onClick={() => handleLoadDeck('A', item)}
                  className="px-2.5 py-1 rounded-lg bg-[#FF6B00]/20 hover:bg-[#FF6B00] text-[#FF6B00] hover:text-black font-extrabold text-[10px] transition-all flex items-center gap-1 border border-[#FF6B00]/40 shadow-sm"
                  title="Cargar en Plato A"
                >
                  <Play className="w-2.5 h-2.5 fill-current" />
                  DECK A
                </button>

                {/* Load to Deck B */}
                <button
                  onClick={() => handleLoadDeck('B', item)}
                  className="px-2.5 py-1 rounded-lg bg-[#FF0055]/20 hover:bg-[#FF0055] text-[#FF0055] hover:text-white font-extrabold text-[10px] transition-all flex items-center gap-1 border border-[#FF0055]/40 shadow-sm"
                  title="Cargar en Plato B"
                >
                  <Play className="w-2.5 h-2.5 fill-current" />
                  DECK B
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
                  title="Eliminar de esta lista"
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
