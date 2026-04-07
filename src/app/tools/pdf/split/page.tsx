'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useFileStore } from '@/store/file-store';
import { Scissors, FileText, Download, Trash2, Plus, Info, CheckCircle2, ArrowLeft } from 'lucide-react';
import { generateUUID } from '@/utils/crypto';
import styles from './SplitPDF.module.scss';
import { motion, AnimatePresence } from 'framer-motion';

type SplitMode = 'range' | 'all';

export default function SplitPDFPage() {
  const droppedFile = useFileStore(s => s.droppedFile);
  const setDroppedFile = useFileStore(s => s.setDroppedFile);
  
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [splitMode, setSplitMode] = useState<SplitMode>('range');
  const [range, setRange] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [result, setResult] = useState<{ blob: Blob; mode: SplitMode } | null>(null);
  const [customName, setCustomName] = useState('');

  useEffect(() => {
    if (droppedFile && droppedFile.type === 'application/pdf') {
      handleFile(droppedFile);
      setDroppedFile(null);
    }
  }, [droppedFile]);

  const handleFile = async (selectedFile: File) => {
    setFile(selectedFile);
    try {
      const buffer = await selectedFile.arrayBuffer();
      const pdf = await PDFDocument.load(buffer);
      setPageCount(pdf.getPageCount());
      if (splitMode === 'range') {
        setRange(`1-${pdf.getPageCount()}`);
      }
    } catch (e) {
      console.error('Error loading PDF:', e);
      alert('Could not load the PDF. It might be corrupted or password-protected.');
    }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) handleFile(selected);
  };

  const removeFile = () => {
    setFile(null);
    setPageCount(0);
    setRange('');
  };

  const parseRange = (rangeStr: string, maxPages: number): number[] => {
    const pages = new Set<number>();
    const parts = rangeStr.split(',').map(p => p.trim());

    parts.forEach(part => {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = Math.max(1, start); i <= Math.min(end, maxPages); i++) {
            pages.add(i - 1);
          }
        }
      } else {
        const num = Number(part);
        if (!isNaN(num) && num >= 1 && num <= maxPages) {
          pages.add(num - 1);
        }
      }
    });

    return Array.from(pages).sort((a, b) => a - b);
  };

  const processSplit = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      const buffer = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(buffer);

      if (splitMode === 'range') {
        const indices = parseRange(range, pageCount);
        if (indices.length === 0) throw new Error('No valid pages selected.');

        const newDoc = await PDFDocument.create();
        const pages = await newDoc.copyPages(srcDoc, indices);
        pages.forEach(p => newDoc.addPage(p));

        const bytes = await newDoc.save();
        const blob = new Blob([bytes as any], { type: 'application/pdf' });
        setResult({ blob, mode: 'range' });
        setCustomName(`${file.name.replace('.pdf', '')}_extracted`);
      } else {
        // Split All cleanup
        const zip = new JSZip();
        for (let i = 0; i < pageCount; i++) {
          const newDoc = await PDFDocument.create();
          const [page] = await newDoc.copyPages(srcDoc, [i]);
          newDoc.addPage(page);
          const bytes = await newDoc.save();
          zip.file(`page_${i + 1}.pdf`, bytes);
        }
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        setResult({ blob: zipBlob, mode: 'all' });
        setCustomName(`${file.name.replace('.pdf', '')}_split_all`);
      }
    } catch (e: any) {
      alert(`Split failed: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadFinal = () => {
    if (!result || !file) return;
    const extension = result.mode === 'range' ? '.pdf' : '.zip';
    const finalName = customName.toLowerCase().endsWith(extension) ? customName : `${customName}${extension}`;
    
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = finalName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setResult(null);
    setFile(null);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <Link href="/tools/pdf" className={styles.backBtn}>
            <ArrowLeft size={24} />
          </Link>
          <Scissors size={32} className={styles.icon} />
          <div>
            <h1>Split PDF</h1>
            <p>Extract specific pages or split every page into separate PDFs.</p>
          </div>
        </div>
      </header>

      <div className={styles.content}>
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div 
              key="setup"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {!file ? (
                <div className={styles.uploadArea}>
                  <input type="file" accept=".pdf" onChange={onFileSelect} className={styles.fileInput} id="split-upload" />
                  <label htmlFor="split-upload" className={styles.uploadLabel}>
                    <Plus size={24} color="var(--accent-purple)" />
                    <span>Click or Drop your PDF here</span>
                  </label>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={styles.activeArea}>
                  <div className={styles.fileInfoCard}>
                    <div className={styles.fileMeta}>
                      <FileText className={styles.fileIcon} size={24} />
                      <div className={styles.details}>
                        <h4>{file.name}</h4>
                        <span>{(file.size / 1024 / 1024).toFixed(2)} MB • {pageCount} Pages</span>
                      </div>
                    </div>
                    <Button variant="ghost" onClick={removeFile}><Trash2 size={18} /></Button>
                  </div>

                  <div className={styles.optionsSection}>
                    <div className={styles.optionGroup}>
                      <label>Split Mode</label>
                      <div className={styles.modeToggle}>
                        <button 
                          className={`${styles.modeBtn} ${splitMode === 'range' ? styles.active : ''}`}
                          onClick={() => setSplitMode('range')}
                        >
                          Extract Range
                        </button>
                        <button 
                          className={`${styles.modeBtn} ${splitMode === 'all' ? styles.active : ''}`}
                          onClick={() => setSplitMode('all')}
                        >
                          Split All Pages
                        </button>
                      </div>
                    </div>

                    {splitMode === 'range' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className={styles.optionGroup}>
                        <label htmlFor="range-input">Enter Page Range</label>
                        <input 
                          id="range-input"
                          type="text" 
                          value={range} 
                          onChange={e => setRange(e.target.value)}
                          placeholder="e.g. 1-3, 5, 8"
                          className={styles.rangeInput}
                        />
                        <div className={styles.inputHint}>
                          <Info size={12} />
                          <span>Use commas for multiple pages and hyphens for ranges. Total: {pageCount} pages.</span>
                        </div>
                      </motion.div>
                    )}

                    <div className={styles.actions}>
                      <Button 
                        variant="primary" 
                        size="lg" 
                        onClick={processSplit} 
                        disabled={isProcessing}
                        isLoading={isProcessing}
                      >
                        <Download size={18} />
                        {splitMode === 'range' ? 'Extract Pages' : 'Split All Pages'}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={styles.resultContainer}
            >
              <div className={styles.resultCard}>
                <CheckCircle2 size={48} className={styles.successIcon} />
                <h2>Split Ready!</h2>
                <p>
                  {result.mode === 'range' 
                    ? 'Extracted pages are ready for download.' 
                    : `Split into ${pageCount} separate PDF files.`}
                </p>

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
                    <span className={styles.extension}>
                      {result.mode === 'range' ? '.pdf' : '.zip'}
                    </span>
                  </div>
                </div>

                <div className={styles.resultActions}>
                  <Button variant="ghost" onClick={reset}>
                    <ArrowLeft size={18} />
                    Start Over
                  </Button>
                  <Button variant="primary" size="lg" onClick={downloadFinal}>
                    <Download size={18} />
                    Download {result.mode === 'range' ? 'PDF' : 'ZIP'}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
