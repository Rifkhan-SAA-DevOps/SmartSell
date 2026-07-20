import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard.jsx";
import SmartPagination from "../components/SmartPagination.jsx";
import {
  AccountEmpty,
  AccountIcon,
  AccountPageHeader,
  AccountSearch,
  AccountStatGrid,
  AccountToolbar,
} from "../components/CustomerAccountUi.jsx";
import useSmartPagination from "../hooks/useSmartPagination.js";
import api from "../utils/api.js";

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("saved_newest");

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
    return () => { cancelled = true; };
  }, []);

  const products = useMemo(() => items.map((item) => ({ ...item.product, saved: true, savedAt: item.createdAt || item.updatedAt })).filter(Boolean), [items]);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = query ? products.filter((product) => [product.name, product.category, product.location, product.description]
      .some((value) => String(value || "").toLowerCase().includes(query))) : products;
    return [...result].sort((left, right) => {
      if (sort === "price_low") return Number(left.price || 0) - Number(right.price || 0);
      if (sort === "price_high") return Number(right.price || 0) - Number(left.price || 0);
      if (sort === "name") return String(left.name || "").localeCompare(String(right.name || ""));
      return new Date(right.savedAt || right.createdAt || 0) - new Date(left.savedAt || left.createdAt || 0);
    });
  }, [products, search, sort]);
  const pagination = useSmartPagination(filtered, { initialPageSize: 10, resetKey: `${search}-${sort}` });

  return (
    <section className="ca-account-page ca-wishlist-page">
      <AccountPageHeader
        eyebrow="Saved collection"
        title="Wishlist"
        description="A clean shortlist of products you may want to compare or order later."
        icon="wishlist"
        actions={<Link className="ca-button ca-button--primary" to="/marketplace">Discover products <AccountIcon name="arrow" size={16} /></Link>}
      />

      <AccountStatGrid items={[
        { label: "Saved products", value: products.length, note: "In your shortlist", icon: "heart", tone: "rose" },
        { label: "Ready to compare", value: filtered.length, note: search ? "Matching your search" : "All saved items", icon: "search", tone: "cyan" },
      ]} />

      <AccountToolbar resultText={`${filtered.length} saved product${filtered.length === 1 ? "" : "s"}`}>
        <AccountSearch value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search saved products..." />
        <label className="ca-select-filter"><AccountIcon name="arrow" size={17} /><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort saved products"><option value="saved_newest">Recently saved</option><option value="price_low">Price low to high</option><option value="price_high">Price high to low</option><option value="name">Name A–Z</option></select></label>
      </AccountToolbar>

      {error && <div className="ca-alert ca-alert--error">{error}</div>}
      {loading ? <div className="ca-loading">Loading your wishlist...</div> : filtered.length === 0 ? (
        <AccountEmpty icon="wishlist" title={products.length ? "No matching products" : "Your wishlist is empty"} text={products.length ? "Try a different search term." : "Save products from Marketplace and they will appear here."} actionLabel="Browse marketplace" actionTo="/marketplace" />
      ) : (
        <>
          <div className="product-grid ca-wishlist-grid">
            {pagination.items.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
          <SmartPagination pagination={pagination} label="saved products" compact />
        </>
      )}
    </section>
  );
}
