import React from 'react';
import StatusLamp from './hud/StatusLamp';
import Meter from './hud/Meter';
import { ReactorState } from './ArcReactor';

interface StatusBarProps {
  state: ReactorState;
  load: number;
  online: boolean;
  /** True once a reply came from the scripted fallback rather than the model. */
  demoMode?: boolean;
}

const STATE_LABEL: Record<ReactorState, string> = {
  idle: 'Standby',
  listening: 'Receiving',
  thinking: 'Processing',
  speaking: 'Transmitting',
};

const STATE_TONE = {
  idle: 'idle',
  listening: 'active',
  thinking: 'warn',
  speaking: 'ok',
} as const;

const StatusBar: React.FC<StatusBarProps> = ({ state, load, online, demoMode }) => (
  <header className="flex items-start justify-between px-8 pt-7">
    <div>
      <h1 className="font-display text-[1.75rem] font-medium leading-none tracking-[0.28em] text-[#e6edf3]">
        JARVIS
      </h1>
      <p className="etch mt-2">Just A Rather Very Intelligent System</p>
    </div>

    <div className="panel flex items-stretch divide-x divide-[rgba(151,178,199,0.1)]">
      <div className="flex items-center gap-2.5 px-4 py-2.5">
        <StatusLamp tone={STATE_TONE[state]} pulse={state !== 'idle'} />
        <div>
          <div className="etch">Status</div>
          <div className="readout text-xs">{STATE_LABEL[state]}</div>
        </div>
      </div>

      <div className="px-4 py-2.5">
        <div className="etch">Load</div>
        <Meter value={load} tone={load > 0.75 ? 'warn' : 'ice'} segments={8} className="mt-1 w-20" />
      </div>

      {/* Reports what the model layer is actually doing. Saying "Live" while
          serving scripted replies would be the kind of claim this project
          deliberately avoids making. */}
      <div className="flex items-center gap-2.5 px-4 py-2.5">
        <StatusLamp tone={!online ? 'alert' : demoMode ? 'warn' : 'ok'} />
        <div>
          <div className="etch">Model</div>
          <div className="readout text-xs">
            {!online ? 'Offline' : demoMode ? 'Demo' : 'Live'}
          </div>
        </div>
      </div>
    </div>
  </header>
);

export default StatusBar;
