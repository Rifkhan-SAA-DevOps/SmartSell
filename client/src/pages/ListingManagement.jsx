import { useEffect, useMemo, useState } from "react";
import api from "../utils/api.js";

const STATUS_OPTIONS = ["all", "pending", "approved", "rejected", "archived"];
const PRODUCT_STATUS_ACTIONS = ["approved", "rejected", "pending", "archived"];
const SERVICE_STATUS_ACTIONS = ["approved", "rejected", "pending", "archived"];

function formatMoney(value) {
  const number = Number(value || 0);
  return `Rs. ${number.toLocaleString()}`;
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusClass(status) {
  return `status-pill status-${String(status || "pending").toLowerCase()}`;
}

function getImage(item) {
  return item?.image || item?.images?.[0]?.url || null;
}

function ListingCard({ type, item, busyKey, onStatus, onFeatured }) {
  const isProduct = type === "product";
  const title = isProduct ? item.name : item.title;
  const price = isProduct ? item.price : item.priceFrom;
  const owner = isProduct ? item.sellerName : item.providerName;
  const statusActions = isProduct ? PRODUCT_STATUS_ACTIONS : SERVICE_STATUS_ACTIONS;
  const image = getImage(item);
  const isBusy = busyKey?.startsWith(`${type}:${item.id}`);

  return (
    <article className="listing-admin-card">
      <div className="listing-admin-media">
        {image ? <img src={image} alt={title} /> : <div className="listing-admin-placeholder">{isProduct ? "PR" : "SV"}</div>}
        {item.isFeatured && <span className="listing-featured-ribbon">Featured</span>}
      </div>

      <div className="listing-admin-main">
        <div className="listing-admin-title-row">
          <div>
            <div className="listing-admin-eyebrow">{isProduct ? item.type?.replaceAll("_", " ") : item.providerType || "Service"}</div>
            <h3>{title}</h3>
          </div>
          <span className={statusClass(item.status)}>{item.status}</span>
        </div>

        <p>{item.description || "No description added yet."}</p>

        <div className="listing-admin-meta-grid">
          <span><strong>Price</strong>{price ? formatMoney(price) : "Quote based"}</span>
          <span><strong>Category</strong>{item.category || "Uncategorized"}</span>
          <span><strong>{isProduct ? "Seller" : "Provider"}</strong>{owner || "SmartSell"}</span>
          <span><strong>{isProduct ? "Stock" : "Rating"}</strong>{isProduct ? item.stock ?? 0 : `${item.ratingAverage || 0} / 5`}</span>
          {isProduct && <span><strong>Condition</strong>{item.condition?.replaceAll("_", " ") || "—"}</span>}
          <span><strong>Created</strong>{formatDate(item.createdAt)}</span>
        </div>

        <div className="listing-admin-actions">
          {statusActions.map((status) => (
            <button
              key={`${item.id}-${status}`}
              type="button"
              className={`btn ${status === "approved" ? "btn-primary" : status === "rejected" ? "btn-danger-soft" : "btn-soft"}`}
              disabled={isBusy || item.status === status}
              onClick={() => onStatus(type, item.id, status)}
            >
              {status === "approved" ? "Approve" : status === "rejected" ? "Reject" : status === "archived" ? "Archive" : "Move Pending"}
            </button>
          ))}

          <button
            type="button"
            className="btn btn-outline"
            disabled={isBusy}
            onClick={() => onFeatured(type, item.id, !item.isFeatured)}
          >
            {item.isFeatured ? "Remove Featured" : "Mark Featured"}
          </button>
        </div>
      </div>
    </article>
  );
}

function EmptyState({ label }) {
  return (
    <div className="empty-state premium-empty-state">
      <div className="empty-icon">LM</div>
      <h3>No {label} found</h3>
      <p>Try changing the search, status, or featured filter.</p>
    </div>
  );
}

export default function ListingManagement() {
  const [data, setData] = useState({ products: [], services: [], counts: { products: {}, services: {} } });
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tab, setTab] = useState("all");
  const [filters, setFilters] = useState({ q: "", status: "all", featured: "all" });

  async function loadListings() {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/admin/listings", { params: filters });
      setData(response.data.data || { products: [], services: [], counts: { products: {}, services: {} } });
    } catch (err) {
      setError(err.smartSellMessage || "Failed to load listings.");
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
      await loadListings();
    } catch (err) {
      setError(err.smartSellMessage || "Failed to update listing status.");
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
      await loadListings();
    } catch (err) {
      setError(err.smartSellMessage || "Failed to update featured status.");
    } finally {
      setBusyKey("");
    }
  }

  const stats = useMemo(() => {
    const products = data.products || [];
    const services = data.services || [];
    const all = [...products, ...services];
    return {
      total: all.length,
      products: products.length,
      services: services.length,
      pending: all.filter((item) => item.status === "pending").length,
      approved: all.filter((item) => item.status === "approved").length,
      featured: all.filter((item) => item.isFeatured).length,
    };
  }, [data]);

  const visibleProducts = tab === "all" || tab === "products" ? data.products || [] : [];
  const visibleServices = tab === "all" || tab === "services" ? data.services || [] : [];
  const visibleListings = [
    ...visibleProducts.map((item) => ({ type: "product", item })),
    ...visibleServices.map((item) => ({ type: "service", item })),
  ];

  return (
    <div className="page-shell listing-management-page">
      <section className="admin-hero listing-hero">
        <div>
          <span className="eyebrow">Admin Control</span>
          <h1>Listing Management Center</h1>
          <p>Review, approve, reject, archive, and feature SmartSell products and services from one professional workspace.</p>
        </div>
        <div className="hero-icon-card">LM</div>
      </section>

      <section className="stats-grid compact-stats">
        <div className="stat-card"><span>Total Listings</span><strong>{stats.total}</strong></div>
        <div className="stat-card"><span>Products</span><strong>{stats.products}</strong></div>
        <div className="stat-card"><span>Services</span><strong>{stats.services}</strong></div>
        <div className="stat-card"><span>Pending Review</span><strong>{stats.pending}</strong></div>
        <div className="stat-card"><span>Approved</span><strong>{stats.approved}</strong></div>
        <div className="stat-card"><span>Featured</span><strong>{stats.featured}</strong></div>
      </section>

      <section className="management-panel listing-filter-panel">
        <div className="panel-header-row">
          <div>
            <h2>Search & Filter</h2>
            <p>Quickly find submitted products and services.</p>
          </div>
          <button className="btn btn-outline" type="button" onClick={loadListings} disabled={loading}>Refresh</button>
        </div>

        <div className="filter-grid listing-filter-grid">
          <label>
            <span>Search listings</span>
            <input
              value={filters.q}
              onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value }))}
              placeholder="Search title, category, seller, location..."
            />
          </label>
          <label>
            <span>Status</span>
            <select value={filters.status} onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}>
              {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status === "all" ? "All statuses" : status}</option>)}
            </select>
          </label>
          <label>
            <span>Featured</span>
            <select value={filters.featured} onChange={(event) => setFilters((prev) => ({ ...prev, featured: event.target.value }))}>
              <option value="all">All listings</option>
              <option value="true">Featured only</option>
            </select>
          </label>
        </div>

        <div className="segmented-tabs listing-tabs" role="tablist" aria-label="Listing type filter">
          <button type="button" className={tab === "all" ? "active" : ""} onClick={() => setTab("all")}>All</button>
          <button type="button" className={tab === "products" ? "active" : ""} onClick={() => setTab("products")}>Products</button>
          <button type="button" className={tab === "services" ? "active" : ""} onClick={() => setTab("services")}>Services</button>
        </div>
      </section>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      {loading && <div className="loading-card">Loading listings...</div>}

      {!loading && (
        <>
          <div className="listing-admin-grid">
            {visibleListings.map(({ type, item }) => (
              <ListingCard
                key={`${type}-${item.id}`}
                type={type}
                item={item}
                busyKey={busyKey}
                onStatus={updateStatus}
                onFeatured={updateFeatured}
              />
            ))}

            {!visibleListings.length && <EmptyState label={tab === "all" ? "listings" : tab} />}
          </div>
        </>
      )}
    </div>
  );
}
