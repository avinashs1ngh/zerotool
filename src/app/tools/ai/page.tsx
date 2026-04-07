'use client';

import React from 'react';
import Link from 'next/link';
import { Bot, Sparkles, BrainCircuit, MessageSquareText, FileText, Settings } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { motion } from 'framer-motion';
import styles from '../Category.module.scss';

const AI_TOOLS = [
  {
    title: 'Prompt Studio',
    desc: 'Craft and test complex prompts with live previews and AI assistance.',
    icon: <Sparkles size={28} />,
    href: '/tools/ai/prompt',
    color: 'var(--accent-green)'
  },
  {
    title: 'Text Summarizer',
    desc: 'Condense long articles and documents into concise bullet points.',
    icon: <FileText size={28} />,
    href: '/tools/ai/summary',
    color: 'var(--accent-cyan)'
  },
  {
    title: 'Code Explainer',
    desc: 'Let AI explain logic and syntax for snippets in over 50 languages.',
    icon: <BrainCircuit size={28} />,
    href: '/tools/ai/code-explainer',
    color: 'var(--accent-purple)'
  },
  {
    title: 'AI Settings',
    desc: 'Configure multiple AI providers and storage keys locally.',
    icon: <Settings size={28} />,
    href: '/tools/ai/prompt?tab=settings',
    color: 'var(--text-secondary)'
  }
];

export default function AICategoryPage() {
  return (
    <div className={styles.categoryPage}>
      <header className={styles.header}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className={styles.breadcrumb}>
            <Link href="/">Home</Link> / <span>AI Tools</span>
          </div>
          <h1>AI Tools</h1>
          <p>Unleash the power of AI providers securely from within your browser.</p>
        </motion.div>
      </header>

      <section className={styles.toolGrid}>
        {AI_TOOLS.map((tool, i) => (
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
        <h2>Multi-Provider Flexibility</h2>
        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepNum}>1</div>
            <h4>Secure Key Storage</h4>
            <p>Paste your API keys once. They are encrypted and saved locally in IndexedDB.</p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNum}>2</div>
            <h4>Swap Providers</h4>
            <p>Toggle between OpenAI, Anthropic, or native Browser models instantly.</p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNum}>3</div>
            <h4>Global Access</h4>
            <p>Access AI capabilities across every tool in the suite seamlessly.</p>
          </div>
        </div>
      </section>

      <footer className={styles.pageFooter}>
        <p>AI processing utilizes <strong>Cross-Origin Proxies</strong> on your local runtime to maintain security.</p>
      </footer>
    </div>
  );
}
