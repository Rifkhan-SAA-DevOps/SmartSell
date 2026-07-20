import useAccessibleDialog from "../hooks/useAccessibleDialog.js";

function ConfirmIcon({ tone = "danger" }) {
  return (
    <span className={`smart-confirm-icon tone-${tone}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {tone === "danger" ? (
          <><path d="M12 3 2.5 20h19L12 3Z" /><path d="M12 9v5M12 17h.01" /></>
        ) : (
          <><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.2 2.2 4.8-5" /></>
        )}
      </svg>
    </span>
  );
}

export default function SmartConfirmDialog({
  open,
  title,
  description,
  eyebrow = "Confirm action",
  confirmLabel = "Confirm",
  cancelLabel = "Keep it",
  tone = "danger",
  busy = false,
  details = [],
  onConfirm,
  onClose,
}) {
  const dialogRef = useAccessibleDialog({ open, onClose: busy ? undefined : onClose });
  if (!open) return null;

  return (
    <div className="smart-confirm-backdrop" role="presentation" onMouseDown={(event) => {
      if (!busy && event.target === event.currentTarget) onClose?.();
    }}>
      <section
        className={`smart-confirm-dialog tone-${tone}`}
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="smart-confirm-title"
        aria-describedby="smart-confirm-description"
        tabIndex="-1"
      >
        <div className="smart-confirm-heading">
          <ConfirmIcon tone={tone} />
          <div>
            <span>{eyebrow}</span>
            <h2 id="smart-confirm-title">{title}</h2>
            <p id="smart-confirm-description">{description}</p>
          </div>
        </div>

        {details.length > 0 && (
          <dl className="smart-confirm-details">
            {details.map((item) => (
              <div key={`${item.label}-${item.value}`}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className="smart-confirm-actions">
          <button className="smart-confirm-cancel" type="button" onClick={onClose} disabled={busy}>{cancelLabel}</button>
          <button className="smart-confirm-submit" type="button" onClick={onConfirm} disabled={busy}>
            {busy ? "Working..." : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
