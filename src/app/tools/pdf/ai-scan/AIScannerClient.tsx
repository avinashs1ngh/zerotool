'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Camera, Clock, X, Check,
  Trash2, Download, RefreshCw,
  ArrowUp, Crop, ArrowLeft,
  Type, Save, ScanLine, FlipHorizontal2, ZoomIn,
  Grid3x3, Sliders, RotateCcw, Move, PenLine
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import Cropper, { Area } from 'react-easy-crop';
import styles from './AIScanner.module.scss';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
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

const MAG_SIZE = 130; // diameter px
const MAG_ZOOM = 3.5; // zoom factor
const MAG_GAP  = 16;  // px gap between magnifier bottom and handle center

// ─────────────────────────────────────────────────────────────
// Pure-canvas perspective warp (no OpenCV dependency)
// Uses inverse bilinear interpolation for correct mapping
// ─────────────────────────────────────────────────────────────
function canvasPerspectiveWarp(
  img: HTMLImageElement,
  // corners in IMAGE NATURAL PIXEL space (TL, TR, BR, BL)
  corners: [Point, Point, Point, Point]
): string {
  const [tl, tr, br, bl] = corners;

  const topW   = Math.hypot(tr.x - tl.x, tr.y - tl.y);
  const botW   = Math.hypot(br.x - bl.x, br.y - bl.y);
  const leftH  = Math.hypot(bl.x - tl.x, bl.y - tl.y);
  const rightH = Math.hypot(br.x - tr.x, br.y - tr.y);
  const outW   = Math.round(Math.max(topW, botW));
  const outH   = Math.round(Math.max(leftH, rightH));

  if (outW < 1 || outH < 1) return img.src;

  // Read source pixels
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width  = img.naturalWidth;
  srcCanvas.height = img.naturalHeight;
  srcCanvas.getContext('2d')!.drawImage(img, 0, 0);
  const srcCtx  = srcCanvas.getContext('2d')!;
  const srcData = srcCtx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);

  const dstCanvas = document.createElement('canvas');
  dstCanvas.width  = outW;
  dstCanvas.height = outH;
  const dstCtx  = dstCanvas.getContext('2d')!;
  const dstData = dstCtx.createImageData(outW, outH);
  const d       = dstData.data;
  const s       = srcData.data;
  const sw      = srcCanvas.width;
  const sh      = srcCanvas.height;

  // For each destination pixel, compute source coordinate via bilinear interp
  for (let py = 0; py < outH; py++) {
    const v = py / (outH - 1 || 1);
    for (let px = 0; px < outW; px++) {
      const u = px / (outW - 1 || 1);

      // Bilinear blend of the 4 source corners
      const srcX = (1 - u) * (1 - v) * tl.x
                 + u       * (1 - v) * tr.x
                 + u       * v       * br.x
                 + (1 - u) * v       * bl.x;
      const srcY = (1 - u) * (1 - v) * tl.y
                 + u       * (1 - v) * tr.y
                 + u       * v       * br.y
                 + (1 - u) * v       * bl.y;

      const sx = Math.round(srcX);
      const sy = Math.round(srcY);
      if (sx < 0 || sy < 0 || sx >= sw || sy >= sh) continue;

      const si = (sy * sw + sx) * 4;
      const di = (py * outW + px) * 4;
      d[di]     = s[si];
      d[di + 1] = s[si + 1];
      d[di + 2] = s[si + 2];
      d[di + 3] = s[si + 3];
    }
  }

  dstCtx.putImageData(dstData, 0, 0);
  return dstCanvas.toDataURL('image/jpeg', 0.95);
}

