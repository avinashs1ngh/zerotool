'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Image as ImageIcon, 
  Sparkles, 
  Download, 
  Loader2, 
  Wand2, 
  History,
  Layers,
  Zap,
  Monitor,
  Maximize2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAIStore } from '@/store/ai-store';
import { NanoBananaProvider } from '@/core/ai/providers';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import styles from '../ImageStudio.module.scss';

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
export default function AIImageGeneratePage() {
  const { providers } = useAIStore();
  const nbProvider = providers.nanobanana as NanoBananaProvider;

  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('nano-banana');
  const [size, setSize] = useState('1024x1024');
  const [quality, setQuality] = useState('auto');
  const [numImages, setNumImages] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [models, setModels] = useState<any[]>([]);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    async function fetchModels() {
      try {
        const data = await nbProvider.listModels();
        if (data.data) setModels(data.data);
      } catch (err) {
        console.error('Failed to fetch models:', err);
      }
    }
    fetchModels();
  }, [nbProvider]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    setShowSuccess(false);
    try {
      const data = await nbProvider.generateImage({
        prompt: prompt.trim(),
        model,
        size,
        quality,
        n: numImages,
        response_format: 'url'
      });
      setResult(data);
      // Reset loaded states for new results
      setLoadedImages({});
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `nanobanana-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  return (
    <motion.div 
      className={styles.studioContainer}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            className={styles.lightbox}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
          >
            <button 
              className={styles.closeBtn} 
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(null);
              }}
            >
              <X size={24} />
            </button>
            <motion.div 
              className={styles.lightboxContent}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              <img src={selectedImage} alt="Fullscreen" crossOrigin="anonymous" />
              <div className={styles.lightboxActions}>
                <button 
                  className={styles.lbActionPrimary}
                  style={{ background: '#ffffff', color: '#000000', border: 'none' }}
                  onClick={() => downloadImage(selectedImage)}
                >
                  <Download size={20} />
                  Download
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            className={styles.successToast}
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
          >
            <Sparkles size={18} />
           Generated Successfully!
          </motion.div>
        )}
      </AnimatePresence>

      <motion.header className={styles.studioHeader} variants={itemVariants}>
        <div className={styles.titleArea}>
          <Link href="/tools/ai" className={styles.backBtn}>
            <ArrowLeft size={24} />
          </Link>
          <ImageIcon size={32} className={styles.icon} color="#ff2d55" />
          <div>
            <h1>Generate</h1>
           </div>
        </div>
      </motion.header>

      <div className={styles.mainLayout}>
        <motion.aside className={styles.controls} variants={itemVariants}>
          <div className={styles.glassCard}>
            <AnimatePresence>
              {isGenerating && (
                <motion.div 
                  className={styles.lockOverlay}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Loader2 size={32} className="animate-spin" />
                  <span>Generating Art...</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className={styles.controlGroup}>
              <label>
                <Wand2 size={14} /> 
                Creative Prompt
              </label>
              <textarea 
                className={styles.textArea}
                placeholder="Describe your vision... (e.g., A celestial library floating in a nebula)"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isGenerating}
              />
            </div>

            <div className={styles.gridOptions}>
              <div className={styles.controlGroup}>
                <label><Layers size={12} /> Model</label>
                <select 
                  className={styles.select}
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  disabled={isGenerating}
                >
                  <option value="nano-banana">nano-banana</option>
                  <option value="imagen-4.0-generate-001">imagen-4.0-generate-001</option>
                  <option value="imagen-4.0-fast-generate-001">imagen-4.0-fast-generate-001</option>
                  <option value="imagen-4.0-ultra-generate-001">imagen-4.0-ultra-generate-001</option>
                </select>
              </div>

              <div className={styles.controlGroup}>
                <label><Maximize2 size={12} /> Size</label>
                <select 
                  className={styles.select}
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  disabled={isGenerating}
                >
                  <option value="1024x1024">1024x1024</option>
                  <option value="1:1">1:1</option>
                  <option value="3:4">3:4</option>
                  <option value="4:3">4:3</option>
                  <option value="9:16">9:16</option>
                  <option value="16:9">16:9</option>
                </select>
              </div>
            </div>

            <div className={styles.gridOptions}>
              <div className={styles.controlGroup}>
                <label><Zap size={12} /> Quality</label>
                <select 
                  className={styles.select}
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                  disabled={isGenerating}
                >
                  <option value="auto">auto</option>
                  <option value="standard">standard</option>
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                  <option value="hd">hd</option>
                </select>
              </div>

              <div className={styles.controlGroup}>
                <label><History size={12} /> Batch</label>
                <select 
                  className={styles.select}
                  value={numImages}
                  onChange={(e) => setNumImages(Number(e.target.value))}
                  disabled={isGenerating}
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                </select>
              </div>
            </div>

            <button 
              className={styles.generateBtn}
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
            >
              {isGenerating ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Manifesting...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Generate
                </>
              )}
            </button>
          </div>
        </motion.aside>

        <motion.section className={`${styles.canvas} ${!result ? styles.empty : ''}`} variants={itemVariants}>
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={styles.emptyState}
              >
                <div className={styles.emptyIcon}>
                  <Monitor size={100} strokeWidth={1} />
                </div>
                <h3>Start Creating</h3>
                <p>Enter a prompt and click generate to see the magic.</p>
              </motion.div>
            ) : (
              <motion.div 
                key="result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={styles.resultsGrid}
              >
                {result.data.map((img: any, idx: number) => (
                  <motion.div 
                    key={img.url + idx} 
                    className={styles.imageContainer}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => setSelectedImage(img.url)}
                  >
                    {!loadedImages[img.url] && <div className={styles.shimmer} />}
                    <div className={styles.metadata}>
                      <span className={styles.badge}>{model}</span>
                    </div>
                    <img 
                      src={img.url} 
                      alt={prompt} 
                      className={`${styles.resultImage} ${loadedImages[img.url] ? styles.loaded : ''}`}
                      crossOrigin="anonymous"
                      onLoad={() => setLoadedImages(prev => ({ ...prev, [img.url]: true }))}
                    />
                    <div className={styles.imageActions}>
                      <button 
                        className={styles.actionBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadImage(img.url);
                        }}
                        title="Download"
                      >
                        <Download size={18} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-red-500/10 border border-red-500/30 text-red-500 px-6 py-3 rounded-xl backdrop-blur-xl z-50 text-sm font-bold shadow-lg"
            >
              {error}
            </motion.div>
          )}
        </motion.section>
      </div>


    </motion.div>
  );
}
