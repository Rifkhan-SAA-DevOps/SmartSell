import { Link } from "react-router-dom";
import icon from "../assets/smartsell-icon.png";

const footerGroups = [
  {
    title: "Discover",
    links: [
      ["Marketplace", "/marketplace"],
      ["Services", "/services"],
      ["Local stores", "/storefronts"],
      ["Request anything", "/request-anything"],
    ],
  },
  {
    title: "Your account",
    links: [
      ["Dashboard", "/dashboard"],
      ["Orders", "/orders"],
      ["Wishlist", "/wishlist"],
      ["Messages", "/inbox"],
    ],
  },
  {
    title: "Business & help",
    links: [
      ["Sell on SmartSell", "/seller-hub"],
      ["Support centre", "/support"],
      ["Profile & security", "/profile"],
      ["Notifications", "/notifications"],
    ],
  },
];

function FooterIcon({ name }) {
  const common = { viewBox: "0 0 24 24", "aria-hidden": "true" };
  if (name === "shield") return <svg {...common}><path d="M12 3 4.8 6v5.5c0 4.6 3 7.8 7.2 9.5 4.2-1.7 7.2-4.9 7.2-9.5V6L12 3Z"/><path d="m9 12 2 2 4-4"/></svg>;
  if (name === "people") return <svg {...common}><circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2"/><path d="M15.5 15.5A4.5 4.5 0 0 1 21 20"/></svg>;
  return <svg {...common}><path d="M4 7h16v12H4z"/><path d="m4 11 8 5 8-5"/></svg>;
}

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="customer-footer">
      <div className="customer-footer-accent" aria-hidden="true" />
      <div className="customer-footer-inner">
        <section className="footer-brand-block">
          <Link className="footer-brand" to="/" aria-label="SmartSell home">
            <img src={icon} alt="" />
            <span><strong>SmartSell</strong><small>Local commerce, made easier</small></span>
          </Link>
          <p>
            Discover products, compare used deals, book trusted services, and request custom solutions from one connected marketplace.
          </p>
          <div className="footer-trust-list" aria-label="SmartSell platform benefits">
            <span><FooterIcon name="shield" />Safer marketplace journeys</span>
            <span><FooterIcon name="people" />Local sellers and providers</span>
            <span><FooterIcon name="message" />Support throughout the order</span>
          </div>
        </section>

        <div className="footer-navigation-grid">
          {footerGroups.map((group) => (
            <nav key={group.title} aria-label={`${group.title} links`}>
              <h2>{group.title}</h2>
              {group.links.map(([label, to]) => <Link key={to} to={to}>{label}</Link>)}
            </nav>
          ))}
        </div>
      </div>

      <div className="customer-footer-bottom">
        <span>© {year} SmartSell. Built for modern local commerce.</span>
        <div><Link to="/support">Help & support</Link><Link to="/profile">Account security</Link></div>
      </div>
    </footer>
  );
}
