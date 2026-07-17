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
  carousel: { enabled: true, direction: "ltr", speedSeconds: 34, pauseOnHover: true, flashAutoplay: true, flashIntervalSeconds: 5, budgetAutoplay: false, budgetIntervalSeconds: 7 },
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

function ProductSelectionSummary({ products, ids, onRemove, onMove }) {
  const productMap = new Map(products.map((product) => [product.id, product]));
  const selected = ids.map((id) => productMap.get(id)).filter(Boolean);
  if (!selected.length) return <p className="home-merch-selection-empty">No products selected. SmartSell will automatically use qualifying approved products.</p>;
  return (
    <div className="home-merch-selected-products" aria-label="Selected product display order">
      {selected.map((product, index) => (
        <article key={product.id}>
          <span className="home-merch-selected-position">{String(index + 1).padStart(2, "0")}</span>
          <img src={product.image || product.images?.[0]?.url || "https://placehold.co/80x80?text=Product"} alt="" />
          <span className="home-merch-selected-copy"><b>{product.name}</b><small>Rs. {money(product.price)}</small></span>
          <span className="home-merch-selected-actions">
            <button type="button" onClick={() => onMove(index, -1)} disabled={index === 0} aria-label={`Move ${product.name} earlier`}>↑</button>
            <button type="button" onClick={() => onMove(index, 1)} disabled={index === selected.length - 1} aria-label={`Move ${product.name} later`}>↓</button>
            <button className="danger" type="button" onClick={() => onRemove(product.id)} aria-label={`Remove ${product.name}`}>×</button>
          </span>
        </article>
      ))}
    </div>
  );
}

function PreviewProductCard({ product, badge }) {
  return (
    <article className="home-merch-preview-product-v2">
      <span><img src={product?.image || product?.images?.[0]?.url || "https://placehold.co/320x220?text=Product"} alt="" /><mark>{badge}</mark></span>
      <small>{product?.category?.name || product?.category || "Marketplace"}</small>
      <strong>{product?.name || "Approved SmartSell product"}</strong>
      <b>Rs. {money(product?.price)}</b>
    </article>
  );
}

