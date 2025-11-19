'use client';

import React, { useState, useEffect } from 'react';
import styles from './loading-overlay.module.css';

const LoadingOverlay: React.FC = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 200);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-white/80 dark:bg-white/80">
      <div className={styles.loader} />
    </div>
  );
};

export default LoadingOverlay;
