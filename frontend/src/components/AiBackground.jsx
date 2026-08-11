import React, { useEffect, useRef } from 'react';

// DATAVERSE 2026 — Aurora Light Waves Background
// Silky flowing gradient ribbons drift across the screen like northern lights.
// The waves ripple and swell toward the mouse, bending gently around the cursor.
export default function AiBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    const mouse = { tx: -9999, ty: -9999, x: -9999, y: -9999, active: false };

    const waves = [
      { hue: 262, thick: 120, amp: 70, freq: 0.004, speed: 0.00035, drift: 0.09, offset: 0.0, base: 0.22 },
      { hue: 325, thick: 95, amp: 55, freq: 0.0032, speed: -0.0003, drift: 0.05, offset: 2.1, base: 0.30 },
      { hue: 190, thick: 80, amp: 62, freq: 0.0048, speed: 0.0004, drift: 0.12, offset: 4.2, base: 0.20 },
      { hue: 265, thick: 70, amp: 45, freq: 0.0036, speed: -0.00042, drift: 0.08, offset: 1.1, base: 0.16 }
    ];

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * DPR;
      canvas.height = h * DPR;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };

    // Height of the wave at a given x — bends toward the mouse.
    const waveY = (wave, x, time, centerY) => {
      const t = time * wave.speed + x * wave.freq + wave.offset;
      let y = centerY
        + Math.sin(t) * wave.amp
        + Math.sin(t * 1.7 + 1.3) * wave.amp * 0.4
        + Math.sin(t * 0.5 + 4.0) * wave.amp * 0.3;
      if (mouse.active) {
        const dx = x - mouse.x;
        const falloff = 300;
        const influence = Math.max(0, 1 - Math.abs(dx) / falloff);
        const bump = Math.sin(x * 0.02 + time * 0.004) * 26 * influence * influence;
        y += bump;
      }
      return y;
    };

    const draw = (time) => {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';

      // Smooth mouse follow for gentle, non-jittery bending
      mouse.x += (mouse.tx - mouse.x) * 0.06;
      mouse.y += (mouse.ty - mouse.y) * 0.06;

      waves.forEach((wave) => {
        const centerY = (h * (wave.base + (time * wave.drift) % 0.06)) % h;
        const top = Math.max(-wave.thick, centerY - wave.thick * 1.1);
        const bottom = Math.min(h + wave.thick, centerY + wave.thick * 1.1);
        const grad = ctx.createLinearGradient(0, top, 0, bottom);
        const fade = 0.5 + Math.sin(time / 900 + wave.offset) * 0.12;
        grad.addColorStop(0, `hsla(${wave.hue}, 90%, 66%, 0)`);
        grad.addColorStop(0.5, `hsla(${wave.hue}, 95%, 66%, ${0.30 * fade})`);
        grad.addColorStop(1, `hsla(${wave.hue}, 90%, 66%, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        const step = 6;
        for (let x = -step; x <= w + step; x += step) {
          const y = waveY(wave, x, time, centerY);
          if (x <= 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        for (let x = w + step; x >= -step; x -= step) {
          ctx.lineTo(x, waveY(wave, x, time, centerY) + wave.thick);
        }
        ctx.closePath();
        ctx.fill();
      });

      // Soft glow near the cursor
      if (mouse.active) {
        const halo = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 160);
        halo.addColorStop(0, 'rgba(190,170,255,0.14)');
        halo.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = halo;
        ctx.fillRect(mouse.x - 160, mouse.y - 160, 320, 320);
      }

      ctx.globalCompositeOperation = 'source-over';
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
