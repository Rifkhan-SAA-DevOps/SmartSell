import { useEffect, useMemo, useState } from "react";
import { AdminIcon, AdminPageHeader } from "../components/AdminWorkspaceUi.jsx";
import api from "../utils/api.js";
import "../styles/pages/admin/AdminWorkspaceV2.css";
import "../styles/pages/admin/AdminOperations.css";

const groupLabels = {
  general: { title: "General Business", icon: "store", hint: "Brand, support, and marketplace identity." },
  marketplace: { title: "Marketplace Rules", icon: "list", hint: "Commission, stock, offers, and approval behaviour." },
  orders: { title: "Orders & Delivery", icon: "order", hint: "Checkout, COD, delivery notice, and order rules." },
  requests: { title: "Request Anything", icon: "request", hint: "Quotation rules and urgent request behaviour." },
  content: { title: "Public Content", icon: "spark", hint: "Homepage and public announcement copy." },
  seo: { title: "SEO & Sharing", icon: "search", hint: "Meta titles, canonical URLs, and social preview settings." },
};

function SettingInput({ setting, value, onChange }) {
  if (setting.type === "boolean") return <label className="admin-toggle-field-v2"><input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(setting.key, event.target.checked)} /><span><b />{Boolean(value) ? "Enabled" : "Disabled"}</span></label>;
  if (setting.type === "textarea") return <textarea value={value ?? ""} onChange={(event) => onChange(setting.key, event.target.value)} rows="4" />;
  if (setting.type === "number") return <input type="number" min={setting.min ?? undefined} max={setting.max ?? undefined} value={value ?? 0} onChange={(event) => onChange(setting.key, event.target.value)} />;
  return <input type="text" value={value ?? ""} onChange={(event) => onChange(setting.key, event.target.value)} />;
}

export default function PlatformSettings() {
  const [settings, setSettings] = useState([]);
  const [values, setValues] = useState({});
  const [activeGroup, setActiveGroup] = useState("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadSettings() {
    setLoading(true); setError("");
    try {
      const { data } = await api.get("/settings/admin");
      const rows = (data.data?.settings || []).filter((setting) => setting.type !== "json");
      setSettings(rows); setValues(rows.reduce((acc, setting) => ({ ...acc, [setting.key]: setting.value }), {}));
      if (rows.length && !rows.some((setting) => setting.group === activeGroup)) setActiveGroup(rows[0].group);
    } catch (err) { setError(err.response?.data?.message || "Failed to load platform settings."); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadSettings(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const groups = useMemo(() => settings.reduce((acc, setting) => { if (!acc[setting.group]) acc[setting.group] = []; acc[setting.group].push(setting); return acc; }, {}), [settings]);
  const activeRows = groups[activeGroup] || [];
  const meta = groupLabels[activeGroup] || { title: activeGroup, icon: "settings", hint: "Platform controls." };
  const commissionRate = Number(values["marketplace.commissionRate"] || 0);
  const sellerRate = Math.max(0, 100 - commissionRate);

  async function handleSubmit(event) {
    event.preventDefault(); setSaving(true); setMessage(""); setError("");
    try {
      const { data } = await api.patch("/settings/admin", { settings: values });
      const rows = (data.data?.settings || []).filter((setting) => setting.type !== "json");
      setSettings(rows); setValues(rows.reduce((acc, setting) => ({ ...acc, [setting.key]: setting.value }), {})); setMessage("Platform settings saved successfully.");
    } catch (err) { setError(err.response?.data?.message || "Failed to save settings."); }
    finally { setSaving(false); }
  }

  return (
    <section className="admin-workspace-v2 admin-operations-page-v2 admin-editor-page-v2 admin-settings-v2">
      <AdminPageHeader eyebrow="Platform control" title="Platform settings" description="Control marketplace rules, commission, order behaviour, requests, support information, public content, and SEO from one structured administration area." meta={<><span>SmartSell commission: {commissionRate}%</span><span>Seller earning: {sellerRate}%</span></>} />
      {message && <div className="admin-alert-v2 success">{message}</div>}
      {error && <div className="admin-alert-v2 error">{error}</div>}
      {loading ? <div className="admin-ops-loading-v2">Loading platform settings...</div> : (
        <div className="admin-editor-layout-v2 settings-layout">
          <aside className="admin-editor-nav-v2" aria-label="Platform setting groups">
            <div className="admin-settings-split-v2"><span>Current revenue split</span><strong>{commissionRate}% <i /> {sellerRate}%</strong><small>SmartSell / seller</small></div>
            <div className="admin-editor-nav-head-v2"><span>Setting groups</span><strong>{Object.keys(groups).length}</strong></div>
            {Object.keys(groups).map((group) => { const item = groupLabels[group] || { title: group, icon: "settings", hint: "Platform controls." }; return <button key={group} type="button" className={group === activeGroup ? "active" : ""} onClick={() => setActiveGroup(group)}><span><AdminIcon name={item.icon} size={18} /></span><div><strong>{item.title}</strong><small>{groups[group].length} controls · {item.hint}</small></div><AdminIcon name="chevron" size={16} /></button>; })}
          </aside>
          <form className="admin-panel-v2 admin-editor-form-v2 admin-form-v2" onSubmit={handleSubmit}>
            <div className="admin-editor-form-head-v2"><span className="admin-ops-record-icon-v2 tone-violet"><AdminIcon name={meta.icon} /></span><div><span className="admin-ops-eyebrow-v2">Active setting group</span><h2>{meta.title}</h2><p>{meta.hint}</p></div></div>
            <div className="admin-settings-grid-v2">
              {activeRows.map((setting) => <label key={setting.key} className={setting.type === "textarea" ? "wide" : ""}><span><strong>{setting.label}</strong>{setting.isPublic && <em>Public</em>}</span><small>{setting.description}</small><SettingInput setting={setting} value={values[setting.key]} onChange={(key, value) => setValues((current) => ({ ...current, [key]: value }))} /></label>)}
            </div>
            <div className="admin-settings-guidance-v2"><AdminIcon name="shield" size={20} /><div><strong>Save carefully</strong><p>These controls can change checkout, commissions, public content, and marketplace behaviour. Review affected values before publishing.</p></div></div>
            <div className="admin-editor-actions-v2"><button type="button" className="admin-ghost-button-v2" onClick={loadSettings} disabled={saving}>Reset changes</button><button type="submit" className="admin-primary-button-v2" disabled={saving}>{saving ? "Saving..." : "Save platform settings"}</button></div>
          </form>
        </div>
      )}
    </section>
  );
}
