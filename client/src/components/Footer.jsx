import { Link } from "react-router-dom";
import "../styles/components/Footer.css";

export default function Footer() {
  return (
    <footer className="customer-footer">
      <div className="customer-footer-inner">
        <div className="footer-brand-block">
          <strong>SmartSell</strong>
          <p>One smart marketplace for products, used goods, shops, services, and custom requests.</p>
        </div>

        <nav className="footer-link-grid" aria-label="SmartSell footer navigation">
          <Link to="/marketplace">Products</Link>
          <Link to="/marketplace">Used Items</Link>
          <Link to="/services">Services</Link>
          <Link to="/request-anything">Request Anything</Link>
          <Link to="/storefronts">Stores</Link>
          <Link to="/support">Support</Link>
        </nav>
      </div>

      <div className="customer-footer-bottom">
        <span>© 2026 SmartSell. Built for local commerce.</span>
        <span>Marketplace • Services • Delivery • Support</span>
      </div>
    </footer>
  );
}
