import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X } from 'lucide-react';
import { Message } from '../App';

interface MinimalChatProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  jarvisState: 'idle' | 'listening' | 'thinking' | 'speaking';
  onClose: () => void;
}

const MinimalChat: React.FC<MinimalChatProps> = ({ 
  messages, 
  onSendMessage, 
  jarvisState, 
  onClose 
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-black/90 backdrop-blur-md rounded-2xl border border-cyan-500/30 w-full max-w-md h-[600px] flex flex-col shadow-2xl shadow-cyan-500/20"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-cyan-500/20 bg-gradient-to-r from-black/50 to-cyan-900/10">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            <h3 className="text-white font-light font-mono tracking-wider">J.A.R.V.I.S</h3>
          </div>
          <button
            className="text-white/60 hover:text-white transition-colors hover:bg-white/10 rounded-lg p-1"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-white/40 text-center">
              <div>
                <p className="font-light">Start a conversation</p>
                <p className="text-xs mt-1">Ask me anything</p>
              </div>
            </div>
          ) : (
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className={`max-w-xs px-4 py-2 rounded-2xl ${
                    message.isUser 
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30' 
                      : 'bg-gradient-to-r from-black/60 to-cyan-900/20 text-white border border-cyan-500/30 shadow-lg shadow-cyan-500/10'
                  }`}>
                    <p className="text-sm font-light">{message.text}</p>
                    <p className="text-xs opacity-60 mt-1">{formatTime(message.timestamp)}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-6 border-t border-cyan-500/20 bg-gradient-to-r from-black/50 to-cyan-900/10">
          <div className="flex space-x-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-black/40 border border-cyan-500/30 rounded-full px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-cyan-400 focus:shadow-lg focus:shadow-cyan-400/20 font-light backdrop-blur-sm"
              disabled={jarvisState === 'thinking'}
            />
            <button
              type="submit"
              className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-lg shadow-blue-500/30"
              disabled={!input.trim() || jarvisState === 'thinking'}
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default MinimalChat;