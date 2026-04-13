'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { 
  ImageIcon, Sparkles, Download, ArrowLeft, 
  RotateCcw, Send, Loader2, BrainCircuit
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './BriaGenerate.module.scss';

export default function BriaGeneratePage() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/ai/bria/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: prompt.trim(),
          num_results: 1,
          sync: true 
        }),
      });

      const data = await response.json();
      if (data.result) {
        // Wrap image_url in proxy to avoid browser referer blocks
        const proxiedResult = {
          ...data.result,
          image_url: `/api/ai/bria-img?url=${encodeURIComponent(data.result.image_url)}`
        };
        setResult(proxiedResult);
      } else {
        throw new Error(data.error?.message || 'Generation failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <Link href="/tools/bria" className={styles.backBtn}>
            <ArrowLeft size={20} />
          </Link>
          <BrainCircuit size={32} className={styles.icon} />
          <div>
            <h1>Bria AI Generator</h1>
          </div>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.mainGrid}>
          {/* Controls */}
          <div className={styles.controlsCol}>
            <Card className={styles.card}>
              <div className={styles.inputArea}>
                <label>Visionary Prompt</label>
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Ultra-realistic hero shot of limited-edition sneakers on wet reflective neon street..."
                  rows={4}
                />
              </div>

              <Button 
                variant="primary" 
                size="lg" 
                fullWidth 
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className={styles.neonBtn}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" size={20} />
                    Synthesizing Art...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2" size={20} />
                    Generate Masterpiece
                  </>
                )}
              </Button>

             
            </Card>
          </div>

          {/* Preview */}
          <div className={styles.previewCol}>
            <AnimatePresence mode="wait">
              {!result && !isGenerating && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={styles.placeholder}
                >
                  <div className={styles.emptyState}>
                    <ImageIcon size={64} className="opacity-20 mb-4" />
                    <h3>Awaiting Evolution</h3>
                    <p>Describe your vision to see the AI come to life.</p>
                  </div>
                </motion.div>
              )}

              {isGenerating && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={styles.generatingState}
                >
                   <div className={styles.spinnerWrapper}>
                      <Loader2 size={48} className="animate-spin text-accent-purple" />
                      <div className={styles.glowEffect} />
                   </div>
                   <h3>Architecting Image</h3>
                   <p>Aligning structural components and lighting...</p>
                </motion.div>
              )}

              {result && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={styles.resultView}
                >
                  <div className={styles.imageWrapper}>
                    <img src={result.image_url} alt="Generated" />
                    <div className={styles.overlay}>
                      <Button 
                        variant="glass" 
                        size="sm"
                        onClick={() => window.open(result.image_url, '_blank')}
                      >
                        <Download size={16} className="mr-2" /> Download HD
                      </Button>
                    </div>
                  </div>
                  
                  {result.structured_prompt && (
                    <div className={styles.promptDetails}>
                       <h4>Structured Intelligence</h4>
                       <div className={styles.structuredPrompt}>
                          {typeof result.structured_prompt === 'string' 
                            ? JSON.parse(result.structured_prompt).short_description 
                            : result.structured_prompt.short_description}
                       </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={styles.error}
              >
                {error}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
