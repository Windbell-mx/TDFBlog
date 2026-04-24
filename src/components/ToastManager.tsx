import React, { useState } from 'react';
import Toast from './Toast';

interface ToastManagerProps {
  toasts: Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
    duration?: number;
  }>;
  onClose: (id: string) => void;
}

const ToastManager: React.FC<ToastManagerProps> = ({ toasts, onClose }) => {
  return (
    <div className="toast-manager">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => onClose(toast.id)}
        />
      ))}
    </div>
  );
};

export default ToastManager;