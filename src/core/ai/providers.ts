import { AIProvider, AIProviderDetails, AIGenerationOptions, AIProviderId } from './types';
import { getSecret } from '../db';

export class WindowAIProvider implements AIProvider {
  id: AIProviderId = 'window.ai';
  details: AIProviderDetails = {
    id: 'window.ai',
    name: 'Browser Native AI',
    description: 'Uses completely local, built-in browser models. No API keys needed.',
    isAvailable: false,
    requiresKey: false,
  };

  async checkAvailability(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    // Check for various possible window.ai implementations (Gemini Nano)
    try {
      // Latest spec: window.ai.assistant or window.ai.languageModel
      const ai = (window as any).ai;
      if (!ai) return false;

      if (ai.assistant || ai.languageModel) {
        const canCreate = await (ai.assistant?.canCreate?.() || ai.languageModel?.canCreate?.());
        return canCreate === 'readily' || canCreate === 'after-download';
      }

      // Legacy/Alternative spec
      if (ai.canCreateTextSession) {
        const canCreate = await ai.canCreateTextSession();
        return canCreate === 'readily' || canCreate === 'after-download';
      }
    } catch (e) {
      console.warn('AI availability check failed:', e);
      return false;
    }
    return false;
  }

  async generateText(prompt: string, options?: AIGenerationOptions): Promise<string> {
    const ai = (window as any).ai;
    if (!ai) throw new Error('Browser AI (window.ai) is not available in this browser. Please use Chrome Dev/Canary and enable relevant flags.');

    try {
      // Modern spec (Assistant / LanguageModel)
      const factory = ai.assistant || ai.languageModel;
      if (factory) {
        const session = await factory.create({
          systemPrompt: options?.systemPrompt,
          temperature: options?.temperature,
          topK: options?.topK
        });
        const result = await session.prompt(prompt);
        // Note: Newer specs might use session.destroy(), session.close(), or no manual destruction.
        if (session.destroy) session.destroy();
        else if (session.close) session.close();
        return result;
      }

      // Legacy spec (TextSession)
      if (ai.createTextSession) {
        const session = await ai.createTextSession();
        const result = await session.prompt(prompt);
        if (session.destroy) session.destroy();
        return result;
      }
    } catch (e: any) {
      throw new Error(`Browser AI error: ${e.message}. (Ensure Gemini Nano is downloaded in chrome://components)`);
    }

    throw new Error('No compatible Browser AI API found.');
  }
}

export class OpenAIProvider implements AIProvider {
  id: AIProviderId = 'openai';
  details: AIProviderDetails = {
    id: 'openai',
    name: 'OpenAI (API)',
    description: 'Uses standard OpenAI models (e.g. GPT-4o-mini).',
    isAvailable: true,
    requiresKey: true,
  };

  async checkAvailability(): Promise<boolean> {
    const key = await getSecret('openai_key');
    return !!key;
  }

  async generateText(prompt: string, options?: AIGenerationOptions): Promise<string> {
    const key = await getSecret('openai_key');
    if (!key) throw new Error('OpenAI key not found in strictly local storage.');

    const res = await fetch('/api/proxy/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': key,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          ...(options?.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
          { role: 'user', content: prompt }
        ],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens,
      })
    });

    if (!res.ok) throw new Error(`OpenAI API error: ${res.statusText}`);
    const data = await res.json();
    return data.choices[0].message.content;
  }
}

export class AnthropicProvider implements AIProvider {
  id: AIProviderId = 'anthropic';
  details: AIProviderDetails = {
    id: 'anthropic',
    name: 'Anthropic (API)',
    description: 'Uses Anthropic Claude models via API.',
    isAvailable: true,
    requiresKey: true,
  };

  async checkAvailability(): Promise<boolean> {
    const key = await getSecret('anthropic_key');
    return !!key;
  }

  async generateText(prompt: string, options?: AIGenerationOptions): Promise<string> {
    const key = await getSecret('anthropic_key');
    if (!key) throw new Error('Anthropic key not locally found.');

    // Note: Anthropic standard endpoint has CORS restrictions sometimes, so client side fetch might fail directly from browser.
    // If it fails, they'd need a proxy, but prompt rules: "All API calls proxied via Next.js route handlers".
    // Wait, let's proxy through a local Next.js route handler as per user global rules!
    const res = await fetch('/api/proxy/anthropic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': key // Send key securely in header to local proxy
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: options?.maxTokens || 1024,
        system: options?.systemPrompt,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!res.ok) throw new Error(`Anthropic API error: ${res.statusText}`);
    const data = await res.json();
    return data.content[0].text;
  }
}

export class NanoBananaProvider implements AIProvider {
  id: AIProviderId = 'nanobanana';
  details: AIProviderDetails = {
    id: 'nanobanana',
    name: 'Nano Banana AI',
    description: 'Specialized image suite for generation, editing, and upscaling.',
    isAvailable: true, // Assuming it's always available as it's the core focus now
    requiresKey: false,
  };

  async checkAvailability(): Promise<boolean> {
    return true; 
  }

  // Implementation of generateText to satisfy AIProvider interface
  async generateText(prompt: string, options?: AIGenerationOptions): Promise<string> {
    return "Nano Banana is focusing on Image Generation. Use generateImage instead.";
  }

  async listModels(): Promise<any> {
    const res = await fetch('/api/ai/nanobanana/models');
    if (!res.ok) throw new Error(`Nano Banana API error: ${res.statusText}`);
    return res.json();
  }

  async generateImage(options: any): Promise<any> {
    const res = await fetch('/api/ai/nanobanana/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || `Nano Banana API error: ${res.statusText}`);
    }
    return res.json();
  }

  async editImage(options: { prompt: string; image: string }): Promise<any> {
    const res = await fetch('/api/ai/nanobanana/images/edits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || `Nano Banana API error: ${res.statusText}`);
    }
    return res.json();
  }

  async upscaleImage(options: { image: string; upscale_factor?: string; response_format?: string }): Promise<any> {
    const res = await fetch('/api/ai/nanobanana/images/upscale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || `Nano Banana API error: ${res.statusText}`);
    }
    return res.json();
  }
}

