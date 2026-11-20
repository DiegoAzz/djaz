import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
  symbol?: string;
  rotation?: number;
  vRot?: number;
}

interface Point {
  x: number;
  y: number;
  time: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
}

const NEON_COLORS = [
  '#00F0FF', // Electric Cyan
  '#FF007A', // Laser Magenta / Neon Pink
  '#FFE600', // Club Gold / Laser Yellow
  '#FF6B00', // Sunset Neon Orange
  '#A855F7', // Violet
  '#00FF9D'  // Spring Green
];

const MUSIC_SYMBOLS = ['♪', '♫', '♬', '✦', '★'];

export const DjCursorTrail: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles: Particle[] = [];
    const trailPoints: Point[] = [];
    const ripples: Ripple[] = [];

    let mouseX = -100;
    let mouseY = -100;
    let prevMouseX = -100;
    let prevMouseY = -100;
    let lastMoveTime = performance.now();
    let animId: number | null = null;

    const spawnParticles = (x: number, y: number, speed: number) => {
      // Spawn 1 to 3 particles per move
      const count = Math.min(3, Math.max(1, Math.floor(speed / 6)));
      for (let i = 0; i < count; i++) {
        const color = NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)];
        const isSymbol = Math.random() < 0.28;
        const angle = Math.random() * Math.PI * 2;
        const velocity = (Math.random() * 1.8 + 0.4) * (speed > 10 ? 1.5 : 1.0);

        particles.push({
          x: x + (Math.random() - 0.5) * 8,
          y: y + (Math.random() - 0.5) * 8,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity - 0.35, // float upwards slightly
          color,
          size: isSymbol ? Math.random() * 6 + 10 : Math.random() * 3 + 2,
          alpha: 1.0,
          decay: isSymbol ? 0.022 : 0.035,
          symbol: isSymbol ? MUSIC_SYMBOLS[Math.floor(Math.random() * MUSIC_SYMBOLS.length)] : undefined,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.12
        });
      }

      // Limit particle array to prevent memory buildup
      if (particles.length > 120) {
        particles.splice(0, particles.length - 120);
      }
    };

    const handlePointerMove = (e: PointerEvent | MouseEvent) => {
      const now = performance.now();
      prevMouseX = mouseX;
      prevMouseY = mouseY;
      mouseX = e.clientX;
      mouseY = e.clientY;
      lastMoveTime = now;

      const dist = Math.hypot(mouseX - prevMouseX, mouseY - prevMouseY);
      spawnParticles(mouseX, mouseY, dist);

      trailPoints.push({ x: mouseX, y: mouseY, time: now });
      if (trailPoints.length > 25) {
        trailPoints.shift();
      }

      if (!animId) {
        animId = requestAnimationFrame(loop);
      }
    };

    const handlePointerDown = (e: PointerEvent | MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;

      // Sonic beat ripple
      ripples.push({
        x,
        y,
        radius: 4,
        maxRadius: 46,
        color: NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)],
        alpha: 1.0
      });

      // Starburst sparks on click
      for (let i = 0; i < 14; i++) {
        const angle = (i / 14) * Math.PI * 2 + (Math.random() * 0.3);
        const speed = Math.random() * 4 + 2;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: NEON_COLORS[i % NEON_COLORS.length],
          size: Math.random() * 3.5 + 2.5,
          alpha: 1.0,
          decay: 0.04,
          symbol: i % 4 === 0 ? '★' : undefined,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.2
        });
      }

      if (!animId) {
        animId = requestAnimationFrame(loop);
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });

    const loop = () => {
      const now = performance.now();
      ctx.clearRect(0, 0, width, height);

      // 1. Draw glowing laser comet trail
      if (trailPoints.length > 2) {
        for (let i = 1; i < trailPoints.length; i++) {
          const p1 = trailPoints[i - 1];
          const p2 = trailPoints[i];
          const age = now - p2.time;
          if (age > 280) continue;

          const ratio = 1 - age / 280;
          const lineWidth = ratio * 3.5;
          const alpha = ratio * 0.7;

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
          ctx.lineWidth = lineWidth;
          ctx.lineCap = 'round';
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#00F0FF';
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      }

      // 2. Draw beat shockwaves (ripples)
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += 2.5;
        r.alpha -= 0.045;

        if (r.alpha <= 0 || r.radius >= r.maxRadius) {
          ripples.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = r.color;
        ctx.lineWidth = 2.2;
        ctx.globalAlpha = r.alpha;
        ctx.shadowBlur = 10;
        ctx.shadowColor = r.color;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
      }

      // 3. Draw neon particles & floating music notes
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04; // subtle gravity
        p.alpha -= p.decay;

        if (p.rotation !== undefined && p.vRot !== undefined) {
          p.rotation += p.vRot;
        }

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;

        if (p.symbol) {
          ctx.translate(p.x, p.y);
          if (p.rotation) ctx.rotate(p.rotation);
          ctx.font = `bold ${Math.round(p.size)}px sans-serif`;
          ctx.fillStyle = p.color;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(p.symbol, 0, 0);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
        }
        ctx.restore();
      }

      // 4. Subtle glowing DJ reticle / disc at pointer position
      if (mouseX > 0 && mouseY > 0 && now - lastMoveTime < 1500) {
        ctx.save();
        const pulse = 1 + Math.sin(now / 140) * 0.15;
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, 7 * pulse, 0, Math.PI * 2);
        ctx.strokeStyle = '#00F0FF';
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00F0FF';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(mouseX, mouseY, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#FF007A';
        ctx.fill();
        ctx.restore();
      }

      // Clean old trail points
      while (trailPoints.length > 0 && now - trailPoints[0].time > 300) {
        trailPoints.shift();
      }

      // Sleep loop if idle to save 100% CPU
      if (now - lastMoveTime > 2000 && particles.length === 0 && ripples.length === 0) {
        animId = null;
        ctx.clearRect(0, 0, width, height);
        return;
      }

      animId = requestAnimationFrame(loop);
    };

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
      style={{ pointerEvents: 'none' }}
    />
  );
};
