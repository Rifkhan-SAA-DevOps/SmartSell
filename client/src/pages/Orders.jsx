import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ContextMessageButton from "../components/ContextMessageButton.jsx";
import SmartPagination from "../components/SmartPagination.jsx";
import {
  AccountDetailGrid,
  AccountEmpty,
  AccountIcon,
  AccountModal,
  AccountPageHeader,
  AccountSearch,
  AccountStatGrid,
  AccountStatus,
  AccountToolbar,
} from "../components/CustomerAccountUi.jsx";
import useSmartPagination from "../hooks/useSmartPagination.js";
import api from "../utils/api.js";

function money(value) {
  return Number(value || 0).toLocaleString("en-LK");
}

function readable(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value, includeTime = false) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleString("en-LK", includeTime
    ? { dateStyle: "medium", timeStyle: "short" }
    : { year: "numeric", month: "short", day: "numeric" });
}

function ReviewForm({ item }) {
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
    } catch (error) {
      setStatus(error.response?.data?.message || "Review submission failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="ca-review-form" onSubmit={submitReview}>
      <div className="ca-form-row">
        <label>Rating
          <select value={rating} onChange={(event) => setRating(event.target.value)}>
            <option value="5">★★★★★ Excellent</option>
            <option value="4">★★★★ Good</option>
            <option value="3">★★★ Average</option>
            <option value="2">★★ Poor</option>
            <option value="1">★ Very poor</option>
          </select>
        </label>
      </div>
      <label>Review
        <textarea rows="3" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Share a useful and honest review..." required />
      </label>
      <div className="ca-form-actions">
        <button className="ca-button ca-button--primary" type="submit" disabled={saving}>{saving ? "Submitting..." : "Submit review"}</button>
        {status && <span className="ca-form-note">{status}</span>}
      </div>
    </form>
  );
}

