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
    // Check availability for ALL providers to update UI status
    const availabilityResults = await Promise.all(
      Object.entries(instances).map(async ([id, p]) => {
        const avail = await p.checkAvailability();
        p.details.isAvailable = avail;
        return { id, avail };
      })
    );

    const saved = await getSetting<AIProviderId | null>('active_ai_provider', null);
    
    // Check if the saved one is still available
    let bestId = saved;
    if (bestId && instances[bestId]) {
      if (!instances[bestId].details.isAvailable) bestId = null;
    }

    if (!bestId) {
      // Auto-detect a working one
      const firstAvailable = availabilityResults.find(r => r.avail);
      if (firstAvailable) bestId = firstAvailable.id as AIProviderId;
    }

    set({ activeProviderId: bestId, isInitializing: false });
  },

  setActiveProvider: async (id: AIProviderId) => {
    // Optionally check availability again? 
    // To keep it simple, we trust the UI to only allow selecting available or showing warnings.
    await setSetting('active_ai_provider', id);
    set({ activeProviderId: id });
  },

  getActiveProvider: () => {
    const id = get().activeProviderId;
    return id ? get().providers[id] : null;
  }
}));
