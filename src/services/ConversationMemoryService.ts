export interface ConversationEntry {
  id: string;
  userMessage: string;
  jarvisResponse: string;
  timestamp: Date;
  sessionId: string;
  userId: string;
  deviceId: string;
  context?: {
    userPreferences?: Record<string, any>;
    topics?: string[];
    mood?: 'formal' | 'casual' | 'technical' | 'friendly';
    importance?: 'low' | 'medium' | 'high';
  };
}

export interface UserProfile {
  userId: string;
  name?: string;
  email?: string;
  preferences: {
    communicationStyle?: 'formal' | 'casual' | 'technical';
    interests?: string[];
    timezone?: string;
    language?: string;
  };
  personalInfo: {
    occupation?: string;
    location?: string;
    projects?: string[];
  };
  conversationStats: {
    totalConversations: number;
    favoriteTopics: Record<string, number>;
    lastActiveDate: Date;
    totalInteractions: number;
    devicesUsed: string[];
  };
  createdAt: Date;
  lastSyncedAt: Date;
}

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  browser: string;
  os: string;
  lastUsed: Date;
}

export class ConversationMemoryService {
  private static readonly STORAGE_KEY = 'jarvis_conversation_memory';
  private static readonly USER_PROFILE_KEY = 'jarvis_user_profile';
  private static readonly USER_ID_KEY = 'jarvis_user_id';
  private static readonly DEVICE_ID_KEY = 'jarvis_device_id';
  private static readonly SESSION_KEY = 'jarvis_session_id';
  private static readonly MAX_STORED_CONVERSATIONS = 1000;
  private static readonly CONTEXT_WINDOW_SIZE = 20;

  private currentSessionId: string;
  private currentUserId: string;
  private currentDeviceId: string;
  private conversationHistory: ConversationEntry[] = [];
  private userProfile: UserProfile;
  private isOnline: boolean = navigator.onLine;

  constructor() {
    this.currentSessionId = this.generateSessionId();
    this.currentUserId = this.getOrCreateUserId();
    this.currentDeviceId = this.getOrCreateDeviceId();
    
    this.setupOnlineStatusListener();
    this.loadConversationHistory();
    this.loadUserProfile();
    this.syncWithCloud();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getOrCreateUserId(): string {
    let userId = localStorage.getItem(ConversationMemoryService.USER_ID_KEY);
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(ConversationMemoryService.USER_ID_KEY, userId);
    }
    return userId;
  }

