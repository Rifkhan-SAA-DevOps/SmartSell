import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SectionHeader from "../components/SectionHeader.jsx";
import ContextMessageButton from "../components/ContextMessageButton.jsx";
import api from "../utils/api.js";

const money = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR",
  maximumFractionDigits: 0,
});

const requestIcons = {
  custom: "✦",
  product: "▦",
  "used-product": "↻",
  service: "◆",
  service_quote: "✦",
  package: "▣",
  urgent: "⚡",
};

function formatMoney(value) {
  if (value === null || value === undefined || value === "") return "Not set";
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

export default function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadRequests() {
    setLoading(true);
    setMessage("");
    try {
      const { data } = await api.get("/requests/mine");
      setRequests(data.data || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not load your requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function updateRequest(id, status) {
    setMessage("Updating request...");
    try {
      await api.patch(`/requests/${id}/customer`, { status });
      setMessage(status === "accepted" ? "Quotation accepted." : "Request cancelled.");
      await loadRequests();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not update this request.");
    }
  }

  return (
    <section className="page section my-requests-page pro-my-requests-page">
      <SectionHeader
        eyebrow="My Requests"
        title="Track custom requests and quotations"
        description="Each request has a clear status, budget, quotation, assignment, and next action."
      />

      <div className="business-top-actions pro-page-action-card">
        <div>
          <span className="pro-action-icon">✦</span>
          <h3>Request Anything workflow</h3>
          <p>Submit a request, wait for admin quotation, then accept it when the price and note look correct.</p>
        </div>
        <Link className="primary-btn" to="/request-anything">Create New Request</Link>
      </div>

      {loading && <p className="form-status">Loading your requests...</p>}
      {message && <p className="form-status">{message}</p>}

      {!loading && !requests.length && (
        <div className="empty-business-card pro-empty-card">
          <span>◇</span>
          <strong>No requests yet</strong>
          <p>Use Request Anything to ask for cakes, gifts, delivery, website work, editing, used products, or any custom need.</p>
        </div>
      )}

      <div className="request-workflow-grid pro-request-workflow-grid">
        {requests.map((request) => (
          <article key={request.id} className="request-workflow-card pro-request-card">
            <div className="pro-request-card-head">
              <div className="pro-request-icon">{requestIcons[request.requestType] || "✦"}</div>
              <div>
                <h3>{formatStatus(request.requestType || "Custom Request")}</h3>
                <p>{shortDate(request.createdAt)} • {request.location || "No location"}</p>
              </div>
              <span className={statusClass(request.status)}>{formatStatus(request.status)}</span>
            </div>

            <p className="request-message">{request.message}</p>

            <div className="mini-meta-grid pro-meta-grid">
              <span><i>◌</i>Budget <strong>{formatMoney(request.budget)}</strong></span>
              <span><i>◆</i>Quotation <strong>{formatMoney(request.quotation)}</strong></span>
              <span><i>☎</i>Phone <strong>{request.phone}</strong></span>
              <span><i>▣</i>Assigned <strong>{request.assignedTo || "Not assigned"}</strong></span>
            </div>

            {request.adminNote && <p className="quote-note">Admin note: {request.adminNote}</p>}

            {request.status === "quoted" && (
              <div className="inline-actions">
                <button className="primary-btn" type="button" onClick={() => updateRequest(request.id, "accepted")}>Accept Quotation</button>
                <button className="secondary-btn" type="button" onClick={() => updateRequest(request.id, "cancelled")}>Cancel Request</button>
              </div>
            )}

            <div className="inline-actions request-chat-actions">
              <ContextMessageButton
                contextType="request"
                contextId={request.id}
                subject={`Request discussion: ${formatStatus(request.requestType || "Custom Request")}`}
                message={`Hi SmartSell team, I want to discuss this request: ${formatStatus(request.requestType || "Custom Request")}.`}
                label="💬 Message"
                className="secondary-btn small-btn"
              />
              {["new", "pending", "accepted"].includes(request.status) && (
                <button className="secondary-btn small-btn" type="button" onClick={() => updateRequest(request.id, "cancelled")}>Cancel Request</button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
