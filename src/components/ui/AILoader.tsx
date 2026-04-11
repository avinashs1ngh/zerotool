'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Brain, Film, Cpu, Layers } from 'lucide-react';
import styles from './AILoader.module.scss';

export type LoaderVariant = 'presentation' | 'video' | 'architecture' | 'thinking';

interface AILoaderProps {
  variant: LoaderVariant;
  text?: string;
  subtext?: string;
}

export const AILoader: React.FC<AILoaderProps> = ({ 
  variant, 
  text = 'AI is Working', 
  subtext = 'Processing...' 
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'presentation': return <Layers size={32} className={styles.icon} />;
      case 'video': return <Film size={32} className={styles.icon} />;
      case 'architecture': return <Cpu size={32} className={styles.icon} />;
      case 'thinking': return <Brain size={32} className={styles.icon} />;
      default: return <Sparkles size={32} className={styles.icon} />;
    }
  };

  return (
    <div className={styles.loaderContainer}>
      <div className={`${styles.visualWrapper} ${styles[variant]}`}>
        <div className={styles.glow} />
        
        {variant === 'presentation' && <div className={styles.beam} />}
        {variant === 'video' && <div className={styles.strip} />}
        {variant === 'architecture' && <div className={styles.grid} />}
        {variant === 'thinking' && (
          <div className={styles.pulses}>
            <div />
            <div />
          </div>
        )}
        
        <motion.div
           animate={{ rotate: 360 }}
           transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        >
          {getIcon()}
        </motion.div>
      </div>

      <div className={styles.textGroup}>
        <h3>{text}</h3>
        <p>{subtext}</p>
      </div>
    </div>
  );
};
