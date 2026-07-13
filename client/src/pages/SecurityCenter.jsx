import { useEffect, useMemo, useState } from "react";
import api from "../utils/api.js";
import "../styles/pages/admin/AdminWorkspace.css";
import "../styles/pages/admin/SecurityCenter.css";

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function AuditRow({ item }) {
  return (
    <tr>
      <td>
        <strong>{item.admin?.name || "Admin"}</strong>
        <span className="muted-table-text">{item.admin?.email || "—"}</span>
      </td>
      <td><span className="pill soft-pill">{item.action}</span></td>
      <td>{item.targetType || "—"}</td>
      <td className="mono-cell">{item.targetId || "—"}</td>
      <td>{item.note || "—"}</td>
      <td>{formatDate(item.createdAt)}</td>
    </tr>
  );
}

export default function SecurityCenter() {
  const [summary, setSummary] = useState(null);
  const [audit, setAudit] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadSecurity() {
    setLoading(true);
    setError("");
    try {
      const [summaryRes, auditRes] = await Promise.all([
        api.get("/security/summary"),
        api.get("/security/audit?limit=40"),
      ]);
      setSummary(summaryRes.data.data);
      setAudit(auditRes.data.data);
    } catch (err) {
      setError(err.smartSellMessage || "Unable to load security data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSecurity();
  }, []);

  const statCards = useMemo(() => [
    { label: "Admin actions", value: summary?.totalActions ?? 0, icon: "AL" },
    { label: "Actions in 24h", value: summary?.actions24h ?? 0, icon: "24" },
    { label: "Pending users", value: summary?.pendingUsers ?? 0, icon: "PU" },
    { label: "Blocked users", value: summary?.blockedUsers ?? 0, icon: "BU" },
  ], [summary]);

  return (
    <section className="page-section security-center-page">
      <div className="page-heading-row">
        <div>
          <span className="eyebrow">Admin control</span>
          <h1>Security & Audit Center</h1>
          <p>Track important admin actions, verify protection status, and prepare SmartSell for production deployment.</p>
        </div>
        <button className="primary-btn" type="button" onClick={loadSecurity} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && <div className="alert error-alert">{error}</div>}

      <div className="stats-grid security-stats-grid">
        {statCards.map((card) => (
          <article className="stat-card icon-stat-card" key={card.label}>
            <span className="stat-icon" aria-hidden="true">{card.icon}</span>
            <div>
              <strong>{card.value}</strong>
              <span>{card.label}</span>
            </div>
          </article>
        ))}
      </div>

      <div className="content-grid two-col-grid security-grid">
        <article className="panel-card">
          <div className="panel-card-header">
            <div>
              <h2>Protection checklist</h2>
              <p>Security layers enabled in this phase.</p>
            </div>
          </div>

          <div className="security-checklist">
            {(summary?.checklist || []).map((item) => (
              <div className="security-check-item" key={item.key}>
                <span className="security-check-icon">✓</span>
                <div>
                  <strong>{item.label}</strong>
                  <small>{item.status === "active" ? "Active" : item.status}</small>
                </div>
              </div>
            ))}
            {!summary?.checklist?.length && !loading && <p className="muted-copy">No checklist data found.</p>}
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-card-header">
            <div>
              <h2>Recommended next hardening</h2>
              <p>Keep these for production deployment.</p>
            </div>
          </div>
          <div className="security-advice-list">
            <span>Move uploads to AWS S3 with signed URLs.</span>
            <span>Use HTTPS-only production domain and secure cookies if cookies are added.</span>
            <span>Use strong production JWT secret and rotate if leaked.</span>
            <span>Back up PostgreSQL before production migrations.</span>
            <span>Add email/OTP verification before public launch.</span>
          </div>
        </article>
      </div>

      <article className="panel-card wide-panel">
        <div className="panel-card-header">
          <div>
            <h2>Recent admin audit log</h2>
            <p>Admin and super admin create/update/delete actions are logged automatically.</p>
          </div>
          <span className="pill">{audit.total || 0} logs</span>
        </div>

        <div className="table-shell">
          <table className="professional-table audit-table">
            <thead>
              <tr>
                <th>Admin</th>
                <th>Action</th>
                <th>Area</th>
                <th>Target</th>
                <th>Note</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6">Loading security audit...</td></tr>
              ) : audit.items?.length ? (
                audit.items.map((item) => <AuditRow item={item} key={item.id} />)
              ) : (
                <tr><td colSpan="6">No audit logs yet. Admin write actions will appear here.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
