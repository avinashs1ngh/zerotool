'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useFileStore } from '@/store/file-store';
import { ImageIcon, Download, Image as ImageLucide, Shrink, ArrowLeft, CheckCircle2 } from 'lucide-react';
import styles from './ImageCompressor.module.scss';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function ImageCompressorPage() {
  const droppedFile = useFileStore(s => s.droppedFile);
  const setDroppedFile = useFileStore(s => s.setDroppedFile);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [quality, setQuality] = useState(0.7);
  const [maxWidth, setMaxWidth] = useState(1920);
  
  const [compressedResult, setCompressedResult] = useState<{ blob: Blob, url: string, size: number } | null>(null);
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
    setCompressedResult(null);
    const url = URL.createObjectURL(newFile);
    setPreview(url);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleNewFile(e.target.files[0]);
    }
  };

  const compressImage = async () => {
    if (!file || !preview) return;
    setIsProcessing(true);

    try {
      const img = new Image();
      img.src = preview;
      await new Promise(resolve => { img.onload = resolve; });

      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      const format = file.type === 'image/png' ? 'image/jpeg' : file.type;
      const outFormat = format === 'image/jpeg' || format === 'image/webp' ? format : 'image/jpeg';
      
      canvas.toBlob((blob) => {
        if (!blob) throw new Error('Blob generation failed');
        const url = URL.createObjectURL(blob);
        setCompressedResult({
          blob,
          url,
          size: blob.size
        });
        setCustomName(`${file.name.split('.')[0]}_compressed`);
        setIsProcessing(false);
      }, outFormat, quality);
    } catch (e: any) {
      alert(`Compression error: ${e.message}`);
      setIsProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!compressedResult || !file) return;
    const url = URL.createObjectURL(compressedResult.blob);
    const a = document.createElement('a');
    a.href = url;
    const ext = compressedResult.blob.type.split('/')[1];
    const finalName = customName.toLowerCase().endsWith(`.${ext}`) ? customName : `${customName}.${ext}`;
    a.download = finalName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const reset = () => {
    setFile(null);
    setCompressedResult(null);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <Link href="/tools/image" className={styles.backBtn}>
            <ArrowLeft size={24} />
          </Link>
          <Shrink size={32} className={styles.icon} />
          <div>
            <h1>Image Compressor</h1>
            <p>Reduce image file size instantly right in your browser. Complete privacy.</p>
          </div>
        </div>
      </header>

      <div className={styles.content}>
        <AnimatePresence mode="wait">
          {compressedResult ? (
            <motion.div 
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={styles.resultContainer}
            >
              <div className={styles.resultCard}>
                <CheckCircle2 size={48} className={styles.successIcon} />
                <h2>Compression Complete!</h2>
                <p>Your image has been optimized for the web.</p>

                <div className={styles.resultGrid}>
                  <div className={styles.resultPreview}>
                    <img src={compressedResult.url} alt="Compressed" />
                  </div>
                  <div className={styles.resultStats}>
                    <h3>Efficiency Stats</h3>
                    <div className={styles.statLine}>
                      <span>Original Size:</span>
                      <strong>{(file!.size / 1024).toFixed(2)} KB</strong>
                    </div>
                    <div className={styles.statLine}>
                      <span>New Size:</span>
                      <strong className={styles.successText}>{(compressedResult.size / 1024).toFixed(2)} KB</strong>
                    </div>
                    <div className={styles.statLine}>
                      <span>Reduction:</span>
                      <strong>{Math.round((1 - compressedResult.size / file!.size) * 100)}%</strong>
                    </div>
                  </div>
                </div>

                <div className={styles.renameSection}>
                  <label htmlFor="filename">Rename File</label>
                  <div className={styles.inputWrapper}>
                    <input 
                      id="filename"
                      type="text" 
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="Enter filename"
                    />
                    <span className={styles.extension}>.{compressedResult.blob.type.split('/')[1]}</span>
                  </div>
                </div>

                <div className={styles.resultActions}>
                  <Button variant="ghost" onClick={reset}>
                    <ArrowLeft size={18} />
                    Start Over
                  </Button>
                  <Button variant="primary" size="lg" onClick={downloadResult}>
                    <Download size={18} />
                    Download Optimized Image
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
                      onChange={handleFileSelect} 
                      className={styles.fileInput}
                      id="img-upload"
                    />
                    <label htmlFor="img-upload" className={styles.uploadLabel}>
                      <ImageIcon size={48} className={styles.uploadIcon} />
                      <span>Click to select or drop an image here</span>
                    </label>
                  </div>
                ) : (
                  <div className={styles.previewArea}>
                    <div className={styles.previewImageWrap}>
                       <img src={preview!} alt="Original" className={styles.previewImg} />
                    </div>
                    <div className={styles.fileMeta}>
                      <p><strong>{file.name}</strong></p>
                      <p>Original Size: {(file.size / 1024).toFixed(2)} KB</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setFile(null)}>Remove</Button>
                  </div>
                )}
              </Card>

              <Card className={styles.settingsCard} title="Compression Settings">
                 <div className={styles.settingsList}>
                   <div className={styles.settingRow}>
                     <label>Quality (0.1 - 1.0)</label>
                     <div className={styles.sliderWrap}>
                       <input 
                         type="range" 
                         min="0.1" max="1.0" step="0.1" 
                         value={quality} 
                         onChange={(e) => setQuality(parseFloat(e.target.value))} 
                         disabled={!file}
                       />
                       <span>{Math.round(quality * 100)}%</span>
                     </div>
                   </div>

                   <Input 
                     label="Max Width (px)"
                     type="number"
                     value={maxWidth}
                     onChange={(e) => setMaxWidth(Number(e.target.value))}
                     disabled={!file}
                   />

                   <Button 
                     variant="primary" 
                     onClick={compressImage} 
                     disabled={!file || isProcessing}
                     isLoading={isProcessing}
                     className={styles.compressBtn}
                   >
                     Compress Image
                   </Button>
                 </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
