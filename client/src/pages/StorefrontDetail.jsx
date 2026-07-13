import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ProductCard from "../components/ProductCard.jsx";
import ServiceCard from "../components/ServiceCard.jsx";
import SmartPagination from "../components/SmartPagination.jsx";
import useSmartPagination from "../hooks/useSmartPagination.js";
import { CustomerBreadcrumbs, CustomerIcon } from "../components/CustomerUi.jsx";
import api from "../utils/api.js";
import SEOHead from "../components/SEOHead.jsx";


function endpointFor(kind, id) {
  return kind === "providers" ? `/storefronts/providers/${id}` : `/storefronts/sellers/${id}`;
}

function initials(value) {
  return String(value || "SmartSell")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function StorefrontDetail() {
  const { kind, id } = useParams();
  const [storefront, setStorefront] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadStorefront() {
      try {
        setLoading(true);
        setError("");
        const { data } = await api.get(endpointFor(kind, id));
        if (!cancelled) {
          setStorefront(data.data || null);
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || "Storefront not found.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadStorefront();
    return () => { cancelled = true; };
  }, [kind, id]);

  const isProvider = storefront?.kind === "provider" || kind === "providers";
  const listings = useMemo(
    () => (isProvider ? storefront?.services || [] : storefront?.products || []),
    [isProvider, storefront]
  );
  const pagination = useSmartPagination(listings, {
    initialPageSize: 10,
    resetKey: `${kind}-${id}-${listings.length}`,
  });
  const visibleListings = pagination.items;
  const rating = Number(storefront?.ratingAverage || 0);
  const reviewCount = Number(storefront?.reviewCount || 0);

  if (loading) {
    return (
      <section className="cx-page cx-state-panel" aria-live="polite">
        <span className="cx-state-panel__icon"><CustomerIcon name="store" /></span>
        <h1>Loading storefront</h1>
        <p>Preparing the profile, contact information, ratings, and approved listings.</p>
      </section>
    );
  }

  if (error || !storefront) {
    return (
      <section className="cx-page cx-state-panel">
        <span className="cx-state-panel__icon"><CustomerIcon name="info" /></span>
        <h1>Storefront not found</h1>
        <p>{error || "The storefront may not be approved yet or may have been removed."}</p>
        <Link className="cx-button cx-button--primary" to="/storefronts">Back to Storefronts</Link>
      </section>
    );
  }

  return (
    <section className="cx-page cx-storefront-page">
      <SEOHead
        title={storefront.name}
        description={storefront.description}
        canonicalPath={`/storefronts/${kind}/${id}`}
        keywords={`${storefront.name}, SmartSell storefront, ${storefront.location || "Sri Lanka"}`}
        structuredData={{
          "@context": "https://schema.org",
          "@type": isProvider ? "ProfessionalService" : "Store",
          name: storefront.name,
          description: storefront.description,
          telephone: storefront.phone || "",
          email: storefront.email || "",
          areaServed: storefront.location || "Sri Lanka",
        }}
      />

      <CustomerBreadcrumbs items={[
        { label: "Storefronts", to: "/storefronts" },
        { label: storefront.name },
      ]} />

      <header className="cx-storefront-profile">
        <div className="cx-storefront-profile__cover" aria-hidden="true">
          <span>{isProvider ? "Verified service provider" : "Approved SmartSell storefront"}</span>
        </div>
        <div className="cx-storefront-profile__body">
          <div className="cx-storefront-profile__identity">
            <span className="cx-storefront-profile__avatar">{storefront.avatar || initials(storefront.name)}</span>
            <div>
              <div className="cx-listing-meta">
                <span><CustomerIcon name={isProvider ? "user" : "store"} size={15} />{storefront.badge || (isProvider ? "Service provider" : "Seller storefront")}</span>
                <span><CustomerIcon name="location" size={15} />{storefront.location || "Sri Lanka"}</span>
              </div>
              <h1>{storefront.name}</h1>
              <p>{storefront.description || "Discover approved listings and contact this SmartSell business directly."}</p>
            </div>
          </div>

          <div className="cx-storefront-profile__actions">
            <Link className="cx-button cx-button--primary" to={`/request-anything?provider=${encodeURIComponent(storefront.name)}`}>
              <CustomerIcon name="spark" />Request from this {isProvider ? "provider" : "store"}
            </Link>
            <Link className="cx-button cx-button--outline" to="/storefronts">
              <CustomerIcon name="arrowLeft" />All storefronts
            </Link>
          </div>
        </div>

        <div className="cx-storefront-profile__footer">
          <div className="cx-storefront-stat"><span>Rating</span><strong>{reviewCount ? rating.toFixed(1) : "New"}</strong><small>{reviewCount ? `${reviewCount} customer reviews` : "No reviews yet"}</small></div>
          <div className="cx-storefront-stat"><span>Approved listings</span><strong>{storefront.listingCount ?? listings.length}</strong><small>{storefront.listingLabel || (isProvider ? "Services available" : "Products available")}</small></div>
          <div className="cx-storefront-stat"><span>Business type</span><strong>{isProvider ? "Services" : "Products"}</strong><small>Managed through SmartSell</small></div>
          <div className="cx-storefront-contact-list">
            {storefront.phone && <a href={`tel:${storefront.phone}`}><CustomerIcon name="phone" />{storefront.phone}</a>}
            {storefront.email && <a href={`mailto:${storefront.email}`}><CustomerIcon name="mail" />{storefront.email}</a>}
          </div>
        </div>
      </header>

      <section className="cx-listing-section">
        <div className="cx-section-heading">
          <div>
            <span className="cx-eyebrow">Approved catalogue</span>
            <h2>{isProvider ? "Services from this provider" : "Products from this storefront"}</h2>
            <p>{listings.length ? `Showing ${pagination.startItem}–${pagination.endItem} of ${listings.length} listings.` : "Approved listings will appear here when available."}</p>
          </div>
        </div>

        {visibleListings.length ? (
          <>
            <div className={isProvider ? "service-grid full enhanced-service-grid" : "product-grid enhanced-product-grid"}>
              {isProvider
                ? visibleListings.map((service) => <ServiceCard key={service.id} service={service} />)
                : visibleListings.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
            <SmartPagination pagination={pagination} label="listings" />
          </>
        ) : (
          <div className="cx-state-panel cx-state-panel--compact">
            <span className="cx-state-panel__icon"><CustomerIcon name="package" /></span>
            <h2>No approved listings yet</h2>
            <p>This storefront is approved, but public products or services are not available yet.</p>
          </div>
        )}
      </section>
    </section>
  );
}
