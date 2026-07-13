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

function money(value) { return Number(value || 0).toLocaleString("en-LK"); }
function formatMoney(value) { return `Rs. ${money(value)}`; }
function readable(value) { return String(value || "").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function formatDate(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not set" : date.toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" });
}
function canManageOffer(user, offer) { return ["admin", "super_admin"].includes(user?.role) || offer.sellerId === user?.id; }
function canCancelOffer(user, offer) { return offer.buyerId === user?.id && ["pending", "countered"].includes(offer.status); }

function CustomerOfferActionPanel({ offer, user, onUpdate }) {
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
    }
  }

  if (!isManager && !isBuyerCancel) return null;
  return (
    <section className="ca-modal-section ca-offer-actions">
      <h3>Available actions</h3>
      {isManager && <>
        <div className="ca-form-grid ca-form-grid--two">
          <label>Counter amount<input type="number" min="1" value={counterAmount} onChange={(event) => setCounterAmount(event.target.value)} /></label>
          <label>Seller / admin note<input value={sellerNote} onChange={(event) => setSellerNote(event.target.value)} /></label>
        </div>
        <div className="ca-modal-actions"><button className="ca-button ca-button--success" type="button" disabled={busy} onClick={() => updateOffer({ status: "accepted", sellerNote })}>Accept offer</button><button className="ca-button ca-button--primary" type="button" disabled={busy} onClick={() => updateOffer({ status: "countered", counterAmount, sellerNote })}>Send counter</button><button className="ca-button ca-button--danger" type="button" disabled={busy} onClick={() => updateOffer({ status: "rejected", sellerNote })}>Reject offer</button></div>
      </>}
      {isBuyerCancel && <button className="ca-button ca-button--danger" type="button" disabled={busy} onClick={() => updateOffer({ status: "cancelled" })}>Cancel my offer</button>}
      {message && <p className="ca-form-note">{message}</p>}
    </section>
  );
}

