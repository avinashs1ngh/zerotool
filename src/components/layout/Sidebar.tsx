'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FileText, Image as ImageIcon, Code, Bot, 
  TerminalSquare, X, Zap, BrainCircuit 
} from 'lucide-react';
import { useUIStore } from '@/store/ui-store';
import styles from './Sidebar.module.scss';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = [
  {
    title: 'PDF Tools',
    icon: <FileText size={20} />,
    color: 'var(--accent-rose)',
    href: '/tools/pdf'
  },
  {
    title: 'Image Tools',
    icon: <ImageIcon size={20} />,
    color: 'var(--accent-cyan)',
    href: '/tools/image'
  },
  {
    title: 'Bria AI',
    icon: <BrainCircuit size={20} />,
    color: 'var(--accent-purple)',
    href: '/tools/bria'
  },
  {
    title: 'Dev & Text',
    icon: <Code size={20} />,
    color: 'var(--accent-purple)',
    href: '/tools/dev'
  },
  {
    title: 'AI Tools',
    icon: <Bot size={20} />,
    color: 'var(--accent-green)',
    href: '/tools/ai'
  },
  {
    title: 'Utilities',
    icon: <TerminalSquare size={20} />,
    color: 'var(--accent-primary)',
    href: '/tools/utils'
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarOpen, closeSidebar } = useUIStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isSidebarOpen && (
        <>
          <motion.div 
            className={styles.backdrop} 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSidebar}
          />
          <motion.aside 
            className={styles.sidebar}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className={styles.header}>
              <Link href="/" className={styles.logo} onClick={closeSidebar}>
                <Zap size={24} color="var(--accent-cyan)" />
                <span>ZeroTool</span>
              </Link>
              <button className={styles.closeBtn} onClick={closeSidebar}>
                <X size={24} />
              </button>
            </div>

            <div className={styles.scrollArea}>
              <div className={styles.navLinks}>
                {CATEGORIES.map((cat, i) => {
                  const isActive = pathname === cat.href || pathname.startsWith(cat.href + '/');
                  return (
                    <Link 
                      key={i} 
                      href={cat.href} 
                      className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                      onClick={closeSidebar}
                    >
                      <span className={styles.icon} style={{ color: cat.color }}>
                        {cat.icon}
                      </span>
                      <span className={styles.title}>{cat.title}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className={styles.footer}>
              <p>© 2026 ZeroTool</p>
              <span>Stay Private. Stay Fast.</span>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