export default function HomeMerchandising() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState("");
  const [activeTab, setActiveTab] = useState("offers");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pickerTarget, setPickerTarget] = useState("");
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerCategory, setPickerCategory] = useState("all");
  const [pickerLocation, setPickerLocation] = useState("all");
  const [pickerPrice, setPickerPrice] = useState("all");
  const [pickerSort, setPickerSort] = useState("featured");
  const [pickerPage, setPickerPage] = useState(1);
  const [slideEditor, setSlideEditor] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState("desktop");
  const [lastPublishedAt, setLastPublishedAt] = useState("");

  async function loadProductOptions({ quiet = false } = {}) {
    if (!quiet) setProductsLoading(true);
    setProductsError("");

    const requests = [
      () => api.get("/admin/home-merchandising/products", { params: { limit: 250 } }),
      () => api.get("/admin/listings", { params: { status: "approved", limit: 250 } }),
      () => api.get("/products", { params: { status: "approved", limit: 250 } }),
    ];

    let lastError = null;
    try {
      for (const request of requests) {
        try {
          const response = await request();
          const payload = response.data?.data;
          const rows = payload?.products || payload || [];
          const approved = (Array.isArray(rows) ? rows : []).filter((product) => product.status === "approved" || !product.status);
          setProducts(approved);
          return approved;
        } catch (requestError) {
          lastError = requestError;
          if (![404, 405].includes(requestError.response?.status)) throw requestError;
        }
      }
      throw lastError || new Error("No product source is available.");
    } catch (productError) {
      setProducts([]);
      setProductsError(productError.response?.data?.message || "Approved products could not be loaded. Restart the updated backend and try again.");
      return [];
    } finally {
      if (!quiet) setProductsLoading(false);
    }
  }

  async function loadData() {
    setLoading(true); setError("");
    try {
      const [settingsResponse] = await Promise.all([
        api.get("/settings/admin"),
        loadProductOptions({ quiet: true }),
      ]);
      const rows = settingsResponse.data?.data?.settings || [];
      const stored = rows.find((setting) => setting.key === "homeMerchandising.config")?.value;
      setConfig(mergeConfig(stored));
      setLastPublishedAt(rows.find((setting) => setting.key === "homeMerchandising.config")?.updatedAt || "");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load homepage merchandising controls.");
    } finally {
      setLoading(false);
      setProductsLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const productCategory = (product) => product.category?.name || product.category || "Uncategorised";
  const pickerCategories = useMemo(() => [...new Set(products.map(productCategory).filter(Boolean))].sort(), [products]);
  const pickerLocations = useMemo(() => [...new Set(products.map((product) => product.location || "Sri Lanka").filter(Boolean))].sort(), [products]);
  const pickerProducts = useMemo(() => {
    const query = pickerSearch.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const category = productCategory(product);
      const location = product.location || "Sri Lanka";
      const price = Number(product.price || 0);
      const matchesSearch = !query || `${product.name} ${category} ${product.sellerName || ""} ${location} ${product.brand || ""} ${product.sku || ""}`.toLowerCase().includes(query);
      const matchesCategory = pickerCategory === "all" || category === pickerCategory;
      const matchesLocation = pickerLocation === "all" || location === pickerLocation;
      const matchesPrice = pickerPrice === "all" || (pickerPrice === "under1000" && price <= 1000) || (pickerPrice === "1000to5000" && price > 1000 && price <= 5000) || (pickerPrice === "over5000" && price > 5000);
      return matchesSearch && matchesCategory && matchesLocation && matchesPrice;
    });
    return [...filtered].sort((a, b) => {
      if (pickerSort === "price_asc") return Number(a.price || 0) - Number(b.price || 0);
      if (pickerSort === "price_desc") return Number(b.price || 0) - Number(a.price || 0);
      if (pickerSort === "name") return String(a.name || "").localeCompare(String(b.name || ""));
      return Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured));
    });
  }, [products, pickerSearch, pickerCategory, pickerLocation, pickerPrice, pickerSort]);

  const selectedIds = pickerTarget ? config[pickerTarget]?.productIds || [] : [];
  const pickerPageSize = 12;
  const pickerPageCount = Math.max(1, Math.ceil(pickerProducts.length / pickerPageSize));
  const visiblePickerProducts = pickerProducts.slice((pickerPage - 1) * pickerPageSize, pickerPage * pickerPageSize);

  useEffect(() => { setPickerPage(1); }, [pickerSearch, pickerCategory, pickerLocation, pickerPrice, pickerSort, pickerTarget]);

  function openProductPicker(target) {
    setPickerTarget(target);
    setPickerSearch("");
    setPickerCategory("all");
    setPickerLocation("all");
    setPickerPrice(target === "budgetCollection" ? "under1000" : "all");
    setPickerSort("featured");
    setPickerPage(1);
  }

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

  function removeSelectedProduct(section, productId) {
    updateSection(section, "productIds", (config[section].productIds || []).filter((id) => id !== productId));
  }

  function moveSelectedProduct(section, index, direction) {
    setConfig((current) => {
      const ids = [...(current[section].productIds || [])];
      const target = index + direction;
      if (target < 0 || target >= ids.length) return current;
      [ids[index], ids[target]] = [ids[target], ids[index]];
      return { ...current, [section]: { ...current[section], productIds: ids } };
    });
  }

  function cleanUnavailableProducts() {
    const available = new Set(products.map((product) => product.id));
    setConfig((current) => ({
      ...current,
      todayOffers: { ...current.todayOffers, productIds: current.todayOffers.productIds.filter((id) => available.has(id)) },
      flashSale: { ...current.flashSale, productIds: current.flashSale.productIds.filter((id) => available.has(id)) },
      budgetCollection: { ...current.budgetCollection, productIds: current.budgetCollection.productIds.filter((id) => available.has(id)) },
    }));
    setMessage("Unavailable product references were removed from Home collections.");
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
    const blocker = validationIssues.find((issue) => issue.blocking);
    if (blocker) {
      setError(blocker.message);
      return;
    }
    setSaving(true); setMessage(""); setError("");
    try {
      await api.patch("/settings/admin", { settings: { "homeMerchandising.config": config } });
      const publishedAt = new Date().toISOString();
      setLastPublishedAt(publishedAt);
      setMessage("Homepage merchandising has been published successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save homepage merchandising.");
    } finally {
      setSaving(false);
    }
  }

  const productMap = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const selectedProductsFor = (section) => (config[section]?.productIds || []).map((id) => productMap.get(id)).filter(Boolean);
  const unavailableIds = useMemo(() => {
    if (productsLoading || productsError) return [];
    const available = new Set(products.map((product) => product.id));
    return [...new Set([
      ...config.todayOffers.productIds,
      ...config.flashSale.productIds,
      ...config.budgetCollection.productIds,
    ].filter((id) => !available.has(id)))];
  }, [products, productsLoading, productsError, config.todayOffers.productIds, config.flashSale.productIds, config.budgetCollection.productIds]);
  const duplicateSelections = useMemo(() => {
    const counts = new Map();
    [config.todayOffers.productIds, config.flashSale.productIds, config.budgetCollection.productIds].flat().forEach((id) => counts.set(id, (counts.get(id) || 0) + 1));
    return [...counts.entries()].filter(([, count]) => count > 1).map(([id]) => productMap.get(id)).filter(Boolean);
  }, [config.todayOffers.productIds, config.flashSale.productIds, config.budgetCollection.productIds, productMap]);
  const flashSchedule = useMemo(() => {
    if (!config.flashSale.enabled) return { state: "off", label: "Disabled", detail: "The campaign is hidden from the public Home page." };
    const now = Date.now();
    const start = config.flashSale.startAt ? new Date(config.flashSale.startAt).getTime() : null;
    const end = config.flashSale.endAt ? new Date(config.flashSale.endAt).getTime() : null;
    if (start && end && end <= start) return { state: "error", label: "Invalid schedule", detail: "The end date must be later than the start date." };
    if (start && now < start) return { state: "scheduled", label: "Scheduled", detail: `Starts ${new Date(start).toLocaleString("en-LK")}.` };
    if (end && now > end) return { state: "ended", label: "Ended", detail: `Ended ${new Date(end).toLocaleString("en-LK")}.` };
    return { state: "live", label: "Live now", detail: end ? `Visible until ${new Date(end).toLocaleString("en-LK")}.` : "Visible now without an end date." };
  }, [config.flashSale]);
  const validationIssues = useMemo(() => {
    const issues = [];
    const start = config.flashSale.startAt ? new Date(config.flashSale.startAt).getTime() : null;
    const end = config.flashSale.endAt ? new Date(config.flashSale.endAt).getTime() : null;
    if (config.todayOffers.enabled && !config.todayOffers.title.trim()) issues.push({ blocking: true, tone: "error", message: "Today’s Offers needs a section title before publishing." });
    if (config.flashSale.enabled && !config.flashSale.title.trim()) issues.push({ blocking: true, tone: "error", message: "Flash Sale needs a campaign title before publishing." });
    if (config.flashSale.enabled && start && end && end <= start) issues.push({ blocking: true, tone: "error", message: "Flash Sale cannot be published because its end date is not later than its start date." });
    if (config.budgetCollection.enabled && !config.budgetCollection.title.trim()) issues.push({ blocking: true, tone: "error", message: "The budget collection needs a section title before publishing." });
    if (config.budgetCollection.enabled && Number(config.budgetCollection.maxPrice || 0) <= 0) issues.push({ blocking: true, tone: "error", message: "The budget collection needs a maximum price greater than zero." });
    if (unavailableIds.length) issues.push({ blocking: false, tone: "warning", message: `${unavailableIds.length} selected product reference${unavailableIds.length === 1 ? " is" : "s are"} no longer available in the approved catalogue.` });
    if (duplicateSelections.length) issues.push({ blocking: false, tone: "info", message: `${duplicateSelections.length} product${duplicateSelections.length === 1 ? " appears" : "s appear"} in more than one Home collection.` });
    if (config.flashSale.enabled && config.flashSale.productIds.length > 0 && config.flashSale.productIds.length < 3) issues.push({ blocking: false, tone: "warning", message: "Flash Sale works best with at least three selected products for the gallery shelf." });
    if (config.marketplaceHighlights.enabled && config.marketplaceHighlights.slides.length === 1) issues.push({ blocking: false, tone: "info", message: "Marketplace Highlights has one slide, so carousel navigation and autoplay will not be visible." });
    return issues;
  }, [config, unavailableIds.length, duplicateSelections.length]);

  const previewToday = selectedProductsFor("todayOffers").length ? selectedProductsFor("todayOffers") : products.slice(0, 6);
  const previewFlash = selectedProductsFor("flashSale").length ? selectedProductsFor("flashSale") : products.slice(0, 5);
  const previewBudget = selectedProductsFor("budgetCollection").length ? selectedProductsFor("budgetCollection") : products.filter((product) => Number(product.price || 0) <= Number(config.budgetCollection.maxPrice || 1000)).slice(0, 4);
  const selectedTotal = config.todayOffers.productIds.length + config.flashSale.productIds.length + config.budgetCollection.productIds.length;
  const enabledCollections = [config.todayOffers.enabled, config.flashSale.enabled, config.budgetCollection.enabled].filter(Boolean).length;

  return (
    <section className="admin-workspace-v2 admin-operations-page-v2 home-merch-page-v2">
      <AdminPageHeader
        eyebrow="Homepage merchandising"
        title="Home offers & highlights"
        description="Control the product rails, limited-time campaigns, affordable collections, carousel movement, and image-led marketplace highlights shown on the public Home page."
        actions={<><button className="admin-secondary-button-v2" type="button" onClick={() => setPreviewOpen(true)}><AdminIcon name="star" size={16} /> Preview changes</button><Link className="admin-secondary-button-v2" to="/" target="_blank">Open live Home</Link><button className="admin-primary-button-v2" type="button" onClick={saveConfig} disabled={saving || loading || validationIssues.some((issue) => issue.blocking)}>{saving ? "Publishing..." : "Publish homepage"}</button></>}
        meta={<><span>{enabledCollections} active offer collections</span><span>{selectedTotal} manually selected products</span><span>{config.marketplaceHighlights.slides.length} highlight slides</span>{lastPublishedAt && <span>Published {new Date(lastPublishedAt).toLocaleString("en-LK")}</span>}</>}
      />

      {message && <div className="admin-alert-v2 success">{message}</div>}
      {error && <div className="admin-alert-v2 error">{error}</div>}

      {loading ? <div className="admin-ops-loading-v2">Loading homepage merchandising...</div> : <>
        <div className="admin-metrics-grid-v2 four home-merch-metrics-v2">
          <AdminMetricCard icon="spark" label="Offer collections" value={enabledCollections} note="Today, flash, and budget" tone="violet" />
          <AdminMetricCard icon="box" label="Selected products" value={selectedTotal} note="Manual merchandising order" tone="blue" />
          <AdminMetricCard icon="star" label="Highlight slides" value={config.marketplaceHighlights.slides.length} note="Admin-managed images" tone="cyan" />
          <AdminMetricCard icon="activity" label="Flash campaign" value={flashSchedule.label} note={config.flashSale.title} tone={flashSchedule.state === "live" ? "emerald" : flashSchedule.state === "error" ? "rose" : "amber"} />
        </div>

        <section className="home-merch-readiness-v2" aria-label="Homepage publishing readiness">
          <div className="home-merch-readiness-head-v2"><span className={`home-merch-readiness-icon-v2 ${validationIssues.some((issue) => issue.blocking) ? "is-error" : validationIssues.length ? "is-warning" : "is-ready"}`}><AdminIcon name={validationIssues.some((issue) => issue.blocking) ? "alert" : "shield"} size={20} /></span><div><strong>{validationIssues.some((issue) => issue.blocking) ? "Publishing needs attention" : validationIssues.length ? "Ready with recommendations" : "Ready to publish"}</strong><p>{validationIssues.length ? "Review the notes below before making the current merchandising configuration public." : "Offer collections, campaign scheduling, and highlight settings are valid."}</p></div><button className="admin-secondary-button-v2" type="button" onClick={() => setPreviewOpen(true)}>Preview current changes</button></div>
          {validationIssues.length > 0 && <div className="home-merch-readiness-list-v2">{validationIssues.map((issue, index) => <article key={`${issue.message}-${index}`} className={`tone-${issue.tone}`}><AdminIcon name={issue.tone === "error" || issue.tone === "warning" ? "alert" : "list"} size={15} /><span>{issue.message}</span>{unavailableIds.length && issue.message.includes("reference") ? <button type="button" onClick={cleanUnavailableProducts}>Remove unavailable</button> : null}</article>)}</div>}
        </section>

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
            <div className="home-merch-selection-v2"><div><strong>Featured products</strong><span>{config.todayOffers.productIds.length ? `${config.todayOffers.productIds.length} manually selected` : "Automatic featured selection"}</span></div><button className="admin-secondary-button-v2" type="button" onClick={() => openProductPicker("todayOffers")}>Choose products</button></div>
            <ProductSelectionSummary products={products} ids={config.todayOffers.productIds} onRemove={(id) => removeSelectedProduct("todayOffers", id)} onMove={(index, direction) => moveSelectedProduct("todayOffers", index, direction)} />
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
            <div className={`home-merch-campaign-state-v2 state-${flashSchedule.state}`}><AdminStatusBadge status={flashSchedule.state === "live" ? "active" : flashSchedule.state === "error" ? "rejected" : flashSchedule.state === "off" || flashSchedule.state === "ended" ? "inactive" : "pending"} label={flashSchedule.label} /><span><strong>{flashSchedule.label}</strong>{flashSchedule.detail}</span></div>
            <div className="home-merch-selection-v2"><div><strong>Flash-sale products</strong><span>{config.flashSale.productIds.length ? `${config.flashSale.productIds.length} selected` : "Automatic featured selection"}</span></div><button className="admin-secondary-button-v2" type="button" onClick={() => openProductPicker("flashSale")}>Choose products</button></div>
            <ProductSelectionSummary products={products} ids={config.flashSale.productIds} onRemove={(id) => removeSelectedProduct("flashSale", id)} onMove={(index, direction) => moveSelectedProduct("flashSale", index, direction)} />
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
          <div className="home-merch-selection-v2"><div><strong>Budget products</strong><span>{config.budgetCollection.productIds.length ? `${config.budgetCollection.productIds.length} manually selected` : `Automatic products at or below Rs. ${money(config.budgetCollection.maxPrice)}`}</span></div><button className="admin-secondary-button-v2" type="button" onClick={() => openProductPicker("budgetCollection")}>Choose products</button></div>
          <ProductSelectionSummary products={products} ids={config.budgetCollection.productIds} onRemove={(id) => removeSelectedProduct("budgetCollection", id)} onMove={(index, direction) => moveSelectedProduct("budgetCollection", index, direction)} />
        </article>}

        {activeTab === "highlights" && <article className="admin-panel-v2 home-merch-highlight-editor-v2">
          <header className="home-merch-highlight-head-v2"><div><span className="admin-ops-eyebrow-v2">Hero marketplace carousel</span><h2>Marketplace Highlights</h2><p>Upload image-led slides for products, services, shops, campaigns, or custom SmartSell messages.</p></div><div><label className="home-merch-switch-v2"><input type="checkbox" checked={config.marketplaceHighlights.enabled} onChange={(event) => updateSection("marketplaceHighlights", "enabled", event.target.checked)} /><span /></label><button className="admin-primary-button-v2" type="button" onClick={() => openSlide()} disabled={config.marketplaceHighlights.slides.length >= 10}><AdminIcon name="spark" size={16} /> Add highlight</button></div></header>
          <div className="home-merch-highlight-options-v2 admin-form-v2"><label className="home-merch-check-v2"><input type="checkbox" checked={config.marketplaceHighlights.autoplay} onChange={(event) => updateSection("marketplaceHighlights", "autoplay", event.target.checked)} /><span>Autoplay highlight slides</span></label><label>Slide interval (seconds)<input type="number" min="3" max="15" value={config.marketplaceHighlights.intervalSeconds} onChange={(event) => updateSection("marketplaceHighlights", "intervalSeconds", Math.min(15, Math.max(3, Number(event.target.value || 5))))} /></label></div>
          {!config.marketplaceHighlights.slides.length ? <AdminEmptyState icon="star" title="No custom highlights yet" description="The Home page will use approved product and service fallbacks until you add image-led slides." action={<button className="admin-primary-button-v2" type="button" onClick={() => openSlide()}>Add first highlight</button>} /> : <div className="home-merch-highlight-list-v2">{config.marketplaceHighlights.slides.map((slide, index) => <article key={`${slide.title}-${index}`}><img src={slide.imageUrl} alt="" /><div><span>{slide.label || `Slide ${index + 1}`}</span><strong>{slide.title}</strong><small>{slide.subtitle || slide.link}</small></div><div className="home-merch-highlight-actions-v2"><button type="button" onClick={() => moveSlide(index, -1)} disabled={index === 0} aria-label="Move slide up">↑</button><button type="button" onClick={() => moveSlide(index, 1)} disabled={index === config.marketplaceHighlights.slides.length - 1} aria-label="Move slide down">↓</button><button type="button" onClick={() => openSlide(index)}><AdminIcon name="edit" size={15} />Edit</button><button className="danger" type="button" onClick={() => removeSlide(index)}>Remove</button></div></article>)}</div>}
        </article>}

        {activeTab === "motion" && <article className="admin-panel-v2 home-merch-motion-v2">
          <div><span className="admin-ops-record-icon-v2 tone-cyan"><AdminIcon name="activity" /></span><div><span className="admin-ops-eyebrow-v2">Continuous product movement</span><h2>Infinite carousel behaviour</h2><p>The public offer rails move continuously without visible scrollbars. Visitors can pause by hovering or focusing a product.</p></div></div>
          <div className="home-merch-experience-grid-v2">
            <section><span className="admin-ops-eyebrow-v2">Today’s Offers</span><h3>Continuous marquee</h3><p>Products flow smoothly across the page and pause when a shopper interacts.</p><div className="admin-form-v2 home-merch-motion-grid-v2"><label className="home-merch-check-v2"><input type="checkbox" checked={config.carousel.enabled} onChange={(event) => updateSection("carousel", "enabled", event.target.checked)} /><span>Enable movement</span></label><label>Direction<select value={config.carousel.direction} onChange={(event) => updateSection("carousel", "direction", event.target.value)}><option value="ltr">Left to right</option><option value="rtl">Right to left</option></select></label><label>Loop duration<input type="number" min="18" max="90" value={config.carousel.speedSeconds} onChange={(event) => updateSection("carousel", "speedSeconds", Math.min(90, Math.max(18, Number(event.target.value || 34))))} /></label><label className="home-merch-check-v2"><input type="checkbox" checked={config.carousel.pauseOnHover} onChange={(event) => updateSection("carousel", "pauseOnHover", event.target.checked)} /><span>Pause on interaction</span></label></div></section>
            <section><span className="admin-ops-eyebrow-v2">Flash Sale</span><h3>Spotlight rotation</h3><p>One large deal rotates with a countdown, next-product queue, and arrow controls.</p><div className="admin-form-v2 home-merch-motion-grid-v2"><label className="home-merch-check-v2"><input type="checkbox" checked={config.carousel.flashAutoplay !== false} onChange={(event) => updateSection("carousel", "flashAutoplay", event.target.checked)} /><span>Autoplay spotlight</span></label><label>Rotation interval<input type="number" min="3" max="15" value={config.carousel.flashIntervalSeconds || 5} onChange={(event) => updateSection("carousel", "flashIntervalSeconds", Math.min(15, Math.max(3, Number(event.target.value || 5))))} /></label></div></section>
            <section><span className="admin-ops-eyebrow-v2">Budget Collection</span><h3>Paged product gallery</h3><p>Shoppers move through clean pages using arrows and progress dots instead of an endless rail.</p><div className="admin-form-v2 home-merch-motion-grid-v2"><label className="home-merch-check-v2"><input type="checkbox" checked={Boolean(config.carousel.budgetAutoplay)} onChange={(event) => updateSection("carousel", "budgetAutoplay", event.target.checked)} /><span>Autoplay pages</span></label><label>Page interval<input type="number" min="4" max="20" value={config.carousel.budgetIntervalSeconds || 7} onChange={(event) => updateSection("carousel", "budgetIntervalSeconds", Math.min(20, Math.max(4, Number(event.target.value || 7))))} /></label></div></section>
          </div>
          <div className={`home-merch-motion-preview-v2 direction-${config.carousel.direction}`} style={{ "--preview-speed": `${Math.max(18, config.carousel.speedSeconds) / 2}s` }}><div>{[...products.slice(0, 5), ...products.slice(0, 5)].map((product, index) => <span key={`${product.id}-${index}`}><img src={product.image || "https://placehold.co/90x70?text=Product"} alt="" /><b>{product.name}</b></span>)}</div></div>
        </article>}

        <div className="home-merch-sticky-save-v2"><div><AdminIcon name="shield" size={20} /><span><strong>Public homepage control</strong><small>Preview unpublished changes first. Publishing updates only the public Home merchandising configuration.</small></span></div><button className="admin-primary-button-v2" type="button" onClick={saveConfig} disabled={saving || validationIssues.some((issue) => issue.blocking)}>{saving ? "Publishing..." : validationIssues.some((issue) => issue.blocking) ? "Resolve issues to publish" : "Publish homepage"}</button></div>
      </>}

      <AdminModal open={previewOpen} onClose={() => setPreviewOpen(false)} title="Preview Home merchandising" eyebrow="Unpublished customer view" size="large">
        <div className="home-merch-preview-v2">
          <div className="home-merch-preview-toolbar-v2"><div><strong>Customer-side merchandising preview</strong><span>This preview uses the current unsaved admin form values and approved product catalogue.</span></div><div role="group" aria-label="Preview device"><button type="button" className={previewDevice === "desktop" ? "active" : ""} onClick={() => setPreviewDevice("desktop")}>Desktop</button><button type="button" className={previewDevice === "mobile" ? "active" : ""} onClick={() => setPreviewDevice("mobile")}>Mobile</button></div></div>
          <div className={`home-merch-preview-canvas-v2 device-${previewDevice}`}>
            <header><span>SmartSell Home</span><strong>Offers & marketplace highlights</strong><small>Unpublished preview</small></header>
            {config.marketplaceHighlights.enabled && <section className="home-merch-preview-highlight-v2">{config.marketplaceHighlights.slides[0]?.imageUrl ? <img src={config.marketplaceHighlights.slides[0].imageUrl} alt="" /> : <div className="home-merch-preview-placeholder-v2"><AdminIcon name="star" size={24} /><span>Fallback marketplace highlight</span></div>}<div><small>{config.marketplaceHighlights.slides[0]?.label || "Marketplace highlight"}</small><h3>{config.marketplaceHighlights.slides[0]?.title || "Approved products, services, and storefronts"}</h3><p>{config.marketplaceHighlights.slides[0]?.subtitle || "SmartSell will show a live fallback until custom highlight slides are published."}</p></div></section>}
            {config.todayOffers.enabled && <section className="home-merch-preview-section-v2"><div><small>{config.todayOffers.eyebrow}</small><h3>{config.todayOffers.title}</h3><p>{config.todayOffers.description}</p></div><div className="home-merch-preview-products-v2">{previewToday.slice(0, previewDevice === "mobile" ? 2 : 4).map((product) => <PreviewProductCard key={`today-${product.id}`} product={product} badge="Today's offer" />)}</div></section>}
            {config.flashSale.enabled && <section className={`home-merch-preview-flash-v2 state-${flashSchedule.state}`}><div><small>{config.flashSale.badge}</small><h3>{config.flashSale.title}</h3><p>{flashSchedule.detail}</p></div><div className="home-merch-preview-flash-layout-v2"><PreviewProductCard product={previewFlash[0]} badge="Active deal" /><aside>{previewFlash.slice(0, 4).map((product, index) => <span key={`flash-${product.id}`} className={index === 0 ? "active" : ""}><img src={product.image || product.images?.[0]?.url || "https://placehold.co/100x80?text=Product"} alt="" /><b>{product.name}</b></span>)}</aside></div></section>}
            {config.budgetCollection.enabled && <section className="home-merch-preview-section-v2 tone-budget"><div><small>{config.budgetCollection.eyebrow}</small><h3>{config.budgetCollection.title}</h3><p>{config.budgetCollection.description}</p></div><div className="home-merch-preview-products-v2">{previewBudget.slice(0, previewDevice === "mobile" ? 2 : 4).map((product) => <PreviewProductCard key={`budget-${product.id}`} product={product} badge={`Under Rs. ${money(config.budgetCollection.maxPrice)}`} />)}</div></section>}
          </div>
          <div className="admin-modal-actions-v2"><button className="admin-primary-button-v2" type="button" onClick={() => { setPreviewOpen(false); saveConfig(); }} disabled={validationIssues.some((issue) => issue.blocking)}>Publish this configuration</button><button className="admin-secondary-button-v2" type="button" onClick={() => setPreviewOpen(false)}>Continue editing</button></div>
        </div>
      </AdminModal>

      <AdminModal open={Boolean(pickerTarget)} onClose={() => setPickerTarget("")} title="Choose products" eyebrow="Homepage collection" size="large">
        <div className="home-merch-picker-v2">
          <div className="home-merch-picker-toolbar-v2">
            <div className="home-merch-picker-source-v2">
              <div><strong>{productsLoading ? "Loading approved products..." : `${products.length} approved products available`}</strong><span>Filter the catalogue, then select up to 18 products for this Home collection.</span></div>
              <button className="admin-secondary-button-v2" type="button" onClick={() => loadProductOptions()} disabled={productsLoading}><AdminIcon name="refresh" size={15} />{productsLoading ? "Refreshing..." : "Refresh products"}</button>
            </div>
            {productsError && <div className="home-merch-picker-error-v2"><AdminIcon name="alert" size={16} />{productsError}</div>}
            <label className="admin-search-v2"><AdminIcon name="search" size={18} /><input value={pickerSearch} onChange={(event) => setPickerSearch(event.target.value)} placeholder="Search name, seller, category, brand, or SKU..." /></label>
            <div className="home-merch-picker-filters-v2">
              <label>Category<select value={pickerCategory} onChange={(event) => setPickerCategory(event.target.value)}><option value="all">All categories</option>{pickerCategories.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
              <label>Location<select value={pickerLocation} onChange={(event) => setPickerLocation(event.target.value)}><option value="all">All locations</option>{pickerLocations.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
              <label>Price<select value={pickerPrice} onChange={(event) => setPickerPrice(event.target.value)}><option value="all">Any price</option><option value="under1000">Under Rs. 1,000</option><option value="1000to5000">Rs. 1,001–5,000</option><option value="over5000">Above Rs. 5,000</option></select></label>
              <label>Sort<select value={pickerSort} onChange={(event) => setPickerSort(event.target.value)}><option value="featured">Featured first</option><option value="price_asc">Lowest price</option><option value="price_desc">Highest price</option><option value="name">Name A–Z</option></select></label>
            </div>
          </div>
          <div className="home-merch-picker-summary-v2"><strong>{selectedIds.length} selected</strong><span>{pickerProducts.length} approved products match the current filters. Choose up to 18.</span><button type="button" onClick={() => updateSection(pickerTarget, "productIds", [])}>Use automatic selection</button></div>
          {productsLoading ? <div className="home-merch-picker-loading-v2">Loading approved products...</div> : <div className="home-merch-picker-grid-v2">{visiblePickerProducts.map((product) => { const active = selectedIds.includes(product.id); return <button key={product.id} className={active ? "active" : ""} type="button" onClick={() => toggleProduct(product.id)}><img src={product.image || product.images?.[0]?.url || "https://placehold.co/120x100?text=Product"} alt="" /><span><strong>{product.name}</strong><small>{productCategory(product)} · Rs. {money(product.price)}</small><em>{product.sellerName || "SmartSell seller"} · {product.location || "Sri Lanka"}</em></span><i>{active ? "✓" : "+"}</i></button>; })}</div>}
          {!productsLoading && !pickerProducts.length && <AdminEmptyState icon="box" title="No approved products match" description={productsError || (products.length ? "Clear one or more filters and try again." : "No approved products are available yet. Approve products in Listing Approvals, then select Refresh products.")} />}
          {pickerPageCount > 1 && <div className="home-merch-picker-pagination-v2"><button type="button" onClick={() => setPickerPage((page) => Math.max(1, page - 1))} disabled={pickerPage === 1}>Previous</button><span>Page <strong>{pickerPage}</strong> of {pickerPageCount}</span><button type="button" onClick={() => setPickerPage((page) => Math.min(pickerPageCount, page + 1))} disabled={pickerPage === pickerPageCount}>Next</button></div>}
          <div className="admin-modal-actions-v2"><button className="admin-primary-button-v2" type="button" onClick={() => setPickerTarget("")}>Done selecting</button></div>
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
