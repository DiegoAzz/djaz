import { create } from 'zustand';
import { DeckId, PlaylistItem } from '../types';
import { useDjStore, registerTrackEndedListener } from './useDjStore';
import { usePlaylistStore } from './usePlaylistStore';
import { youtubeEngine } from '../engines/YouTubeEngine';

interface AutoDjState {
  isAutoDjActive: boolean;
  activePlaylistId: string | null;
  currentTrackIndex: number;
  activeDeck: DeckId;
  loopMode: boolean;
  transitionDuration: 5 | 10 | 15;
  isTransitioningNext: boolean;

  // Actions
  startAutoDj: (playlistId: string, startIndex?: number) => void;
  stopAutoDj: () => void;
  toggleAutoDj: (playlistId: string) => void;
  skipNext: () => void;
  skipPrev: () => void;
  toggleLoop: () => void;
  onDeckEnded: (deckId: DeckId) => void;
}

const loadTrackIntoDeck = (deckId: DeckId, item: PlaylistItem, autoPlay: boolean) => {
  const ytId = item.youtubeId || item.id;
  const djStore = useDjStore.getState();

  djStore.setTrack(deckId, {
    id: item.id,
    title: item.title,
    artist: item.artist,
    duration: 0,
    durationFormatted: item.duration,
    thumbnail: item.thumbnail,
    youtubeId: ytId,
    isLocal: item.source === 'local'
  });

  djStore.setPlaybackState(deckId, 'LOADING');
  if (ytId) {
    youtubeEngine.loadVideo(deckId, ytId, autoPlay);
  }
};

export const useAutoDjStore = create<AutoDjState>((set, get) => ({
  isAutoDjActive: false,
  activePlaylistId: null,
  currentTrackIndex: 0,
  activeDeck: 'A',
  loopMode: true,
  transitionDuration: 10,
  isTransitioningNext: false,

  startAutoDj: (playlistId: string, startIndex = 0) => {
    const playlistStore = usePlaylistStore.getState();
    const targetPlaylist = playlistStore.playlists.find((p) => p.id === playlistId);
    if (!targetPlaylist || targetPlaylist.items.length === 0) return;

    const items = targetPlaylist.items;
    const clampedIndex = Math.max(0, Math.min(items.length - 1, startIndex));
    const firstTrack = items[clampedIndex];

    const djStore = useDjStore.getState();

    // 1. Position crossfader on Deck A (-1)
    djStore.setCrossfader(-1);

    // 2. Load & play first track on Deck A
    loadTrackIntoDeck('A', firstTrack, true);

    // 3. Pre-load next track on Deck B if available
    const nextIndex = clampedIndex + 1 < items.length ? clampedIndex + 1 : 0;
    if (items.length > 1) {
      loadTrackIntoDeck('B', items[nextIndex], false);
    }

    set({
      isAutoDjActive: true,
      activePlaylistId: playlistId,
      currentTrackIndex: clampedIndex,
      activeDeck: 'A',
      isTransitioningNext: false
    });
  },

  stopAutoDj: () => {
    const djStore = useDjStore.getState();
    if (djStore.transition.isTransitioning) {
      djStore.cancelAutoTransition();
    }
    set({
      isAutoDjActive: false,
      isTransitioningNext: false
    });
  },

  toggleAutoDj: (playlistId: string) => {
    const { isAutoDjActive, activePlaylistId } = get();
    if (isAutoDjActive && activePlaylistId === playlistId) {
      get().stopAutoDj();
    } else {
      get().startAutoDj(playlistId, 0);
    }
  },

  skipNext: () => {
    const { isAutoDjActive, activePlaylistId, currentTrackIndex, activeDeck, loopMode } = get();
    if (!isAutoDjActive || !activePlaylistId) return;

    const playlist = usePlaylistStore.getState().playlists.find((p) => p.id === activePlaylistId);
    if (!playlist || playlist.items.length === 0) return;

    const items = playlist.items;
    let nextIndex = currentTrackIndex + 1;
    if (nextIndex >= items.length) {
      if (!loopMode) {
        get().stopAutoDj();
        return;
      }
      nextIndex = 0;
    }

    const nextDeck: DeckId = activeDeck === 'A' ? 'B' : 'A';
    const nextTrack = items[nextIndex];

    // Load and play on the next deck
    loadTrackIntoDeck(nextDeck, nextTrack, true);

    // Start smooth transition
    const djStore = useDjStore.getState();
    djStore.startAutoTransition(nextDeck, get().transitionDuration);

    set({
      currentTrackIndex: nextIndex,
      activeDeck: nextDeck,
      isTransitioningNext: false
    });

    // Pre-queue following track on old deck after 3 seconds
    setTimeout(() => {
      if (!get().isAutoDjActive) return;
      const followingIndex = nextIndex + 1 < items.length ? nextIndex + 1 : 0;
      if (items.length > 1) {
        loadTrackIntoDeck(activeDeck, items[followingIndex], false);
      }
    }, 3000);
  },

  skipPrev: () => {
    const { isAutoDjActive, activePlaylistId, currentTrackIndex, activeDeck } = get();
    if (!isAutoDjActive || !activePlaylistId) return;

    const playlist = usePlaylistStore.getState().playlists.find((p) => p.id === activePlaylistId);
    if (!playlist || playlist.items.length === 0) return;

    const items = playlist.items;
    const prevIndex = currentTrackIndex - 1 >= 0 ? currentTrackIndex - 1 : items.length - 1;
    const nextDeck: DeckId = activeDeck === 'A' ? 'B' : 'A';

    loadTrackIntoDeck(nextDeck, items[prevIndex], true);
    useDjStore.getState().startAutoTransition(nextDeck, get().transitionDuration);

    set({
      currentTrackIndex: prevIndex,
      activeDeck: nextDeck,
      isTransitioningNext: false
    });
  },

  toggleLoop: () => {
    set((state) => ({ loopMode: !state.loopMode }));
  },

  onDeckEnded: (deckId: DeckId) => {
    const { isAutoDjActive, activeDeck, isTransitioningNext } = get();
    // Only trigger transition if Auto-DJ is active and the deck that just ended was the currently active deck
    if (!isAutoDjActive || deckId !== activeDeck || isTransitioningNext) {
      return;
    }

    set({ isTransitioningNext: true });
    get().skipNext();
  }
}));

// Automatically register track ended listener to blend songs seamlessly
if (typeof window !== 'undefined') {
  registerTrackEndedListener((deckId) => {
    useAutoDjStore.getState().onDeckEnded(deckId);
  });
}
