import { create } from 'zustand';
import { PlaylistItem } from '../types';

export interface CustomPlaylist {
  id: string;
  name: string;
  items: PlaylistItem[];
  createdAt: number;
}

interface PlaylistState {
  playlists: CustomPlaylist[];
  activePlaylistId: string;

  // Playlist management
  createPlaylist: (name: string) => string;
  deletePlaylist: (id: string) => void;
  renamePlaylist: (id: string, newName: string) => void;
  setActivePlaylist: (id: string) => void;

  // Track management in active playlist
  items: PlaylistItem[]; // returns items of active playlist
  addItem: (item: Omit<PlaylistItem, 'id' | 'addedAt'>, targetPlaylistId?: string) => void;
  removeItem: (id: string) => void;
  clearPlaylist: () => void;
  moveItem: (fromIndex: number, toIndex: number) => void;
}

const STORAGE_KEY = 'djaz_playlists_v2';
const LEGACY_STORAGE_KEY = 'minidj_playlist_v1';

const getInitialPlaylists = (): { playlists: CustomPlaylist[]; activeId: string } => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.playlists) && parsed.playlists.length > 0) {
        return {
          playlists: parsed.playlists,
          activeId: parsed.activeId || parsed.playlists[0].id
        };
      }
    }

    // Check legacy storage for existing user tracks
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    let legacyItems: PlaylistItem[] = [];
    if (legacyRaw) {
      const parsedLegacy = JSON.parse(legacyRaw);
      if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
        legacyItems = parsedLegacy;
      }
    }

    const defaultPlaylists: CustomPlaylist[] = [
      {
        id: 'pl-favorites',
        name: '🔥 TikTok Live Hits',
        items: legacyItems.length > 0 ? legacyItems : [
          {
            id: 'seed-1',
            title: 'Alan Walker - Faded',
            artist: 'Alan Walker',
            duration: '3:32',
            thumbnail: 'https://i.ytimg.com/vi/60ItHLz5WEA/hqdefault.jpg',
            source: 'youtube',
            youtubeId: '60ItHLz5WEA',
            addedAt: Date.now()
          },
          {
            id: 'seed-2',
            title: 'TheFatRat - Unity',
            artist: 'TheFatRat',
            duration: '4:09',
            thumbnail: 'https://i.ytimg.com/vi/n8X9_MgEdCg/hqdefault.jpg',
            source: 'youtube',
            youtubeId: 'n8X9_MgEdCg',
            addedAt: Date.now()
          },
          {
            id: 'seed-3',
            title: 'Elektronomia - Sky High',
            artist: 'NoCopyrightSounds',
            duration: '3:57',
            thumbnail: 'https://i.ytimg.com/vi/2vXz6e_J1Jc/hqdefault.jpg',
            source: 'youtube',
            youtubeId: '2vXz6e_J1Jc',
            addedAt: Date.now()
          }
        ],
        createdAt: Date.now()
      },
      {
        id: 'pl-set2',
        name: '🎵 Cola de Canciones',
        items: [],
        createdAt: Date.now()
      }
    ];

    return {
      playlists: defaultPlaylists,
      activeId: defaultPlaylists[0].id
    };
  } catch (e) {
    console.warn('[PlaylistStore] Error loading storage:', e);
  }

  const fallback: CustomPlaylist = {
    id: 'pl-default',
    name: '🎵 Mi Lista DJ',
    items: [],
    createdAt: Date.now()
  };
  return { playlists: [fallback], activeId: fallback.id };
};

const savePlaylists = (playlists: CustomPlaylist[], activeId: string) => {
  try {
    const serializable = playlists.map(pl => ({
      ...pl,
      items: pl.items.map(item => ({ ...item, file: undefined }))
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ playlists: serializable, activeId }));
  } catch (e) {
    console.warn('[PlaylistStore] Error saving:', e);
  }
};

