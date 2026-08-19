import { getDemoResponse } from './demoResponses';

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantReply {
  text: string;
  /** True when the reply came from the scripted fallback rather than the model. */
  demo: boolean;
}

/**
 * Talks to the app's own `/api/chat` endpoint, which holds the API key
 * server-side. No provider credentials exist in this bundle by design — the
 * browser never sees a key, so there is nothing here for a visitor to extract.
 */
export class AssistantService {
  private isSpeaking = false;

  async getChatResponse(message: string, history: ConversationTurn[] = []): Promise<AssistantReply> {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message, history }),
      });

      if (response.ok) {
        const data = (await response.json()) as { reply?: string };
        if (data.reply) return { text: data.reply, demo: false };
        return { text: getDemoResponse(message), demo: true };
      }

      // A rate-limited demo should say so plainly rather than fall back
      // silently, otherwise the limit looks like the model being evasive.
      if (response.status === 429) {
        const data = (await response.json().catch(() => ({}))) as { message?: string };
        return {
          text: data.message ?? 'Too many requests just now — give it a moment.',
          demo: true,
        };
      }

      // 503 means the backend has no key configured, which is an expected
      // state for a public demo. Anything else is a genuine failure, but the
      // scripted reply still keeps the interface usable.
      return { text: getDemoResponse(message), demo: true };
    } catch {
      return { text: getDemoResponse(message), demo: true };
    }
  }

  async speakText(text: string): Promise<void> {
    this.isSpeaking = true;
    try {
      await this.browserSpeak(text);
    } finally {
      this.isSpeaking = false;
    }
  }

  stopSpeaking(): void {
    this.isSpeaking = false;
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  }

  private browserSpeak(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        this.isSpeaking = false;
        resolve();
        return;
      }

      speechSynthesis.cancel();
      if (!this.isSpeaking) {
        resolve();
        return;
      }

      this.speakChunks(this.splitTextIntoChunks(text, 160), 0, resolve);
    });
  }

  /** Long utterances get cut off by some browsers, so speak in sentence-sized pieces. */
  private splitTextIntoChunks(text: string, maxLength: number): string[] {
    if (text.length <= maxLength) return [text];

    const sentences = text.match(/[^.!?]+[.!?]*/g) ?? [text];
    const chunks: string[] = [];
    let current = '';

    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (!trimmed) continue;

      if (current && current.length + trimmed.length + 1 > maxLength) {
        chunks.push(current);
        current = trimmed;
      } else {
        current = current ? `${current} ${trimmed}` : trimmed;
      }
    }

    if (current) chunks.push(current);
    return chunks;
  }

  private speakChunks(chunks: string[], index: number, resolve: () => void): void {
    if (!this.isSpeaking || index >= chunks.length) {
      this.isSpeaking = false;
      resolve();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(chunks[index]);
    utterance.rate = 0.95;
    utterance.pitch = 0.7;
    utterance.volume = 1;
    this.setVoiceForUtterance(utterance);

    let settled = false;
    const advance = () => {
      if (settled) return;
      settled = true;
      this.speakChunks(chunks, index + 1, resolve);
    };

    // Some browsers never fire onend if speech is interrupted, which would
    // leave the promise pending and the UI stuck in its speaking state.
    const timeout = setTimeout(advance, chunks[index].length * 90 + 3000);

    utterance.onend = () => {
      clearTimeout(timeout);
      advance();
    };

    utterance.onerror = (event) => {
      clearTimeout(timeout);
      if (event.error !== 'interrupted' && event.error !== 'canceled') {
        console.error('Speech synthesis error:', event.error);
      }
      if (this.isSpeaking) {
        advance();
      } else {
        settled = true;
        resolve();
      }
    };

    speechSynthesis.speak(utterance);
  }

  private setVoiceForUtterance(utterance: SpeechSynthesisUtterance): void {
    const voices = speechSynthesis.getVoices();
    if (voices.length === 0) return;

    const preferred = ['Daniel', 'Google UK English Male', 'Microsoft David', 'Alex'];
    const match =
      preferred.map((name) => voices.find((v) => v.name.includes(name))).find(Boolean) ??
      voices.find((v) => v.lang.startsWith('en-GB')) ??
      voices.find((v) => v.lang.startsWith('en'));

    if (match) utterance.voice = match;
  }
}
