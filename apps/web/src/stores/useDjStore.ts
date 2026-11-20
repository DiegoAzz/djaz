import { create } from 'zustand';
import { AppMode, DeckId, DeckState, PlaybackState, TrackInfo, DeckLoop, DeckEQ, DeckFilter, DeckDelay, DeckReverb } from '../types';
import { CrossfaderEngine } from '../engines/CrossfaderEngine';
import { youtubeEngine } from '../engines/YouTubeEngine';
import { localAudioEngine } from '../engines/LocalAudioEngine';

interface DjStoreState {
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;

  crossfader: number; // -1 to 1
  setCrossfader: (val: number) => void;
  centerCrossfader: () => void;

  transition: {
    isTransitioning: boolean;
    duration: 5 | 10 | 15;
    progress: number;
    target: 'A' | 'B' | null;
  };
  startAutoTransition: (target: 'A' | 'B', durationSec: 5 | 10 | 15) => void;
  cancelAutoTransition: () => void;

  deckA: DeckState;
  deckB: DeckState;

  // Deck Actions
  setTrack: (deckId: DeckId, track: TrackInfo | null) => void;
  setPlaybackState: (deckId: DeckId, state: PlaybackState) => void;
  setTime: (deckId: DeckId, currentTime: number, duration?: number) => void;
  setVolume: (deckId: DeckId, volume: number) => void;
  setPlaybackRate: (deckId: DeckId, rate: number) => void;
  setPitchRange: (deckId: DeckId, range: 8 | 16 | 50) => void;
  setBpm: (deckId: DeckId, bpm: number | null) => void;
  setManualBpm: (deckId: DeckId, bpm: number | null) => void;
  setCuePoint: (deckId: DeckId, time: number | null) => void;
  setLoop: (deckId: DeckId, loop: DeckLoop | null) => void;
  setEQ: (deckId: DeckId, eq: Partial<DeckEQ>) => void;
  setFilter: (deckId: DeckId, filter: Partial<DeckFilter>) => void;
  setDelay: (deckId: DeckId, delay: Partial<DeckDelay>) => void;
  setReverb: (deckId: DeckId, reverb: Partial<DeckReverb>) => void;
  setError: (deckId: DeckId, error: string | null) => void;
  toggleMute: (deckId: DeckId) => void;
  togglePfl: (deckId: DeckId) => void;
  syncBpm: (sourceDeckId: DeckId, targetDeckId: DeckId) => void;

  // Global Transport Helpers
  playDeck: (deckId: DeckId) => void;
  pauseDeck: (deckId: DeckId) => void;
  togglePlayDeck: (deckId: DeckId) => void;
  seekDeck: (deckId: DeckId, seconds: number) => void;
  cueDeck: (deckId: DeckId) => void;
}

const initialEQ: DeckEQ = { low: 0, mid: 0, high: 0 };
const initialFilter: DeckFilter = { active: false, type: 'none', cutoff: 20000 };
const initialDelay: DeckDelay = { active: false, time: 0.35, feedback: 0.4, mix: 0.3 };
const initialReverb: DeckReverb = { active: false, mix: 0.3 };

const SESSION_KEY = 'minidj_session_v2';

interface SavedSession {
  crossfader: number;
  deckA: {
    track: TrackInfo | null;
    volume: number;
  };
  deckB: {
    track: TrackInfo | null;
    volume: number;
  };
}

const getSavedSession = (): SavedSession | null => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
};

