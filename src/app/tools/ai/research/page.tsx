'use client';

import React, { useState } from 'react';
import { Search, ArrowLeft, Loader2, Sparkles, BookOpen, Quote, Download } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { marked } from 'marked';
import styles from './Research.module.scss';

export default function DeepResearchPage() {
  const [query, setQuery] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  const handleResearch = async () => {
    if (!query.trim() || isResearching) return;

    setIsResearching(true);
    setResult(null);
    setStatus('Initializing deep research agent...');

    try {
      setTimeout(() => setStatus('Browsing the web for latest sources...'), 3000);
      setTimeout(() => setStatus('Analyzing search results and extracting data...'), 8000);
      setTimeout(() => setStatus('Synthesizing comprehensive research report...'), 15000);

      const response = await fetch('/api/ai/qwen/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen-deep-research',
          messages: [{ role: 'user', content: query }],
          stream: false,
        }),
      });

      if (!response.ok) throw new Error('Research failed');

      const data = await response.json();
      setResult(data.choices[0].message.content);
    } catch (error) {
      console.error('Research Error:', error);
      setStatus('An error occurred. Please try again.');
    } finally {
      setIsResearching(false);
    }
  };

  const downloadReport = () => {
    if (!result) return;
    const blob = new Blob([result], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `research-report-${new Date().getTime()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.researchPage}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
            <Link href="/tools/ai" className={styles.backBtn}>
            <ArrowLeft size={20} />
            </Link>
            <h1>Deep Research</h1>
        </div>
        <div className={styles.headerBadge}>
            <Sparkles size={12} />
            <span>Agentic AI</span>
        </div>
      </header>

      <div className={styles.container}>
        {!result && !isResearching && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.welcomeArea}
          >
            <div className={styles.heroGlow} />
            <Search size={48} className={styles.researchIcon} />
            <h2>What should we research?</h2>
            <p className={styles.heroDesc}>Enter a complex topic, and our agent will analyze multiple sources to generate a report.</p>
            
            <div className={styles.inputCard}>
              <textarea 
                placeholder="Ex: Future of quantum computing in 2026..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className={styles.actions}>
                <button 
                  disabled={!query.trim()}
                  onClick={handleResearch}
                >
                  <Sparkles size={16} />
                  Start Agent
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {isResearching && (
          <div className={styles.researching}>
            <div className={styles.loaderArea}>
                <div className={styles.loaderLine}></div>
                <div className={styles.loaderBrain}>
                    <Loader2 size={32} className="animate-spin" />
                </div>
            </div>
            <div className={styles.status}>
              <h3>Analyzing Query</h3>
              <p>{status}</p>
            </div>
          </div>
        )}

        <AnimatePresence>
          {result && !isResearching && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={styles.reportWrapper}
            >
              <div className={styles.reportHeader}>
                <div className={styles.reportTitle}>
                    <BookOpen size={18} />
                    <span>Intelligence Report</span>
                </div>
                <button className={styles.downloadBtn} onClick={downloadReport}>
                   <Download size={14} />
                   <span>Export MD</span>
                </button>
              </div>
              <div 
                className={styles.resultArea}
                dangerouslySetInnerHTML={{ __html: marked.parse(result) as string }}
              />
              <footer className={styles.reportFooter}>
                 <p>Generated by Qwen Intelligence • Autonomous Research Agent</p>
                 <button className={styles.newResearch} onClick={() => setResult(null)}>
                    New Topic
                 </button>
              </footer>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
