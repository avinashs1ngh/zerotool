'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, Zap, Search } from 'lucide-react';
import { useUIStore } from '@/store/ui-store';
import styles from './Navbar.module.scss';

export function Navbar() {
  const { toggleSidebar, isSidebarOpen } = useUIStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <nav className={styles.navbar}>
        <div className={styles.left}>
          <div className={styles.menuBtn}><Menu size={24} /></div>
          <div className={styles.logo}>
            <Zap size={24} color="var(--accent-cyan)" />
            <span>ZeroTool</span>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className={styles.navbar}>
      <div className={styles.left}>
        <button className={styles.menuBtn} onClick={toggleSidebar} aria-label="Toggle Menu">
          <Menu size={24} />
        </button>
        <Link href="/" className={styles.logo}>
          <Zap size={24} color="var(--accent-cyan)" />
          <span>ZeroTool</span>
        </Link>
      </div>

      <div className={styles.right}>
        {/* Command Palette Hint */}
        <div className={styles.searchHint} onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}>
          <Search size={18} />
          <span>Search tools...</span>
          <kbd>Ctrl+K</kbd>
        </div>
      </div>
    </nav>
  );
}
