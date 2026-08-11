import React, { useEffect, useRef } from 'react';

// DATAVERSE 2026 — Quantum AI Neural Network Background
// A futuristic AI brain visualization: layered neuron nodes connected by
// glowing synapses, energy pulses travelling along links, rotating orbital
// rings and a scanning beam. Mouse creates a gravity well that bends
// particles and pulses toward the cursor.
export default function AiBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let nodes = [];
    let links = [];
    let pulses = [];
    let freeParticles = [];
    let rings = [];
    let w = 0;
    let h = 0;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    const mouse = { tx: -9999, ty: -9999, x: -9999, y: -9999, active: false };

    const palette = ['#a78bfa', '#22d3ee', '#f472b6', '#818cf8', '#34d399', '#facc15'];

    const pick = () => palette[Math.floor(Math.random() * palette.length)];

    // Layered neural network layout: input -> hidden -> output
    const buildNetwork = () => {
      const layers = [7, 9, 9, 7, 5];
      const layerGap = w < 900 ? 110 : 150;
      const totalW = (layers.length - 1) * layerGap;
      const startX = (w - totalW) / 2;
      const cx = w / 2;
      const cy = h / 2;
      const maxH = Math.min(h * 0.62, 480);

      nodes = [];
      layers.forEach((count, li) => {
        const x = startX + li * layerGap;
        for (let i = 0; i < count; i++) {
          const y = count === 1 ? cy : (i / (count - 1) - 0.5) * maxH + cy + Math.sin(li * 3.7 + i) * 22;
          nodes.push({
            x: x + (Math.random() - 0.5) * 26,
            y,
            r: 3.2 + Math.random() * 3.2,
            color: pick(),
            pulse: Math.random() * Math.PI * 2,
            vx: (Math.random() - 0.5) * 0.12,
            vy: (Math.random() - 0.5) * 0.12,
            layer: li,
            active: 0.35 + Math.random() * 0.65
          });
        }
      });

      // Connect nearby nodes (mostly across adjacent layers + some same layer)
      links = [];
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          const layerDelta = Math.abs(a.layer - b.layer);
          if ((layerDelta === 1 && dist < 260) || (layerDelta === 0 && dist < 130)) {
            links.push({ a: i, b: j, dist, color: palette[Math.floor(Math.random() * 3)] });
          }
        }
      }
      links = links.slice(0, 130);

      freeParticles = Array.from({ length: 70 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        r: Math.random() * 1.8 + 0.6,
        color: pick()
      }));

      rings = [0, 1, 2].map((i) => ({
        x: w * (0.28 + i * 0.22),
        y: h * (0.3 + (i % 2) * 0.4),
        r: 70 + i * 40,
        rot: i * 1.2,
        vr: (i % 2 === 0 ? 1 : -1) * 0.004,
        tilt: (i % 2 === 0 ? 0.5 : -0.4),
        color: palette[i % palette.length]
      }));

      pulses = [];
    };

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * DPR;
      canvas.height = h * DPR;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      buildNetwork();
    };

    const draw = (time) => {
      ctx.clearRect(0, 0, w, h);

      mouse.x += (mouse.tx - mouse.x) * 0.1;
      mouse.y += (mouse.ty - mouse.y) * 0.1;

      // ---- Scanline beam sweeping down ----
      const beamY = (time * 0.22) % (h + 400) - 200;
      const beamGrad = ctx.createLinearGradient(0, beamY - 120, 0, beamY + 120);
      beamGrad.addColorStop(0, 'rgba(167,139,250,0)');
      beamGrad.addColorStop(0.5, 'rgba(167,139,250,0.05)');
      beamGrad.addColorStop(1, 'rgba(167,139,250,0)');
      ctx.fillStyle = beamGrad;
      ctx.fillRect(0, beamY - 120, w, 240);

      // ---- Rotating orbital rings ----
      rings.forEach((ring) => {
        ring.rot += ring.vr;
        ctx.save();
        ctx.translate(ring.x, ring.y);
        ctx.rotate(Math.sin(ring.rot) * ring.tilt);
        ctx.strokeStyle = hexToRgba(ring.color, 0.18 + Math.sin(time / 800 + ring.rot) * 0.06);
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.ellipse(0, 0, ring.r, ring.r * 0.32, 0, 0, Math.PI * 2);
        ctx.stroke();
        // Orbiting satellite
        const sa = ring.rot * 3;
        const sx = Math.cos(sa) * ring.r;
        const sy = Math.sin(sa) * ring.r * 0.32;
        ctx.shadowBlur = 16;
        ctx.shadowColor = ring.color;
        ctx.fillStyle = ring.color;
        ctx.beginPath();
        ctx.arc(sx, sy, 2.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
      });

      // ---- Free ambient particles with mouse gravity ----
      freeParticles.forEach((p) => {
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const d = Math.hypot(dx, dy);
          if (d < 220 && d > 0.001) {
            const f = ((220 - d) / 220) * 0.12;
            p.vx += (dx / d) * f;
            p.vy += (dy / d) * f;
          }
        }
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;

        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      });

      // ---- Synapse links ----
      ctx.lineWidth = 0.7;
      links.forEach((link) => {
        const a = nodes[link.a];
        const b = nodes[link.b];
        const twinkle = 0.16 + Math.sin(time / 1200 + link.a * 0.3 + link.b) * 0.1;
        ctx.strokeStyle = hexToRgba(link.color, twinkle);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      });

      // ---- Neuron nodes ----
      nodes.forEach((node) => {
        // gentle drift
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 20) node.x = 20;
        if (node.x > w - 20) node.x = w - 20;
        if (node.y < 20) node.y = 20;
        if (node.y > h - 20) node.y = h - 20;

        node.pulse += 0.02;
        const ringPulse = (Math.sin(node.pulse) + 1) / 2;
        const glow = node.active * (0.7 + ringPulse * 0.5);

        // Expanding activation ring
        ctx.strokeStyle = hexToRgba(node.color, ringPulse * 0.35);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r + 5 + ringPulse * 14, 0, Math.PI * 2);
        ctx.stroke();

        // Node glow + core
        ctx.shadowBlur = 18;
        ctx.shadowColor = node.color;
        ctx.fillStyle = hexToRgba(node.color, glow);
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r * 0.4, 0, Math.PI * 2);
        ctx.fill();
      });

      // ---- Energy pulses travelling along links ----
      if (pulses.length < 18 && Math.random() < 0.12) {
        const link = links[Math.floor(Math.random() * links.length)];
        if (link) {
          pulses.push({
            link,
            t: 0,
            speed: 0.012 + Math.random() * 0.015,
            color: pick()
          });
        }
      }
      pulses = pulses.filter((p) => p.t < 1);
      pulses.forEach((pk) => {
        pk.t += pk.speed;
        const a = nodes[pk.link.a];
        const b = nodes[pk.link.b];
        const x = a.x + (b.x - a.x) * pk.t;
        const y = a.y + (b.y - a.y) * pk.t;
        ctx.shadowBlur = 16;
        ctx.shadowColor = pk.color;
        ctx.fillStyle = pk.color;
        ctx.globalAlpha = 0.95;
        ctx.beginPath();
        ctx.arc(x, y, 2.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      });

      // ---- Cursor gravity well ----
      if (mouse.active) {
        const aura = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 170);
        aura.addColorStop(0, 'rgba(167,139,250,0.20)');
        aura.addColorStop(0.55, 'rgba(34,211,238,0.08)');
        aura.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = aura;
        ctx.fillRect(mouse.x - 170, mouse.y - 170, 340, 340);

        // Ripple rings from cursor
        for (let i = 0; i < 3; i++) {
          const rr = ((time * 0.35 + i * 120) % 240);
          ctx.strokeStyle = `rgba(167,139,250,${(1 - rr / 240) * 0.28})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(mouse.x, mouse.y, rr, 0, Math.PI * 2);
          ctx.stroke();
        }
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

    function hexToRgba(hex, a) {
      const n = parseInt(hex.slice(1), 16);
      return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
    }

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
