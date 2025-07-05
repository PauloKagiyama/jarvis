import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Clock, TrendingUp, User, X, Download, Trash2, Smartphone, Wifi, WifiOff } from 'lucide-react';
import { ConversationMemoryService } from '../services/ConversationMemoryService';

interface MemoryPanelProps {
  memoryService: ConversationMemoryService;
  onClose: () => void;
}

const MemoryPanel: React.FC<MemoryPanelProps> = ({ memoryService, onClose }) => {
  const [stats, setStats] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [recentConversations, setRecentConversations] = useState<any[]>([]);
  const [deviceHistory, setDeviceHistory] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<any>(null);

  useEffect(() => {
    setStats(memoryService.getConversationStats());
    setUserProfile(memoryService.getUserProfile());
    setRecentConversations(memoryService.getRecentConversations(5));
    setDeviceHistory(memoryService.getDeviceHistory());
    setConnectionStatus(memoryService.getConnectionStatus());
  }, [memoryService]);

  const handleExport = () => {
    const data = memoryService.exportConversations();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jarvis-conversations-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearMemory = () => {
    if (confirm('Are you sure you want to clear all conversation memory? This action cannot be undone.')) {
      memoryService.clearHistory();
      setStats(memoryService.getConversationStats());
      setUserProfile(memoryService.getUserProfile());
      setRecentConversations([]);
      setDeviceHistory([]);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
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
        className="bg-black/95 backdrop-blur-md rounded-2xl border border-cyan-500/30 w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden shadow-2xl shadow-cyan-500/20"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-cyan-500/20 bg-gradient-to-r from-black/50 to-cyan-900/10">
          <div className="flex items-center space-x-3">
            <Brain className="w-6 h-6 text-cyan-400" />
            <h3 className="text-xl font-orbitron text-white tracking-wider">Memory Core</h3>
            <div className="flex items-center space-x-2 ml-4">
              {connectionStatus?.isOnline ? (
                <Wifi className="w-4 h-4 text-green-400" title="Online - Synced" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-400" title="Offline" />
              )}
              <span className="text-xs text-white/60">
                {connectionStatus?.isOnline ? 'Synced' : 'Offline'}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              className="p-2 text-white/60 hover:text-cyan-400 transition-colors rounded-lg hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/30"
              onClick={handleExport}
              title="Export Conversations"
            >
              <Download size={18} />
            </button>
            <button
              className="p-2 text-white/60 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/30"
              onClick={handleClearMemory}
              title="Clear Memory"
            >
              <Trash2 size={18} />
            </button>
            <button
              className="p-2 text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/5 border border-transparent hover:border-white/20"
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Statistics Panel */}
            <div className="space-y-4">
              <h4 className="text-lg font-orbitron text-cyan-400 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Statistics
              </h4>
              
              {stats && (
                <div className="space-y-3">
                  <div className="glass-panel p-4 rounded-lg">
                    <div className="text-2xl font-bold text-white">{stats.totalConversations}</div>
                    <div className="text-sm text-white/60">Total Conversations</div>
                  </div>
                  
                  <div className="glass-panel p-4 rounded-lg">
                    <div className="text-2xl font-bold text-white">{stats.sessionsToday}</div>
                    <div className="text-sm text-white/60">Sessions Today</div>
                  </div>
                  
                  <div className="glass-panel p-4 rounded-lg">
                    <div className="text-2xl font-bold text-white">{stats.averageConversationsPerDay}</div>
                    <div className="text-sm text-white/60">Daily Average</div>
                  </div>
                  
                  <div className="glass-panel p-4 rounded-lg">
                    <div className="text-2xl font-bold text-white">{stats.devicesUsed}</div>
                    <div className="text-sm text-white/60">Devices Used</div>
                  </div>
                </div>
              )}

              {/* Favorite Topics */}
              {stats?.favoriteTopics && stats.favoriteTopics.length > 0 && (
                <div className="glass-panel p-4 rounded-lg">
                  <h5 className="text-sm font-semibold text-cyan-400 mb-3">Favorite Topics</h5>
                  <div className="space-y-2">
                    {stats.favoriteTopics.map((topic: any, index: number) => (
                      <div key={topic.topic} className="flex justify-between items-center">
                        <span className="text-white/80 capitalize">{topic.topic}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-cyan-400 rounded-full"
                              style={{ 
                                width: `${(topic.count / stats.favoriteTopics[0].count) * 100}%` 
                              }}
                            />
                          </div>
                          <span className="text-xs text-white/60 w-6 text-right">{topic.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="space-y-4">
              <h4 className="text-lg font-orbitron text-cyan-400 flex items-center">
                <User className="w-5 h-5 mr-2" />
                User Profile
              </h4>
              
              {userProfile && (
                <div className="glass-panel p-4 rounded-lg space-y-3">
                  <div>
                    <span className="text-xs text-white/60">User ID</span>
                    <div className="text-white font-mono text-xs">{userProfile.userId.substring(0, 16)}...</div>
                  </div>
                  
                  {userProfile.name && (
                    <div>
                      <span className="text-xs text-white/60">Name</span>
                      <div className="text-white">{userProfile.name}</div>
                    </div>
                  )}
                  
                  {userProfile.email && (
                    <div>
                      <span className="text-xs text-white/60">Email</span>
                      <div className="text-white">{userProfile.email}</div>
                    </div>
                  )}
                  
                  {userProfile.personalInfo.occupation && (
                    <div>
                      <span className="text-xs text-white/60">Occupation</span>
                      <div className="text-white">{userProfile.personalInfo.occupation}</div>
                    </div>
                  )}
                  
                  {userProfile.personalInfo.location && (
                    <div>
                      <span className="text-xs text-white/60">Location</span>
                      <div className="text-white">{userProfile.personalInfo.location}</div>
                    </div>
                  )}
                  
                  {userProfile.preferences.communicationStyle && (
                    <div>
                      <span className="text-xs text-white/60">Communication Style</span>
                      <div className="text-white capitalize">{userProfile.preferences.communicationStyle}</div>
                    </div>
                  )}
                  
                  <div>
                    <span className="text-xs text-white/60">Last Active</span>
                    <div className="text-white">
                      {formatDate(new Date(userProfile.conversationStats.lastActiveDate))}
                    </div>
                  </div>
                  
                  {connectionStatus && (
                    <div>
                      <span className="text-xs text-white/60">Last Synced</span>
                      <div className="text-white">
                        {formatDate(connectionStatus.lastSynced)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Device History */}
              <h4 className="text-lg font-orbitron text-cyan-400 flex items-center">
                <Smartphone className="w-5 h-5 mr-2" />
                Device History
              </h4>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {deviceHistory.map((device) => (
                  <div key={device.deviceId} className="glass-panel p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-white font-medium">{device.deviceName}</div>
                        <div className="text-xs text-white/60">
                          {device.browser} • {device.os}
                        </div>
                      </div>
                      <div className="text-xs text-white/60">
                        {formatDate(new Date(device.lastUsed))}
                      </div>
                    </div>
                  </div>
                ))}
                
                {deviceHistory.length === 0 && (
                  <div className="text-center text-white/40 py-4">
                    No device history available
                  </div>
                )}
              </div>
            </div>

            {/* Recent Conversations */}
            <div className="space-y-4">
              <h4 className="text-lg font-orbitron text-cyan-400 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Recent Conversations
              </h4>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentConversations.map((conv) => (
                  <div key={conv.id} className="glass-panel p-3 rounded-lg">
                    <div className="text-xs text-white/60 mb-1 flex justify-between">
                      <span>{formatDate(new Date(conv.timestamp))}</span>
                      <span className="font-mono">{conv.deviceId.substring(0, 8)}...</span>
                    </div>
                    <div className="text-sm text-white/80 mb-2">
                      <strong>You:</strong> {conv.userMessage.substring(0, 80)}
                      {conv.userMessage.length > 80 && '...'}
                    </div>
                    <div className="text-sm text-cyan-300">
                      <strong>JARVIS:</strong> {conv.jarvisResponse.substring(0, 80)}
                      {conv.jarvisResponse.length > 80 && '...'}
                    </div>
                  </div>
                ))}
                
                {recentConversations.length === 0 && (
                  <div className="text-center text-white/40 py-8">
                    No conversations yet. Start chatting to build memory!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MemoryPanel;