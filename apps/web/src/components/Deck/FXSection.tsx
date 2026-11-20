import React from 'react';
import { DeckId } from '../../types';
import { useDjStore } from '../../stores/useDjStore';
import { Sparkles, Radio } from 'lucide-react';

interface FXSectionProps {
  deckId: DeckId;
  accentColor: string;
}

export const FXSection: React.FC<FXSectionProps> = ({ deckId, accentColor }) => {
  const deck = useDjStore((s) => (deckId === 'A' ? s.deckA : s.deckB));
  const { setDelay, setReverb } = useDjStore();

  const toggleDelay = () => {
    setDelay(deckId, { active: !deck.delay.active });
  };

  const toggleReverb = () => {
    setReverb(deckId, { active: !deck.reverb.active });
  };

  return (
    <div className="bg-[#0B101A] p-2.5 rounded-xl border border-[#2A384F] flex flex-col gap-2">
      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" style={{ color: accentColor }} />
          Efectos DJ
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px]">
        {/* Delay / Echo */}
        <div className="bg-[#151D2B] p-2 rounded-lg border border-[#2A384F]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-slate-300 flex items-center gap-1">
              <Radio className="w-3 h-3 text-cyan-400" />
              Echo / Delay
            </span>
            <button
              onClick={toggleDelay}
              className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${
                deck.delay.active ? 'bg-cyan-500 text-black' : 'bg-[#1C2638] text-slate-400 hover:text-white'
              }`}
            >
              {deck.delay.active ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 text-[9px] w-6">Mix:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={deck.delay.mix}
              onChange={(e) => setDelay(deckId, { mix: parseFloat(e.target.value) })}
              className="flex-1 h-1 bg-[#1C2638] rounded appearance-none cursor-pointer accent-cyan-400"
            />
            <span className="font-mono text-slate-400 text-[9px] w-6 text-right">
              {Math.round(deck.delay.mix * 100)}%
            </span>
          </div>
        </div>

        {/* Reverb */}
        <div className="bg-[#151D2B] p-2 rounded-lg border border-[#2A384F]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-slate-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-400" />
              Reverb
            </span>
            <button
              onClick={toggleReverb}
              className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${
                deck.reverb.active ? 'bg-purple-500 text-white' : 'bg-[#1C2638] text-slate-400 hover:text-white'
              }`}
            >
              {deck.reverb.active ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 text-[9px] w-6">Mix:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={deck.reverb.mix}
              onChange={(e) => setReverb(deckId, { mix: parseFloat(e.target.value) })}
              className="flex-1 h-1 bg-[#1C2638] rounded appearance-none cursor-pointer accent-purple-400"
            />
            <span className="font-mono text-slate-400 text-[9px] w-6 text-right">
              {Math.round(deck.reverb.mix * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
