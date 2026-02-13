import React from 'react';

interface ToastProps {
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
}

const typeStyles = {
  success: 'bg-green-50 dark:bg-green-900/30 border-green-500 text-green-800 dark:text-green-200',
  error: 'bg-red-50 dark:bg-red-900/30 border-red-500 text-red-800 dark:text-red-200',
  info: 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-800 dark:text-blue-200',
  warning: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-500 text-yellow-800 dark:text-yellow-200',
};

const typeIcons = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
};

export default function Toast({ title, message, type, onClose }: ToastProps) {
  return (
    <div className={`border-l-4 rounded-lg p-4 shadow-lg max-w-sm ${typeStyles[type]} animate-slide-in`}>
      <div className="flex items-start gap-3">
        <span className="text-lg font-bold">{typeIcons[type]}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{title}</p>
          <p className="text-sm opacity-80 mt-0.5">{message}</p>
        </div>
        <button onClick={onClose} className="text-lg opacity-50 hover:opacity-100">
          ×
        </button>
      </div>
    </div>
  );
}
