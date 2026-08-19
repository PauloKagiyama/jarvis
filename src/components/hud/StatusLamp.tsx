import React from 'react';

type Tone = 'ok' | 'warn' | 'alert' | 'idle' | 'active';

interface StatusLampProps {
  tone: Tone;
  pulse?: boolean;
  size?: number;
}

const toneColor: Record<Tone, string> = {
  ok: '#6fbf8f',
  warn: '#d3a04e',
  alert: '#d1614e',
  idle: '#63707d',
  active: '#84b6d6',
};

/* A seated indicator lamp: recessed bezel, lit lens, tight local bleed —
   the light falls off within a few pixels instead of hazing the whole panel. */
const StatusLamp: React.FC<StatusLampProps> = ({ tone, pulse, size = 7 }) => {
  const color = toneColor[tone];
  return (
    <span
      className="relative inline-block shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background: color,
        boxShadow: `0 0 ${size * 0.9}px ${color}88, inset 0 0 2px rgba(255,255,255,0.55), 0 0 0 1px rgba(0,0,0,0.6)`,
        animation: pulse ? 'lamp-breathe 2.4s ease-in-out infinite' : undefined,
      }}
    />
  );
};

export default StatusLamp;
