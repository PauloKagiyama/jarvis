import React from 'react';
import Readout from './hud/Readout';

interface TelemetryRailProps {
  time: Date;
  online: boolean;
  sessionCount: number;
}

const TelemetryRail: React.FC<TelemetryRailProps> = ({ time, online, sessionCount }) => (
  <div className="pointer-events-none absolute inset-0 z-20">
    <div className="panel absolute left-8 top-1/2 -translate-y-1/2 space-y-3 px-3 py-3">
      <Readout label="Core" value="Nominal" tone="ok" />
      <Readout label="Output" value="1.21 GW" />
      <Readout label="Thermal" value="34.2 °C" />
    </div>

    <div className="panel absolute right-8 top-1/2 -translate-y-1/2 space-y-3 px-3 py-3">
      <Readout label="Uplink" value={online ? 'Active' : 'Down'} tone={online ? 'ok' : 'alert'} align="right" />
      <Readout label="Memory" value={`${sessionCount} rec`} align="right" />
      <Readout label="Latency" value="18 ms" align="right" />
    </div>

    <div className="absolute bottom-8 left-8">
      <Readout label="Position" value="40.7128°N  74.0060°W" tone="dim" />
    </div>

    <div className="absolute bottom-8 right-8">
      <Readout
        label="Time"
        value={time.toLocaleTimeString([], {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })}
        align="right"
        tone="dim"
      />
    </div>
  </div>
);

export default TelemetryRail;
