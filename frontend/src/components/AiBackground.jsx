import React, { useEffect, useRef } from 'react';

// DATAVERSE 2026 — Floating Holographic Tech Shapes Background
// Sci-fi holographic UI: glowing rings, triangles, squares, diamonds and
// crosses drift upward with soft glow trails and gentle rotation.
// The cursor gently pushes nearby shapes out of the way with a glow aura.
export default function AiBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let shapes = [];
    let w = 0;
    let h = 0;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    const mouse = { tx: -9999, ty: -9999, x: -9999, y: -9999, active: false };

    const palette = ['#a78bfa', '#22d3ee', '#f472b6', '#818cf8', '#34d399', '#fbbf24'];

    const pick = () => palette[Math.floor(Math.random() * palette.length)];

    const TYPES = ['ring', 'triangle', 'square', 'diamond', 'cross', 'dot'];

    const spawnShape = (fromTop) => {
      const size = 18 + Math.random() * 46;
      return {
        x: Math.random() * w,
        y: fromTop ? -size - 20 : h + size + 20,
        size,
        vy: 0.25 + Math.random() * 0.55,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.02,
        type: TYPES[Math.floor(Math.random() * TYPES.length)],
        color: pick(),
        opacity: 0.25 + Math.random() * 0.45,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.002 + Math.random() * 0.004,
        glow: Math.random() * 0.6 + 0.4
      };
    };

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * DPR;
      canvas.height = h * DPR;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      const count = Math.min(26, Math.max(14, Math.floor((w * h) / 52000)));
      shapes = Array.from({ length: count }, () => spawnShape(false));
    };

    const drawShape = (s, x, y, glowScale) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(s.rot);
      ctx.strokeStyle = s.color;
      ctx.fillStyle = s.color;
      ctx.globalAlpha = s.opacity * glowScale;
      ctx.lineWidth = 1.6;
      ctx.shadowBlur = 18 * s.glow * glowScale;
      ctx.shadowColor = s.color;
      ctx.lineJoin = 'round';

      const r = s.size / 2;
      switch (s.type) {
        case 'ring':
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = s.opacity * glowScale * 0.55;
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
          ctx.stroke();
          break;
        case 'triangle':
          ctx.beginPath();
          ctx.moveTo(0, -r);
          ctx.lineTo(r, r);
          ctx.lineTo(-r, r);
          ctx.closePath();
          ctx.stroke();
          break;
        case 'square':
          ctx.strokeRect(-r * 0.85, -r * 0.85, r * 1.7, r * 1.7);
          break;
        case 'diamond':
          ctx.beginPath();
          ctx.moveTo(0, -r);
          ctx.lineTo(r, 0);
          ctx.lineTo(0, r);
          ctx.lineTo(-r, 0);
          ctx.closePath();
          ctx.stroke();
          break;
        case 'cross':
          ctx.beginPath();
          ctx.moveTo(-r, -r); ctx.lineTo(r, r);
          ctx.moveTo(r, -r); ctx.lineTo(-r, r);
          ctx.stroke();
          break;
        case 'dot':
          ctx.globalAlpha = s.opacity * glowScale * 1.1;
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
          ctx.fill();
          break;
      }
      ctx.restore();
    };

    const draw = (time) => {
      ctx.clearRect(0, 0, w, h);

      mouse.x += (mouse.tx - mouse.x) * 0.12;
      mouse.y += (mouse.ty - mouse.y) * 0.12;

      shapes.forEach((s) => {
        s.y -= s.vy;
        s.rot += s.vrot;
        s.wobble += s.wobbleSpeed;
        s.x += Math.sin(s.wobble * 2) * 0.22;

        // Cursor repulsion
        if (mouse.active) {
          const dx = s.x - mouse.x;
          const dy = s.y - mouse.y;
          const dist = Math.hypot(dx, dy);
          const range = 140 + s.size;
          if (dist < range && dist > 0.001) {
            const force = ((range - dist) / range) * 1.6;
            s.x += (dx / dist) * force;
            s.y += (dy / dist) * force;
          }
        }

        // Respawn off-screen
        if (s.y < -s.size - 30) {
          Object.assign(s, spawnShape(true));
        }
        if (s.x < -s.size - 30 || s.x > w + s.size + 30) {
          s.x = Math.random() * w;
        }

        // Near-cursor shapes glow brighter (closer = stronger halo)
        let glowScale = 1;
        if (mouse.active) {
          const d = Math.hypot(s.x - mouse.x, s.y - mouse.y);
          glowScale = 1 + Math.max(0, (1 - d / 220)) * 0.9;
        }

        drawShape(s, s.x, s.y, glowScale);
      });

      // Cursor aura
      if (mouse.active) {
        const aura = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 150);
        aura.addColorStop(0, 'rgba(167,139,250,0.16)');
        aura.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = aura;
        ctx.fillRect(mouse.x - 150, mouse.y - 150, 300, 300);
        ctx.globalCompositeOperation = 'source-over';
      }

      raf = requestAnimationFrame(draw);
    };

    const onMove = (e) => {
      mouse.tx = e.clientX;
      mouse.ty = e.clientY;
      mouse.active = true;
    };
    const onLeave = () => {
      mouse.active = false;
      mouse.tx = -9999; mouse.ty = -9999;
      mouse.x = -9999; mouse.y = -9999;
    };
    const onResize = () => resize();

    resize();
    raf = requestAnimationFrame(draw);

    window.addEventListener('resize', onResize);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);

    const observer = new MutationObserver(() => {
      ctx.clearRect(0, 0, w, h);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
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
