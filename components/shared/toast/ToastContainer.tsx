'use client';

import { useEffect, useState } from 'react';
import { useToast } from './useToast';
import Toast from './Toast';

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();
  const [exitingToasts, setExitingToasts] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Handle toast removal with exit animation
    const handleRemove = (id: string) => {
      setExitingToasts((prev) => new Set(prev).add(id));
      setTimeout(() => {
        removeToast(id);
        setExitingToasts((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 200); // Match animation duration
    };

    // Store the handler for cleanup
    return () => {};
  }, [removeToast]);

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => {
        const isExiting = exitingToasts.has(toast.id);
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto ${
              isExiting ? 'animate-toast-exit' : 'animate-toast-enter'
            }`}
          >
            <Toast
              toast={toast}
              onRemove={(id) => {
                setExitingToasts((prev) => new Set(prev).add(id));
                setTimeout(() => removeToast(id), 200);
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

