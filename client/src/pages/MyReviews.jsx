import { useEffect, useState } from "react";
import SectionHeader from "../components/SectionHeader.jsx";
import api from "../utils/api.js";

function StatusPill({ status }) {
  return <span className={`status-pill status-${String(status || "").replaceAll("_", "-")}`}>{String(status || "pending").replaceAll("_", " ")}</span>;
}

export default function MyReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="page section">
      <SectionHeader
        eyebrow="My Reviews"
        title="Your product and service reviews"
        description="Reviews stay pending until admin approves them, so SmartSell keeps public feedback trusted."
      />

      {loading && <p className="form-status">Loading reviews...</p>}
      {error && <div className="form-alert spaced-alert">{error}</div>}

      <div className="review-list">
        {reviews.length ? reviews.map((review) => (
          <article className="review-card" key={review.id}>
            <div className="business-list-head">
              <div>
                <h3>★ {review.rating} — {review.product?.name || review.service?.title || "SmartSell review"}</h3>
                <p>{review.comment}</p>
              </div>
              <StatusPill status={review.status} />
            </div>
          </article>
        )) : !loading && <p className="soft-note">No reviews yet. Delivered product orders can be reviewed from My Orders.</p>}
      </div>
    </section>
  );
}
