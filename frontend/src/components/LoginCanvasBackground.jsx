import React, { useEffect, useRef } from 'react';

export default function LoginCanvasBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Respect users who've asked for reduced motion.
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = canvas.getContext('2d');
    let animationId;
    let width, height, dpr;

    const resize = () => {
      // Cap DPR at 2 — a 3x phone display makes the canvas 9x the pixels for
      // no visual gain on drifting dots, and it's the #1 mobile lag source.
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    // Fewer particles when the drawing area is small (mobiles/tablets) — the
    // O(n^2) link check below is the hot path, so fewer dots = far cheaper.
    const area = Math.max(1, width * height);
    const PARTICLE_COUNT = Math.max(18, Math.min(45, Math.floor(area / 14000)));
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25
    }));
    const MAX_DIST = 130;

    const tick = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(129, 116, 245, 0.75)';
        ctx.fill();
      });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(129, 116, 245, ${(1 - dist / MAX_DIST) * 0.25})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      animationId = requestAnimationFrame(tick);
    };

    // Pause the loop while the card is off-screen or the tab is hidden — no
    // point burning CPU/GPU on a canvas nobody can see (common on long pages
    // like the register card where the user scrolls past it).
    let visible = true;
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationId);
        visible = false;
      } else if (!visible) {
        visible = true;
        tick();
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) {
        cancelAnimationFrame(animationId);
        visible = false;
      } else if (!visible) {
        visible = true;
        tick();
      }
    });
    observer.observe(canvas);
    document.addEventListener('visibilitychange', onVisibility);

    tick();

    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}