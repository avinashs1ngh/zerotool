'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Camera, Clock, X, Check,
  Trash2, Download, RefreshCw,
  Sparkles, ArrowUp, Crop, ArrowLeft,
  Type, Save, ScanLine, FlipHorizontal2, ZoomIn,
  Grid3x3, Sliders, RotateCcw, Move
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import Cropper, { Area } from 'react-easy-crop';
import styles from './AIScanner.module.scss';
import { motion, AnimatePresence } from 'framer-motion';
import { useOpenCV } from '@/hooks/useOpenCV';
interface Point { x: number; y: number; }

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
  { id: 'original',  label: 'Original', icon: '🖼️', css: '' },
  { id: 'magic',     label: 'Magic',    icon: '✨', css: 'contrast(1.4) saturate(1.3) brightness(1.05)' },
  { id: 'bw',        label: 'B&W',      icon: '📄', css: 'contrast(200%) grayscale(100%)' },
  { id: 'grayscale', label: 'Gray',     icon: '⬛', css: 'grayscale(100%)' },
  { id: 'vivid',     label: 'Vivid',    icon: '🎨', css: 'saturate(2) contrast(1.2)' },
  { id: 'stamp',     label: 'Stamp',    icon: '🔵', css: 'grayscale(1) contrast(3) brightness(1.15)' },
];

const DEFAULT_POINTS: Point[] = [
  { x: 15, y: 15 }, { x: 85, y: 15 },
  { x: 85, y: 85 }, { x: 15, y: 85 },
];

type EditTab = 'warp' | 'filters' | 'transform';

