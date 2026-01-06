'use client';

import { useEffect } from 'react';
import type { Toast as ToastType } from './types';

interface ToastProps {
  toast: ToastType;
  onRemove: (id: string) => void;
}

const ToastIcon = ({ type }: { type: ToastType['type'] }) => {
  switch (type) {
    case 'success':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    case 'error':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    case 'warning':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    case 'info':
    default:
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
};

export default function Toast({ toast, onRemove }: ToastProps) {
  const duration = toast.duration ?? 3000;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onRemove(toast.id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [toast.id, duration, onRemove]);

  const getToastStyles = () => {
    const baseStyles = 'flex items-start gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm transition-all duration-300 min-w-[300px] max-w-[500px]';

    switch (toast.type) {
      case 'success':
        return `${baseStyles} bg-[var(--card-bg)] border-[var(--neon-cyan)] text-[var(--foreground)]`;
      case 'error':
        return `${baseStyles} bg-[var(--card-bg)] border-red-500 text-[var(--foreground)]`;
      case 'warning':
        return `${baseStyles} bg-[var(--card-bg)] border-yellow-500 text-[var(--foreground)]`;
      case 'info':
      default:
        return `${baseStyles} bg-[var(--card-bg)] border-[var(--electric-blue)] text-[var(--foreground)]`;
    }
  };

  const getIconColor = () => {
    switch (toast.type) {
      case 'success':
        return 'text-[var(--neon-cyan)]';
      case 'error':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      case 'info':
      default:
        return 'text-[var(--electric-blue)]';
    }
  };

  return (
    <div
      className={getToastStyles()}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className={`flex-shrink-0 ${getIconColor()}`}>
        <ToastIcon type={toast.type} />
      </div>
      <div className="flex-1 text-sm font-medium">{toast.message}</div>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors focus:outline-none"
        aria-label="Close notification"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

