import React, { useEffect, useRef } from 'react';

interface Props {
  value: number;
  max?: number;
  color?: string;
}

export default function ProgressBar({ value, max = 12, color = '#6366f1' }: Props) {
  const barRef = useRef<HTMLDivElement>(null);
  const pct = Math.min(100, Math.round((value / max) * 100));

  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    el.style.setProperty('--bar-target', `${pct}%`);
    // trigger animation
    el.style.width = '0%';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = 'width 0.6s ease';
        el.style.width = `${pct}%`;
      });
    });
  }, [pct]);

  return (
    <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: '#1e2040' }}>
      <div
        ref={barRef}
        className="h-full rounded-full"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}