function DeliveryTracker({ order }) {
  const steps = [
    { label: "Confirmed", active: ["confirmed", "processing", "ready", "delivered"].includes(order.status) },
    { label: "Packed", active: ["processing", "ready", "delivered"].includes(order.status) },
    { label: "On the way", active: ["picked_up", "on_the_way", "delivered"].includes(order.deliveryStatus) || order.status === "delivered" },
    { label: "Delivered", active: order.status === "delivered" || order.deliveryStatus === "delivered" },
  ];

  return (
    <div className="ca-delivery-tracker">
      {steps.map((step, index) => (
        <div className={step.active ? "is-complete" : ""} key={step.label}>
          <i>{step.active ? <AccountIcon name="check" size={13} /> : index + 1}</i>
          <span>{step.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");

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
    return () => { cancelled = true; };
  }, []);

  const stats = useMemo(() => {
    const active = orders.filter((order) => !["delivered", "cancelled"].includes(order.status)).length;
    const delivered = orders.filter((order) => order.status === "delivered").length;
    const total = orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
    return { active, delivered, total };
  }, [orders]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = orders.filter((order) => {
      const matchesStatus = status === "all" || order.status === status;
      const matchesSearch = !query || [order.orderNo, order.deliveryName, order.deliveryPhone, order.trackingNumber]
        .some((value) => String(value || "").toLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    });
    return [...result].sort((left, right) => {
      if (sort === "oldest") return new Date(left.createdAt || 0) - new Date(right.createdAt || 0);
      if (sort === "amount_high") return Number(right.totalAmount || 0) - Number(left.totalAmount || 0);
      if (sort === "amount_low") return Number(left.totalAmount || 0) - Number(right.totalAmount || 0);
      return new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
    });
  }, [orders, search, status, sort]);

  const pagination = useSmartPagination(filtered, { initialPageSize: 10, resetKey: `${search}-${status}-${sort}` });

  return (
    <section className="ca-account-page ca-orders-page">
      <AccountPageHeader
        eyebrow="Purchases"
        title="My orders"
        description="Track every order from confirmation to delivery. Select an order to see complete details and actions."
        icon="order"
        actions={<Link className="ca-button ca-button--primary" to="/marketplace">Continue shopping <AccountIcon name="arrow" size={16} /></Link>}
      />

      <AccountStatGrid items={[
        { label: "Active orders", value: stats.active, note: "Still in progress", icon: "activity", tone: "violet" },
        { label: "Delivered", value: stats.delivered, note: "Completed purchases", icon: "check", tone: "emerald" },
        { label: "Total value", value: `Rs. ${money(stats.total)}`, note: "Across all orders", icon: "money", tone: "cyan" },
      ]} />

      <AccountToolbar resultText={`${filtered.length} order${filtered.length === 1 ? "" : "s"}`}>
        <AccountSearch value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order, receiver, phone, tracking..." />
        <label className="ca-select-filter"><AccountIcon name="filter" size={17} /><select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="processing">Processing</option>
          <option value="ready">Ready</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select></label>
        <label className="ca-select-filter"><AccountIcon name="arrow" size={17} /><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort orders">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="amount_high">Highest value</option>
          <option value="amount_low">Lowest value</option>
        </select></label>
      </AccountToolbar>

      {error && <div className="ca-alert ca-alert--error">{error}</div>}
      {loading ? <div className="ca-loading">Loading your orders...</div> : filtered.length === 0 ? (
        <AccountEmpty icon="order" title="No matching orders" text={orders.length ? "Try another search or status filter." : "Your completed checkouts will appear here."} actionLabel="Browse marketplace" actionTo="/marketplace" />
      ) : (
        <>
          <div className="ca-record-list">
            {pagination.items.map((order) => (
              <article className="ca-record-card ca-order-row" key={order.id} role="button" tabIndex="0" onClick={() => setSelectedOrder(order)} onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && setSelectedOrder(order)}>
                <span className="ca-record-card__icon tone-violet"><AccountIcon name="box" size={21} /></span>
                <div className="ca-record-card__main">
                  <div className="ca-record-card__title"><h3>{order.orderNo}</h3><AccountStatus value={order.status} label={readable(order.status)} /></div>
                  <p>{formatDate(order.createdAt)} · {order.items?.length || 0} item{order.items?.length === 1 ? "" : "s"} · {order.deliveryName || "Receiver not set"}</p>
                  <div className="ca-record-card__meta"><span>Payment: <b>{readable(order.paymentStatus)}</b></span><span>Delivery: <b>{readable(order.deliveryStatus || "Not assigned")}</b></span></div>
                </div>
                <div className="ca-record-card__amount"><small>Total</small><strong>Rs. {money(order.totalAmount)}</strong><span>View details <AccountIcon name="chevron" size={15} /></span></div>
              </article>
            ))}
          </div>
          <SmartPagination pagination={pagination} label="orders" compact />
        </>
      )}

      <AccountModal open={Boolean(selectedOrder)} onClose={() => setSelectedOrder(null)} title={selectedOrder?.orderNo || "Order details"} eyebrow="Order details" icon="order" size="large">
        {selectedOrder && <>
          <div className="ca-modal-summary-row">
            <div><span>Order status</span><AccountStatus value={selectedOrder.status} label={readable(selectedOrder.status)} /></div>
            <div><span>Payment</span><AccountStatus value={selectedOrder.paymentStatus} label={readable(selectedOrder.paymentStatus)} /></div>
            <div><span>Total</span><strong>Rs. {money(selectedOrder.totalAmount)}</strong></div>
          </div>

          <section className="ca-modal-section"><div className="ca-modal-section__head"><h3>Delivery progress</h3><span>{readable(selectedOrder.deliveryStatus || "Not assigned")}</span></div><DeliveryTracker order={selectedOrder} /></section>

          <section className="ca-modal-section"><h3>Delivery information</h3><AccountDetailGrid items={[
            { label: "Receiver", value: selectedOrder.deliveryName || "Not set" },
            { label: "Phone", value: selectedOrder.deliveryPhone || "Not set" },
            { label: "Address", value: selectedOrder.deliveryAddress || "Not set" },
            { label: "Courier", value: selectedOrder.courierName || "Not assigned" },
            { label: "Tracking number", value: selectedOrder.trackingNumber || "Not added" },
            { label: "Estimated delivery", value: formatDate(selectedOrder.estimatedDelivery) },
            { label: "Created", value: formatDate(selectedOrder.createdAt, true) },
          ]} />{selectedOrder.deliveryNote && <div className="ca-note"><strong>Delivery note</strong><p>{selectedOrder.deliveryNote}</p></div>}</section>

          <section className="ca-modal-section"><h3>Items</h3><div className="ca-item-list">
            {(selectedOrder.items || []).map((item) => (
              <article key={item.id}><div><strong>{item.name}</strong><span>Quantity {item.quantity}</span></div><b>Rs. {money(item.lineTotal)}</b>
                {selectedOrder.status === "delivered" && item.productId && <details><summary>Leave a review</summary><ReviewForm item={item} /></details>}
              </article>
            ))}
          </div></section>

          <div className="ca-modal-actions">
            <ContextMessageButton contextType="order" contextId={selectedOrder.id} subject={`Order help: ${selectedOrder.orderNo}`} message={`Hi SmartSell team, I need help with order ${selectedOrder.orderNo}.`} label="Message about order" className="ca-button ca-button--primary" />
            <Link className="ca-button ca-button--soft" to="/support" onClick={() => setSelectedOrder(null)}>Report an issue</Link>
          </div>
        </>}
      </AccountModal>
    </section>
  );
}
