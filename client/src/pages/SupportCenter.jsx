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
import useSmartPagination from "../hooks/useSmartPagination.js";
import api from "../utils/api.js";
import "../styles/pages/admin/AdminWorkspaceV2.css";
import "../styles/pages/admin/AdminOperations.css";

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

function TicketDecisionForm({ ticket, onUpdated, admin = false }) {
  const [form, setForm] = useState({ status: ticket.status || "open", priority: ticket.priority || "normal", refundAmount: ticket.refundAmount || "", adminNote: ticket.adminNote || "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => { setForm({ status: ticket.status || "open", priority: ticket.priority || "normal", refundAmount: ticket.refundAmount || "", adminNote: ticket.adminNote || "" }); }, [ticket.id, ticket.status, ticket.priority, ticket.refundAmount, ticket.adminNote]);

  async function saveTicket(event) {
    event.preventDefault();
    try {
      setSaving(true);
      setMessage("");
      const { data } = await api.patch(`/support/tickets/${ticket.id}`, form);
      onUpdated(data.data);
      setMessage(data.message || "Ticket updated.");
    } catch (error) { setMessage(error.response?.data?.message || "Failed to update ticket."); }
    finally { setSaving(false); }
  }

  if (admin) {
    return (
      <form className="admin-form-v2 admin-ticket-decision-v2" onSubmit={saveTicket}>
        <section className="admin-form-section-v2"><h3>Admin decision</h3>
          <div className="admin-form-grid-v2 three">
            <label>Status<select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>{statusOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
            <label>Priority<select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}>{priorityOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
            <label>Refund amount<input type="number" min="0" value={form.refundAmount} onChange={(event) => setForm((current) => ({ ...current, refundAmount: event.target.value }))} placeholder="Optional" /></label>
          </div>
          <label>Admin response<textarea rows="4" value={form.adminNote} onChange={(event) => setForm((current) => ({ ...current, adminNote: event.target.value }))} placeholder="Decision, refund note, investigation result, or next step..." /></label>
        </section>
        {message && <div className="admin-alert-v2">{message}</div>}
        <div className="admin-modal-actions-v2"><button className="admin-primary-button-v2" type="submit" disabled={saving}>{saving ? "Saving..." : "Save decision"}</button></div>
      </form>
    );
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

function AdminSupportView({ tickets, summary, loading, notice, search, setSearch, filter, setFilter, selected, setSelected, replaceTicket }) {
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tickets.filter((ticket) => {
      const completed = ["resolved", "closed", "rejected"].includes(ticket.status);
      const matchesFilter = filter === "all" || (filter === "active" ? !completed : filter === "completed" ? completed : filter === "refund" ? Number(ticket.refundAmount || 0) > 0 || ticket.issueType === "refund_request" : ticket.priority === filter);
      const text = `${ticket.ticketNo} ${ticket.subject} ${ticket.customerMessage} ${ticket.issueType} ${ticket.order?.orderNo} ${ticket.user?.name} ${ticket.user?.email}`.toLowerCase();
      return matchesFilter && (!query || text.includes(query));
    });
  }, [tickets, search, filter]);
  const pagination = useAdminPagination(filtered, 10, [search, filter]);

  return (
    <section className="admin-workspace-v2 admin-operations-page-v2 admin-support-v2">
      <AdminPageHeader eyebrow="Customer care operations" title="Support resolution center" description="Triage customer issues, review order and payment context, record decisions, and manage refunds from a clean priority queue." meta={<><span>{summary.open || 0} open tickets</span><span>{summary.urgent || 0} urgent cases</span></>} />
      {notice && <div className="admin-alert-v2">{notice}</div>}
      <div className="admin-metrics-grid-v2 four">
        <AdminMetricCard icon="inbox" label="Total tickets" value={summary.total || 0} note="All support activity" tone="cyan" />
        <AdminMetricCard icon="activity" label="Open work" value={summary.open || 0} note="Needs admin attention" tone="violet" />
        <AdminMetricCard icon="alert" label="Urgent" value={summary.urgent || 0} note="High-priority cases" tone="rose" />
        <AdminMetricCard icon="check" label="Resolved" value={summary.resolved || 0} note="Completed support work" tone="emerald" />
      </div>
      <article className="admin-panel-v2 admin-ops-panel-v2">
        <div className="admin-panel-head-v2"><div><span className="admin-ops-eyebrow-v2">Support queue</span><h2>Customer tickets</h2><p>Open a ticket to view the complete message, order link, preferred resolution, refund, and admin decision controls.</p></div></div>
        <AdminSearchToolbar value={search} onChange={setSearch} placeholder="Search ticket, customer, order, issue, or message..." filters={<label className="admin-select-control-v2"><AdminIcon name="filter" size={17} /><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All tickets</option><option value="active">Active</option><option value="completed">Resolved / closed</option><option value="urgent">Urgent priority</option><option value="high">High priority</option><option value="refund">Refund cases</option></select></label>} />
        {loading ? <div className="admin-ops-loading-v2">Loading support tickets...</div> : !filtered.length ? <AdminEmptyState icon="inbox" title="No support tickets found" description="Try another filter or search term." /> : <>
          <div className="admin-ops-record-list-v2">
            {pagination.items.map((ticket) => (
              <article className={`admin-ops-record-v2 support-row priority-${ticket.priority}`} key={ticket.id} role="button" tabIndex="0" onClick={() => setSelected(ticket)} onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && setSelected(ticket)}>
                <span className={`admin-ops-record-icon-v2 tone-${ticket.priority === "urgent" ? "rose" : ticket.priority === "high" ? "amber" : "indigo"}`}><AdminIcon name="inbox" /></span>
                <div className="admin-ops-record-main-v2"><strong>{ticket.subject}</strong><small>{ticket.ticketNo} · {ticket.user?.name || "SmartSell user"} · {formatDate(ticket.createdAt)}</small></div>
                <div className="admin-ops-record-secondary-v2"><strong>{readable(ticket.issueType)}</strong><small>{ticket.order?.orderNo || "No related order"}</small></div>
                <div className="admin-ops-status-stack-v2"><AdminStatusBadge status={ticket.status} /><AdminStatusBadge status={ticket.priority} /></div>
                <AdminIcon name="chevron" size={17} />
              </article>
            ))}
          </div>
          <AdminPagination pagination={pagination} />
        </>}
      </article>
      <AdminModal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.subject || "Ticket details"} eyebrow={selected?.ticketNo || "Support ticket"} size="large">
        {selected && <>
          <div className="admin-modal-summary-v2"><div><span>Status</span><AdminStatusBadge status={selected.status} /></div><div><span>Priority</span><AdminStatusBadge status={selected.priority} /></div><div><span>Created</span><strong>{formatDate(selected.createdAt)}</strong></div></div>
          <AdminInfoGrid items={[
            { label: "Customer", value: selected.user?.name || "SmartSell user" }, { label: "Customer email", value: selected.user?.email || "Not available" }, { label: "Issue type", value: readable(selected.issueType) }, { label: "Related order", value: selected.order?.orderNo || "No order selected" }, { label: "Refund amount", value: selected.refundAmount ? `Rs. ${money(selected.refundAmount)}` : "Not set" }, { label: "Preferred resolution", value: selected.preferredResolution || "Not specified" },
          ]} />
          <div className="admin-note-v2"><strong>Customer message</strong><p>{selected.customerMessage}</p></div>
          {selected.adminNote && <div className="admin-note-v2 accent"><strong>Current SmartSell response</strong><p>{selected.adminNote}</p></div>}
          <TicketDecisionForm ticket={selected} admin onUpdated={replaceTicket} />
        </>}
      </AdminModal>
    </section>
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
    } catch (error) { setNotice(error.response?.data?.message || "Failed to load support center."); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    let cancelled = false;
    async function loadOrders() { try { const { data } = await api.get("/orders"); if (!cancelled) setOrders(data.data || []); } catch { if (!cancelled) setOrders([]); } }
    loadSupport(); loadOrders(); return () => { cancelled = true; };
  }, []);

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

  if (isAdmin) return <AdminSupportView {...{ tickets, summary, loading, notice, search, setSearch, filter, setFilter, selected, setSelected, replaceTicket }} />;

  const filtered = tickets.filter((ticket) => {
    const query = search.trim().toLowerCase();
    const completed = ["resolved", "closed", "rejected"].includes(ticket.status);
    const matchesFilter = filter === "all" || (filter === "active" ? !completed : filter === "completed" ? completed : ticket.priority === filter);
    const text = `${ticket.ticketNo} ${ticket.subject} ${ticket.customerMessage} ${ticket.issueType} ${ticket.order?.orderNo}`.toLowerCase();
    return matchesFilter && (!query || text.includes(query));
  });
  const pagination = useSmartPagination(filtered, { initialPageSize: 10, resetKey: `${search}-${filter}` });

  return (
    <section className="ca-account-page ca-support-page">
      <AccountPageHeader eyebrow="Help center" title="Support center" description="Create a ticket, follow its status, and keep every support conversation organized." icon="support" actions={<button className="ca-button ca-button--primary" type="button" onClick={() => setCreateOpen(true)}><AccountIcon name="plus" size={16} /> New ticket</button>} />
      <AccountStatGrid items={[
        { label: "Total tickets", value: summary.total, note: "All support activity", icon: "ticket", tone: "cyan" },
        { label: "Open work", value: summary.open, note: "Needs attention", icon: "activity", tone: "violet" },
        { label: "Urgent", value: summary.urgent, note: "High priority", icon: "bell", tone: "rose" },
        { label: "Resolved", value: summary.resolved, note: "Completed tickets", icon: "check", tone: "emerald" },
      ]} />
      <AccountToolbar resultText={`${filtered.length} ticket${filtered.length === 1 ? "" : "s"}`}><AccountSearch value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search ticket, order, issue, or message..." /><label className="ca-select-filter"><AccountIcon name="filter" size={17} /><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All tickets</option><option value="active">Active</option><option value="completed">Resolved / closed</option><option value="urgent">Urgent priority</option><option value="high">High priority</option></select></label></AccountToolbar>
      {notice && <div className="ca-alert">{notice}</div>}
      {loading ? <div className="ca-loading">Loading support tickets...</div> : filtered.length === 0 ? <AccountEmpty icon="support" title="No support tickets found" text={tickets.length ? "Try another search or filter." : "Create a ticket when you need help with an order, payment, delivery, refund, or service."} actionLabel="Create ticket" action={() => setCreateOpen(true)} /> : <><div className="ca-record-list">{pagination.items.map((ticket) => <article className={`ca-record-card ca-ticket-row priority-${ticket.priority}`} key={ticket.id} role="button" tabIndex="0" onClick={() => setSelected(ticket)} onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && setSelected(ticket)}><span className="ca-record-card__icon tone-indigo"><AccountIcon name="ticket" size={20} /></span><div className="ca-record-card__main"><div className="ca-record-card__title"><h3>{ticket.subject}</h3><div className="ca-status-group"><AccountStatus value={ticket.status} label={readable(ticket.status)} /><AccountStatus value={ticket.priority} label={readable(ticket.priority)} /></div></div><p>{ticket.ticketNo} · {formatDate(ticket.createdAt)}</p><div className="ca-record-card__meta"><span>Type: <b>{readable(ticket.issueType)}</b></span>{ticket.order && <span>Order: <b>{ticket.order.orderNo}</b></span>}</div></div><span className="ca-record-card__open">View ticket <AccountIcon name="chevron" size={16} /></span></article>)}</div><SmartPagination pagination={pagination} label="tickets" compact /></>}
      <AccountModal open={createOpen} onClose={() => setCreateOpen(false)} title="Create support ticket" eyebrow="Tell us what happened" icon="support" size="large"><form className="ca-ticket-create-form" onSubmit={submitTicket}><div className="ca-form-grid ca-form-grid--two"><label>Subject<input value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} placeholder="Example: Wrong item received" required /></label><label>Related order<select value={form.orderId} onChange={(event) => setForm((current) => ({ ...current, orderId: event.target.value }))}><option value="">No order selected</option>{orders.map((order) => <option value={order.id} key={order.id}>{order.orderNo} · Rs. {money(order.totalAmount)}</option>)}</select></label><label>Issue type<select value={form.issueType} onChange={(event) => setForm((current) => ({ ...current, issueType: event.target.value }))}>{issueTypes.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Priority<select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}>{priorityOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label></div><label>Preferred resolution<input value={form.preferredResolution} onChange={(event) => setForm((current) => ({ ...current, preferredResolution: event.target.value }))} placeholder="Refund, replacement, exchange, seller follow-up..." /></label><label>Explain the issue<textarea rows="5" value={form.customerMessage} onChange={(event) => setForm((current) => ({ ...current, customerMessage: event.target.value }))} placeholder="Include the product or service, date, what happened, and the result you expect." required /></label><div className="ca-modal-actions"><button className="ca-button ca-button--primary" type="submit">Create ticket</button><button className="ca-button ca-button--soft" type="button" onClick={() => setCreateOpen(false)}>Cancel</button></div></form></AccountModal>
      <AccountModal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.subject || "Ticket details"} eyebrow={selected?.ticketNo || "Support ticket"} icon="ticket" size="large">{selected && <><div className="ca-modal-summary-row"><div><span>Status</span><AccountStatus value={selected.status} label={readable(selected.status)} /></div><div><span>Priority</span><AccountStatus value={selected.priority} label={readable(selected.priority)} /></div><div><span>Created</span><strong>{formatDate(selected.createdAt)}</strong></div></div><section className="ca-modal-section"><h3>Issue details</h3><AccountDetailGrid items={[{ label: "Issue type", value: readable(selected.issueType) }, { label: "Customer", value: selected.user?.name || user?.name || "SmartSell user" }, { label: "Related order", value: selected.order?.orderNo || "No order selected" }, { label: "Refund amount", value: selected.refundAmount ? `Rs. ${money(selected.refundAmount)}` : "Not set" }]} /></section><div className="ca-note ca-note--large"><strong>Customer message</strong><p>{selected.customerMessage}</p></div>{selected.preferredResolution && <div className="ca-note"><strong>Preferred resolution</strong><p>{selected.preferredResolution}</p></div>}{selected.adminNote && <div className="ca-note ca-note--accent"><strong>SmartSell response</strong><p>{selected.adminNote}</p></div>}</>}</AccountModal>
    </section>
  );
}
