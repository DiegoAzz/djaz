import React, { useRef, useEffect, useState, useCallback, memo } from 'react';
import { Trophy } from 'lucide-react';
import { useGameStore } from '../../stores/useGameStore';

interface Brick {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  alive: boolean;
}

export const NeonPongGame: React.FC = memo(() => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { highScores, saveHighScore } = useGameStore();
  const currentHighScore = highScores['neon-pong'] || 0;

  const [, setGameState] = useState<'IDLE' | 'PLAYING' | 'GAMEOVER'>('IDLE');
  const [score, setScore] = useState(0);

  const gameRef = useRef({
    state: 'IDLE' as 'IDLE' | 'PLAYING' | 'GAMEOVER',
    score: 0,
    paddleX: 140,
    paddleW: 55,
    ballX: 140,
    ballY: 90,
    ballVx: 2.2,
    ballVy: -2.2,
    ballR: 4,
    bricks: [] as Brick[],
    particles: [] as Array<{ x: number; y: number; vx: number; vy: number; color: string; life: number }>
  });

  const initBricks = (w: number) => {
    const bricks: Brick[] = [];
    const cols = 7;
    const rows = 3;
    const padding = 4;
    const brickW = (w - (cols + 1) * padding) / cols;
    const brickH = 9;
    const colors = ['#EF4444', '#F59E0B', '#10B981'];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        bricks.push({
          x: padding + c * (brickW + padding),
          y: 22 + r * (brickH + padding),
          w: brickW,
          h: brickH,
          color: colors[r],
          alive: true
        });
      }
    }
    return bricks;
  };

  const startGame = useCallback(() => {
    const g = gameRef.current;
    const canvas = canvasRef.current;
    const w = canvas ? canvas.width : 280;
    const h = canvas ? canvas.height : 140;

    g.state = 'PLAYING';
    g.score = 0;
    g.paddleX = w / 2;
    g.ballX = w / 2;
    g.ballY = h - 35;
    g.ballVx = (Math.random() > 0.5 ? 1 : -1) * 2.2;
    g.ballVy = -2.4;
    g.bricks = initBricks(w);
    g.particles = [];
    setScore(0);
    setGameState('PLAYING');
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    gameRef.current.paddleX = Math.max(
      gameRef.current.paddleW / 2,
      Math.min(rect.width - gameRef.current.paddleW / 2, relX)
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
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = () => {
      const g = gameRef.current;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      if (g.state === 'PLAYING') {
        // Move ball
        g.ballX += g.ballVx;
        g.ballY += g.ballVy;

        // Wall collisions
        if (g.ballX <= g.ballR) {
          g.ballX = g.ballR;
          g.ballVx = Math.abs(g.ballVx);
        } else if (g.ballX >= w - g.ballR) {
          g.ballX = w - g.ballR;
          g.ballVx = -Math.abs(g.ballVx);
        }

        if (g.ballY <= g.ballR + 18) {
          g.ballY = g.ballR + 18;
          g.ballVy = Math.abs(g.ballVy);
        }

        // Paddle collision
        const paddleY = h - 14;
        if (
          g.ballY + g.ballR >= paddleY - 4 &&
          g.ballY - g.ballR <= paddleY + 6 &&
          g.ballVy > 0
        ) {
          if (Math.abs(g.ballX - g.paddleX) <= g.paddleW / 2 + g.ballR) {
            const hitFactor = (g.ballX - g.paddleX) / (g.paddleW / 2);
            g.ballVx = hitFactor * 3.5;
            g.ballVy = -Math.abs(g.ballVy);

            for (let i = 0; i < 6; i++) {
              g.particles.push({
                x: g.ballX,
                y: paddleY,
                vx: (Math.random() - 0.5) * 4,
                vy: -Math.random() * 3,
                color: '#10B981',
                life: 0.8
              });
            }
          }
        }

        // Brick collisions
        let aliveCount = 0;
        for (const b of g.bricks) {
          if (!b.alive) continue;
          aliveCount++;

          if (
            g.ballX + g.ballR >= b.x &&
            g.ballX - g.ballR <= b.x + b.w &&
            g.ballY + g.ballR >= b.y &&
            g.ballY - g.ballR <= b.y + b.h
          ) {
            b.alive = false;
            g.ballVy = -g.ballVy;
            g.score += 20;
            setScore(g.score);

            for (let i = 0; i < 8; i++) {
              g.particles.push({
                x: b.x + b.w / 2,
                y: b.y + b.h / 2,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                color: b.color,
                life: 1.0
              });
            }
            break;
          }
        }

        // If cleared all bricks, re-populate
        if (aliveCount === 0) {
          g.bricks = initBricks(w);
          g.ballVy *= 1.1;
        }

        // Ball bottom out
        if (g.ballY > h + 10) {
          g.state = 'GAMEOVER';
          setGameState('GAMEOVER');
          saveHighScore('neon-pong', g.score);
        }

        // Draw bricks
        for (const b of g.bricks) {
          if (!b.alive) continue;
          ctx.save();
          ctx.shadowBlur = 6;
          ctx.shadowColor = b.color;
          ctx.fillStyle = b.color;
          ctx.beginPath();
          ctx.roundRect(b.x, b.y, b.w, b.h, 2);
          ctx.fill();
          ctx.restore();
        }

        // Draw paddle
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#10B981';
        ctx.fillStyle = '#10B981';
        ctx.beginPath();
        ctx.roundRect(g.paddleX - g.paddleW / 2, paddleY - 3, g.paddleW, 7, 3);
        ctx.fill();
        ctx.restore();

        // Draw ball
        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#fff';
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(g.ballX, g.ballY, g.ballR, 0, Math.PI * 2);
        ctx.fill();
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
          ctx.fillRect(pt.x, pt.y, 2.5, 2.5);
          ctx.restore();
        }
      } else if (g.state === 'IDLE') {
        ctx.save();
        ctx.fillStyle = '#10B981';
        ctx.font = 'black 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#10B981';
        ctx.fillText('🕹️ SOUNDWAVE BREAKOUT', w / 2, h / 2 - 12);

        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.shadowBlur = 0;
        ctx.fillText('Rebota la bola y rompe las barras del ecualizador', w / 2, h / 2 + 8);
        ctx.fillStyle = '#10B981';
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
        ctx.fillStyle = '#10B981';
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
          <span className="text-[#10B981] font-black">{score}</span>
        </div>

        <div className="flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-md border border-white/10 text-amber-400">
          <Trophy className="w-3 h-3" />
          <span className="font-bold">{currentHighScore}</span>
        </div>
      </div>
    </div>
  );
});
