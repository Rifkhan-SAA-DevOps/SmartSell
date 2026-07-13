import { useEffect, useMemo, useState } from "react";

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_PAGE_SIZES = [10, 20, 50];

export default function useSmartPagination(items = [], options = {}) {
  const {
    initialPageSize = DEFAULT_PAGE_SIZE,
    pageSizes = DEFAULT_PAGE_SIZES,
    resetKey = "default",
  } = options;

  const safeItems = Array.isArray(items) ? items : [];
  const safePageSizes = pageSizes?.length ? pageSizes : DEFAULT_PAGE_SIZES;
  const [pageSize, setPageSize] = useState(Number(initialPageSize) || DEFAULT_PAGE_SIZE);
  const [page, setPage] = useState(1);

  const totalItems = safeItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = totalItems ? (page - 1) * pageSize : 0;
  const endIndex = totalItems ? Math.min(startIndex + pageSize, totalItems) : 0;

  useEffect(() => {
    setPage(1);
  }, [resetKey, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = useMemo(() => {
    return safeItems.slice(startIndex, endIndex);
  }, [safeItems, startIndex, endIndex]);

  function goToPage(nextPage) {
    const normalized = Math.min(Math.max(1, Number(nextPage) || 1), totalPages);
    setPage(normalized);
  }

  return {
    items: pageItems,
    page,
    pageSize,
    pageSizes: safePageSizes,
    totalItems,
    totalPages,
    startItem: totalItems ? startIndex + 1 : 0,
    endItem: endIndex,
    hasPagination: totalItems > pageSize,
    setPage: goToPage,
    setPageSize: (nextSize) => setPageSize(Number(nextSize) || DEFAULT_PAGE_SIZE),
    nextPage: () => goToPage(page + 1),
    previousPage: () => goToPage(page - 1),
  };
}
