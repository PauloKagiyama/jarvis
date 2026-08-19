import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Square } from 'lucide-react';
import { ReactorState } from './ArcReactor';

interface VoiceInterfaceProps {
  isListening: boolean;
  onToggle: () => void;
  onVoiceInput: (text: string) => void;
  state: ReactorState;
  onStopSpeaking: () => void;
}

const STATE_TEXT: Record<ReactorState, string> = {
  idle: 'Awaiting command',
  listening: 'Listening',
  thinking: 'Processing request',
  speaking: 'Responding',
};

const getRecognitionCtor = () =>
  typeof window === 'undefined' ? undefined : window.SpeechRecognition || window.webkitSpeechRecognition;

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({
  isListening,
  onToggle,
  onVoiceInput,
  state,
  onStopSpeaking,
}) => {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [supported] = useState(() => Boolean(getRecognitionCtor()));

  // The recognition object is built once, but its handlers fire long after
  // that render. Routing them through refs keeps them reading current values
  // instead of the props captured when the object was created.
  const shouldListenRef = useRef(isListening);
  const onVoiceInputRef = useRef(onVoiceInput);
  const onToggleRef = useRef(onToggle);

  useEffect(() => {
    shouldListenRef.current = isListening;
    onVoiceInputRef.current = onVoiceInput;
    onToggleRef.current = onToggle;
  });

  useEffect(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;

    const recognition = new Ctor();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const last = event.results[event.results.length - 1];
      if (last.isFinal) {
        onVoiceInputRef.current(last[0].transcript.trim());
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      console.error('Speech recognition error:', event.error);
      if (shouldListenRef.current) onToggleRef.current();
    };

    recognition.onend = () => {
      if (shouldListenRef.current) {
        try {
          recognition.start();
        } catch {
          // Already restarting; the next onend will settle it.
        }
      }
    };

    return () => {
      recognition.onend = null;
      recognition.abort();
      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isListening) {
      try {
        recognition.start();
      } catch {
        // start() throws if it is already running — harmless.
      }
    } else {
      recognition.stop();
    }
  }, [isListening]);

  const handleToggle = () => {
    if (!supported) return;
    onToggle();
  };

  const active = isListening;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-3">
        {/* Physical push-button: raised bezel, inset face, pressed state that
            actually recesses rather than scaling the whole control. */}
        <button
          onClick={handleToggle}
          disabled={!supported}
          aria-pressed={active}
          aria-label={active ? 'Stop listening' : 'Start listening'}
          className={`group relative flex h-14 w-14 items-center justify-center rounded-full border transition-all duration-200 ease-instrument disabled:cursor-not-allowed disabled:opacity-40 ${
            active
              ? 'border-ice/60 bg-ice/10 text-ice-bright'
              : 'border-[rgba(151,178,199,0.2)] bg-hull-800/80 text-[#dde4ea]/55 hover:border-[rgba(151,178,199,0.38)] hover:text-[#dde4ea]/85'
          }`}
          style={{
            boxShadow: active
              ? 'inset 0 1px 0 rgba(190,214,230,0.2), inset 0 0 14px rgba(132,182,214,0.22), 0 0 18px -4px rgba(132,182,214,0.5)'
              : 'inset 0 1px 0 rgba(190,214,230,0.09), inset 0 -2px 5px rgba(0,0,0,0.55), 0 6px 14px -8px rgba(0,0,0,0.9)',
          }}
        >
          {active ? <Mic size={19} strokeWidth={1.6} /> : <MicOff size={19} strokeWidth={1.6} />}
          {active && (
            <span className="pointer-events-none absolute inset-0 rounded-full border border-ice/25 animate-[lamp-breathe_2.4s_ease-in-out_infinite]" />
          )}
        </button>

        {state === 'speaking' && (
          <button
            onClick={onStopSpeaking}
            aria-label="Stop speaking"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-signal-alert/45 bg-signal-alert/10 text-signal-alert transition-colors duration-200 hover:bg-signal-alert/20"
          >
            <Square size={13} strokeWidth={2} />
          </button>
        )}
      </div>

      <p className="etch">{supported ? STATE_TEXT[state] : 'Voice input unavailable'}</p>
    </div>
  );
};

export default VoiceInterface;
