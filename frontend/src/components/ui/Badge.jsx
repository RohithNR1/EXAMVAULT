/**
 * Badge — small semantic label for status / category tagging.
 *
 * Variants: primary | secondary | success | warning | danger | info | neutral
 * Sizes:    sm | md
 */
const VARIANTS = {
  primary: "bg-primary-100 text-primary-700",
  secondary: "bg-secondary-100 text-secondary-700",
  success: "bg-success-100 text-success-700",
  warning: "bg-warning-100 text-warning-700",
  danger: "bg-danger-100 text-danger-700",
  info: "bg-info-100 text-info-700",
  neutral: "bg-neutral-100 text-neutral-700",
};

const SIZES = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-0.5 text-sm",
};

export default function Badge({
  variant = "neutral",
  size = "md",
  className = "",
  children,
  ...rest
}) {
  return (
    <span
      className={[
        "inline-flex items-center font-medium rounded-full whitespace-nowrap",
        VARIANTS[variant] ?? VARIANTS.neutral,
        SIZES[size] ?? SIZES.md,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </span>
  );
}
