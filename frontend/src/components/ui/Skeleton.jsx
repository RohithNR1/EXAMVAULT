/**
 * Skeleton — loading placeholder for async content.
 *
 * Renders an animated shimmer block. Accepts any Tailwind classes for sizing.
 */
export default function Skeleton({ className = "", role = "status", "aria-label": ariaLabel = "Loading..." }) {
  return (
    <div
      className={[
        "animate-pulse bg-neutral-200 rounded-lg",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role={role}
      aria-label={ariaLabel}
      aria-busy="true"
    />
  );
}

/**
 * CardSkeleton — pre-built skeleton matching Card shape.
 */
export function CardSkeleton({ lines = 3 }) {
  return (
    <div className="bg-surface border border-neutral-200 rounded-xl p-5 space-y-3">
      <Skeleton className="h-5 w-3/4" />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  );
}
