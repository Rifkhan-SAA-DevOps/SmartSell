import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
import useSmartPagination from "../hooks/useSmartPagination.js";
import api from "../utils/api.js";

function readable(value) {
  return String(value || "pending").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : date.toLocaleDateString("en-LK", { year: "numeric", month: "short", day: "numeric" });
}

export default function MyReviews() {
  const [reviews, setReviews] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    let cancelled = false;
    async function loadReviews() {
      try {
        const { data } = await api.get("/reviews/mine");
        if (!cancelled) setReviews(data.data || []);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || "Failed to load reviews.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadReviews();
    return () => { cancelled = true; };
  }, []);

  const stats = useMemo(() => ({
    approved: reviews.filter((review) => review.status === "approved").length,
    pending: reviews.filter((review) => review.status === "pending").length,
    average: reviews.length ? (reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length).toFixed(1) : "0.0",
  }), [reviews]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return reviews.filter((review) => {
      const title = review.product?.name || review.service?.title || "SmartSell review";
      return (status === "all" || review.status === status) && (!query || `${title} ${review.comment}`.toLowerCase().includes(query));
    });
  }, [reviews, search, status]);
  const pagination = useSmartPagination(filtered, { initialPageSize: 10, resetKey: `${search}-${status}` });

  return (
    <section className="ca-account-page ca-reviews-page">
      <AccountPageHeader eyebrow="Your feedback" title="My reviews" description="See the feedback you submitted and its current approval status." icon="star" actions={<Link className="ca-button ca-button--soft" to="/orders">Review delivered orders</Link>} />

      <AccountStatGrid items={[
        { label: "All reviews", value: reviews.length, note: "Submitted feedback", icon: "star", tone: "amber" },
        { label: "Approved", value: stats.approved, note: "Visible publicly", icon: "check", tone: "emerald" },
        { label: "Pending", value: stats.pending, note: "Waiting for review", icon: "activity", tone: "violet" },
        { label: "Average rating", value: `${stats.average}/5`, note: "Across your reviews", icon: "spark", tone: "cyan" },
      ]} />

      <AccountToolbar resultText={`${filtered.length} review${filtered.length === 1 ? "" : "s"}`}>
        <AccountSearch value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product, service, or comment..." />
        <label className="ca-select-filter"><AccountIcon name="filter" size={17} /><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></label>
      </AccountToolbar>

      {error && <div className="ca-alert ca-alert--error">{error}</div>}
      {loading ? <div className="ca-loading">Loading your reviews...</div> : filtered.length === 0 ? (
        <AccountEmpty icon="star" title="No reviews found" text={reviews.length ? "Try another search or status filter." : "Delivered product orders can be reviewed from My Orders."} actionLabel="Open my orders" actionTo="/orders" />
      ) : <>
        <div className="ca-record-list">
          {pagination.items.map((review) => {
            const title = review.product?.name || review.service?.title || "SmartSell review";
            return <article className="ca-record-card ca-review-row" key={review.id} role="button" tabIndex="0" onClick={() => setSelected(review)} onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && setSelected(review)}>
              <span className="ca-record-card__icon tone-amber"><b>{review.rating}</b><small>/5</small></span>
              <div className="ca-record-card__main"><div className="ca-record-card__title"><h3>{title}</h3><AccountStatus value={review.status} label={readable(review.status)} /></div><p className="ca-clamp-2">{review.comment}</p><div className="ca-record-card__meta"><span>{formatDate(review.createdAt)}</span></div></div>
              <span className="ca-record-card__open">View review <AccountIcon name="chevron" size={16} /></span>
            </article>;
          })}
        </div>
        <SmartPagination pagination={pagination} label="reviews" compact />
      </>}

      <AccountModal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.product?.name || selected?.service?.title || "Review details"} eyebrow="Your review" icon="star">
        {selected && <>
          <div className="ca-rating-display"><strong>{selected.rating}.0</strong><span>{"★".repeat(Math.max(0, Number(selected.rating || 0)))}{"☆".repeat(Math.max(0, 5 - Number(selected.rating || 0)))}</span><AccountStatus value={selected.status} label={readable(selected.status)} /></div>
          <div className="ca-note ca-note--large"><strong>Your feedback</strong><p>{selected.comment}</p></div>
          <AccountDetailGrid items={[{ label: "Submitted", value: formatDate(selected.createdAt) }, { label: "Status", value: readable(selected.status) }, { label: "Type", value: selected.product ? "Product" : selected.service ? "Service" : "Review" }]} />
        </>}
      </AccountModal>
    </section>
  );
}
