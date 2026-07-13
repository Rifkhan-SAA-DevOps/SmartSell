import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function roleLabel(role) {
  return String(role || "user")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function ProtectedRoute({ children, roles = [] }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <section className="center-page access-state">
        <span className="eyebrow">Checking access</span>
        <h1>Loading your SmartSell space...</h1>
        <p>Please wait while we verify your account permissions.</p>
      </section>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles.length && !roles.includes(user.role)) {
    return (
      <section className="page section center-page access-state">
        <span className="eyebrow">Access restricted</span>
        <h1>This area is not available for your account.</h1>
        <p>
          You are logged in as <strong>{roleLabel(user.role)}</strong>. This page is limited to:
          {" "}<strong>{roles.map(roleLabel).join(", ")}</strong>.
        </p>
        <div className="hero-actions center-actions">
          <Link className="primary-btn" to="/dashboard">Go to Dashboard</Link>
          <Link className="secondary-btn" to="/marketplace">Browse Marketplace</Link>
        </div>
      </section>
    );
  }

  return children;
}
