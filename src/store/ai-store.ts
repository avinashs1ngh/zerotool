import { create } from 'zustand';
import { AIProviderId, AIProvider } from '../core/ai/types';
import { WindowAIProvider, OpenAIProvider, AnthropicProvider } from '../core/ai/providers';
import { getSetting, setSetting } from '../core/db';

interface AIStore {
  activeProviderId: AIProviderId | null;
  providers: Record<AIProviderId, AIProvider>;
  isInitializing: boolean;
  
  initialize: () => Promise<void>;
  setActiveProvider: (id: AIProviderId) => Promise<void>;
  getActiveProvider: () => AIProvider | null;
}

const instances = {
  'window.ai': new WindowAIProvider(),
  'openai': new OpenAIProvider(),
  'anthropic': new AnthropicProvider()
};

export const useAIStore = create<AIStore>((set, get) => ({
  activeProviderId: null,
  providers: instances,
  isInitializing: true,

  initialize: async () => {
    const saved = await getSetting<AIProviderId | null>('active_ai_provider', null);
    
    // Check if the saved one is still available (i.e. we still have keys, etc)
    let bestId = saved;
    if (bestId && instances[bestId]) {
      const avail = await instances[bestId].checkAvailability();
      if (!avail) bestId = null;
    }

    if (!bestId) {
      // Auto-detect a working one
      for (const [id, provider] of Object.entries(instances)) {
        if (await provider.checkAvailability()) {
          bestId = id as AIProviderId;
          break;
        }
      }
    }

    set({ activeProviderId: bestId, isInitializing: false });
  },

  setActiveProvider: async (id: AIProviderId) => {
    await setSetting('active_ai_provider', id);
    set({ activeProviderId: id });
  },

  getActiveProvider: () => {
    const id = get().activeProviderId;
    return id ? get().providers[id] : null;
  }
}));
