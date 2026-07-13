import { useEffect, useMemo, useState } from "react";
import SectionHeader from "../components/SectionHeader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../utils/api.js";

const adminRoles = ["admin", "super_admin"];

const issueTypes = [
  ["general", "General Support"],
  ["order_issue", "Order Issue"],
  ["delivery_issue", "Delivery Issue"],
  ["refund_request", "Refund Request"],
  ["payment_issue", "Payment Issue"],
  ["seller_issue", "Seller Issue"],
  ["service_issue", "Service Issue"],
  ["damaged_item", "Damaged Item"],
  ["wrong_item", "Wrong Item"],
  ["other", "Other"],
];

const statusOptions = [
  ["open", "Open"],
  ["reviewing", "Reviewing"],
  ["waiting_customer", "Waiting Customer"],
  ["resolved", "Resolved"],
  ["rejected", "Rejected"],
  ["closed", "Closed"],
];

const priorityOptions = [
  ["low", "Low"],
  ["normal", "Normal"],
  ["high", "High"],
  ["urgent", "Urgent"],
];

function money(value) {
  return Number(value || 0).toLocaleString("en-LK");
}

function formatLabel(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" });
}

function TicketAdminControls({ ticket, onUpdated }) {
  const [form, setForm] = useState({
    status: ticket.status || "open",
    priority: ticket.priority || "normal",
    refundAmount: ticket.refundAmount || "",
    adminNote: ticket.adminNote || "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setForm({
      status: ticket.status || "open",
      priority: ticket.priority || "normal",
      refundAmount: ticket.refundAmount || "",
      adminNote: ticket.adminNote || "",
    });
  }, [ticket.id, ticket.status, ticket.priority, ticket.refundAmount, ticket.adminNote]);

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function saveTicket(event) {
    event.preventDefault();
    try {
      setSaving(true);
      setMessage("Saving...");
      const { data } = await api.patch(`/support/tickets/${ticket.id}`, form);
      onUpdated(data.data);
      setMessage(data.message || "Ticket updated.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to update ticket.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="support-admin-controls" onSubmit={saveTicket}>
      <label>
        Status
        <select value={form.status} onChange={(event) => setField("status", event.target.value)}>
          {statusOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
        </select>
      </label>
      <label>
        Priority
        <select value={form.priority} onChange={(event) => setField("priority", event.target.value)}>
          {priorityOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
        </select>
      </label>
      <label>
        Refund Amount
        <input type="number" min="0" value={form.refundAmount} onChange={(event) => setField("refundAmount", event.target.value)} placeholder="Optional" />
      </label>
      <label className="support-full-field">
        Admin Note
        <textarea rows="3" value={form.adminNote} onChange={(event) => setField("adminNote", event.target.value)} placeholder="Write admin decision, refund note, or next step..." />
      </label>
      <button className="approve-btn" type="submit" disabled={saving}>Save Decision</button>
      {message && <small className="mini-action-note">{message}</small>}
    </form>
  );
}

export default function SupportCenter() {
  const { user } = useAuth();
  const isAdmin = adminRoles.includes(user?.role);
  const [tickets, setTickets] = useState([]);
  const [summary, setSummary] = useState({ total: 0, open: 0, urgent: 0, resolved: 0 });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [form, setForm] = useState({
    subject: "",
    issueType: "general",
    priority: "normal",
    orderId: "",
    preferredResolution: "",
    customerMessage: "",
  });

  async function loadSupport() {
    setLoading(true);
    try {
      const [ticketsResponse, summaryResponse] = await Promise.all([
        api.get("/support/tickets"),
        api.get("/support/summary"),
      ]);
      setTickets(ticketsResponse.data.data || []);
      setSummary(summaryResponse.data.data || { total: 0, open: 0, urgent: 0, resolved: 0 });
    } catch (error) {
      setStatus(error.response?.data?.message || "Failed to load support center.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      try {
        const { data } = await api.get("/orders");
        if (!cancelled) setOrders(data.data || []);
      } catch {
        if (!cancelled) setOrders([]);
      }
    }

    loadSupport();
    loadOrders();

    return () => {
      cancelled = true;
    };
  }, []);

  const groupedTickets = useMemo(() => {
    const active = tickets.filter((ticket) => !["resolved", "closed", "rejected"].includes(ticket.status));
    const completed = tickets.filter((ticket) => ["resolved", "closed", "rejected"].includes(ticket.status));
    return { active, completed };
  }, [tickets]);

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function replaceTicket(updated) {
    setTickets((current) => current.map((ticket) => (ticket.id === updated.id ? updated : ticket)));
    loadSupport();
  }

  async function submitTicket(event) {
    event.preventDefault();
    try {
      setStatus("Creating support ticket...");
      const { data } = await api.post("/support/tickets", form);
      setTickets((current) => [data.data, ...current]);
      setForm({
        subject: "",
        issueType: "general",
        priority: "normal",
        orderId: "",
        preferredResolution: "",
        customerMessage: "",
      });
      setStatus(data.message || "Support ticket created.");
      loadSupport();
    } catch (error) {
      setStatus(error.response?.data?.message || "Failed to create support ticket.");
    }
  }

  return (
    <section className="page section support-page">
      <SectionHeader
        eyebrow="Support Center"
        title={isAdmin ? "Resolve disputes, refunds, and complaints" : "Get help from SmartSell support"}
        description="Track order issues, delivery problems, refund requests, seller complaints, and service disputes in one professional support workflow."
      />

      <div className="support-stats-grid">
        <article><i>🎫</i><span>Total Tickets</span><strong>{summary.total}</strong></article>
        <article><i>⏳</i><span>Open Work</span><strong>{summary.open}</strong></article>
        <article><i>⚠️</i><span>Urgent</span><strong>{summary.urgent}</strong></article>
        <article><i>✅</i><span>Resolved</span><strong>{summary.resolved}</strong></article>
      </div>

      {!isAdmin && (
        <form className="support-create-panel glass-card" onSubmit={submitTicket}>
          <div className="support-panel-head">
            <div>
              <span className="eyebrow">New Ticket</span>
              <h2>Tell us what went wrong</h2>
              <p>Attach the ticket to an order if the issue is about delivery, payment, product quality, or refund.</p>
            </div>
            <span className="support-head-icon" aria-hidden="true">🛡️</span>
          </div>

          <div className="form-grid two-col">
            <label>
              Subject
              <input value={form.subject} onChange={(event) => setField("subject", event.target.value)} placeholder="Example: Wrong item received" required />
            </label>
            <label>
              Related Order
              <select value={form.orderId} onChange={(event) => setField("orderId", event.target.value)}>
                <option value="">No order selected</option>
                {orders.map((order) => (
                  <option value={order.id} key={order.id}>{order.orderNo} · Rs. {money(order.totalAmount)}</option>
                ))}
              </select>
            </label>
            <label>
              Issue Type
              <select value={form.issueType} onChange={(event) => setField("issueType", event.target.value)}>
                {issueTypes.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
              </select>
            </label>
            <label>
              Priority
              <select value={form.priority} onChange={(event) => setField("priority", event.target.value)}>
                {priorityOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
              </select>
            </label>
          </div>
          <label>
            Preferred Resolution
            <input value={form.preferredResolution} onChange={(event) => setField("preferredResolution", event.target.value)} placeholder="Refund, replacement, exchange, admin call, seller follow-up..." />
          </label>
          <label>
            Explain the issue
            <textarea rows="5" value={form.customerMessage} onChange={(event) => setField("customerMessage", event.target.value)} placeholder="Give clear details, product/order name, date, and what result you expect." required />
          </label>
          <button className="primary-btn" type="submit">Create Support Ticket</button>
        </form>
      )}

      {status && <div className="form-status support-status-note">{status}</div>}
      {loading && <p className="form-status">Loading support tickets...</p>}

      <div className="support-board-grid">
        <section className="support-board-column">
          <div className="support-column-head"><h3>Active Tickets</h3><span>{groupedTickets.active.length}</span></div>
          <div className="support-ticket-list">
            {groupedTickets.active.length ? groupedTickets.active.map((ticket) => (
              <article className={`support-ticket-card priority-${ticket.priority}`} key={ticket.id}>
                <div className="support-ticket-head">
                  <div>
                    <small>{ticket.ticketNo}</small>
                    <h3>{ticket.subject}</h3>
                    <p>{formatDate(ticket.createdAt)}</p>
                  </div>
                  <div className="support-pill-stack">
                    <span className={`support-pill status-${ticket.status}`}>{formatLabel(ticket.status)}</span>
                    <span className={`support-pill priority-${ticket.priority}`}>{formatLabel(ticket.priority)}</span>
                  </div>
                </div>
                <div className="support-ticket-meta">
                  <span>Type: <strong>{formatLabel(ticket.issueType)}</strong></span>
                  <span>Customer: <strong>{ticket.user?.name || "Unknown"}</strong></span>
                  {ticket.order && <span>Order: <strong>{ticket.order.orderNo}</strong></span>}
                  {ticket.refundAmount ? <span>Refund: <strong>Rs. {money(ticket.refundAmount)}</strong></span> : null}
                </div>
                <p className="support-message-box">{ticket.customerMessage}</p>
                {ticket.preferredResolution && <p className="support-resolution"><strong>Requested:</strong> {ticket.preferredResolution}</p>}
                {ticket.adminNote && <p className="support-admin-note"><strong>Admin note:</strong> {ticket.adminNote}</p>}
                {isAdmin && <TicketAdminControls ticket={ticket} onUpdated={replaceTicket} />}
              </article>
            )) : <p className="soft-note">No active tickets.</p>}
          </div>
        </section>

        <section className="support-board-column">
          <div className="support-column-head"><h3>Resolved / Closed</h3><span>{groupedTickets.completed.length}</span></div>
          <div className="support-ticket-list compact-ticket-list">
            {groupedTickets.completed.length ? groupedTickets.completed.map((ticket) => (
              <article className="support-ticket-card compact-support-ticket" key={ticket.id}>
                <div className="support-ticket-head">
                  <div>
                    <small>{ticket.ticketNo}</small>
                    <h3>{ticket.subject}</h3>
                    <p>{formatDate(ticket.resolvedAt || ticket.updatedAt)}</p>
                  </div>
                  <span className={`support-pill status-${ticket.status}`}>{formatLabel(ticket.status)}</span>
                </div>
                {ticket.adminNote && <p className="support-admin-note">{ticket.adminNote}</p>}
              </article>
            )) : <p className="soft-note">No resolved tickets yet.</p>}
          </div>
        </section>
      </div>
    </section>
  );
}
