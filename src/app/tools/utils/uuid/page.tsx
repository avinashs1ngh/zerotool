'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TerminalSquare, Copy, Check, ArrowLeft } from 'lucide-react';
import styles from './UUID.module.scss';
import { generateUUID } from '@/utils/crypto';

export default function UUIDGeneratorPage() {
  const [uuids, setUuids] = useState<string[]>([]);
  const [count, setCount] = useState(1);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const generate = () => {
    const newUuids = Array.from({ length: count }, () => generateUUID());
    setUuids(newUuids);
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <Link href="/tools/utils" className={styles.backBtn}>
            <ArrowLeft size={24} />
          </Link>
          <TerminalSquare size={32} className={styles.icon} />
          <div>
            <h1>UUID Generator</h1>
            <p>Generate secure v4 UUIDs locally in your browser.</p>
          </div>
        </div>
      </header>

      <div className={styles.content}>
        <Card title="Generator Options">
          <div className={styles.controls}>
            <label>
              Number of UUIDs:
              <input 
                type="number" 
                min={1} 
                max={100} 
                value={count} 
                onChange={(e) => setCount(Number(e.target.value))}
                className={styles.numInput}
              />
            </label>
            <Button onClick={generate} variant="primary">Generate UUIDs</Button>
          </div>
        </Card>

        {uuids.length > 0 && (
          <Card title="Results" className={styles.resultsCard}>
            <div className={styles.list}>
              {uuids.map((id, index) => (
                <div key={index} className={styles.uuidRow}>
                  <code>{id}</code>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => copyToClipboard(id, index)}
                  >
                    {copiedIndex === index ? <Check size={14} color="var(--accent-green)"/> : <Copy size={14} />}
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
