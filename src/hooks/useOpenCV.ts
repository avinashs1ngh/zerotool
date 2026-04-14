'use client';

import { useState, useEffect } from 'react';

declare global {
  interface Window {
    cv: any;
    Module: any;
  }
}

export const useOpenCV = () => {
  const [cvStatus, setCvStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  useEffect(() => {
    // If already loaded, just return
    if (window.cv && window.cv.Mat) {
      setCvStatus('loaded');
      return;
    }

    // Monitor for the 'cv' object being ready
    // OpenCV.js is async and needs to wait for the Module to initialize
    const checkCv = setInterval(() => {
      if (window.cv && window.cv.Mat) {
        setCvStatus('loaded');
        clearInterval(checkCv);
      }
    }, 100);

    const script = document.createElement('script');
    script.id = 'opencv-js';
    // Using a reliable CDN for OpenCV 4.x
    script.src = 'https://docs.opencv.org/4.10.0/opencv.js';
    script.async = true;
    
    script.onload = () => {
      console.log('OpenCV.js script loaded');
    };

    script.onerror = () => {
      console.error('Failed to load OpenCV.js');
      setCvStatus('error');
      clearInterval(checkCv);
    };

    document.body.appendChild(script);

    return () => {
      clearInterval(checkCv);
      // We don't necessarily want to remove the script on unmount 
      // as other components might use it, but we cleanup the interval.
    };
  }, []);

  return cvStatus;
};
