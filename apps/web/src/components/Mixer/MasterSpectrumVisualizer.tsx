import React, { useRef, useEffect } from 'react';
import { useDjStore } from '../../stores/useDjStore';
import { localAudioEngine } from '../../engines/LocalAudioEngine';
import { Activity } from 'lucide-react';

export const MasterSpectrumVisualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { deckA, deckB, crossfader, appMode } = useDjStore();

  const stateRef = useRef({ deckA, deckB, crossfader, appMode });
  stateRef.current = { deckA, deckB, crossfader, appMode };

  // Persistent peak array for smooth falling peak-hold indicators
  const peaksRef = useRef<number[]>(new Array(28).fill(0));
  const peakSpeedRef = useRef<number[]>(new Array(28).fill(0));

  useEffect(() => {
    let animId: number;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const numBars = 28;

    const render = () => {
      const { deckA: dA, deckB: dB, crossfader: cf, appMode: mode } = stateRef.current;
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Background subtle dark grid
      ctx.fillStyle = '#090d14';
      ctx.fillRect(0, 0, width, height);

      // Horizontal subtle guide decibel lines
      ctx.strokeStyle = '#161e2c';
      ctx.lineWidth = 1;
      for (let y = 18; y < height; y += 18) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const isPlayingA = dA.state === 'PLAYING';
      const isPlayingB = dB.state === 'PLAYING';
      const volA = isPlayingA ? dA.effectiveVolume / 100 : 0;
      const volB = isPlayingB ? dB.effectiveVolume / 100 : 0;
      const totalVol = Math.min(1.0, volA + volB);

      // Calculate beat phases for kicks and hi-hats
      const bpmA = dA.bpm || 124;
      const bpmB = dB.bpm || 124;
      const beatPhaseA = (dA.currentTime * (bpmA / 60)) % 1;
      const beatPhaseB = (dB.currentTime * (bpmB / 60)) % 1;

      // Kick impact pulse (peaks at 0 and decays sharply)
      const kickA = isPlayingA ? Math.max(0, 1 - beatPhaseA * 3.2) * volA : 0;
      const kickB = isPlayingB ? Math.max(0, 1 - beatPhaseB * 3.2) * volB : 0;
      const combinedKick = Math.max(kickA, kickB);

      // Snare / Offbeat impact
      const snareA = isPlayingA ? Math.max(0, 1 - Math.abs(beatPhaseA - 0.5) * 4) * volA : 0;
      const snareB = isPlayingB ? Math.max(0, 1 - Math.abs(beatPhaseB - 0.5) * 4) * volB : 0;
      const combinedSnare = Math.max(snareA, snareB);

      const nowSec = Date.now() / 1000;

      // Real frequency buffer from Web Audio API if in local mode
      let localFreqA: Uint8Array | null = null;
      let localFreqB: Uint8Array | null = null;
      if (mode === 'local') {
        localFreqA = localAudioEngine.getFrequencyData('A');
        localFreqB = localAudioEngine.getFrequencyData('B');
      }

      const barWidth = (width - (numBars - 1) * 2) / numBars;
      const maxHeight = height - 8;

      for (let i = 0; i < numBars; i++) {
        let value = 0;

        if (mode === 'local' && (localFreqA || localFreqB)) {
          // Read from real FFT frequency analysis
          const stepA = localFreqA ? Math.floor((i / numBars) * (localFreqA.length * 0.6)) : 0;
          const stepB = localFreqB ? Math.floor((i / numBars) * (localFreqB.length * 0.6)) : 0;
          const valA = localFreqA ? (localFreqA[stepA] / 255) * volA : 0;
          const valB = localFreqB ? (localFreqB[stepB] / 255) * volB : 0;
          value = Math.max(valA, valB);
        } else if (totalVol > 0.01) {
          // Realistic algorithmic spectrum synthesis matching real musical energy
          // Bass / Sub-bass (Bars 0 - 7)
          if (i < 7) {
            const bassEnvelope = Math.sin((i / 7) * Math.PI);
            const kickEnergy = combinedKick * 0.85;
            const subRumble = Math.sin(nowSec * 14 + i) * 0.15 + 0.2;
            value = (kickEnergy + subRumble * totalVol) * bassEnvelope * 1.25;
          }
          // Mid-range / Vocals / Synth (Bars 7 - 19)
          else if (i < 20) {
            const midFreq = Math.sin(nowSec * 8 + i * 0.9);
            const vocalRise = Math.cos(nowSec * 5 + i * 0.6) * 0.25;
            const snareBounce = combinedSnare * 0.5;
            value = (0.35 + midFreq * 0.25 + vocalRise + snareBounce) * totalVol;
          }
          // Highs / Hi-hats / Air (Bars 20 - 27)
          else {
            const hiHatNoise = (Math.sin(nowSec * 28 + i * 3.5) * 0.5 + 0.5) * 0.45;
            const shimmer = Math.cos(nowSec * 16 + i) * 0.2;
            value = (0.2 + hiHatNoise + shimmer) * totalVol * 0.85;
          }

          // Balance across crossfader: left bars favor Deck A, right bars favor Deck B
          const balanceWeight = (cf + 1) / 2; // 0 = full A, 1 = full B
          const barSide = i / (numBars - 1);
          const bias = (1 - Math.abs(balanceWeight - barSide)) * 0.3 + 0.7;
          value = Math.min(1.0, Math.max(0.04, value * bias));
        } else {
          // Idle low ambient baseline
          value = 0.04 + Math.sin(nowSec * 2 + i * 0.4) * 0.02;
        }

        const barH = Math.max(3, value * maxHeight);
        const x = i * (barWidth + 2);
        const y = height - barH;

        // Dynamic DJ Gradient: Orange (#FF6B00) on left -> Cyan (#00B8FF) in center -> Pink (#FF0055) on right
        const grad = ctx.createLinearGradient(0, height, 0, y);
        if (i < numBars * 0.4) {
          // Deck A Orange zone
          grad.addColorStop(0, '#FF6B00');
          grad.addColorStop(0.7, '#FFA34D');
          grad.addColorStop(1, '#FFE3B3');
        } else if (i < numBars * 0.65) {
          // Center Cyan / White zone
          grad.addColorStop(0, '#00B8FF');
          grad.addColorStop(0.6, '#38BDF8');
          grad.addColorStop(1, '#E0F2FE');
        } else {
          // Deck B Pink zone
          grad.addColorStop(0, '#FF0055');
          grad.addColorStop(0.7, '#FF4D88');
          grad.addColorStop(1, '#FFD1E0');
        }

        ctx.fillStyle = grad;
        ctx.fillRect(x, y, barWidth, barH);

        // Individual segment lines for hardware audio processor look
        ctx.fillStyle = '#090d14';
        for (let seg = y + 4; seg < height; seg += 5) {
          ctx.fillRect(x, seg, barWidth, 1.2);
        }

        // Peak Hold indicator logic (gravity drop)
        if (y < peaksRef.current[i] || peaksRef.current[i] === 0) {
          peaksRef.current[i] = y;
          peakSpeedRef.current[i] = 0;
        } else {
          peakSpeedRef.current[i] += 0.28; // gravity
          peaksRef.current[i] += peakSpeedRef.current[i];
          if (peaksRef.current[i] > height - 4) {
            peaksRef.current[i] = height - 4;
          }
        }

        // Render peak hold dot
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = '#00B8FF';
        ctx.shadowBlur = 4;
        ctx.fillRect(x, peaksRef.current[i] - 2, barWidth, 2);
        ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="w-full bg-[#0a0e17] rounded-xl border border-[#242f42] p-2 flex flex-col gap-1.5 shadow-inner select-none mt-1">
      {/* Header Info Bar */}
      <div className="flex items-center justify-between text-[10px] font-mono border-b border-[#1b2535] pb-1 px-0.5">
        <div className="flex items-center gap-1.5 text-slate-300 font-bold">
          <Activity className="w-3.5 h-3.5 text-[#00B8FF] animate-pulse" />
          <span className="text-[9px] uppercase tracking-wider text-white">ESPECTRO MASTER</span>
        </div>
        <div className="flex items-center gap-2 text-[9px] text-slate-400">
          <span className="text-[#FF6B00] font-bold">L</span>
          <span className="text-slate-500">•</span>
          <span className="text-[#00B8FF] font-bold">60 FPS</span>
          <span className="text-slate-500">•</span>
          <span className="text-[#FF0055] font-bold">R</span>
        </div>
      </div>

      {/* Canvas Spectrum Display */}
      <div className="w-full h-14 sm:h-16 relative overflow-hidden rounded-lg bg-[#070a10]">
        <canvas
          ref={canvasRef}
          width={300}
          height={64}
          className="w-full h-full block"
        />
      </div>

      {/* Frequency Labels */}
      <div className="flex justify-between text-[8px] font-mono font-bold text-slate-500 px-1 pt-0.5">
        <span className="text-[#FF6B00]">SUB</span>
        <span>BASS</span>
        <span className="text-[#00B8FF]">MID</span>
        <span>HIGH</span>
        <span className="text-[#FF0055]">AIR</span>
      </div>
    </div>
  );
};
