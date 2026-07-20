import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const ADMIN_ROLES = ["admin", "super_admin"];
const BUSINESS_ROLES = ["seller", "shop", "service_provider"];
const DELIVERY_ROLES = ["delivery_partner"];
const PRODUCT_SELLER_ROLES = ["seller", "shop"];

const icons = {
  overview: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
  profile: "M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10z",
  support: "M21 15a4 4 0 0 1-4 4H7l-4 3v-3a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4h14a4 4 0 0 1 4 4v8z",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
  inbox: "M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",
  create: "M12 5v14M5 12h14",
  business: "M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9h1M9 13h1M9 17h1M14 13h1M14 17h1",
  offers: "M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L3 13V3h10l7.59 7.59a2 2 0 0 1 0 2.82zM7 7h.01",
  earnings: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6",
  requests: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h6",
  reviews: "M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2zM8 9h8M8 13h5",
  users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  listings: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  reports: "M3 3v18h18M7 16V9M12 16V5M17 16v-7",
  fulfillment: "M16 3h5v5M8 21H3v-5M21 16v5h-5M3 8V3h5M7 7l10 10M17 7 7 17",
  delivery: "M1 3h15v13H1zM16 8h4l3 3v5h-7zM5.5 19a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM18.5 19a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  growth: "M3 17l6-6 4 4 8-8M14 7h7v7",
  content: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z",
  seo: "M10.59 13.41a2 2 0 0 0 2.82 0l5.66-5.66a4 4 0 1 0-5.66-5.66l-1.41 1.41M13.41 10.59a2 2 0 0 0-2.82 0l-5.66 5.66a4 4 0 1 0 5.66 5.66L12 20.5",
  settings: "M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.4 1.1V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8.6 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1 1.65 1.65 0 0 0-1.1-.4H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-.6 1.65 1.65 0 0 0 .4-1.1V3a2 2 0 0 1 4 0v.09A1.65 1.65 0 0 0 15.4 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.2.3.5.52.83.62.35.11.72.09 1.07.09H21a2 2 0 0 1 0 4h-.09c-.37 0-.73-.02-1.07.09-.34.1-.63.32-.84.62z",
  security: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  store: "M3 9l1-5h16l1 5M5 9v11h14V9M9 20v-7h6v7",
  inventory: "M21 8v13H3V8m18 0-9-5-9 5m18 0H3m5 5h8m-8 4h5",
  catalog: "M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2V5zm4 2h8M8 11h8M8 15h5",
  gallery: "M4 5h16v14H4zM8 11l2.2 2.5 2.3-3L16 15H6l2-4zM8 8h.01",
};

function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={icons[name] || icons.overview} />
    </svg>
  );
}

