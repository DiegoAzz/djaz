import React, { useEffect, useRef } from 'react';
import { DeckId } from '../../types';
import { useDjStore } from '../../stores/useDjStore';
import { youtubeEngine } from '../../engines/YouTubeEngine';
import { Music, AlertCircle, Play } from 'lucide-react';

interface YouTubePlayerContainerProps {
  deckId: DeckId;
}

export const YouTubePlayerContainer: React.FC<YouTubePlayerContainerProps> = ({ deckId }) => {
  const containerId = `yt-player-${deckId}`;
  const isDeckA = deckId === 'A';
  const accentColor = isDeckA ? '#FF6B00' : '#FF0055';

  const deck = useDjStore((s) => (deckId === 'A' ? s.deckA : s.deckB));
  const { setPlaybackState, setError, setTime, togglePlayDeck } = useDjStore();

  const isInitialized = useRef(false);
  const lastTimeRef = useRef(-1);
  const lastLoadedIdRef = useRef<string | null>(null);

  useEffect(() => {
    let pollInterval: any = null;

    const init = async () => {
      try {
        await youtubeEngine.createPlayer(deckId, containerId, {
          onReady: () => {
            isInitialized.current = true;
            // Restore saved session track automatically on load
            const currentDeck = useDjStore.getState()[deckId === 'A' ? 'deckA' : 'deckB'];
            if (currentDeck.track?.youtubeId) {
              lastLoadedIdRef.current = currentDeck.track.youtubeId;
              youtubeEngine.loadVideo(deckId, currentDeck.track.youtubeId, false);
            }
          },
          onStateChange: (_dId, state) => {
            setPlaybackState(deckId, state);
          },
          onError: (_dId, msg) => {
            setError(deckId, msg);
          }
        });

        // Smart polling loop
        pollInterval = setInterval(() => {
          if (isInitialized.current) {
            const currentTime = youtubeEngine.getCurrentTime(deckId);
            const duration = youtubeEngine.getDuration(deckId);

            if (Math.abs(currentTime - lastTimeRef.current) >= 0.25 || (duration > 0 && deck.duration === 0)) {
              lastTimeRef.current = currentTime;
              setTime(deckId, currentTime, duration);
            }
          }
        }, 250);
      } catch (err: any) {
        console.error(`[PlayerContainer] Error initializing Deck ${deckId}:`, err);
      }
    };

    init();

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      youtubeEngine.destroy(deckId);
      isInitialized.current = false;
    };
  }, [deckId, containerId, setPlaybackState, setError, setTime]);

  // Synchronize track changes with the YouTube player
  useEffect(() => {
    const ytId = deck.track?.youtubeId;
    if (ytId && isInitialized.current && ytId !== lastLoadedIdRef.current) {
      lastLoadedIdRef.current = ytId;
      youtubeEngine.loadVideo(deckId, ytId, false);
    }
  }, [deck.track?.youtubeId, deckId]);

  return (
    <div className="relative w-full aspect-video min-h-[190px] max-h-[260px] bg-black rounded-xl overflow-hidden border border-[#242f42] flex items-center justify-center shadow-inner">
      {/* Target iframe element for official video player */}
      <div
        id={containerId}
        className={`w-full h-full transition-opacity duration-300 ${
          deck.track?.youtubeId ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Overlay when no track is loaded */}
      {!deck.track && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-[#090d14]/90 backdrop-blur-sm pointer-events-none">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mb-2.5 border"
            style={{
              borderColor: `${accentColor}40`,
              backgroundColor: `${accentColor}15`
            }}
          >
            <Music className="w-6 h-6" style={{ color: accentColor }} />
          </div>
          <span className="text-sm font-bold text-white">Plato {deckId} Listo</span>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Selecciona una canción en el buscador y pulsa{' '}
            <strong style={{ color: accentColor }}>DECK {deckId}</strong>.
          </p>
        </div>
      )}

      {/* Play Overlay if loaded and paused */}
      {deck.track && deck.state === 'READY' && (
        <button
          onClick={() => togglePlayDeck(deckId)}
          className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-black/70 hover:bg-black/90 border-2 border-white/80 backdrop-blur-sm flex items-center justify-center text-white transition-all shadow-xl hover:scale-105 z-10"
          title="Toca para iniciar reproducción"
        >
          <Play className="w-6 h-6 fill-current ml-0.5" style={{ color: accentColor }} />
        </button>
      )}

      {/* Error Banner */}
      {deck.error && (
        <div className="absolute inset-0 bg-red-950/90 flex flex-col items-center justify-center p-4 text-center z-20">
          <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
          <h5 className="text-sm font-bold text-red-200">No se pudo reproducir el audio/video</h5>
          <p className="text-xs text-red-300 mt-1 max-w-xs">{deck.error}</p>
          <span className="text-[11px] text-red-400/80 mt-2">Elige otra canción de la búsqueda.</span>
        </div>
      )}

      {/* Loading Overlay */}
      {deck.state === 'LOADING' && (
        <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-black/80 border border-slate-700 flex items-center gap-1.5 text-[11px] text-slate-300 pointer-events-none z-10 shadow">
          <div className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: accentColor }} />
          <span>Cargando pista...</span>
        </div>
      )}
    </div>
  );
};
