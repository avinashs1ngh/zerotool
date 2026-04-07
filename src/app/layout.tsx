import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.scss';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { GlobalDropzone } from '@/components/ui/GlobalDropzone';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'ZeroTool | Offline-First Utility Hub',
  description: 'Browser-based, zero-tracking, offline-first developer and utility toolkit.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#050505',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body>
        <div id="app-root">
          <Navbar />
          <Sidebar />
          <main className="main-content">
            {children}
          </main>
          <CommandPalette />
          <GlobalDropzone />
        </div>
      </body>
    </html>
  );
}
