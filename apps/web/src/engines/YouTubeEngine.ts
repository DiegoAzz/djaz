import { DeckId, PlaybackState } from '../types';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

type StateChangeCallback = (deckId: DeckId, state: PlaybackState) => void;
type ErrorCallback = (deckId: DeckId, message: string) => void;
type ReadyCallback = (deckId: DeckId) => void;

class YouTubeEngineManager {
  private isApiLoaded = false;
  private apiReadyPromise: Promise<void> | null = null;
  private players: Map<DeckId, any> = new Map();
  private pendingVideos: Map<DeckId, { videoId: string; autoplay: boolean }> = new Map();
  private onStateChangeCallbacks: Map<DeckId, StateChangeCallback> = new Map();
  private onErrorCallbacks: Map<DeckId, ErrorCallback> = new Map();
  private onReadyCallbacks: Map<DeckId, ReadyCallback> = new Map();

  public initApi(): Promise<void> {
    if (this.isApiLoaded && window.YT && window.YT.Player) {
      return Promise.resolve();
    }
    if (this.apiReadyPromise) {
      return this.apiReadyPromise;
    }

    this.apiReadyPromise = new Promise((resolve) => {
      if (window.YT && window.YT.Player) {
        this.isApiLoaded = true;
        resolve();
        return;
      }

      const existingScript = document.getElementById('youtube-iframe-api');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      }

      const prevReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevReady) prevReady();
        this.isApiLoaded = true;
        resolve();
      };
    });

    return this.apiReadyPromise;
  }

  public async createPlayer(
    deckId: DeckId,
    elementId: string,
    callbacks: {
      onStateChange: StateChangeCallback;
      onReady: ReadyCallback;
      onError: ErrorCallback;
    }
  ): Promise<any> {
    await this.initApi();

    this.onStateChangeCallbacks.set(deckId, callbacks.onStateChange);
    this.onErrorCallbacks.set(deckId, callbacks.onError);
    this.onReadyCallbacks.set(deckId, callbacks.onReady);

    // Destroy existing player if present
    const existing = this.players.get(deckId);
    if (existing) {
      try {
        existing.destroy();
      } catch (e) {
        console.warn(`[YouTubeEngine] Error destroying existing player for Deck ${deckId}:`, e);
      }
      this.players.delete(deckId);
    }

    return new Promise((resolve) => {
      new window.YT.Player(elementId, {
        height: '100%',
        width: '100%',
        playerVars: {
          autoplay: 0,
          controls: 1, // Official YouTube player controls
          rel: 0,
          modestbranding: 1,
          enablejsapi: 1,
          origin: window.location.origin
        },
        events: {
          onReady: (event: any) => {
            this.players.set(deckId, event.target);
            callbacks.onReady(deckId);

            // Process any pending video load that was requested before ready
            const pending = this.pendingVideos.get(deckId);
            if (pending) {
              this.loadVideo(deckId, pending.videoId, pending.autoplay);
              this.pendingVideos.delete(deckId);
            }

            resolve(event.target);
          },
          onStateChange: (event: any) => {
            const mappedState = this.mapPlayerState(event.data);
            callbacks.onStateChange(deckId, mappedState);
          },
          onError: (event: any) => {
            const errorMsg = this.mapErrorCode(event.data);
            callbacks.onError(deckId, errorMsg);
          }
        }
      });
    });
  }

  public loadVideo(deckId: DeckId, videoId: string, autoplay = false) {
    const player = this.players.get(deckId);
    if (!player || typeof player.cueVideoById !== 'function') {
      // Store in pending queue if player isn't ready yet
      this.pendingVideos.set(deckId, { videoId, autoplay });
      return;
    }

    try {
      if (autoplay) {
        player.loadVideoById(videoId);
      } else {
        player.cueVideoById(videoId);
      }
    } catch (err: any) {
      console.error(`[YouTubeEngine] Failed to load video ${videoId} on Deck ${deckId}:`, err);
    }
  }

  public play(deckId: DeckId) {
    const player = this.players.get(deckId);
    if (player && typeof player.playVideo === 'function') {
      try {
        player.playVideo();
      } catch (e) {
        console.warn(`[YouTubeEngine] playVideo error Deck ${deckId}:`, e);
      }
    }
  }

  public pause(deckId: DeckId) {
    const player = this.players.get(deckId);
    if (player && typeof player.pauseVideo === 'function') {
      try {
        player.pauseVideo();
      } catch (e) {
        console.warn(`[YouTubeEngine] pauseVideo error Deck ${deckId}:`, e);
      }
    }
  }

  public seekTo(deckId: DeckId, seconds: number) {
    const player = this.players.get(deckId);
    if (player && typeof player.seekTo === 'function') {
      try {
        player.seekTo(seconds, true);
      } catch (e) {
        console.warn(`[YouTubeEngine] seekTo error Deck ${deckId}:`, e);
      }
    }
  }

  public setVolume(deckId: DeckId, volume: number) {
    const player = this.players.get(deckId);
    if (player && typeof player.setVolume === 'function') {
      try {
        const clamped = Math.max(0, Math.min(100, Math.round(volume)));
        player.setVolume(clamped);
      } catch (e) {
        console.warn(`[YouTubeEngine] setVolume error Deck ${deckId}:`, e);
      }
    }
  }

  public setPlaybackRate(deckId: DeckId, rate: number) {
    const player = this.players.get(deckId);
    if (player && typeof player.setPlaybackRate === 'function') {
      try {
        player.setPlaybackRate(rate);
      } catch (e) {
        console.warn(`[YouTubeEngine] setPlaybackRate error Deck ${deckId}:`, e);
      }
    }
  }

  public getCurrentTime(deckId: DeckId): number {
    const player = this.players.get(deckId);
    if (player && typeof player.getCurrentTime === 'function') {
      try {
        return player.getCurrentTime() || 0;
      } catch {
        return 0;
      }
    }
    return 0;
  }

  public getDuration(deckId: DeckId): number {
    const player = this.players.get(deckId);
    if (player && typeof player.getDuration === 'function') {
      try {
        return player.getDuration() || 0;
      } catch {
        return 0;
      }
    }
    return 0;
  }

  public destroy(deckId: DeckId) {
    const player = this.players.get(deckId);
    if (player) {
      try {
        player.destroy();
      } catch {}
      this.players.delete(deckId);
    }
    this.pendingVideos.delete(deckId);
  }

  private mapPlayerState(stateCode: number): PlaybackState {
    if (!window.YT) return 'EMPTY';
    switch (stateCode) {
      case window.YT.PlayerState.UNSTARTED:
        return 'READY';
      case window.YT.PlayerState.ENDED:
        return 'ENDED';
      case window.YT.PlayerState.PLAYING:
        return 'PLAYING';
      case window.YT.PlayerState.PAUSED:
        return 'PAUSED';
      case window.YT.PlayerState.BUFFERING:
        return 'LOADING';
      case window.YT.PlayerState.CUED:
        return 'READY';
      default:
        return 'PAUSED';
    }
  }

  private mapErrorCode(code: number): string {
    switch (code) {
      case 2:
        return 'Parámetro de video no válido.';
      case 5:
        return 'Error al cargar el reproductor HTML5.';
      case 100:
        return 'Video no encontrado o marcado como privado.';
      case 101:
      case 150:
        return 'El propietario del video no permite reproducción incrustada en aplicaciones externas.';
      default:
        return `Error de reproducción de YouTube (Código ${code}).`;
    }
  }
}

export const youtubeEngine = new YouTubeEngineManager();
