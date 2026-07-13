import { useEffect, useMemo, useState } from "react";
import SectionHeader from "../components/SectionHeader.jsx";
import api from "../utils/api.js";
import "../styles/pages/admin/AdminWorkspace.css";
import "../styles/pages/admin/PromotionCenter.css";

function money(value) {
  return Number(value || 0).toLocaleString("en-LK");
}

function boolText(value) {
  return value ? "Active" : "Inactive";
}

const initialCategory = {
  name: "",
  type: "product",
  icon: "◈",
  description: "",
  isFeatured: true,
  isActive: true,
  sortOrder: 0,
};

const initialCoupon = {
  code: "",
  title: "",
  description: "",
  discountType: "percentage",
  discountValue: "",
  minimumAmount: "",
  maxDiscount: "",
  usageLimit: "",
  isActive: true,
};

export default function PromotionCenter() {
  const [categories, setCategories] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [categoryForm, setCategoryForm] = useState(initialCategory);
  const [couponForm, setCouponForm] = useState(initialCoupon);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      const [categoryResponse, couponResponse] = await Promise.all([
        api.get("/promotions/categories"),
        api.get("/promotions/coupons"),
      ]);
      setCategories(categoryResponse.data.data || []);
      setCoupons(couponResponse.data.data || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not load promotion center data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const productCategories = useMemo(() => categories.filter((item) => item.type === "product"), [categories]);
  const serviceCategories = useMemo(() => categories.filter((item) => item.type === "service"), [categories]);

  function updateCategoryField(event) {
    const { name, value, type, checked } = event.target;
    setCategoryForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function updateCouponField(event) {
    const { name, value, type, checked } = event.target;
    setCouponForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  async function submitCategory(event) {
    event.preventDefault();
    try {
      setMessage("Saving category...");
      await api.post("/promotions/categories", categoryForm);
      setCategoryForm(initialCategory);
      setMessage("Category saved.");
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Category save failed.");
    }
  }

  async function submitCoupon(event) {
    event.preventDefault();
    try {
      setMessage("Saving coupon...");
      await api.post("/promotions/coupons", couponForm);
      setCouponForm(initialCoupon);
      setMessage("Coupon saved.");
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Coupon save failed.");
    }
  }

  async function toggleCategory(category, field) {
    try {
      await api.patch(`/promotions/categories/${category.id}`, { [field]: !category[field] });
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Category update failed.");
    }
  }

  async function toggleCoupon(coupon) {
    try {
      await api.patch(`/promotions/coupons/${coupon.id}`, { isActive: !coupon.isActive });
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Coupon update failed.");
    }
  }

  return (
    <section className="page section promotion-center-page">
      <SectionHeader
        eyebrow="Growth Center"
        title="Categories, featured discovery, and SmartSell coupons"
        description="Control marketplace category icons and create coupon offers for customer checkout. Featured categories appear in the search filters."
      />

      {loading && <p className="form-status">Loading promotion center...</p>}
      {message && <div className="success-alert spaced-alert">{message}</div>}

      <div className="growth-grid">
        <form className="smart-form growth-form" onSubmit={submitCategory}>
          <div className="form-title-line">
            <span className="feature-icon">▦</span>
            <div>
              <h3>Add / Update Category</h3>
              <p>Use clear categories for product and service discovery.</p>
            </div>
          </div>
          <label>Name<input name="name" value={categoryForm.name} onChange={updateCategoryField} required placeholder="Example: Used Electronics" /></label>
          <div className="form-two">
            <label>Type
              <select name="type" value={categoryForm.type} onChange={updateCategoryField}>
                <option value="product">Product</option>
                <option value="service">Service</option>
              </select>
            </label>
            <label>Icon<input name="icon" value={categoryForm.icon} onChange={updateCategoryField} maxLength="4" /></label>
          </div>
          <label>Description<textarea name="description" rows="3" value={categoryForm.description} onChange={updateCategoryField} placeholder="Short description for admin clarity" /></label>
          <div className="checkbox-row">
            <label><input type="checkbox" name="isFeatured" checked={categoryForm.isFeatured} onChange={updateCategoryField} /> Featured</label>
            <label><input type="checkbox" name="isActive" checked={categoryForm.isActive} onChange={updateCategoryField} /> Active</label>
          </div>
          <button className="primary-btn" type="submit">Save Category</button>
        </form>

        <form className="smart-form growth-form" onSubmit={submitCoupon}>
          <div className="form-title-line">
            <span className="feature-icon">%</span>
            <div>
              <h3>Create Coupon</h3>
              <p>Example demo coupon: WELCOME10.</p>
            </div>
          </div>
          <div className="form-two">
            <label>Code<input name="code" value={couponForm.code} onChange={updateCouponField} required placeholder="WELCOME10" /></label>
            <label>Title<input name="title" value={couponForm.title} onChange={updateCouponField} required placeholder="Welcome Offer" /></label>
          </div>
          <div className="form-two">
            <label>Discount Type
              <select name="discountType" value={couponForm.discountType} onChange={updateCouponField}>
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </label>
            <label>Discount Value<input name="discountValue" type="number" min="1" value={couponForm.discountValue} onChange={updateCouponField} required /></label>
          </div>
          <div className="form-two">
            <label>Minimum Amount<input name="minimumAmount" type="number" min="0" value={couponForm.minimumAmount} onChange={updateCouponField} placeholder="1000" /></label>
            <label>Max Discount<input name="maxDiscount" type="number" min="0" value={couponForm.maxDiscount} onChange={updateCouponField} placeholder="1500" /></label>
          </div>
          <label>Description<textarea name="description" rows="3" value={couponForm.description} onChange={updateCouponField} placeholder="Offer note shown to admin" /></label>
          <div className="checkbox-row">
            <label><input type="checkbox" name="isActive" checked={couponForm.isActive} onChange={updateCouponField} /> Active</label>
          </div>
          <button className="primary-btn" type="submit">Save Coupon</button>
        </form>
      </div>

      <div className="growth-list-grid">
        <article className="business-panel">
          <div className="business-list-head">
            <div><h3>Product Categories</h3><p>{productCategories.length} product groups</p></div>
          </div>
          <div className="category-admin-list">
            {productCategories.map((category) => (
              <div className="category-admin-item" key={category.id}>
                <span>{category.icon}</span>
                <div><strong>{category.name}</strong><small>{category.productCount} products • {boolText(category.isActive)}</small></div>
                <button type="button" className="secondary-btn small-btn" onClick={() => toggleCategory(category, "isFeatured")}>{category.isFeatured ? "Unfeature" : "Feature"}</button>
                <button type="button" className="ghost-btn small-btn" onClick={() => toggleCategory(category, "isActive")}>{category.isActive ? "Disable" : "Enable"}</button>
              </div>
            ))}
          </div>
        </article>

        <article className="business-panel">
          <div className="business-list-head">
            <div><h3>Service Categories</h3><p>{serviceCategories.length} service groups</p></div>
          </div>
          <div className="category-admin-list">
            {serviceCategories.map((category) => (
              <div className="category-admin-item" key={category.id}>
                <span>{category.icon}</span>
                <div><strong>{category.name}</strong><small>{category.serviceCount} services • {boolText(category.isActive)}</small></div>
                <button type="button" className="secondary-btn small-btn" onClick={() => toggleCategory(category, "isFeatured")}>{category.isFeatured ? "Unfeature" : "Feature"}</button>
                <button type="button" className="ghost-btn small-btn" onClick={() => toggleCategory(category, "isActive")}>{category.isActive ? "Disable" : "Enable"}</button>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article className="business-panel coupon-table-panel">
        <div className="business-list-head">
          <div><h3>Coupons</h3><p>Checkout offers and discounts</p></div>
        </div>
        <div className="responsive-table-wrap">
          <table>
            <thead><tr><th>Code</th><th>Offer</th><th>Minimum</th><th>Usage</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td><strong>{coupon.code}</strong></td>
                  <td>{coupon.discountType === "percentage" ? `${coupon.discountValue}%` : `Rs. ${money(coupon.discountValue)}`}</td>
                  <td>{coupon.minimumAmount ? `Rs. ${money(coupon.minimumAmount)}` : "No minimum"}</td>
                  <td>{coupon.usageCount}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}</td>
                  <td><span className={`status-pill ${coupon.isActive ? "status-approved" : "status-rejected"}`}>{boolText(coupon.isActive)}</span></td>
                  <td><button className="secondary-btn small-btn" type="button" onClick={() => toggleCoupon(coupon)}>{coupon.isActive ? "Deactivate" : "Activate"}</button></td>
                </tr>
              ))}
              {!coupons.length && <tr><td colSpan="6">No coupons yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
