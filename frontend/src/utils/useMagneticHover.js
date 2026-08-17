import { useRef } from 'react';

// Attach this ref to a button to make it subtly follow the cursor on hover.
export default function useMagneticHover(strength = 0.25) {
  const ref = useRef(null);

  const onMouseMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
  };

  const onMouseLeave = () => {
    const el = ref.current;
    if (el) el.style.transform = 'translate(0, 0)';
  };

  return { ref, onMouseMove, onMouseLeave };
}