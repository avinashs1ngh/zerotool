export type AIProviderId = 'window.ai' | 'openai' | 'anthropic';

export interface AIProviderDetails {
  id: AIProviderId;
  name: string;
  description: string;
  isAvailable: boolean; // Computed dynamically
  requiresKey: boolean;
}

export interface AIGenerationOptions {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  topK?: number;
}

export interface AIProvider {
  id: AIProviderId;
  details: AIProviderDetails;
  
  checkAvailability(): Promise<boolean>;
  generateText(prompt: string, options?: AIGenerationOptions): Promise<string>;
}

// Global window extension for browser-native AI (Gemini Nano)
declare global {
  interface Window {
    ai?: {
      assistant?: {
        canCreate: () => Promise<string>;
        create: (options?: any) => Promise<any>;
      };
      languageModel?: {
        canCreate: () => Promise<string>;
        create: (options?: any) => Promise<any>;
      };
      canCreateTextSession?: () => Promise<string>;
      createTextSession?: () => Promise<any>;
    };
  }
}
