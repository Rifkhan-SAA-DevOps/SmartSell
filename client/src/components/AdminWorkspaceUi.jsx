import { useEffect, useMemo, useState } from "react";

const ICON_PATHS = {
  activity: "M3 12h4l2.5-7 5 14 2.5-7H21",
  alert: "M12 3 2.5 20h19L12 3Zm0 6v5m0 3h.01",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  box: "M21 8 12 3 3 8l9 5 9-5ZM3 8v9l9 5 9-5V8m-9 5v9",
  check: "m5 12 4 4L19 6",
  chevron: "m9 6 6 6-6 6",
  close: "m6 6 12 12M18 6 6 18",
  delivery: "M3 6h12v11H3zM15 10h4l2 3v4h-6zM7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  edit: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4L16.5 3.5Z",
  filter: "M4 5h16M7 12h10M10 19h4",
  flag: "M5 22V4m0 1h11l-2 4 2 4H5",
  inbox: "M3 5h18v14H3zM3 13h5l2 3h4l2-3h5",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  money: "M12 2v20m5-16H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H7",
  order: "M6 3h12v18H6zM9 8h6m-6 4h6m-6 4h4",
  refresh: "M20 11a8 8 0 1 0 2 5M20 4v7h-7",
  report: "M4 20V10m6 10V4m6 16v-7m6 7H2",
  request: "M7 3h10l4 4v14H7zM17 3v5h5M10 13h8m-8 4h5",
  search: "m21 21-4.4-4.4M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z",
  settings: "M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Zm7.4-.5a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1.1 1.6V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 9 19.3a1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8A1.7 1.7 0 0 0 3.1 14H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.7 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 9 4.7 1.7 1.7 0 0 0 10 3.1V3a2 2 0 1 1 4 0v.1A1.7 1.7 0 0 0 15 4.7a1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8 1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z",
  spark: "m12 3 1.4 4.6L18 9l-4.6 1.4L12 15l-1.4-4.6L6 9l4.6-1.4L12 3Zm7 12 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z",
  star: "m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z",
  store: "M4 10h16l-1.2-5H5.2L4 10ZM5 10v9h14v-9M9 19v-5h6v5",
  user: "M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z",
  users: "M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm14.5 10v-2a4 4 0 0 0-3-3.9M17 3.1a4 4 0 0 1 0 7.8",
};

export function AdminIcon({ name = "shield", size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={ICON_PATHS[name] || ICON_PATHS.shield} />
    </svg>
  );
}

export function AdminPageHeader({ eyebrow, title, description, actions, meta }) {
  return (
    <header className="admin-page-header-v2">
      <div className="admin-page-header-copy-v2">
        {eyebrow && <span className="admin-page-eyebrow-v2"><AdminIcon name="spark" size={15} />{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
        {meta && <div className="admin-page-meta-v2">{meta}</div>}
      </div>
      {actions && <div className="admin-page-header-actions-v2">{actions}</div>}
    </header>
  );
}

export function AdminMetricCard({ icon, label, value, note, tone = "blue" }) {
  return (
    <article className={`admin-metric-v2 tone-${tone}`}>
      <span className="admin-metric-icon-v2"><AdminIcon name={icon} /></span>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        {note && <small>{note}</small>}
      </div>
    </article>
  );
}

export function AdminStatusBadge({ status, label }) {
  const normalized = String(status || "neutral").toLowerCase().replaceAll("_", "-");
  const text = label || String(status || "Unknown").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  return <span className={`admin-status-v2 status-${normalized}`}>{text}</span>;
}

export function AdminEmptyState({ icon = "list", title, description, action }) {
  return (
    <div className="admin-empty-v2">
      <span><AdminIcon name={icon} size={26} /></span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function AdminModal({ open, title, eyebrow, onClose, children, footer, size = "large" }) {
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="admin-modal-layer-v2" role="presentation">
      <button className="admin-modal-backdrop-v2" type="button" aria-label="Close dialog" onClick={onClose} />
      <section className={`admin-modal-v2 size-${size}`} role="dialog" aria-modal="true" aria-label={title}>
        <header>
          <div>
            {eyebrow && <span>{eyebrow}</span>}
            <h2>{title}</h2>
          </div>
          <button className="admin-modal-close-v2" type="button" onClick={onClose} aria-label="Close dialog"><AdminIcon name="close" /></button>
        </header>
        <div className="admin-modal-body-v2">{children}</div>
        {footer && <footer>{footer}</footer>}
      </section>
    </div>
  );
}

export function AdminSearchToolbar({ value, onChange, placeholder = "Search", filters, actions }) {
  return (
    <div className="admin-toolbar-v2">
      <label className="admin-search-v2">
        <AdminIcon name="search" size={18} />
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      </label>
      {filters && <div className="admin-toolbar-filters-v2">{filters}</div>}
      {actions && <div className="admin-toolbar-actions-v2">{actions}</div>}
    </div>
  );
}

export function AdminInfoGrid({ items }) {
  return (
    <div className="admin-info-grid-v2">
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`}>
          <span>{item.label}</span>
          <strong>{item.value ?? "—"}</strong>
        </div>
      ))}
    </div>
  );
}

export function useAdminPagination(items = [], pageSize = 10, resetKeys = []) {
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(pageSize);
  const totalPages = Math.max(1, Math.ceil(items.length / size));

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetKeys);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * size;
    return items.slice(start, start + size);
  }, [items, page, size]);

  return {
    page,
    setPage,
    size,
    setSize: (next) => {
      setSize(Number(next));
      setPage(1);
    },
    totalPages,
    total: items.length,
    start: items.length ? (page - 1) * size + 1 : 0,
    end: Math.min(page * size, items.length),
    items: pageItems,
  };
}

export function AdminPagination({ pagination }) {
  if (!pagination || pagination.total <= 0) return null;
  const pages = [];
  const start = Math.max(1, pagination.page - 2);
  const end = Math.min(pagination.totalPages, pagination.page + 2);
  for (let value = start; value <= end; value += 1) pages.push(value);

  return (
    <div className="admin-pagination-v2">
      <div>
        <strong>{pagination.start}–{pagination.end}</strong>
        <span>of {pagination.total}</span>
      </div>
      <label>
        <span>Rows</span>
        <select value={pagination.size} onChange={(event) => pagination.setSize(event.target.value)}>
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
        </select>
      </label>
      <nav aria-label="Pagination">
        <button type="button" disabled={pagination.page === 1} onClick={() => pagination.setPage(pagination.page - 1)} aria-label="Previous page">‹</button>
        {start > 1 && <button type="button" onClick={() => pagination.setPage(1)}>1</button>}
        {start > 2 && <span>…</span>}
        {pages.map((value) => <button type="button" key={value} className={value === pagination.page ? "active" : ""} onClick={() => pagination.setPage(value)}>{value}</button>)}
        {end < pagination.totalPages - 1 && <span>…</span>}
        {end < pagination.totalPages && <button type="button" onClick={() => pagination.setPage(pagination.totalPages)}>{pagination.totalPages}</button>}
        <button type="button" disabled={pagination.page === pagination.totalPages} onClick={() => pagination.setPage(pagination.page + 1)} aria-label="Next page">›</button>
      </nav>
    </div>
  );
}
