'use client';

import React from 'react';
import Link from 'next/link';
import { 
  FileText, ImageIcon, Code, Bot, 
  TerminalSquare, Sparkles, Shield, Zap,
  Camera, UserCircle, Video, CreditCard,
  Maximize, Minimize, Printer, PenTool, Eraser
} from 'lucide-react';
import { motion } from 'framer-motion';
import styles from './Home.module.scss';
import { Card } from '@/components/ui/Card';

const TOOLS = [
  {
    title: 'Camera Scanner',
    desc: 'Multi-page camera scanner with auto-capture & export.',
    icon: <Camera size={32} />,
    href: '/tools/pdf/cam-scan',
    category: 'Document'
  },
  {
    title: 'Doc Scanner',
    desc: 'Enhance document photos with professional scan filters.',
    icon: <Sparkles size={32} />,
    href: '/tools/pdf/scan',
    category: 'Document'
  },
  {
    title: 'Passport Photo',
    desc: 'Create standard passport size photos in seconds.',
    icon: <UserCircle size={32} />,
    href: '/tools/image/passport',
    category: 'Image'
  },
  {
    title: 'Video Compress',
    desc: 'Secure local video compression with zero uploads.',
    icon: <Video size={32} />,
    href: '/tools/utils/video',
    category: 'Utility'
  },
  {
    title: 'ID Card Maker',
    desc: 'Generate professional ID cards from templates.',
    icon: <CreditCard size={32} />,
    href: '/tools/utils/id-maker',
    category: 'Utility'
  },
  {
    title: 'PDF Editor',
    desc: 'Add text, signatures, and images to your PDFs.',
    icon: <PenTool size={32} />,
    href: '/tools/pdf/edit',
    category: 'Document'
  },
  {
    title: 'Size Fixer',
    desc: 'Precise size fixing (10kb, 20kb, 50kb) for docs.',
    icon: <Minimize size={32} />,
    href: '/tools/utils/size-fixer',
    category: 'Utility'
  },
  {
    title: 'Image to PDF',
    desc: 'Convert single or multiple images into a PDF.',
    icon: <FileText size={32} />,
    href: '/tools/image/to-pdf',
    category: 'Image'
  },
  {
    title: 'Word to PDF',
    desc: 'Securely convert Docx files to PDF offline.',
    icon: <FileText size={32} />,
    href: '/tools/pdf/word-to-pdf',
    category: 'Document'
  },
  {
    title: 'BG Remover',
    desc: 'Remove image backgrounds locally using AI.',
    icon: <Eraser size={32} />,
    href: '/tools/image/bg-remover',
    category: 'Image'
  }
];

const CATEGORIES = [
  {
    title: 'PDF Tools',
    desc: 'Merge, split, and edit PDFs securely.',
    icon: <FileText size={32} />,
    href: '/tools/pdf',
    color: 'var(--accent-primary)'
  },
  {
    title: 'Image Tools',
    desc: 'Compress, resize, and convert images.',
    icon: <ImageIcon size={32} />,
    href: '/tools/image',
    color: 'var(--accent-cyan)'
  },
  {
    title: 'AI Studio',
    desc: 'Power your prompts with multiple providers.',
    icon: <Bot size={32} />,
    href: '/tools/ai',
    color: 'var(--accent-green)'
  },
  {
    title: 'Utilities',
    desc: 'Video, ID, and precise size tools.',
    icon: <TerminalSquare size={32} />,
    href: '/tools/utils',
    color: 'var(--accent-purple)'
  }
];

export default function Home() {
  return (
    <div className={styles.home}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className={styles.badge}>
              <Shield size={14} />
              <span>Secure Local Processing</span>
            </div>
            <h1>Document Tools <br /><span>for the Modern Web.</span></h1>
            <p>
              Professional utilities that run completely in your browser. 
              No servers, no tracking, just pure privacy.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Tools Grid */}
      <div className={styles.mainSection}>
        <section className={styles.tools}>
          <div className={styles.sectionHeader}>
            <h2>Featured Tools</h2>
            <p>Most popular and recently added utilities</p>
          </div>
          <div className={styles.grid}>
            {TOOLS.map((tool, i) => (
              <Link href={tool.href} key={i}>
                <Card className={styles.catCard}>
                  <div className={styles.catIcon}>
                    {tool.icon}
                  </div>
                  <div className={styles.toolMeta}>
                    <span className={styles.badge}>{tool.category}</span>
                    <h3>{tool.title}</h3>
                    <p>{tool.desc}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.categories}>
          <div className={styles.sectionHeader}>
            <h2>Browse by Category</h2>
            <p>Explore our full suite of professional tools</p>
          </div>
          <div className={styles.categoryGrid}>
            {CATEGORIES.map((cat, i) => (
              <Link href={cat.href} key={i}>
                <Card className={styles.categoryInfoCard}>
                  <div className={styles.categoryIcon} style={{ background: cat.color + '20', color: cat.color }}>
                    {cat.icon}
                  </div>
                  <div>
                    <h3>{cat.title}</h3>
                    <p>{cat.desc}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Features / Why ZeroTool */}
        <section className={styles.features}>
          <div className={styles.featItem}>
            <div className={styles.featIcon}>
              <Shield size={24} color="var(--accent-primary)" />
            </div>
            <div>
              <h4>100% Private</h4>
              <p>Your files never leave your device. All processing happens in your browser RAM using WebAssembly.</p>
            </div>
          </div>
          <div className={styles.featItem}>
            <div className={styles.featIcon}>
              <Zap size={24} color="var(--accent-purple)" />
            </div>
            <div>
              <h4>Lightning Fast</h4>
              <p>Built with Next.js 15 and high-performance rust-based tools for near-instant results.</p>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerLogo}>
            <Zap size={24} />
            <span>ZeroTool</span>
          </div>
          <p>The standard in private, offline-first browser utilities.</p>
        </div>
      </footer>
    </div>
  );
}
