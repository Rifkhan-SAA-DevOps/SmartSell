import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "../styles/pages/customer/Dashboard.css";

const roleLabels = {
  customer: "Customer",
  seller: "Individual Seller",
  shop: "Shop Seller",
  shop_seller: "Shop Seller",
  service_provider: "Service Provider",
  delivery_partner: "Delivery Partner",
  admin: "Admin",
  super_admin: "Super Admin",
};

const customerActions = [
  { icon: "profile", title: "Profile", text: "Update personal information and password.", to: "/profile" },
  { icon: "market", title: "Marketplace", text: "Browse products, shop items, and used deals.", to: "/marketplace" },
  { icon: "cart", title: "Cart", text: "Review selected items before checkout.", to: "/cart" },
  { icon: "orders", title: "Orders", text: "Track orders, payments, and delivery progress.", to: "/orders" },
  { icon: "request", title: "Requests", text: "Follow custom request quotations and updates.", to: "/my-requests" },
  { icon: "wishlist", title: "Wishlist", text: "Open products saved for later.", to: "/wishlist" },
  { icon: "reviews", title: "Reviews", text: "View submitted reviews and approval status.", to: "/my-reviews" },
  { icon: "support", title: "Support", text: "Create tickets for refunds, delivery, or order issues.", to: "/support" },
];

const businessActions = [
  { icon: "profile", title: "Profile", text: "Manage business identity and contact details.", to: "/profile" },
  { icon: "hub", title: "Seller Hub", text: "Submit products, used items, and services.", to: "/seller-hub" },
  { icon: "business", title: "My Business", text: "Manage own listings, orders, and assigned work.", to: "/business" },
  { icon: "earnings", title: "Earnings", text: "Track earnings, commission, and payout requests.", to: "/earnings" },
  { icon: "offers", title: "Offers", text: "Reply to customer product offers and counters.", to: "/offers" },
  { icon: "inbox", title: "Inbox", text: "Message customers and SmartSell admin.", to: "/inbox" },
  { icon: "support", title: "Support", text: "View tickets related to your sales or services.", to: "/support" },
  { icon: "notify", title: "Notifications", text: "Review approvals, orders, and account updates.", to: "/notifications" },
];

const deliveryActions = [
  { icon: "delivery", title: "Delivery Board", text: "View assignments and update delivery progress.", to: "/delivery" },
  { icon: "profile", title: "Profile", text: "Update delivery contact details.", to: "/profile" },
  { icon: "inbox", title: "Inbox", text: "Message admin about deliveries.", to: "/inbox" },
  { icon: "notify", title: "Notifications", text: "View delivery assignments and reminders.", to: "/notifications" },
  { icon: "support", title: "Support", text: "Report delivery issues clearly.", to: "/support" },
];

const adminActions = [
  { icon: "admin", title: "Admin Center", text: "Approve listings, requests, orders, and reviews.", to: "/admin" },
  { icon: "users", title: "Users & Roles", text: "Create users, approve businesses, and block accounts.", to: "/users" },
  { icon: "listings", title: "Listings", text: "Manage product/service status and featured visibility.", to: "/listings" },
  { icon: "fulfill", title: "Fulfillment", text: "Assign delivery partners and update tracking.", to: "/fulfillment" },
  { icon: "reports", title: "Reports", text: "Review revenue, commissions, and platform activity.", to: "/reports" },
  { icon: "earnings", title: "Earnings", text: "Control commission income and seller payouts.", to: "/earnings" },
  { icon: "settings", title: "Settings", text: "Control SmartSell rules, content, SEO, and security.", to: "/settings" },
  { icon: "security", title: "Security", text: "Monitor audit logs and admin activity.", to: "/security" },
];

function getActions(role) {
  if (role === "admin" || role === "super_admin") return adminActions;
  if (role === "delivery_partner") return deliveryActions;
  if (["seller", "shop", "shop_seller", "service_provider"].includes(role)) return businessActions;
  return customerActions;
}

function getSummary(role) {
  if (role === "admin" || role === "super_admin") {
    return {
      label: "Management workspace",
      title: "Control SmartSell from one organized dashboard.",
      text: "Use the admin workspace to review users, listings, orders, reports, payouts, content, security, and support without searching through the app.",
      primary: { label: "Open Admin Center", to: "/admin" },
      secondary: { label: "Manage Users", to: "/users" },
    };
  }
  if (role === "delivery_partner") {
    return {
      label: "Delivery workspace",
      title: "Manage assigned deliveries with clear next steps.",
      text: "Track delivery assignments, update delivery progress, message admin, and report issues from one simple workspace.",
      primary: { label: "Open Delivery Board", to: "/delivery" },
      secondary: { label: "Open Inbox", to: "/inbox" },
    };
  }
  if (["seller", "shop", "shop_seller", "service_provider"].includes(role)) {
    return {
      label: "Business workspace",
      title: "Manage listings, requests, customers, and payouts.",
      text: "Create listings, track approval, respond to customers, manage assigned work, and request payouts from your business dashboard.",
      primary: { label: "Open My Business", to: "/business" },
      secondary: { label: "Add Listing", to: "/seller-hub" },
    };
  }
  return {
    label: "Customer workspace",
    title: "Shop, request, track, review, and get help faster.",
    text: "Your dashboard brings together orders, custom requests, wishlist, reviews, support, and messages in one clean place.",
    primary: { label: "Browse Marketplace", to: "/marketplace" },
    secondary: { label: "Request Anything", to: "/request-anything" },
  };
}

