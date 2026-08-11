import React, { useEffect, useRef } from 'react';

// DATAVERSE 2026 — Animated AI Neural-Network Background
// Renders a drifting constellation of glowing nodes connected by lines,
// evoking an artificial intelligence "brain" / tech symposium atmosphere.
export default function AiBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let particles = [];
    let w = 0;
    let h = 0;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    const isDark = () => !document.documentElement.classList.contains('dark');

    const colors = {
      node: () => (isDark() ? 'rgba(167,139,250,0.9)' : 'rgba(124,58,237,0.75)'),
      line: (a) => (isDark() ? `rgba(139,92,246,${a})` : `rgba(124,58,237,${a * 0.6})`)
    };

    const randomColor = () => {
      const palette = ['#a78bfa', '#22d3ee', '#f472b6', '#818cf8'];
      return palette[Math.floor(Math.random() * palette.length)];
    };

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * DPR;
      canvas.height = h * DPR;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      const count = Math.min(90, Math.floor((w * h) / 16000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        r: Math.random() * 2.2 + 0.8,
        color: randomColor()
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // Connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < 150) {
            const alpha = (1 - dist / 150) * 0.35;
            ctx.strokeStyle = colors.line(alpha);
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Nodes
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;

        // Soft glow halo
        ctx.shadowBlur = 12;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      });

      raf = requestAnimationFrame(draw);
    };

    resize();
    draw();

    const onResize = () => resize();
    window.addEventListener('resize', onResize);

    const observer = new MutationObserver(() => {
      // Re-render colors if theme toggles between dark/light
      ctx.clearRect(0, 0, w, h);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none ai-bg-canvas"
    />
  );
}
