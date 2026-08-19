import { beforeEach, describe, expect, it } from 'vitest';
import { ConversationMemoryService } from './ConversationMemoryService';

describe('ConversationMemoryService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('topic extraction', () => {
    it('tags a message with every topic it matches', () => {
      const service = new ConversationMemoryService();
      service.addConversation('Can you help debug this software project at work?', 'Sure.');

      const topics = service.getConversationStats().favoriteTopics.map((t) => t.topic);
      expect(topics).toContain('technology');
      expect(topics).toContain('work');
    });

    it('ranks topics by how often they appear', () => {
      const service = new ConversationMemoryService();
      service.addConversation('tell me about programming', 'ok');
      service.addConversation('more code questions', 'ok');
      service.addConversation('a movie recommendation', 'ok');

      const [top] = service.getConversationStats().favoriteTopics;
      expect(top).toEqual({ topic: 'technology', count: 2 });
    });
  });

  describe('personal info extraction', () => {
    it('picks up a stated name and reports it in the profile summary', () => {
      const service = new ConversationMemoryService();
      service.addConversation('my name is Aatreyee', 'Good to meet you.');

      expect(service.getUserProfile().name).toBe('Aatreyee');
      expect(service.getProfileSummary()).toContain('Aatreyee');
    });

    it('keeps the first name it learns rather than overwriting it', () => {
      const service = new ConversationMemoryService();
      service.addConversation('my name is Alice', 'Hello.');
      service.addConversation('my name is Bob', 'Hello.');

      expect(service.getUserProfile().name).toBe('Alice');
    });

    it('does not invent a profile from an unrelated message', () => {
      const service = new ConversationMemoryService();
      service.addConversation('what is the weather like', 'Clear skies.');

      expect(service.getUserProfile().name).toBeUndefined();
      expect(service.getProfileSummary()).toBe('');
    });
  });

  describe('conversation turns', () => {
    it('flattens stored exchanges into alternating user/assistant turns', () => {
      const service = new ConversationMemoryService();
      service.addConversation('first question', 'first answer');
      service.addConversation('second question', 'second answer');

      expect(service.getRecentTurns(2)).toEqual([
        { role: 'user', content: 'first question' },
        { role: 'assistant', content: 'first answer' },
        { role: 'user', content: 'second question' },
        { role: 'assistant', content: 'second answer' },
      ]);
    });

    it('returns the most recent exchanges when limited', () => {
      const service = new ConversationMemoryService();
      service.addConversation('oldest', 'a');
      service.addConversation('newest', 'b');

      const turns = service.getRecentTurns(1);
      expect(turns).toHaveLength(2);
      expect(turns[0].content).toBe('newest');
    });
  });

  describe('persistence', () => {
    it('restores history for the same user across instances', () => {
      const first = new ConversationMemoryService();
      first.addConversation('remember this', 'noted');

      const second = new ConversationMemoryService();
      expect(second.getRecentConversations()).toHaveLength(1);
      expect(second.getRecentConversations()[0].userMessage).toBe('remember this');
    });

    it('clears history without leaving orphaned records behind', () => {
      const service = new ConversationMemoryService();
      service.addConversation('temporary', 'gone soon');
      service.clearHistory();

      expect(service.getRecentConversations()).toHaveLength(0);
      expect(new ConversationMemoryService().getRecentConversations()).toHaveLength(0);
    });
  });

  describe('search', () => {
    it('matches on both sides of the exchange, case-insensitively', () => {
      const service = new ConversationMemoryService();
      service.addConversation('what is the Reactor status', 'All nominal.');
      service.addConversation('unrelated', 'also unrelated');

      expect(service.searchConversations('reactor')).toHaveLength(1);
      expect(service.searchConversations('NOMINAL')).toHaveLength(1);
      expect(service.searchConversations('absent')).toHaveLength(0);
    });
  });
});
