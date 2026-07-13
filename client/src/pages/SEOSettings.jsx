import { useEffect, useMemo, useState } from "react";
import { AdminIcon, AdminPageHeader } from "../components/AdminWorkspaceUi.jsx";
import api from "../utils/api.js";
import "../styles/pages/admin/AdminWorkspaceV2.css";
import "../styles/pages/admin/AdminOperations.css";

const seoSections = [
  { title: "Default SEO", icon: "search", description: "Fallback metadata used across SmartSell public pages.", keys: ["seo.defaultTitle", "seo.defaultDescription", "seo.titleTemplate", "seo.defaultKeywords", "seo.siteUrl", "seo.socialImageUrl", "seo.robotsIndex"] },
  { title: "Social Sharing", icon: "arrow", description: "WhatsApp, Facebook, LinkedIn, and X link-sharing identity.", keys: ["seo.organizationName", "seo.organizationPhone", "seo.organizationEmail", "seo.localBusinessArea", "seo.twitterHandle"] },
  { title: "Public Page SEO", icon: "list", description: "Titles and descriptions for important discovery pages.", keys: ["seo.marketplaceTitle", "seo.marketplaceDescription", "seo.servicesTitle", "seo.servicesDescription", "seo.storesTitle", "seo.storesDescription"] },
];

function SeoInput({ setting, value, onChange }) {
  if (setting.type === "boolean") return <label className="admin-toggle-field-v2"><input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(setting.key, event.target.checked)} /><span><b />{Boolean(value) ? "Index public pages" : "Noindex public pages"}</span></label>;
  if (setting.type === "textarea") return <textarea rows="4" value={value ?? ""} onChange={(event) => onChange(setting.key, event.target.value)} />;
  return <input type="text" value={value ?? ""} onChange={(event) => onChange(setting.key, event.target.value)} />;
}

export default function SEOSettings() {
  const [settings, setSettings] = useState([]);
  const [values, setValues] = useState({});
  const [activeSection, setActiveSection] = useState("Default SEO");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadSeoSettings() {
    setLoading(true); setError("");
    try {
      const { data } = await api.get("/settings/admin");
      const rows = (data.data?.settings || []).filter((setting) => setting.group === "seo");
      setSettings(rows); setValues(rows.reduce((acc, setting) => ({ ...acc, [setting.key]: setting.value }), {}));
    } catch (err) { setError(err.response?.data?.message || "Failed to load SEO settings."); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadSeoSettings(); }, []);

  const settingsByKey = useMemo(() => settings.reduce((acc, setting) => ({ ...acc, [setting.key]: setting }), {}), [settings]);
  const active = seoSections.find((section) => section.title === activeSection) || seoSections[0];
  const previewTitle = String(values["seo.titleTemplate"] || "{title} | SmartSell").replace("{title}", values["seo.marketplaceTitle"] || "Marketplace Products");
  const previewDescription = values["seo.marketplaceDescription"] || values["seo.defaultDescription"] || "SmartSell marketplace description";
  const previewUrl = `${String(values["seo.siteUrl"] || "http://localhost:5174").replace(/\/$/, "")}/marketplace`;

  async function handleSubmit(event) {
    event.preventDefault(); setSaving(true); setMessage(""); setError("");
    try {
      const payload = Object.fromEntries(Object.entries(values).filter(([key]) => key.startsWith("seo.")));
      const { data } = await api.patch("/settings/admin", { settings: payload });
      const rows = (data.data?.settings || []).filter((setting) => setting.group === "seo");
      setSettings(rows); setValues(rows.reduce((acc, setting) => ({ ...acc, [setting.key]: setting.value }), {})); setMessage("SEO and social sharing settings saved successfully.");
    } catch (err) { setError(err.response?.data?.message || "Failed to save SEO settings."); }
    finally { setSaving(false); }
  }

  return (
    <section className="admin-workspace-v2 admin-operations-page-v2 admin-editor-page-v2 admin-seo-v2">
      <AdminPageHeader eyebrow="Search visibility" title="SEO & social sharing" description="Control search metadata, canonical URLs, indexing behaviour, organization identity, and social link previews from one structured editor." actions={<a className="admin-secondary-button-v2" href="/marketplace" target="_blank" rel="noreferrer"><AdminIcon name="arrow" size={17} />Preview marketplace</a>} meta={<><span>{values["seo.robotsIndex"] ? "Public indexing enabled" : "Public indexing disabled"}</span><span>{values["seo.siteUrl"] || "Site URL not configured"}</span></>} />
      {message && <div className="admin-alert-v2 success">{message}</div>}
      {error && <div className="admin-alert-v2 error">{error}</div>}
      {loading ? <div className="admin-ops-loading-v2">Loading SEO settings...</div> : (
        <div className="admin-editor-layout-v2">
          <aside className="admin-editor-nav-v2" aria-label="SEO setting sections">
            <div className="admin-editor-nav-head-v2"><span>SEO sections</span><strong>{seoSections.length}</strong></div>
            {seoSections.map((section) => <button key={section.title} type="button" className={section.title === activeSection ? "active" : ""} onClick={() => setActiveSection(section.title)}><span><AdminIcon name={section.icon} size={18} /></span><div><strong>{section.title}</strong><small>{section.description}</small></div><AdminIcon name="chevron" size={16} /></button>)}
          </aside>
          <form className="admin-panel-v2 admin-editor-form-v2 admin-form-v2" onSubmit={handleSubmit}>
            <div className="admin-editor-form-head-v2"><span className="admin-ops-record-icon-v2 tone-cyan"><AdminIcon name={active.icon} /></span><div><span className="admin-ops-eyebrow-v2">Active section</span><h2>{active.title}</h2><p>{active.description}</p></div></div>
            <div className="admin-editor-fields-v2">
              {active.keys.map((key) => { const setting = settingsByKey[key]; if (!setting) return null; return <label key={key}><span><strong>{setting.label}</strong>{setting.isPublic && <em>Public</em>}</span><small>{setting.description}</small><SeoInput setting={setting} value={values[key]} onChange={(settingKey, value) => setValues((current) => ({ ...current, [settingKey]: value }))} /></label>; })}
            </div>
            <div className="admin-seo-preview-v2">
              <span className="admin-ops-eyebrow-v2">Search and social preview</span>
              <div className="admin-google-preview-v2"><small>{previewUrl}</small><h3>{previewTitle}</h3><p>{previewDescription}</p></div>
              <div className="admin-social-preview-v2"><div>{values["seo.socialImageUrl"] ? <img src={values["seo.socialImageUrl"]} alt="Social preview" /> : <span>OG</span>}</div><section><small>{values["seo.organizationName"] || "SmartSell"}</small><strong>{previewTitle}</strong><p>{previewDescription}</p></section></div>
            </div>
            <div className="admin-editor-actions-v2"><button type="button" className="admin-ghost-button-v2" onClick={loadSeoSettings} disabled={saving}>Reset changes</button><button type="submit" className="admin-primary-button-v2" disabled={saving}>{saving ? "Saving..." : "Save SEO settings"}</button></div>
          </form>
        </div>
      )}
    </section>
  );
}
