import { useId } from "react";
import { createPortal } from "react-dom";
import useAccessibleDialog from "../hooks/useAccessibleDialog.js";

const ICON_PATHS = {
  add: "M12 5v14M5 12h14",
  arrow: "M5 12h14M13 6l6 6-6 6",
  box: "M21 8 12 3 3 8l9 5 9-5ZM3 8v9l9 5 9-5V8M12 13v9",
  briefcase: "M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M4 7h16a2 2 0 0 1 2 2v10H2V9a2 2 0 0 1 2-2Zm-2 5h20M10 12v2h4v-2",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  check: "m5 12 4 4L19 6",
  chevron: "m9 6 6 6-6 6",
  close: "m6 6 12 12M18 6 6 18",
  edit: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4L16.5 3.5Z",
  filter: "M4 5h16M7 12h10M10 19h4",
  image: "M4 5h16v14H4zM8 11l2.5 2.5L14 9l4 6H6l2-4ZM8 8h.01",
  inventory: "M4 6h16v14H4zM8 2h8v4H8zM8 11h8M8 15h5",
  alert: "M12 3 2.5 20h19L12 3Zm0 6v5m0 3h.01",
  calendar: "M6 2v4M18 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z",
  camera: "M4 7h3l2-3h6l2 3h3a2 2 0 0 1 2 2v10H2V9a2 2 0 0 1 2-2Zm8 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-15v6l4 2",
  download: "M12 3v12m0 0 5-5m-5 5-5-5M5 21h14",
  history: "M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2",
  layers: "m12 3 9 5-9 5-9-5 9-5Zm9 10-9 5-9-5m18 5-9 5-9-5",
  location: "M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Zm-8 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  message: "M21 15a4 4 0 0 1-4 4H8l-5 3v-3a4 4 0 0 1-2-4V7a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v8Z",
  percent: "M19 5 5 19M7 5h.01M17 19h.01",
  phone: "M22 16.9v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6 6l1.27-1.28a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.9Z",
  refresh: "M20 11a8 8 0 1 0 2 5M20 4v7h-7",
  star: "m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z",
  tag: "M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8ZM7 7h.01",
  trend: "M3 17 9 11l4 4 8-8M15 7h6v6",
  upload: "M12 16V4m0 0-5 5m5-5 5 5M5 20h14",
  wallet: "M3 6h16a2 2 0 0 1 2 2v11H3V6Zm0 0V4h14v2m4 5h-5a2 2 0 0 0 0 4h5v-4Z",
  money: "M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H7",
  order: "M6 3h12v18H6zM9 8h6M9 12h6M9 16h4",
  request: "M7 3h10l4 4v14H7zM17 3v5h5M10 13h8M10 17h5",
  search: "m21 21-4.4-4.4M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z",
  service: "M14.7 6.3a4 4 0 0 0 5 5L12 19l-4-4 7.7-7.7ZM7.5 14.5 5 17l2 2 2.5-2.5",
  spark: "m12 3 1.4 4.6L18 9l-4.6 1.4L12 15l-1.4-4.6L6 9l4.6-1.4L12 3ZM19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z",
  store: "M4 10h16l-1.2-5H5.2L4 10ZM5 10v9h14v-9M9 19v-5h6v5",
  user: "M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z",
};

export function BusinessIcon({ name = "briefcase", size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={ICON_PATHS[name] || ICON_PATHS.briefcase} />
    </svg>
  );
}

export function BusinessPageHeader({ eyebrow, title, description, actions, meta }) {
  return (
    <header className="business-page-header-v2">
      <div className="business-page-header-copy">
        {eyebrow && <span className="business-page-eyebrow"><BusinessIcon name="spark" size={15} />{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
        {meta && <div className="business-page-meta">{meta}</div>}
      </div>
      {actions && <div className="business-page-header-actions">{actions}</div>}
    </header>
  );
}

export function BusinessMetricCard({ icon, label, value, note, tone = "blue" }) {
  return (
    <article className={`business-metric-v2 tone-${tone}`}>
      <span className="business-metric-icon"><BusinessIcon name={icon} /></span>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        {note && <small>{note}</small>}
      </div>
    </article>
  );
}

export function BusinessStatusBadge({ status }) {
  const normalized = String(status || "neutral").toLowerCase().replaceAll("_", "-");
  const text = String(status || "Unknown").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  return <span className={`business-status-v2 status-${normalized}`}>{text}</span>;
}

export function BusinessEmptyState({ icon = "box", title, description, action }) {
  return (
    <div className="business-empty-v2">
      <span><BusinessIcon name={icon} size={26} /></span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function BusinessModal({ open, title, eyebrow, onClose, children, footer, size = "large" }) {
  const titleId = useId();
  const dialogRef = useAccessibleDialog({ open, onClose });

  if (!open) return null;

  return createPortal(
    <div className="business-modal-layer-v2" role="presentation">
      <button className="business-modal-backdrop-v2" type="button" aria-label="Close details" onClick={onClose} />
      <section
        ref={dialogRef}
        className={`business-modal-v2 size-${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header>
          <div>
            {eyebrow && <span>{eyebrow}</span>}
            <h2 id={titleId}>{title}</h2>
          </div>
          <button className="business-modal-close-v2" type="button" onClick={onClose} aria-label="Close modal">
            <BusinessIcon name="close" />
          </button>
        </header>
        <div className="business-modal-body-v2">{children}</div>
        {footer && <footer>{footer}</footer>}
      </section>
    </div>,
    document.body
  );
}

export function BusinessSearchToolbar({ value, onChange, placeholder, filter, filterLabel = "Filter", children }) {
  return (
    <div className="business-toolbar-v2">
      <label className="business-search-v2">
        <BusinessIcon name="search" size={18} />
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      </label>
      {filter && (
        <label className="business-filter-v2">
          <BusinessIcon name="filter" size={17} />
          <span className="sr-only">{filterLabel}</span>
          {filter}
        </label>
      )}
      {children}
    </div>
  );
}

export function BusinessInfoGrid({ items }) {
  return (
    <div className="business-info-grid-v2">
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`}>
          <span>{item.label}</span>
          <strong>{item.value ?? "—"}</strong>
        </div>
      ))}
    </div>
  );
}