const MAG_ZOOM   = 3;   
const MAG_SIZE   = 120;  
const MAG_OFFSET = 80;   
export default function AIScannerClient() {
  const cvStatus = useOpenCV();
  const [view, setView]               = useState<'camera' | 'review'>('camera');
  const [pages, setPages]             = useState<ScannedPage[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showFlash, setShowFlash]     = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [isAutoCapture, setIsAutoCapture] = useState(false);
  const [countdown, setCountdown]         = useState<number | null>(null);
  const videoRef  = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [editingIndex, setEditingIndex]           = useState<number | null>(null);
  const [editTab, setEditTab]                     = useState<EditTab>('warp');
  const [editFilter, setEditFilter]               = useState('original');
  const [editRotate, setEditRotate]               = useState(0);
  const [crop, setCrop]                           = useState({ x: 0, y: 0 });
  const [zoom, setZoom]                           = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [aspect, setAspect]                       = useState<number | undefined>(undefined);
  const [points, setPoints]       = useState<Point[]>(DEFAULT_POINTS);
  const [activePoint, setActivePoint] = useState<number | null>(null);
  const [handlePixels, setHandlePixels] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const perspImgRef  = useRef<HTMLImageElement>(null);
  const [isExporting, setIsExporting]             = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [exportName, setExportName]               = useState(`ai_scan_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}`);
  const [exportFormat, setExportFormat]           = useState<'pdf' | 'zip'>('pdf');
  const startCamera = useCallback(async () => {
    setError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
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
      if (err.message === 'INSECURE_CONTEXT')          setError('Camera requires HTTPS or localhost.');
      else if (err.message === 'MEDIA_DEVICES_UNSUPPORTED') setError('Your browser does not support camera access.');
      else if (err.name === 'NotAllowedError')          setError('Camera permission denied. Allow access and refresh.');
      else if (err.name === 'NotFoundError')            setError('No camera found on this device.');
      else                                              setError('Could not access camera. Please check permissions.');
    }
  }, [isFrontCamera]);

  useEffect(() => {
    if (view === 'camera') startCamera();
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, [view, startCamera]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || isCapturing) return;
    const video = videoRef.current;
    if (!video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    if (isFrontCamera) { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setPages(prev => [...prev, { id: Date.now().toString(), original: dataUrl, edited: dataUrl, filter: 'original', rotation: 0 }]);
    setIsCapturing(true); setShowFlash(true);
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
    } else setCountdown(null);
    return () => clearInterval(timer);
  }, [isAutoCapture, view, capturePhoto, isCapturing]);

  const warpImage = useCallback(async (srcUrl: string, corners: Point[]): Promise<string> => {
    if (typeof window === 'undefined' || !window.cv) return srcUrl;
    const cv = window.cv;
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const src      = cv.imread(img);
        const dst      = new cv.Mat();
        const W = img.width, H = img.height;

        const px = corners.map(p => ({ x: (p.x / 100) * W, y: (p.y / 100) * H }));
        const topW    = Math.hypot(px[1].x - px[0].x, px[1].y - px[0].y);
        const botW    = Math.hypot(px[2].x - px[3].x, px[2].y - px[3].y);
        const leftH   = Math.hypot(px[3].x - px[0].x, px[3].y - px[0].y);
        const rightH  = Math.hypot(px[2].x - px[1].x, px[2].y - px[1].y);
        const outW    = Math.round(Math.max(topW, botW));
        const outH    = Math.round(Math.max(leftH, rightH));

        const srcPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
          px[0].x, px[0].y, px[1].x, px[1].y, px[2].x, px[2].y, px[3].x, px[3].y,
        ]);
        const dstPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
          0, 0, outW, 0, outW, outH, 0, outH,
        ]);

        const M     = cv.getPerspectiveTransform(srcPts, dstPts);
        const dsize = new cv.Size(outW, outH);
        cv.warpPerspective(src, dst, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());

        const out = document.createElement('canvas');
        cv.imshow(out, dst);
        src.delete(); dst.delete(); srcPts.delete(); dstPts.delete(); M.delete();
        resolve(out.toDataURL('image/jpeg', 0.95));
      };
      img.src = srcUrl;
    });
  }, []);

  const processImage = useCallback(async (
    srcUrl: string, px: Area | null, rot: number, flt: string
  ): Promise<string> => {
    return new Promise((res, rej) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const isRot = rot === 90 || rot === 270;
        const tc = document.createElement('canvas');
        tc.width  = isRot ? img.height : img.width;
        tc.height = isRot ? img.width  : img.height;
        const tc2 = tc.getContext('2d')!;
        tc2.translate(tc.width / 2, tc.height / 2);
        tc2.rotate((rot * Math.PI) / 180);
        tc2.drawImage(img, -img.width / 2, -img.height / 2);

        const canvas = document.createElement('canvas');
        const ctx    = canvas.getContext('2d')!;
        canvas.width  = px ? px.width  : tc.width;
        canvas.height = px ? px.height : tc.height;
        if (px) ctx.drawImage(tc, px.x, px.y, px.width, px.height, 0, 0, px.width, px.height);
        else    ctx.drawImage(tc, 0, 0);

        if (flt !== 'original') {
          const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const d  = id.data;
          for (let i = 0; i < d.length; i += 4) {
            const r = d[i], g = d[i+1], b = d[i+2];
            const gray = 0.299*r + 0.587*g + 0.114*b;
            if      (flt === 'grayscale') { d[i]=d[i+1]=d[i+2]=gray; }
            else if (flt === 'bw')        { const v=gray>140?255:0; d[i]=d[i+1]=d[i+2]=v; }
            else if (flt === 'magic')     { d[i]=Math.min(255,r*1.1+15); d[i+1]=Math.min(255,g*1.1+15); d[i+2]=Math.min(255,b); }
            else if (flt === 'vivid')     { const avg=(r+g+b)/3; d[i]=Math.min(255,avg+(r-avg)*2); d[i+1]=Math.min(255,avg+(g-avg)*2); d[i+2]=Math.min(255,avg+(b-avg)*2); }
            else if (flt === 'stamp')     { const v=gray>140?255:0; d[i]=d[i+1]=d[i+2]=v; }
          }
          ctx.putImageData(id, 0, 0);
        }
        res(canvas.toDataURL('image/jpeg', 0.95));
      };
      img.onerror = rej;
      img.src = srcUrl;
    });
  }, []);

  const openEditor = (idx: number) => {
    const page = pages[idx];
    setEditFilter(page.filter);
    setEditRotate(page.rotation);
    setEditTab('warp');
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setAspect(undefined);
    setActivePoint(null);
    setHandlePixels(null);
    setPoints(page.perspectivePoints ?? DEFAULT_POINTS);
    setEditingIndex(idx);
  };

  const saveEdit = async () => {
    if (editingIndex === null) return;
    setIsExporting(true);
    try {
      const page = pages[editingIndex];
      const warpedUrl = await warpImage(page.original, points);
      const cropPx = editTab === 'transform' ? croppedAreaPixels : null;
      const url    = await processImage(warpedUrl, cropPx, editRotate, editFilter);

      setPages(prev => prev.map((p, i) =>
        i === editingIndex
          ? { ...p, filter: editFilter, rotation: editRotate, edited: url, crop: cropPx ?? undefined, perspectivePoints: points }
          : p
      ));
      setEditingIndex(null);
    } catch (e) {
      console.error('Save error:', e);
    } finally {
      setIsExporting(false);
    }
  };

  const getContainerPoint = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, ((clientX - rect.left)  / rect.width)  * 100)),
      y: Math.max(0, Math.min(100, ((clientY - rect.top)   / rect.height) * 100)),
      px: clientX - rect.left,
      py: clientY - rect.top,
    };
  }, []);

  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (activePoint === null) return;
    const pt = getContainerPoint(clientX, clientY);
    if (!pt) return;
    setPoints(prev => prev.map((p, i) => i === activePoint ? { x: pt.x, y: pt.y } : p));
    setHandlePixels({ x: pt.px, y: pt.py });
  }, [activePoint, getContainerPoint]);

  const onMouseMove  = useCallback((e: React.MouseEvent)  => handleDragMove(e.clientX, e.clientY), [handleDragMove]);
  const onTouchMove  = useCallback((e: React.TouchEvent)  => { e.preventDefault(); handleDragMove(e.touches[0].clientX, e.touches[0].clientY); }, [handleDragMove]);
  const onDragEnd    = useCallback(() => { setActivePoint(null); setHandlePixels(null); }, []);

  const handleExport = async () => {
    if (!pages.length) return;
    setIsExporting(true);
    try {
      if (exportFormat === 'pdf') {
        const pdfDoc = await PDFDocument.create();
        for (const page of pages) {
          const bytes = await fetch(page.edited).then(r => r.arrayBuffer());
          const img   = await pdfDoc.embedJpg(bytes);
          const p     = pdfDoc.addPage([img.width, img.height]);
          p.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
        }
        const blob = new Blob([await pdfDoc.save() as any], { type: 'application/pdf' });
        const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `${exportName || 'scan'}.pdf` });
        a.click();
      } else {
        const zip = new JSZip();
        pages.forEach((p, i) => zip.file(`page_${i+1}.jpg`, p.edited.split(',')[1], { base64: true }));
        const blob = await zip.generateAsync({ type: 'blob' });
        const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `${exportName || 'scan'}.zip` });
        a.click();
      }
      setShowDownloadModal(false);
    } catch (e) { console.error(e); }
    finally { setIsExporting(false); }
  };

   if (view === 'camera') {
    return (
      <div className={`${styles.container} full-bleed`}>
        {showFlash && <div className={styles.flashOverlay} />}
        <AnimatePresence mode="wait">
          {countdown !== null && (
            <motion.div key={countdown} className={styles.countdown}
              initial={{ scale: 1.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}>{countdown}</motion.div>
          )}
        </AnimatePresence>

        <div className={styles.cameraWrap}>
          {error ? (
            <div className={styles.errorOverlay}>
              <div className={styles.errorIconWrap}><Camera size={40} color="#ef4444" /></div>
              <p className={styles.errorTitle}>Camera Access Failed</p>
              <p className={styles.errorMsg}>{error}</p>
              <button className={styles.retryBtn} onClick={startCamera}><RefreshCw size={16} /> Retry</button>
            </div>
          ) : (
            <>
              <video ref={videoRef} autoPlay playsInline muted
                className={`${styles.videoFeed} ${isFrontCamera ? styles.mirrored : ''}`} />
              <div className={styles.cameraOverlay}>
                <div className={styles.guideFrame}>
                  <div className={styles.cornerTR} /><div className={styles.cornerBL} />
                  <div className={styles.edgeTop} /><div className={styles.edgeBottom} />
                  <div className={styles.edgeLeft} /><div className={styles.edgeRight} />
                </div>
                <p className={styles.guideHint}>Align document within frame</p>
              </div>
            </>
          )}
        </div>

        <div className={styles.topBar}>
          <Link href="/tools/pdf" className={styles.backBtnFixed}><ArrowLeft size={18} /></Link>
          <div className={styles.topSpacer} />
          <div className={styles.pageCounter}>
            <span className={styles.dot} />
            {pages.length} {pages.length === 1 ? 'Page' : 'Pages'}
          </div>
          <button className={`${styles.iconBtn} ${isAutoCapture ? styles.active : ''}`}
            onClick={() => setIsAutoCapture(!isAutoCapture)} title="Auto timer">
            <Clock size={18} />
          </button>
        </div>

        <div className={styles.bottomControls}>
          <div className={styles.thumbnailStrip}>
            {pages.length === 0 && (
              <div className={styles.thumbEmpty}><ScanLine size={20} /></div>
            )}
            {pages.map((p, i) => (
              <div key={p.id} className={styles.thumbItem}>
                <img src={p.edited} alt={`Page ${i+1}`} />
                <span className={styles.thumbNum}>{i+1}</span>
                <button className={styles.removeThumb}
                  onClick={() => setPages(prev => prev.filter(pg => pg.id !== p.id))}>
                  <X size={9} />
                </button>
              </div>
            ))}
          </div>
          <div className={styles.captureRow}>
            <button className={styles.sideAction} onClick={() => setIsFrontCamera(!isFrontCamera)}>
              <FlipHorizontal2 size={22} />
            </button>
            <button className={`${styles.captureBtn} ${(isCapturing || !!error) ? styles.disabled : ''}`}
              onClick={capturePhoto} disabled={!!error}>
              <div className={styles.inner} />
            </button>
            <button className={`${styles.doneAction} ${pages.length === 0 ? styles.empty : ''}`}
              onClick={() => pages.length > 0 && setView('review')}>
              <Check size={24} />
            </button>
          </div>
        </div>
      </div>
    );
  }

   return (
    <div className={`${styles.reviewView} full-bleed`}>
      <div className={styles.reviewHeader}>
        <button className={styles.reviewBackBtn} onClick={() => setView('camera')}><ArrowLeft size={18} /></button>
        <h2>Review Documents</h2>
        <span className={styles.reviewCount}>{pages.length} {pages.length === 1 ? 'page' : 'pages'}</span>
      </div>

      <div className={styles.reviewScrollArea}>
        {pages.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><ScanLine size={32} color="var(--text-muted, #94a3b8)" /></div>
            <h3>No Pages Yet</h3>
            <p>Scan at least one document page to review and export it.</p>
            <Button variant="primary" onClick={() => setView('camera')}><Camera size={16} /> Open Camera</Button>
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {pages.map((p, i) => (
                <div key={p.id} className={styles.pageCard}>
                  <div className={styles.cardImgWrap}><img src={p.edited} alt={`Page ${i+1}`} /></div>
                  <div className={styles.cardActions}>
                    <span className={styles.pageLabel}>P {i+1}</span>
                    <div className={styles.cardBtns}>
                      <button className={styles.smallBtn} onClick={() => openEditor(i)} title="Edit"><Sparkles size={13} /></button>
                      <button className={styles.smallBtn}
                        onClick={() => { if (i > 0) { const n=[...pages]; [n[i-1],n[i]]=[n[i],n[i-1]]; setPages(n); } }}
                        disabled={i === 0} title="Move up"><ArrowUp size={13} /></button>
                      <button className={`${styles.smallBtn} ${styles.danger}`}
                        onClick={() => setPages(prev => prev.filter(pg => pg.id !== p.id))} title="Remove">
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

      <AnimatePresence>
        {showDownloadModal && (
          <motion.div className={styles.modalOverlay}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowDownloadModal(false)}>
            <motion.div className={styles.modal}
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 340, damping: 30 }}
              onClick={e => e.stopPropagation()}>
              <div className={styles.modalHandle} />
              <div className={styles.modalHeader}>
                <h3>Export Document</h3>
                <button className={styles.smallBtn} style={{ width: 32, height: 32 }}
                  onClick={() => setShowDownloadModal(false)}><X size={16} /></button>
              </div>
              <div className={styles.modalBody}>
                <div>
                  <span className={styles.inputLabel}>File Name</span>
                  <div className={styles.inputWrap}>
                    <Type size={15} className={styles.inputIcon} />
                    <input type="text" value={exportName} onChange={e => setExportName(e.target.value)} placeholder="Enter filename..." />
                  </div>
                </div>
                <div>
                  <span className={styles.inputLabel}>Save As</span>
                  <div className={styles.formatToggle}>
                    <button className={`${styles.formatOption} ${exportFormat === 'pdf' ? styles.active : ''}`} onClick={() => setExportFormat('pdf')}>
                      <span className={styles.formatExt}>PDF</span>
                      <span className={styles.formatDesc}>Single file</span>
                    </button>
                    <button className={`${styles.formatOption} ${exportFormat === 'zip' ? styles.active : ''}`} onClick={() => setExportFormat('zip')}>
                      <span className={styles.formatExt}>ZIP</span>
                      <span className={styles.formatDesc}>Images folder</span>
                    </button>
                  </div>
                </div>
              </div>
              <button className={styles.downloadBtn} onClick={handleExport} disabled={isExporting}>
                {isExporting ? <RefreshCw size={17} className={styles.spin} /> : <Save size={17} />}
                {isExporting ? 'Exporting...' : `Download ${exportFormat.toUpperCase()}`}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingIndex !== null && (
          <motion.div className={styles.editOverlay}
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}>

            <div className={styles.editHeader}>
              <button className={styles.reviewBackBtn} onClick={() => setEditingIndex(null)}><X size={18} /></button>
              <h3>Edit Page {editingIndex + 1}</h3>
            </div>

            <div className={styles.editContent}>
              <div className={styles.cropperContainer}>
                {editTab === 'warp' ? (
                  <div
                    ref={containerRef}
                    className={styles.perspectiveContainer}
                    onMouseMove={onMouseMove}
                    onMouseUp={onDragEnd}
                    onMouseLeave={onDragEnd}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onDragEnd}
                  >
                    <img
                      ref={perspImgRef}
                      src={pages[editingIndex].original}
                      className={styles.perspectiveImg}
                      alt="perspective"
                      draggable={false}
                    />

                     <svg className={styles.perspectiveSVG} viewBox="0 0 100 100" preserveAspectRatio="none">
                      <polygon
                        points={points.map(p => `${p.x},${p.y}`).join(' ')}
                        className={styles.perspectivePolygon}
                      />
                      {[0,1,2,3].map(i => {
                        const a = points[i], b = points[(i+1)%4];
                        return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={styles.perspectiveLine} />;
                      })}
                    </svg>

                     {points.map((p, i) => (
                      <div
                        key={i}
                        className={`${styles.perspectiveHandle} ${activePoint === i ? styles.handleActive : ''}`}
                        style={{ left: `${p.x}%`, top: `${p.y}%` }}
                        onMouseDown={e => { e.preventDefault(); setActivePoint(i); setHandlePixels(null); }}
                        onTouchStart={e => { e.preventDefault(); setActivePoint(i); setHandlePixels(null); }}
                      >
                        <span className={styles.handleCornerIcon}>{['↖','↗','↘','↙'][i]}</span>
                      </div>
                    ))}

                    {activePoint !== null && handlePixels && containerRef.current && (() => {
                      const rect    = containerRef.current.getBoundingClientRect();
                      const hx      = handlePixels.x;
                      const hy      = handlePixels.y;
                      const magLeft = hx - MAG_SIZE / 2;
                      const magTop  = hy - MAG_SIZE - MAG_OFFSET + 10; 

                      const clampedLeft = Math.max(0, Math.min(rect.width  - MAG_SIZE, magLeft));
                      const clampedTop  = Math.max(0, Math.min(rect.height - MAG_SIZE, magTop));

                      const imgOffX = -(hx * MAG_ZOOM) + MAG_SIZE / 2;
                      const imgOffY = -(hy * MAG_ZOOM) + MAG_SIZE / 2;

                      return (
                        <div
                          className={styles.magnifier}
                          style={{ left: clampedLeft, top: clampedTop, width: MAG_SIZE, height: MAG_SIZE }}
                        >
                          <img
                            src={pages[editingIndex].original}
                            style={{
                              width:  `${MAG_ZOOM * 100}%`,
                              height: 'auto',
                              position: 'absolute',
                              left:  imgOffX,
                              top:   imgOffY,
                              maxWidth: 'none',
                              pointerEvents: 'none',
                            }}
                            alt="zoom"
                            draggable={false}
                          />
                        </div>
                      );
                    })()}
                  </div>

                ) : editTab === 'transform' ? (
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
                    style={{ filter: FILTERS.find(f => f.id === editFilter)?.css || '', transform: `rotate(${editRotate}deg)` }}
                    alt="Preview"
                  />
                )}
              </div>

              <div className={styles.editToolsPanel}>

                <div className={styles.toolTabs}>
                  {([
                    { id: 'warp',      icon: <Grid3x3 size={14} />,  label: 'Warp' },
                    { id: 'filters',   icon: <Sliders size={14} />,  label: 'Filters' },
                    { id: 'transform', icon: <Crop size={14} />,     label: 'Crop' },
                  ] as const).map(tab => (
                    <button
                      key={tab.id}
                      className={`${styles.toolTab} ${editTab === tab.id ? styles.active : ''}`}
                      onClick={() => setEditTab(tab.id)}
                    >
                      {tab.icon} {tab.label}
                    </button>
                  ))}
                </div>

                {editTab === 'warp' && (
                  <div className={styles.warpInstructions}>
                    <div className={styles.warpInstructionItem}>
                      <span className={styles.warpBadge}><Move size={13}/></span>
                      <span>Drag the <strong>4 corner handles</strong> to match the document edges.</span>
                    </div>
                    <div className={styles.warpInstructionItem}>
                      <span className={styles.warpBadge}><ZoomIn size={13}/></span>
                      <span>A magnifier appears while dragging for precise placement.</span>
                    </div>
                    <button
                      className={styles.resetPointsBtn}
                      onClick={() => setPoints(DEFAULT_POINTS)}
                    >
                      <RotateCcw size={13} /> Reset corners
                    </button>
                  </div>
                )}

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

                {editTab === 'transform' && (
                  <div className={styles.transformPanel}>
                    <div>
                      <p className={styles.sectionLabel}>Rotate</p>
                      <button
                        className={styles.toolActionBtn}
                        onClick={() => setEditRotate(r => (r + 90) % 360)}
                      >
                        <RotateCcw size={15} /> Rotate 90°
                      </button>
                    </div>
                    <div>
                      <p className={styles.sectionLabel}>Aspect Ratio</p>
                      <div className={styles.aspectGrid}>
                        {[
                          { label: 'Free',   value: undefined,   preview: { w: 24, h: 18 } },
                          { label: 'Square', value: 1,           preview: { w: 18, h: 18 } },
                          { label: '3:4',    value: 3/4,         preview: { w: 14, h: 18 } },
                          { label: 'Auto',   value: -1 as any,   preview: { w: 22, h: 16 } },
                        ].map(a => (
                          <button key={a.label}
                            className={`${styles.aspectBtn} ${aspect === a.value ? styles.active : ''}`}
                            onClick={() => {
                              if (a.value === -1) {
                                const img = new Image(); img.src = pages[editingIndex!].original;
                                img.onload = () => setAspect(img.width / img.height);
                              } else setAspect(a.value);
                            }}>
                            <div className={styles.aspectPreview} style={{ width: a.preview.w, height: a.preview.h }} />
                            {a.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className={styles.cropTip}>
                      <ZoomIn size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                      Pinch to zoom · Drag to reposition the crop selection
                    </div>
                  </div>
                )}

                <button className={styles.applyBtn} onClick={saveEdit} disabled={isExporting}>
                  {isExporting
                    ? <><RefreshCw size={16} className={styles.spin} /> Saving…</>
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