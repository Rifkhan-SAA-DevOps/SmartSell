import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api.js";

function money(value) {
  return Number(value || 0).toLocaleString("en-LK");
}

function formatStatus(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function StatusPill({ status }) {
  return <span className={`status-pill status-${String(status || "").replaceAll("_", "-")}`}>{formatStatus(status)}</span>;
}

function EmptyRow({ colSpan, text }) {
  return <tr><td colSpan={colSpan} className="empty-table-cell">{text}</td></tr>;
}

function MetricCard({ code, label, value, hint, tone = "blue" }) {
  return (
    <article className={`ops-metric-card tone-${tone}`}>
      <span>{code}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <p>{hint}</p>
      </div>
    </article>
  );
}

function ActionTile({ code, title, text, to, tone = "blue" }) {
  return (
    <Link className={`ops-action-tile tone-${tone}`} to={to}>
      <span>{code}</span>
      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
    </Link>
  );
}

function AdminActionButtons({ onApprove, onReject, approveText = "Approve", rejectText = "Reject" }) {
  return (
    <div className="compact-actions">
      <button className="approve-btn" type="button" onClick={onApprove}>{approveText}</button>
      <button className="reject-btn" type="button" onClick={onReject}>{rejectText}</button>
    </div>
  );
}

function RequestWorkflowCard({ request, assignees, onSaved }) {
  const [form, setForm] = useState({
    status: request.status || "new",
    quotation: request.quotation || "",
    assignedTo: request.assignedTo || "",
    adminNote: request.adminNote || "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function update(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function save(nextStatus = form.status) {
    setSaving(true);
    setMessage("Saving...");
    try {
      const payload = {
        ...form,
        status: nextStatus,
        quotation: form.quotation === "" ? null : form.quotation,
      };
      await api.patch(`/admin/requests/${request.id}/status`, payload);
      setMessage("Request workflow updated.");
      await onSaved();
    } catch (error) {
      setMessage(error.response?.data?.message || "Request update failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="ops-request-card">
      <div className="ops-request-top">
        <div>
          <span className="request-type-chip">{formatStatus(request.requestType || "custom request")}</span>
          <h3>{request.name}</h3>
          <p>{request.phone} {request.email ? `• ${request.email}` : ""}</p>
        </div>
        <StatusPill status={request.status} />
      </div>

      <p className="ops-request-message">{request.message}</p>

      <div className="ops-meta-grid">
        <span>Budget <strong>{request.budget ? `Rs. ${money(request.budget)}` : "-"}</strong></span>
        <span>Quote <strong>{request.quotation ? `Rs. ${money(request.quotation)}` : "Not quoted"}</strong></span>
        <span>Location <strong>{request.location || "-"}</strong></span>
        <span>Assigned <strong>{request.assignedTo || "Not assigned"}</strong></span>
      </div>

      <div className="ops-request-form">
        <label>Status
          <select name="status" value={form.status} onChange={update}>
            <option value="new">New</option>
            <option value="pending">Pending</option>
            <option value="quoted">Quoted</option>
            <option value="accepted">Accepted</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        <label>Quotation Amount
          <input name="quotation" type="number" min="0" value={form.quotation} onChange={update} placeholder="Example: 8000" />
        </label>
        <label>Assign To
          <select name="assignedTo" value={form.assignedTo} onChange={update}>
            <option value="">Not assigned</option>
            {assignees.map((person) => (
              <option key={`${person.value}-${person.role}`} value={person.value}>{person.label}</option>
            ))}
          </select>
        </label>
        <label>Admin Note
          <textarea name="adminNote" rows="3" value={form.adminNote} onChange={update} placeholder="Example: Cake maker assigned. Advance payment needed." />
        </label>
      </div>

      <div className="ops-request-actions">
        <button className="approve-btn" type="button" disabled={saving} onClick={() => save("quoted")}>Send Quote</button>
        <button className="approve-btn" type="button" disabled={saving} onClick={() => save("in_progress")}>Start</button>
        <button className="approve-btn" type="button" disabled={saving} onClick={() => save("completed")}>Complete</button>
        <button className="secondary-btn small-btn" type="button" disabled={saving} onClick={() => save(form.status)}>Save</button>
        <button className="reject-btn" type="button" disabled={saving} onClick={() => save("cancelled")}>Cancel</button>
      </div>

      {message && <p className="form-status">{message}</p>}
    </article>
  );
}

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadOverview() {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get("/admin/overview");
      setOverview(data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load admin overview.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOverview();
  }, []);

  async function changeStatus(path, statusValue, message) {
    try {
      setStatus("Updating...");
      await api.patch(path, { status: statusValue });
      setStatus(message);
      await loadOverview();
    } catch (err) {
      setStatus(err.response?.data?.message || "Update failed.");
    }
  }

  async function changeOrderStatus(order, statusValue, paymentStatusValue = undefined) {
    try {
      setStatus("Updating order...");
      const payload = { status: statusValue };
      if (paymentStatusValue) payload.paymentStatus = paymentStatusValue;
      await api.patch(`/orders/${order.id}/status`, payload);
      setStatus(`Order moved to ${formatStatus(statusValue)}.`);
      await loadOverview();
    } catch (err) {
      setStatus(err.response?.data?.message || "Order update failed.");
    }
  }

  const stats = overview?.stats || {
    totalProducts: "-",
    totalServices: "-",
    totalUsers: "-",
    pendingProducts: "-",
    pendingServices: "-",
    pendingSellers: "-",
    pendingRequests: "-",
    totalOrders: "-",
    pendingOrders: "-",
    pendingReviews: "-",
  };

  const queueTotal = useMemo(() => {
    const safeCount = (value) => {
      const number = Number(value);
      return Number.isFinite(number) ? number : 0;
    };

    return safeCount(stats.pendingProducts)
      + safeCount(stats.pendingServices)
      + safeCount(stats.pendingSellers)
      + safeCount(stats.pendingRequests)
      + safeCount(stats.pendingOrders)
      + safeCount(stats.pendingReviews);
  }, [stats]);

  return (
    <section className="page section admin-ops-page">
      <div className="ops-hero">
        <div>
          <span className="eyebrow">SmartSell Admin</span>
          <h1>Professional command center for daily marketplace operations.</h1>
          <p>Review approvals, control order flow, send quotations, manage queues, and jump to the right admin module quickly.</p>
          <div className="ops-hero-actions">
            <Link className="primary-btn" to="/listings">Open Listing Center</Link>
            <Link className="secondary-btn" to="/reports">View Reports</Link>
          </div>
        </div>
        <aside className="ops-priority-card">
          <small>Active queue</small>
          <strong>{queueTotal}</strong>
          <span>items need admin attention</span>
          <Link to="/support">Review support tickets</Link>
        </aside>
      </div>

      {loading && <p className="form-status">Loading admin data...</p>}
      {error && <div className="form-alert spaced-alert">{error}</div>}
      {status && <div className="success-alert spaced-alert">{status}</div>}

      <div className="ops-metric-grid">
        <MetricCard code="PR" label="Products" value={stats.totalProducts} hint={`${stats.pendingProducts} pending approvals`} tone="blue" />
        <MetricCard code="SV" label="Services" value={stats.totalServices} hint={`${stats.pendingServices} pending approvals`} tone="cyan" />
        <MetricCard code="US" label="Users" value={stats.totalUsers} hint={`${stats.pendingSellers} business approvals`} tone="green" />
        <MetricCard code="OR" label="Orders" value={stats.totalOrders} hint={`${stats.pendingOrders} active / pending`} tone="purple" />
        <MetricCard code="RQ" label="Requests" value={stats.pendingRequests} hint="custom requests waiting" tone="amber" />
        <MetricCard code="RV" label="Reviews" value={stats.pendingReviews} hint="reviews waiting approval" tone="rose" />
      </div>

      <div className="ops-action-grid">
        <ActionTile code="US" title="Users & Roles" text="Create users, approve businesses, and block accounts." to="/users" tone="blue" />
        <ActionTile code="LS" title="Listings" text="Approve, reject, archive, and feature products/services." to="/listings" tone="cyan" />
        <ActionTile code="FL" title="Fulfillment" text="Assign delivery partners and manage tracking details." to="/fulfillment" tone="green" />
        <ActionTile code="PY" title="Finance" text="Review commission, seller earnings, and payout requests." to="/earnings" tone="purple" />
        <ActionTile code="SP" title="Support" text="Resolve complaints, disputes, and refund requests." to="/support" tone="rose" />
        <ActionTile code="ST" title="Settings" text="Update commission, SEO, content, and platform rules." to="/settings" tone="amber" />
      </div>

      <div className="ops-two-column">
        <div className="admin-table ops-table-card">
          <div className="ops-card-head">
            <div>
              <span className="eyebrow">Orders</span>
              <h3>Customer Orders</h3>
              <p>Use Fulfillment for delivery partner, tracking, estimate and notes.</p>
            </div>
            <Link className="secondary-btn small-btn" to="/fulfillment">Open Fulfillment</Link>
          </div>
          <table>
            <thead>
              <tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th>Delivery</th><th>Action</th></tr>
            </thead>
            <tbody>
              {overview?.orders?.length ? overview.orders.map((order) => (
                <tr key={order.id}>
                  <td><strong>{order.orderNo}</strong><br /><small>{order.items?.length || 0} item(s)</small></td>
                  <td>{order.customer?.name || order.deliveryName}<br /><small>{order.deliveryPhone}</small></td>
                  <td>Rs. {money(order.totalAmount)}<br /><small>{formatStatus(order.paymentStatus)}</small></td>
                  <td><StatusPill status={order.status} /></td>
                  <td><StatusPill status={order.deliveryStatus || "not_assigned"} /><br /><small>{order.courierName || "No courier"}</small></td>
                  <td>
                    <div className="compact-actions vertical-actions">
                      <button className="approve-btn" type="button" onClick={() => changeOrderStatus(order, "confirmed")}>Confirm</button>
                      <button className="approve-btn" type="button" onClick={() => changeOrderStatus(order, "processing")}>Process</button>
                      <button className="approve-btn" type="button" onClick={() => changeOrderStatus(order, "ready")}>Ready</button>
                      <button className="approve-btn" type="button" onClick={() => changeOrderStatus(order, "delivered", "paid")}>Delivered + Paid</button>
                      <button className="reject-btn" type="button" onClick={() => changeOrderStatus(order, "cancelled")}>Cancel</button>
                    </div>
                  </td>
                </tr>
              )) : <EmptyRow colSpan="6" text="No customer orders yet. Place one from cart checkout." />}
            </tbody>
          </table>
        </div>

        <div className="admin-table ops-table-card">
          <div className="ops-card-head">
            <div>
              <span className="eyebrow">Reviews</span>
              <h3>Review Approval Queue</h3>
              <p>Approve customer reviews after checking content quality.</p>
            </div>
          </div>
          <table>
            <thead>
              <tr><th>Review</th><th>Customer</th><th>Target</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {overview?.reviews?.length ? overview.reviews.map((review) => (
                <tr key={review.id}>
                  <td><strong>{review.rating}/5</strong><br /><small>{review.comment}</small></td>
                  <td>{review.user?.name || "Customer"}<br /><small>{review.user?.email || "-"}</small></td>
                  <td>{review.product?.name || review.service?.title || "SmartSell item"}</td>
                  <td><StatusPill status={review.status} /></td>
                  <td>
                    <AdminActionButtons
                      onApprove={() => changeStatus(`/admin/reviews/${review.id}/status`, "approved", "Review approved.")}
                      onReject={() => changeStatus(`/admin/reviews/${review.id}/status`, "rejected", "Review rejected.")}
                    />
                  </td>
                </tr>
              )) : <EmptyRow colSpan="5" text="No pending/rejected reviews. Delivered orders can be reviewed by customers." />}
            </tbody>
          </table>
        </div>
      </div>

      <div className="ops-approval-grid">
        <div className="admin-table ops-table-card">
          <div className="ops-card-head"><div><span className="eyebrow">Products</span><h3>Product Approval Queue</h3></div><Link className="secondary-btn small-btn" to="/listings">All Listings</Link></div>
          <table>
            <thead><tr><th>Name</th><th>Type</th><th>Price</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {overview?.products?.length ? overview.products.map((product) => (
                <tr key={product.id}>
                  <td><strong>{product.name}</strong></td>
                  <td>{product.type}</td>
                  <td>Rs. {money(product.price)}</td>
                  <td><StatusPill status={product.status} /></td>
                  <td><AdminActionButtons onApprove={() => changeStatus(`/admin/products/${product.id}/status`, "approved", "Product approved.")} onReject={() => changeStatus(`/admin/products/${product.id}/status`, "rejected", "Product rejected.")} /></td>
                </tr>
              )) : <EmptyRow colSpan="5" text="No pending/rejected products. Submit one from Seller Hub." />}
            </tbody>
          </table>
        </div>

        <div className="admin-table ops-table-card">
          <div className="ops-card-head"><div><span className="eyebrow">Services</span><h3>Service Approval Queue</h3></div><Link className="secondary-btn small-btn" to="/listings">All Listings</Link></div>
          <table>
            <thead><tr><th>Service</th><th>Category</th><th>Price From</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {overview?.services?.length ? overview.services.map((service) => (
                <tr key={service.id}>
                  <td><strong>{service.title}</strong></td>
                  <td>{service.category || "-"}</td>
                  <td>{service.priceFrom ? `Rs. ${money(service.priceFrom)}` : "Quote"}</td>
                  <td><StatusPill status={service.status} /></td>
                  <td><AdminActionButtons onApprove={() => changeStatus(`/admin/services/${service.id}/status`, "approved", "Service approved.")} onReject={() => changeStatus(`/admin/services/${service.id}/status`, "rejected", "Service rejected.")} /></td>
                </tr>
              )) : <EmptyRow colSpan="5" text="No pending/rejected services. Submit one from Seller Hub." />}
            </tbody>
          </table>
        </div>

        <div className="admin-table ops-table-card">
          <div className="ops-card-head"><div><span className="eyebrow">Businesses</span><h3>Seller / Provider Approval Queue</h3></div><Link className="secondary-btn small-btn" to="/users">Users</Link></div>
          <table>
            <thead><tr><th>Name</th><th>Type</th><th>Business</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {overview?.sellers?.length ? overview.sellers.map((seller) => (
                <tr key={seller.id}>
                  <td><strong>{seller.name}</strong></td>
                  <td>{seller.sellerType}</td>
                  <td>{seller.businessName || "-"}</td>
                  <td><StatusPill status={seller.status} /></td>
                  <td><AdminActionButtons onApprove={() => changeStatus(`/admin/sellers/${seller.id}/status`, "approved", "Seller/provider approved.")} onReject={() => changeStatus(`/admin/sellers/${seller.id}/status`, "rejected", "Seller/provider rejected.")} /></td>
                </tr>
              )) : <EmptyRow colSpan="5" text="No seller/provider profiles yet. Register a seller account to test this flow." />}
            </tbody>
          </table>
        </div>
      </div>

      <div className="ops-request-panel">
        <div className="ops-card-head">
          <div>
            <span className="eyebrow">Request Anything</span>
            <h3>Custom Requests, Assignment & Quotations</h3>
            <p>Assign a provider, add quotation, write admin note, and send updates to customers.</p>
          </div>
        </div>

        <div className="admin-request-grid ops-request-grid">
          {overview?.requests?.length ? overview.requests.map((request) => (
            <RequestWorkflowCard key={request.id} request={request} assignees={overview?.assignees || []} onSaved={loadOverview} />
          )) : <div className="empty-business-card"><strong>No custom requests yet</strong><p>Customers can submit requests from Request Anything.</p></div>}
        </div>
      </div>
    </section>
  );
}
