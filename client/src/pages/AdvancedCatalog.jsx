import { useEffect, useState } from "react";
import api from "../utils/api.js";
import "../styles/pages/business/InventoryCatalog.css";

function toDateInput(value) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function productForm(item) {
  return {
    sku: item?.sku || "",
    brand: item?.brand || "",
    model: item?.model || "",
    lowStockThreshold: String(item?.lowStockThreshold ?? 5),
    allowBackorder: Boolean(item?.allowBackorder),
    isStockTracked: item?.isStockTracked !== false,
    listingExpiresAt: toDateInput(item?.listingExpiresAt),
  };
}

function serviceForm(item) {
  return {
    serviceArea: item?.serviceArea || "",
    availabilityNote: item?.availabilityNote || "",
    estimatedDuration: item?.estimatedDuration || "",
    minNoticeHours: String(item?.minNoticeHours ?? 0),
    bookingMode: item?.bookingMode || "quote_only",
    serviceTags: Array.isArray(item?.serviceTags) ? item.serviceTags.join(", ") : "",
  };
}

function statusLabel(value) {
  return String(value || "draft").replaceAll("_", " ");
}

function expiryLabel(value) {
  if (!value) return "No expiry";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No expiry";
  const today = new Date();
  const days = Math.ceil((date.getTime() - today.getTime()) / 86400000);
  if (days < 0) return `Expired ${Math.abs(days)} day(s) ago`;
  if (days === 0) return "Expires today";
  return `Expires in ${days} day(s)`;
}

const variantExample = 'Blue / 128GB | PHONE-BLUE-128 | 5000 | 10 | {"color":"Blue","storage":"128GB"}';

