import React, { useRef, useEffect, useState, useCallback, memo } from 'react';
import { Trophy } from 'lucide-react';
import { useGameStore } from '../../stores/useGameStore';
import { useDjStore } from '../../stores/useDjStore';

interface NoteItem {
  id: number;
  x: number;
  y: number;
  speed: number;
  radius: number;
  color: string;
  symbol: string;
  points: number;
}

const COLORS = ['#00F0FF', '#FF007A', '#FFE600', '#A855F7', '#00FF9D'];
const SYMBOLS = ['♪', '♫', '♬', '★'];

export const BeatDropGame: React.FC = memo(() => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { highScores, saveHighScore } = useGameStore();
  const currentHighScore = highScores['beat-drop'] || 0;

  const isPlayingA = useDjStore((s) => s.deckA.state === 'PLAYING');
  const isPlayingB = useDjStore((s) => s.deckB.state === 'PLAYING');

  const [, setGameState] = useState<'IDLE' | 'PLAYING' | 'GAMEOVER'>('IDLE');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);

  const gameRef = useRef({
    state: 'IDLE' as 'IDLE' | 'PLAYING' | 'GAMEOVER',
    score: 0,
    combo: 0,
    paddleX: 150,
    paddleWidth: 64,
    notes: [] as NoteItem[],
    particles: [] as Array<{ x: number; y: number; vx: number; vy: number; color: string; life: number }>,
    lastSpawn: 0,
    nextId: 1,
    misses: 0,
    maxMisses: 4,
    beatSync: isPlayingA || isPlayingB
  });

  const startGame = useCallback(() => {
    const g = gameRef.current;
    g.state = 'PLAYING';
    g.score = 0;
    g.combo = 0;
    g.misses = 0;
    g.notes = [];
    g.particles = [];
    g.lastSpawn = performance.now();
    setScore(0);
    setCombo(0);
    setGameState('PLAYING');
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    gameRef.current.paddleX = Math.max(
      gameRef.current.paddleWidth / 2,
      Math.min(rect.width - gameRef.current.paddleWidth / 2, relX)
    );
  }, []);

  const handlePointerDown = useCallback(() => {
    if (gameRef.current.state === 'IDLE' || gameRef.current.state === 'GAMEOVER') {
      startGame();
    }
  }, [startGame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      if (!containerRef.current || !canvas) return;
      canvas.width = containerRef.current.clientWidth;
      canvas.height = containerRef.current.clientHeight;
      if (gameRef.current.paddleX === 150) {
        gameRef.current.paddleX = canvas.width / 2;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = (time: number) => {
      const g = gameRef.current;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Background glow lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let x = 40; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      if (g.state === 'PLAYING') {
        // Spawn notes
        const spawnInterval = Math.max(450, 900 - Math.min(400, g.score * 15));
        if (time - g.lastSpawn > spawnInterval) {
          g.lastSpawn = time;
          const radius = 12;
          const color = COLORS[Math.floor(Math.random() * COLORS.length)];
          const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
          g.notes.push({
            id: g.nextId++,
            x: Math.random() * (w - 40) + 20,
            y: -15,
            speed: Math.random() * 1.8 + 2.2 + Math.min(2.5, g.score * 0.08),
            radius,
            color,
            symbol,
            points: 10
          });
        }

        const paddleY = h - 22;

        // Update & draw notes
        for (let i = g.notes.length - 1; i >= 0; i--) {
          const n = g.notes[i];
          n.y += n.speed;

          // Check paddle collision
          const isAtPaddleHeight = n.y + n.radius >= paddleY - 6 && n.y - n.radius <= paddleY + 8;
          const isWithinPaddleX = Math.abs(n.x - g.paddleX) <= g.paddleWidth / 2 + n.radius * 0.6;

          if (isAtPaddleHeight && isWithinPaddleX) {
            // Caught!
            g.combo++;
            const addPoints = n.points * Math.min(4, Math.floor(g.combo / 4) + 1);
            g.score += addPoints;
            setScore(g.score);
            setCombo(g.combo);

            // Particles
            for (let p = 0; p < 8; p++) {
              const ang = Math.random() * Math.PI * 2;
              const spd = Math.random() * 3 + 1;
              g.particles.push({
                x: n.x,
                y: n.y,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd,
                color: n.color,
                life: 1.0
              });
            }

            g.notes.splice(i, 1);
            continue;
          }

          // Missed note
          if (n.y > h + 15) {
            g.misses++;
            g.combo = 0;
            setCombo(0);
            g.notes.splice(i, 1);

            if (g.misses >= g.maxMisses) {
              g.state = 'GAMEOVER';
              setGameState('GAMEOVER');
              saveHighScore('beat-drop', g.score);
            }
            continue;
          }

          // Render note
          ctx.save();
          ctx.shadowBlur = 10;
          ctx.shadowColor = n.color;
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
          ctx.fillStyle = n.color;
          ctx.fill();

          ctx.font = 'bold 11px sans-serif';
          ctx.fillStyle = '#000';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(n.symbol, n.x, n.y);
          ctx.restore();
        }

        // Draw paddle (DJ turntable crossfader pad)
        ctx.save();
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#00F0FF';
        const pLeft = g.paddleX - g.paddleWidth / 2;
        ctx.fillStyle = '#00F0FF';
        ctx.beginPath();
        ctx.roundRect(pLeft, paddleY - 5, g.paddleWidth, 10, 5);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.fillRect(g.paddleX - 2, paddleY - 7, 4, 14);
        ctx.restore();

        // Draw particles
        for (let i = g.particles.length - 1; i >= 0; i--) {
          const pt = g.particles[i];
          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.life -= 0.05;
          if (pt.life <= 0) {
            g.particles.splice(i, 1);
            continue;
          }
          ctx.save();
          ctx.globalAlpha = pt.life;
          ctx.fillStyle = pt.color;
          ctx.fillRect(pt.x, pt.y, 3, 3);
          ctx.restore();
        }
      } else if (g.state === 'IDLE') {
        ctx.save();
        ctx.fillStyle = '#00F0FF';
        ctx.font = 'black 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00F0FF';
        ctx.fillText('🎧 BEAT DROP & CATCH', w / 2, h / 2 - 12);

        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.shadowBlur = 0;
        ctx.fillText('Mueve el mouse para atrapar los beats', w / 2, h / 2 + 8);
        ctx.fillStyle = '#FF6B00';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('TOCA O CLICK PARA EMPEZAR', w / 2, h / 2 + 28);
        ctx.restore();
      } else if (g.state === 'GAMEOVER') {
        ctx.save();
        ctx.fillStyle = '#EF4444';
        ctx.font = 'black 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#EF4444';
        ctx.fillText('¡GAME OVER!', w / 2, h / 2 - 16);

        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 0;
        ctx.fillText(`Puntos: ${g.score}`, w / 2, h / 2 + 4);
        ctx.fillStyle = '#00F0FF';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('TOCA PARA REVIVIR', w / 2, h / 2 + 24);
        ctx.restore();
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, [saveHighScore]);

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      className="relative w-full h-36 bg-[#090d14] rounded-xl overflow-hidden cursor-crosshair select-none border border-white/10"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Top HUD */}
      <div className="absolute top-1.5 left-2 right-2 flex items-center justify-between text-[10px] font-mono pointer-events-none">
        <div className="flex items-center gap-1.5 bg-black/60 px-2 py-0.5 rounded-md border border-white/10">
          <span className="text-slate-400">SCORE:</span>
          <span className="text-[#00F0FF] font-black">{score}</span>
          {combo > 1 && (
            <span className="text-[#FF007A] font-bold text-[9px] animate-pulse">
              x{Math.min(4, Math.floor(combo / 4) + 1)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-md border border-white/10 text-amber-400">
          <Trophy className="w-3 h-3" />
          <span className="font-bold">{currentHighScore}</span>
        </div>
      </div>
    </div>
  );
});
