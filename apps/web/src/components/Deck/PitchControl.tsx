import React from 'react';
import { DeckId } from '../../types';
import { useDjStore } from '../../stores/useDjStore';
import { Zap, RotateCcw } from 'lucide-react';

interface PitchControlProps {
  deckId: DeckId;
  accentColor: string;
}

export const PitchControl: React.FC<PitchControlProps> = ({ deckId, accentColor }) => {
  const isDeckA = deckId === 'A';
  const otherDeckId = isDeckA ? 'B' : 'A';

  const deck = useDjStore((s) => (isDeckA ? s.deckA : s.deckB));
  const otherDeck = useDjStore((s) => (isDeckA ? s.deckB : s.deckA));
  const { setPlaybackRate, setPitchRange, syncBpm } = useDjStore();

  const currentRate = deck.playbackRate;
  const pitchPercent = Math.round((currentRate - 1.0) * 100 * 10) / 10;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value); // -8 to +8 (or up to pitchRange)
    const newRate = 1.0 + val / 100;
    setPlaybackRate(deckId, newRate);
  };

  const handleResetPitch = () => {
    setPlaybackRate(deckId, 1.0);
  };

  const handleNudge = (delta: number) => {
    setPlaybackRate(deckId, Math.max(0.5, Math.min(2.0, currentRate + delta)));
  };

  const effectiveBpm = deck.manualBpm || deck.bpm;
  const otherEffectiveBpm = otherDeck.manualBpm || otherDeck.bpm;

  return (
    <div className="bg-[#0B101A] p-2.5 rounded-xl border border-[#2A384F] flex flex-col gap-2">
      {/* BPM Header & Sync */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] text-slate-400 font-semibold block uppercase">Tempo</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold font-mono text-white tracking-wider">
              {effectiveBpm ? (effectiveBpm * currentRate).toFixed(1) : '--.-'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">BPM</span>
          </div>
        </div>

        {/* Sync Button */}
        <button
          onClick={() => syncBpm(otherDeckId, deckId)}
          disabled={!effectiveBpm || !otherEffectiveBpm}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1C2638] hover:bg-[#2A384F] border border-[#2A384F] text-xs font-bold text-slate-300 hover:text-white transition-all disabled:opacity-40 disabled:pointer-events-none"
          title={`Sincronizar BPM con el Plato ${otherDeckId}`}
        >
          <Zap className="w-3.5 h-3.5" style={{ color: accentColor }} />
          SYNC
        </button>
      </div>

      {/* Pitch Slider */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleNudge(-0.01)}
          className="w-6 h-6 rounded bg-[#1C2638] hover:bg-[#2A384F] text-slate-300 text-xs font-bold flex items-center justify-center"
          title="Empujar tempo -1%"
        >
          -
        </button>

        <input
          type="range"
          min={-deck.pitchRange}
          max={deck.pitchRange}
          step="0.1"
          value={pitchPercent}
          onChange={handleSliderChange}
          onDoubleClick={handleResetPitch}
          className="flex-1 h-2 bg-[#1C2638] rounded-lg appearance-none cursor-pointer"
          style={{ accentColor }}
        />

        <button
          onClick={() => handleNudge(0.01)}
          className="w-6 h-6 rounded bg-[#1C2638] hover:bg-[#2A384F] text-slate-300 text-xs font-bold flex items-center justify-center"
          title="Acelerar tempo +1%"
        >
          +
        </button>
      </div>

      {/* Pitch Info & Range */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
        <button
          onClick={handleResetPitch}
          className="flex items-center gap-1 hover:text-white transition-colors"
          title="Restablecer velocidad a 0%"
        >
          <RotateCcw className="w-2.5 h-2.5" />
          <span>{pitchPercent >= 0 ? `+${pitchPercent.toFixed(1)}%` : `${pitchPercent.toFixed(1)}%`}</span>
        </button>

        {/* Range Selector */}
        <div className="flex items-center gap-1 text-[9px]">
          {([8, 16, 50] as const).map((range) => (
            <button
              key={range}
              onClick={() => setPitchRange(deckId, range)}
              className={`px-1.5 py-0.5 rounded font-bold ${
                deck.pitchRange === range
                  ? 'bg-slate-700 text-white'
                  : 'bg-[#1C2638] text-slate-500 hover:text-slate-300'
              }`}
            >
              ±{range}%
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