export default function AdvancedCatalog() {
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [tab, setTab] = useState("products");
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [productData, setProductData] = useState(productForm());
  const [serviceData, setServiceData] = useState(serviceForm());
  const [variantData, setVariantData] = useState({ name: "", sku: "", priceAdjustment: "0", stock: "0", attributesText: "" });
  const [bulkVariantText, setBulkVariantText] = useState("");
  const [template, setTemplate] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    setMessage("");
    try {
      const [productRes, serviceRes, templateRes] = await Promise.all([
        api.get("/inventory/products", { params: { q: query, limit: 160 } }),
        api.get("/inventory/services", { params: { q: query, limit: 160 } }),
        api.get("/inventory/catalog-template"),
      ]);
      setProducts(productRes.data.data || []);
      setServices(serviceRes.data.data || []);
      setTemplate(templateRes.data.data || null);
    } catch (error) {
      setMessage(error.smartSellMessage || "Could not load advanced catalog.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(loadData, 250);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function openProduct(product) {
    setSelectedProduct(product);
    setProductData(productForm(product));
    setVariantData({ name: "", sku: "", priceAdjustment: "0", stock: "0", attributesText: "" });
    setBulkVariantText("");
    setMessage("");
  }

  function openService(service) {
    setSelectedService(service);
    setServiceData(serviceForm(service));
    setMessage("");
  }

  async function saveProduct(event) {
    event.preventDefault();
    if (!selectedProduct) return;
    try {
      await api.patch(`/inventory/products/${selectedProduct.id}/advanced`, {
        ...productData,
        lowStockThreshold: Number(productData.lowStockThreshold || 5),
        listingExpiresAt: productData.listingExpiresAt || null,
      });
      setMessage("Product advanced details saved.");
      setSelectedProduct(null);
      await loadData();
    } catch (error) {
      setMessage(error.smartSellMessage || "Could not save product details.");
    }
  }

  async function addVariant(event) {
    event.preventDefault();
    if (!selectedProduct) return;
    let attributes = {};
    try {
      attributes = variantData.attributesText ? JSON.parse(variantData.attributesText) : {};
    } catch {
      setMessage('Variant attributes must be valid JSON, for example: {"size":"L","color":"Blue"}');
      return;
    }
    try {
      await api.post(`/inventory/products/${selectedProduct.id}/variants`, {
        name: variantData.name,
        sku: variantData.sku || null,
        priceAdjustment: Number(variantData.priceAdjustment || 0),
        stock: Number(variantData.stock || 0),
        attributes,
      });
      setMessage("Variant added.");
      await loadData();
      setVariantData({ name: "", sku: "", priceAdjustment: "0", stock: "0", attributesText: "" });
    } catch (error) {
      setMessage(error.smartSellMessage || "Could not add variant.");
    }
  }

  async function addBulkVariants(event) {
    event.preventDefault();
    if (!selectedProduct || !bulkVariantText.trim()) return;
    try {
      await api.post(`/inventory/products/${selectedProduct.id}/variants/bulk`, { text: bulkVariantText });
      setMessage("Bulk variants added.");
      setBulkVariantText("");
      await loadData();
    } catch (error) {
      setMessage(error.smartSellMessage || "Could not add bulk variants.");
    }
  }

  async function duplicateProduct() {
    if (!selectedProduct) return;
    try {
      await api.post(`/inventory/products/${selectedProduct.id}/duplicate`, { includeImages: true, includeVariants: true });
      setMessage("Product duplicated as draft.");
      setSelectedProduct(null);
      await loadData();
    } catch (error) {
      setMessage(error.smartSellMessage || "Could not duplicate product.");
    }
  }

  async function changeProductStatus(status) {
    if (!selectedProduct) return;
    try {
      await api.patch(`/inventory/products/${selectedProduct.id}/status`, { status });
      setMessage(`Product moved to ${statusLabel(status)}.`);
      setSelectedProduct(null);
      await loadData();
    } catch (error) {
      setMessage(error.smartSellMessage || "Could not update product status.");
    }
  }

  async function saveService(event) {
    event.preventDefault();
    if (!selectedService) return;
    try {
      await api.patch(`/inventory/services/${selectedService.id}/advanced`, {
        ...serviceData,
        minNoticeHours: Number(serviceData.minNoticeHours || 0),
        serviceTags: serviceData.serviceTags.split(",").map((tag) => tag.trim()).filter(Boolean),
      });
      setMessage("Service advanced details saved.");
      setSelectedService(null);
      await loadData();
    } catch (error) {
      setMessage(error.smartSellMessage || "Could not save service details.");
    }
  }

  async function duplicateService() {
    if (!selectedService) return;
    try {
      await api.post(`/inventory/services/${selectedService.id}/duplicate`, { includeImages: true });
      setMessage("Service duplicated as draft.");
      setSelectedService(null);
      await loadData();
    } catch (error) {
      setMessage(error.smartSellMessage || "Could not duplicate service.");
    }
  }

  async function changeServiceStatus(status) {
    if (!selectedService) return;
    try {
      await api.patch(`/inventory/services/${selectedService.id}/status`, { status });
      setMessage(`Service moved to ${statusLabel(status)}.`);
      setSelectedService(null);
      await loadData();
    } catch (error) {
      setMessage(error.smartSellMessage || "Could not update service status.");
    }
  }

  return (
    <main className="inventory-page page-shell advanced-catalog-page">
      <section className="inventory-hero advanced-hero">
        <div>
          <span className="eyebrow">Advanced Catalog</span>
          <h1>Professional product and service management tools</h1>
          <p>Manage variants, SKU details, listing expiry, duplicate drafts, product listing status, service availability, booking mode, tags, and bulk variant preparation.</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={loadData} disabled={loading}>Refresh</button>
      </section>

      {message && <div className="inventory-alert">{message}</div>}

      <section className="advanced-tool-strip">
        <article>
          <span>Product workflow</span>
          <strong>Draft → Pending → Approved</strong>
          <small>Owners can draft, send for approval, or archive. Admins can approve/reject.</small>
        </article>
        <article>
          <span>Variant format</span>
          <strong>Name | SKU | Price | Stock | JSON</strong>
          <small>{template?.variantExample || variantExample}</small>
        </article>
        <article>
          <span>Service setup</span>
          <strong>Area, duration, notice, booking mode</strong>
          <small>Make service listings clearer before customers request quotes.</small>
        </article>
      </section>

      <section className="inventory-panel">
        <div className="inventory-panel-head">
          <div>
            <h2>Catalog controls</h2>
            <p>Choose products or services and update advanced selling details.</p>
          </div>
          <div className="inventory-filter-row">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search catalog..." />
            <button className={tab === "products" ? "btn btn-primary" : "btn btn-outline"} type="button" onClick={() => setTab("products")}>Products</button>
            <button className={tab === "services" ? "btn btn-primary" : "btn btn-outline"} type="button" onClick={() => setTab("services")}>Services</button>
          </div>
        </div>

        {tab === "products" && (
          <div className="catalog-card-grid advanced-card-grid">
            {products.map((product) => (
              <article className="catalog-card advanced-catalog-card" key={product.id}>
                <div className="catalog-card-main">
                  <div className="catalog-card-title-row">
                    <strong>{product.name}</strong>
                    <span className={`catalog-status catalog-status-${product.status || "draft"}`}>{statusLabel(product.status)}</span>
                  </div>
                  <span>{product.brand || "No brand"} {product.model || ""}</span>
                  <small>SKU: {product.sku || "—"} • Variants: {product.variants?.length || 0} • {expiryLabel(product.listingExpiresAt)}</small>
                </div>
                <div className="catalog-card-actions">
                  <button className="btn btn-outline" type="button" onClick={() => openProduct(product)}>Manage</button>
                </div>
              </article>
            ))}
            {!products.length && !loading && <p>No products found.</p>}
          </div>
        )}

        {tab === "services" && (
          <div className="catalog-card-grid advanced-card-grid">
            {services.map((service) => (
              <article className="catalog-card advanced-catalog-card" key={service.id}>
                <div className="catalog-card-main">
                  <div className="catalog-card-title-row">
                    <strong>{service.title}</strong>
                    <span className={`catalog-status catalog-status-${service.status || "draft"}`}>{statusLabel(service.status)}</span>
                  </div>
                  <span>{service.serviceArea || "No service area"}</span>
                  <small>{service.bookingMode || "quote_only"} • {service.estimatedDuration || "Duration not set"} • {service.serviceTags?.join(", ") || "No tags"}</small>
                </div>
                <div className="catalog-card-actions">
                  <button className="btn btn-outline" type="button" onClick={() => openService(service)}>Manage</button>
                </div>
              </article>
            ))}
            {!services.length && !loading && <p>No services found.</p>}
          </div>
        )}
      </section>

      {selectedProduct && (
        <div className="inventory-modal-backdrop" onMouseDown={() => setSelectedProduct(null)}>
          <div className="inventory-modal wide advanced-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="inventory-panel-head">
              <div><h2>Product advanced setup</h2><p>{selectedProduct.name}</p></div>
              <button type="button" className="btn btn-outline" onClick={() => setSelectedProduct(null)}>Close</button>
            </div>

            <div className="advanced-action-bar">
              <button className="btn btn-outline" type="button" onClick={duplicateProduct}>Duplicate as draft</button>
              <button className="btn btn-outline" type="button" onClick={() => changeProductStatus("draft")}>Save as draft</button>
              <button className="btn btn-primary" type="button" onClick={() => changeProductStatus("pending")}>Send for approval</button>
              <button className="btn btn-danger" type="button" onClick={() => changeProductStatus("archived")}>Archive</button>
            </div>

            <form className="advanced-form-grid" onSubmit={saveProduct}>
              <label>SKU<input value={productData.sku} onChange={(e) => setProductData((p) => ({ ...p, sku: e.target.value }))} /></label>
              <label>Brand<input value={productData.brand} onChange={(e) => setProductData((p) => ({ ...p, brand: e.target.value }))} /></label>
              <label>Model<input value={productData.model} onChange={(e) => setProductData((p) => ({ ...p, model: e.target.value }))} /></label>
              <label>Low stock threshold<input type="number" value={productData.lowStockThreshold} onChange={(e) => setProductData((p) => ({ ...p, lowStockThreshold: e.target.value }))} /></label>
              <label>Listing expiry<input type="date" value={productData.listingExpiresAt} onChange={(e) => setProductData((p) => ({ ...p, listingExpiresAt: e.target.value }))} /></label>
              <label className="check-line"><input type="checkbox" checked={productData.isStockTracked} onChange={(e) => setProductData((p) => ({ ...p, isStockTracked: e.target.checked }))} /> Track stock</label>
              <label className="check-line"><input type="checkbox" checked={productData.allowBackorder} onChange={(e) => setProductData((p) => ({ ...p, allowBackorder: e.target.checked }))} /> Allow backorder</label>
              <button className="btn btn-primary" type="submit">Save product details</button>
            </form>

            {!!selectedProduct.variants?.length && (
              <div className="variant-box">
                <h3>Existing variants</h3>
                <div className="variant-pill-list">
                  {selectedProduct.variants.map((variant) => (
                    <span key={variant.id}>{variant.name} • {variant.sku || "No SKU"} • Stock {variant.stock}</span>
                  ))}
                </div>
              </div>
            )}

            <form className="variant-box" onSubmit={addVariant}>
              <h3>Add single product variant</h3>
              <div className="advanced-form-grid">
                <label>Variant name<input value={variantData.name} onChange={(e) => setVariantData((p) => ({ ...p, name: e.target.value }))} placeholder="Small / Red / 128GB" required /></label>
                <label>Variant SKU<input value={variantData.sku} onChange={(e) => setVariantData((p) => ({ ...p, sku: e.target.value }))} /></label>
                <label>Price adjustment<input type="number" value={variantData.priceAdjustment} onChange={(e) => setVariantData((p) => ({ ...p, priceAdjustment: e.target.value }))} /></label>
                <label>Variant stock<input type="number" value={variantData.stock} onChange={(e) => setVariantData((p) => ({ ...p, stock: e.target.value }))} /></label>
                <label className="full-span">Attributes JSON<textarea rows="3" value={variantData.attributesText} onChange={(e) => setVariantData((p) => ({ ...p, attributesText: e.target.value }))} placeholder='{"size":"L","color":"Blue"}' /></label>
              </div>
              <button className="btn btn-outline" type="submit">Add variant</button>
            </form>

            <form className="variant-box" onSubmit={addBulkVariants}>
              <h3>Bulk add variants</h3>
              <p>One variant per line using this format: <b>Name | SKU | Price adjustment | Stock | JSON attributes</b></p>
              <textarea rows="5" value={bulkVariantText} onChange={(e) => setBulkVariantText(e.target.value)} placeholder={template?.variantExample || variantExample} />
              <button className="btn btn-outline" type="submit">Add bulk variants</button>
            </form>
          </div>
        </div>
      )}

      {selectedService && (
        <div className="inventory-modal-backdrop" onMouseDown={() => setSelectedService(null)}>
          <form className="inventory-modal wide advanced-modal" onSubmit={saveService} onMouseDown={(event) => event.stopPropagation()}>
            <div className="inventory-panel-head">
              <div><h2>Service advanced setup</h2><p>{selectedService.title}</p></div>
              <button type="button" className="btn btn-outline" onClick={() => setSelectedService(null)}>Close</button>
            </div>

            <div className="advanced-action-bar">
              <button className="btn btn-outline" type="button" onClick={duplicateService}>Duplicate as draft</button>
              <button className="btn btn-outline" type="button" onClick={() => changeServiceStatus("draft")}>Save as draft</button>
              <button className="btn btn-primary" type="button" onClick={() => changeServiceStatus("pending")}>Send for approval</button>
              <button className="btn btn-danger" type="button" onClick={() => changeServiceStatus("archived")}>Archive</button>
            </div>

            <div className="advanced-form-grid">
              <label>Service area<input value={serviceData.serviceArea} onChange={(e) => setServiceData((p) => ({ ...p, serviceArea: e.target.value }))} placeholder="Kalmunai, Colombo, Islandwide..." /></label>
              <label>Estimated duration<input value={serviceData.estimatedDuration} onChange={(e) => setServiceData((p) => ({ ...p, estimatedDuration: e.target.value }))} placeholder="2 days / 4 hours" /></label>
              <label>Minimum notice hours<input type="number" value={serviceData.minNoticeHours} onChange={(e) => setServiceData((p) => ({ ...p, minNoticeHours: e.target.value }))} /></label>
              <label>Booking mode<select value={serviceData.bookingMode} onChange={(e) => setServiceData((p) => ({ ...p, bookingMode: e.target.value }))}><option value="quote_only">Quote only</option><option value="direct_booking">Direct booking</option><option value="scheduled_booking">Scheduled booking</option></select></label>
              <label className="full-span">Service tags<input value={serviceData.serviceTags} onChange={(e) => setServiceData((p) => ({ ...p, serviceTags: e.target.value }))} placeholder="cake, delivery, wedding" /></label>
              <label className="full-span">Availability note<textarea rows="4" value={serviceData.availabilityNote} onChange={(e) => setServiceData((p) => ({ ...p, availabilityNote: e.target.value }))} /></label>
            </div>
            <button className="btn btn-primary" type="submit">Save service details</button>
          </form>
        </div>
      )}
    </main>
  );
}
