import { useEffect, useMemo, useState } from "react";

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_PAGE_SIZES = [10, 20, 50];

function normalizePageSizes(pageSizes, initialPageSize) {
  const values = [...(Array.isArray(pageSizes) ? pageSizes : DEFAULT_PAGE_SIZES), initialPageSize]
    .map(Number)
    .filter((value) => Number.isFinite(value) && value > 0);
  return [...new Set(values)].sort((left, right) => left - right);
}

function stableResetKey(value) {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  try { return JSON.stringify(value); } catch { return String(value); }
}

export default function useSmartPagination(items = [], options = {}) {
  const {
    initialPageSize = DEFAULT_PAGE_SIZE,
    pageSizes = DEFAULT_PAGE_SIZES,
    resetKey = "default",
  } = options;

  const safeItems = Array.isArray(items) ? items : [];
  const normalizedInitialSize = Number(initialPageSize) > 0 ? Number(initialPageSize) : DEFAULT_PAGE_SIZE;
  const safePageSizes = useMemo(
    () => normalizePageSizes(pageSizes, normalizedInitialSize),
    [pageSizes, normalizedInitialSize],
  );
  const serializedResetKey = stableResetKey(resetKey);
  const [pageSize, setPageSizeState] = useState(normalizedInitialSize);
  const [page, setPageState] = useState(1);

  const totalItems = safeItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = totalItems ? (safePage - 1) * pageSize : 0;
  const endIndex = totalItems ? Math.min(startIndex + pageSize, totalItems) : 0;

  useEffect(() => {
    setPageState(1);
  }, [serializedResetKey]);

  useEffect(() => {
    if (page > totalPages) setPageState(totalPages);
  }, [page, totalPages]);

  const pageItems = useMemo(
    () => safeItems.slice(startIndex, endIndex),
    [safeItems, startIndex, endIndex],
  );

  function goToPage(nextPage) {
    const normalized = Math.min(Math.max(1, Number(nextPage) || 1), totalPages);
    setPageState(normalized);
  }

  function setPageSize(nextSize) {
    const normalized = Number(nextSize);
    setPageSizeState(Number.isFinite(normalized) && normalized > 0 ? normalized : DEFAULT_PAGE_SIZE);
    setPageState(1);
  }

  return {
    items: pageItems,
    page: safePage,
    pageSize,
    pageSizes: safePageSizes,
    totalItems,
    totalPages,
    startItem: totalItems ? startIndex + 1 : 0,
    endItem: endIndex,
    hasPagination: totalItems > pageSize,
    setPage: goToPage,
    setPageSize,
    resetPage: () => setPageState(1),
    firstPage: () => goToPage(1),
    lastPage: () => goToPage(totalPages),
    nextPage: () => goToPage(safePage + 1),
    previousPage: () => goToPage(safePage - 1),
  };
}
