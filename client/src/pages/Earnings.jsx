import { useEffect, useMemo, useState } from "react";
import SectionHeader from "../components/SectionHeader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../utils/api.js";
import "../styles/pages/business/SellerBusinessWorkspace.css";

function money(value) {
  return Number(value || 0).toLocaleString("en-LK");
}

function formatStatus(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function StatusPill({ status }) {
  return <span className={`status-pill status-${String(status || "").replaceAll("_", "-")}`}>{formatStatus(status)}</span>;
}

function FinanceStat({ icon, label, value, hint }) {
  return (
    <article className="finance-stat-card">
      <div className="finance-stat-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <p>{hint}</p>
      </div>
    </article>
  );
}

export default function Earnings() {
  const { user } = useAuth();
  const isAdmin = ["admin", "super_admin"].includes(user?.role);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [payoutForm, setPayoutForm] = useState({
    amount: "",
    method: "bank_transfer",
    accountDetails: "",
    note: "",
  });

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

  useEffect(() => {
    loadSummary();
  }, []);

  const stats = summary?.stats || {};

  const sellerStats = useMemo(
    () => [
      { icon: "💰", label: "Available Balance", value: `Rs. ${money(stats.availableBalance)}`, hint: "Ready to request payout" },
      { icon: "📈", label: "Gross Sales", value: `Rs. ${money(stats.grossSales)}`, hint: "Total delivered paid item value" },
      { icon: "🏦", label: "Platform Commission", value: `Rs. ${money(stats.platformCommission)}`, hint: "SmartSell service fee" },
      { icon: "✅", label: "Paid Out", value: `Rs. ${money(stats.paidOut)}`, hint: "Completed seller payouts" },
    ],
    [stats]
  );

  const adminStats = useMemo(
    () => [
      { icon: "📊", label: "Gross Sales", value: `Rs. ${money(stats.grossSales)}`, hint: "All paid platform sales" },
      { icon: "🏦", label: "Platform Commission", value: `Rs. ${money(stats.platformCommission)}`, hint: "SmartSell income from commissions" },
      { icon: "🤝", label: "Seller Earnings", value: `Rs. ${money(stats.sellerEarnings)}`, hint: "Amount owed/paid to sellers" },
      { icon: "⏳", label: "Pending Payouts", value: `Rs. ${money(stats.pendingPayoutAmount)}`, hint: "Payouts waiting for action" },
    ],
    [stats]
  );

  function updateForm(event) {
    const { name, value } = event.target;
    setPayoutForm((current) => ({ ...current, [name]: value }));
  }

  async function submitPayout(event) {
    event.preventDefault();
    try {
      setStatus("Submitting payout request...");
      setError("");
      await api.post("/finance/payouts", payoutForm);
      setStatus("Payout request submitted for admin review.");
      setPayoutForm({ amount: "", method: "bank_transfer", accountDetails: "", note: "" });
      await loadSummary();
    } catch (err) {
      setStatus("");
      setError(err.response?.data?.message || "Payout request failed.");
    }
  }

  async function updatePayout(payout, nextStatus) {
    try {
      setStatus("Updating payout...");
      await api.patch(`/finance/payouts/${payout.id}/status`, { status: nextStatus });
      setStatus(`Payout marked as ${formatStatus(nextStatus)}.`);
      await loadSummary();
    } catch (err) {
      setError(err.response?.data?.message || "Payout update failed.");
    }
  }

  return (
    <section className="page section finance-page seller-business-polish finance-command-page">
      <SectionHeader
        eyebrow="Finance Center"
        title={isAdmin ? "Payments, commissions and seller payouts" : "Seller earnings and payout requests"}
        description={
          isAdmin
            ? "Track paid orders, SmartSell commission income, seller earnings, and payout requests from one management page."
            : "View your earnings from delivered paid orders and request payouts when your balance is available."
        }
      />

      {loading && <p className="form-status">Loading finance details...</p>}
      {error && <div className="form-alert spaced-alert">{error}</div>}
      {status && <div className="success-alert spaced-alert">{status}</div>}

      <div className="finance-stat-grid">
        {(isAdmin ? adminStats : sellerStats).map((item) => (
          <FinanceStat key={item.label} {...item} />
        ))}
      </div>

      {!isAdmin && (
        <div className="finance-layout-grid">
          <form className="auth-card finance-form-card" onSubmit={submitPayout}>
            <h3>Request Payout</h3>
            <p>Ask admin to release your available seller balance.</p>
            <label>
              Amount
              <input name="amount" type="number" min="1" max={stats.availableBalance || undefined} value={payoutForm.amount} onChange={updateForm} placeholder="Example: 5000" required />
            </label>
            <label>
              Method
              <select name="method" value={payoutForm.method} onChange={updateForm}>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="mobile_wallet">Mobile Wallet</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label>
              Account / Payment Details
              <textarea name="accountDetails" rows="4" value={payoutForm.accountDetails} onChange={updateForm} placeholder="Bank name, account number, account holder name or payment details" required />
            </label>
            <label>
              Note
              <textarea name="note" rows="3" value={payoutForm.note} onChange={updateForm} placeholder="Optional note for admin" />
            </label>
            <button className="primary-btn" type="submit">Submit Payout Request</button>
          </form>

          <div className="finance-help-card">
            <div className="finance-help-icon">🛡️</div>
            <h3>How earnings work</h3>
            <p>When admin marks an order as delivered and paid, SmartSell creates a seller earning automatically.</p>
            <ul>
              <li>Gross sale = product price × quantity</li>
              <li>SmartSell commission = 10%</li>
              <li>Seller earning = remaining 90%</li>
              <li>Payout requests are reviewed by admin</li>
            </ul>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="admin-table finance-table-panel">
          <h3>Seller Payout Requests</h3>
          <table>
            <thead>
              <tr><th>Seller</th><th>Amount</th><th>Method</th><th>Details</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {summary?.payouts?.length ? summary.payouts.map((payout) => (
                <tr key={payout.id}>
                  <td>{payout.seller?.name || "Seller"}<br /><small>{payout.seller?.email || "-"}</small></td>
                  <td>Rs. {money(payout.amount)}</td>
                  <td>{formatStatus(payout.method)}</td>
                  <td><small>{payout.accountDetails || "-"}</small></td>
                  <td><StatusPill status={payout.status} /></td>
                  <td>
                    <div className="row-actions stacked-actions">
                      <button className="approve-btn" type="button" onClick={() => updatePayout(payout, "approved")}>Approve</button>
                      <button className="approve-btn" type="button" onClick={() => updatePayout(payout, "paid")}>Mark Paid</button>
                      <button className="reject-btn" type="button" onClick={() => updatePayout(payout, "rejected")}>Reject</button>
                    </div>
                  </td>
                </tr>
              )) : <tr><td colSpan="6">No payout requests yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <div className="admin-table finance-table-panel">
        <h3>{isAdmin ? "Commission Ledger" : "My Earning Ledger"}</h3>
        <table>
          <thead>
            <tr><th>Order</th><th>Product</th><th>Gross</th><th>SmartSell Fee</th><th>Seller Amount</th><th>Status</th></tr>
          </thead>
          <tbody>
            {summary?.commissions?.length ? summary.commissions.map((commission) => (
              <tr key={commission.id}>
                <td>{commission.orderNo}</td>
                <td>{commission.productName}</td>
                <td>Rs. {money(commission.grossAmount)}</td>
                <td>{commission.commissionRate}%<br /><small>Rs. {money(commission.commissionAmount)}</small></td>
                <td>Rs. {money(commission.sellerAmount)}</td>
                <td><StatusPill status={commission.status} /></td>
              </tr>
            )) : <tr><td colSpan="6">No earnings yet. Delivered + paid seller orders will appear here.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
