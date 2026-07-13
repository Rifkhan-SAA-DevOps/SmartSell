import { useEffect, useMemo, useState } from "react";
import {
  AdminEmptyState,
  AdminIcon,
  AdminInfoGrid,
  AdminMetricCard,
  AdminModal,
  AdminPageHeader,
  AdminPagination,
  AdminSearchToolbar,
  AdminStatusBadge,
  useAdminPagination,
} from "../components/AdminWorkspaceUi.jsx";
import api from "../utils/api.js";
import "../styles/pages/admin/AdminWorkspaceV2.css";
import "../styles/pages/admin/AdminOperations.css";

function money(value) {
  return Number(value || 0).toLocaleString("en-LK", { maximumFractionDigits: 0 });
}

function titleCase(value) {
  return String(value || "").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-LK", { year: "numeric", month: "short", day: "2-digit" });
}

function ProgressList({ items, emptyText }) {
  const maximum = Math.max(...items.map((item) => Number(item.value || 0)), 1);
  if (!items.length) return <p className="admin-ops-muted-v2">{emptyText}</p>;
  return (
    <div className="admin-ops-progress-list-v2">
      {items.map((item) => {
        const percent = Math.max(4, Math.round((Number(item.value || 0) / maximum) * 100));
        return (
          <div className="admin-ops-progress-v2" key={item.label}>
            <div><span>{item.label}</span><strong>{money(item.value)}</strong></div>
            <i><b style={{ width: `${percent}%` }} /></i>
          </div>
        );
      })}
    </div>
  );
}

