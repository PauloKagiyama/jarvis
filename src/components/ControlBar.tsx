import React from 'react';

interface ControlBarProps {
  items: Array<{ label: string; active: boolean; onClick: () => void }>;
}

const ControlBar: React.FC<ControlBarProps> = ({ items }) => (
  <div className="panel flex items-stretch divide-x divide-[rgba(151,178,199,0.1)] overflow-hidden">
    {items.map((item) => (
      <button
        key={item.label}
        onClick={item.onClick}
        aria-pressed={item.active}
        className={`px-4 py-2 transition-colors duration-200 ease-instrument ${
          item.active
            ? 'bg-ice/10 text-ice-bright'
            : 'text-[#dde4ea]/50 hover:bg-white/[0.03] hover:text-[#dde4ea]/85'
        }`}
      >
        <span className="etch !text-current">{item.label}</span>
      </button>
    ))}
  </div>
);

export default ControlBar;
