'use client';

import React, { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import {
  Camera, Upload, Download, RotateCcw,
  CheckCircle2, Loader2, X, Image as ImageIcon,
  FileText, Sparkles, ArrowLeft
} from 'lucide-react';
import styles from './DocScanner.module.scss';
import { motion, AnimatePresence } from 'framer-motion';

const FILTERS = [
  {
    id: 'original',
    label: 'Original',
    desc: 'As captured',
    icon: '🖼️',
    css: '',
  },
  {
    id: 'grayscale',
    label: 'Grayscale',
    desc: 'Black & white photo',
    icon: '⬛',
    css: 'grayscale(100%)',
  },
  {
    id: 'bw',
    label: 'Black & White',
    desc: 'High contrast text',
    icon: '📄',
    css: 'contrast(200%) grayscale(100%)',
  },
  {
    id: 'magic',
    label: 'Magic Color',
    desc: 'Enhanced clarity',
    icon: '✨',
    css: 'contrast(140%) saturate(130%) brightness(105%)',
  },
  {
    id: 'vivid',
    label: 'Vivid',
    desc: 'Bright & sharp',
    icon: '🎨',
    css: 'saturate(200%) contrast(120%)',
  },
  {
    id: 'stamp',
    label: 'Stamp',
    desc: 'Like a stamp copy',
    icon: '🔵',
    css: 'grayscale(100%) contrast(300%) brightness(115%)',
  },
];

export default function DocScannerPage() {
  const [image, setImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('original');
  const [result, setResult] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setFileName(file.name);
    setActiveFilter('original');
    setResult(null);
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) loadFile(e.target.files[0]);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) loadFile(e.dataTransfer.files[0]);
  };

  const applyFilterToCanvas = useCallback((
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    filterId: string
  ) => {
    ctx.drawImage(img, 0, 0);
    const { width, height } = img;

    if (filterId === 'original') return;

    const imageData = ctx.getImageData(0, 0, width, height);
    const d = imageData.data;

    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;

      if (filterId === 'grayscale') {
        d[i] = d[i + 1] = d[i + 2] = gray;
      } else if (filterId === 'bw') {
        const bw = gray > 160 ? 255 : gray > 80 ? gray * 0.5 : 0;
        d[i] = d[i + 1] = d[i + 2] = bw;
      } else if (filterId === 'magic') {
        d[i]     = Math.min(255, r * 1.1 + 15);
        d[i + 1] = Math.min(255, g * 1.1 + 15);
        d[i + 2] = Math.min(255, b * 1.0);
      } else if (filterId === 'vivid') {
        const avg = (r + g + b) / 3;
        d[i]     = Math.min(255, avg + (r - avg) * 2);
        d[i + 1] = Math.min(255, avg + (g - avg) * 2);
        d[i + 2] = Math.min(255, avg + (b - avg) * 2);
      } else if (filterId === 'stamp') {
        const bw2 = gray > 140 ? 255 : 0;
        d[i] = d[i + 1] = d[i + 2] = bw2;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }, []);

  const generateScan = async () => {
    if (!image) return;
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 200)); // allow UI to update

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if (ctx) applyFilterToCanvas(ctx, img, activeFilter);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      setResult(dataUrl);
      setIsProcessing(false);
    };
    img.src = image;
  };

  const downloadResult = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result;
    const baseName = fileName.replace(/\.[^/.]+$/, '') || 'scan';
    a.download = `${baseName}_${activeFilter}.jpg`;
    a.click();
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    setFileName('');
    setActiveFilter('original');
  };

  const activeFilterObj = FILTERS.find(f => f.id === activeFilter)!;

  return (
    <div className={styles.container}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <Link href="/tools/pdf" className={styles.backBtn}>
            <ArrowLeft size={20} />
          </Link>
          <div className={styles.iconWrap}>
            <Camera size={24} />
          </div>
          <div>
            <h1>Document Scanner</h1>
            <p>Upload a photo and apply professional scan filters — all offline.</p>
          </div>
        </div>
        {image && (
          <button className={styles.resetBtn} onClick={reset}>
            <X size={16} /> Start Over
          </button>
        )}
      </header>

      <AnimatePresence mode="wait">

        {/* ── Upload State ── */}
        {!image && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className={`${styles.uploadArea} ${isDragging ? styles.dragging : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={onFileChange}
            />
            <div className={styles.uploadIcon}>
              <Upload size={32} color="var(--accent-primary)" />
            </div>
            <h3>Click or Drop an Image</h3>
            <p>JPG, PNG, WEBP · Up to 20 MB</p>
            <div className={styles.uploadHints}>
              <span className={styles.hint}><ImageIcon size={14} /> Photo</span>
              <span className={styles.hint}><FileText size={14} /> Document</span>
              <span className={styles.hint}><Camera size={14} /> Camera</span>
            </div>
          </motion.div>
        )}

        {/* ── Editor State ── */}
        {image && !result && (
          <motion.div
            key="editor"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={styles.editorLayout}
          >
            {/* Preview Panel */}
            <div className={styles.previewPanel}>
              <div className={styles.previewLabel}>
                <ImageIcon size={14} />
                <span>Preview</span>
                {fileName && <span className={styles.fileName}>{fileName}</span>}
              </div>
              <div className={styles.imageWrap}>
                <img
                  src={image}
                  alt="Document to scan"
                  className={styles.previewImg}
                  style={{ filter: activeFilterObj.css }}
                />
                <div className={styles.filterBadge}>
                  <Sparkles size={12} />
                  {activeFilterObj.label}
                </div>
              </div>
            </div>

            {/* Controls Panel */}
            <div className={styles.controlsPanel}>
              <div className={styles.section}>
                <p className={styles.sectionLabel}>Choose Filter</p>
                <div className={styles.filtersGrid}>
                  {FILTERS.map(f => (
                    <button
                      key={f.id}
                      className={`${styles.filterCard} ${activeFilter === f.id ? styles.filterActive : ''}`}
                      onClick={() => setActiveFilter(f.id)}
                    >
                      <div className={styles.filterPreviewWrap}>
                        <img
                          src={image}
                          alt={f.label}
                          className={styles.filterThumb}
                          style={{ filter: f.css }}
                        />
                        {activeFilter === f.id && (
                          <div className={styles.filterCheck}>
                            <CheckCircle2 size={16} />
                          </div>
                        )}
                      </div>
                      <div className={styles.filterInfo}>
                        <span className={styles.filterName}>{f.icon} {f.label}</span>
                        <span className={styles.filterDesc}>{f.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.actionGroup}>
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={generateScan}
                  isLoading={isProcessing}
                >
                  {isProcessing ? (
                    <><Loader2 size={18} className={styles.spin} /> Processing…</>
                  ) : (
                    <><Sparkles size={18} /> Apply & Scan</>
                  )}
                </Button>
                <Button variant="ghost" fullWidth onClick={reset}>
                  <X size={16} /> Discard
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Result State ── */}
        {result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className={styles.resultLayout}
          >
            <div className={styles.resultBadge}>
              <CheckCircle2 size={20} color="var(--accent-green)" />
              <span>Scan Complete — {activeFilterObj.icon} {activeFilterObj.label} Filter Applied</span>
            </div>

            <div className={styles.resultImageWrap}>
              <img src={result} alt="Scanned document" className={styles.resultImg} />
            </div>

            <div className={styles.resultActions}>
              <Button variant="primary" size="lg" onClick={downloadResult}>
                <Download size={18} /> Download Scan
              </Button>
              <Button variant="secondary" onClick={() => setResult(null)}>
                <RotateCcw size={18} /> Try Different Filter
              </Button>
              <Button variant="ghost" onClick={reset}>
                <X size={16} /> Scan New Document
              </Button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
