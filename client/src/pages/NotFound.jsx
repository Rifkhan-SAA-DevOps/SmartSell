import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "../styles/pages/customer/NotFound.css";

export default function NotFound() {
  const { isAuthenticated } = useAuth();

  return (
    <main className="notfound-shell">
      <section className="notfound-card">
        <div className="notfound-code">404</div>
        <span className="notfound-kicker">Page not found</span>
        <h1>This SmartSell page is not available.</h1>
        <p>
          The route may have moved during development, or the page does not exist in your current workspace.
        </p>

        <div className="notfound-actions">
          <Link className="notfound-primary" to={isAuthenticated ? "/dashboard" : "/"}>
            {isAuthenticated ? "Go to Dashboard" : "Go Home"}
          </Link>
          <Link className="notfound-secondary" to="/marketplace">Browse Marketplace</Link>
          <Link className="notfound-secondary" to="/services">View Services</Link>
        </div>
      </section>
    </main>
  );
}
