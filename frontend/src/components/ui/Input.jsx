/**
 * Input — shared form input primitive with label, error, and helper text.
 *
 * Props forwarded to the underlying <input> are preserved (type, name, etc.).
 * Uses auto-generated id for label/input/error association.
 */
import React, { useMemo } from "react";

export default function Input({
  label,
  error,
  helperText,
  id,
  className = "",
  required,
  ...rest
}) {
  const inputId = useMemo(() => id || `input-${Math.random().toString(36).slice(2, 8)}`, [id]);
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-neutral-700 mb-1"
        >
          {label}
          {required && <span className="text-danger-500 ml-0.5" aria-label="required">*</span>}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={[error ? errorId : null, helperText ? helperId : null].filter(Boolean).join(" ") || undefined}
        className={[
          "w-full rounded-lg border px-3 py-2 text-sm transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
          error
            ? "border-danger-400 bg-danger-50 text-danger-900 placeholder-danger-300"
            : "border-neutral-300 bg-surface text-neutral-900 placeholder-neutral-400",
          rest.disabled && "opacity-60 cursor-not-allowed",
        ]
          .filter(Boolean)
          .join(" ")}
        required={required}
        {...rest}
      />
      {error && (
        <p id={errorId} className="mt-1 text-xs text-danger-600" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={helperId} className="mt-1 text-xs text-neutral-500">
          {helperText}
        </p>
      )}
    </div>
  );
}
