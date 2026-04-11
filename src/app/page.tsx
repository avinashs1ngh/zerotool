'use client';

import React from 'react';
import { 
  Shield, Zap, Cpu, Lock, Globe, 
  Sparkles, Coffee, Heart, ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import styles from './Home.module.scss';
import Link from 'next/link';

export default function Home() {
  return (
    <div className={styles.home}>
      {/* Cinematic Hero */}
      <section className={styles.hero}>
        <div className={styles.gradientOverlay} />
        <div className={styles.heroContent}>
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            
            <h1>ZeroTool</h1>
            <p className={styles.lead}>
              The standard in browser-native utilities. No servers, no tracking, no compromises. 
              Everything happens in your memory, powered by High-Octane AI.
            </p>
            <div className={styles.heroActions}>
                <Link href="/tools/ai" className={styles.primaryBtn}>
                    <span>Enter Studio</span>
                    <ArrowRight size={18} />
                </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Philosophy Section */}
      <main className={styles.mainContent}>
        <section className={styles.philosophyGrid}>
          <motion.div 
            whileHover={{ y: -5 }}
            className={styles.philosophyCard}
          >
            <Lock size={32} className={styles.icon} />
            <h3>Zero-Trust Security</h3>
            <p>Your data never touches a server. All processing is executed locally in your browser's RAM using sandboxed WebAssembly. Once you close the tab, the data disappears forever.</p>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className={styles.philosophyCard}
          >
            <Zap size={32} className={styles.icon} />
            <h3>Hyper-Performance</h3>
            <p>Built with Next.js 15 and Rust-powered toolsets. Experience near-instant results for video compression, document scanning, and AI generation without network latency.</p>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className={styles.philosophyCard}
          >
            <Cpu size={32} className={styles.icon} />
            <h3>AI Native Core</h3>
            <p>Integrated with high-performance LLMs specifically tuned for document architecture, automated slides, and cinematic video synthesis directly from your prompts.</p>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className={styles.philosophyCard}
          >
            <Globe size={32} className={styles.icon} />
            <h3>Offline Ecosystem</h3>
            <p>Download the progressive app and use your favorite utilities in areas with zero connectivity. ZeroTool is your portable digital multi-tool for the modern web.</p>
          </motion.div>
        </section>

        {/* Brand Mission */}
        <section className={styles.missionSection}>
          <div className={styles.missionContent}>
            <h2>Tools that respect you.</h2>
            <p>
              In an era of mass data collection, ZeroTool stands for a different web. 
              A web where utilities are powerful, beautiful, and completely under your control. 
              We don't collect analytics. We don't store files. We just provide the engine.
            </p>
          </div>
        </section>
      </main>

      {/* Credits Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.signature}>
            <p>Crafted with <Heart size={14} className={styles.heart} /> by <strong>Avinash Singh</strong></p>
          </div>
          <div className={styles.meta}>
            <span>&copy; 2026 ZeroTool OS. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
