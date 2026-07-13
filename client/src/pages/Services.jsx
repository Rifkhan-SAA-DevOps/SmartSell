import { useEffect, useMemo, useState } from "react";
import CustomerDiscoveryBar from "../components/CustomerDiscoveryBar.jsx";
import ServiceCard from "../components/ServiceCard.jsx";
import SEOHead from "../components/SEOHead.jsx";
import SmartPagination from "../components/SmartPagination.jsx";
import useSmartPagination from "../hooks/useSmartPagination.js";
import { services as demoServices } from "../data/demoData.js";
import api from "../utils/api.js";

const initialFilters = {
  q: "",
  category: "all",
  minPrice: "",
  maxPrice: "",
  sort: "newest",
  featured: false,
};

function buildQuery(filters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === "" || value === false || value === "all") return;
    params.set(key, String(value));
  });
  return params.toString() ? `?${params.toString()}` : "";
}

function BudgetIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="6" width="18" height="12" rx="3" />
      <path d="M7 10h.01M17 14h.01M9 12h6" />
    </svg>
  );
}

export default function Services() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadCategories() {
      try {
        const { data } = await api.get("/promotions/categories?type=service&active=true");
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
    async function loadServices() {
      try {
        setLoading(true);
        setError("");
        const { data } = await api.get(`/services${buildQuery(filters)}`);
        if (!cancelled) setServices(data.data || []);
      } catch {
        if (!cancelled) {
          setError("Backend services could not load, so demo services are shown.");
          setServices([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadServices();
    return () => { cancelled = true; };
  }, [filters]);

  const visibleServices = useMemo(() => services.length ? services : demoServices, [services]);
  const activeFilterCount = useMemo(() => [
    filters.category !== "all",
    Boolean(filters.minPrice),
    Boolean(filters.maxPrice),
    filters.sort !== "newest",
    filters.featured,
  ].filter(Boolean).length, [filters]);

  const pagination = useSmartPagination(visibleServices, {
    initialPageSize: 10,
    resetKey: JSON.stringify(filters),
  });

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setFilters((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function selectCategory(slug) {
    setFilters((current) => ({ ...current, category: current.category === slug ? "all" : slug }));
  }

  function resetFilters() {
    setFilters(initialFilters);
    setFiltersOpen(false);
  }

  return (
    <main className="customer-feed-page service-feed-page customer-discovery-page">
      <SEOHead
        title="Service Marketplace"
        description="Find SmartSell services including cake makers, editing, web development, delivery, event services, and custom service providers."
        canonicalPath="/services"
        keywords="SmartSell services, service marketplace, cake makers, editing, web development, delivery"
      />

      <section className="customer-feed-hero service-hero customer-feed-hero-compact">
        <div>
          <span className="customer-eyebrow">Service Marketplace</span>
          <h1>Book skilled local providers with confidence.</h1>
          <p>Compare services, starting prices, ratings, and provider profiles before requesting a quote.</p>
        </div>
        <div className="customer-feed-hero-card teal customer-feed-count-card">
          <span className="customer-count-indicator" aria-hidden="true" />
          <div><strong>{visibleServices.length}</strong><span>Services available</span></div>
          <small>{loading ? "Refreshing" : "Quote ready"}</small>
        </div>
      </section>

      <CustomerDiscoveryBar
        variant="services"
        label="Search services"
        value={filters.q}
        onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
        placeholder="Cake, delivery, editing, websites..."
        onReset={resetFilters}
        onToggleFilters={() => setFiltersOpen((current) => !current)}
        filtersOpen={filtersOpen}
        activeFilterCount={activeFilterCount}
      >
        <div className="customer-discovery-budget">
          <span className="customer-discovery-field-icon"><BudgetIcon /></span>
          <label className="customer-discovery-copy">
            <small>Budget range</small>
            <span className="customer-discovery-budget-inputs">
              <input name="minPrice" type="number" min="0" value={filters.minPrice} onChange={updateField} placeholder="Min" aria-label="Minimum budget" />
              <i>–</i>
              <input name="maxPrice" type="number" min="0" value={filters.maxPrice} onChange={updateField} placeholder="Max" aria-label="Maximum budget" />
            </span>
          </label>
        </div>
      </CustomerDiscoveryBar>

      <section className={`customer-feed-layout service-layout ${filtersOpen ? "filters-open" : ""}`}>
        <aside className="customer-filter-rail" aria-label="Service filters">
          <div className="customer-filter-title">
            <div><b>Refine services</b><small>{activeFilterCount ? `${activeFilterCount} filters active` : "All services shown"}</small></div>
            <button className="customer-filter-close" type="button" onClick={() => setFiltersOpen(false)} aria-label="Close filters">×</button>
          </div>
          <label className="customer-field-label">Sort
            <select name="sort" value={filters.sort} onChange={updateField}>
              <option value="newest">Newest First</option>
              <option value="featured">Featured First</option>
              <option value="price_asc">Price Low to High</option>
              <option value="price_desc">Price High to Low</option>
              <option value="rating">Best Rated</option>
            </select>
          </label>
          <label className="customer-checkbox-line"><input type="checkbox" name="featured" checked={filters.featured} onChange={updateField} /> Featured providers only</label>
          <div className="customer-service-tip"><b>Better quote requests</b><p>Add your date, location, budget, and complete requirement after opening a service.</p></div>
          {activeFilterCount > 0 && <button className="customer-filter-reset" type="button" onClick={resetFilters}>Clear all filters</button>}
        </aside>

        <div className="customer-feed-main">
          {!!categories.length && (
            <div className="customer-chip-scroll">
              <button className={filters.category === "all" ? "active" : ""} type="button" onClick={() => selectCategory("all")}>All services</button>
              {categories.map((category) => (
                <button key={category.id} className={filters.category === category.slug ? "active" : ""} type="button" onClick={() => selectCategory(category.slug)}><span>{category.icon || "✦"}</span>{category.name}</button>
              ))}
            </div>
          )}

          <div className="customer-feed-toolbar">
            <div><b>{visibleServices.length} services</b><span>Available for direct quote requests</span></div>
            <small>{error || "Select any service card to review the provider and full service details."}</small>
          </div>

          {loading && <p className="customer-state-line">Loading services...</p>}
          <div className="customer-service-grid">
            {pagination.items.map((service) => <ServiceCard key={service.id} service={service} />)}
          </div>
          <SmartPagination pagination={pagination} label="services" />
        </div>
      </section>
    </main>
  );
}
