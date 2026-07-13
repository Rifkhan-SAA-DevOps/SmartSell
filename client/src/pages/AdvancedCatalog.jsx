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

function toDateInput(value) { return value ? new Date(value).toISOString().slice(0, 10) : ""; }
function readable(value) { return String(value || "").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function expiryLabel(value) {
  if (!value) return "No expiry";
  const date = new Date(value); if (Number.isNaN(date.getTime())) return "No expiry";
  const days = Math.ceil((date.getTime() - Date.now()) / 86400000);
  if (days < 0) return `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`;
  if (days === 0) return "Expires today";
  return `Expires in ${days} day${days === 1 ? "" : "s"}`;
}
function productForm(item) { return { sku: item?.sku || "", brand: item?.brand || "", model: item?.model || "", lowStockThreshold: String(item?.lowStockThreshold ?? 5), allowBackorder: Boolean(item?.allowBackorder), isStockTracked: item?.isStockTracked !== false, listingExpiresAt: toDateInput(item?.listingExpiresAt) }; }
function serviceForm(item) { return { serviceArea: item?.serviceArea || "", availabilityNote: item?.availabilityNote || "", estimatedDuration: item?.estimatedDuration || "", minNoticeHours: String(item?.minNoticeHours ?? 0), bookingMode: item?.bookingMode || "quote_only", serviceTags: Array.isArray(item?.serviceTags) ? item.serviceTags.join(", ") : "" }; }
const emptyVariant = { name: "", sku: "", priceAdjustment: "0", stock: "0", attributesText: "" };
const variantExample = 'Blue / 128GB | PHONE-BLUE-128 | 5000 | 10 | {"color":"Blue","storage":"128GB"}';

export default function AdvancedCatalog() {
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [tab, setTab] = useState("products");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [productData, setProductData] = useState(productForm());
  const [serviceData, setServiceData] = useState(serviceForm());
  const [variantData, setVariantData] = useState(emptyVariant);
  const [bulkVariantText, setBulkVariantText] = useState("");
  const [productModalTab, setProductModalTab] = useState("details");
  const [template, setTemplate] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function loadData(preferredType, preferredId) {
    setLoading(true); setError("");
    try {
      const [productRes, serviceRes, templateRes] = await Promise.all([
        api.get("/inventory/products", { params: { q: search, limit: 160 } }),
        api.get("/inventory/services", { params: { q: search, limit: 160 } }),
        api.get("/inventory/catalog-template"),
      ]);
      const nextProducts = productRes.data.data || [];
      const nextServices = serviceRes.data.data || [];
      setProducts(nextProducts); setServices(nextServices); setTemplate(templateRes.data.data || null);
      if (preferredType === "product" && preferredId) {
        const next = nextProducts.find((item) => item.id === preferredId) || null;
        setSelectedProduct(next); if (next) setProductData(productForm(next));
      }
      if (preferredType === "service" && preferredId) {
        const next = nextServices.find((item) => item.id === preferredId) || null;
        setSelectedService(next); if (next) setServiceData(serviceForm(next));
      }
    } catch (requestError) { setError(requestError.smartSellMessage || requestError.response?.data?.message || "Could not load advanced catalog."); }
    finally { setLoading(false); }
  }

  useEffect(() => { const timeout = setTimeout(() => loadData(), 250); return () => clearTimeout(timeout); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((item) => (status === "all" || item.status === status) && (!query || `${item.name} ${item.sku} ${item.brand} ${item.model} ${item.category}`.toLowerCase().includes(query)));
  }, [products, search, status]);
  const filteredServices = useMemo(() => {
    const query = search.trim().toLowerCase();
    return services.filter((item) => (status === "all" || item.status === status) && (!query || `${item.title} ${item.serviceArea} ${item.bookingMode} ${(item.serviceTags || []).join(" ")}`.toLowerCase().includes(query)));
  }, [services, search, status]);
  const productPagination = useSmartPagination(filteredProducts, { initialPageSize: 10, resetKey: `products-${search}-${status}` });
  const servicePagination = useSmartPagination(filteredServices, { initialPageSize: 10, resetKey: `services-${search}-${status}` });
  const variantCount = products.reduce((sum, item) => sum + Number(item.variants?.length || 0), 0);
  const expiring = products.filter((item) => item.listingExpiresAt && new Date(item.listingExpiresAt).getTime() - Date.now() < 7 * 86400000).length;

  function openProduct(product) { setSelectedProduct(product); setProductData(productForm(product)); setVariantData(emptyVariant); setBulkVariantText(""); setProductModalTab("details"); setMessage(""); }
  function openService(service) { setSelectedService(service); setServiceData(serviceForm(service)); setMessage(""); }

  async function runAction(action, success, preferredType, preferredId) {
    try { setBusy(true); setMessage(""); await action(); setMessage(success); await loadData(preferredType, preferredId); }
    catch (requestError) { setError(requestError.smartSellMessage || requestError.response?.data?.message || "Catalog action failed."); }
    finally { setBusy(false); }
  }

  async function saveProduct(event) { event.preventDefault(); if (!selectedProduct) return; await runAction(() => api.patch(`/inventory/products/${selectedProduct.id}/advanced`, { ...productData, lowStockThreshold: Number(productData.lowStockThreshold || 5), listingExpiresAt: productData.listingExpiresAt || null }), "Product advanced details saved.", "product", selectedProduct.id); }
  async function addVariant(event) {
    event.preventDefault(); if (!selectedProduct) return;
    let attributes = {};
    try { attributes = variantData.attributesText ? JSON.parse(variantData.attributesText) : {}; }
    catch { setError('Variant attributes must be valid JSON, for example: {"size":"L","color":"Blue"}'); return; }
    await runAction(() => api.post(`/inventory/products/${selectedProduct.id}/variants`, { name: variantData.name, sku: variantData.sku || null, priceAdjustment: Number(variantData.priceAdjustment || 0), stock: Number(variantData.stock || 0), attributes }), "Variant added.", "product", selectedProduct.id);
    setVariantData(emptyVariant);
  }
  async function addBulkVariants(event) { event.preventDefault(); if (!selectedProduct || !bulkVariantText.trim()) return; await runAction(() => api.post(`/inventory/products/${selectedProduct.id}/variants/bulk`, { text: bulkVariantText }), "Bulk variants added.", "product", selectedProduct.id); setBulkVariantText(""); }
  async function duplicateProduct() { if (!selectedProduct) return; await runAction(() => api.post(`/inventory/products/${selectedProduct.id}/duplicate`, { includeImages: true, includeVariants: true }), "Product duplicated as a draft."); setSelectedProduct(null); }
  async function changeProductStatus(nextStatus) { if (!selectedProduct) return; await runAction(() => api.patch(`/inventory/products/${selectedProduct.id}/status`, { status: nextStatus }), `Product moved to ${readable(nextStatus)}.`); setSelectedProduct(null); }
  async function saveService(event) { event.preventDefault(); if (!selectedService) return; await runAction(() => api.patch(`/inventory/services/${selectedService.id}/advanced`, { ...serviceData, minNoticeHours: Number(serviceData.minNoticeHours || 0), serviceTags: serviceData.serviceTags.split(",").map((tag) => tag.trim()).filter(Boolean) }), "Service advanced details saved.", "service", selectedService.id); }
  async function duplicateService() { if (!selectedService) return; await runAction(() => api.post(`/inventory/services/${selectedService.id}/duplicate`, { includeImages: true }), "Service duplicated as a draft."); setSelectedService(null); }
  async function changeServiceStatus(nextStatus) { if (!selectedService) return; await runAction(() => api.patch(`/inventory/services/${selectedService.id}/status`, { status: nextStatus }), `Service moved to ${readable(nextStatus)}.`); setSelectedService(null); }

  return <section className="business-workspace-v2 business-management-v2 business-catalog-v2">
    <BusinessPageHeader eyebrow="Catalog operations" title="Advanced catalog" description="Control SKU data, variants, listing expiry, stock rules, service coverage, availability, and publishing status from a clean catalog workspace." meta={<><span><BusinessIcon name="layers" size={15} />{variantCount} variants</span><span><BusinessIcon name="calendar" size={15} />{expiring} expiring soon</span></>} actions={<button className="business-primary-button-v2" type="button" onClick={() => loadData()} disabled={loading}><BusinessIcon name="refresh" size={17} />Refresh catalog</button>} />
    {error && <div className="business-error-v2"><strong>Catalog action needs attention</strong><p>{error}</p></div>}
    {message && <div className="bm-notice-v2 success"><BusinessIcon name="check" size={18} /><span>{message}</span></div>}
    <div className="business-metrics-grid-v2"><BusinessMetricCard icon="box" label="Products" value={products.length} note="Advanced product records" tone="blue" /><BusinessMetricCard icon="service" label="Services" value={services.length} note="Service availability records" tone="violet" /><BusinessMetricCard icon="layers" label="Variants" value={variantCount} note="Across all products" tone="emerald" /><BusinessMetricCard icon="calendar" label="Expiring soon" value={expiring} note="Within seven days or expired" tone="amber" /></div>
    <section className="bm-guidance-strip-v2"><article><span><BusinessIcon name="chart" /></span><div><small>Publishing workflow</small><strong>Draft → Pending → Approved</strong><p>Keep incomplete listings in draft, then send them for SmartSell review.</p></div></article><article><span><BusinessIcon name="layers" /></span><div><small>Variant format</small><strong>Name | SKU | Price | Stock | JSON</strong><p>{template?.variantExample || variantExample}</p></div></article><article><span><BusinessIcon name="service" /></span><div><small>Service readiness</small><strong>Area, duration, notice, booking</strong><p>Clear service terms reduce customer questions before quotation.</p></div></article></section>
    <section className="business-content-panel-v2 bm-management-panel-v2"><div className="business-tab-list-v2"><button type="button" className={tab === "products" ? "active" : ""} onClick={() => { setTab("products"); setStatus("all"); }}><BusinessIcon name="box" size={18} /><span>Products</span><b>{products.length}</b></button><button type="button" className={tab === "services" ? "active" : ""} onClick={() => { setTab("services"); setStatus("all"); }}><BusinessIcon name="service" size={18} /><span>Services</span><b>{services.length}</b></button></div><div className="business-tab-content-v2"><BusinessSearchToolbar value={search} onChange={setSearch} placeholder={`Search ${tab} by name, SKU, brand, area, or tag`} filter={<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="draft">Draft</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="archived">Archived</option></select>} />
      {loading ? <div className="business-loading-v2"><span /><p>Loading advanced catalog...</p></div> : tab === "products" ? (!filteredProducts.length ? <BusinessEmptyState icon="box" title="No products found" description={products.length ? "Change the search term or status filter." : "Create a product listing first."} /> : <div className="bm-catalog-grid-v2">{productPagination.items.map((product) => <article className="bm-catalog-card-v2" key={product.id} role="button" tabIndex="0" onClick={() => openProduct(product)} onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && openProduct(product)}><div className="bm-catalog-card-v2__top"><span className="bm-row-icon-v2 tone-blue"><BusinessIcon name="box" /></span><BusinessStatusBadge status={product.status} /></div><h3>{product.name}</h3><p>{[product.brand, product.model].filter(Boolean).join(" · ") || "Brand and model not set"}</p><div className="bm-catalog-facts-v2"><span>SKU<b>{product.sku || "Not set"}</b></span><span>Variants<b>{product.variants?.length || 0}</b></span><span>Expiry<b>{expiryLabel(product.listingExpiresAt)}</b></span></div><footer><span>{product.isStockTracked === false ? "Stock not tracked" : `${product.stock ?? 0} units in stock`}</span><b>Manage <BusinessIcon name="chevron" size={15} /></b></footer></article>)}<SmartPagination pagination={productPagination} label="products" /></div>) : (!filteredServices.length ? <BusinessEmptyState icon="service" title="No services found" description={services.length ? "Change the search term or status filter." : "Create a service listing first."} /> : <div className="bm-catalog-grid-v2">{servicePagination.items.map((service) => <article className="bm-catalog-card-v2 service" key={service.id} role="button" tabIndex="0" onClick={() => openService(service)} onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && openService(service)}><div className="bm-catalog-card-v2__top"><span className="bm-row-icon-v2 tone-violet"><BusinessIcon name="service" /></span><BusinessStatusBadge status={service.status} /></div><h3>{service.title}</h3><p>{service.serviceArea || "Service area not set"}</p><div className="bm-catalog-facts-v2"><span>Booking<b>{readable(service.bookingMode || "quote_only")}</b></span><span>Duration<b>{service.estimatedDuration || "Not set"}</b></span><span>Tags<b>{service.serviceTags?.length || 0}</b></span></div><footer><span>{service.availabilityNote || "Availability not described"}</span><b>Manage <BusinessIcon name="chevron" size={15} /></b></footer></article>)}<SmartPagination pagination={servicePagination} label="services" /></div>)}
    </div></section>

    <BusinessModal open={Boolean(selectedProduct)} title={selectedProduct?.name || "Product setup"} eyebrow="Advanced product management" onClose={() => setSelectedProduct(null)}>
      {selectedProduct && <><div className="business-modal-status-line-v2"><BusinessStatusBadge status={selectedProduct.status} /></div><div className="bm-modal-tabs-v2"><button type="button" className={productModalTab === "details" ? "active" : ""} onClick={() => setProductModalTab("details")}>Product details</button><button type="button" className={productModalTab === "variants" ? "active" : ""} onClick={() => setProductModalTab("variants")}>Variants <b>{selectedProduct.variants?.length || 0}</b></button></div>{productModalTab === "details" ? <form className="business-editor-v2 bm-editor-no-border-v2" onSubmit={saveProduct}><BusinessInfoGrid items={[{ label: "Current status", value: readable(selectedProduct.status) }, { label: "Current stock", value: selectedProduct.stock ?? 0 }, { label: "Current variants", value: selectedProduct.variants?.length || 0 }, { label: "Listing expiry", value: expiryLabel(selectedProduct.listingExpiresAt) }]} /><div className="business-form-grid-v2 two-columns"><label><span>SKU</span><input value={productData.sku} onChange={(event) => setProductData((current) => ({ ...current, sku: event.target.value }))} /></label><label><span>Brand</span><input value={productData.brand} onChange={(event) => setProductData((current) => ({ ...current, brand: event.target.value }))} /></label><label><span>Model</span><input value={productData.model} onChange={(event) => setProductData((current) => ({ ...current, model: event.target.value }))} /></label><label><span>Low-stock threshold</span><input type="number" min="0" value={productData.lowStockThreshold} onChange={(event) => setProductData((current) => ({ ...current, lowStockThreshold: event.target.value }))} /></label><label><span>Listing expiry</span><input type="date" value={productData.listingExpiresAt} onChange={(event) => setProductData((current) => ({ ...current, listingExpiresAt: event.target.value }))} /></label><div className="bm-check-stack-v2"><label><input type="checkbox" checked={productData.isStockTracked} onChange={(event) => setProductData((current) => ({ ...current, isStockTracked: event.target.checked }))} />Track stock availability</label><label><input type="checkbox" checked={productData.allowBackorder} onChange={(event) => setProductData((current) => ({ ...current, allowBackorder: event.target.checked }))} />Allow backorders</label></div></div><div className="business-modal-action-row-v2"><button className="business-danger-button-v2" type="button" disabled={busy} onClick={() => changeProductStatus("archived")}>Archive</button><button className="business-ghost-button-v2" type="button" disabled={busy} onClick={duplicateProduct}>Duplicate draft</button><button className="business-secondary-button-v2" type="button" disabled={busy} onClick={() => changeProductStatus("pending")}>Send for approval</button><button className="business-primary-button-v2" type="submit" disabled={busy}>{busy ? "Saving..." : "Save details"}</button></div></form> : <div className="bm-variant-workspace-v2"><section><div className="bm-section-heading-v2"><div><span>Existing variants</span><h3>{selectedProduct.variants?.length || 0} configured options</h3></div></div>{selectedProduct.variants?.length ? <div className="bm-variant-list-v2">{selectedProduct.variants.map((variant) => <article key={variant.id}><div><strong>{variant.name}</strong><small>{variant.sku || "No SKU"}</small></div><span>Stock <b>{variant.stock}</b></span><span>Adjustment <b>{Number(variant.priceAdjustment || 0).toLocaleString("en-LK")}</b></span></article>)}</div> : <BusinessEmptyState icon="layers" title="No variants yet" description="Add size, colour, capacity, or other product options below." />}</section><form className="business-editor-v2" onSubmit={addVariant}><div className="bm-section-heading-v2"><div><span>Add one variant</span><h3>Create a product option</h3></div></div><div className="business-form-grid-v2 two-columns"><label><span>Variant name</span><input value={variantData.name} onChange={(event) => setVariantData((current) => ({ ...current, name: event.target.value }))} required /></label><label><span>Variant SKU</span><input value={variantData.sku} onChange={(event) => setVariantData((current) => ({ ...current, sku: event.target.value }))} /></label><label><span>Price adjustment</span><input type="number" value={variantData.priceAdjustment} onChange={(event) => setVariantData((current) => ({ ...current, priceAdjustment: event.target.value }))} /></label><label><span>Variant stock</span><input type="number" min="0" value={variantData.stock} onChange={(event) => setVariantData((current) => ({ ...current, stock: event.target.value }))} /></label></div><label><span>Attributes JSON</span><textarea rows="3" value={variantData.attributesText} onChange={(event) => setVariantData((current) => ({ ...current, attributesText: event.target.value }))} placeholder='{"size":"L","color":"Blue"}' /></label><div className="business-modal-action-row-v2"><button className="business-secondary-button-v2" type="submit" disabled={busy}>Add variant</button></div></form><form className="business-editor-v2" onSubmit={addBulkVariants}><div className="bm-section-heading-v2"><div><span>Bulk creation</span><h3>Add multiple variants</h3></div></div><p className="bm-help-text-v2">One per line: Name | SKU | Price adjustment | Stock | JSON attributes</p><textarea rows="5" value={bulkVariantText} onChange={(event) => setBulkVariantText(event.target.value)} placeholder={template?.variantExample || variantExample} /><div className="business-modal-action-row-v2"><button className="business-secondary-button-v2" type="submit" disabled={busy || !bulkVariantText.trim()}>Add bulk variants</button></div></form></div>}</>}
    </BusinessModal>

    <BusinessModal open={Boolean(selectedService)} title={selectedService?.title || "Service setup"} eyebrow="Advanced service management" onClose={() => setSelectedService(null)}>
      {selectedService && <form className="business-editor-v2 bm-editor-no-border-v2" onSubmit={saveService}><div className="business-modal-status-line-v2"><BusinessStatusBadge status={selectedService.status} /></div><BusinessInfoGrid items={[{ label: "Current area", value: selectedService.serviceArea || "Not set" }, { label: "Booking mode", value: readable(selectedService.bookingMode || "quote_only") }, { label: "Duration", value: selectedService.estimatedDuration || "Not set" }, { label: "Minimum notice", value: `${selectedService.minNoticeHours || 0} hours` }]} /><div className="business-form-grid-v2 two-columns"><label><span>Service area</span><input value={serviceData.serviceArea} onChange={(event) => setServiceData((current) => ({ ...current, serviceArea: event.target.value }))} /></label><label><span>Estimated duration</span><input value={serviceData.estimatedDuration} onChange={(event) => setServiceData((current) => ({ ...current, estimatedDuration: event.target.value }))} /></label><label><span>Minimum notice hours</span><input type="number" min="0" value={serviceData.minNoticeHours} onChange={(event) => setServiceData((current) => ({ ...current, minNoticeHours: event.target.value }))} /></label><label><span>Booking mode</span><select value={serviceData.bookingMode} onChange={(event) => setServiceData((current) => ({ ...current, bookingMode: event.target.value }))}><option value="quote_only">Quote only</option><option value="direct_booking">Direct booking</option><option value="scheduled_booking">Scheduled booking</option></select></label></div><label><span>Service tags</span><input value={serviceData.serviceTags} onChange={(event) => setServiceData((current) => ({ ...current, serviceTags: event.target.value }))} placeholder="cake, delivery, wedding" /></label><label><span>Availability note</span><textarea rows="4" value={serviceData.availabilityNote} onChange={(event) => setServiceData((current) => ({ ...current, availabilityNote: event.target.value }))} /></label><div className="business-modal-action-row-v2"><button className="business-danger-button-v2" type="button" disabled={busy} onClick={() => changeServiceStatus("archived")}>Archive</button><button className="business-ghost-button-v2" type="button" disabled={busy} onClick={duplicateService}>Duplicate draft</button><button className="business-secondary-button-v2" type="button" disabled={busy} onClick={() => changeServiceStatus("pending")}>Send for approval</button><button className="business-primary-button-v2" type="submit" disabled={busy}>{busy ? "Saving..." : "Save service"}</button></div></form>}
    </BusinessModal>
  </section>;
}
