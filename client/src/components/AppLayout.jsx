import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import Sidebar from "./Sidebar.jsx";
import Footer from "./Footer.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const MANAGEMENT_ROLES = ["seller", "shop", "shop_seller", "service_provider", "delivery_partner", "admin", "super_admin"];
const ADMIN_ROLES = ["admin", "super_admin"];
const BUSINESS_ROLES = ["seller", "shop", "shop_seller", "service_provider"];
const DELIVERY_ROLES = ["delivery_partner"];

const SHARED_MANAGEMENT_PATHS = ["/dashboard", "/profile", "/notifications", "/inbox", "/support"];
const BUSINESS_PATHS = ["/seller-hub", "/business", "/earnings", "/my-requests", "/my-reviews", "/offers", "/inventory", "/catalog-advanced", "/gallery-management"];
const DELIVERY_PATHS = ["/delivery"];
const ADMIN_PATHS = [
  "/admin",
  "/users",
  "/listings",
  "/reports",
  "/fulfillment",
  "/delivery",
  "/promotions",
  "/home-merchandising",
  "/content",
  "/seo",
  "/settings",
  "/security",
  "/seller-hub",
  "/business",
  "/earnings",
  "/offers",
  "/inventory",
  "/catalog-advanced",
  "/gallery-management",
];

const ROUTE_TITLES = [
  ["/gallery-management", "Gallery Manager"],
  ["/catalog-advanced", "Advanced Catalog"],
  ["/request-anything", "Request Anything"],
  ["/storefronts/", "Storefront Details"],
  ["/storefronts", "Storefronts"],
  ["/services/", "Service Details"],
  ["/services", "Services"],
  ["/products/", "Product Details"],
  ["/marketplace", "Marketplace"],
  ["/my-requests", "Requests"],
  ["/my-reviews", "Reviews"],
  ["/seller-hub", "Create Listing"],
  ["/business", "Business Dashboard"],
  ["/inventory", "Inventory"],
  ["/earnings", "Earnings"],
  ["/offers", "Offers"],
  ["/fulfillment", "Fulfillment"],
  ["/delivery", "Delivery Operations"],
  ["/promotions", "Growth Center"],
  ["/home-merchandising", "Home Offers & Highlights"],
  ["/content", "Content Manager"],
  ["/security", "Security Center"],
  ["/settings", "Platform Settings"],
  ["/reports", "Reports"],
  ["/listings", "Listing Approvals"],
  ["/users", "Users and Roles"],
  ["/admin", "Admin Center"],
  ["/notifications", "Notifications"],
  ["/inbox", "Inbox"],
  ["/support", "Support"],
  ["/profile", "Profile Settings"],
  ["/wishlist", "Wishlist"],
  ["/orders", "Orders"],
  ["/checkout", "Checkout"],
  ["/cart", "Cart"],
  ["/dashboard", "Dashboard"],
  ["/register", "Create Account"],
  ["/login", "Sign In"],
  ["/seo", "SEO and Social Sharing"],
  ["/", "Home"],
];

function pathMatches(pathname, path) {
  return pathname === path || pathname.startsWith(`${path}/`);
}

function routeTitle(pathname) {
  const match = ROUTE_TITLES.find(([path]) => path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(path));
  return match?.[1] || "SmartSell";
}

function routeClassName(pathname) {
  const segment = String(pathname || "/")
    .split("/")
    .filter(Boolean)[0] || "home";

  return `route-${segment.replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase()}`;
}

function shouldUseManagementShell(user, pathname) {
  if (!user || !MANAGEMENT_ROLES.includes(user.role)) return false;

  let allowed = SHARED_MANAGEMENT_PATHS;
  if (ADMIN_ROLES.includes(user.role)) allowed = [...SHARED_MANAGEMENT_PATHS, ...ADMIN_PATHS];
  else if (BUSINESS_ROLES.includes(user.role)) allowed = [...SHARED_MANAGEMENT_PATHS, ...BUSINESS_PATHS];
  else if (DELIVERY_ROLES.includes(user.role)) allowed = [...SHARED_MANAGEMENT_PATHS, ...DELIVERY_PATHS];

  return allowed.some((path) => pathMatches(pathname, path));
}

export default function AppLayout({ children }) {
  const { user, isAuthenticated } = useAuth();
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const mainRef = useRef(null);
  const hasNavigatedRef = useRef(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("smartsell-sidebar-collapsed") === "true";
    } catch {
      return false;
    }
  });

  const currentTitle = routeTitle(pathname);
  const routeClass = routeClassName(pathname);
  const managementRoleClass = `management-role-${String(user?.role || "member").replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase()}`;

  const isManagement = useMemo(
    () => isAuthenticated && shouldUseManagementShell(user, pathname),
    [isAuthenticated, user, pathname]
  );

  useEffect(() => {
    setSidebarOpen(false);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.title = `${currentTitle} | SmartSell`;

    const announceTimer = window.setTimeout(() => setAnnouncement(`${currentTitle} page loaded`), 60);
    if (hasNavigatedRef.current) mainRef.current?.focus({ preventScroll: true });
    hasNavigatedRef.current = true;

    return () => window.clearTimeout(announceTimer);
  }, [pathname, currentTitle]);

  useEffect(() => {
    if (!isManagement) return;
    try {
      localStorage.setItem("smartsell-sidebar-collapsed", sidebarCollapsed ? "true" : "false");
    } catch {
      // Ignore storage restrictions in private browsing or hardened browsers.
    }
  }, [isManagement, sidebarCollapsed]);

  useEffect(() => {
    if (!sidebarOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [sidebarOpen]);

  const accessibilityChrome = (
    <>
      <a className="app-skip-link" href="#main-content">Skip to main content</a>
      <span className="app-route-announcer" aria-live="polite" aria-atomic="true">{announcement}</span>
    </>
  );

  if (!isManagement) {
    const hideFooter = ["/login", "/register"].includes(pathname);
    return (
      <div className={`app-shell public-shell ${hideFooter ? "public-shell-auth" : ""}`}>
        {accessibilityChrome}
        <Navbar showManagementSidebar={false} />
        <main id="main-content" ref={mainRef} tabIndex={-1} className={`app-main-content public-main-content ${routeClass}`} data-route={pathname}>{children}</main>
        {!hideFooter && <Footer />}
      </div>
    );
  }

  return (
    <div className={`app-shell management-shell ${managementRoleClass} ${sidebarCollapsed ? "sidebar-collapsed" : ""}`} data-management-role={user?.role || "member"}>
      {accessibilityChrome}
      <button
        className={`sidebar-overlay ${sidebarOpen ? "show" : ""}`}
        type="button"
        aria-label="Close sidebar"
        onClick={() => setSidebarOpen(false)}
      />

      <Sidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
      />

      <div className="management-workspace">
        <Navbar showManagementSidebar onOpenSidebar={() => setSidebarOpen(true)} />
        <main id="main-content" ref={mainRef} tabIndex={-1} className={`app-main-content management-main-content ${routeClass}`} data-route={pathname}>{children}</main>
      </div>
    </div>
  );
}
