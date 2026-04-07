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
    if (typeof window !== 'undefined' && 'ai' in window && window.ai) {
      try {
        const canCreate = await window.ai.canCreateTextSession();
        return canCreate === 'readily' || canCreate === 'after-download';
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  async generateText(prompt: string, options?: AIGenerationOptions): Promise<string> {
    if (!window.ai) throw new Error('window.ai not available');
    const session = await window.ai.createTextSession();
    const result = await session.prompt(prompt);
    session.destroy();
    return result;
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
