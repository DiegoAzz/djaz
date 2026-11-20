import React, { useRef, useEffect } from 'react';
import { DeckId } from '../../types';
import { useDjStore } from '../../stores/useDjStore';
import { localAudioEngine } from '../../engines/LocalAudioEngine';

interface WaveformCanvasProps {
  deckId: DeckId;
  accentColor: string;
}

export const WaveformCanvas: React.FC<WaveformCanvasProps> = ({ deckId, accentColor }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const deck = useDjStore((s) => (deckId === 'A' ? s.deckA : s.deckB));
  const { seekDeck } = useDjStore();

  const peaksRef = useRef<{ min: number[]; max: number[] } | null>(null);

  // Extract peaks when audio buffer changes
  useEffect(() => {
    if (deck.track?.audioBuffer) {
      peaksRef.current = localAudioEngine.extractWaveformPeaks(deck.track.audioBuffer, 800);
    } else {
      peaksRef.current = null;
    }
  }, [deck.track?.audioBuffer]);

  // Render loop
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const midY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Background grid / centerline
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(width, midY);
      ctx.stroke();

      const peaks = peaksRef.current;
      const duration = deck.duration || (deck.track?.duration ?? 0);
      const currentTime = deck.currentTime;

      if (peaks && duration > 0) {
        const numBars = peaks.min.length;
        const barWidth = width / numBars;
        const progressFrac = Math.min(1.0, currentTime / duration);
        const playheadX = progressFrac * width;

        // Draw loop overlay if active
        if (deck.loop && deck.loop.active) {
          const loopStartX = (deck.loop.startTime / duration) * width;
          const loopEndX = (deck.loop.endTime / duration) * width;
          ctx.fillStyle = `${accentColor}25`;
          ctx.fillRect(loopStartX, 0, Math.max(2, loopEndX - loopStartX), height);

          ctx.strokeStyle = accentColor;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(loopStartX, 0);
          ctx.lineTo(loopStartX, height);
          ctx.moveTo(loopEndX, 0);
          ctx.lineTo(loopEndX, height);
          ctx.stroke();
        }

        // Draw waveform bars
        for (let i = 0; i < numBars; i++) {
          const x = i * barWidth;
          const minVal = peaks.min[i];
          const maxVal = peaks.max[i];

          const top = midY - maxVal * (height * 0.45);
          const bottom = midY - minVal * (height * 0.45);
          const barHeight = Math.max(1, bottom - top);

          // Color: played section is bright accent, unplayed is darker
          if (x <= playheadX) {
            ctx.fillStyle = accentColor;
          } else {
            ctx.fillStyle = '#334155';
          }

          ctx.fillRect(x, top, Math.max(1, barWidth - 0.5), barHeight);
        }

        // Draw Cue marker if set
        if (deck.cuePoint !== null && deck.cuePoint >= 0) {
          const cueX = (deck.cuePoint / duration) * width;
          ctx.fillStyle = '#F59E0B'; // Amber
          ctx.beginPath();
          ctx.moveTo(cueX - 4, 0);
          ctx.lineTo(cueX + 4, 0);
          ctx.lineTo(cueX, 8);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#F59E0B';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(cueX, 8);
          ctx.lineTo(cueX, height);
          ctx.stroke();
        }

        // Draw playhead cursor line
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#FFFFFF';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(playheadX, 0);
        ctx.lineTo(playheadX, height);
        ctx.stroke();
        ctx.shadowBlur = 0; // reset
      } else {
        // Placeholder animated grid when no file loaded
        ctx.fillStyle = '#475569';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Forma de onda real del audio cargado', width / 2, midY + 4);
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [deck.track, deck.duration, deck.currentTime, deck.loop, deck.cuePoint, accentColor]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !deck.track) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const frac = Math.max(0, Math.min(1, clickX / rect.width));
    const targetSeconds = frac * deck.duration;

    seekDeck(deckId, targetSeconds);
  };

  return (
    <div className="w-full h-24 bg-[#0B101A] rounded-xl border border-[#2A384F] relative overflow-hidden group cursor-pointer">
      <canvas
        ref={canvasRef}
        width={700}
        height={96}
        onClick={handleCanvasClick}
        className="w-full h-full block"
      />
      <div className="absolute top-1.5 right-2 px-1.5 py-0.5 rounded bg-black/60 text-[10px] font-mono text-slate-400 pointer-events-none">
        Click para saltar
      </div>
    </div>
  );
};