function CustomerOffersView({ user }) {
  const [offers, setOffers] = useState([]);
  const [selected, setSelected] = useState(null);
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
    } finally { setLoading(false); }
  }
  useEffect(() => { loadOffers(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [status]);
  const stats = useMemo(() => ({ pending: offers.filter((offer) => offer.status === "pending").length, countered: offers.filter((offer) => offer.status === "countered").length, accepted: offers.filter((offer) => offer.status === "accepted").length }), [offers]);
  const pagination = useSmartPagination(offers, { initialPageSize: 10, resetKey: `${status}-${search}` });
  function handleUpdatedOffer(nextOffer) { setOffers((current) => current.map((offer) => offer.id === nextOffer.id ? nextOffer : offer)); setSelected(nextOffer); }

  return (
    <section className="ca-account-page ca-offers-page">
      <AccountPageHeader eyebrow="Negotiation center" title="Product offers" description="Review every offer in a clean list, then open it to see pricing, messages, and available actions." icon="money" actions={<Link className="ca-button ca-button--soft" to="/marketplace">Browse negotiable products</Link>} />
      <AccountStatGrid items={[{ label: "All offers", value: offers.length, note: "Current search result", icon: "money", tone: "cyan" }, { label: "Pending", value: stats.pending, note: "Awaiting a response", icon: "activity", tone: "violet" }, { label: "Countered", value: stats.countered, note: "Price updated", icon: "arrow", tone: "amber" }, { label: "Accepted", value: stats.accepted, note: "Agreed offers", icon: "check", tone: "emerald" }]} />
      <AccountToolbar resultText={`${offers.length} offer${offers.length === 1 ? "" : "s"}`} actions={<button className="ca-button ca-button--primary" type="button" onClick={loadOffers}>Search</button>}><AccountSearch value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search offer number, customer, phone, product..." /><label className="ca-select-filter"><AccountIcon name="filter" size={17} /><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="pending">Pending</option><option value="countered">Countered</option><option value="accepted">Accepted</option><option value="rejected">Rejected</option><option value="cancelled">Cancelled</option></select></label></AccountToolbar>
      {error && <div className="ca-alert ca-alert--error">{error}</div>}
      {loading ? <div className="ca-loading">Loading offers...</div> : offers.length === 0 ? <AccountEmpty icon="money" title="No offers found" text="Customer offers for negotiable products will appear here." actionLabel="Browse marketplace" actionTo="/marketplace" /> : <><div className="ca-record-grid ca-offer-grid">{pagination.items.map((offer) => <article className="ca-summary-card tone-emerald" key={offer.id} role="button" tabIndex="0" onClick={() => setSelected(offer)} onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && setSelected(offer)}><div className="ca-offer-product"><div className="ca-offer-product__image">{offer.product?.image ? <img src={offer.product.image} alt={offer.product.name} /> : <AccountIcon name="box" size={24} />}</div><div><small>{offer.offerNo}</small><h3>{offer.product?.name || "Product"}</h3><p>{offer.product?.location || "Sri Lanka"}</p></div><AccountStatus value={offer.status} label={readable(offer.status)} /></div><div className="ca-summary-card__values ca-offer-values"><span>Listed <b>{formatMoney(offer.product?.price)}</b></span><span>Your offer <b>{formatMoney(offer.offeredAmount)}</b></span><span>Counter <b>{offer.counterAmount ? formatMoney(offer.counterAmount) : "—"}</b></span></div><div className="ca-summary-card__footer"><span>{offer.customerName || "Customer"}</span><b>Open offer <AccountIcon name="chevron" size={15} /></b></div></article>)}</div><SmartPagination pagination={pagination} label="offers" compact /></>}
      <AccountModal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.product?.name || "Offer details"} eyebrow={selected?.offerNo || "Offer"} icon="money" size="large">{selected && <><div className="ca-modal-summary-row"><div><span>Status</span><AccountStatus value={selected.status} label={readable(selected.status)} /></div><div><span>Your offer</span><strong>{formatMoney(selected.offeredAmount)}</strong></div><div><span>Counter</span><strong>{selected.counterAmount ? formatMoney(selected.counterAmount) : "Not sent"}</strong></div></div><section className="ca-modal-section"><h3>Price comparison</h3><div className="ca-price-comparison"><div><small>Listed price</small><strong>{formatMoney(selected.product?.price)}</strong></div><div className="is-highlight"><small>Customer offer</small><strong>{formatMoney(selected.offeredAmount)}</strong></div><div><small>Counter offer</small><strong>{selected.counterAmount ? formatMoney(selected.counterAmount) : "—"}</strong></div></div></section><section className="ca-modal-section"><h3>Offer information</h3><AccountDetailGrid items={[{ label: "Customer", value: selected.customerName || "Not set" }, { label: "Customer phone", value: selected.customerPhone || "Not set" }, { label: "Seller", value: selected.seller?.businessName || selected.seller?.name || "SmartSell seller" }, { label: "Seller contact", value: selected.seller?.phone || selected.seller?.email || "Not set" }, { label: "Created", value: formatDate(selected.createdAt) }, { label: "Condition", value: readable(selected.product?.condition || "Not set") }]} /></section>{selected.message && <div className="ca-note"><strong>Customer note</strong><p>{selected.message}</p></div>}{selected.sellerNote && <div className="ca-note ca-note--accent"><strong>Seller note</strong><p>{selected.sellerNote}</p></div>}<div className="ca-modal-actions"><Link className="ca-button ca-button--soft" to={`/products/${selected.productId}`} onClick={() => setSelected(null)}>View product</Link><ContextMessageButton contextType="offer" contextId={selected.id} subject={`Offer discussion: ${selected.offerNo}`} message={`Hi, I want to discuss offer ${selected.offerNo} for ${selected.product?.name || "this product"}.`} label="Open conversation" className="ca-button ca-button--primary" /></div><CustomerOfferActionPanel offer={selected} user={user} onUpdate={handleUpdatedOffer} /></>}</AccountModal>
    </section>
  );
}

