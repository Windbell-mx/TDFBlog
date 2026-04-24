import React, { useState, useEffect } from 'react';
import '../styles/Toast.css';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, duration = 3000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`toast toast-${type}`}>
      <div className="toast-content">
        <span className={`toast-icon ${type}`}>
          {type === 'success' && '✅'}
          {type === 'error' && '❌'}
          {type === 'info' && 'ℹ️'}
        </span>
        <span className="toast-message">{message}</span>
      </div>
      <button className="toast-close" onClick={onClose}>
        ×
      </button>
    </div>
  );
};

export default Toast;