'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const EditorClient = dynamic(() => import('./EditorClient'), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '20px' }}>
      <Loader2 className="animate-spin" size={48} color="var(--accent-primary)" />
      <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Loading PDF Editor...</p>
    </div>
  )
});

export default function PDFEditorPage() {
  return <EditorClient />;
}
