'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { KeyRound, ArrowLeft, Copy, RefreshCw, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './PasswordGen.module.scss';

export default function PasswordGeneratorPage() {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });
  const [copied, setCopied] = useState(false);
  const [strength, setStrength] = useState<'weak' | 'medium' | 'strong'>('medium');

  const generatePassword = useCallback(() => {
    const charset = {
      uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      lowercase: 'abcdefghijklmnopqrstuvwxyz',
      numbers: '0123456789',
      symbols: '!@#$%^&*()_+~`|}{[]:;?><,./-=',
    };

    let characters = '';
    if (options.uppercase) characters += charset.uppercase;
    if (options.lowercase) characters += charset.lowercase;
    if (options.numbers) characters += charset.numbers;
    if (options.symbols) characters += charset.symbols;

    if (characters === '') return setPassword('');

    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);

    let generatedPassword = '';
    for (let i = 0; i < length; i++) {
      generatedPassword += characters[array[i] % characters.length];
    }

    setPassword(generatedPassword);
    calculateStrength(generatedPassword);
  }, [length, options]);

  useEffect(() => {
    generatePassword();
  }, [generatePassword]);

  const calculateStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length > 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    
    if (score <= 1) setStrength('weak');
    else if (score === 2) setStrength('medium');
    else setStrength('strong');
  };

  const handleCopy = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleOption = (key: keyof typeof options) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <Link href="/tools/utils" className={styles.backBtn}>
            <ArrowLeft size={24} />
          </Link>
          <KeyRound size={32} className={styles.icon} />
          <div>
            <h1>Password Gen</h1>
            <p>Generate secure, unbreakable passwords strictly in your browser.</p>
          </div>
        </div>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.mainCard}
      >
        <div className={styles.resultSection}>
          <div className={styles.display}>
            <code>{password || 'Select options...'}</code>
            <AnimatePresence>
              {copied && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={styles.copyTooltip}
                >
                  Copied!
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className={styles.strengthBar}>
            <div className={`${styles.fill} ${styles[strength]}`} style={{ width: strength === 'weak' ? '33%' : strength === 'medium' ? '66%' : '100%' }} />
          </div>
          <p className={`${styles.strengthText} ${styles[strength]}`}>
            Strength: {strength}
          </p>
        </div>

        <div className={styles.settings}>
          <div className={styles.settingRow}>
            <label>Length: {length}</label>
            <div className={styles.lengthControl}>
              <input 
                type="range" 
                min="8" 
                max="64" 
                value={length} 
                onChange={(e) => setLength(parseInt(e.target.value))} 
              />
              <div className={styles.lengthVal}>{length}</div>
            </div>
          </div>

          <div className={styles.settingRow}>
            <label>Characters</label>
            <div className={styles.optionsGrid}>
              {Object.entries(options).map(([key, val]) => (
                <div 
                  key={key} 
                  className={`${styles.option} ${val ? styles.active : ''}`}
                  onClick={() => toggleOption(key as keyof typeof options)}
                >
                  <div className={styles.checkbox}>
                    <Check size={12} />
                  </div>
                  <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <Button variant="ghost" className={styles.actionBtn} onClick={generatePassword}>
            <RefreshCw size={18} />
            Regenerate
          </Button>
          <Button variant="primary" className={styles.generateBtn} onClick={handleCopy}>
            {copied ? <Check size={18} /> : <Copy size={18} />}
            {copied ? 'Copied' : 'Copy Password'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
