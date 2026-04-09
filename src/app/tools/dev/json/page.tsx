'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Brackets, ArrowLeft, Copy, Trash2, Check, Zap, FileJson, Minus } from 'lucide-react';
import styles from './JsonFormatter.module.scss';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function JsonFormatterPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [indent, setIndent] = useState(2);

  const formatJson = () => {
    if (!input.trim()) return;
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, indent));
      setError(null);
    } catch (e: any) {
      setError(`Invalid JSON: ${e.message}`);
      setOutput('');
    }
  };

  const minifyJson = () => {
    if (!input.trim()) return;
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
      setError(null);
    } catch (e: any) {
      setError(`Invalid JSON: ${e.message}`);
      setOutput('');
    }
  };

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

  useEffect(() => {
    if (input.trim()) {
      const timeout = setTimeout(formatJson, 500);
      return () => clearTimeout(timeout);
    } else {
      setOutput('');
      setError(null);
    }
  }, [input, indent]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <Link href="/tools/dev" className={styles.backBtn}>
            <ArrowLeft size={20} />
          </Link>
          <Brackets size={32} className={styles.icon} />
          <div>
            <h1>JSON Formatter</h1>
            <p>Paste your JSON to format, minify, and validate instantly.</p>
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
            <span>Input Raw JSON</span>
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
            placeholder='{ "key": "value" }'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
          />
        </section>

        <section className={styles.pane}>
          <div className={styles.paneHeader}>
            <span>Formatted Output</span>
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
        <div className={styles.optionsArea}>
          <FileJson size={18} />
          <span>Spaces:</span>
          <select 
            value={indent} 
            onChange={(e) => setIndent(Number(e.target.value))}
          >
            <option value={2}>2 Spaces</option>
            <option value={4}>4 Spaces</option>
          </select>
        </div>

        <Button variant="ghost" onClick={minifyJson} disabled={!input}>
          <Zap size={16} />
          Minify
        </Button>
        <Button variant="primary" onClick={formatJson} disabled={!input} className={styles.formatBtn}>
          <Brackets size={16} />
          Format JSON
        </Button>
      </div>
    </div>
  );
}
