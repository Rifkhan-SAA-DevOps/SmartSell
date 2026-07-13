import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../utils/api.js";
import SmartPagination from "../components/SmartPagination.jsx";
import useSmartPagination from "../hooks/useSmartPagination.js";
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
import "../styles/pages/business/BusinessWorkspace.css";
import "../styles/pages/admin/AdminWorkspaceV2.css";
import "../styles/pages/admin/AdminOperations.css";
import "../styles/pages/delivery/DeliveryPartnerWorkspace.css";

const deliveryStatuses = ["assigned", "picked_up", "on_the_way", "delivered", "failed"];

const filters = [
  { value: "active", label: "Active routes" },
  { value: "assigned", label: "Awaiting pickup" },
  { value: "picked_up", label: "Picked up" },
  { value: "on_the_way", label: "On the way" },
  { value: "completed", label: "Delivered" },
  { value: "failed", label: "Failed" },
  { value: "all", label: "All routes" },
];

const statusSteps = [
  { key: "assigned", label: "Assigned" },
  { key: "picked_up", label: "Picked up" },
  { key: "on_the_way", label: "On the way" },
  { key: "delivered", label: "Delivered" },
];

function titleCase(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value, includeTime = false) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleString("en-LK", includeTime
    ? { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" }
    : { year: "numeric", month: "short", day: "2-digit" });
}

function money(value) {
  return Number(value || 0).toLocaleString("en-LK");
}

function statusIndex(status) {
  const index = statusSteps.findIndex((step) => step.key === status);
  return index < 0 ? 0 : index;
}

function customerName(task) {
  return task.deliveryName || task.customer?.name || "Customer";
}

function customerPhone(task) {
  return task.deliveryPhone || task.customer?.phone || "";
}

function deliveryAddress(task) {
  return task.deliveryAddress || task.customer?.address || "No delivery address provided";
}

