'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Type, ArrowLeft, Copy, Trash2, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { motion, AnimatePresence } from 'framer-motion';
import { marked } from 'marked';
import styles from './MarkdownPreview.module.scss';

export default function MarkdownPreviewPage() {
  const [markdown, setMarkdown] = useState('');
  const [html, setHtml] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const parseMarkdown = async () => {
      if (!markdown) {
        setHtml('');
        return;
      }
      const parsed = await marked.parse(markdown);
      setHtml(parsed);
    };
    
    parseMarkdown();
  }, [markdown]);

  const handleCopy = () => {
    if (!html) return;
    navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setMarkdown('');
  };

  const downloadMarkdown = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'notes.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <Link href="/tools/dev" className={styles.backBtn}>
            <ArrowLeft size={24} />
          </Link>
          <Type size={32} className={styles.icon} />
          <div>
            <h1>Markdown Preview</h1>
            <p>Write markdown and see rendered HTML in real-time. Completely offline.</p>
          </div>
        </div>
      </header>

      <div className={styles.mainGrid}>
        <section className={styles.pane}>
          <div className={styles.paneHeader}>
            <span>Editor (Markdown)</span>
            <div className={styles.actions}>
               <span title="Download .md" onClick={downloadMarkdown}>
                 <Download size={16} className={styles.actionIcon} />
               </span>
               <span title="Clear" onClick={handleClear}>
                 <Trash2 size={16} className={styles.actionIcon} />
               </span>
            </div>
          </div>
          <textarea
            className={styles.editor}
            placeholder="# Hello World\n\nStart typing markdown here..."
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
          />
        </section>

        <section className={styles.pane}>
          <div className={styles.paneHeader}>
            <span>Preview (Rendered)</span>
            <div className={styles.actions}>
              <span title="Copy HTML" onClick={handleCopy}>
                <Copy size={16} className={styles.actionIcon} />
              </span>
            </div>
          </div>
          <div className={styles.preview}>
            {html ? (
              <div dangerouslySetInnerHTML={{ __html: html }} />
            ) : (
              <div className={styles.empty}>
                <FileText size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p>Rendered preview will appear here...</p>
              </div>
            )}
          </div>
        </section>
      </div>
      
      <AnimatePresence>
        {copied && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={styles.copyFeedback}
          >
            HTML Copied to Clipboard!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
