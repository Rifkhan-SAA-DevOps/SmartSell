import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function roleLabel(role) {
  return String(role || "user")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function StateIcon({ type }) {
  if (type === "lock") return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><path d="M12 14v2"/></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9"/><path d="M12 7v5l3 2"/></svg>;
}

export default function ProtectedRoute({ children, roles = [] }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main className="customer-state-page customer-access-page">
        <section className="customer-state-card compact">
          <div className="customer-state-icon loading"><StateIcon type="loading" /><span /></div>
          <span className="customer-state-kicker">Checking access</span>
          <h1>Preparing your SmartSell workspace</h1>
          <p>We are verifying your account and loading the correct customer or business experience.</p>
        </section>
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles.length && !roles.includes(user.role)) {
    return (
      <main className="customer-state-page customer-access-page">
        <section className="customer-state-card compact">
          <div className="customer-state-icon"><StateIcon type="lock" /></div>
          <span className="customer-state-kicker">Access restricted</span>
          <h1>This workspace is not available for your account.</h1>
          <p>You are signed in as <strong>{roleLabel(user.role)}</strong>. This page is available to <strong>{roles.map(roleLabel).join(", ")}</strong>.</p>
          <div className="customer-state-actions">
            <Link className="customer-state-primary" to="/dashboard">Open my dashboard</Link>
            <Link className="customer-state-secondary" to="/marketplace">Browse marketplace</Link>
          </div>
        </section>
      </main>
    );
  }

  return children;
}
