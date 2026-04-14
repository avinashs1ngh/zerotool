'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Camera, Clock, RotateCw, RotateCcw, X, Check, 
  Trash2, ChevronLeft, Download, ImageIcon, RefreshCw,
  Sparkles, Layers, ArrowUp, ArrowDown, Crop, Maximize, ArrowLeft,
  FileDown, Type, Save
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import Cropper, { Area } from 'react-easy-crop';
import styles from './CamScanner.module.scss';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface ScannedPage {
  id: string;
  original: string; // dataUrl
  edited: string;   // dataUrl with filters/rotation/crop
  filter: string;
  rotation: number; // 0, 90, 180, 270
  crop?: Area;
}

const FILTERS = [
  { id: 'original', label: 'Original', icon: '🖼️', css: '' },
  { id: 'magic', label: 'Magic', icon: '✨', css: 'contrast(1.4) saturate(1.3) brightness(1.05)' },
  { id: 'bw', label: 'B&W', icon: '📄', css: 'contrast(200%) grayscale(100%)' },
  { id: 'grayscale', label: 'Gray', icon: '⬛', css: 'grayscale(100%)' },
  { id: 'vivid', label: 'Vivid', icon: '🎨', css: 'saturate(2) contrast(1.2)' },
  { id: 'stamp', label: 'Stamp', icon: '🔵', css: 'grayscale(1) contrast(3) brightness(1.15)' },
];

