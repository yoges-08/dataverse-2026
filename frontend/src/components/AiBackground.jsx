import React, { useEffect, useRef } from 'react';

// DATAVERSE 2026 — Interactive AI Neural-Network Background
// A living constellation of glowing nodes that REACTS TO THE MOUSE:
//   • Lines connect nodes to your cursor + each other
//   • Nodes are gently attracted / repelled by the cursor
//   • Pulsing "synapse" packets travel along connection lines
//   • Shimmering aurora orbs drift behind everything
export default function AiBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let particles = [];
    let orbs = [];
    let packets = [];
    let w = 0;
    let h = 0;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    const mouse = { x: -9999, y: -9999, active: false, tx: -9999, ty: -9999 };

    const isDark = () => !document.documentElement.classList.contains('dark');

    const palette = ['#a78bfa', '#22d3ee', '#f472b6', '#818cf8', '#34d399', '#fbbf24'];

    const pick = () => palette[Math.floor(Math.random() * palette.length)];

    const hexToRgba = (hex, a) => {
      const n = parseInt(hex.slice(1), 16);
      return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
    };

    const linkColor = (a) => (isDark() ? `rgba(148,120,255,${a})` : `rgba(124,58,237,${a * 0.55})`);

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * DPR;
      canvas.height = h * DPR;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      const count = Math.min(110, Math.max(60, Math.floor((w * h) / 13000)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        r: Math.random() * 2.4 + 1,
        color: pick(),
        baseX: 0,
        baseY: 0
      }));

      orbs = Array.from({ length: 4 }, (_, i) => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 160 + Math.random() * 220,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        hue: i % 2 === 0 ? 262 : (i % 3 === 0 ? 190 : 330)
      }));

      packets = [];
    };

    const draw = (time) => {
      ctx.clearRect(0, 0, w, h);

      // ---- Soft pulsing aurora orbs ----
      const glow = 0.55 + Math.sin(time / 1400) * 0.15;
      orbs.forEach((o) => {
        o.x += o.vx;
        o.y += o.vy;
        if (o.x < -o.r) o.x = w + o.r;
        if (o.x > w + o.r) o.x = -o.r;
        if (o.y < -o.r) o.y = h + o.r;
        if (o.y > h + o.r) o.y = -o.r;
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        g.addColorStop(0, `hsla(${o.hue}, 90%, 65%, ${0.16 * glow})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(o.x - o.r, o.y - o.r, o.r * 2, o.r * 2);
      });

      // ---- Smooth mouse follow ----
      mouse.x += (mouse.tx - mouse.x) * 0.12;
      mouse.y += (mouse.ty - mouse.y) * 0.12;

      // ---- Physics: mouse attraction + repulsion ----
      particles.forEach((p) => {
        const dxm = p.x - mouse.x;
        const dym = p.y - mouse.y;
        const dm = Math.hypot(dxm, dym);
        if (mouse.active && dm < 260 && dm > 0.001) {
          const force = (260 - dm) / 260;
          // Gentle repulsion from the very center, attraction just outside
          if (dm < 120) {
            p.vx += (dxm / dm) * force * 0.12;
            p.vy += (dym / dm) * force * 0.12;
          } else {
            p.vx -= (dxm / dm) * force * 0.05;
            p.vy -= (dym / dm) * force * 0.05;
          }
        }
        p.vx *= 0.97;
        p.vy *= 0.97;
      });

      // ---- Connections ----
      const LINK = 150;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < LINK) {
            const alpha = (1 - dist / LINK) * 0.4;
            ctx.strokeStyle = linkColor(alpha);
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // ---- Cursor connections (only while mouse is on screen) ----
      if (mouse.active) {
        for (const p of particles) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 220) {
            const alpha = (1 - dist / 220) * 0.65;
            ctx.strokeStyle = linkColor(alpha);
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }

        // Glowing cursor halo
        const halo = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 120);
        halo.addColorStop(0, 'rgba(167,139,250,0.22)');
        halo.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = halo;
        ctx.fillRect(mouse.x - 120, mouse.y - 120, 240, 240);
      }

      // ---- Traveling synapse packets ----
      if (packets.length < 5 && Math.random() < 0.08) {
        const a = particles[Math.floor(Math.random() * particles.length)];
        const b = particles[Math.floor(Math.random() * particles.length)];
        if (a && b && a !== b) {
          packets.push({
            x: a.x, y: a.y,
            tx: b.x, ty: b.y,
            t: 0, speed: 0.008 + Math.random() * 0.01,
            color: pick()
          });
        }
      }
      packets = packets.filter((pk) => pk.t < 1);
      packets.forEach((pk) => {
        pk.t += pk.speed;
        if (pk.t > 1) pk.t = 1;
        const cx = pk.x + (pk.tx - pk.x) * pk.t;
        const cy = pk.y + (pk.ty - pk.y) * pk.t;
        ctx.shadowBlur = 14;
        ctx.shadowColor = pk.color;
        ctx.fillStyle = pk.color;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(cx, cy, 2.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      });

      // ---- Nodes ----
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;

        const pulse = 1 + Math.sin(time / 700 + p.x * 0.01) * 0.35;
        ctx.shadowBlur = 12;
        ctx.shadowColor = p.color;
        ctx.fillStyle = hexToRgba(p.color, 0.95);
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;

        // Tiny bright core
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 0.35, 0, Math.PI * 2);
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };

    const onMove = (e) => {
      mouse.tx = e.clientX;
      mouse.ty = e.clientY;
      mouse.active = true;
    };
    const onLeave = () => { mouse.active = false; mouse.x = -9999; mouse.y = -9999; mouse.tx = -9999; mouse.ty = -9999; };

    resize();
    raf = requestAnimationFrame(draw);

    window.addEventListener('resize', onResize);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);

    function onResize() {
      resize();
    }

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
