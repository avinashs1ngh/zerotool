'use client';

import React from 'react';
import Link from 'next/link';
import { 
  FileText, ImageIcon, Code, Bot, 
  TerminalSquare, Sparkles, Shield, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import styles from './Home.module.scss';
import { Card } from '@/components/ui/Card';

const CATEGORIES = [
  {
    title: 'PDF Tools',
    desc: 'Merge, split, and compress PDFs securely.',
    icon: <FileText size={32} />,
    href: '/tools/pdf',
    color: 'var(--accent-rose)'
  },
  {
    title: 'Image Tools',
    desc: 'Compress and resize images without uploads.',
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
    title: 'Dev & Text',
    desc: 'Format JSON, test Regex, and more.',
    icon: <Code size={32} />,
    href: '/tools/dev',
    color: 'var(--accent-purple)'
  },
  {
    title: 'Utilities',
    desc: 'UUIDs, Passwords, and QR Codes.',
    icon: <TerminalSquare size={32} />,
    href: '/tools/utils',
    color: '#ffffff'
  }
];

export default function Home() {
  return (
    <div className={styles.home}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className={styles.badge}>
            <Sparkles size={14} />
            <span>100% Client-Side Processing</span>
          </div>
          <h1>Every tool you need, <br /><span>completely offline.</span></h1>
          <p>
            ZeroTool brings powerful utilities directly to your browser. 
            No servers, no uploads, no tracking. Just pure privacy and speed.
          </p>
        </motion.div>
      </section>

      {/* Categories Grid */}
      <section className={styles.categories}>
        <div className={styles.grid}>
          {CATEGORIES.map((cat, i) => (
            <Link href={cat.href} key={i}>
              <Card className={styles.catCard}>
                <div className={styles.catIcon} style={{ color: cat.color }}>
                  {cat.icon}
                </div>
                <h3>{cat.title}</h3>
                <p>{cat.desc}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Features / Why ZeroTool */}
      <section className={styles.features}>
        <div className={styles.featItem}>
          <Shield size={24} color="var(--accent-cyan)" />
          <div>
            <h4>Privacy First</h4>
            <p>Your files never leave your device. All processing happens in your browser RAM.</p>
          </div>
        </div>
        <div className={styles.featItem}>
          <Zap size={24} color="var(--accent-purple)" />
          <div>
            <h4>Lightning Fast</h4>
            <p>Built with modern APIs for near-instant performance even on large files.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerLogo}>
            <Zap size={20} color="var(--accent-cyan)" />
            <span>ZeroTool</span>
          </div>
          <p>The ultimate private toolkit for developers and power users.</p>
        </div>
      </footer>
    </div>
  );
}
