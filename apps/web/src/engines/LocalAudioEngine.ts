import { DeckId, DeckEQ, DeckFilter, DeckDelay, DeckReverb } from '../types';

interface DeckAudioNodes {
  source: AudioBufferSourceNode | null;
  buffer: AudioBuffer | null;
  lowNode: BiquadFilterNode;
  midNode: BiquadFilterNode;
  highNode: BiquadFilterNode;
  filterNode: BiquadFilterNode;
  delayNode: DelayNode;
  delayFeedbackNode: GainNode;
  delayWetNode: GainNode;
  reverbNode: ConvolverNode;
  reverbWetNode: GainNode;
  gainNode: GainNode;
  analyserNode: AnalyserNode;
  playbackStartTime: number;
  pauseOffset: number;
  isPlaying: boolean;
  playbackRate: number;
  loopActive: boolean;
  loopStart: number;
  loopEnd: number;
}

class LocalAudioEngineManager {
  private ctx: AudioContext | null = null;
  private decks: Map<DeckId, DeckAudioNodes> = new Map();
  private loopIntervals: Map<DeckId, number> = new Map();

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public initDeck(deckId: DeckId) {
    const ctx = this.getContext();

    // 1. EQ Nodes
    const lowNode = ctx.createBiquadFilter();
    lowNode.type = 'lowshelf';
    lowNode.frequency.value = 250;
    lowNode.gain.value = 0;

    const midNode = ctx.createBiquadFilter();
    midNode.type = 'peaking';
    midNode.frequency.value = 1000;
    midNode.Q.value = 1.0;
    midNode.gain.value = 0;

    const highNode = ctx.createBiquadFilter();
    highNode.type = 'highshelf';
    highNode.frequency.value = 4000;
    highNode.gain.value = 0;

    // 2. DJ Filter Node (Lowpass / Highpass)
    const filterNode = ctx.createBiquadFilter();
    filterNode.type = 'allpass';
    filterNode.frequency.value = 20000;

    // 3. Delay & Echo FX
    const delayNode = ctx.createDelay(2.0);
    delayNode.delayTime.value = 0.35; // 350ms default
    const delayFeedbackNode = ctx.createGain();
    delayFeedbackNode.gain.value = 0.4;
    const delayWetNode = ctx.createGain();
    delayWetNode.gain.value = 0.0; // Dry by default

    // Connect Delay feedback loop
    delayNode.connect(delayFeedbackNode);
    delayFeedbackNode.connect(delayNode);
    delayNode.connect(delayWetNode);

    // 4. Reverb FX with synthetic impulse response
    const reverbNode = ctx.createConvolver();
    reverbNode.buffer = this.generateSyntheticImpulseResponse(ctx, 2.0, 2.0);
    const reverbWetNode = ctx.createGain();
    reverbWetNode.gain.value = 0.0; // Dry by default
    reverbNode.connect(reverbWetNode);

    // 5. Volume & Metering
    const gainNode = ctx.createGain();
    gainNode.gain.value = 1.0;

    const analyserNode = ctx.createAnalyser();
    analyserNode.fftSize = 256;
    analyserNode.smoothingTimeConstant = 0.8;

    // Chain: source -> low -> mid -> high -> filter -> [split dry, delay, reverb] -> gainNode -> analyserNode -> destination
    lowNode.connect(midNode);
    midNode.connect(highNode);
    highNode.connect(filterNode);

    // Split filter output to dry gain, delay, and reverb
    filterNode.connect(gainNode);
    filterNode.connect(delayNode);
    filterNode.connect(reverbNode);

    delayWetNode.connect(gainNode);
    reverbWetNode.connect(gainNode);

    gainNode.connect(analyserNode);
    analyserNode.connect(ctx.destination);

    this.decks.set(deckId, {
      source: null,
      buffer: null,
      lowNode,
      midNode,
      highNode,
      filterNode,
      delayNode,
      delayFeedbackNode,
      delayWetNode,
      reverbNode,
      reverbWetNode,
      gainNode,
      analyserNode,
      playbackStartTime: 0,
      pauseOffset: 0,
      isPlaying: false,
      playbackRate: 1.0,
      loopActive: false,
      loopStart: 0,
      loopEnd: 0
    });
  }

