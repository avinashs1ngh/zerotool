'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { 
  CreditCard, Upload, Download, RotateCcw, 
  User, Calendar, Hash, Type, Image as ImageIcon, ArrowLeft
} from 'lucide-react';
import styles from './IDMaker.module.scss';
import { motion } from 'framer-motion';
import Link from 'next/link';

const TEMPLATES = [
  { id: 'modern', name: 'Modern Pro', desc: 'Sleek & high-tech' },
  { id: 'classic', name: 'Classic Gold', desc: 'Standard business look' },
  { id: 'minimal', name: 'Minimalist', desc: 'Clean & whitespace-heavy' },
];

export default function IDMakerPage() {
  const [formData, setFormData] = useState({
    name: 'ELARA VANCE',
    organization: 'QUANTUM DYNAMICS',
    role: 'SENIOR ARCHITECT',
    dob: '12/04/1992',
    idNumber: 'QD-9942-X',
    address: 'Tech District, Silicon Valley, CA',
    gender: 'Female'
  });
  const [photo, setPhoto] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value.toUpperCase() }));
  };

  const onPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const drawCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High fidelity dimensions
    canvas.width = 1011;
    canvas.height = 638;

    const { name, organization, role, dob, idNumber, address, gender } = formData;

    // Base Layer
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (selectedTemplate === 'modern') {
      // Modern Sidebar Gradient
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 300, canvas.height);

      // Accent lines
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(0, 580, canvas.width, 58);

      // Header Text
      ctx.fillStyle = 'white';
      ctx.font = 'bold 32px Inter, Arial, sans-serif';
      ctx.fillText('OFFICIAL IDENTITY', 40, 60);
      
      ctx.font = '24px Arial';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(organization || 'COMPANY NAME', 40, 95);

      if (photo) {
        const img = new Image();
        img.onload = () => {
          // Circular or Rounded Photo
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(40, 140, 220, 260, 20);
          ctx.clip();
          ctx.drawImage(img, 40, 140, 220, 260);
          ctx.restore();
          
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 4;
          ctx.strokeRect(40, 140, 220, 260);
          renderModernText();
        };
        img.src = photo;
      } else {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(40, 140, 220, 260);
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText('NO PHOTO', 100, 280);
        renderModernText();
      }

      function renderModernText() {
        if (!ctx) return;
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 22px Arial';
        ctx.fillText('FULL NAME', 340, 180);
        ctx.font = '800 52px Arial';
        ctx.fillText(name || '---', 340, 240);

        ctx.fillStyle = '#3b82f6';
        ctx.font = 'bold 32px Arial';
        ctx.fillText(role || '---', 340, 290);

        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('ID NUMBER', 340, 380);
        ctx.font = 'bold 36px monospace';
        ctx.fillStyle = '#0f172a';
        ctx.fillText(idNumber || '---', 340, 425);

        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#64748b';
        ctx.fillText('DOB', 340, 480);
        ctx.fillStyle = '#0f172a';
        ctx.font = '28px Arial';
        ctx.fillText(dob || '---', 340, 520);

        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#64748b';
        ctx.fillText('GENDER', 600, 480);
        ctx.fillStyle = '#0f172a';
        ctx.font = '28px Arial';
        ctx.fillText(gender || '---', 600, 520);

        ctx.fillStyle = 'white';
        ctx.font = '18px Arial';
        ctx.fillText(address || '', 40, 615);
      }
    } else if (selectedTemplate === 'classic') {
       // Classic Business Layout
       ctx.fillStyle = '#1a365d';
       ctx.fillRect(0, 0, canvas.width, 140);
       
       ctx.fillStyle = 'white';
       ctx.font = 'bold 44px Georgia, serif';
       ctx.textAlign = 'center';
       ctx.fillText(organization || 'CORPORATION', canvas.width/2, 65);
       ctx.font = '24px Arial';
       ctx.fillText('STAFF IDENTIFICATION', canvas.width/2, 105);
       ctx.textAlign = 'left';

       if (photo) {
         const img = new Image();
         img.onload = () => {
           ctx.drawImage(img, canvas.width - 280, 180, 220, 280);
           ctx.strokeStyle = '#1a365d';
           ctx.lineWidth = 5;
           ctx.strokeRect(canvas.width - 280, 180, 220, 280);
           renderClassicText();
         };
         img.src = photo;
       } else {
         renderClassicText();
       }

       function renderClassicText() {
          if (!ctx) return;
          ctx.fillStyle = '#1a365d';
          ctx.font = 'bold 24px Arial';
          ctx.fillText('NAME:', 60, 240);
          ctx.font = 'bold 44px Arial';
          ctx.fillText(name || '---', 60, 290);

          ctx.font = 'bold 24px Arial';
          ctx.fillText('POSITION:', 60, 370);
          ctx.font = '36px Arial';
          ctx.fillText(role || '---', 60, 420);

          ctx.font = 'bold 20px Arial';
          ctx.fillText('ID NO:', 60, 490);
          ctx.font = 'bold 36px Arial';
          ctx.fillText(idNumber || '---', 60, 540);
       }
    } else {
       // Minimalist
       ctx.fillStyle = '#f8fafc';
       ctx.fillRect(0, 0, canvas.width, canvas.height);
       
       ctx.strokeStyle = '#e2e8f0';
       ctx.lineWidth = 2;
       ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

       if (photo) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 80, 80, 160, 160);
          renderMinimalText();
        };
        img.src = photo;
       } else {
         renderMinimalText();
       }

       function renderMinimalText() {
          if (!ctx) return;
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 64px Arial';
          ctx.fillText(name || '---', 280, 140);
          ctx.font = '32px Arial';
          ctx.fillStyle = '#64748b';
          ctx.fillText(role || '---', 280, 190);
          
          ctx.font = 'bold 24px Arial';
          ctx.fillStyle = '#000';
          ctx.fillText('ORGANIZATION', 80, 320);
          ctx.font = '36px Arial';
          ctx.fillText(organization || '---', 80, 370);
       }
    }
  };

  useEffect(() => {
    drawCard();
  }, [formData, photo, selectedTemplate]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <Link href="/tools/utils" className={styles.backBtn}>
            <ArrowLeft size={20} />
          </Link>
          <CreditCard size={32} className={styles.icon} />
          <div>
            <h1>ID Card Maker</h1>
            <p>Generate professional-grade identity cards for your staff or organization.</p>
          </div>
        </div>
      </header>

      <div className={styles.makerGrid}>
        <div className={styles.controlsCol}>
          <Card className={styles.card}>
            <h4 className="text-xs font-black uppercase tracking-widest text-secondary mb-4">1. Choice of Design</h4>
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

            <h4 className="text-xs font-black uppercase tracking-widest text-secondary mb-4">2. Identity Details</h4>
            <div className={styles.inputGroup}>
              <label>Full Name</label>
              <input name="name" value={formData.name} onChange={handleInputChange} placeholder="Enter Full Name" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className={styles.inputGroup}>
                <label>Organization</label>
                <input name="organization" value={formData.organization} onChange={handleInputChange} placeholder="Company Name" />
              </div>
              <div className={styles.inputGroup}>
                <label>Job Title / Role</label>
                <input name="role" value={formData.role} onChange={handleInputChange} placeholder="Role" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className={styles.inputGroup}>
                <label>Date of Birth</label>
                <input name="dob" value={formData.dob} onChange={handleInputChange} placeholder="DD/MM/YYYY" />
              </div>
              <div className={styles.inputGroup}>
                <label>Gender</label>
                <input name="gender" value={formData.gender} onChange={handleInputChange} placeholder="Male / Female" />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>ID Number</label>
              <input name="idNumber" value={formData.idNumber} onChange={handleInputChange} placeholder="Unique ID Number" />
            </div>

            <div className={styles.inputGroup}>
              <label>Address Info</label>
              <input name="address" value={formData.address} onChange={handleInputChange} placeholder="Full Address" />
            </div>

            <h4 className="text-xs font-black uppercase tracking-widest text-secondary mb-4">3. Profile Portrait</h4>
            <div className={styles.photoUpload} onClick={() => document.getElementById('id-photo-input')?.click()}>
              <input type="file" id="id-photo-input" hidden accept="image/*" onChange={onPhotoChange} />
              {photo ? (
                <div className="flex flex-col items-center">
                   <img src={photo} alt="Preview" />
                   <p className="text-[10px] text-primary font-bold">Portrait Loaded Successfully</p>
                </div>
              ) : (
                <div style={{ padding: '10px' }}>
                  <ImageIcon size={32} color="var(--accent-primary)" className="mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-secondary">Click to upload photo</p>
                </div>
              )}
            </div>

            <Button 
              variant="primary" 
              size="lg" 
              fullWidth 
              style={{ marginTop: 24, padding: '1.25rem', borderRadius: '1rem' }}
              onClick={() => {
                const link = document.createElement('a');
                link.download = `ID_${formData.name.replace(/\s+/g, '_')}.png`;
                link.href = canvasRef.current?.toDataURL() || '';
                link.click();
              }}
            >
              <Download size={18} />
              Export HD Identity Card
            </Button>
          </Card>
        </div>

        <div className={styles.previewCol}>
          <div className={styles.idCardPreview}>
            <canvas ref={canvasRef} className={styles.idCardCanvas} />
          </div>
          <div className="flex flex-col items-center gap-1">
             <p className="text-primary font-black text-[10px] uppercase tracking-tighter">Live Industrial Preview</p>
             <p className="text-muted text-[10px]">High Res (1011 x 638) • CR-80 Standard • 300 DPI</p>
          </div>
        </div>
      </div>
    </div>
  );
}
