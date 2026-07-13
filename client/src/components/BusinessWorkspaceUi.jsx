import { useEffect } from "react";

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
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="business-modal-layer-v2" role="presentation">
      <button className="business-modal-backdrop-v2" type="button" aria-label="Close details" onClick={onClose} />
      <section className={`business-modal-v2 size-${size}`} role="dialog" aria-modal="true" aria-label={title}>
        <header>
          <div>
            {eyebrow && <span>{eyebrow}</span>}
            <h2>{title}</h2>
          </div>
          <button className="business-modal-close-v2" type="button" onClick={onClose} aria-label="Close modal">
            <BusinessIcon name="close" />
          </button>
        </header>
        <div className="business-modal-body-v2">{children}</div>
        {footer && <footer>{footer}</footer>}
      </section>
    </div>
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
      {items.map((item) => (
        <div key={`${item.label}-${item.value}`}>
          <span>{item.label}</span>
          <strong>{item.value ?? "—"}</strong>
        </div>
      ))}
    </div>
  );
}