  public async decodeAudioFile(file: File): Promise<AudioBuffer> {
    const ctx = this.getContext();
    const arrayBuffer = await file.arrayBuffer();
    return await ctx.decodeAudioData(arrayBuffer);
  }

  public setBuffer(deckId: DeckId, buffer: AudioBuffer) {
    if (!this.decks.has(deckId)) {
      this.initDeck(deckId);
    }
    const deck = this.decks.get(deckId)!;
    this.stop(deckId);
    deck.buffer = buffer;
    deck.pauseOffset = 0;
  }

  public play(deckId: DeckId, startOffset?: number, onEnded?: () => void) {
    const deck = this.decks.get(deckId);
    if (!deck || !deck.buffer) return;

    const ctx = this.getContext();

    if (deck.isPlaying) {
      this.stop(deckId);
    }

    const source = ctx.createBufferSource();
    source.buffer = deck.buffer;
    source.playbackRate.value = deck.playbackRate;

    source.connect(deck.lowNode);

    const offset = startOffset !== undefined ? startOffset : deck.pauseOffset;
    const clampedOffset = Math.max(0, Math.min(deck.buffer.duration, offset));

    source.onended = () => {
      if (deck.source === source) {
        deck.isPlaying = false;
        if (onEnded) onEnded();
      }
    };

    source.start(0, clampedOffset);
    deck.source = source;
    deck.playbackStartTime = ctx.currentTime - clampedOffset / deck.playbackRate;
    deck.isPlaying = true;
    deck.pauseOffset = clampedOffset;

    // Start loop watcher if loop is active
    this.startLoopWatcher(deckId);
  }

  public pause(deckId: DeckId) {
    const deck = this.decks.get(deckId);
    if (!deck || !deck.isPlaying) return;

    const currentTime = this.getCurrentTime(deckId);
    deck.pauseOffset = currentTime;

    if (deck.source) {
      try {
        deck.source.stop();
        deck.source.disconnect();
      } catch {}
      deck.source = null;
    }
    deck.isPlaying = false;
    this.stopLoopWatcher(deckId);
  }

  public stop(deckId: DeckId) {
    const deck = this.decks.get(deckId);
    if (!deck) return;

    if (deck.source) {
      try {
        deck.source.stop();
        deck.source.disconnect();
      } catch {}
      deck.source = null;
    }
    deck.isPlaying = false;
    deck.pauseOffset = 0;
    this.stopLoopWatcher(deckId);
  }

  public seek(deckId: DeckId, timeInSeconds: number, onEnded?: () => void) {
    const deck = this.decks.get(deckId);
    if (!deck || !deck.buffer) return;

    const clampedTime = Math.max(0, Math.min(deck.buffer.duration, timeInSeconds));
    const wasPlaying = deck.isPlaying;

    if (wasPlaying) {
      this.pause(deckId);
      this.play(deckId, clampedTime, onEnded);
    } else {
      deck.pauseOffset = clampedTime;
    }
  }

  public getCurrentTime(deckId: DeckId): number {
    const deck = this.decks.get(deckId);
    if (!deck || !deck.buffer) return 0;

    if (deck.isPlaying) {
      const ctx = this.getContext();
      const elapsed = (ctx.currentTime - deck.playbackStartTime) * deck.playbackRate;
      return Math.min(deck.buffer.duration, Math.max(0, elapsed));
    }
    return deck.pauseOffset;
  }

  public setVolume(deckId: DeckId, linearGain: number) {
    const deck = this.decks.get(deckId);
    if (!deck) return;
    const clamped = Math.max(0, Math.min(1.0, linearGain));
    deck.gainNode.gain.setTargetAtTime(clamped, this.getContext().currentTime, 0.02);
  }

