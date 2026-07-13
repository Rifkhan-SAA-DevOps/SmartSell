import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import ContextMessageButton from "../components/ContextMessageButton.jsx";
import api from "../utils/api.js";

function money(value) {
  return Number(value || 0).toLocaleString("en-LK");
}

function readable(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(status) {
  const normalized = String(status || "pending").toLowerCase();
  if (["accepted", "paid", "approved"].includes(normalized)) return "status-pill approved";
  if (["rejected", "cancelled", "expired"].includes(normalized)) return "status-pill rejected";
  if (["countered"].includes(normalized)) return "status-pill quoted";
  return "status-pill pending";
}

function canManageOffer(user, offer) {
  return ["admin", "super_admin"].includes(user?.role) || offer.sellerId === user?.id;
}

function canCancelOffer(user, offer) {
  return offer.buyerId === user?.id && ["pending", "countered"].includes(offer.status);
}

function EmptyState() {
  return (
    <div className="empty-workspace-card offer-empty-card">
      <span>↔</span>
      <h2>No offers yet</h2>
      <p>Customer offers for used products and negotiable listings will appear here.</p>
      <Link className="primary-btn" to="/marketplace">Browse Marketplace</Link>
    </div>
  );
}

function OfferActionPanel({ offer, user, onUpdate }) {
  const [counterAmount, setCounterAmount] = useState(offer.counterAmount || "");
  const [sellerNote, setSellerNote] = useState(offer.sellerNote || "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const isManager = canManageOffer(user, offer);
  const isBuyerCancel = canCancelOffer(user, offer);

  async function updateOffer(payload) {
    try {
      setBusy(true);
      setMessage("");
      const { data } = await api.patch(`/offers/${offer.id}`, payload);
      onUpdate(data.data);
      setMessage(data.message || "Offer updated.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Offer could not be updated.");
    } finally {
      setBusy(false);
      window.setTimeout(() => setMessage(""), 2500);
    }
  }

  if (!isManager && !isBuyerCancel) {
    return null;
  }

  return (
    <div className="offer-actions-panel">
      {isManager && (
        <>
          <div className="offer-action-grid">
            <label>
              Counter amount
              <input
                type="number"
                min="1"
                value={counterAmount}
                onChange={(event) => setCounterAmount(event.target.value)}
                placeholder="Example: 145000"
              />
            </label>
            <label>
              Seller/Admin note
              <input
                value={sellerNote}
                onChange={(event) => setSellerNote(event.target.value)}
                placeholder="Short reply to customer"
              />
            </label>
          </div>
          <div className="button-row offer-button-row">
            <button className="success-btn small-btn" type="button" disabled={busy} onClick={() => updateOffer({ status: "accepted", sellerNote })}>Accept</button>
            <button className="secondary-btn small-btn" type="button" disabled={busy} onClick={() => updateOffer({ status: "countered", counterAmount, sellerNote })}>Send Counter</button>
            <button className="danger-btn small-btn" type="button" disabled={busy} onClick={() => updateOffer({ status: "rejected", sellerNote })}>Reject</button>
          </div>
        </>
      )}

      {isBuyerCancel && (
        <button className="danger-btn small-btn" type="button" disabled={busy} onClick={() => updateOffer({ status: "cancelled" })}>
          Cancel My Offer
        </button>
      )}

      {message && <p className="form-status">{message}</p>}
    </div>
  );
}

export default function Offers() {
  const { user } = useAuth();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  async function loadOffers() {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get("/offers", { params: { status, q: search } });
      setOffers(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Offers could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOffers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const stats = useMemo(() => {
    const pending = offers.filter((offer) => offer.status === "pending").length;
    const countered = offers.filter((offer) => offer.status === "countered").length;
    const accepted = offers.filter((offer) => offer.status === "accepted").length;
    return { total: offers.length, pending, countered, accepted };
  }, [offers]);

  function handleUpdatedOffer(nextOffer) {
    setOffers((current) => current.map((offer) => (offer.id === nextOffer.id ? nextOffer : offer)));
  }

  return (
    <section className="page section management-page offers-page">
      <div className="dashboard-hero compact-hero offer-hero">
        <div>
          <span className="eyebrow">Negotiation Center</span>
          <h1>Product Offers</h1>
          <p>Handle used-product offers, seller counter offers, accepted prices, and customer negotiation in one place.</p>
        </div>
        <div className="hero-icon-card">↔</div>
      </div>

      <div className="stat-grid compact-stat-grid offer-stat-grid">
        <div className="stat-card"><span>▣</span><small>Total Offers</small><strong>{stats.total}</strong></div>
        <div className="stat-card"><span>○</span><small>Pending</small><strong>{stats.pending}</strong></div>
        <div className="stat-card"><span>↗</span><small>Countered</small><strong>{stats.countered}</strong></div>
        <div className="stat-card"><span>✓</span><small>Accepted</small><strong>{stats.accepted}</strong></div>
      </div>

      <div className="filter-card offer-filter-card">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search offer number, customer, phone, or product" />
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="countered">Countered</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button className="primary-btn" type="button" onClick={loadOffers}>Search</button>
      </div>

      {error && <p className="form-status error">{error}</p>}
      {loading ? <p className="form-status">Loading offers...</p> : !offers.length ? <EmptyState /> : (
        <div className="offer-grid">
          {offers.map((offer) => (
            <article className="offer-card" key={offer.id}>
              <div className="offer-product-strip">
                <div className="offer-product-image">
                  {offer.product?.image ? <img src={offer.product.image} alt={offer.product.name} /> : <span>□</span>}
                </div>
                <div>
                  <small>{offer.offerNo}</small>
                  <h3>{offer.product?.name || "Product"}</h3>
                  <p>{readable(offer.product?.condition)} • {offer.product?.location || "No location"}</p>
                </div>
                <span className={statusClass(offer.status)}>{readable(offer.status)}</span>
              </div>

              <div className="offer-money-grid">
                <div><small>Listed Price</small><strong>Rs. {money(offer.product?.price)}</strong></div>
                <div><small>Customer Offer</small><strong>Rs. {money(offer.offeredAmount)}</strong></div>
                <div><small>Counter Offer</small><strong>{offer.counterAmount ? `Rs. ${money(offer.counterAmount)}` : "-"}</strong></div>
              </div>

              <div className="offer-contact-card">
                <div><small>Customer</small><b>{offer.customerName}</b><span>{offer.customerPhone}</span></div>
                <div><small>Seller</small><b>{offer.seller?.businessName || offer.seller?.name || "SmartSell seller"}</b><span>{offer.seller?.phone || offer.seller?.email || "-"}</span></div>
              </div>

              {offer.message && <p className="soft-note"><strong>Customer note:</strong> {offer.message}</p>}
              {offer.sellerNote && <p className="soft-note"><strong>Seller note:</strong> {offer.sellerNote}</p>}

              <div className="offer-card-links">
                <Link to={`/products/${offer.productId}`}>View product</Link>
                <ContextMessageButton
                  contextType="offer"
                  contextId={offer.id}
                  subject={`Offer discussion: ${offer.offerNo}`}
                  message={`Hi, I want to discuss offer ${offer.offerNo} for ${offer.product?.name || "this product"}.`}
                  label="💬 Message"
                  className="secondary-btn small-btn"
                />
                {offer.product?.status === "approved" && <Link to="/marketplace">Browse more</Link>}
              </div>

              <OfferActionPanel offer={offer} user={user} onUpdate={handleUpdatedOffer} />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
