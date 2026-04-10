'use client';

import React from 'react';
import Link from 'next/link';
import { Code, Terminal, Brackets, Regex, FileDiff, Type, ArrowLeft, Binary, Link2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { motion } from 'framer-motion';
import styles from '../Category.module.scss';

const DEV_TOOLS = [
  {
    title: 'JSON Formatter',
    desc: 'Pretty-print or minify JSON data with instant validation.',
    icon: <Brackets size={28} />,
    href: '/tools/dev/json',
    color: 'var(--accent-purple)'
  },
  {
    title: 'Regex Tester',
    desc: 'Test your regular expressions with live syntax highlighting.',
    icon: <Regex size={28} />,
    href: '/tools/dev/regex',
    color: 'var(--accent-cyan)'
  },
  {
    title: 'Base64 Converter',
    desc: 'Encode or decode text to and from Base64 format.',
    icon: <Binary size={28} />,
    href: '/tools/dev/base64',
    color: 'var(--accent-primary)'
  },
  {
    title: 'URL Encoder',
    desc: 'Safely encode or decode URL parameters and strings.',
    icon: <Link2 size={28} />,
    href: '/tools/dev/url',
    color: 'var(--accent-green)'
  },
  {
    title: 'Markdown Preview',
    desc: 'Write Markdown code and preview the rendered output in real-time.',
    icon: <Type size={28} />,
    href: '/tools/dev/markdown',
    color: 'var(--text-secondary)'
  },
  {
    title: 'Code Diff Viewer',
    desc: 'Compare two text snippets to find differences instantly.',
    icon: <FileDiff size={28} />,
    href: '/tools/dev/diff',
    color: 'var(--accent-rose)'
  }
];

export default function DevCategoryPage() {
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
          <Terminal size={32} className={styles.icon} />
          <div>
            <h1>Dev & Text</h1>
            <p>Essential utilities for writing, formatting, and debugging your code faster.</p>
          </div>
        </motion.div>
      </header>

      <section className={styles.toolGrid}>
        {DEV_TOOLS.map((tool, i) => (
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
        <p>Dev tools are powered by highly-optimized <strong>Rust-based</strong> WASM modules where applicable.</p>
      </footer>
    </div>
  );
}
