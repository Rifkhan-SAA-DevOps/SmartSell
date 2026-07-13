import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ServiceCard from "../components/ServiceCard.jsx";
import ContextMessageButton from "../components/ContextMessageButton.jsx";
import SEOHead from "../components/SEOHead.jsx";
import { CustomerBreadcrumbs, CustomerIcon } from "../components/CustomerUi.jsx";
import api from "../utils/api.js";

const fallbackServiceImage = "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80";

function money(value) {
  return Number(value || 0).toLocaleString("en-LK");
}

function imageList(service) {
  const urls = [];
  if (service?.image) urls.push(service.image);
  if (Array.isArray(service?.images)) {
    service.images.forEach((item) => {
      const url = typeof item === "string" ? item : item?.url;
      if (url) urls.push(url);
    });
  }
  return [...new Set(urls)].filter(Boolean);
}

export default function ServiceDetail() {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [related, setRelated] = useState([]);
  const [selectedImage, setSelectedImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadService() {
      try {
        setLoading(true);
        setError("");
        const { data } = await api.get(`/services/${id}`);
        const item = data.data;
        if (cancelled) return;
        setService(item);
        setSelectedImage(imageList(item)[0] || fallbackServiceImage);

        if (item?.categorySlug) {
          try {
            const relatedResponse = await api.get(`/services?category=${encodeURIComponent(item.categorySlug)}&limit=5`);
            const items = (relatedResponse.data.data || []).filter((entry) => entry.id !== item.id).slice(0, 4);
            if (!cancelled) setRelated(items);
          } catch {
            if (!cancelled) setRelated([]);
          }
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || "Service could not be loaded.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadService();
    return () => { cancelled = true; };
  }, [id]);

  const images = useMemo(() => {
    if (!service) return [];
    const list = imageList(service);
    return list.length ? list : [fallbackServiceImage];
  }, [service]);

  const rating = Number(service?.ratingAverage || 0);
  const reviewCount = Number(service?.reviewCount || 0);
  const quoteLink = service ? `/services/${service.id}/quote` : "/request-anything";

  if (loading) {
    return (
      <section className="cx-page cx-state-panel" aria-live="polite">
        <span className="cx-state-panel__icon"><CustomerIcon name="spark" /></span>
        <h1>Loading service</h1>
        <p>Preparing the provider, pricing, gallery, and quotation information.</p>
      </section>
    );
  }

  if (error || !service) {
    return (
      <section className="cx-page cx-state-panel">
        <span className="cx-state-panel__icon"><CustomerIcon name="info" /></span>
        <h1>Service not found</h1>
        <p>{error || "This service is unavailable or has not been approved yet."}</p>
        <Link className="cx-button cx-button--primary" to="/services">Back to Services</Link>
      </section>
    );
  }

  return (
    <section className="cx-page cx-detail-page">
      <SEOHead
        title={service.title}
        description={service.description}
        image={selectedImage || images[0]}
        canonicalPath={`/services/${service.id}`}
        type="article"
        keywords={`${service.title}, ${service.category || "SmartSell service"}, service quote`}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: service.title,
          description: service.description || service.title,
          provider: { "@type": "Organization", name: service.providerName || service.providerType || "SmartSell provider" },
          areaServed: "Sri Lanka",
        }}
      />

      <CustomerBreadcrumbs items={[
        { label: "Services", to: "/services" },
        { label: service.category || "Service" },
      ]} />

      <div className="cx-detail-layout">
        <section className="cx-gallery-panel" aria-label={`${service.title} gallery`}>
          <div className="cx-gallery-panel__main">
            <img src={selectedImage || images[0]} alt={service.title} />
            <div className="cx-gallery-panel__badges">
              <span>Professional service</span>
              {service.isFeatured && <span className="is-featured">Featured</span>}
            </div>
          </div>
          {images.length > 1 && (
            <div className="cx-gallery-panel__thumbs">
              {images.map((url, index) => (
                <button
                  key={url}
                  className={selectedImage === url ? "is-active" : ""}
                  type="button"
                  onClick={() => setSelectedImage(url)}
                  aria-label={`View service image ${index + 1}`}
                  aria-pressed={selectedImage === url}
                >
                  <img src={url} alt="" />
                </button>
              ))}
            </div>
          )}
        </section>

        <aside className="cx-purchase-panel">
          <div className="cx-listing-meta">
            <span><CustomerIcon name="tag" size={15} />{service.category || "Service"}</span>
            <span><CustomerIcon name="clock" size={15} />{service.time || "Schedule by quote"}</span>
            <span><CustomerIcon name="star" size={15} />{reviewCount ? `${rating.toFixed(1)} · ${reviewCount} reviews` : "New service"}</span>
          </div>

          <div className="cx-purchase-panel__title">
            <h1>{service.title}</h1>
            <p>{service.description || "No service description added yet."}</p>
          </div>

          <div className="cx-price-block">
            <div>
              <span>Starting price</span>
              <strong>{service.priceFrom ? `Rs. ${money(service.priceFrom)}` : "Quotation based"}</strong>
            </div>
            <span className="cx-stock-status is-quote">Custom quote</span>
          </div>

          <p className="cx-supporting-copy">Share your budget, location, preferred date, and exact requirement to receive a clear quotation before work begins.</p>

          <div className="cx-primary-actions">
            <Link className="cx-button cx-button--primary cx-button--large" to={quoteLink}>
              <CustomerIcon name="message" />Request quotation
            </Link>
            <Link className="cx-button cx-button--outline cx-button--large" to={`/request-anything?service=${encodeURIComponent(service.title)}`}>
              <CustomerIcon name="spark" />Custom request
            </Link>
          </div>

          <div className="cx-secondary-actions cx-secondary-actions--single">
            <ContextMessageButton
              contextType="service"
              contextId={service.id}
              subject={`Question about service: ${service.title}`}
              message={`Hi, I want to discuss the service: ${service.title}.`}
              label="Message provider"
              className="cx-action-link"
            />
          </div>

          <dl className="cx-spec-list">
            <div><dt>Service category</dt><dd>{service.category || "Service"}</dd></div>
            <div><dt>Pricing method</dt><dd>{service.priceFrom ? "Starts from listed price" : "Based on quotation"}</dd></div>
            <div><dt>Provider</dt><dd>{service.providerName || service.providerType || "SmartSell provider"}</dd></div>
            <div><dt>Customer rating</dt><dd>{reviewCount ? `${rating.toFixed(1)} / 5` : "Not rated yet"}</dd></div>
          </dl>

          <div className="cx-seller-card">
            <span className="cx-seller-card__avatar"><CustomerIcon name="user" /></span>
            <div>
              <small>Provided by</small>
              <strong>{service.providerName || service.providerType || "SmartSell service provider"}</strong>
              {service.providerId ? <Link to={`/storefronts/providers/${service.providerId}`}>View provider profile <CustomerIcon name="arrowRight" size={14} /></Link> : <span>SmartSell managed service</span>}
            </div>
          </div>
        </aside>
      </div>

      <section className="cx-process-section">
        <div className="cx-section-heading">
          <div><span className="cx-eyebrow">How it works</span><h2>A clear service process from request to review</h2></div>
        </div>
        <div className="cx-process-grid">
          <article><span>01</span><div><strong>Share the requirement</strong><p>Add your date, location, budget, and expected result.</p></div></article>
          <article><span>02</span><div><strong>Receive a quotation</strong><p>The provider or SmartSell reviews the work and sends pricing.</p></div></article>
          <article><span>03</span><div><strong>Track the work</strong><p>Keep updates, messages, and status changes in your account.</p></div></article>
          <article><span>04</span><div><strong>Review after completion</strong><p>Rate the service and help other customers choose confidently.</p></div></article>
        </div>
      </section>

      {!!related.length && (
        <section className="cx-related-section">
          <div className="cx-section-heading">
            <div><span className="cx-eyebrow">More providers</span><h2>Similar services</h2></div>
            <Link className="cx-text-link" to="/services">View all services <CustomerIcon name="arrowRight" size={15} /></Link>
          </div>
          <div className="service-grid full enhanced-service-grid related-grid">
            {related.map((item) => <ServiceCard key={item.id} service={item} />)}
          </div>
        </section>
      )}
    </section>
  );
}
