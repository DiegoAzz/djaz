import React, { useRef, useState } from 'react';
import { Disc, Tv } from 'lucide-react';
import { DeckId } from '../../types';
import { useDjStore } from '../../stores/useDjStore';
import { YouTubePlayerContainer } from './YouTubePlayerContainer';

interface VinylTurntableProps {
  deckId: DeckId;
  accentColor: string;
}

export const VinylTurntable: React.FC<VinylTurntableProps> = ({ deckId, accentColor }) => {
  const isDeckA = deckId === 'A';
  const deck = useDjStore((s) => (isDeckA ? s.deckA : s.deckB));
  const { togglePlayDeck, seekDeck } = useDjStore();

  // Default to 'video' for direct YouTube playback visibility, with instant toggle to 'vinyl'
  const [viewMode, setViewMode] = useState<'video' | 'vinyl'>('video');

  const isPlaying = deck.state === 'PLAYING';
  const [scratchAngle, setScratchAngle] = useState(0);
  const isScratchingRef = useRef(false);
  const lastXRef = useRef(0);

  // Scratch / touch scrub simulation on vinyl
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!deck.track) return;
    isScratchingRef.current = true;
    lastXRef.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isScratchingRef.current || !deck.track) return;
    const deltaX = e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;

    const scrubSeconds = (deltaX / 80) * 1.5;
    seekDeck(deckId, Math.max(0, deck.currentTime + scrubSeconds));
    setScratchAngle((prev) => (prev + deltaX * 2.5) % 360);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isScratchingRef.current) {
      isScratchingRef.current = false;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  return (
    <div className="relative w-full aspect-video min-h-[200px] max-h-[280px] bg-[#0c1017] rounded-2xl overflow-hidden border border-[#242f42] flex items-center justify-center shadow-2xl group select-none">
      {/* Top Deck Mode Switcher: VIDEO vs VINYL */}
      <div className="absolute top-2 right-2 z-30 flex items-center bg-[#090d14]/90 p-0.5 rounded-xl border border-[#2a384f] shadow-lg backdrop-blur-md">
        <button
          onClick={() => setViewMode('video')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
            viewMode === 'video'
              ? 'bg-red-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Ver Pantalla de Video"
        >
          <Tv className="w-3.5 h-3.5" />
          <span>VIDEO</span>
        </button>
        <button
          onClick={() => setViewMode('vinyl')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
            viewMode === 'vinyl'
              ? 'bg-slate-700 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Ver Tornamesa de Vinilo Giratorio YouDJ"
        >
          <Disc className="w-3.5 h-3.5" style={{ color: accentColor }} />
          <span>VINILO</span>
        </button>
      </div>

      {/* 1. Official YouTube Player Container (Visible by default) */}
      <div
        className={`w-full h-full absolute inset-0 transition-opacity duration-200 ${
          viewMode === 'video' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
        }`}
      >
        <YouTubePlayerContainer deckId={deckId} />
      </div>

      {/* 2. YouDJ Vinyl Turntable Display (GPU CSS Animation, 0 React Lag) */}
      {viewMode === 'vinyl' && (
        <div
          className="relative w-full h-full flex items-center justify-center p-2 cursor-grab active:cursor-grabbing touch-none z-10"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {/* Outer Platter Rim */}
          <div
            className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-full flex items-center justify-center shadow-2xl transition-all"
            style={{
              background: 'radial-gradient(circle, #1a2230 0%, #0d121a 70%, #05070a 100%)',
              border: `4px solid ${accentColor}40`,
              boxShadow: isPlaying
                ? `0 0 35px ${accentColor}35, inset 0 0 20px rgba(0,0,0,0.8)`
                : 'inset 0 0 20px rgba(0,0,0,0.8)'
            }}
          >
            {/* Spinning Vinyl Record (Zero-CPU GPU CSS Transform) */}
            <div
              className={`w-[92%] h-[92%] rounded-full relative flex items-center justify-center overflow-hidden animate-vinyl-spin ${
                !isPlaying ? 'animate-vinyl-paused' : ''
              }`}
              style={{
                transform: scratchAngle ? `rotate(${scratchAngle}deg)` : undefined,
                background:
                  'radial-gradient(circle, #151515 0%, #090909 25%, #1c1c1c 45%, #080808 65%, #181818 85%, #050505 100%)',
                boxShadow: '0 0 15px rgba(0,0,0,0.9), inset 0 0 10px rgba(255,255,255,0.05)'
              }}
            >
              {/* Vinyl Groove Rings */}
              <div className="absolute inset-2 rounded-full border border-white/5 pointer-events-none" />
              <div className="absolute inset-5 rounded-full border border-white/5 pointer-events-none" />
              <div className="absolute inset-8 rounded-full border border-white/10 pointer-events-none" />
              <div className="absolute inset-11 rounded-full border border-white/5 pointer-events-none" />

              {/* Realistic vinyl light reflection sheen */}
              <div
                className="absolute inset-0 pointer-events-none rounded-full"
                style={{
                  background:
                    'conic-gradient(from 45deg, transparent 0deg, rgba(255,255,255,0.08) 45deg, transparent 90deg, transparent 180deg, rgba(255,255,255,0.08) 225deg, transparent 270deg)'
                }}
              />

              {/* Center Paper Label */}
              <div
                className="w-18 h-18 sm:w-20 sm:h-20 rounded-full p-1 flex items-center justify-center shadow-lg relative z-10 overflow-hidden"
                style={{
                  backgroundColor: accentColor,
                  border: '3px solid #111'
                }}
              >
                {deck.track?.thumbnail ? (
                  <img
                    src={deck.track.thumbnail}
                    alt="Center label"
                    className="w-full h-full object-cover rounded-full pointer-events-none opacity-90"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-slate-900 flex flex-col items-center justify-center text-center p-1">
                    <span className="text-[9px] font-black uppercase text-white tracking-widest">
                      MINI DJ
                    </span>
                    <span
                      className="text-[8px] font-bold font-mono"
                      style={{ color: accentColor }}
                    >
                      DECK {deckId}
                    </span>
                  </div>
                )}
                {/* Spindle hole */}
                <div className="absolute w-2.5 h-2.5 rounded-full bg-black border border-slate-600 shadow-inner z-20" />
              </div>
            </div>

            {/* Tonearm */}
            <div
              className={`absolute -top-2 -right-1 w-12 h-24 pointer-events-none transition-transform duration-500 ease-out origin-top-right ${
                isPlaying ? 'rotate-12' : '-rotate-6'
              }`}
            >
              <div className="absolute top-0 right-1 w-4 h-4 rounded-full bg-slate-600 border-2 border-slate-400 shadow-md" />
              <div className="absolute top-2.5 right-2 w-1 h-18 bg-gradient-to-b from-slate-400 to-slate-200 shadow rounded" />
              <div
                className="absolute bottom-3 right-0.5 w-3.5 h-5 rounded-sm shadow-md"
                style={{ backgroundColor: accentColor }}
              />
            </div>

            {/* Center Play Button Overlay */}
            <button
              onClick={() => togglePlayDeck(deckId)}
              className="absolute inset-0 m-auto w-12 h-12 rounded-full z-20 opacity-0 group-hover:opacity-100 bg-black/70 backdrop-blur-sm flex items-center justify-center text-white transition-opacity shadow-lg"
              title={isPlaying ? 'Pausar' : 'Reproducir'}
            >
              {isPlaying ? (
                <div className="w-3.5 h-3.5 bg-white rounded-xs" />
              ) : (
                <div
                  className="w-0 h-0 border-y-6 border-y-transparent border-l-10 border-l-white ml-0.5"
                  style={{ borderLeftColor: accentColor }}
                />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