function BusinessOfferEditor({ offer, onUpdated }) {
  const [counterAmount, setCounterAmount] = useState(offer.counterAmount || "");
  const [sellerNote, setSellerNote] = useState(offer.sellerNote || "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function update(payload) {
    try {
      setBusy(true); setMessage("Updating offer...");
      const { data } = await api.patch(`/offers/${offer.id}`, payload);
      onUpdated(data.data); setMessage(data.message || "Offer updated.");
    } catch (error) { setMessage(error.response?.data?.message || "Offer could not be updated."); }
    finally { setBusy(false); }
  }
  return <section className="bm-modal-section-v2"><div className="bm-section-heading-v2"><div><span>Negotiation actions</span><h3>Respond without leaving the offer</h3></div></div><div className="business-form-grid-v2 two-columns"><label className="business-field-v2"><span>Counter amount</span><input type="number" min="1" value={counterAmount} onChange={(event) => setCounterAmount(event.target.value)} placeholder="Enter a revised price" /></label><label className="business-field-v2"><span>Reply note</span><input value={sellerNote} onChange={(event) => setSellerNote(event.target.value)} placeholder="Short message for the customer" /></label></div>{message && <p className="business-form-message-v2">{message}</p>}<div className="business-modal-action-row-v2"><button className="business-danger-button-v2" type="button" disabled={busy} onClick={() => update({ status: "rejected", sellerNote })}>Reject offer</button><button className="business-secondary-button-v2" type="button" disabled={busy || !counterAmount} onClick={() => update({ status: "countered", counterAmount, sellerNote })}>Send counter</button><button className="business-primary-button-v2" type="button" disabled={busy} onClick={() => update({ status: "accepted", sellerNote })}>Accept offer</button></div></section>;
}

