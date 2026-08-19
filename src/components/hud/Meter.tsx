import React from 'react';

interface MeterProps {
  value: number;
  tone?: 'ice' | 'ok' | 'warn';
  segments?: number;
  className?: string;
}

const toneColor = {
  ice: '#84b6d6',
  ok: '#6fbf8f',
  warn: '#d3a04e',
};

/* Segmented bar graph — reads as a discrete instrument scale rather than a
   smooth web progress bar. Segments light in order and dim rather than glow. */
const Meter: React.FC<MeterProps> = ({ value, tone = 'ice', segments = 12, className = '' }) => {
  const clamped = Math.max(0, Math.min(1, value));
  const lit = Math.round(clamped * segments);
  const color = toneColor[tone];

  return (
    <div className={`flex items-center gap-[2px] ${className}`}>
      {Array.from({ length: segments }, (_, i) => (
        <span
          key={i}
          className="h-2 flex-1 rounded-[1px] transition-[background-color,box-shadow] duration-200 ease-instrument"
          style={
            i < lit
              ? { backgroundColor: color, boxShadow: `0 0 4px ${color}66` }
              : { backgroundColor: 'rgba(151,178,199,0.1)' }
          }
        />
      ))}
    </div>
  );
};

export default Meter;
