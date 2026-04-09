'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { 
  CreditCard, Upload, Download, RotateCcw, 
  User, Calendar, Hash, Type, Image as ImageIcon
} from 'lucide-react';
import styles from './IDMaker.module.scss';
import { motion } from 'framer-motion';

const TEMPLATES = [
  { id: 'professional', name: 'Professional', desc: 'Sleek & modern design' },
  { id: 'standard', name: 'Standard Govt', desc: 'Classic horizontal layout' },
];

export default function IDMakerPage() {
  const [formData, setFormData] = useState({
    name: 'JOHN DOE',
    dob: '01/01/1990',
    idNumber: '1234 5678 9012',
    address: '123 Main St, New York, NY',
    gender: 'Male'
  });
  const [photo, setPhoto] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('professional');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value.toUpperCase() }));
  };

  const onPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const reader = new FileReader();
      reader.onload = () => setPhoto(reader.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const drawCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high resolution for printing (approx 1000px width)
    canvas.width = 1011;
    canvas.height = 638;

    // Background
    if (selectedTemplate === 'professional') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Accents
      ctx.fillStyle = '#1a73e8';
      ctx.fillRect(0, 0, 30, canvas.height);
      ctx.fillRect(0, 0, canvas.width, 100);
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 40px Inter, Arial';
      ctx.fillText('IDENTITY CARD', 60, 65);
    } else {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#1a73e8';
      ctx.lineWidth = 15;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#1a73e8';
      ctx.font = 'bold 36px Arial';
      ctx.fillText('DOCUMENT OF IDENTITY', 300, 60);
    }

    // Photo
    if (photo) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 60, 140, 220, 280);
        ctx.strokeStyle = '#ddd';
        ctx.strokeRect(60, 140, 220, 280);
        finishDrawing();
      };
      img.src = photo;
    } else {
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(60, 140, 220, 280);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '24px Arial';
      ctx.fillText('NO PHOTO', 110, 290);
      finishDrawing();
    }

    function finishDrawing() {
      if (!ctx) return;
      ctx.fillStyle = '#1e293b';
      
      // Text Fields
      ctx.font = 'bold 24px Arial';
      ctx.fillText('NAME:', 320, 180);
      ctx.font = '36px Arial';
      ctx.fillText(formData.name || '---', 320, 230);

      ctx.font = 'bold 24px Arial';
      ctx.fillText('DATE OF BIRTH:', 320, 290);
      ctx.font = '32px Arial';
      ctx.fillText(formData.dob || '---', 320, 335);

      ctx.font = 'bold 24px Arial';
      ctx.fillText('GENDER:', 650, 290);
      ctx.font = '32px Arial';
      ctx.fillText(formData.gender || '---', 650, 335);

      ctx.font = 'bold 24px Arial';
      ctx.fillText('ID NUMBER:', 320, 400);
      ctx.font = 'bold 42px monospace';
      ctx.fillStyle = '#1a73e8';
      ctx.fillText(formData.idNumber || '---', 320, 460);
      
      // Footer/Address
      ctx.fillStyle = '#64748b';
      ctx.font = '20px Arial';
      ctx.fillText(formData.address || '', 60, 580);
    }
  };

  useEffect(() => {
    drawCard();
  }, [formData, photo, selectedTemplate]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <CreditCard size={32} className={styles.icon} />
          <div>
            <h1>ID Card Maker</h1>
            <p>Generate identity cards instantly using professional templates.</p>
          </div>
        </div>
      </header>

      <div className={styles.makerGrid}>
        <div className={styles.controlsCol}>
          <Card className={styles.card}>
            <h3>1. Choose Template</h3>
            <div className={styles.templateGrid}>
              {TEMPLATES.map(t => (
                <button 
                  key={t.id}
                  className={`${styles.templateBtn} ${selectedTemplate === t.id ? styles.active : ''}`}
                  onClick={() => setSelectedTemplate(t.id)}
                >
                  <h5>{t.name}</h5>
                  <span>{t.desc}</span>
                </button>
              ))}
            </div>

            <h3>2. Personal Details</h3>
            <div className={styles.inputGroup}>
              <label>Full Name</label>
              <input name="name" value={formData.name} onChange={handleInputChange} placeholder="Enter Name" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className={styles.inputGroup}>
                <label>Date of Birth</label>
                <input name="dob" value={formData.dob} onChange={handleInputChange} placeholder="DD/MM/YYYY" />
              </div>
              <div className={styles.inputGroup}>
                <label>Gender</label>
                <input name="gender" value={formData.gender} onChange={handleInputChange} placeholder="M / F" />
              </div>
            </div>
            <div className={styles.inputGroup}>
              <label>ID Number</label>
              <input name="idNumber" value={formData.idNumber} onChange={handleInputChange} placeholder="0000 0000 0000" />
            </div>
            <div className={styles.inputGroup}>
              <label>Address Info</label>
              <input name="address" value={formData.address} onChange={handleInputChange} placeholder="City, State, Country" />
            </div>

            <h3>3. Upload Photo</h3>
            <div className={styles.photoUpload} onClick={() => document.getElementById('id-photo-input')?.click()}>
              <input type="file" id="id-photo-input" hidden accept="image/*" onChange={onPhotoChange} />
              {photo ? (
                <img src={photo} alt="Preview" />
              ) : (
                <div style={{ padding: '20px' }}>
                  <ImageIcon size={32} color="var(--accent-primary)" style={{ marginBottom: 8 }} />
                  <p style={{ fontSize: '0.8rem' }}>Click to select photo</p>
                </div>
              )}
            </div>

            <Button 
              variant="primary" 
              size="lg" 
              fullWidth 
              style={{ marginTop: 32 }}
              onClick={() => {
                const link = document.createElement('a');
                link.download = 'id_card.png';
                link.href = canvasRef.current?.toDataURL() || '';
                link.click();
              }}
            >
              <Download size={18} />
              Download ID Card
            </Button>
          </Card>
        </div>

        <div className={styles.previewCol}>
          <div className={styles.idCardPreview}>
            <canvas ref={canvasRef} className={styles.idCardCanvas} />
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Live Preview (High Resolution 1011x638)
          </p>
        </div>
      </div>
    </div>
  );
}
