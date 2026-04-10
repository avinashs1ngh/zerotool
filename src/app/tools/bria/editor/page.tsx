'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Maximize2, Layers, Wand2, Eraser, ArrowLeft,
  Upload, Download, Loader2, BrainCircuit,
  AlertCircle, RefreshCcw
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './BriaEditor.module.scss';

const MODES = [
  { id: 'enhance',    name: 'Enhance',    icon: <Maximize2 size={14} />, endpoint: 'image/edit/enhance' },
  { id: 'expand',     name: 'Expand',     icon: <Layers size={14} />,    endpoint: 'image/edit/expand' },
  { id: 'replace_bg', name: 'Replace BG', icon: <Wand2 size={14} />,     endpoint: 'image/edit/replace_background' },
  { id: 'remove_bg',  name: 'Remove BG',  icon: <Eraser size={14} />,    endpoint: 'image/edit/remove_background' },
];

const RATIOS = ['2:3', '3:2', '1:1', '16:9', '9:16'];

function EditorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const modeParam = searchParams.get('mode') || 'enhance';

  const [mode, setMode] = useState(modeParam);
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [ratio, setRatio] = useState('1:1');
  const [resolution, setResolution] = useState('2MP');

  useEffect(() => {
    if (MODES.find(m => m.id === modeParam)) setMode(modeParam);
  }, [modeParam]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setImage(reader.result as string); setResult(null); setError(null); };
    reader.readAsDataURL(file);
    // Reset so same file can be selected again after "Change Image"
    e.target.value = '';
  };

  const pickFile = () => document.getElementById('bria-upload')?.click();

  const handleProcess = async () => {
    if (!image) return;
    setIsProcessing(true); setError(null); setResult(null);
    const activeMode = MODES.find(m => m.id === mode)!;
    try {
      const body: any = { image, sync: true };
      if (mode === 'replace_bg') { body.prompt = prompt || 'professional studio background'; body.mode = 'high_control'; }
      else if (mode === 'expand') { body.aspect_ratio = ratio; }
      else if (mode === 'enhance') { body.resolution = resolution; }

      const res = await fetch(`/api/ai/bria/${activeMode.endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.result?.image_url) {
        // Proxy through our server to avoid Referer header issues with signed CloudFront URLs
        const proxied = `/api/ai/bria-img?url=${encodeURIComponent(data.result.image_url)}`;
        setResult(proxied);
      } else {
        throw new Error(data.error?.message || 'Processing failed');
      }
    } catch (err: any) { setError(err.message); }
    finally { setIsProcessing(false); }
  };

  const hasConfig = mode !== 'remove_bg';

  return (
    <div className={styles.container}>
      {/* Compact header */}
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <Link href="/tools/bria" className={styles.backBtn}><ArrowLeft size={18} /></Link>
          <BrainCircuit size={24} className={styles.icon} />
          <div>
            <h1>AI Studio Editor</h1>
            <p>Enhance, expand, and manipulate images with Bria AI.</p>
          </div>
        </div>
      </header>

      {/* Mode pill tab bar — single horizontal row, swipeable */}
      <div className={styles.modeBar}>
        {MODES.map(m => (
          <button
            key={m.id}
            className={`${styles.modeTab} ${mode === m.id ? styles.active : ''}`}
            onClick={() => { setMode(m.id); setResult(null); router.push(`/tools/bria/editor?mode=${m.id}`); }}
          >
            {m.icon}
            <span>{m.name}</span>
          </button>
        ))}
      </div>

      {/* Main layout — stacks on mobile, sidebar on desktop */}
      <div className={styles.editorLayout}>

        {/* Config panel — only visible when mode has options */}
        {hasConfig && (
          <div className={styles.configPanel}>
            <div className={styles.configLabel}>Configuration</div>

            {mode === 'replace_bg' && (
              <div className={styles.optGroup}>
                <span className={styles.optLabel}>Scene Prompt</span>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="e.g. studio, parking lot, beach sunset..."
                />
              </div>
            )}

            {mode === 'expand' && (
              <div className={styles.optGroup}>
                <span className={styles.optLabel}>Aspect Ratio</span>
                <div className={styles.ratioGrid}>
                  {RATIOS.map(r => (
                    <button key={r} className={ratio === r ? styles.active : ''} onClick={() => setRatio(r)}>{r}</button>
                  ))}
                </div>
              </div>
            )}

            {mode === 'enhance' && (
              <div className={styles.optGroup}>
                <span className={styles.optLabel}>Target Quality</span>
                <select value={resolution} onChange={e => setResolution(e.target.value)}>
                  <option value="2MP">2MP — Standard</option>
                  <option value="4MP">4MP — Higher</option>
                  <option value="HD">HD+ Precision</option>
                </select>
              </div>
            )}

            <Button variant="primary" fullWidth onClick={handleProcess} disabled={isProcessing || !image} className={styles.executeBtn}>
              {isProcessing ? <><Loader2 size={16} className="animate-spin" /> Processing…</> : 'Run Transformation'}
            </Button>
          </div>
        )}

        {/* Remove BG — no config, just a button + hint */}
        {!hasConfig && (
          <div className={styles.configPanel}>
            <div className={styles.configLabel}>Ready</div>
            <Button variant="primary" fullWidth onClick={handleProcess} disabled={isProcessing || !image} className={styles.executeBtn}>
              {isProcessing ? <><Loader2 size={16} className="animate-spin" /> Removing…</> : 'Remove Background'}
            </Button>
             </div>
        )}

        {/* Central workspace */}
        <div className={styles.stage}>
          <input type="file" id="bria-upload" hidden onChange={handleFileChange} accept="image/*" />

          <AnimatePresence mode="wait">
            {/* No image yet — drop zone */}
            {!image && !result && !isProcessing && (
              <motion.div key="drop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className={styles.dropZone} onClick={pickFile}
              >
                <div className={styles.dropIcon}><Upload size={26} /></div>
                <h3>Upload Image</h3>
                <p>Tap to choose a photo from your device</p>
              </motion.div>
            )}

            {/* Processing */}
            {isProcessing && (
              <motion.div key="proc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className={styles.processingBox}
              >
                <div className={styles.scanLine} />
                <RefreshCcw size={34} className="animate-spin" style={{ opacity: 0.5 }} />
                <p>Synthesizing</p>
              </motion.div>
            )}

            {/* Image loaded, not processing */}
            {!isProcessing && (image || result) && (
              <motion.div key="result" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                className={styles.resultBox}
              >
                <img
                  src={result || image!}
                  alt="Output"
                  className={styles.resultImg}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    // Fallback: force display even if image fails
                    const img = e.target as HTMLImageElement;
                    img.style.minHeight = '180px';
                    img.style.background = '#1a1a2e';
                  }}
                />
                <div className={styles.resultActions}>
                  {result ? (
                    <Button variant="glass" size="sm" onClick={() => window.open(result, '_blank')}>
                      <Download size={15} className="mr-1" /> Download
                    </Button>
                  ) : null}
                  <Button variant="secondary" size="sm" onClick={() => {
                    setImage(null);
                    setResult(null);
                    // Also clear the file input so the same file triggers onChange again
                    const inp = document.getElementById('bria-upload') as HTMLInputElement;
                    if (inp) inp.value = '';
                  }}>
                    Change Image
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.div className={styles.errorBox} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BriaEditorPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Loader2 size={36} className="animate-spin" style={{ color: 'var(--accent-purple)' }} />
      </div>
    }>
      <EditorContent />
    </Suspense>
  );
}
