import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, X } from 'lucide-react';
import { Message } from '../App';
import { ReactorState } from './ArcReactor';
import StatusLamp from './hud/StatusLamp';

interface MinimalChatProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  jarvisState: ReactorState;
  onClose: () => void;
}

const MinimalChat: React.FC<MinimalChatProps> = ({
  messages,
  onSendMessage,
  jarvisState,
  onClose,
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const busy = jarvisState === 'thinking';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !busy) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' });

  return (
    <motion.aside
      className="panel fixed bottom-6 right-6 z-40 flex h-[min(32rem,70vh)] w-[22rem] flex-col overflow-hidden"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center justify-between border-b border-[rgba(151,178,199,0.1)] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <StatusLamp tone={busy ? 'warn' : 'active'} pulse={busy} size={6} />
          <span className="etch">Comms Channel</span>
        </div>
        <button
          onClick={onClose}
          aria-label="Close chat"
          className="rounded p-1 text-[#dde4ea]/45 transition-colors hover:bg-white/5 hover:text-[#dde4ea]"
        >
          <X size={15} strokeWidth={1.6} />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="etch text-center">No transmissions</p>
          </div>
        ) : (
          messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={message.isUser ? 'flex justify-end' : 'flex justify-start'}
            >
              <div
                className={`max-w-[85%] rounded px-3 py-2 text-[0.8125rem] leading-relaxed ${
                  message.isUser
                    ? 'bg-ice/12 text-[#e6edf3] border border-ice/20'
                    : 'panel-inset text-[#dde4ea]/88'
                }`}
              >
                <p>{message.text}</p>
                <p className="etch mt-1.5 !tracking-[0.1em]">{formatTime(message.timestamp)}</p>
              </div>
            </motion.div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-[rgba(151,178,199,0.1)] px-3 py-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={busy ? 'Processing…' : 'Enter command'}
          disabled={busy}
          className="panel-inset flex-1 bg-transparent px-3 py-2 font-mono text-xs text-[#e6edf3] placeholder-[#dde4ea]/30 outline-none transition-colors focus:border-ice/40 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || busy}
          aria-label="Send message"
          className="flex h-9 w-9 items-center justify-center rounded border border-ice/25 bg-ice/10 text-ice transition-colors hover:bg-ice/20 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Send size={14} strokeWidth={1.7} />
        </button>
      </form>
    </motion.aside>
  );
};

export default MinimalChat;
