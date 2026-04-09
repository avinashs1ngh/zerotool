'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import {
  PenTool, Upload, Download, Type,
  Pen, Eraser, ChevronLeft, ChevronRight,
  Loader2, X, Check, FileX, RotateCcw,
  Move, Trash2, ArrowLeft
} from 'lucide-react';
import styles from './PDFEditor.module.scss';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type ElementType = 'text' | 'signature';

interface PdfElement {
  id: number;
  type: ElementType;
  content: string;         // text content or data URL for signature
  x: number;
  y: number;
  fontSize: number;
  color: string;
  pageIndex: number;
  width?: number;
  height?: number;
}

type ActiveTool = 'text' | 'signature' | 'select' | null;

export default function PDFEditorClient() {
  // ─── PDF State ────────────────────────────────────────────────
  const [file, setFile]           = useState<File | null>(null);
  const [pdfLibDoc, setPdfLibDoc] = useState<PDFDocument | null>(null);
  const [pdfJsDoc, setPdfJsDoc]   = useState<any>(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pageSize, setPageSize]   = useState({ width: 800, height: 1131 });

  // ─── Elements ─────────────────────────────────────────────────
  const [elements, setElements]   = useState<PdfElement[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // ─── Active Tool ──────────────────────────────────────────────
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);

  // ─── Inline Text Input ────────────────────────────────────────
  const [pendingText, setPendingText] = useState('');
  const [textPosition, setTextPosition] = useState<{ x: number; y: number } | null>(null);
  const [textFontSize, setTextFontSize] = useState(18);
  const [textColor, setTextColor] = useState('#000000');
  const textInputRef = useRef<HTMLInputElement>(null);

  // ─── Signature ────────────────────────────────────────────────
  const [showSignModal, setShowSignModal] = useState(false);
  const sigCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  // ─── Dragging ─────────────────────────────────────────────────
  const dragging = useRef<{ id: number; startX: number; startY: number; origX: number; origY: number } | null>(null);

  // ─── Refs ─────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasAreaRef = useRef<HTMLDivElement>(null);

  // ══════════════════════════════════════════════
  // PDF Loading & Rendering
  // ══════════════════════════════════════════════
  const loadPdf = async (selectedFile: File) => {
    setIsLoading(true);
    setElements([]);
    setSelectedId(null);
    setActiveTool(null);
    setPendingText('');
    setTextPosition(null);
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdfLib = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      setPdfLibDoc(pdfLib);
      setPageCount(pdfLib.getPageCount());

      const loadingTask = pdfjs.getDocument({ data: arrayBuffer.slice(0) });
      const doc = await loadingTask.promise;
      setPdfJsDoc(doc);
      setCurrentPage(0);
    } catch (err) {
      console.error('PDF load error:', err);
      alert('Failed to load this PDF. It may be corrupted or heavily encrypted.');
      setFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const f = e.target.files[0];
      setFile(f);
      loadPdf(f);
    }
  };

  const renderPage = useCallback(async (pageIdx: number) => {
    if (!pdfJsDoc || !previewCanvasRef.current || !canvasAreaRef.current) return;
    try {
      const page = await pdfJsDoc.getPage(pageIdx + 1);

      // Step 1: Get natural page dimensions at scale=1
      const baseViewport = page.getViewport({ scale: 1 });

      // Step 2: Calculate available width (container - padding)
      const availableWidth = canvasAreaRef.current.offsetWidth - 48; // 24px padding each side
      const maxWidth = Math.min(availableWidth, 900); // cap at 900px on large screens

      // Step 3: Compute render scale to fit exactly
      const renderScale = maxWidth / baseViewport.width;

      const viewport = page.getViewport({ scale: renderScale });
      const canvas = previewCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width  = viewport.width;
      canvas.height = viewport.height;
      setPageSize({ width: viewport.width, height: viewport.height });
      await page.render({ canvasContext: ctx, viewport }).promise;
    } catch (err) {
      console.error('Render error:', err);
    }
  }, [pdfJsDoc]);

  // Re-render on resize too
  useEffect(() => {
    if (!pdfJsDoc) return;
    const onResize = () => renderPage(currentPage);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [pdfJsDoc, currentPage, renderPage]);

  useEffect(() => {
    if (pdfJsDoc) renderPage(currentPage);
  }, [pdfJsDoc, currentPage, renderPage]);

  // ══════════════════════════════════════════════
  // Canvas Click → Place Element
  // ══════════════════════════════════════════════
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    if (activeTool !== 'text') return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setTextPosition({ x, y });
    setPendingText('');
    setTimeout(() => textInputRef.current?.focus(), 50);
  };

  const commitText = () => {
    if (!textPosition || !pendingText.trim()) {
      setTextPosition(null);
      return;
    }
    setElements(prev => [...prev, {
      id: Date.now(),
      type: 'text',
      content: pendingText.trim(),
      x: textPosition.x,
      y: textPosition.y,
      fontSize: textFontSize,
      color: textColor,
      pageIndex: currentPage,
    }]);
    setTextPosition(null);
    setPendingText('');
  };

  const cancelText = () => {
    setTextPosition(null);
    setPendingText('');
  };

  // ══════════════════════════════════════════════
  // Drag & Drop for Elements
  // ══════════════════════════════════════════════
  const onElementMouseDown = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setSelectedId(id);
    const el = elements.find(el => el.id === id);
    if (!el) return;
    dragging.current = { id, startX: e.clientX, startY: e.clientY, origX: el.x, origY: el.y };
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        if (document.activeElement?.tagName === 'INPUT') return;
        setElements(prev => prev.filter(el => el.id !== selectedId));
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - dragging.current.startX;
      const dy = e.clientY - dragging.current.startY;
      setElements(prev => prev.map(el =>
        el.id === dragging.current!.id
          ? { ...el, x: Math.max(0, dragging.current!.origX + dx), y: Math.max(0, dragging.current!.origY + dy) }
          : el
      ));
    };
    const onUp = () => { dragging.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  // Touch dragging for mobile
  const onElementTouchStart = (e: React.TouchEvent, id: number) => {
    e.stopPropagation();
    setSelectedId(id);
    const el = elements.find(el => el.id === id);
    if (!el) return;
    const t = e.touches[0];
    dragging.current = { id, startX: t.clientX, startY: t.clientY, origX: el.x, origY: el.y };
  };

  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      if (!dragging.current) return;
      const t = e.touches[0];
      const dx = t.clientX - dragging.current.startX;
      const dy = t.clientY - dragging.current.startY;
      setElements(prev => prev.map(el =>
        el.id === dragging.current!.id
          ? { ...el, x: Math.max(0, dragging.current!.origX + dx), y: Math.max(0, dragging.current!.origY + dy) }
          : el
      ));
    };
    const onTouchEnd = () => { dragging.current = null; };
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  // ══════════════════════════════════════════════
  // Signature Canvas
  // ══════════════════════════════════════════════
  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawing.current = true;
    const canvas = sigCanvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    lastPos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !sigCanvasRef.current || !lastPos.current) return;
    const canvas = sigCanvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.beginPath();
    ctx.strokeStyle = '#1A1A1A';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastPos.current = { x, y };
  };
  const stopDraw = () => { isDrawing.current = false; lastPos.current = null; };

  // Touch support for signature
  const startDrawTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    isDrawing.current = true;
    const canvas = sigCanvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const t = e.touches[0];
    lastPos.current = { x: t.clientX - rect.left, y: t.clientY - rect.top };
  };
  const drawTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing.current || !lastPos.current) return;
    const canvas = sigCanvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const rect = canvas.getBoundingClientRect();
    const t = e.touches[0];
    const x = t.clientX - rect.left;
    const y = t.clientY - rect.top;
    ctx.beginPath();
    ctx.strokeStyle = '#1A1A1A';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastPos.current = { x, y };
  };

  const clearSignatureCanvas = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const commitSignature = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    // Place at centre of page
    setElements(prev => [...prev, {
      id: Date.now(),
      type: 'signature',
      content: dataUrl,
      x: pageSize.width / 2 - 120,
      y: pageSize.height / 2 - 40,
      fontSize: 18,
      color: '#000000',
      pageIndex: currentPage,
      width: 240,
      height: 80,
    }]);
    setShowSignModal(false);
    clearSignatureCanvas();
  };

  // ══════════════════════════════════════════════
  // Clear & Delete
  // ══════════════════════════════════════════════
  const clearPage = () => {
    if (!confirm('Remove all annotations from THIS page?')) return;
    setElements(prev => prev.filter(el => el.pageIndex !== currentPage));
    setSelectedId(null);
  };

  const clearAll = () => {
    if (!confirm('Remove all annotations from ALL pages?')) return;
    setElements([]);
    setSelectedId(null);
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setElements(prev => prev.filter(el => el.id !== selectedId));
    setSelectedId(null);
  };

  const changePdf = () => {
    if (elements.length > 0 && !confirm('You have unsaved annotations. Change PDF anyway?')) return;
    setFile(null);
    setPdfLibDoc(null);
    setPdfJsDoc(null);
    setElements([]);
    setSelectedId(null);
    setActiveTool(null);
    setTextPosition(null);
  };

  // ══════════════════════════════════════════════
  // Save PDF
  // ══════════════════════════════════════════════
  const savePdf = async () => {
    if (!pdfLibDoc) return;
    setIsProcessing(true);
    try {
      const pages = pdfLibDoc.getPages();
      const helvetica = await pdfLibDoc.embedFont(StandardFonts.Helvetica);

      for (const el of elements) {
        const page = pages[el.pageIndex];
        const { width: pw, height: ph } = page.getSize();
        // Scale factor: rendered (preview) vs actual PDF dimensions
        const scaleX = pw / pageSize.width;
        const scaleY = ph / pageSize.height;

        if (el.type === 'text') {
          const hex = el.color.replace('#', '');
          const r = parseInt(hex.substring(0, 2), 16) / 255;
          const g = parseInt(hex.substring(2, 4), 16) / 255;
          const b = parseInt(hex.substring(4, 6), 16) / 255;
          page.drawText(el.content, {
            x: el.x * scaleX,
            y: ph - (el.y * scaleY) - (el.fontSize * scaleY),
            size: el.fontSize * scaleX,
            font: helvetica,
            color: rgb(r, g, b),
          });
        }

        if (el.type === 'signature') {
          const imgBytes = await fetch(el.content).then(r => r.arrayBuffer());
          const pngImage = await pdfLibDoc.embedPng(imgBytes);
          const w = (el.width ?? 200) * scaleX;
          const h = (el.height ?? 80) * scaleY;
          page.drawImage(pngImage, {
            x: el.x * scaleX,
            y: ph - (el.y * scaleY) - h,
            width: w,
            height: h,
          });
        }
      }

      const pdfBytes = await pdfLibDoc.save();
      // Use "as any" to bypass strict Uint8Array/SharedArrayBuffer checks in TS
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `edited_${file?.name ?? 'document.pdf'}`;
      link.click();
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ══════════════════════════════════════════════
  // Render
  // ══════════════════════════════════════════════
  const pageElements = elements.filter(el => el.pageIndex === currentPage);

  return (
    <div className={styles.container}>
      {/* ── Header ───────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <Link href="/tools/pdf" className={styles.backBtn}>
            <ArrowLeft size={22} />
          </Link>
          <PenTool size={28} className={styles.icon} />
          <div>
            <h1>PDF Editor</h1>
            <p>Add text, signatures, and annotations offline — nothing leaves your device.</p>
          </div>
        </div>
        {file && (
          <button className={styles.changePdfBtn} onClick={changePdf}>
            <FileX size={16} /> Change PDF
          </button>
        )}
      </header>

      {/* ── Upload Screen ─────────────────────────── */}
      {!file ? (
        <div
          className={styles.uploadArea}
          onClick={() => document.getElementById('pdf-edit-upload')?.click()}
        >
          <input
            type="file"
            id="pdf-edit-upload"
            accept=".pdf"
            style={{ display: 'none' }}
            onChange={onFileChange}
          />
          <Upload size={48} color="var(--accent-primary)" />
          <h3>Select PDF to Edit</h3>
          <p>Click or drag &amp; drop · Max 50 MB</p>
        </div>
      ) : (
        <div className={styles.editorLayout}>

          {/* ── Left Panel ────────────────────────── */}
          <aside className={styles.panel}>
            <div className={styles.panelSection}>
              <p className={styles.panelLabel}>Tools</p>
              <div className={styles.toolList}>
                <button
                  className={`${styles.toolBtn} ${activeTool === 'text' ? styles.toolActive : ''}`}
                  onClick={() => { setActiveTool(activeTool === 'text' ? null : 'text'); setTextPosition(null); }}
                >
                  <Type size={18} />
                  <span>Add Text</span>
                  {activeTool === 'text' && <span className={styles.toolHint}>Click on PDF</span>}
                </button>
                <button
                  className={styles.toolBtn}
                  onClick={() => setShowSignModal(true)}
                >
                  <Pen size={18} />
                  <span>Add Signature</span>
                </button>
                <button
                  className={`${styles.toolBtn} ${styles.toolDanger}`}
                  onClick={clearPage}
                >
                  <Eraser size={18} />
                  <span>Clear This Page</span>
                </button>
                <button
                  className={`${styles.toolBtn} ${styles.toolDanger}`}
                  onClick={clearAll}
                >
                  <Trash2 size={18} />
                  <span>Clear All Pages</span>
                </button>
              </div>
            </div>

            {activeTool === 'text' && (
              <div className={styles.panelSection}>
                <p className={styles.panelLabel}>Text Options</p>
                <div className={styles.textOptions}>
                  <label>Font Size</label>
                  <input
                    type="number"
                    min={8}
                    max={96}
                    value={textFontSize}
                    onChange={e => setTextFontSize(Number(e.target.value))}
                    className={styles.numInput}
                  />
                  <label>Color</label>
                  <div className={styles.colorRow}>
                    <input
                      type="color"
                      value={textColor}
                      onChange={e => setTextColor(e.target.value)}
                      className={styles.colorInput}
                    />
                    <span>{textColor}</span>
                  </div>
                </div>
              </div>
            )}

            {selectedId && (
              <div className={styles.panelSection}>
                <button className={`${styles.toolBtn} ${styles.toolDanger}`} onClick={deleteSelected}>
                  <Trash2 size={18} />
                  <span>Delete Selected</span>
                </button>
              </div>
            )}

            <div className={styles.panelFooter}>
              <Button variant="primary" size="lg" fullWidth onClick={savePdf} isLoading={isProcessing}>
                <Download size={18} />
                Save &amp; Download
              </Button>
            </div>
          </aside>

          <main className={styles.canvasArea} ref={canvasAreaRef}>
            <div
              className={`${styles.canvasContainer} ${activeTool === 'text' ? styles.textCursor : ''}`}
              style={{
                width: pageSize.width,
                height: pageSize.height,
              }}
              ref={containerRef}
              onClick={handleCanvasClick}
            >
                <canvas ref={previewCanvasRef} className={styles.pdfCanvas} />

                {isLoading && (
                  <div className={styles.loaderOverlay}>
                    <Loader2 className={styles.spin} size={48} />
                    <p>Rendering PDF…</p>
                  </div>
                )}

                {/* Inline text input */}
                {textPosition && (
                  <div
                    className={styles.inlineInputWrap}
                    style={{ left: textPosition.x, top: textPosition.y }}
                    onClick={e => e.stopPropagation()}
                  >
                    <input
                      ref={textInputRef}
                      className={styles.inlineInput}
                      style={{ fontSize: textFontSize, color: textColor }}
                      value={pendingText}
                      onChange={e => setPendingText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') commitText();
                        if (e.key === 'Escape') cancelText();
                      }}
                      placeholder="Type here…"
                    />
                    <div className={styles.inlineActions}>
                      <button className={styles.inlineConfirm} onClick={commitText} title="Confirm (Enter)"><Check size={14} /></button>
                      <button className={styles.inlineCancel} onClick={cancelText} title="Cancel (Esc)"><X size={14} /></button>
                    </div>
                  </div>
                )}

                {/* Placed elements */}
                {pageElements.map(el => (
                  <div
                    key={el.id}
                    className={`${styles.floatingElement} ${selectedId === el.id ? styles.selected : ''}`}
                    style={{ left: el.x, top: el.y }}
                    onMouseDown={e => onElementMouseDown(e, el.id)}
                    onTouchStart={e => onElementTouchStart(e, el.id)}
                    onClick={e => { e.stopPropagation(); setSelectedId(el.id); }}
                  >
                    <div className={styles.dragHandle}><Move size={12} /></div>

                    {el.type === 'text' && (
                      <span style={{ fontSize: el.fontSize, color: el.color }}>{el.content}</span>
                    )}
                    {el.type === 'signature' && (
                      <img
                        src={el.content}
                        alt="Signature"
                        style={{ width: el.width, height: el.height, display: 'block' }}
                        draggable={false}
                      />
                    )}

                    <button
                      className={styles.removeBtn}
                      onClick={e => { e.stopPropagation(); removeElement(el.id); }}
                      title="Remove"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
            </div>

            {/* Page navigation below canvas */}
            {pageCount > 1 && (
              <div className={styles.pageNav}>
                <button
                  className={styles.pageNavBtn}
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  <ChevronLeft size={20} />
                </button>
                <span>Page {currentPage + 1} of {pageCount}</span>
                <button
                  className={styles.pageNavBtn}
                  disabled={currentPage === pageCount - 1}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </main>
        </div>
      )}

      {/* ── Signature Modal ───────────────────────── */}
      {showSignModal && (
        <div className={styles.modalOverlay} onClick={() => setShowSignModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Draw Your Signature</h3>
              <button className={styles.modalClose} onClick={() => setShowSignModal(false)}><X size={20} /></button>
            </div>
            <p className={styles.modalHint}>Use your mouse or finger to draw in the box below.</p>
            <div className={styles.sigPadWrap}>
              <canvas
                ref={sigCanvasRef}
                width={500}
                height={160}
                className={styles.sigCanvas}
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={stopDraw}
                onMouseLeave={stopDraw}
                onTouchStart={startDrawTouch}
                onTouchMove={drawTouch}
                onTouchEnd={stopDraw}
              />
            </div>
            <div className={styles.modalActions}>
              <button className={styles.clearSigBtn} onClick={clearSignatureCanvas}>
                <RotateCcw size={16} /> Clear
              </button>
              <div style={{ flex: 1 }} />
              <Button variant="ghost" onClick={() => setShowSignModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={commitSignature}>
                <Check size={16} /> Add to PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function removeElement(id: number) {
    setElements(prev => prev.filter(el => el.id !== id));
    if (selectedId === id) setSelectedId(null);
  }
}
