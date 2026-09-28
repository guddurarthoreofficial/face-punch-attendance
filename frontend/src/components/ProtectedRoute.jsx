import { Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function ProtectedRoute({
  children,
  allowedRoles,
}) {
  const {
    user,
    isAuthenticated,
    loading,
  } = useAuth();

  // ==========================================
  // AUTH RESTORING
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-300">
          Loading...
        </p>
      </div>
    );
  }

  // ==========================================
  // NOT LOGGED IN
  // ==========================================

  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  // ==========================================
  // ROLE CHECK
  // ==========================================

  if (
    allowedRoles &&
    !allowedRoles.includes(user.role)
  ) {
    if (user.role === "admin") {
      return (
        <Navigate
          to="/admin"
          replace
        />
      );
    }

    if (user.role === "employee") {
      return (
        <Navigate
          to="/employee"
          replace
        />
      );
    }

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
}

export default ProtectedRoute;