import React, { useEffect, useState } from 'react';
import { useDjStore } from '../../stores/useDjStore';
import { localAudioEngine } from '../../engines/LocalAudioEngine';
import { Sparkles, StopCircle, Gamepad2, Sliders, Maximize2, Minimize2 } from 'lucide-react';
import { ActiveDjCenterGame } from '../Game/ActiveDjCenterGame';
import { MasterSpectrumVisualizer } from './MasterSpectrumVisualizer';

export const Mixer: React.FC = () => {
  const {
    crossfader,
    setCrossfader,
    centerCrossfader,
    transition,
    startAutoTransition,
    cancelAutoTransition
  } = useDjStore();

  const [vuLevelA, setVuLevelA] = useState(0);
  const [vuLevelB, setVuLevelB] = useState(0);
  const [transitionDuration, setTransitionDuration] = useState<5 | 10 | 15>(10);
  const [centerView, setCenterView] = useState<'game' | 'meters'>('game');
  const [isGameExpanded, setIsGameExpanded] = useState(false);

  const effectiveVolA = useDjStore((s) => s.deckA.effectiveVolume);
  const effectiveVolB = useDjStore((s) => s.deckB.effectiveVolume);

  // Decoupled 10 FPS metering interval reading from store snapshot (zero timer churn)
  useEffect(() => {
    const interval = setInterval(() => {
      const state = useDjStore.getState();
      if (state.appMode === 'local') {
        setVuLevelA(localAudioEngine.getAudioLevel('A'));
        setVuLevelB(localAudioEngine.getAudioLevel('B'));
      } else {
        const isPlayingA = state.deckA.state === 'PLAYING';
        const isPlayingB = state.deckB.state === 'PLAYING';
        setVuLevelA(isPlayingA ? (state.deckA.effectiveVolume / 100) * 0.9 : 0);
        setVuLevelB(isPlayingB ? (state.deckB.effectiveVolume / 100) * 0.9 : 0);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleCrossfaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (transition.isTransitioning) {
      cancelAutoTransition();
    }
    setCrossfader(parseFloat(e.target.value));
  };

  const handleToggleAutoMix = () => {
    if (transition.isTransitioning) {
      cancelAutoTransition();
      return;
    }
    const target = crossfader <= 0 ? 'B' : 'A';
    startAutoTransition(target, transitionDuration);
  };

  const renderMeterBars = (level: number, color: string) => {
    const totalBars = 10;
    const activeBars = Math.round(level * totalBars);

    return (
      <div className="flex flex-col-reverse gap-0.5 h-28 w-2 bg-[#0a0d14] p-0.5 rounded-full border border-[#242f42]">
        {Array.from({ length: totalBars }).map((_, i) => {
          const isActive = i < activeBars;
          let barColor = color;
          if (i >= 8) barColor = '#EF4444';
          else if (i >= 6) barColor = '#F59E0B';

          return (
            <div
              key={i}
              className="w-full h-2 rounded-xs transition-all duration-100"
              style={{
                backgroundColor: isActive ? barColor : '#1e2837',
                boxShadow: isActive ? `0 0 6px ${barColor}` : 'none'
              }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full lg:w-72 xl:w-80 bg-[#121722] rounded-2xl border border-[#242f42] p-3 flex flex-col justify-between gap-2.5 shadow-2xl select-none shrink-0">
      {/* 1. Header: TikTok Live Badge & View Selector */}
      <div className="flex items-center justify-between border-b border-[#242f42] pb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          <span className="text-[11px] font-black tracking-wider text-red-400 uppercase flex items-center gap-1">
            TIKTOK LIVE
          </span>
        </div>

        {/* View Switcher: Game or Full Meters + Expand Toggle */}
        <div className="flex items-center gap-1">
          <div className="flex items-center bg-[#090d14] p-0.5 rounded-lg border border-[#242f42]">
            <button
              onClick={() => setCenterView('game')}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all ${
                centerView === 'game'
                  ? 'bg-gradient-to-r from-[#FF6B00] to-[#FF0055] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Juego casual interactivo para transmisiones en vivo"
            >
              <Gamepad2 className="w-3 h-3" />
              <span>JUEGO</span>
            </button>
            <button
              onClick={() => setCenterView('meters')}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all ${
                centerView === 'meters'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Ver vúmetros y niveles tradicionales"
            >
              <Sliders className="w-3 h-3" />
              <span>NIVELES</span>
            </button>
          </div>

          {centerView === 'game' && (
            <button
              onClick={() => setIsGameExpanded(!isGameExpanded)}
              className="p-1 rounded-md bg-[#090d14] text-slate-400 hover:text-white border border-[#242f42] transition-colors"
              title={isGameExpanded ? 'Tamaño normal' : 'Agrandar juego'}
            >
              {isGameExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>

      {/* 2. Middle Section: Casual Live Game OR Full VU Meters */}
      {centerView === 'game' ? (
        <div className={`w-full flex-1 flex flex-col justify-center transition-all ${isGameExpanded ? 'scale-105 my-1' : ''}`}>
          <ActiveDjCenterGame />
        </div>
      ) : (
        <div className="flex items-center justify-center gap-6 py-2">
          {/* Deck A Level */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-black text-[#FF6B00]">DECK A</span>
            {renderMeterBars(vuLevelA, '#FF6B00')}
            <span className="text-[9px] font-mono text-slate-400">
              {Math.round(effectiveVolA)}%
            </span>
          </div>

          {/* Center Divider */}
          <div className="flex flex-col items-center justify-center text-slate-600 gap-2">
            <div className="w-px h-10 bg-[#242f42]" />
            <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase -rotate-90">
              LEVEL
            </span>
            <div className="w-px h-10 bg-[#242f42]" />
          </div>

          {/* Deck B Level */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-black text-[#FF0055]">DECK B</span>
            {renderMeterBars(vuLevelB, '#FF0055')}
            <span className="text-[9px] font-mono text-slate-400">
              {Math.round(effectiveVolB)}%
            </span>
          </div>
        </div>
      )}

      {/* 3. Auto Mix Button with Transition Selector */}
      <div className="space-y-1.5 pt-1 border-t border-[#1e2837]/60">
        <button
          onClick={handleToggleAutoMix}
          className={`w-full py-2.5 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 ${
            transition.isTransitioning
              ? 'bg-red-600 text-white animate-pulse shadow-red-500/50'
              : 'bg-gradient-to-r from-[#FF6B00] to-[#FF0055] text-white shadow-[#FF6B00]/20 hover:brightness-110'
          }`}
        >
          {transition.isTransitioning ? (
            <>
              <StopCircle className="w-4 h-4" />
              <span>DETENER AUTO MIX</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 fill-white" />
              <span>AUTO MIX ({transitionDuration}S)</span>
            </>
          )}
        </button>

        {/* Transition Duration Selector Pills */}
        <div className="flex items-center justify-between gap-1 bg-[#090d14] p-1 rounded-xl border border-[#242f42]">
          {[5, 10, 15].map((sec) => (
            <button
              key={sec}
              onClick={() => setTransitionDuration(sec as 5 | 10 | 15)}
              className={`flex-1 py-1 rounded-lg text-[10px] font-black transition-all ${
                transitionDuration === sec
                  ? 'bg-[#1e2837] text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {sec}s
            </button>
          ))}
        </div>
      </div>

      {/* 4. Horizontal Crossfader */}
      <div className="space-y-1 pt-1">
        <div className="flex justify-between items-center text-[10px] font-bold">
          <span className="text-[#FF6B00]">A</span>
          <button
            onClick={centerCrossfader}
            className="text-[9px] px-1.5 py-0.5 rounded bg-[#1e2837] hover:bg-[#2e3d55] text-slate-300 font-mono transition-colors"
            title="Centrar crossfader [C]"
          >
            [ CENTRO ]
          </button>
          <span className="text-[#FF0055]">B</span>
        </div>

        <div className="relative flex items-center">
          <input
            type="range"
            min="-1"
            max="1"
            step="0.01"
            value={crossfader}
            onChange={handleCrossfaderChange}
            className="w-full h-5 bg-[#090d14] rounded-lg appearance-none cursor-ew-resize border border-[#242f42] accent-[#00B8FF] focus:outline-none"
          />
        </div>

        {/* Mini Volume Indicators under Crossfader */}
        <div className="flex justify-between text-[9px] font-mono text-slate-500 px-0.5">
          <span>{Math.round(effectiveVolA)}%</span>
          <span className="text-[8px] text-slate-600">[X] / [V]</span>
          <span>{Math.round(effectiveVolB)}%</span>
        </div>
      </div>

      {/* 5. Master Output Audio Spectrum Visualizer (Fills bottom gap aligned with EQ boxes) */}
      <MasterSpectrumVisualizer />
    </div>
  );
};
