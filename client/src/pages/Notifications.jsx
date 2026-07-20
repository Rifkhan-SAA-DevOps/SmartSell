import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useRealtime } from "../context/RealtimeContext.jsx";
import SmartPagination from "../components/SmartPagination.jsx";
import {
  AccountEmpty,
  AccountIcon,
  AccountModal,
  AccountPageHeader,
  AccountSearch,
  AccountStatGrid,
  AccountToolbar,
} from "../components/CustomerAccountUi.jsx";
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
import useSmartPagination from "../hooks/useSmartPagination.js";
import "../styles/pages/admin/AdminWorkspaceV2.css";
import "../styles/pages/admin/AdminAccountCenter.css";

const adminTypeIcons = {
  order: "order",
  request: "request",
  approval: "check",
  review: "star",
  message: "inbox",
  payout: "money",
  delivery: "delivery",
  support: "alert",
  security: "shield",
  listing: "list",
  user: "users",
};

const customerTypeIcons = {
  order: "order",
  request: "request",
  approval: "check",
  review: "star",
  message: "message",
  payout: "money",
  delivery: "box",
  support: "support",
  security: "shield",
  listing: "box",
  user: "user",
};

function readable(value) {
  return String(value || "notification")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" });
}

export default function Notifications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { connected, lastNotification, refreshSummary } = useRealtime();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const isAdmin = ["admin", "super_admin"].includes(user?.role);

  async function loadNotifications() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/communication/notifications");
      setNotifications(data.data.items || []);
      setUnreadCount(data.data.unreadCount || 0);
      await refreshSummary();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }

  async function markRead(id, reload = true) {
    await api.patch(`/communication/notifications/${id}/read`);
    if (reload) await loadNotifications();
  }

  async function markAllRead() {
    await api.patch("/communication/notifications/read-all");
    await loadNotifications();
  }

  async function openNotification(item) {
    setSelected(item);
    if (!item.isRead) {
      try {
        await markRead(item.id, false);
        setNotifications((current) => current.map((notification) => (
          notification.id === item.id ? { ...notification, isRead: true } : notification
        )));
        setUnreadCount((current) => Math.max(0, current - 1));
        await refreshSummary();
      } catch {
        // Keep the detail view available even if read state fails.
      }
    }
  }

  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const notification = lastNotification?.notification;
    if (!notification?.id) return;
    setNotifications((current) => (
      current.some((item) => item.id === notification.id) ? current : [notification, ...current]
    ));
    setUnreadCount((current) => current + 1);
  }, [lastNotification]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return notifications.filter((item) => {
      const matchesFilter = filter === "all"
        || (filter === "unread" ? !item.isRead : filter === "read" ? item.isRead : item.type === filter);
      return matchesFilter && (!query || `${item.title} ${item.message} ${item.type}`.toLowerCase().includes(query));
    });
  }, [notifications, search, filter]);

  const customerPagination = useSmartPagination(filtered, {
    initialPageSize: 10,
    resetKey: `${search}-${filter}`,
  });
  const adminPagination = useAdminPagination(filtered, 10, [search, filter]);

  const operationalCount = notifications.filter((item) => [
    "approval", "listing", "order", "request", "support", "security", "delivery",
  ].includes(item.type)).length;

  if (isAdmin) {
    return (
      <section className="admin-workspace-v2 admin-account-center-v2 admin-notifications-center-v2">
        <AdminPageHeader
          eyebrow="Administration communication"
          title="Notification Center"
          description="Review approvals, operational alerts, account activity, support escalations, and platform events from one focused admin timeline."
          meta={<span className={`admin-live-state-v2 ${connected ? "is-live" : ""}`}><i />{connected ? "Realtime connected" : "Realtime offline"}</span>}
          actions={(
            <div className="admin-account-header-actions-v2">
              <button className="admin-action-button-v2 secondary" type="button" onClick={loadNotifications} disabled={loading}>
                <AdminIcon name="refresh" size={17} /> Refresh
              </button>
              <button className="admin-action-button-v2 primary" type="button" onClick={markAllRead} disabled={!unreadCount}>
                <AdminIcon name="check" size={17} /> Mark all read
              </button>
            </div>
          )}
        />

        <div className="admin-account-metrics-v2">
          <AdminMetricCard icon="alert" label="Unread" value={unreadCount} note="Needs administrative review" tone="rose" />
          <AdminMetricCard icon="inbox" label="All notifications" value={notifications.length} note="Complete notification history" tone="blue" />
          <AdminMetricCard icon="activity" label="Operational" value={operationalCount} note="Approvals, orders, requests, and support" tone="amber" />
          <AdminMetricCard icon="shield" label="Connection" value={connected ? "Live" : "Offline"} note="Realtime delivery status" tone="emerald" />
        </div>

        <section className="admin-directory-panel-v2 admin-notification-directory-v2">
          <div className="admin-directory-heading-v2">
            <div>
              <span>Admin timeline</span>
              <h2>Platform notifications</h2>
              <p>{filtered.length} notification{filtered.length === 1 ? "" : "s"} match the current view.</p>
            </div>
          </div>

          <AdminSearchToolbar
            value={search}
            onChange={setSearch}
            placeholder="Search title, message, or notification type..."
            filters={(
              <label className="admin-select-control-v2">
                <AdminIcon name="filter" size={17} />
                <select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter notifications">
                  <option value="all">All updates</option>
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                  <option value="approval">Approvals</option>
                  <option value="order">Orders</option>
                  <option value="request">Requests</option>
                  <option value="message">Messages</option>
                  <option value="support">Support</option>
                  <option value="security">Security</option>
                </select>
              </label>
            )}
          />

          {error && <div className="admin-account-alert-v2 error">{error}</div>}
          {loading ? (
            <div className="admin-account-loading-v2"><span /><p>Loading administrative notifications...</p></div>
          ) : filtered.length === 0 ? (
            <AdminEmptyState
              icon="inbox"
              title="No notifications found"
              description={notifications.length ? "Try another search or filter." : "Platform and operational updates will appear here."}
            />
          ) : (
            <>
              <div className="admin-notification-list-v2">
                {adminPagination.items.map((item) => (
                  <article
                    className={`admin-notification-row-v2 ${item.isRead ? "is-read" : "is-unread"}`}
                    key={item.id}
                    role="button"
                    tabIndex="0"
                    onClick={() => openNotification(item)}
                    onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && openNotification(item)}
                  >
                    <span className={`admin-notification-icon-v2 type-${item.type || "general"}`}>
                      <AdminIcon name={adminTypeIcons[item.type] || "inbox"} size={20} />
                    </span>
                    <div className="admin-notification-copy-v2">
                      <div>
                        <h3>{item.title}</h3>
                        {!item.isRead && <AdminStatusBadge status="pending" label="New" />}
                      </div>
                      <p>{item.message}</p>
                      <small>{readable(item.type)} · {formatTime(item.createdAt)}</small>
                    </div>
                    <span className="admin-row-open-v2">Review <AdminIcon name="chevron" size={16} /></span>
                  </article>
                ))}
              </div>
              <AdminPagination pagination={adminPagination} />
            </>
          )}
        </section>

        <AdminModal
          open={Boolean(selected)}
          onClose={() => setSelected(null)}
          title={selected?.title || "Notification"}
          eyebrow={readable(selected?.type)}
          size="medium"
          footer={selected?.link ? (
            <button className="admin-action-button-v2 primary" type="button" onClick={() => { setSelected(null); navigate(selected.link); }}>
              Open related workspace <AdminIcon name="arrow" size={16} />
            </button>
          ) : null}
        >
          {selected && (
            <div className="admin-notification-detail-v2">
              <div className="admin-account-note-v2"><AdminIcon name={adminTypeIcons[selected.type] || "inbox"} size={21} /><p>{selected.message}</p></div>
              <AdminInfoGrid items={[
                { label: "Notification type", value: readable(selected.type) },
                { label: "Received", value: formatTime(selected.createdAt) },
                { label: "Read state", value: selected.isRead ? "Read" : "Unread" },
                { label: "Related workspace", value: selected.link || "No linked page" },
              ]} />
            </div>
          )}
        </AdminModal>
      </section>
    );
  }

  return (
    <section className="ca-account-page ca-notifications-page">
      <AccountPageHeader
        eyebrow="Live updates"
        title="Notifications"
        description="Important order, request, message, support, and account updates in one focused timeline."
        icon="bell"
        actions={(
          <>
            <span className={`ca-live-badge ${connected ? "is-live" : ""}`}><i />{connected ? "Live" : "Offline"}</span>
            <button className="ca-button ca-button--soft" type="button" onClick={markAllRead} disabled={!unreadCount}>Mark all read</button>
          </>
        )}
      />

      <AccountStatGrid items={[
        { label: "Unread", value: unreadCount, note: "Needs your attention", icon: "bell", tone: "rose" },
        { label: "All updates", value: notifications.length, note: "Notification history", icon: "activity", tone: "violet" },
        { label: "Connection", value: connected ? "Live" : "Offline", note: "Realtime status", icon: "message", tone: "emerald" },
      ]} />

      <AccountToolbar resultText={`${filtered.length} notification${filtered.length === 1 ? "" : "s"}`}>
        <AccountSearch value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search notification title or message..." />
        <label className="ca-select-filter"><AccountIcon name="filter" size={17} /><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All updates</option><option value="unread">Unread</option><option value="read">Read</option><option value="order">Orders</option><option value="request">Requests</option><option value="message">Messages</option><option value="support">Support</option></select></label>
      </AccountToolbar>

      {error && <div className="ca-alert ca-alert--error">{error}</div>}
      {loading ? <div className="ca-loading">Loading notifications...</div> : filtered.length === 0 ? (
        <AccountEmpty icon="bell" title="No notifications found" text={notifications.length ? "Try another search or filter." : "Important SmartSell updates will appear here."} />
      ) : (
        <>
          <div className="ca-notification-list">
            {customerPagination.items.map((item) => (
              <article className={`ca-notification-row ${item.isRead ? "is-read" : "is-unread"}`} key={item.id} role="button" tabIndex="0" onClick={() => openNotification(item)} onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && openNotification(item)}>
                <span className={`ca-notification-row__icon tone-${item.isRead ? "slate" : "violet"}`}><AccountIcon name={customerTypeIcons[item.type] || "bell"} size={20} /></span>
                <div><div className="ca-notification-row__title"><h3>{item.title}</h3>{!item.isRead && <span>New</span>}</div><p>{item.message}</p><small>{readable(item.type)} · {formatTime(item.createdAt)}</small></div>
                <span className="ca-record-card__open">View <AccountIcon name="chevron" size={16} /></span>
              </article>
            ))}
          </div>
          <SmartPagination pagination={customerPagination} label="notifications" compact />
        </>
      )}

      <AccountModal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.title || "Notification"} eyebrow={readable(selected?.type)} icon={customerTypeIcons[selected?.type] || "bell"}>
        {selected && <><div className="ca-note ca-note--large"><p>{selected.message}</p></div>{selected.link && <div className="ca-modal-actions"><button className="ca-button ca-button--primary" type="button" onClick={() => { setSelected(null); navigate(selected.link); }}>Open related page <AccountIcon name="arrow" size={16} /></button></div>}</>}
      </AccountModal>
    </section>
  );
}
