import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import SectionHeader from "../components/SectionHeader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../utils/api.js";
import "../styles/pages/business/SellerBusinessWorkspace.css";

const steps = [
  "Create seller or service-provider account",
  "Submit product/service with photos and details",
  "Admin reviews and approves listing",
  "Customer orders or requests quotation",
  "Seller/provider completes order and receives payout",
];

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
  return (
    <>
      <div className="hero-actions seller-actions">
        <Link className="primary-btn" to="/register">Create seller/provider account</Link>
        <Link className="secondary-btn" to="/login">Already registered? Login</Link>
      </div>
      <div className="seller-layout">
        <div className="seller-panel">
          <h3>Seller Types</h3>
          <ul>
            <li>Own business products</li>
            <li>Client product sellers</li>
            <li>Local shop sellers</li>
            <li>Used product sellers</li>
            <li>Service providers</li>
            <li>Delivery partners</li>
          </ul>
        </div>
        <div className="seller-panel accent-panel">
          <h3>How it works</h3>
          {steps.map((step, index) => (
            <p key={step}><strong>{index + 1}</strong> {step}</p>
          ))}
        </div>
      </div>
    </>
  );
}

function Field({ label, children }) {
  return <label>{label}{children}</label>;
}

function FilePreview({ files }) {
  const previewItems = useMemo(
    () =>
      Array.from(files || []).map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
      })),
    [files]
  );

  if (!previewItems.length) return null;

  return (
    <div className="upload-preview-grid">
      {previewItems.map((item) => (
        <figure key={`${item.name}-${item.url}`} className="upload-preview-card">
          <img src={item.url} alt={item.name} />
          <figcaption>{item.name}</figcaption>
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

export default function SellerHub() {
  const { user, isAuthenticated } = useAuth();
  const [productForm, setProductForm] = useState(emptyProduct);
  const [serviceForm, setServiceForm] = useState(emptyService);
  const [productFiles, setProductFiles] = useState([]);
  const [serviceFiles, setServiceFiles] = useState([]);
  const [productStatus, setProductStatus] = useState("");
  const [serviceStatus, setServiceStatus] = useState("");

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
    setProductStatus("Uploading images and submitting product...");
    try {
      const uploadedUrls = await uploadListingImages(productFiles);
      const manualImageUrl = productForm.imageUrl?.trim();
      const payload = {
        ...productForm,
        images: [...uploadedUrls, manualImageUrl].filter(Boolean),
      };

      const { data } = await api.post("/products", payload);
      setProductForm(emptyProduct);
      setProductFiles([]);
      event.target.reset();
      setProductStatus(data.message || "Product submitted for admin approval.");
    } catch (error) {
      setProductStatus(error.response?.data?.message || "Failed to submit product.");
    }
  }

  async function submitService(event) {
    event.preventDefault();
    setServiceStatus("Uploading images and submitting service...");
    try {
      const uploadedUrls = await uploadListingImages(serviceFiles);
      const manualImageUrl = serviceForm.imageUrl?.trim();
      const payload = {
        ...serviceForm,
        images: [...uploadedUrls, manualImageUrl].filter(Boolean),
      };

      const { data } = await api.post("/services", payload);
      setServiceForm(emptyService);
      setServiceFiles([]);
      event.target.reset();
      setServiceStatus(data.message || "Service submitted for admin approval.");
    } catch (error) {
      setServiceStatus(error.response?.data?.message || "Failed to submit service.");
    }
  }

  const canSubmitProducts = ["seller", "shop", "admin", "super_admin"].includes(user?.role);
  const canSubmitServices = ["service_provider", "admin", "super_admin"].includes(user?.role);

  return (
    <section className="page section seller-hub-page seller-business-polish">
      <SectionHeader
        eyebrow="Seller Hub"
        title="Upload products and services with real photos"
        description="Seller submissions are saved to PostgreSQL as pending listings. Uploaded photos are stored locally for development and can later be moved to AWS S3."
      />

      {!isAuthenticated ? <SellerIntro /> : (
        <>
          <div className="seller-command-hero">
            <div className="seller-command-copy">
              <span className="seller-command-eyebrow">Business workspace</span>
              <h2>Welcome, {user.name}</h2>
              <p>Your role is <strong>{user.role}</strong>. Use this page to submit new products/services, then manage them from the business tools below.</p>
              {user.status !== "active" && <p className="soft-note">Your seller/provider account is still waiting for admin approval, but you can test submissions in development.</p>}
            </div>
            <div className="seller-command-grid">
              <Link className="seller-command-card" to="/business"><strong>Business Dashboard</strong><span>Edit listings and view orders</span></Link>
              <Link className="seller-command-card" to="/gallery-management"><strong>Gallery Manager</strong><span>Manage product/service images</span></Link>
              <Link className="seller-command-card" to="/inventory"><strong>Inventory Center</strong><span>Stock, low-stock and movements</span></Link>
              <Link className="seller-command-card" to="/earnings"><strong>Earnings</strong><span>Payouts and commission ledger</span></Link>
            </div>
          </div>

          <div className="seller-submit-grid">
            <form className="smart-form management-form seller-submit-card" onSubmit={submitProduct}>
              <h3>Add Product / Used Item</h3>
              {!canSubmitProducts && <p className="soft-note">Register as a seller/shop or login as admin to submit products.</p>}
              <Field label="Product Name"><input name="name" value={productForm.name} onChange={updateProduct} required disabled={!canSubmitProducts} /></Field>
              <div className="form-row">
                <Field label="Type">
                  <select name="type" value={productForm.type} onChange={updateProduct} disabled={!canSubmitProducts}>
                    <option value="seller_product">Client / Seller Product</option>
                    <option value="shop_product">Shop Product</option>
                    <option value="used_product">Used Product</option>
                    <option value="own_product">SmartSell Own Product</option>
                  </select>
                </Field>
                <Field label="Condition">
                  <select name="condition" value={productForm.condition} onChange={updateProduct} disabled={!canSubmitProducts}>
                    <option value="new">New</option>
                    <option value="like_new">Like New</option>
                    <option value="good">Good</option>
                    <option value="used">Used</option>
                    <option value="needs_repair">Needs Repair</option>
                  </select>
                </Field>
              </div>
              <div className="form-row">
                <Field label="Category"><input name="category" value={productForm.category} onChange={updateProduct} placeholder="Electronics, gifts, bikes..." disabled={!canSubmitProducts} /></Field>
                <Field label="Price"><input name="price" type="number" min="0" value={productForm.price} onChange={updateProduct} required disabled={!canSubmitProducts} /></Field>
              </div>
              <div className="form-row">
                <Field label="Stock"><input name="stock" type="number" min="1" value={productForm.stock} onChange={updateProduct} disabled={!canSubmitProducts} /></Field>
                <Field label="Location"><input name="location" value={productForm.location} onChange={updateProduct} placeholder="Kalmunai, Colombo..." disabled={!canSubmitProducts} /></Field>
              </div>

              <Field label="Upload Product Photos">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={!canSubmitProducts}
                  onChange={(event) => setProductFiles(event.target.files)}
                />
              </Field>
              <FilePreview files={productFiles} />
              <Field label="Optional Image URL"><input name="imageUrl" value={productForm.imageUrl} onChange={updateProduct} placeholder="Paste external image URL only if needed" disabled={!canSubmitProducts} /></Field>

              <Field label="Description"><textarea name="description" rows="5" value={productForm.description} onChange={updateProduct} disabled={!canSubmitProducts} /></Field>
              <button className="primary-btn" type="submit" disabled={!canSubmitProducts}>Submit Product</button>
              {productStatus && <p className="form-status">{productStatus}</p>}
            </form>

            <form className="smart-form management-form seller-submit-card" onSubmit={submitService}>
              <h3>Add Service</h3>
              {!canSubmitServices && <p className="soft-note">Register as a service provider or login as admin to submit services.</p>}
              <Field label="Service Title"><input name="title" value={serviceForm.title} onChange={updateService} required disabled={!canSubmitServices} /></Field>
              <div className="form-row">
                <Field label="Category"><input name="category" value={serviceForm.category} onChange={updateService} placeholder="Cake, editing, delivery..." disabled={!canSubmitServices} /></Field>
                <Field label="Price From"><input name="priceFrom" type="number" min="0" value={serviceForm.priceFrom} onChange={updateService} disabled={!canSubmitServices} /></Field>
              </div>
              <Field label="Provider Type"><input name="providerType" value={serviceForm.providerType} onChange={updateService} placeholder="Cake maker, editor, web developer..." disabled={!canSubmitServices} /></Field>

              <Field label="Upload Service Photos">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={!canSubmitServices}
                  onChange={(event) => setServiceFiles(event.target.files)}
                />
              </Field>
              <FilePreview files={serviceFiles} />
              <Field label="Optional Image URL"><input name="imageUrl" value={serviceForm.imageUrl} onChange={updateService} placeholder="Paste external image URL only if needed" disabled={!canSubmitServices} /></Field>

              <Field label="Description"><textarea name="description" rows="7" value={serviceForm.description} onChange={updateService} disabled={!canSubmitServices} /></Field>
              <button className="primary-btn" type="submit" disabled={!canSubmitServices}>Submit Service</button>
              {serviceStatus && <p className="form-status">{serviceStatus}</p>}
            </form>
          </div>
        </>
      )}
    </section>
  );
}
