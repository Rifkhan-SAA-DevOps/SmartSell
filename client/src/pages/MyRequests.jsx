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

const money = new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 });

function formatMoney(value) {
  if (value === null || value === undefined || value === "") return "Not set";
  return money.format(Number(value || 0));
}
function readable(value) {
  return String(value || "").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function shortDate(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not set" : date.toLocaleDateString("en-LK", { year: "numeric", month: "short", day: "numeric" });
}

export default function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  async function loadRequests() {
    setLoading(true);
    try {
      const { data } = await api.get("/requests/mine");
      setRequests(data.data || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not load your requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadRequests(); }, []);

  async function updateRequest(id, nextStatus) {
    setMessage("Updating request...");
    try {
      await api.patch(`/requests/${id}/customer`, { status: nextStatus });
      setMessage(nextStatus === "accepted" ? "Quotation accepted." : "Request cancelled.");
      setSelected(null);
      await loadRequests();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not update this request.");
    }
  }

  const stats = useMemo(() => ({
    active: requests.filter((request) => !["completed", "cancelled", "rejected"].includes(request.status)).length,
    quoted: requests.filter((request) => request.status === "quoted").length,
    completed: requests.filter((request) => request.status === "completed").length,
  }), [requests]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return requests.filter((request) => {
      const haystack = `${request.requestType} ${request.message} ${request.location} ${request.assignedTo}`.toLowerCase();
      return (status === "all" || request.status === status) && (!query || haystack.includes(query));
    });
  }, [requests, search, status]);
  const pagination = useSmartPagination(filtered, { initialPageSize: 10, resetKey: `${search}-${status}` });

  return (
    <section className="ca-account-page ca-requests-page">
      <AccountPageHeader eyebrow="Custom needs" title="My requests" description="Track requests, quotations, assignments, and decisions without crowded action buttons." icon="request" actions={<Link className="ca-button ca-button--primary" to="/request-anything"><AccountIcon name="plus" size={16} /> Create request</Link>} />

      <AccountStatGrid items={[
        { label: "All requests", value: requests.length, note: "Submitted to SmartSell", icon: "request", tone: "cyan" },
        { label: "Active", value: stats.active, note: "Currently in progress", icon: "activity", tone: "violet" },
        { label: "Quoted", value: stats.quoted, note: "Waiting for your decision", icon: "money", tone: "amber" },
        { label: "Completed", value: stats.completed, note: "Successfully finished", icon: "check", tone: "emerald" },
      ]} />

      <AccountToolbar resultText={`${filtered.length} request${filtered.length === 1 ? "" : "s"}`}>
        <AccountSearch value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search request, location, or provider..." />
        <label className="ca-select-filter"><AccountIcon name="filter" size={17} /><select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All statuses</option><option value="new">New</option><option value="pending">Pending</option><option value="quoted">Quoted</option><option value="accepted">Accepted</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
        </select></label>
      </AccountToolbar>

      {message && <div className="ca-alert">{message}</div>}
      {loading ? <div className="ca-loading">Loading your requests...</div> : filtered.length === 0 ? (
        <AccountEmpty icon="request" title="No requests found" text={requests.length ? "Try another search or status filter." : "Ask SmartSell for products, services, delivery, gifts, digital work, or any custom need."} actionLabel="Create a request" actionTo="/request-anything" />
      ) : <>
        <div className="ca-record-grid">
          {pagination.items.map((request) => (
            <article className="ca-summary-card tone-cyan" key={request.id} role="button" tabIndex="0" onClick={() => setSelected(request)} onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && setSelected(request)}>
              <div className="ca-summary-card__top"><span className="ca-summary-card__icon"><AccountIcon name="request" size={20} /></span><AccountStatus value={request.status} label={readable(request.status)} /></div>
              <small>{shortDate(request.createdAt)} · {request.location || "No location"}</small>
              <h3>{readable(request.requestType || "Custom request")}</h3>
              <p className="ca-clamp-3">{request.message}</p>
              <div className="ca-summary-card__values"><span>Budget <b>{formatMoney(request.budget)}</b></span><span>Quotation <b>{formatMoney(request.quotation)}</b></span></div>
              <div className="ca-summary-card__footer"><span>{request.assignedTo || "Not assigned"}</span><b>View details <AccountIcon name="chevron" size={15} /></b></div>
            </article>
          ))}
        </div>
        <SmartPagination pagination={pagination} label="requests" compact />
      </>}

      <AccountModal open={Boolean(selected)} onClose={() => setSelected(null)} title={readable(selected?.requestType || "Request details")} eyebrow="Request details" icon="request" size="large">
        {selected && <>
          <div className="ca-modal-summary-row"><div><span>Status</span><AccountStatus value={selected.status} label={readable(selected.status)} /></div><div><span>Budget</span><strong>{formatMoney(selected.budget)}</strong></div><div><span>Quotation</span><strong>{formatMoney(selected.quotation)}</strong></div></div>
          <section className="ca-modal-section"><h3>Your requirement</h3><div className="ca-note ca-note--large"><p>{selected.message}</p></div></section>
          <section className="ca-modal-section"><h3>Request information</h3><AccountDetailGrid items={[
            { label: "Created", value: shortDate(selected.createdAt) }, { label: "Location", value: selected.location || "Not provided" }, { label: "Phone", value: selected.phone || "Not provided" }, { label: "Assigned to", value: selected.assignedTo || "Not assigned" }, { label: "Current status", value: readable(selected.status) },
          ]} /></section>
          {selected.adminNote && <div className="ca-note ca-note--accent"><strong>SmartSell note</strong><p>{selected.adminNote}</p></div>}
          <div className="ca-modal-actions">
            {selected.status === "quoted" && <button className="ca-button ca-button--primary" type="button" onClick={() => updateRequest(selected.id, "accepted")}>Accept quotation</button>}
            <ContextMessageButton contextType="request" contextId={selected.id} subject={`Request discussion: ${readable(selected.requestType || "Custom request")}`} message={`Hi SmartSell team, I want to discuss this request: ${readable(selected.requestType || "Custom request")}.`} label="Message SmartSell" className="ca-button ca-button--soft" />
            {["new", "pending", "quoted", "accepted"].includes(selected.status) && <button className="ca-button ca-button--danger" type="button" onClick={() => updateRequest(selected.id, "cancelled")}>Cancel request</button>}
          </div>
        </>}
      </AccountModal>
    </section>
  );
}
