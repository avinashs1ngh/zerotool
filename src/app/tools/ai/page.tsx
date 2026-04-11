'use client';

import React from 'react';
import Link from 'next/link';
import { Bot, Sparkles, BrainCircuit, MessageSquareText, FileText, Settings, ArrowLeft, Image as ImageIcon, Wand2, Maximize2, Video, Terminal, Presentation } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { motion } from 'framer-motion';
import styles from '../Category.module.scss';

const AI_TOOLS = [
  {
    title: 'AI Chat',
    desc: 'Advanced conversational AI with Thinking Mode & Web Search capabilities.',
    icon: <MessageSquareText size={28} />,
    href: '/tools/ai/chat',
    color: '#007aff'
  },
  {
    title: 'Slide Maker',
    desc: 'Generate professional slides with AI-researched content and images.',
    icon: <Presentation size={28} />,
    href: '/tools/ai/slides',
    color: '#ff9500'
  },
  {
    title: 'Create Video',
    desc: 'Transform text prompts into high-quality cinematic AI videos.',
    icon: <Video size={28} />,
    href: '/tools/ai/video',
    color: '#ff2d55'
  },
  {
    title: 'Create Image',
    desc: 'Generate stunning images from text using Nano Banana & Imagen 4.0.',
    icon: <ImageIcon size={28} />,
    href: '/tools/ai/generate',
    color: '#ff9500'
  },
  {
    title: 'Edit Image',
    desc: 'Manipulate and edit images with AI-powered prompt enhancement.',
    icon: <Wand2 size={28} />,
    href: '/tools/ai/edit',
    color: '#34c759'
  },
  {
    title: 'Enhance Image',
    desc: 'Upscale your images to 2K/4K resolution with elite preview models.',
    icon: <Maximize2 size={28} />,
    href: '/tools/ai/upscale',
    color: '#af52de'
  }
];


export default function AICategoryPage() {
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
          <Bot size={32} className={styles.icon} />
          <div>
            <h1>AI Tools</h1>
            <p>Unleash the power of AI providers securely from within your browser.</p>
          </div>
        </motion.div>
      </header>

      <section className={styles.toolGrid}>
        {AI_TOOLS.map((tool, i) => (
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
