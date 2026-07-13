import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/smartsell-logo-full.png";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useRealtime } from "../context/RealtimeContext.jsx";

const publicLinks = [
  { to: "/marketplace", label: "Marketplace" },
  { to: "/services", label: "Services" },
  { to: "/storefronts", label: "Stores" },
  { to: "/request-anything", label: "Request anything" },
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


function workspacePageTitle(pathname, role) {
  const routes = [
    ["/admin", "Admin Center"],
    ["/users", "Users & Roles"],
    ["/listings", "Listing Approvals"],
    ["/reports", "Reports & Insights"],
    ["/fulfillment", "Order Fulfillment"],
    ["/delivery", role === "delivery_partner" ? "My Deliveries" : "Delivery Partners"],
    ["/promotions", "Growth Center"],
    ["/content", "Content Manager"],
    ["/seo", "SEO & Sharing"],
    ["/settings", "Platform Settings"],
    ["/security", "Security Center"],
    ["/seller-hub", "Create Listing"],
    ["/business", "Business Overview"],
    ["/earnings", ["admin", "super_admin"].includes(role) ? "Finance & Payouts" : "Earnings"],
    ["/offers", "Product Offers"],
    ["/inventory", "Inventory"],
    ["/catalog-advanced", "Advanced Catalog"],
    ["/gallery-management", "Gallery Manager"],
    ["/my-requests", "Assigned Requests"],
    ["/my-reviews", "Customer Reviews"],
    ["/notifications", "Notifications"],
    ["/inbox", "Inbox"],
    ["/profile", "Profile & Security"],
    ["/support", "Support"],
    ["/dashboard", "Account Overview"],
  ];
  const match = routes.find(([path]) => pathname === path || pathname.startsWith(`${path}/`));
  return match?.[1] || workspaceTitle(role);
}

function workspaceLink(role) {
  if (["admin", "super_admin"].includes(role)) return "/admin";
  if (role === "delivery_partner") return "/delivery";
  if (["seller", "shop", "shop_seller", "service_provider"].includes(role)) return "/business";
  return "/dashboard";
}

function Icon({ name }) {
  const common = { viewBox: "0 0 24 24", "aria-hidden": "true" };
  if (name === "home") return <svg {...common}><path d="M3 10.8 12 3l9 7.8"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9.5 21v-6h5v6"/></svg>;
  if (name === "market") return <svg {...common}><path d="M4 10h16l-1.2-5H5.2L4 10Z"/><path d="M5 10v9h14v-9"/><path d="M8 14h3M13 14h3M8 17h8"/></svg>;
  if (name === "services") return <svg {...common}><path d="M14.7 6.3a4 4 0 0 0 5 5L12 19l-4-4 7.7-7.7Z"/><path d="M7.5 14.5 5 17l2 2 2.5-2.5"/></svg>;
  if (name === "cart") return <svg {...common}><path d="M6.5 7h14l-1.7 8.4a2 2 0 0 1-2 1.6H9.1a2 2 0 0 1-2-1.6L5.3 4H3"/><circle cx="9.4" cy="20" r="1"/><circle cx="17" cy="20" r="1"/></svg>;
  if (name === "bell") return <svg {...common}><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>;
  if (name === "inbox") return <svg {...common}><path d="M4 5h16v14H4z"/><path d="m4 13 4-4h8l4 4"/><path d="M8 13a4 4 0 0 0 8 0"/></svg>;
  if (name === "user") return <svg {...common}><path d="M20 21a8 8 0 1 0-16 0"/><circle cx="12" cy="8" r="4"/></svg>;
  if (name === "menu") return <svg {...common}><path d="M4 7h16M4 12h16M4 17h16"/></svg>;
  if (name === "close") return <svg {...common}><path d="m6 6 12 12M18 6 6 18"/></svg>;
  if (name === "chevron") return <svg {...common}><path d="m8 10 4 4 4-4"/></svg>;
  if (name === "store") return <svg {...common}><path d="M4 10h16l-1.2-5H5.2L4 10Z"/><path d="M5 10v9h14v-9"/><path d="M9 19v-5h6v5"/></svg>;
  if (name === "orders") return <svg {...common}><path d="M6 3h12v18H6z"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>;
  if (name === "heart") return <svg {...common}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg>;
  if (name === "support") return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M9.6 9a2.5 2.5 0 1 1 3.6 2.3c-.8.4-1.2.9-1.2 1.7"/><path d="M12 17h.01"/></svg>;
  if (name === "logout") return <svg {...common}><path d="M10 5H5v14h5"/><path d="m14 8 4 4-4 4M8 12h10"/></svg>;
  return null;
}

export default function Navbar({ showManagementSidebar = false, onOpenSidebar = () => {} }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { totalItems } = useCart();
  const { summary, connected, refreshSummary } = useRealtime();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const isBusinessWorkspaceRole = ["seller", "shop", "shop_seller", "service_provider"].includes(user?.role);
  const isAdminWorkspaceRole = ["admin", "super_admin"].includes(user?.role);
  const accountRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) refreshSummary();
  }, [isAuthenticated, user?.id, pathname, refreshSummary]);

  useEffect(() => {
    setNavOpen(false);
    setAccountOpen(false);
  }, [pathname, showManagementSidebar]);

  useEffect(() => {
    function handlePointerDown(event) {
      if (accountRef.current && !accountRef.current.contains(event.target)) setAccountOpen(false);
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setNavOpen(false);
        setAccountOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!navOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [navOpen]);

  function handleLogout() {
    logout();
    setNavOpen(false);
    setAccountOpen(false);
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
              <strong>{workspacePageTitle(pathname, user?.role)}</strong>
              <small><span className={`realtime-dot ${connected ? "online" : "offline"}`} />{connected ? "Live workspace" : "Offline"} · {roleLabel(user?.role)}</small>
            </div>
          </div>
        </div>
        <div className="nav-actions workspace-actions">
          {isBusinessWorkspaceRole && pathname !== "/seller-hub" && (
            <Link className="workspace-quick-create-v2" to="/seller-hub"><span>+</span>Create listing</Link>
          )}
          {isAdminWorkspaceRole && pathname !== "/listings" && (
            <Link className="admin-workspace-quick-v2" to="/listings">Review listings</Link>
          )}
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

  const accountLinks = [
    { to: workspaceLink(user?.role), label: ["customer", undefined].includes(user?.role) ? "My dashboard" : "My workspace", icon: "home" },
    { to: "/orders", label: "Orders", icon: "orders" },
    { to: "/wishlist", label: "Wishlist", icon: "heart" },
    { to: "/profile", label: "Profile & security", icon: "user" },
    { to: "/support", label: "Support", icon: "support" },
  ];

  return (
    <header className="customer-nav-shell">
      <div className="customer-nav">
        <Link to="/" className="customer-brand" aria-label="SmartSell home">
          <img src={logo} alt="SmartSell" />
        </Link>

        <nav className="customer-nav-links" aria-label="Main navigation">
          {publicLinks.map((link) => (
            <NavLink key={link.to} to={link.to}>{link.label}</NavLink>
          ))}
        </nav>

        <div className="customer-nav-actions">
          <Link className="customer-sell-link" to="/seller-hub"><Icon name="store" /><span>Sell on SmartSell</span></Link>

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

          <Link className="customer-cart-link" to="/cart" aria-label={`Open cart with ${totalItems} item${totalItems === 1 ? "" : "s"}`}>
            <Icon name="cart" /><span>Cart</span>{totalItems > 0 && <b>{totalItems}</b>}
          </Link>

          {isAuthenticated ? (
            <div className="customer-account-dropdown" ref={accountRef}>
              <button
                className="customer-account-trigger"
                type="button"
                onClick={() => setAccountOpen((value) => !value)}
                aria-expanded={accountOpen}
                aria-haspopup="menu"
              >
                <span className="customer-avatar">{user?.name?.charAt(0)?.toUpperCase() || "U"}</span>
                <span className="customer-account-copy"><strong>{user?.name || "My account"}</strong><small>{roleLabel(user?.role)}</small></span>
                <span className={`customer-account-chevron ${accountOpen ? "open" : ""}`}><Icon name="chevron" /></span>
              </button>

              <div className={`customer-account-popover ${accountOpen ? "show" : ""}`} role="menu">
                <div className="customer-account-summary">
                  <span className="customer-avatar large">{user?.name?.charAt(0)?.toUpperCase() || "U"}</span>
                  <div><strong>{user?.name || "SmartSell member"}</strong><small>{user?.email || roleLabel(user?.role)}</small></div>
                </div>
                <div className="customer-account-links">
                  {accountLinks.map((item) => <Link key={item.to} to={item.to} role="menuitem"><Icon name={item.icon} /><span>{item.label}</span></Link>)}
                </div>
                <button className="customer-account-logout" type="button" onClick={handleLogout}><Icon name="logout" /><span>Log out</span></button>
              </div>
            </div>
          ) : (
            <div className="customer-auth-actions">
              <Link className="customer-login-btn" to="/login">Log in</Link>
              <Link className="customer-register-btn" to="/register">Create account</Link>
            </div>
          )}
        </div>

        <button
          className={`customer-menu-toggle ${navOpen ? "active" : ""}`}
          type="button"
          onClick={() => setNavOpen((value) => !value)}
          aria-label={navOpen ? "Close menu" : "Open menu"}
          aria-expanded={navOpen}
        >
          <Icon name={navOpen ? "close" : "menu"} />
        </button>
      </div>

      <button className={`customer-nav-backdrop ${navOpen ? "show" : ""}`} type="button" aria-label="Close menu" onClick={() => setNavOpen(false)} />

      <aside className={`customer-mobile-drawer ${navOpen ? "open" : ""}`} aria-hidden={!navOpen}>
        <div className="customer-mobile-drawer-head">
          <div><span>Explore SmartSell</span><strong>Products, services and local stores</strong></div>
          <button type="button" onClick={() => setNavOpen(false)} aria-label="Close menu"><Icon name="close" /></button>
        </div>
        <nav className="customer-mobile-links" aria-label="Mobile navigation">
          {publicLinks.map((link) => <NavLink key={link.to} to={link.to}>{link.label}<span>→</span></NavLink>)}
          <NavLink to="/seller-hub">Sell on SmartSell<span>→</span></NavLink>
        </nav>
        {isAuthenticated ? (
          <div className="customer-mobile-account">
            <div className="customer-account-summary">
              <span className="customer-avatar large">{user?.name?.charAt(0)?.toUpperCase() || "U"}</span>
              <div><strong>{user?.name || "SmartSell member"}</strong><small>{roleLabel(user?.role)}</small></div>
            </div>
            <div className="customer-mobile-account-links">
              {accountLinks.map((item) => <Link key={item.to} to={item.to}><Icon name={item.icon} /><span>{item.label}</span></Link>)}
              <Link to="/inbox"><Icon name="inbox" /><span>Inbox</span>{summary.unreadMessages > 0 && <b>{summary.unreadMessages}</b>}</Link>
              <Link to="/notifications"><Icon name="bell" /><span>Notifications</span>{summary.unreadNotifications > 0 && <b>{summary.unreadNotifications}</b>}</Link>
            </div>
            <button className="customer-mobile-logout" type="button" onClick={handleLogout}><Icon name="logout" />Log out</button>
          </div>
        ) : (
          <div className="customer-mobile-auth">
            <Link to="/login">Log in</Link>
            <Link to="/register">Create an account</Link>
          </div>
        )}
      </aside>

      <nav className="customer-bottom-nav" aria-label="Quick customer navigation">
        <NavLink to="/" end><Icon name="home" /><span>Home</span></NavLink>
        <NavLink to="/marketplace"><Icon name="market" /><span>Market</span></NavLink>
        <NavLink to="/services"><Icon name="services" /><span>Services</span></NavLink>
        <NavLink to="/cart" className="bottom-cart-link"><Icon name="cart" /><span>Cart</span>{totalItems > 0 && <b>{totalItems}</b>}</NavLink>
        <NavLink to={isAuthenticated ? workspaceLink(user?.role) : "/login"}><Icon name="user" /><span>{isAuthenticated ? "Account" : "Login"}</span></NavLink>
      </nav>
    </header>
  );
}
