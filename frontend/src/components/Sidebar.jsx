import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

const ROLE_NAV = {
  teacher: [
    { label: "Dashboard", href: "/teacher", icon: "⊞" },
    { label: "Pending Requests", href: "/teacher", icon: "⏳" },
    { label: "Accepted Requests", href: "/teacher", icon: "✓" },
  ],
  coe: [
    { label: "Dashboard", href: "/coe", icon: "⊞" },
    { label: "Request Management", href: "/coe", icon: "📋" },
    { label: "Scrutiny Dashboard", href: "/coe", icon: "🔍" },
  ],
  student: [
    { label: "My Results", href: "/student", icon: "📄" },
  ],
  superintendent: [
    { label: "Dashboard", href: "/superintendent", icon: "⊞" },
    { label: "Final Papers", href: "/superintendent", icon: "📑" },
    { label: "Audit Log", href: "/superintendent", icon: "📋" },
  ],
};

const DEFAULT_NAV = [];

/**
 * Reads the current role from localStorage once on mount.
 * Returns "teacher" as fallback so the component never crashes before
 * the authenticated pages populate the value.
 */
function getRole() {
  return localStorage.getItem("role") || "teacher";
}

export default function Sidebar({ open, onClose }) {
  const location = useLocation();
  const [role, setRole] = useState(() => getRole());

  useEffect(() => {
    // Listen for localStorage changes across tabs/windows so the role badge stays in sync
    window.addEventListener("storage", () => setRole(getRole()));
    return () => window.removeEventListener("storage", () => setRole(getRole()));
  }, []);

  const items = ROLE_NAV[role] ?? DEFAULT_NAV;
  const displayName = role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-40 h-full w-64
          bg-surface border-r border-neutral-200
          flex flex-col
          transition-transform duration-200 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:static md:z-0
        `}
        aria-label="Main navigation"
      >
        {/* Brand in sidebar */}
        <div className="px-5 py-4 border-b border-neutral-200">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-wide text-primary-700">
              EXAM-VAULT
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">Exam Management System</p>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {items.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-colors
                  ${
                    isActive
                      ? "bg-primary-50 text-primary-700"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800"
                  }
                `}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="text-base leading-none">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Role badge at bottom */}
        <div className="px-5 py-3 border-t border-neutral-200">
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <span className="w-2 h-2 rounded-full bg-success-500" />
            <span>Role: <span className="font-semibold text-neutral-700">{displayName}</span></span>
          </div>
        </div>
      </aside>
    </>
  );
}
