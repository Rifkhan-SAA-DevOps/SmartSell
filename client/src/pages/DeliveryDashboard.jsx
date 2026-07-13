import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SectionHeader from "../components/SectionHeader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../utils/api.js";
import "../styles/pages/business/DeliverySystemRedesign.css";

const deliveryStatuses = ["assigned", "picked_up", "on_the_way", "delivered", "failed"];

const filters = [
  { value: "active", label: "Active" },
  { value: "assigned", label: "Assigned" },
  { value: "picked_up", label: "Picked Up" },
  { value: "on_the_way", label: "On The Way" },
  { value: "completed", label: "Delivered" },
  { value: "failed", label: "Failed" },
  { value: "all", label: "All" },
];

const statusSteps = [
  { key: "assigned", label: "Assigned" },
  { key: "picked_up", label: "Picked Up" },
  { key: "on_the_way", label: "On The Way" },
  { key: "delivered", label: "Delivered" },
];

function titleCase(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString("en-LK", { year: "numeric", month: "short", day: "2-digit" });
}

function money(value) {
  return Number(value || 0).toLocaleString("en-LK");
}

function statusIndex(status) {
  const index = statusSteps.findIndex((step) => step.key === status);
  return index < 0 ? 0 : index;
}

function MetricCard({ label, value, note, tone = "blue" }) {
  return (
    <article className={`delivery-metric-card tone-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{note}</p>
    </article>
  );
}

function DeliveryTimeline({ status }) {
  const currentIndex = statusIndex(status);
  const failed = status === "failed";

  return (
    <div className={`delivery-timeline ${failed ? "failed" : ""}`} aria-label="Delivery progress">
      {statusSteps.map((step, index) => (
        <span key={step.key} className={index <= currentIndex && !failed ? "done" : ""}>
          <b>{index + 1}</b>
          <small>{step.label}</small>
        </span>
      ))}
    </div>
  );
}

function DeliveryTaskCard({ task, onUpdated }) {
  const [form, setForm] = useState({
    deliveryStatus: task.deliveryStatus || "assigned",
    trackingNumber: task.trackingNumber || "",
    courierName: task.courierName || "",
    deliveryNote: task.deliveryNote || "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function update(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function save(next = {}) {
    try {
      setSaving(true);
      setMessage("Updating delivery task...");
      const payload = { ...form, ...next };
      await api.patch(`/delivery/orders/${task.id}/status`, payload);
      setForm((current) => ({ ...current, ...next }));
      setMessage("Delivery status updated successfully.");
      await onUpdated();
    } catch (error) {
      setMessage(error.response?.data?.message || "Delivery update failed.");
    } finally {
      setSaving(false);
    }
  }

  const status = form.deliveryStatus || task.deliveryStatus || "assigned";
  const phone = task.deliveryPhone || task.customer?.phone || "";
  const address = task.deliveryAddress || task.customer?.address || "No delivery address added";
  const items = task.items || [];

  return (
    <article className="delivery-pro-card">
      <div className="delivery-pro-card-header">
        <div className="delivery-order-title">
          <span className="delivery-order-chip">Order {task.orderNo || task.id?.slice?.(0, 8) || "New"}</span>
          <h3>{task.deliveryName || task.customer?.name || "Customer Delivery"}</h3>
          <p>{address}</p>
        </div>
        <div className="delivery-status-stack">
          <b className={`delivery-status-pill status-${String(status).replaceAll("_", "-")}`}>{titleCase(status)}</b>
          {phone ? <a href={`tel:${phone}`} className="delivery-call-link">Call customer</a> : <span className="delivery-call-link disabled">No phone</span>}
        </div>
      </div>

      <DeliveryTimeline status={status} />

      <div className="delivery-detail-strip">
        <div><span>Total</span><strong>Rs. {money(task.totalAmount)}</strong></div>
        <div><span>Delivery Fee</span><strong>Rs. {money(task.deliveryFee)}</strong></div>
        <div><span>Estimate</span><strong>{formatDate(task.estimatedDelivery)}</strong></div>
        <div><span>Tracking</span><strong>{form.trackingNumber || "Not added"}</strong></div>
      </div>

      <div className="delivery-card-body-grid">
        <div className="delivery-items-panel">
          <div className="delivery-panel-title">
            <strong>Package items</strong>
            <small>{items.length || 0} line item{items.length === 1 ? "" : "s"}</small>
          </div>
          <div className="delivery-item-tags">
            {items.length ? items.map((item) => (
              <span key={item.id || `${item.name}-${item.quantity}`}>{item.name} × {item.quantity}</span>
            )) : <em>No items attached to this delivery.</em>}
          </div>
        </div>

        <div className="delivery-update-panel">
          <div className="delivery-panel-title">
            <strong>Update delivery</strong>
            <small>Status, courier and delivery note</small>
          </div>

          <div className="delivery-form-grid">
            <label>Status
              <select name="deliveryStatus" value={form.deliveryStatus} onChange={update}>
                {deliveryStatuses.map((deliveryStatus) => <option key={deliveryStatus} value={deliveryStatus}>{titleCase(deliveryStatus)}</option>)}
              </select>
            </label>
            <label>Tracking Number
              <input name="trackingNumber" value={form.trackingNumber} onChange={update} placeholder="Example: SS-DEL-1024" />
            </label>
            <label>Courier / Rider Name
              <input name="courierName" value={form.courierName} onChange={update} placeholder="Delivery person or team" />
            </label>
          </div>

          <label className="delivery-note-label">Delivery Note
            <textarea name="deliveryNote" rows="3" value={form.deliveryNote} onChange={update} placeholder="Example: Customer requested delivery after 5 PM." />
          </label>
        </div>
      </div>

      <div className="delivery-action-bar">
        <button type="button" disabled={saving} onClick={() => save({ deliveryStatus: "picked_up" })}>Picked Up</button>
        <button type="button" disabled={saving} onClick={() => save({ deliveryStatus: "on_the_way" })}>On The Way</button>
        <button type="button" disabled={saving} className="success" onClick={() => save({ deliveryStatus: "delivered" })}>Delivered</button>
        <button type="button" disabled={saving} className="danger" onClick={() => save({ deliveryStatus: "failed" })}>Failed</button>
        <button type="button" disabled={saving} className="primary" onClick={() => save()}>Save Changes</button>
      </div>

      {message && <p className={`delivery-message ${message.toLowerCase().includes("failed") ? "error" : ""}`}>{message}</p>}
    </article>
  );
}

export default function DeliveryDashboard() {
  const { user } = useAuth();
  const isAdminView = ["admin", "super_admin"].includes(user?.role);
  const [summary, setSummary] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("active");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData(nextFilter = filter) {
    try {
      setLoading(true);
      setError("");
      const [summaryResponse, tasksResponse] = await Promise.all([
        api.get("/delivery/summary"),
        api.get(`/delivery/tasks?status=${nextFilter}`),
      ]);
      setSummary(summaryResponse.data.data || {});
      setTasks(tasksResponse.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load delivery tasks.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function changeFilter(next) {
    setFilter(next);
    await loadData(next);
  }

  const completedToday = useMemo(() => {
    const today = new Date().toDateString();
    return tasks.filter((task) => task.deliveryStatus === "delivered" && task.deliveredAt && new Date(task.deliveredAt).toDateString() === today).length;
  }, [tasks]);

  const activeTasks = summary?.activeTasks || 0;
  const assigned = summary?.assigned || 0;
  const onTheWay = summary?.onTheWay || 0;
  const delivered = summary?.delivered || 0;

  return (
    <section className="delivery-redesign-page">
      <div className="delivery-command-hero">
        <div>
          <span className="delivery-hero-kicker">Delivery Control Center</span>
          <h1>{user?.role === "delivery_partner" ? "My delivery route board" : "Delivery operations dashboard"}</h1>
          <p>
            Manage pickups, live delivery movement, customer calls, tracking numbers and delivery notes from one clean workspace.
          </p>
          <div className="delivery-hero-actions">
            {isAdminView && <Link to="/fulfillment">Open Fulfillment</Link>}
            <Link to="/orders">View Orders</Link>
            <Link to="/inbox">Messages</Link>
          </div>
        </div>
        <div className="delivery-route-card">
          <span>Today&apos;s focus</span>
          <strong>{activeTasks}</strong>
          <p>Active deliveries need updates until completed or failed.</p>
        </div>
      </div>

      <SectionHeader
        eyebrow="Live delivery workflow"
        title={isAdminView ? "Dispatch, track and verify delivery movement" : "Update each assigned delivery clearly"}
        description="Use the filter bar to switch delivery stages. Each delivery card has enough space for customer details, item summary, status progress and aligned action buttons."
      />

      <div className="delivery-quick-grid" aria-label="Delivery shortcuts">
        <Link to={isAdminView ? "/fulfillment" : "/dashboard"}>
          <b>01</b><span><strong>{isAdminView ? "Assign & Dispatch" : "My Workspace"}</strong><small>{isAdminView ? "Assign orders before delivery movement." : "Return to your partner dashboard."}</small></span>
        </Link>
        <Link to="/orders">
          <b>02</b><span><strong>Order Tracking</strong><small>Review customer order status and payment context.</small></span>
        </Link>
        <Link to={isAdminView ? "/inventory" : "/inbox"}>
          <b>03</b><span><strong>{isAdminView ? "Inventory Check" : "Delivery Messages"}</strong><small>{isAdminView ? "Check stock before dispatch." : "Message admin or customer support."}</small></span>
        </Link>
      </div>

      <div className="delivery-metrics-grid">
        <MetricCard label="Active" value={activeTasks} note="Assigned, picked up, or on the way" tone="blue" />
        <MetricCard label="Assigned" value={assigned} note="Waiting for pickup" tone="violet" />
        <MetricCard label="On The Way" value={onTheWay} note="Currently moving" tone="amber" />
        <MetricCard label="Delivered" value={delivered} note={`${completedToday} completed today in this view`} tone="green" />
      </div>

      <div className="delivery-board-layout">
        <main className="delivery-board-main">
          <div className="delivery-filter-panel">
            <div>
              <strong>Delivery tasks</strong>
              <p>Choose a stage. Cards stay wide so details and buttons do not shrink.</p>
            </div>
            <div className="delivery-filter-chips" role="group" aria-label="Filter delivery tasks">
              {filters.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={filter === item.value ? "active" : ""}
                  onClick={() => changeFilter(item.value)}
                  disabled={loading}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {loading && <p className="delivery-state-card">Loading delivery tasks...</p>}
          {error && <div className="delivery-state-card error">{error}</div>}

          <div className="delivery-task-stack">
            {tasks.length ? tasks.map((task) => (
              <DeliveryTaskCard key={task.id} task={task} onUpdated={() => loadData(filter)} />
            )) : !loading && <p className="delivery-state-card">No delivery tasks found for this filter.</p>}
          </div>
        </main>

        <aside className="delivery-side-panel">
          <div className="delivery-side-card">
            <span>How to use</span>
            <h3>Delivery flow</h3>
            <ol>
              <li>Admin assigns order in Fulfillment.</li>
              <li>Rider marks Picked Up.</li>
              <li>Rider marks On The Way.</li>
              <li>Rider marks Delivered or Failed.</li>
            </ol>
          </div>
          <div className="delivery-side-card soft">
            <span>Navigation</span>
            <h3>Where to go next</h3>
            <p>Use the sidebar for Delivery Center. Use Fulfillment for admin assignment. Use Orders for customer status checks.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
