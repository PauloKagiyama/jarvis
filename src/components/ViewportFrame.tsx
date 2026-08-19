import React from 'react';

/* Non-interactive optics layer sitting over the whole scene: registration
   corners, vignette, scanlines and grain. Everything here is deliberately
   near-threshold — it should be felt more than seen. */
const ViewportFrame: React.FC = () => (
  <div className="pointer-events-none absolute inset-0 z-30">
    <div className="absolute inset-0 vignette" />
    <div className="absolute inset-0 scanlines" />
    <div className="absolute inset-0 grain" />

    <div className="frame-corner left-5 top-5 border-l border-t" />
    <div className="frame-corner right-5 top-5 border-r border-t" />
    <div className="frame-corner bottom-5 left-5 border-b border-l" />
    <div className="frame-corner bottom-5 right-5 border-b border-r" />

    {/* Centre reticle ticks — small alignment marks on the optical axis. */}
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      <div className="relative h-px w-px">
        {(
          [
            'left-[-160px] top-0 h-px w-3',
            'left-[160px] top-0 h-px w-3',
          ] as const
        ).map((cls) => (
          <div key={cls} className={`absolute bg-[rgba(151,178,199,0.25)] ${cls}`} />
        ))}
      </div>
    </div>
  </div>
);

export default ViewportFrame;
