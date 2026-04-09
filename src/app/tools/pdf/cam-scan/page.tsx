'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const CamScannerClient = dynamic(
  () => import('./CamScannerClient'),
  { ssr: false }
);

export default function CamScannerPage() {
  return <CamScannerClient />;
}
