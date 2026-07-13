import "../styles/components/ProductShowcaseCard.css";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import api from "../utils/api.js";

const fallbackImages = {
  own_product: "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=900&q=80",
  seller_product: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=80",
  shop_product: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=900&q=80",
  used_product: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
};

const typeLabels = {
  own_product: "SmartSell item",
  seller_product: "Client listing",
  shop_product: "Shop product",
  used_product: "Used deal",
};

function money(value) {
  const amount = Number(value || 0);
  return amount.toLocaleString("en-LK");
}

function readable(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [added, setAdded] = useState(false);
  const [saved, setSaved] = useState(Boolean(product.saved));
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const image = product.image || product.images?.[0]?.url || fallbackImages[product.type] || fallbackImages.seller_product;
  const stock = Number(product.stock ?? 1);
  const canOrder = stock > 0;

  function handleAddToCart() {
    addToCart({ ...product, image });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1200);
  }

  async function handleToggleWishlist() {
    if (!isAuthenticated) {
      setSaveMessage("Login to save items.");
      window.setTimeout(() => setSaveMessage(""), 1800);
      return;
    }

    try {
      setSaving(true);
      const { data } = await api.post("/wishlist/toggle", { productId: product.id });
      setSaved(Boolean(data.data.saved));
      setSaveMessage(data.message || "Wishlist updated.");
    } catch (error) {
      setSaveMessage(error.response?.data?.message || "Could not update wishlist.");
    } finally {
      setSaving(false);
      window.setTimeout(() => setSaveMessage(""), 1800);
    }
  }

  function openProduct(event) {
    if (event.target.closest("a, button, input, select, textarea")) return;
    navigate(`/products/${product.id}`);
  }

  function handleCardKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigate(`/products/${product.id}`);
    }
  }

  return (
    <article
      className="customer-product-card"
      role="link"
      tabIndex="0"
      aria-label={`Open ${product.name}`}
      onClick={openProduct}
      onKeyDown={handleCardKeyDown}
    >
      <Link className="customer-card-media" to={`/products/${product.id}`} aria-label={`View ${product.name}`}>
        <img src={image} alt={product.name} />
        <span className="customer-card-overlay" />
      </Link>

      <div className="customer-card-topline">
        <span className="customer-listing-badge">{product.badge || typeLabels[product.type] || "Product"}</span>
        {product.isFeatured && <span className="customer-featured-badge">Featured</span>}
      </div>

      <button className={`customer-save-button ${saved ? "saved" : ""}`} type="button" disabled={saving} onClick={handleToggleWishlist} aria-label="Save item">
        <svg viewBox="0 0 24 24"><path d="M20.8 4.6a5.4 5.4 0 0 0-7.7 0L12 5.7l-1.1-1.1a5.4 5.4 0 0 0-7.7 7.7L12 21l8.8-8.7a5.4 5.4 0 0 0 0-7.7Z" /></svg>
      </button>

      <div className="customer-card-body">
        <div className="customer-card-meta-row">
          <span>{product.location || "Sri Lanka"}</span>
          <StarRating average={product.ratingAverage} count={product.reviewCount} />
        </div>

        <h3><Link to={`/products/${product.id}`}>{product.name}</Link></h3>
        <p>{product.description || `${readable(product.condition || "new")} ${product.category || "marketplace"} listing available through SmartSell.`}</p>

        <div className="customer-card-attributes" aria-label="Product details">
          <span>{readable(product.condition || "new")}</span>
          <i aria-hidden="true" />
          <span>{product.category || "General"}</span>
          {stock <= 5 && canOrder && <><i aria-hidden="true" /><span className="stock-low">Only {stock} left</span></>}
        </div>

        <div className="customer-card-footer">
          <div className="customer-price-block">
            <small>Price</small>
            <strong>Rs. {money(product.price)}</strong>
          </div>
          <div className="customer-card-actions">
            <button className="customer-primary-action" type="button" disabled={!canOrder} onClick={handleAddToCart}>
              {added ? "Added" : canOrder ? "Add to cart" : "Out of stock"}
            </button>
          </div>
        </div>

        <div className="customer-card-link-row">
          {product.sellerId ? <Link className="customer-store-link" to={`/storefronts/sellers/${product.sellerId}`}>Seller profile</Link> : <span />}
          <span className="customer-card-open-cue">View details <b aria-hidden="true">→</b></span>
        </div>

        {saveMessage && <small className="customer-card-note">{saveMessage} {!isAuthenticated && <Link to="/login">Login</Link>}</small>}
      </div>
    </article>
  );
}
