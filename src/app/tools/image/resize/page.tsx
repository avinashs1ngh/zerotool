'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useFileStore } from '@/store/file-store';
import { ImageIcon, Download, Maximize2, Lock, Unlock, ArrowLeft, CheckCircle2 } from 'lucide-react';
import styles from './ImageResizer.module.scss';
import { motion, AnimatePresence } from 'framer-motion';

export default function ImageResizerPage() {
  const droppedFile = useFileStore(s => s.droppedFile);
  const setDroppedFile = useFileStore(s => s.setDroppedFile);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [originalAspectRatio, setOriginalAspectRatio] = useState<number>(1);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [quality, setQuality] = useState(0.9);
  
  const [result, setResult] = useState<{ blob: Blob, url: string } | null>(null);
  const [customName, setCustomName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      handleNewFile(droppedFile);
      setDroppedFile(null);
    }
  }, [droppedFile, setDroppedFile]);

  const handleNewFile = (newFile: File) => {
    setFile(newFile);
    setResult(null);
    const url = URL.createObjectURL(newFile);
    setPreview(url);

    const img = new Image();
    img.src = url;
    img.onload = () => {
      setWidth(img.width);
      setHeight(img.height);
      setOriginalAspectRatio(img.width / img.height);
    };
  };

  const handleWidthChange = (val: number) => {
    setWidth(val);
    if (lockAspectRatio) {
      setHeight(Math.round(val / originalAspectRatio));
    }
  };

  const handleHeightChange = (val: number) => {
    setHeight(val);
    if (lockAspectRatio) {
      setWidth(Math.round(val * originalAspectRatio));
    }
  };

  const processResize = async () => {
    if (!file || !preview) return;
    setIsProcessing(true);

    try {
      const img = new Image();
      img.src = preview;
      await new Promise(resolve => { img.onload = resolve; });

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context failed');

      ctx.drawImage(img, 0, 0, width, height);

      const outFormat = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      
      canvas.toBlob((blob) => {
        if (!blob) throw new Error('Resize failed');
        const url = URL.createObjectURL(blob);
        setResult({ blob, url });
        setCustomName(`${file.name.split('.')[0]}_resized`);
        setIsProcessing(false);
      }, outFormat, quality);
    } catch (e: any) {
      alert(`Error: ${e.message}`);
      setIsProcessing(false);
    }
  };

  const downloadFinal = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.url;
    const ext = result.blob.type.split('/')[1];
    const finalName = customName.toLowerCase().endsWith(`.${ext}`) ? customName : `${customName}.${ext}`;
    a.download = finalName;
    a.click();
  };

  const reset = () => {
    setFile(null);
    setResult(null);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <Link href="/tools/image" className={styles.backBtn}>
            <ArrowLeft size={24} />
          </Link>
          <Maximize2 size={32} className={styles.icon} />
          <div>
            <h1>Image Resizer</h1>
            <p>Change dimensions of your images with pixel-perfect control.</p>
          </div>
        </div>
      </header>

      <div className={styles.content}>
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div 
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={styles.resultContainer}
            >
              <div className={styles.resultCard}>
                <CheckCircle2 size={48} className={styles.successIcon} />
                <h2>Resize Successful!</h2>
                <p>Your image is now {width} x {height} px.</p>

                <div className={styles.renameSection}>
                  <label htmlFor="filename">Rename File</label>
                  <div className={styles.inputWrapper}>
                    <input 
                      id="filename"
                      type="text" 
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                    />
                    <span className={styles.extension}>.{result.blob.type.split('/')[1]}</span>
                  </div>
                </div>

                <div className={styles.resultActions}>
                  <Button variant="ghost" onClick={reset}>
                    <ArrowLeft size={18} />
                    Start Over
                  </Button>
                  <Button variant="primary" size="lg" onClick={downloadFinal}>
                    <Download size={18} />
                    Download Resized Image
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="setup"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={styles.mainGrid}
            >
              <Card className={styles.uploadCard}>
                {!file ? (
                  <div className={styles.uploadArea}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => e.target.files?.[0] && handleNewFile(e.target.files[0])} 
                      className={styles.fileInput}
                      id="img-resize-upload"
                    />
                    <label htmlFor="img-resize-upload" className={styles.uploadLabel}>
                      <ImageIcon size={48} />
                      <span>Select or drop an image</span>
                    </label>
                  </div>
                ) : (
                  <div className={styles.previewArea}>
                    <div className={styles.imageWrap}>
                      <img src={preview!} alt="Preview" />
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setFile(null)}>Remove Image</Button>
                  </div>
                )}
              </Card>

              <Card className={styles.settingsCard} title="Resize Options">
                <div className={styles.settingsRow}>
                  <Input 
                    label="Width (px)"
                    type="number"
                    value={width}
                    onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                    disabled={!file}
                  />
                  <Input 
                    label="Height (px)"
                    type="number"
                    value={height}
                    onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                    disabled={!file}
                  />
                </div>

                <button 
                  className={`${styles.lockBtn} ${lockAspectRatio ? styles.active : ''}`}
                  onClick={() => setLockAspectRatio(!lockAspectRatio)}
                  disabled={!file}
                >
                  {lockAspectRatio ? <Lock size={16} /> : <Unlock size={16} />}
                  Aspect Ratio: {lockAspectRatio ? 'Locked' : 'Unlocked'}
                </button>

                <div className={styles.settingGroup}>
                  <label>Quality (JPG only)</label>
                  <input 
                    type="range" 
                    min="0.1" max="1.0" step="0.1" 
                    value={quality}
                    onChange={(e) => setQuality(parseFloat(e.target.value))}
                    disabled={!file}
                  />
                </div>

                <Button 
                  variant="primary" 
                  size="lg" 
                  onClick={processResize}
                  disabled={!file || isProcessing}
                  isLoading={isProcessing}
                >
                  Resize Image
                </Button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
