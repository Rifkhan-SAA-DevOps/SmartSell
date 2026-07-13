import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../utils/api.js";
import { useRealtime } from "../context/RealtimeContext.jsx";
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

const typeIcons = { order: "order", request: "request", approval: "check", review: "star", message: "message", payout: "money", delivery: "box", support: "support" };
function readable(value) { return String(value || "notification").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function formatTime(value) { if (!value) return ""; const date = new Date(value); return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" }); }

export default function Notifications() {
  const navigate = useNavigate();
  const { connected, lastNotification, refreshSummary } = useRealtime();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  async function loadNotifications() {
    setLoading(true); setError("");
    try {
      const { data } = await api.get("/communication/notifications");
      setNotifications(data.data.items || []); setUnreadCount(data.data.unreadCount || 0); await refreshSummary();
    } catch (err) { setError(err.response?.data?.message || "Failed to load notifications."); }
    finally { setLoading(false); }
  }
  async function markRead(id, reload = true) { await api.patch(`/communication/notifications/${id}/read`); if (reload) await loadNotifications(); }
  async function markAllRead() { await api.patch("/communication/notifications/read-all"); await loadNotifications(); }
  async function openNotification(item) {
    setSelected(item);
    if (!item.isRead) {
      try {
        await markRead(item.id, false);
        setNotifications((current) => current.map((notification) => notification.id === item.id ? { ...notification, isRead: true } : notification));
        setUnreadCount((current) => Math.max(0, current - 1));
        await refreshSummary();
      } catch { /* Keep the detail view available even if read state fails. */ }
    }
  }

  useEffect(() => { loadNotifications(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  useEffect(() => {
    const notification = lastNotification?.notification;
    if (!notification?.id) return;
    setNotifications((current) => current.some((item) => item.id === notification.id) ? current : [notification, ...current]);
    setUnreadCount((current) => current + 1);
  }, [lastNotification]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return notifications.filter((item) => {
      const matchesFilter = filter === "all" || (filter === "unread" ? !item.isRead : filter === "read" ? item.isRead : item.type === filter);
      return matchesFilter && (!query || `${item.title} ${item.message} ${item.type}`.toLowerCase().includes(query));
    });
  }, [notifications, search, filter]);
  const pagination = useSmartPagination(filtered, { initialPageSize: 10, resetKey: `${search}-${filter}` });

  return (
    <section className="ca-account-page ca-notifications-page">
      <AccountPageHeader eyebrow="Live updates" title="Notifications" description="Important order, request, message, support, and account updates in one focused timeline." icon="bell" actions={<><span className={`ca-live-badge ${connected ? "is-live" : ""}`}><i />{connected ? "Live" : "Offline"}</span><button className="ca-button ca-button--soft" type="button" onClick={markAllRead} disabled={!unreadCount}>Mark all read</button></>} />

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
      ) : <>
        <div className="ca-notification-list">
          {pagination.items.map((item) => (
            <article className={`ca-notification-row ${item.isRead ? "is-read" : "is-unread"}`} key={item.id} role="button" tabIndex="0" onClick={() => openNotification(item)} onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && openNotification(item)}>
              <span className={`ca-notification-row__icon tone-${item.isRead ? "slate" : "violet"}`}><AccountIcon name={typeIcons[item.type] || "bell"} size={20} /></span>
              <div><div className="ca-notification-row__title"><h3>{item.title}</h3>{!item.isRead && <span>New</span>}</div><p>{item.message}</p><small>{readable(item.type)} · {formatTime(item.createdAt)}</small></div>
              <span className="ca-record-card__open">View <AccountIcon name="chevron" size={16} /></span>
            </article>
          ))}
        </div>
        <SmartPagination pagination={pagination} label="notifications" compact />
      </>}

      <AccountModal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.title || "Notification"} eyebrow={readable(selected?.type)} icon={typeIcons[selected?.type] || "bell"}>
        {selected && <><div className="ca-note ca-note--large"><p>{selected.message}</p></div><AccountDetailGrid items={[{ label: "Type", value: readable(selected.type) }, { label: "Received", value: formatTime(selected.createdAt) }, { label: "Status", value: selected.isRead ? "Read" : "Unread" }]} />{selected.link && <div className="ca-modal-actions"><button className="ca-button ca-button--primary" type="button" onClick={() => { setSelected(null); navigate(selected.link); }}>Open related page <AccountIcon name="arrow" size={16} /></button></div>}</>}
      </AccountModal>
    </section>
  );
}
