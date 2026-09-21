/**
 * Modal — accessible dialog primitive.
 *
 * Closes on Escape key and backdrop click. Focus is trapped inside when open.
 * Uses native <dialog> when available, falls back gracefully.
 */
import React, { useEffect, useRef } from "react";

function getFocusable(el) {
  return Array.from(
    el.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
  );
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md", // sm | md | lg | xl
  ...rest
}) {
  const dialogRef = useRef(null);
  const previousFocus = useRef(null);

  const SIZE_MAP = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement;

    const el = dialogRef.current;
    if (!el) return;

    // Trap focus inside modal
    const handleTab = (e) => {
      const focusable = getFocusable(el);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    const handleKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKey);
    el.addEventListener("keydown", handleTab);
    el.focus();

    return () => {
      document.removeEventListener("keydown", handleKey);
      el.removeEventListener("keydown", handleTab);
      previousFocus.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
      {...rest}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <dialog
        ref={dialogRef}
        open
        className={[
          "relative w-full bg-surface rounded-xl shadow-2xl p-6",
          "border border-neutral-200",
          SIZE_MAP[size] ?? SIZE_MAP.md,
          "max-h-[90vh] overflow-y-auto",
        ]
          .filter(Boolean)
          .join(" ")}
        onClose={onClose}
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Title bar */}
        {(title || onClose) && (
          <div className="flex items-center justify-between mb-4">
            {title && (
              <h2 id="modal-title" className="text-lg font-semibold text-neutral-900">
                {title}
              </h2>
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
                aria-label="Close dialog"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="text-sm text-neutral-700">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="mt-6 pt-4 border-t border-neutral-200 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </dialog>
    </div>
  );
}
