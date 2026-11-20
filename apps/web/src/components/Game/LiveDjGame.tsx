import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Trophy, Volume2, VolumeX } from 'lucide-react';
import { useDjStore } from '../../stores/useDjStore';

const HIGHSCORE_KEY = 'minidj_game_highscore_v1';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

interface Obstacle {
  x: number;
  width: number;
  height: number;
  color: string;
  passed: boolean;
}

interface Collectible {
  x: number;
  y: number;
  type: 'disc' | 'note';
  collected: boolean;
  angle: number;
}

export const LiveDjGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { deckA, deckB } = useDjStore();

  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'GAMEOVER'>('IDLE');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem(HIGHSCORE_KEY) || '0', 10);
    } catch {
      return 0;
    }
  });
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [combo, setCombo] = useState(0);

  // Audio synthesis for retro 8-bit SFX (no external audio files required)
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playSfx = useCallback((type: 'jump' | 'collect' | 'gameover') => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'jump') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(680, now + 0.12);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'collect') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587, now);
        osc.frequency.setValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === 'gameover') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.35);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch {}
  }, [soundEnabled]);

  // Game internal state held in refs for 60 FPS requestAnimationFrame
  const gameRef = useRef({
    state: 'IDLE' as 'IDLE' | 'PLAYING' | 'GAMEOVER',
    score: 0,
    combo: 0,
    player: {
      x: 35,
      y: 140,
      width: 24,
      height: 24,
      vy: 0,
      jumpCount: 0,
      rotation: 0
    },
    gravity: 0.45,
    jumpForce: -7.5,
    obstacles: [] as Obstacle[],
    collectibles: [] as Collectible[],
    particles: [] as Particle[],
    speed: 3.2,
    floorY: 175,
    nextObstacleDist: 90,
    beatPulse: 0
  });

  // Keep state sync between ref and React state
  useEffect(() => {
    gameRef.current.state = gameState;
  }, [gameState]);

  // Calculate beat pulse from active music
  useEffect(() => {
    const isPlaying = deckA.state === 'PLAYING' || deckB.state === 'PLAYING';
    if (!isPlaying) return;

    const bpm = deckA.bpm || deckB.bpm || 124;
    const intervalMs = (60 / bpm) * 1000;

    const pulseTimer = setInterval(() => {
      gameRef.current.beatPulse = 1.0;
    }, intervalMs);

    return () => clearInterval(pulseTimer);
  }, [deckA.state, deckB.state, deckA.bpm, deckB.bpm]);

  // Jump trigger
  const handleJump = useCallback(() => {
    const g = gameRef.current;
    if (g.state === 'IDLE') {
      g.state = 'PLAYING';
      setGameState('PLAYING');
      g.player.vy = g.jumpForce;
      g.player.jumpCount = 1;
      playSfx('jump');
      return;
    }

    if (g.state === 'GAMEOVER') {
      // Restart game
      resetGame();
      g.state = 'PLAYING';
      setGameState('PLAYING');
      g.player.vy = g.jumpForce;
      g.player.jumpCount = 1;
      playSfx('jump');
      return;
    }

    if (g.state === 'PLAYING') {
      if (g.player.jumpCount < 2) {
        g.player.vy = g.jumpForce;
        g.player.jumpCount++;
        playSfx('jump');

        // Spawn jump dust particles
        for (let i = 0; i < 6; i++) {
          g.particles.push({
            x: g.player.x + 12,
            y: g.player.y + 24,
            vx: (Math.random() - 0.5) * 3,
            vy: Math.random() * 2 + 1,
            color: '#00B8FF',
            size: Math.random() * 3 + 1,
            life: 15,
            maxLife: 15
          });
        }
      }
    }
  }, [playSfx]);

  const resetGame = () => {
    const g = gameRef.current;
    g.score = 0;
    g.combo = 0;
    g.speed = 3.2;
    g.player.y = 140;
    g.player.vy = 0;
    g.player.jumpCount = 0;
    g.player.rotation = 0;
    g.obstacles = [];
    g.collectibles = [];
    g.particles = [];
    g.nextObstacleDist = 80;
    setScore(0);
    setCombo(0);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleJump();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleJump]);

  // Main 60 FPS Canvas Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const g = gameRef.current;
      const width = canvas.width;
      const height = canvas.height;
      g.floorY = height - 32;

      // Decay beat pulse
      if (g.beatPulse > 0) {
        g.beatPulse = Math.max(0, g.beatPulse - 0.05);
      }

      // 1. Draw Background: Synthwave Cyber Grid
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#090d16');
      bgGrad.addColorStop(0.7, '#131128');
      bgGrad.addColorStop(1, '#1f1335');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Distant pulsing synthwave sun
      const sunY = g.floorY - 45;
      const sunRadius = 26 + g.beatPulse * 6;
      const sunGrad = ctx.createRadialGradient(width / 2, sunY, 4, width / 2, sunY, sunRadius);
      sunGrad.addColorStop(0, '#FF0055');
      sunGrad.addColorStop(0.7, '#FF6B00');
      sunGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(width / 2, sunY, sunRadius, 0, Math.PI * 2);
      ctx.fill();

      // Horizon line
      ctx.strokeStyle = '#FF005544';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, g.floorY);
      ctx.lineTo(width, g.floorY);
      ctx.stroke();

      // Floor Grid
      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(0, g.floorY, width, height - g.floorY);

      // Floor neon laser lines
      ctx.strokeStyle = `rgba(0, 184, 255, ${0.4 + g.beatPulse * 0.4})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, g.floorY);
      ctx.lineTo(width, g.floorY);
      ctx.stroke();

      // Perspective grid lines on floor
      const gridOffset = (Date.now() / 25) % 24;
      ctx.strokeStyle = '#FF005530';
      ctx.lineWidth = 1;
      for (let x = -gridOffset; x < width; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, g.floorY);
        ctx.lineTo(x - 20, height);
        ctx.stroke();
      }

      // 2. Physics & Logic when Playing
      if (g.state === 'PLAYING') {
        // Player gravity
        g.player.vy += g.gravity;
        g.player.y += g.player.vy;

        // Floor collision
        if (g.player.y >= g.floorY - g.player.height) {
          g.player.y = g.floorY - g.player.height;
          g.player.vy = 0;
          g.player.jumpCount = 0;
        }

        // Rotate vinyl disc while moving
        g.player.rotation += 0.15 + g.speed * 0.02;

        // Increase speed slowly
        g.speed = Math.min(6.5, 3.2 + g.score * 0.006);

        // Spawn obstacles
        g.nextObstacleDist -= g.speed;
        if (g.nextObstacleDist <= 0) {
          const obsHeight = Math.floor(Math.random() * 24) + 20;
          const colors = ['#FF0055', '#FF6B00', '#00B8FF', '#A855F7'];
          const color = colors[Math.floor(Math.random() * colors.length)];
          g.obstacles.push({
            x: width + 10,
            width: 14,
            height: obsHeight,
            color,
            passed: false
          });

          // Chance to spawn floating collectible vinyl or music note above/after obstacle
          if (Math.random() > 0.35) {
            g.collectibles.push({
              x: width + 30,
              y: g.floorY - obsHeight - 28,
              type: Math.random() > 0.5 ? 'disc' : 'note',
              collected: false,
              angle: 0
            });
          }

          g.nextObstacleDist = Math.floor(Math.random() * 80) + 110 - Math.min(40, g.score * 0.3);
        }

        // Update obstacles
        for (let i = g.obstacles.length - 1; i >= 0; i--) {
          const obs = g.obstacles[i];
          obs.x -= g.speed;

          // Check pass for points
          if (!obs.passed && obs.x + obs.width < g.player.x) {
            obs.passed = true;
            g.score += 10;
            setScore(g.score);

            // Update high score
            if (g.score > highScore) {
              setHighScore(g.score);
              try {
                localStorage.setItem(HIGHSCORE_KEY, g.score.toString());
              } catch {}
            }
          }

          // AABB Collision detection
          const pBox = {
            left: g.player.x + 3,
            right: g.player.x + g.player.width - 3,
            top: g.player.y + 3,
            bottom: g.player.y + g.player.height
          };

          const obsBox = {
            left: obs.x,
            right: obs.x + obs.width,
            top: g.floorY - obs.height,
            bottom: g.floorY
          };

          if (
            pBox.right > obsBox.left &&
            pBox.left < obsBox.right &&
            pBox.bottom > obsBox.top &&
            pBox.top < obsBox.bottom
          ) {
            // Collision! Game Over
            g.state = 'GAMEOVER';
            setGameState('GAMEOVER');
            playSfx('gameover');

            // Explosion particles
            for (let p = 0; p < 25; p++) {
              g.particles.push({
                x: g.player.x + 12,
                y: g.player.y + 12,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                color: Math.random() > 0.5 ? '#FF0055' : '#FF6B00',
                size: Math.random() * 4 + 2,
                life: 30,
                maxLife: 30
              });
            }
          }

          // Remove off-screen
          if (obs.x + obs.width < -20) {
            g.obstacles.splice(i, 1);
          }
        }

        // Update collectibles
        for (let i = g.collectibles.length - 1; i >= 0; i--) {
          const col = g.collectibles[i];
          col.x -= g.speed;
          col.angle += 0.08;

          // Check pickup
          const dist = Math.hypot(g.player.x + 12 - col.x, g.player.y + 12 - col.y);
          if (!col.collected && dist < 22) {
            col.collected = true;
            g.score += 50;
            g.combo++;
            setScore(g.score);
            setCombo(g.combo);
            playSfx('collect');

            // Burst particles
            for (let p = 0; p < 12; p++) {
              g.particles.push({
                x: col.x,
                y: col.y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                color: '#FFD700',
                size: Math.random() * 3 + 1,
                life: 20,
                maxLife: 20
              });
            }
          }

          if (col.x < -20 || col.collected) {
            g.collectibles.splice(i, 1);
          }
        }
      }

      // 3. Render Obstacles (Neon Equalizer Towers)
      g.obstacles.forEach((obs) => {
        const topY = g.floorY - obs.height;
        ctx.fillStyle = obs.color;
        ctx.shadowColor = obs.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(obs.x, topY, obs.width, obs.height);

        // Equalizer segmentation
        ctx.fillStyle = '#090d14';
        for (let segY = topY + 4; segY < g.floorY; segY += 6) {
          ctx.fillRect(obs.x, segY, obs.width, 1.5);
        }
        ctx.shadowBlur = 0;
      });

      // 4. Render Collectibles (Gold Vinyls / Music Notes)
      g.collectibles.forEach((col) => {
        ctx.save();
        ctx.translate(col.x, col.y);
        ctx.rotate(col.angle);

        // Glowing outer halo
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 12;

        // Gold vinyl disc
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();

        // Inner black label
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Center gold hole
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(0, 0, 1.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
        ctx.shadowBlur = 0;
      });

      // 5. Render Particles
      for (let i = g.particles.length - 1; i >= 0; i--) {
        const p = g.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;

        const alpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        if (p.life <= 0) {
          g.particles.splice(i, 1);
        }
      }

      // 6. Render Player (MiniDJ Mascot - Spinning Neon Vinyl with Headphones)
      if (g.state !== 'GAMEOVER') {
        const px = g.player.x + 12;
        const py = g.player.y + 12;

        ctx.save();
        ctx.translate(px, py);

        // Glowing aura
        ctx.shadowColor = '#00B8FF';
        ctx.shadowBlur = 12 + g.beatPulse * 8;

        // Vinyl outer disc
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();

        // Vinyl neon border
        ctx.strokeStyle = '#00B8FF';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Spinning center label
        ctx.rotate(g.player.rotation);
        ctx.fillStyle = '#FF6B00';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        // Turntable center hole
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
        ctx.shadowBlur = 0;

        // Little DJ Headphones over disc
        ctx.strokeStyle = '#FF0055';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(px, py - 4, 11, Math.PI * 0.9, Math.PI * 2.1);
        ctx.stroke();

        // Headphone ear cups
        ctx.fillStyle = '#FF0055';
        ctx.fillRect(px - 14, py - 6, 3, 7);
        ctx.fillRect(px + 11, py - 6, 3, 7);
      }

      // 7. HUD Overlays
      if (g.state === 'IDLE') {
        // Start Overlay
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, 0, width, height);

        ctx.textAlign = 'center';
        ctx.font = 'bold 13px system-ui, sans-serif';
        ctx.fillStyle = '#00B8FF';
        ctx.fillText('🎮 MINI DJ RUNNER', width / 2, height / 2 - 14);

        ctx.font = '10px system-ui, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('TOCA O ESPACIO PARA SALTAR', width / 2, height / 2 + 8);
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('¡Esquiva y mezcla tu música en vivo!', width / 2, height / 2 + 24);
      } else if (g.state === 'GAMEOVER') {
        // Game Over Overlay
        ctx.fillStyle = 'rgba(10, 5, 20, 0.75)';
        ctx.fillRect(0, 0, width, height);

        ctx.textAlign = 'center';
        ctx.font = 'black 14px system-ui, sans-serif';
        ctx.fillStyle = '#FF0055';
        ctx.fillText('¡GAME OVER!', width / 2, height / 2 - 18);

        ctx.font = 'bold 11px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`PUNTOS: ${g.score}`, width / 2, height / 2);

        ctx.font = '10px system-ui, sans-serif';
        ctx.fillStyle = '#00B8FF';
        ctx.fillText('TOCA PARA REVIVIR', width / 2, height / 2 + 20);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [highScore, playSfx]);

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-xl overflow-hidden border border-[#242f42] bg-[#090d14] flex flex-col items-center select-none shadow-inner group"
    >
      {/* Top Game Bar: Live badge & Score HUD */}
      <div className="w-full px-2.5 py-1.5 bg-[#0e131d]/90 border-b border-[#1e2837] flex items-center justify-between text-[11px] font-mono z-10">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span className="font-bold text-red-400 text-[10px] tracking-wider uppercase">LIVE</span>
          {combo > 1 && (
            <span className="text-[9px] px-1 py-0.2 bg-[#FF6B00]/20 text-[#FF6B00] rounded font-bold border border-[#FF6B00]/40 animate-pulse">
              {combo}x COMBO
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Score */}
          <div className="flex items-center gap-1 text-white font-bold">
            <span className="text-slate-400 text-[9px]">PTS:</span>
            <span>{score}</span>
          </div>

          {/* High Score */}
          <div className="flex items-center gap-0.5 text-amber-400 font-bold" title="Récord máximo">
            <Trophy className="w-3 h-3 text-amber-400" />
            <span className="text-[10px]">{highScore}</span>
          </div>

          {/* SFX Mute/Unmute */}
          <button
            onClick={() => setSoundEnabled((prev) => !prev)}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title={soundEnabled ? 'Silenciar efectos retro' : 'Activar efectos retro'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas Area (Responsive aspect ratio) */}
      <div
        className="relative w-full aspect-[16/10] sm:aspect-[16/11] max-h-[220px] cursor-pointer touch-none"
        onClick={handleJump}
        onTouchStart={(e) => {
          e.preventDefault();
          handleJump();
        }}
      >
        <canvas
          ref={canvasRef}
          width={320}
          height={200}
          className="w-full h-full block"
        />

        {/* Quick Tap Helper hint on mobile */}
        {gameState === 'PLAYING' && (
          <div className="absolute bottom-1 right-2 text-[9px] text-slate-400/50 pointer-events-none font-mono">
            TAP / ESPACIO = SALTO
          </div>
        )}
      </div>
    </div>
  );
};
