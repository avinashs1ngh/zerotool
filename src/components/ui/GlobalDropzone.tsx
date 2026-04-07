'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud } from 'lucide-react';
import { useFileStore } from '@/store/file-store';
import styles from './GlobalDropzone.module.scss';
import { motion, AnimatePresence } from 'framer-motion';

export function GlobalDropzone() {
  const [isDragging, setIsDragging] = useState(false);
  const setDroppedFile = useFileStore((s) => s.setDroppedFile);
  const router = useRouter();

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    if (!e.dataTransfer?.types.includes('Files')) return;
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setDroppedFile(file);

      // Simple heuristic routing based on mime type
      if (file.type.includes('pdf')) {
        router.push('/tools/pdf/merge'); // Or a generic PDF viewer
      } else if (file.type.includes('image')) {
        router.push('/tools/image/compress');
      } else if (file.type.includes('json')) {
        router.push('/tools/dev/json');
      }
    }
  }, [router, setDroppedFile]);

  useEffect(() => {
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [handleDragOver, handleDragLeave, handleDrop]);

  return (
    <AnimatePresence>
      {isDragging && (
        <motion.div 
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className={styles.content}>
            <UploadCloud size={64} className={styles.icon} />
            <h2>Drop file to open</h2>
            <p>We'll automatically route you to the best tool.</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