function directionsUrl(task) {
  const address = deliveryAddress(task);
  if (!address || address === "No delivery address provided") return "";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function nextDeliveryStatus(status) {
  if (status === "assigned") return { value: "picked_up", label: "Confirm pickup", icon: "box" };
  if (status === "picked_up") return { value: "on_the_way", label: "Start delivery", icon: "arrow" };
  if (status === "on_the_way") return { value: "delivered", label: "Mark delivered", icon: "check" };
  return null;
}

function DeliveryProgress({ status }) {
  const currentIndex = statusIndex(status);
  const failed = status === "failed";

  return (
    <div className={`delivery-progress-v2 ${failed ? "is-failed" : ""}`} aria-label="Delivery progress">
      {statusSteps.map((step, index) => (
        <div key={step.key} className={index <= currentIndex && !failed ? "is-complete" : ""}>
          <span>{index < currentIndex && !failed ? <BusinessIcon name="check" size={14} /> : index + 1}</span>
          <small>{step.label}</small>
        </div>
      ))}
    </div>
  );
}

function DeliveryPartnerEditor({ task, onUpdated }) {
  const [form, setForm] = useState({
    deliveryStatus: task.deliveryStatus || "assigned",
    trackingNumber: task.trackingNumber || "",
    courierName: task.courierName || "",
    deliveryNote: task.deliveryNote || "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setForm({
      deliveryStatus: task.deliveryStatus || "assigned",
      trackingNumber: task.trackingNumber || "",
      courierName: task.courierName || "",
      deliveryNote: task.deliveryNote || "",
    });
    setMessage("");
  }, [task]);

  function update(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function save(next = {}) {
    try {
      setSaving(true);
      setMessage("");
      const payload = { ...form, ...next };
      const response = await api.patch(`/delivery/orders/${task.id}/status`, payload);
      const updated = response.data.data || { ...task, ...payload };
      setForm((current) => ({ ...current, ...next }));
      setMessage(response.data.message || "Delivery task updated successfully.");
      await onUpdated(updated);
    } catch (error) {
      setMessage(error.response?.data?.message || "Delivery update failed.");
    } finally {
      setSaving(false);
    }
  }

  const status = form.deliveryStatus || "assigned";
  const nextAction = nextDeliveryStatus(status);
  const phone = customerPhone(task);
  const mapUrl = directionsUrl(task);
  const items = task.items || [];

  return (
    <div className="delivery-partner-modal-v2">
      <div className="delivery-modal-summary-v2">
        <div>
          <span>Current stage</span>
          <BusinessStatusBadge status={status} />
        </div>
        <div>
          <span>Order value</span>
          <strong>Rs. {money(task.totalAmount)}</strong>
        </div>
        <div>
          <span>Delivery fee</span>
          <strong>Rs. {money(task.deliveryFee)}</strong>
        </div>
      </div>

      <DeliveryProgress status={status} />

      <section className="delivery-modal-section-v2">
        <div className="delivery-modal-section-head-v2">
          <div>
            <span>Customer destination</span>
            <h3>{customerName(task)}</h3>
          </div>
          <div className="delivery-contact-actions-v2">
            {phone ? (
              <a className="business-secondary-button-v2" href={`tel:${phone}`}>
                <BusinessIcon name="phone" size={17} />Call
              </a>
            ) : null}
            {mapUrl ? (
              <a className="business-ghost-button-v2" href={mapUrl} target="_blank" rel="noreferrer">
                <BusinessIcon name="location" size={17} />Directions
              </a>
            ) : null}
          </div>
        </div>
        <BusinessInfoGrid items={[
          { label: "Phone", value: phone || "Not provided" },
          { label: "Address", value: deliveryAddress(task) },
          { label: "Estimated delivery", value: formatDate(task.estimatedDelivery, true) },
          { label: "Payment", value: `${titleCase(task.paymentStatus || "unknown")} · ${titleCase(task.paymentMethod || "not set")}` },
          { label: "Tracking number", value: form.trackingNumber || "Not added" },
          { label: "Assigned at", value: formatDate(task.deliveryAssignedAt, true) },
        ]} />
      </section>

      <section className="delivery-modal-section-v2">
        <div className="delivery-modal-section-head-v2">
          <div>
            <span>Package manifest</span>
            <h3>{items.length} item line{items.length === 1 ? "" : "s"}</h3>
          </div>
        </div>
        <div className="delivery-package-list-v2">
          {items.length ? items.map((item) => (
            <div key={item.id || `${item.name}-${item.quantity}`}>
              <span className="delivery-package-icon-v2"><BusinessIcon name="box" size={17} /></span>
              <div>
                <strong>{item.name || item.product?.name || "Marketplace item"}</strong>
                <small>Quantity {item.quantity || 1}</small>
              </div>
              <b>{item.price ? `Rs. ${money(Number(item.price) * Number(item.quantity || 1))}` : ""}</b>
            </div>
          )) : <p className="delivery-inline-empty-v2">No package items are attached to this delivery.</p>}
        </div>
      </section>

      <section className="delivery-modal-section-v2">
        <div className="delivery-modal-section-head-v2">
          <div>
            <span>Route update</span>
            <h3>Tracking and delivery notes</h3>
          </div>
        </div>
        <div className="delivery-form-grid-v2">
          <label>
            Delivery stage
            <select name="deliveryStatus" value={form.deliveryStatus} onChange={update}>
              {deliveryStatuses.map((deliveryStatus) => (
                <option key={deliveryStatus} value={deliveryStatus}>{titleCase(deliveryStatus)}</option>
              ))}
            </select>
          </label>
          <label>
            Tracking number
            <input name="trackingNumber" value={form.trackingNumber} onChange={update} placeholder="Example: SS-DEL-1024" />
          </label>
          <label>
            Rider / courier name
            <input name="courierName" value={form.courierName} onChange={update} placeholder="Your name or delivery team" />
          </label>
          <label className="delivery-note-field-v2">
            Delivery note
            <textarea name="deliveryNote" rows="4" value={form.deliveryNote} onChange={update} placeholder="Customer instruction, route update, or failed-delivery reason..." />
          </label>
        </div>
      </section>

      {message && <div className={`delivery-partner-alert-v2 ${message.toLowerCase().includes("failed") ? "error" : ""}`}>{message}</div>}

      <div className="delivery-modal-actions-v2">
        <button className="business-ghost-button-v2" type="button" disabled={saving} onClick={() => save()}>
          <BusinessIcon name="edit" size={17} />{saving ? "Saving..." : "Save route details"}
        </button>
        {status !== "delivered" && status !== "failed" ? (
          <button className="business-danger-button-v2" type="button" disabled={saving} onClick={() => save({ deliveryStatus: "failed" })}>
            <BusinessIcon name="alert" size={17} />Mark failed
          </button>
        ) : null}
        {nextAction ? (
          <button className="business-primary-button-v2" type="button" disabled={saving} onClick={() => save({ deliveryStatus: nextAction.value })}>
            <BusinessIcon name={nextAction.icon} size={17} />{nextAction.label}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function DeliveryPartnerView({ summary, tasks, filter, changeFilter, loading, error, loadData }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recent");
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matches = tasks.filter((task) => {
      if (!query) return true;
      return `${task.orderNo} ${customerName(task)} ${customerPhone(task)} ${deliveryAddress(task)} ${task.trackingNumber || ""} ${task.courierName || ""}`
        .toLowerCase()
        .includes(query);
    });

    return [...matches].sort((left, right) => {
      if (sort === "estimate") {
        return new Date(left.estimatedDelivery || "2999-01-01") - new Date(right.estimatedDelivery || "2999-01-01");
      }
      if (sort === "value") return Number(right.totalAmount || 0) - Number(left.totalAmount || 0);
      return new Date(right.updatedAt || right.createdAt || 0) - new Date(left.updatedAt || left.createdAt || 0);
    });
  }, [tasks, search, sort]);

  const pagination = useSmartPagination(filtered, {
    initialPageSize: 10,
    resetKey: `${filter}-${search}-${sort}`,
  });

  const nextTask = useMemo(() => {
    return tasks.find((task) => ["assigned", "picked_up", "on_the_way"].includes(task.deliveryStatus)) || null;
  }, [tasks]);

  async function handleUpdated(updated) {
    setSelected(updated);
    await loadData(filter);
  }

  return (
    <section className="business-workspace-v2 delivery-partner-workspace-v2">
      <BusinessPageHeader
        eyebrow="Delivery partner workspace"
        title="Your route board"
        description="Keep every assigned order moving with clear customer details, route directions, tracking updates, and delivery actions inside one focused workspace."
        actions={(
          <>
            <Link className="business-ghost-button-v2" to="/inbox"><BusinessIcon name="message" size={17} />Messages</Link>
            <button className="business-secondary-button-v2" type="button" onClick={() => loadData(filter)} disabled={loading}>
              <BusinessIcon name="refresh" size={17} />Refresh routes
            </button>
          </>
        )}
        meta={(
          <>
            <span>{summary?.activeTasks || 0} active route{Number(summary?.activeTasks || 0) === 1 ? "" : "s"}</span>
            <span>{summary?.delivered || 0} delivered overall</span>
          </>
        )}
      />

      {error && <div className="delivery-partner-alert-v2 error">{error}</div>}

      <div className="business-metrics-grid-v2 delivery-partner-metrics-v2">
        <BusinessMetricCard icon="order" label="Active routes" value={summary?.activeTasks || 0} note="Assigned, picked up, or moving" tone="blue" />
        <BusinessMetricCard icon="box" label="Awaiting pickup" value={summary?.assigned || 0} note="Ready for pickup confirmation" tone="violet" />
        <BusinessMetricCard icon="arrow" label="On the way" value={summary?.onTheWay || 0} note="Currently moving to customers" tone="amber" />
        <BusinessMetricCard icon="check" label="Delivered" value={summary?.delivered || 0} note={`${summary?.failed || 0} ${Number(summary?.failed || 0) === 1 ? "failed delivery" : "failed deliveries"}`} tone="emerald" />
      </div>

      <div className="delivery-partner-layout-v2">
        <main className="delivery-partner-main-v2">
          {nextTask ? (
            <article className="delivery-route-focus-v2" role="button" tabIndex="0" onClick={() => setSelected(nextTask)} onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && setSelected(nextTask)}>
              <span className="delivery-route-focus-icon-v2"><BusinessIcon name="location" size={22} /></span>
              <div>
                <span>Next active delivery</span>
                <h2>{nextTask.orderNo || "Assigned order"} · {customerName(nextTask)}</h2>
                <p>{deliveryAddress(nextTask)}</p>
              </div>
              <div className="delivery-route-focus-meta-v2">
                <BusinessStatusBadge status={nextTask.deliveryStatus || "assigned"} />
                <strong>{nextTask.estimatedDelivery ? formatDate(nextTask.estimatedDelivery, true) : "No delivery estimate"}</strong>
              </div>
              <BusinessIcon name="chevron" size={19} />
            </article>
          ) : (
            <div className="delivery-route-focus-v2 is-empty">
              <span className="delivery-route-focus-icon-v2"><BusinessIcon name="check" size={22} /></span>
              <div><span>Route status</span><h2>No active delivery is waiting</h2><p>Use the filters below to review completed or failed routes.</p></div>
            </div>
          )}

          <article className="delivery-directory-panel-v2">
            <div className="delivery-directory-head-v2">
              <div>
                <span>Route directory</span>
                <h2>Assigned delivery tasks</h2>
                <p>Open a route to call the customer, view directions, update tracking, and complete the delivery.</p>
              </div>
              <strong>{filtered.length} result{filtered.length === 1 ? "" : "s"}</strong>
            </div>

            <BusinessSearchToolbar
              value={search}
              onChange={setSearch}
              placeholder="Search order, customer, address, or tracking..."
              filter={(
                <select value={filter} onChange={(event) => changeFilter(event.target.value)} disabled={loading}>
                  {filters.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              )}
              filterLabel="Delivery stage"
            >
              <label className="business-filter-v2 delivery-sort-control-v2">
                <BusinessIcon name="history" size={17} />
                <span className="sr-only">Sort routes</span>
                <select value={sort} onChange={(event) => setSort(event.target.value)}>
                  <option value="recent">Recently updated</option>
                  <option value="estimate">Delivery estimate</option>
                  <option value="value">Highest order value</option>
                </select>
              </label>
            </BusinessSearchToolbar>

            {loading ? (
              <div className="delivery-loading-list-v2" aria-label="Loading delivery routes">
                {Array.from({ length: 4 }, (_, index) => <span key={index} />)}
              </div>
            ) : !filtered.length ? (
              <BusinessEmptyState icon="location" title="No delivery routes found" description="Try another route stage or remove the current search term." />
            ) : (
              <>
                <div className="delivery-route-list-v2">
                  {pagination.items.map((task) => (
                    <article
                      key={task.id}
                      className="delivery-route-row-v2"
                      role="button"
                      tabIndex="0"
                      onClick={() => setSelected(task)}
                      onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && setSelected(task)}
                    >
                      <span className={`delivery-route-row-icon-v2 status-${String(task.deliveryStatus || "assigned").replaceAll("_", "-")}`}>
                        <BusinessIcon name="location" size={18} />
                      </span>
                      <div className="delivery-route-row-main-v2">
                        <strong>{task.orderNo || task.id}</strong>
                        <small>{customerName(task)} · {customerPhone(task) || "No phone"}</small>
                      </div>
                      <div className="delivery-route-row-address-v2">
                        <strong>{deliveryAddress(task)}</strong>
                        <small>{task.trackingNumber || "Tracking number not added"}</small>
                      </div>
                      <div className="delivery-route-row-value-v2">
                        <strong>Rs. {money(task.totalAmount)}</strong>
                        <small>{task.estimatedDelivery ? formatDate(task.estimatedDelivery) : "No estimate"}</small>
                      </div>
                      <BusinessStatusBadge status={task.deliveryStatus || "assigned"} />
                      <BusinessIcon name="chevron" size={17} />
                    </article>
                  ))}
                </div>
                <SmartPagination pagination={pagination} label="routes" />
              </>
            )}
          </article>
        </main>

        <aside className="delivery-partner-side-v2">
          <article className="delivery-side-card-v2">
            <span>Route checklist</span>
            <h3>Before leaving</h3>
            <ul>
              <li><BusinessIcon name="check" size={15} />Confirm every package item.</li>
              <li><BusinessIcon name="check" size={15} />Call when the address is unclear.</li>
              <li><BusinessIcon name="check" size={15} />Add a tracking number when available.</li>
              <li><BusinessIcon name="check" size={15} />Record failed-delivery reasons clearly.</li>
            </ul>
          </article>
          <article className="delivery-side-card-v2 compact">
            <span>Need assistance?</span>
            <h3>Contact SmartSell operations</h3>
            <p>Use Inbox for route questions or Support when an order cannot be completed safely.</p>
            <div>
              <Link to="/inbox">Open Inbox</Link>
              <Link to="/support">Support</Link>
            </div>
          </article>
        </aside>
      </div>

      <BusinessModal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.orderNo || "Delivery route"}
        eyebrow="Delivery route details"
        size="large"
      >
        {selected && <DeliveryPartnerEditor task={selected} onUpdated={handleUpdated} />}
      </BusinessModal>
    </section>
  );
}

