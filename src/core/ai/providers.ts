import { AIProvider, AIProviderDetails, AIGenerationOptions, AIProviderId } from './types';

export class WindowAIProvider implements AIProvider {
  id: AIProviderId = 'window.ai';
  details: AIProviderDetails = {
    id: 'window.ai',
    name: 'Browser Native AI',
    description: 'Uses completely local, built-in browser models (Gemini Nano).',
    isAvailable: false,
    requiresKey: false,
  };

  async checkAvailability(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    try {
      const ai = (window as any).ai;
      if (!ai) return false;
      if (ai.assistant || ai.languageModel) {
        const canCreate = await (ai.assistant?.canCreate?.() || ai.languageModel?.canCreate?.());
        return canCreate === 'readily' || canCreate === 'after-download';
      }
    } catch (e) { return false; }
    return false;
  }

  async generateText(prompt: string, options?: AIGenerationOptions): Promise<string> {
    const ai = (window as any).ai;
    if (!ai) throw new Error('Browser AI not available.');
    const factory = ai.assistant || ai.languageModel;
    if (factory) {
      const session = await factory.create({
        systemPrompt: options?.systemPrompt,
        temperature: options?.temperature,
      });
      const result = await session.prompt(prompt);
      if (session.destroy) session.destroy();
      else if (session.close) session.close();
      return result;
    }
    throw new Error('No compatible Browser AI API found.');
  }
}

export class QwenProvider implements AIProvider {
  id: AIProviderId = 'qwen';
  details: AIProviderDetails = {
    id: 'qwen',
    name: 'Qwen AI Hub',
    description: 'Universal intelligence: Thinking Mode, Web Search & Research.',
    isAvailable: true,
    requiresKey: false,
  };

  async checkAvailability(): Promise<boolean> { return true; }

  async generateText(prompt: string, options?: AIGenerationOptions): Promise<string> {
    const res = await fetch('/api/ai/qwen/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen-max-latest',
        messages: [
           ...(options?.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
           { role: 'user', content: prompt }
        ],
        temperature: options?.temperature ?? 0.7,
      }),
    });
    if (!res.ok) throw new Error(`Qwen API error: ${res.statusText}`);
    const data = await res.json();
    return data.choices[0].message.content;
  }
}

export class NanoBananaProvider implements AIProvider {
  id: AIProviderId = 'nanobanana';
  details: AIProviderDetails = {
    id: 'nanobanana',
    name: 'Nano Banana (Images)',
    description: 'Proprietary image studio for generation and advanced editing.',
    isAvailable: true,
    requiresKey: false,
  };

  async checkAvailability(): Promise<boolean> { return true; }

  async generateText(prompt: string, options?: AIGenerationOptions): Promise<string> {
    return "Nano Banana is specialized for images. Use the Image Studio for best results.";
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
    if (!res.ok) throw new Error(`Nano Banana API error: ${res.statusText}`);
    return res.json();
  }

  async editImage(options: { prompt: string; image: string }): Promise<any> {
    const res = await fetch('/api/ai/nanobanana/images/edits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
    if (!res.ok) throw new Error(`Nano Banana API error: ${res.statusText}`);
    return res.json();
  }

  async upscaleImage(options: any): Promise<any> {
    const res = await fetch('/api/ai/nanobanana/images/upscale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
    if (!res.ok) throw new Error(`Nano Banana API error: ${res.statusText}`);
    return res.json();
  }
}
