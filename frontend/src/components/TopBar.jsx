import { useNavigate } from "react-router-dom";

/**
 * TopBar — application header strip.
 *
 * Reads user identity from localStorage (same source as ProtectedRoute).
 * Logout clears all stored auth data and hard-redirects to /login,
 * matching the existing behaviour of Student / COE / Superintendent.
 */
export default function TopBar({ onMenuToggle, isOpen = false }) {
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "User";
  const role = localStorage.getItem("role") || "";

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-20 h-14 px-4 bg-surface border-b border-neutral-200 flex items-center justify-between shadow-soft">
      {/* Left: mobile menu button */}
      <button
        type="button"
        className="md:hidden p-2 rounded-md text-neutral-600 hover:bg-neutral-100 transition-colors"
        onClick={onMenuToggle}
        aria-label="Toggle navigation menu"
        aria-expanded={isOpen}
        aria-controls="mobile-nav-overlay"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Right: user info + logout */}
      <div className="flex items-center gap-3 ml-auto">
        <div className="hidden sm:flex flex-col items-end leading-tight">
          <span className="text-sm font-semibold text-neutral-800">{username}</span>
          {role && (
            <span className="text-xs text-neutral-500 capitalize">{role}</span>
          )}
        </div>
        <button
          type="button"
          className="px-3 py-1.5 text-sm font-medium text-white bg-danger-600 rounded-md hover:bg-danger-700 transition-colors"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </header>
  );
}
