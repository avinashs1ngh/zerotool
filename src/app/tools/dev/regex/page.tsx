'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Regex, ArrowLeft, Info, HelpCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import styles from './RegexTester.module.scss';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

type Flag = 'g' | 'i' | 'm' | 's' | 'u' | 'y';
const FLAGS: { id: Flag, name: string, desc: string }[] = [
  { id: 'g', name: 'Global', desc: 'Find all matches' },
  { id: 'i', name: 'Case-insensitive', desc: 'Ignore case' },
  { id: 'm', name: 'Multiline', desc: '^ and $ matches per line' },
  { id: 's', name: 'Single line', desc: 'dot matches newline' },
  { id: 'u', name: 'Unicode', desc: 'Full unicode support' },
];

export default function RegexTesterPage() {
  const [pattern, setPattern] = useState('[a-z]+');
  const [testString, setTestString] = useState('Hello World 2026!');
  const [activeFlags, setActiveFlags] = useState<Set<Flag>>(new Set(['g', 'i']));
  const [error, setError] = useState<string | null>(null);

  const toggleFlag = (flag: Flag) => {
    const newFlags = new Set(activeFlags);
    if (newFlags.has(flag)) newFlags.delete(flag);
    else newFlags.add(flag);
    setActiveFlags(newFlags);
  };

  const matches = useMemo(() => {
    if (!pattern) return [];
    try {
      const flagsString = Array.from(activeFlags).join('');
      const regex = new RegExp(pattern, flagsString);
      setError(null);
      
      const allMatches = Array.from(testString.matchAll(regex));
      return allMatches.map(m => ({
        index: m.index,
        content: m[0],
        groups: m.groups || {}
      }));
    } catch (e: any) {
      setError(e.message);
      return [];
    }
  }, [pattern, testString, activeFlags]);

  const highlightedText = useMemo(() => {
    if (!pattern || matches.length === 0) return testString;
    
    let result: React.ReactNode[] = [];
    let lastIndex = 0;
    
    matches.forEach((match, i) => {
      const index = match.index!;
      if (index > lastIndex) {
        result.push(testString.substring(lastIndex, index));
      }
      result.push(<mark key={i}>{match.content}</mark>);
      lastIndex = index + match.content.length;
    });
    
    if (lastIndex < testString.length) {
      result.push(testString.substring(lastIndex));
    }
    
    return result;
  }, [testString, matches, pattern]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <Link href="/tools/dev" className={styles.backBtn}>
            <ArrowLeft size={20} />
          </Link>
          <Regex size={32} className={styles.icon} />
          <div>
            <h1>Regex Tester</h1>
            <p>Build and test regular expressions with real-time visual feedback.</p>
          </div>
        </div>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className={styles.mainGrid}
      >
        <section className={styles.inputCard}>
          <div className={styles.inputGroup}>
            <label>Regular Expression</label>
            <div className={styles.regexInputWrapper}>
              <span>/</span>
              <input 
                type="text" 
                value={pattern} 
                onChange={(e) => setPattern(e.target.value)} 
                placeholder="regex pattern"
                spellCheck={false}
              />
              <span>/</span>
              <span style={{ color: 'var(--text-secondary)' }}>{Array.from(activeFlags).join('')}</span>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>Flags</label>
            <div className={styles.flags}>
              {FLAGS.map(flag => (
                <button
                  key={flag.id}
                  className={`${styles.flag} ${activeFlags.has(flag.id) ? styles.active : ''}`}
                  onClick={() => toggleFlag(flag.id)}
                  title={flag.desc}
                >
                  {flag.name} ({flag.id})
                </button>
              ))}
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              style={{ color: '#ef4444', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '1rem' }}
            >
              <AlertCircle size={14} />
              {error}
            </motion.div>
          )}
        </section>

        <div className={styles.testArea}>
          <section className={styles.pane}>
            <div className={styles.paneHeader}>
              <span>Test String</span>
            </div>
            <textarea
              className={styles.editor}
              value={testString}
              onChange={(e) => setTestString(e.target.value)}
              placeholder="Paste text here to test against regex..."
              spellCheck={false}
            />
          </section>

          <section className={styles.pane}>
            <div className={styles.paneHeader}>
              <span>Matching Results</span>
              <span>{matches.length} Matches Found</span>
            </div>
            <div className={`${styles.output} ${matches.length === 0 ? styles.empty : ''}`}>
              {highlightedText || 'No matches found.'}
            </div>
          </section>
        </div>

        <section className={styles.results}>
          <h3>
             <Info size={18} />
             Match Details
          </h3>
          <div className={styles.matchList}>
            {matches.length > 0 ? matches.map((m, i) => (
              <div key={i} className={styles.matchItem}>
                <span className={styles.matchText}>match {i + 1}: "{m.content}"</span>
                <div className={styles.matchMeta}>
                  <span>index: {m.index}</span>
                  <span>length: {m.content.length}</span>
                </div>
              </div>
            )) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Detailed match data will appear here.</p>
            )}
          </div>
        </section>
      </motion.div>
    </div>
  );
}
