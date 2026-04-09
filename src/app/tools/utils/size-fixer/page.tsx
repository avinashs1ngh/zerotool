'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { 
  Minimize, Upload, Download, Trash2, 
  CheckCircle2, FileImage, Settings2 
} from 'lucide-react';
import styles from './SizeFixer.module.scss';
import { compressToTargetSize } from '@/utils/canvas-utils';
import { motion, AnimatePresence } from 'framer-motion';

const TARGET_PRESETS = [10, 20, 50, 100, 200, 500];

export default function SizeFixerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [targetKb, setTargetKb] = useState(50);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ blob: Blob; size: number } | null>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleProcess = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(0);
    try {
      const compressedBlob = await compressToTargetSize(file, targetKb, (p) => setProgress(p));
      setResult({ blob: compressedBlob, size: compressedBlob.size });
    } catch (e: any) {
      alert(`Processing failed: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!result || !file) return;
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fixed_${targetKb}kb_${file.name}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <Minimize size={32} className={styles.icon} />
          <div>
            <h1>Size Fixer</h1>
            <p>Force images to stay under a specific size (e.g., 20kb, 50kb). Extremely useful for form uploads.</p>
          </div>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.leftCol}>
          {!file ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={styles.uploadArea}
              onClick={() => document.getElementById('size-upload')?.click()}
            >
              <input type="file" id="size-upload" accept="image/*" onChange={onFileChange} />
              <Upload size={48} color="var(--accent-primary)" style={{ marginBottom: 20 }} />
              <h3>Select Image</h3>
              <p>JPG, PNG, WEBP (Maximum 20MB)</p>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={styles.fileList}
            >
              <div className={styles.fileItem}>
                <FileImage size={24} color="var(--accent-primary)" />
                <div className={styles.fileInfo}>
                  <h4>{file.name}</h4>
                  <span>Original: {formatSize(file.size)}</span>
                </div>
                <Button variant="ghost" onClick={() => {setFile(null); setResult(null);}}>
                  <Trash2 size={18} />
                </Button>
              </div>

              {result && (
                <Card className={styles.results}>
                  <h3><CheckCircle2 size={20} color="var(--accent-green)" /> Processing Complete</h3>
                  <div className={styles.statRow}>
                    <label>Target Size:</label>
                    <span>Under {targetKb} KB</span>
                  </div>
                  <div className={styles.statRow}>
                    <label>New Size:</label>
                    <span className={styles.success}>{formatSize(result.size)}</span>
                  </div>
                  <Button variant="primary" size="lg" onClick={downloadResult}>
                    <Download size={18} />
                    Download Result
                  </Button>
                </Card>
              )}
            </motion.div>
          )}
        </div>

        <div className={styles.rightCol}>
          <Card className={styles.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <Settings2 size={20} color="var(--accent-primary)" />
              <h3 style={{ margin: 0 }}>Adjustment Settings</h3>
            </div>

            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 12 }}>
              Target File Size
            </label>
            <div className={styles.targetOptions}>
              {TARGET_PRESETS.map((kb) => (
                <button 
                  key={kb}
                  className={`${styles.optionBtn} ${targetKb === kb ? styles.active : ''}`}
                  onClick={() => setTargetKb(kb)}
                >
                  {kb}K
                </button>
              ))}
            </div>

            <div className={styles.customInput}>
              <input 
                type="number" 
                value={targetKb} 
                onChange={(e) => setTargetKb(Number(e.target.value))} 
              />
              <span>KB (Custom)</span>
            </div>

            {isProcessing && (
              <div style={{ marginTop: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                  <span>Optimizing...</span>
                  <span>{Math.round(progress * 100)}%</span>
                </div>
                <div className={styles.progressBar}>
                  <div className={styles.progressInner} style={{ width: `${progress * 100}%` }} />
                </div>
              </div>
            )}

            <Button 
              variant="primary" 
              size="lg" 
              fullWidth 
              style={{ marginTop: 32 }} 
              onClick={handleProcess}
              disabled={!file || isProcessing}
              isLoading={isProcessing}
            >
              Start Fixing Size
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
