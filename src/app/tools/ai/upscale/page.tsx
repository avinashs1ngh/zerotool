'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Maximize2, 
  Upload, 
  Download, 
  Loader2, 
  RefreshCcw,
  Zap,
  CheckCircle2,
  FileSearch,
  Sparkles,
  Wand2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAIStore } from '@/store/ai-store';
import { NanoBananaProvider } from '@/core/ai/providers';
import { Card } from '@/components/ui/Card';
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

export default function AIImageUpscalePage() {
  const { providers } = useAIStore();
  const nbProvider = providers.nanobanana as NanoBananaProvider;

  const [image, setImage] = useState<string | null>(null);
  const [factor, setFactor] = useState('x2');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
        setShowSuccess(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
        setShowSuccess(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpscale = async () => {
    if (!image) return;
    setIsProcessing(true);
    setError(null);
    setShowSuccess(false);
    try {
      const data = await nbProvider.upscaleImage({
        image,
        upscale_factor: factor,
        response_format: 'url'
      });
      setResult(data);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || 'Upscaling failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = async (url: string) => {
    if (!url) return;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `upscaled-${factor}-${Date.now()}.png`;
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
      <motion.header className={styles.studioHeader} variants={itemVariants}>
        <div className={styles.titleArea}>
          <Link href="/tools/ai" className={styles.backBtn}>
            <ArrowLeft size={24} />
          </Link>
          <Maximize2 size={32} className={styles.icon} color="#3b82f6" />
          <div>
            <h1>Enhance</h1>
            <p className="hidden sm:block text-secondary text-sm">Professional AI upscaling for your photos.</p>
          </div>
        </div>
      </motion.header>

      <div className={styles.mainLayout}>
        <motion.aside className={styles.controls} variants={itemVariants}>
          <div className={styles.glassCard}>
            <AnimatePresence>
              {isProcessing && (
                <motion.div 
                  className={styles.lockOverlay}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Loader2 size={32} className="animate-spin" />
                  <span>Enhancing Pixels...</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className={styles.controlGroup}>
              <label>
                <Upload size={14} /> 
                Source Image
              </label>
              <div 
                className={`${styles.premiumDropzone} ${isDragging ? styles.dragging : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('image-upload')?.click()}
              >
                {image ? (
                  <>
                    <img src={image} alt="Source" className={styles.previewImage} crossOrigin="anonymous" />
                    <button 
                      className={styles.removeBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        setImage(null);
                        setResult(null);
                      }}
                    >
                      <RefreshCcw size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <div className={styles.dropIcon}>
                      <Upload size={48} />
                    </div>
                    <div className={styles.dropText}>
                      <h4>Drag & Drop Image</h4>
                      <p>or click to browse from files</p>
                    </div>
                  </>
                )}
                <input 
                  id="image-upload"
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  style={{ display: 'none' }}
                  onChange={handleUpload} 
                />
              </div>
            </div>

            <div className={styles.gridOptions} style={{ gridTemplateColumns: '1fr' }}>
              <div className={styles.controlGroup}>
                <label><Maximize2 size={12} /> Factor</label>
                <select 
                  className={styles.select}
                  value={factor}
                  onChange={(e) => setFactor(e.target.value)}
                  disabled={isProcessing}
                >
                  <option value="x2">x2 (2K HD)</option>
                  <option value="x4">x4 (4K Ultra)</option>
                </select>
              </div>
            </div>

            <button 
              className={styles.generateBtn}
              onClick={handleUpscale}
              disabled={isProcessing || !image}
              style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)' }}
            >
              {isProcessing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Restoring...
                </>
              ) : (
                <>
                  <Zap size={18} />
                  Enhance Now
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
                 {image ? (
                   <div className="flex flex-col items-center gap-6">
                      <div className="relative aspect-square w-72 h-72 rounded-3xl overflow-hidden border-4 border-white shadow-2xl bg-white p-1">
                          <img src={image} className="w-full h-full object-contain rounded-2xl" crossOrigin="anonymous" />
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <p className="font-black text-xs uppercase tracking-widest text-secondary">Awaiting Restoration</p>
                        <p className="text-[10px] text-muted max-w-[200px] text-center">Click enhance to use Super Resolution AI on this image.</p>
                      </div>
                   </div>
                 ) : (
                   <div className="flex flex-col items-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Maximize2 size={40} className="text-blue-500 opacity-50" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-black mb-2">Enhance</h3>
                      <p className="text-secondary text-sm max-w-xs mx-auto">Upload any low-quality image and our AI will reconstruct lost details instantly.</p>
                    </div>
                   </div>
                 )}
              </motion.div>
            ) : (
              <motion.div 
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center h-full w-full p-4 sm:p-12"
              >
                <div className={styles.imageContainer} style={{ maxWidth: '800px', cursor: 'default' }}>
                  <div className={styles.metadata}>
                    <span className={styles.badge} style={{ background: '#3b82f6' }}>Restored {factor} ✨</span>
                  </div>
                  <img 
                    src={result.data[0].url} 
                    alt="Upscaled result" 
                    className={styles.resultImage + " " + styles.loaded}
                    crossOrigin="anonymous"
                  />
                  <div className={styles.imageActions} style={{ opacity: 1, transform: 'translateX(-50%) translateY(0)' }}>
                    <button 
                      className={styles.actionBtn}
                      onClick={() => downloadImage(result.data[0].url)}
                      title="Download"
                    >
                      <Download size={18} />
                    </button>
                    <button 
                      className={styles.actionBtn}
                      onClick={() => setResult(null)}
                      title="Reset"
                    >
                      <RefreshCcw size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showSuccess && (
              <motion.div 
                className={styles.successToast}
                initial={{ opacity: 0, y: 20, x: '-50%' }}
                animate={{ opacity: 1, y: 0, x: '-50%' }}
                exit={{ opacity: 0, y: 20, x: '-50%' }}
                style={{ background: '#3b82f6' }}
              >
                <Sparkles size={18} />
                Upscaled Successfully!
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-6 bg-red-500/10 border border-red-500/30 text-red-500 px-6 py-3 rounded-xl backdrop-blur-xl z-50 flex items-center gap-2 text-sm font-bold shadow-lg"
            >
              {error}
            </motion.div>
          )}
        </motion.section>
      </div>
    </motion.div>
  );
}
