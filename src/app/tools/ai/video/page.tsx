'use client';

import React, { useState } from 'react';
import { Video, ArrowLeft, Play, Download, Sparkles, Wand2, RefreshCw, Layers, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './VideoLab.module.scss';
import { AILoader } from '@/components/ui/AILoader';

export default function VideoLabPage() {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState('1280x720');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setVideoUrl(null);

    try {
      const response = await fetch('/api/ai/qwen/v1/videos/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          size,
        }),
      });

      if (!response.ok) throw new Error('Video generation failed');

      const data = await response.json();
      const url = data.data?.[0]?.url || data.url;
      if (url) {
        setVideoUrl(url);
      } else {
        throw new Error('No video URL returned');
      }
    } catch (error) {
      console.error('Video Generation Error:', error);
      alert('Failed to generate video. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!videoUrl) return;
    const proxyUrl = `/api/video-proxy?url=${encodeURIComponent(videoUrl)}&download=1`;
    window.location.href = proxyUrl;
  };

  return (
    <div className={styles.videoPage}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
            <Link href="/tools/ai" className={styles.backBtn}>
                <ArrowLeft size={18} />
            </Link>
            <h1>Video Lab</h1>
        </div>
        <div className={styles.headerBadge}>
            <Sparkles size={12} />
            <span>Cinematic AI</span>
        </div>
      </header>

      <div className={styles.container}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className={styles.formSection}
        >
          <div className={styles.inputGroup}>
            <textarea 
              placeholder="Describe motion... e.g. A futuristic city drone fly-through."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <div className={styles.controlRow}>
            <div className={styles.selectWrapper}>
                <select 
                    className={styles.optionSelect}
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                >
                    <option value="1280x720">16:9 Landscape</option>
                    <option value="720x1280">9:16 Vertical</option>
                    <option value="1024x1024">1:1 Square</option>
                </select>
                <ChevronDown size={14} className={styles.selectIcon} />
            </div>

            <button 
                className={styles.generateBtn}
                disabled={!prompt.trim() || isGenerating}
                onClick={handleGenerate}
            >
                {isGenerating ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
                <span>{isGenerating ? 'Creating' : 'Generate'}</span>
            </button>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.previewSection}
        >
          <div className={styles.videoPreview}>
            <AnimatePresence mode="wait">
              {videoUrl ? (
                <motion.video 
                  key="video"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  src={`/api/video-proxy?url=${encodeURIComponent(videoUrl)}`}
                  controls
                  autoPlay
                  muted
                  playsInline
                  loop
                  preload="auto"
                />
              ) : isGenerating ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={styles.loaderArea}
                >
                  <AILoader 
                    variant="video" 
                    text="Developing Scene" 
                    subtext="Processing cinematic motion..." 
                  />
                </motion.div>
              ) : (
                <motion.div 
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={styles.placeholder}
                >
                  <Video size={48} className={styles.placeholderIcon} />
                  <p>Preview will appear here</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {videoUrl && (
            <div className={styles.actions}>
              <button className={styles.actionBtn} onClick={handleDownload}>
                <Download size={18} />
                <span>Get MP4</span>
              </button>
              <button className={`${styles.actionBtn} ${styles.secondary}`} onClick={() => setVideoUrl(null)}>
                <RefreshCw size={18} />
                <span>Reset</span>
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
