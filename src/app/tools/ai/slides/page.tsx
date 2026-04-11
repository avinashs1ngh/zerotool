'use client';

import React, { useState } from 'react';
import { Presentation, ArrowLeft, Send, Sparkles, Download, RefreshCw, Layers, FileText, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './Slides.module.scss';
import { AILoader } from '@/components/ui/AILoader';

interface Slide {
  title: string;
  content: string;
  image?: string;
}

export default function AISlidesPage() {
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [slides, setSlides] = useState<Slide[] | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim() || isLoading) return;

    setIsLoading(true);
    setSlides(null);
    setPdfUrl(null);

    try {
      const response = await fetch('/api/ai/qwen/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen-slides',
          messages: [{ role: 'user', content: topic }],
          stream: false,
        }),
      });

      if (!response.ok) throw new Error('Slides generation failed');

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      const lines = content.split('\n');
      const tempSlides: Slide[] = [];
      let currentSlide: Partial<Slide> = {};

      lines.forEach((line: string) => {
        if (line.startsWith('## Slide')) {
             if (currentSlide.title) tempSlides.push(currentSlide as Slide);
             currentSlide = { title: line.replace(/## Slide \d+:?/, '').trim() };
        } else if (line.startsWith('![')) {
             const match = line.match(/\((.*?)\)/);
             if (match) currentSlide.image = match[1];
        } else if (line.trim() && !line.startsWith('#')) {
             currentSlide.content = (currentSlide.content || '') + ' ' + line.trim();
        }
      });
      if (currentSlide.title) tempSlides.push(currentSlide as Slide);

      setSlides(tempSlides);

      const pdfMatch = content.match(/\[Download PDF\]\((.*?)\)/);
      if (pdfMatch) setPdfUrl(pdfMatch[1]);

    } catch (error) {
      console.error('Slides Error:', error);
      alert('Failed to generate slides.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
            <Link href="/tools/ai" className={styles.backBtn}>
            <ArrowLeft size={18} />
            </Link>
            <h1>Slide Engine</h1>
        </div>
        <div className={styles.headerBadge}>
            <Sparkles size={12} />
            <span>Qwen Slides</span>
        </div>
      </header>

      {!slides && !isLoading && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className={styles.inputPanel}
        >
          <Presentation size={32} className={styles.icon} />
          <h2>Design Presentation</h2>
          <div className={styles.inputWrapper}>
            <input 
              placeholder="Enter topic..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <button disabled={!topic.trim()} onClick={handleGenerate}>
              <Sparkles size={14} />
              <span>Generate</span>
            </button>
          </div>
        </motion.div>
      )}

      {isLoading && (
        <AILoader 
          variant="presentation" 
          text="Researching & Designing" 
          subtext="Crafting slides & generating visuals..." 
        />
      )}

      {slides && !isLoading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={styles.resultArea}
        >
          <div className={styles.slidesHeader}>
            <div className={styles.info}>
              <Layers size={18} />
              <span>{slides.length} Slides</span>
            </div>
            {pdfUrl && (
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className={styles.pdfBtn}>
                <Download size={16} />
                Export PDF
              </a>
            )}
          </div>

          <div className={styles.slidesGrid}>
            {slides.map((slide, i) => (
              <motion.div 
                key={i} 
                className={styles.slideCard}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                {slide.image && <img src={slide.image} alt={slide.title} />}
                <div className={styles.slideContent}>
                  <h4>{slide.title}</h4>
                  <p>{slide.content}</p>
                </div>
                <div className={styles.slideNum}>{i + 1}</div>
              </motion.div>
            ))}
          </div>

          <button className={styles.newEntry} onClick={() => setSlides(null)}>
            New Presentation
          </button>
        </motion.div>
      )}
    </div>
  );
}
