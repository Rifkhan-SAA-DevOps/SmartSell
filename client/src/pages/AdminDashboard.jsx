import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AdminEmptyState,
  AdminIcon,
  AdminInfoGrid,
  AdminMetricCard,
  AdminModal,
  AdminPageHeader,
  AdminPagination,
  AdminSearchToolbar,
  AdminStatusBadge,
  useAdminPagination,
} from "../components/AdminWorkspaceUi.jsx";
import api from "../utils/api.js";
import "../styles/pages/admin/AdminWorkspaceV2.css";

const QUEUE_TABS = ["orders", "products", "services", "businesses", "requests", "reviews"];

function money(value) {
  return Number(value || 0).toLocaleString("en-LK");
}

function titleCase(value) {
  return String(value || "").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-LK", { year: "numeric", month: "short", day: "2-digit" });
}

function queueRecord(kind, item) {
  if (kind === "orders") return {
    kind, item, id: item.id, title: item.orderNo, subtitle: item.customer?.name || item.deliveryName || "Customer",
    meta: `Rs. ${money(item.totalAmount)} · ${item.items?.length || 0} item(s)`, status: item.status,
  };
  if (kind === "products") return {
    kind, item, id: item.id, title: item.name, subtitle: item.sellerName || item.createdBy?.name || "Seller",
    meta: `${item.category || "Uncategorized"} · Rs. ${money(item.price)}`, status: item.status,
  };
  if (kind === "services") return {
    kind, item, id: item.id, title: item.title, subtitle: item.providerName || item.createdBy?.name || "Provider",
    meta: `${item.category || "Uncategorized"} · ${item.priceFrom ? `Rs. ${money(item.priceFrom)}` : "Quote based"}`, status: item.status,
  };
  if (kind === "businesses") return {
    kind, item, id: item.id, title: item.businessName || item.shopName || item.name || "Business applicant",
    subtitle: item.user?.name || item.name || item.email || "Seller / provider",
    meta: `${titleCase(item.sellerType || item.user?.role || "business")} · ${item.location || "No location"}`, status: item.status,
  };
  if (kind === "requests") return {
    kind, item, id: item.id, title: item.name || titleCase(item.requestType || "Custom request"),
    subtitle: item.email || item.phone || "Customer request",
    meta: `${item.budget ? `Budget Rs. ${money(item.budget)}` : "No budget"} · ${item.location || "No location"}`, status: item.status,
  };
  return {
    kind, item, id: item.id, title: item.product?.name || item.service?.title || "Customer review",
    subtitle: item.user?.name || "Customer",
    meta: `${item.rating || 0}/5 · ${item.comment || "No comment"}`, status: item.status,
  };
}

