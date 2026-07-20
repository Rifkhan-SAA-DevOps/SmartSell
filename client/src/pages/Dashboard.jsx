import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { AccountIcon, AccountPageHeader, AccountStatGrid } from "../components/CustomerAccountUi.jsx";

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
  { icon: "order", title: "My orders", text: "Track purchases, payments, and delivery progress.", to: "/orders", tone: "violet" },
  { icon: "request", title: "My requests", text: "Follow custom requests, quotations, and decisions.", to: "/my-requests", tone: "cyan" },
  { icon: "wishlist", title: "Wishlist", text: "Return to products saved for later.", to: "/wishlist", tone: "rose" },
  { icon: "star", title: "My reviews", text: "Review your feedback and approval status.", to: "/my-reviews", tone: "amber" },
  { icon: "money", title: "Offers", text: "Manage product offers and counter prices.", to: "/offers", tone: "emerald" },
  { icon: "inbox", title: "Inbox", text: "Continue conversations with SmartSell.", to: "/inbox", tone: "blue" },
  { icon: "bell", title: "Notifications", text: "See approvals, delivery, and account updates.", to: "/notifications", tone: "orange" },
  { icon: "support", title: "Support", text: "Open and track a help request.", to: "/support", tone: "indigo" },
];

const businessActions = [
  { icon: "box", title: "My business", text: "Manage listings, orders, requests, and work.", to: "/business", tone: "violet" },
  { icon: "plus", title: "Add listing", text: "Publish products or services through Seller Hub.", to: "/seller-hub", tone: "cyan" },
  { icon: "money", title: "Earnings", text: "Review commission, earnings, and payouts.", to: "/earnings", tone: "emerald" },
  { icon: "request", title: "Offers", text: "Reply to customer offers and counter prices.", to: "/offers", tone: "amber" },
  { icon: "inbox", title: "Inbox", text: "Message customers and SmartSell admin.", to: "/inbox", tone: "blue" },
  { icon: "bell", title: "Notifications", text: "Review approvals and business updates.", to: "/notifications", tone: "orange" },
  { icon: "user", title: "Profile", text: "Update public identity and contact details.", to: "/profile", tone: "rose" },
  { icon: "support", title: "Support", text: "Track sales or service-related tickets.", to: "/support", tone: "indigo" },
];

const deliveryActions = [
  { icon: "box", title: "Delivery board", text: "View assignments and update delivery progress.", to: "/delivery", tone: "violet" },
  { icon: "inbox", title: "Inbox", text: "Message admin about delivery work.", to: "/inbox", tone: "blue" },
  { icon: "bell", title: "Notifications", text: "See assignments and important reminders.", to: "/notifications", tone: "orange" },
  { icon: "user", title: "Profile", text: "Keep delivery contact details updated.", to: "/profile", tone: "rose" },
  { icon: "support", title: "Support", text: "Report delivery issues clearly.", to: "/support", tone: "indigo" },
];

const adminActions = [
  { icon: "shield", title: "Admin center", text: "Review platform activity and approvals.", to: "/admin", tone: "violet" },
  { icon: "user", title: "Users & roles", text: "Manage users, roles, and business approval.", to: "/users", tone: "cyan" },
  { icon: "box", title: "Listings", text: "Manage product and service visibility.", to: "/listings", tone: "emerald" },
  { icon: "order", title: "Fulfillment", text: "Coordinate orders and delivery assignments.", to: "/fulfillment", tone: "amber" },
  { icon: "activity", title: "Reports", text: "Review revenue and platform performance.", to: "/reports", tone: "blue" },
  { icon: "support", title: "Support", text: "Resolve customer and business tickets.", to: "/support", tone: "indigo" },
];

function getActions(role) {
  if (["admin", "super_admin"].includes(role)) return adminActions;
  if (role === "delivery_partner") return deliveryActions;
  if (["seller", "shop", "service_provider"].includes(role)) return businessActions;
  return customerActions;
}

function getHeadline(role) {
  if (["admin", "super_admin"].includes(role)) return ["Management workspace", "Keep the SmartSell platform organized."];
  if (role === "delivery_partner") return ["Delivery workspace", "Your assignments and communication in one place."];
  if (["seller", "shop", "service_provider"].includes(role)) return ["Business workspace", "Manage listings, customers, and earnings clearly."];
  return ["Customer workspace", "Everything after discovery, organized beautifully."];
}

export default function Dashboard() {
  const { user } = useAuth();
  const role = user?.role || "customer";
  const actions = getActions(role);
  const [eyebrow, title] = getHeadline(role);
  const initials = (user?.name || user?.email || "S")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <section className="ca-account-page ca-dashboard-page">
      <AccountPageHeader
        eyebrow={eyebrow}
        title={`Welcome back, ${user?.name?.split(" ")?.[0] || "SmartSell user"}`}
        description={title}
        icon="spark"
        actions={<>
          <Link className="ca-button ca-button--primary" to="/marketplace">Explore marketplace <AccountIcon name="arrow" size={16} /></Link>
          <Link className="ca-button ca-button--soft" to="/request-anything">Request anything</Link>
        </>}
        meta={<><span>{roleLabels[role] || role}</span><span className="is-success">{user?.status || "Active"}</span></>}
      />

      <div className="ca-dashboard-welcome">
        <div className="ca-dashboard-welcome__copy">
          <span className="ca-dashboard-avatar">{initials}</span>
          <div>
            <small>Your SmartSell account</small>
            <h2>{user?.name || "SmartSell User"}</h2>
            <p>{user?.email || "Account email"}</p>
          </div>
        </div>
        <div className="ca-dashboard-welcome__note">
          <AccountIcon name="shield" size={22} />
          <div><strong>Account ready</strong><span>Manage your activity securely from this workspace.</span></div>
        </div>
      </div>

      <AccountStatGrid items={[
        { label: "Workspace tools", value: actions.length, note: "Shortcuts available", icon: "activity", tone: "violet" },
        { label: "Account role", value: roleLabels[role] || role, note: "Current access level", icon: "user", tone: "cyan" },
        { label: "Communication", value: "Live", note: "Inbox and notifications", icon: "message", tone: "emerald" },
      ]} />

      <div className="ca-section-heading">
        <div><span className="ca-eyebrow">Your workspace</span><h2>Continue where you left off</h2><p>Open a section to view details, status, and available actions.</p></div>
      </div>

      <div className="ca-action-grid">
        {actions.map((item) => (
          <Link className={`ca-action-card tone-${item.tone}`} to={item.to} key={item.title}>
            <span className="ca-action-card__icon"><AccountIcon name={item.icon} size={22} /></span>
            <div><h3>{item.title}</h3><p>{item.text}</p></div>
            <span className="ca-action-card__arrow"><AccountIcon name="chevron" size={18} /></span>
          </Link>
        ))}
      </div>
    </section>
  );
}
