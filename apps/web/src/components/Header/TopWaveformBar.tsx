import React, { useRef, useEffect, useState } from 'react';
import { Heart, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';
import { useDjStore } from '../../stores/useDjStore';
import { formatTime } from '../../utils/formatTime';

export const TopWaveformBar: React.FC = () => {
  const { deckA, deckB, seekDeck, setPlaybackRate, syncBpm } = useDjStore();
  const canvasRefA = useRef<HTMLCanvasElement | null>(null);
  const canvasRefB = useRef<HTMLCanvasElement | null>(null);

  const [heartA, setHeartA] = useState(false);
  const [heartB, setHeartB] = useState(false);

  // Store latest state in ref to avoid re-creating requestAnimationFrame on every time update
  const stateRef = useRef({ deckA, deckB });
  stateRef.current = { deckA, deckB };

  const effectiveBpmA = deckA.manualBpm || deckA.bpm || 124;
  const currentBpm = Math.round(effectiveBpmA * deckA.playbackRate);

  // Smooth 60fps canvas render loop with ZERO React component re-renders
  useEffect(() => {
    let animId: number;

    const renderWaveforms = () => {
      const { deckA: dA, deckB: dB } = stateRef.current;

      // 1. Deck A Waveform (Orange)
      const cA = canvasRefA.current;
      if (cA) {
        const ctx = cA.getContext('2d');
        if (ctx) {
          const w = cA.width;
          const h = cA.height;
          ctx.clearRect(0, 0, w, h);

          // Center guide line
          ctx.strokeStyle = '#1e2837';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, h / 2);
          ctx.lineTo(w, h / 2);
          ctx.stroke();

          const durationA = dA.duration || 180;
          const currentA = dA.currentTime;
          const progressA = Math.min(1.0, currentA / durationA);
          const playheadX = progressA * w;

          const numBars = 100;
          const barW = w / numBars;

          for (let i = 0; i < numBars; i++) {
            const x = i * barW;
            const seed = Math.sin(i * 0.4) * Math.cos(i * 0.2);
            const peak = Math.max(0.15, Math.abs(seed) * (h * 0.42));

            ctx.fillStyle = x <= playheadX ? '#FF6B00' : '#3e4c62';
            ctx.fillRect(x, h / 2 - peak, Math.max(1, barW - 1), peak * 2);

            if (i % 8 === 0) {
              ctx.fillStyle = '#ffffff25';
              ctx.fillRect(x, 0, 1, h);
            }
          }

          // Glowing white playhead
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.moveTo(playheadX, 0);
          ctx.lineTo(playheadX, h);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }

      // 2. Deck B Waveform (Hot Pink)
      const cB = canvasRefB.current;
      if (cB) {
        const ctx = cB.getContext('2d');
        if (ctx) {
          const w = cB.width;
          const h = cB.height;
          ctx.clearRect(0, 0, w, h);

          ctx.strokeStyle = '#1e2837';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, h / 2);
          ctx.lineTo(w, h / 2);
          ctx.stroke();

          const durationB = dB.duration || 180;
          const currentB = dB.currentTime;
          const progressB = Math.min(1.0, currentB / durationB);
          const playheadX = progressB * w;

          const numBars = 100;
          const barW = w / numBars;

          for (let i = 0; i < numBars; i++) {
            const x = i * barW;
            const seed = Math.sin(i * 0.35 + 2) * Math.cos(i * 0.25);
            const peak = Math.max(0.15, Math.abs(seed) * (h * 0.42));

            ctx.fillStyle = x <= playheadX ? '#FF0055' : '#3e4c62';
            ctx.fillRect(x, h / 2 - peak, Math.max(1, barW - 1), peak * 2);

            if (i % 8 === 0) {
              ctx.fillStyle = '#ffffff25';
              ctx.fillRect(x, 0, 1, h);
            }
          }

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.moveTo(playheadX, 0);
          ctx.lineTo(playheadX, h);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }

      animId = requestAnimationFrame(renderWaveforms);
    };

    animId = requestAnimationFrame(renderWaveforms);
    return () => cancelAnimationFrame(animId);
  }, []); // Run animation loop once, always reading fresh state from stateRef

  const handleSeekA = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRefA.current;
    if (!canvas || !deckA.track) return;
    const rect = canvas.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seekDeck('A', frac * (deckA.duration || 180));
  };

  const handleSeekB = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRefB.current;
    if (!canvas || !deckB.track) return;
    const rect = canvas.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seekDeck('B', frac * (deckB.duration || 180));
  };

  const handleBpmStep = (delta: number) => {
    const newRate = Math.max(0.5, Math.min(2.0, deckA.playbackRate + delta * 0.01));
    setPlaybackRate('A', newRate);
    setPlaybackRate('B', newRate);
  };

  return (
    <div className="w-full bg-[#0a0d14] border-b border-[#20293a] px-3 py-1.5 flex flex-col md:flex-row items-center gap-2 select-none shadow-xl">
      {/* 1. Left Side: Deck A Track Info & Waveform */}
      <div className="flex-1 w-full flex flex-col gap-1 min-w-0">
        <div className="flex items-center justify-between text-xs px-1">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[#FF6B00] shrink-0" />
            <span
              className="font-bold text-white truncate max-w-[200px] sm:max-w-xs text-[11px]"
              title={deckA.track?.title || 'Plato A'}
            >
              {deckA.track?.title || 'Plato A: Carga una canción'}
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400 shrink-0">
            <span>{formatTime(deckA.currentTime)} / {formatTime(deckA.duration)}</span>
            <button
              onClick={() => setHeartA(!heartA)}
              className="hover:scale-110 transition-transform"
              title="Favorito"
            >
              <Heart
                className={`w-3.5 h-3.5 ${heartA ? 'fill-[#FF6B00] text-[#FF6B00]' : 'text-slate-500'}`}
              />
            </button>
          </div>
        </div>

        {/* Deck A Waveform Bar */}
        <div className="w-full h-8 bg-[#111622] rounded-lg border border-[#232c3d] relative overflow-hidden cursor-pointer group">
          <canvas
            ref={canvasRefA}
            width={600}
            height={32}
            onClick={handleSeekA}
            className="w-full h-full block"
          />
        </div>
      </div>

      {/* 2. Center: YouDJ Tempo & AutoBpm Centerpiece */}
      <div className="flex items-center gap-3 px-3 py-1 bg-[#131924] rounded-xl border border-[#273247] shadow-inner shrink-0">
        <div
          onClick={() => syncBpm('A', 'B')}
          className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF6B00] to-[#FF0055] p-0.5 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
          title="Sincronizar tempo de ambos platos (SYNC)"
        >
          <div className="w-full h-full bg-[#0a0d14] rounded-full flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1">
            <span className="text-base font-black font-mono text-white tracking-wider">
              {currentBpm}
            </span>
            <span className="text-[10px] font-bold text-slate-400 font-mono">BPM</span>
            <div className="flex flex-col -my-1 ml-0.5">
              <button
                onClick={() => handleBpmStep(1)}
                className="text-slate-400 hover:text-white"
                title="Aumentar tempo +1%"
              >
                <ChevronUp className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleBpmStep(-1)}
                className="text-slate-400 hover:text-white"
                title="Reducir tempo -1%"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>
          <span className="text-[8px] font-extrabold uppercase tracking-widest text-[#FF6B00] -mt-0.5">
            AUTO BPM
          </span>
        </div>
      </div>

      {/* 3. Right Side: Deck B Track Info & Waveform */}
      <div className="flex-1 w-full flex flex-col gap-1 min-w-0">
        <div className="flex items-center justify-between text-xs px-1">
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400 shrink-0">
            <button
              onClick={() => setHeartB(!heartB)}
              className="hover:scale-110 transition-transform"
              title="Favorito"
            >
              <Heart
                className={`w-3.5 h-3.5 ${heartB ? 'fill-[#FF0055] text-[#FF0055]' : 'text-slate-500'}`}
              />
            </button>
            <span>{formatTime(deckB.currentTime)} / {formatTime(deckB.duration)}</span>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="font-bold text-white truncate max-w-[200px] sm:max-w-xs text-[11px] text-right"
              title={deckB.track?.title || 'Plato B'}
            >
              {deckB.track?.title || 'Plato B: Carga una canción'}
            </span>
            <span className="w-2 h-2 rounded-full bg-[#FF0055] shrink-0" />
          </div>
        </div>

        {/* Deck B Waveform Bar */}
        <div className="w-full h-8 bg-[#111622] rounded-lg border border-[#232c3d] relative overflow-hidden cursor-pointer group">
          <canvas
            ref={canvasRefB}
            width={600}
            height={32}
            onClick={handleSeekB}
            className="w-full h-full block"
          />
        </div>
      </div>
    </div>
  );
};
