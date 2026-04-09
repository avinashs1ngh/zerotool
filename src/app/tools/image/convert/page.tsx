'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Repeat, ArrowLeft, Download, ImageIcon, RefreshCw, X } from 'lucide-react';
import styles from './ImageConverter.module.scss';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

type ImageFormat = 'png' | 'jpeg' | 'webp' | 'avif';

export default function ImageConverterPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [targetFormat, setTargetFormat] = useState<ImageFormat>('png');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ blob: Blob, url: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const newFile = e.target.files[0];
      setFile(newFile);
      setPreview(URL.createObjectURL(newFile));
      setResult(null);
    }
  };

  const handleConvert = async () => {
    if (!file || !preview) return;
    setIsProcessing(true);

    try {
      const img = new Image();
      img.src = preview;
      await new Promise(resolve => { img.onload = resolve; });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      ctx.drawImage(img, 0, 0);

      const mimeType = `image/${targetFormat}`;
      
      canvas.toBlob((blob) => {
        if (!blob) throw new Error('Conversion failed');
        const url = URL.createObjectURL(blob);
        setResult({ blob, url });
        setIsProcessing(false);
      }, mimeType, 0.9);
    } catch (e: any) {
      alert(`Conversion error: ${e.message}`);
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    const a = document.createElement('a');
    a.href = result.url;
    const fileName = file.name.split('.')[0];
    a.download = `${fileName}.${targetFormat}`;
    a.click();
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <Link href="/tools/image" className={styles.backBtn}>
            <ArrowLeft size={24} />
          </Link>
          <Repeat size={32} className={styles.icon} />
          <div>
            <h1>Format Converter</h1>
            <p>Convert images between PNG, JPEG, WebP, and AVIF instantly.</p>
          </div>
        </div>
      </header>

      <div className={styles.mainGrid}>
        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div 
              key="upload"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={styles.uploadCard}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className={styles.uploadArea}>
                <ImageIcon size={64} className={styles.uploadIcon} />
                <span>Click to select an image to convert</span>
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileSelect} 
                accept="image/*"
                className={styles.fileInput} 
              />
            </motion.div>
          ) : (
            <motion.div 
              key="preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={styles.previewCard}
            >
              <div className={styles.previewImageWrap}>
                 <img src={preview!} alt="Preview" />
              </div>

              <div className={styles.settings}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>Conversion Settings</h3>
                  <X 
                    size={20} 
                    style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}
                    onClick={handleReset}
                  />
                </div>

                <div style={{ margin: '1rem 0' }}>
                   <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>Select Target Format:</p>
                   <div className={styles.formatSelect}>
                     {(['png', 'jpeg', 'webp', 'avif'] as ImageFormat[]).map(format => (
                       <button
                        key={format}
                        className={`${styles.formatBtn} ${targetFormat === format ? styles.active : ''}`}
                        onClick={() => setTargetFormat(format)}
                       >
                        {format.toUpperCase()}
                       </button>
                     ))}
                   </div>
                </div>

                {!result ? (
                  <Button 
                    variant="primary" 
                    size="lg" 
                    onClick={handleConvert}
                    disabled={isProcessing}
                    isLoading={isProcessing}
                    className={styles.downloadBtn}
                  >
                    <RefreshCw size={18} />
                    Convert Image
                  </Button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Button 
                      variant="primary" 
                      size="lg" 
                      onClick={handleDownload}
                      className={styles.downloadBtn}
                    >
                      <Download size={18} />
                      Download {targetFormat.toUpperCase()}
                    </Button>
                    <Button variant="ghost" onClick={() => setResult(null)}>
                      Change Format
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer style={{ marginTop: '3rem', textAlign: 'center', opacity: 0.6, fontSize: '0.85rem' }}>
        <p>All conversions are performed locally in your browser. No images are uploaded to any server.</p>
      </footer>
    </div>
  );
}
