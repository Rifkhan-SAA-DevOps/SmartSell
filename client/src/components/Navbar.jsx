import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/smartsell-logo-full.png";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useRealtime } from "../context/RealtimeContext.jsx";
import "../styles/components/CustomerNavbar.css";

const publicLinks = [
  { to: "/marketplace", label: "Marketplace" },
  { to: "/services", label: "Services" },
  { to: "/storefronts", label: "Stores" },
  { to: "/request-anything", label: "Request" },
  { to: "/seller-hub", label: "Sell" },
];

function roleLabel(role) {
  return String(role || "member")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function workspaceTitle(role) {
  if (["admin", "super_admin"].includes(role)) return "Admin Workspace";
  if (role === "delivery_partner") return "Delivery Workspace";
  return "Business Workspace";
}

function Icon({ name }) {
  if (name === "home") return <svg viewBox="0 0 24 24"><path d="M3 10.8 12 3l9 7.8"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9.5 21v-6h5v6"/></svg>;
  if (name === "market") return <svg viewBox="0 0 24 24"><path d="M4 10h16l-1.2-5H5.2L4 10Z"/><path d="M5 10v9h14v-9"/><path d="M8 14h3M13 14h3M8 17h8"/></svg>;
  if (name === "services") return <svg viewBox="0 0 24 24"><path d="M14.7 6.3a4 4 0 0 0 5 5L12 19l-4-4 7.7-7.7Z"/><path d="M7.5 14.5 5 17l2 2 2.5-2.5"/></svg>;
  if (name === "cart") return <svg viewBox="0 0 24 24"><path d="M6.5 7h14l-1.7 8.4a2 2 0 0 1-2 1.6H9.1a2 2 0 0 1-2-1.6L5.3 4H3"/><circle cx="9.4" cy="20" r="1"/><circle cx="17" cy="20" r="1"/></svg>;
  if (name === "bell") return <svg viewBox="0 0 24 24"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>;
  if (name === "inbox") return <svg viewBox="0 0 24 24"><path d="M4 5h16v14H4z"/><path d="m4 13 4-4h8l4 4"/><path d="M8 13a4 4 0 0 0 8 0"/></svg>;
  if (name === "user") return <svg viewBox="0 0 24 24"><path d="M20 21a8 8 0 1 0-16 0"/><circle cx="12" cy="8" r="4"/></svg>;
  if (name === "menu") return <svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>;
  return null;
}

export default function Navbar({ showManagementSidebar = false, onOpenSidebar = () => {} }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { totalItems } = useCart();
  const { summary, connected, refreshSummary } = useRealtime();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) refreshSummary();
  }, [isAuthenticated, user?.id, pathname, refreshSummary]);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname, showManagementSidebar]);

  function handleLogout() {
    logout();
    setNavOpen(false);
    navigate("/login", { replace: true });
  }

  if (showManagementSidebar) {
    return (
      <header className="nav-wrap management-nav workspace-topbar">
        <div className="management-nav-left">
          <button className="mobile-sidebar-toggle" type="button" onClick={onOpenSidebar} aria-label="Open management menu">
            <Icon name="menu" />
          </button>
          <div className="workspace-title-block">
            <span className="workspace-title-icon" aria-hidden="true" />
            <div>
              <strong>{workspaceTitle(user?.role)}</strong>
              <small>
                <span className={`realtime-dot ${connected ? "online" : "offline"}`} />
                {connected ? "Live" : "Offline"} · {roleLabel(user?.role)}
              </small>
            </div>
          </div>
        </div>
        <div className="nav-actions workspace-actions">
          <Link className="customer-icon-button" to="/inbox" title="Inbox" aria-label="Inbox">
            <Icon name="inbox" />
            {summary.unreadMessages > 0 && <b>{summary.unreadMessages}</b>}
          </Link>
          <Link className="customer-icon-button" to="/notifications" title="Notifications" aria-label="Notifications">
            <Icon name="bell" />
            {summary.unreadNotifications > 0 && <b>{summary.unreadNotifications}</b>}
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="customer-nav-shell">
      <div className={`customer-nav ${navOpen ? "menu-open" : ""}`}>
        <Link to="/" className="customer-brand" aria-label="SmartSell home">
          <img src={logo} alt="SmartSell" />
        </Link>

        <button
          className={`customer-menu-toggle ${navOpen ? "active" : ""}`}
          type="button"
          onClick={() => setNavOpen((value) => !value)}
          aria-label={navOpen ? "Close menu" : "Open menu"}
          aria-expanded={navOpen}
        >
          <Icon name="menu" />
        </button>

        <button className={`customer-nav-backdrop ${navOpen ? "show" : ""}`} type="button" aria-label="Close menu" onClick={() => setNavOpen(false)} />

        <nav className={`customer-nav-links ${navOpen ? "open" : ""}`} aria-label="Main navigation">
          {publicLinks.map((link) => (
            <NavLink key={link.to} to={link.to} onClick={() => setNavOpen(false)}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="customer-nav-actions">
          {isAuthenticated && (
            <>
              <Link className="customer-icon-button" to="/inbox" title="Inbox" aria-label="Inbox">
                <Icon name="inbox" />
                {summary.unreadMessages > 0 && <b>{summary.unreadMessages}</b>}
              </Link>
              <Link className="customer-icon-button" to="/notifications" title="Notifications" aria-label="Notifications">
                <Icon name="bell" />
                {summary.unreadNotifications > 0 && <b>{summary.unreadNotifications}</b>}
              </Link>
            </>
          )}

          <Link className="customer-cart-link" to="/cart" aria-label="Open cart">
            <Icon name="cart" />
            <span>Cart</span>
            <b>{totalItems}</b>
          </Link>

          {isAuthenticated ? (
            <div className="customer-account-menu">
              <Link className="customer-account-pill" to="/dashboard" title={user?.email || "Account"}>
                <span>{user?.name?.charAt(0)?.toUpperCase() || "U"}</span>
                <em>{user?.name || "Account"}</em>
              </Link>
              <button className="customer-logout" type="button" onClick={handleLogout}>Logout</button>
            </div>
          ) : (
            <div className="customer-auth-actions">
              <Link className="customer-login-btn" to="/login">Login</Link>
              <Link className="customer-register-btn" to="/register">Create account</Link>
            </div>
          )}
        </div>
      </div>

      <nav className="customer-bottom-nav" aria-label="Quick customer navigation">
        <NavLink to="/" end>
          <Icon name="home" />
          <span>Home</span>
        </NavLink>
        <NavLink to="/marketplace">
          <Icon name="market" />
          <span>Market</span>
        </NavLink>
        <NavLink to="/services">
          <Icon name="services" />
          <span>Services</span>
        </NavLink>
        <NavLink to="/cart" className="bottom-cart-link">
          <Icon name="cart" />
          <span>Cart</span>
          {totalItems > 0 && <b>{totalItems}</b>}
        </NavLink>
        <NavLink to={isAuthenticated ? "/dashboard" : "/login"}>
          <Icon name="user" />
          <span>{isAuthenticated ? "Account" : "Login"}</span>
        </NavLink>
      </nav>
    </header>
  );
}
