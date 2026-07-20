import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CustomerDiscoveryBar from "../components/CustomerDiscoveryBar.jsx";
import api from "../utils/api.js";
import SEOHead from "../components/SEOHead.jsx";
import SmartPagination from "../components/SmartPagination.jsx";
import useSmartPagination from "../hooks/useSmartPagination.js";

const filters = [
  { label: "All", value: "all" },
  { label: "Sellers", value: "seller" },
  { label: "Shops", value: "shop" },
  { label: "Service Providers", value: "provider" },
];

function ratingText(value) {
  const rating = Number(value || 0);
  return rating ? rating.toFixed(1) : "New";
}

function storefrontPath(item) {
  return item.kind === "provider" ? `/storefronts/providers/${item.id}` : `/storefronts/sellers/${item.id}`;
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export default function Storefronts() {
  const navigate = useNavigate();
  const [storefronts, setStorefronts] = useState([]);
  const [type, setType] = useState("all");
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [sort, setSort] = useState("recommended");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    async function loadStorefronts() {
      try {
        setLoading(true);
        setError("");
        const params = new URLSearchParams();
        if (type !== "all") params.set("type", type);
        if (q.trim()) params.set("q", q.trim());
        if (location.trim()) params.set("location", location.trim());
        const { data } = await api.get("/storefronts", { params, signal: controller.signal });
        if (!cancelled) setStorefronts(data.data || []);
      } catch (err) {
        if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
        if (!cancelled) {
          setError(err.response?.data?.message || "Could not load storefronts.");
          setStorefronts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    const timeout = window.setTimeout(loadStorefronts, 180);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [type, q, location]);

  const stats = useMemo(() => ({
    total: storefronts.length,
    sellers: storefronts.filter((item) => item.kind === "seller" && item.sellerType === "individual_seller").length,
    shops: storefronts.filter((item) => item.sellerType === "shop_seller").length,
    providers: storefronts.filter((item) => item.kind === "provider").length,
  }), [storefronts]);

  const sortedStorefronts = useMemo(() => [...storefronts].sort((left, right) => {
    if (sort === "rating") return Number(right.ratingAverage || 0) - Number(left.ratingAverage || 0);
    if (sort === "listings") return Number(right.listingCount || 0) - Number(left.listingCount || 0);
    if (sort === "name") return String(left.name || "").localeCompare(String(right.name || ""));
    return Number(right.isFeatured || 0) - Number(left.isFeatured || 0)
      || Number(right.ratingAverage || 0) - Number(left.ratingAverage || 0);
  }), [storefronts, sort]);

  const pagination = useSmartPagination(sortedStorefronts, {
    initialPageSize: 10,
    resetKey: `${type}|${q}|${location}|${sort}`,
  });

  function openStorefront(event, item) {
    if (event.target.closest("a, button, input, select, textarea")) return;
    navigate(storefrontPath(item));
  }

  function handleStorefrontKeyDown(event, item) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigate(storefrontPath(item));
    }
  }

  function resetSearch() {
    setQ("");
    setLocation("");
    setType("all");
    setSort("recommended");
  }

  return (
    <main className="customer-feed-page storefront-public-page customer-discovery-page">
      <SEOHead
        title="SmartSell Stores"
        description="Browse trusted SmartSell sellers, shops, and service providers with public storefronts."
        canonicalPath="/storefronts"
        keywords="SmartSell stores, seller storefronts, shops, service providers"
      />

      <section className="customer-feed-hero storefront-hero customer-feed-hero-compact">
        <div>
          <span className="customer-eyebrow">Stores & Providers</span>
          <h1>Meet the people and businesses behind every listing.</h1>
          <p>Explore seller history, customer ratings, locations, products, and services from one trusted directory.</p>
        </div>
        <div className="customer-store-stat-grid customer-store-stat-grid-compact">
          <span><b>{stats.total}</b><small>Total</small></span>
          <span><b>{stats.shops}</b><small>Shops</small></span>
          <span><b>{stats.providers}</b><small>Providers</small></span>
        </div>
      </section>

      <CustomerDiscoveryBar
        variant="storefronts"
        label="Search storefronts"
        value={q}
        onChange={(event) => setQ(event.target.value)}
        placeholder="Seller, shop, cake maker, developer..."
        onReset={resetSearch}
        showReset={Boolean(q || location || type !== "all" || sort !== "recommended")}
      >
        <label className="customer-discovery-field">
          <span className="customer-discovery-field-icon"><LocationIcon /></span>
          <span className="customer-discovery-copy">
            <small>Location</small>
            <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Any city or area" />
          </span>
        </label>
        <label className="customer-discovery-field customer-discovery-sort-field">
          <span className="customer-discovery-copy">
            <small>Sort storefronts</small>
            <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort storefronts"><option value="recommended">Recommended</option><option value="rating">Best rated</option><option value="listings">Most listings</option><option value="name">Name A–Z</option></select>
          </span>
        </label>
      </CustomerDiscoveryBar>

      <div className="customer-chip-scroll storefront-tabs">
        {filters.map((item) => (
          <button key={item.value} type="button" className={type === item.value ? "active" : ""} onClick={() => setType(item.value)}>{item.label}</button>
        ))}
      </div>

      {loading && <p className="customer-state-line">Loading storefronts...</p>}
      {error && <p className="customer-error-line">{error}</p>}

      <section className="customer-storefront-grid">
        {pagination.items.map((item) => (
          <article
            key={`${item.kind}-${item.id}`}
            className="customer-storefront-card"
            role="link"
            tabIndex="0"
            aria-label={`Open ${item.name}`}
            onClick={(event) => openStorefront(event, item)}
            onKeyDown={(event) => handleStorefrontKeyDown(event, item)}
          >
            <div className="customer-storefront-cover">
              <span>{item.avatar || item.name?.slice(0, 2)?.toUpperCase() || "SS"}</span>
              <b>{item.badge}</b>
            </div>
            <div className="customer-storefront-body">
              <div className="customer-storefront-title-row">
                <div>
                  <h3>{item.name}</h3>
                  <p>{item.location || "Sri Lanka"}</p>
                </div>
                <strong>{ratingText(item.ratingAverage)}</strong>
              </div>
              <p className="customer-storefront-description">{item.description || "Trusted SmartSell business profile with approved listings and customer-ready services."}</p>
              <div className="customer-storefront-metrics">
                <span><b>{item.listingCount}</b><small>{item.listingLabel}</small></span>
                <span><b>{item.reviewCount}</b><small>Reviews</small></span>
                <span><b>{item.kind === "provider" ? "Service" : "Seller"}</b><small>Type</small></span>
              </div>
              <div className="customer-storefront-actions">
                <span className="customer-storefront-open-cue">Open storefront <b aria-hidden="true">→</b></span>
                <Link className="customer-primary-action" to={`/request-anything?provider=${encodeURIComponent(item.name)}`}>Send request</Link>
              </div>
            </div>
          </article>
        ))}
      </section>
      <SmartPagination pagination={pagination} label="storefronts" />
      {!loading && !storefronts.length && (
        <div className="customer-empty-panel">
          <strong>No storefronts found</strong>
          <p>Try another search or browse all sellers and service providers.</p>
        </div>
      )}
    </main>
  );
}