  private getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem(ConversationMemoryService.DEVICE_ID_KEY);
    if (!deviceId) {
      const deviceInfo = this.getDeviceInfo();
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(ConversationMemoryService.DEVICE_ID_KEY, deviceId);
      
      // Store device info for identification
      localStorage.setItem(`jarvis_device_info_${deviceId}`, JSON.stringify({
        deviceId,
        deviceName: deviceInfo.deviceName,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        lastUsed: new Date()
      }));
    }
    return deviceId;
  }

  private getDeviceInfo(): DeviceInfo {
    const userAgent = navigator.userAgent;
    let browser = 'Unknown';
    let os = 'Unknown';

    // Detect browser
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    // Detect OS
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS')) os = 'iOS';

    return {
      deviceId: this.currentDeviceId,
      deviceName: `${browser} on ${os}`,
      browser,
      os,
      lastUsed: new Date()
    };
  }

  private setupOnlineStatusListener(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncWithCloud();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private async syncWithCloud(): Promise<void> {
    if (!this.isOnline) return;

    try {
      // In a real implementation, this would sync with a cloud service
      // For now, we'll simulate cloud sync with enhanced localStorage
      await this.simulateCloudSync();
    } catch (error) {
      console.error('Cloud sync failed:', error);
    }
  }

  private async simulateCloudSync(): Promise<void> {
    // Simulate cloud storage using localStorage with user-specific keys
    const cloudKey = `jarvis_cloud_${this.currentUserId}`;
    const cloudData = localStorage.getItem(cloudKey);
    
    if (cloudData) {
      try {
        const parsed = JSON.parse(cloudData);
        
        // Merge cloud data with local data
        if (parsed.conversations && Array.isArray(parsed.conversations)) {
          const cloudConversations = parsed.conversations.map((conv: any) => ({
            ...conv,
            timestamp: new Date(conv.timestamp)
          }));
          
          // Merge conversations, avoiding duplicates
          const mergedConversations = this.mergeConversations(this.conversationHistory, cloudConversations);
          this.conversationHistory = mergedConversations;
        }
        
        if (parsed.userProfile) {
          this.userProfile = {
            ...parsed.userProfile,
            conversationStats: {
              ...parsed.userProfile.conversationStats,
              lastActiveDate: new Date(parsed.userProfile.conversationStats.lastActiveDate)
            },
            createdAt: new Date(parsed.userProfile.createdAt),
            lastSyncedAt: new Date(parsed.userProfile.lastSyncedAt)
          };
        }
      } catch (error) {
        console.error('Error parsing cloud data:', error);
      }
    }
    
    // Update cloud with current data
    this.saveToCloud();
  }

  private mergeConversations(local: ConversationEntry[], cloud: ConversationEntry[]): ConversationEntry[] {
    const merged = [...local];
    const localIds = new Set(local.map(conv => conv.id));
    
    // Add cloud conversations that aren't in local storage
    cloud.forEach(cloudConv => {
      if (!localIds.has(cloudConv.id)) {
        merged.push(cloudConv);
      }
    });
    
    // Sort by timestamp and limit to max conversations
    return merged
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .slice(-ConversationMemoryService.MAX_STORED_CONVERSATIONS);
  }

  private async saveToCloud(): Promise<void> {
    if (!this.isOnline) return;

    try {
      const cloudKey = `jarvis_cloud_${this.currentUserId}`;
      const cloudData = {
        conversations: this.conversationHistory,
        userProfile: {
          ...this.userProfile,
          lastSyncedAt: new Date()
        },
        lastUpdated: new Date()
      };
      
      localStorage.setItem(cloudKey, JSON.stringify(cloudData));
    } catch (error) {
      console.error('Error saving to cloud:', error);
    }
  }

  private loadConversationHistory(): void {
    try {
      const stored = localStorage.getItem(ConversationMemoryService.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.conversationHistory = parsed
          .filter((entry: any) => entry.userId === this.currentUserId)
          .map((entry: any) => ({
            ...entry,
            timestamp: new Date(entry.timestamp)
          }));
      }
    } catch (error) {
      console.error('Error loading conversation history:', error);
      this.conversationHistory = [];
    }
  }

  private loadUserProfile(): void {
    try {
      const stored = localStorage.getItem(ConversationMemoryService.USER_PROFILE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.userId === this.currentUserId) {
          this.userProfile = {
            ...parsed,
            conversationStats: {
              ...parsed.conversationStats,
              lastActiveDate: new Date(parsed.conversationStats.lastActiveDate)
            },
            createdAt: new Date(parsed.createdAt),
            lastSyncedAt: new Date(parsed.lastSyncedAt || Date.now())
          };
        } else {
          this.initializeUserProfile();
        }
      } else {
        this.initializeUserProfile();
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      this.initializeUserProfile();
    }
  }

  private initializeUserProfile(): void {
    this.userProfile = {
      userId: this.currentUserId,
      preferences: {},
      personalInfo: {},
      conversationStats: {
        totalConversations: 0,
        favoriteTopics: {},
        lastActiveDate: new Date(),
        totalInteractions: 0,
        devicesUsed: [this.currentDeviceId]
      },
      createdAt: new Date(),
      lastSyncedAt: new Date()
    };
  }

  private saveConversationHistory(): void {
    try {
      // Save all conversations (from all users) to maintain compatibility
      const allConversations = this.getAllStoredConversations();
      const updatedConversations = allConversations.filter(conv => conv.userId !== this.currentUserId);
      updatedConversations.push(...this.conversationHistory);
      
      localStorage.setItem(
        ConversationMemoryService.STORAGE_KEY, 
        JSON.stringify(updatedConversations.slice(-ConversationMemoryService.MAX_STORED_CONVERSATIONS))
      );
      
      // Also save to cloud
      this.saveToCloud();
    } catch (error) {
      console.error('Error saving conversation history:', error);
    }
  }

  private getAllStoredConversations(): ConversationEntry[] {
    try {
      const stored = localStorage.getItem(ConversationMemoryService.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored).map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        }));
      }
    } catch (error) {
      console.error('Error loading all conversations:', error);
    }
    return [];
  }

  private saveUserProfile(): void {
    try {
      // Update device usage
      if (!this.userProfile.conversationStats.devicesUsed.includes(this.currentDeviceId)) {
        this.userProfile.conversationStats.devicesUsed.push(this.currentDeviceId);
      }
      
      this.userProfile.lastSyncedAt = new Date();
      
      localStorage.setItem(
        ConversationMemoryService.USER_PROFILE_KEY,
        JSON.stringify(this.userProfile)
      );
      
      // Also save to cloud
      this.saveToCloud();
    } catch (error) {
      console.error('Error saving user profile:', error);
    }
  }

  public addConversation(userMessage: string, jarvisResponse: string, context?: ConversationEntry['context']): void {
    const entry: ConversationEntry = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userMessage,
      jarvisResponse,
      timestamp: new Date(),
      sessionId: this.currentSessionId,
      userId: this.currentUserId,
      deviceId: this.currentDeviceId,
      context
    };

    this.conversationHistory.push(entry);
    this.updateUserProfile(userMessage, context);
    this.saveConversationHistory();
    this.saveUserProfile();
  }

  private updateUserProfile(userMessage: string, context?: ConversationEntry['context']): void {
    // Update conversation stats
    this.userProfile.conversationStats.totalConversations++;
    this.userProfile.conversationStats.totalInteractions++;
    this.userProfile.conversationStats.lastActiveDate = new Date();

    // Extract and update topics
    const topics = this.extractTopics(userMessage);
    topics.forEach(topic => {
      this.userProfile.conversationStats.favoriteTopics[topic] = 
        (this.userProfile.conversationStats.favoriteTopics[topic] || 0) + 1;
    });

    // Update preferences based on context
    if (context?.mood && !this.userProfile.preferences.communicationStyle) {
      this.userProfile.preferences.communicationStyle = context.mood;
    }

    // Extract personal information from conversations
    this.extractPersonalInfo(userMessage);
  }

  private extractTopics(message: string): string[] {
    const topics: string[] = [];
    const lowerMessage = message.toLowerCase();

    // Technology topics
    if (lowerMessage.match(/\b(programming|code|software|development|tech|computer|ai|machine learning|data)\b/)) {
      topics.push('technology');
    }

    // Work/Business topics
    if (lowerMessage.match(/\b(work|job|business|project|meeting|deadline|client|company)\b/)) {
      topics.push('work');
    }

    // Personal topics
    if (lowerMessage.match(/\b(family|friend|personal|life|hobby|interest|vacation|travel)\b/)) {
      topics.push('personal');
    }

    // Science topics
    if (lowerMessage.match(/\b(science|research|experiment|study|analysis|data|physics|chemistry|biology)\b/)) {
      topics.push('science');
    }

    // Entertainment topics
    if (lowerMessage.match(/\b(movie|music|game|book|entertainment|fun|hobby|sport)\b/)) {
      topics.push('entertainment');
    }

    // Health topics
    if (lowerMessage.match(/\b(health|fitness|exercise|medical|doctor|wellness)\b/)) {
      topics.push('health');
    }

    return topics;
  }

  private extractPersonalInfo(message: string): void {
    const lowerMessage = message.toLowerCase();

    // Extract name
    const nameMatch = message.match(/(?:my name is|i'm|i am|call me)\s+([a-zA-Z]+)/i);
    if (nameMatch && !this.userProfile.name) {
      this.userProfile.name = nameMatch[1];
    }

    // Extract email
    const emailMatch = message.match(/(?:my email is|email me at|contact me at)\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
    if (emailMatch && !this.userProfile.email) {
      this.userProfile.email = emailMatch[1];
    }

    // Extract occupation
    const jobMatch = message.match(/(?:i work as|i'm a|i am a|my job is)\s+([a-zA-Z\s]+)/i);
    if (jobMatch && !this.userProfile.personalInfo.occupation) {
      this.userProfile.personalInfo.occupation = jobMatch[1].trim();
    }

    // Extract location
    const locationMatch = message.match(/(?:i live in|i'm from|i am from|located in)\s+([a-zA-Z\s,]+)/i);
    if (locationMatch && !this.userProfile.personalInfo.location) {
      this.userProfile.personalInfo.location = locationMatch[1].trim();
    }
  }

  public getRecentConversations(limit: number = ConversationMemoryService.CONTEXT_WINDOW_SIZE): ConversationEntry[] {
    return this.conversationHistory
      .filter(conv => conv.userId === this.currentUserId)
      .slice(-limit)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  public getConversationContext(): string {
    const recentConversations = this.getRecentConversations(10);
    
    if (recentConversations.length === 0) {
      return '';
    }

    const contextParts: string[] = [];

    // Add user profile context
    if (this.userProfile.name) {
      contextParts.push(`User's name: ${this.userProfile.name}`);
    }

    if (this.userProfile.email) {
      contextParts.push(`User's email: ${this.userProfile.email}`);
    }

    if (this.userProfile.personalInfo.occupation) {
      contextParts.push(`User's occupation: ${this.userProfile.personalInfo.occupation}`);
    }

    if (this.userProfile.preferences.communicationStyle) {
      contextParts.push(`Preferred communication style: ${this.userProfile.preferences.communicationStyle}`);
    }

    // Add device context
    const deviceInfo = this.getDeviceInfo();
    contextParts.push(`Current device: ${deviceInfo.deviceName}`);

    // Add favorite topics
    const topTopics = Object.entries(this.userProfile.conversationStats.favoriteTopics)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([topic]) => topic);
    
    if (topTopics.length > 0) {
      contextParts.push(`User's main interests: ${topTopics.join(', ')}`);
    }

    // Add recent conversation summary
    const conversationSummary = recentConversations
      .slice(-5) // Last 5 conversations
      .map(conv => `User: "${conv.userMessage}" | JARVIS: "${conv.jarvisResponse.substring(0, 100)}..."`)
      .join(' | ');

    if (conversationSummary) {
      contextParts.push(`Recent conversation context: ${conversationSummary}`);
    }

    return contextParts.join('\n');
  }

  public searchConversations(query: string, limit: number = 10): ConversationEntry[] {
    const lowerQuery = query.toLowerCase();
    return this.conversationHistory
      .filter(conv => 
        conv.userId === this.currentUserId &&
        (conv.userMessage.toLowerCase().includes(lowerQuery) ||
         conv.jarvisResponse.toLowerCase().includes(lowerQuery))
      )
      .slice(-limit)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public getConversationStats(): {
    totalConversations: number;
    sessionsToday: number;
    favoriteTopics: Array<{ topic: string; count: number }>;
    averageConversationsPerDay: number;
    devicesUsed: number;
    isOnline: boolean;
    lastSynced: Date;
  } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const userConversations = this.conversationHistory.filter(conv => conv.userId === this.currentUserId);
    const sessionsToday = new Set(
      userConversations
        .filter(conv => conv.timestamp >= today)
        .map(conv => conv.sessionId)
    ).size;

    const favoriteTopics = Object.entries(this.userProfile.conversationStats.favoriteTopics)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate average conversations per day
    const firstConversation = userConversations[0];
    const daysSinceFirst = firstConversation 
      ? Math.max(1, Math.ceil((Date.now() - firstConversation.timestamp.getTime()) / (1000 * 60 * 60 * 24)))
      : 1;
    
    const averageConversationsPerDay = Math.round(this.userProfile.conversationStats.totalConversations / daysSinceFirst);

    return {
      totalConversations: this.userProfile.conversationStats.totalConversations,
      sessionsToday,
      favoriteTopics,
      averageConversationsPerDay,
      devicesUsed: this.userProfile.conversationStats.devicesUsed.length,
      isOnline: this.isOnline,
      lastSynced: this.userProfile.lastSyncedAt
    };
  }

  public getDeviceHistory(): DeviceInfo[] {
    const devices: DeviceInfo[] = [];
    
    this.userProfile.conversationStats.devicesUsed.forEach(deviceId => {
      const deviceInfoKey = `jarvis_device_info_${deviceId}`;
      const stored = localStorage.getItem(deviceInfoKey);
      if (stored) {
        try {
          const deviceInfo = JSON.parse(stored);
          devices.push({
            ...deviceInfo,
            lastUsed: new Date(deviceInfo.lastUsed)
          });
        } catch (error) {
          console.error('Error parsing device info:', error);
        }
      }
    });
    
    return devices.sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime());
  }

  public clearHistory(): void {
    // Only clear current user's data
    const allConversations = this.getAllStoredConversations();
    const otherUsersConversations = allConversations.filter(conv => conv.userId !== this.currentUserId);
    
    this.conversationHistory = [];
    this.initializeUserProfile();
    
    // Save other users' data back
    localStorage.setItem(ConversationMemoryService.STORAGE_KEY, JSON.stringify(otherUsersConversations));
    localStorage.removeItem(ConversationMemoryService.USER_PROFILE_KEY);
    
    // Clear cloud data for this user
    const cloudKey = `jarvis_cloud_${this.currentUserId}`;
    localStorage.removeItem(cloudKey);
  }

  public exportConversations(): string {
    return JSON.stringify({
      userId: this.currentUserId,
      conversations: this.conversationHistory.filter(conv => conv.userId === this.currentUserId),
      userProfile: this.userProfile,
      deviceHistory: this.getDeviceHistory(),
      exportDate: new Date().toISOString()
    }, null, 2);
  }

  public getUserProfile(): UserProfile {
    return { ...this.userProfile };
  }

  public updateUserPreference(key: string, value: any): void {
    this.userProfile.preferences = {
      ...this.userProfile.preferences,
      [key]: value
    };
    this.saveUserProfile();
  }

  public getCurrentUserId(): string {
    return this.currentUserId;
  }

  public getCurrentDeviceId(): string {
    return this.currentDeviceId;
  }

  public async switchUser(userId: string): Promise<void> {
    // Save current user's data
    this.saveConversationHistory();
    this.saveUserProfile();
    
    // Switch to new user
    this.currentUserId = userId;
    localStorage.setItem(ConversationMemoryService.USER_ID_KEY, userId);
    
    // Load new user's data
    this.loadConversationHistory();
    this.loadUserProfile();
    await this.syncWithCloud();
  }

  public getConnectionStatus(): { isOnline: boolean; lastSynced: Date } {
    return {
      isOnline: this.isOnline,
      lastSynced: this.userProfile.lastSyncedAt
    };
  }
}