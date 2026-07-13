import { useEffect, useMemo, useState } from "react";
import api from "../utils/api.js";
import "../styles/pages/business/GalleryManagement.css";

function money(value) {
  if (value === null || value === undefined || value === "") return "Quote based";
  return `Rs. ${Number(value || 0).toLocaleString()}`;
}

function statusText(value) {
  return String(value || "draft").replaceAll("_", " ");
}

function imageTitle(item) {
  return item?.type === "service" ? item?.title || item?.name || "Service" : item?.name || "Product";
}

function emptyForm() {
  return { url: "", alt: "" };
}

export default function GalleryManagement() {
  const [tab, setTab] = useState("products");
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const currentList = tab === "products" ? products : services;
  const currentType = selected?.type || (tab === "products" ? "product" : "service");
  const currentBase = currentType === "service" ? "services" : "products";
  const currentIdKey = currentType === "service" ? "serviceId" : "productId";

  const galleryStats = useMemo(() => {
    const all = [...products, ...services];
    const totalItems = all.length;
    const totalImages = all.reduce((sum, item) => sum + Number(item.imageCount || 0), 0);
    const missing = all.filter((item) => Number(item.imageCount || 0) === 0).length;
    const strong = all.filter((item) => Number(item.imageCount || 0) >= 4).length;
    return { totalItems, totalImages, missing, strong };
  }, [products, services]);

  async function loadData(preferredSelectionId = selected?.id) {
    setLoading(true);
    setMessage("");
    try {
      const [productRes, serviceRes] = await Promise.all([
        api.get("/gallery/products", { params: { q: query, limit: 180 } }),
        api.get("/gallery/services", { params: { q: query, limit: 180 } }),
      ]);
      const nextProducts = productRes.data.data || [];
      const nextServices = serviceRes.data.data || [];
      setProducts(nextProducts);
      setServices(nextServices);

      const combined = [...nextProducts, ...nextServices];
      const nextSelected = preferredSelectionId
        ? combined.find((item) => item.id === preferredSelectionId)
        : combined[0];
      setSelected(nextSelected || null);
    } catch (error) {
      setMessage(error.smartSellMessage || "Could not load gallery manager.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => loadData(), 250);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    if (!selected && currentList.length) setSelected(currentList[0]);
    if (selected && selected.type !== (tab === "services" ? "service" : "product")) {
      setSelected(currentList[0] || null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, products, services]);

  async function refreshSelected(nextGallery) {
    if (!nextGallery) return loadData();
    const updater = (item) => (item.id === nextGallery.id ? nextGallery : item);
    if (nextGallery.type === "service") setServices((items) => items.map(updater));
    else setProducts((items) => items.map(updater));
    setSelected(nextGallery);
  }

  async function addImage(event) {
    event.preventDefault();
    if (!selected) return;
    if (!form.url.trim()) {
      setMessage("Image URL is required.");
      return;
    }
    try {
      const res = await api.post(`/gallery/${currentBase}/${selected.id}/images`, {
        url: form.url.trim(),
        alt: form.alt.trim(),
      });
      setForm(emptyForm());
      setMessage("Image added to gallery.");
      refreshSelected(res.data.data);
    } catch (error) {
      setMessage(error.smartSellMessage || "Could not add image.");
    }
  }

  async function uploadImages(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!selected || !files.length) return;
    const formData = new FormData();
    files.slice(0, 8).forEach((file) => formData.append("images", file));
    setUploading(true);
    setMessage("");
    try {
      const uploadRes = await api.post("/upload/listing-images", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const uploaded = uploadRes.data.data || [];
      let latestGallery = selected;
      for (const image of uploaded) {
        const addRes = await api.post(`/gallery/${currentBase}/${selected.id}/images`, {
          url: image.url,
          alt: image.originalName || image.filename || imageTitle(selected),
        });
        latestGallery = addRes.data.data;
      }
      setMessage(`${uploaded.length} image${uploaded.length === 1 ? "" : "s"} uploaded and attached.`);
      refreshSelected(latestGallery);
    } catch (error) {
      setMessage(error.smartSellMessage || "Could not upload gallery images.");
    } finally {
      setUploading(false);
    }
  }

  async function setPrimary(image) {
    try {
      const res = await api.post(`/gallery/${currentBase}/${selected.id}/images/${image.id}/primary`);
      setMessage("Primary image updated.");
      refreshSelected(res.data.data);
    } catch (error) {
      setMessage(error.smartSellMessage || "Could not update primary image.");
    }
  }

  async function removeImage(image) {
    if (!confirm("Remove this image from the listing gallery?")) return;
    try {
      const res = await api.delete(`/gallery/${currentBase}/${selected.id}/images/${image.id}`);
      setMessage("Image removed.");
      refreshSelected(res.data.data);
    } catch (error) {
      setMessage(error.smartSellMessage || "Could not remove image.");
    }
  }

  async function moveImage(image, direction) {
    const images = [...(selected?.images || [])];
    const index = images.findIndex((item) => item.id === image.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    try {
      const res = await api.post(`/gallery/${currentBase}/${selected.id}/images/reorder`, {
        images: next.map((item, sortOrder) => ({ id: item.id, sortOrder })),
      });
      setMessage("Gallery order saved.");
      refreshSelected(res.data.data);
    } catch (error) {
      setMessage(error.smartSellMessage || "Could not reorder images.");
    }
  }

  async function saveAlt(image, nextAlt) {
    try {
      const res = await api.patch(`/gallery/${currentBase}/${selected.id}/images/${image.id}`, {
        alt: nextAlt,
      });
      refreshSelected(res.data.data);
    } catch (error) {
      setMessage(error.smartSellMessage || "Could not update alt text.");
    }
  }

  return (
    <main className="gallery-manager-page">
      <section className="gallery-manager-hero">
        <div>
          <span className="gm-eyebrow">Phase 100</span>
          <h1>Product & Service Gallery Manager</h1>
          <p>Control your marketplace visuals from one place: upload, arrange, set primary image, and clean alt text for every listing.</p>
        </div>
        <div className="gm-hero-stats" aria-label="Gallery summary">
          <article><strong>{galleryStats.totalItems}</strong><span>Listings</span></article>
          <article><strong>{galleryStats.totalImages}</strong><span>Images</span></article>
          <article><strong>{galleryStats.missing}</strong><span>Need images</span></article>
          <article><strong>{galleryStats.strong}</strong><span>Strong galleries</span></article>
        </div>
      </section>

      {message && <div className="gm-message">{message}</div>}

      <section className="gallery-manager-shell">
        <aside className="gm-list-panel">
          <div className="gm-panel-head">
            <div>
              <h2>Listings</h2>
              <p>Select a product or service to manage its gallery.</p>
            </div>
          </div>

          <div className="gm-tabs" role="tablist" aria-label="Gallery type">
            <button type="button" className={tab === "products" ? "active" : ""} onClick={() => setTab("products")}>Products</button>
            <button type="button" className={tab === "services" ? "active" : ""} onClick={() => setTab("services")}>Services</button>
          </div>

          <label className="gm-search">
            <span>Search listings</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, SKU, category, area..." />
          </label>

          <div className="gm-list-scroll">
            {loading ? <p className="gm-empty">Loading gallery items...</p> : null}
            {!loading && !currentList.length ? <p className="gm-empty">No {tab} found for your account.</p> : null}
            {currentList.map((item) => (
              <button
                key={`${item.type}-${item.id}`}
                type="button"
                className={`gm-list-item ${selected?.id === item.id ? "active" : ""}`}
                onClick={() => setSelected(item)}
              >
                <span className="gm-thumb">
                  {item.primaryImage ? <img src={item.primaryImage} alt="" /> : <span>No image</span>}
                </span>
                <span className="gm-list-copy">
                  <strong>{imageTitle(item)}</strong>
                  <small>{item.category} · {statusText(item.status)}</small>
                  <em>{item.imageCount} image{item.imageCount === 1 ? "" : "s"}</em>
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className="gm-workspace-panel">
          {!selected ? (
            <div className="gm-no-selection">
              <h2>Select a listing</h2>
              <p>Choose one product or service from the left side to start managing images.</p>
            </div>
          ) : (
            <>
              <div className="gm-selected-head">
                <div className="gm-selected-preview">
                  {selected.primaryImage ? <img src={selected.primaryImage} alt="" /> : <span>No primary image</span>}
                </div>
                <div>
                  <span className="gm-type-pill">{selected.type}</span>
                  <h2>{imageTitle(selected)}</h2>
                  <p>{selected.category} · {selected.owner}</p>
                  <div className="gm-meta-row">
                    <span>{statusText(selected.status)}</span>
                    <span>{selected.type === "service" ? money(selected.priceFrom) : money(selected.price)}</span>
                    {selected.type === "product" ? <span>{selected.stock ?? 0} stock</span> : null}
                  </div>
                </div>
              </div>

              <div className="gm-tools-grid">
                <form className="gm-add-card" onSubmit={addImage}>
                  <h3>Add image by URL</h3>
                  <label>
                    <span>Image URL</span>
                    <input value={form.url} onChange={(event) => setForm((data) => ({ ...data, url: event.target.value }))} placeholder="https://... or /uploads/listings/..." />
                  </label>
                  <label>
                    <span>Alt text</span>
                    <input value={form.alt} onChange={(event) => setForm((data) => ({ ...data, alt: event.target.value }))} placeholder="Short description for SEO/accessibility" />
                  </label>
                  <button className="gm-primary-btn" type="submit">Add to gallery</button>
                </form>

                <div className="gm-upload-card">
                  <h3>Upload from computer</h3>
                  <p>Uses your existing local upload endpoint now. Later S3 can replace the storage without changing this page.</p>
                  <label className="gm-upload-zone">
                    <input type="file" multiple accept="image/*" onChange={uploadImages} disabled={uploading} />
                    <span>{uploading ? "Uploading..." : "Choose images"}</span>
                    <small>Up to 8 images at a time</small>
                  </label>
                </div>
              </div>

              <div className="gm-gallery-board">
                <div className="gm-gallery-head">
                  <div>
                    <h3>Gallery images</h3>
                    <p>First image becomes the public card/detail primary image.</p>
                  </div>
                  <strong>{selected.images?.length || 0} image{selected.images?.length === 1 ? "" : "s"}</strong>
                </div>

                {!selected.images?.length ? (
                  <div className="gm-empty-gallery">
                    <h4>No images yet</h4>
                    <p>Add at least one clear photo so this listing looks professional in marketplace cards and detail pages.</p>
                  </div>
                ) : (
                  <div className="gm-image-grid">
                    {selected.images.map((image, index) => (
                      <article className="gm-image-card" key={image.id}>
                        <div className="gm-image-frame">
                          <img src={image.url} alt={image.alt || imageTitle(selected)} />
                          {index === 0 ? <span className="gm-primary-badge">Primary</span> : null}
                        </div>
                        <div className="gm-image-fields">
                          <label>
                            <span>Alt text</span>
                            <input defaultValue={image.alt || ""} onBlur={(event) => saveAlt(image, event.target.value)} placeholder="Describe this image" />
                          </label>
                          <code>{image.url}</code>
                        </div>
                        <div className="gm-image-actions">
                          <button type="button" onClick={() => moveImage(image, -1)} disabled={index === 0}>↑ Move</button>
                          <button type="button" onClick={() => moveImage(image, 1)} disabled={index === selected.images.length - 1}>↓ Move</button>
                          <button type="button" onClick={() => setPrimary(image)} disabled={index === 0}>Set primary</button>
                          <button type="button" className="danger" onClick={() => removeImage(image)}>Remove</button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </section>
    </main>
  );
}
