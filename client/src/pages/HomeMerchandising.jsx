import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AdminEmptyState,
  AdminIcon,
  AdminMetricCard,
  AdminModal,
  AdminPageHeader,
  AdminStatusBadge,
} from "../components/AdminWorkspaceUi.jsx";
import api from "../utils/api.js";
import "../styles/pages/admin/AdminWorkspaceV2.css";
import "../styles/pages/admin/AdminOperations.css";
import "../styles/pages/admin/HomeMerchandising.css";

const DEFAULT_CONFIG = {
  carousel: { enabled: true, direction: "ltr", speedSeconds: 34, pauseOnHover: true },
  todayOffers: {
    enabled: true,
    eyebrow: "Today's marketplace offers",
    title: "Popular products worth checking now",
    description: "Approved products selected for today's SmartSell shoppers.",
    link: "/marketplace?sort=featured",
    productIds: [],
  },
  flashSale: {
    enabled: true,
    badge: "Limited-time marketplace event",
    title: "Flash Friday",
    description: "Fast-moving products and special marketplace picks for a limited time.",
    link: "/marketplace?sort=featured",
    startAt: "",
    endAt: "",
    productIds: [],
  },
  budgetCollection: {
    enabled: true,
    eyebrow: "Small prices, useful finds",
    title: "Products under Rs. 1,000",
    description: "Affordable everyday products, gifts, accessories, and locally made items.",
    maxPrice: 1000,
    link: "/marketplace?maxPrice=1000&sort=price_asc",
    productIds: [],
  },
  marketplaceHighlights: { enabled: true, autoplay: true, intervalSeconds: 5, slides: [] },
};

const EMPTY_SLIDE = {
  label: "Marketplace highlight",
  title: "",
  subtitle: "",
  imageUrl: "",
  link: "/marketplace",
  priceText: "",
  location: "Sri Lanka",
};

function mergeConfig(value = {}) {
  return {
    ...DEFAULT_CONFIG,
    ...value,
    carousel: { ...DEFAULT_CONFIG.carousel, ...(value.carousel || {}) },
    todayOffers: { ...DEFAULT_CONFIG.todayOffers, ...(value.todayOffers || {}), productIds: Array.isArray(value.todayOffers?.productIds) ? value.todayOffers.productIds : [] },
    flashSale: { ...DEFAULT_CONFIG.flashSale, ...(value.flashSale || {}), productIds: Array.isArray(value.flashSale?.productIds) ? value.flashSale.productIds : [] },
    budgetCollection: { ...DEFAULT_CONFIG.budgetCollection, ...(value.budgetCollection || {}), productIds: Array.isArray(value.budgetCollection?.productIds) ? value.budgetCollection.productIds : [] },
    marketplaceHighlights: {
      ...DEFAULT_CONFIG.marketplaceHighlights,
      ...(value.marketplaceHighlights || {}),
      slides: Array.isArray(value.marketplaceHighlights?.slides) ? value.marketplaceHighlights.slides : [],
    },
  };
}

function money(value) {
  return Number(value || 0).toLocaleString("en-LK");
}

function formatDateInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

function ProductSelectionSummary({ products, ids }) {
  const selected = products.filter((product) => ids.includes(product.id));
  if (!selected.length) return <p className="home-merch-selection-empty">No products selected. SmartSell will automatically use qualifying approved products.</p>;
  return (
    <div className="home-merch-selected-products">
      {selected.slice(0, 6).map((product) => (
        <span key={product.id}><img src={product.image || product.images?.[0]?.url || "https://placehold.co/80x80?text=Product"} alt="" /><b>{product.name}</b><small>Rs. {money(product.price)}</small></span>
      ))}
      {selected.length > 6 && <em>+{selected.length - 6} more</em>}
    </div>
  );
}

