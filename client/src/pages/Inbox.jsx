import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../utils/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useRealtime } from "../context/RealtimeContext.jsx";

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleString();
}

function contextLabel(thread) {
  if (!thread?.contextType) return "General";
  return String(thread.contextType)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function contextLink(thread) {
  if (!thread?.contextType || !thread?.contextId) return null;
  if (thread.contextType === "product") return `/products/${thread.contextId}`;
  if (thread.contextType === "service") return `/services/${thread.contextId}`;
  if (thread.contextType === "order") return "/orders";
  if (thread.contextType === "request") return "/my-requests";
  if (thread.contextType === "offer") return "/offers";
  if (thread.contextType === "support") return "/support";
  return null;
}

function participantName(thread, currentUser) {
  const others = [thread.customer, thread.businessUser, thread.admin]
    .filter(Boolean)
    .filter((item) => item.id !== currentUser?.id);
  return others.map((item) => item.businessName || item.name).join(" • ") || "SmartSell conversation";
}

export default function Inbox() {
  const { user } = useAuth();
  const { connected, lastMessageEvent, lastThreadEvent, joinThread, leaveThread, refreshSummary } = useRealtime();
  const [searchParams, setSearchParams] = useSearchParams();
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [compose, setCompose] = useState({ recipientId: "", subject: "", message: "" });
  const [reply, setReply] = useState("");
  const [contextFilter, setContextFilter] = useState("all");

  const selectedId = searchParams.get("thread") || selectedThread?.id || "";
  const isAdmin = ["admin", "super_admin"].includes(user?.role);

  const unreadTotal = useMemo(
    () => threads.reduce((sum, thread) => sum + Number(thread.unreadCount || 0), 0),
    [threads]
  );

  const contextTypes = useMemo(() => {
    const values = threads.map((thread) => thread.contextType || "general");
    return ["all", ...Array.from(new Set(values))];
  }, [threads]);

  const visibleThreads = useMemo(() => {
    if (contextFilter === "all") return threads;
    return threads.filter((thread) => (thread.contextType || "general") === contextFilter);
  }, [threads, contextFilter]);

  async function loadThreads() {
    const { data } = await api.get("/communication/threads");
    setThreads(data.data || []);
    return data.data || [];
  }

  async function loadRecipients() {
    const { data } = await api.get("/communication/recipients");
    setRecipients(data.data || []);
  }

  async function loadThread(id) {
    if (!id) return;
    const { data } = await api.get(`/communication/threads/${id}`);
    setSelectedThread(data.data);
    await loadThreads();
    await refreshSummary();
  }

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const loadedThreads = await loadThreads();
      await loadRecipients();
      const targetId = searchParams.get("thread") || loadedThreads[0]?.id;
      if (targetId) await loadThread(targetId);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load inbox.");
    } finally {
      setLoading(false);
    }
  }

  async function sendNewThread(event) {
    event.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/communication/threads", {
        recipientId: isAdmin ? compose.recipientId : undefined,
        subject: compose.subject,
        message: compose.message,
      });
      setCompose({ recipientId: "", subject: "", message: "" });
      setSearchParams({ thread: data.data.id });
      setSelectedThread(data.data);
      await loadThreads();
      await refreshSummary();
    } catch (err) {
      setError(err.response?.data?.message || "Could not send message.");
    }
  }

  async function sendReply(event) {
    event.preventDefault();
    if (!selectedThread?.id || !reply.trim()) return;
    setError("");
    try {
      const { data } = await api.post(`/communication/threads/${selectedThread.id}/messages`, { message: reply });
      setReply("");
      setSelectedThread(data.data);
      await loadThreads();
      await refreshSummary();
    } catch (err) {
      setError(err.response?.data?.message || "Could not send reply.");
    }
  }

  function selectThread(id) {
    setSearchParams({ thread: id });
    loadThread(id);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedId) return undefined;
    joinThread(selectedId);
    return () => leaveThread(selectedId);
  }, [selectedId, joinThread, leaveThread]);

  useEffect(() => {
    const incomingThread = lastMessageEvent?.thread || lastThreadEvent?.thread;
    if (!incomingThread?.id) return;

    setThreads((current) => {
      const without = current.filter((thread) => thread.id !== incomingThread.id);
      return [incomingThread, ...without];
    });

    if (incomingThread.id === selectedId) {
      setSelectedThread(incomingThread);
    }
  }, [lastMessageEvent, lastThreadEvent, selectedId]);

  return (
    <section className="page-shell inbox-page">
      <div className="management-page-header">
        <div>
          <span className="eyebrow">SmartSell communication</span>
          <h1>Inbox & Messages</h1>
          <p>Real-time conversations for orders, listings, support, offers, and service requests.</p>
        </div>
        <div className="mini-stat-card inline-stat realtime-status-card">
          <span>{connected ? "Live inbox" : "Offline mode"}</span>
          <strong>{unreadTotal}</strong>
          <p>Unread messages</p>
        </div>
      </div>

      {error && <div className="form-alert error">{error}</div>}

      <div className="inbox-grid">
        <aside className="inbox-panel compose-panel">
          <h2>New message</h2>
          <form onSubmit={sendNewThread} className="stacked-form">
            {isAdmin && (
              <label>
                Recipient
                <select value={compose.recipientId} onChange={(e) => setCompose((prev) => ({ ...prev, recipientId: e.target.value }))} required>
                  <option value="">Select user</option>
                  {recipients.map((recipient) => (
                    <option key={recipient.id} value={recipient.id}>{recipient.label}</option>
                  ))}
                </select>
              </label>
            )}
            {!isAdmin && (
              <div className="info-card small-info-card">
                <strong>Send to SmartSell Admin</strong>
                <p>Your message will go to the admin support inbox.</p>
              </div>
            )}
            <label>
              Subject
              <input value={compose.subject} onChange={(e) => setCompose((prev) => ({ ...prev, subject: e.target.value }))} placeholder="Example: Question about my order" required />
            </label>
            <label>
              Message
              <textarea value={compose.message} onChange={(e) => setCompose((prev) => ({ ...prev, message: e.target.value }))} placeholder="Write your message..." rows="4" required />
            </label>
            <button className="primary-btn" type="submit">Send message</button>
          </form>
        </aside>

        <aside className="inbox-panel thread-list-panel">
          <div className="thread-list-head">
            <h2>Threads</h2>
            <span>{visibleThreads.length}</span>
          </div>
          <div className="context-filter-pills">
            {contextTypes.map((type) => (
              <button key={type} type="button" className={contextFilter === type ? "active" : ""} onClick={() => setContextFilter(type)}>
                {type === "all" ? "All" : contextLabel({ contextType: type })}
              </button>
            ))}
          </div>
          {loading ? (
            <div className="loading-card">Loading...</div>
          ) : visibleThreads.length === 0 ? (
            <p className="muted-text">No conversations yet.</p>
          ) : (
            <div className="thread-list">
              {visibleThreads.map((thread) => (
                <button
                  key={thread.id}
                  className={`thread-item ${selectedId === thread.id ? "active" : ""}`}
                  type="button"
                  onClick={() => selectThread(thread.id)}
                >
                  <span className="thread-icon">IB</span>
                  <span>
                    <strong>{thread.subject}</strong>
                    <small>{participantName(thread, user)}</small>
                    <mark>{contextLabel(thread)}</mark>
                    {thread.lastMessage && <em>{thread.lastMessage.body}</em>}
                  </span>
                  {thread.unreadCount > 0 && <b>{thread.unreadCount}</b>}
                </button>
              ))}
            </div>
          )}
        </aside>

        <main className="inbox-panel message-panel">
          {selectedThread ? (
            <>
              <div className="message-panel-header contextual-message-header">
                <div>
                  <span className="context-chip">{contextLabel(selectedThread)}</span>
                  <h2>{selectedThread.subject}</h2>
                  <p>{participantName(selectedThread, user)}</p>
                </div>
                <div className="message-header-actions">
                  {contextLink(selectedThread) && <Link className="secondary-btn small-btn" to={contextLink(selectedThread)}>Open Related Page</Link>}
                  <span className={`status-pill ${connected ? "approved" : "pending"}`}>{connected ? "Live" : "Offline"}</span>
                </div>
              </div>

              <div className="message-list">
                {(selectedThread.messages || []).map((message) => {
                  const mine = message.sender?.id === user?.id;
                  return (
                    <article key={message.id} className={`message-bubble ${mine ? "mine" : "theirs"}`}>
                      <strong>{mine ? "You" : message.sender?.businessName || message.sender?.name || "SmartSell"}</strong>
                      <p>{message.body}</p>
                      <small>{formatDate(message.createdAt)}</small>
                    </article>
                  );
                })}
              </div>

              <form onSubmit={sendReply} className="reply-box">
                <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows="3" placeholder="Type reply..." />
                <button className="primary-btn" type="submit">Reply</button>
              </form>
            </>
          ) : (
            <div className="empty-state-card">
              <span>IB</span>
              <h2>Select a conversation</h2>
              <p>Choose a thread or send a new message to SmartSell support.</p>
            </div>
          )}
        </main>
      </div>
    </section>
  );
}