// ─────────────────────────────────────────────────────────────
// Compute the rendered image rect inside a container
// when using object-fit: contain
// ─────────────────────────────────────────────────────────────
function getContainRect(
  cW: number, cH: number, iW: number, iH: number
): { x: number; y: number; w: number; h: number } {
  const cAspect = cW / cH;
  const iAspect = iW / iH;
  let w: number, h: number;
  if (iAspect > cAspect) { w = cW;          h = cW / iAspect; }
  else                   { h = cH;          w = cH * iAspect; }
  return { x: (cW - w) / 2, y: (cH - h) / 2, w, h };
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export default function AIScannerClient() {
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

  const [points, setPoints]           = useState<Point[]>(DEFAULT_POINTS);
  const [activePoint, setActivePoint] = useState<number | null>(null);
  // px position of the active handle within the container
  const [handlePx, setHandlePx] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const perspImgRef  = useRef<HTMLImageElement>(null);

  const [isExporting, setIsExporting]             = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [exportName, setExportName]               = useState(`ai_scan_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}`);
  const [exportFormat, setExportFormat]           = useState<'pdf' | 'zip'>('pdf');

  // ── Camera ─────────────────────────────────────────────────
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
          video: { facingMode: isFrontCamera ? 'user' : 'environment' }, audio: false,
        });
      }
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      if      (err.message === 'INSECURE_CONTEXT')          setError('Camera requires HTTPS or localhost.');
      else if (err.message === 'MEDIA_DEVICES_UNSUPPORTED') setError('Your browser does not support camera access.');
      else if (err.name  === 'NotAllowedError')             setError('Camera permission denied. Allow access and refresh.');
      else if (err.name  === 'NotFoundError')               setError('No camera found on this device.');
      else                                                  setError('Could not access camera. Please check permissions.');
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
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
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

  // ── Process image (rotation + crop + filter) ───────────────
  const processImage = useCallback((
    srcUrl: string, px: Area | null, rot: number, flt: string
  ): Promise<string> => {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => {
        const isRot = rot === 90 || rot === 270;
        const tc = document.createElement('canvas');
        tc.width  = isRot ? img.height : img.width;
        tc.height = isRot ? img.width  : img.height;
        const tc2 = tc.getContext('2d')!;
        tc2.translate(tc.width / 2, tc.height / 2);
        tc2.rotate((rot * Math.PI) / 180);
        tc2.drawImage(img, -img.width / 2, -img.height / 2);

        const c   = document.createElement('canvas');
        const ctx = c.getContext('2d')!;
        c.width  = px ? px.width  : tc.width;
        c.height = px ? px.height : tc.height;
        if (px) ctx.drawImage(tc, px.x, px.y, px.width, px.height, 0, 0, px.width, px.height);
        else    ctx.drawImage(tc, 0, 0);

        if (flt !== 'original') {
          const id = ctx.getImageData(0, 0, c.width, c.height);
          const d = id.data;
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
        res(c.toDataURL('image/jpeg', 0.95));
      };
      img.onerror = rej;
      img.src = srcUrl;
    });
  }, []);

  // ── Open editor ────────────────────────────────────────────
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
    setHandlePx(null);
    setPoints(page.perspectivePoints ?? DEFAULT_POINTS);
    setEditingIndex(idx);
  };

  // ── Save ───────────────────────────────────────────────────
  const saveEdit = async () => {
    if (editingIndex === null || !containerRef.current || !perspImgRef.current) return;
    setIsExporting(true);
    try {
      const page = pages[editingIndex];
      const cRect = containerRef.current.getBoundingClientRect();
      const cW = cRect.width, cH = cRect.height;
      const iW = perspImgRef.current.naturalWidth;
      const iH = perspImgRef.current.naturalHeight;

      // ── Step 1: Warp ──────────────────────────────────────
      // Convert points (% of container) → natural image pixel coords
      const renderedRect = getContainRect(cW, cH, iW, iH);
      const scaleX = iW / renderedRect.w;
      const scaleY = iH / renderedRect.h;

      const imgPxCorners = points.map(p => ({
        x: Math.max(0, Math.min(iW, ((p.x / 100) * cW - renderedRect.x) * scaleX)),
        y: Math.max(0, Math.min(iH, ((p.y / 100) * cH - renderedRect.y) * scaleY)),
      })) as [Point, Point, Point, Point];

      // Load the source image
      const srcImg = await new Promise<HTMLImageElement>((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = rej;
        i.src = page.original;
      });

      const warpedUrl = canvasPerspectiveWarp(srcImg, imgPxCorners);

      // ── Step 2: Process (rotate + crop + filter) ──────────
      const cropPx = editTab === 'transform' ? croppedAreaPixels : null;
      const url    = await processImage(warpedUrl, cropPx, editRotate, editFilter);

      setPages(prev => prev.map((p, i) =>
        i === editingIndex
          ? { ...p, filter: editFilter, rotation: editRotate, edited: url, crop: cropPx ?? undefined, perspectivePoints: [...points] }
          : p
      ));
      setEditingIndex(null);
    } catch (e) {
      console.error('Save error:', e);
    } finally {
      setIsExporting(false);
    }
  };

  // ── Drag handlers ──────────────────────────────────────────
  const getContainerCoords = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    return {
      pct: {
        x: Math.max(0, Math.min(100, ((clientX - rect.left)  / rect.width)  * 100)),
        y: Math.max(0, Math.min(100, ((clientY - rect.top)   / rect.height) * 100)),
      },
      px: clientX - rect.left,
      py: clientY - rect.top,
    };
  }, []);

  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (activePoint === null) return;
    const pt = getContainerCoords(clientX, clientY);
    if (!pt) return;
    setPoints(prev => prev.map((p, i) => i === activePoint ? pt.pct : p));
    setHandlePx({ x: pt.px, y: pt.py });
  }, [activePoint, getContainerCoords]);

  const onMouseMove = useCallback((e: React.MouseEvent)  => handleDragMove(e.clientX, e.clientY), [handleDragMove]);
  const onTouchMove = useCallback((e: React.TouchEvent)  => { e.preventDefault(); handleDragMove(e.touches[0].clientX, e.touches[0].clientY); }, [handleDragMove]);
  const onDragEnd   = useCallback(() => { setActivePoint(null); setHandlePx(null); }, []);

  // ── Magnifier ──────────────────────────────────────────────
  // Key insight: the source image is displayed with object-fit:contain inside the container.
  // There will be letterbox/pillarbox padding. We need to account for that when computing
  // what region to show in the magnifier.
  const renderMagnifier = () => {
    if (activePoint === null || !handlePx || !containerRef.current || !perspImgRef.current || editingIndex === null) return null;

    const cEl   = containerRef.current;
    const iEl   = perspImgRef.current;
    const cRect = cEl.getBoundingClientRect();
    const cW    = cRect.width;
    const cH    = cRect.height;

    // Where the image is actually rendered inside the container
    const rendered = getContainRect(cW, cH, iEl.naturalWidth, iEl.naturalHeight);

    const hx = handlePx.x; // px within container div
    const hy = handlePx.y;

    // Position magnifier above the handle, centered on it horizontally
    const magLeft = Math.max(0, Math.min(cW - MAG_SIZE, hx - MAG_SIZE / 2));
    const magTop  = Math.max(0, Math.min(cH - MAG_SIZE, hy - MAG_SIZE - MAG_GAP));

    // The handle is at (hx, hy) in container px.
    // We need to show the image zoomed at that exact point.
    // Inside the magnifier circle (MAG_SIZE × MAG_SIZE), we render the image at MAG_ZOOM scale.
    // The displayed image in the magnifier has size: rendered.w * MAG_ZOOM × rendered.h * MAG_ZOOM.
    // We need to pan so that the point at (hx, hy) lands at the center of the magnifier.
    //
    // In the magnifier, the img element covers rendered.w*MAG_ZOOM × rendered.h*MAG_ZOOM px.
    // The letterbox offset in the container is (rendered.x, rendered.y).
    // Handle position within the rendered image: (hx - rendered.x, hy - rendered.y)
    // In zoomed space: zoom those by MAG_ZOOM
    // Offset to center: subtract half of MAG_SIZE

    const zoomedX = (hx - rendered.x) * MAG_ZOOM;
    const zoomedY = (hy - rendered.y) * MAG_ZOOM;

    const imgOffX = MAG_SIZE / 2 - zoomedX;
    const imgOffY = MAG_SIZE / 2 - zoomedY;

    return (
      <div
        className={styles.magnifier}
        style={{ left: magLeft, top: magTop, width: MAG_SIZE, height: MAG_SIZE }}
      >
        <img
          src={pages[editingIndex].original}
          style={{
            position: 'absolute',
            width:     rendered.w * MAG_ZOOM,
            height:    rendered.h * MAG_ZOOM,
            left:      imgOffX,
            top:       imgOffY,
            maxWidth:  'none',
            pointerEvents: 'none',
          }}
          alt="zoom"
          draggable={false}
        />
      </div>
    );
  };

  // ── Export ─────────────────────────────────────────────────
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
        Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `${exportName || 'scan'}.pdf` }).click();
      } else {
        const zip = new JSZip();
        pages.forEach((p, i) => zip.file(`page_${i+1}.jpg`, p.edited.split(',')[1], { base64: true }));
        const blob = await zip.generateAsync({ type: 'blob' });
        Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `${exportName || 'scan'}.zip` }).click();
      }
      setShowDownloadModal(false);
    } catch (e) { console.error(e); }
    finally { setIsExporting(false); }
  };

  // ──────────────────────────────────────────────────────────
  // CAMERA VIEW
  // ──────────────────────────────────────────────────────────
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
            {pages.length === 0 && <div className={styles.thumbEmpty}><ScanLine size={20} /></div>}
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

  // ──────────────────────────────────────────────────────────
  // REVIEW VIEW
  // ──────────────────────────────────────────────────────────
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
                      <button className={styles.smallBtn} onClick={() => openEditor(i)} title="Edit">
                        <PenLine size={13} />
                      </button>
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

      {/* Download Modal */}
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
                      <span className={styles.formatExt}>PDF</span><span className={styles.formatDesc}>Single file</span>
                    </button>
                    <button className={`${styles.formatOption} ${exportFormat === 'zip' ? styles.active : ''}`} onClick={() => setExportFormat('zip')}>
                      <span className={styles.formatExt}>ZIP</span><span className={styles.formatDesc}>Images folder</span>
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

      {/* Edit Overlay */}
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

                    {/* SVG polygon + edge lines in container % space */}
                    <svg className={styles.perspectiveSVG} viewBox="0 0 100 100" preserveAspectRatio="none">
                      <polygon points={points.map(p => `${p.x},${p.y}`).join(' ')} className={styles.perspectivePolygon} />
                      {[0,1,2,3].map(i => {
                        const a = points[i], b = points[(i+1)%4];
                        return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={styles.perspectiveLine} />;
                      })}
                    </svg>

                    {/* Corner handles */}
                    {points.map((p, i) => (
                      <div key={i}
                        className={`${styles.perspectiveHandle} ${activePoint === i ? styles.handleActive : ''}`}
                        style={{ left: `${p.x}%`, top: `${p.y}%` }}
                        onMouseDown={e => { e.preventDefault(); setActivePoint(i); setHandlePx(null); }}
                        onTouchStart={e => { e.preventDefault(); setActivePoint(i); setHandlePx(null); }}
                      >
                        <span className={styles.handleCornerIcon}>{['↖','↗','↘','↙'][i]}</span>
                      </div>
                    ))}

                    {renderMagnifier()}
                  </div>

                ) : editTab === 'transform' ? (
                  <Cropper image={pages[editingIndex].original} crop={crop} zoom={zoom}
                    rotation={editRotate} aspect={aspect}
                    onCropChange={setCrop} onZoomChange={setZoom}
                    onCropComplete={(_, px) => setCroppedAreaPixels(px)} objectFit="contain" />
                ) : (
                  <img src={pages[editingIndex].original} className={styles.editImgPreview}
                    style={{ filter: FILTERS.find(f => f.id === editFilter)?.css || '', transform: `rotate(${editRotate}deg)` }}
                    alt="Preview" />
                )}
              </div>

              <div className={styles.editToolsPanel}>
                {/* Tabs */}
                <div className={styles.toolTabs}>
                  {([
                    { id: 'warp',      icon: <Grid3x3 size={14} />, label: 'Warp' },
                    { id: 'filters',   icon: <Sliders size={14} />, label: 'Filters' },
                    { id: 'transform', icon: <Crop size={14} />,    label: 'Crop' },
                  ] as const).map(tab => (
                    <button key={tab.id}
                      className={`${styles.toolTab} ${editTab === tab.id ? styles.active : ''}`}
                      onClick={() => setEditTab(tab.id)}>
                      {tab.icon} {tab.label}
                    </button>
                  ))}
                </div>

                {editTab === 'warp' && (
                  <div className={styles.warpInstructions}>
                    <div className={styles.warpInstructionItem}>
                      <span className={styles.warpBadge}><Move size={13}/></span>
                      <span>Drag the <strong>4 corner handles</strong> onto the document's corners.</span>
                    </div>
                    <div className={styles.warpInstructionItem}>
                      <span className={styles.warpBadge}><ZoomIn size={13}/></span>
                      <span>Magnifier shows the exact pixel while dragging.</span>
                    </div>
                    <button className={styles.resetPointsBtn} onClick={() => setPoints(DEFAULT_POINTS)}>
                      <RotateCcw size={13} /> Reset corners
                    </button>
                  </div>
                )}

                {editTab === 'filters' && (
                  <div>
                    <p className={styles.sectionLabel}>Color Enhancement</p>
                    <div className={styles.filterGrid}>
                      {FILTERS.map(f => (
                        <button key={f.id}
                          className={`${styles.filterBtn} ${editFilter === f.id ? styles.active : ''}`}
                          onClick={() => setEditFilter(f.id)}>
                          <span className={styles.filterIcon}>{f.icon}</span>{f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {editTab === 'transform' && (
                  <div className={styles.transformPanel}>
                    <div>
                      <p className={styles.sectionLabel}>Rotate</p>
                      <button className={styles.toolActionBtn} onClick={() => setEditRotate(r => (r + 90) % 360)}>
                        <RotateCcw size={15} /> Rotate 90°
                      </button>
                    </div>
                    <div>
                      <p className={styles.sectionLabel}>Aspect Ratio</p>
                      <div className={styles.aspectGrid}>
                        {[
                          { label: 'Free',   value: undefined, preview: { w: 24, h: 18 } },
                          { label: 'Square', value: 1,         preview: { w: 18, h: 18 } },
                          { label: '3:4',    value: 3/4,       preview: { w: 14, h: 18 } },
                          { label: 'Auto',   value: -1 as any, preview: { w: 22, h: 16 } },
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
                      Pinch to zoom · Drag to reposition
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