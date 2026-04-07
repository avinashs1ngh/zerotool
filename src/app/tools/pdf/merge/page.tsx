'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PDFDocument } from 'pdf-lib';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useFileStore } from '@/store/file-store';
import { FileText, Plus, Trash2, Download, CheckCircle2, ArrowLeft } from 'lucide-react';
import styles from './PDFMerge.module.scss';
import { motion, AnimatePresence } from 'framer-motion';
import { generateUUID } from '@/utils/crypto';

interface PDFFile {
  id: string;
  file: File;
  name: string;
  size: number;
}

export default function PDFMergePage() {
  const droppedFile = useFileStore(s => s.droppedFile);
  const setDroppedFile = useFileStore(s => s.setDroppedFile);
  
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [customName, setCustomName] = useState('merged_document');

  useEffect(() => {
    if (droppedFile && droppedFile.type === 'application/pdf') {
      addFile(droppedFile);
      setDroppedFile(null); // Clear from global store after consuming
    }
  }, [droppedFile, setDroppedFile]);

  const addFile = (file: File) => {
    setFiles(prev => [...prev, {
      id: generateUUID(),
      file,
      name: file.name,
      size: file.size
    }]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach(addFile);
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const mergePDFs = async () => {
    if (files.length < 2) return alert('Add at least 2 PDFs to merge.');
    setIsProcessing(true);

    try {
      const mergedPdf = await PDFDocument.create();

      for (const pdfFile of files) {
        const arrayBuffer = await pdfFile.file.arrayBuffer();
        const loadPdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(loadPdf, loadPdf.getPageIndices());
        copiedPages.forEach((page: any) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes as any], { type: 'application/pdf' });
      setResultBlob(blob);
      setCustomName(`merged_${Date.now()}`);
    } catch (e: any) {
      alert(`Error merging PDFs: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadFinal = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    const finalName = customName.toLowerCase().endsWith('.pdf') ? customName : `${customName}.pdf`;
    a.download = finalName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setResultBlob(null);
    setFiles([]);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <Link href="/tools/pdf" className={styles.backBtn}>
            <ArrowLeft size={24} />
          </Link>
          <FileText size={32} className={styles.icon} />
          <div>
            <h1>Merge PDF</h1>
            <p>Combine multiple PDFs into one. Processing happens securely in your browser.</p>
          </div>
        </div>
      </header>

      <div className={styles.content}>
        <AnimatePresence mode="wait">
          {!resultBlob ? (
            <motion.div 
              key="upload"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className={styles.actionCard}>
                <div className={styles.uploadArea}>
                  <input 
                    type="file" 
                    accept=".pdf" 
                    multiple 
                    onChange={handleFileSelect} 
                    className={styles.fileInput}
                    id="pdf-upload"
                  />
                  <label htmlFor="pdf-upload" className={styles.uploadLabel}>
                    <Plus size={24} />
                    <span>Select PDFs or Drop them anywhere</span>
                  </label>
                </div>

                <div className={styles.fileList}>
                  <AnimatePresence>
                    {files.map((file, index) => (
                      <motion.div 
                        key={file.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className={styles.fileRow}
                      >
                        <span className={styles.orderBadge}>{index + 1}</span>
                        <span className={styles.fileName}>{file.name}</span>
                        <span className={styles.fileSize}>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                        <Button variant="ghost" size="sm" onClick={() => removeFile(file.id)}>
                          <Trash2 size={16} />
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {files.length === 0 && (
                    <div className={styles.emptyState}>No PDFs added yet.</div>
                  )}
                </div>

                <div className={styles.bottomActions}>
                  <Button 
                    variant="primary" 
                    size="lg" 
                    onClick={mergePDFs} 
                    disabled={files.length < 2 || isProcessing}
                    isLoading={isProcessing}
                  >
                    <Download size={18} />
                    Merge PDFs
                  </Button>
                </div>
              </Card>
            </motion.div>
          ) : (
            <motion.div 
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={styles.resultContainer}
            >
              <div className={styles.resultCard}>
                <CheckCircle2 size={48} className={styles.successIcon} />
                <h2>Merge Complete!</h2>
                <p>Your PDFs have been combined into a single document.</p>

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
                  <Button variant="ghost" onClick={reset}>
                    <ArrowLeft size={18} />
                    Start Over
                  </Button>
                  <Button variant="primary" size="lg" onClick={downloadFinal}>
                    <Download size={18} />
                    Download PDF
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
