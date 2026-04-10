'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Binary, ArrowLeft, Copy, Trash2, ArrowLeftRight, Zap, RefreshCcw } from 'lucide-react';
import styles from '../DevTool.module.scss';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function Base64ConverterPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const processText = () => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    try {
      if (mode === 'encode') {
        setOutput(btoa(input));
      } else {
        setOutput(atob(input));
      }
      setError(null);
    } catch (e: any) {
      setError(`Invalid input for ${mode}: ${e.message}`);
      setOutput('');
    }
  };

  useEffect(() => {
    const timeout = setTimeout(processText, 300);
    return () => clearTimeout(timeout);
  }, [input, mode]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError(null);
  };

  const toggleMode = () => {
    setMode(prev => prev === 'encode' ? 'decode' : 'encode');
    // Swap input and output for convenience
    if (output && !error) {
      setInput(output);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <Link href="/tools/dev" className={styles.backBtn}>
            <ArrowLeft size={20} />
          </Link>
          <Binary size={32} className={styles.icon} />
          <div>
            <h1>Base64 Converter</h1>
            <p>Securely encode or decode text to Base64 format locally in your browser.</p>
          </div>
        </div>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.mainGrid}
      >
        <section className={styles.pane}>
          <div className={styles.paneHeader}>
            <span>Input ({mode === 'encode' ? 'Plain Text' : 'Base64'})</span>
            <span title="Clear Input">
              <Trash2 
                size={16} 
                className={styles.actionIcon} 
                onClick={handleClear} 
              />
            </span>
          </div>
          <textarea
            className={styles.editor}
            placeholder={mode === 'encode' ? 'Enter text to encode...' : 'Enter base64 to decode...'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
          />
        </section>

        <section className={styles.pane}>
          <div className={styles.paneHeader}>
            <span>Output ({mode === 'encode' ? 'Base64' : 'Plain Text'})</span>
            <div style={{ display: 'flex', gap: '12px' }}>
              <span title="Copy to Clipboard">
                <Copy 
                  size={16} 
                  className={styles.actionIcon} 
                  onClick={handleCopy}
                />
              </span>
            </div>
          </div>
          <AnimatePresence>
            {copied && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={styles.copyFeedback}
              >
                Copied!
              </motion.div>
            )}
          </AnimatePresence>
          <div className={`${styles.output} ${!output && !error ? styles.empty : ''} ${error ? styles.error : ''}`}>
            {error ? error : (output || 'Results will appear here...')}
          </div>
        </section>
      </motion.div>

      <div className={styles.controls}>
        <div className={styles.modeIndicator}>
             <Zap size={16} color={mode === 'encode' ? 'var(--accent-primary)' : 'var(--accent-green)'} />
             <span style={{ fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>
                 Mode: {mode}
             </span>
        </div>

        <Button variant="ghost" onClick={toggleMode}>
          <ArrowLeftRight size={16} />
          Switch to {mode === 'encode' ? 'Decode' : 'Encode'}
        </Button>
        
        <Button variant="primary" onClick={processText} disabled={!input}>
          <RefreshCcw size={16} />
          Convert Now
        </Button>
      </div>
    </div>
  );
}
