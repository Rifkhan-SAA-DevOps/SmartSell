import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";

const iconPaths = {
  activity: <><path d="M4 13h4l2-7 4 13 2-6h4" /></>,
  arrow: <><path d="M5 12h14" /><path d="m14 7 5 5-5 5" /></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
  box: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="M3 8v8l9 5 9-5V8M12 13v8" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4L16.5 3.5Z" /></>,
  filter: <><path d="M4 6h16M7 12h10M10 18h4" /></>,
  heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7 7L12 21l8-7.5a5.5 5.5 0 0 0 .8-8.9Z" />,
  inbox: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 8 9 6 9-6" /></>,
  lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  message: <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />,
  money: <><path d="M12 2v20" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H7" /></>,
  order: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" /></>,
  phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 3.1 5.2 2 2 0 0 1 5.1 3h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.4 2.1L9.1 11a16 16 0 0 0 4 4l1.3-1.3a2 2 0 0 1 2.1-.4c1 .3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z" />,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  request: <><path d="M5 4h14v11H8l-3 4V4Z" /><path d="M9 8h6M9 12h4" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></>,
  spark: <><path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3Z" /><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z" /></>,
  star: <path d="m12 2 3.1 6.3 6.9 1-5 4.8 1.2 6.9-6.2-3.3L5.8 21 7 14.1 2 9.3l6.9-1L12 2Z" />,
  support: <><circle cx="12" cy="12" r="9" /><path d="M9.6 9a2.5 2.5 0 1 1 4 2c-1 .7-1.6 1.2-1.6 2.5M12 17h.01" /></>,
  ticket: <><path d="M4 7a2 2 0 0 0 0 4v6h16v-6a2 2 0 0 0 0-4V5H4v2Z" /><path d="M13 5v12" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  wishlist: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7 7L12 21l8-7.5a5.5 5.5 0 0 0 .8-8.9Z" />,
};

export function AccountIcon({ name = "spark", size = 20, className = "" }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {iconPaths[name] || iconPaths.spark}
    </svg>
  );
}

export function AccountPageHeader({ eyebrow, title, description, icon = "spark", actions, meta }) {
  return (
    <header className="ca-page-header">
      <div className="ca-page-header__main">
        <span className="ca-page-header__icon"><AccountIcon name={icon} size={24} /></span>
        <div>
          {eyebrow && <span className="ca-eyebrow">{eyebrow}</span>}
          <h1>{title}</h1>
          {description && <p>{description}</p>}
          {meta && <div className="ca-page-header__meta">{meta}</div>}
        </div>
      </div>
      {actions && <div className="ca-page-header__actions">{actions}</div>}
    </header>
  );
}

export function AccountStatGrid({ items = [] }) {
  return (
    <div className="ca-stat-grid">
      {items.map((item) => (
        <article className={`ca-stat-card tone-${item.tone || "blue"}`} key={item.label}>
          <span className="ca-stat-card__icon"><AccountIcon name={item.icon || "activity"} size={20} /></span>
          <div><small>{item.label}</small><strong>{item.value}</strong>{item.note && <p>{item.note}</p>}</div>
        </article>
      ))}
    </div>
  );
}

export function AccountStatus({ value = "pending", label }) {
  const normalized = String(value || "pending").toLowerCase().replaceAll("_", "-");
  return <span className={`ca-status status-${normalized}`}><i />{label || String(value || "pending").replaceAll("_", " ")}</span>;
}

export function AccountEmpty({ icon = "spark", title, text, actionLabel, actionTo, action }) {
  return (
    <div className="ca-empty">
      <span><AccountIcon name={icon} size={28} /></span>
      <h2>{title}</h2>
      <p>{text}</p>
      {actionTo && <Link className="ca-button ca-button--primary" to={actionTo}>{actionLabel}<AccountIcon name="arrow" size={16} /></Link>}
      {action && <button className="ca-button ca-button--primary" type="button" onClick={action}>{actionLabel}<AccountIcon name="arrow" size={16} /></button>}
    </div>
  );
}

export function AccountToolbar({ children, resultText, actions }) {
  return (
    <div className="ca-toolbar">
      <div className="ca-toolbar__filters">{children}</div>
      <div className="ca-toolbar__end">{resultText && <span>{resultText}</span>}{actions}</div>
    </div>
  );
}

export function AccountSearch({ value, onChange, placeholder = "Search" }) {
  return (
    <label className="ca-search">
      <AccountIcon name="search" size={18} />
      <input value={value} onChange={onChange} placeholder={placeholder} />
    </label>
  );
}

export function AccountModal({ open, onClose, title, eyebrow, icon = "spark", children, footer, size = "medium" }) {
  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="ca-modal-layer" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose?.()}>
      <section className={`ca-modal ca-modal--${size}`} role="dialog" aria-modal="true" aria-labelledby="ca-modal-title">
        <header className="ca-modal__header">
          <span className="ca-modal__icon"><AccountIcon name={icon} size={22} /></span>
          <div>{eyebrow && <span className="ca-eyebrow">{eyebrow}</span>}<h2 id="ca-modal-title">{title}</h2></div>
          <button className="ca-modal__close" type="button" onClick={onClose} aria-label="Close"><AccountIcon name="close" size={20} /></button>
        </header>
        <div className="ca-modal__body">{children}</div>
        {footer && <footer className="ca-modal__footer">{footer}</footer>}
      </section>
    </div>,
    document.body
  );
}

export function AccountDetailGrid({ items = [] }) {
  return (
    <dl className="ca-detail-grid">
      {items.filter((item) => item && item.value !== undefined && item.value !== null && item.value !== "").map((item) => (
        <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>
      ))}
    </dl>
  );
}
