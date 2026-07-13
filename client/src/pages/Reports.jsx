import { useEffect, useMemo, useState } from "react";
import SectionHeader from "../components/SectionHeader.jsx";
import api from "../utils/api.js";

function money(value) {
  return Number(value || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-LK", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function formatStatus(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function MetricCard({ icon, label, value, hint, tone = "blue" }) {
  return (
    <article className={`report-metric-card tone-${tone}`}>
      <div className="report-metric-icon" aria-hidden="true">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <p>{hint}</p>
      </div>
    </article>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="report-mini-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ProgressRow({ label, value, total, suffix = "" }) {
  const percent = total > 0 ? Math.min(100, Math.round((Number(value || 0) / total) * 100)) : 0;
  return (
    <div className="report-progress-row">
      <div>
        <span>{label}</span>
        <strong>{Number(value || 0).toLocaleString("en-LK")}{suffix}</strong>
      </div>
      <div className="report-progress-track" aria-label={`${label} ${percent}%`}>
        <i style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function TrendBars({ trends }) {
  return (
    <div className="trend-bars" aria-label="Monthly performance trend">
      {trends.map((item) => (
        <div className="trend-bar-item" key={item.key} title={`${item.label}: Rs. ${money(item.revenue)} revenue`}>
          <div className="trend-bar-stack">
            <i className="trend-bar-revenue" style={{ height: `${Math.max(item.revenuePercent, item.revenue ? 8 : 2)}%` }} />
            <b className="trend-bar-activity" style={{ height: `${Math.max(item.activityPercent, item.orders || item.requests ? 8 : 2)}%` }} />
          </div>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadReports() {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/analytics/admin");
      setData(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load SmartSell reports.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  const summary = data?.summary || {};
  const maxProductCategory = useMemo(() => Math.max(...(data?.productCategories || []).map((item) => item.count), 1), [data]);
  const maxServiceCategory = useMemo(() => Math.max(...(data?.serviceCategories || []).map((item) => item.count), 1), [data]);

  return (
    <section className="section report-page">
      <div className="report-hero">
        <SectionHeader
          eyebrow="SmartSell Reports"
          title="Business analytics & performance center"
          description="Track marketplace growth, revenue, pending work, orders, requests, stock, and admin activity from one professional dashboard."
        />
        <button className="secondary-btn" type="button" onClick={loadReports}>Refresh Reports</button>
      </div>

      {loading && <div className="report-loading-card">Loading SmartSell business reports...</div>}
      {error && <div className="form-status error">{error}</div>}

      <div className="report-metric-grid">
        <MetricCard icon="₨" label="Paid Revenue" value={`Rs. ${money(summary.revenueAllTime)}`} hint={`Last 30 days: Rs. ${money(summary.revenueLast30)}`} tone="green" />
        <MetricCard icon="%" label="SmartSell Commission" value={`Rs. ${money(summary.commissionAllTime)}`} hint={`Last 30 days: Rs. ${money(summary.commissionLast30)}`} tone="cyan" />
        <MetricCard icon="📦" label="Orders" value={summary.ordersTotal || 0} hint={`${summary.activeOrders || 0} active · ${summary.deliveredOrders || 0} delivered`} />
        <MetricCard icon="📋" label="Custom Requests" value={summary.requestsTotal || 0} hint={`${summary.activeRequests || 0} active · ${summary.completedRequests || 0} completed`} tone="purple" />
      </div>

      <div className="report-mini-grid">
        <MiniStat label="Users" value={summary.usersTotal || 0} />
        <MiniStat label="Customers" value={summary.customersTotal || 0} />
        <MiniStat label="Sellers / Providers" value={summary.sellersTotal || 0} />
        <MiniStat label="Products" value={summary.productsTotal || 0} />
        <MiniStat label="Services" value={summary.servicesTotal || 0} />
        <MiniStat label="Pending Reviews" value={summary.pendingReviews || 0} />
        <MiniStat label="Unread Messages" value={summary.unreadMessages || 0} />
        <MiniStat label="Pending Payouts" value={summary.payoutsPending || 0} />
      </div>

      <div className="report-grid-two">
        <article className="report-panel wide-panel">
          <div className="report-panel-head">
            <div>
              <span className="eyebrow">Growth Trend</span>
              <h2>Revenue, orders & requests</h2>
            </div>
            <small>Last 8 months</small>
          </div>
          <TrendBars trends={data?.trends || []} />
          <div className="report-legend">
            <span><i className="legend-revenue" /> Paid revenue</span>
            <span><i className="legend-activity" /> Orders + requests</span>
          </div>
        </article>

        <article className="report-panel">
          <div className="report-panel-head compact">
            <div>
              <span className="eyebrow">Work Queue</span>
              <h2>Pending tasks</h2>
            </div>
          </div>
          <ProgressRow label="Pending Products" value={summary.pendingProducts} total={summary.productsTotal || 1} />
          <ProgressRow label="Pending Services" value={summary.pendingServices} total={summary.servicesTotal || 1} />
          <ProgressRow label="Pending Sellers" value={summary.pendingUsers + (summary.pendingSellers || 0)} total={summary.usersTotal || 1} />
          <ProgressRow label="Open Requests" value={summary.activeRequests} total={summary.requestsTotal || 1} />
          <ProgressRow label="Active Orders" value={summary.activeOrders} total={summary.ordersTotal || 1} />
        </article>
      </div>

      <div className="report-grid-two">
        <article className="report-panel">
          <div className="report-panel-head compact">
            <div>
              <span className="eyebrow">Products</span>
              <h2>Top categories</h2>
            </div>
          </div>
          {(data?.productCategories || []).length ? (data?.productCategories || []).map((item) => (
            <ProgressRow key={item.id} label={item.name} value={item.count} total={maxProductCategory} />
          )) : <p className="empty-copy">No approved product category data yet.</p>}
        </article>

        <article className="report-panel">
          <div className="report-panel-head compact">
            <div>
              <span className="eyebrow">Services</span>
              <h2>Top categories</h2>
            </div>
          </div>
          {(data?.serviceCategories || []).length ? (data?.serviceCategories || []).map((item) => (
            <ProgressRow key={item.id} label={item.name} value={item.count} total={maxServiceCategory} />
          )) : <p className="empty-copy">No approved service category data yet.</p>}
        </article>
      </div>

      <div className="report-grid-two align-start">
        <article className="report-panel table-panel">
          <div className="report-panel-head compact">
            <div>
              <span className="eyebrow">Recent Orders</span>
              <h2>Latest customer orders</h2>
            </div>
          </div>
          <div className="table-scroll">
            <table className="smart-table report-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recentOrders || []).length ? (data?.recentOrders || []).map((order) => (
                  <tr key={order.id}>
                    <td><strong>{order.orderNo}</strong></td>
                    <td>{order.customer?.name || "Guest"}</td>
                    <td><span className={`status-pill status-${String(order.status).replaceAll("_", "-")}`}>{formatStatus(order.status)}</span></td>
                    <td>Rs. {money(order.totalAmount)}</td>
                    <td>{formatDate(order.createdAt)}</td>
                  </tr>
                )) : <tr><td colSpan="5">No orders yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </article>

        <article className="report-panel table-panel">
          <div className="report-panel-head compact">
            <div>
              <span className="eyebrow">Stock Watch</span>
              <h2>Low-stock listings</h2>
            </div>
          </div>
          <div className="table-scroll">
            <table className="smart-table report-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Stock</th>
                  <th>Seller</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(data?.lowStockProducts || []).length ? (data?.lowStockProducts || []).map((product) => (
                  <tr key={product.id}>
                    <td><strong>{product.name}</strong><small>{product.category || "Uncategorized"}</small></td>
                    <td>{product.stock}</td>
                    <td>{product.seller?.businessName || product.seller?.name || "SmartSell"}</td>
                    <td><span className={`status-pill status-${String(product.status).replaceAll("_", "-")}`}>{formatStatus(product.status)}</span></td>
                  </tr>
                )) : <tr><td colSpan="4">No low-stock items.</td></tr>}
              </tbody>
            </table>
          </div>
        </article>
      </div>

      <article className="report-panel">
        <div className="report-panel-head compact">
          <div>
            <span className="eyebrow">Admin Activity</span>
            <h2>Latest management actions</h2>
          </div>
        </div>
        <div className="admin-activity-feed">
          {(data?.recentAdminActions || []).length ? (data?.recentAdminActions || []).map((action) => (
            <div className="admin-activity-item" key={action.id}>
              <span>◆</span>
              <div>
                <strong>{formatStatus(action.action)}</strong>
                <p>{action.admin?.name || "Admin"} · {formatStatus(action.targetType)} · {formatDate(action.createdAt)}</p>
                {action.note && <small>{action.note}</small>}
              </div>
            </div>
          )) : <p className="empty-copy">No admin activity has been recorded yet.</p>}
        </div>
      </article>
    </section>
  );
}
