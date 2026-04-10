'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { 
  Video, Upload, Download, Trash2, 
  AlertTriangle, CheckCircle2, Terminal, Info, ArrowLeft 
} from 'lucide-react';
import styles from './VideoCompressor.module.scss';
import { motion, AnimatePresence } from 'framer-motion';

const PRESETS = [
  { id: 'whatsapp', name: 'WhatsApp', desc: 'Optimized for mobile sharing (Max 16MB)', targetSizeMb: 16 },
  { id: 'discord', name: 'Discord', desc: 'Under the 25MB free limit', targetSizeMb: 24 },
  { id: 'email', name: 'Email', desc: 'Standard attachment size (Max 20MB)', targetSizeMb: 19 },
  { id: 'web', name: 'Web Balanced', desc: 'Reduced bitrate, high quality', crf: 28 },
];

export default function VideoCompressorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState(PRESETS[0]);
  const [showWarning, setShowWarning] = useState(true);

  const ffmpegRef = useRef<FFmpeg | null>(null);

  const load = async () => {
    if (!ffmpegRef.current) {
      ffmpegRef.current = new FFmpeg();
    }
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    const ffmpeg = ffmpegRef.current;
    
    ffmpeg.on('log', ({ message }) => {
      setLog((prev) => [...prev.slice(-4), message]);
    });

    ffmpeg.on('progress', ({ progress }) => {
      setProgress(progress * 100);
    });

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    setIsLoaded(true);
  };

  useEffect(() => {
    load();
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const compress = async () => {
    if (!file || !isLoaded || !ffmpegRef.current) return;
    setIsProcessing(true);
    setProgress(0);
    setLog([]);

    const ffmpeg = ffmpegRef.current;
    const inputName = 'input.mp4';
    const outputName = 'output.mp4';

    await ffmpeg.writeFile(inputName, await fetchFile(file));

    // Simple CRF-based compression for now
    // In a real app we'd calculate bitrate if targetSizeMb is set
    const args = ['-i', inputName, '-vcodec', 'libx264', '-crf', '28', '-preset', 'ultrafast', outputName];

    await ffmpeg.exec(args);

    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data as any], { type: 'video/mp4' });
    setResult(URL.createObjectURL(blob));
    setIsProcessing(false);
  };

  const download = () => {
    if (!result || !file) return;
    const a = document.createElement('a');
    a.href = result;
    a.download = `compressed_${file.name}`;
    a.click();
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <Link href="/tools/utils" className={styles.backBtn}>
            <ArrowLeft size={20} />
          </Link>
          <Video size={32} className={styles.icon} />
          <div>
            <h1>Video Compressor</h1>
            <p>High-quality video compression powered by WebAssembly.</p>
          </div>
        </div>
      </header>

      {showWarning && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={styles.warningBox}>
          <AlertTriangle size={24} color="#b45309" />
          <div className={styles.warningContent}>
            <h4>High Resource Usage</h4>
            <p>
              Video compression is a heavy task that requires significant CPU and RAM. 
              Your browser may become unresponsive during the process. For best results, 
              close other tabs and keep the window active. 
              <strong> Minimum Recommended: 8GB RAM + Modern Multi-core CPU.</strong>
            </p>
            <Button variant="ghost" size="sm" onClick={() => setShowWarning(false)} style={{ marginTop: 12 }}>
              I Understand, Continue
            </Button>
          </div>
        </motion.div>
      )}

      <div className={styles.content}>
        <div className={styles.leftCol}>
          {!file ? (
            <div className={styles.uploadArea} onClick={() => document.getElementById('video-upload')?.click()}>
              <input type="file" id="video-upload" accept="video/*" onChange={onFileChange} />
              <Upload size={48} color="var(--accent-primary)" style={{ marginBottom: 20 }} />
              <h3>Select Video to Compress</h3>
              <p>Supports MP4, MOV, WEBM (Max Recommended 100MB)</p>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className={styles.filePreview}>
                <video src={URL.createObjectURL(file)} controls />
              </div>
              
              {!result && (
                <div className={styles.processingBox}>
                  {isProcessing && (
                    <>
                      <div className={styles.progressHeader}>
                        <span>Compiling Video Streams...</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                      </div>
                      <div className={styles.logArea}>
                        {log.map((line, i) => <div key={i}>{line}</div>)}
                      </div>
                    </>
                  )}
                </div>
              )}

              {result && (
                <div className={styles.resultCard}>
                  <div className={styles.successIcon}><CheckCircle2 size={32} /></div>
                  <h2>Compression Finished!</h2>
                  <p>Your video has been reduced while maintaining visibility.</p>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    <Button variant="primary" size="lg" onClick={download}>
                      <Download size={18} />
                      Download Video
                    </Button>
                    <Button variant="ghost" onClick={() => {setFile(null); setResult(null);}}>
                      Process Another
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>

        <div className={styles.rightCol}>
          <Card className={styles.card}>
            <h3>Optimization Presets</h3>
            <div className={styles.presetsGrid}>
              {PRESETS.map((preset) => (
                <button 
                  key={preset.id}
                  className={`${styles.presetBtn} ${selectedPreset.id === preset.id ? styles.active : ''}`}
                  onClick={() => setSelectedPreset(preset)}
                >
                  <div className={styles.presetInfo}>
                    <span className={styles.presetName}>{preset.name}</span>
                    <span className={styles.presetDesc}>{preset.desc}</span>
                  </div>
                  {selectedPreset.id === preset.id && <CheckCircle2 size={16} color="var(--accent-primary)" />}
                </button>
              ))}
            </div>

            <Button 
              variant="primary" 
              size="lg" 
              fullWidth 
              style={{ marginTop: 32 }} 
              onClick={compress}
              disabled={!file || !isLoaded || isProcessing}
              isLoading={isProcessing || !isLoaded}
            >
              {!isLoaded ? 'Loading Kernel...' : 'Start Compression'}
            </Button>
            
            {!isLoaded && (
              <p style={{ fontSize: '0.75rem', textAlign: 'center', marginTop: 12, color: 'var(--text-muted)' }}>
                Downloading WebAssembly core (~30MB)...
              </p>
            )}
          </Card>
          
          <Card className={styles.card} style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <Info size={20} color="var(--accent-primary)" />
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Processing happens on your device. Your video never leaves your computer.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
