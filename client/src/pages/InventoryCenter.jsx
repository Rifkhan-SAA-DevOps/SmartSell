import { useEffect, useMemo, useState } from "react";
import SmartPagination from "../components/SmartPagination.jsx";
import {
  BusinessEmptyState,
  BusinessIcon,
  BusinessInfoGrid,
  BusinessMetricCard,
  BusinessModal,
  BusinessPageHeader,
  BusinessSearchToolbar,
  BusinessStatusBadge,
} from "../components/BusinessWorkspaceUi.jsx";
import useSmartPagination from "../hooks/useSmartPagination.js";
import api from "../utils/api.js";
import "../styles/pages/business/BusinessWorkspace.css";
import "../styles/pages/business/BusinessManagement.css";

const currency = new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 });
function money(value) { return currency.format(Number(value || 0)); }
function readable(value) { return String(value || "").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function formatDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : date.toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" });
}
function stockStatus(status) {
  if (status === "out_of_stock") return "out_of_stock";
  if (status === "low_stock") return "pending";
  if (status === "not_tracked") return "archived";
  return "available";
}

export default function InventoryCenter() {
  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [tab, setTab] = useState("products");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [form, setForm] = useState({ mode: "set", quantity: "", lowStockThreshold: "", reason: "" });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [summaryRes, productsRes, movementsRes] = await Promise.all([
        api.get("/inventory/summary"),
        api.get("/inventory/products", { params: { q: search, stockStatus: stockFilter } }),
        api.get("/inventory/movements", { params: { limit: 120 } }),
      ]);
      setSummary(summaryRes.data.data || null);
      setProducts(productsRes.data.data || []);
      setMovements(movementsRes.data.data || []);
    } catch (requestError) {
      setError(requestError.smartSellMessage || requestError.response?.data?.message || "Could not load inventory.");
    } finally { setLoading(false); }
  }

  useEffect(() => {
    const timeout = setTimeout(loadData, 250);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockFilter]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((item) => !query || `${item.name} ${item.sku} ${item.brand} ${item.category}`.toLowerCase().includes(query));
  }, [products, search]);
  const filteredMovements = useMemo(() => {
    const query = search.trim().toLowerCase();
    return movements.filter((item) => !query || `${item.productName} ${item.type} ${item.reason} ${item.reference}`.toLowerCase().includes(query));
  }, [movements, search]);
  const productPagination = useSmartPagination(filteredProducts, { initialPageSize: 10, resetKey: `${search}-${stockFilter}` });
  const movementPagination = useSmartPagination(filteredMovements, { initialPageSize: 10, resetKey: `movement-${search}` });

  const stats = useMemo(() => summary || {
    totalProducts: products.length,
    stockTracked: products.filter((item) => item.isStockTracked).length,
    lowStock: products.filter((item) => item.stockStatus === "low_stock").length,
    outOfStock: products.filter((item) => item.stockStatus === "out_of_stock").length,
    totalUnits: products.reduce((sum, item) => sum + Number(item.stock || 0), 0),
    totalStockValue: products.reduce((sum, item) => sum + Number(item.stock || 0) * Number(item.price || 0), 0),
  }, [summary, products]);

  function openProduct(product) {
    setSelectedProduct(product);
    setForm({ mode: "set", quantity: String(product.stock ?? 0), lowStockThreshold: String(product.lowStockThreshold ?? 5), reason: "Manual stock correction" });
    setMessage("");
  }

  async function submitAdjustment(event) {
    event.preventDefault();
    if (!selectedProduct) return;
    setBusy(true); setError("");
    try {
      await api.patch(`/inventory/products/${selectedProduct.id}/stock`, {
        ...form,
        quantity: Number(form.quantity || 0),
        lowStockThreshold: Number(form.lowStockThreshold || 5),
        type: form.mode === "add" ? "restock" : form.mode === "subtract" ? "correction" : "adjustment",
      });
      setMessage("Stock updated successfully.");
      setSelectedProduct(null);
      await loadData();
    } catch (requestError) {
      setError(requestError.smartSellMessage || requestError.response?.data?.message || "Could not update stock.");
    } finally { setBusy(false); }
  }

  return (
    <section className="business-workspace-v2 business-management-v2 business-inventory-v2">
      <BusinessPageHeader
        eyebrow="Stock operations"
        title="Inventory control"
        description="Monitor available units, stock value, low-stock risk, and every inventory movement without crowded table actions."
        meta={<><span><BusinessIcon name="inventory" size={15} />{stats.totalUnits || 0} total units</span><span><BusinessIcon name="wallet" size={15} />{money(stats.totalStockValue)}</span></>}
        actions={<button className="business-primary-button-v2" type="button" onClick={loadData} disabled={loading}><BusinessIcon name="refresh" size={17} />Refresh inventory</button>}
      />

      {error && <div className="business-error-v2"><strong>Inventory action needs attention</strong><p>{error}</p></div>}
      {message && <div className="bm-notice-v2 success"><BusinessIcon name="check" size={18} /><span>{message}</span></div>}

      <div className="business-metrics-grid-v2 bm-six-metrics-v2">
        <BusinessMetricCard icon="box" label="Products" value={stats.totalProducts || 0} note="All inventory listings" tone="blue" />
        <BusinessMetricCard icon="inventory" label="Stock tracked" value={stats.stockTracked || 0} note="Automatic availability" tone="violet" />
        <BusinessMetricCard icon="alert" label="Low stock" value={stats.lowStock || 0} note="Require attention soon" tone="amber" />
        <BusinessMetricCard icon="close" label="Out of stock" value={stats.outOfStock || 0} note="Unavailable to customers" tone="amber" />
        <BusinessMetricCard icon="layers" label="Total units" value={stats.totalUnits || 0} note="Across tracked products" tone="emerald" />
        <BusinessMetricCard icon="wallet" label="Stock value" value={money(stats.totalStockValue)} note="Based on listed prices" tone="emerald" />
      </div>

      <section className="business-content-panel-v2 bm-management-panel-v2">
        <div className="business-tab-list-v2" role="tablist" aria-label="Inventory records">
          <button type="button" className={tab === "products" ? "active" : ""} onClick={() => setTab("products")}><BusinessIcon name="box" size={18} /><span>Product stock</span><b>{products.length}</b></button>
          <button type="button" className={tab === "movements" ? "active" : ""} onClick={() => setTab("movements")}><BusinessIcon name="history" size={18} /><span>Movement history</span><b>{movements.length}</b></button>
        </div>
        <div className="business-tab-content-v2">
          <BusinessSearchToolbar
            value={search}
            onChange={setSearch}
            placeholder={tab === "products" ? "Search product, SKU, brand, or category" : "Search product, movement type, reason, or reference"}
            filter={tab === "products" ? <select value={stockFilter} onChange={(event) => setStockFilter(event.target.value)}><option value="all">All stock statuses</option><option value="available">Available</option><option value="low">Low stock</option><option value="out">Out of stock</option></select> : null}
          />

          {loading ? <div className="business-loading-v2"><span /><p>Loading inventory records...</p></div> : tab === "products" ? (
            !filteredProducts.length ? <BusinessEmptyState icon="inventory" title="No inventory products found" description={products.length ? "Change the search term or stock filter." : "Product inventory will appear after products are created."} /> : <div className="business-table-panel-v2"><div className="business-table-scroll-v2"><table className="business-table-v2 bm-inventory-table-v2"><thead><tr><th>Product</th><th>SKU / Brand</th><th>Available stock</th><th>Threshold</th><th>Stock value</th><th>Status</th><th aria-label="Open" /></tr></thead><tbody>{productPagination.items.map((product) => <tr key={product.id} tabIndex="0" onClick={() => openProduct(product)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") openProduct(product); }}><td><strong>{product.name}</strong><small>{product.category || "Uncategorized"}</small></td><td><strong>{product.sku || "No SKU"}</strong><small>{product.brand || "No brand"}</small></td><td><div className="bm-stock-value-v2"><strong>{product.stock ?? 0}</strong><i><u style={{ width: `${Math.min(100, Math.max(4, Number(product.stock || 0) / Math.max(Number(product.lowStockThreshold || 5) * 2, 1) * 100))}%` }} /></i></div></td><td>{product.lowStockThreshold ?? 5}</td><td><strong>{money(Number(product.stock || 0) * Number(product.price || 0))}</strong></td><td><BusinessStatusBadge status={stockStatus(product.stockStatus)} /></td><td><BusinessIcon name="chevron" size={18} /></td></tr>)}</tbody></table></div><SmartPagination pagination={productPagination} label="products" /></div>
          ) : !filteredMovements.length ? <BusinessEmptyState icon="history" title="No stock movements found" description={movements.length ? "Change the search term." : "Sales, restocks, and manual corrections will appear here."} /> : <div className="bm-card-list-v2">{movementPagination.items.map((movement) => <article className="bm-clickable-row-v2" key={movement.id} role="button" tabIndex="0" onClick={() => setSelectedMovement(movement)} onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && setSelectedMovement(movement)}><span className={`bm-row-icon-v2 ${Number(movement.quantity || 0) >= 0 ? "tone-emerald" : "tone-amber"}`}><BusinessIcon name={Number(movement.quantity || 0) >= 0 ? "download" : "history"} /></span><div className="bm-row-main-v2"><div><h3>{movement.productName || "Product"}</h3><strong className={Number(movement.quantity || 0) >= 0 ? "bm-positive-v2" : "bm-negative-v2"}>{Number(movement.quantity || 0) > 0 ? "+" : ""}{movement.quantity}</strong></div><p>{readable(movement.type)} · {movement.reason || "No reason recorded"}</p><small>{movement.previousStock} → {movement.newStock} units · {formatDate(movement.createdAt)}</small></div><BusinessIcon name="chevron" size={18} /></article>)}<SmartPagination pagination={movementPagination} label="movements" /></div>}
        </div>
      </section>

      <BusinessModal open={Boolean(selectedProduct)} title={selectedProduct?.name || "Product stock"} eyebrow="Inventory details" onClose={() => setSelectedProduct(null)}>
        {selectedProduct && <><div className="business-modal-status-line-v2"><BusinessStatusBadge status={stockStatus(selectedProduct.stockStatus)} /></div><BusinessInfoGrid items={[{ label: "Current stock", value: selectedProduct.stock ?? 0 }, { label: "Low-stock threshold", value: selectedProduct.lowStockThreshold ?? 5 }, { label: "SKU", value: selectedProduct.sku || "Not set" }, { label: "Brand", value: selectedProduct.brand || "Not set" }, { label: "Unit price", value: money(selectedProduct.price) }, { label: "Current stock value", value: money(Number(selectedProduct.stock || 0) * Number(selectedProduct.price || 0)) }]} /><form className="business-editor-v2" onSubmit={submitAdjustment}><div className="bm-section-heading-v2"><div><span>Stock adjustment</span><h3>Update this product safely</h3></div></div><div className="business-form-grid-v2 two-columns"><label><span>Adjustment mode</span><select value={form.mode} onChange={(event) => setForm((current) => ({ ...current, mode: event.target.value }))}><option value="set">Set exact stock</option><option value="add">Add stock</option><option value="subtract">Subtract stock</option></select></label><label><span>Quantity</span><input type="number" min="0" value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} required /></label><label><span>Low-stock threshold</span><input type="number" min="0" value={form.lowStockThreshold} onChange={(event) => setForm((current) => ({ ...current, lowStockThreshold: event.target.value }))} /></label><label><span>Reason</span><input value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} placeholder="Restock, correction, damaged stock..." /></label></div><div className="business-modal-action-row-v2"><button className="business-ghost-button-v2" type="button" onClick={() => setSelectedProduct(null)}>Cancel</button><button className="business-primary-button-v2" type="submit" disabled={busy}>{busy ? "Saving..." : "Save stock adjustment"}</button></div></form></>}
      </BusinessModal>

      <BusinessModal open={Boolean(selectedMovement)} title={selectedMovement?.productName || "Stock movement"} eyebrow="Movement details" onClose={() => setSelectedMovement(null)} size="medium">
        {selectedMovement && <><div className="bm-movement-amount-v2"><span>Quantity change</span><strong className={Number(selectedMovement.quantity || 0) >= 0 ? "bm-positive-v2" : "bm-negative-v2"}>{Number(selectedMovement.quantity || 0) > 0 ? "+" : ""}{selectedMovement.quantity}</strong></div><BusinessInfoGrid items={[{ label: "Movement type", value: readable(selectedMovement.type) }, { label: "Previous stock", value: selectedMovement.previousStock }, { label: "New stock", value: selectedMovement.newStock }, { label: "Recorded", value: formatDate(selectedMovement.createdAt) }, { label: "Reference", value: selectedMovement.reference || "Not set" }, { label: "Reason", value: selectedMovement.reason || "Not recorded" }]} /></>}
      </BusinessModal>
    </section>
  );
}
