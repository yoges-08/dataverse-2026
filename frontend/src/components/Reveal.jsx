import React, { useEffect, useRef } from 'react';

/**
 * Reveals children with a fade + slide when scrolled into view (once).
 * GPU-friendly: animates only opacity and transform (the --reveal-y custom
 * property, defaulting to 24px). Reduced-motion users see content instantly.
 * `delay` staggers grouped items (30-80ms between siblings is recommended).
 */
export default function Reveal({ children, delay = 0, y = 24, className = '', as: Tag = 'div' }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('is-revealed');
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.classList.add('is-revealed');
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${className}`}
      style={{ transitionDelay: `${delay}ms`, '--reveal-y': `${y}px` }}
    >
      {children}
    </Tag>
  );
}