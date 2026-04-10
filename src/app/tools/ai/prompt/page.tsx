'use client';

import React, { useEffect, useState } from 'react';
import { useAIStore } from '@/store/ai-store';
import { setSecret, getSecret } from '@/core/db';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Bot, Key, Settings, Sparkles, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import styles from './PromptStudio.module.scss';
import { AIProviderId } from '@/core/ai/types';
import { motion, AnimatePresence } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
};

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
      if (!provider.details.isAvailable) {
        throw new Error(`Provider "${provider.details.name}" is not currently available. Please check the 'Providers' tab for troubleshooting.`);
      }
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
    <motion.div 
      className={styles.container}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.header className={styles.header} variants={itemVariants}>
        <div className={styles.titleArea}>
          <Link href="/tools/ai" className={styles.backBtn}>
            <ArrowLeft size={24} />
          </Link>
          <Bot size={32} className={styles.icon} />
          <div>
            <h1>Prompt Studio</h1>
            <p className="hidden sm:block">Test AI prompts strictly client-side.</p>
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
      </motion.header>

      {activeTab === 'settings' && (
        <div className={styles.settingsGrid}>
          {Object.values(providers).map((provider) => (
            <div key={provider.id} className={`${styles.glassCard} ${activeProviderId === provider.id ? styles.activeCard : ''}`}>
              <div className={styles.cardHeader}>
                <div className={`${styles.statusBadge} ${provider.details.isAvailable ? styles.available : styles.unavailable}`}>
                  {provider.details.isAvailable ? 'Ready' : 'Unavailable'}
                </div>
                <h3>{provider.details.name}</h3>
              </div>
              <p className={styles.desc}>{provider.details.description}</p>
              
              <div className={styles.cardActions}>
                <Button 
                  variant={activeProviderId === provider.id ? 'primary' : 'secondary'}
                  disabled={!provider.details.isAvailable && provider.id === 'window.ai'}
                  onClick={() => setActiveProvider(provider.id)}
                >
                  {activeProviderId === provider.id ? 'Active' : 'Select'}
                </Button>
              </div>
            </div>
          ))}

          {/* Troubleshooting for Browser AI */}
          <div className={styles.troubleshooting}>
            <h3><Bot size={18} /> How to enable Browser Native AI?</h3>
            <p className={styles.desc}>Chrome built-in AI (Gemini Nano) is currently an experimental feature. If it shows "Unavailable", try these steps:</p>
            <ul>
              <li>
                <span>1.</span>
                <span>Use <strong>Chrome Dev</strong> or <strong>Canary</strong> (latest versions).</span>
              </li>
              <li>
                <span>2.</span>
                <span>Go to <code>chrome://flags</code> and enable <strong>Enables optimization guide on device model</strong>.</span>
              </li>
              <li>
                <span>3.</span>
                <span>Enable <strong>Prompt API for Gemini Nano</strong> in flags.</span>
              </li>
              <li>
                <span>4.</span>
                <span>Go to <code>chrome://components</code> and ensure <strong>Optimization Guide On Device Model</strong> is updated/downloaded.</span>
              </li>
              <li>
                <span>5.</span>
                <span>Restart Chrome and refresh ZeroTool.</span>
              </li>
            </ul>
          </div>

          <div className={`${styles.glassCard} ${styles.keysCard}`}>
            <h3>API Keys</h3>
            <p className={styles.desc}>Keys are stored locally in your browser's IndexedDB and never leave your machine except to authenticate with the AI provider.</p>
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
          </div>
        </div>
      )}

      {activeTab === 'studio' && (
        <motion.div className={styles.studioLayout} variants={itemVariants}>
          <div className={`${styles.glassCard} ${styles.promptCard}`}>
            <AnimatePresence>
              {loading && (
                <motion.div 
                  className={styles.lockOverlay}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Bot size={32} className="animate-bounce" />
                  <span>Thinking...</span>
                </motion.div>
              )}
            </AnimatePresence>
            <textarea 
              className={styles.textarea} 
              placeholder="Enter your prompt here..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading}
            />
            <div className={styles.studioActions}>
               <span className={styles.providerBadge}>
                 Provider: {activeProviderId ? providers[activeProviderId].details.name : 'None Selected'}
               </span>
               <Button onClick={handleGenerate} isLoading={loading} disabled={!prompt.trim()}>
                 Generate
               </Button>
            </div>
          </div>

          <div className={`${styles.glassCard} ${styles.resultCard}`}>
            <div className="flex items-center gap-2 mb-4 border-b border-glass-border pb-2">
              <Sparkles size={16} className="text-accent-primary" />
              <h3 className="font-black text-xs uppercase tracking-widest">Model Output</h3>
            </div>
            <div className={styles.resultContent}>
              {result ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  {result}
                </motion.div>
              ) : (
                <div className={styles.placeholder}>
                  <Bot size={40} className="mb-4 opacity-10" />
                  <span>Your results will appear here after generation.</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
