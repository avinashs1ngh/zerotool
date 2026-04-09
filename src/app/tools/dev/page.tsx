'use client';

import React from 'react';
import Link from 'next/link';
import { Code, Terminal, Brackets, Regex, FileDiff, Type, ArrowLeft } from 'lucide-react';
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

      <section className={styles.howTo}>
        <h2>Developer Productivity</h2>
        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepNum}>1</div>
            <h4>Live Updates</h4>
            <p>Every keystroke triggers a re-validation. See your mistakes as you make them.</p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNum}>2</div>
            <h4>Secure Localhost</h4>
            <p>None of your code or sensitive JSON ever leaves your machine.</p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNum}>3</div>
            <h4>Powerful Engine</h4>
            <p>Built-in syntax highlighting and formatting logic used by top IDEs.</p>
          </div>
        </div>
      </section>

      <footer className={styles.pageFooter}>
        <p>Dev tools are powered by highly-optimized <strong>Rust-based</strong> WASM modules where applicable.</p>
      </footer>
    </div>
  );
}
