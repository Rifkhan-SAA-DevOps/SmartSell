function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4.9 8A8 8 0 1 1 4 12" />
      <path d="M4 4v4h4" />
    </svg>
  );
}

export default function CustomerDiscoveryBar({
  variant = "default",
  label,
  value,
  onChange,
  placeholder,
  children,
  onReset,
  showReset = true,
  onToggleFilters,
  filtersOpen = false,
  activeFilterCount = 0,
}) {
  return (
    <section className={`customer-discovery-bar ${variant ? `is-${variant}` : ""}`} aria-label={`${label} controls`}>
      <label className="customer-discovery-search">
        <span className="customer-discovery-icon"><SearchIcon /></span>
        <span className="customer-discovery-copy">
          <small>{label}</small>
          <input value={value} onChange={onChange} placeholder={placeholder} />
        </span>
      </label>

      {children && <div className="customer-discovery-fields">{children}</div>}

      {onToggleFilters && (
        <button
          className={`customer-discovery-filter-button ${filtersOpen ? "active" : ""}`}
          type="button"
          onClick={onToggleFilters}
          aria-expanded={filtersOpen}
        >
          <FilterIcon />
          <span>Filters</span>
          {activeFilterCount > 0 && <b>{activeFilterCount}</b>}
        </button>
      )}

      {showReset && onReset && (
        <button className="customer-discovery-reset" type="button" onClick={onReset} aria-label="Reset search and filters" title="Reset search and filters">
          <ResetIcon />
          <span>Reset</span>
        </button>
      )}
    </section>
  );
}
