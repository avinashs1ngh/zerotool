'use client';

import React from 'react';
import Link from 'next/link';
import { TerminalSquare, Fingerprint, KeyRound, QrCode, Palette, Hash } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { motion } from 'framer-motion';
import styles from '../Category.module.scss';

const UTILS_TOOLS = [
  {
    title: 'UUID Generator',
    desc: 'Generate secure v4 UUIDs instantly in your browser.',
    icon: <Fingerprint size={28} />,
    href: '/tools/utils/uuid',
    color: 'var(--accent-cyan)'
  },
  {
    title: 'Password Gen',
    desc: 'Create unbreakable passwords with customizable complexity.',
    icon: <KeyRound size={28} />,
    href: '/tools/utils/password',
    color: 'var(--accent-purple)'
  },
  {
    title: 'QR Generator',
    desc: 'Turn any text or URL into a downloadable QR code.',
    icon: <QrCode size={28} />,
    href: '/tools/utils/qr',
    color: 'var(--accent-green)'
  },
  {
    title: 'Color Palette',
    desc: 'Generate and fine-tune modern color palettes.',
    icon: <Palette size={28} />,
    href: '/tools/utils/palette',
    color: 'var(--accent-rose)'
  }
];

export default function UtilsCategoryPage() {
  return (
    <div className={styles.categoryPage}>
      <header className={styles.header}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className={styles.breadcrumb}>
            <Link href="/">Home</Link> / <span>Utilities</span>
          </div>
          <h1>Utilities</h1>
          <p>Common daily tasks solved with simple, fast, and offline-capable tools.</p>
        </motion.div>
      </header>

      <section className={styles.toolGrid}>
        {UTILS_TOOLS.map((tool, i) => (
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
        <h2>Daily Productivity</h2>
        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepNum}>1</div>
            <h4>Quick Access</h4>
            <p>Save ZeroTool to your home screen with PWA setup for instant availability.</p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNum}>2</div>
            <h4>Secure Generation</h4>
            <p>All hashes, passwords, and identifiers are generated locally via Web Crypto API.</p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNum}>3</div>
            <h4>Smart Export</h4>
            <p>Download or copy your results with a single click to any application.</p>
          </div>
        </div>
      </section>

      <footer className={styles.pageFooter}>
        <p>Utilities are optimized to be <strong>Lightweight</strong> and <strong>Energy Efficient</strong>.</p>
      </footer>
    </div>
  );
}
