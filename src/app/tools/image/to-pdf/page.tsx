'use client';

import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { 
  FileText, Upload, Download, Trash2, 
  Plus, ImageIcon, FileCheck, ArrowLeft
} from 'lucide-react';
import styles from './ImageToPDF.module.scss';
import { motion, AnimatePresence } from 'framer-motion';

export default function ImageToPDFPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles([...files, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const convertToPDF = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    
    try {
      const pdf = new jsPDF();
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const imageData = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        if (i > 0) pdf.addPage();
        
        const imgProps = pdf.getImageProperties(imageData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        pdf.addImage(imageData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      }

      pdf.save('converted_images.pdf');
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <Link href="/tools/image" className={styles.backBtn}>
            <ArrowLeft size={20} />
          </Link>
          <FileText size={32} className={styles.icon} />
          <div>
            <h1>Image to PDF</h1>
            <p>Convert your photos and scanned images into a professional PDF document.</p>
          </div>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.uploadSection}>
          <div 
            className={styles.dropZone}
            onClick={() => document.getElementById('img-pdf-upload')?.click()}
          >
            <input 
              type="file" 
              id="img-pdf-upload" 
              multiple 
              accept="image/*" 
              onChange={onFileChange} 
              hidden
            />
            <Plus size={48} color="var(--accent-primary)" style={{ marginBottom: 16 }} />
            <h3>Click to Add Images</h3>
            <p>Upload multiple images to merge into a single PDF</p>
          </div>

          <div className={styles.fileGrid}>
            <AnimatePresence>
              {files.map((file, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={styles.fileCard}
                >
                  <img src={URL.createObjectURL(file)} alt="Preview" />
                  <div className={styles.fileMeta}>
                    <span>{file.name.substring(0, 15)}...</span>
                  </div>
                  <button className={styles.removeBtn} onClick={() => removeFile(i)}>
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className={styles.sidebar}>
          <Card className={styles.card}>
            <h3>PDF Settings</h3>
            <div className={styles.statRow}>
              <span>Total Images:</span>
              <span>{files.length}</span>
            </div>
            <div className={styles.statRow}>
              <span>Estimated Size:</span>
              <span>{(files.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(2)} MB</span>
            </div>
            
            <Button 
              variant="primary" 
              size="lg" 
              fullWidth 
              style={{ marginTop: 32 }}
              onClick={convertToPDF}
              disabled={files.length === 0 || isProcessing}
              isLoading={isProcessing}
            >
              <FileCheck size={18} />
              Convert to PDF
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
