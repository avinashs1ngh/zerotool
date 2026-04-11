'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Wand2, 
  Upload, 
  Download, 
  Loader2, 
  RefreshCcw,
  Sparkles,
  Info,
  Layers,
  HelpCircle
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

export default function AIImageEditPage() {
  const { providers } = useAIStore();
  const nbProvider = providers.nanobanana as NanoBananaProvider;

  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState<string | null>(null);
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

  const handleEdit = async () => {
    if (!prompt.trim() || !image) return;
    setIsProcessing(true);
    setError(null);
    setShowSuccess(false);
    try {
      const data = await nbProvider.editImage({
        prompt: prompt.trim(),
        image
      });
      setResult(data);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || 'Editing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `edited-${Date.now()}.png`;
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
          <div className="relative">
            <Wand2 size={32} className={styles.icon} color="#af52de" />
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-1 -right-1"
            >
              <Sparkles size={14} className="text-purple-400" />
            </motion.div>
          </div>
          <div>
            <h1>Image Edit</h1>
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
                  <div className="relative">
                    <Loader2 size={40} className="animate-spin text-purple-500" />
                    <Sparkles size={20} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-purple-400" />
                  </div>
                  <span className="font-black text-purple-500">Casting Spell...</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className={styles.controlGroup}>
              <div className="flex items-center justify-between mb-2">
                <label className="!mb-0"><Upload size={14} /> Source Canvas</label>
                <button className="text-muted hover:text-purple-400 transition-colors" title="Help">
                  <HelpCircle size={14} />
                </button>
              </div>
              <div 
                className={`${styles.premiumDropzone} ${isDragging ? styles.dragging : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('edit-upload')?.click()}
                style={{ borderStyle: 'dashed' }}
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
                      <h4>Drag & Drop Canvas</h4>
                      <p>or click to browse files</p>
                    </div>
                  </>
                )}
                <input 
                  id="edit-upload"
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  style={{ display: 'none' }}
                  onChange={handleUpload} 
                />
              </div>
            </div>

            <div className={styles.controlGroup + " mt-6"}>
              <label><Sparkles size={14} /> Magic Instructions</label>
              <textarea 
                className={styles.textArea}
                style={{ minHeight: '120px' }}
                placeholder="Ex: Add a cyberpunk neon visor to the character..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            <button 
              className={styles.generateBtn}
              onClick={handleEdit}
              disabled={isProcessing || !prompt.trim() || !image}
              style={{ background: 'linear-gradient(135deg, #af52de 0%, #8b5cf6 100%)', boxShadow: '0 8px 20px rgba(175, 82, 222, 0.3)' }}
            >
              {isProcessing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Conjuring...
                </>
              ) : (
                <>
                  <Wand2 size={18} />
                  Cast Magic
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
                      <div className="relative group">
                          <div className="absolute -inset-4 bg-gradient-to-tr from-purple-500/20 to-blue-500/20 blur-2xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                          <div className="relative aspect-square w-72 h-72 rounded-3xl overflow-hidden border-4 border-white/20 shadow-2xl backdrop-blur-md p-1 bg-white/10">
                              <img src={image} className="w-full h-full object-contain rounded-2xl" crossOrigin="anonymous" />
                          </div>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <p className="font-black text-xs uppercase tracking-widest text-secondary">Awaiting Enchantment</p>
                        <p className="text-[10px] text-muted max-w-[200px] text-center italic">Describe the changes you want to see.</p>
                      </div>
                   </div>
                 ) : (
                   <div className="flex flex-col items-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-purple-500/10 flex items-center justify-center relative">
                       <Wand2 size={40} className="text-purple-500 opacity-50" />
                       <Sparkles size={16} className="absolute top-4 right-4 text-purple-400 opacity-50 animate-pulse" />
                    </div>
                    <div className="text-center px-6">
                      <h3 className="text-xl font-black mb-2">Magic Image Editor</h3>
                      <p className="text-secondary text-sm max-w-xs mx-auto leading-relaxed">
                        Modify any image with natural language. Change colors, add objects, or completely swap backgrounds in seconds.
                      </p>
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
                    <span className={styles.badge} style={{ background: '#af52de' }}>Enchanted ✨</span>
                  </div>
                  <img 
                    src={result.data[0].url} 
                    alt="Magic result" 
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
                
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md max-w-lg"
                >
                   <p className="text-xs text-secondary text-center italic">"{result.data[0].revised_prompt || prompt}"</p>
                </motion.div>
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
                style={{ background: '#af52de' }}
              >
                <Sparkles size={18} />
                Magic Applied Successfully!
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
