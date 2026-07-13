import { useEffect, useMemo, useState } from "react";
import SmartPagination from "../components/SmartPagination.jsx";
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
import "../styles/pages/business/SellerBusinessWorkspace.css";
import "../styles/pages/business/BusinessWorkspace.css";
import "../styles/pages/business/BusinessManagement.css";

const moneyFormatter = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR",
  maximumFractionDigits: 0,
});

function formatMoney(value) {
  return moneyFormatter.format(Number(value || 0));
}

function readable(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not available"
    : date.toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" });
}

function ClickableLedgerRow({ children, onClick }) {
  return (
    <tr
      tabIndex="0"
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
    >
      {children}
    </tr>
  );
}

function AdminFinanceView({ summary, loading, error, status, onReload, onUpdatePayout }) {
  const stats = summary?.stats || {};
  return (
    <section className="page section finance-page seller-business-polish finance-command-page">
      <header className="section-header">
        <div>
          <span className="eyebrow">Finance Center</span>
          <h1>Payments, commissions and seller payouts</h1>
          <p>Track paid orders, SmartSell commission income, seller earnings, and payout requests.</p>
        </div>
        <button className="primary-btn" type="button" onClick={onReload}>Refresh</button>
      </header>
      {loading && <p className="form-status">Loading finance details...</p>}
      {error && <div className="form-alert spaced-alert">{error}</div>}
      {status && <div className="success-alert spaced-alert">{status}</div>}
      <div className="finance-stat-grid">
        {[
          ["Gross Sales", stats.grossSales],
          ["Platform Commission", stats.platformCommission],
          ["Seller Earnings", stats.sellerEarnings],
          ["Pending Payouts", stats.pendingPayoutAmount],
        ].map(([label, value]) => <article className="finance-stat-card" key={label}><div><span>{label}</span><strong>{formatMoney(value)}</strong></div></article>)}
      </div>
      <div className="admin-table finance-table-panel">
        <h3>Seller Payout Requests</h3>
        <table>
          <thead><tr><th>Seller</th><th>Amount</th><th>Method</th><th>Details</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {summary?.payouts?.length ? summary.payouts.map((payout) => (
              <tr key={payout.id}>
                <td>{payout.seller?.name || "Seller"}<br /><small>{payout.seller?.email || "-"}</small></td>
                <td>{formatMoney(payout.amount)}</td>
                <td>{readable(payout.method)}</td>
                <td><small>{payout.accountDetails || "-"}</small></td>
                <td><BusinessStatusBadge status={payout.status} /></td>
                <td><div className="row-actions stacked-actions"><button className="approve-btn" type="button" onClick={() => onUpdatePayout(payout, "approved")}>Approve</button><button className="approve-btn" type="button" onClick={() => onUpdatePayout(payout, "paid")}>Mark Paid</button><button className="reject-btn" type="button" onClick={() => onUpdatePayout(payout, "rejected")}>Reject</button></div></td>
              </tr>
            )) : <tr><td colSpan="6">No payout requests yet.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="admin-table finance-table-panel">
        <h3>Commission Ledger</h3>
        <table>
          <thead><tr><th>Order</th><th>Product</th><th>Gross</th><th>SmartSell Fee</th><th>Seller Amount</th><th>Status</th></tr></thead>
          <tbody>{summary?.commissions?.length ? summary.commissions.map((commission) => <tr key={commission.id}><td>{commission.orderNo}</td><td>{commission.productName}</td><td>{formatMoney(commission.grossAmount)}</td><td>{commission.commissionRate}%<br /><small>{formatMoney(commission.commissionAmount)}</small></td><td>{formatMoney(commission.sellerAmount)}</td><td><BusinessStatusBadge status={commission.status} /></td></tr>) : <tr><td colSpan="6">No earnings yet.</td></tr>}</tbody>
        </table>
      </div>
    </section>
  );
}

export default function Earnings() {
  const { user } = useAuth();
  const isAdmin = ["admin", "super_admin"].includes(user?.role);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState("earnings");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCommission, setSelectedCommission] = useState(null);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [payoutForm, setPayoutForm] = useState({ amount: "", method: "bank_transfer", accountDetails: "", note: "" });

  async function loadSummary() {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get("/finance/summary");
      setSummary(data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load finance details.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadSummary(); }, []);

  async function submitPayout(event) {
    event.preventDefault();
    try {
      setSubmitting(true);
      setStatusMessage("");
      setError("");
      await api.post("/finance/payouts", payoutForm);
      setStatusMessage("Payout request submitted for review.");
      setPayoutForm({ amount: "", method: "bank_transfer", accountDetails: "", note: "" });
      setShowPayoutForm(false);
      await loadSummary();
    } catch (err) {
      setError(err.response?.data?.message || "Payout request failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function updatePayout(payout, nextStatus) {
    try {
      setStatusMessage("Updating payout...");
      await api.patch(`/finance/payouts/${payout.id}/status`, { status: nextStatus });
      setStatusMessage(`Payout marked as ${readable(nextStatus)}.`);
      await loadSummary();
    } catch (err) {
      setError(err.response?.data?.message || "Payout update failed.");
    }
  }

  if (isAdmin) {
    return <AdminFinanceView summary={summary} loading={loading} error={error} status={statusMessage} onReload={loadSummary} onUpdatePayout={updatePayout} />;
  }

  const stats = summary?.stats || {};
  const commissions = summary?.commissions || [];
  const payouts = summary?.payouts || [];
  const filteredCommissions = commissions.filter((item) => {
    const query = search.trim().toLowerCase();
    const haystack = `${item.orderNo} ${item.productName} ${item.status}`.toLowerCase();
    return (!query || haystack.includes(query)) && (statusFilter === "all" || item.status === statusFilter);
  });
  const filteredPayouts = payouts.filter((item) => {
    const query = search.trim().toLowerCase();
    const haystack = `${item.method} ${item.accountDetails} ${item.note} ${item.status}`.toLowerCase();
    return (!query || haystack.includes(query)) && (statusFilter === "all" || item.status === statusFilter);
  });
  const earningsPagination = useSmartPagination(filteredCommissions, { initialPageSize: 10, resetKey: `earnings-${search}-${statusFilter}` });
  const payoutPagination = useSmartPagination(filteredPayouts, { initialPageSize: 10, resetKey: `payouts-${search}-${statusFilter}` });
  const sellerShare = Number(stats.grossSales || 0) > 0 ? Math.min(100, (Number(stats.totalSellerEarnings || 0) / Number(stats.grossSales || 1)) * 100) : 0;
  const availableShare = Number(stats.totalSellerEarnings || 0) > 0 ? Math.min(100, (Number(stats.availableBalance || 0) / Number(stats.totalSellerEarnings || 1)) * 100) : 0;

  return (
    <section className="business-workspace-v2 business-management-v2 business-earnings-v2">
      <BusinessPageHeader
        eyebrow="Finance workspace"
        title="Earnings and payouts"
        description="Understand every completed sale, SmartSell fee, available balance, and payout request from one focused finance workspace."
        meta={<><span><BusinessIcon name="wallet" size={15} />{user?.businessName || user?.name || "Your business"}</span><BusinessStatusBadge status="active" /></>}
        actions={<><button className="business-ghost-button-v2" type="button" onClick={loadSummary}><BusinessIcon name="refresh" size={17} />Refresh</button><button className="business-primary-button-v2" type="button" onClick={() => setShowPayoutForm(true)} disabled={Number(stats.availableBalance || 0) <= 0}><BusinessIcon name="wallet" size={17} />Request payout</button></>}
      />

      {error && <div className="business-error-v2"><strong>Finance action needs attention</strong><p>{error}</p></div>}
      {statusMessage && <div className="bm-notice-v2 success"><BusinessIcon name="check" size={18} /><span>{statusMessage}</span></div>}
      {loading && <div className="business-loading-v2"><span /><p>Loading your finance workspace...</p></div>}

      {!loading && summary && <>
        <div className="business-metrics-grid-v2">
          <BusinessMetricCard icon="wallet" label="Available balance" value={formatMoney(stats.availableBalance)} note="Ready for a payout request" tone="blue" />
          <BusinessMetricCard icon="trend" label="Gross sales" value={formatMoney(stats.grossSales)} note={`${stats.totalCommissions || 0} delivered sale entries`} tone="emerald" />
          <BusinessMetricCard icon="percent" label="SmartSell fees" value={formatMoney(stats.platformCommission)} note="Marketplace commission deducted" tone="violet" />
          <BusinessMetricCard icon="check" label="Paid out" value={formatMoney(stats.paidOut)} note={`${stats.totalPayoutRequests || 0} payout requests`} tone="amber" />
        </div>

        <section className="bm-finance-overview-v2">
          <div className="bm-finance-overview-copy-v2">
            <span>Balance overview</span>
            <h2>Your revenue remains easy to verify</h2>
            <p>SmartSell creates an earning entry only after an order is delivered and paid. Payout requests reserve the requested balance until reviewed.</p>
          </div>
          <div className="bm-finance-progress-v2">
            <div><span><b>Seller share</b><em>{sellerShare.toFixed(0)}%</em></span><i><u style={{ width: `${sellerShare}%` }} /></i><small>{formatMoney(stats.totalSellerEarnings)} earned after commission</small></div>
            <div><span><b>Available now</b><em>{availableShare.toFixed(0)}%</em></span><i><u style={{ width: `${availableShare}%` }} /></i><small>{formatMoney(stats.pendingPayout)} currently pending payout</small></div>
          </div>
        </section>

        <section className="business-content-panel-v2 bm-management-panel-v2">
          <div className="business-tab-list-v2" role="tablist" aria-label="Finance records">
            <button type="button" role="tab" aria-selected={tab === "earnings"} className={tab === "earnings" ? "active" : ""} onClick={() => { setTab("earnings"); setStatusFilter("all"); }}><BusinessIcon name="trend" size={18} /><span>Earning ledger</span><b>{commissions.length}</b></button>
            <button type="button" role="tab" aria-selected={tab === "payouts"} className={tab === "payouts" ? "active" : ""} onClick={() => { setTab("payouts"); setStatusFilter("all"); }}><BusinessIcon name="history" size={18} /><span>Payout history</span><b>{payouts.length}</b></button>
          </div>
          <div className="business-tab-content-v2">
            <BusinessSearchToolbar
              value={search}
              onChange={setSearch}
              placeholder={tab === "earnings" ? "Search order number, product, or status" : "Search payout method, details, or status"}
              filter={<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>{tab === "earnings" ? <><option value="all">All earning statuses</option><option value="available">Available</option><option value="pending_payout">Pending payout</option><option value="paid">Paid</option><option value="cancelled">Cancelled</option></> : <><option value="all">All payout statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="paid">Paid</option><option value="rejected">Rejected</option></>}</select>}
            />

            {tab === "earnings" && (filteredCommissions.length ? <div className="business-table-panel-v2"><div className="business-table-scroll-v2"><table className="business-table-v2 bm-ledger-table-v2"><thead><tr><th>Order</th><th>Product</th><th>Gross sale</th><th>SmartSell fee</th><th>Your earning</th><th>Status</th><th aria-label="Open" /></tr></thead><tbody>{earningsPagination.items.map((item) => <ClickableLedgerRow key={item.id} onClick={() => setSelectedCommission(item)}><td><strong>{item.orderNo}</strong><small>{formatDate(item.createdAt)}</small></td><td>{item.productName}</td><td>{formatMoney(item.grossAmount)}</td><td><strong>{formatMoney(item.commissionAmount)}</strong><small>{item.commissionRate}% commission</small></td><td><strong>{formatMoney(item.sellerAmount)}</strong></td><td><BusinessStatusBadge status={item.status} /></td><td><BusinessIcon name="chevron" size={18} /></td></ClickableLedgerRow>)}</tbody></table></div><SmartPagination pagination={earningsPagination} label="earnings" /></div> : <BusinessEmptyState icon="trend" title="No earning entries found" description={commissions.length ? "Change the search term or status filter." : "Delivered and paid product orders will create earning entries here."} />)}

            {tab === "payouts" && (filteredPayouts.length ? <div className="bm-card-list-v2">{payoutPagination.items.map((item) => <article className="bm-clickable-row-v2" key={item.id} role="button" tabIndex="0" onClick={() => setSelectedPayout(item)} onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && setSelectedPayout(item)}><span className="bm-row-icon-v2 tone-violet"><BusinessIcon name="wallet" /></span><div className="bm-row-main-v2"><div><h3>{formatMoney(item.amount)}</h3><BusinessStatusBadge status={item.status} /></div><p>{readable(item.method)} · requested {formatDate(item.requestedAt)}</p><small>{item.accountDetails || "No payment details"}</small></div><BusinessIcon name="chevron" size={18} /></article>)}<SmartPagination pagination={payoutPagination} label="payouts" /></div> : <BusinessEmptyState icon="wallet" title="No payout requests found" description={payouts.length ? "Change the search term or status filter." : "Use Request payout when an available balance is ready."} />)}
          </div>
        </section>
      </>}

      <BusinessModal open={showPayoutForm} title="Request a payout" eyebrow="Available business balance" onClose={() => setShowPayoutForm(false)} size="medium">
        <form className="business-editor-v2" onSubmit={submitPayout}>
          <div className="bm-balance-callout-v2"><span>Available balance</span><strong>{formatMoney(stats.availableBalance)}</strong><small>Enter an amount up to this balance.</small></div>
          <div className="business-form-grid-v2 two-columns">
            <label><span>Amount</span><input name="amount" type="number" min="1" max={stats.availableBalance || undefined} value={payoutForm.amount} onChange={(event) => setPayoutForm((current) => ({ ...current, amount: event.target.value }))} required /></label>
            <label><span>Payment method</span><select name="method" value={payoutForm.method} onChange={(event) => setPayoutForm((current) => ({ ...current, method: event.target.value }))}><option value="bank_transfer">Bank transfer</option><option value="cash">Cash</option><option value="mobile_wallet">Mobile wallet</option><option value="other">Other</option></select></label>
          </div>
          <label><span>Account or payment details</span><textarea rows="4" value={payoutForm.accountDetails} onChange={(event) => setPayoutForm((current) => ({ ...current, accountDetails: event.target.value }))} placeholder="Bank name, account holder and account number" required /></label>
          <label><span>Note for SmartSell</span><textarea rows="3" value={payoutForm.note} onChange={(event) => setPayoutForm((current) => ({ ...current, note: event.target.value }))} placeholder="Optional payout note" /></label>
          <div className="business-modal-action-row-v2"><button className="business-ghost-button-v2" type="button" onClick={() => setShowPayoutForm(false)}>Cancel</button><button className="business-primary-button-v2" type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Submit payout request"}</button></div>
        </form>
      </BusinessModal>

      <BusinessModal open={Boolean(selectedCommission)} title={selectedCommission?.productName || "Earning details"} eyebrow={selectedCommission?.orderNo || "Commission entry"} onClose={() => setSelectedCommission(null)} size="medium">
        {selectedCommission && <><div className="business-modal-status-line-v2"><BusinessStatusBadge status={selectedCommission.status} /></div><BusinessInfoGrid items={[{ label: "Gross sale", value: formatMoney(selectedCommission.grossAmount) }, { label: "SmartSell fee", value: formatMoney(selectedCommission.commissionAmount) }, { label: "Commission rate", value: `${selectedCommission.commissionRate}%` }, { label: "Your earning", value: formatMoney(selectedCommission.sellerAmount) }, { label: "Order", value: selectedCommission.orderNo }, { label: "Created", value: formatDate(selectedCommission.createdAt) }]} /></>}
      </BusinessModal>

      <BusinessModal open={Boolean(selectedPayout)} title={selectedPayout ? formatMoney(selectedPayout.amount) : "Payout details"} eyebrow="Payout request" onClose={() => setSelectedPayout(null)} size="medium">
        {selectedPayout && <><div className="business-modal-status-line-v2"><BusinessStatusBadge status={selectedPayout.status} /></div><BusinessInfoGrid items={[{ label: "Amount", value: formatMoney(selectedPayout.amount) }, { label: "Method", value: readable(selectedPayout.method) }, { label: "Requested", value: formatDate(selectedPayout.requestedAt) }, { label: "Processed", value: formatDate(selectedPayout.processedAt) }]} /><div className="business-description-v2"><span>Payment details</span><p>{selectedPayout.accountDetails || "No payment details provided."}</p></div>{selectedPayout.note && <div className="business-note-v2"><strong>Your note</strong><p>{selectedPayout.note}</p></div>}{selectedPayout.adminNote && <div className="business-note-v2"><strong>SmartSell note</strong><p>{selectedPayout.adminNote}</p></div>}</>}
      </BusinessModal>
    </section>
  );
}
