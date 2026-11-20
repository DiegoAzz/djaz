import React from 'react';
import { DeckId } from '../../types';
import { useDjStore } from '../../stores/useDjStore';

interface EQSectionProps {
  deckId: DeckId;
  accentColor: string;
}

export const EQSection: React.FC<EQSectionProps> = ({ deckId, accentColor }) => {
  const deck = useDjStore((s) => (deckId === 'A' ? s.deckA : s.deckB));
  const { setEQ, setFilter } = useDjStore();

  const handleLowChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEQ(deckId, { low: parseFloat(e.target.value) });
  };
  const handleMidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEQ(deckId, { mid: parseFloat(e.target.value) });
  };
  const handleHighChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEQ(deckId, { high: parseFloat(e.target.value) });
  };

  const handleKillLow = () => {
    setEQ(deckId, { low: deck.eq.low === -24 ? 0 : -24 });
  };
  const handleKillMid = () => {
    setEQ(deckId, { mid: deck.eq.mid === -24 ? 0 : -24 });
  };
  const handleKillHigh = () => {
    setEQ(deckId, { high: deck.eq.high === -24 ? 0 : -24 });
  };

  // Filter knob: -100 (full LPF) to 0 (flat/off) to +100 (full HPF)
  const currentFilterValue =
    !deck.filter.active || deck.filter.type === 'none'
      ? 0
      : deck.filter.type === 'lpf'
      ? -Math.round((1 - deck.filter.cutoff / 20000) * 100)
      : Math.round((deck.filter.cutoff / 10000) * 100);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (val === 0) {
      setFilter(deckId, { active: false, type: 'none', cutoff: 20000 });
    } else if (val < 0) {
      // LPF: 20000Hz down to 200Hz
      const frac = (100 + val) / 100; // 1 down to 0
      const cutoff = Math.max(200, 200 + frac * 19800);
      setFilter(deckId, { active: true, type: 'lpf', cutoff });
    } else {
      // HPF: 20Hz up to 8000Hz
      const frac = val / 100; // 0 up to 1
      const cutoff = Math.max(20, 20 + frac * 8000);
      setFilter(deckId, { active: true, type: 'hpf', cutoff });
    }
  };

  return (
    <div className="bg-[#0B101A] p-2.5 rounded-xl border border-[#2A384F] flex flex-col gap-2">
      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
        <span>Ecualizador 3-Bandas</span>
        <span className="text-[10px] text-slate-500 font-normal">Doble clic para reiniciar</span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {/* HIGH */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-semibold text-slate-300">HIGH</span>
          <input
            type="range"
            min="-24"
            max="12"
            step="0.5"
            value={deck.eq.high}
            onChange={handleHighChange}
            onDoubleClick={() => setEQ(deckId, { high: 0 })}
            className="w-full h-1.5 bg-[#1C2638] rounded-lg appearance-none cursor-pointer accent-[#00B8FF] my-2"
          />
          <div className="flex items-center justify-between w-full text-[9px] font-mono text-slate-400">
            <span>{deck.eq.high > 0 ? `+${deck.eq.high}` : deck.eq.high} dB</span>
            <button
              onClick={handleKillHigh}
              className={`px-1 py-0.5 rounded text-[8px] font-bold ${
                deck.eq.high <= -23 ? 'bg-red-500 text-white' : 'bg-[#1C2638] text-slate-400 hover:text-white'
              }`}
            >
              KILL
            </button>
          </div>
        </div>

        {/* MID */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-semibold text-slate-300">MID</span>
          <input
            type="range"
            min="-24"
            max="12"
            step="0.5"
            value={deck.eq.mid}
            onChange={handleMidChange}
            onDoubleClick={() => setEQ(deckId, { mid: 0 })}
            className="w-full h-1.5 bg-[#1C2638] rounded-lg appearance-none cursor-pointer accent-[#00B8FF] my-2"
          />
          <div className="flex items-center justify-between w-full text-[9px] font-mono text-slate-400">
            <span>{deck.eq.mid > 0 ? `+${deck.eq.mid}` : deck.eq.mid} dB</span>
            <button
              onClick={handleKillMid}
              className={`px-1 py-0.5 rounded text-[8px] font-bold ${
                deck.eq.mid <= -23 ? 'bg-red-500 text-white' : 'bg-[#1C2638] text-slate-400 hover:text-white'
              }`}
            >
              KILL
            </button>
          </div>
        </div>

        {/* LOW */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-semibold text-slate-300">LOW</span>
          <input
            type="range"
            min="-24"
            max="12"
            step="0.5"
            value={deck.eq.low}
            onChange={handleLowChange}
            onDoubleClick={() => setEQ(deckId, { low: 0 })}
            className="w-full h-1.5 bg-[#1C2638] rounded-lg appearance-none cursor-pointer accent-[#00B8FF] my-2"
          />
          <div className="flex items-center justify-between w-full text-[9px] font-mono text-slate-400">
            <span>{deck.eq.low > 0 ? `+${deck.eq.low}` : deck.eq.low} dB</span>
            <button
              onClick={handleKillLow}
              className={`px-1 py-0.5 rounded text-[8px] font-bold ${
                deck.eq.low <= -23 ? 'bg-red-500 text-white' : 'bg-[#1C2638] text-slate-400 hover:text-white'
              }`}
            >
              KILL
            </button>
          </div>
        </div>
      </div>

      {/* FILTER LPF / HPF */}
      <div className="mt-1 pt-1.5 border-t border-[#1C2638] flex items-center justify-between gap-3">
        <span className="text-[10px] font-semibold text-slate-400 shrink-0">FILTER (LPF / HPF)</span>
        <input
          type="range"
          min="-100"
          max="100"
          value={currentFilterValue}
          onChange={handleFilterChange}
          onDoubleClick={() => setFilter(deckId, { active: false, type: 'none', cutoff: 20000 })}
          className="flex-1 h-1.5 bg-[#1C2638] rounded-lg appearance-none cursor-pointer my-1"
          style={{ accentColor }}
        />
        <span className="text-[10px] font-mono text-slate-300 w-12 text-right">
          {currentFilterValue === 0
            ? 'OFF'
            : currentFilterValue < 0
            ? `LP ${Math.abs(currentFilterValue)}%`
            : `HP ${currentFilterValue}%`}
        </span>
      </div>
    </div>
  );
};
