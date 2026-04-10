'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import Cropper from 'react-easy-crop';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { 
  UserCircle, Upload, Download, RotateCcw, 
  ArrowLeft, Grid3X3, Printer, CheckCircle2 
} from 'lucide-react';
import styles from './PassportPhoto.module.scss';
import { getCroppedImg, generatePrintGrid } from '@/utils/canvas-utils';
import { motion, AnimatePresence } from 'framer-motion';

const PASSPORT_SIZES = [
  { id: 'in', label: 'India', width: 3.5, height: 4.5, unit: 'cm', aspect: 3.5 / 4.5 },
  { id: 'us', label: 'United States', width: 2, height: 2, unit: 'inch', aspect: 1 },
  { id: 'uk', label: 'United Kingdom', width: 35, height: 45, unit: 'mm', aspect: 35 / 45 },
  { id: 'cn', label: 'China', width: 33, height: 48, unit: 'mm', aspect: 33 / 48 },
  { id: 'id', label: 'Indonesia', width: 3, height: 4, unit: 'cm', aspect: 3 / 4 },
  { id: 'generic', label: 'Standard', width: 3.5, height: 4.5, unit: 'cm', aspect: 3.5 / 4.5 },
];

export default function PassportPhotoPage() {
  const [image, setImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [selectedSize, setSelectedSize] = useState(PASSPORT_SIZES[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [gridResult, setGridResult] = useState<string | null>(null);
  const [gridCols, setGridCols] = useState(2);
  const [gridRows, setGridRows] = useState(4);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => setImage(reader.result as string));
      reader.readAsDataURL(file);
    }
  };

  const showCroppedImage = async () => {
    try {
      setIsProcessing(true);
      const croppedImage = await getCroppedImg(image!, croppedAreaPixels, rotation);
      if (croppedImage) {
        setResult(URL.createObjectURL(croppedImage));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateGrid = async () => {
    if (!result) return;
    try {
      setIsProcessing(true);
      const gridBlob = await generatePrintGrid(
        result,
        selectedSize.unit === 'cm' ? selectedSize.width * 10 : selectedSize.unit === 'inch' ? selectedSize.width * 25.4 : selectedSize.width,
        selectedSize.unit === 'cm' ? selectedSize.height * 10 : selectedSize.unit === 'inch' ? selectedSize.height * 25.4 : selectedSize.height,
        6, 4, // default paper size
        gridCols,
        gridRows
      );
      if (gridBlob) {
        setGridResult(URL.createObjectURL(gridBlob));
        setShowGrid(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = (url: string, name: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    setGridResult(null);
    setShowGrid(false);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <Link href="/tools/image" className={styles.backBtn}>
            <ArrowLeft size={20} />
          </Link>
          <UserCircle size={32} className={styles.icon} />
          <div>
            <h1>Passport Photo Maker</h1>
            <p>Generate professional-grade passport photos locally.</p>
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {!image ? (
          <motion.div 
            key="upload"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className={styles.uploadArea}
            onClick={() => document.getElementById('passport-upload')?.click()}
          >
            <input 
              type="file" 
              id="passport-upload" 
              accept="image/*" 
              className={styles.fileInput} 
              onChange={onFileChange} 
            />
            <div className={styles.uploadLabel}>
              <Upload size={48} color="var(--accent-primary)" />
              <span>Click to upload or drag & drop</span>
              <p>Supports JPG, PNG, WEBP (Maximum 20MB)</p>
            </div>
          </motion.div>
        ) : !result ? (
          <motion.div 
            key="editor"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.editorGrid}
          >
            <div className={styles.cropWrapper}>
              <div className={styles.cropContainer}>
                <Cropper
                  image={image}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={selectedSize.aspect}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>
            </div>

            <div className={styles.controls}>
              <Card className={styles.card}>
                <h3>Select Country Size</h3>
                <select 
                  className={styles.sizeSelect}
                  value={selectedSize.id}
                  onChange={(e) => {
                    const size = PASSPORT_SIZES.find(s => s.id === e.target.value);
                    if (size) setSelectedSize(size);
                  }}
                >
                  {PASSPORT_SIZES.map((size) => (
                    <option key={size.id} value={size.id}>
                      {size.label} ({size.width}{size.unit} x {size.height}{size.unit})
                    </option>
                  ))}
                </select>
              </Card>

              <Card className={styles.card}>
                <h3>Adjustments</h3>
                <div className={styles.sliderGroup}>
                  <label>Zoom</label>
                  <input 
                    type="range" 
                    min={1} 
                    max={3} 
                    step={0.1} 
                    value={zoom} 
                    onChange={(e) => setZoom(Number(e.target.value))} 
                  />
                </div>
                <div className={styles.sliderGroup}>
                  <label>Rotation</label>
                  <input 
                    type="range" 
                    min={0} 
                    max={360} 
                    step={1} 
                    value={rotation} 
                    onChange={(e) => setRotation(Number(e.target.value))} 
                  />
                </div>
              </Card>

              <div className={styles.actions}>
                <Button variant="primary" size="lg" onClick={showCroppedImage} isLoading={isProcessing}>
                  Generate Photo
                </Button>
                <Button variant="ghost" onClick={() => setImage(null)}>
                  Change Image
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={styles.resultView}
          >
            <div className={styles.card}>
              <div className={styles.successHeader}>
                <CheckCircle2 color="var(--accent-green)" size={24} />
                <h3>Your Passport Photo is Ready</h3>
              </div>
              
              <div className={styles.previewContainer}>
                <img 
                  src={showGrid && gridResult ? gridResult : result} 
                  alt="Result" 
                  className={styles.previewImage} 
                  style={showGrid ? { maxWidth: '100%', height: 'auto' } : { width: '200px' }}
                />
              </div>

              <div className={styles.resultActions}>
                <div className={styles.gridOptions}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <Button 
                      variant={!showGrid ? 'primary' : 'secondary'} 
                      onClick={() => setShowGrid(false)}
                      style={{ flex: 1 }}
                    >
                      Single Photo
                    </Button>
                    <Button 
                      variant={showGrid ? 'primary' : 'secondary'} 
                      onClick={handleGenerateGrid}
                      isLoading={isProcessing && !gridResult}
                      style={{ flex: 1 }}
                    >
                      Generate Print Grid
                    </Button>
                  </div>

                  {showGrid && (
                    <div className={styles.gridConfig}>
                      <div className={styles.inputField}>
                        <label>Columns</label>
                        <input 
                          type="number" 
                          min={1} 
                          max={10} 
                          value={gridCols} 
                          onChange={(e) => setGridCols(Number(e.target.value))} 
                        />
                      </div>
                      <div className={styles.inputField}>
                        <label>Rows</label>
                        <input 
                          type="number" 
                          min={1} 
                          max={10} 
                          value={gridRows} 
                          onChange={(e) => setGridRows(Number(e.target.value))} 
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.downloadGroup}>
                  <Button 
                    variant="primary" 
                    size="lg" 
                    onClick={() => downloadImage(showGrid ? gridResult! : result!, `passport_${selectedSize.id}.jpg`)}
                  >
                    <Download size={18} />
                    Download {showGrid ? 'Printable Grid' : 'Photo'}
                  </Button>
                  <Button variant="ghost" onClick={() => setResult(null)}>
                    <RotateCcw size={18} />
                    Edit Crop
                  </Button>
                  <Button variant="ghost" onClick={reset}>
                    Start New
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
