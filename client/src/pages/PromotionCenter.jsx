import { useEffect, useMemo, useState } from "react";
import {
  AdminEmptyState, AdminIcon, AdminInfoGrid, AdminMetricCard, AdminModal, AdminPageHeader, AdminPagination,
  AdminSearchToolbar, AdminStatusBadge, useAdminPagination,
} from "../components/AdminWorkspaceUi.jsx";
import api from "../utils/api.js";
import "../styles/pages/admin/AdminWorkspaceV2.css";
import "../styles/pages/admin/AdminOperations.css";

function money(value) { return Number(value || 0).toLocaleString("en-LK"); }
const initialCategory = { name: "", type: "product", icon: "◈", description: "", isFeatured: true, isActive: true, sortOrder: 0 };
const initialCoupon = { code: "", title: "", description: "", discountType: "percentage", discountValue: "", minimumAmount: "", maxDiscount: "", usageLimit: "", isActive: true };

export default function PromotionCenter() {
  const [categories, setCategories] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [categoryForm, setCategoryForm] = useState(initialCategory);
  const [couponForm, setCouponForm] = useState(initialCoupon);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState("categories");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  async function loadData() {
    try {
      setLoading(true);
      const [categoryResponse, couponResponse] = await Promise.all([api.get("/promotions/categories"), api.get("/promotions/coupons")]);
      setCategories(categoryResponse.data.data || []);
      setCoupons(couponResponse.data.data || []);
    } catch (error) { setMessage(error.response?.data?.message || "Could not load promotion center data."); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadData(); }, []);

  function updateCategoryField(event) { const { name, value, type: inputType, checked } = event.target; setCategoryForm((current) => ({ ...current, [name]: inputType === "checkbox" ? checked : value })); }
  function updateCouponField(event) { const { name, value, type: inputType, checked } = event.target; setCouponForm((current) => ({ ...current, [name]: inputType === "checkbox" ? checked : value })); }

  async function submitCategory(event) {
    event.preventDefault();
    try { setMessage(""); await api.post("/promotions/categories", categoryForm); setCategoryForm(initialCategory); setCreateOpen(false); setMessage("Category saved successfully."); await loadData(); }
    catch (error) { setMessage(error.response?.data?.message || "Category save failed."); }
  }
  async function submitCoupon(event) {
    event.preventDefault();
    try { setMessage(""); await api.post("/promotions/coupons", couponForm); setCouponForm(initialCoupon); setCreateOpen(false); setMessage("Coupon saved successfully."); await loadData(); }
    catch (error) { setMessage(error.response?.data?.message || "Coupon save failed."); }
  }
  async function toggleCategory(category, field) {
    try { await api.patch(`/promotions/categories/${category.id}`, { [field]: !category[field] }); await loadData(); setSelected((current) => current ? { ...current, [field]: !current[field] } : current); }
    catch (error) { setMessage(error.response?.data?.message || "Category update failed."); }
  }
  async function toggleCoupon(coupon) {
    try { await api.patch(`/promotions/coupons/${coupon.id}`, { isActive: !coupon.isActive }); await loadData(); setSelected((current) => current ? { ...current, isActive: !current.isActive } : current); }
    catch (error) { setMessage(error.response?.data?.message || "Coupon update failed."); }
  }

  const records = useMemo(() => {
    const query = search.trim().toLowerCase();
    const source = tab === "categories" ? categories : coupons;
    return source.filter((item) => {
      const matchesType = tab !== "categories" || type === "all" || item.type === type;
      const text = tab === "categories" ? `${item.name} ${item.type} ${item.description}` : `${item.code} ${item.title} ${item.description} ${item.discountType}`;
      return matchesType && (!query || text.toLowerCase().includes(query));
    });
  }, [categories, coupons, tab, search, type]);
  const pagination = useAdminPagination(records, 10, [tab, search, type]);
  const activeCoupons = coupons.filter((item) => item.isActive).length;
  const featuredCategories = categories.filter((item) => item.isFeatured && item.isActive).length;

  return (
    <section className="admin-workspace-v2 admin-operations-page-v2 admin-promotions-v2">
      <AdminPageHeader eyebrow="Growth & discovery" title="Promotion center" description="Manage marketplace categories, featured discovery, and checkout coupons without cluttering public pages or admin lists." actions={<button className="admin-primary-button-v2" type="button" onClick={() => setCreateOpen(true)}><AdminIcon name="spark" size={17} />Create {tab === "categories" ? "category" : "coupon"}</button>} />
      {message && <div className="admin-alert-v2">{message}</div>}
      <div className="admin-metrics-grid-v2 four">
        <AdminMetricCard icon="list" label="Categories" value={categories.length} note="Product and service groups" tone="blue" />
        <AdminMetricCard icon="star" label="Featured categories" value={featuredCategories} note="Visible in discovery areas" tone="violet" />
        <AdminMetricCard icon="money" label="Coupons" value={coupons.length} note="Checkout promotions" tone="cyan" />
        <AdminMetricCard icon="check" label="Active coupons" value={activeCoupons} note="Available to customers" tone="emerald" />
      </div>
      <article className="admin-panel-v2 admin-ops-panel-v2">
        <div className="admin-panel-head-v2 admin-ops-directory-head-v2"><div><span className="admin-ops-eyebrow-v2">Growth directory</span><h2>Categories and coupons</h2><p>Open any record for complete configuration and activation controls.</p></div><div className="admin-ops-tabs-v2">{[["categories","Categories"],["coupons","Coupons"]].map(([value,label]) => <button key={value} type="button" className={tab === value ? "active" : ""} onClick={() => { setTab(value); setSelected(null); }}>{label}</button>)}</div></div>
        <AdminSearchToolbar value={search} onChange={setSearch} placeholder={`Search ${tab}...`} filters={tab === "categories" ? <label className="admin-select-control-v2"><AdminIcon name="filter" size={17} /><select value={type} onChange={(event) => setType(event.target.value)}><option value="all">All category types</option><option value="product">Product categories</option><option value="service">Service categories</option></select></label> : null} />
        {loading ? <div className="admin-ops-loading-v2">Loading promotion center...</div> : !records.length ? <AdminEmptyState icon="spark" title={`No ${tab} found`} description="Create the first record or try another search." /> : <><div className="admin-ops-record-list-v2">{pagination.items.map((item) => <article className="admin-ops-record-v2" key={item.id} role="button" tabIndex="0" onClick={() => setSelected(item)} onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && setSelected(item)}><span className={`admin-ops-record-icon-v2 tone-${tab === "categories" ? "violet" : "cyan"}`}>{tab === "categories" ? item.icon || <AdminIcon name="list" /> : <AdminIcon name="money" />}</span><div className="admin-ops-record-main-v2"><strong>{tab === "categories" ? item.name : item.code}</strong><small>{tab === "categories" ? `${item.type} · ${item.description || "No description"}` : `${item.title} · ${item.discountType === "percentage" ? `${item.discountValue}%` : `Rs. ${money(item.discountValue)}`}`}</small></div><div className="admin-ops-record-value-v2">{tab === "categories" ? `${item.productCount || item.serviceCount || 0} listings` : `${item.usageCount || 0}${item.usageLimit ? ` / ${item.usageLimit}` : ""} uses`}</div><div className="admin-ops-status-stack-v2">{tab === "categories" && item.isFeatured && <AdminStatusBadge status="featured" />}<AdminStatusBadge status={item.isActive ? "active" : "inactive"} /></div><AdminIcon name="chevron" size={17} /></article>)}</div><AdminPagination pagination={pagination} /></>}
      </article>

      <AdminModal open={createOpen} onClose={() => setCreateOpen(false)} title={tab === "categories" ? "Create category" : "Create coupon"} eyebrow="Promotion setup" size="large">
        {tab === "categories" ? <form className="admin-form-v2" onSubmit={submitCategory}><div className="admin-form-grid-v2 two"><label>Name<input name="name" value={categoryForm.name} onChange={updateCategoryField} required placeholder="Used Electronics" /></label><label>Type<select name="type" value={categoryForm.type} onChange={updateCategoryField}><option value="product">Product</option><option value="service">Service</option></select></label><label>Icon<input name="icon" value={categoryForm.icon} onChange={updateCategoryField} maxLength="4" /></label><label>Sort order<input name="sortOrder" type="number" min="0" value={categoryForm.sortOrder} onChange={updateCategoryField} /></label></div><label>Description<textarea name="description" rows="4" value={categoryForm.description} onChange={updateCategoryField} /></label><div className="admin-check-grid-v2"><label><input type="checkbox" name="isFeatured" checked={categoryForm.isFeatured} onChange={updateCategoryField} />Featured discovery</label><label><input type="checkbox" name="isActive" checked={categoryForm.isActive} onChange={updateCategoryField} />Active</label></div><div className="admin-modal-actions-v2"><button className="admin-primary-button-v2" type="submit">Save category</button></div></form> : <form className="admin-form-v2" onSubmit={submitCoupon}><div className="admin-form-grid-v2 two"><label>Code<input name="code" value={couponForm.code} onChange={updateCouponField} required placeholder="WELCOME10" /></label><label>Title<input name="title" value={couponForm.title} onChange={updateCouponField} required placeholder="Welcome offer" /></label><label>Discount type<select name="discountType" value={couponForm.discountType} onChange={updateCouponField}><option value="percentage">Percentage</option><option value="fixed">Fixed amount</option></select></label><label>Discount value<input name="discountValue" type="number" min="1" value={couponForm.discountValue} onChange={updateCouponField} required /></label><label>Minimum amount<input name="minimumAmount" type="number" min="0" value={couponForm.minimumAmount} onChange={updateCouponField} /></label><label>Maximum discount<input name="maxDiscount" type="number" min="0" value={couponForm.maxDiscount} onChange={updateCouponField} /></label><label>Usage limit<input name="usageLimit" type="number" min="0" value={couponForm.usageLimit} onChange={updateCouponField} /></label></div><label>Description<textarea name="description" rows="4" value={couponForm.description} onChange={updateCouponField} /></label><div className="admin-check-grid-v2"><label><input type="checkbox" name="isActive" checked={couponForm.isActive} onChange={updateCouponField} />Active</label></div><div className="admin-modal-actions-v2"><button className="admin-primary-button-v2" type="submit">Save coupon</button></div></form>}
      </AdminModal>

      <AdminModal open={Boolean(selected)} onClose={() => setSelected(null)} title={tab === "categories" ? selected?.name : selected?.code} eyebrow={tab === "categories" ? "Category details" : "Coupon details"}>
        {selected && <><AdminInfoGrid items={tab === "categories" ? [{ label: "Type", value: selected.type }, { label: "Listings", value: selected.productCount || selected.serviceCount || 0 }, { label: "Featured", value: selected.isFeatured ? "Yes" : "No" }, { label: "Status", value: selected.isActive ? "Active" : "Inactive" }] : [{ label: "Offer", value: selected.discountType === "percentage" ? `${selected.discountValue}%` : `Rs. ${money(selected.discountValue)}` }, { label: "Minimum", value: selected.minimumAmount ? `Rs. ${money(selected.minimumAmount)}` : "No minimum" }, { label: "Usage", value: `${selected.usageCount || 0}${selected.usageLimit ? ` / ${selected.usageLimit}` : ""}` }, { label: "Status", value: selected.isActive ? "Active" : "Inactive" }]} />{selected.description && <div className="admin-note-v2"><strong>Description</strong><p>{selected.description}</p></div>}<div className="admin-modal-actions-v2">{tab === "categories" ? <><button className="admin-secondary-button-v2" type="button" onClick={() => toggleCategory(selected, "isFeatured")}>{selected.isFeatured ? "Remove featured" : "Make featured"}</button><button className={selected.isActive ? "admin-danger-button-v2" : "admin-success-button-v2"} type="button" onClick={() => toggleCategory(selected, "isActive")}>{selected.isActive ? "Disable category" : "Enable category"}</button></> : <button className={selected.isActive ? "admin-danger-button-v2" : "admin-success-button-v2"} type="button" onClick={() => toggleCoupon(selected)}>{selected.isActive ? "Deactivate coupon" : "Activate coupon"}</button>}</div></>}
      </AdminModal>
    </section>
  );
}
