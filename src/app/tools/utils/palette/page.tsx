'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Palette, ArrowLeft, RefreshCw, Copy, Check, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './Palette.module.scss';

interface ColorInfo {
  hex: string;
  locked: boolean;
}

export default function ColorPalettePage() {
  const [colors, setColors] = useState<ColorInfo[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  const generateColor = () => {
    const hex = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    return hex.toUpperCase();
  };

  const generatePalette = useCallback(() => {
    if (colors.length === 0) {
      setColors(Array.from({ length: 5 }, () => ({ hex: generateColor(), locked: false })));
      return;
    }

    setColors(prev => prev.map(c => c.locked ? c : { hex: generateColor(), locked: false }));
  }, [colors.length]);

  useEffect(() => {
    generatePalette();
  }, []); // Initial run only

  const toggleLock = (index: number) => {
    setColors(prev => prev.map((c, i) => i === index ? { ...c, locked: !c.locked } : c));
  };

  const handleCopy = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopied(hex);
    setTimeout(() => setCopied(null), 2000);
  };

  const getContrastColor = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? '#000000' : '#ffffff';
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <Link href="/tools/utils" className={styles.backBtn}>
            <ArrowLeft size={24} />
          </Link>
          <Palette size={32} className={styles.icon} />
          <div>
            <h1>Color Palette</h1>
            <p>Generate beautiful, harmonious color schemes for your next project.</p>
          </div>
        </div>
      </header>

      <div className={styles.paletteGrid}>
        {colors.map((color, i) => (
          <motion.div 
            key={i}
            className={styles.colorColumn}
            style={{ backgroundColor: color.hex }}
            onClick={() => handleCopy(color.hex)}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
          >
            <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => toggleLock(i)}
                style={{ color: getContrastColor(color.hex), background: 'rgba(0,0,0,0.2)' }}
              >
                {color.locked ? <Lock size={16} /> : <Unlock size={16} />}
              </Button>
            </div>
            <span className={styles.hex} style={{ color: getContrastColor(color.hex) }}>
              {color.hex}
            </span>
          </motion.div>
        ))}
      </div>

      <div className={styles.controls}>
        <div className={styles.hint}>
          <p>Click a color to copy. Space to regenerate (on desktop).</p>
        </div>
        <div className={styles.exportOptions}>
          <Button variant="primary" size="lg" className={styles.mainAction} onClick={generatePalette}>
            <RefreshCw size={18} />
            Generate New
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {copied && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5, x: '-50%' }}
            animate={{ opacity: 1, scale: 1, x: '-50%' }}
            exit={{ opacity: 0, scale: 0.5, x: '-50%' }}
            className={styles.copyFeedback}
          >
            <Check size={18} /> {copied} Copied!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
