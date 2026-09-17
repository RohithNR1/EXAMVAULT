import { Navigate } from "react-router-dom";

/**
 * Route guard that checks:
 *   1. A valid access token exists (authentication)
 *   2. If `allowedRole` is passed, the user's stored role matches (authorization)
 *
 * Role is read from localStorage (set at login). Backend enforces the same
 * checks server-side; this is a client-side UX gate only.
 */
export default function ProtectedRoute({ children, allowedRole }) {
  const token = localStorage.getItem("access");
  if (!token) return <Navigate to="/login" replace />;

  if (allowedRole) {
    const userRole = localStorage.getItem("role");
    if (userRole !== allowedRole) {
      // Mismatched role — log it for debugging but do not leak details.
      console.warn(`ProtectedRoute: role mismatch. user=${userRole}, required=${allowedRole}`);
      return <Navigate to="/login" replace />;
    }
  }

  return children;
}
