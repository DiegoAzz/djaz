import { create } from 'zustand';
import { PlaylistItem } from '../types';

interface PlaylistState {
  items: PlaylistItem[];
  addItem: (item: Omit<PlaylistItem, 'id' | 'addedAt'>) => void;
  removeItem: (id: string) => void;
  clearPlaylist: () => void;
  moveItem: (fromIndex: number, toIndex: number) => void;
}

const STORAGE_KEY = 'minidj_playlist_v1';

const getInitialItems = (): PlaylistItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[Playlist] Error loading from localStorage:', e);
  }

  // Default seed tracks
  return [
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
  ];
};

const saveItems = (items: PlaylistItem[]) => {
  try {
    // Only persist items without large File references
    const serializable = items.map(item => ({
      ...item,
      file: undefined
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  } catch (e) {
    console.warn('[Playlist] Error saving to localStorage:', e);
  }
};

export const usePlaylistStore = create<PlaylistState>((set, get) => ({
  items: getInitialItems(),

  addItem: (newItem) => {
    const item: PlaylistItem = {
      ...newItem,
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      addedAt: Date.now()
    };
    const updated = [...get().items, item];
    saveItems(updated);
    set({ items: updated });
  },

  removeItem: (id) => {
    const updated = get().items.filter(i => i.id !== id);
    saveItems(updated);
    set({ items: updated });
  },

  clearPlaylist: () => {
    saveItems([]);
    set({ items: [] });
  },

  moveItem: (fromIndex, toIndex) => {
    const items = [...get().items];
    if (fromIndex < 0 || fromIndex >= items.length || toIndex < 0 || toIndex >= items.length) {
      return;
    }
    const [moved] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, moved);
    saveItems(items);
    set({ items });
  }
}));
