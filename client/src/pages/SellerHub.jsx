import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BusinessIcon,
  BusinessPageHeader,
  BusinessStatusBadge,
} from "../components/BusinessWorkspaceUi.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../utils/api.js";
import "../styles/pages/business/BusinessWorkspace.css";

const emptyProduct = {
  name: "",
  type: "seller_product",
  category: "",
  price: "",
  condition: "new",
  stock: "1",
  location: "",
  imageUrl: "",
  description: "",
};

const emptyService = {
  title: "",
  category: "",
  priceFrom: "",
  providerType: "",
  imageUrl: "",
  description: "",
};

function SellerIntro() {
  const steps = [
    ["Create your business account", "Register as a seller, shop or service provider."],
    ["Publish a complete listing", "Add clear photos, pricing, location and an accurate description."],
    ["Pass marketplace review", "SmartSell checks the listing before it becomes visible to customers."],
    ["Receive customer activity", "Manage orders, quotations and requests from your business workspace."],
  ];

  return (
    <div className="seller-intro-v2">
      <section className="seller-intro-main-v2">
        <span className="business-page-eyebrow"><BusinessIcon name="spark" size={15} />Start selling professionally</span>
        <h2>Build a trusted local storefront on SmartSell</h2>
        <p>Publish products, used items or professional services and manage customer activity from one workspace.</p>
        <div className="seller-intro-actions-v2">
          <Link className="business-primary-button-v2" to="/register">Create business account</Link>
          <Link className="business-ghost-button-v2" to="/login">Log in</Link>
        </div>
        <div className="seller-intro-types-v2">
          <span><BusinessIcon name="store" size={17} />Local shops</span>
          <span><BusinessIcon name="box" size={17} />Product sellers</span>
          <span><BusinessIcon name="service" size={17} />Service providers</span>
          <span><BusinessIcon name="inventory" size={17} />Used items</span>
        </div>
      </section>
      <section className="seller-intro-steps-v2">
        <div><span>How it works</span><strong>From listing to customer</strong></div>
        {steps.map(([title, description], index) => (
          <article key={title}>
            <b>{String(index + 1).padStart(2, "0")}</b>
            <div><h3>{title}</h3><p>{description}</p></div>
          </article>
        ))}
      </section>
    </div>
  );
}