function AdminDeliveryEditor({ task, onUpdated }) {
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
      setMessage("");
      const payload = { ...form, ...next };
      const response = await api.patch(`/delivery/orders/${task.id}/status`, payload);
      setForm((current) => ({ ...current, ...next }));
      setMessage(response.data.message || "Delivery status updated.");
      await onUpdated(response.data.data || { ...task, ...payload });
    } catch (error) {
      setMessage(error.response?.data?.message || "Delivery update failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-delivery-editor-v2">
      <div className="admin-modal-summary-v2">
        <div><span>Order</span><strong>{task.orderNo || task.id}</strong></div>
        <div><span>Delivery status</span><AdminStatusBadge status={form.deliveryStatus} /></div>
        <div><span>Order status</span><AdminStatusBadge status={task.status} /></div>
      </div>
      <AdminInfoGrid items={[
        { label: "Customer", value: customerName(task) },
        { label: "Phone", value: customerPhone(task) || "Not provided" },
        { label: "Address", value: deliveryAddress(task) },
        { label: "Order total", value: `Rs. ${money(task.totalAmount)}` },
        { label: "Delivery fee", value: `Rs. ${money(task.deliveryFee)}` },
        { label: "Estimated delivery", value: formatDate(task.estimatedDelivery) },
      ]} />
      <section className="admin-form-section-v2">
        <h3>Package items</h3>
        <div className="admin-ops-tag-list-v2">
          {(task.items || []).map((item) => <span key={item.id || `${item.name}-${item.quantity}`}>{item.name || item.product?.name} × {item.quantity}</span>)}
          {!task.items?.length && <span>No items attached</span>}
        </div>
      </section>
      <section className="admin-form-section-v2">
        <h3>Live delivery update</h3>
        <div className="admin-form-v2 admin-form-grid-v2 three">
          <label>Status<select name="deliveryStatus" value={form.deliveryStatus} onChange={update}>{deliveryStatuses.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}</select></label>
          <label>Tracking number<input name="trackingNumber" value={form.trackingNumber} onChange={update} placeholder="SS-DEL-1024" /></label>
          <label>Courier / rider<input name="courierName" value={form.courierName} onChange={update} placeholder="Delivery person or team" /></label>
        </div>
        <div className="admin-form-v2"><label>Delivery note<textarea name="deliveryNote" rows="4" value={form.deliveryNote} onChange={update} placeholder="Customer instruction, failed-delivery reason, or route note..." /></label></div>
      </section>
      {message && <div className="admin-alert-v2">{message}</div>}
      <div className="admin-modal-action-grid-v2">
        <button className="admin-secondary-button-v2" type="button" disabled={saving} onClick={() => save({ deliveryStatus: "picked_up" })}>Picked up</button>
        <button className="admin-secondary-button-v2" type="button" disabled={saving} onClick={() => save({ deliveryStatus: "on_the_way" })}>On the way</button>
        <button className="admin-success-button-v2" type="button" disabled={saving} onClick={() => save({ deliveryStatus: "delivered" })}>Delivered</button>
        <button className="admin-danger-button-v2" type="button" disabled={saving} onClick={() => save({ deliveryStatus: "failed" })}>Failed</button>
        <button className="admin-primary-button-v2" type="button" disabled={saving} onClick={() => save()}>{saving ? "Saving..." : "Save delivery"}</button>
      </div>
    </div>
  );
}

