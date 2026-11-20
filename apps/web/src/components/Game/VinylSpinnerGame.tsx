import React, { useRef, useEffect, useState, useCallback, memo } from 'react';
import { Trophy } from 'lucide-react';
import { useGameStore } from '../../stores/useGameStore';

interface LaserSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
}

export const VinylSpinnerGame: React.FC = memo(() => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { highScores, saveHighScore } = useGameStore();
  const currentHighScore = highScores['turntable-spinner'] || 0;

  const [, setGameState] = useState<'IDLE' | 'PLAYING' | 'GAMEOVER'>('IDLE');
  const [score, setScore] = useState(0);

  const gameRef = useRef({
    state: 'IDLE' as 'IDLE' | 'PLAYING' | 'GAMEOVER',
    score: 0,
    shieldAngle: 0,
    shieldArc: Math.PI * 0.45,
    sparks: [] as LaserSpark[],
    particles: [] as Array<{ x: number; y: number; vx: number; vy: number; color: string; life: number }>,
    lastSpawn: 0,
    health: 100
  });

  const startGame = useCallback(() => {
    const g = gameRef.current;
    g.state = 'PLAYING';
    g.score = 0;
    g.shieldAngle = 0;
    g.sparks = [];
    g.particles = [];
    g.health = 100;
    g.lastSpawn = performance.now();
    setScore(0);
    setGameState('PLAYING');
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    gameRef.current.shieldAngle = Math.atan2(py - cy, px - cx);
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

    const loop = (time: number) => {
      const g = gameRef.current;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const vinylRadius = 26;

      ctx.clearRect(0, 0, w, h);

      if (g.state === 'PLAYING') {
        // Spawn lasers inward
        if (time - g.lastSpawn > Math.max(380, 800 - g.score * 12)) {
          g.lastSpawn = time;
          const spawnAngle = Math.random() * Math.PI * 2;
          const dist = Math.max(w, h) * 0.7;
          const sx = cx + Math.cos(spawnAngle) * dist;
          const sy = cy + Math.sin(spawnAngle) * dist;
          const speed = Math.random() * 1.5 + 2.0 + Math.min(2.5, g.score * 0.05);

          g.sparks.push({
            x: sx,
            y: sy,
            vx: -Math.cos(spawnAngle) * speed,
            vy: -Math.sin(spawnAngle) * speed,
            color: Math.random() < 0.5 ? '#FF007A' : '#FFE600',
            radius: 5
          });
        }

        // Draw center DJ Core (Vinyl Turntable)
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, vinylRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#111827';
        ctx.fill();
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#B026FF';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#B026FF';
        ctx.fill();
        ctx.restore();

        // Draw player shield arc
        ctx.save();
        const startAng = g.shieldAngle - g.shieldArc / 2;
        const endAng = g.shieldAngle + g.shieldArc / 2;
        ctx.beginPath();
        ctx.arc(cx, cy, vinylRadius + 14, startAng, endAng);
        ctx.strokeStyle = '#00F0FF';
        ctx.lineWidth = 5;
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#00F0FF';
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();

        // Update & draw sparks
        for (let i = g.sparks.length - 1; i >= 0; i--) {
          const sp = g.sparks[i];
          sp.x += sp.vx;
          sp.y += sp.vy;

          const distToCenter = Math.hypot(sp.x - cx, sp.y - cy);

          // Shield collision check
          if (distToCenter <= vinylRadius + 16 && distToCenter >= vinylRadius + 8) {
            const sparkAngle = Math.atan2(sp.y - cy, sp.x - cx);
            let angleDiff = Math.abs(sparkAngle - g.shieldAngle);
            if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

            if (angleDiff <= g.shieldArc / 2 + 0.15) {
              // Deflected!
              g.score += 10;
              setScore(g.score);

              for (let p = 0; p < 8; p++) {
                const ang = Math.random() * Math.PI * 2;
                g.particles.push({
                  x: sp.x,
                  y: sp.y,
                  vx: Math.cos(ang) * 3,
                  vy: Math.sin(ang) * 3,
                  color: '#00F0FF',
                  life: 1.0
                });
              }

              g.sparks.splice(i, 1);
              continue;
            }
          }

          // Core hit
          if (distToCenter <= vinylRadius) {
            g.health -= 35;
            g.sparks.splice(i, 1);

            for (let p = 0; p < 10; p++) {
              const ang = Math.random() * Math.PI * 2;
              g.particles.push({
                x: sp.x,
                y: sp.y,
                vx: Math.cos(ang) * 4,
                vy: Math.sin(ang) * 4,
                color: '#EF4444',
                life: 1.0
              });
            }

            if (g.health <= 0) {
              g.state = 'GAMEOVER';
              setGameState('GAMEOVER');
              saveHighScore('turntable-spinner', g.score);
            }
            continue;
          }

          // Draw spark
          ctx.save();
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2);
          ctx.fillStyle = sp.color;
          ctx.shadowBlur = 8;
          ctx.shadowColor = sp.color;
          ctx.fill();
          ctx.restore();
        }

        // Particles
        for (let i = g.particles.length - 1; i >= 0; i--) {
          const pt = g.particles[i];
          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.life -= 0.06;
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
        ctx.fillStyle = '#B026FF';
        ctx.font = 'black 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#B026FF';
        ctx.fillText('💫 VINYL SPINNER 360°', cx, cy - 12);

        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.shadowBlur = 0;
        ctx.fillText('Gira el plato con el mouse para proteger el núcleo', cx, cy + 8);
        ctx.fillStyle = '#00F0FF';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('TOCA O CLICK PARA EMPEZAR', cx, cy + 28);
        ctx.restore();
      } else if (g.state === 'GAMEOVER') {
        ctx.save();
        ctx.fillStyle = '#EF4444';
        ctx.font = 'black 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#EF4444';
        ctx.fillText('¡NÚCLEO DESTRUIDO!', cx, cy - 16);

        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 0;
        ctx.fillText(`Puntos: ${g.score}`, cx, cy + 4);
        ctx.fillStyle = '#00F0FF';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('TOCA PARA REVIVIR', cx, cy + 24);
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
          <span className="text-[#B026FF] font-black">{score}</span>
        </div>

        <div className="flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-md border border-white/10 text-amber-400">
          <Trophy className="w-3 h-3" />
          <span className="font-bold">{currentHighScore}</span>
        </div>
      </div>
    </div>
  );
});
