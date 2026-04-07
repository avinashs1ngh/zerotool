'use client';

import React from 'react';
import Link from 'next/link';
import { ImageIcon, Shrink, Maximize, Repeat, Scissors, Wand2, FileText } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { motion } from 'framer-motion';
import styles from '../Category.module.scss';

const IMAGE_TOOLS = [
  {
    title: 'Image Compressor',
    desc: 'Reduce file size of JPG, PNG, and WebP images while keeping quality.',
    icon: <Shrink size={28} />,
    href: '/tools/image/compress',
    color: 'var(--accent-cyan)'
  },
  {
    title: 'Resize / Crop',
    desc: 'Change image dimensions or crop specific areas for better focus.',
    icon: <Maximize size={28} />,
    href: '/tools/image/resize',
    color: 'var(--accent-purple)'
  },
  {
    title: 'Format Converter',
    desc: 'Convert images instantly between PNG, JPG, WebP, and AVIF.',
    icon: <Repeat size={28} />,
    href: '/tools/image/convert',
    color: 'var(--accent-green)'
  },
  {
    title: 'Image to PDF',
    desc: 'Convert multiple JPG and PNG images into a single PDF document.',
    icon: <FileText size={28} />,
    href: '/tools/pdf/image-to-pdf',
    color: 'var(--accent-rose)'
  }
];

export default function ImageCategoryPage() {
  return (
    <div className={styles.categoryPage}>
      <header className={styles.header}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className={styles.breadcrumb}>
            <Link href="/">Home</Link> / <span>Image Tools</span>
          </div>
          <h1>Image Tools</h1>
          <p>Professional image optimization and editing tools that run 100% on your local machine.</p>
        </motion.div>
      </header>

      <section className={styles.toolGrid}>
        {IMAGE_TOOLS.map((tool, i) => (
          <Link href={tool.href} key={i}>
            <Card className={styles.toolCard}>
              <div className={styles.toolIcon} style={{ color: tool.color }}>
                {tool.icon}
              </div>
              <div className={styles.toolInfo}>
                <h3>{tool.title}</h3>
                <p>{tool.desc}</p>
              </div>
            </Card>
          </Link>
        ))}
      </section>

      <section className={styles.howTo}>
        <h2>Local Processing is Key</h2>
        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepNum}>1</div>
            <h4>Canvas Rendering</h4>
            <p>We use the high-performance Canvas API to process pixels instantly.</p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNum}>2</div>
            <h4>Zero Latency</h4>
            <p>No waiting for uploads or server response. Your GPU does the work.</p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNum}>3</div>
            <h4>Maximum Quality</h4>
            <p>Fine-tune every setting before exporting your final image.</p>
          </div>
        </div>
      </section>

      <footer className={styles.pageFooter}>
        <p>Image processing is powered by <strong>WebWorker</strong> threads to prevent any UI freezing.</p>
      </footer>
    </div>
  );
}
