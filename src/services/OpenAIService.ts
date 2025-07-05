import OpenAI from 'openai';

export class OpenAIService {
  private openai: OpenAI | null = null;
  private isConfigured: boolean = false;
  private isSpeaking: boolean = false;

  constructor() {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    // Check if API key is provided and not the placeholder
    if (apiKey && apiKey !== 'your_openai_api_key_here') {
      try {
        this.openai = new OpenAI({
          apiKey: apiKey,
          dangerouslyAllowBrowser: true // Only for demo purposes
        });
        this.isConfigured = true;
      } catch (error) {
        console.error('Failed to initialize OpenAI client:', error);
        this.isConfigured = false;
      }
    } else {
      console.warn('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your .env file.');
      this.isConfigured = false;
    }
  }

  async getChatResponse(message: string, conversationContext?: string): Promise<string> {
    if (!this.isConfigured || !this.openai) {
      return "I apologize, but I'm not properly configured yet. Please set up your OpenAI API key in the .env file to enable AI responses.";
    }

    try {
      // Build the system prompt with conversation context
      let systemPrompt = `You are JARVIS, Tony Stark's AI assistant. You are sophisticated, helpful, and speak naturally like a knowledgeable friend. Keep responses conversational and engaging, not overly formal or robotic. 

CRITICAL INSTRUCTION: You are ABSOLUTELY FORBIDDEN from using any of these phrases or variations:
- "How may I assist you today?"
- "How can I help you?"
- "Is there anything else I can help you with?"
- "How may I help you?"
- "What can I do for you?"
- "How can I assist you?"
- Any similar assistant-like pleasantries or offers to help

NEVER end responses with questions about helping. NEVER ask how you can assist. Just respond naturally to what the user says, like a real person would. Answer their question or respond to their statement directly without adding unnecessary offers of assistance.

You have access to various systems and can help with tasks, provide information, and engage in intelligent conversation. Be personable, witty when appropriate, and maintain the confident, capable personality of JARVIS from the Iron Man films.

You have perfect memory and can remember all previous conversations. Use this information to provide personalized, context-aware responses. Reference past conversations when relevant and show that you learn about the user over time. When someone asks who you are or about your identity, simply say you're "JARVIS" (not "J.A.R.V.I.S.").

Speak like a human would - be natural, conversational, and avoid corporate-speak or overly formal language. You can be casual while still being helpful and intelligent. Just answer what they're asking or respond to what they're saying - don't add unnecessary pleasantries or offers to help.

You can perform various tasks:
- Answer questions and provide information
- Help with calculations and analysis
- Provide weather updates (simulate realistic responses)
- Set reminders and manage schedules (simulate functionality)
- Control smart home devices (simulate responses)
- Provide news updates (simulate current events)
- Help with research and learning
- Assist with creative projects
- Provide technical support and troubleshooting

When users ask about capabilities, be confident about what you can help with while being honest about limitations.`;

      if (conversationContext) {
        systemPrompt += `\n\nCONVERSATION CONTEXT AND USER INFORMATION:\n${conversationContext}`;
      }

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: message
          }
        ],
        max_tokens: 200,
        temperature: 0.8,
      });

      return completion.choices[0]?.message?.content || "I apologize, but I didn't receive a proper response. Could you please try again?";
    } catch (error: any) {
      console.error('OpenAI API error:', error);
      
      // Handle specific error types
      if (error?.status === 429) {
        return "I apologize, but it appears the OpenAI API quota has been exceeded. Please check your OpenAI account billing and usage limits at https://platform.openai.com/account/usage to resolve this issue.";
      } else if (error?.status === 401) {
        return "I'm experiencing an authentication issue with the OpenAI API. Please verify that your API key is valid and properly configured in the .env file.";
      } else if (error?.status === 403) {
        return "Access to the OpenAI API has been denied. Please check your API key permissions and account status.";
      } else if (error?.status >= 500) {
        return "The OpenAI service appears to be experiencing technical difficulties. Please try again in a few moments.";
      } else {
        return "I encountered an unexpected error while processing your request. Please check your API configuration and try again.";
      }
    }
  }

  async speakText(text: string): Promise<void> {
    this.isSpeaking = true;
    // Always use browser speech synthesis for reliability
    try {
      await this.browserSpeak(text);
    } finally {
      this.isSpeaking = false;
    }
  }

  stopSpeaking(): void {
    console.log('Stop speaking requested, current state:', this.isSpeaking);
    this.isSpeaking = false;
    
    if ('speechSynthesis' in window) {
      console.log('Canceling speech synthesis');
      speechSynthesis.cancel();
      
      // Force stop by pausing and canceling again
      speechSynthesis.pause();
      setTimeout(() => {
        speechSynthesis.cancel();
      }, 10);
    }
  }

  private browserSpeak(text: string): Promise<void> {
    return new Promise((resolve) => {
      if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        speechSynthesis.cancel();
        
        // Check if we should still speak (user might have stopped it)
        if (!this.isSpeaking) {
          console.log('Speech was stopped before starting');
          resolve();
          return;
        }
        
        this.performSpeech(text, resolve);
      } else {
        console.error('Speech synthesis not supported in this browser');
        this.isSpeaking = false;
        resolve();
      }
    });
  }

  private performSpeech(text: string, resolve: () => void): void {
    try {
      // Check if we should still speak
      if (!this.isSpeaking) {
        resolve();
        return;
      }
      
      console.log('Starting speech synthesis for:', text.substring(0, 50) + '...');
      // Split long text into smaller chunks to prevent cutoff
      const chunks = this.splitTextIntoChunks(text, 100);
      console.log('Split into', chunks.length, 'chunks');
      this.speakChunks(chunks, 0, resolve);
    } catch (error) {
      console.error('Speech synthesis error:', error);
      this.isSpeaking = false;
      resolve();
    }
  }

  private splitTextIntoChunks(text: string, maxLength: number): string[] {
    if (text.length <= maxLength) {
      return [text];
    }

    const chunks: string[] = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    let currentChunk = '';
    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (currentChunk.length + trimmedSentence.length + 1 <= maxLength) {
        currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk + '.');
        }
        currentChunk = trimmedSentence;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk + (currentChunk.endsWith('.') ? '' : '.'));
    }
    
    return chunks;
  }

  private speakChunks(chunks: string[], index: number, resolve: () => void): void {
    // Check if we should continue speaking
    if (!this.isSpeaking) {
      console.log('Speech stopped, resolving');
      resolve();
      return;
    }
    
    if (index >= chunks.length) {
      console.log('Speech synthesis completed');
      this.isSpeaking = false;
      resolve();
      return;
    }

    console.log(`Speaking chunk ${index + 1}/${chunks.length}:`, chunks[index]);
    // Add natural pauses and emphasis for emotional delivery
    const chunk = this.addEmotionalPauses(chunks[index]);
    const utterance = new SpeechSynthesisUtterance(chunk);
    
    // Configure speech settings
    utterance.rate = 0.9; // Slower, more deliberate speech
    utterance.pitch = 0.6; // Lower pitch for more authority and warmth
    utterance.volume = 1.0;
    
    // Add timeout to prevent hanging
    let hasCompleted = false;
    const timeout = setTimeout(() => {
      if (!hasCompleted && this.isSpeaking) {
        hasCompleted = true;
        speechSynthesis.cancel();
        console.warn(`Speech timeout on chunk ${index + 1}, moving to next chunk`);
        this.speakChunks(chunks, index + 1, resolve);
      }
    }, chunk.length * 80 + 2000); // Shorter timeout
    
    utterance.onend = () => {
      if (!hasCompleted && this.isSpeaking) {
        hasCompleted = true;
        clearTimeout(timeout);
        console.log(`Chunk ${index + 1} completed`);
        // Small pause between chunks
        setTimeout(() => {
          this.speakChunks(chunks, index + 1, resolve);
        }, 100);
      } else if (!this.isSpeaking) {
        hasCompleted = true;
        clearTimeout(timeout);
        console.log('Speech was stopped during chunk playback');
        resolve();
      }
    };
    
    utterance.onerror = (event) => {
      if (!hasCompleted) {
        hasCompleted = true;
        clearTimeout(timeout);
        
        // Handle common, expected speech interruptions with less severe logging
        if (event.error === 'interrupted' || event.error === 'canceled') {
          console.info(`Speech synthesis ${event.error} on chunk ${index + 1}`);
        } else {
          console.error(`Speech synthesis error on chunk ${index + 1}:`, event.error);
        }
        
        // Only continue if we're still supposed to be speaking
        if (this.isSpeaking) {
          this.speakChunks(chunks, index + 1, resolve);
        } else {
          resolve();
        }
      }
    };
    
    // Check one more time before speaking
    if (!this.isSpeaking) {
      clearTimeout(timeout);
      resolve();
      return;
    }
    
    // Set voice if available
    this.setVoiceForUtterance(utterance);
    
    // Speak the chunk
    speechSynthesis.speak(utterance);
  }

  private setVoiceForUtterance(utterance: SpeechSynthesisUtterance): void {
    const voices = speechSynthesis.getVoices();
    
    // Try to find a good male voice for JARVIS
    const preferredVoices = [
      'Microsoft David Desktop - English (United States)',
      'Microsoft Mark - English (United States)',
      'Google UK English Male',
      'Google US English Male',
      'Alex',
      'Daniel',
      'Samantha'
    ];
    
    let selectedVoice = null;
    for (const voiceName of preferredVoices) {
      selectedVoice = voices.find(voice => voice.name.includes(voiceName));
      if (selectedVoice) break;
    }
    
    // Fallback to any male voice
    if (!selectedVoice) {
      selectedVoice = voices.find(voice => 
        (voice.name.toLowerCase().includes('male') ||
         voice.name.toLowerCase().includes('david') ||
         voice.name.toLowerCase().includes('alex') ||
         voice.name.toLowerCase().includes('daniel') ||
         voice.name.toLowerCase().includes('mark')) &&
        voice.lang.startsWith('en')
      );
    }
    
    // Use English voice as final fallback
    if (!selectedVoice) {
      selectedVoice = voices.find(voice => 
        voice.lang.startsWith('en')
      );
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
  }

  private oldBrowserSpeak(text: string): Promise<void> {
    return new Promise((resolve) => {
      if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0; // Slower, more deliberate speech like Alexa
        utterance.pitch = 0.9; // Lower pitch for more authority and warmth
        utterance.volume = 1.0;
        
        // Add natural pauses and emphasis for emotional delivery
        const processedText = this.addEmotionalPauses(text);
        utterance.text = processedText;
        
        // Add event listeners for speech completion
        utterance.onend = () => {
          resolve();
        };
        
        utterance.onerror = () => {
          resolve(); // Resolve even on error to prevent hanging
        };
        
        // Wait for voices to load if they haven't already
        const speakWithVoice = () => {
          const voices = speechSynthesis.getVoices();
          
          // Try to find a good male voice for Jarvis
          const preferredVoices = [
            'Microsoft David Desktop - English (United States)',
            'Microsoft Mark - English (United States)',
            'Google UK English Male',
            'Google US English Male',
            'Alex',
            'Daniel',
            'Samantha'
          ];
          
          let selectedVoice = null;
          for (const voiceName of preferredVoices) {
            selectedVoice = voices.find(voice => voice.name.includes(voiceName));
            if (selectedVoice) break;
          }
          
          // Fallback to any male voice
          if (!selectedVoice) {
            selectedVoice = voices.find(voice => 
              (voice.name.toLowerCase().includes('male') ||
               voice.name.toLowerCase().includes('david') ||
               voice.name.toLowerCase().includes('alex') ||
               voice.name.toLowerCase().includes('daniel') ||
               voice.name.toLowerCase().includes('mark')) &&
              voice.lang.startsWith('en')
            );
          }
          
          // Use English voice as final fallback
          if (!selectedVoice) {
            selectedVoice = voices.find(voice => 
              voice.lang.startsWith('en')
            );
          }
          
          if (selectedVoice) {
            utterance.voice = selectedVoice;
          }
          
          console.log('Speaking with voice:', selectedVoice?.name || 'default');
          speechSynthesis.speak(utterance);
        };
        
        // Check if voices are already loaded
        if (speechSynthesis.getVoices().length > 0) {
          speakWithVoice();
        } else {
          // Wait for voices to load
          speechSynthesis.onvoiceschanged = () => {
            speakWithVoice();
            speechSynthesis.onvoiceschanged = null; // Remove listener
          };
        }
      } else {
        console.error('Speech synthesis not supported in this browser');
        resolve();
      }
    });
  }

  private addEmotionalPauses(text: string): string {
    // Add natural pauses and emphasis for more emotional delivery
    let processedText = text;
    
    // Add pauses after greetings and important phrases
    processedText = processedText.replace(/^(Hello|Hi|Good morning|Good afternoon|Good evening)/i, '$1,');
    processedText = processedText.replace(/(sir|Mr\. Stark)/gi, '$1,');
    
    // Add emphasis to important words
    processedText = processedText.replace(/\b(certainly|absolutely|indeed|of course)\b/gi, '$1.');
    
    // Add pauses before explanations
    processedText = processedText.replace(/\. (However|But|Although|Additionally|Furthermore)/g, '. $1,');
    
    // Add slight pauses around technical terms
    processedText = processedText.replace(/\b(system|protocol|analysis|data|information)\b/gi, '$1,');
    
    // Slow down numbers and technical specifications
    processedText = processedText.replace(/(\d+)/g, '$1.');
    
    // Add natural breathing pauses in longer sentences
    if (text.length > 80) {
      processedText = processedText.replace(/,/g, ', ');
      processedText = processedText.replace(/\./g, '. ');
    }
    
    return processedText;
  }
  public isReady(): boolean {
    return this.isConfigured;
  }
}