function BusinessOffersView({ user }) {
  const [offers, setOffers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  async function loadOffers() {
    try { setLoading(true); setError(""); const { data } = await api.get("/offers", { params: { status: status === "all" ? "" : status, q: search } }); setOffers(data.data || []); }
    catch (err) { setError(err.response?.data?.message || "Offers could not be loaded."); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadOffers(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [status]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return offers.filter((offer) => !query || `${offer.offerNo} ${offer.product?.name} ${offer.customerName} ${offer.customerPhone}`.toLowerCase().includes(query));
  }, [offers, search]);
  const stats = useMemo(() => ({ pending: offers.filter((item) => item.status === "pending").length, countered: offers.filter((item) => item.status === "countered").length, accepted: offers.filter((item) => item.status === "accepted").length }), [offers]);
  const pagination = useSmartPagination(filtered, { initialPageSize: 10, resetKey: `${status}-${search}` });
  function updateOffer(next) { setOffers((current) => current.map((item) => item.id === next.id ? next : item)); setSelected(next); }

  return <section className="business-workspace-v2 business-management-v2 business-offers-v2">
    <BusinessPageHeader eyebrow="Sales negotiation" title="Product offers" description="Review customer price proposals, compare them with your listed price, and keep every negotiation action inside one clean detail view." meta={<><span><BusinessIcon name="tag" size={15} />{user?.businessName || user?.name || "Your store"}</span><span><BusinessIcon name="clock" size={15} />{stats.pending} awaiting response</span></>} actions={<><Link className="business-ghost-button-v2" to="/business"><BusinessIcon name="briefcase" size={17} />Business overview</Link><button className="business-primary-button-v2" type="button" onClick={loadOffers}><BusinessIcon name="refresh" size={17} />Refresh</button></>} />
    {error && <div className="business-error-v2"><strong>Offers could not load</strong><p>{error}</p></div>}
    <div className="business-metrics-grid-v2"><BusinessMetricCard icon="tag" label="All offers" value={offers.length} note="Current negotiation records" tone="blue" /><BusinessMetricCard icon="clock" label="Pending" value={stats.pending} note="Need your response" tone="violet" /><BusinessMetricCard icon="arrow" label="Countered" value={stats.countered} note="Revised price sent" tone="amber" /><BusinessMetricCard icon="check" label="Accepted" value={stats.accepted} note="Agreed customer offers" tone="emerald" /></div>
    <section className="business-content-panel-v2 bm-management-panel-v2"><div className="business-tab-content-v2"><BusinessSearchToolbar value={search} onChange={setSearch} placeholder="Search offer, product, customer, or phone" filter={<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="pending">Pending</option><option value="countered">Countered</option><option value="accepted">Accepted</option><option value="rejected">Rejected</option><option value="cancelled">Cancelled</option></select>}><button className="business-secondary-button-v2" type="button" onClick={loadOffers}>Search</button></BusinessSearchToolbar>
      {loading ? <div className="business-loading-v2"><span /><p>Loading customer offers...</p></div> : !filtered.length ? <BusinessEmptyState icon="tag" title="No offers found" description={offers.length ? "Change the search term or status filter." : "Offers on negotiable products will appear here."} /> : <div className="bm-offer-list-v2">{pagination.items.map((offer) => <article className="bm-offer-row-v2" key={offer.id} role="button" tabIndex="0" onClick={() => setSelected(offer)} onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && setSelected(offer)}><div className="bm-offer-media-v2">{offer.product?.image ? <img src={offer.product.image} alt={offer.product?.name || "Product"} /> : <BusinessIcon name="box" size={26} />}</div><div className="bm-row-main-v2"><div><div><small>{offer.offerNo}</small><h3>{offer.product?.name || "Product"}</h3></div><BusinessStatusBadge status={offer.status} /></div><p>{offer.customerName || "Customer"} · {offer.customerPhone || "No phone"}</p><div className="bm-price-strip-v2"><span>Listed <b>{formatMoney(offer.product?.price)}</b></span><span>Customer offer <b>{formatMoney(offer.offeredAmount)}</b></span><span>Counter <b>{offer.counterAmount ? formatMoney(offer.counterAmount) : "Not sent"}</b></span></div></div><BusinessIcon name="chevron" size={18} /></article>)}<SmartPagination pagination={pagination} label="offers" /></div>}
    </div></section>
    <BusinessModal open={Boolean(selected)} title={selected?.product?.name || "Offer details"} eyebrow={selected?.offerNo || "Customer offer"} onClose={() => setSelected(null)}>
      {selected && <><div className="business-modal-status-line-v2"><BusinessStatusBadge status={selected.status} /></div><div className="bm-offer-comparison-v2"><div><span>Listed price</span><strong>{formatMoney(selected.product?.price)}</strong></div><div className="highlight"><span>Customer offer</span><strong>{formatMoney(selected.offeredAmount)}</strong></div><div><span>Your counter</span><strong>{selected.counterAmount ? formatMoney(selected.counterAmount) : "Not sent"}</strong></div></div><BusinessInfoGrid items={[{ label: "Customer", value: selected.customerName || "Not set" }, { label: "Phone", value: selected.customerPhone || "Not set" }, { label: "Created", value: formatDate(selected.createdAt) }, { label: "Condition", value: readable(selected.product?.condition || "Not set") }, { label: "Location", value: selected.product?.location || "Not set" }, { label: "Offer number", value: selected.offerNo }]} />{selected.message && <div className="business-description-v2"><span>Customer message</span><p>{selected.message}</p></div>}{selected.sellerNote && <div className="business-note-v2"><strong>Your latest reply</strong><p>{selected.sellerNote}</p></div>}<div className="business-modal-action-row-v2"><Link className="business-ghost-button-v2" to={`/products/${selected.productId}`} onClick={() => setSelected(null)}>View product</Link><ContextMessageButton contextType="offer" contextId={selected.id} subject={`Offer discussion: ${selected.offerNo}`} message={`Hi, I want to discuss offer ${selected.offerNo} for ${selected.product?.name || "this product"}.`} label="Message customer" className="business-secondary-button-v2" /></div>{["pending", "countered"].includes(selected.status) && <BusinessOfferEditor offer={selected} onUpdated={updateOffer} />}</>}
    </BusinessModal>
  </section>;
}

export default function Offers() {
  const { user } = useAuth();
  const sellerMode = ["seller", "shop", "shop_seller"].includes(user?.role);
  return sellerMode ? <BusinessOffersView user={user} /> : <CustomerOffersView user={user} />;
}
