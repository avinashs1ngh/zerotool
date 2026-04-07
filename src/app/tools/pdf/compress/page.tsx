'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PDFDocument } from 'pdf-lib';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useFileStore } from '@/store/file-store';
import { Shrink, FileText, Download, Trash2, Plus, ArrowRight, CheckCircle2, ArrowLeft } from 'lucide-react';
import styles from './CompressPDF.module.scss';
import { motion, AnimatePresence } from 'framer-motion';

type CompressionLevel = 'basic' | 'recommended' | 'extreme';

export default function CompressPDFPage() {
  const droppedFile = useFileStore(s => s.droppedFile);
  const setDroppedFile = useFileStore(s => s.setDroppedFile);
  
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [level, setLevel] = useState<CompressionLevel>('recommended');
  const [result, setResult] = useState<{ blob: Blob; size: number } | null>(null);
  const [customName, setCustomName] = useState('');

  useEffect(() => {
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setDroppedFile(null);
    }
  }, [droppedFile]);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setResult(null);
    }
  };

  const removeFile = () => {
    setFile(null);
    setResult(null);
  };

  const processCompression = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      const buffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(buffer);

      // Metadata stripping (Basic compression)
      pdf.setAuthor('');
      pdf.setCreator('');
      pdf.setProducer('');
      pdf.setSubject('');
      pdf.setTitle('');

      // Optimization based on level
      const useObjectStreams = level !== 'basic';
      
      const bytes = await pdf.save({ 
        useObjectStreams,
        addDefaultPage: false,
        updateFieldAppearances: false
      });

      const blob = new Blob([bytes as any], { type: 'application/pdf' });
      setResult({ blob, size: bytes.length });
      setCustomName(`${file.name.replace('.pdf', '')}_compressed`);
    } catch (e: any) {
      alert(`Compression failed: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!result || !file) return;
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url;
    const finalName = customName.toLowerCase().endsWith('.pdf') ? customName : `${customName}.pdf`;
    a.download = finalName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <Shrink size={32} className={styles.icon} />
          <div>
            <h1>Compress PDF</h1>
            <p>Reduce the size of your PDF while maintaining quality. All locally in your browser.</p>
          </div>
        </div>
      </header>

      <div className={styles.content}>
        {!file ? (
          <div className={styles.uploadArea}>
            <input type="file" accept=".pdf" onChange={onFileSelect} className={styles.fileInput} id="compress-upload" />
            <label htmlFor="compress-upload" className={styles.uploadLabel}>
              <Plus size={24} color="var(--accent-cyan)" />
              <span>Select PDF to compress</span>
            </label>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={styles.activeArea}>
            <div className={styles.card}>
              <div className={styles.fileInfo}>
                <div className={styles.meta}>
                  <FileText className={styles.fileIcon} size={24} />
                  <div className={styles.details}>
                    <h4>{file.name}</h4>
                    <span>{formatSize(file.size)}</span>
                  </div>
                </div>
                <Button variant="ghost" onClick={removeFile} disabled={isProcessing}><Trash2 size={18} /></Button>
              </div>
            </div>

            {!result ? (
              <div className={styles.card}>
                <div className={styles.options}>
                  <label>Compression Level</label>
                  <div className={styles.compressionLevel}>
                    <button 
                      className={`${styles.levelBtn} ${level === 'basic' ? styles.active : ''}`}
                      onClick={() => setLevel('basic')}
                    >
                      <h5>Basic</h5>
                      <span>Fast/Original Quality</span>
                    </button>
                    <button 
                      className={`${styles.levelBtn} ${level === 'recommended' ? styles.active : ''}`}
                      onClick={() => setLevel('recommended')}
                    >
                      <h5>Recommended</h5>
                      <span>Great Quality/Size ratio</span>
                    </button>
                    <button 
                      className={`${styles.levelBtn} ${level === 'extreme' ? styles.active : ''}`}
                      onClick={() => setLevel('extreme')}
                    >
                      <h5>Extreme</h5>
                      <span>Max Compression</span>
                    </button>
                  </div>
                  <div className={styles.actions}>
                    <Button 
                      variant="primary" 
                      size="lg" 
                      onClick={processCompression} 
                      disabled={isProcessing}
                      isLoading={isProcessing}
                    >
                      Compress Now
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={styles.results}>
                <h3><CheckCircle2 color="var(--accent-green)" size={20} /> Compression Complete!</h3>
                <div className={styles.comparison}>
                  <div className={styles.stat}>
                    <label>Original Size</label>
                    <span>{formatSize(file.size)}</span>
                  </div>
                  <div className={styles.stat}>
                    <label>New Size</label>
                    <span className={styles.reduction}>{formatSize(result.size)}</span>
                  </div>
                </div>
                <div className={styles.stat}>
                  <label>Saved</label>
                  <span className={styles.reduction}>
                    {(((file.size - result.size) / file.size) * 100).toFixed(1)}% Smaller
                  </span>
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
                    <span className={styles.extension}>.pdf</span>
                  </div>
                </div>

                <div className={styles.resultActions}>
                  <Button variant="ghost" onClick={removeFile}>
                    <ArrowLeft size={18} />
                    Start Over
                  </Button>
                  <Button variant="primary" size="lg" onClick={downloadResult}>
                    <Download size={18} />
                    Download PDF
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
