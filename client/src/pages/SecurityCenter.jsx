import { useEffect, useMemo, useState } from "react";
import {
  AdminEmptyState, AdminIcon, AdminInfoGrid, AdminMetricCard, AdminModal, AdminPageHeader, AdminPagination,
  AdminSearchToolbar, AdminStatusBadge, useAdminPagination,
} from "../components/AdminWorkspaceUi.jsx";
import api from "../utils/api.js";
import "../styles/pages/admin/AdminWorkspaceV2.css";
import "../styles/pages/admin/AdminOperations.css";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("en-LK", { dateStyle: "medium", timeStyle: "short" }).format(date);
}
function titleCase(value) { return String(value || "").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }

export default function SecurityCenter() {
  const [summary, setSummary] = useState(null);
  const [audit, setAudit] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [area, setArea] = useState("all");
  const [selected, setSelected] = useState(null);

  async function loadSecurity() {
    setLoading(true); setError("");
    try {
      const [summaryRes, auditRes] = await Promise.all([api.get("/security/summary"), api.get("/security/audit?limit=200")]);
      setSummary(summaryRes.data.data || {}); setAudit(auditRes.data.data || { items: [], total: 0, page: 1, pages: 1 });
    } catch (err) { setError(err.smartSellMessage || err.response?.data?.message || "Unable to load security data."); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadSecurity(); }, []);

  const areas = useMemo(() => [...new Set((audit.items || []).map((item) => item.targetType).filter(Boolean))], [audit.items]);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (audit.items || []).filter((item) => {
      const matchesArea = area === "all" || item.targetType === area;
      const text = `${item.admin?.name} ${item.admin?.email} ${item.action} ${item.targetType} ${item.targetId} ${item.note}`.toLowerCase();
      return matchesArea && (!query || text.includes(query));
    });
  }, [audit.items, search, area]);
  const pagination = useAdminPagination(filtered, 10, [search, area]);

  return (
    <section className="admin-workspace-v2 admin-operations-page-v2 admin-security-v2">
      <AdminPageHeader eyebrow="Protection & accountability" title="Security & audit center" description="Review administrative activity, confirm active protection layers, and keep a clear record of sensitive SmartSell changes." actions={<button className="admin-secondary-button-v2" type="button" onClick={loadSecurity} disabled={loading}><AdminIcon name="refresh" size={17} />{loading ? "Refreshing..." : "Refresh security"}</button>} meta={<><span>{audit.total || 0} recorded admin actions</span><span>{summary?.actions24h || 0} actions in 24 hours</span></>} />
      {error && <div className="admin-alert-v2 error">{error}</div>}
      <div className="admin-metrics-grid-v2 four">
        <AdminMetricCard icon="activity" label="Admin actions" value={summary?.totalActions ?? 0} note="Complete audit history" tone="blue" />
        <AdminMetricCard icon="refresh" label="Actions in 24h" value={summary?.actions24h ?? 0} note="Recent protected changes" tone="cyan" />
        <AdminMetricCard icon="users" label="Pending users" value={summary?.pendingUsers ?? 0} note="Awaiting account decision" tone="amber" />
        <AdminMetricCard icon="shield" label="Blocked users" value={summary?.blockedUsers ?? 0} note="Restricted accounts" tone="rose" />
      </div>

      <div className="admin-ops-grid-v2 security-overview">
        <article className="admin-panel-v2 admin-ops-panel-v2"><div className="admin-panel-head-v2"><div><span className="admin-ops-eyebrow-v2">Protection status</span><h2>Active security checklist</h2><p>Security layers reported by the application.</p></div></div><div className="admin-security-checklist-v2">{(summary?.checklist || []).map((item) => <div key={item.key}><span><AdminIcon name="check" size={16} /></span><div><strong>{item.label}</strong><small>{titleCase(item.status || "active")}</small></div><AdminStatusBadge status={item.status || "active"} /></div>)}{!summary?.checklist?.length && <p className="admin-ops-muted-v2">No checklist data found.</p>}</div></article>
        <article className="admin-panel-v2 admin-ops-panel-v2"><div className="admin-panel-head-v2"><div><span className="admin-ops-eyebrow-v2">Production readiness</span><h2>Recommended hardening</h2><p>Important controls to complete before a public launch.</p></div></div><div className="admin-hardening-list-v2">{[
          "Move uploads to AWS S3 with signed URLs.", "Use an HTTPS-only production domain and secure cookie policy.", "Use a strong production JWT secret and rotate it when exposed.", "Back up PostgreSQL before production migrations.", "Add email or OTP verification before public launch.",
        ].map((item, index) => <div key={item}><span>{String(index + 1).padStart(2, "0")}</span><p>{item}</p></div>)}</div></article>
      </div>

      <article className="admin-panel-v2 admin-ops-panel-v2">
        <div className="admin-panel-head-v2"><div><span className="admin-ops-eyebrow-v2">Audit directory</span><h2>Recent administrative actions</h2><p>Open a record to review the actor, action, target, note, and timestamp.</p></div></div>
        <AdminSearchToolbar value={search} onChange={setSearch} placeholder="Search administrator, action, target, or note..." filters={<label className="admin-select-control-v2"><AdminIcon name="filter" size={17} /><select value={area} onChange={(event) => setArea(event.target.value)}><option value="all">All target areas</option>{areas.map((item) => <option key={item} value={item}>{titleCase(item)}</option>)}</select></label>} />
        {loading ? <div className="admin-ops-loading-v2">Loading security audit...</div> : !filtered.length ? <AdminEmptyState icon="shield" title="No audit records found" description="Admin write actions will appear here automatically." /> : <><div className="admin-ops-record-list-v2">{pagination.items.map((item) => <article className="admin-ops-record-v2 audit-row" key={item.id} role="button" tabIndex="0" onClick={() => setSelected(item)} onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && setSelected(item)}><span className="admin-ops-record-icon-v2 tone-violet"><AdminIcon name="shield" /></span><div className="admin-ops-record-main-v2"><strong>{titleCase(item.action)}</strong><small>{item.admin?.name || "Admin"} · {item.admin?.email || "No email"}</small></div><div className="admin-ops-record-secondary-v2"><strong>{titleCase(item.targetType)}</strong><small>{item.targetId || "No target ID"}</small></div><div className="admin-ops-record-value-v2">{formatDate(item.createdAt)}</div><AdminIcon name="chevron" size={17} /></article>)}</div><AdminPagination pagination={pagination} /></>}
      </article>

      <AdminModal open={Boolean(selected)} onClose={() => setSelected(null)} title={titleCase(selected?.action)} eyebrow="Audit record">
        {selected && <><AdminInfoGrid items={[{ label: "Administrator", value: selected.admin?.name || "Admin" }, { label: "Email", value: selected.admin?.email || "Not available" }, { label: "Target area", value: titleCase(selected.targetType) }, { label: "Target ID", value: selected.targetId || "Not available" }, { label: "Recorded", value: formatDate(selected.createdAt) }]} />{selected.note && <div className="admin-note-v2"><strong>Audit note</strong><p>{selected.note}</p></div>}</>}
      </AdminModal>
    </section>
  );
}
