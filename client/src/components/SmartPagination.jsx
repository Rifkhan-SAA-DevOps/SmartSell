export default function SmartPagination({ pagination, label = "items", align = "center", compact = false }) {
  if (!pagination || pagination.totalItems <= pagination.pageSize) return null;

  const pages = [];
  const totalPages = pagination.totalPages;
  const current = pagination.page;
  const start = Math.max(1, current - 1);
  const end = Math.min(totalPages, current + 1);

  if (start > 1) pages.push(1);
  if (start > 2) pages.push("left-ellipsis");
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (end < totalPages - 1) pages.push("right-ellipsis");
  if (end < totalPages) pages.push(totalPages);

  return (
    <nav className={`smart-pagination ${compact ? "compact" : ""} align-${align}`} aria-label={`${label} pagination`}>
      <div className="smart-pagination-summary" aria-live="polite" aria-atomic="true">
        <strong>{pagination.startItem}-{pagination.endItem}</strong>
        <span>of {pagination.totalItems} {label}</span>
        <span className="sr-only">Page {current} of {totalPages}</span>
      </div>

      <div className="smart-pagination-controls">
        <button
          type="button"
          onClick={pagination.previousPage}
          disabled={pagination.page <= 1}
          aria-label={`Previous ${label} page`}
        >
          Prev
        </button>
        {pages.map((item) => item === "left-ellipsis" || item === "right-ellipsis" ? (
          <span className="smart-page-ellipsis" key={item} aria-hidden="true">…</span>
        ) : (
          <button
            type="button"
            key={item}
            className={item === current ? "active" : ""}
            onClick={() => pagination.setPage(item)}
            aria-current={item === current ? "page" : undefined}
            aria-label={`Page ${item} of ${totalPages}`}
          >
            {item}
          </button>
        ))}
        <button
          type="button"
          onClick={pagination.nextPage}
          disabled={pagination.page >= pagination.totalPages}
          aria-label={`Next ${label} page`}
        >
          Next
        </button>
      </div>

      <label className="smart-pagination-size">
        <span>Show</span>
        <select
          value={pagination.pageSize}
          onChange={(event) => pagination.setPageSize(event.target.value)}
          aria-label={`${label} per page`}
        >
          {pagination.pageSizes.map((size) => <option key={size} value={size}>{size}</option>)}
        </select>
      </label>
    </nav>
  );
}
