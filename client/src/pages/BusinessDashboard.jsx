import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SectionHeader from "../components/SectionHeader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../utils/api.js";
import "../styles/pages/business/SellerBusinessWorkspace.css";

const money = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR",
  maximumFractionDigits: 0,
});

function formatMoney(value) {
  return money.format(Number(value || 0));
}

function formatStatus(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function shortDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusClass(status) {
  return `status-pill status-${String(status || "neutral").replaceAll("_", "-")}`;
}

function StatCard({ label, value, note }) {
  return (
    <article className="business-stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </article>
  );
}

function EmptyState({ title, children }) {
  return (
    <div className="empty-business-card">
      <strong>{title}</strong>
      <p>{children}</p>
    </div>
  );
}

function ProductEditor({ product, onSave }) {
  const [form, setForm] = useState({
    name: product.name || "",
    price: product.price || 0,
    stock: product.stock || 0,
    condition: product.condition || "new",
    location: product.location || "",
    description: product.description || "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function update(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("Saving...");
    try {
      const { data } = await api.patch(`/business/products/${product.id}`, form);
      setMessage(data.message || "Product updated.");
      onSave(data.data);
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not update product.");
    } finally {
      setSaving(false);
    }
  }

  async function archive() {
    setSaving(true);
    setMessage("Archiving...");
    try {
      const { data } = await api.patch(`/business/products/${product.id}`, { status: "archived" });
      setMessage("Product archived.");
      onSave(data.data);
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not archive product.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="inline-edit-card" onSubmit={submit}>
      <div className="form-row">
        <label>Product Name<input name="name" value={form.name} onChange={update} /></label>
        <label>Price<input name="price" type="number" min="0" value={form.price} onChange={update} /></label>
      </div>
      <div className="form-row">
        <label>Stock<input name="stock" type="number" min="0" value={form.stock} onChange={update} /></label>
        <label>Condition
          <select name="condition" value={form.condition} onChange={update}>
            <option value="new">New</option>
            <option value="like_new">Like New</option>
            <option value="good">Good</option>
            <option value="used">Used</option>
            <option value="needs_repair">Needs Repair</option>
          </select>
        </label>
      </div>
      <label>Location<input name="location" value={form.location} onChange={update} /></label>
      <label>Description<textarea name="description" rows="3" value={form.description} onChange={update} /></label>
      <div className="inline-actions">
        <button className="primary-btn" type="submit" disabled={saving}>Save Changes</button>
        <button className="secondary-btn" type="button" onClick={archive} disabled={saving}>Archive</button>
      </div>
      {message && <p className="form-status">{message}</p>}
    </form>
  );
}

function ServiceEditor({ service, onSave }) {
  const [form, setForm] = useState({
    title: service.title || "",
    priceFrom: service.priceFrom || 0,
    providerType: service.providerType || "",
    description: service.description || "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function update(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("Saving...");
    try {
      const { data } = await api.patch(`/business/services/${service.id}`, form);
      setMessage(data.message || "Service updated.");
      onSave(data.data);
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not update service.");
    } finally {
      setSaving(false);
    }
  }

  async function archive() {
    setSaving(true);
    setMessage("Archiving...");
    try {
      const { data } = await api.patch(`/business/services/${service.id}`, { status: "archived" });
      setMessage("Service archived.");
      onSave(data.data);
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not archive service.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="inline-edit-card" onSubmit={submit}>
      <div className="form-row">
        <label>Service Title<input name="title" value={form.title} onChange={update} /></label>
        <label>Price From<input name="priceFrom" type="number" min="0" value={form.priceFrom} onChange={update} /></label>
      </div>
      <label>Provider Type<input name="providerType" value={form.providerType} onChange={update} /></label>
      <label>Description<textarea name="description" rows="3" value={form.description} onChange={update} /></label>
      <div className="inline-actions">
        <button className="primary-btn" type="submit" disabled={saving}>Save Changes</button>
        <button className="secondary-btn" type="button" onClick={archive} disabled={saving}>Archive</button>
      </div>
      {message && <p className="form-status">{message}</p>}
    </form>
  );
}

function ProductList({ products, onUpdate }) {
  const [editingId, setEditingId] = useState(null);

  if (!products.length) {
    return <EmptyState title="No products yet">Add your first product or used item from Seller Hub.</EmptyState>;
  }

  return (
    <div className="business-list">
      {products.map((product) => (
        <article key={product.id} className="business-list-card">
          <div className="business-list-media">
            {product.image ? <img src={product.image} alt={product.name} /> : <span>No image</span>}
          </div>
          <div className="business-list-main">
            <div className="business-list-head">
              <div>
                <h3>{product.name}</h3>
                <p>{product.category || product.type} • {product.location || "No location"}</p>
              </div>
              <span className={statusClass(product.status)}>{formatStatus(product.status)}</span>
            </div>
            <div className="mini-meta-grid">
              <span>Price <strong>{formatMoney(product.price)}</strong></span>
              <span>Stock <strong>{product.stock}</strong></span>
              <span>Condition <strong>{formatStatus(product.condition)}</strong></span>
              <span>Updated <strong>{shortDate(product.updatedAt)}</strong></span>
            </div>
            <p className="soft-note">{product.description || "No description added."}</p>
            <button className="secondary-btn small-btn" onClick={() => setEditingId(editingId === product.id ? null : product.id)}>
              {editingId === product.id ? "Close Edit" : "Edit Listing"}
            </button>
            {editingId === product.id && <ProductEditor product={product} onSave={onUpdate} />}
          </div>
        </article>
      ))}
    </div>
  );
}

function ServiceList({ services, onUpdate }) {
  const [editingId, setEditingId] = useState(null);

  if (!services.length) {
    return <EmptyState title="No services yet">Add your first service from Seller Hub.</EmptyState>;
  }

  return (
    <div className="business-list">
      {services.map((service) => (
        <article key={service.id} className="business-list-card">
          <div className="business-list-media">
            {service.image ? <img src={service.image} alt={service.title} /> : <span>No image</span>}
          </div>
          <div className="business-list-main">
            <div className="business-list-head">
              <div>
                <h3>{service.title}</h3>
                <p>{service.category || service.providerType || "Service"}</p>
              </div>
              <span className={statusClass(service.status)}>{formatStatus(service.status)}</span>
            </div>
            <div className="mini-meta-grid">
              <span>Price From <strong>{formatMoney(service.priceFrom)}</strong></span>
              <span>Provider <strong>{service.providerType || "-"}</strong></span>
              <span>Updated <strong>{shortDate(service.updatedAt)}</strong></span>
            </div>
            <p className="soft-note">{service.description || "No description added."}</p>
            <button className="secondary-btn small-btn" onClick={() => setEditingId(editingId === service.id ? null : service.id)}>
              {editingId === service.id ? "Close Edit" : "Edit Service"}
            </button>
            {editingId === service.id && <ServiceEditor service={service} onSave={onUpdate} />}
          </div>
        </article>
      ))}
    </div>
  );
}

function SellerOrders({ orders }) {
  if (!orders.length) {
    return <EmptyState title="No product orders yet">When customers order your approved products, they will appear here.</EmptyState>;
  }

  return (
    <div className="responsive-table-wrap">
      <table className="smart-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Product</th>
            <th>Customer</th>
            <th>Qty</th>
            <th>Total</th>
            <th>Status</th>
            <th>Delivery</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((item) => (
            <tr key={item.id}>
              <td><strong>{item.orderNo}</strong><br /><small>{shortDate(item.createdAt)}</small></td>
              <td>{item.productName}</td>
              <td>{item.customer?.name || item.deliveryName}<br /><small>{item.deliveryPhone || item.customer?.phone}</small></td>
              <td>{item.quantity}</td>
              <td>{formatMoney(item.lineTotal)}</td>
              <td><span className={statusClass(item.status)}>{formatStatus(item.status)}</span><br /><small>{formatStatus(item.paymentStatus)}</small></td>
              <td>{item.deliveryAddress || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AssignedRequests({ requests, onStatus }) {
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState("");

  if (!requests.length) {
    return <EmptyState title="No assigned requests yet">Admin can assign custom requests to you by your name, email, or business name.</EmptyState>;
  }

  async function changeStatus(request, status) {
    setSavingId(request.id);
    setMessage("Updating request...");
    try {
      const { data } = await api.patch(`/business/requests/${request.id}/status`, { status });
      setMessage(`Request moved to ${formatStatus(status)}.`);
      onStatus(data.data);
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not update assigned request.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <>
      {message && <p className="form-status">{message}</p>}
      <div className="business-request-grid">
        {requests.map((request) => (
          <article key={request.id} className="request-card compact-request-card">
            <div className="business-list-head">
              <div>
                <h3>{formatStatus(request.requestType || "Custom Request")}</h3>
                <p>{request.name} • {request.phone}</p>
              </div>
              <span className={statusClass(request.status)}>{formatStatus(request.status)}</span>
            </div>
            <p>{request.message}</p>
            <div className="mini-meta-grid">
              <span>Budget <strong>{formatMoney(request.budget)}</strong></span>
              <span>Quotation <strong>{request.quotation ? formatMoney(request.quotation) : "Not set"}</strong></span>
              <span>Location <strong>{request.location || "-"}</strong></span>
              <span>Assigned <strong>{request.assignedTo || "-"}</strong></span>
            </div>
            {request.adminNote && <p className="soft-note">Admin note: {request.adminNote}</p>}
            <div className="inline-actions">
              <button className="approve-btn" disabled={savingId === request.id} onClick={() => changeStatus(request, "accepted")}>Accept Job</button>
              <button className="approve-btn" disabled={savingId === request.id} onClick={() => changeStatus(request, "in_progress")}>Start</button>
              <button className="approve-btn" disabled={savingId === request.id} onClick={() => changeStatus(request, "completed")}>Complete</button>
              <button className="reject-btn" disabled={savingId === request.id} onClick={() => changeStatus(request, "cancelled")}>Cancel</button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

export default function BusinessDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("products");

  async function loadBusiness() {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/business/me");
      setData(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load business dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBusiness();
  }, []);

  const tabs = useMemo(() => [
    { id: "products", label: "My Products" },
    { id: "services", label: "My Services" },
    { id: "orders", label: "Product Orders" },
    { id: "requests", label: "Assigned Requests" },
  ], []);

  function updateProduct(updated) {
    setData((current) => ({
      ...current,
      products: current.products.map((item) => item.id === updated.id ? updated : item),
    }));
  }

  function updateService(updated) {
    setData((current) => ({
      ...current,
      services: current.services.map((item) => item.id === updated.id ? updated : item),
    }));
  }

  function updateAssignedRequest(updated) {
    setData((current) => ({
      ...current,
      assignedRequests: current.assignedRequests.map((item) => item.id === updated.id ? updated : item),
    }));
  }

  return (
    <section className="page section business-dashboard-page seller-business-polish business-command-page">
      <SectionHeader
        eyebrow="Business Dashboard"
        title="Manage your SmartSell business"
        description="Track your product listings, service listings, customer orders, and custom requests from one place."
      />

      <div className="business-top-actions">
        <div>
          <h3>{user?.businessName || user?.name}</h3>
          <p>Your role is <strong>{formatStatus(user?.role)}</strong>. Editing an approved listing sends it back to pending review.</p>
        </div>
        <div className="business-action-cluster">
          <Link className="secondary-btn" to="/gallery-management">Gallery Manager</Link>
          <Link className="secondary-btn" to="/inventory">Inventory</Link>
          <Link className="primary-btn" to="/seller-hub">Add New Listing</Link>
        </div>
      </div>

      {loading && <p className="form-status">Loading business dashboard...</p>}
      {error && <p className="form-status error-status">{error}</p>}

      {data && (
        <>
          <div className="business-stats-grid">
            <StatCard label="Products" value={data.stats.products.total} note={`${data.stats.products.approved} approved • ${data.stats.products.pending} pending`} />
            <StatCard label="Services" value={data.stats.services.total} note={`${data.stats.services.approved} approved • ${data.stats.services.pending} pending`} />
            <StatCard label="Product Orders" value={data.stats.orders.total} note={`${formatMoney(data.stats.orders.totalRevenue)} gross value`} />
            <StatCard label="Assigned Requests" value={data.stats.requests.total} note={`${data.stats.requests.inProgress} in progress • ${data.stats.requests.completed} completed`} />
          </div>

          <div className="business-profile-card">
            <div>
              <span>Account status</span>
              <strong>{formatStatus(data.profile.user.status)}</strong>
            </div>
            <div>
              <span>Seller profile</span>
              <strong>{data.profile.sellerProfile ? formatStatus(data.profile.sellerProfile.status) : "Not created"}</strong>
            </div>
            <div>
              <span>Service profile</span>
              <strong>{data.profile.serviceProviderProfile ? formatStatus(data.profile.serviceProviderProfile.status) : "Not created"}</strong>
            </div>
          </div>

          <div className="business-tab-bar">
            {tabs.map((item) => (
              <button
                key={item.id}
                className={tab === item.id ? "active" : ""}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {tab === "products" && <ProductList products={data.products} onUpdate={updateProduct} />}
          {tab === "services" && <ServiceList services={data.services} onUpdate={updateService} />}
          {tab === "orders" && <SellerOrders orders={data.orders} />}
          {tab === "requests" && <AssignedRequests requests={data.assignedRequests} onStatus={updateAssignedRequest} />}
        </>
      )}
    </section>
  );
}
