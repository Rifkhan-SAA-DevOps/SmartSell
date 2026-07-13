import { useEffect, useMemo, useState } from "react";
import api from "../utils/api.js";
import "../styles/pages/admin/AdminWorkspace.css";
import "../styles/pages/admin/SEOSettings.css";

const seoSections = [
  {
    title: "Default SEO",
    icon: "⌕",
    description: "Control the fallback metadata used across SmartSell public pages.",
    keys: [
      "seo.defaultTitle",
      "seo.defaultDescription",
      "seo.titleTemplate",
      "seo.defaultKeywords",
      "seo.siteUrl",
      "seo.socialImageUrl",
      "seo.robotsIndex",
    ],
  },
  {
    title: "Social Sharing",
    icon: "↗",
    description: "Improve how links look when shared on WhatsApp, Facebook, LinkedIn, and X.",
    keys: [
      "seo.organizationName",
      "seo.organizationPhone",
      "seo.organizationEmail",
      "seo.localBusinessArea",
      "seo.twitterHandle",
    ],
  },
  {
    title: "Public Page SEO",
    icon: "▦",
    description: "Customize titles and descriptions for important public discovery pages.",
    keys: [
      "seo.marketplaceTitle",
      "seo.marketplaceDescription",
      "seo.servicesTitle",
      "seo.servicesDescription",
      "seo.storesTitle",
      "seo.storesDescription",
    ],
  },
];

function inputFor(setting, value, onChange) {
  if (setting.type === "boolean") {
    return (
      <label className="settings-switch seo-switch-inline">
        <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(setting.key, event.target.checked)} />
        <span>{Boolean(value) ? "Index public pages" : "Noindex public pages"}</span>
      </label>
    );
  }

  if (setting.type === "textarea") {
    return <textarea rows={4} value={value ?? ""} onChange={(event) => onChange(setting.key, event.target.value)} />;
  }

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
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/settings/admin");
      const rows = (data.data?.settings || []).filter((setting) => setting.group === "seo");
      setSettings(rows);
      setValues(rows.reduce((acc, setting) => ({ ...acc, [setting.key]: setting.value }), {}));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load SEO settings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSeoSettings();
  }, []);

  const settingsByKey = useMemo(() => {
    return settings.reduce((acc, setting) => ({ ...acc, [setting.key]: setting }), {});
  }, [settings]);

  const active = seoSections.find((section) => section.title === activeSection) || seoSections[0];

  function updateValue(key, value) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    const payload = Object.fromEntries(Object.entries(values).filter(([key]) => key.startsWith("seo.")));

    try {
      const { data } = await api.patch("/settings/admin", { settings: payload });
      const rows = (data.data?.settings || []).filter((setting) => setting.group === "seo");
      setSettings(rows);
      setValues(rows.reduce((acc, setting) => ({ ...acc, [setting.key]: setting.value }), {}));
      setMessage("SEO and social sharing settings saved successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save SEO settings.");
    } finally {
      setSaving(false);
    }
  }

  const previewTitle = String(values["seo.titleTemplate"] || "{title} | SmartSell").replace("{title}", values["seo.marketplaceTitle"] || "Marketplace Products");
  const previewDescription = values["seo.marketplaceDescription"] || values["seo.defaultDescription"] || "SmartSell marketplace description";
  const previewUrl = `${String(values["seo.siteUrl"] || "http://localhost:5174").replace(/\/$/, "")}/marketplace`;

  return (
    <section className="seo-settings-page page-section">
      <div className="management-page-header seo-manager-hero">
        <div>
          <span className="eyebrow">Admin SEO</span>
          <h1>SEO & Social Sharing</h1>
          <p>Control browser titles, meta descriptions, canonical URLs, Open Graph previews, and public page discovery settings for SmartSell.</p>
        </div>
        <a className="secondary-btn" href="/marketplace" target="_blank" rel="noreferrer">Preview Public Page</a>
      </div>

      {loading ? (
        <div className="empty-state-card">Loading SEO settings...</div>
      ) : (
        <div className="seo-manager-layout">
          <aside className="content-section-tabs seo-section-tabs" aria-label="SEO setting sections">
            {seoSections.map((section) => (
              <button
                key={section.title}
                type="button"
                className={section.title === activeSection ? "active" : ""}
                onClick={() => setActiveSection(section.title)}
              >
                <span>{section.icon}</span>
                <strong>{section.title}</strong>
                <small>{section.description}</small>
              </button>
            ))}
          </aside>

          <form className="content-edit-card seo-edit-card" onSubmit={handleSubmit}>
            {message && <div className="success-banner">{message}</div>}
            {error && <div className="error-banner">{error}</div>}

            <div className="content-edit-heading">
              <span>{active.icon}</span>
              <div>
                <h2>{active.title}</h2>
                <p>{active.description}</p>
              </div>
            </div>

            <div className="content-field-grid seo-field-grid">
              {active.keys.map((key) => {
                const setting = settingsByKey[key];
                if (!setting) return null;
                return (
                  <label className="content-field seo-field" key={key}>
                    <strong>{setting.label}</strong>
                    <small>{setting.description}</small>
                    {inputFor(setting, values[key], updateValue)}
                  </label>
                );
              })}
            </div>

            <div className="seo-preview-card">
              <span className="eyebrow">Google / social preview</span>
              <h3>{previewTitle}</h3>
              <p>{previewDescription}</p>
              <small>{previewUrl}</small>
              <div className="seo-social-preview">
                <div className="seo-preview-image">OG</div>
                <div>
                  <strong>{previewTitle}</strong>
                  <span>{values["seo.organizationName"] || "SmartSell"}</span>
                </div>
              </div>
            </div>

            <div className="settings-sticky-actions">
              <button type="button" className="secondary-btn" onClick={loadSeoSettings} disabled={saving}>Reset</button>
              <button type="submit" className="primary-btn" disabled={saving}>{saving ? "Saving..." : "Save SEO Settings"}</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
