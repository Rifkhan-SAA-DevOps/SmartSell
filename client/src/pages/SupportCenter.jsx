import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
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

const adminRoles = ["admin", "super_admin"];
const issueTypes = [["general", "General support"], ["order_issue", "Order issue"], ["delivery_issue", "Delivery issue"], ["refund_request", "Refund request"], ["payment_issue", "Payment issue"], ["seller_issue", "Seller issue"], ["service_issue", "Service issue"], ["damaged_item", "Damaged item"], ["wrong_item", "Wrong item"], ["other", "Other"]];
const statusOptions = [["open", "Open"], ["reviewing", "Reviewing"], ["waiting_customer", "Waiting customer"], ["resolved", "Resolved"], ["rejected", "Rejected"], ["closed", "Closed"]];
const priorityOptions = [["low", "Low"], ["normal", "Normal"], ["high", "High"], ["urgent", "Urgent"]];

function money(value) { return Number(value || 0).toLocaleString("en-LK"); }
function readable(value) { return String(value || "").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function formatDate(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not set" : date.toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" });
}

function TicketAdminControls({ ticket, onUpdated }) {
  const [form, setForm] = useState({ status: ticket.status || "open", priority: ticket.priority || "normal", refundAmount: ticket.refundAmount || "", adminNote: ticket.adminNote || "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => { setForm({ status: ticket.status || "open", priority: ticket.priority || "normal", refundAmount: ticket.refundAmount || "", adminNote: ticket.adminNote || "" }); }, [ticket.id, ticket.status, ticket.priority, ticket.refundAmount, ticket.adminNote]);

  async function saveTicket(event) {
    event.preventDefault();
    try {
      setSaving(true);
      const { data } = await api.patch(`/support/tickets/${ticket.id}`, form);
      onUpdated(data.data);
      setMessage(data.message || "Ticket updated.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to update ticket.");
    } finally { setSaving(false); }
  }

  return (
    <form className="ca-admin-ticket-form" onSubmit={saveTicket}>
      <h3>Admin decision</h3>
      <div className="ca-form-grid ca-form-grid--three">
        <label>Status<select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>{statusOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        <label>Priority<select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}>{priorityOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        <label>Refund amount<input type="number" min="0" value={form.refundAmount} onChange={(event) => setForm((current) => ({ ...current, refundAmount: event.target.value }))} placeholder="Optional" /></label>
      </div>
      <label>Admin note<textarea rows="3" value={form.adminNote} onChange={(event) => setForm((current) => ({ ...current, adminNote: event.target.value }))} placeholder="Decision, refund note, or next step..." /></label>
      <div className="ca-form-actions"><button className="ca-button ca-button--primary" type="submit" disabled={saving}>{saving ? "Saving..." : "Save decision"}</button>{message && <span className="ca-form-note">{message}</span>}</div>
    </form>
  );
}

export default function SupportCenter() {
  const { user } = useAuth();
  const isAdmin = adminRoles.includes(user?.role);
  const [tickets, setTickets] = useState([]);
  const [summary, setSummary] = useState({ total: 0, open: 0, urgent: 0, resolved: 0 });
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ subject: "", issueType: "general", priority: "normal", orderId: "", preferredResolution: "", customerMessage: "" });

  async function loadSupport() {
    setLoading(true);
    try {
      const [ticketsResponse, summaryResponse] = await Promise.all([api.get("/support/tickets"), api.get("/support/summary")]);
      setTickets(ticketsResponse.data.data || []);
      setSummary(summaryResponse.data.data || { total: 0, open: 0, urgent: 0, resolved: 0 });
    } catch (error) {
      setNotice(error.response?.data?.message || "Failed to load support center.");
    } finally { setLoading(false); }
  }

  useEffect(() => {
    let cancelled = false;
    async function loadOrders() {
      try { const { data } = await api.get("/orders"); if (!cancelled) setOrders(data.data || []); } catch { if (!cancelled) setOrders([]); }
    }
    loadSupport(); loadOrders();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tickets.filter((ticket) => {
      const completed = ["resolved", "closed", "rejected"].includes(ticket.status);
      const matchesFilter = filter === "all" || (filter === "active" ? !completed : filter === "completed" ? completed : ticket.priority === filter);
      const haystack = `${ticket.ticketNo} ${ticket.subject} ${ticket.customerMessage} ${ticket.issueType} ${ticket.order?.orderNo}`.toLowerCase();
      return matchesFilter && (!query || haystack.includes(query));
    });
  }, [tickets, search, filter]);
  const pagination = useSmartPagination(filtered, { initialPageSize: 10, resetKey: `${search}-${filter}` });

  function replaceTicket(updated) {
    setTickets((current) => current.map((ticket) => (ticket.id === updated.id ? updated : ticket)));
    setSelected(updated);
    loadSupport();
  }

  async function submitTicket(event) {
    event.preventDefault();
    try {
      setNotice("Creating support ticket...");
      const { data } = await api.post("/support/tickets", form);
      setTickets((current) => [data.data, ...current]);
      setForm({ subject: "", issueType: "general", priority: "normal", orderId: "", preferredResolution: "", customerMessage: "" });
      setNotice(data.message || "Support ticket created.");
      setCreateOpen(false);
      await loadSupport();
    } catch (error) { setNotice(error.response?.data?.message || "Failed to create support ticket."); }
  }

  return (
    <section className="ca-account-page ca-support-page">
      <AccountPageHeader eyebrow="Help center" title={isAdmin ? "Support operations" : "Support center"} description={isAdmin ? "Review support work in a clean queue and open each ticket for complete actions." : "Create a ticket, follow its status, and keep every support conversation organized."} icon="support" actions={!isAdmin && <button className="ca-button ca-button--primary" type="button" onClick={() => setCreateOpen(true)}><AccountIcon name="plus" size={16} /> New ticket</button>} />

      <AccountStatGrid items={[
        { label: "Total tickets", value: summary.total, note: "All support activity", icon: "ticket", tone: "cyan" },
        { label: "Open work", value: summary.open, note: "Needs attention", icon: "activity", tone: "violet" },
        { label: "Urgent", value: summary.urgent, note: "High priority", icon: "bell", tone: "rose" },
        { label: "Resolved", value: summary.resolved, note: "Completed tickets", icon: "check", tone: "emerald" },
      ]} />

      <AccountToolbar resultText={`${filtered.length} ticket${filtered.length === 1 ? "" : "s"}`}>
        <AccountSearch value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search ticket, order, issue, or message..." />
        <label className="ca-select-filter"><AccountIcon name="filter" size={17} /><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All tickets</option><option value="active">Active</option><option value="completed">Resolved / closed</option><option value="urgent">Urgent priority</option><option value="high">High priority</option></select></label>
      </AccountToolbar>

      {notice && <div className="ca-alert">{notice}</div>}
      {loading ? <div className="ca-loading">Loading support tickets...</div> : filtered.length === 0 ? (
        <AccountEmpty icon="support" title="No support tickets found" text={tickets.length ? "Try another search or filter." : "Create a ticket when you need help with an order, payment, delivery, refund, or service."} actionLabel={!isAdmin ? "Create ticket" : undefined} action={!isAdmin ? () => setCreateOpen(true) : undefined} />
      ) : <>
        <div className="ca-record-list">
          {pagination.items.map((ticket) => (
            <article className={`ca-record-card ca-ticket-row priority-${ticket.priority}`} key={ticket.id} role="button" tabIndex="0" onClick={() => setSelected(ticket)} onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && setSelected(ticket)}>
              <span className="ca-record-card__icon tone-indigo"><AccountIcon name="ticket" size={20} /></span>
              <div className="ca-record-card__main"><div className="ca-record-card__title"><h3>{ticket.subject}</h3><div className="ca-status-group"><AccountStatus value={ticket.status} label={readable(ticket.status)} /><AccountStatus value={ticket.priority} label={readable(ticket.priority)} /></div></div><p>{ticket.ticketNo} · {formatDate(ticket.createdAt)}</p><div className="ca-record-card__meta"><span>Type: <b>{readable(ticket.issueType)}</b></span>{ticket.order && <span>Order: <b>{ticket.order.orderNo}</b></span>}</div></div>
              <span className="ca-record-card__open">View ticket <AccountIcon name="chevron" size={16} /></span>
            </article>
          ))}
        </div>
        <SmartPagination pagination={pagination} label="tickets" compact />
      </>}

      <AccountModal open={createOpen} onClose={() => setCreateOpen(false)} title="Create support ticket" eyebrow="Tell us what happened" icon="support" size="large">
        <form className="ca-ticket-create-form" onSubmit={submitTicket}>
          <div className="ca-form-grid ca-form-grid--two">
            <label>Subject<input value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} placeholder="Example: Wrong item received" required /></label>
            <label>Related order<select value={form.orderId} onChange={(event) => setForm((current) => ({ ...current, orderId: event.target.value }))}><option value="">No order selected</option>{orders.map((order) => <option value={order.id} key={order.id}>{order.orderNo} · Rs. {money(order.totalAmount)}</option>)}</select></label>
            <label>Issue type<select value={form.issueType} onChange={(event) => setForm((current) => ({ ...current, issueType: event.target.value }))}>{issueTypes.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
            <label>Priority<select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}>{priorityOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          </div>
          <label>Preferred resolution<input value={form.preferredResolution} onChange={(event) => setForm((current) => ({ ...current, preferredResolution: event.target.value }))} placeholder="Refund, replacement, exchange, seller follow-up..." /></label>
          <label>Explain the issue<textarea rows="5" value={form.customerMessage} onChange={(event) => setForm((current) => ({ ...current, customerMessage: event.target.value }))} placeholder="Include the product or service, date, what happened, and the result you expect." required /></label>
          <div className="ca-modal-actions"><button className="ca-button ca-button--primary" type="submit">Create ticket</button><button className="ca-button ca-button--soft" type="button" onClick={() => setCreateOpen(false)}>Cancel</button></div>
        </form>
      </AccountModal>

      <AccountModal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.subject || "Ticket details"} eyebrow={selected?.ticketNo || "Support ticket"} icon="ticket" size="large">
        {selected && <>
          <div className="ca-modal-summary-row"><div><span>Status</span><AccountStatus value={selected.status} label={readable(selected.status)} /></div><div><span>Priority</span><AccountStatus value={selected.priority} label={readable(selected.priority)} /></div><div><span>Created</span><strong>{formatDate(selected.createdAt)}</strong></div></div>
          <section className="ca-modal-section"><h3>Issue details</h3><AccountDetailGrid items={[
            { label: "Issue type", value: readable(selected.issueType) }, { label: "Customer", value: selected.user?.name || user?.name || "SmartSell user" }, { label: "Related order", value: selected.order?.orderNo || "No order selected" }, { label: "Refund amount", value: selected.refundAmount ? `Rs. ${money(selected.refundAmount)}` : "Not set" },
          ]} /></section>
          <div className="ca-note ca-note--large"><strong>Customer message</strong><p>{selected.customerMessage}</p></div>
          {selected.preferredResolution && <div className="ca-note"><strong>Preferred resolution</strong><p>{selected.preferredResolution}</p></div>}
          {selected.adminNote && <div className="ca-note ca-note--accent"><strong>SmartSell response</strong><p>{selected.adminNote}</p></div>}
          {isAdmin && <TicketAdminControls ticket={selected} onUpdated={replaceTicket} />}
        </>}
      </AccountModal>
    </section>
  );
}
