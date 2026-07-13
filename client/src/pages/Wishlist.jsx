import { useEffect, useState } from "react";
import SectionHeader from "../components/SectionHeader.jsx";
import ProductCard from "../components/ProductCard.jsx";
import api from "../utils/api.js";

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadWishlist() {
      try {
        setError("");
        const { data } = await api.get("/wishlist");
        if (!cancelled) setItems(data.data || []);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || "Failed to load wishlist.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadWishlist();
    return () => {
      cancelled = true;
    };
  }, []);

  const products = items.map((item) => ({ ...item.product, saved: true })).filter(Boolean);

  return (
    <section className="page section">
      <SectionHeader
        eyebrow="Wishlist"
        title="Saved SmartSell products"
        description="Save products you like and come back later before ordering. Wishlist data is stored in PostgreSQL."
      />

      {loading && <p className="form-status">Loading wishlist...</p>}
      {error && <div className="form-alert spaced-alert">{error}</div>}

      {products.length ? (
        <div className="product-grid">
          {products.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      ) : !loading && (
        <div className="empty-business-card">
          <strong>No saved products yet</strong>
          <p>Open Marketplace and click Save on products you want to remember.</p>
        </div>
      )}
    </section>
  );
}
