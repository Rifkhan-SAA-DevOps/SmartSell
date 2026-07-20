import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import CustomerDiscoveryBar from "../components/CustomerDiscoveryBar.jsx";
import ProductCard from "../components/ProductCard.jsx";
import SEOHead from "../components/SEOHead.jsx";
import SmartPagination from "../components/SmartPagination.jsx";
import useSmartPagination from "../hooks/useSmartPagination.js";
import { featuredProducts } from "../data/demoData.js";
import api from "../utils/api.js";

const typeFilters = [
  { label: "All", value: "all" },
  { label: "SmartSell", value: "own_product" },
  { label: "Shops", value: "shop_product" },
  { label: "Used", value: "used_product" },
  { label: "Client", value: "seller_product" },
];

const initialFilters = {
  type: "all",
  q: "",
  category: "all",
  location: "",
  minPrice: "",
  maxPrice: "",
  condition: "all",
  sort: "newest",
  featured: false,
};

function buildParams(filters) {
  const params = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value === "" || value === false || value === "all") return;
    params[key] = value;
  });
  return params;
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export default function Marketplace() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState(() => {
    const requestedType = searchParams.get("type") || "all";
    return {
      ...initialFilters,
      q: searchParams.get("q") || "",
      type: typeFilters.some((item) => item.value === requestedType) ? requestedType : "all",
      category: searchParams.get("category") || "all",
      location: searchParams.get("location") || "",
    };
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadCategories() {
      try {
        const { data } = await api.get("/promotions/categories?type=product&active=true");
        if (!cancelled) setCategories(data.data || []);
      } catch {
        if (!cancelled) setCategories([]);
      }
    }
    loadCategories();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    async function loadProducts() {
      try {
        setLoading(true);
        setError("");
        const { data } = await api.get("/products", { params: buildParams(filters), signal: controller.signal });
        if (!cancelled) setProducts(data.data || []);
      } catch (error) {
        if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError") return;
        if (!cancelled) {
          setError(error.smartSellMessage || "Backend products could not load, so demo products are shown.");
          setProducts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    const timeout = window.setTimeout(loadProducts, 180);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [filters]);

  const visibleProducts = useMemo(() => {
    if (products.length) return products;
    if (filters.type === "all") return featuredProducts;
    return featuredProducts.filter((item) => item.type === filters.type || item.badge?.toLowerCase().includes(filters.type.split("_")[0]));
  }, [filters.type, products]);

  const activeFilterCount = useMemo(() => [
    filters.type !== "all",
    filters.category !== "all",
    Boolean(filters.location),
    Boolean(filters.minPrice),
    Boolean(filters.maxPrice),
    filters.condition !== "all",
    filters.sort !== "newest",
    filters.featured,
  ].filter(Boolean).length, [filters]);

  const pagination = useSmartPagination(visibleProducts, {
    initialPageSize: 10,
    resetKey: JSON.stringify(filters),
  });

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setFilters((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function setType(type) {
    setFilters((current) => ({ ...current, type }));
  }

  function selectCategory(slug) {
    setFilters((current) => ({ ...current, category: current.category === slug ? "all" : slug }));
  }

  function resetFilters() {
    setFilters(initialFilters);
    setFiltersOpen(false);
  }

  return (
    <main className="customer-feed-page customer-discovery-page">
      <SEOHead
        title="Marketplace Products"
        description="Browse SmartSell products from shops, individual sellers, client listings, own products, and used-product owners."
        canonicalPath="/marketplace"
        keywords="SmartSell products, used products, shop products, Sri Lanka marketplace"
      />

      <section className="customer-feed-hero customer-feed-hero-compact">
        <div>
          <span className="customer-eyebrow">Customer Marketplace</span>
          <h1>Discover products from trusted local sellers.</h1>
          <p>Compare new, used, shop, and client listings in one clean marketplace.</p>
        </div>
        <div className="customer-feed-hero-card customer-feed-count-card">
          <span className="customer-count-indicator" aria-hidden="true" />
          <div><strong>{visibleProducts.length}</strong><span>Products available</span></div>
          <small>{loading ? "Refreshing" : "Live catalogue"}</small>
        </div>
      </section>

      <CustomerDiscoveryBar
        variant="marketplace"
        label="Search marketplace"
        value={filters.q}
        onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
        placeholder="Search phones, gifts, laptops, cakes..."
        onReset={resetFilters}
        onToggleFilters={() => setFiltersOpen((current) => !current)}
        filtersOpen={filtersOpen}
        activeFilterCount={activeFilterCount}
      >
        <label className="customer-discovery-field">
          <span className="customer-discovery-field-icon"><LocationIcon /></span>
          <span className="customer-discovery-copy">
            <small>Location</small>
            <input name="location" value={filters.location} onChange={updateField} placeholder="Any city or area" />
          </span>
        </label>
      </CustomerDiscoveryBar>

      <section className={`customer-feed-layout ${filtersOpen ? "filters-open" : ""}`}>
        <aside className="customer-filter-rail" aria-label="Marketplace filters">
          <div className="customer-filter-title">
            <div><b>Refine results</b><small>{activeFilterCount ? `${activeFilterCount} filters active` : "All products shown"}</small></div>
            <button className="customer-filter-close" type="button" onClick={() => setFiltersOpen(false)} aria-label="Close filters">×</button>
          </div>

          <div className="customer-filter-group">
            <span>Listing type</span>
            <div className="customer-segment-list">
              {typeFilters.map((filter) => (
                <button key={filter.value} className={filters.type === filter.value ? "active" : ""} type="button" onClick={() => setType(filter.value)}>{filter.label}</button>
              ))}
            </div>
          </div>

          <div className="customer-filter-group">
            <span>Budget range</span>
            <div className="customer-two-inputs">
              <input name="minPrice" type="number" min="0" value={filters.minPrice} onChange={updateField} placeholder="Min" />
              <input name="maxPrice" type="number" min="0" value={filters.maxPrice} onChange={updateField} placeholder="Max" />
            </div>
          </div>

          <label className="customer-field-label">Condition
            <select name="condition" value={filters.condition} onChange={updateField}>
              <option value="all">Any condition</option>
              <option value="new">New</option>
              <option value="like_new">Like New</option>
              <option value="good">Good</option>
              <option value="used">Used</option>
              <option value="needs_repair">Needs Repair</option>
            </select>
          </label>

          <label className="customer-field-label">Sort
            <select name="sort" value={filters.sort} onChange={updateField}>
              <option value="newest">Newest First</option>
              <option value="featured">Featured First</option>
              <option value="price_asc">Price Low to High</option>
              <option value="price_desc">Price High to Low</option>
              <option value="rating">Best Rated</option>
            </select>
          </label>

          <label className="customer-checkbox-line"><input type="checkbox" name="featured" checked={filters.featured} onChange={updateField} /> Featured only</label>
          {activeFilterCount > 0 && <button className="customer-filter-reset" type="button" onClick={resetFilters}>Clear all filters</button>}
        </aside>

        <div className="customer-feed-main">
          {!!categories.length && (
            <div className="customer-chip-scroll">
              <button className={filters.category === "all" ? "active" : ""} type="button" onClick={() => selectCategory("all")}>All categories</button>
              {categories.map((category) => (
                <button key={category.id} className={filters.category === category.slug ? "active" : ""} type="button" onClick={() => selectCategory(category.slug)}>
                  <span>{category.icon || "□"}</span>{category.name}
                </button>
              ))}
            </div>
          )}

          <div className="customer-feed-toolbar">
            <div><b>{visibleProducts.length} products</b><span>{filters.type === "all" ? "All listing types" : typeFilters.find((item) => item.value === filters.type)?.label}</span></div>
            <small>{error || "Select any product card to open complete listing details."}</small>
          </div>

          {loading && <p className="customer-state-line">Loading marketplace products...</p>}
          <div className="customer-product-grid">
            {pagination.items.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
          <SmartPagination pagination={pagination} label="products" />
        </div>
      </section>
    </main>
  );
}
