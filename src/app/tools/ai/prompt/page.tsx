'use client';

import React, { useEffect, useState } from 'react';
import { useAIStore } from '@/store/ai-store';
import { setSecret, getSecret } from '@/core/db';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Bot, Key, Settings, Sparkles } from 'lucide-react';
import styles from './PromptStudio.module.scss';
import { AIProviderId } from '@/core/ai/types';

export default function PromptStudioPage() {
  const { providers, activeProviderId, setActiveProvider, initialize, isInitializing } = useAIStore();
  
  const [activeTab, setActiveTab] = useState<'studio' | 'settings'>('studio');
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  // Settings state
  const [openAIKey, setOpenAIKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');

  useEffect(() => {
    initialize();
    getSecret('openai_key').then(k => setOpenAIKey(k || ''));
    getSecret('anthropic_key').then(k => setAnthropicKey(k || ''));
  }, [initialize]);

  const handleSaveKeys = async () => {
    await setSecret('openai_key', openAIKey);
    await setSecret('anthropic_key', anthropicKey);
    // Re-initialize to re-check availability
    initialize();
    alert('Keys saved securely in local browser IndexedDB!');
  };

  const handleGenerate = async () => {
    if (!activeProviderId) return alert('No AI provider active.');
    const provider = providers[activeProviderId];
    if (!provider) return;

    setLoading(true);
    try {
      const res = await provider.generateText(prompt);
      setResult(res);
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (isInitializing) return <div className={styles.container}>Loading AI Engine...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <Bot size={32} className={styles.icon} />
          <div>
            <h1>Prompt Studio</h1>
            <p>Generate, test, and iterate AI prompts strictly offline/client-side.</p>
          </div>
        </div>
        
        <div className={styles.tabs}>
          <Button variant={activeTab === 'studio' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('studio')}>
            <Sparkles size={16} /> Studio
          </Button>
          <Button variant={activeTab === 'settings' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('settings')}>
            <Settings size={16} /> Providers
          </Button>
        </div>
      </header>

      {activeTab === 'settings' && (
        <div className={styles.settingsGrid}>
          {Object.values(providers).map((provider) => (
            <Card key={provider.id} title={provider.details.name} className={activeProviderId === provider.id ? styles.activeCard : ''}>
              <p className={styles.desc}>{provider.details.description}</p>
              
              <div className={styles.cardActions}>
                <Button 
                  variant={activeProviderId === provider.id ? 'primary' : 'secondary'}
                  onClick={() => setActiveProvider(provider.id)}
                >
                  {activeProviderId === provider.id ? 'Active' : 'Select'}
                </Button>
              </div>
            </Card>
          ))}

          <Card title="API Keys (Stored Locally)" className={styles.keysCard}>
            <p className={styles.desc}>Keys never leave your browser except to query the models.</p>
            <div className={styles.keyForm}>
              <Input 
                label="OpenAI API Key" 
                type="password" 
                placeholder="sk-..." 
                value={openAIKey} 
                onChange={(e) => setOpenAIKey(e.target.value)} 
              />
              <Input 
                label="Anthropic API Key" 
                type="password" 
                placeholder="sk-ant-..." 
                value={anthropicKey} 
                onChange={(e) => setAnthropicKey(e.target.value)} 
              />
              <Button onClick={handleSaveKeys} className={styles.saveBtn}>
                <Key size={16} /> Save secure keys
              </Button>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'studio' && (
        <div className={styles.studioLayout}>
          <Card className={styles.promptCard}>
            <textarea 
              className={styles.textarea} 
              placeholder="Enter your prompt here..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <div className={styles.studioActions}>
               <span className={styles.providerBadge}>
                 Provider: {activeProviderId ? providers[activeProviderId].details.name : 'None Selected'}
               </span>
               <Button onClick={handleGenerate} isLoading={loading}>
                 Generate
               </Button>
            </div>
          </Card>

          <Card className={styles.resultCard} title="Output">
            <div className={styles.resultContent}>
              {result || <span className={styles.placeholder}>Output will appear here...</span>}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
