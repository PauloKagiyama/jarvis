import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Square } from 'lucide-react';

interface VoiceInterfaceProps {
  isListening: boolean;
  onToggle: () => void;
  onVoiceInput: (text: string) => void;
  state: 'idle' | 'listening' | 'thinking' | 'speaking';
  audioLevel: number;
  onStopSpeaking: () => void;
}

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({ 
  isListening, 
  onToggle, 
  onVoiceInput, 
  state,
  audioLevel,
  onStopSpeaking
}) => {
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');

        if (event.results[event.results.length - 1].isFinal) {
          onVoiceInput(transcript);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        // Only stop listening on actual errors, not normal completion
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          onToggle();
        }
      };

      recognition.onend = () => {
        // Only restart if we're still supposed to be listening
        if (isListening && state === 'listening') {
          recognition.start();
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (recognitionRef.current) {
      if (isListening) {
        try {
          recognitionRef.current.start();
        } catch (error) {
          console.error('Error starting speech recognition:', error);
        }
      } else {
        recognitionRef.current.stop();
      }
    }
  }, [isListening]);

  const getStateText = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      return 'Voice recognition not available';
    }
    
    switch (state) {
      case 'listening':
        return 'I\'m listening...';
      case 'thinking':
        return 'Processing your request...';
      case 'speaking':
        return 'JARVIS is responding...';
      default:
        return 'Ready for your command';
    }
  };

  const handleToggle = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }
    onToggle();
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Voice Control Buttons */}
      <div className="flex items-center space-x-4">
        {/* Main Voice Button */}
        <motion.button
          className={`relative w-16 h-16 rounded-full backdrop-blur-md border transition-all duration-300 ${
            isListening 
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400 shadow-lg shadow-cyan-400/50' 
              : 'bg-white/5 border-white/20 text-white/60 hover:text-white hover:border-white/40 hover:shadow-lg hover:shadow-white/20'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleToggle}
          animate={{
            boxShadow: isListening 
              ? [
                  '0 0 0 0 rgba(0, 255, 255, 0.4), 0 0 20px rgba(0, 212, 255, 0.3)',
                  '0 0 0 20px rgba(0, 255, 255, 0), 0 0 40px rgba(0, 212, 255, 0.1)'
                ]
              : '0 0 0 0 rgba(255, 255, 255, 0), 0 0 0 rgba(0, 212, 255, 0)'
          }}
          transition={{ duration: 1.5, repeat: isListening ? Infinity : 0 }}
        >
          {isListening ? (
            <Mic size={24} className="mx-auto" />
          ) : (
            <MicOff size={24} className="mx-auto" />
          )}
        </motion.button>

        {/* Stop Speaking Button - Only show when speaking */}
        {state === 'speaking' && (
          <motion.button
            className="w-12 h-12 rounded-full bg-red-500/20 border border-red-400 text-red-400 backdrop-blur-md hover:bg-red-500/30 transition-all duration-300 shadow-lg shadow-red-400/30"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onStopSpeaking}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            title="Stop Speaking"
          >
            <Square size={16} className="mx-auto" />
          </motion.button>
        )}
      </div>

      {/* Status Text */}
      <motion.p 
        className="text-white/60 text-sm font-light text-center font-mono tracking-wider"
        animate={{ 
          opacity: [0.6, 1, 0.6],
          textShadow: [
            '0 0 4px rgba(0, 212, 255, 0.3)',
            '0 0 8px rgba(0, 212, 255, 0.6)',
            '0 0 4px rgba(0, 212, 255, 0.3)'
          ]
        }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        {getStateText()}
      </motion.p>
    </div>
  );
};

export default VoiceInterface;