function AdminDeliveryView({ summary, tasks, filter, changeFilter, loading, error, loadData }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tasks.filter((task) => !query || `${task.orderNo} ${customerName(task)} ${customerPhone(task)} ${deliveryAddress(task)} ${task.courierName || ""} ${task.trackingNumber || ""}`.toLowerCase().includes(query));
  }, [tasks, search]);
  const pagination = useAdminPagination(filtered, 10, [filter, search]);

  async function handleUpdated(updated) {
    setSelected(updated);
    await loadData(filter);
  }

  return (
    <section className="admin-workspace-v2 admin-operations-page-v2 admin-delivery-v2">
      <AdminPageHeader
        eyebrow="Live delivery operations"
        title="Delivery control center"
        description="Track every assigned route, customer destination, rider update, tracking reference, and completion status from one clean operations board."
        actions={<button className="admin-secondary-button-v2" type="button" onClick={() => loadData(filter)} disabled={loading}><AdminIcon name="refresh" size={17} />Refresh routes</button>}
        meta={<><span>{summary?.activeTasks || 0} active deliveries</span><span>{summary?.delivered || 0} completed overall</span></>}
      />
      {error && <div className="admin-alert-v2 error">{error}</div>}
      <div className="admin-metrics-grid-v2 four">
        <AdminMetricCard icon="delivery" label="Active" value={summary?.activeTasks || 0} note="Assigned, picked up, or moving" tone="blue" />
        <AdminMetricCard icon="inbox" label="Assigned" value={summary?.assigned || 0} note="Waiting for pickup" tone="violet" />
        <AdminMetricCard icon="arrow" label="On the way" value={summary?.onTheWay || 0} note="Currently moving" tone="amber" />
        <AdminMetricCard icon="check" label="Delivered" value={summary?.delivered || 0} note="Completed deliveries" tone="emerald" />
      </div>
      <article className="admin-panel-v2 admin-ops-panel-v2">
        <div className="admin-panel-head-v2"><div><span className="admin-ops-eyebrow-v2">Route directory</span><h2>Delivery tasks</h2><p>Open a task to update rider, tracking, progress, notes, and final delivery result.</p></div></div>
        <AdminSearchToolbar value={search} onChange={setSearch} placeholder="Search order, customer, address, rider, or tracking..." filters={<label className="admin-select-control-v2"><AdminIcon name="filter" size={17} /><select value={filter} onChange={(event) => changeFilter(event.target.value)}>{filters.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>} />
        {loading ? <div className="admin-ops-loading-v2">Loading delivery routes...</div> : !filtered.length ? <AdminEmptyState icon="delivery" title="No delivery tasks found" description="Try another delivery stage or search term." /> : (
          <>
            <div className="admin-ops-record-list-v2">
              {pagination.items.map((task) => (
                <article className="admin-ops-record-v2 delivery-row" key={task.id} role="button" tabIndex="0" onClick={() => setSelected(task)} onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && setSelected(task)}>
                  <span className="admin-ops-record-icon-v2 tone-blue"><AdminIcon name="delivery" /></span>
                  <div className="admin-ops-record-main-v2"><strong>{task.orderNo || task.id}</strong><small>{customerName(task)} · {customerPhone(task) || "No phone"}</small></div>
                  <div className="admin-ops-record-secondary-v2"><strong>{task.courierName || "Rider not recorded"}</strong><small>{task.trackingNumber || "No tracking number"}</small></div>
                  <div className="admin-ops-record-value-v2"><strong>Rs. {money(task.totalAmount)}</strong><small>{formatDate(task.estimatedDelivery)}</small></div>
                  <AdminStatusBadge status={task.deliveryStatus || "assigned"} />
                  <AdminIcon name="chevron" size={17} />
                </article>
              ))}
            </div>
            <AdminPagination pagination={pagination} />
          </>
        )}
      </article>
      <AdminModal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.orderNo || "Delivery task"} eyebrow="Delivery task details" size="large">
        {selected && <AdminDeliveryEditor task={selected} onUpdated={handleUpdated} />}
      </AdminModal>
    </section>
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

  if (isAdminView) {
    return <AdminDeliveryView summary={summary} tasks={tasks} filter={filter} changeFilter={changeFilter} loading={loading} error={error} loadData={loadData} />;
  }

  return <DeliveryPartnerView summary={summary} tasks={tasks} filter={filter} changeFilter={changeFilter} loading={loading} error={error} loadData={loadData} />;
}
