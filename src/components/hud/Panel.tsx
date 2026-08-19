import React from 'react';

interface PanelProps {
  label?: string;
  children: React.ReactNode;
  className?: string;
  inset?: boolean;
}

const Panel: React.FC<PanelProps> = ({ label, children, className = '', inset }) => (
  <div className={`${inset ? 'panel-inset' : 'panel'} ${className}`}>
    {label && (
      <div className="flex items-center gap-2 px-3 pt-2">
        <span className="etch">{label}</span>
        <span className="h-px flex-1 bg-[rgba(151,178,199,0.12)]" />
      </div>
    )}
    {children}
  </div>
);

export default Panel;
