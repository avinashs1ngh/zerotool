export type AIProviderId = 'window.ai' | 'nanobanana' | 'qwen';

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

export interface NanoBananaModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

export interface NanoBananaImageOptions {
  prompt: string;
  model?: string;
  n?: number;
  size?: string;
  quality?: 'auto' | 'standard' | 'low' | 'medium' | 'high' | 'hd';
  response_format?: 'url' | 'b64_json';
}

export interface NanoBananaImageResponse {
  created: number;
  data: Array<{
    url?: string;
    b64_json?: string;
    revised_prompt?: string;
  }>;
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
