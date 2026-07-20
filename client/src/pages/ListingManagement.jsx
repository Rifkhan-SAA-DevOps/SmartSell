import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AdminEmptyState,
  AdminIcon,
  AdminInfoGrid,
  AdminMetricCard,
  AdminModal,
  AdminPageHeader,
  AdminPagination,
  AdminSearchToolbar,
  AdminStatusBadge,
  useAdminPagination,
} from "../components/AdminWorkspaceUi.jsx";
import api from "../utils/api.js";
import "../styles/pages/admin/AdminWorkspaceV2.css";

const STATUS_OPTIONS = ["all", "pending", "approved", "rejected", "archived"];
const STATUS_ACTIONS = ["approved", "rejected", "pending", "archived"];

function formatMoney(value) {
  const number = Number(value || 0);
  return `Rs. ${number.toLocaleString("en-LK")}`;
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-LK", { year: "numeric", month: "short", day: "2-digit" });
}

function titleCase(value) {
  return String(value || "").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getImage(item) {
  return item?.image || item?.images?.[0]?.url || null;
}

function getListingRecord(type, item) {
  const isProduct = type === "product";
  return {
    type,
    item,
    title: isProduct ? item.name : item.title,
    price: isProduct ? item.price : item.priceFrom,
    owner: isProduct ? item.sellerName : item.providerName,
    kind: isProduct ? item.type || "product" : item.providerType || "service",
    stockOrRating: isProduct ? `${item.stock ?? 0} in stock` : `${Number(item.ratingAverage || 0).toFixed(1)} / 5 rating`,
  };
}

export default function ListingManagement() {
  const [data, setData] = useState({ products: [], services: [] });
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tab, setTab] = useState("all");
  const [filters, setFilters] = useState({ q: "", status: "all", featured: "all" });
  const [sort, setSort] = useState("newest");
  const [selected, setSelected] = useState(null);

  async function loadListings() {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/admin/listings", { params: filters });
      setData(response.data.data || { products: [], services: [] });
    } catch (err) {
      setError(err.smartSellMessage || err.response?.data?.message || "Failed to load listings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(loadListings, 250);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.q, filters.status, filters.featured]);

  async function updateStatus(type, id, status) {
    setBusyKey(`${type}:${id}:status`);
    setError("");
    setSuccess("");
    try {
      const endpoint = type === "product" ? `/admin/products/${id}/status` : `/admin/services/${id}/status`;
      const response = await api.patch(endpoint, { status, note: `Changed from Listing Management to ${status}` });
      setSuccess(response.data.message || "Listing updated.");
      setSelected((current) => current ? { ...current, item: { ...current.item, status } } : current);
      await loadListings();
    } catch (err) {
      setError(err.smartSellMessage || err.response?.data?.message || "Failed to update listing status.");
    } finally {
      setBusyKey("");
    }
  }

  async function updateFeatured(type, id, isFeatured) {
    setBusyKey(`${type}:${id}:featured`);
    setError("");
    setSuccess("");
    try {
      const endpoint = type === "product" ? `/admin/products/${id}/featured` : `/admin/services/${id}/featured`;
      const response = await api.patch(endpoint, { isFeatured, note: isFeatured ? "Marked as featured" : "Removed from featured" });
      setSuccess(response.data.message || "Featured status updated.");
      setSelected((current) => current ? { ...current, item: { ...current.item, isFeatured } } : current);
      await loadListings();
    } catch (err) {
      setError(err.smartSellMessage || err.response?.data?.message || "Failed to update featured status.");
    } finally {
      setBusyKey("");
    }
  }

  const records = useMemo(() => {
    const products = (tab === "all" || tab === "products") ? (data.products || []).map((item) => getListingRecord("product", item)) : [];
    const services = (tab === "all" || tab === "services") ? (data.services || []).map((item) => getListingRecord("service", item)) : [];
    return [...products, ...services].sort((left, right) => {
      if (sort === "oldest") return new Date(left.item.createdAt || 0) - new Date(right.item.createdAt || 0);
      if (sort === "price_high") return Number(right.price || 0) - Number(left.price || 0);
      if (sort === "price_low") return Number(left.price || 0) - Number(right.price || 0);
      if (sort === "owner") return String(left.owner || "").localeCompare(String(right.owner || ""));
      return new Date(right.item.createdAt || 0) - new Date(left.item.createdAt || 0);
    });
  }, [data, tab, sort]);

  const stats = useMemo(() => {
    const all = [
      ...(data.products || []).map((item) => getListingRecord("product", item)),
      ...(data.services || []).map((item) => getListingRecord("service", item)),
    ];
    return {
      total: all.length,
      products: data.products?.length || 0,
      services: data.services?.length || 0,
      pending: all.filter(({ item }) => item.status === "pending").length,
      approved: all.filter(({ item }) => item.status === "approved").length,
      featured: all.filter(({ item }) => item.isFeatured).length,
    };
  }, [data]);

  const pagination = useAdminPagination(records, 10, [tab, filters.q, filters.status, filters.featured, sort]);
  const selectedBusy = selected ? busyKey.startsWith(`${selected.type}:${selected.item.id}`) : false;

  return (
    <section className="admin-workspace-v2 admin-listings-page-v2">
      <AdminPageHeader
        eyebrow="Marketplace governance"
        title="Listing approvals"
        description="Review product and service submissions, verify ownership and quality, control visibility, and feature the strongest listings without cluttering the main list with action buttons."
        actions={(
          <>
            <button className="admin-ghost-button-v2" type="button" onClick={loadListings} disabled={loading}><AdminIcon name="refresh" size={17} />Refresh</button>
            <Link className="admin-primary-button-v2" to="/seller-hub"><AdminIcon name="edit" size={17} />Create listing</Link>
          </>
        )}
        meta={<><span><AdminIcon name="list" size={15} />{stats.total} loaded</span><AdminStatusBadge status="pending" label={`${stats.pending} waiting`} /></>}
      />

      <div className="admin-metrics-grid-v2">
        <AdminMetricCard icon="list" label="All listings" value={stats.total} note="Products and services" tone="blue" />
        <AdminMetricCard icon="box" label="Products" value={stats.products} note="Physical and used items" tone="cyan" />
        <AdminMetricCard icon="store" label="Services" value={stats.services} note="Provider submissions" tone="violet" />
        <AdminMetricCard icon="alert" label="Pending review" value={stats.pending} note="Need an admin decision" tone="amber" />
        <AdminMetricCard icon="check" label="Approved" value={stats.approved} note="Visible to customers" tone="emerald" />
        <AdminMetricCard icon="star" label="Featured" value={stats.featured} note="Promoted discovery items" tone="rose" />
      </div>

      {error && <div className="admin-alert-v2 error">{error}</div>}
      {success && <div className="admin-alert-v2 success">{success}</div>}

      <AdminSearchToolbar
        value={filters.q}
        onChange={(q) => setFilters((current) => ({ ...current, q }))}
        placeholder="Search title, category, seller, provider or location"
        filters={(
          <>
            <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} aria-label="Listing status">
              {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status === "all" ? "All statuses" : titleCase(status)}</option>)}
            </select>
            <select value={filters.featured} onChange={(event) => setFilters((current) => ({ ...current, featured: event.target.value }))} aria-label="Featured filter">
              <option value="all">All visibility</option>
              <option value="true">Featured only</option>
            </select>
            <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort listings"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="price_high">Highest price</option><option value="price_low">Lowest price</option><option value="owner">Owner A–Z</option></select>
          </>
        )}
        actions={(
          <div className="admin-queue-tabs-v2" role="tablist" aria-label="Listing type">
            {["all", "products", "services"].map((value) => <button type="button" key={value} className={tab === value ? "active" : ""} onClick={() => setTab(value)}>{titleCase(value)}</button>)}
          </div>
        )}
      />

      <section className="admin-panel-v2">
        <div className="admin-panel-head-v2">
          <div><h2>Listing directory</h2><p>Click any record to inspect the submission and access approval, rejection, archive, or featured controls.</p></div>
          <AdminStatusBadge status="approved" label={`${pagination.total} results`} />
        </div>

        {loading ? <div className="admin-empty-v2"><span><AdminIcon name="refresh" /></span><h3>Loading listings</h3><p>Retrieving the latest marketplace submissions.</p></div> : null}

        {!loading && !pagination.items.length ? (
          <AdminEmptyState icon="list" title="No listings found" description="Try a different search term, status, type, or featured filter." />
        ) : null}

        {!loading && pagination.items.length ? (
          <div className="admin-queue-list-v2">
            {pagination.items.map((record) => (
              <button className="admin-listing-row-v2" type="button" key={`${record.type}-${record.item.id}`} onClick={() => setSelected(record)}>
                <span className="admin-listing-identity-v2">
                  <span className="admin-listing-thumb-v2">{getImage(record.item) ? <img src={getImage(record.item)} alt="" /> : record.type === "product" ? "PR" : "SV"}</span>
                  <span>
                    <strong>{record.title}</strong>
                    <small>{record.owner || "SmartSell"} · {titleCase(record.kind)}</small>
                  </span>
                </span>
                <div><strong>{record.price ? formatMoney(record.price) : "Quote based"}</strong><small>{record.item.category || "Uncategorized"}</small></div>
                <div><strong>{record.stockOrRating}</strong><small>Created {formatDate(record.item.createdAt)}</small></div>
                <div><strong>{record.item.isFeatured ? "Featured" : "Standard"}</strong><small>{record.type === "product" ? titleCase(record.item.condition || "not set") : titleCase(record.item.providerType || "provider")}</small></div>
                <span className="admin-status-v2-wrapper"><AdminStatusBadge status={record.item.status} /></span>
                <span className="admin-row-open-v2"><AdminIcon name="chevron" size={16} /></span>
              </button>
            ))}
          </div>
        ) : null}
        <AdminPagination pagination={pagination} />
      </section>

      <AdminModal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.title || "Listing details"}
        eyebrow={selected ? `${titleCase(selected.type)} submission` : "Listing"}
        size="wide"
        footer={selected ? (
          <>
            <button className="admin-ghost-button-v2" type="button" onClick={() => setSelected(null)}>Close</button>
            <button className="admin-secondary-button-v2" type="button" disabled={selectedBusy || selected.item.status === "pending"} onClick={() => updateStatus(selected.type, selected.item.id, "pending")}>Move to pending</button>
            <button className="admin-danger-button-v2" type="button" disabled={selectedBusy || selected.item.status === "rejected"} onClick={() => updateStatus(selected.type, selected.item.id, "rejected")}>Reject</button>
            <button className="admin-success-button-v2" type="button" disabled={selectedBusy || selected.item.status === "approved"} onClick={() => updateStatus(selected.type, selected.item.id, "approved")}>Approve</button>
          </>
        ) : null}
      >
        {selected && (
          <div>
            <div className="admin-listing-modal-hero-v2">
              <div className="admin-listing-modal-image-v2">{getImage(selected.item) ? <img src={getImage(selected.item)} alt={selected.title} /> : selected.type === "product" ? "PRODUCT" : "SERVICE"}</div>
              <div className="admin-listing-modal-copy-v2">
                <AdminStatusBadge status={selected.item.status} />
                <h3>{selected.title}</h3>
                <p>{selected.item.description || "No description has been added to this listing."}</p>
                <div className="admin-listing-actions-v2">
                  <button className="admin-secondary-button-v2" type="button" disabled={selectedBusy} onClick={() => updateFeatured(selected.type, selected.item.id, !selected.item.isFeatured)}>
                    <AdminIcon name="star" size={16} />{selected.item.isFeatured ? "Remove featured" : "Mark featured"}
                  </button>
                  <button className="admin-danger-button-v2" type="button" disabled={selectedBusy || selected.item.status === "archived"} onClick={() => updateStatus(selected.type, selected.item.id, "archived")}>Archive listing</button>
                </div>
              </div>
            </div>

            <AdminInfoGrid items={[
              { label: "Listing type", value: titleCase(selected.type) },
              { label: "Category", value: selected.item.category || "Uncategorized" },
              { label: "Owner", value: selected.owner || "SmartSell" },
              { label: "Price", value: selected.price ? formatMoney(selected.price) : "Quote based" },
              { label: selected.type === "product" ? "Stock" : "Rating", value: selected.stockOrRating },
              { label: "Created", value: formatDate(selected.item.createdAt) },
              { label: "Condition / provider", value: selected.type === "product" ? titleCase(selected.item.condition || "Not set") : titleCase(selected.item.providerType || "Provider") },
              { label: "Visibility", value: selected.item.isFeatured ? "Featured" : "Standard" },
              { label: "Current status", value: titleCase(selected.item.status) },
            ]} />
          </div>
        )}
      </AdminModal>
    </section>
  );
}
