'use client';

import React from 'react';
import Link from 'next/link';
import { 
  FileText, Plus, Scissors, Shrink, 
  Camera, PenTool, FileType, Image as ImageIcon, Sparkles, ArrowLeft
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { motion } from 'framer-motion';
import styles from '../Category.module.scss';

const PDF_TOOLS = [
  {
    title: 'Camera Scanner',
    desc: 'Multi-page camera scanner with auto-capture & PDF export.',
    icon: <Camera size={28} />,
    href: '/tools/pdf/cam-scan',
    color: 'var(--accent-primary)'
  },
  {
    title: 'PDF Editor',
    desc: 'Add text, signatures, and images to your PDFs.',
    icon: <PenTool size={28} />,
    href: '/tools/pdf/edit',
    color: 'var(--accent-cyan)'
  },
  {
    title: 'Merge PDF',
    desc: 'Combine multiple PDF files into one document.',
    icon: <Plus size={28} />,
    href: '/tools/pdf/merge',
    color: 'var(--accent-rose)'
  },
  {
    title: 'Split PDF',
    desc: 'Extract pages from your PDF into separate files.',
    icon: <Scissors size={28} />,
    href: '/tools/pdf/split',
    color: 'var(--accent-green)'
  },
  {
    title: 'Compress PDF',
    desc: 'Reduce file size while maintaining visibility.',
    icon: <Shrink size={28} />,
    href: '/tools/pdf/compress',
    color: 'var(--accent-primary)'
  }
];

export default function PDFCategoryPage() {
  return (
    <div className={styles.categoryPage}>
      <header className={styles.header}>
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={styles.titleArea}
        >
          <Link href="/" className={styles.backBtn}>
            <ArrowLeft size={24} />
          </Link>
          <FileText size={32} className={styles.icon} />
          <div>
            <h1>PDF Tools</h1>
          </div>
        </motion.div>
      </header>

      <section className={styles.toolGrid}>
        {PDF_TOOLS.map((tool, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link href={tool.href}>
              <Card 
                className={styles.toolCard} 
                style={{ '--tool-color': tool.color } as React.CSSProperties}
              >
                <div className={styles.toolIcon}>
                  {tool.icon}
                </div>
                <div className={styles.toolInfo}>
                  <h3>{tool.title}</h3>
                  <p>{tool.desc}</p>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </section>
      <footer className={styles.pageFooter}>
        <p>ZeroTool uses <strong>WebAssembly</strong> and <strong>Web Workers</strong> to process your files securely on your own hardware.</p>
      </footer>
    </div>
  );
}
