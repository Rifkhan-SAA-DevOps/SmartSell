import { useEffect, useMemo, useState } from "react";
import SectionHeader from "../components/SectionHeader.jsx";
import api from "../utils/api.js";

const orderStatuses = ["pending", "confirmed", "processing", "ready", "delivered", "cancelled"];
const paymentStatuses = ["unpaid", "pending", "paid", "failed", "refunded"];
const deliveryStatuses = ["not_assigned", "assigned", "picked_up", "on_the_way", "delivered", "failed"];

function formatStatus(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function money(value) {
  return Number(value || 0).toLocaleString("en-LK");
}

function formatDateInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function StatusPill({ status }) {
  return <span className={`status-pill status-${String(status || "").replaceAll("_", "-")}`}>{formatStatus(status)}</span>;
}

function FulfillmentCard({ order, partners, onUpdated }) {
  const [form, setForm] = useState({
    status: order.status || "pending",
    paymentStatus: order.paymentStatus || "unpaid",
    deliveryStatus: order.deliveryStatus || "not_assigned",
    deliveryPartnerId: order.deliveryPartnerId || "",
    courierName: order.courierName || "",
    trackingNumber: order.trackingNumber || "",
    estimatedDelivery: formatDateInput(order.estimatedDelivery),
    deliveryFee: order.deliveryFee || 0,
    deliveryNote: order.deliveryNote || "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function update(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function saveOrder(next = {}) {
    try {
      setSaving(true);
      setMessage("Saving order details...");
      const payload = { ...form, ...next };
      await api.patch(`/orders/${order.id}/status`, payload);
      setMessage("Order status updated.");
      await onUpdated();
    } catch (error) {
      setMessage(error.response?.data?.message || "Order update failed.");
    } finally {
      setSaving(false);
    }
  }

  async function assignDelivery(next = {}) {
    try {
      setSaving(true);
      setMessage("Assigning delivery partner...");
      const payload = { ...form, ...next };
      const response = await api.patch(`/delivery/orders/${order.id}/assign`, payload);
      setMessage(response.data.message || "Delivery assignment updated.");
      await onUpdated();
    } catch (error) {
      setMessage(error.response?.data?.message || "Delivery assignment failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="fulfillment-card delivery-assign-card">
      <div className="fulfillment-card-head">
        <div>
          <small>Order</small>
          <h3>{order.orderNo}</h3>
          <p>{order.customer?.name || order.deliveryName} • {order.deliveryPhone}</p>
        </div>
        <div className="order-status-group">
          <StatusPill status={order.status} />
          <StatusPill status={order.paymentStatus} />
          <StatusPill status={order.deliveryStatus || "not_assigned"} />
        </div>
      </div>

      <div className="fulfillment-summary-grid">
        <div><span>Total</span><strong>Rs. {money(order.totalAmount)}</strong></div>
        <div><span>Items</span><strong>{order.items?.length || 0}</strong></div>
        <div><span>Delivery Partner</span><strong>{order.deliveryPartner?.name || "Not assigned"}</strong></div>
        <div><span>Address</span><strong>{order.deliveryAddress || "-"}</strong></div>
      </div>

      <div className="fulfillment-items">
        {(order.items || []).map((item) => (
          <span key={item.id}>{item.name} × {item.quantity}</span>
        ))}
      </div>

      <div className="fulfillment-form-grid">
        <label>Order Status
          <select name="status" value={form.status} onChange={update}>
            {orderStatuses.map((status) => <option key={status} value={status}>{formatStatus(status)}</option>)}
          </select>
        </label>
        <label>Payment Status
          <select name="paymentStatus" value={form.paymentStatus} onChange={update}>
            {paymentStatuses.map((status) => <option key={status} value={status}>{formatStatus(status)}</option>)}
          </select>
        </label>
        <label>Delivery Partner
          <select name="deliveryPartnerId" value={form.deliveryPartnerId} onChange={update}>
            <option value="">Not assigned</option>
            {partners.map((partner) => <option key={partner.id} value={partner.id}>{partner.name} • {partner.phone || partner.email}</option>)}
          </select>
        </label>
        <label>Delivery Status
          <select name="deliveryStatus" value={form.deliveryStatus} onChange={update}>
            {deliveryStatuses.map((status) => <option key={status} value={status}>{formatStatus(status)}</option>)}
          </select>
        </label>
        <label>Courier / Delivery Person
          <input name="courierName" value={form.courierName} onChange={update} placeholder="Example: SmartSell Rider" />
        </label>
        <label>Delivery Fee
          <input name="deliveryFee" type="number" min="0" value={form.deliveryFee} onChange={update} placeholder="0" />
        </label>
        <label>Tracking Number
          <input name="trackingNumber" value={form.trackingNumber} onChange={update} placeholder="Optional tracking code" />
        </label>
        <label>Estimated Delivery
          <input name="estimatedDelivery" type="date" value={form.estimatedDelivery} onChange={update} />
        </label>
      </div>

      <label className="fulfillment-note-label">Delivery Note
        <textarea name="deliveryNote" rows="3" value={form.deliveryNote} onChange={update} placeholder="Example: Call before delivery. Customer available after 5 PM." />
      </label>

      <div className="fulfillment-actions">
        <button className="secondary-btn small-btn" type="button" disabled={saving} onClick={() => saveOrder({ status: "confirmed" })}>Confirm</button>
        <button className="secondary-btn small-btn" type="button" disabled={saving} onClick={() => assignDelivery({ deliveryStatus: "assigned" })}>Assign Partner</button>
        <button className="secondary-btn small-btn" type="button" disabled={saving} onClick={() => saveOrder({ status: "ready" })}>Ready</button>
        <button className="primary-btn small-btn" type="button" disabled={saving} onClick={() => saveOrder({ status: "delivered", paymentStatus: "paid", deliveryStatus: "delivered" })}>Delivered + Paid</button>
        <button className="reject-btn" type="button" disabled={saving} onClick={() => saveOrder({ status: "cancelled", deliveryStatus: "failed" })}>Cancel</button>
        <button className="approve-btn" type="button" disabled={saving} onClick={() => assignDelivery()}>Save Delivery</button>
      </div>
      {message && <p className="mini-action-note">{message}</p>}
    </article>
  );
}

export default function Fulfillment() {
  const [orders, setOrders] = useState([]);
  const [partners, setPartners] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("active");

  async function loadData(nextFilter = filter) {
    try {
      setLoading(true);
      setError("");
      const [ordersResponse, partnersResponse, summaryResponse] = await Promise.all([
        api.get(`/delivery/tasks?status=${nextFilter}`),
        api.get("/delivery/partners"),
        api.get("/delivery/summary"),
      ]);
      setOrders(ordersResponse.data.data || []);
      setPartners(partnersResponse.data.data || []);
      setSummary(summaryResponse.data.data || {});
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load fulfillment orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function changeFilter(event) {
    const next = event.target.value;
    setFilter(next);
    await loadData(next);
  }

  const unassignedCount = useMemo(() => orders.filter((order) => order.deliveryStatus === "not_assigned").length, [orders]);

  return (
    <section className="page section fulfillment-page delivery-management-page">
      <SectionHeader
        eyebrow="Order Fulfillment"
        title="Manage delivery partners, assignments, and tracking"
        description="Assign orders to SmartSell delivery partners, update tracking details, and monitor active delivery progress without squeezed tables."
      />

      <div className="fulfillment-kpi-grid delivery-kpi-grid">
        <article><span>Active Tasks</span><strong>{summary?.activeTasks || 0}</strong><p>Assigned, picked up, or on the way</p></article>
        <article><span>Available Partners</span><strong>{partners.length}</strong><p>Delivery partner accounts</p></article>
        <article><span>Unassigned In View</span><strong>{unassignedCount}</strong><p>Need delivery partner assignment</p></article>
        <article><span>Delivered</span><strong>{summary?.delivered || 0}</strong><p>Completed deliveries</p></article>
      </div>

      <div className="fulfillment-toolbar glass-card">
        <div>
          <strong>Delivery Queue</strong>
          <p>Filter the queue and assign orders to registered delivery partners.</p>
        </div>
        <select value={filter} onChange={changeFilter}>
          <option value="active">Active Delivery</option>
          <option value="unassigned">Unassigned</option>
          <option value="assigned">Assigned</option>
          <option value="picked_up">Picked Up</option>
          <option value="on_the_way">On The Way</option>
          <option value="completed">Delivered</option>
          <option value="failed">Failed</option>
          <option value="all">All Orders</option>
        </select>
      </div>

      {loading && <p className="form-status">Loading fulfillment data...</p>}
      {error && <div className="form-alert spaced-alert">{error}</div>}

      <div className="fulfillment-list">
        {orders.length ? orders.map((order) => (
          <FulfillmentCard key={order.id} order={order} partners={partners} onUpdated={() => loadData(filter)} />
        )) : !loading && <p className="soft-note">No orders found for this filter.</p>}
      </div>
    </section>
  );
}
