import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api.js";
import { useRealtime } from "../context/RealtimeContext.jsx";

function typeIcon(type) {
  const map = {
    order: "OR",
    request: "RQ",
    approval: "AP",
    review: "RV",
    message: "MS",
    payout: "RS",
    delivery: "DL",
    support: "SP",
  };
  return map[type] || "NT";
}

function formatTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString();
}

export default function Notifications() {
  const { connected, lastNotification, refreshSummary } = useRealtime();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const grouped = useMemo(() => {
    const unread = notifications.filter((item) => !item.isRead);
    const read = notifications.filter((item) => item.isRead);
    return { unread, read };
  }, [notifications]);

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

  async function markRead(id) {
    await api.patch(`/communication/notifications/${id}/read`);
    await loadNotifications();
  }

  async function markAllRead() {
    await api.patch("/communication/notifications/read-all");
    await loadNotifications();
  }

  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const notification = lastNotification?.notification;
    if (!notification?.id) return;

    setNotifications((current) => {
      if (current.some((item) => item.id === notification.id)) return current;
      return [notification, ...current];
    });
    setUnreadCount((current) => current + 1);
  }, [lastNotification]);

  const renderItem = (item) => (
    <article key={item.id} className={`notification-card ${item.isRead ? "is-read" : "is-unread"}`}>
      <div className="notification-icon">{typeIcon(item.type)}</div>
      <div className="notification-content">
        <div className="notification-title-row">
          <h3>{item.title}</h3>
          {!item.isRead && <span className="status-pill pending">New</span>}
        </div>
        <p>{item.message}</p>
        <span className="muted-text">{formatTime(item.createdAt)}</span>
        <div className="notification-actions">
          {item.link && <Link className="secondary-btn small-btn" to={item.link}>Open</Link>}
          {!item.isRead && (
            <button className="ghost-btn small-btn" type="button" onClick={() => markRead(item.id)}>
              Mark read
            </button>
          )}
        </div>
      </div>
    </article>
  );

  return (
    <section className="page-shell compact-page">
      <div className="management-page-header">
        <div>
          <span className="eyebrow">SmartSell updates</span>
          <h1>Notifications</h1>
          <p>Live approvals, orders, quotations, messages, reviews, payout, support, and delivery updates.</p>
        </div>
        <div className="header-action-cluster">
          <span className={`status-pill ${connected ? "approved" : "pending"}`}>{connected ? "Live" : "Offline"}</span>
          <button className="primary-btn" type="button" onClick={markAllRead} disabled={!unreadCount}>
            Mark all read
          </button>
        </div>
      </div>

      {error && <div className="form-alert error">{error}</div>}
      {loading ? (
        <div className="loading-card">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="empty-state-card">
          <span>NT</span>
          <h2>No notifications yet</h2>
          <p>SmartSell will show important realtime updates here when something changes.</p>
        </div>
      ) : (
        <div className="notification-layout">
          <div className="mini-stat-card">
            <span>Unread</span>
            <strong>{unreadCount}</strong>
            <p>Actionable updates waiting for you.</p>
          </div>

          <div className="notification-list">
            {grouped.unread.length > 0 && (
              <>
                <h2>New updates</h2>
                {grouped.unread.map(renderItem)}
              </>
            )}
            {grouped.read.length > 0 && (
              <>
                <h2>Earlier updates</h2>
                {grouped.read.map(renderItem)}
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
