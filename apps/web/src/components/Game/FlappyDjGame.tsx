import React, { useRef, useEffect, useState, useCallback, memo } from 'react';
import { Trophy } from 'lucide-react';
import { useGameStore } from '../../stores/useGameStore';

interface Column {
  x: number;
  topHeight: number;
  gap: number;
  passed: boolean;
}

export const FlappyDjGame: React.FC = memo(() => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { highScores, saveHighScore } = useGameStore();
  const currentHighScore = highScores['flappy-dj'] || 0;

  const [, setGameState] = useState<'IDLE' | 'PLAYING' | 'GAMEOVER'>('IDLE');
  const [score, setScore] = useState(0);

  const gameRef = useRef({
    state: 'IDLE' as 'IDLE' | 'PLAYING' | 'GAMEOVER',
    score: 0,
    headphoneY: 70,
    vy: 0,
    gravity: 0.38,
    jumpForce: -6.2,
    columns: [] as Column[],
    lastColSpawn: 0,
    particles: [] as Array<{ x: number; y: number; vx: number; vy: number; color: string; life: number }>
  });

  const jump = useCallback(() => {
    const g = gameRef.current;
    if (g.state === 'IDLE' || g.state === 'GAMEOVER') {
      g.state = 'PLAYING';
      g.score = 0;
      g.headphoneY = 65;
      g.vy = g.jumpForce;
      g.columns = [];
      g.particles = [];
      g.lastColSpawn = performance.now();
      setScore(0);
      setGameState('PLAYING');
      return;
    }

    if (g.state === 'PLAYING') {
      g.vy = g.jumpForce;
      for (let i = 0; i < 4; i++) {
        g.particles.push({
          x: 45,
          y: g.headphoneY + 6,
          vx: (Math.random() - 0.5) * 2 - 2,
          vy: Math.random() * 2 + 1,
          color: '#F59E0B',
          life: 0.7
        });
      }
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jump]);

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
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = (time: number) => {
      const g = gameRef.current;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      if (g.state === 'PLAYING') {
        // Physics
        g.vy += g.gravity;
        g.headphoneY += g.vy;

        // Spawn columns
        if (time - g.lastColSpawn > 1400) {
          g.lastColSpawn = time;
          const gap = 52;
          const minHeight = 20;
          const maxHeight = h - gap - minHeight;
          const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
          g.columns.push({
            x: w + 20,
            topHeight,
            gap,
            passed: false
          });
        }

        const headX = 50;
        const headR = 8;

        // Update columns
        for (let i = g.columns.length - 1; i >= 0; i--) {
          const col = g.columns[i];
          col.x -= 2.2;

          // Score check
          if (!col.passed && col.x < headX) {
            col.passed = true;
            g.score += 1;
            setScore(g.score);
          }

          // Collision check
          const colWidth = 22;
          const inColX = headX + headR >= col.x && headX - headR <= col.x + colWidth;
          const hitTop = g.headphoneY - headR <= col.topHeight;
          const hitBottom = g.headphoneY + headR >= col.topHeight + col.gap;

          if (inColX && (hitTop || hitBottom)) {
            g.state = 'GAMEOVER';
            setGameState('GAMEOVER');
            saveHighScore('flappy-dj', g.score);
          }

          // Offscreen
          if (col.x < -30) {
            g.columns.splice(i, 1);
            continue;
          }

          // Render Equalizer Bars (top & bottom)
          ctx.save();
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#F59E0B';
          ctx.fillStyle = '#F59E0B';

          // Top column
          ctx.beginPath();
          ctx.roundRect(col.x, 0, colWidth, col.topHeight, [0, 0, 4, 4]);
          ctx.fill();

          // Bottom column
          const bottomY = col.topHeight + col.gap;
          ctx.beginPath();
          ctx.roundRect(col.x, bottomY, colWidth, h - bottomY, [4, 4, 0, 0]);
          ctx.fill();
          ctx.restore();
        }

        // Ground or ceiling hit
        if (g.headphoneY - headR <= 0 || g.headphoneY + headR >= h) {
          g.state = 'GAMEOVER';
          setGameState('GAMEOVER');
          saveHighScore('flappy-dj', g.score);
        }

        // Draw player (Headphones)
        ctx.save();
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#00F0FF';
        ctx.fillStyle = '#00F0FF';
        ctx.beginPath();
        ctx.arc(headX, g.headphoneY, headR, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(headX, g.headphoneY, headR + 2, Math.PI, 0);
        ctx.stroke();
        ctx.restore();

        // Particles
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
        ctx.fillStyle = '#F59E0B';
        ctx.font = 'black 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#F59E0B';
        ctx.fillText('⭐ FLAPPY HEADPHONES', w / 2, h / 2 - 12);

        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.shadowBlur = 0;
        ctx.fillText('Toca o pulsa espacio para aletear los audífonos', w / 2, h / 2 + 8);
        ctx.fillStyle = '#00F0FF';
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
        ctx.fillStyle = '#F59E0B';
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
      onMouseDown={(e) => {
        e.preventDefault();
        jump();
      }}
      onTouchStart={(e) => {
        e.preventDefault();
        jump();
      }}
      className="relative w-full h-36 bg-[#090d14] rounded-xl overflow-hidden cursor-pointer select-none border border-white/10"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Top HUD */}
      <div className="absolute top-1.5 left-2 right-2 flex items-center justify-between text-[10px] font-mono pointer-events-none">
        <div className="flex items-center gap-1.5 bg-black/60 px-2 py-0.5 rounded-md border border-white/10">
          <span className="text-slate-400">SCORE:</span>
          <span className="text-[#F59E0B] font-black">{score}</span>
        </div>

        <div className="flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-md border border-white/10 text-amber-400">
          <Trophy className="w-3 h-3" />
          <span className="font-bold">{currentHighScore}</span>
        </div>
      </div>
    </div>
  );
});
