import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SmartPagination from "../components/SmartPagination.jsx";
import {
  BusinessEmptyState,
  BusinessIcon,
  BusinessInfoGrid,
  BusinessMetricCard,
  BusinessModal,
  BusinessPageHeader,
  BusinessSearchToolbar,
  BusinessStatusBadge,
} from "../components/BusinessWorkspaceUi.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import useSmartPagination from "../hooks/useSmartPagination.js";
import api from "../utils/api.js";
import "../styles/pages/business/BusinessWorkspace.css";

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
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function ProductEditor({ product, onSave, onClose }) {
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
    setMessage("Saving changes...");
    try {
      const { data } = await api.patch(`/business/products/${product.id}`, form);
      onSave(data.data);
      setMessage(data.message || "Product updated successfully.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not update product.");
    } finally {
      setSaving(false);
    }
  }

  async function archive() {
    setSaving(true);
    setMessage("Archiving product...");
    try {
      const { data } = await api.patch(`/business/products/${product.id}`, { status: "archived" });
      onSave(data.data);
      setMessage("Product archived.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not archive product.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="business-editor-v2" onSubmit={submit}>
      <div className="business-form-grid-v2 two-columns">
        <label><span>Product name</span><input name="name" value={form.name} onChange={update} required /></label>
        <label><span>Price</span><input name="price" type="number" min="0" value={form.price} onChange={update} required /></label>
        <label><span>Stock</span><input name="stock" type="number" min="0" value={form.stock} onChange={update} /></label>
        <label><span>Condition</span>
          <select name="condition" value={form.condition} onChange={update}>
            <option value="new">New</option>
            <option value="like_new">Like New</option>
            <option value="good">Good</option>
            <option value="used">Used</option>
            <option value="needs_repair">Needs Repair</option>
          </select>
        </label>
      </div>
      <label><span>Location</span><input name="location" value={form.location} onChange={update} /></label>
      <label><span>Description</span><textarea name="description" rows="5" value={form.description} onChange={update} /></label>
      {message && <p className="business-form-message-v2">{message}</p>}
      <div className="business-modal-action-row-v2">
        <button className="business-danger-button-v2" type="button" onClick={archive} disabled={saving}>Archive product</button>
        <button className="business-ghost-button-v2" type="button" onClick={onClose}>Close</button>
        <button className="business-primary-button-v2" type="submit" disabled={saving}>{saving ? "Saving..." : "Save changes"}</button>
      </div>
    </form>
  );
}

function ServiceEditor({ service, onSave, onClose }) {
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
    setMessage("Saving changes...");
    try {
      const { data } = await api.patch(`/business/services/${service.id}`, form);
      onSave(data.data);
      setMessage(data.message || "Service updated successfully.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not update service.");
    } finally {
      setSaving(false);
    }
  }

  async function archive() {
    setSaving(true);
    setMessage("Archiving service...");
    try {
      const { data } = await api.patch(`/business/services/${service.id}`, { status: "archived" });
      onSave(data.data);
      setMessage("Service archived.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not archive service.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="business-editor-v2" onSubmit={submit}>
      <div className="business-form-grid-v2 two-columns">
        <label><span>Service title</span><input name="title" value={form.title} onChange={update} required /></label>
        <label><span>Price from</span><input name="priceFrom" type="number" min="0" value={form.priceFrom} onChange={update} /></label>
      </div>
      <label><span>Provider type</span><input name="providerType" value={form.providerType} onChange={update} /></label>
      <label><span>Description</span><textarea name="description" rows="5" value={form.description} onChange={update} /></label>
      {message && <p className="business-form-message-v2">{message}</p>}
      <div className="business-modal-action-row-v2">
        <button className="business-danger-button-v2" type="button" onClick={archive} disabled={saving}>Archive service</button>
        <button className="business-ghost-button-v2" type="button" onClick={onClose}>Close</button>
        <button className="business-primary-button-v2" type="submit" disabled={saving}>{saving ? "Saving..." : "Save changes"}</button>
      </div>
    </form>
  );
}

function ClickableRecord({ children, onClick, className = "" }) {
  return (
    <article
      className={`business-record-v2 ${className}`}
      role="button"
      tabIndex="0"
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
    >
      {children}
    </article>
  );
}

function ProductList({ products, onUpdate }) {
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const filtered = useMemo(() => products.filter((product) => {
    const haystack = `${product.name || ""} ${product.category || ""} ${product.type || ""} ${product.location || ""}`.toLowerCase();
    return haystack.includes(search.trim().toLowerCase()) && (status === "all" || product.status === status);
  }), [products, search, status]);
  const pagination = useSmartPagination(filtered, { initialPageSize: 10, resetKey: `${search}-${status}` });

  if (!products.length) {
    return <BusinessEmptyState icon="box" title="No products yet" description="Create your first product or used-item listing to start selling." action={<Link className="business-primary-button-v2" to="/seller-hub">Create product</Link>} />;
  }

  return (
    <>
      <BusinessSearchToolbar
        value={search}
        onChange={setSearch}
        placeholder="Search products by name, category or location"
        filter={<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="approved">Approved</option><option value="pending">Pending</option><option value="archived">Archived</option><option value="rejected">Rejected</option></select>}
      />
      {!filtered.length ? (
        <BusinessEmptyState icon="search" title="No matching products" description="Change the search term or status filter." />
      ) : (
        <div className="business-record-list-v2">
          {pagination.items.map((product) => (
            <ClickableRecord key={product.id} onClick={() => setSelected(product)}>
              <div className="business-record-media-v2">
                {product.image ? <img src={product.image} alt={product.name} /> : <BusinessIcon name="image" size={28} />}
              </div>
              <div className="business-record-content-v2">
                <div className="business-record-heading-v2">
                  <div><h3>{product.name}</h3><p>{product.category || formatStatus(product.type)} · {product.location || "Location not set"}</p></div>
                  <BusinessStatusBadge status={product.status} />
                </div>
                <div className="business-record-facts-v2">
                  <span><small>Price</small><strong>{formatMoney(product.price)}</strong></span>
                  <span><small>Stock</small><strong>{product.stock ?? 0}</strong></span>
                  <span><small>Condition</small><strong>{formatStatus(product.condition)}</strong></span>
                  <span><small>Updated</small><strong>{shortDate(product.updatedAt)}</strong></span>
                </div>
              </div>
              <span className="business-record-arrow-v2"><BusinessIcon name="chevron" /></span>
            </ClickableRecord>
          ))}
          <SmartPagination pagination={pagination} label="products" />
        </div>
      )}
      <BusinessModal open={Boolean(selected)} title={selected?.name || "Product details"} eyebrow="Product listing" onClose={() => setSelected(null)}>
        {selected && (
          <div className="business-detail-layout-v2">
            <div className="business-detail-preview-v2">
              {selected.image ? <img src={selected.image} alt={selected.name} /> : <span><BusinessIcon name="image" size={34} />No product image</span>}
              <BusinessStatusBadge status={selected.status} />
            </div>
            <div>
              <BusinessInfoGrid items={[
                { label: "Price", value: formatMoney(selected.price) },
                { label: "Stock", value: selected.stock ?? 0 },
                { label: "Condition", value: formatStatus(selected.condition) },
                { label: "Category", value: selected.category || formatStatus(selected.type) },
                { label: "Location", value: selected.location || "Not set" },
                { label: "Last updated", value: shortDate(selected.updatedAt) },
              ]} />
              <div className="business-description-v2"><span>Description</span><p>{selected.description || "No description added."}</p></div>
            </div>
          </div>
        )}
        {selected && <ProductEditor product={selected} onSave={(updated) => { onUpdate(updated); setSelected(updated); }} onClose={() => setSelected(null)} />}
      </BusinessModal>
    </>
  );
}

function ServiceList({ services, onUpdate }) {
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const filtered = useMemo(() => services.filter((service) => {
    const haystack = `${service.title || ""} ${service.category || ""} ${service.providerType || ""}`.toLowerCase();
    return haystack.includes(search.trim().toLowerCase()) && (status === "all" || service.status === status);
  }), [services, search, status]);
  const pagination = useSmartPagination(filtered, { initialPageSize: 10, resetKey: `${search}-${status}` });

  if (!services.length) {
    return <BusinessEmptyState icon="service" title="No services yet" description="Publish your first professional service and receive customer requests." action={<Link className="business-primary-button-v2" to="/seller-hub">Create service</Link>} />;
  }

  return (
    <>
      <BusinessSearchToolbar
        value={search}
        onChange={setSearch}
        placeholder="Search services by title, category or provider type"
        filter={<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="approved">Approved</option><option value="pending">Pending</option><option value="archived">Archived</option><option value="rejected">Rejected</option></select>}
      />
      {!filtered.length ? (
        <BusinessEmptyState icon="search" title="No matching services" description="Change the search term or status filter." />
      ) : (
        <div className="business-record-list-v2">
          {pagination.items.map((service) => (
            <ClickableRecord key={service.id} onClick={() => setSelected(service)}>
              <div className="business-record-media-v2">
                {service.image ? <img src={service.image} alt={service.title} /> : <BusinessIcon name="service" size={28} />}
              </div>
              <div className="business-record-content-v2">
                <div className="business-record-heading-v2">
                  <div><h3>{service.title}</h3><p>{service.category || service.providerType || "Professional service"}</p></div>
                  <BusinessStatusBadge status={service.status} />
                </div>
                <div className="business-record-facts-v2 three-columns">
                  <span><small>Price from</small><strong>{formatMoney(service.priceFrom)}</strong></span>
                  <span><small>Provider</small><strong>{service.providerType || "Not set"}</strong></span>
                  <span><small>Updated</small><strong>{shortDate(service.updatedAt)}</strong></span>
                </div>
              </div>
              <span className="business-record-arrow-v2"><BusinessIcon name="chevron" /></span>
            </ClickableRecord>
          ))}
          <SmartPagination pagination={pagination} label="services" />
        </div>
      )}
      <BusinessModal open={Boolean(selected)} title={selected?.title || "Service details"} eyebrow="Service listing" onClose={() => setSelected(null)}>
        {selected && (
          <div className="business-detail-layout-v2">
            <div className="business-detail-preview-v2">
              {selected.image ? <img src={selected.image} alt={selected.title} /> : <span><BusinessIcon name="service" size={34} />No service image</span>}
              <BusinessStatusBadge status={selected.status} />
            </div>
            <div>
              <BusinessInfoGrid items={[
                { label: "Price from", value: formatMoney(selected.priceFrom) },
                { label: "Category", value: selected.category || "Not set" },
                { label: "Provider type", value: selected.providerType || "Not set" },
                { label: "Last updated", value: shortDate(selected.updatedAt) },
              ]} />
              <div className="business-description-v2"><span>Description</span><p>{selected.description || "No description added."}</p></div>
            </div>
          </div>
        )}
        {selected && <ServiceEditor service={selected} onSave={(updated) => { onUpdate(updated); setSelected(updated); }} onClose={() => setSelected(null)} />}
      </BusinessModal>
    </>
  );
}

function SellerOrders({ orders }) {
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const filtered = useMemo(() => orders.filter((item) => {
    const haystack = `${item.orderNo || ""} ${item.productName || ""} ${item.customer?.name || ""} ${item.deliveryName || ""}`.toLowerCase();
    return haystack.includes(search.trim().toLowerCase()) && (status === "all" || item.status === status);
  }), [orders, search, status]);
  const pagination = useSmartPagination(filtered, { initialPageSize: 10, resetKey: `${search}-${status}` });

  if (!orders.length) {
    return <BusinessEmptyState icon="order" title="No product orders yet" description="Customer orders for approved products will appear here." />;
  }

  return (
    <>
      <BusinessSearchToolbar
        value={search}
        onChange={setSearch}
        placeholder="Search order, product or customer"
        filter={<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="processing">Processing</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select>}
      />
      <div className="business-table-panel-v2">
        <div className="business-table-scroll-v2">
          <table className="business-table-v2">
            <thead><tr><th>Order</th><th>Product</th><th>Customer</th><th>Quantity</th><th>Total</th><th>Status</th><th aria-label="Open" /></tr></thead>
            <tbody>
              {pagination.items.map((item) => (
                <tr key={item.id} tabIndex="0" onClick={() => setSelected(item)} onKeyDown={(event) => { if (event.key === "Enter") setSelected(item); }}>
                  <td><strong>{item.orderNo}</strong><small>{shortDate(item.createdAt)}</small></td>
                  <td>{item.productName}</td>
                  <td><strong>{item.customer?.name || item.deliveryName || "Customer"}</strong><small>{item.deliveryPhone || item.customer?.phone || "No phone"}</small></td>
                  <td>{item.quantity}</td>
                  <td><strong>{formatMoney(item.lineTotal)}</strong></td>
                  <td><BusinessStatusBadge status={item.status} /></td>
                  <td><BusinessIcon name="chevron" size={18} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filtered.length && <BusinessEmptyState icon="search" title="No matching orders" description="Change the search term or status filter." />}
        <SmartPagination pagination={pagination} label="orders" />
      </div>
      <BusinessModal open={Boolean(selected)} title={selected?.orderNo || "Order details"} eyebrow="Product order" onClose={() => setSelected(null)} size="medium">
        {selected && (
          <>
            <div className="business-modal-status-line-v2"><BusinessStatusBadge status={selected.status} /><BusinessStatusBadge status={selected.paymentStatus} /></div>
            <BusinessInfoGrid items={[
              { label: "Product", value: selected.productName },
              { label: "Quantity", value: selected.quantity },
              { label: "Line total", value: formatMoney(selected.lineTotal) },
              { label: "Order date", value: shortDate(selected.createdAt) },
              { label: "Customer", value: selected.customer?.name || selected.deliveryName || "Customer" },
              { label: "Phone", value: selected.deliveryPhone || selected.customer?.phone || "Not provided" },
            ]} />
            <div className="business-description-v2"><span>Delivery address</span><p>{selected.deliveryAddress || "No delivery address provided."}</p></div>
          </>
        )}
      </BusinessModal>
    </>
  );
}

function AssignedRequests({ requests, onStatus }) {
  const [selected, setSelected] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const filtered = useMemo(() => requests.filter((request) => {
    const haystack = `${request.requestType || ""} ${request.name || ""} ${request.location || ""} ${request.message || ""}`.toLowerCase();
    return haystack.includes(search.trim().toLowerCase()) && (status === "all" || request.status === status);
  }), [requests, search, status]);
  const pagination = useSmartPagination(filtered, { initialPageSize: 10, resetKey: `${search}-${status}` });

  async function changeStatus(request, nextStatus) {
    setSavingId(request.id);
    setMessage("Updating request...");
    try {
      const { data } = await api.patch(`/business/requests/${request.id}/status`, { status: nextStatus });
      onStatus(data.data);
      setSelected(data.data);
      setMessage(`Request moved to ${formatStatus(nextStatus)}.`);
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not update assigned request.");
    } finally {
      setSavingId(null);
    }
  }

  if (!requests.length) {
    return <BusinessEmptyState icon="request" title="No assigned requests yet" description="Custom customer requests assigned to you will appear here." />;
  }

  return (
    <>
      <BusinessSearchToolbar
        value={search}
        onChange={setSearch}
        placeholder="Search request, customer, location or requirement"
        filter={<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="pending">Pending</option><option value="accepted">Accepted</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select>}
      />
      {message && <p className="business-form-message-v2">{message}</p>}
      {!filtered.length ? (
        <BusinessEmptyState icon="search" title="No matching requests" description="Change the search term or status filter." />
      ) : (
        <div className="business-request-grid-v2">
          {pagination.items.map((request) => (
            <ClickableRecord key={request.id} className="request-record" onClick={() => setSelected(request)}>
              <div className="business-request-icon-v2"><BusinessIcon name="request" /></div>
              <div className="business-record-content-v2">
                <div className="business-record-heading-v2">
                  <div><h3>{formatStatus(request.requestType || "Custom request")}</h3><p>{request.name || "Customer"} · {request.location || "Location not set"}</p></div>
                  <BusinessStatusBadge status={request.status} />
                </div>
                <p className="business-record-summary-v2">{request.message || "No requirement description."}</p>
                <div className="business-record-facts-v2 three-columns">
                  <span><small>Budget</small><strong>{formatMoney(request.budget)}</strong></span>
                  <span><small>Quotation</small><strong>{request.quotation ? formatMoney(request.quotation) : "Not set"}</strong></span>
                  <span><small>Phone</small><strong>{request.phone || "Not provided"}</strong></span>
                </div>
              </div>
              <span className="business-record-arrow-v2"><BusinessIcon name="chevron" /></span>
            </ClickableRecord>
          ))}
          <SmartPagination pagination={pagination} label="requests" />
        </div>
      )}
      <BusinessModal open={Boolean(selected)} title={formatStatus(selected?.requestType || "Custom request")} eyebrow="Assigned customer request" onClose={() => setSelected(null)}>
        {selected && (
          <>
            <div className="business-modal-status-line-v2"><BusinessStatusBadge status={selected.status} /></div>
            <BusinessInfoGrid items={[
              { label: "Customer", value: selected.name || "Customer" },
              { label: "Phone", value: selected.phone || "Not provided" },
              { label: "Budget", value: formatMoney(selected.budget) },
              { label: "Quotation", value: selected.quotation ? formatMoney(selected.quotation) : "Not set" },
              { label: "Location", value: selected.location || "Not set" },
              { label: "Assigned to", value: selected.assignedTo || "Your business" },
            ]} />
            <div className="business-description-v2"><span>Customer requirement</span><p>{selected.message || "No requirement description."}</p></div>
            {selected.adminNote && <div className="business-note-v2"><strong>Admin note</strong><p>{selected.adminNote}</p></div>}
            <div className="business-modal-action-row-v2 status-actions">
              <button type="button" className="business-ghost-button-v2" disabled={savingId === selected.id} onClick={() => changeStatus(selected, "accepted")}>Accept</button>
              <button type="button" className="business-secondary-button-v2" disabled={savingId === selected.id} onClick={() => changeStatus(selected, "in_progress")}>Start work</button>
              <button type="button" className="business-primary-button-v2" disabled={savingId === selected.id} onClick={() => changeStatus(selected, "completed")}>Mark complete</button>
              <button type="button" className="business-danger-button-v2" disabled={savingId === selected.id} onClick={() => changeStatus(selected, "cancelled")}>Cancel</button>
            </div>
          </>
        )}
      </BusinessModal>
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
    { id: "products", label: "Products", icon: "box", count: data?.products?.length || 0 },
    { id: "services", label: "Services", icon: "service", count: data?.services?.length || 0 },
    { id: "orders", label: "Orders", icon: "order", count: data?.orders?.length || 0 },
    { id: "requests", label: "Requests", icon: "request", count: data?.assignedRequests?.length || 0 },
  ], [data]);

  function updateProduct(updated) {
    setData((current) => ({ ...current, products: current.products.map((item) => item.id === updated.id ? updated : item) }));
  }

  function updateService(updated) {
    setData((current) => ({ ...current, services: current.services.map((item) => item.id === updated.id ? updated : item) }));
  }

  function updateAssignedRequest(updated) {
    setData((current) => ({ ...current, assignedRequests: current.assignedRequests.map((item) => item.id === updated.id ? updated : item) }));
  }

  return (
    <section className="business-workspace-v2 business-dashboard-v2">
      <BusinessPageHeader
        eyebrow="Seller workspace"
        title={`Good to see you, ${user?.name?.split(" ")?.[0] || "partner"}`}
        description="Manage listings, fulfil customer activity and understand your business from one focused workspace."
        meta={<><span><BusinessIcon name="store" size={15} />{user?.businessName || user?.name || "SmartSell business"}</span><BusinessStatusBadge status={user?.status || "active"} /></>}
        actions={<><Link className="business-ghost-button-v2" to="/gallery-management"><BusinessIcon name="image" size={17} />Gallery</Link><Link className="business-secondary-button-v2" to="/inventory"><BusinessIcon name="inventory" size={17} />Inventory</Link><Link className="business-primary-button-v2" to="/seller-hub"><BusinessIcon name="add" size={17} />Create listing</Link></>}
      />

      {loading && <div className="business-loading-v2"><span /><p>Preparing your business workspace...</p></div>}
      {error && <div className="business-error-v2"><strong>Dashboard could not load</strong><p>{error}</p><button type="button" className="business-secondary-button-v2" onClick={loadBusiness}>Try again</button></div>}

      {data && (
        <>
          <div className="business-metrics-grid-v2">
            <BusinessMetricCard icon="box" label="Product listings" value={data.stats.products.total} note={`${data.stats.products.approved} live · ${data.stats.products.pending} awaiting review`} tone="blue" />
            <BusinessMetricCard icon="service" label="Service listings" value={data.stats.services.total} note={`${data.stats.services.approved} live · ${data.stats.services.pending} awaiting review`} tone="violet" />
            <BusinessMetricCard icon="money" label="Gross order value" value={formatMoney(data.stats.orders.totalRevenue)} note={`${data.stats.orders.total} product orders`} tone="emerald" />
            <BusinessMetricCard icon="request" label="Assigned requests" value={data.stats.requests.total} note={`${data.stats.requests.inProgress} active · ${data.stats.requests.completed} completed`} tone="amber" />
          </div>

          <section className="business-health-panel-v2">
            <div className="business-health-copy-v2">
              <span>Business readiness</span>
              <h2>Your account and storefront status</h2>
              <p>Approved profiles help customers recognise a trusted seller or service provider.</p>
            </div>
            <div className="business-health-items-v2">
              <div><span className="business-health-icon-v2"><BusinessIcon name="user" /></span><p>Account<strong>{formatStatus(data.profile.user.status)}</strong></p></div>
              <div><span className="business-health-icon-v2"><BusinessIcon name="store" /></span><p>Seller profile<strong>{data.profile.sellerProfile ? formatStatus(data.profile.sellerProfile.status) : "Not created"}</strong></p></div>
              <div><span className="business-health-icon-v2"><BusinessIcon name="service" /></span><p>Service profile<strong>{data.profile.serviceProviderProfile ? formatStatus(data.profile.serviceProviderProfile.status) : "Not created"}</strong></p></div>
            </div>
          </section>

          <section className="business-content-panel-v2">
            <div className="business-tab-list-v2" role="tablist" aria-label="Business records">
              {tabs.map((item) => (
                <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)}>
                  <BusinessIcon name={item.icon} size={18} /><span>{item.label}</span><b>{item.count}</b>
                </button>
              ))}
            </div>
            <div className="business-tab-content-v2">
              {tab === "products" && <ProductList products={data.products || []} onUpdate={updateProduct} />}
              {tab === "services" && <ServiceList services={data.services || []} onUpdate={updateService} />}
              {tab === "orders" && <SellerOrders orders={data.orders || []} />}
              {tab === "requests" && <AssignedRequests requests={data.assignedRequests || []} onStatus={updateAssignedRequest} />}
            </div>
          </section>
        </>
      )}
    </section>
  );
}
