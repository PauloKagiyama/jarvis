import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import ReactorScene from './components/ReactorScene';
import ViewportFrame from './components/ViewportFrame';
import StatusBar from './components/StatusBar';
import TelemetryRail from './components/TelemetryRail';
import ControlBar from './components/ControlBar';
import VoiceInterface from './components/VoiceInterface';
import MinimalChat from './components/MinimalChat';
import MemoryPanel from './components/MemoryPanel';
import { ReactorState } from './components/ArcReactor';
import { AssistantService } from './services/AssistantService';
import {
  ConversationMemoryService,
  ConversationTurn,
} from './services/ConversationMemoryService';

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

function App() {
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [jarvisState, setJarvisState] = useState<ReactorState>('idle');
  const [taskComplexity, setTaskComplexity] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Both services own persistent state (localStorage, speech synthesis), so
  // they must survive re-renders — the clock below re-renders once a second.
  const assistant = useRef<AssistantService>();
  const memoryService = useRef<ConversationMemoryService>();
  if (!assistant.current) assistant.current = new AssistantService();
  if (!memoryService.current) memoryService.current = new ConversationMemoryService();

  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!isListening) {
      setAudioLevel(0);
      return;
    }
    const id = setInterval(() => setAudioLevel(Math.random()), 100);
    return () => clearInterval(id);
  }, [isListening]);

  const handleSendMessage = useCallback(async (text: string) => {
    const ai = assistant.current!;
    const memory = memoryService.current!;

    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-user`, text, isUser: true, timestamp: new Date() },
    ]);
    setJarvisState('thinking');

    const complexity =
      text.length > 50 ? 0.8 : /complex|analyze/i.test(text) ? 0.9 : /weather|time/i.test(text) ? 0.3 : 0.5;
    setTaskComplexity(complexity);

    try {
      // Durable facts about the user ride along as a leading turn; recent
      // exchanges follow as real dialogue rather than a summary.
      const profile = memory.getProfileSummary();
      const history: ConversationTurn[] = [
        ...(profile
          ? [
              { role: 'user' as const, content: `For context, about me: ${profile}` },
              { role: 'assistant' as const, content: 'Noted.' },
            ]
          : []),
        ...memory.getRecentTurns(5),
      ];

      const reply = await ai.getChatResponse(text, history);
      setIsDemoMode(reply.demo);

      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-jarvis`, text: reply.text, isUser: false, timestamp: new Date() },
      ]);

      memory.addConversation(text, reply.text, {
        importance: complexity > 0.7 ? 'high' : complexity > 0.4 ? 'medium' : 'low',
        mood: /please|thank/i.test(text) ? 'formal' : 'casual',
      });

      setJarvisState('speaking');
      await ai.speakText(reply.text);
    } finally {
      setJarvisState('idle');
      setTaskComplexity(0);
    }
  }, []);

  const handleVoiceActivation = useCallback(() => {
    setIsListening((prev) => !prev);
    setJarvisState((prev) => (prev === 'listening' ? 'idle' : prev === 'idle' ? 'listening' : prev));
  }, []);

  const handleVoiceInput = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      setIsListening(false);
      void handleSendMessage(text.trim());
    },
    [handleSendMessage],
  );

  const handleStopSpeaking = useCallback(() => {
    assistant.current!.stopSpeaking();
    setJarvisState('idle');
    setTaskComplexity(0);
  }, []);

  const online = navigator.onLine;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-hull-950">
      <ReactorScene state={jarvisState} taskComplexity={taskComplexity} audioLevel={audioLevel} />

      <TelemetryRail time={currentTime} online={online} sessionCount={messages.length} />
      <ViewportFrame />

      {/* This layer spans the viewport, so it must not intercept drags meant
          for the canvas — only the actual controls opt back into pointer events. */}
      <div className="pointer-events-none relative z-20 flex h-full flex-col">
        <StatusBar
          state={jarvisState}
          load={taskComplexity}
          online={online}
          demoMode={isDemoMode}
        />

        <div className="flex-1" />

        <div className="pointer-events-auto flex flex-col items-center gap-5 pb-9">
          <VoiceInterface
            isListening={isListening}
            onToggle={handleVoiceActivation}
            onVoiceInput={handleVoiceInput}
            state={jarvisState}
            onStopSpeaking={handleStopSpeaking}
          />

          <ControlBar
            items={[
              { label: 'Comms', active: showChat, onClick: () => setShowChat((v) => !v) },
              { label: 'Memory', active: showMemory, onClick: () => setShowMemory((v) => !v) },
            ]}
          />

          <p className="etch !text-[#dde4ea]/25">Drag to orbit · Scroll to zoom</p>
        </div>
      </div>

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

      <AnimatePresence>
        {showMemory && (
          <MemoryPanel memoryService={memoryService.current} onClose={() => setShowMemory(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
