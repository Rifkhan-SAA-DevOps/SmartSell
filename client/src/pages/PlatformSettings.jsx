import { useEffect, useMemo, useState } from "react";
import api from "../utils/api.js";
import "../styles/pages/admin/AdminWorkspace.css";
import "../styles/pages/admin/PlatformSettings.css";

const groupLabels = {
  general: { title: "General Business", icon: "◈", hint: "Brand, support, and marketplace identity." },
  marketplace: { title: "Marketplace Rules", icon: "▦", hint: "Commission, stock, offers, and approval behavior." },
  orders: { title: "Orders & Delivery", icon: "▣", hint: "Checkout, COD, delivery notice, and order rules." },
  requests: { title: "Request Anything", icon: "◇", hint: "Quotation rules and urgent request behavior." },
  content: { title: "Public Content", icon: "✦", hint: "Homepage and public announcement copy." },
  seo: { title: "SEO & Sharing", icon: "⌕", hint: "Meta titles, descriptions, canonical URLs, and social preview settings." },
};

function SettingInput({ setting, value, onChange }) {
  if (setting.type === "boolean") {
    return (
      <label className="settings-switch">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(setting.key, event.target.checked)}
        />
        <span>{Boolean(value) ? "Enabled" : "Disabled"}</span>
      </label>
    );
  }

  if (setting.type === "textarea") {
    return (
      <textarea
        value={value ?? ""}
        onChange={(event) => onChange(setting.key, event.target.value)}
        rows={4}
      />
    );
  }

  if (setting.type === "number") {
    return (
      <input
        type="number"
        min={setting.min ?? undefined}
        max={setting.max ?? undefined}
        value={value ?? 0}
        onChange={(event) => onChange(setting.key, event.target.value)}
      />
    );
  }

  return (
    <input
      type="text"
      value={value ?? ""}
      onChange={(event) => onChange(setting.key, event.target.value)}
    />
  );
}

export default function PlatformSettings() {
  const [settings, setSettings] = useState([]);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadSettings() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/settings/admin");
      const rows = data.data?.settings || [];
      setSettings(rows);
      setValues(rows.reduce((acc, setting) => ({ ...acc, [setting.key]: setting.value }), {}));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load platform settings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  const groups = useMemo(() => {
    return settings.reduce((acc, setting) => {
      if (!acc[setting.group]) acc[setting.group] = [];
      acc[setting.group].push(setting);
      return acc;
    }, {});
  }, [settings]);

  function updateValue(key, value) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const { data } = await api.patch("/settings/admin", { settings: values });
      const rows = data.data?.settings || [];
      setSettings(rows);
      setValues(rows.reduce((acc, setting) => ({ ...acc, [setting.key]: setting.value }), {}));
      setMessage("Platform settings saved successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  const commissionRate = Number(values["marketplace.commissionRate"] || 0);
  const sellerRate = Math.max(0, 100 - commissionRate);

  return (
    <section className="settings-page page-section">
      <div className="management-page-header settings-header-card">
        <div>
          <span className="eyebrow">Admin settings</span>
          <h1>Platform Settings</h1>
          <p>Control SmartSell rules, commission, support details, public content, and request behavior from one admin page.</p>
        </div>
        <div className="settings-rate-card">
          <span>Current split</span>
          <strong>{commissionRate}% / {sellerRate}%</strong>
          <small>SmartSell commission / seller earning</small>
        </div>
      </div>

      {loading ? (
        <div className="empty-state-card">Loading settings...</div>
      ) : (
        <form className="settings-form" onSubmit={handleSubmit}>
          {message && <div className="success-banner">{message}</div>}
          {error && <div className="error-banner">{error}</div>}

          {Object.entries(groups).map(([group, rows]) => {
            const meta = groupLabels[group] || { title: group, icon: "◦", hint: "Platform controls." };
            return (
              <section className="settings-group-card" key={group}>
                <div className="settings-group-title">
                  <span className="settings-group-icon">{meta.icon}</span>
                  <div>
                    <h2>{meta.title}</h2>
                    <p>{meta.hint}</p>
                  </div>
                </div>

                <div className="settings-grid">
                  {rows.map((setting) => (
                    <label className="settings-field" key={setting.key}>
                      <span className="settings-label-row">
                        <strong>{setting.label}</strong>
                        {setting.isPublic && <em>Public</em>}
                      </span>
                      <small>{setting.description}</small>
                      <SettingInput setting={setting} value={values[setting.key]} onChange={updateValue} />
                    </label>
                  ))}
                </div>
              </section>
            );
          })}

          <div className="settings-sticky-actions">
            <button type="button" className="secondary-btn" onClick={loadSettings} disabled={saving}>Reset</button>
            <button type="submit" className="primary-btn" disabled={saving}>{saving ? "Saving..." : "Save Settings"}</button>
          </div>
        </form>
      )}
    </section>
  );
}