  public setPlaybackRate(deckId: DeckId, rate: number) {
    const deck = this.decks.get(deckId);
    if (!deck) return;
    deck.playbackRate = Math.max(0.5, Math.min(2.0, rate));
    if (deck.source && deck.source.playbackRate) {
      deck.source.playbackRate.setTargetAtTime(deck.playbackRate, this.getContext().currentTime, 0.02);
    }
  }

  public setEQ(deckId: DeckId, eq: DeckEQ) {
    const deck = this.decks.get(deckId);
    if (!deck) return;
    const now = this.getContext().currentTime;
    deck.lowNode.gain.setTargetAtTime(eq.low, now, 0.03);
    deck.midNode.gain.setTargetAtTime(eq.mid, now, 0.03);
    deck.highNode.gain.setTargetAtTime(eq.high, now, 0.03);
  }

  public setFilter(deckId: DeckId, filter: DeckFilter) {
    const deck = this.decks.get(deckId);
    if (!deck) return;
    const now = this.getContext().currentTime;
    if (!filter.active || filter.type === 'none') {
      deck.filterNode.type = 'allpass';
    } else if (filter.type === 'lpf') {
      deck.filterNode.type = 'lowpass';
      deck.filterNode.frequency.setTargetAtTime(Math.max(100, Math.min(20000, filter.cutoff)), now, 0.03);
    } else if (filter.type === 'hpf') {
      deck.filterNode.type = 'highpass';
      deck.filterNode.frequency.setTargetAtTime(Math.max(20, Math.min(10000, filter.cutoff)), now, 0.03);
    }
  }

  public setDelay(deckId: DeckId, delay: DeckDelay) {
    const deck = this.decks.get(deckId);
    if (!deck) return;
    const now = this.getContext().currentTime;
    deck.delayNode.delayTime.setTargetAtTime(delay.time, now, 0.05);
    deck.delayFeedbackNode.gain.setTargetAtTime(delay.feedback, now, 0.05);
    deck.delayWetNode.gain.setTargetAtTime(delay.active ? delay.mix : 0.0, now, 0.05);
  }

  public setReverb(deckId: DeckId, reverb: DeckReverb) {
    const deck = this.decks.get(deckId);
    if (!deck) return;
    const now = this.getContext().currentTime;
    deck.reverbWetNode.gain.setTargetAtTime(reverb.active ? reverb.mix : 0.0, now, 0.05);
  }

  public setLoop(deckId: DeckId, active: boolean, startTime: number, endTime: number) {
    const deck = this.decks.get(deckId);
    if (!deck) return;
    deck.loopActive = active;
    deck.loopStart = startTime;
    deck.loopEnd = endTime;

    if (active) {
      this.startLoopWatcher(deckId);
    } else {
      this.stopLoopWatcher(deckId);
    }
  }

  private startLoopWatcher(deckId: DeckId) {
    this.stopLoopWatcher(deckId);
    const interval = window.setInterval(() => {
      const deck = this.decks.get(deckId);
      if (!deck || !deck.isPlaying || !deck.loopActive) return;

      const current = this.getCurrentTime(deckId);
      if (current >= deck.loopEnd) {
        this.seek(deckId, deck.loopStart);
      }
    }, 40);
    this.loopIntervals.set(deckId, interval);
  }

  private stopLoopWatcher(deckId: DeckId) {
    const existing = this.loopIntervals.get(deckId);
    if (existing) {
      clearInterval(existing);
      this.loopIntervals.delete(deckId);
    }
  }

  public getAudioLevel(deckId: DeckId): number {
    const deck = this.decks.get(deckId);
    if (!deck || !deck.isPlaying) return 0;

    const dataArray = new Uint8Array(deck.analyserNode.frequencyBinCount);
    deck.analyserNode.getByteTimeDomainData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const v = (dataArray[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / dataArray.length);
    return Math.min(1.0, rms * 3.5); // Normalized RMS level 0 - 1
  }

  public getFrequencyData(deckId: DeckId): Uint8Array | null {
    const deck = this.decks.get(deckId);
    if (!deck || !deck.isPlaying) return null;

    const dataArray = new Uint8Array(deck.analyserNode.frequencyBinCount);
    deck.analyserNode.getByteFrequencyData(dataArray);
    return dataArray;
  }

  /**
   * Generates a realistic synthetic impulse response for reverb
   */
  private generateSyntheticImpulseResponse(ctx: AudioContext, durationSec = 2.0, decay = 2.0): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * durationSec;
    const impulse = ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = i / length;
      const factor = Math.exp(-n * decay);
      left[i] = (Math.random() * 2 - 1) * factor;
      right[i] = (Math.random() * 2 - 1) * factor;
    }

