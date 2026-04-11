import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  thinking?: string;
  timestamp: number;
}

interface ChatStore {
  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  clearHistory: () => Promise<void>;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      messages: [],
      addMessage: (msg) => set((state) => ({ 
        messages: [...state.messages, { ...msg, timestamp: Date.now() }] 
      })),
      setMessages: (messages) => set({ messages }),
      clearHistory: async () => {
        try {
          await fetch('/api/ai/qwen/v1/chats/delete', { method: 'POST' });
        } catch (e) {
          console.error('Failed to clear remote history:', e);
        }
        set({ messages: [] });
      },
    }),
    {
      name: 'zerotool-ai-chat',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
