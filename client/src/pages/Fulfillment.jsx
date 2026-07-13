import { useEffect, useMemo, useState } from "react";
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
import "../styles/pages/admin/AdminOperations.css";

const orderStatuses = ["pending", "confirmed", "processing", "ready", "delivered", "cancelled"];
const paymentStatuses = ["unpaid", "pending", "paid", "failed", "refunded"];
const deliveryStatuses = ["not_assigned", "assigned", "picked_up", "on_the_way", "delivered", "failed"];

function titleCase(value) { return String(value || "").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function money(value) { return Number(value || 0).toLocaleString("en-LK"); }
function formatDate(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not set" : date.toLocaleDateString("en-LK", { year: "numeric", month: "short", day: "2-digit" });
}
function dateInput(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function FulfillmentEditor({ order, partners, onUpdated, onClose }) {
  const [form, setForm] = useState({
    status: order.status || "pending",
    paymentStatus: order.paymentStatus || "unpaid",
    deliveryStatus: order.deliveryStatus || "not_assigned",
    deliveryPartnerId: order.deliveryPartnerId || order.deliveryPartner?.id || "",
    courierName: order.courierName || "",
    trackingNumber: order.trackingNumber || "",
    estimatedDelivery: dateInput(order.estimatedDelivery),
    deliveryFee: order.deliveryFee || 0,
    deliveryNote: order.deliveryNote || "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function update(event) { const { name, value } = event.target; setForm((current) => ({ ...current, [name]: value })); }

  async function save(mode = "order", next = {}) {
    try {
      setSaving(true);
      setMessage("");
      const payload = { ...form, ...next };
      const response = mode === "delivery"
        ? await api.patch(`/delivery/orders/${order.id}/assign`, payload)
        : await api.patch(`/orders/${order.id}/status`, payload);
      setMessage(response.data.message || "Order updated successfully.");
      await onUpdated();
    } catch (error) {
      setMessage(error.response?.data?.message || "Order update failed.");
    } finally { setSaving(false); }
  }

  return (
    <div className="admin-fulfillment-editor-v2">
      <div className="admin-modal-summary-v2">
        <div><span>Order status</span><AdminStatusBadge status={order.status} /></div>
        <div><span>Payment</span><AdminStatusBadge status={order.paymentStatus} /></div>
        <div><span>Delivery</span><AdminStatusBadge status={order.deliveryStatus || "not_assigned"} /></div>
      </div>

      <AdminInfoGrid items={[
        { label: "Customer", value: order.customer?.name || order.deliveryName || "Guest" },
        { label: "Phone", value: order.deliveryPhone || "Not provided" },
        { label: "Order total", value: `Rs. ${money(order.totalAmount)}` },
        { label: "Delivery address", value: order.deliveryAddress || "Not provided" },
        { label: "Items", value: `${order.items?.length || 0} line items` },
        { label: "Estimated delivery", value: formatDate(order.estimatedDelivery) },
      ]} />

      <section className="admin-form-section-v2">
        <h3>Package contents</h3>
        <div className="admin-ops-tag-list-v2">
          {(order.items || []).map((item) => <span key={item.id || `${item.name}-${item.quantity}`}>{item.name} × {item.quantity}</span>)}
          {!order.items?.length && <span>No items attached</span>}
        </div>
      </section>

      <section className="admin-form-section-v2">
        <h3>Fulfillment and payment</h3>
        <div className="admin-form-v2 admin-form-grid-v2 three">
          <label>Order status<select name="status" value={form.status} onChange={update}>{orderStatuses.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}</select></label>
          <label>Payment status<select name="paymentStatus" value={form.paymentStatus} onChange={update}>{paymentStatuses.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}</select></label>
          <label>Delivery status<select name="deliveryStatus" value={form.deliveryStatus} onChange={update}>{deliveryStatuses.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}</select></label>
        </div>
      </section>

      <section className="admin-form-section-v2">
        <h3>Dispatch details</h3>
        <div className="admin-form-v2 admin-form-grid-v2 two">
          <label>Delivery partner<select name="deliveryPartnerId" value={form.deliveryPartnerId} onChange={update}><option value="">Not assigned</option>{partners.map((partner) => <option key={partner.id} value={partner.id}>{partner.name} · {partner.phone || partner.email}</option>)}</select></label>
          <label>Courier / rider<input name="courierName" value={form.courierName} onChange={update} placeholder="SmartSell Rider" /></label>
          <label>Tracking number<input name="trackingNumber" value={form.trackingNumber} onChange={update} placeholder="SS-DEL-1024" /></label>
          <label>Estimated delivery<input name="estimatedDelivery" type="date" value={form.estimatedDelivery} onChange={update} /></label>
          <label>Delivery fee<input name="deliveryFee" type="number" min="0" value={form.deliveryFee} onChange={update} /></label>
        </div>
        <div className="admin-form-v2"><label>Delivery note<textarea name="deliveryNote" rows="3" value={form.deliveryNote} onChange={update} placeholder="Call before delivery, preferred time, or dispatch note..." /></label></div>
      </section>

      {message && <div className="admin-alert-v2">{message}</div>}
      <div className="admin-modal-action-grid-v2">
        <button className="admin-secondary-button-v2" type="button" disabled={saving} onClick={() => save("order", { status: "confirmed" })}>Confirm order</button>
        <button className="admin-secondary-button-v2" type="button" disabled={saving} onClick={() => save("delivery", { deliveryStatus: "assigned" })}>Assign partner</button>
        <button className="admin-secondary-button-v2" type="button" disabled={saving} onClick={() => save("order", { status: "ready" })}>Mark ready</button>
        <button className="admin-success-button-v2" type="button" disabled={saving} onClick={() => save("order", { status: "delivered", paymentStatus: "paid", deliveryStatus: "delivered" })}>Delivered + paid</button>
        <button className="admin-danger-button-v2" type="button" disabled={saving} onClick={() => save("order", { status: "cancelled", deliveryStatus: "failed" })}>Cancel order</button>
        <button className="admin-primary-button-v2" type="button" disabled={saving} onClick={() => save("delivery")}>{saving ? "Saving..." : "Save all changes"}</button>
        <button className="admin-ghost-button-v2" type="button" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default function Fulfillment() {
  const [orders, setOrders] = useState([]);
  const [partners, setPartners] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("active");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  async function loadData(nextFilter = filter) {
    try {
      setLoading(true);
      setError("");
      const [ordersResponse, partnersResponse, summaryResponse] = await Promise.all([
        api.get(`/delivery/tasks?status=${nextFilter}`), api.get("/delivery/partners"), api.get("/delivery/summary"),
      ]);
      setOrders(ordersResponse.data.data || []);
      setPartners(partnersResponse.data.data || []);
      setSummary(summaryResponse.data.data || {});
    } catch (err) { setError(err.response?.data?.message || "Failed to load fulfillment orders."); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadData(filter); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function changeFilter(value) { setFilter(value); await loadData(value); }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => !query || `${order.orderNo} ${order.customer?.name} ${order.deliveryName} ${order.deliveryPhone} ${order.deliveryAddress} ${order.deliveryPartner?.name}`.toLowerCase().includes(query));
  }, [orders, search]);
  const pagination = useAdminPagination(filtered, 10, [filter, search]);
  const unassignedCount = orders.filter((order) => !order.deliveryPartnerId && !order.deliveryPartner && ["not_assigned", null, undefined].includes(order.deliveryStatus)).length;

  return (
    <section className="admin-workspace-v2 admin-operations-page-v2 admin-fulfillment-v2">
      <AdminPageHeader
        eyebrow="Dispatch & fulfillment"
        title="Order fulfillment command"
        description="Assign delivery partners, verify payment and order status, and move every customer order through dispatch from one clean queue."
        actions={<button className="admin-secondary-button-v2" type="button" onClick={() => loadData(filter)} disabled={loading}><AdminIcon name="refresh" size={17} />Refresh queue</button>}
        meta={<><span>{partners.length} delivery partners</span><span>{unassignedCount} unassigned in view</span></>}
      />

      {error && <div className="admin-alert-v2 error">{error}</div>}
      <div className="admin-metrics-grid-v2 four">
        <AdminMetricCard icon="delivery" label="Active tasks" value={summary?.activeTasks || 0} note="Assigned, picked up, or moving" tone="blue" />
        <AdminMetricCard icon="users" label="Delivery partners" value={partners.length} note="Registered dispatch accounts" tone="violet" />
        <AdminMetricCard icon="alert" label="Unassigned" value={unassignedCount} note="Orders needing a partner" tone="amber" />
        <AdminMetricCard icon="check" label="Delivered" value={summary?.delivered || 0} note="Completed deliveries" tone="emerald" />
      </div>

      <article className="admin-panel-v2 admin-ops-panel-v2">
        <div className="admin-panel-head-v2"><div><span className="admin-ops-eyebrow-v2">Delivery queue</span><h2>Fulfillment records</h2><p>Open an order to manage all status, payment, partner, tracking, and delivery actions.</p></div></div>
        <AdminSearchToolbar
          value={search}
          onChange={setSearch}
          placeholder="Search order, customer, phone, address, or partner..."
          filters={<label className="admin-select-control-v2"><AdminIcon name="filter" size={17} /><select value={filter} onChange={(event) => changeFilter(event.target.value)}><option value="active">Active delivery</option><option value="unassigned">Unassigned</option><option value="assigned">Assigned</option><option value="picked_up">Picked up</option><option value="on_the_way">On the way</option><option value="completed">Delivered</option><option value="failed">Failed</option><option value="all">All orders</option></select></label>}
        />

        {loading ? <div className="admin-ops-loading-v2">Loading fulfillment queue...</div> : !filtered.length ? <AdminEmptyState icon="delivery" title="No fulfillment records found" description="Try another delivery stage or search term." /> : <>
          <div className="admin-ops-record-list-v2">
            {pagination.items.map((order) => (
              <article className="admin-ops-record-v2 fulfillment-row" key={order.id} role="button" tabIndex="0" onClick={() => setSelected(order)} onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && setSelected(order)}>
                <span className="admin-ops-record-icon-v2 tone-blue"><AdminIcon name="delivery" /></span>
                <div className="admin-ops-record-main-v2"><strong>{order.orderNo}</strong><small>{order.customer?.name || order.deliveryName || "Guest"} · {order.deliveryPhone || "No phone"}</small></div>
                <div className="admin-ops-record-value-v2"><strong>Rs. {money(order.totalAmount)}</strong><small>{order.items?.length || 0} items</small></div>
                <div className="admin-ops-record-secondary-v2"><strong>{order.deliveryPartner?.name || "Not assigned"}</strong><small>{order.deliveryAddress || "No address"}</small></div>
                <div className="admin-ops-status-stack-v2"><AdminStatusBadge status={order.status} /><AdminStatusBadge status={order.deliveryStatus || "not_assigned"} /></div>
                <AdminIcon name="chevron" size={17} />
              </article>
            ))}
          </div>
          <AdminPagination pagination={pagination} />
        </>}
      </article>

      <AdminModal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.orderNo || "Fulfillment details"} eyebrow="Order fulfillment" size="large">
        {selected && <FulfillmentEditor order={selected} partners={partners} onUpdated={async () => { await loadData(filter); }} onClose={() => setSelected(null)} />}
      </AdminModal>
    </section>
  );
}
