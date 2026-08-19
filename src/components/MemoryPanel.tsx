import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Download, Trash2 } from 'lucide-react';
import {
  ConversationMemoryService,
  ConversationEntry,
  DeviceInfo,
  UserProfile,
} from '../services/ConversationMemoryService';
import Meter from './hud/Meter';
import StatusLamp from './hud/StatusLamp';

type Stats = ReturnType<ConversationMemoryService['getConversationStats']>;

interface MemoryPanelProps {
  memoryService: ConversationMemoryService;
  onClose: () => void;
}

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);

const MemoryPanel: React.FC<MemoryPanelProps> = ({ memoryService, onClose }) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [recentConversations, setRecentConversations] = useState<ConversationEntry[]>([]);
  const [deviceHistory, setDeviceHistory] = useState<DeviceInfo[]>([]);


  const refresh = () => {
    setStats(memoryService.getConversationStats());
    setUserProfile(memoryService.getUserProfile());
    setRecentConversations(memoryService.getRecentConversations(6));
    setDeviceHistory(memoryService.getDeviceHistory());
  };

  useEffect(refresh, [memoryService]);

  const handleExport = () => {
    const blob = new Blob([memoryService.exportConversations()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jarvis-memory-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearMemory = () => {
    if (confirm('Purge all stored conversation memory? This cannot be undone.')) {
      memoryService.clearHistory();
      refresh();
    }
  };

  const topCount = stats?.favoriteTopics[0]?.count ?? 1;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-hull-950/70 p-6 backdrop-blur-[3px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="panel flex h-[min(38rem,82vh)] w-full max-w-3xl flex-col overflow-hidden"
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[rgba(151,178,199,0.1)] px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <StatusLamp tone="active" size={6} />
            <span className="etch">Memory Core</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleExport}
              title="Export archive"
              className="rounded p-1.5 text-[#dde4ea]/45 transition-colors hover:bg-white/5 hover:text-ice"
            >
              <Download size={15} strokeWidth={1.6} />
            </button>
            <button
              onClick={handleClearMemory}
              title="Purge memory"
              className="rounded p-1.5 text-[#dde4ea]/45 transition-colors hover:bg-signal-alert/10 hover:text-signal-alert"
            >
              <Trash2 size={15} strokeWidth={1.6} />
            </button>
            <button
              onClick={onClose}
              aria-label="Close"
              className="rounded p-1.5 text-[#dde4ea]/45 transition-colors hover:bg-white/5 hover:text-[#dde4ea]"
            >
              <X size={15} strokeWidth={1.6} />
            </button>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-5 overflow-y-auto p-5 lg:grid-cols-3">
          <section className="space-y-3">
            <div className="etch">Statistics</div>
            {stats && (
              <div className="grid grid-cols-2 gap-2">
                {[
                  ['Records', stats.totalConversations],
                  ['Sessions', stats.sessionsToday],
                  ['Daily avg', stats.averageConversationsPerDay],
                  ['Devices', stats.devicesUsed],
                ].map(([label, value]) => (
                  <div key={label} className="panel-inset px-3 py-2.5">
                    <div className="readout text-lg text-[#e6edf3]">{value}</div>
                    <div className="etch mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            )}

            {stats && stats.favoriteTopics.length > 0 && (
              <div className="panel-inset space-y-2.5 px-3 py-3">
                <div className="etch">Topic distribution</div>
                {stats.favoriteTopics.map((topic) => (
                  <div key={topic.topic} className="space-y-1">
                    <div className="flex justify-between">
                      <span className="readout text-2xs capitalize">{topic.topic}</span>
                      <span className="readout text-2xs text-[#dde4ea]/45">{topic.count}</span>
                    </div>
                    <Meter value={topic.count / topCount} segments={10} />
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <div className="etch">Operator Profile</div>
            {userProfile && (
              <div className="panel-inset space-y-2.5 px-3 py-3">
                {(
                  [
                    ['ID', `${userProfile.userId.slice(0, 18)}…`],
                    ['Name', userProfile.name],
                    ['Email', userProfile.email],
                    ['Occupation', userProfile.personalInfo.occupation],
                    ['Location', userProfile.personalInfo.location],
                    ['Style', userProfile.preferences.communicationStyle],
                    ['Last active', formatDate(new Date(userProfile.conversationStats.lastActiveDate))],
                    ['Storage', 'This browser only'],
                  ] as const
                )
                  .filter(([, value]) => Boolean(value))
                  .map(([label, value]) => (
                    <div key={label}>
                      <div className="etch">{label}</div>
                      <div className="readout text-xs capitalize">{value}</div>
                    </div>
                  ))}
              </div>
            )}

            <div className="etch pt-1">Devices</div>
            <div className="space-y-1.5">
              {deviceHistory.length === 0 ? (
                <p className="etch">No records</p>
              ) : (
                deviceHistory.map((device) => (
                  <div
                    key={device.deviceId}
                    className="panel-inset flex items-center justify-between px-3 py-2"
                  >
                    <span className="readout text-2xs">{device.deviceName}</span>
                    <span className="etch">{formatDate(new Date(device.lastUsed))}</span>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="space-y-3">
            <div className="etch">Recent Exchanges</div>
            <div className="space-y-2">
              {recentConversations.length === 0 ? (
                <p className="etch">No records</p>
              ) : (
                recentConversations.map((conv) => (
                  <div key={conv.id} className="panel-inset space-y-1.5 px-3 py-2.5">
                    <div className="etch">{formatDate(new Date(conv.timestamp))}</div>
                    <p className="text-2xs leading-relaxed text-[#dde4ea]/75">
                      {conv.userMessage.slice(0, 90)}
                      {conv.userMessage.length > 90 && '…'}
                    </p>
                    <p className="text-2xs leading-relaxed text-ice/80">
                      {conv.jarvisResponse.slice(0, 90)}
                      {conv.jarvisResponse.length > 90 && '…'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MemoryPanel;
