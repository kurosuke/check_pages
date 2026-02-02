"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

type ToastContextType = {
  showToast: (message: string, type: ToastType) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newToast: Toast = { id, message, type };

    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
      <style jsx>{`
        .toast-container {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-width: 420px;
        }

        @media (max-width: 640px) {
          .toast-container {
            top: 16px;
            right: 16px;
            left: 16px;
            max-width: none;
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const icons = {
    success: CheckCircle2,
    error: XCircle,
    info: Info,
  };

  const Icon = icons[toast.type];

  return (
    <div className={`toast toast-${toast.type}`} role="status" aria-live="polite">
      <div className="toast-icon">
        <Icon size={20} />
      </div>
      <span className="toast-message">{toast.message}</span>
      <button
        className="toast-close"
        onClick={() => onRemove(toast.id)}
        aria-label="閉じる"
      >
        <X size={16} />
      </button>
      <style jsx>{`
        .toast {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
          animation: toastSlideIn 300ms cubic-bezier(0, 0, 0.2, 1);
          backdrop-filter: blur(8px);
        }

        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateY(-16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .toast-icon {
          flex-shrink: 0;
          display: flex;
          align-items: center;
        }

        .toast-success {
          border-left: 3px solid var(--success);
        }

        .toast-success .toast-icon {
          color: var(--success);
        }

        .toast-error {
          border-left: 3px solid var(--error);
        }

        .toast-error .toast-icon {
          color: var(--error);
        }

        .toast-info {
          border-left: 3px solid var(--primary);
        }

        .toast-info .toast-icon {
          color: var(--primary);
        }

        .toast-message {
          flex: 1;
          font-size: 14px;
          line-height: 1.5;
          color: var(--text);
        }

        .toast-close {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: transparent;
          border: none;
          border-radius: 6px;
          color: var(--muted);
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }

        .toast-close:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text);
        }

        .toast-close:focus-visible {
          outline: 2px solid var(--primary);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
