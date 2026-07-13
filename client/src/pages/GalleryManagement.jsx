import { useEffect, useMemo, useState } from "react";
import SmartPagination from "../components/SmartPagination.jsx";
import {
  BusinessEmptyState,
  BusinessIcon,
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

function money(value) { return value === null || value === undefined || value === "" ? "Quote based" : `Rs. ${Number(value || 0).toLocaleString("en-LK")}`; }
function readable(value) { return String(value || "").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function titleOf(item) { return item?.type === "service" ? item?.title || item?.name || "Service" : item?.name || "Product"; }
function emptyForm() { return { url: "", alt: "" }; }

export default function GalleryManagement() {
  const [tab, setTab] = useState("products");
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageAlt, setImageAlt] = useState("");
  const [showAddImages, setShowAddImages] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const currentList = tab === "products" ? products : services;
  const currentType = selected?.type || (tab === "products" ? "product" : "service");
  const currentBase = currentType === "service" ? "services" : "products";
  const galleryStats = useMemo(() => {
    const all = [...products, ...services];
    return {
      totalItems: all.length,
      totalImages: all.reduce((sum, item) => sum + Number(item.imageCount || 0), 0),
      missing: all.filter((item) => Number(item.imageCount || 0) === 0).length,
      strong: all.filter((item) => Number(item.imageCount || 0) >= 4).length,
    };
  }, [products, services]);
  const listingPagination = useSmartPagination(currentList, { initialPageSize: 10, resetKey: `${tab}-${query}` });
  const imagePagination = useSmartPagination(selected?.images || [], { initialPageSize: 10, resetKey: selected?.id || "none" });

  async function loadData(preferredSelectionId = selected?.id) {
    setLoading(true); setError("");
    try {
      const [productRes, serviceRes] = await Promise.all([
        api.get("/gallery/products", { params: { q: query, limit: 180 } }),
        api.get("/gallery/services", { params: { q: query, limit: 180 } }),
      ]);
      const nextProducts = productRes.data.data || [];
      const nextServices = serviceRes.data.data || [];
      setProducts(nextProducts); setServices(nextServices);
      const activeList = tab === "products" ? nextProducts : nextServices;
      const nextSelected = preferredSelectionId ? [...nextProducts, ...nextServices].find((item) => item.id === preferredSelectionId) : activeList[0];
      setSelected(nextSelected || activeList[0] || null);
    } catch (requestError) { setError(requestError.smartSellMessage || requestError.response?.data?.message || "Could not load gallery manager."); }
    finally { setLoading(false); }
  }

  useEffect(() => { const timeout = setTimeout(() => loadData(), 250); return () => clearTimeout(timeout); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [query]);
  useEffect(() => {
    const expectedType = tab === "services" ? "service" : "product";
    if (!selected || selected.type !== expectedType) setSelected(currentList[0] || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, products, services]);
  useEffect(() => { setImageAlt(selectedImage?.alt || ""); }, [selectedImage]);

  function refreshSelected(nextGallery) {
    if (!nextGallery) return loadData();
    const updater = (item) => item.id === nextGallery.id ? nextGallery : item;
    if (nextGallery.type === "service") setServices((items) => items.map(updater)); else setProducts((items) => items.map(updater));
    setSelected(nextGallery);
    if (selectedImage) setSelectedImage(nextGallery.images?.find((image) => image.id === selectedImage.id) || null);
  }

  async function addImage(event) {
    event.preventDefault(); if (!selected || !form.url.trim()) { setError("Image URL is required."); return; }
    try { const response = await api.post(`/gallery/${currentBase}/${selected.id}/images`, { url: form.url.trim(), alt: form.alt.trim() }); setForm(emptyForm()); setMessage("Image added to the gallery."); setShowAddImages(false); refreshSelected(response.data.data); }
    catch (requestError) { setError(requestError.smartSellMessage || requestError.response?.data?.message || "Could not add image."); }
  }

  async function uploadImages(event) {
    const files = Array.from(event.target.files || []); event.target.value = "";
    if (!selected || !files.length) return;
    const formData = new FormData(); files.slice(0, 8).forEach((file) => formData.append("images", file));
    setUploading(true); setError("");
    try {
      const uploadRes = await api.post("/upload/listing-images", formData, { headers: { "Content-Type": "multipart/form-data" } });
      const uploaded = uploadRes.data.data || [];
      let latest = selected;
      for (const image of uploaded) {
        const addRes = await api.post(`/gallery/${currentBase}/${selected.id}/images`, { url: image.url, alt: image.originalName || image.filename || titleOf(selected) });
        latest = addRes.data.data;
      }
      setMessage(`${uploaded.length} image${uploaded.length === 1 ? "" : "s"} uploaded and attached.`); setShowAddImages(false); refreshSelected(latest);
    } catch (requestError) { setError(requestError.smartSellMessage || requestError.response?.data?.message || "Could not upload gallery images."); }
    finally { setUploading(false); }
  }

  async function setPrimary(image) {
    try { const response = await api.post(`/gallery/${currentBase}/${selected.id}/images/${image.id}/primary`); setMessage("Primary image updated."); refreshSelected(response.data.data); }
    catch (requestError) { setError(requestError.smartSellMessage || requestError.response?.data?.message || "Could not update primary image."); }
  }
  async function removeImage(image) {
    if (!window.confirm("Remove this image from the listing gallery?")) return;
    try { const response = await api.delete(`/gallery/${currentBase}/${selected.id}/images/${image.id}`); setMessage("Image removed."); setSelectedImage(null); refreshSelected(response.data.data); }
    catch (requestError) { setError(requestError.smartSellMessage || requestError.response?.data?.message || "Could not remove image."); }
  }
  async function moveImage(image, direction) {
    const images = [...(selected?.images || [])]; const index = images.findIndex((item) => item.id === image.id); const target = index + direction;
    if (index < 0 || target < 0 || target >= images.length) return;
    [images[index], images[target]] = [images[target], images[index]];
    try { const response = await api.post(`/gallery/${currentBase}/${selected.id}/images/reorder`, { images: images.map((item, sortOrder) => ({ id: item.id, sortOrder })) }); setMessage("Gallery order saved."); refreshSelected(response.data.data); }
    catch (requestError) { setError(requestError.smartSellMessage || requestError.response?.data?.message || "Could not reorder images."); }
  }
  async function saveAlt() {
    if (!selectedImage) return;
    try { const response = await api.patch(`/gallery/${currentBase}/${selected.id}/images/${selectedImage.id}`, { alt: imageAlt }); setMessage("Alt text updated."); refreshSelected(response.data.data); }
    catch (requestError) { setError(requestError.smartSellMessage || requestError.response?.data?.message || "Could not update alt text."); }
  }

  return <section className="business-workspace-v2 business-management-v2 business-gallery-v2">
    <BusinessPageHeader eyebrow="Visual merchandising" title="Gallery manager" description="Build consistent product and service galleries, choose the primary image, improve accessibility text, and keep image actions inside a focused manager." meta={<><span><BusinessIcon name="image" size={15} />{galleryStats.totalImages} images</span><span><BusinessIcon name="alert" size={15} />{galleryStats.missing} listings need images</span></>} actions={<><button className="business-ghost-button-v2" type="button" onClick={() => loadData()}><BusinessIcon name="refresh" size={17} />Refresh</button><button className="business-primary-button-v2" type="button" onClick={() => setShowAddImages(true)} disabled={!selected}><BusinessIcon name="upload" size={17} />Add images</button></>} />
    {error && <div className="business-error-v2"><strong>Gallery action needs attention</strong><p>{error}</p></div>}
    {message && <div className="bm-notice-v2 success"><BusinessIcon name="check" size={18} /><span>{message}</span></div>}
    <div className="business-metrics-grid-v2"><BusinessMetricCard icon="box" label="Listings" value={galleryStats.totalItems} note="Products and services" tone="blue" /><BusinessMetricCard icon="image" label="Gallery images" value={galleryStats.totalImages} note="Attached across listings" tone="violet" /><BusinessMetricCard icon="alert" label="Need images" value={galleryStats.missing} note="No image attached yet" tone="amber" /><BusinessMetricCard icon="star" label="Strong galleries" value={galleryStats.strong} note="Four or more images" tone="emerald" /></div>
    <section className="bm-gallery-shell-v2">
      <aside className="bm-gallery-list-v2"><div className="bm-gallery-list-head-v2"><div><span>Listings</span><h2>Select a listing</h2></div><div className="bm-segmented-v2"><button type="button" className={tab === "products" ? "active" : ""} onClick={() => setTab("products")}>Products</button><button type="button" className={tab === "services" ? "active" : ""} onClick={() => setTab("services")}>Services</button></div></div><BusinessSearchToolbar value={query} onChange={setQuery} placeholder={`Search ${tab}`} />
        {loading ? <div className="business-loading-v2"><span /><p>Loading listings...</p></div> : !currentList.length ? <BusinessEmptyState icon="image" title={`No ${tab} found`} description="Create a listing before managing its gallery." /> : <div className="bm-gallery-list-scroll-v2">{listingPagination.items.map((item) => <button key={`${item.type}-${item.id}`} type="button" className={`bm-gallery-list-item-v2 ${selected?.id === item.id ? "active" : ""}`} onClick={() => setSelected(item)}><span>{item.primaryImage ? <img src={item.primaryImage} alt="" /> : <BusinessIcon name={item.type === "service" ? "service" : "box"} />}</span><div><strong>{titleOf(item)}</strong><small>{item.category || "Uncategorized"} · {readable(item.status)}</small><em>{item.imageCount || 0} image{item.imageCount === 1 ? "" : "s"}</em></div><BusinessIcon name="chevron" size={16} /></button>)}<SmartPagination pagination={listingPagination} label="listings" compact /></div>}
      </aside>
      <section className="bm-gallery-workspace-v2">
        {!selected ? <BusinessEmptyState icon="image" title="Select a listing" description="Choose a product or service to manage its public images." /> : <><header className="bm-gallery-selected-v2"><div className="bm-gallery-primary-v2">{selected.primaryImage ? <img src={selected.primaryImage} alt="" /> : <BusinessIcon name="camera" size={30} />}</div><div><span>{readable(selected.type)}</span><h2>{titleOf(selected)}</h2><p>{selected.category || "Uncategorized"} · {selected.owner || "Your business"}</p><div><BusinessStatusBadge status={selected.status} /><b>{selected.type === "service" ? money(selected.priceFrom) : money(selected.price)}</b>{selected.type === "product" && <small>{selected.stock ?? 0} stock</small>}</div></div><button className="business-secondary-button-v2" type="button" onClick={() => setShowAddImages(true)}><BusinessIcon name="add" size={16} />Add images</button></header>
          <div className="bm-section-heading-v2"><div><span>Listing gallery</span><h3>{selected.images?.length || 0} image{selected.images?.length === 1 ? "" : "s"}</h3><p>Click any image to change its alt text, order, primary status, or removal.</p></div></div>
          {!selected.images?.length ? <BusinessEmptyState icon="camera" title="No images yet" description="Add at least one clear image so this listing looks trustworthy in cards and detail pages." action={<button className="business-primary-button-v2" type="button" onClick={() => setShowAddImages(true)}>Add first image</button>} /> : <div className="bm-gallery-grid-v2">{imagePagination.items.map((image, index) => { const absoluteIndex = imagePagination.startItem - 1 + index; return <article className="bm-gallery-image-v2" key={image.id} role="button" tabIndex="0" onClick={() => setSelectedImage(image)} onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && setSelectedImage(image)}><div><img src={image.url} alt={image.alt || titleOf(selected)} />{absoluteIndex === 0 && <span>Primary</span>}</div><footer><p>{image.alt || "Alt text not added"}</p><b>Manage <BusinessIcon name="chevron" size={15} /></b></footer></article>; })}<SmartPagination pagination={imagePagination} label="images" compact /></div>}
        </>}
      </section>
    </section>

    <BusinessModal open={showAddImages} title={`Add images to ${titleOf(selected)}`} eyebrow="Gallery upload" onClose={() => setShowAddImages(false)}>
      {selected && <div className="bm-upload-layout-v2"><form className="business-editor-v2 bm-editor-no-border-v2" onSubmit={addImage}><div className="bm-section-heading-v2"><div><span>Image URL</span><h3>Attach an existing online image</h3></div></div><label><span>Image URL</span><input value={form.url} onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))} placeholder="https://... or /uploads/listings/..." /></label><label><span>Alt text</span><input value={form.alt} onChange={(event) => setForm((current) => ({ ...current, alt: event.target.value }))} placeholder="Describe the image for customers and search engines" /></label><button className="business-secondary-button-v2" type="submit">Add image URL</button></form><div className="bm-upload-card-v2"><span><BusinessIcon name="upload" size={28} /></span><h3>Upload from your computer</h3><p>Select up to eight images. SmartSell will upload and attach them to this listing.</p><label><input type="file" multiple accept="image/*" onChange={uploadImages} disabled={uploading} /><b>{uploading ? "Uploading images..." : "Choose images"}</b><small>JPG, PNG, WEBP · up to 8 files</small></label></div></div>}
    </BusinessModal>

    <BusinessModal open={Boolean(selectedImage)} title="Manage gallery image" eyebrow={titleOf(selected)} onClose={() => setSelectedImage(null)} size="medium">
      {selectedImage && <><div className="bm-image-manager-preview-v2"><img src={selectedImage.url} alt={selectedImage.alt || titleOf(selected)} />{selected?.images?.[0]?.id === selectedImage.id && <BusinessStatusBadge status="approved" />}</div><label className="business-field-v2"><span>Alt text</span><input value={imageAlt} onChange={(event) => setImageAlt(event.target.value)} placeholder="Describe what customers see" /></label><div className="business-description-v2"><span>Image URL</span><p>{selectedImage.url}</p></div><div className="business-modal-action-row-v2 bm-image-actions-v2"><button className="business-danger-button-v2" type="button" onClick={() => removeImage(selectedImage)}>Remove</button><button className="business-ghost-button-v2" type="button" disabled={selected?.images?.findIndex((item) => item.id === selectedImage.id) === 0} onClick={() => moveImage(selectedImage, -1)}>Move earlier</button><button className="business-ghost-button-v2" type="button" disabled={selected?.images?.findIndex((item) => item.id === selectedImage.id) === (selected?.images?.length || 1) - 1} onClick={() => moveImage(selectedImage, 1)}>Move later</button><button className="business-secondary-button-v2" type="button" disabled={selected?.images?.[0]?.id === selectedImage.id} onClick={() => setPrimary(selectedImage)}>Set primary</button><button className="business-primary-button-v2" type="button" onClick={saveAlt}>Save alt text</button></div></>}
    </BusinessModal>
  </section>;
}