function roleLabel(role) {
  return String(role || "user")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function itemClass({ isActive }) {
  return isActive ? "active" : undefined;
}

function SidebarGroup({ title, items, onClose }) {
  const visibleItems = items.filter(Boolean);
  if (!visibleItems.length) return null;

  return (
    <section className="sidebar-nav-group">
      <p className="sidebar-section-title">{title}</p>
      <nav className="sidebar-menu" aria-label={title}>
        {visibleItems.map((item) => (
          <NavLink key={`${title}-${item.to}`} to={item.to} className={itemClass} onClick={onClose} title={item.label}>
            <span className="sidebar-menu-icon"><Icon name={item.icon} /></span>
            <span className="sidebar-link-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </section>
  );
}

export default function Sidebar({ isOpen = false, isCollapsed = false, onClose = () => {}, onToggleCollapse = () => {} }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = ADMIN_ROLES.includes(user?.role);
  const isBusinessUser = BUSINESS_ROLES.includes(user?.role);
  const isDeliveryPartner = DELIVERY_ROLES.includes(user?.role);
  const isProductSeller = PRODUCT_SELLER_ROLES.includes(user?.role);
  const canCreateListings = isBusinessUser || isAdmin;

  const workspaceItems = [
    !isDeliveryPartner ? { to: "/dashboard", label: "Account Overview", icon: "overview" } : null,
    { to: "/notifications", label: "Notifications", icon: "bell" },
    { to: "/inbox", label: "Inbox", icon: "inbox" },
    { to: "/profile", label: "Profile & Security", icon: "profile" },
    { to: "/support", label: "Support", icon: "support" },
  ];

  const businessCommandItems = [
    isBusinessUser ? { to: "/business", label: "Business Overview", icon: "business" } : null,
    canCreateListings ? { to: "/seller-hub", label: "Create Listing", icon: "create" } : null,
    isBusinessUser ? { to: "/earnings", label: "Earnings", icon: "earnings" } : null,
  ];

  const businessManageItems = [
    isProductSeller ? { to: "/offers", label: "Product Offers", icon: "offers" } : null,
    isProductSeller ? { to: "/inventory", label: "Inventory", icon: "inventory" } : null,
    isBusinessUser ? { to: "/catalog-advanced", label: "Advanced Catalog", icon: "catalog" } : null,
    isBusinessUser ? { to: "/gallery-management", label: "Gallery Manager", icon: "gallery" } : null,
    isBusinessUser ? { to: "/my-requests", label: "Assigned Requests", icon: "requests" } : null,
    isBusinessUser ? { to: "/my-reviews", label: "Customer Reviews", icon: "reviews" } : null,
  ];

  const deliveryItems = [
    isDeliveryPartner ? { to: "/delivery", label: "Route Board", icon: "delivery" } : null,
  ];

  const adminCommandItems = [
    { to: "/admin", label: "Admin Center", icon: "overview" },
    { to: "/users", label: "Users & Roles", icon: "users" },
    { to: "/listings", label: "Listing Approvals", icon: "listings" },
    { to: "/fulfillment", label: "Fulfillment", icon: "fulfillment" },
  ];

  const adminOperationsItems = [
    { to: "/reports", label: "Reports", icon: "reports" },
    { to: "/inventory", label: "Inventory", icon: "inventory" },
    { to: "/delivery", label: "Delivery Partners", icon: "delivery" },
    { to: "/offers", label: "Product Offers", icon: "offers" },
    { to: "/earnings", label: "Finance & Payouts", icon: "earnings" },
    { to: "/catalog-advanced", label: "Advanced Catalog", icon: "catalog" },
    { to: "/gallery-management", label: "Gallery Manager", icon: "gallery" },
  ];

  const adminPlatformItems = [
    { to: "/home-merchandising", label: "Home Offers", icon: "growth" },
    { to: "/promotions", label: "Growth Center", icon: "growth" },
    { to: "/content", label: "Content", icon: "content" },
    { to: "/seo", label: "SEO", icon: "seo" },
    { to: "/settings", label: "Platform Settings", icon: "settings" },
    { to: "/security", label: "Security", icon: "security" },
    { to: "/seller-hub", label: "Create Listing", icon: "create" },
    { to: "/business", label: "Business View", icon: "business" },
  ];

  function handleLogout() {
    logout();
    onClose();
    navigate("/login", { replace: true });
  }

  return (
    <aside className={`app-sidebar management-sidebar ${isBusinessUser ? "business-sidebar-v2" : ""} ${isDeliveryPartner ? "delivery-sidebar-v2" : ""} ${isAdmin ? "admin-sidebar-v2" : ""} ${isOpen ? "open" : ""} ${isCollapsed ? "collapsed" : ""}`} aria-label="Management sidebar" data-role={user?.role || "user"}>
      <div className="sidebar-topbar">
        <div className="sidebar-workspace-title">
          <span className="sidebar-workspace-icon" aria-hidden="true">S</span>
          <div>
            <strong>{isAdmin ? "Admin Panel" : isDeliveryPartner ? "Delivery Workspace" : "Business Panel"}</strong>
            <small>{roleLabel(user?.role)}</small>
          </div>
        </div>
        <button className="sidebar-collapse-btn" type="button" onClick={onToggleCollapse} aria-label="Collapse sidebar">
          <span />
        </button>
        <button className="sidebar-mobile-close" type="button" onClick={onClose} aria-label="Close sidebar">×</button>
      </div>

      <Link to={isAdmin ? "/admin" : isDeliveryPartner ? "/delivery" : "/dashboard"} className="sidebar-profile-card" onClick={onClose} title={user?.name || "SmartSell user"}>
        <span className="sidebar-avatar">{user?.name?.charAt(0)?.toUpperCase() || "S"}</span>
        <span className="sidebar-profile-copy">
          <strong>{user?.name || "SmartSell User"}</strong>
          <small>{user?.email || roleLabel(user?.role)}</small>
        </span>
      </Link>

      <div className="sidebar-scroll-area">
        {!isAdmin && isBusinessUser && <SidebarGroup title="Business Command" items={businessCommandItems} onClose={onClose} />}
        {!isAdmin && isBusinessUser && <SidebarGroup title="Manage" items={businessManageItems} onClose={onClose} />}
        {!isAdmin && isDeliveryPartner && <SidebarGroup title="Delivery Command" items={deliveryItems} onClose={onClose} />}
        {isAdmin && <SidebarGroup title="Admin Command" items={adminCommandItems} onClose={onClose} />}
        {isAdmin && <SidebarGroup title="Operations" items={adminOperationsItems} onClose={onClose} />}
        {isAdmin && <SidebarGroup title="Platform" items={adminPlatformItems} onClose={onClose} />}
        <SidebarGroup title="Account" items={workspaceItems} onClose={onClose} />

        <div className="sidebar-divider" />
        <div className="sidebar-mini-links">
          <Link to="/marketplace" onClick={onClose}><Icon name="store" /> <span>Marketplace</span></Link>
          <Link to="/services" onClick={onClose}><Icon name="business" /> <span>Services</span></Link>
          <Link to="/storefronts" onClick={onClose}><Icon name="store" /> <span>Stores</span></Link>
        </div>
      </div>

      <button className="sidebar-logout" type="button" onClick={handleLogout}>
        <span className="sidebar-menu-icon"><Icon name="logout" /></span>
        <span className="sidebar-link-label">Logout</span>
      </button>
    </aside>
  );
}
