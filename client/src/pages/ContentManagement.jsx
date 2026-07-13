import { useEffect, useMemo, useState } from "react";
import api from "../utils/api.js";
import "../styles/pages/admin/AdminWorkspace.css";
import "../styles/pages/admin/ContentManagement.css";

const contentSections = [
  {
    title: "Hero Area",
    icon: "✦",
    description: "Control the first impression customers see on the homepage.",
    keys: [
      "content.heroBadge",
      "content.heroTitle",
      "content.heroSubtitle",
      "content.heroPrimaryButtonText",
      "content.heroPrimaryButtonLink",
      "content.heroSecondaryButtonText",
      "content.heroSecondaryButtonLink",
      "content.heroFloatingOne",
      "content.heroFloatingTwo",
      "content.heroFloatingThree",
    ],
  },
  {
    title: "Homepage Stats",
    icon: "▣",
    description: "Small trust numbers shown under the hero message.",
    keys: [
      "content.statOneValue",
      "content.statOneLabel",
      "content.statTwoValue",
      "content.statTwoLabel",
      "content.statThreeValue",
      "content.statThreeLabel",
    ],
  },
  {
    title: "Public Sections",
    icon: "◇",
    description: "Headings and descriptions for the product, service, and business-model sections.",
    keys: [
      "content.businessModelEyebrow",
      "content.businessModelTitle",
      "content.businessModelDescription",
      "content.productsEyebrow",
      "content.productsTitle",
      "content.productsDescription",
      "content.servicesEyebrow",
      "content.servicesTitle",
      "content.servicesDescription",
    ],
  },
  {
    title: "Request Anything Block",
    icon: "☑",
    description: "Control the strongest SmartSell public feature: custom request examples and copy.",
    keys: [
      "content.requestEyebrow",
      "content.requestTitle",
      "content.requestDescription",
      "content.requestButtonText",
      "content.requestExamples",
    ],
  },
  {
    title: "Announcement",
    icon: "!",
    description: "Optional public announcement banner shown on the homepage.",
    keys: ["content.publicAnnouncement"],
  },
];

function inputFor(setting, value, onChange) {
  if (setting.type === "textarea") {
    return (
      <textarea
        value={value ?? ""}
        onChange={(event) => onChange(setting.key, event.target.value)}
        rows={setting.key === "content.requestExamples" ? 7 : 4}
        placeholder={setting.key === "content.requestExamples" ? "One example per line" : "Write content..."}
      />
    );
  }

  return (
    <input
      type="text"
      value={value ?? ""}
      onChange={(event) => onChange(setting.key, event.target.value)}
      placeholder="Enter content"
    />
  );
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
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/settings/admin");
      const rows = (data.data?.settings || []).filter((setting) => setting.group === "content");
      setSettings(rows);
      setValues(rows.reduce((acc, setting) => ({ ...acc, [setting.key]: setting.value }), {}));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load homepage content.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadContent();
  }, []);

  const settingsByKey = useMemo(() => {
    return settings.reduce((acc, setting) => ({ ...acc, [setting.key]: setting }), {});
  }, [settings]);

  const active = contentSections.find((section) => section.title === activeSection) || contentSections[0];

  function updateValue(key, value) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    const payload = Object.fromEntries(Object.entries(values).filter(([key]) => key.startsWith("content.")));

    try {
      const { data } = await api.patch("/settings/admin", { settings: payload });
      const rows = (data.data?.settings || []).filter((setting) => setting.group === "content");
      setSettings(rows);
      setValues(rows.reduce((acc, setting) => ({ ...acc, [setting.key]: setting.value }), {}));
      setMessage("Homepage content saved successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save homepage content.");
    } finally {
      setSaving(false);
    }
  }

  const previewExamples = String(values["content.requestExamples"] || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4);

  return (
    <section className="content-manager-page page-section">
      <div className="management-page-header content-manager-hero">
        <div>
          <span className="eyebrow">Admin content</span>
          <h1>Homepage Content Manager</h1>
          <p>Update SmartSell public homepage copy, hero buttons, stat cards, announcement text, and Request Anything examples without touching code.</p>
        </div>
        <a className="secondary-btn" href="/" target="_blank" rel="noreferrer">Preview Homepage</a>
      </div>

      {loading ? (
        <div className="empty-state-card">Loading homepage content...</div>
      ) : (
        <div className="content-manager-layout">
          <aside className="content-section-tabs" aria-label="Homepage content sections">
            {contentSections.map((section) => (
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

          <form className="content-edit-card" onSubmit={handleSubmit}>
            {message && <div className="success-banner">{message}</div>}
            {error && <div className="error-banner">{error}</div>}

            <div className="content-edit-heading">
              <span>{active.icon}</span>
              <div>
                <h2>{active.title}</h2>
                <p>{active.description}</p>
              </div>
            </div>

            <div className="content-field-grid">
              {active.keys.map((key) => {
                const setting = settingsByKey[key];
                if (!setting) return null;
                return (
                  <label className="content-field" key={key}>
                    <strong>{setting.label}</strong>
                    <small>{setting.description}</small>
                    {inputFor(setting, values[key], updateValue)}
                  </label>
                );
              })}
            </div>

            <div className="content-preview-card">
              <div>
                <span className="eyebrow">Live content preview</span>
                <h3>{values["content.heroTitle"] || "Homepage title"}</h3>
                <p>{values["content.heroSubtitle"] || "Homepage subtitle"}</p>
              </div>
              <div className="content-preview-actions">
                <span>{values["content.heroPrimaryButtonText"] || "Primary"}</span>
                <span>{values["content.heroSecondaryButtonText"] || "Secondary"}</span>
              </div>
              {!!previewExamples.length && (
                <div className="content-preview-examples">
                  {previewExamples.map((example) => <em key={example}>“{example}”</em>)}
                </div>
              )}
            </div>

            <div className="settings-sticky-actions">
              <button type="button" className="secondary-btn" onClick={loadContent} disabled={saving}>Reset</button>
              <button type="submit" className="primary-btn" disabled={saving}>{saving ? "Saving..." : "Save Homepage Content"}</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