function TrendChart({ trends = [] }) {
  if (!trends.length) return <p className="admin-ops-muted-v2">No trend data is available yet.</p>;
  return (
    <div className="admin-ops-trend-v2" aria-label="Revenue and activity trend">
      {trends.map((item) => (
        <div key={item.key || item.label} title={`${item.label}: Rs. ${money(item.revenue)}`}>
          <span className="admin-ops-trend-bars-v2">
            <i style={{ height: `${Math.max(item.revenuePercent || 0, item.revenue ? 8 : 2)}%` }} />
            <b style={{ height: `${Math.max(item.activityPercent || 0, item.orders || item.requests ? 8 : 2)}%` }} />
          </span>
          <small>{item.label}</small>
        </div>
      ))}
    </div>
  );
}

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("orders");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  async function loadReports() {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/analytics/admin");
      setData(response.data.data || {});
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load SmartSell reports.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadReports(); }, []);

  const summary = data?.summary || {};
  const activity = useMemo(() => {
    const query = search.trim().toLowerCase();
    const source = tab === "orders" ? (data?.recentOrders || []) : tab === "stock" ? (data?.lowStockProducts || []) : (data?.recentAdminActions || []);
    return source.filter((item) => {
      const text = tab === "orders"
        ? `${item.orderNo} ${item.customer?.name} ${item.status} ${item.totalAmount}`
        : tab === "stock"
          ? `${item.name} ${item.category} ${item.stock} ${item.seller?.businessName || item.seller?.name} ${item.status}`
          : `${item.action} ${item.targetType} ${item.admin?.name} ${item.note}`;
      return !query || text.toLowerCase().includes(query);
    });
  }, [data, search, tab]);
  const pagination = useAdminPagination(activity, 10, [tab, search]);

  const categoryProducts = (data?.productCategories || []).map((item) => ({ label: item.name, value: item.count }));
  const categoryServices = (data?.serviceCategories || []).map((item) => ({ label: item.name, value: item.count }));
  const queue = [
    { label: "Pending products", value: summary.pendingProducts || 0 },
    { label: "Pending services", value: summary.pendingServices || 0 },
    { label: "Pending businesses", value: Number(summary.pendingUsers || 0) + Number(summary.pendingSellers || 0) },
    { label: "Open requests", value: summary.activeRequests || 0 },
    { label: "Active orders", value: summary.activeOrders || 0 },
  ];

  return (
    <section className="admin-workspace-v2 admin-operations-page-v2 admin-reports-v2">
      <AdminPageHeader
        eyebrow="Analytics & intelligence"
        title="Marketplace performance"
        description="Follow revenue, commission, marketplace activity, operational pressure, and recent platform changes from one focused reporting workspace."
        actions={<button className="admin-secondary-button-v2" type="button" onClick={loadReports} disabled={loading}><AdminIcon name="refresh" size={17} />{loading ? "Refreshing..." : "Refresh report"}</button>}
        meta={<><span>Last 30 days revenue: Rs. {money(summary.revenueLast30)}</span><span>Pending payouts: {summary.payoutsPending || 0}</span></>}
      />

      {error && <div className="admin-alert-v2 error">{error}</div>}

      <div className="admin-metrics-grid-v2 four">
        <AdminMetricCard icon="money" label="Paid revenue" value={`Rs. ${money(summary.revenueAllTime)}`} note={`Rs. ${money(summary.revenueLast30)} in 30 days`} tone="emerald" />
        <AdminMetricCard icon="report" label="SmartSell commission" value={`Rs. ${money(summary.commissionAllTime)}`} note={`Rs. ${money(summary.commissionLast30)} in 30 days`} tone="cyan" />
        <AdminMetricCard icon="order" label="Orders" value={summary.ordersTotal || 0} note={`${summary.activeOrders || 0} active · ${summary.deliveredOrders || 0} delivered`} tone="blue" />
        <AdminMetricCard icon="request" label="Custom requests" value={summary.requestsTotal || 0} note={`${summary.activeRequests || 0} active · ${summary.completedRequests || 0} completed`} tone="violet" />
      </div>

      <div className="admin-ops-mini-metrics-v2">
        {[
          ["Users", summary.usersTotal], ["Customers", summary.customersTotal], ["Business users", summary.sellersTotal], ["Products", summary.productsTotal],
          ["Services", summary.servicesTotal], ["Pending reviews", summary.pendingReviews], ["Unread messages", summary.unreadMessages], ["Pending payouts", summary.payoutsPending],
        ].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value || 0}</strong></div>)}
      </div>

      <div className="admin-ops-grid-v2 report-layout">
        <article className="admin-panel-v2 admin-ops-panel-v2 trend-panel">
          <div className="admin-panel-head-v2"><div><span className="admin-ops-eyebrow-v2">Eight-month trend</span><h2>Revenue and activity movement</h2><p>Revenue bars are blue; order and request activity bars are cyan.</p></div></div>
          <TrendChart trends={data?.trends || []} />
          <div className="admin-ops-legend-v2"><span><i className="revenue" />Paid revenue</span><span><i className="activity" />Orders + requests</span></div>
        </article>
        <article className="admin-panel-v2 admin-ops-panel-v2">
          <div className="admin-panel-head-v2"><div><span className="admin-ops-eyebrow-v2">Operational pressure</span><h2>Current review queue</h2><p>Relative workload across the most important admin queues.</p></div></div>
          <ProgressList items={queue} emptyText="No pending operational work." />
        </article>
      </div>

      <div className="admin-ops-grid-v2 categories">
        <article className="admin-panel-v2 admin-ops-panel-v2"><div className="admin-panel-head-v2"><div><span className="admin-ops-eyebrow-v2">Product discovery</span><h2>Top product categories</h2></div></div><ProgressList items={categoryProducts} emptyText="No approved product category data yet." /></article>
        <article className="admin-panel-v2 admin-ops-panel-v2"><div className="admin-panel-head-v2"><div><span className="admin-ops-eyebrow-v2">Service discovery</span><h2>Top service categories</h2></div></div><ProgressList items={categoryServices} emptyText="No approved service category data yet." /></article>
      </div>

      <article className="admin-panel-v2 admin-ops-panel-v2">
        <div className="admin-panel-head-v2 admin-ops-directory-head-v2">
          <div><span className="admin-ops-eyebrow-v2">Recent platform activity</span><h2>Operational directory</h2><p>Open any record for complete context without crowding the list.</p></div>
          <div className="admin-ops-tabs-v2" role="tablist">
            {[['orders','Orders'],['stock','Stock watch'],['audit','Admin activity']].map(([value,label]) => <button key={value} type="button" className={tab === value ? "active" : ""} onClick={() => setTab(value)}>{label}</button>)}
          </div>
        </div>
        <AdminSearchToolbar value={search} onChange={setSearch} placeholder={`Search ${tab === "audit" ? "admin activity" : tab}...`} />
        {loading ? <div className="admin-ops-loading-v2">Loading report data...</div> : !activity.length ? <AdminEmptyState icon="report" title="No matching report records" description="Try another tab or search term." /> : (
          <>
            <div className="admin-ops-record-list-v2">
              {pagination.items.map((item) => (
                <article className="admin-ops-record-v2" key={item.id} role="button" tabIndex="0" onClick={() => setSelected({ type: tab, item })} onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && setSelected({ type: tab, item })}>
                  <span className={`admin-ops-record-icon-v2 tone-${tab === "orders" ? "blue" : tab === "stock" ? "amber" : "violet"}`}><AdminIcon name={tab === "orders" ? "order" : tab === "stock" ? "box" : "activity"} /></span>
                  <div className="admin-ops-record-main-v2">
                    <strong>{tab === "orders" ? item.orderNo : tab === "stock" ? item.name : titleCase(item.action)}</strong>
                    <small>{tab === "orders" ? `${item.customer?.name || "Guest"} · ${formatDate(item.createdAt)}` : tab === "stock" ? `${item.category || "Uncategorized"} · ${item.seller?.businessName || item.seller?.name || "SmartSell"}` : `${item.admin?.name || "Admin"} · ${titleCase(item.targetType)} · ${formatDate(item.createdAt)}`}</small>
                  </div>
                  <div className="admin-ops-record-value-v2">{tab === "orders" ? `Rs. ${money(item.totalAmount)}` : tab === "stock" ? `${item.stock || 0} units` : item.note || "View details"}</div>
                  {tab !== "audit" && <AdminStatusBadge status={item.status || (Number(item.stock || 0) <= 0 ? "out_of_stock" : "low_stock")} />}
                  <AdminIcon name="chevron" size={17} />
                </article>
              ))}
            </div>
            <AdminPagination pagination={pagination} />
          </>
        )}
      </article>

      <AdminModal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.type === "orders" ? selected?.item?.orderNo : selected?.type === "stock" ? selected?.item?.name : titleCase(selected?.item?.action)} eyebrow="Report record">
        {selected?.item && <>
          <AdminInfoGrid items={selected.type === "orders" ? [
            { label: "Customer", value: selected.item.customer?.name || "Guest" }, { label: "Order total", value: `Rs. ${money(selected.item.totalAmount)}` }, { label: "Status", value: titleCase(selected.item.status) }, { label: "Created", value: formatDate(selected.item.createdAt) },
          ] : selected.type === "stock" ? [
            { label: "Category", value: selected.item.category || "Uncategorized" }, { label: "Stock", value: `${selected.item.stock || 0} units` }, { label: "Seller", value: selected.item.seller?.businessName || selected.item.seller?.name || "SmartSell" }, { label: "Listing status", value: titleCase(selected.item.status) },
          ] : [
            { label: "Administrator", value: selected.item.admin?.name || "Admin" }, { label: "Action", value: titleCase(selected.item.action) }, { label: "Area", value: titleCase(selected.item.targetType) }, { label: "Date", value: formatDate(selected.item.createdAt) },
          ]} />
          {selected.item.note && <div className="admin-note-v2"><strong>Activity note</strong><p>{selected.item.note}</p></div>}
        </>}
      </AdminModal>
    </section>
  );
}
