'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Camera, Clock, RotateCw, RotateCcw, X, Check,
  Trash2, ChevronLeft, Download, RefreshCw,
  Sparkles, ArrowUp, Crop, ArrowLeft,
  Type, Save, ScanLine, FlipHorizontal2, ZoomIn
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
  original: string;
  edited: string;
  filter: string;
  rotation: number;
  crop?: Area;
}

const FILTERS = [
  { id: 'original', label: 'Original', icon: '🖼️', css: '' },
  { id: 'magic',    label: 'Magic',    icon: '✨', css: 'contrast(1.4) saturate(1.3) brightness(1.05)' },
  { id: 'bw',       label: 'B&W',      icon: '📄', css: 'contrast(200%) grayscale(100%)' },
  { id: 'grayscale',label: 'Gray',     icon: '⬛', css: 'grayscale(100%)' },
  { id: 'vivid',    label: 'Vivid',    icon: '🎨', css: 'saturate(2) contrast(1.2)' },
  { id: 'stamp',    label: 'Stamp',    icon: '🔵', css: 'grayscale(1) contrast(3) brightness(1.15)' },
];

type EditTab = 'filters' | 'transform' | 'perspective';

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export default function CamScannerClient() {
  // App
  const [view, setView]                   = useState<'camera' | 'review'>('camera');
  const [pages, setPages]                 = useState<ScannedPage[]>([]);
  const [isCapturing, setIsCapturing]     = useState(false);
  const [showFlash, setShowFlash]         = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  // Camera
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [isAutoCapture, setIsAutoCapture] = useState(false);
  const [countdown, setCountdown]         = useState<number | null>(null);
  const videoRef  = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Editor
  const [editingIndex, setEditingIndex]           = useState<number | null>(null);
  const [editTab, setEditTab]                     = useState<EditTab>('filters');
  const [editFilter, setEditFilter]               = useState('original');
  const [editRotate, setEditRotate]               = useState(0);
  const [crop, setCrop]                           = useState({ x: 0, y: 0 });
  const [zoom, setZoom]                           = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isEditingCrop, setIsEditingCrop]         = useState(false);
  const [aspect, setAspect]                       = useState<number | undefined>(undefined);

  // Export
  const [isExporting, setIsExporting]         = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [exportName, setExportName]           = useState(`scan_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}`);
  const [exportFormat, setExportFormat]       = useState<'pdf' | 'zip'>('pdf');

  // ── Camera Engine ──────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (!window.isSecureContext) throw new Error('INSECURE_CONTEXT');
        throw new Error('MEDIA_DEVICES_UNSUPPORTED');
      }

      streamRef.current?.getTracks().forEach(t => t.stop());

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: isFrontCamera ? 'user' : 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: isFrontCamera ? 'user' : 'environment' },
          audio: false,
        });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      if (err.message === 'INSECURE_CONTEXT') {
        setError('Camera requires a secure connection (HTTPS or localhost). You are on an insecure network.');
      } else if (err.message === 'MEDIA_DEVICES_UNSUPPORTED') {
        setError('Your browser does not support camera access.');
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission denied. Allow camera access in your browser settings and refresh.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError('Could not access camera. Please check permissions and retry.');
      }
    }
  }, [isFrontCamera]);

  useEffect(() => {
    if (view === 'camera') startCamera();
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, [view, startCamera]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || isCapturing) return;
    const video  = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (isFrontCamera) { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    const newPage: ScannedPage = {
      id: Date.now().toString(), original: dataUrl, edited: dataUrl, filter: 'original', rotation: 0,
    };
    setPages(prev => [...prev, newPage]);
    setIsCapturing(true);
    setShowFlash(true);
    setTimeout(() => { setIsCapturing(false); setShowFlash(false); }, 300);
  }, [isFrontCamera, isCapturing]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isAutoCapture && view === 'camera' && !isCapturing) {
      setCountdown(3);
      timer = setInterval(() => {
        setCountdown(prev => {
          if (prev === 1) { capturePhoto(); return 3; }
          return prev !== null ? prev - 1 : 3;
        });
      }, 1000);
    } else {
      setCountdown(null);
    }
    return () => clearInterval(timer);
  }, [isAutoCapture, view, capturePhoto, isCapturing]);

  // ── Edit Engine ────────────────────────────────────────────
  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((res, rej) => {
      const img = new Image();
      img.addEventListener('load', () => res(img));
      img.addEventListener('error', rej);
      img.src = url;
    });

  const getCroppedImg = async (src: string, px: Area | null, rot: number, flt: string): Promise<string> => {
    const image  = await createImage(src);
    const canvas = document.createElement('canvas');
    const ctx    = canvas.getContext('2d')!;
    if (!ctx) return src;

    const isRot = rot === 90 || rot === 270;
    const tc = document.createElement('canvas');
    tc.width  = isRot ? image.height : image.width;
    tc.height = isRot ? image.width  : image.height;
    const tc2 = tc.getContext('2d')!;
    tc2.translate(tc.width / 2, tc.height / 2);
    tc2.rotate((rot * Math.PI) / 180);
    tc2.drawImage(image, -image.width / 2, -image.height / 2);

    canvas.width  = px ? px.width  : tc.width;
    canvas.height = px ? px.height : tc.height;

    if (px) {
      ctx.drawImage(tc, px.x, px.y, px.width, px.height, 0, 0, px.width, px.height);
    } else {
      ctx.drawImage(tc, 0, 0);
    }

    if (flt !== 'original') {
      const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d  = id.data;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i+1], b = d[i+2];
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        if (flt === 'grayscale')    { d[i] = d[i+1] = d[i+2] = gray; }
        else if (flt === 'bw')      { const v = gray > 160 ? 255 : gray > 80 ? gray * 0.5 : 0; d[i]=d[i+1]=d[i+2]=v; }
        else if (flt === 'magic')   { d[i]=Math.min(255,r*1.1+15); d[i+1]=Math.min(255,g*1.1+15); d[i+2]=Math.min(255,b); }
        else if (flt === 'vivid')   { const avg=(r+g+b)/3; d[i]=Math.min(255,avg+(r-avg)*2); d[i+1]=Math.min(255,avg+(g-avg)*2); d[i+2]=Math.min(255,avg+(b-avg)*2); }
        else if (flt === 'stamp')   { const v=gray>140?255:0; d[i]=d[i+1]=d[i+2]=v; }
      }
      ctx.putImageData(id, 0, 0);
    }
    return canvas.toDataURL('image/jpeg', 0.92);
  };

  const openEditor = (idx: number) => {
    const page = pages[idx];
    setEditFilter(page.filter);
    setEditRotate(page.rotation);
    setEditTab('filters');
    setIsEditingCrop(false);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setAspect(undefined);
    setEditingIndex(idx);
  };

  const saveEdit = async () => {
    if (editingIndex === null) return;
    setIsExporting(true);
    const page = pages[editingIndex];
    const url  = await getCroppedImg(page.original, croppedAreaPixels, editRotate, editFilter);
    setPages(prev => prev.map((p, i) =>
      i === editingIndex ? { ...p, filter: editFilter, rotation: editRotate, edited: url, crop: croppedAreaPixels || undefined } : p
    ));
    setEditingIndex(null);
    setIsExporting(false);
  };

  // ── Export ─────────────────────────────────────────────────
  const handleExport = async () => {
    if (!pages.length) return;
    setIsExporting(true);
    try {
      if (exportFormat === 'pdf') {
        const pdfDoc = await PDFDocument.create();
        for (const page of pages) {
          const bytes  = await fetch(page.edited).then(r => r.arrayBuffer());
          const img    = await pdfDoc.embedJpg(bytes);
          const p      = pdfDoc.addPage([img.width, img.height]);
          p.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
        }
        const blob = new Blob([await pdfDoc.save() as any], { type: 'application/pdf' });
        const a = document.createElement('a');
        a.href     = URL.createObjectURL(blob);
        a.download = `${exportName || 'scan'}.pdf`;
        a.click();
      } else {
        const zip = new JSZip();
        pages.forEach((p, i) => zip.file(`page_${i + 1}.jpg`, p.edited.split(',')[1], { base64: true }));
        const blob = await zip.generateAsync({ type: 'blob' });
        const a = document.createElement('a');
        a.href     = URL.createObjectURL(blob);
        a.download = `${exportName || 'scanned_images'}.zip`;
        a.click();
      }
      setShowDownloadModal(false);
    } catch (e) {
      console.error('Export error:', e);
    } finally {
      setIsExporting(false);
    }
  };

  // ── CAMERA VIEW ────────────────────────────────────────────
  if (view === 'camera') {
    return (
      <div className={`${styles.container} full-bleed`}>
        {/* Flash */}
        {showFlash && <div className={styles.flashOverlay} />}

        {/* Countdown */}
        <AnimatePresence mode="wait">
          {countdown !== null && (
            <motion.div
              key={countdown}
              className={styles.countdown}
              initial={{ scale: 1.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {countdown}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Camera */}
        <div className={styles.cameraWrap}>
          {error ? (
            <div className={styles.errorOverlay}>
              <div className={styles.errorIconWrap}>
                <Camera size={40} color="#ef4444" />
              </div>
              <p className={styles.errorTitle}>Camera Access Failed</p>
              <p className={styles.errorMsg}>{error}</p>

              {error.includes('secure connection') && (
                <div className={styles.tipBox}>
                  <h4>💡 Developer Tip</h4>
                  <p>
                    Go to <code>chrome://flags/#unsafely-treat-insecure-origin-as-secure</code> and add{' '}
                    <code>{typeof window !== 'undefined' ? window.location.origin : ''}</code> to the list.
                  </p>
                </div>
              )}
              <button className={styles.retryBtn} onClick={startCamera}>
                <RefreshCw size={16} /> Retry Connection
              </button>
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
                <div className={styles.guideFrame}>
                  <div className={styles.cornerTR} />
                  <div className={styles.cornerBL} />
                  <div className={styles.edgeTop} />
                  <div className={styles.edgeBottom} />
                  <div className={styles.edgeLeft} />
                  <div className={styles.edgeRight} />
                </div>
                <p className={styles.guideHint}>Align document within the frame</p>
              </div>
            </>
          )}
        </div>

        {/* Top Bar */}
        <div className={styles.topBar}>
          <Link href="/tools/pdf" className={styles.backBtnFixed}>
            <ArrowLeft size={18} />
          </Link>
          <div className={styles.topSpacer} />
          <div className={styles.pageCounter}>
            <span className={styles.dot} />
            {pages.length} {pages.length === 1 ? 'Page' : 'Pages'}
          </div>
          <button
            className={`${styles.iconBtn} ${isAutoCapture ? styles.active : ''}`}
            onClick={() => setIsAutoCapture(!isAutoCapture)}
            title="Auto Capture (3s timer)"
          >
            <Clock size={18} />
          </button>
        </div>

        {/* Bottom Controls */}
        <div className={styles.bottomControls}>
          {/* Thumbnails */}
          <div className={styles.thumbnailStrip}>
            {pages.length === 0 && (
              <div className={styles.thumbEmpty}>
                <ScanLine size={20} />
              </div>
            )}
            {pages.map((p, i) => (
              <div key={p.id} className={styles.thumbItem}>
                <img src={p.edited} alt={`Page ${i + 1}`} />
                <span className={styles.thumbNum}>{i + 1}</span>
                <button
                  className={styles.removeThumb}
                  onClick={() => setPages(prev => prev.filter(pg => pg.id !== p.id))}
                >
                  <X size={9} />
                </button>
              </div>
            ))}
          </div>

          {/* Capture Row */}
          <div className={styles.captureRow}>
            <button className={styles.sideAction} onClick={() => setIsFrontCamera(!isFrontCamera)} title="Flip camera">
              <FlipHorizontal2 size={22} />
            </button>

            <button
              className={`${styles.captureBtn} ${(isCapturing || !!error) ? styles.disabled : ''}`}
              onClick={capturePhoto}
              disabled={!!error}
              title="Capture"
            >
              <div className={styles.inner} />
            </button>

            <button
              className={`${styles.doneAction} ${pages.length === 0 ? styles.empty : ''}`}
              onClick={() => pages.length > 0 && setView('review')}
              title="Review pages"
            >
              <Check size={24} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── REVIEW VIEW ────────────────────────────────────────────
  return (
    <div className={`${styles.reviewView} full-bleed`}>
      {/* Header */}
      <div className={styles.reviewHeader}>
        <button className={styles.reviewBackBtn} onClick={() => setView('camera')}>
          <ArrowLeft size={18} />
        </button>
        <h2>Review Documents</h2>
        <span className={styles.reviewCount}>{pages.length} {pages.length === 1 ? 'page' : 'pages'}</span>
      </div>

      <div className={styles.reviewScrollArea}>
        {pages.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <ScanLine size={32} color="var(--text-muted, #94a3b8)" />
            </div>
            <h3>No Pages Yet</h3>
            <p>Scan at least one document page to review and export it.</p>
            <Button variant="primary" onClick={() => setView('camera')}>
              <Camera size={16} /> Open Camera
            </Button>
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {pages.map((p, i) => (
                <div key={p.id} className={styles.pageCard}>
                  <div className={styles.cardImgWrap}>
                    <img src={p.edited} alt={`Page ${i + 1}`} />
                  </div>
                  <div className={styles.cardActions}>
                    <span className={styles.pageLabel}>P {i + 1}</span>
                    <div className={styles.cardBtns}>
                      <button className={styles.smallBtn} onClick={() => openEditor(i)} title="Edit">
                        <Sparkles size={13} />
                      </button>
                      <button
                        className={styles.smallBtn}
                        onClick={() => {
                          if (i > 0) {
                            const n = [...pages]; [n[i-1], n[i]] = [n[i], n[i-1]]; setPages(n);
                          }
                        }}
                        disabled={i === 0}
                        title="Move up"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        className={`${styles.smallBtn} ${styles.danger}`}
                        onClick={() => setPages(prev => prev.filter(pg => pg.id !== p.id))}
                        title="Remove"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.reviewActions}>
              <Button variant="primary" size="lg" fullWidth onClick={() => setShowDownloadModal(true)}>
                <Download size={17} /> Export Document
              </Button>
              <button className={styles.addMoreBtn} onClick={() => setView('camera')}>
                <Camera size={16} /> Add More Pages
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Download Modal ── */}
      <AnimatePresence>
        {showDownloadModal && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDownloadModal(false)}
          >
            <motion.div
              className={styles.modal}
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 340, damping: 30 }}
              onClick={e => e.stopPropagation()}
            >
              <div className={styles.modalHandle} />
              <div className={styles.modalHeader}>
                <h3>Export Document</h3>
                <button
                  className={styles.smallBtn}
                  style={{ width: 32, height: 32 }}
                  onClick={() => setShowDownloadModal(false)}
                >
                  <X size={16} />
                </button>
              </div>

              <div className={styles.modalBody}>
                <div>
                  <span className={styles.inputLabel}>File Name</span>
                  <div className={styles.inputWrap}>
                    <Type size={15} className={styles.inputIcon} />
                    <input
                      type="text"
                      value={exportName}
                      onChange={e => setExportName(e.target.value)}
                      placeholder="Enter filename..."
                    />
                  </div>
                </div>

                <div>
                  <span className={styles.inputLabel}>Save As</span>
                  <div className={styles.formatToggle}>
                    <button
                      className={`${styles.formatOption} ${exportFormat === 'pdf' ? styles.active : ''}`}
                      onClick={() => setExportFormat('pdf')}
                    >
                      <span className={styles.formatExt}>PDF</span>
                      <span className={styles.formatDesc}>Single file</span>
                    </button>
                    <button
                      className={`${styles.formatOption} ${exportFormat === 'zip' ? styles.active : ''}`}
                      onClick={() => setExportFormat('zip')}
                    >
                      <span className={styles.formatExt}>ZIP</span>
                      <span className={styles.formatDesc}>Images folder</span>
                    </button>
                  </div>
                </div>
              </div>

              <button className={styles.downloadBtn} onClick={handleExport} disabled={isExporting}>
                {isExporting ? (
                  <RefreshCw size={17} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Save size={17} />
                )}
                {isExporting ? 'Exporting...' : `Download ${exportFormat.toUpperCase()}`}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Edit Overlay ── */}
      <AnimatePresence>
        {editingIndex !== null && (
          <motion.div
            className={styles.editOverlay}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          >
            <div className={styles.editHeader}>
              <button className={styles.reviewBackBtn} onClick={() => setEditingIndex(null)}>
                <X size={18} />
              </button>
              <h3>Edit Page {editingIndex + 1}</h3>
            </div>

            <div className={styles.editContent}>
              {/* Preview / Cropper */}
              <div className={styles.cropperContainer}>
                {isEditingCrop ? (
                  <Cropper
                    image={pages[editingIndex].original}
                    crop={crop}
                    zoom={zoom}
                    rotation={editRotate}
                    aspect={aspect}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={(_, px) => setCroppedAreaPixels(px)}
                    objectFit="contain"
                  />
                ) : (
                  <img
                    src={pages[editingIndex].original}
                    className={styles.editImgPreview}
                    style={{
                      filter: FILTERS.find(f => f.id === editFilter)?.css || '',
                      transform: `rotate(${editRotate}deg)`,
                    }}
                    alt="Preview"
                  />
                )}
              </div>

              {/* Tools */}
              <div className={styles.editToolsPanel}>
                {/* Tabs */}
                <div className={styles.toolTabs}>
                  <button
                    className={`${styles.toolTab} ${editTab === 'filters' ? styles.active : ''}`}
                    onClick={() => { setEditTab('filters'); setIsEditingCrop(false); }}
                  >
                    <Sparkles size={14} /> Filters
                  </button>
                  <button
                    className={`${styles.toolTab} ${editTab === 'transform' ? styles.active : ''}`}
                    onClick={() => setEditTab('transform')}
                  >
                    <Crop size={14} /> Transform
                  </button>
                </div>

                {/* Filters Tab */}
                {editTab === 'filters' && (
                  <div>
                    <p className={styles.sectionLabel}>Color Enhancement</p>
                    <div className={styles.filterGrid}>
                      {FILTERS.map(f => (
                        <button
                          key={f.id}
                          className={`${styles.filterBtn} ${editFilter === f.id ? styles.active : ''}`}
                          onClick={() => setEditFilter(f.id)}
                        >
                          <span className={styles.filterIcon}>{f.icon}</span>
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Transform Tab */}
                {editTab === 'transform' && (
                  <>
                    <div>
                      <p className={styles.sectionLabel}>Actions</p>
                      <div className={styles.toolGrid}>
                        <button
                          className={`${styles.toolActionBtn} ${isEditingCrop ? styles.active : ''}`}
                          onClick={() => setIsEditingCrop(!isEditingCrop)}
                        >
                          <Crop size={15} />
                          {isEditingCrop ? 'Done Cropping' : 'Crop'}
                        </button>
                        <button
                          className={styles.toolActionBtn}
                          onClick={() => setEditRotate((editRotate + 90) % 360)}
                        >
                          <RotateCcw size={15} />
                          Rotate 90°
                        </button>
                      </div>
                    </div>

                    {isEditingCrop && (
                      <div>
                        <p className={styles.sectionLabel}>Aspect Ratio</p>
                        <div className={styles.aspectGrid}>
                          {[
                            { label: 'Free',   value: undefined,   preview: { w: 24, h: 18 } },
                            { label: 'Square', value: 1,           preview: { w: 18, h: 18 } },
                            { label: '3:4',    value: 3/4,         preview: { w: 14, h: 18 } },
                            { label: 'Auto',   value: -1,          preview: { w: 22, h: 16 } },
                          ].map(a => (
                            <button
                              key={a.label}
                              className={`${styles.aspectBtn} ${aspect === a.value ? styles.active : ''}`}
                              onClick={() => {
                                if (a.value === -1) {
                                  const img = new Image();
                                  img.src = pages[editingIndex!].original;
                                  img.onload = () => setAspect(img.width / img.height);
                                } else {
                                  setAspect(a.value);
                                }
                              }}
                            >
                              <div
                                className={styles.aspectPreview}
                                style={{ width: a.preview.w, height: a.preview.h }}
                              />
                              {a.label}
                            </button>
                          ))}
                        </div>
                        <div className={styles.cropTip}>
                          <ZoomIn size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                          Pinch to zoom · Drag to reposition the crop area
                        </div>
                      </div>
                    )}
                  </>
                )}

                <button className={styles.applyBtn} onClick={saveEdit} disabled={isExporting}>
                  {isExporting
                    ? <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
                    : <><Check size={16} /> Apply Changes</>
                  }
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}