export default function HomeMerchandising() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState("offers");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pickerTarget, setPickerTarget] = useState("");
  const [pickerSearch, setPickerSearch] = useState("");
  const [slideEditor, setSlideEditor] = useState(null);
  const [uploading, setUploading] = useState(false);

  async function loadData() {
    setLoading(true); setError("");
    try {
      const [settingsResponse, listingResponse] = await Promise.all([
        api.get("/settings/admin"),
        api.get("/admin/listings", { params: { status: "approved", limit: 250 } }),
      ]);
      const rows = settingsResponse.data?.data?.settings || [];
      const stored = rows.find((setting) => setting.key === "homeMerchandising.config")?.value;
      setConfig(mergeConfig(stored));
      setProducts((listingResponse.data?.data?.products || []).filter((product) => product.status === "approved"));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load homepage merchandising controls.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const flashActive = useMemo(() => {
    if (!config.flashSale.enabled) return false;
    const now = Date.now();
    const start = config.flashSale.startAt ? new Date(config.flashSale.startAt).getTime() : null;
    const end = config.flashSale.endAt ? new Date(config.flashSale.endAt).getTime() : null;
    return (!start || now >= start) && (!end || now <= end);
  }, [config.flashSale]);

  const pickerProducts = useMemo(() => {
    const query = pickerSearch.trim().toLowerCase();
    return products.filter((product) => !query || `${product.name} ${product.category || ""} ${product.sellerName || ""} ${product.location || ""}`.toLowerCase().includes(query));
  }, [products, pickerSearch]);

  const selectedIds = pickerTarget ? config[pickerTarget]?.productIds || [] : [];

  function updateSection(section, field, value) {
    setConfig((current) => ({ ...current, [section]: { ...current[section], [field]: value } }));
  }

  function toggleProduct(productId) {
    if (!pickerTarget) return;
    setConfig((current) => {
      const ids = current[pickerTarget].productIds || [];
      const next = ids.includes(productId) ? ids.filter((id) => id !== productId) : [...ids, productId].slice(0, 18);
      return { ...current, [pickerTarget]: { ...current[pickerTarget], productIds: next } };
    });
  }

  function moveSlide(index, direction) {
    setConfig((current) => {
      const slides = [...current.marketplaceHighlights.slides];
      const target = index + direction;
      if (target < 0 || target >= slides.length) return current;
      [slides[index], slides[target]] = [slides[target], slides[index]];
      return { ...current, marketplaceHighlights: { ...current.marketplaceHighlights, slides } };
    });
  }

  function removeSlide(index) {
    setConfig((current) => ({
      ...current,
      marketplaceHighlights: {
        ...current.marketplaceHighlights,
        slides: current.marketplaceHighlights.slides.filter((_, slideIndex) => slideIndex !== index),
      },
    }));
  }

  function openSlide(index = -1) {
    const existing = index >= 0 ? config.marketplaceHighlights.slides[index] : EMPTY_SLIDE;
    setSlideEditor({ index, value: { ...EMPTY_SLIDE, ...existing } });
  }

  function saveSlide(event) {
    event.preventDefault();
    if (!slideEditor?.value?.title.trim() || !slideEditor?.value?.imageUrl.trim()) {
      setError("Highlight title and image are required.");
      return;
    }
    setConfig((current) => {
      const slides = [...current.marketplaceHighlights.slides];
      if (slideEditor.index >= 0) slides[slideEditor.index] = slideEditor.value;
      else slides.push(slideEditor.value);
      return { ...current, marketplaceHighlights: { ...current.marketplaceHighlights, slides: slides.slice(0, 10) } };
    });
    setSlideEditor(null);
  }

  async function uploadSlideImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true); setError("");
    try {
      const body = new FormData();
      body.append("images", file);
      const { data } = await api.post("/upload/listing-images", body, { headers: { "Content-Type": "multipart/form-data" } });
      const url = data.data?.[0]?.url;
      if (url) setSlideEditor((current) => ({ ...current, value: { ...current.value, imageUrl: url } }));
    } catch (err) {
      setError(err.response?.data?.message || "Image upload failed.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function saveConfig() {
    setSaving(true); setMessage(""); setError("");
    try {
      await api.patch("/settings/admin", { settings: { "homeMerchandising.config": config } });
      setMessage("Homepage merchandising has been published successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save homepage merchandising.");
    } finally {
      setSaving(false);
    }
  }

  const selectedTotal = config.todayOffers.productIds.length + config.flashSale.productIds.length + config.budgetCollection.productIds.length;
  const enabledCollections = [config.todayOffers.enabled, config.flashSale.enabled, config.budgetCollection.enabled].filter(Boolean).length;

  return (
    <section className="admin-workspace-v2 admin-operations-page-v2 home-merch-page-v2">
      <AdminPageHeader
        eyebrow="Homepage merchandising"
        title="Home offers & highlights"
        description="Control the product rails, limited-time campaigns, affordable collections, carousel movement, and image-led marketplace highlights shown on the public Home page."
        actions={<><Link className="admin-secondary-button-v2" to="/" target="_blank">Preview Home</Link><button className="admin-primary-button-v2" type="button" onClick={saveConfig} disabled={saving || loading}>{saving ? "Publishing..." : "Publish homepage"}</button></>}
        meta={<><span>{enabledCollections} active offer collections</span><span>{selectedTotal} manually selected products</span><span>{config.marketplaceHighlights.slides.length} highlight slides</span></>}
      />

      {message && <div className="admin-alert-v2 success">{message}</div>}
      {error && <div className="admin-alert-v2 error">{error}</div>}

      {loading ? <div className="admin-ops-loading-v2">Loading homepage merchandising...</div> : <>
        <div className="admin-metrics-grid-v2 four home-merch-metrics-v2">
          <AdminMetricCard icon="spark" label="Offer collections" value={enabledCollections} note="Today, flash, and budget" tone="violet" />
          <AdminMetricCard icon="box" label="Selected products" value={selectedTotal} note="Manual merchandising order" tone="blue" />
          <AdminMetricCard icon="star" label="Highlight slides" value={config.marketplaceHighlights.slides.length} note="Admin-managed images" tone="cyan" />
          <AdminMetricCard icon="activity" label="Flash campaign" value={flashActive ? "Live" : config.flashSale.enabled ? "Scheduled" : "Off"} note={config.flashSale.title} tone={flashActive ? "emerald" : "amber"} />
        </div>

        <div className="home-merch-tabs-v2" role="tablist" aria-label="Homepage merchandising areas">
          {[["offers", "Offers & flash sale"], ["budget", "Budget collection"], ["highlights", "Marketplace highlights"], ["motion", "Carousel movement"]].map(([value, label]) => <button key={value} type="button" className={activeTab === value ? "active" : ""} onClick={() => setActiveTab(value)}>{label}</button>)}
        </div>

        {activeTab === "offers" && <div className="home-merch-editor-grid-v2">
          <article className="admin-panel-v2 home-merch-editor-card-v2">
            <header><div><span className="admin-ops-eyebrow-v2">Daily collection</span><h2>Today’s Offers</h2><p>Choose exact products or allow SmartSell to use approved featured listings automatically.</p></div><label className="home-merch-switch-v2"><input type="checkbox" checked={config.todayOffers.enabled} onChange={(event) => updateSection("todayOffers", "enabled", event.target.checked)} /><span /></label></header>
            <div className="admin-form-v2 home-merch-form-grid-v2">
              <label>Eyebrow<input value={config.todayOffers.eyebrow} onChange={(event) => updateSection("todayOffers", "eyebrow", event.target.value)} /></label>
              <label>Section title<input value={config.todayOffers.title} onChange={(event) => updateSection("todayOffers", "title", event.target.value)} /></label>
              <label className="wide">Description<textarea rows="3" value={config.todayOffers.description} onChange={(event) => updateSection("todayOffers", "description", event.target.value)} /></label>
              <label className="wide">View-all link<input value={config.todayOffers.link} onChange={(event) => updateSection("todayOffers", "link", event.target.value)} /></label>
            </div>
            <div className="home-merch-selection-v2"><div><strong>Featured products</strong><span>{config.todayOffers.productIds.length ? `${config.todayOffers.productIds.length} manually selected` : "Automatic featured selection"}</span></div><button className="admin-secondary-button-v2" type="button" onClick={() => { setPickerTarget("todayOffers"); setPickerSearch(""); }}>Choose products</button></div>
            <ProductSelectionSummary products={products} ids={config.todayOffers.productIds} />
          </article>

          <article className="admin-panel-v2 home-merch-editor-card-v2 tone-flash">
            <header><div><span className="admin-ops-eyebrow-v2">Limited-time campaign</span><h2>Flash Sale</h2><p>Publish a named Friday, Sunday, weekend, payday, or seasonal event with its own products.</p></div><label className="home-merch-switch-v2"><input type="checkbox" checked={config.flashSale.enabled} onChange={(event) => updateSection("flashSale", "enabled", event.target.checked)} /><span /></label></header>
            <div className="admin-form-v2 home-merch-form-grid-v2">
              <label>Campaign badge<input value={config.flashSale.badge} onChange={(event) => updateSection("flashSale", "badge", event.target.value)} /></label>
              <label>Campaign title<input value={config.flashSale.title} onChange={(event) => updateSection("flashSale", "title", event.target.value)} /></label>
              <label className="wide">Description<textarea rows="3" value={config.flashSale.description} onChange={(event) => updateSection("flashSale", "description", event.target.value)} /></label>
              <label>Starts at<input type="datetime-local" value={formatDateInput(config.flashSale.startAt)} onChange={(event) => updateSection("flashSale", "startAt", event.target.value ? new Date(event.target.value).toISOString() : "")} /></label>
              <label>Ends at<input type="datetime-local" value={formatDateInput(config.flashSale.endAt)} onChange={(event) => updateSection("flashSale", "endAt", event.target.value ? new Date(event.target.value).toISOString() : "")} /></label>
              <label className="wide">Campaign link<input value={config.flashSale.link} onChange={(event) => updateSection("flashSale", "link", event.target.value)} /></label>
            </div>
            <div className="home-merch-campaign-state-v2"><AdminStatusBadge status={flashActive ? "active" : config.flashSale.enabled ? "pending" : "inactive"} label={flashActive ? "Live now" : config.flashSale.enabled ? "Scheduled / always available" : "Disabled"} /><span>Leave both dates empty to keep the flash collection available whenever it is enabled.</span></div>
            <div className="home-merch-selection-v2"><div><strong>Flash-sale products</strong><span>{config.flashSale.productIds.length ? `${config.flashSale.productIds.length} selected` : "Automatic featured selection"}</span></div><button className="admin-secondary-button-v2" type="button" onClick={() => { setPickerTarget("flashSale"); setPickerSearch(""); }}>Choose products</button></div>
            <ProductSelectionSummary products={products} ids={config.flashSale.productIds} />
          </article>
        </div>}

        {activeTab === "budget" && <article className="admin-panel-v2 home-merch-editor-card-v2 home-merch-budget-editor-v2">
          <header><div><span className="admin-ops-eyebrow-v2">Affordable discovery</span><h2>Budget product collection</h2><p>Control the “Under Rs. 1,000” style rail, including the price ceiling, wording, and hand-picked products.</p></div><label className="home-merch-switch-v2"><input type="checkbox" checked={config.budgetCollection.enabled} onChange={(event) => updateSection("budgetCollection", "enabled", event.target.checked)} /><span /></label></header>
          <div className="admin-form-v2 home-merch-form-grid-v2 three">
            <label>Eyebrow<input value={config.budgetCollection.eyebrow} onChange={(event) => updateSection("budgetCollection", "eyebrow", event.target.value)} /></label>
            <label>Title<input value={config.budgetCollection.title} onChange={(event) => updateSection("budgetCollection", "title", event.target.value)} /></label>
            <label>Maximum price (Rs.)<input type="number" min="1" value={config.budgetCollection.maxPrice} onChange={(event) => updateSection("budgetCollection", "maxPrice", Math.max(1, Number(event.target.value || 1)))} /></label>
            <label className="wide">Description<textarea rows="3" value={config.budgetCollection.description} onChange={(event) => updateSection("budgetCollection", "description", event.target.value)} /></label>
            <label className="wide">View-all link<input value={config.budgetCollection.link} onChange={(event) => updateSection("budgetCollection", "link", event.target.value)} /></label>
          </div>
          <div className="home-merch-selection-v2"><div><strong>Budget products</strong><span>{config.budgetCollection.productIds.length ? `${config.budgetCollection.productIds.length} manually selected` : `Automatic products at or below Rs. ${money(config.budgetCollection.maxPrice)}`}</span></div><button className="admin-secondary-button-v2" type="button" onClick={() => { setPickerTarget("budgetCollection"); setPickerSearch(""); }}>Choose products</button></div>
          <ProductSelectionSummary products={products} ids={config.budgetCollection.productIds} />
        </article>}

        {activeTab === "highlights" && <article className="admin-panel-v2 home-merch-highlight-editor-v2">
          <header className="home-merch-highlight-head-v2"><div><span className="admin-ops-eyebrow-v2">Hero marketplace carousel</span><h2>Marketplace Highlights</h2><p>Upload image-led slides for products, services, shops, campaigns, or custom SmartSell messages.</p></div><div><label className="home-merch-switch-v2"><input type="checkbox" checked={config.marketplaceHighlights.enabled} onChange={(event) => updateSection("marketplaceHighlights", "enabled", event.target.checked)} /><span /></label><button className="admin-primary-button-v2" type="button" onClick={() => openSlide()} disabled={config.marketplaceHighlights.slides.length >= 10}><AdminIcon name="spark" size={16} /> Add highlight</button></div></header>
          <div className="home-merch-highlight-options-v2 admin-form-v2"><label className="home-merch-check-v2"><input type="checkbox" checked={config.marketplaceHighlights.autoplay} onChange={(event) => updateSection("marketplaceHighlights", "autoplay", event.target.checked)} /><span>Autoplay highlight slides</span></label><label>Slide interval (seconds)<input type="number" min="3" max="15" value={config.marketplaceHighlights.intervalSeconds} onChange={(event) => updateSection("marketplaceHighlights", "intervalSeconds", Math.min(15, Math.max(3, Number(event.target.value || 5))))} /></label></div>
          {!config.marketplaceHighlights.slides.length ? <AdminEmptyState icon="star" title="No custom highlights yet" description="The Home page will use approved product and service fallbacks until you add image-led slides." action={<button className="admin-primary-button-v2" type="button" onClick={() => openSlide()}>Add first highlight</button>} /> : <div className="home-merch-highlight-list-v2">{config.marketplaceHighlights.slides.map((slide, index) => <article key={`${slide.title}-${index}`}><img src={slide.imageUrl} alt="" /><div><span>{slide.label || `Slide ${index + 1}`}</span><strong>{slide.title}</strong><small>{slide.subtitle || slide.link}</small></div><div className="home-merch-highlight-actions-v2"><button type="button" onClick={() => moveSlide(index, -1)} disabled={index === 0} aria-label="Move slide up">↑</button><button type="button" onClick={() => moveSlide(index, 1)} disabled={index === config.marketplaceHighlights.slides.length - 1} aria-label="Move slide down">↓</button><button type="button" onClick={() => openSlide(index)}><AdminIcon name="edit" size={15} />Edit</button><button className="danger" type="button" onClick={() => removeSlide(index)}>Remove</button></div></article>)}</div>}
        </article>}

        {activeTab === "motion" && <article className="admin-panel-v2 home-merch-motion-v2">
          <div><span className="admin-ops-record-icon-v2 tone-cyan"><AdminIcon name="activity" /></span><div><span className="admin-ops-eyebrow-v2">Continuous product movement</span><h2>Infinite carousel behaviour</h2><p>The public offer rails move continuously without visible scrollbars. Visitors can pause by hovering or focusing a product.</p></div></div>
          <div className="admin-form-v2 home-merch-motion-grid-v2">
            <label className="home-merch-check-v2"><input type="checkbox" checked={config.carousel.enabled} onChange={(event) => updateSection("carousel", "enabled", event.target.checked)} /><span>Enable automatic infinite movement</span></label>
            <label>Movement direction<select value={config.carousel.direction} onChange={(event) => updateSection("carousel", "direction", event.target.value)}><option value="ltr">Left to right</option><option value="rtl">Right to left</option></select></label>
            <label>One loop duration (seconds)<input type="number" min="18" max="90" value={config.carousel.speedSeconds} onChange={(event) => updateSection("carousel", "speedSeconds", Math.min(90, Math.max(18, Number(event.target.value || 34))))} /></label>
            <label className="home-merch-check-v2"><input type="checkbox" checked={config.carousel.pauseOnHover} onChange={(event) => updateSection("carousel", "pauseOnHover", event.target.checked)} /><span>Pause on hover or keyboard focus</span></label>
          </div>
          <div className={`home-merch-motion-preview-v2 direction-${config.carousel.direction}`} style={{ "--preview-speed": `${Math.max(18, config.carousel.speedSeconds) / 2}s` }}><div>{[...products.slice(0, 5), ...products.slice(0, 5)].map((product, index) => <span key={`${product.id}-${index}`}><img src={product.image || "https://placehold.co/90x70?text=Product"} alt="" /><b>{product.name}</b></span>)}</div></div>
        </article>}

        <div className="home-merch-sticky-save-v2"><div><AdminIcon name="shield" size={20} /><span><strong>Public homepage control</strong><small>Changes become visible after publishing. Existing customer, seller, and admin page layouts are not affected.</small></span></div><button className="admin-primary-button-v2" type="button" onClick={saveConfig} disabled={saving}>{saving ? "Publishing..." : "Publish homepage"}</button></div>
      </>}

      <AdminModal open={Boolean(pickerTarget)} onClose={() => setPickerTarget("")} title="Choose products" eyebrow="Homepage collection" size="large">
        <div className="home-merch-picker-v2">
          <label className="admin-search-v2"><AdminIcon name="search" size={18} /><input value={pickerSearch} onChange={(event) => setPickerSearch(event.target.value)} placeholder="Search approved products..." /></label>
          <div className="home-merch-picker-summary-v2"><strong>{selectedIds.length} selected</strong><span>Choose up to 18 products. Their selected order is preserved on the Home page.</span><button type="button" onClick={() => updateSection(pickerTarget, "productIds", [])}>Use automatic selection</button></div>
          <div className="home-merch-picker-grid-v2">{pickerProducts.map((product) => { const active = selectedIds.includes(product.id); return <button key={product.id} className={active ? "active" : ""} type="button" onClick={() => toggleProduct(product.id)}><img src={product.image || product.images?.[0]?.url || "https://placehold.co/120x100?text=Product"} alt="" /><span><strong>{product.name}</strong><small>{product.category || "Product"} · Rs. {money(product.price)}</small><em>{product.sellerName || product.location || "SmartSell"}</em></span><i>{active ? "✓" : "+"}</i></button>; })}</div>
          {!pickerProducts.length && <AdminEmptyState icon="box" title="No products found" description="Try another search or approve products in Listing Approvals first." />}
          <div className="admin-modal-actions-v2"><button className="admin-primary-button-v2" type="button" onClick={() => setPickerTarget("")}>Done</button></div>
        </div>
      </AdminModal>

      <AdminModal open={Boolean(slideEditor)} onClose={() => setSlideEditor(null)} title={slideEditor?.index >= 0 ? "Edit marketplace highlight" : "Add marketplace highlight"} eyebrow="Home carousel slide" size="large">
        {slideEditor && <form className="admin-form-v2 home-merch-slide-form-v2" onSubmit={saveSlide}>
          <div className="home-merch-slide-preview-v2">{slideEditor.value.imageUrl ? <img src={slideEditor.value.imageUrl} alt="Preview" /> : <span><AdminIcon name="star" size={30} />Upload or enter an image URL</span>}</div>
          <div className="home-merch-slide-upload-v2"><label className="admin-secondary-button-v2">{uploading ? "Uploading..." : "Upload image"}<input type="file" accept="image/*" onChange={uploadSlideImage} disabled={uploading} /></label><small>Recommended: 1200 × 900px or wider, JPG/PNG/WebP.</small></div>
          <div className="admin-form-grid-v2 two">
            <label>Image URL<input value={slideEditor.value.imageUrl} onChange={(event) => setSlideEditor((current) => ({ ...current, value: { ...current.value, imageUrl: event.target.value } }))} required /></label>
            <label>Small label<input value={slideEditor.value.label} onChange={(event) => setSlideEditor((current) => ({ ...current, value: { ...current.value, label: event.target.value } }))} /></label>
            <label>Title<input value={slideEditor.value.title} onChange={(event) => setSlideEditor((current) => ({ ...current, value: { ...current.value, title: event.target.value } }))} required /></label>
            <label>Price / callout<input value={slideEditor.value.priceText} onChange={(event) => setSlideEditor((current) => ({ ...current, value: { ...current.value, priceText: event.target.value } }))} placeholder="Rs. 24,900 or Request a quote" /></label>
            <label className="wide">Subtitle<textarea rows="3" value={slideEditor.value.subtitle} onChange={(event) => setSlideEditor((current) => ({ ...current, value: { ...current.value, subtitle: event.target.value } }))} /></label>
            <label>Location<input value={slideEditor.value.location} onChange={(event) => setSlideEditor((current) => ({ ...current, value: { ...current.value, location: event.target.value } }))} /></label>
            <label>Destination link<input value={slideEditor.value.link} onChange={(event) => setSlideEditor((current) => ({ ...current, value: { ...current.value, link: event.target.value } }))} placeholder="/marketplace or /products/..." /></label>
          </div>
          <div className="admin-modal-actions-v2"><button className="admin-primary-button-v2" type="submit">Save highlight</button><button className="admin-secondary-button-v2" type="button" onClick={() => setSlideEditor(null)}>Cancel</button></div>
        </form>}
      </AdminModal>
    </section>
  );
}