function actionTile(icon, title, text, to) {
  return { icon, title, text, to };
}

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("orders");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [requestForm, setRequestForm] = useState({ status: "new", quotation: "", assignedTo: "", adminNote: "" });
  const [saving, setSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  async function loadOverview() {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get("/admin/overview");
      setOverview(data.data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load admin overview.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadOverview(); }, []);

  const stats = overview?.stats || {};
  const safe = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
  const queueTotal = safe(stats.pendingProducts) + safe(stats.pendingServices) + safe(stats.pendingSellers) + safe(stats.pendingRequests) + safe(stats.pendingOrders) + safe(stats.pendingReviews);

  const records = useMemo(() => {
    const source = tab === "businesses" ? overview?.sellers : overview?.[tab];
    const normalized = (source || []).map((item) => queueRecord(tab, item));
    const search = query.trim().toLowerCase();
    if (!search) return normalized;
    return normalized.filter((record) => `${record.title} ${record.subtitle} ${record.meta} ${record.status}`.toLowerCase().includes(search));
  }, [overview, tab, query]);

  const pagination = useAdminPagination(records, 10, [tab, query]);

  function openRecord(record) {
    setSelected(record);
    if (record.kind === "requests") {
      setRequestForm({
        status: record.item.status || "new",
        quotation: record.item.quotation ?? "",
        assignedTo: record.item.assignedTo || "",
        adminNote: record.item.adminNote || "",
      });
    }
  }

  async function updateGeneric(path, status, successText) {
    try {
      setSaving(true);
      setMessage("");
      await api.patch(path, { status });
      setMessage(successText);
      setSelected(null);
      await loadOverview();
    } catch (err) {
      setError(err.response?.data?.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  }

  async function updateOrder(status, paymentStatus) {
    if (!selected) return;
    try {
      setSaving(true);
      const payload = { status };
      if (paymentStatus) payload.paymentStatus = paymentStatus;
      await api.patch(`/orders/${selected.item.id}/status`, payload);
      setMessage(`Order moved to ${titleCase(status)}.`);
      setSelected(null);
      await loadOverview();
    } catch (err) {
      setError(err.response?.data?.message || "Order update failed.");
    } finally {
      setSaving(false);
    }
  }

  async function updateRequest(nextStatus = requestForm.status) {
    if (!selected) return;
    try {
      setSaving(true);
      await api.patch(`/admin/requests/${selected.item.id}/status`, {
        ...requestForm,
        status: nextStatus,
        quotation: requestForm.quotation === "" ? null : requestForm.quotation,
      });
      setMessage("Request workflow updated.");
      setSelected(null);
      await loadOverview();
    } catch (err) {
      setError(err.response?.data?.message || "Request update failed.");
    } finally {
      setSaving(false);
    }
  }

  const actions = [
    actionTile("users", "Users & roles", "Approve businesses, manage roles and protect accounts.", "/users"),
    actionTile("list", "Listing approvals", "Review products, services and featured visibility.", "/listings"),
    actionTile("delivery", "Fulfillment", "Assign delivery partners and update tracking.", "/fulfillment"),
    actionTile("report", "Reports", "Monitor revenue, growth and operational performance.", "/reports"),
    actionTile("money", "Finance", "Review earnings, commission and payout requests.", "/earnings"),
    actionTile("inbox", "Support", "Resolve disputes, complaints and refund requests.", "/support"),
    actionTile("settings", "Platform settings", "Control content, SEO and marketplace rules.", "/settings"),
    actionTile("shield", "Security", "Review sessions, incidents and risky access.", "/security"),
  ];

  const priorityBreakdown = [
    { label: "Listings", value: safe(stats.pendingProducts) + safe(stats.pendingServices), tone: "blue" },
    { label: "Orders", value: safe(stats.pendingOrders), tone: "violet" },
    { label: "Businesses", value: safe(stats.pendingSellers), tone: "emerald" },
    { label: "Requests", value: safe(stats.pendingRequests), tone: "amber" },
  ];

  const activity = [
    { icon: "order", title: `${safe(stats.pendingOrders)} active orders`, text: "Pending, confirmed or processing orders need operational attention." },
    { icon: "alert", title: `${safe(stats.pendingProducts) + safe(stats.pendingServices)} listing decisions`, text: "Products and services are waiting for marketplace review." },
    { icon: "users", title: `${safe(stats.pendingSellers)} business approvals`, text: "Seller and provider profiles are waiting for verification." },
    { icon: "request", title: `${safe(stats.pendingRequests)} custom requests`, text: "Customers are waiting for assignment, quotation or progress updates." },
  ];

  function modalFooter() {
    if (!selected) return null;
    const { kind, item } = selected;
    if (kind === "orders") return <><button className="admin-ghost-button-v2" type="button" onClick={() => setSelected(null)}>Close</button><button className="admin-danger-button-v2" type="button" disabled={saving} onClick={() => updateOrder("cancelled")}>Cancel order</button><button className="admin-secondary-button-v2" type="button" disabled={saving} onClick={() => updateOrder("processing")}>Processing</button><button className="admin-success-button-v2" type="button" disabled={saving} onClick={() => updateOrder("delivered", "paid")}>Delivered + paid</button></>;
    if (kind === "products") return <><button className="admin-ghost-button-v2" type="button" onClick={() => setSelected(null)}>Close</button><button className="admin-danger-button-v2" type="button" disabled={saving} onClick={() => updateGeneric(`/admin/products/${item.id}/status`, "rejected", "Product rejected.")}>Reject</button><button className="admin-success-button-v2" type="button" disabled={saving} onClick={() => updateGeneric(`/admin/products/${item.id}/status`, "approved", "Product approved.")}>Approve</button></>;
    if (kind === "services") return <><button className="admin-ghost-button-v2" type="button" onClick={() => setSelected(null)}>Close</button><button className="admin-danger-button-v2" type="button" disabled={saving} onClick={() => updateGeneric(`/admin/services/${item.id}/status`, "rejected", "Service rejected.")}>Reject</button><button className="admin-success-button-v2" type="button" disabled={saving} onClick={() => updateGeneric(`/admin/services/${item.id}/status`, "approved", "Service approved.")}>Approve</button></>;
    if (kind === "businesses") return <><button className="admin-ghost-button-v2" type="button" onClick={() => setSelected(null)}>Close</button><button className="admin-danger-button-v2" type="button" disabled={saving} onClick={() => updateGeneric(`/admin/sellers/${item.id}/status`, "rejected", "Business profile rejected.")}>Reject</button><button className="admin-success-button-v2" type="button" disabled={saving} onClick={() => updateGeneric(`/admin/sellers/${item.id}/status`, "approved", "Business profile approved.")}>Approve</button></>;
    if (kind === "reviews") return <><button className="admin-ghost-button-v2" type="button" onClick={() => setSelected(null)}>Close</button><button className="admin-danger-button-v2" type="button" disabled={saving} onClick={() => updateGeneric(`/admin/reviews/${item.id}/status`, "rejected", "Review rejected.")}>Reject</button><button className="admin-success-button-v2" type="button" disabled={saving} onClick={() => updateGeneric(`/admin/reviews/${item.id}/status`, "approved", "Review approved.")}>Approve</button></>;
    return <><button className="admin-ghost-button-v2" type="button" onClick={() => setSelected(null)}>Close</button><button className="admin-danger-button-v2" type="button" disabled={saving} onClick={() => updateRequest("cancelled")}>Cancel</button><button className="admin-secondary-button-v2" type="button" disabled={saving} onClick={() => updateRequest(requestForm.status)}>Save workflow</button><button className="admin-success-button-v2" type="button" disabled={saving} onClick={() => updateRequest("completed")}>Complete</button></>;
  }

  return (
    <section className="admin-workspace-v2 admin-center-page-v2">
      <div className="admin-command-hero-v2">
        <div className="admin-command-intro-v2">
          <AdminPageHeader
            eyebrow="SmartSell administration"
            title="Admin operations overview"
            description="Review marketplace activity, make approval decisions, coordinate orders and requests, and keep customer-facing operations moving from one clear workspace."
            actions={<><button className="admin-ghost-button-v2" type="button" onClick={loadOverview} disabled={loading}><AdminIcon name="refresh" size={17} />{loading ? "Refreshing" : "Refresh data"}</button><Link className="admin-primary-button-v2" to="/listings"><AdminIcon name="list" size={17} />Review listings</Link></>}
            meta={<><span><AdminIcon name="activity" size={15} />{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString("en-LK", { hour: "2-digit", minute: "2-digit" })}` : "Loading live marketplace data"}</span><AdminStatusBadge status={queueTotal ? "pending" : "approved"} label={queueTotal ? `${queueTotal} records need attention` : "All priority queues are clear"} /></>}
          />
        </div>
        <aside className="admin-priority-card-v2">
          <div className="admin-priority-card-head-v2"><span><AdminIcon name="alert" size={16} />Priority workload</span><strong>{queueTotal}</strong></div>
          <p>Records currently waiting for an administrative decision or operational follow-up.</p>
          <div className="admin-priority-breakdown-v2">
            {priorityBreakdown.map((item) => <div key={item.label} className={`tone-${item.tone}`}><span>{item.label}</span><strong>{item.value}</strong></div>)}
          </div>
          <Link to="/support">Open support operations <AdminIcon name="arrow" size={16} /></Link>
        </aside>
      </div>

      {error && <div className="admin-alert-v2 error">{error}</div>}
      {message && <div className="admin-alert-v2 success">{message}</div>}

      <div className="admin-metrics-grid-v2">
        <AdminMetricCard icon="box" label="Total products" value={safe(stats.totalProducts)} note={`${safe(stats.pendingProducts)} pending`} tone="blue" />
        <AdminMetricCard icon="store" label="Total services" value={safe(stats.totalServices)} note={`${safe(stats.pendingServices)} pending`} tone="cyan" />
        <AdminMetricCard icon="users" label="Registered users" value={safe(stats.totalUsers)} note={`${safe(stats.pendingSellers)} business approvals`} tone="emerald" />
        <AdminMetricCard icon="order" label="Total orders" value={safe(stats.totalOrders)} note={`${safe(stats.pendingOrders)} active`} tone="violet" />
        <AdminMetricCard icon="request" label="Requests" value={safe(stats.pendingRequests)} note="New or pending" tone="amber" />
        <AdminMetricCard icon="star" label="Reviews" value={safe(stats.pendingReviews)} note="Waiting moderation" tone="rose" />
      </div>

      <div className="admin-action-grid-v2">
        {actions.map((action) => <Link className="admin-action-tile-v2" to={action.to} key={action.to}><span><AdminIcon name={action.icon} /></span><div><strong>{action.title}</strong><p>{action.text}</p></div></Link>)}
      </div>

      <div className="admin-dashboard-grid-v2">
        <section className="admin-panel-v2">
          <div className="admin-panel-head-v2">
            <div><h2>Operational queues</h2><p>Click a record to inspect all details and use the appropriate admin actions.</p></div>
            <div className="admin-queue-tabs-v2" role="tablist" aria-label="Admin queues">{QUEUE_TABS.map((value) => <button type="button" key={value} className={tab === value ? "active" : ""} onClick={() => setTab(value)}>{titleCase(value)}</button>)}</div>
          </div>
          <div style={{ padding: "14px 14px 0" }}><AdminSearchToolbar value={query} onChange={setQuery} placeholder={`Search ${titleCase(tab).toLowerCase()}`} /></div>
          {loading ? <div className="admin-empty-v2"><span><AdminIcon name="refresh" /></span><h3>Loading admin data</h3><p>Retrieving current operational queues.</p></div> : null}
          {!loading && !pagination.items.length ? <AdminEmptyState icon="list" title={`No ${titleCase(tab).toLowerCase()} found`} description="This queue is clear or no records match your search." /> : null}
          {!loading && pagination.items.length ? <div className="admin-queue-list-v2">{pagination.items.map((record) => <button className="admin-queue-row-v2" type="button" key={`${record.kind}-${record.id}`} onClick={() => openRecord(record)}><div><strong>{record.title}</strong><small>{record.subtitle}</small></div><div><strong>{record.meta}</strong><small>{formatDate(record.item.createdAt)}</small></div><AdminStatusBadge status={record.status} /><span className="admin-row-open-v2"><AdminIcon name="chevron" size={16} /></span></button>)}</div> : null}
          <AdminPagination pagination={pagination} />
        </section>

        <aside className="admin-panel-v2">
          <div className="admin-panel-head-v2"><div><h2>Attention summary</h2><p>A compact view of the queues that affect customers and revenue.</p></div><button className="admin-row-open-v2" type="button" onClick={loadOverview} aria-label="Refresh"><AdminIcon name="refresh" size={16} /></button></div>
          <div className="admin-activity-list-v2">{activity.map((item) => <div className="admin-activity-item-v2" key={item.title}><span><AdminIcon name={item.icon} size={17} /></span><div><strong>{item.title}</strong><small>{item.text}</small></div></div>)}</div>
        </aside>
      </div>

      <AdminModal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.title || "Queue details"} eyebrow={selected ? titleCase(selected.kind) : "Admin queue"} size="wide" footer={modalFooter()}>
        {selected && (
          <div className="admin-form-v2">
            <AdminInfoGrid items={[
              { label: "Record", value: selected.title },
              { label: "Customer / owner", value: selected.subtitle },
              { label: "Status", value: titleCase(selected.status) },
              { label: "Summary", value: selected.meta },
              { label: "Created", value: formatDate(selected.item.createdAt) },
              { label: "Reference", value: selected.item.orderNo || selected.item.id },
            ]} />

            {selected.kind === "orders" && <div className="admin-form-section-v2" style={{ marginTop: 16 }}><h3>Delivery information</h3><AdminInfoGrid items={[{ label: "Recipient", value: selected.item.deliveryName || selected.item.customer?.name }, { label: "Phone", value: selected.item.deliveryPhone }, { label: "Address", value: selected.item.deliveryAddress }, { label: "Payment", value: titleCase(selected.item.paymentStatus) }, { label: "Delivery", value: titleCase(selected.item.deliveryStatus || "not assigned") }, { label: "Courier", value: selected.item.courierName || "Not assigned" }]} /></div>}

            {selected.kind === "requests" && <div className="admin-form-section-v2" style={{ marginTop: 16 }}><h3>Request workflow</h3><p style={{ margin: 0, color: "#6f7f92", lineHeight: 1.65 }}>{selected.item.message || "No request description."}</p><div className="admin-form-grid-v2"><label>Status<select value={requestForm.status} onChange={(event) => setRequestForm((current) => ({ ...current, status: event.target.value }))}>{["new", "pending", "quoted", "accepted", "in_progress", "completed", "cancelled"].map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}</select></label><label>Quotation<input type="number" min="0" value={requestForm.quotation} onChange={(event) => setRequestForm((current) => ({ ...current, quotation: event.target.value }))} placeholder="Quotation amount" /></label><label>Assign to<select value={requestForm.assignedTo} onChange={(event) => setRequestForm((current) => ({ ...current, assignedTo: event.target.value }))}><option value="">Not assigned</option>{(overview?.assignees || []).map((person) => <option key={`${person.value}-${person.role}`} value={person.value}>{person.label}</option>)}</select></label><label>Admin note<textarea rows="3" value={requestForm.adminNote} onChange={(event) => setRequestForm((current) => ({ ...current, adminNote: event.target.value }))} placeholder="Internal or customer-facing workflow note" /></label></div></div>}

            {selected.kind === "reviews" && <div className="admin-form-section-v2" style={{ marginTop: 16 }}><h3>Customer feedback</h3><p style={{ margin: 0, color: "#43556b", lineHeight: 1.7 }}>{selected.item.comment || "No written comment."}</p></div>}

            {["products", "services"].includes(selected.kind) && <div className="admin-form-section-v2" style={{ marginTop: 16 }}><h3>Listing description</h3><p style={{ margin: 0, color: "#43556b", lineHeight: 1.7 }}>{selected.item.description || "No description provided."}</p></div>}
          </div>
        )}
      </AdminModal>
    </section>
  );
}
