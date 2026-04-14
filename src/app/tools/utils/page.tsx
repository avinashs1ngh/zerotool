'use client';

import React from 'react';
import Link from 'next/link';
import { 
  TerminalSquare, Fingerprint, KeyRound, QrCode, 
  Palette, Hash, CreditCard, Minimize, ArrowLeft
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { motion } from 'framer-motion';
import styles from '../Category.module.scss';

const UTILS_TOOLS = [
  {
    title: 'ID Card Maker',
    desc: 'Generate professional ID cards from templates.',
    icon: <CreditCard size={28} />,
    href: '/tools/utils/id-maker',
    color: 'var(--accent-cyan)'
  },
  {
    title: 'Size Fixer',
    desc: 'Precise size fixing (10kb, 20kb, 50kb) for docs.',
    icon: <Minimize size={28} />,
    href: '/tools/utils/size-fixer',
    color: 'var(--accent-purple)'
  },
  {
    title: 'UUID Gen',
    desc: 'Generate secure v4 UUIDs instantly.',
    icon: <Fingerprint size={28} />,
    href: '/tools/utils/uuid',
    color: 'var(--accent-green)'
  },
  {
    title: 'Password Gen',
    desc: 'Create unbreakable passwords locally.',
    icon: <KeyRound size={28} />,
    href: '/tools/utils/password',
    color: 'var(--accent-rose)'
  },
  {
    title: 'Color Palette',
    desc: 'Generate and fine-tune modern color palettes.',
    icon: <Palette size={28} />,
    href: '/tools/utils/palette',
    color: 'var(--accent-cyan)'
  }
];

export default function UtilsCategoryPage() {
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
          <TerminalSquare size={32} className={styles.icon} />
          <div>
            <h1>Utilities</h1>
            <p>Common daily tasks solved with simple, fast, and offline-capable tools.</p>
          </div>
        </motion.div>
      </header>

      <section className={styles.toolGrid}>
        {UTILS_TOOLS.map((tool, i) => (
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
        <p>Utilities are optimized to be <strong>Lightweight</strong> and <strong>Energy Efficient</strong>.</p>
      </footer>
    </div>
  );
}
