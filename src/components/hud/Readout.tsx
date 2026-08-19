import React from 'react';

interface ReadoutProps {
  label: string;
  value: string;
  tone?: 'default' | 'ok' | 'warn' | 'alert' | 'dim';
  align?: 'left' | 'right';
}

const toneClass: Record<NonNullable<ReadoutProps['tone']>, string> = {
  default: 'text-[#dde4ea]/85',
  ok: 'text-signal-ok',
  warn: 'text-signal-warn',
  alert: 'text-signal-alert',
  dim: 'text-[#dde4ea]/40',
};

const Readout: React.FC<ReadoutProps> = ({ label, value, tone = 'default', align = 'left' }) => (
  <div className={align === 'right' ? 'text-right' : ''}>
    <div className="etch">{label}</div>
    <div className={`readout text-xs ${toneClass[tone]}`}>{value}</div>
  </div>
);

export default Readout;
