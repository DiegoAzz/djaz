import React, { useRef } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Disc,
  Upload,
  Zap,
  Repeat
} from 'lucide-react';
import { DeckId } from '../../types';
import { useDjStore } from '../../stores/useDjStore';
import { VinylTurntable } from './VinylTurntable';
import { WaveformCanvas } from './WaveformCanvas';
import { EQSection } from './EQSection';
import { PitchControl } from './PitchControl';
import { localAudioEngine } from '../../engines/LocalAudioEngine';
import { formatTime } from '../../utils/formatTime';

interface DeckProps {
  deckId: DeckId;
}

export const Deck: React.FC<DeckProps> = ({ deckId }) => {
  const isDeckA = deckId === 'A';
  // YouDJ signature colors: Deck A Orange (#FF6B00 / #00B8FF), Deck B Pink (#FF0055 / #FF3D91)
  const accentColor = isDeckA ? '#FF6B00' : '#FF0055';
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    appMode,
    togglePlayDeck,
    cueDeck,
    setVolume,
    toggleMute,
    setTrack,
    setPlaybackState,
    setBpm,
    setLoop,
    syncBpm,
    setError
  } = useDjStore();

  const otherDeckId = isDeckA ? 'B' : 'A';
  const deck = useDjStore((s) => (isDeckA ? s.deckA : s.deckB));
  const isPlaying = deck.state === 'PLAYING';

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setPlaybackState(deckId, 'LOADING');
      const buffer = await localAudioEngine.decodeAudioFile(file);
      localAudioEngine.setBuffer(deckId, buffer);
      const detectedBpm = localAudioEngine.detectBpm(buffer);

      setTrack(deckId, {
        id: `local-${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'Archivo Local',
        duration: buffer.duration,
        durationFormatted: formatTime(buffer.duration),
        isLocal: true,
        audioBuffer: buffer,
        file
      });

      setBpm(deckId, detectedBpm);
      setPlaybackState(deckId, 'READY');
    } catch (err: any) {
      console.error('[Audio Decode Error]', err);
      setError(deckId, 'No se pudo decodificar el archivo de audio.');
    }
  };

  const handleLoopToggle = (beats: 1 | 2 | 4 | 8) => {
    if (deck.loop?.active && deck.loop.beats === beats) {
      setLoop(deckId, null);
      return;
    }

    const effectiveBpm = deck.manualBpm || deck.bpm || 120;
    const beatSec = (60 / effectiveBpm) * beats;
    const now = deck.currentTime;

    setLoop(deckId, {
      active: true,
      beats,
      startTime: now,
      endTime: now + beatSec
    });
  };

  return (
    <div
      className={`flex-1 bg-[#121722] rounded-2xl border p-3.5 flex flex-col gap-3 transition-all shadow-2xl ${
        isDeckA
          ? 'border-[#FF6B00]/30 hover:border-[#FF6B00]/60'
          : 'border-[#FF0055]/30 hover:border-[#FF0055]/60'
      }`}
    >
      {/* 1. Deck Header: Deck Badge & Track Name */}
      <div className="flex items-center justify-between border-b border-[#242f42] pb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="px-2.5 py-1 rounded-lg text-xs font-black tracking-wider uppercase flex items-center gap-1.5 shrink-0 shadow"
            style={{
              backgroundColor: `${accentColor}25`,
              color: accentColor,
              border: `1px solid ${accentColor}60`
            }}
          >
            <Disc className={`w-3.5 h-3.5 ${isPlaying ? 'animate-spin' : ''}`} />
            PLATO {deckId}
          </div>

          <div className="min-w-0">
            <h3
              className="text-xs sm:text-sm font-bold text-white truncate max-w-[200px] sm:max-w-xs"
              title={deck.track?.title || 'Sin pista cargada'}
            >
              {deck.track?.title || 'Sin pista cargada'}
            </h3>
            <p className="text-[10px] text-slate-400 truncate">
              {deck.track?.artist || 'Selecciona una canción en el buscador'}
            </p>
          </div>
        </div>

        {/* BPM and Status pill */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono font-bold text-slate-300 bg-[#0c1017] px-2 py-0.5 rounded border border-[#242f42]">
            {deck.bpm ? `${deck.bpm} BPM` : '-- BPM'}
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
              isPlaying
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse'
                : deck.state === 'LOADING'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {deck.state}
          </span>
        </div>
      </div>

      {/* 2. Main Deck Display: YouDJ Vinyl Turntable (or local waveform) */}
      <div className="space-y-2">
        <VinylTurntable deckId={deckId} accentColor={accentColor} />

        {/* Local mode waveform below vinyl if in local mode */}
        {appMode === 'local' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-[#0a0d14] px-2.5 py-1.5 rounded-lg border border-[#242f42]">
              <input
                type="file"
                ref={fileInputRef}
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold text-white bg-[#1a2333] hover:bg-[#253248] transition-all"
              >
                <Upload className="w-3 h-3" style={{ color: accentColor }} />
                {deck.track ? 'Cambiar archivo' : 'Cargar MP3/WAV'}
              </button>
              <span className="text-[10px] text-slate-400 font-mono">
                {deck.bpm ? `${deck.bpm} BPM detectado` : 'Análisis auto'}
              </span>
            </div>
            <WaveformCanvas deckId={deckId} accentColor={accentColor} />
          </div>
        )}
      </div>

      {/* 3. YouDJ Control Bar: CUE, PLAY, LOOPS, SYNC, PITCH */}
      <div className="flex items-center justify-between gap-2 bg-[#0c1017] p-2 rounded-xl border border-[#242f42]">
        {/* Left: Big Circular CUE & PLAY Buttons */}
        <div className="flex items-center gap-2">
          {/* CUE Button (Round Pioneer/YouDJ button) */}
          <button
            onClick={() => cueDeck(deckId)}
            className="w-12 h-12 rounded-full bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-black font-black text-xs border-2 border-amber-500/60 transition-all flex flex-col items-center justify-center shadow-lg active:scale-95"
            title={`Punto CUE (${isDeckA ? 'Tecla Q' : 'Tecla P'})`}
          >
            <span>CUE</span>
            <span className="text-[8px] opacity-75 font-mono">{isDeckA ? 'Q' : 'P'}</span>
          </button>

          {/* PLAY / PAUSE Button (Big Glowing Round Button) */}
          <button
            onClick={() => togglePlayDeck(deckId)}
            disabled={!deck.track}
            className={`w-14 h-14 rounded-full font-black text-xs tracking-wider transition-all flex flex-col items-center justify-center shadow-xl active:scale-95 disabled:opacity-40 disabled:pointer-events-none ${
              isPlaying
                ? 'bg-emerald-500 text-black shadow-emerald-500/40 border-2 border-emerald-300'
                : 'text-white border-2'
            }`}
            style={{
              backgroundColor: !isPlaying ? `${accentColor}30` : undefined,
              borderColor: !isPlaying ? accentColor : undefined,
              color: !isPlaying ? '#ffffff' : undefined,
              boxShadow: isPlaying
                ? '0 0 20px rgba(16, 185, 129, 0.5)'
                : `0 0 15px ${accentColor}35`
            }}
            title={`Play / Pause (${isDeckA ? 'Espacio' : 'Enter'})`}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
            <span className="text-[7px] font-mono mt-0.5">
              {isPlaying ? 'PAUSA' : isDeckA ? 'ESPACIO' : 'ENTER'}
            </span>
          </button>
        </div>

        {/* Center: YouDJ Loop Box (e.g. [ ] 4 as in screenshot) */}
        <div className="flex items-center gap-1 bg-[#151c28] p-1 rounded-lg border border-[#2a384f]">
          <Repeat className="w-3.5 h-3.5 text-slate-400 ml-1 hidden sm:block" />
          {([1, 2, 4, 8] as const).map((beats) => {
            const isLoopActive = deck.loop?.active && deck.loop.beats === beats;
            return (
              <button
                key={beats}
                onClick={() => handleLoopToggle(beats)}
                className={`px-2 py-1.5 rounded-md text-xs font-black transition-all ${
                  isLoopActive
                    ? 'text-black shadow-md font-extrabold'
                    : 'text-slate-300 hover:text-white bg-[#0c1017] hover:bg-[#1f293a]'
                }`}
                style={{
                  backgroundColor: isLoopActive ? accentColor : undefined
                }}
                title={`Loop de ${beats} beats`}
              >
                {beats}
              </button>
            );
          })}
        </div>

        {/* SYNC Button */}
        <button
          onClick={() => syncBpm(otherDeckId, deckId)}
          className="flex flex-col items-center justify-center px-3 py-1.5 rounded-xl bg-[#151c28] hover:bg-[#202b3d] border border-[#2a384f] text-slate-300 hover:text-white transition-all shadow"
          title={`Sincronizar tempo con Plato ${otherDeckId}`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[9px] font-black uppercase mt-0.5">SYNC</span>
        </button>

        {/* Volume Channel Fader */}
        <div className="flex items-center gap-1.5 bg-[#151c28] px-2.5 py-1.5 rounded-xl border border-[#2a384f] w-28 sm:w-36">
          <button
            onClick={() => toggleMute(deckId)}
            className="text-slate-400 hover:text-white"
            title={deck.isMuted ? 'Activar sonido' : 'Silenciar'}
          >
            {deck.isMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-red-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={deck.volume}
            onChange={(e) => setVolume(deckId, parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-[#0c1017] rounded-lg appearance-none cursor-pointer"
            style={{ accentColor }}
          />
          <span className="text-[9px] font-mono text-slate-400 w-6 text-right">
            {deck.volume}%
          </span>
        </div>
      </div>

      {/* 4. Bottom Controls: EQ & Pitch Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <EQSection deckId={deckId} accentColor={accentColor} />
        <PitchControl deckId={deckId} accentColor={accentColor} />
      </div>
    </div>
  );
};
