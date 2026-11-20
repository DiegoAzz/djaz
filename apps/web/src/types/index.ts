export type DeckId = 'A' | 'B';
export type AppMode = 'youtube' | 'local';

export type PlaybackState =
  | 'EMPTY'
  | 'LOADING'
  | 'READY'
  | 'PLAYING'
  | 'PAUSED'
  | 'ENDED'
  | 'ERROR';

export interface TrackInfo {
  id: string;
  title: string;
  artist: string;
  duration: number; // in seconds
  durationFormatted?: string;
  thumbnail?: string;
  isLocal?: boolean;
  audioBuffer?: AudioBuffer;
  file?: File;
  youtubeId?: string;
}

export interface DeckLoop {
  active: boolean;
  beats: 1 | 2 | 4 | 8;
  startTime: number;
  endTime: number;
}

export interface DeckEQ {
  low: number; // -24 to +12 dB
  mid: number;
  high: number;
}

export interface DeckFilter {
  active: boolean;
  type: 'none' | 'lpf' | 'hpf';
  cutoff: number; // Hz
}

export interface DeckDelay {
  active: boolean;
  time: number; // 0.1 to 1.0s
  feedback: number; // 0 to 0.8
  mix: number; // 0 to 1.0
}

export interface DeckReverb {
  active: boolean;
  mix: number; // 0 to 1.0
}

export interface DeckState {
  deckId: DeckId;
  track: TrackInfo | null;
  state: PlaybackState;
  currentTime: number;
  duration: number;
  volume: number; // 0 - 100 user fader
  effectiveVolume: number; // 0 - 100 after crossfader applied
  playbackRate: number; // 0.5 to 2.0 (1.0 = normal)
  pitchRange: 8 | 16 | 50; // percentage
  bpm: number | null;
  manualBpm: number | null;
  cuePoint: number | null;
  loop: DeckLoop | null;
  eq: DeckEQ;
  filter: DeckFilter;
  delay: DeckDelay;
  reverb: DeckReverb;
  error: string | null;
  isMuted: boolean;
  pfl: boolean; // Pre-Fade Listen / Headphone cue
}

export interface PlaylistItem {
  id: string;
  title: string;
  artist: string;
  duration?: string;
  thumbnail?: string;
  source: 'youtube' | 'local';
  youtubeId?: string;
  file?: File;
  addedAt: number;
}

export interface SearchResultItem {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  duration?: string;
  publishedAt?: string;
}

export interface UserPreferences {
  autoCue: boolean;
  crossfaderCurve: 'linear' | 'smooth';
  defaultAutoTransitionSec: 5 | 10 | 15;
  keyboardShortcutsEnabled: boolean;
  theme: 'dark';
}
