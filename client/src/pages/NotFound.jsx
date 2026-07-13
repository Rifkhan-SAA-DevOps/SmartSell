import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function ArrowIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M14 7l5 5-5 5" /></svg>;
}

export default function NotFound() {
  const { isAuthenticated } = useAuth();

  return (
    <main className="customer-state-page customer-notfound-page">
      <section className="customer-state-card">
        <div className="customer-state-code"><span>404</span><i /></div>
        <span className="customer-state-kicker">Page unavailable</span>
        <h1>We could not find that SmartSell page.</h1>
        <p>The address may be outdated, incomplete, or no longer part of the current customer journey.</p>
        <div className="customer-state-actions">
          <Link className="customer-state-primary" to={isAuthenticated ? "/dashboard" : "/"}>{isAuthenticated ? "Open dashboard" : "Return home"}<ArrowIcon /></Link>
          <Link className="customer-state-secondary" to="/marketplace">Browse marketplace</Link>
          <Link className="customer-state-secondary" to="/services">Explore services</Link>
        </div>
        <div className="customer-state-help"><span>Still need help?</span><Link to="/support">Visit the Support Centre</Link></div>
      </section>
    </main>
  );
}
