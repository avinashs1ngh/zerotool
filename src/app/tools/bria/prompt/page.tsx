'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  MessageSquareText, Sparkles, Copy, ArrowLeft, 
  RotateCcw, Send, Loader2, BrainCircuit, Check
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './BriaPrompt.module.scss';

export default function BriaPromptPage() {
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProcess = async () => {
    if (!prompt.trim()) return;
    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/ai/bria/structured_prompt/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: prompt.trim(),
          sync: true 
        }),
      });

      const data = await response.json();
      if (data.result?.structured_prompt) {
        setResult(JSON.parse(data.result.structured_prompt));
      } else {
        throw new Error(data.error?.message || 'Processing failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <Link href="/tools/bria" className={styles.backBtn}>
            <ArrowLeft size={20} />
          </Link>
          <MessageSquareText size={32} className={styles.icon} />
          <div>
            <h1>Prompt Architect</h1>
          </div>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.architectGrid}>
          {/* Input Panel */}
          <div className={styles.inputPanel}>
            <Card className={styles.card}>
              <div className={styles.labelGroup}>
                <Sparkles size={16} />
                <span>Raw vision</span>
              </div>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your idea in simple words..."
                rows={6}
              />
              
              <Button 
                variant="primary" 
                size="lg" 
                fullWidth 
                onClick={handleProcess}
                disabled={isProcessing || !prompt.trim()}
                className={styles.architectBtn}
              >
                {isProcessing ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  'Construct Architecture'
                )}
              </Button>
            </Card>
          </div>

          {/* Result Panel */}
          <div className={styles.resultPanel}>
            <AnimatePresence mode="wait">
              {!result && !isProcessing && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={styles.placeholder}
                >
                   <BrainCircuit size={48} className="opacity-10 mb-4" />
                   <p>Architecture will appear here once synthesized.</p>
                </motion.div>
              )}

              {isProcessing && (
                <motion.div 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   className={styles.processing}
                >
                   <div className={styles.dnaAnimation}>
                      <div className={styles.strand} />
                      <div className={styles.strand} />
                   </div>
                   <h3>Synthesizing Logic</h3>
                </motion.div>
              )}

              {result && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={styles.resultContainer}
                >
                  <div className={styles.resultHeader}>
                    <h4>Structured Output</h4>
                    <Button variant="glass" size="sm" onClick={copyToClipboard}>
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                      {copied ? 'Copied' : 'Copy JSON'}
                    </Button>
                  </div>

                  <div className={styles.dataGrid}>
                     <div className={styles.mainInfo}>
                        <h5>Shorthand Description</h5>
                        <p>{result.short_description}</p>
                     </div>

                     <div className={styles.detailsSplit}>
                        <div className={styles.detailCard}>
                           <h5>Lighting</h5>
                           <p>{result.lighting.conditions}</p>
                        </div>
                        <div className={styles.detailCard}>
                           <h5>Aesthetics</h5>
                           <p>{result.aesthetics.mood_atmosphere}</p>
                        </div>
                     </div>

                     <div className={styles.jsonView}>
                        <pre>{JSON.stringify(result, null, 2)}</pre>
                     </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
