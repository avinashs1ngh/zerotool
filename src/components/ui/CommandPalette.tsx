'use client';

import React, { useEffect } from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { useUIStore } from '@/store/ui-store';
import styles from './CommandPalette.module.scss';

export function CommandPalette() {
  const { isSearchOpen, setSearchOpen } = useUIStore();
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen(!isSearchOpen);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isSearchOpen, setSearchOpen]);

  const onSelect = (href: string) => {
    setSearchOpen(false);
    router.push(href);
  };

  if (!isSearchOpen) return null;

  return (
    <div className={styles.overlay} onClick={() => setSearchOpen(false)}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <Command>
          <div className={styles.searchWrap}>
            <Search size={18} className={styles.searchIcon} />
            <Command.Input 
              autoFocus 
              placeholder="Search tools... (Ctrl+K)" 
              className={styles.input} 
            />
          </div>

          <Command.List className={styles.list}>
            <Command.Empty className={styles.empty}>No tools found.</Command.Empty>

            <Command.Group heading="PDF Tools">
              <Command.Item onSelect={() => onSelect('/tools/pdf/merge')}>Merge PDF</Command.Item>
              <Command.Item onSelect={() => onSelect('/tools/pdf/split')}>Split PDF</Command.Item>
            </Command.Group>

            <Command.Group heading="Image Tools">
              <Command.Item onSelect={() => onSelect('/tools/image/compress')}>Image Compressor</Command.Item>
              <Command.Item onSelect={() => onSelect('/tools/image/convert')}>Format Converter</Command.Item>
            </Command.Group>

            <Command.Group heading="Dev & Text Tools">
              <Command.Item onSelect={() => onSelect('/tools/dev/json')}>JSON Formatter</Command.Item>
              <Command.Item onSelect={() => onSelect('/tools/dev/regex')}>Regex Tester</Command.Item>
            </Command.Group>

            <Command.Group heading="AI Tools">
              <Command.Item onSelect={() => onSelect('/tools/ai/chat')}>AI Chat</Command.Item>
              <Command.Item onSelect={() => onSelect('/tools/ai/slides')}>Slide Maker</Command.Item>
            </Command.Group>

            <Command.Group heading="Utilities">
              <Command.Item onSelect={() => onSelect('/tools/utils/uuid')}>UUID Generator</Command.Item>
              <Command.Item onSelect={() => onSelect('/tools/utils/password')}>Password Generator</Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
