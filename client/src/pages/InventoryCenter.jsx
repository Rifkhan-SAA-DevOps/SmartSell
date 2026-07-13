import { useEffect, useMemo, useState } from "react";
import api from "../utils/api.js";
import "../styles/pages/business/InventoryCatalog.css";

function money(value) {
  return `Rs. ${Number(value || 0).toLocaleString()}`;
}

function statusLabel(value) {
  return String(value || "ok").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function stockClass(status) {
  if (status === "out_of_stock") return "danger";
  if (status === "low_stock") return "warning";
  if (status === "not_tracked") return "muted";
  return "success";
}

export default function InventoryCenter() {
  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [filters, setFilters] = useState({ q: "", stockStatus: "all" });
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ mode: "set", quantity: "", lowStockThreshold: "", reason: "" });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function loadData() {
    setLoading(true);
    setMessage("");
    try {
      const [summaryRes, productsRes, movementsRes] = await Promise.all([
        api.get("/inventory/summary"),
        api.get("/inventory/products", { params: filters }),
        api.get("/inventory/movements", { params: { limit: 30 } }),
      ]);
      setSummary(summaryRes.data.data || null);
      setProducts(productsRes.data.data || []);
      setMovements(movementsRes.data.data || []);
    } catch (error) {
      setMessage(error.smartSellMessage || "Could not load inventory.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(loadData, 250);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.q, filters.stockStatus]);

  function openAdjust(product) {
    setSelected(product);
    setForm({ mode: "set", quantity: String(product.stock ?? 0), lowStockThreshold: String(product.lowStockThreshold ?? 5), reason: "Manual stock correction" });
    setMessage("");
  }

  async function submitAdjustment(event) {
    event.preventDefault();
    if (!selected) return;
    setBusy(true);
    setMessage("");
    try {
      await api.patch(`/inventory/products/${selected.id}/stock`, {
        ...form,
        quantity: Number(form.quantity || 0),
        lowStockThreshold: Number(form.lowStockThreshold || 5),
        type: form.mode === "add" ? "restock" : form.mode === "subtract" ? "correction" : "adjustment",
      });
      setMessage("Stock updated successfully.");
      setSelected(null);
      await loadData();
    } catch (error) {
      setMessage(error.smartSellMessage || "Could not update stock.");
    } finally {
      setBusy(false);
    }
  }

  const stats = useMemo(() => summary || {
    totalProducts: products.length,
    stockTracked: products.filter((item) => item.isStockTracked).length,
    lowStock: products.filter((item) => item.stockStatus === "low_stock").length,
    outOfStock: products.filter((item) => item.stockStatus === "out_of_stock").length,
    totalUnits: products.reduce((sum, item) => sum + Number(item.stock || 0), 0),
    totalStockValue: products.reduce((sum, item) => sum + Number(item.stock || 0) * Number(item.price || 0), 0),
  }, [summary, products]);

  return (
    <main className="inventory-page page-shell">
      <section className="inventory-hero">
        <div>
          <span className="eyebrow">Inventory Control</span>
          <h1>Stock control, low-stock alerts, and movement history</h1>
          <p>Track available units, detect low-stock products, adjust inventory safely, and keep a basic movement log for sales and corrections.</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={loadData} disabled={loading}>Refresh</button>
      </section>

      {message && <div className="inventory-alert">{message}</div>}

      <section className="inventory-stat-grid">
        <article><span>Total products</span><strong>{stats.totalProducts}</strong></article>
        <article><span>Tracked products</span><strong>{stats.stockTracked}</strong></article>
        <article><span>Low stock</span><strong>{stats.lowStock}</strong></article>
        <article><span>Out of stock</span><strong>{stats.outOfStock}</strong></article>
        <article><span>Total units</span><strong>{stats.totalUnits}</strong></article>
        <article><span>Stock value</span><strong>{money(stats.totalStockValue)}</strong></article>
      </section>

      <section className="inventory-panel">
        <div className="inventory-panel-head">
          <div>
            <h2>Product inventory</h2>
            <p>Click adjust to update stock and threshold values.</p>
          </div>
          <div className="inventory-filter-row">
            <input value={filters.q} onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value }))} placeholder="Search product, SKU, brand..." />
            <select value={filters.stockStatus} onChange={(event) => setFilters((prev) => ({ ...prev, stockStatus: event.target.value }))}>
              <option value="all">All stock</option>
              <option value="available">Available</option>
              <option value="low">Low stock</option>
              <option value="out">Out of stock</option>
            </select>
          </div>
        </div>

        <div className="inventory-table-wrap">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Brand</th>
                <th>Stock</th>
                <th>Threshold</th>
                <th>Status</th>
                <th>Value</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td><strong>{product.name}</strong><small>{product.category || "Uncategorized"}</small></td>
                  <td>{product.sku || "—"}</td>
                  <td>{product.brand || "—"}</td>
                  <td>{product.stock}</td>
                  <td>{product.lowStockThreshold}</td>
                  <td><span className={`stock-pill ${stockClass(product.stockStatus)}`}>{statusLabel(product.stockStatus)}</span></td>
                  <td>{money(Number(product.stock || 0) * Number(product.price || 0))}</td>
                  <td><button className="btn btn-outline" type="button" onClick={() => openAdjust(product)}>Adjust</button></td>
                </tr>
              ))}
              {!products.length && !loading && <tr><td colSpan="8">No inventory products found.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="inventory-panel">
        <div className="inventory-panel-head">
          <div>
            <h2>Recent movements</h2>
            <p>Sales, restocks, and manual corrections are recorded here.</p>
          </div>
        </div>
        <div className="inventory-movement-list">
          {movements.map((movement) => (
            <article key={movement.id}>
              <div>
                <strong>{movement.productName || "Product"}</strong>
                <span>{movement.type} • {movement.reason || "No reason"}</span>
              </div>
              <b>{movement.quantity > 0 ? "+" : ""}{movement.quantity}</b>
              <small>{movement.previousStock} → {movement.newStock}</small>
            </article>
          ))}
          {!movements.length && <p>No stock movements yet.</p>}
        </div>
      </section>

      {selected && (
        <div className="inventory-modal-backdrop" onMouseDown={() => setSelected(null)}>
          <form className="inventory-modal" onSubmit={submitAdjustment} onMouseDown={(event) => event.stopPropagation()}>
            <div className="inventory-panel-head">
              <div>
                <h2>Adjust stock</h2>
                <p>{selected.name}</p>
              </div>
              <button type="button" className="btn btn-outline" onClick={() => setSelected(null)}>Close</button>
            </div>
            <label>Mode
              <select value={form.mode} onChange={(event) => setForm((prev) => ({ ...prev, mode: event.target.value }))}>
                <option value="set">Set exact stock</option>
                <option value="add">Add stock</option>
                <option value="subtract">Subtract stock</option>
              </select>
            </label>
            <label>Quantity
              <input type="number" value={form.quantity} onChange={(event) => setForm((prev) => ({ ...prev, quantity: event.target.value }))} required />
            </label>
            <label>Low stock threshold
              <input type="number" value={form.lowStockThreshold} onChange={(event) => setForm((prev) => ({ ...prev, lowStockThreshold: event.target.value }))} />
            </label>
            <label>Reason
              <textarea value={form.reason} onChange={(event) => setForm((prev) => ({ ...prev, reason: event.target.value }))} rows="3" />
            </label>
            <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "Saving..." : "Save stock"}</button>
          </form>
        </div>
      )}
    </main>
  );
}