export default function CamScannerClient() {
  // ─── App States ──────────────────────────────────────────────
  const [view, setView] = useState<'camera' | 'review'>('camera');
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Camera States ───────────────────────────────────────────
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [isAutoCapture, setIsAutoCapture] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ─── Editor States ───────────────────────────────────────────
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editFilter, setEditFilter] = useState('original');
  const [editRotate, setEditRotate] = useState(0);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isEditingCrop, setIsEditingCrop] = useState(false);

  // ─── Export States ───────────────────────────────────────────
  const [isExporting, setIsExporting] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [exportName, setExportName] = useState(`scan_${new Date().toLocaleDateString().replace(/\//g, '-')}`);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'zip'>('pdf');

  // ══════════════════════════════════════════════
  // Camera Engine
  // ══════════════════════════════════════════════
  const startCamera = async () => {
    setError(null);
    try {
      // Safety Guard: Check if mediaDevices exists (missing in insecure contexts/older browsers)
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (!window.isSecureContext) {
          throw new Error('INSECURE_CONTEXT');
        }
        throw new Error('MEDIA_DEVICES_UNSUPPORTED');
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
// ... (rest of the logic remains similar but inside the guarded block)
      const constraints = {
        video: {
          facingMode: isFrontCamera ? 'user' : 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (e) {
        console.warn('Initial camera constraints failed, trying fallback...', e);
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: isFrontCamera ? 'user' : 'environment' },
          audio: false
        });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.error('Video play failed:', playErr);
        }
      }
      setError(null);
    } catch (err: any) {
      console.error('Camera error:', err);
      
      if (err.message === 'INSECURE_CONTEXT') {
        setError('Camera access requires a secure connection (HTTPS or localhost). You are currently browsing via an insecure network IP.');
      } else if (err.message === 'MEDIA_DEVICES_UNSUPPORTED') {
        setError('Your browser does not support camera access or it is disabled.');
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission denied. Please allow camera access in your browser settings and refresh.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError('Could not access camera. Please check permissions and refresh.');
      }
    }
  };

  useEffect(() => {
    if (view === 'camera') startCamera();
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [view, isFrontCamera]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || isCapturing) return;
    
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (isFrontCamera) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    
    const newPage: ScannedPage = {
      id: Date.now().toString(),
      original: dataUrl,
      edited: dataUrl,
      filter: 'original',
      rotation: 0
    };

    setPages(prev => [...prev, newPage]);
    setIsCapturing(true);
    setTimeout(() => setIsCapturing(false), 200);
  }, [isFrontCamera, isCapturing]);

  useEffect(() => {
    let timer: any;
    if (isAutoCapture && view === 'camera' && !isCapturing) {
      setCountdown(3);
      timer = setInterval(() => {
        setCountdown(prev => {
          if (prev === 1) {
            capturePhoto();
            return 3;
          }
          return prev !== null ? prev - 1 : 3;
        });
      }, 1000);
    } else {
      setCountdown(null);
    }
    return () => clearInterval(timer);
  }, [isAutoCapture, view, capturePhoto, isCapturing]);

  // ══════════════════════════════════════════════
  // Edit & Apply Logic
  // ══════════════════════════════════════════════
  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area | null,
    rotation: number,
    filter: string
  ): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return imageSrc;

    // Set canvas to the cropped size if pixelCrop exists, otherwise use image size
    canvas.width = pixelCrop ? pixelCrop.width : image.width;
    canvas.height = pixelCrop ? pixelCrop.height : image.height;

    // Use a temp canvas for rotation if needed
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    const isRotated = rotation === 90 || rotation === 270;
    tempCanvas.width = isRotated ? image.height : image.width;
    tempCanvas.height = isRotated ? image.width : image.height;

    if (tempCtx) {
      tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
      tempCtx.rotate((rotation * Math.PI) / 180);
      tempCtx.drawImage(image, -image.width / 2, -image.height / 2);

      // Now draw the rotated/unrotated image to the final canvas with the crop offset
      if (pixelCrop) {
        ctx.drawImage(
          tempCanvas,
          pixelCrop.x,
          pixelCrop.y,
          pixelCrop.width,
          pixelCrop.height,
          0,
          0,
          pixelCrop.width,
          pixelCrop.height
        );
      } else {
        ctx.drawImage(tempCanvas, 0, 0);
      }

      // Apply Filter (Pixel manipulation)
      if (filter !== 'original') {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imageData.data;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i], g = d[i + 1], b = d[i + 2];
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;

          if (filter === 'grayscale') {
            d[i] = d[i + 1] = d[i + 2] = gray;
          } else if (filter === 'bw') {
            const bw = gray > 160 ? 255 : gray > 80 ? gray * 0.5 : 0;
            d[i] = d[i + 1] = d[i + 2] = bw;
          } else if (filter === 'magic') {
            d[i]     = Math.min(255, r * 1.1 + 15);
            d[i + 1] = Math.min(255, g * 1.1 + 15);
            d[i + 2] = Math.min(255, b * 1.0);
          } else if (filter === 'vivid') {
            const avg = (r + g + b) / 3;
            d[i]     = Math.min(255, avg + (r - avg) * 2);
            d[i + 1] = Math.min(255, avg + (g - avg) * 2);
            d[i + 2] = Math.min(255, avg + (b - avg) * 2);
          } else if (filter === 'stamp') {
            const bw2 = gray > 140 ? 255 : 0;
            d[i] = d[i + 1] = d[i + 2] = bw2;
          }
        }
        ctx.putImageData(imageData, 0, 0);
      }
    }

    return canvas.toDataURL('image/jpeg', 0.9);
  };

  const openEditor = (idx: number) => {
    const page = pages[idx];
    setEditFilter(page.filter);
    setEditRotate(page.rotation);
    setEditingIndex(idx);
    setIsEditingCrop(false);
  };

  const saveEdit = async () => {
    if (editingIndex === null) return;
    setIsExporting(true);
    const page = pages[editingIndex];
    const newEditedUrl = await getCroppedImg(page.original, croppedAreaPixels, editRotate, editFilter);
    
    setPages(prev => prev.map((p, i) => 
      i === editingIndex 
        ? { ...p, filter: editFilter, rotation: editRotate, edited: newEditedUrl, crop: croppedAreaPixels || undefined }
        : p
    ));
    setEditingIndex(null);
    setIsExporting(false);
  };

  // ══════════════════════════════════════════════
  // Export Functions
  // ══════════════════════════════════════════════
  const handleExport = async () => {
    if (pages.length === 0) return;
    setIsExporting(true);
    try {
      if (exportFormat === 'pdf') {
        const pdfDoc = await PDFDocument.create();
        for (const page of pages) {
          const imgBytes = await fetch(page.edited).then(res => res.arrayBuffer());
          const pdfImg = await pdfDoc.embedJpg(imgBytes);
          const pdfPage = pdfDoc.addPage([pdfImg.width, pdfImg.height]);
          pdfPage.drawImage(pdfImg, { x: 0, y: 0, width: pdfImg.width, height: pdfImg.height });
        }
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${exportName || 'scan'}.pdf`;
        link.click();
      } else {
        const zip = new JSZip();
        for (let i = 0; i < pages.length; i++) {
          const base64 = pages[i].edited.split(',')[1];
          zip.file(`scan_page_${i + 1}.jpg`, base64, { base64: true });
        }
        const blob = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${exportName || 'scanned_images'}.zip`;
        link.click();
      }
      setShowDownloadModal(false);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // ══════════════════════════════════════════════
  // UI Render
  // ══════════════════════════════════════════════
  
  if (view === 'camera') {
    return (
      <div className={styles.container}>
        {countdown !== null && <div className={styles.countdown}>{countdown}</div>}
        <div className={styles.cameraWrap}>
          {error ? (
            <div className={styles.errorOverlay}>
              <div className={styles.errorIcon}>
                <Camera size={48} color="#ef4444" />
              </div>
              <h3>Camera Access Failed</h3>
              <p className={styles.errorMsg}>{error}</p>
              
              {error.includes('secure connection') && (
                <div className={styles.tipBox}>
                  <h4>💡 Pro Tip for Developers:</h4>
                  <p>To test on a local network without HTTPS, go to <code>chrome://flags/#unsafely-treat-insecure-origin-as-secure</code> and add <code>{window.location.origin}</code> to the list.</p>
                </div>
              )}

              <Button 
                variant="primary" 
                onClick={startCamera} 
                className={styles.retryBtn}
              >
                <RotateCcw size={18} /> Retry Connection
              </Button>
            </div>
          ) : (
            <>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className={`${styles.videoFeed} ${isFrontCamera ? styles.mirrored : ''}`} 
              />
              <div className={styles.cameraOverlay}>
                <div className={styles.guideFrame} />
              </div>
            </>
          )}
        </div>
        <Link href="/tools/pdf" className={styles.backBtnFixed}>
          <ArrowLeft size={20} />
        </Link>

        <div className={styles.topBar}>
          <div style={{ flex: 1 }} />
          <div className={styles.pageCountMinimal}>{pages.length} Pages</div>
          <button 
            className={`${styles.iconBtn} ${isAutoCapture ? styles.active : ''}`} 
            onClick={() => setIsAutoCapture(!isAutoCapture)}
            title="Auto Capture"
          >
            <Clock size={20} />
          </button>
        </div>

        <div className={styles.bottomControls}>
          <div className={styles.thumbnailStrip}>
            {pages.map((p, i) => (
              <div key={p.id} className={styles.thumbItem}>
                <img src={p.edited} alt="Thumb" />
                <button className={styles.removeThumb} onClick={() => setPages(prev => prev.filter(pg => pg.id !== p.id))}><X size={10} /></button>
              </div>
            ))}
          </div>
          <div className={styles.captureRow}>
            <button className={styles.iconBtn} onClick={() => setIsFrontCamera(!isFrontCamera)}>
              <RotateCw size={24} />
            </button>
            <button 
              className={`${styles.captureBtn} ${(isCapturing || !!error) ? styles.disabled : ''}`} 
              onClick={capturePhoto}
              disabled={!!error}
            >
              <div className={styles.inner} />
            </button>
            <button className={styles.checkmarkBtn} onClick={() => setView('review')}>
              <Check size={28} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.reviewView}>
      <div className={styles.reviewHeader}>
        <Link href="/tools/pdf" className={styles.backBtn}>
          <ArrowLeft size={20} />
        </Link>
        <button className={styles.iconBtn} onClick={() => setView('camera')}><ChevronLeft size={24} /></button>
        <h2>Review Documents</h2>
        <div style={{ width: 44 }} />
      </div>

      {pages.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <Layers size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <p>No pages captured yet. Start scanning to begin.</p>
          <Button variant="primary" onClick={() => setView('camera')}>Open Camera</Button>
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            {pages.map((p, i) => (
              <div key={p.id} className={styles.pageCard}>
                <div className={styles.cardImgWrap}><img src={p.edited} alt={`Page ${i + 1}`} /></div>
                <div className={styles.cardActions}>
                  <span className={styles.pageLabel}>PAGE {i + 1}</span>
                  <div className={styles.cardBtns}>
                    <button className={styles.smallBtn} onClick={() => openEditor(i)}><Sparkles size={14} /></button>
                    <button className={styles.smallBtn} onClick={() => {
                        if (i > 0) {
                          const n = [...pages]; [n[i-1], n[i]] = [n[i], n[i-1]]; setPages(n);
                        }
                      }} disabled={i === 0}><ArrowUp size={14} /></button>
                    <button className={`${styles.smallBtn} ${styles.danger}`} onClick={() => setPages(prev => prev.filter(pg => pg.id !== p.id))}><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.actions}>
            <Button variant="primary" size="lg" fullWidth onClick={() => setShowDownloadModal(true)}>
              <Download size={18} /> Download All
            </Button>
            <Button variant="ghost" fullWidth onClick={() => setView('camera')}>
              <Camera size={18} /> Add More Pages
            </Button>
          </div>
        </>
      )}

      {/* ── Download Modal ── */}
      <AnimatePresence>
        {showDownloadModal && (
          <div className={styles.modalOverlay} onClick={() => setShowDownloadModal(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={styles.modal} 
              onClick={e => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h3>Export Document</h3>
                <button className={styles.iconBtn} onClick={() => setShowDownloadModal(false)}><X size={18} /></button>
              </div>
              
              <div className={styles.modalBody}>
                <div className={styles.inputField}>
                  <label>File Name</label>
                  <div className={styles.inputWrap}>
                    <Type size={16} className={styles.inputIcon} />
                    <input 
                      type="text" 
                      value={exportName} 
                      onChange={e => setExportName(e.target.value)}
                      placeholder="Enter filename..."
                    />
                  </div>
                </div>

                <div className={styles.inputField}>
                  <label>Save As</label>
                  <div className={styles.formatToggle}>
                    <button 
                      className={exportFormat === 'pdf' ? styles.active : ''} 
                      onClick={() => setExportFormat('pdf')}
                    >
                      PDF Document
                    </button>
                    <button 
                      className={exportFormat === 'zip' ? styles.active : ''} 
                      onClick={() => setExportFormat('zip')}
                    >
                      Images (ZIP)
                    </button>
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <Button 
                  variant="primary" 
                  fullWidth 
                  size="lg" 
                  onClick={handleExport} 
                  isLoading={isExporting}
                >
                  <Save size={18} /> Finish & Download
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingIndex !== null && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className={styles.editOverlay}>
            <div className={styles.editHeader}>
              <h3>Edit Document Page {editingIndex + 1}</h3>
              <button className={styles.iconBtn} onClick={() => setEditingIndex(null)}><X size={20} /></button>
            </div>
            <div className={styles.editContent}>
              <div style={{ width: '100%', height: '50vh', position: 'relative', background: '#333', borderRadius: 12 }}>
                {isEditingCrop ? (
                  <Cropper
                    image={pages[editingIndex].original}
                    crop={crop}
                    zoom={zoom}
                    rotation={editRotate}
                    aspect={undefined}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={(_, px) => setCroppedAreaPixels(px)}
                  />
                ) : (
                  <img 
                    src={pages[editingIndex].original} 
                    className={styles.editImgPreview} 
                    style={{ filter: FILTERS.find(f => f.id === editFilter)?.css, transform: `rotate(${editRotate}deg)` }} 
                  />
                )}
              </div>
              
              <div className={styles.editTools}>
                <div className={styles.toolSection}>
                  <p>Tools</p>
                  <div className={styles.toolGrid}>
                    <button className={`${styles.filterBtn} ${isEditingCrop ? styles.active : ''}`} onClick={() => setIsEditingCrop(!isEditingCrop)}>
                      <Crop size={16} /> Crop
                    </button>
                    <button className={styles.filterBtn} onClick={() => setEditRotate((editRotate + 90) % 360)}>
                      <RotateCcw size={16} /> Rotate
                    </button>
                  </div>
                </div>

                {!isEditingCrop && (
                  <div className={styles.toolSection}>
                    <p>Filters</p>
                    <div className={styles.toolGrid}>
                      {FILTERS.map(f => (
                        <button key={f.id} className={`${styles.filterBtn} ${editFilter === f.id ? styles.active : ''}`} onClick={() => setEditFilter(f.id)}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <Button variant="primary" fullWidth onClick={saveEdit} isLoading={isExporting}>Apply All Changes</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
