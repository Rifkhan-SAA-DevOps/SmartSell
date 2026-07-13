import { useEffect, useMemo, useState } from "react";
import { AdminIcon, AdminPageHeader } from "../components/AdminWorkspaceUi.jsx";
import api from "../utils/api.js";
import "../styles/pages/admin/AdminWorkspaceV2.css";
import "../styles/pages/admin/AdminOperations.css";

const contentSections = [
  { title: "Hero Area", icon: "spark", description: "Control the first impression customers see on the homepage.", keys: ["content.heroBadge", "content.heroTitle", "content.heroSubtitle", "content.heroPrimaryButtonText", "content.heroPrimaryButtonLink", "content.heroSecondaryButtonText", "content.heroSecondaryButtonLink", "content.heroFloatingOne", "content.heroFloatingTwo", "content.heroFloatingThree"] },
  { title: "Homepage Stats", icon: "report", description: "Small trust numbers shown under the hero message.", keys: ["content.statOneValue", "content.statOneLabel", "content.statTwoValue", "content.statTwoLabel", "content.statThreeValue", "content.statThreeLabel"] },
  { title: "Public Sections", icon: "list", description: "Headings and descriptions for products, services, and business models.", keys: ["content.businessModelEyebrow", "content.businessModelTitle", "content.businessModelDescription", "content.productsEyebrow", "content.productsTitle", "content.productsDescription", "content.servicesEyebrow", "content.servicesTitle", "content.servicesDescription"] },
  { title: "Request Anything", icon: "request", description: "Control the custom-request promotion and example ideas.", keys: ["content.requestEyebrow", "content.requestTitle", "content.requestDescription", "content.requestButtonText", "content.requestExamples"] },
  { title: "Announcement", icon: "alert", description: "Optional public announcement shown on the homepage.", keys: ["content.publicAnnouncement"] },
];

function ContentInput({ setting, value, onChange }) {
  if (setting.type === "textarea") return <textarea value={value ?? ""} onChange={(event) => onChange(setting.key, event.target.value)} rows={setting.key === "content.requestExamples" ? 7 : 4} placeholder={setting.key === "content.requestExamples" ? "One example per line" : "Write content..."} />;
  return <input type="text" value={value ?? ""} onChange={(event) => onChange(setting.key, event.target.value)} placeholder="Enter content" />;
}

export default function ContentManagement() {
  const [settings, setSettings] = useState([]);
  const [values, setValues] = useState({});
  const [activeSection, setActiveSection] = useState("Hero Area");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadContent() {
    setLoading(true); setError("");
    try {
      const { data } = await api.get("/settings/admin");
      const rows = (data.data?.settings || []).filter((setting) => setting.group === "content");
      setSettings(rows); setValues(rows.reduce((acc, setting) => ({ ...acc, [setting.key]: setting.value }), {}));
    } catch (err) { setError(err.response?.data?.message || "Failed to load homepage content."); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadContent(); }, []);

  const settingsByKey = useMemo(() => settings.reduce((acc, setting) => ({ ...acc, [setting.key]: setting }), {}), [settings]);
  const active = contentSections.find((section) => section.title === activeSection) || contentSections[0];
  const previewExamples = String(values["content.requestExamples"] || "").split("\n").map((item) => item.trim()).filter(Boolean).slice(0, 4);

  async function handleSubmit(event) {
    event.preventDefault(); setSaving(true); setMessage(""); setError("");
    try {
      const payload = Object.fromEntries(Object.entries(values).filter(([key]) => key.startsWith("content.")));
      const { data } = await api.patch("/settings/admin", { settings: payload });
      const rows = (data.data?.settings || []).filter((setting) => setting.group === "content");
      setSettings(rows); setValues(rows.reduce((acc, setting) => ({ ...acc, [setting.key]: setting.value }), {})); setMessage("Homepage content saved successfully.");
    } catch (err) { setError(err.response?.data?.message || "Failed to save homepage content."); }
    finally { setSaving(false); }
  }

  return (
    <section className="admin-workspace-v2 admin-operations-page-v2 admin-editor-page-v2">
      <AdminPageHeader eyebrow="Public experience" title="Homepage content manager" description="Update hero copy, calls to action, public section headings, request examples, and announcements without editing application code." actions={<a className="admin-secondary-button-v2" href="/" target="_blank" rel="noreferrer"><AdminIcon name="arrow" size={17} />Preview homepage</a>} meta={<span>{settings.length} managed content fields</span>} />
      {message && <div className="admin-alert-v2 success">{message}</div>}
      {error && <div className="admin-alert-v2 error">{error}</div>}
      {loading ? <div className="admin-ops-loading-v2">Loading homepage content...</div> : (
        <div className="admin-editor-layout-v2">
          <aside className="admin-editor-nav-v2" aria-label="Homepage content sections">
            <div className="admin-editor-nav-head-v2"><span>Content sections</span><strong>{contentSections.length}</strong></div>
            {contentSections.map((section) => <button key={section.title} type="button" className={section.title === activeSection ? "active" : ""} onClick={() => setActiveSection(section.title)}><span><AdminIcon name={section.icon} size={18} /></span><div><strong>{section.title}</strong><small>{section.description}</small></div><AdminIcon name="chevron" size={16} /></button>)}
          </aside>
          <form className="admin-panel-v2 admin-editor-form-v2 admin-form-v2" onSubmit={handleSubmit}>
            <div className="admin-editor-form-head-v2"><span className="admin-ops-record-icon-v2 tone-blue"><AdminIcon name={active.icon} /></span><div><span className="admin-ops-eyebrow-v2">Active section</span><h2>{active.title}</h2><p>{active.description}</p></div></div>
            <div className="admin-editor-fields-v2">
              {active.keys.map((key) => { const setting = settingsByKey[key]; if (!setting) return null; return <label key={key}><span><strong>{setting.label}</strong>{setting.isPublic && <em>Public</em>}</span><small>{setting.description}</small><ContentInput setting={setting} value={values[key]} onChange={(settingKey, value) => setValues((current) => ({ ...current, [settingKey]: value }))} /></label>; })}
            </div>
            <div className="admin-content-preview-v2">
              <div><span>{values["content.heroBadge"] || "SmartSell marketplace"}</span><h3>{values["content.heroTitle"] || "Homepage title"}</h3><p>{values["content.heroSubtitle"] || "Homepage subtitle"}</p><div><b>{values["content.heroPrimaryButtonText"] || "Primary action"}</b><b>{values["content.heroSecondaryButtonText"] || "Secondary action"}</b></div></div>
              {!!previewExamples.length && <aside>{previewExamples.map((example) => <span key={example}>{example}</span>)}</aside>}
            </div>
            <div className="admin-editor-actions-v2"><button type="button" className="admin-ghost-button-v2" onClick={loadContent} disabled={saving}>Reset changes</button><button type="submit" className="admin-primary-button-v2" disabled={saving}>{saving ? "Saving..." : "Save homepage content"}</button></div>
          </form>
        </div>
      )}
    </section>
  );
}
