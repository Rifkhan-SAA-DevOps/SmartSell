import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ContextMessageButton from "../components/ContextMessageButton.jsx";
import SmartPagination from "../components/SmartPagination.jsx";
import {
  AccountDetailGrid,
  AccountEmpty,
  AccountIcon,
  AccountModal,
  AccountPageHeader,
  AccountSearch,
  AccountStatGrid,
  AccountStatus,
  AccountToolbar,
} from "../components/CustomerAccountUi.jsx";
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
import { useAuth } from "../context/AuthContext.jsx";
import useSmartPagination from "../hooks/useSmartPagination.js";
import api from "../utils/api.js";
import "../styles/pages/business/BusinessWorkspace.css";
import "../styles/pages/business/BusinessManagement.css";

function readable(value) { return String(value || "pending").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function formatDate(value) { if (!value) return "Not available"; const date = new Date(value); return Number.isNaN(date.getTime()) ? "Not available" : date.toLocaleDateString("en-LK", { year: "numeric", month: "short", day: "numeric" }); }
function reviewTitle(review) { return review.product?.name || review.service?.title || "SmartSell review"; }

function CustomerReviewsView() {
  const [reviews, setReviews] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  useEffect(() => { let cancelled = false; async function load() { try { const { data } = await api.get("/reviews/mine"); if (!cancelled) setReviews(data.data || []); } catch (requestError) { if (!cancelled) setError(requestError.response?.data?.message || "Failed to load reviews."); } finally { if (!cancelled) setLoading(false); } } load(); return () => { cancelled = true; }; }, []);
  const stats = useMemo(() => ({ approved: reviews.filter((review) => review.status === "approved").length, pending: reviews.filter((review) => review.status === "pending").length, average: reviews.length ? (reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length).toFixed(1) : "0.0" }), [reviews]);
  const filtered = useMemo(() => { const query = search.trim().toLowerCase(); return reviews.filter((review) => (status === "all" || review.status === status) && (!query || `${reviewTitle(review)} ${review.comment}`.toLowerCase().includes(query))); }, [reviews, search, status]);
  const pagination = useSmartPagination(filtered, { initialPageSize: 10, resetKey: `${search}-${status}` });
  return <section className="ca-account-page ca-reviews-page"><AccountPageHeader eyebrow="Your feedback" title="My reviews" description="See the feedback you submitted and its current approval status." icon="star" actions={<Link className="ca-button ca-button--soft" to="/orders">Review delivered orders</Link>} /><AccountStatGrid items={[{ label: "All reviews", value: reviews.length, note: "Submitted feedback", icon: "star", tone: "amber" }, { label: "Approved", value: stats.approved, note: "Visible publicly", icon: "check", tone: "emerald" }, { label: "Pending", value: stats.pending, note: "Waiting for review", icon: "activity", tone: "violet" }, { label: "Average rating", value: `${stats.average}/5`, note: "Across your reviews", icon: "spark", tone: "cyan" }]} /><AccountToolbar resultText={`${filtered.length} review${filtered.length === 1 ? "" : "s"}`}><AccountSearch value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product, service, or comment..." /><label className="ca-select-filter"><AccountIcon name="filter" size={17} /><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></label></AccountToolbar>{error && <div className="ca-alert ca-alert--error">{error}</div>}{loading ? <div className="ca-loading">Loading your reviews...</div> : filtered.length === 0 ? <AccountEmpty icon="star" title="No reviews found" text={reviews.length ? "Try another search or status filter." : "Delivered product orders can be reviewed from My Orders."} actionLabel="Open my orders" actionTo="/orders" /> : <><div className="ca-record-list">{pagination.items.map((review) => <article className="ca-record-card ca-review-row" key={review.id} role="button" tabIndex="0" onClick={() => setSelected(review)} onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && setSelected(review)}><span className="ca-record-card__icon tone-amber"><b>{review.rating}</b><small>/5</small></span><div className="ca-record-card__main"><div className="ca-record-card__title"><h3>{reviewTitle(review)}</h3><AccountStatus value={review.status} label={readable(review.status)} /></div><p className="ca-clamp-2">{review.comment}</p><div className="ca-record-card__meta"><span>{formatDate(review.createdAt)}</span></div></div><span className="ca-record-card__open">View review <AccountIcon name="chevron" size={16} /></span></article>)}</div><SmartPagination pagination={pagination} label="reviews" compact /></>}<AccountModal open={Boolean(selected)} onClose={() => setSelected(null)} title={reviewTitle(selected || {})} eyebrow="Your review" icon="star">{selected && <><div className="ca-rating-display"><strong>{selected.rating}.0</strong><span>{"★".repeat(Math.max(0, Number(selected.rating || 0)))}{"☆".repeat(Math.max(0, 5 - Number(selected.rating || 0)))}</span><AccountStatus value={selected.status} label={readable(selected.status)} /></div><div className="ca-note ca-note--large"><strong>Your feedback</strong><p>{selected.comment}</p></div><AccountDetailGrid items={[{ label: "Submitted", value: formatDate(selected.createdAt) }, { label: "Status", value: readable(selected.status) }, { label: "Type", value: selected.product ? "Product" : selected.service ? "Service" : "Review" }]} /></>}</AccountModal></section>;
}

function BusinessReviewsView({ user }) {
  const [reviews, setReviews] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [rating, setRating] = useState("all");
  async function loadReviews() { setLoading(true); setError(""); try { const { data } = await api.get("/reviews/business"); setReviews(data.data || []); } catch (requestError) { setError(requestError.response?.data?.message || "Could not load customer reviews."); } finally { setLoading(false); } }
  useEffect(() => { loadReviews(); }, []);
  const approved = reviews.filter((item) => item.status === "approved");
  const average = approved.length ? approved.reduce((sum, item) => sum + Number(item.rating || 0), 0) / approved.length : 0;
  const positive = approved.filter((item) => Number(item.rating || 0) >= 4).length;
  const filtered = useMemo(() => { const query = search.trim().toLowerCase(); return reviews.filter((review) => (status === "all" || review.status === status) && (rating === "all" || Number(review.rating) === Number(rating)) && (!query || `${reviewTitle(review)} ${review.user?.name} ${review.comment}`.toLowerCase().includes(query))); }, [reviews, search, status, rating]);
  const pagination = useSmartPagination(filtered, { initialPageSize: 10, resetKey: `${search}-${status}-${rating}` });
  return <section className="business-workspace-v2 business-management-v2 business-reviews-v2"><BusinessPageHeader eyebrow="Business reputation" title="Customer reviews" description="Understand what customers say about your products and services, identify strong feedback, and open each review without cluttering the list." meta={<><span><BusinessIcon name="store" size={15} />{user?.businessName || user?.name || "Your business"}</span><span><BusinessIcon name="star" size={15} />{average.toFixed(1)} average rating</span></>} actions={<button className="business-primary-button-v2" type="button" onClick={loadReviews}><BusinessIcon name="refresh" size={17} />Refresh reviews</button>} />{error && <div className="business-error-v2"><strong>Reviews could not load</strong><p>{error}</p></div>}<div className="business-metrics-grid-v2"><BusinessMetricCard icon="star" label="All reviews" value={reviews.length} note="Across your listings" tone="blue" /><BusinessMetricCard icon="spark" label="Average rating" value={`${average.toFixed(1)}/5`} note="Approved feedback" tone="amber" /><BusinessMetricCard icon="check" label="Positive reviews" value={positive} note="Four or five stars" tone="emerald" /><BusinessMetricCard icon="clock" label="Pending approval" value={reviews.filter((item) => item.status === "pending").length} note="Not public yet" tone="violet" /></div><section className="business-content-panel-v2 bm-management-panel-v2"><div className="business-tab-content-v2"><BusinessSearchToolbar value={search} onChange={setSearch} placeholder="Search listing, customer, or review comment" filter={<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="approved">Approved</option><option value="pending">Pending</option><option value="rejected">Rejected</option></select>}><label className="business-filter-v2"><BusinessIcon name="star" size={17} /><select value={rating} onChange={(event) => setRating(event.target.value)}><option value="all">All ratings</option><option value="5">5 stars</option><option value="4">4 stars</option><option value="3">3 stars</option><option value="2">2 stars</option><option value="1">1 star</option></select></label></BusinessSearchToolbar>{loading ? <div className="business-loading-v2"><span /><p>Loading customer reviews...</p></div> : !filtered.length ? <BusinessEmptyState icon="star" title="No customer reviews found" description={reviews.length ? "Change the search, status, or rating filter." : "Reviews for your products and services will appear here."} /> : <div className="bm-review-list-v2">{pagination.items.map((review) => <article className="bm-review-row-v2" key={review.id} role="button" tabIndex="0" onClick={() => setSelected(review)} onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && setSelected(review)}><span className="bm-review-rating-v2"><strong>{review.rating}</strong><small>/5</small></span><div className="bm-row-main-v2"><div><div><h3>{reviewTitle(review)}</h3><p>{review.user?.name || "Customer"} · {formatDate(review.createdAt)}</p></div><BusinessStatusBadge status={review.status} /></div><div className="bm-stars-v2" aria-label={`${review.rating} out of 5 stars`}>{Array.from({ length: 5 }, (_, index) => <span className={index < Number(review.rating || 0) ? "active" : ""} key={index}>★</span>)}</div><small>{review.comment || "No written comment."}</small></div><BusinessIcon name="chevron" size={18} /></article>)}<SmartPagination pagination={pagination} label="reviews" /></div>}</div></section><BusinessModal open={Boolean(selected)} title={reviewTitle(selected || {})} eyebrow="Customer feedback" onClose={() => setSelected(null)} size="medium">{selected && <><div className="bm-review-modal-score-v2"><strong>{selected.rating}.0</strong><div><span>{Array.from({ length: 5 }, (_, index) => <b className={index < Number(selected.rating || 0) ? "active" : ""} key={index}>★</b>)}</span><BusinessStatusBadge status={selected.status} /></div></div><div className="business-description-v2"><span>Customer review</span><p>{selected.comment || "No written comment."}</p></div><BusinessInfoGrid items={[{ label: "Customer", value: selected.user?.name || "Customer" }, { label: "Customer email", value: selected.user?.email || "Not available" }, { label: "Listing type", value: selected.product ? "Product" : selected.service ? "Service" : "Listing" }, { label: "Submitted", value: formatDate(selected.createdAt) }]} /><div className="business-modal-action-row-v2"><Link className="business-ghost-button-v2" to={selected.product ? `/products/${selected.product.id}` : selected.service ? `/services/${selected.service.id}` : "/business"} onClick={() => setSelected(null)}>View listing</Link><ContextMessageButton contextType="review" contextId={selected.id} subject={`Review follow-up: ${reviewTitle(selected)}`} message={`Hello ${selected.user?.name || "customer"}, thank you for reviewing ${reviewTitle(selected)}.`} label="Message customer" className="business-primary-button-v2" /></div></>}</BusinessModal></section>;
}

export default function MyReviews() {
  const { user } = useAuth();
  const businessMode = ["seller", "shop", "shop_seller", "service_provider"].includes(user?.role);
  return businessMode ? <BusinessReviewsView user={user} /> : <CustomerReviewsView />;
}
