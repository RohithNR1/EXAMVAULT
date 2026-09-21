/**
 * Toast — presentational notification banner.
 *
 * Variants: success | error | warning | info
 *
 * A minimal container-only implementation. Consumer can render this directly
 * or attach it to a future ToastProvider. No global state is managed here.
 */
import React from "react";

const ICONS = {
  success: (
    <svg className="w-5 h-5 text-success-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5 text-danger-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5 text-warning-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5 text-info-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const VARIANTS = {
  success: "border-success-200 bg-success-50",
  error: "border-danger-200 bg-danger-50",
  warning: "border-warning-200 bg-warning-50",
  info: "border-info-200 bg-info-50",
};

export default function Toast({ variant = "info", title, message, onDismiss, className = "" }) {
  return (
    <div
      className={[
        "flex items-start gap-3 p-4 rounded-lg border shadow-soft",
        VARIANTS[variant] ?? VARIANTS.info,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role="alert"
      aria-live="polite"
    >
      {ICONS[variant]}
      <div className="flex-1 min-w-0">
        {title && <p className="text-sm font-semibold text-neutral-900">{title}</p>}
        {message && <p className="text-sm text-neutral-700 mt-0.5">{message}</p>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 p-0.5 rounded hover:bg-black/10 transition-colors"
          aria-label="Dismiss notification"
        >
          <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
