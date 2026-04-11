'use client';

import React, { useState, useRef } from 'react';
import { Layout, ArrowLeft, Send, Sparkles, Code, Monitor, Copy, Download, RefreshCw, Cpu } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './WebGen.module.scss';
import { AILoader } from '@/components/ui/AILoader';

export default function AIWebGenPage() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'preview' | 'code'>('preview');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/ai/qwen/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen-web-dev',
          messages: [{ 
            role: 'user', 
            content: `Create a responsive web component or UI element for: ${prompt}. Return full HTML with internal CSS and any necessary vanillajs. No talk, just code.` 
          }],
          stream: false,
        }),
      });

      if (!response.ok) throw new Error('Generation failed');

      const data = await response.json();
      const code = data.choices[0].message.content;
      
      const cleanCode = code
        .replace(/<details>[\s\S]*<\/details>/g, '') 
        .replace(/```html|```/g, '') 
        .trim();
        
      setResult(cleanCode);
    } catch (error) {
      console.error('WebGen Error:', error);
      alert('Failed to generate component.');
    } finally {
      setIsLoading(false);
    }
  };

  const [isCopied, setIsCopied] = useState(false);

  const copyCode = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const downloadFile = () => {
    if (!result) return;
    const blob = new Blob([result], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `component-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
            <Link href="/tools/dev" className={styles.backBtn}>
            <ArrowLeft size={18} />
            </Link>
            <h1>Web Architect</h1>
        </div>
        <div className={styles.headerBadge}>
            <Sparkles size={12} />
            <span>Qwen Web-Dev</span>
        </div>
      </header>

      <div className={styles.mainLayout}>
        <div className={styles.editorPane}>
          <div className={styles.formCard}>
            <h3>Prompt</h3>
            <textarea 
              placeholder="Describe a sleek component..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>
          <button 
            className={styles.generateBtn}
            disabled={!prompt.trim() || isLoading}
            onClick={handleGenerate}
          >
            {isLoading ? <RefreshCw size={18} className="animate-spin" /> : <Sparkles size={18} />}
            <span>Cast Magic</span>
          </button>
        </div>

        <div className={styles.previewPane}>
          <div className={styles.previewHeader}>
            <div className={styles.tabs}>
              <button 
                className={view === 'preview' ? styles.active : ''} 
                onClick={() => setView('preview')}
              >
                <Monitor size={14} /> <span>Preview</span>
              </button>
              <button 
                className={view === 'code' ? styles.active : ''} 
                onClick={() => setView('code')}
              >
                <Code size={14} /> <span>Code</span>
              </button>
            </div>
            {result && (
              <div className={styles.actions}>
                <div className={styles.copyArea} onClick={copyCode}>
                    {isCopied ? (
                        <div className={styles.copySuccess}>
                             <Sparkles size={12} />
                             <span>Copied!</span>
                        </div>
                    ) : (
                        <Copy size={16} className={styles.iconBtn} />
                    )}
                </div>
                <Download size={16} className={styles.iconBtn} onClick={downloadFile} />
              </div>
            )}
          </div>

          <div className={`${styles.contentArea} ${view === 'code' ? styles.codeView : ''}`}>
            <AnimatePresence mode="wait">
              {!result && !isLoading && (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={styles.emptyState}
                >
                  <Cpu size={48} className={styles.icon} />
                  <h4>Waiting for Prompt</h4>
                </motion.div>
              )}


              {isLoading && (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={styles.loaderArea}
                >
                  <AILoader 
                    variant="architecture" 
                    text="Architecting" 
                    subtext="Constructing structural blueprints..." 
                  />
                </motion.div>
              )}

              {result && !isLoading && (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={styles.resultWrapper}
                >
                  {view === 'preview' ? (
                    <iframe 
                      ref={iframeRef}
                      title="Preview"
                      srcDoc={result}
                      className={styles.previewFrame}
                    />
                  ) : (
                    <div className={styles.codeContainer}>
                        <pre><code>{result}</code></pre>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
