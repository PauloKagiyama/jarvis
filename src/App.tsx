import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import ArcReactor from './components/ArcReactor';
import VoiceInterface from './components/VoiceInterface';
import MinimalChat from './components/MinimalChat';
import { OpenAIService } from './services/OpenAIService';
import { ConversationMemoryService } from './services/ConversationMemoryService';
import MemoryPanel from './components/MemoryPanel';

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

// Extend Window interface for speech recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

function App() {
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [jarvisState, setJarvisState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [taskComplexity, setTaskComplexity] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
  
  // Add state for real-time clock updates
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Add system status and capabilities
  const [systemStatus, setSystemStatus] = useState({
    powerLevel: 100,
    networkStatus: 'online',
    lastUpdate: new Date(),
    activeModules: ['voice', 'memory', 'ai', 'interface']
  });
  
  const openAIService = new OpenAIService();
  const memoryService = new ConversationMemoryService();

  useEffect(() => {
    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Simulate audio level for waveform
    const audioTimer = setInterval(() => {
      if (isListening) {
        setAudioLevel(Math.random());
      }
    }, 100);

    return () => {
      clearInterval(timeInterval);
      clearInterval(audioTimer);
    };
  }, [isListening]);

  const handleVoiceActivation = () => {
    if (jarvisState === 'idle') {
      setIsListening(true);
      setJarvisState('listening');
    } else if (jarvisState === 'listening') {
      setIsListening(false);
      setJarvisState('idle');
    }
  };

  const handleVoiceInput = async (text: string) => {
    if (text.trim()) {
      setIsListening(false);
      await handleSendMessage(text.trim());
    }
  };

  const handleSendMessage = async (text: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setJarvisState('thinking');
    
    // Set task complexity based on message content
    const complexity = text.length > 50 ? 0.8 : 
                      text.includes('complex') || text.includes('analyze') ? 0.9 : 
                      text.includes('weather') || text.includes('time') ? 0.3 : 0.5;
    setTaskComplexity(complexity);

    try {
      // Get AI response from OpenAI
      const conversationContext = memoryService.getConversationContext();
      const aiResponseText = await openAIService.getChatResponse(text, conversationContext);
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiResponse]);
      
      // Store conversation in memory
      memoryService.addConversation(text, aiResponseText, {
        importance: complexity > 0.7 ? 'high' : complexity > 0.4 ? 'medium' : 'low',
        topics: text.length > 50 ? ['detailed'] : ['simple'],
        mood: text.includes('please') || text.includes('thank') ? 'formal' : 'casual'
      });
      
      // Set to speaking state before starting speech
      setJarvisState('speaking');
      
      // Speak the response
      await openAIService.speakText(aiResponseText);
      
      // Return to idle after speech completes
      setJarvisState('idle');
      setTaskComplexity(0);
      
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "I apologize, but I'm experiencing technical difficulties. Please check your OpenAI API configuration.",
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorResponse]);
      setJarvisState('idle');
      setTaskComplexity(0);
    }
  };

  const handleStopSpeaking = () => {
    openAIService.stopSpeaking();
    setJarvisState('idle');
    setTaskComplexity(0);
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Futuristic Grid Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-grid-pattern"></div>
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black"></div>
      </div>
      
      {/* Scanning Lines Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="scanning-line"></div>
        <div className="scanning-line-vertical"></div>
      </div>
      
      {/* Data Stream Lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            className="data-stream"
            style={{
              left: `${10 + i * 12}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${4 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>
      
      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 30 }, (_, i) => (
          <div
            key={i}
            className={`floating-particle ${i % 3 === 0 ? 'particle-large' : i % 2 === 0 ? 'particle-medium' : 'particle-small'}`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${15 + Math.random() * 10}s`,
              '--particle-color': i % 4 === 0 ? '#00d4ff' : i % 3 === 0 ? '#00ffff' : i % 2 === 0 ? '#8b5cf6' : '#00ff88'
            }}
          />
        ))}
      </div>
      
      {/* Holographic Interface Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top-left HUD elements */}
        <div className="absolute top-32 left-8 space-y-2">
          <div className="hud-element">
            <div className="text-xs text-cyan-400 font-mono">SYS.STATUS</div>
            <div className="text-xs text-white/60 font-mono">OPERATIONAL</div>
          </div>
          <div className="hud-element">
            <div className="text-xs text-cyan-400 font-mono">PWR.CORE</div>
            <div className="text-xs text-white/60 font-mono">100%</div>
          </div>
        </div>
        
        {/* Top-right HUD elements */}
        <div className="absolute top-32 right-8 space-y-2 text-right">
          <div className="hud-element">
            <div className="text-xs text-cyan-400 font-mono">NET.LINK</div>
            <div className="text-xs text-white/60 font-mono">SECURE</div>
          </div>
          <div className="hud-element">
            <div className="text-xs text-cyan-400 font-mono">AI.CORE</div>
            <div className="text-xs text-white/60 font-mono">ACTIVE</div>
          </div>
        </div>
        
        {/* Bottom-left coordinates */}
        <div className="absolute bottom-8 left-8">
          <div className="hud-element">
            <div className="text-xs text-cyan-400 font-mono">COORD</div>
            <div className="text-xs text-white/60 font-mono">40.7128°N 74.0060°W</div>
          </div>
        </div>
        
        {/* Bottom-right timestamp */}
        <div className="absolute bottom-8 right-8">
          <div className="hud-element">
            <div className="text-xs text-cyan-400 font-mono">TIME</div>
            <div className="text-xs text-white/60 font-mono">
              {currentTime.toLocaleTimeString([], { 
                hour12: false, 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit' 
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main 3D Scene */}
      <div className="absolute inset-0 z-10">
        <Canvas 
          camera={{ position: [0, 0, 10], fov: 50 }}
          gl={{ antialias: true, alpha: true }}
          onCreated={({ gl }) => {
            gl.setClearColor('#000000', 0);
          }}
        >
          <Suspense fallback={null}>
            <ArcReactor 
              state={jarvisState} 
              taskComplexity={taskComplexity}
              audioLevel={audioLevel}
            />
            
            {/* Ambient Lighting */}
            <ambientLight intensity={0.1} />
            <fog attach="fog" args={['#000000', 20, 35]} />
          </Suspense>
        </Canvas>
      </div>

      {/* Minimal UI Overlay */}
      <div className="relative z-20 min-h-screen flex flex-col">
        {/* Original J.A.R.V.I.S Header */}
        <motion.header 
          className="flex justify-between items-center p-6 relative"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          {/* Header Glow Background */}
          <div className="absolute top-0 left-0 w-80 h-32 header-glow pointer-events-none"></div>
          
          <div className="flex flex-col relative z-10">
            <motion.h1 
              className="text-5xl font-orbitron font-bold holographic-text"
              animate={{ 
                textShadow: [
                  '0 0 20px #00d4ff',
                  '0 0 40px #00ffff',
                  '0 0 20px #00d4ff'
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              J.A.R.V.I.S
            </motion.h1>
            <div className="text-[15px] text-neon-cyan font-inter mt-1 subtitle-glow">
              Just A Rather Very Intelligent System
            </div>
          </div>
          
          {/* System Status Indicator */}
          <div className="glass-panel p-3 rounded-lg">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  jarvisState === 'idle' ? 'bg-neon-blue' :
                  jarvisState === 'listening' ? 'bg-neon-cyan animate-pulse' :
                  jarvisState === 'thinking' ? 'bg-neon-purple animate-pulse' :
                  'bg-neon-green animate-pulse'
                }`} />
                <span className="text-white font-orbitron text-sm uppercase">
                  {jarvisState === 'thinking' ? 'Processing' : jarvisState}
                </span>
              </div>
              
              {/* Power Level Indicator */}
              <div className="flex items-center space-x-2">
                <div className="w-16 h-1 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-neon-cyan rounded-full transition-all duration-300"
                    style={{ width: `${systemStatus.powerLevel}%` }}
                  />
                </div>
                <span className="text-xs text-white/60">{systemStatus.powerLevel}%</span>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom Interface */}
        <motion.div 
          className="p-8 space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {/* Voice Interface */}
          <VoiceInterface 
            isListening={isListening}
            onToggle={handleVoiceActivation}
            onVoiceInput={handleVoiceInput}
            state={jarvisState}
            audioLevel={audioLevel}
            onStopSpeaking={handleStopSpeaking}
          />
          
          {/* Chat Toggle */}
          <div className="flex justify-center">
            <div className="flex space-x-6">
              <motion.button
                className="text-white/60 hover:text-white text-sm font-light transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowChat(!showChat)}
              >
                {showChat ? 'Hide Chat' : 'Show Chat'}
              </motion.button>
              
              <motion.button
                className="text-white/60 hover:text-cyan-400 text-sm font-light transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowMemory(!showMemory)}
              >
                {showMemory ? 'Close Memory' : 'Memory Core'}
              </motion.button>
              
              <motion.button
                className="text-white/60 hover:text-purple-400 text-sm font-light transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  // Simulate system diagnostics
                  setJarvisState('thinking');
                  setTimeout(() => {
                    setJarvisState('idle');
                    alert('All systems operational. Power level: 100%. Network: Online. AI Core: Active.');
                  }, 2000);
                }}
              >
                System Status
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Minimal Chat Interface */}
      <AnimatePresence>
        {showChat && (
          <MinimalChat 
            messages={messages}
            onSendMessage={handleSendMessage}
            jarvisState={jarvisState}
            onClose={() => setShowChat(false)}
          />
        )}
      </AnimatePresence>

      {/* Memory Panel */}
      <AnimatePresence>
        {showMemory && (
          <MemoryPanel 
            memoryService={memoryService}
            onClose={() => setShowMemory(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;