function Field({ label, hint, children, full = false }) {
  return (
    <label className={`business-field-v2 ${full ? "field-full" : ""}`}>
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

function FilePreview({ files }) {
  const previewItems = useMemo(
    () => Array.from(files || []).map((file) => ({ name: file.name, url: URL.createObjectURL(file) })),
    [files]
  );

  useEffect(() => () => previewItems.forEach((item) => URL.revokeObjectURL(item.url)), [previewItems]);

  if (!previewItems.length) {
    return <div className="listing-upload-empty-v2"><BusinessIcon name="image" size={22} /><span>Selected images will appear here</span></div>;
  }

  return (
    <div className="listing-upload-preview-v2">
      {previewItems.map((item, index) => (
        <figure key={`${item.name}-${item.url}`}>
          <img src={item.url} alt={item.name} />
          <figcaption><strong>{index === 0 ? "Cover" : `Image ${index + 1}`}</strong><span>{item.name}</span></figcaption>
        </figure>
      ))}
    </div>
  );
}

async function uploadListingImages(files) {
  const selectedFiles = Array.from(files || []);
  if (!selectedFiles.length) return [];

  const formData = new FormData();
  selectedFiles.forEach((file) => formData.append("images", file));

  const { data } = await api.post("/upload/listing-images", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return (data.data || []).map((item) => item.url).filter(Boolean);
}

function ListingGuide({ activeType }) {
  const product = activeType === "product";
  return (
    <aside className="listing-guide-v2">
      <div className="listing-guide-head-v2">
        <span><BusinessIcon name={product ? "box" : "service"} /></span>
        <div><small>Publishing guide</small><h3>{product ? "A stronger product listing" : "A stronger service listing"}</h3></div>
      </div>
      <ul>
        <li><BusinessIcon name="check" size={17} /><span>Use a clear title customers can search.</span></li>
        <li><BusinessIcon name="check" size={17} /><span>Add several real, well-lit photos.</span></li>
        <li><BusinessIcon name="check" size={17} /><span>Set honest pricing and availability.</span></li>
        <li><BusinessIcon name="check" size={17} /><span>Describe exactly what customers receive.</span></li>
      </ul>
      <div className="listing-review-note-v2">
        <strong>Marketplace review</strong>
        <p>New and edited listings remain pending until an administrator approves them.</p>
      </div>
      <nav className="listing-guide-links-v2">
        <Link to="/business"><BusinessIcon name="briefcase" size={17} /><span>Business dashboard</span><BusinessIcon name="arrow" size={16} /></Link>
        <Link to="/gallery-management"><BusinessIcon name="image" size={17} /><span>Gallery manager</span><BusinessIcon name="arrow" size={16} /></Link>
        <Link to="/inventory"><BusinessIcon name="inventory" size={17} /><span>Inventory centre</span><BusinessIcon name="arrow" size={16} /></Link>
      </nav>
    </aside>
  );
}

export default function SellerHub() {
  const { user, isAuthenticated } = useAuth();
  const [productForm, setProductForm] = useState(emptyProduct);
  const [serviceForm, setServiceForm] = useState(emptyService);
  const [productFiles, setProductFiles] = useState([]);
  const [serviceFiles, setServiceFiles] = useState([]);
  const [productStatus, setProductStatus] = useState("");
  const [serviceStatus, setServiceStatus] = useState("");
  const [productSubmitting, setProductSubmitting] = useState(false);
  const [serviceSubmitting, setServiceSubmitting] = useState(false);
  const canSubmitProducts = ["seller", "shop", "admin", "super_admin"].includes(user?.role);
  const canSubmitServices = ["service_provider", "admin", "super_admin"].includes(user?.role);
  const [activeType, setActiveType] = useState(() => user?.role === "service_provider" ? "service" : "product");

  useEffect(() => {
    if (canSubmitServices && !canSubmitProducts) setActiveType("service");
    if (canSubmitProducts && !canSubmitServices) setActiveType("product");
  }, [canSubmitProducts, canSubmitServices]);

  function updateProduct(event) {
    const { name, value } = event.target;
    setProductForm((current) => ({ ...current, [name]: value }));
  }

  function updateService(event) {
    const { name, value } = event.target;
    setServiceForm((current) => ({ ...current, [name]: value }));
  }

  async function submitProduct(event) {
    event.preventDefault();
    if (productSubmitting) return;
    setProductSubmitting(true);
    setProductStatus("Uploading images and submitting product...");
    try {
      const uploadedUrls = await uploadListingImages(productFiles);
      const manualImageUrl = productForm.imageUrl?.trim();
      const payload = { ...productForm, images: [...uploadedUrls, manualImageUrl].filter(Boolean) };
      const { data } = await api.post("/products", payload);
      setProductForm(emptyProduct);
      setProductFiles([]);
      event.currentTarget.reset();
      setProductStatus(data.message || "Product submitted for admin approval.");
    } catch (error) {
      setProductStatus(error.smartSellMessage || error.response?.data?.message || "Failed to submit product.");
    } finally {
      setProductSubmitting(false);
    }
  }

  async function submitService(event) {
    event.preventDefault();
    if (serviceSubmitting) return;
    setServiceSubmitting(true);
    setServiceStatus("Uploading images and submitting service...");
    try {
      const uploadedUrls = await uploadListingImages(serviceFiles);
      const manualImageUrl = serviceForm.imageUrl?.trim();
      const payload = { ...serviceForm, images: [...uploadedUrls, manualImageUrl].filter(Boolean) };
      const { data } = await api.post("/services", payload);
      setServiceForm(emptyService);
      setServiceFiles([]);
      event.currentTarget.reset();
      setServiceStatus(data.message || "Service submitted for admin approval.");
    } catch (error) {
      setServiceStatus(error.smartSellMessage || error.response?.data?.message || "Failed to submit service.");
    } finally {
      setServiceSubmitting(false);
    }
  }

  return (
    <section className="business-workspace-v2 seller-hub-v2">
      <BusinessPageHeader
        eyebrow="Create listing"
        title="Publish something customers can trust"
        description="Create a complete product or service listing with accurate details and real photos."
        meta={isAuthenticated ? <><span><BusinessIcon name="user" size={15} />{user?.businessName || user?.name}</span><BusinessStatusBadge status={user?.status || "active"} /></> : null}
        actions={isAuthenticated ? <Link className="business-ghost-button-v2" to="/business"><BusinessIcon name="briefcase" size={17} />Back to business</Link> : null}
      />

      {!isAuthenticated ? <SellerIntro /> : (
        <>
          <section className="listing-type-selector-v2">
            <div>
              <span>Choose listing type</span>
              <p>Only the listing types allowed for your account are enabled.</p>
            </div>
            <div className="listing-type-tabs-v2" role="tablist" aria-label="Listing type">
              <button type="button" role="tab" aria-selected={activeType === "product"} className={activeType === "product" ? "active" : ""} onClick={() => setActiveType("product")} disabled={!canSubmitProducts}>
                <span><BusinessIcon name="box" /></span><div><strong>Product or used item</strong><small>Physical products, shop stock and pre-owned items</small></div>
              </button>
              <button type="button" role="tab" aria-selected={activeType === "service"} className={activeType === "service" ? "active" : ""} onClick={() => setActiveType("service")} disabled={!canSubmitServices}>
                <span><BusinessIcon name="service" /></span><div><strong>Professional service</strong><small>Food, events, delivery, editing and digital work</small></div>
              </button>
            </div>
          </section>

          <div className="listing-creator-layout-v2">
            <main className="listing-form-panel-v2">
              {activeType === "product" ? (
                <form className="listing-form-v2" onSubmit={submitProduct}>
                  <div className="listing-form-title-v2"><span><BusinessIcon name="box" /></span><div><small>Product listing</small><h2>Product information</h2><p>Give customers enough detail to confidently open and order this listing.</p></div></div>
                  {!canSubmitProducts && <div className="business-error-v2"><strong>Product publishing is unavailable</strong><p>Use a seller or shop account to publish products.</p></div>}

                  <section className="listing-form-section-v2">
                    <div className="listing-section-heading-v2"><b>01</b><div><h3>Basic details</h3><p>Name, category and product type.</p></div></div>
                    <div className="business-form-grid-v2 two-columns">
                      <Field label="Product name" full><input name="name" value={productForm.name} onChange={updateProduct} placeholder="Example: Samsung Galaxy A55" required disabled={!canSubmitProducts} /></Field>
                      <Field label="Product type"><select name="type" value={productForm.type} onChange={updateProduct} disabled={!canSubmitProducts}><option value="seller_product">Seller product</option><option value="shop_product">Shop product</option><option value="used_product">Used product</option><option value="own_product">SmartSell own product</option></select></Field>
                      <Field label="Category"><input name="category" value={productForm.category} onChange={updateProduct} placeholder="Electronics, gifts, bikes..." disabled={!canSubmitProducts} /></Field>
                    </div>
                  </section>

                  <section className="listing-form-section-v2">
                    <div className="listing-section-heading-v2"><b>02</b><div><h3>Price and availability</h3><p>Set the selling price, condition and available stock.</p></div></div>
                    <div className="business-form-grid-v2 three-columns">
                      <Field label="Price (LKR)"><input name="price" type="number" min="0" value={productForm.price} onChange={updateProduct} placeholder="0" required disabled={!canSubmitProducts} /></Field>
                      <Field label="Condition"><select name="condition" value={productForm.condition} onChange={updateProduct} disabled={!canSubmitProducts}><option value="new">New</option><option value="like_new">Like New</option><option value="good">Good</option><option value="used">Used</option><option value="needs_repair">Needs Repair</option></select></Field>
                      <Field label="Stock"><input name="stock" type="number" min="1" value={productForm.stock} onChange={updateProduct} disabled={!canSubmitProducts} /></Field>
                      <Field label="Location" full><input name="location" value={productForm.location} onChange={updateProduct} placeholder="Kalmunai, Colombo, Kandy..." disabled={!canSubmitProducts} /></Field>
                    </div>
                  </section>

                  <section className="listing-form-section-v2">
                    <div className="listing-section-heading-v2"><b>03</b><div><h3>Photos</h3><p>The first image becomes the main listing cover.</p></div></div>
                    <Field label="Upload product photos" hint="JPG, PNG or WebP. Use several clear angles."><input className="listing-file-input-v2" type="file" accept="image/*" multiple disabled={!canSubmitProducts} onChange={(event) => setProductFiles(event.target.files)} /></Field>
                    <FilePreview files={productFiles} />
                    <Field label="Optional external image URL" hint="Use only when you cannot upload the image directly."><input name="imageUrl" value={productForm.imageUrl} onChange={updateProduct} placeholder="https://..." disabled={!canSubmitProducts} /></Field>
                  </section>

                  <section className="listing-form-section-v2">
                    <div className="listing-section-heading-v2"><b>04</b><div><h3>Description</h3><p>Explain important specifications, condition and what is included.</p></div></div>
                    <Field label="Product description"><textarea name="description" rows="7" value={productForm.description} onChange={updateProduct} placeholder="Describe the product clearly..." disabled={!canSubmitProducts} /></Field>
                  </section>

                  {productStatus && <p className="business-form-message-v2">{productStatus}</p>}
                  <div className="listing-submit-row-v2"><span><BusinessIcon name="check" size={17} />Your listing will be sent for approval.</span><button className="business-primary-button-v2" type="submit" disabled={!canSubmitProducts || productSubmitting}><BusinessIcon name="add" size={17} />{productSubmitting ? "Submitting..." : "Submit product"}</button></div>
                </form>
              ) : (
                <form className="listing-form-v2" onSubmit={submitService}>
                  <div className="listing-form-title-v2"><span><BusinessIcon name="service" /></span><div><small>Service listing</small><h2>Service information</h2><p>Explain your service, starting price and professional speciality.</p></div></div>
                  {!canSubmitServices && <div className="business-error-v2"><strong>Service publishing is unavailable</strong><p>Use a service-provider account to publish services.</p></div>}

                  <section className="listing-form-section-v2">
                    <div className="listing-section-heading-v2"><b>01</b><div><h3>Basic details</h3><p>Use a clear service title and suitable category.</p></div></div>
                    <div className="business-form-grid-v2 two-columns">
                      <Field label="Service title" full><input name="title" value={serviceForm.title} onChange={updateService} placeholder="Example: Custom birthday cake design" required disabled={!canSubmitServices} /></Field>
                      <Field label="Category"><input name="category" value={serviceForm.category} onChange={updateService} placeholder="Food, events, editing..." disabled={!canSubmitServices} /></Field>
                      <Field label="Provider type"><input name="providerType" value={serviceForm.providerType} onChange={updateService} placeholder="Cake maker, editor, developer..." disabled={!canSubmitServices} /></Field>
                    </div>
                  </section>

                  <section className="listing-form-section-v2">
                    <div className="listing-section-heading-v2"><b>02</b><div><h3>Starting price</h3><p>Customers understand that the final quotation may depend on requirements.</p></div></div>
                    <div className="business-form-grid-v2 two-columns">
                      <Field label="Price from (LKR)"><input name="priceFrom" type="number" min="0" value={serviceForm.priceFrom} onChange={updateService} placeholder="0" disabled={!canSubmitServices} /></Field>
                    </div>
                  </section>

                  <section className="listing-form-section-v2">
                    <div className="listing-section-heading-v2"><b>03</b><div><h3>Portfolio photos</h3><p>Show previous work, examples or your service setup.</p></div></div>
                    <Field label="Upload service photos" hint="JPG, PNG or WebP. The first image becomes the cover."><input className="listing-file-input-v2" type="file" accept="image/*" multiple disabled={!canSubmitServices} onChange={(event) => setServiceFiles(event.target.files)} /></Field>
                    <FilePreview files={serviceFiles} />
                    <Field label="Optional external image URL"><input name="imageUrl" value={serviceForm.imageUrl} onChange={updateService} placeholder="https://..." disabled={!canSubmitServices} /></Field>
                  </section>

                  <section className="listing-form-section-v2">
                    <div className="listing-section-heading-v2"><b>04</b><div><h3>Service description</h3><p>Explain the scope, process, delivery time and what customers should provide.</p></div></div>
                    <Field label="Description"><textarea name="description" rows="8" value={serviceForm.description} onChange={updateService} placeholder="Describe your service clearly..." disabled={!canSubmitServices} /></Field>
                  </section>

                  {serviceStatus && <p className="business-form-message-v2">{serviceStatus}</p>}
                  <div className="listing-submit-row-v2"><span><BusinessIcon name="check" size={17} />Your listing will be sent for approval.</span><button className="business-primary-button-v2" type="submit" disabled={!canSubmitServices || serviceSubmitting}><BusinessIcon name="add" size={17} />{serviceSubmitting ? "Submitting..." : "Submit service"}</button></div>
                </form>
              )}
            </main>
            <ListingGuide activeType={activeType} />
          </div>
        </>
      )}
    </section>
  );
}
