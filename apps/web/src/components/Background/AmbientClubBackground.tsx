import React, { useEffect, useRef } from 'react';
import { useDjStore } from '../../stores/useDjStore';

export const AmbientClubBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { deckA, deckB } = useDjStore();

  const isPlayingA = deckA.state === 'PLAYING';
  const isPlayingB = deckB.state === 'PLAYING';
  const isPlaying = isPlayingA || isPlayingB;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    // Lightweight floating ambient particles
    const particles = Array.from({ length: 30 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      radius: Math.random() * 2 + 1,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -Math.random() * 0.5 - 0.2,
      color: Math.random() > 0.5 ? '#FF6B00' : '#FF0055',
      alpha: Math.random() * 0.4 + 0.1
    }));

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Render subtle floating bokeh particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.y < -10) {
          p.y = h + 10;
          p.x = Math.random() * w;
        }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1.0;
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* 1. Deep Silky Gradient Layers */}
      <div className="absolute inset-0 bg-[#080b12]" />

      {/* 2. Shifting Club Lights & Beams */}
      <div
        className={`absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full blur-[140px] opacity-25 transition-all duration-1000 ${
          isPlayingA ? 'scale-110 opacity-35 bg-[#FF6B00]' : 'bg-[#FF6B00]/40'
        }`}
      />
      <div
        className={`absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full blur-[140px] opacity-25 transition-all duration-1000 ${
          isPlayingB ? 'scale-110 opacity-35 bg-[#FF0055]' : 'bg-[#FF0055]/40'
        }`}
      />
      <div
        className={`absolute -bottom-40 left-1/3 w-[700px] h-[500px] rounded-full blur-[160px] opacity-15 transition-all duration-1000 ${
          isPlaying ? 'opacity-25 bg-[#8B5CF6]' : 'bg-[#3B82F6]/20'
        }`}
      />

      {/* 3. Subtle Animated Festival Canvas Particles */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block opacity-70" />

      {/* 4. Fine Dark Overlay Grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.4) 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }}
      />
    </div>
  );
};