    return impulse;
  }

  /**
   * Real peak and autocorrelation BPM detection algorithm on AudioBuffer
   */
  public detectBpm(buffer: AudioBuffer): number | null {
    try {
      const sampleRate = buffer.sampleRate;
      const channelData = buffer.getChannelData(0);

      // Analyze up to first 60 seconds
      const maxSamples = Math.min(channelData.length, sampleRate * 60);
      const step = Math.floor(sampleRate / 100); // 10ms window step
      const energies: number[] = [];

      for (let i = 0; i < maxSamples; i += step) {
        let sum = 0;
        const windowEnd = Math.min(i + step, maxSamples);
        for (let j = i; j < windowEnd; j++) {
          sum += Math.abs(channelData[j]);
        }
        energies.push(sum / (windowEnd - i));
      }

      // Calculate energy threshold to find peaks
      const avgEnergy = energies.reduce((a, b) => a + b, 0) / energies.length;
      const threshold = avgEnergy * 1.5;

      const peakIndices: number[] = [];
      for (let i = 1; i < energies.length - 1; i++) {
        if (energies[i] > threshold && energies[i] > energies[i - 1] && energies[i] > energies[i + 1]) {
          peakIndices.push(i);
        }
      }

      if (peakIndices.length < 10) {
        return null; // Not enough clear peaks
      }

      // Calculate intervals between adjacent peaks
      const intervals: number[] = [];
      for (let i = 1; i < peakIndices.length; i++) {
        const intervalMs = (peakIndices[i] - peakIndices[i - 1]) * 10;
        if (intervalMs >= 250 && intervalMs <= 1000) {
          // Equivalent to 60 - 240 BPM
          intervals.push(intervalMs);
        }
      }

      if (intervals.length < 5) return null;

      // Group intervals into BPM buckets (bin size 1 BPM)
      const bpmCounts: { [bpm: number]: number } = {};
      intervals.forEach(intMs => {
        let bpm = Math.round(60000 / intMs);
        // Normalize tempo to 80 - 160 BPM
        while (bpm < 80) bpm *= 2;
        while (bpm > 165) bpm /= 2;
        bpm = Math.round(bpm);
        bpmCounts[bpm] = (bpmCounts[bpm] || 0) + 1;
      });

      let bestBpm = 0;
      let maxCount = 0;
      for (const bpmStr in bpmCounts) {
        const count = bpmCounts[bpmStr];
        if (count > maxCount) {
          maxCount = count;
          bestBpm = parseInt(bpmStr, 10);
        }
      }

      return bestBpm > 0 ? bestBpm : null;
    } catch (e) {
      console.warn('[BPM Detection Error]', e);
      return null;
    }
  }

  /**
   * Extract peaks from AudioBuffer for real waveform rendering
   */
  public extractWaveformPeaks(buffer: AudioBuffer, numPoints = 1000): { min: number[]; max: number[] } {
    const channelData = buffer.getChannelData(0);
    const step = Math.floor(channelData.length / numPoints);
    const min: number[] = [];
    const max: number[] = [];

    for (let i = 0; i < numPoints; i++) {
      const start = i * step;
      const end = Math.min(start + step, channelData.length);
      let localMin = 1.0;
      let localMax = -1.0;

      for (let j = start; j < end; j++) {
        const val = channelData[j];
        if (val < localMin) localMin = val;
        if (val > localMax) localMax = val;
      }
      min.push(localMin);
      max.push(localMax);
    }

    return { min, max };
  }
}

export const localAudioEngine = new LocalAudioEngineManager();
