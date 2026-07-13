import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SectionHeader from "../components/SectionHeader.jsx";
import ContextMessageButton from "../components/ContextMessageButton.jsx";
import api from "../utils/api.js";

function money(value) {
  return Number(value || 0).toLocaleString("en-LK");
}

function formatStatus(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString("en-LK", { year: "numeric", month: "short", day: "numeric" });
}

function StatusPill({ status }) {
  return <span className={`status-pill status-${String(status || "").replaceAll("_", "-")}`}>{formatStatus(status)}</span>;
}

function ReviewForm({ item }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  async function submitReview(event) {
    event.preventDefault();
    try {
      setSaving(true);
      setStatus("Submitting review...");
      const { data } = await api.post("/reviews", {
        productId: item.productId,
        rating: Number(rating),
        comment,
      });
      setStatus(data.message || "Review submitted.");
      setComment("");
      setOpen(false);
    } catch (error) {
      setStatus(error.response?.data?.message || "Review submission failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="inline-review-box">
      <button className="secondary-btn small-btn" type="button" onClick={() => setOpen((current) => !current)}>
        {open ? "Close Review" : "Leave Review"}
      </button>
      {open && (
        <form className="inline-review-form" onSubmit={submitReview}>
          <select value={rating} onChange={(event) => setRating(event.target.value)}>
            <option value="5">★★★★★ Excellent</option>
            <option value="4">★★★★ Good</option>
            <option value="3">★★★ Average</option>
            <option value="2">★★ Poor</option>
            <option value="1">★ Very Poor</option>
          </select>
          <textarea
            rows="2"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Write your honest feedback..."
            required
          />
          <button className="approve-btn" type="submit" disabled={saving}>Submit Review</button>
        </form>
      )}
      {status && <small className="mini-action-note">{status}</small>}
    </div>
  );
}

function DeliveryTracker({ order }) {
  const steps = [
    { key: "confirmed", label: "Confirmed", active: ["confirmed", "processing", "ready", "delivered"].includes(order.status) },
    { key: "packed", label: "Packed", active: ["processing", "ready", "delivered"].includes(order.status) },
    { key: "moving", label: "On the way", active: ["picked_up", "on_the_way", "delivered"].includes(order.deliveryStatus) || order.status === "delivered" },
    { key: "delivered", label: "Delivered", active: order.status === "delivered" || order.deliveryStatus === "delivered" },
  ];

  return (
    <div className="delivery-tracker">
      {steps.map((step) => (
        <div className={`delivery-step ${step.active ? "done" : ""}`} key={step.key}>
          <i>{step.active ? "✓" : ""}</i>
          <span>{step.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      try {
        const { data } = await api.get("/orders");
        if (!cancelled) setOrders(data.data || []);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || "Failed to load orders.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadOrders();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const active = orders.filter((order) => !["delivered", "cancelled"].includes(order.status)).length;
    const delivered = orders.filter((order) => order.status === "delivered").length;
    const total = orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
    return { active, delivered, total };
  }, [orders]);

  return (
    <section className="page section">
      <SectionHeader
        eyebrow="My Orders"
        title="Track your SmartSell orders professionally"
        description="See order status, delivery progress, tracking details, and review delivered products from one clean page."
      />

      <div className="order-summary-strip">
        <article><span>Active</span><strong>{stats.active}</strong></article>
        <article><span>Delivered</span><strong>{stats.delivered}</strong></article>
        <article><span>Total Value</span><strong>Rs. {money(stats.total)}</strong></article>
      </div>

      {loading && <p className="form-status">Loading orders...</p>}
      {error && <div className="form-alert spaced-alert">{error}</div>}

      <div className="order-list professional-order-list">
        {orders.length ? orders.map((order) => (
          <article className="order-card pro-order-card" key={order.id}>
            <div className="order-card-head">
              <div>
                <small>Order Number</small>
                <h3>{order.orderNo}</h3>
                <p>{formatDate(order.createdAt)}</p>
              </div>
              <div className="order-status-group">
                <StatusPill status={order.status} />
                <StatusPill status={order.paymentStatus} />
                <StatusPill status={order.deliveryStatus || "not_assigned"} />
              </div>
            </div>

            <DeliveryTracker order={order} />

            <div className="delivery-info-panel">
              <div><span>Receiver</span><strong>{order.deliveryName}</strong></div>
              <div><span>Phone</span><strong>{order.deliveryPhone}</strong></div>
              <div><span>Courier</span><strong>{order.courierName || "Not assigned"}</strong></div>
              <div><span>Tracking</span><strong>{order.trackingNumber || "Not added"}</strong></div>
              <div><span>Estimate</span><strong>{formatDate(order.estimatedDelivery)}</strong></div>
              <div><span>Address</span><strong>{order.deliveryAddress}</strong></div>
            </div>

            {order.deliveryNote && <p className="delivery-note"><strong>Delivery note:</strong> {order.deliveryNote}</p>}

            <div className="order-items-mini review-ready-items">
              {order.items.map((item) => (
                <div className="order-review-row" key={item.id}>
                  <p>{item.name} × {item.quantity} <strong>Rs. {money(item.lineTotal)}</strong></p>
                  {order.status === "delivered" && item.productId && <ReviewForm item={item} />}
                </div>
              ))}
            </div>

            <div className="order-card-foot">
              <span>{order.deliveryName} • {order.deliveryPhone}</span>
              <ContextMessageButton
                contextType="order"
                contextId={order.id}
                subject={`Order help: ${order.orderNo}`}
                message={`Hi SmartSell team, I need help with order ${order.orderNo}.`}
                label="💬 Message"
                className="secondary-btn small-btn"
              />
              <Link className="secondary-btn small-btn" to="/support">Report Issue</Link>
              <div className="order-money-stack">
                {Number(order.discountAmount || 0) > 0 && <small>{order.couponCode} saved Rs. {money(order.discountAmount)}</small>}
                <strong>Rs. {money(order.totalAmount)}</strong>
              </div>
            </div>
          </article>
        )) : !loading && <p className="soft-note">No orders yet. Add products to cart and checkout.</p>}
      </div>
    </section>
  );
}
