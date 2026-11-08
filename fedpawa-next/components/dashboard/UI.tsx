// ==========================================================
// FEDPAWA — UI dashboards (vague D) : Toast + Modal
// Réplique fedpawa-ui.js (toast 4 s auto-dismiss, un seul à la
// fois, aria-live ; modal overlay + croix). Mêmes classes CSS
// (.fp-toast*, .fp-modal*) déjà présentes dans globals.css.
// ==========================================================

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

// ---------- Toast ----------

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

const TOAST_ICONS: Record<ToastType, ReactNode> = {
  success: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10" />
      <path d="M15 9l-6 6M9 9l6 6" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  ),
};

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

/** Hook d'accès au toast — à utiliser sous <DashboardUIProvider>. */
export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}

let toastSeq = 0;

export function DashboardUIProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = ++toastSeq;
      // un seul toast à la fois (parité fedpawa-ui.js)
      setToasts([{ id, message, type }]);
      window.setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  const value = { toast };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fp-toast-container" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`fp-toast fp-toast-${t.type} show`}
            onClick={() => dismiss(t.id)}
          >
            <span className="fp-toast-icon">{TOAST_ICONS[t.type]}</span>
            <div className="fp-toast-body">{t.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ---------- Modal ----------

export interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Empêche la fermeture au clic sur l'overlay (flux OTP). */
  disableOverlayClose?: boolean;
}

export function Modal({
  title,
  onClose,
  children,
  disableOverlayClose = false,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  // Échap ferme (sauf flux verrouillé OTP, parité disableOverlayClose)
  useEffect(() => {
    if (disableOverlayClose) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, disableOverlayClose]);

  return (
    <div
      className="fp-modal-overlay open"
      ref={overlayRef}
      onClick={(e) => {
        if (disableOverlayClose) return;
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="fp-modal" role="dialog" aria-modal="true" aria-label={title}>
        <button
          type="button"
          className="fp-modal-x"
          aria-label="Fermer"
          onClick={onClose}
        >
          &times;
        </button>
        {title ? <h3 className="fp-modal-title">{title}</h3> : null}
        {children}
      </div>
    </div>
  );
}