let saveSessionTimer: any = null;
const saveSessionToStorage = (crossfader: number, deckA: DeckState, deckB: DeckState) => {
  if (saveSessionTimer) clearTimeout(saveSessionTimer);
  saveSessionTimer = setTimeout(() => {
    try {
      const session: SavedSession = {
        crossfader,
        deckA: {
          track: deckA.track
            ? {
                id: deckA.track.id,
                title: deckA.track.title,
                artist: deckA.track.artist,
                duration: deckA.track.duration,
                durationFormatted: deckA.track.durationFormatted,
                thumbnail: deckA.track.thumbnail,
                youtubeId: deckA.track.youtubeId,
                isLocal: deckA.track.isLocal
              }
            : null,
          volume: deckA.volume
        },
        deckB: {
          track: deckB.track
            ? {
                id: deckB.track.id,
                title: deckB.track.title,
                artist: deckB.track.artist,
                duration: deckB.track.duration,
                durationFormatted: deckB.track.durationFormatted,
                thumbnail: deckB.track.thumbnail,
                youtubeId: deckB.track.youtubeId,
                isLocal: deckB.track.isLocal
              }
            : null,
          volume: deckB.volume
        }
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {}
  }, 400);
};

const createInitialDeck = (deckId: DeckId): DeckState => ({
  deckId,
  track: null,
  state: 'EMPTY',
  currentTime: 0,
  duration: 0,
  volume: 100,
  effectiveVolume: 100,
  playbackRate: 1.0,
  pitchRange: 8,
  bpm: null,
  manualBpm: null,
  cuePoint: null,
  loop: null,
  eq: { ...initialEQ },
  filter: { ...initialFilter },
  delay: { ...initialDelay },
  reverb: { ...initialReverb },
  error: null,
  isMuted: false,
  pfl: false
});

// Restore saved session if exists
const saved = getSavedSession();
const initDeckA = createInitialDeck('A');
const initDeckB = createInitialDeck('B');

if (saved?.deckA?.track) {
  initDeckA.track = saved.deckA.track;
  initDeckA.state = 'READY';
  initDeckA.volume = saved.deckA.volume ?? 100;
}

if (saved?.deckB?.track) {
  initDeckB.track = saved.deckB.track;
  initDeckB.state = 'READY';
  initDeckB.volume = saved.deckB.volume ?? 100;
}

const initialCrossfader = saved?.crossfader ?? 0;

type TrackEndedListener = (deckId: DeckId) => void;
const trackEndedListeners: TrackEndedListener[] = [];
export const registerTrackEndedListener = (fn: TrackEndedListener) => {
  trackEndedListeners.push(fn);
  return () => {
    const idx = trackEndedListeners.indexOf(fn);
    if (idx !== -1) trackEndedListeners.splice(idx, 1);
  };
};

export const useDjStore = create<DjStoreState>((set, get) => {
  const applyVolumes = (volA: number, volB: number, crossfader: number) => {
    const { effectiveVolA, effectiveVolB } = CrossfaderEngine.calculateEffectiveVolumes(volA, volB, crossfader);
    const { appMode } = get();

    if (appMode === 'youtube') {
      youtubeEngine.setVolume('A', effectiveVolA);
      youtubeEngine.setVolume('B', effectiveVolB);
    } else {
      localAudioEngine.setVolume('A', effectiveVolA / 100);
      localAudioEngine.setVolume('B', effectiveVolB / 100);
    }

    return { effectiveVolA, effectiveVolB };
  };

  return {
    appMode: 'youtube',
    setAppMode: (mode) => {
      // Keep active music playing seamlessly without interruptions during live streams!
      set({ appMode: mode });
    },

    crossfader: initialCrossfader,
    setCrossfader: (val) => {
      const clamped = Math.max(-1, Math.min(1, val));
      const { deckA, deckB } = get();
      const { effectiveVolA, effectiveVolB } = applyVolumes(deckA.volume, deckB.volume, clamped);
      const hasVolAChanged = deckA.effectiveVolume !== effectiveVolA;
      const hasVolBChanged = deckB.effectiveVolume !== effectiveVolB;

      set((state) => ({
        crossfader: clamped,
        deckA: hasVolAChanged ? { ...state.deckA, effectiveVolume: effectiveVolA } : state.deckA,
        deckB: hasVolBChanged ? { ...state.deckB, effectiveVolume: effectiveVolB } : state.deckB
      }));
      saveSessionToStorage(clamped, deckA, deckB);
    },

    centerCrossfader: () => {
      get().setCrossfader(0);
    },

    transition: {
      isTransitioning: false,
      duration: 10,
      progress: 0,
      target: null
    },

    startAutoTransition: (target, durationSec) => {
      const targetPos = target === 'A' ? -1 : 1;
      const currentPos = get().crossfader;

      set({
        transition: {
          isTransitioning: true,
          duration: durationSec,
          progress: 0,
          target
        }
      });

      CrossfaderEngine.animateTransition(
        currentPos,
        targetPos,
        durationSec,
        (newPos, progress) => {
          const clamped = Math.max(-1, Math.min(1, newPos));
          const { deckA, deckB } = get();
          const { effectiveVolA, effectiveVolB } = applyVolumes(deckA.volume, deckB.volume, clamped);
          const hasVolAChanged = deckA.effectiveVolume !== effectiveVolA;
          const hasVolBChanged = deckB.effectiveVolume !== effectiveVolB;

          set((state) => ({
            crossfader: clamped,
            deckA: hasVolAChanged ? { ...state.deckA, effectiveVolume: effectiveVolA } : state.deckA,
            deckB: hasVolBChanged ? { ...state.deckB, effectiveVolume: effectiveVolB } : state.deckB,
            transition: { ...state.transition, progress }
          }));

          saveSessionToStorage(clamped, deckA, deckB);
        },
        () => {
          set((state) => ({
            transition: { ...state.transition, isTransitioning: false, progress: 1.0, target: null }
          }));
        }
      );
    },

    cancelAutoTransition: () => {
      CrossfaderEngine.cancelTransition();
      set((state) => ({
        transition: { ...state.transition, isTransitioning: false, progress: 0, target: null }
      }));
    },

    deckA: initDeckA,
    deckB: initDeckB,

    setTrack: (deckId, track) => {
      const isDeckA = deckId === 'A';
      const deckKey = isDeckA ? 'deckA' : 'deckB';
      const currentDeck = get()[deckKey];

      const updatedDeck: DeckState = {
        ...currentDeck,
        track,
        state: track ? 'READY' : 'EMPTY',
        currentTime: 0,
        duration: track?.duration || 0,
        error: null,
        bpm: track?.isLocal ? null : currentDeck.bpm
      };

      set({ [deckKey]: updatedDeck });

      const { crossfader, deckA, deckB } = get();
      saveSessionToStorage(crossfader, isDeckA ? updatedDeck : deckA, !isDeckA ? updatedDeck : deckB);
    },

    setPlaybackState: (deckId, state) => {
      const isDeckA = deckId === 'A';
      const deckKey = isDeckA ? 'deckA' : 'deckB';
      set((s) => ({
        [deckKey]: { ...s[deckKey], state }
      }));

      if (state === 'ENDED') {
        trackEndedListeners.forEach((fn) => {
          try {
            fn(deckId);
          } catch (e) {
            console.error('[TrackEndedListener Error]', e);
          }
        });
      }
    },

    setTime: (deckId, currentTime, duration) => {
      const isDeckA = deckId === 'A';
      const deckKey = isDeckA ? 'deckA' : 'deckB';
      set((s) => ({
        [deckKey]: {
          ...s[deckKey],
          currentTime,
          duration: duration !== undefined && duration > 0 ? duration : s[deckKey].duration
        }
      }));
    },

    setVolume: (deckId, volume) => {
      const isDeckA = deckId === 'A';
      const deckKey = isDeckA ? 'deckA' : 'deckB';
      const otherDeckKey = isDeckA ? 'deckB' : 'deckA';

      const userVol = Math.max(0, Math.min(100, volume));
      const crossfader = get().crossfader;
      const volA = isDeckA ? userVol : get().deckA.volume;
      const volB = !isDeckA ? userVol : get().deckB.volume;

      const { effectiveVolA, effectiveVolB } = applyVolumes(volA, volB, crossfader);

      set((s) => ({
        [deckKey]: {
          ...s[deckKey],
          volume: userVol,
          effectiveVolume: isDeckA ? effectiveVolA : effectiveVolB
        },
        [otherDeckKey]: {
          ...s[otherDeckKey],
          effectiveVolume: isDeckA ? effectiveVolB : effectiveVolA
        }
      }));

      const { deckA, deckB } = get();
      saveSessionToStorage(crossfader, deckA, deckB);
    },

    setPlaybackRate: (deckId, rate) => {
      const isDeckA = deckId === 'A';
      const deckKey = isDeckA ? 'deckA' : 'deckB';
      const clamped = Math.max(0.5, Math.min(2.0, rate));

      const { appMode } = get();
      if (appMode === 'youtube') {
        youtubeEngine.setPlaybackRate(deckId, clamped);
      } else {
        localAudioEngine.setPlaybackRate(deckId, clamped);
      }

      set((s) => ({
        [deckKey]: { ...s[deckKey], playbackRate: clamped }
      }));
    },

    setPitchRange: (deckId, range) => {
      const isDeckA = deckId === 'A';
      const deckKey = isDeckA ? 'deckA' : 'deckB';
      set((s) => ({
        [deckKey]: { ...s[deckKey], pitchRange: range }
      }));
    },

    setBpm: (deckId, bpm) => {
      const isDeckA = deckId === 'A';
      const deckKey = isDeckA ? 'deckA' : 'deckB';
      set((s) => ({
        [deckKey]: { ...s[deckKey], bpm }
      }));
    },

    setManualBpm: (deckId, manualBpm) => {
      const isDeckA = deckId === 'A';
      const deckKey = isDeckA ? 'deckA' : 'deckB';
      set((s) => ({
        [deckKey]: { ...s[deckKey], manualBpm }
      }));
    },

    setCuePoint: (deckId, time) => {
      const isDeckA = deckId === 'A';
      const deckKey = isDeckA ? 'deckA' : 'deckB';
      set((s) => ({
        [deckKey]: { ...s[deckKey], cuePoint: time }
      }));
    },

    setLoop: (deckId, loop) => {
      const isDeckA = deckId === 'A';
      const deckKey = isDeckA ? 'deckA' : 'deckB';
      const { appMode } = get();

      if (appMode === 'local' && loop) {
        localAudioEngine.setLoop(deckId, loop.active, loop.startTime, loop.endTime);
      } else if (appMode === 'local' && !loop) {
        localAudioEngine.setLoop(deckId, false, 0, 0);
      }

      set((s) => ({
        [deckKey]: { ...s[deckKey], loop }
      }));
    },

    setEQ: (deckId, eqUpdate) => {
      const isDeckA = deckId === 'A';
      const deckKey = isDeckA ? 'deckA' : 'deckB';
      const newEQ = { ...get()[deckKey].eq, ...eqUpdate };

      if (get().appMode === 'local') {
        localAudioEngine.setEQ(deckId, newEQ);
      }

      set((s) => ({
        [deckKey]: { ...s[deckKey], eq: newEQ }
      }));
    },

    setFilter: (deckId, filterUpdate) => {
      const isDeckA = deckId === 'A';
      const deckKey = isDeckA ? 'deckA' : 'deckB';
      const newFilter = { ...get()[deckKey].filter, ...filterUpdate };

      if (get().appMode === 'local') {
        localAudioEngine.setFilter(deckId, newFilter);
      }

      set((s) => ({
        [deckKey]: { ...s[deckKey], filter: newFilter }
      }));
    },

    setDelay: (deckId, delayUpdate) => {
      const isDeckA = deckId === 'A';
      const deckKey = isDeckA ? 'deckA' : 'deckB';
      const newDelay = { ...get()[deckKey].delay, ...delayUpdate };

      if (get().appMode === 'local') {
        localAudioEngine.setDelay(deckId, newDelay);
      }

      set((s) => ({
        [deckKey]: { ...s[deckKey], delay: newDelay }
      }));
    },

    setReverb: (deckId, reverbUpdate) => {
      const isDeckA = deckId === 'A';
      const deckKey = isDeckA ? 'deckA' : 'deckB';
      const newReverb = { ...get()[deckKey].reverb, ...reverbUpdate };

      if (get().appMode === 'local') {
        localAudioEngine.setReverb(deckId, newReverb);
      }

      set((s) => ({
        [deckKey]: { ...s[deckKey], reverb: newReverb }
      }));
    },

    setError: (deckId, error) => {
      const isDeckA = deckId === 'A';
      const deckKey = isDeckA ? 'deckA' : 'deckB';
      set((s) => ({
        [deckKey]: { ...s[deckKey], error, state: error ? 'ERROR' : s[deckKey].state }
      }));
    },

    toggleMute: (deckId) => {
      const isDeckA = deckId === 'A';
      const deckKey = isDeckA ? 'deckA' : 'deckB';
      const isMuted = !get()[deckKey].isMuted;
      const { appMode } = get();

      if (appMode === 'youtube') {
        youtubeEngine.setVolume(deckId, isMuted ? 0 : get()[deckKey].effectiveVolume);
      } else {
        localAudioEngine.setVolume(deckId, isMuted ? 0 : get()[deckKey].effectiveVolume / 100);
      }

      set((s) => ({
        [deckKey]: { ...s[deckKey], isMuted }
      }));
    },

    togglePfl: (deckId) => {
      const isDeckA = deckId === 'A';
      const deckKey = isDeckA ? 'deckA' : 'deckB';
      set((s) => ({
        [deckKey]: { ...s[deckKey], pfl: !s[deckKey].pfl }
      }));
    },

    syncBpm: (sourceDeckId, targetDeckId) => {
      const sourceDeck = sourceDeckId === 'A' ? get().deckA : get().deckB;
      const targetDeck = targetDeckId === 'A' ? get().deckA : get().deckB;

      const sourceBpm = sourceDeck.manualBpm || sourceDeck.bpm;
      const targetBpm = targetDeck.manualBpm || targetDeck.bpm;

      if (sourceBpm && targetBpm && targetBpm > 0) {
        const requiredRate = sourceBpm / targetBpm;
        get().setPlaybackRate(targetDeckId, requiredRate);
      }
    },

    playDeck: (deckId) => {
      const deck = deckId === 'A' ? get().deckA : get().deckB;
      if (!deck.track) return;
      const { appMode } = get();

      if (appMode === 'youtube') {
        // Always enforce crossfader volume before playing to prevent bleeding on inactive deck!
        youtubeEngine.setVolume(deckId, deck.effectiveVolume, true);
        youtubeEngine.play(deckId);
      } else {
        localAudioEngine.setVolume(deckId, deck.effectiveVolume / 100);
        localAudioEngine.play(deckId, undefined, () => {
          get().setPlaybackState(deckId, 'ENDED');
        });
        get().setPlaybackState(deckId, 'PLAYING');
      }
    },

    pauseDeck: (deckId) => {
      const { appMode } = get();
      if (appMode === 'youtube') {
        youtubeEngine.pause(deckId);
      } else {
        localAudioEngine.pause(deckId);
        get().setPlaybackState(deckId, 'PAUSED');
      }
    },

    togglePlayDeck: (deckId) => {
      const deck = deckId === 'A' ? get().deckA : get().deckB;
      if (deck.state === 'PLAYING') {
        get().pauseDeck(deckId);
      } else {
        get().playDeck(deckId);
      }
    },

    seekDeck: (deckId, seconds) => {
      const { appMode } = get();
      if (appMode === 'youtube') {
        youtubeEngine.seekTo(deckId, seconds);
      } else {
        localAudioEngine.seek(deckId, seconds, () => {
          get().setPlaybackState(deckId, 'ENDED');
        });
      }
      get().setTime(deckId, seconds);
    },

    cueDeck: (deckId) => {
      const deck = deckId === 'A' ? get().deckA : get().deckB;
      if (deck.state === 'PLAYING') {
        const targetTime = deck.cuePoint || 0;
        get().pauseDeck(deckId);
        get().seekDeck(deckId, targetTime);
      } else {
        const currentTime = deck.currentTime;
        get().setCuePoint(deckId, currentTime);
      }
    }
  };
});
