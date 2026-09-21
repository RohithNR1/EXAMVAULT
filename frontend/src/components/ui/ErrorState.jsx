/**
 * ErrorState — placeholder shown when an operation fails.
 *
 * Props:
 *   title     — optional heading (defaults to "Something went wrong")
 *   description — optional supporting text
 *   retry     — optional handler; if provided a Retry button is shown
 */
export default function ErrorState({
  title = "Something went wrong",
  description,
  retry,
  onRetry,
  className = "",
}) {
  return (
    <div
      className={[
        "flex flex-col items-center justify-center py-16 px-4 text-center",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role="alert"
    >
      <svg
        className="w-12 h-12 text-danger-400 mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <h3 className="text-base font-semibold text-neutral-800 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-neutral-500 max-w-sm">{description}</p>
      )}
      {retry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          {retry}
        </button>
      )}
    </div>
  );
}