function SvgIcon({ name }) {
  const icons = {
    profile: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0",
    market: "M6 7h12l-1 13H7L6 7Zm2-3h8l2 3H6l2-3Z",
    cart: "M4 5h2l2 10h9l2-7H7m3 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm7 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
    orders: "M7 3h10v18H7V3Zm3 5h4m-4 4h4m-4 4h3",
    request: "M5 4h14v11H8l-3 4V4Zm4 4h6m-6 4h4",
    wishlist: "M20 6.5a5 5 0 0 0-7 0L12 7.5l-1-1a5 5 0 1 0-7 7L12 21l8-7.5a5 5 0 0 0 0-7Z",
    reviews: "M12 3l2.5 5 5.5.8-4 3.9.9 5.4L12 15.7 7.1 18.1l.9-5.4-4-3.9 5.5-.8L12 3Z",
    support: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-5h.01M9.8 9a2.2 2.2 0 1 1 3.6 1.7c-.9.6-1.4 1.1-1.4 2.3",
    hub: "M4 5h16v5H4V5Zm0 9h7v5H4v-5Zm9 0h7v5h-7v-5Z",
    business: "M4 21V8l8-5 8 5v13H4Zm5-8h6m-6 4h6",
    earnings: "M12 3v18m5-14H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H7",
    offers: "M5 5h8l6 6-8 8-6-6V5Zm4 4h.01",
    inbox: "M4 5h16v14H4V5Zm0 4 8 5 8-5",
    notify: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Zm-8 12h4",
    delivery: "M3 7h11v8H3V7Zm11 3h4l3 3v2h-7v-5ZM7 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
    admin: "M12 3l8 4v6c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V7l8-4Z",
    users: "M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 2c3 0 5 1.5 5 4v1H11v-1c0-2.5 2-4 5-4ZM8 14c-3 0-5 1.5-5 4v1h6",
    listings: "M4 5h16M4 12h16M4 19h16M7 5v14",
    fulfill: "M5 6h14v10H5V6Zm3 13h8m-6-9h4",
    reports: "M5 20V4h14v16H5Zm4-4v-5m3 5V8m3 8v-3",
    settings: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm8 4a8 8 0 0 0-.2-1.8l2-1.5-2-3.4-2.4 1a8.2 8.2 0 0 0-3-1.8L14 2h-4l-.4 2.5a8.2 8.2 0 0 0-3 1.8l-2.4-1-2 3.4 2 1.5A8 8 0 0 0 4 12c0 .6.1 1.2.2 1.8l-2 1.5 2 3.4 2.4-1a8.2 8.2 0 0 0 3 1.8L10 22h4l.4-2.5a8.2 8.2 0 0 0 3-1.8l2.4 1 2-3.4-2-1.5c.1-.6.2-1.2.2-1.8Z",
    security: "M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4Zm-2 9 1.5 1.5L15 10",
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={icons[name] || icons.profile} />
    </svg>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const role = user?.role || "customer";
  const actions = getActions(role);
  const summary = getSummary(role);
  const initials = (user?.name || user?.email || "U")
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <section className="section smart-dashboard-page">
      <div className="smart-dashboard-hero">
        <div className="smart-dashboard-copy">
          <span>{summary.label}</span>
          <h1>Hello, {user?.name || "SmartSell User"}</h1>
          <p>{summary.title}</p>
          <small>{summary.text}</small>
          <div className="smart-dashboard-actions">
            <Link className="customer-primary-btn" to={summary.primary.to}>{summary.primary.label}</Link>
            <Link className="customer-outline-btn" to={summary.secondary.to}>{summary.secondary.label}</Link>
          </div>
        </div>

        <aside className="smart-dashboard-profile">
          <div className="smart-dashboard-avatar">{initials}</div>
          <div>
            <h2>{user?.name || "User"}</h2>
            <p>{user?.email}</p>
          </div>
          <dl>
            <div><dt>Role</dt><dd>{roleLabels[role] || role}</dd></div>
            <div><dt>Status</dt><dd>{user?.status || "active"}</dd></div>
          </dl>
        </aside>
      </div>

      <div className="smart-dashboard-section-head">
        <div>
          <span>Workspace</span>
          <h2>Your SmartSell tools</h2>
        </div>
        <p>Use these shortcuts based on your account type.</p>
      </div>

      <div className="smart-dashboard-grid">
        {actions.map((item) => (
          <Link className="smart-dashboard-card" to={item.to} key={item.title}>
            <span className="smart-dashboard-card-icon"><SvgIcon name={item.icon} /></span>
            <div>
              <strong>{item.title}</strong>
              <p>{item.text}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
