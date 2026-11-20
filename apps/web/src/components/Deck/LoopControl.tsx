import React from 'react';
import { DeckId } from '../../types';
import { useDjStore } from '../../stores/useDjStore';
import { Repeat } from 'lucide-react';

interface LoopControlProps {
  deckId: DeckId;
  accentColor: string;
}

export const LoopControl: React.FC<LoopControlProps> = ({ deckId, accentColor }) => {
  const deck = useDjStore((s) => (deckId === 'A' ? s.deckA : s.deckB));
  const { setLoop } = useDjStore();

  const effectiveBpm = deck.manualBpm || deck.bpm || 120; // default 120 if unanalyzed

  const handleToggleLoopBeats = (beats: 1 | 2 | 4 | 8) => {
    if (deck.loop && deck.loop.active && deck.loop.beats === beats) {
      // Deactivate loop
      setLoop(deckId, null);
      return;
    }

    const beatDurationSec = 60 / effectiveBpm;
    const loopDuration = beatDurationSec * beats;
    const startTime = deck.currentTime;
    const endTime = startTime + loopDuration;

    setLoop(deckId, {
      active: true,
      beats,
      startTime,
      endTime
    });
  };

  const handleExitLoop = () => {
    setLoop(deckId, null);
  };

  return (
    <div className="bg-[#0B101A] p-2.5 rounded-xl border border-[#2A384F] flex flex-col gap-2">
      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
        <span className="flex items-center gap-1.5">
          <Repeat className="w-3.5 h-3.5" style={{ color: accentColor }} />
          Loops
        </span>
        {deck.loop?.active && (
          <button
            onClick={handleExitLoop}
            className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 hover:bg-red-500/40 font-bold transition-colors"
          >
            SALIR
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {([1, 2, 4, 8] as const).map((beats) => {
          const isActive = deck.loop?.active && deck.loop.beats === beats;
          return (
            <button
              key={beats}
              onClick={() => handleToggleLoopBeats(beats)}
              className={`py-1.5 rounded-lg text-xs font-bold transition-all border ${
                isActive
                  ? 'text-black shadow-md border-transparent font-extrabold'
                  : 'bg-[#1C2638] text-slate-300 border-[#2A384F] hover:border-slate-500 hover:text-white'
              }`}
              style={{
                backgroundColor: isActive ? accentColor : undefined
              }}
            >
              {beats}
            </button>
          );
        })}
      </div>
    </div>
  );
};
