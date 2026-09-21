/**
 * Button — shared button primitive.
 *
 * Variants : primary | secondary | success | danger | ghost | outline
 * Sizes    : sm | md | lg
 *
 * Accessible defaults:
 *   - forwarded `disabled` prop adds aria-disabled
 *   - forwarded `type` (button/submit/reset) preserved
 *   - Loading state keeps the same outer dimensions so layout does not jump
 */
import React from "react";

const VARIANTS = {
  primary:
    "bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500",
  secondary:
    "bg-secondary-600 text-white hover:bg-secondary-700 focus-visible:ring-secondary-500",
  success:
    "bg-success-600 text-white hover:bg-success-700 focus-visible:ring-success-500",
  danger:
    "bg-danger-600 text-white hover:bg-danger-700 focus-visible:ring-danger-500",
  ghost:
    "bg-transparent text-neutral-700 hover:bg-neutral-100 border border-transparent focus-visible:ring-neutral-400",
  outline:
    "bg-transparent text-primary-600 border border-primary-600 hover:bg-primary-50 focus-visible:ring-primary-500",
};

const SIZES = {
  sm: "px-3 py-1.5 text-sm gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-5 py-3 text-base gap-2.5",
};

export default function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  className = "",
  children,
  disabled,
  ...rest
}) {
  const base =
    "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed";
  const variantClass = VARIANTS[variant] ?? VARIANTS.primary;
  const sizeClass = SIZES[size] ?? SIZES.md;

  return (
    <button
      className={[base, variantClass, sizeClass, className].join(" ")}
      disabled={disabled || isLoading}
      aria-busy={isLoading ? "true" : undefined}
      aria-disabled={disabled || isLoading ? "true" : undefined}
      {...rest}
    >
      {isLoading && (
        <svg
          className="animate-spin h-4 w-4 shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
