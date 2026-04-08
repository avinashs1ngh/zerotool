'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FileDiff, ArrowLeft, Trash2, Split, Rows, RefreshCw } from 'lucide-react';
import styles from './DiffViewer.module.scss';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function DiffViewerPage() {
  const [original, setOriginal] = useState('// Paste original code here\nfunction hello() {\n  console.log("hello world");\n}');
  const [modified, setModified] = useState('// Paste modified code here\nfunction hello() {\n  console.log("hello universe!");\n  return true;\n}');

  const diffResult = useMemo(() => {
    const oldLines = original.split('\n');
    const newLines = modified.split('\n');
    const result: { oldLine: string | null, newLine: string | null, type: 'added' | 'removed' | 'changed' | 'unchanged' | 'empty' }[] = [];
    
    let i = 0, j = 0;
    while (i < oldLines.length || j < newLines.length) {
      const oldL = oldLines[i];
      const newL = newLines[j];
      
      if (oldL === newL) {
        result.push({ oldLine: oldL, newLine: newL, type: 'unchanged' });
        i++; j++;
      } else if (i < oldLines.length && j < newLines.length) {
        // Simple heuristic: if next line in new matches current old, it's an addition
        if (newLines[j+1] === oldL) {
          result.push({ oldLine: null, newLine: newL, type: 'added' });
          j++;
        } else if (oldLines[i+1] === newL) {
          result.push({ oldLine: oldL, newLine: null, type: 'removed' });
          i++;
        } else {
          // Fallback to change
          result.push({ oldLine: oldL, newLine: newL, type: 'changed' });
          i++; j++;
        }
      } else if (i < oldLines.length) {
        result.push({ oldLine: oldL, newLine: null, type: 'removed' });
        i++;
      } else {
        result.push({ oldLine: null, newLine: newL, type: 'added' });
        j++;
      }
    }
    return result;
  }, [original, modified]);

  const handleClear = () => {
    setOriginal('');
    setModified('');
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <Link href="/tools/dev" className={styles.backBtn}>
            <ArrowLeft size={20} />
          </Link>
          <FileDiff size={32} className={styles.icon} />
          <div>
            <h1>Code Diff Viewer</h1>
            <p>Compare two snippets of code to see what's changed instantly.</p>
          </div>
        </div>
      </header>

      <div className={styles.mainGrid}>
        <section className={styles.inputSection}>
          <div className={styles.pane}>
            <div className={styles.paneHeader}>
              <span>Original Code</span>
              <Trash2 size={14} className={styles.actionIcon} onClick={() => setOriginal('')} />
            </div>
            <textarea
              className={styles.editor}
              value={original}
              onChange={(e) => setOriginal(e.target.value)}
              spellCheck={false}
            />
          </div>
          <div className={styles.pane}>
            <div className={styles.paneHeader}>
              <span>Modified Code</span>
              <Trash2 size={14} className={styles.actionIcon} onClick={() => setModified('')} />
            </div>
            <textarea
              className={styles.editor}
              value={modified}
              onChange={(e) => setModified(e.target.value)}
              spellCheck={false}
            />
          </div>
        </section>

        <section className={styles.diffSection}>
          <div className={styles.diffHeader}>
            <h3>Side-by-Side Comparison</h3>
            <div style={{ display: 'flex', gap: '12px' }}>
               <Button variant="ghost" size="sm" onClick={handleClear}>Reset</Button>
            </div>
          </div>
          <div className={styles.diffContainer}>
             <div className={styles.diffTable}>
               {diffResult.map((line, idx) => (
                 <div key={idx} className={styles.diffRow}>
                   <div className={styles.lineNumber}>{line.oldLine !== null ? idx + 1 : ''}</div>
                   <div className={`${styles.diffCell} ${line.type === 'removed' ? styles.removed : line.type === 'changed' ? styles.removed : ''}`}>
                     {line.oldLine}
                   </div>
                   <div className={styles.lineNumber}>{line.newLine !== null ? idx + 1 : ''}</div>
                   <div className={`${styles.diffCell} ${line.type === 'added' ? styles.added : line.type === 'changed' ? styles.added : ''}`}>
                     {line.newLine}
                   </div>
                 </div>
               ))}
             </div>
          </div>
        </section>
      </div>
    </div>
  );
}
