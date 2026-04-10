'use client';

import React from 'react';
import Link from 'next/link';
import { 
  BrainCircuit, Image as ImageIcon, Wand2, Maximize2, 
  Layers, Eraser, MessageSquareText, ArrowLeft 
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { motion } from 'framer-motion';
import styles from '../Category.module.scss';

const BRIA_TOOLS = [
  {
    title: 'Generate',
    desc: 'Create ultra-realistic art and photorealistic images from text description.',
    icon: <ImageIcon size={28} />,
    href: '/tools/bria/generate',
    color: 'var(--accent-purple)'
  },
  {
    title: 'Enhance',
    desc: 'Increase resolution and visual fidelity with Bria AI upscale engine.',
    icon: <Maximize2 size={28} />,
    href: '/tools/bria/editor?mode=enhance',
    color: 'var(--accent-cyan)'
  },
  {
    title: 'Expand Image',
    desc: 'Intelligently outpaint and extend borders to any aspect ratio.',
    icon: <Layers size={28} />,
    href: '/tools/bria/editor?mode=expand',
    color: 'var(--accent-primary)'
  },
  {
    title: 'Replace Background',
    desc: 'Swap any background with AI-generated scenes via text prompt.',
    icon: <Wand2 size={28} />,
    href: '/tools/bria/editor?mode=replace_bg',
    color: 'var(--accent-green)'
  },
  {
    title: 'Remove Background',
    desc: 'Instantly isolate subjects with pixel-perfect precision.',
    icon: <Eraser size={28} />,
    href: '/tools/bria/editor?mode=remove_bg',
    color: 'var(--accent-rose)'
  },
  {
    title: 'Prompt Architect',
    desc: 'Convert simple ideas into detailed JSON structured prompts.',
    icon: <MessageSquareText size={28} />,
    href: '/tools/bria/prompt',
    color: 'var(--accent-purple)'
  }
];

export default function BriaHubPage() {
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
          <BrainCircuit size={32} className={styles.icon} />
          <div>
            <h1>Bria AI Studio</h1>
            <p>Professional AI-powered image generation and editing suite.</p>
          </div>
        </motion.div>
      </header>

      <section className={styles.toolGrid}>
        {BRIA_TOOLS.map((tool, i) => (
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
    </div>
  );
}
