import "../styles/components/ServiceShowcaseCard.css";
import { Link, useNavigate } from "react-router-dom";

const fallbackServiceImage = "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80";

function money(value) {
  const amount = Number(value || 0);
  return amount.toLocaleString("en-LK");
}

function StarRating({ average, count }) {
  const rating = Number(average || 0);
  const total = Number(count || 0);
  return (
    <span className="customer-rating-pill">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.9L12 3Z" /></svg>
      {total ? rating.toFixed(1) : "New"}{total ? ` · ${total}` : ""}
    </span>
  );
}

export default function ServiceCard({ service }) {
  const navigate = useNavigate();
  const image = service.image || service.images?.[0]?.url || fallbackServiceImage;
  const price = service.priceFrom ? `From Rs. ${money(service.priceFrom)}` : "Quotation based";

  function openService(event) {
    if (event.target.closest("a, button, input, select, textarea")) return;
    navigate(`/services/${service.id}`);
  }

  function handleCardKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigate(`/services/${service.id}`);
    }
  }

  return (
    <article
      className="customer-service-card"
      role="link"
      tabIndex="0"
      aria-label={`Open ${service.title}`}
      onClick={openService}
      onKeyDown={handleCardKeyDown}
    >
      <Link className="customer-service-media" to={`/services/${service.id}`} aria-label={`View ${service.title}`}>
        <img src={image} alt={service.title} />
        <span className="customer-card-overlay" />
      </Link>

      <div className="customer-card-topline service-topline">
        <span className="customer-listing-badge">{service.category || "Service"}</span>
        {service.isFeatured && <span className="customer-featured-badge">Featured</span>}
      </div>

      <div className="customer-card-body">
        <div className="customer-card-meta-row">
          <span>{service.location || service.time || "Flexible schedule"}</span>
          <StarRating average={service.ratingAverage} count={service.reviewCount} />
        </div>
        <h3><Link to={`/services/${service.id}`}>{service.title}</Link></h3>
        <p>{service.description}</p>

        <div className="customer-card-attributes" aria-label="Service details">
          <span>{service.deliveryTime || service.time || "Quote based"}</span>
          <i aria-hidden="true" />
          <span>{service.serviceMode || "Custom service"}</span>
        </div>

        <div className="customer-card-footer service-card-footer">
          <div className="customer-price-block">
            <small>Starting price</small>
            <strong>{price}</strong>
          </div>
          <div className="customer-card-actions">
            <Link className="customer-primary-action" to={`/services/${service.id}/quote`}>Request quote</Link>
          </div>
        </div>

        <div className="customer-card-link-row">
          {service.providerId ? <Link className="customer-store-link" to={`/storefronts/providers/${service.providerId}`}>Provider profile</Link> : <span />}
          <span className="customer-card-open-cue">View details <b aria-hidden="true">→</b></span>
        </div>
      </div>
    </article>
  );
}
