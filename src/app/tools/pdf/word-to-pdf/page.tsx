'use client';

import React, { useState } from 'react';
import mammoth from 'mammoth';
import { jsPDF } from 'jspdf';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { 
  FileText, Upload, Download, Trash2, 
  FileCheck, AlertCircle 
} from 'lucide-react';
import styles from './WordToPDF.module.scss';
import { motion } from 'framer-motion';

export default function WordToPDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const convertToPDF = async () => {
    if (!file) return;
    setIsProcessing(true);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      // Extract text/html using mammoth
      const { value: text } = await mammoth.extractRawText({ arrayBuffer });
      
      const pdf = new jsPDF();
      const margin = 15;
      const width = pdf.internal.pageSize.getWidth() - margin * 2;
      
      // Split text into lines that fit the PDF width
      const lines = pdf.splitTextToSize(text, width);
      pdf.text(lines, margin, 20);
      
      const blob = pdf.output('blob');
      setResult(URL.createObjectURL(blob));
    } catch (e) {
      console.error(e);
      alert('Conversion failed. Please ensure it is a valid .docx file.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles.container}>
       <header className={styles.header}>
        <div className={styles.titleArea}>
          <FileText size={32} className={styles.icon} />
          <div>
            <h1>Word to PDF</h1>
            <p>Convert Docx files to PDF securely and offline.</p>
          </div>
        </div>
      </header>

      <div className={styles.content}>
        {!file ? (
          <div 
            className={styles.uploadArea}
            onClick={() => document.getElementById('word-pdf-upload')?.click()}
          >
            <input 
              type="file" 
              id="word-pdf-upload" 
              accept=".docx" 
              onChange={onFileChange} 
              hidden
            />
            <Upload size={48} color="var(--accent-primary)" style={{ marginBottom: 16 }} />
            <h3>Select Word Document</h3>
            <p>Supports (.docx) format only</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className={styles.fileCard}>
              <div className={styles.fileInfo}>
                <FileText size={32} color="var(--accent-primary)" />
                <div>
                  <h4>{file.name}</h4>
                  <span>{(file.size / 1024).toFixed(1)} KB</span>
                </div>
              </div>
              <Button variant="ghost" onClick={() => {setFile(null); setResult(null);}}>
                <Trash2 size={18} />
              </Button>
            </Card>

            {!result ? (
              <Button 
                variant="primary" 
                size="lg" 
                fullWidth 
                style={{ marginTop: 24 }}
                onClick={convertToPDF}
                isLoading={isProcessing}
              >
                <FileCheck size={18} />
                Convert to PDF Now
              </Button>
            ) : (
              <div className={styles.resultActions}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, color: 'var(--accent-green)' }}>
                  <FileCheck size={24} />
                  <h3 style={{ margin: 0 }}>Conversion Successful!</h3>
                </div>
                <Button variant="primary" size="lg" onClick={() => {
                  const a = document.createElement('a');
                  a.href = result; a.download = file.name.replace('.docx', '.pdf'); a.click();
                }}>
                  <Download size={18} />
                  Download PDF
                </Button>
                <Button variant="ghost" onClick={() => {setFile(null); setResult(null);}}>
                  Convert Another
                </Button>
              </div>
            )}
          </motion.div>
        )}

        <div className={styles.infoBox}>
           <AlertCircle size={20} />
           <p>Note: This tool extracts text and basic formatting. Complex layouts, tables, and images from Word might not be fully preserved in this offline version.</p>
        </div>
      </div>
    </div>
  );
}
