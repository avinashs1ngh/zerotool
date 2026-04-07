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
}

export interface AIProvider {
  id: AIProviderId;
  details: AIProviderDetails;
  
  checkAvailability(): Promise<boolean>;
  generateText(prompt: string, options?: AIGenerationOptions): Promise<string>;
  
  // Optional generic method if we expand beyond text
  // generateImage?() 
}

// Global window extension for browser-native AI
declare global {
  interface Window {
    ai?: {
      canCreateTextSession: () => Promise<string>;
      createTextSession: () => Promise<any>;
    };
  }
}
