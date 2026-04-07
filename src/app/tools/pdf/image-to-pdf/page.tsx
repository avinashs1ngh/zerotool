'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PDFDocument } from 'pdf-lib';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useFileStore } from '@/store/file-store';
import { ImageIcon, FilePlus, Download, Trash2, Plus, Info, X, CheckCircle2, ArrowLeft } from 'lucide-react';
import styles from './ImageToPDF.module.scss';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { generateUUID } from '@/utils/crypto';

interface ImageFile {
  id: string;
  file: File;
  preview: string;
  name: string;
}

export default function ImageToPDFPage() {
  const droppedFile = useFileStore(s => s.droppedFile);
  const setDroppedFile = useFileStore(s => s.setDroppedFile);
  
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [customName, setCustomName] = useState('images_to_pdf');

  useEffect(() => {
    if (droppedFile && (droppedFile.type === 'image/jpeg' || droppedFile.type === 'image/png')) {
      addImage(droppedFile);
      setDroppedFile(null);
    }
  }, [droppedFile]);

  const addImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setImages(prev => [...prev, {
        id: generateUUID(),
        file,
        preview: e.target?.result as string,
        name: file.name
      }]);
    };
    reader.readAsDataURL(file);
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach(addImage);
    }
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const convertToPDF = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);

    try {
      const pdf = await PDFDocument.create();

      for (const imgFile of images) {
        const buffer = await imgFile.file.arrayBuffer();
        let embeddedImg;
        
        if (imgFile.file.type === 'image/png') {
          embeddedImg = await pdf.embedPng(buffer);
        } else {
          embeddedImg = await pdf.embedJpg(buffer);
        }

        const { width, height } = embeddedImg.scale(1);
        const page = pdf.addPage([width, height]);
        page.drawImage(embeddedImg, {
          x: 0,
          y: 0,
          width,
          height,
        });
      }

      const bytes = await pdf.save();
      const blob = new Blob([bytes as any], { type: 'application/pdf' });
      setResultBlob(blob);
      setCustomName(`images_to_pdf_${Date.now()}`);
    } catch (e: any) {
      alert(`Conversion failed: ${e.message}`);
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
    setImages([]);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <Link href="/tools/pdf" className={styles.backBtn}>
            <ArrowLeft size={24} />
          </Link>
          <ImageIcon size={32} className={styles.icon} />
          <div>
            <h1>Image to PDF</h1>
            <p>Convert multiple JPG and PNG images into a single PDF document.</p>
          </div>
        </div>
      </header>

      <div className={styles.content}>
        <AnimatePresence mode="wait">
          {!resultBlob ? (
            <motion.div 
              key="setup"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.activeArea}
            >
              {images.length === 0 ? (
                <div className={styles.uploadArea}>
                  <input type="file" accept="image/jpeg,image/png" multiple onChange={onFileSelect} className={styles.fileInput} id="img-upload" />
                  <label htmlFor="img-upload" className={styles.uploadLabel}>
                    <Plus size={48} color="var(--accent-green)" />
                    <span>Select Images</span>
                    <p>Supports JPG and PNG. All processing is 100% offline.</p>
                  </label>
                </div>
              ) : (
                <>
                  <div className={styles.imageGrid}>
                    <AnimatePresence>
                      {images.map((img, index) => (
                        <motion.div 
                          key={img.id} 
                          className={styles.imageItem}
                          layout
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                        >
                          <img src={img.preview} alt={img.name} />
                          <button className={styles.removeBtn} onClick={() => removeImage(img.id)}><X size={14}/></button>
                          <div className={styles.order}>{index + 1}</div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
                    <div className={styles.addMore}>
                      <input type="file" accept="image/jpeg,image/png" multiple onChange={onFileSelect} className={styles.fileInput} id="img-add-more" />
                      <Plus size={24} />
                    </div>
                  </div>

                  <div className={styles.optionsBar}>
                    <div className={styles.hint}>
                      <Info size={16} />
                      <span>Images will appear in the order selected.</span>
                    </div>
                    <Button 
                      variant="primary" 
                      size="lg" 
                      onClick={convertToPDF} 
                      disabled={isProcessing}
                      isLoading={isProcessing}
                    >
                      <Download size={18} />
                      Convert to PDF
                    </Button>
                  </div>
                </>
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
                <h2>Conversion Complete!</h2>
                <p>Your images have been converted to a PDF document.</p>

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
