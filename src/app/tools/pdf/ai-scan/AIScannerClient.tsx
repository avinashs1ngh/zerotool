'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Camera, Clock, RotateCw, RotateCcw, X, Check,
  Trash2, ChevronLeft, Download, RefreshCw,
  Sparkles, ArrowUp, Crop, ArrowLeft,
  Type, Save, ScanLine, FlipHorizontal2, ZoomIn, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import Cropper, { Area } from 'react-easy-crop';
import styles from './AIScanner.module.scss';
import { motion, AnimatePresence } from 'framer-motion';
import { useOpenCV } from '@/hooks/useOpenCV';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface Point {
  x: number;
  y: number;
}

interface ScannedPage {
  id: string;
  original: string;
  edited: string;
  filter: string;
  rotation: number;
  crop?: Area;
  perspectivePoints?: Point[];
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
export default function AIScannerClient() {
  const cvStatus = useOpenCV();

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

  // Perspective Editor
  const [points, setPoints] = useState<Point[]>([
    { x: 10, y: 10 }, { x: 90, y: 10 },
    { x: 90, y: 90 }, { x: 10, y: 90 }
  ]);
  const [activePoint, setActivePoint] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Export
  const [isExporting, setIsExporting]         = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [exportName, setExportName]           = useState(`ai_scan_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}`);
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
        setError('Camera requires a secure connection (HTTPS or localhost).');
      } else if (err.message === 'MEDIA_DEVICES_UNSUPPORTED') {
        setError('Your browser does not support camera access.');
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission denied.');
      } else {
        setError('Could not access camera. Please check permissions.');
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
    if (!video.videoWidth) return;

    const canvas = document.createElement('canvas');
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (isFrontCamera) { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

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

  // ── OpenCV Warp Engine ──────────────────────────────────────
  const warpImage = async (srcUrl: string, cornerPoints: Point[]): Promise<string> => {
    if (!window.cv) return srcUrl;
    const cv = window.cv;

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const src = cv.imread(img);
        const dst = new cv.Mat();
        
        // Define source coordinates based on % of image size
        const srcCoords = cv.matFromArray(4, 1, cv.CV_32FC2, [
          (cornerPoints[0].x / 100) * img.width, (cornerPoints[0].y / 100) * img.height,
          (cornerPoints[1].x / 100) * img.width, (cornerPoints[1].y / 100) * img.height,
          (cornerPoints[2].x / 100) * img.width, (cornerPoints[2].y / 100) * img.height,
          (cornerPoints[3].x / 100) * img.width, (cornerPoints[3].y / 100) * img.height,
        ]);

        // Calculate output dimensions
        const width1 = Math.hypot(cornerPoints[1].x - cornerPoints[0].x, cornerPoints[1].y - cornerPoints[0].y);
        const width2 = Math.hypot(cornerPoints[2].x - cornerPoints[3].x, cornerPoints[2].y - cornerPoints[3].y);
        const maxWidth = Math.max(width1, width2) * (img.width / 100);

        const height1 = Math.hypot(cornerPoints[3].x - cornerPoints[0].x, cornerPoints[3].y - cornerPoints[0].y);
        const height2 = Math.hypot(cornerPoints[2].x - cornerPoints[1].x, cornerPoints[2].y - cornerPoints[1].y);
        const maxHeight = Math.max(height1, height2) * (img.height / 100);

        const dstCoords = cv.matFromArray(4, 1, cv.CV_32FC2, [
          0, 0,
          maxWidth, 0,
          maxWidth, maxHeight,
          0, maxHeight,
        ]);

        const M = cv.getPerspectiveTransform(srcCoords, dstCoords);
        const dsize = new cv.Size(maxWidth, maxHeight);
        cv.warpPerspective(src, dst, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());

        const canvas = document.createElement('canvas');
        cv.imshow(canvas, dst);
        const result = canvas.toDataURL('image/jpeg', 0.95);

        // Cleanup
        src.delete(); dst.delete(); srcCoords.delete(); dstCoords.delete(); M.delete();

        resolve(result);
      };
      img.src = srcUrl;
    });
  };

  // ── Edit Engine ────────────────────────────────────────────
  const getProcessedImg = async (src: string, px: Area | null, rot: number, flt: string): Promise<string> => {
    return new Promise((res, rej) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx    = canvas.getContext('2d')!;
        if (!ctx) return res(src);

        const isRot = rot === 90 || rot === 270;
        const tc = document.createElement('canvas');
        tc.width  = isRot ? img.height : img.width;
        tc.height = isRot ? img.width  : img.height;
        const tc2 = tc.getContext('2d')!;
        tc2.translate(tc.width / 2, tc.height / 2);
        tc2.rotate((rot * Math.PI) / 180);
        tc2.drawImage(img, -img.width / 2, -img.height / 2);

        canvas.width  = px ? px.width  : tc.width;
        canvas.height = px ? px.height : tc.height;

        if (px) ctx.drawImage(tc, px.x, px.y, px.width, px.height, 0, 0, px.width, px.height);
        else ctx.drawImage(tc, 0, 0);

        if (flt !== 'original') {
          const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const d  = id.data;
          for (let i = 0; i < d.length; i += 4) {
             const r = d[i], g = d[i+1], b = d[i+2];
             const gray = 0.299 * r + 0.587 * g + 0.114 * b;
             if (flt === 'grayscale') { d[i]=d[i+1]=d[i+2]=gray; }
             else if (flt === 'bw') { const v = gray > 140 ? 255 : 0; d[i]=d[i+1]=d[i+2]=v; }
             else if (flt === 'magic') { d[i]=Math.min(255,r*1.1+15); d[i+1]=Math.min(255,g*1.1+15); d[i+2]=Math.min(255,b); }
          }
          ctx.putImageData(id, 0, 0);
        }
        res(canvas.toDataURL('image/jpeg', 0.95));
      };
      img.onerror = rej;
      img.src = src;
    });
  };

  const openEditor = (idx: number) => {
    const page = pages[idx];
    setEditFilter(page.filter);
    setEditRotate(page.rotation);
    setEditTab('filters');
    setIsEditingCrop(false);
    setCrop({ x: 0, y: 0 });
    setEditingIndex(idx);
    
    if (page.perspectivePoints) setPoints(page.perspectivePoints);
    else setPoints([{ x: 10, y: 10 }, { x: 90, y: 10 }, { x: 90, y: 90 }, { x: 10, y: 90 }]);
  };

  const saveEdit = async () => {
    if (editingIndex === null) return;
    setIsExporting(true);
    try {
      const page = pages[editingIndex];
      let currentUrl = page.original;
      
      if (editTab === 'perspective' && points.length === 4 && window.cv) {
        currentUrl = await warpImage(currentUrl, points);
      } else if (page.perspectivePoints && window.cv) {
        currentUrl = await warpImage(currentUrl, page.perspectivePoints);
      }

      const url = await getProcessedImg(currentUrl, croppedAreaPixels, editRotate, editFilter);
      
      setPages(prev => prev.map((p, i) =>
        i === editingIndex ? { 
          ...p, filter: editFilter, rotation: editRotate, edited: url, 
          crop: croppedAreaPixels || undefined, perspectivePoints: points 
        } : p
      ));
      setEditingIndex(null);
    } catch (e) {
      console.error('Save error:', e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (activePoint === null || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    setPoints(prev => prev.map((p, i) => i === activePoint ? { x, y } : p));
  };

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
        a.href = URL.createObjectURL(blob);
        a.download = `${exportName || 'scan'}.pdf`;
        a.click();
      }
      setShowDownloadModal(false);
    } catch (e) { console.error(e); } finally { setIsExporting(false); }
  };

  if (view === 'camera') {
    return (
      <div className={styles.container}>
        {showFlash && <div className={styles.flashOverlay} />}
        <div className={styles.cameraWrap}>
          {error ? (
            <div className={styles.errorOverlay}><p className={styles.errorTitle}>Error</p><p>{error}</p></div>
          ) : (
            <>
              <video ref={videoRef} autoPlay playsInline muted className={`${styles.videoFeed} ${isFrontCamera ? styles.mirrored : ''}`} />
              <div className={styles.cameraOverlay}>
                <div className={styles.guideFrame}><div className={styles.cornerTR} /><div className={styles.cornerBL} /></div>
              </div>
            </>
          )}
        </div>
        <div className={styles.topBar}>
          <Link href="/tools/pdf" className={styles.backBtnFixed}><ArrowLeft size={18} /></Link>
          <div className={styles.topSpacer} />
          <div className={styles.pageCounter}>{pages.length} Pages</div>
        </div>
        <div className={styles.bottomControls}>
          <div className={styles.thumbnailStrip}>
            {pages.map((p, i) => <div key={p.id} className={styles.thumbItem}><img src={p.edited} alt="thumb" /></div>)}
          </div>
          <div className={styles.captureRow}>
            <button className={styles.sideAction} onClick={() => setIsFrontCamera(!isFrontCamera)}><FlipHorizontal2 size={22} /></button>
            <button className={styles.captureBtn} onClick={capturePhoto} disabled={isCapturing}><div className={styles.inner} /></button>
            <button className={`${styles.doneAction} ${!pages.length ? styles.empty : ''}`} onClick={() => setView('review')}><Check size={24} /></button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.reviewView}>
      <div className={styles.reviewHeader}>
        <button className={styles.reviewBackBtn} onClick={() => setView('camera')}><ArrowLeft size={18} /></button>
        <h2>AI Scan Review</h2>
      </div>
      <div className={styles.reviewScrollArea}>
        <div className={styles.grid}>
          {pages.map((p, i) => (
            <div key={p.id} className={styles.pageCard}>
              <div className={styles.cardImgWrap}><img src={p.edited} alt="page" /></div>
              <div className={styles.cardActions}>
                <button className={styles.smallBtn} onClick={() => openEditor(i)}><Sparkles size={13} /></button>
                <button className={styles.smallBtn} onClick={() => setPages(prev => prev.filter(pg => pg.id !== p.id))}><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
        {pages.length > 0 && <Button variant="primary" fullWidth onClick={() => setShowDownloadModal(true)}><Download size={16} /> Export Document</Button>}
      </div>

      <AnimatePresence>
        {editingIndex !== null && (
          <motion.div className={styles.editOverlay} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}>
            <div className={styles.editHeader}><button onClick={() => setEditingIndex(null)}><X size={18} /></button><h3>AI Edit</h3></div>
            <div className={styles.editContent}>
              <div className={styles.cropperContainer}>
                {editTab === 'perspective' ? (
                  <div ref={containerRef} className={styles.perspectiveContainer} onMouseMove={handleMove} onMouseUp={() => setActivePoint(null)} onTouchMove={handleMove} onTouchEnd={() => setActivePoint(null)}>
                    <img src={pages[editingIndex].original} className={styles.perspectiveImg} alt="warp" />
                    <svg className={styles.perspectiveOverlay}><polygon points={points.map(p => `${p.x}%,${p.y}%`).join(' ')} className={styles.perspectivePolygon} /></svg>
                    {points.map((p, i) => <div key={i} className={styles.perspectiveHandle} style={{ left: `${p.x}%`, top: `${p.y}%` }} onMouseDown={() => setActivePoint(i)} onTouchStart={() => setActivePoint(i)} />)}
                    {activePoint !== null && (
                      <div className={styles.magnifier} style={{ left: `${points[activePoint].x}%`, top: `${points[activePoint].y - 15}%` }}>
                        <img src={pages[editingIndex].original} style={{ left: `${-points[activePoint].x * 8 + 50}%`, top: `${-points[activePoint].y * 8 + 50}%` }} alt="magnify" />
                      </div>
                    )}
                  </div>
                ) : isEditingCrop ? (
                  <Cropper image={pages[editingIndex].original} crop={crop} zoom={zoom} rotation={editRotate} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_, px) => setCroppedAreaPixels(px)} />
                ) : (
                  <img src={pages[editingIndex].original} className={styles.editImgPreview} style={{ filter: FILTERS.find(f => f.id === editFilter)?.css || '' }} alt="preview" />
                )}
              </div>
              <div className={styles.editToolsPanel}>
                <div className={styles.toolTabs}>
                  <button className={editTab === 'perspective' ? styles.active : ''} onClick={() => { setEditTab('perspective'); setIsEditingCrop(false); }}>Warp</button>
                  <button className={editTab === 'filters' ? styles.active : ''} onClick={() => { setEditTab('filters'); setIsEditingCrop(false); }}>Color</button>
                  <button className={editTab === 'transform' ? styles.active : ''} onClick={() => setEditTab('transform')}>Crop</button>
                </div>
                <button className={styles.applyBtn} onClick={saveEdit} disabled={isExporting}>{isExporting ? 'Saving...' : 'Apply'}</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
