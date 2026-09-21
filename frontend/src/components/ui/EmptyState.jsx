/**
 * EmptyState — placeholder shown when there is no data to display.
 *
 * Props:
 *   icon      — custom React element rendered above the title
 *   title     — required heading
 *   description — optional supporting text
 *   action    — optional React element (typically a <Button>) rendered below
 */
export default function EmptyState({ icon, title, description, action, className = "" }) {
  return (
    <div
      className={[
        "flex flex-col items-center justify-center py-16 px-4 text-center",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role="status"
    >
      {icon && <div className="text-neutral-400 mb-4">{icon}</div>}
      <h3 className="text-base font-semibold text-neutral-700 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-neutral-500 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
