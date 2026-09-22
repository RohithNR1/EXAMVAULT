/**
 * ToastContext — global toast notification system.
 *
 * Provides a simple enqueue/dequeue mechanism so any component can show
 * a toast with a variant (success / error / warning / info) and an optional
 * title. Toasts auto-dismiss after 3 s unless they are errors.
 */
import { createContext, useContext, useState, useCallback } from "react";
import Toast from "../components/ui/Toast";

const ToastContext = createContext(null);

let _id = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((variant, title, message) => {
    const id = ++_id;
    setToasts((prev) => [...prev, { id, variant, title, message }]);
    const duration = variant === "error" ? 5000 : 3000;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }) {
  const { variant, title, message } = toast;
  return (
    <Toast
      variant={variant}
      title={title}
      message={message}
      onDismiss={onDismiss}
      className="pointer-events-auto"
    />
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx.addToast;
}

// Re-export the presentational Toast component for direct use
