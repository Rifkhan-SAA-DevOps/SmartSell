import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ProductCard from "../components/ProductCard.jsx";
import ContextMessageButton from "../components/ContextMessageButton.jsx";
import SEOHead from "../components/SEOHead.jsx";
import { CustomerBreadcrumbs, CustomerIcon } from "../components/CustomerUi.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import api from "../utils/api.js";

const fallbackImages = {
  own_product: "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=1200&q=80",
  seller_product: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80",
  shop_product: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1200&q=80",
  used_product: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
};

function money(value) {
  return Number(value || 0).toLocaleString("en-LK");
}

function readable(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function imageList(product) {
  const urls = [];
  if (product?.image) urls.push(product.image);
  if (Array.isArray(product?.images)) {
    product.images.forEach((item) => {
      const url = typeof item === "string" ? item : item?.url;
      if (url) urls.push(url);
    });
  }
  return [...new Set(urls)].filter(Boolean);
}

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [selectedImage, setSelectedImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerBusy, setOfferBusy] = useState(false);
  const [offerForm, setOfferForm] = useState({
    offeredAmount: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    message: "",
  });

  useEffect(() => {
    let cancelled = false;

    async function loadProduct() {
      try {
        setLoading(true);
        setError("");
        const { data } = await api.get(`/products/${id}`);
        const item = data.data;
        if (cancelled) return;
        setProduct(item);
        const firstImage = imageList(item)[0] || fallbackImages[item?.type] || fallbackImages.seller_product;
        setSelectedImage(firstImage);

        if (item?.categorySlug) {
          try {
            const relatedResponse = await api.get(`/products?category=${encodeURIComponent(item.categorySlug)}&limit=5`);
            const items = (relatedResponse.data.data || []).filter((entry) => entry.id !== item.id).slice(0, 4);
            if (!cancelled) setRelated(items);
          } catch {
            if (!cancelled) setRelated([]);
          }
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || "Product could not be loaded.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProduct();
    return () => { cancelled = true; };
  }, [id]);

  const images = useMemo(() => {
    if (!product) return [];
    const list = imageList(product);
    return list.length ? list : [fallbackImages[product.type] || fallbackImages.seller_product];
  }, [product]);

  const stock = Number(product?.stock || 0);
  const canOrder = stock > 0;
  const rating = Number(product?.ratingAverage || 0);
  const reviewCount = Number(product?.reviewCount || 0);
  const canMakeOffer = product?.type === "used_product" || product?.condition === "used" || product?.condition === "like_new";

  function handleAddToCart() {
    if (!product || !canOrder) return;
    addToCart({ ...product, image: selectedImage || images[0] });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  }

  function openOfferForm() {
    if (!isAuthenticated) {
      setMessage("Login to make an offer for this product.");
      return;
    }

    setOfferForm((current) => ({
      ...current,
      offeredAmount: current.offeredAmount || Math.max(1, Math.round(Number(product?.price || 0) * 0.9)),
      customerName: current.customerName || user?.name || "",
      customerPhone: current.customerPhone || user?.phone || "",
      customerEmail: current.customerEmail || user?.email || "",
    }));
    setOfferOpen((current) => !current);
  }

  async function handleSubmitOffer(event) {
    event.preventDefault();
    if (!product) return;

    try {
      setOfferBusy(true);
      setMessage("");
      const { data } = await api.post(`/offers/products/${product.id}`, offerForm);
      setMessage(data.message || "Offer submitted successfully.");
      setOfferOpen(false);
      setOfferForm({ offeredAmount: "", customerName: "", customerPhone: "", customerEmail: "", message: "" });
    } catch (err) {
      setMessage(err.response?.data?.message || "Offer could not be submitted.");
    } finally {
      setOfferBusy(false);
    }
  }

  async function handleWishlist() {
    if (!isAuthenticated) {
      setMessage("Login to save this product.");
      return;
    }
    try {
      const { data } = await api.post("/wishlist/toggle", { productId: product.id });
      setSaved(Boolean(data.data.saved));
      setMessage(data.message || "Wishlist updated.");
    } catch (err) {
      setMessage(err.response?.data?.message || "Wishlist could not be updated.");
    } finally {
      window.setTimeout(() => setMessage(""), 1800);
    }
  }

  if (loading) {
    return (
      <section className="cx-page cx-state-panel" aria-live="polite">
        <span className="cx-state-panel__icon"><CustomerIcon name="package" /></span>
        <h1>Loading product</h1>
        <p>Preparing the listing, gallery, pricing, and seller information.</p>
      </section>
    );
  }

  if (error || !product) {
    return (
      <section className="cx-page cx-state-panel">
        <span className="cx-state-panel__icon"><CustomerIcon name="info" /></span>
        <h1>Product not found</h1>
        <p>{error || "This product is unavailable or has not been approved yet."}</p>
        <Link className="cx-button cx-button--primary" to="/marketplace">Back to Marketplace</Link>
      </section>
    );
  }

  return (
    <section className="cx-page cx-detail-page">
      <SEOHead
        title={product.name}
        description={product.description}
        image={selectedImage || images[0]}
        canonicalPath={`/products/${product.id}`}
        type="product"
        keywords={`${product.name}, ${product.category || "SmartSell product"}, ${readable(product.type)}`}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.description || product.name,
          image: selectedImage || images[0],
          offers: {
            "@type": "Offer",
            priceCurrency: "LKR",
            price: Number(product.price || 0),
            availability: canOrder ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          },
        }}
      />

      <CustomerBreadcrumbs items={[
        { label: "Marketplace", to: "/marketplace" },
        { label: product.category || "Product" },
      ]} />

      <div className="cx-detail-layout">
        <section className="cx-gallery-panel" aria-label={`${product.name} gallery`}>
          <div className="cx-gallery-panel__main">
            <img src={selectedImage || images[0]} alt={product.name} />
            <div className="cx-gallery-panel__badges">
              <span>{product.badge || readable(product.type)}</span>
              {product.isFeatured && <span className="is-featured">Featured</span>}
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
                  aria-label={`View product image ${index + 1}`}
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
            <span><CustomerIcon name="tag" size={15} />{product.category || "Marketplace"}</span>
            <span><CustomerIcon name="location" size={15} />{product.location || "Sri Lanka"}</span>
            <span><CustomerIcon name="star" size={15} />{reviewCount ? `${rating.toFixed(1)} · ${reviewCount} reviews` : "New listing"}</span>
          </div>

          <div className="cx-purchase-panel__title">
            <h1>{product.name}</h1>
            <p>{product.description || "No description added yet."}</p>
          </div>

          <div className="cx-price-block">
            <div>
              <span>Price</span>
              <strong>Rs. {money(product.price)}</strong>
            </div>
            <span className={`cx-stock-status ${canOrder ? "is-available" : "is-unavailable"}`}>
              {canOrder ? `${stock} available` : "Out of stock"}
            </span>
          </div>

          <div className="cx-primary-actions">
            <button className="cx-button cx-button--primary cx-button--large" type="button" disabled={!canOrder} onClick={handleAddToCart}>
              <CustomerIcon name={added ? "check" : "cart"} />
              {added ? "Added to cart" : "Add to cart"}
            </button>
            {canMakeOffer && (
              <button className="cx-button cx-button--outline cx-button--large" type="button" onClick={openOfferForm}>
                <CustomerIcon name="tag" />Make an offer
              </button>
            )}
          </div>

          <div className="cx-secondary-actions">
            <button className="cx-action-link" type="button" onClick={handleWishlist}>
              <CustomerIcon name="heart" />{saved ? "Saved" : "Save item"}
            </button>
            <ContextMessageButton
              contextType="product"
              contextId={product.id}
              subject={`Question about product: ${product.name}`}
              message={`Hi, I want to ask about ${product.name}.`}
              label="Message seller"
              className="cx-action-link"
            />
            <Link className="cx-action-link" to={`/request-anything?product=${encodeURIComponent(product.name)}`}>
              <CustomerIcon name="spark" />Request help
            </Link>
          </div>

          {offerOpen && (
            <form className="cx-expand-panel" onSubmit={handleSubmitOffer}>
              <div className="cx-section-heading cx-section-heading--compact">
                <div>
                  <span className="cx-eyebrow">Price offer</span>
                  <h2>Send your best offer</h2>
                  <p>The seller can accept, reject, or return a counter offer.</p>
                </div>
              </div>
              <div className="cx-form-grid cx-form-grid--two">
                <label>Offer amount<input type="number" min="1" value={offerForm.offeredAmount} onChange={(event) => setOfferForm({ ...offerForm, offeredAmount: event.target.value })} required /></label>
                <label>Your name<input value={offerForm.customerName} onChange={(event) => setOfferForm({ ...offerForm, customerName: event.target.value })} required /></label>
                <label>Phone<input value={offerForm.customerPhone} onChange={(event) => setOfferForm({ ...offerForm, customerPhone: event.target.value })} required /></label>
                <label>Email <small>Optional</small><input type="email" value={offerForm.customerEmail} onChange={(event) => setOfferForm({ ...offerForm, customerEmail: event.target.value })} /></label>
                <label className="cx-form-grid__full">Message <small>Optional</small><textarea rows="3" value={offerForm.message} onChange={(event) => setOfferForm({ ...offerForm, message: event.target.value })} placeholder="Example: I can collect today. Could you consider this price?" /></label>
              </div>
              <div className="cx-form-actions">
                <button className="cx-button cx-button--primary" type="submit" disabled={offerBusy}>{offerBusy ? "Sending..." : "Submit offer"}</button>
                <button className="cx-button cx-button--ghost" type="button" onClick={() => setOfferOpen(false)}>Cancel</button>
              </div>
            </form>
          )}

          {message && (
            <div className="cx-notice" role="status">
              <CustomerIcon name="info" />
              <span>{message} {!isAuthenticated && <Link to="/login">Login</Link>} {message.toLowerCase().includes("submitted") && <Link to="/offers">View offers</Link>}</span>
            </div>
          )}

          <dl className="cx-spec-list">
            <div><dt>Product type</dt><dd>{readable(product.type)}</dd></div>
            <div><dt>Condition</dt><dd>{readable(product.condition || "new")}</dd></div>
            <div><dt>Availability</dt><dd>{canOrder ? `${stock} in stock` : "Unavailable"}</dd></div>
            <div><dt>Customer rating</dt><dd>{reviewCount ? `${rating.toFixed(1)} / 5` : "Not rated yet"}</dd></div>
          </dl>

          <div className="cx-seller-card">
            <span className="cx-seller-card__avatar"><CustomerIcon name="store" /></span>
            <div>
              <small>Sold by</small>
              <strong>{product.sellerName || "SmartSell marketplace seller"}</strong>
              {product.sellerId ? <Link to={`/storefronts/sellers/${product.sellerId}`}>View storefront <CustomerIcon name="arrowRight" size={14} /></Link> : <span>SmartSell managed listing</span>}
            </div>
          </div>
        </aside>
      </div>

      <section className="cx-assurance-strip" aria-label="Purchase assurance">
        <article><CustomerIcon name="shield" /><div><strong>Admin-reviewed listings</strong><p>SmartSell can monitor approvals, orders, delivery, and support.</p></div></article>
        <article><CustomerIcon name="package" /><div><strong>Tracked order journey</strong><p>Keep checkout, fulfillment, and delivery status in one account.</p></div></article>
        <article><CustomerIcon name="message" /><div><strong>Direct help when needed</strong><p>Message the seller or request SmartSell assistance before buying.</p></div></article>
      </section>

      {!!related.length && (
        <section className="cx-related-section">
          <div className="cx-section-heading">
            <div><span className="cx-eyebrow">More to explore</span><h2>Similar products</h2></div>
            <Link className="cx-text-link" to="/marketplace">View all products <CustomerIcon name="arrowRight" size={15} /></Link>
          </div>
          <div className="product-grid enhanced-product-grid related-grid">
            {related.map((item) => <ProductCard key={item.id} product={item} />)}
          </div>
        </section>
      )}
    </section>
  );
}