const initial = getInitialPlaylists();
const activeInitialPl = initial.playlists.find(p => p.id === initial.activeId) || initial.playlists[0];

export const usePlaylistStore = create<PlaylistState>((set, get) => ({
  playlists: initial.playlists,
  activePlaylistId: initial.activeId,
  items: activeInitialPl ? activeInitialPl.items : [],

  createPlaylist: (name: string) => {
    const trimmed = name.trim() || `Nueva Lista ${get().playlists.length + 1}`;
    const newId = `pl-${Date.now()}`;
    const newPlaylist: CustomPlaylist = {
      id: newId,
      name: trimmed,
      items: [],
      createdAt: Date.now()
    };

    const updated = [...get().playlists, newPlaylist];
    savePlaylists(updated, newId);
    set({
      playlists: updated,
      activePlaylistId: newId,
      items: []
    });
    return newId;
  },

  deletePlaylist: (id: string) => {
    const { playlists, activePlaylistId } = get();
    if (playlists.length <= 1) return; // Keep at least one playlist

    const updated = playlists.filter(p => p.id !== id);
    const newActiveId = activePlaylistId === id ? updated[0].id : activePlaylistId;
    const activePl = updated.find(p => p.id === newActiveId) || updated[0];

    savePlaylists(updated, newActiveId);
    set({
      playlists: updated,
      activePlaylistId: newActiveId,
      items: activePl ? activePl.items : []
    });
  },

  renamePlaylist: (id: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    const updated = get().playlists.map(p => (p.id === id ? { ...p, name: trimmed } : p));
    savePlaylists(updated, get().activePlaylistId);
    set({ playlists: updated });
  },

  setActivePlaylist: (id: string) => {
    const pl = get().playlists.find(p => p.id === id);
    if (!pl) return;

    savePlaylists(get().playlists, id);
    set({
      activePlaylistId: id,
      items: pl.items
    });
  },

  addItem: (newItem, targetPlaylistId) => {
    const { playlists, activePlaylistId } = get();
    const destId = targetPlaylistId || activePlaylistId;

    const item: PlaylistItem = {
      ...newItem,
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      addedAt: Date.now()
    };

    const updated = playlists.map(pl => {
      if (pl.id === destId) {
        return { ...pl, items: [...pl.items, item] };
      }
      return pl;
    });

    const activePl = updated.find(p => p.id === activePlaylistId);
    savePlaylists(updated, activePlaylistId);
    set({
      playlists: updated,
      items: activePl ? activePl.items : []
    });
  },

  removeItem: (id: string) => {
    const { playlists, activePlaylistId } = get();
    const updated = playlists.map(pl => {
      if (pl.id === activePlaylistId) {
        return { ...pl, items: pl.items.filter(i => i.id !== id) };
      }
      return pl;
    });

    const activePl = updated.find(p => p.id === activePlaylistId);
    savePlaylists(updated, activePlaylistId);
    set({
      playlists: updated,
      items: activePl ? activePl.items : []
    });
  },

  clearPlaylist: () => {
    const { playlists, activePlaylistId } = get();
    const updated = playlists.map(pl => {
      if (pl.id === activePlaylistId) {
        return { ...pl, items: [] };
      }
      return pl;
    });

    savePlaylists(updated, activePlaylistId);
    set({
      playlists: updated,
      items: []
    });
  },

  moveItem: (fromIndex: number, toIndex: number) => {
    const { playlists, activePlaylistId } = get();
    const activePl = playlists.find(p => p.id === activePlaylistId);
    if (!activePl) return;

    const items = [...activePl.items];
    if (fromIndex < 0 || fromIndex >= items.length || toIndex < 0 || toIndex >= items.length) {
      return;
    }

    const [moved] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, moved);

    const updated = playlists.map(pl => (pl.id === activePlaylistId ? { ...pl, items } : pl));
    savePlaylists(updated, activePlaylistId);
    set({
      playlists: updated,
      items
    });
  }
}));
