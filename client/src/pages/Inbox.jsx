import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
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
  AccountStatus,
} from "../components/CustomerAccountUi.jsx";
import useSmartPagination from "../hooks/useSmartPagination.js";
import {
  AdminEmptyState,
  AdminIcon,
  AdminModal,
  AdminPageHeader,
  AdminPagination,
  AdminSearchToolbar,
  AdminStatusBadge,
  useAdminPagination,
} from "../components/AdminWorkspaceUi.jsx";
import "../styles/pages/admin/AdminWorkspaceV2.css";
import "../styles/pages/admin/AdminInbox.css";

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" });
}
function contextLabel(thread) {
  if (!thread?.contextType) return "General";
  return String(thread.contextType).replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
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
  const others = [thread.customer, thread.businessUser, thread.admin].filter(Boolean).filter((item) => item.id !== currentUser?.id);
  return others.map((item) => item.businessName || item.name).join(" • ") || "SmartSell conversation";
}
function initials(value) {
  return String(value || "SS").split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

export default function Inbox() {
  const { user } = useAuth();
  const { connected, lastMessageEvent, lastThreadEvent, joinThread, leaveThread, refreshSummary } = useRealtime();
  const [searchParams, setSearchParams] = useSearchParams();
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [error, setError] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [compose, setCompose] = useState({ recipientId: "", subject: "", message: "" });
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [contextFilter, setContextFilter] = useState("all");
  const [search, setSearch] = useState("");

  const selectedId = searchParams.get("thread") || selectedThread?.id || "";
  const isAdmin = ["admin", "super_admin"].includes(user?.role);
  const unreadTotal = useMemo(() => threads.reduce((sum, thread) => sum + Number(thread.unreadCount || 0), 0), [threads]);
  const contextTypes = useMemo(() => ["all", ...Array.from(new Set(threads.map((thread) => thread.contextType || "general")))], [threads]);
  const visibleThreads = useMemo(() => {
    const query = search.trim().toLowerCase();
    return threads.filter((thread) => {
      const matchesContext = contextFilter === "all" || (thread.contextType || "general") === contextFilter;
      const text = `${thread.subject} ${participantName(thread, user)} ${thread.lastMessage?.body || ""}`.toLowerCase();
      return matchesContext && (!query || text.includes(query));
    });
  }, [threads, contextFilter, search, user]);
  const pagination = useSmartPagination(visibleThreads, { initialPageSize: 10, resetKey: `${contextFilter}-${search}` });
  const adminPagination = useAdminPagination(visibleThreads, 10, [contextFilter, search]);

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
    setThreadLoading(true);
    try {
      const { data } = await api.get(`/communication/threads/${id}`);
      setSelectedThread(data.data);
      await loadThreads();
      await refreshSummary();
    } finally { setThreadLoading(false); }
  }
  async function loadAll() {
    setLoading(true); setError("");
    try {
      const loadedThreads = await loadThreads();
      await loadRecipients();
      const targetId = searchParams.get("thread") || loadedThreads[0]?.id;
      if (targetId) await loadThread(targetId);
    } catch (err) { setError(err.response?.data?.message || "Failed to load inbox."); }
    finally { setLoading(false); }
  }

  async function sendNewThread(event) {
    event.preventDefault(); setError(""); setSending(true);
    try {
      const { data } = await api.post("/communication/threads", { recipientId: isAdmin ? compose.recipientId : undefined, subject: compose.subject, message: compose.message });
      setCompose({ recipientId: "", subject: "", message: "" }); setComposeOpen(false); setSearchParams({ thread: data.data.id }); setSelectedThread(data.data); await loadThreads(); await refreshSummary();
    } catch (err) { setError(err.response?.data?.message || "Could not send message."); }
    finally { setSending(false); }
  }
  async function sendReply(event) {
    event.preventDefault();
    if (!selectedThread?.id || !reply.trim()) return;
    setError(""); setSending(true);
    try {
      const { data } = await api.post(`/communication/threads/${selectedThread.id}/messages`, { message: reply });
      setReply(""); setSelectedThread(data.data); await loadThreads(); await refreshSummary();
    } catch (err) { setError(err.response?.data?.message || "Could not send reply."); }
    finally { setSending(false); }
  }
  function selectThread(id) { setSearchParams({ thread: id }); loadThread(id); }

  useEffect(() => { loadAll(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  useEffect(() => { if (!selectedId) return undefined; joinThread(selectedId); return () => leaveThread(selectedId); }, [selectedId, joinThread, leaveThread]);
  useEffect(() => {
    const incomingThread = lastMessageEvent?.thread || lastThreadEvent?.thread;
    if (!incomingThread?.id) return;
    setThreads((current) => [incomingThread, ...current.filter((thread) => thread.id !== incomingThread.id)]);
    if (incomingThread.id === selectedId) setSelectedThread(incomingThread);
  }, [lastMessageEvent, lastThreadEvent, selectedId]);

  if (isAdmin) {
    const currentParticipant = selectedThread ? participantName(selectedThread, user) : "";
    return (
      <section className="admin-workspace-v2 admin-inbox-workspace-v2">
        <AdminPageHeader
          eyebrow="Platform communication"
          title="Admin Inbox"
          description="Manage customer, seller, provider, delivery, order, request, and support conversations from one focused workspace."
          actions={<><span className={`admin-inbox-live-v2 ${connected ? "is-live" : ""}`}><i />{connected ? "Realtime connected" : "Realtime offline"}</span><button className="admin-primary-button-v2" type="button" onClick={() => setComposeOpen(true)}><AdminIcon name="inbox" size={17} /> New conversation</button></>}
          meta={<><span>{threads.length} total conversations</span><span>{unreadTotal} unread messages</span><span>{visibleThreads.length} in current view</span></>}
        />

        <div className="admin-inbox-metrics-v2">
          <article><span className="tone-blue"><AdminIcon name="inbox" /></span><div><small>All conversations</small><strong>{threads.length}</strong><p>Across customers and operational teams</p></div></article>
          <article><span className="tone-rose"><AdminIcon name="alert" /></span><div><small>Unread messages</small><strong>{unreadTotal}</strong><p>Conversations that need attention</p></div></article>
          <article><span className="tone-emerald"><AdminIcon name="activity" /></span><div><small>Realtime status</small><strong>{connected ? "Live" : "Offline"}</strong><p>{connected ? "New messages arrive instantly" : "Messages refresh when the page reloads"}</p></div></article>
        </div>

        {error && <div className="admin-inbox-alert-v2"><AdminIcon name="alert" size={18} />{error}</div>}

        <AdminSearchToolbar
          value={search}
          onChange={setSearch}
          placeholder="Search subject, participant, or message..."
          filters={<label className="admin-inbox-context-filter-v2"><span>Conversation type</span><select value={contextFilter} onChange={(event) => setContextFilter(event.target.value)}>{contextTypes.map((type) => <option key={type} value={type}>{type === "all" ? "All conversations" : contextLabel({ contextType: type })}</option>)}</select></label>}
          actions={<span className="admin-inbox-result-count-v2"><strong>{visibleThreads.length}</strong> matching</span>}
        />

        <div className="admin-inbox-layout-v2">
          <aside className="admin-inbox-directory-v2">
            <header><div><span>Conversation directory</span><h2>Messages</h2></div><b>{unreadTotal} unread</b></header>
            {loading ? (
              <div className="admin-inbox-loading-v2">Loading conversations...</div>
            ) : visibleThreads.length === 0 ? (
              <AdminEmptyState icon="inbox" title="No matching conversations" description="Try another search or start a new message with a SmartSell user." />
            ) : (
              <>
                <div className="admin-inbox-thread-list-v2">
                  {adminPagination.items.map((thread) => {
                    const participant = participantName(thread, user);
                    return (
                      <button key={thread.id} className={`admin-inbox-thread-v2 ${selectedId === thread.id ? "is-active" : ""} ${thread.unreadCount > 0 ? "has-unread" : ""}`} type="button" onClick={() => selectThread(thread.id)}>
                        <span className="admin-inbox-thread-avatar-v2">{initials(participant)}</span>
                        <span className="admin-inbox-thread-copy-v2">
                          <span><strong>{thread.subject}</strong><small>{formatDate(thread.updatedAt || thread.createdAt)}</small></span>
                          <b>{participant}</b>
                          <p>{thread.lastMessage?.body || "No messages yet"}</p>
                          <mark>{contextLabel(thread)}</mark>
                        </span>
                        {thread.unreadCount > 0 && <i>{thread.unreadCount}</i>}
                        <AdminIcon name="chevron" size={16} />
                      </button>
                    );
                  })}
                </div>
                <AdminPagination pagination={adminPagination} />
              </>
            )}
          </aside>

          <main className="admin-inbox-conversation-v2">
            {threadLoading ? (
              <div className="admin-inbox-loading-v2">Opening conversation...</div>
            ) : selectedThread ? (
              <>
                <header className="admin-inbox-conversation-head-v2">
                  <div className="admin-inbox-conversation-person-v2"><span>{initials(currentParticipant)}</span><div><small>{contextLabel(selectedThread)}</small><h2>{selectedThread.subject}</h2><p>{currentParticipant}</p></div></div>
                  <div className="admin-inbox-conversation-actions-v2">{contextLink(selectedThread) && <Link to={contextLink(selectedThread)}>Open related page <AdminIcon name="arrow" size={15} /></Link>}<AdminStatusBadge status={connected ? "active" : "pending"} label={connected ? "Live" : "Offline"} /></div>
                </header>

                <div className="admin-inbox-message-list-v2">
                  {(selectedThread.messages || []).length ? (selectedThread.messages || []).map((message) => {
                    const mine = message.sender?.id === user?.id;
                    const sender = mine ? "You" : message.sender?.businessName || message.sender?.name || "SmartSell user";
                    return <article key={message.id} className={`admin-inbox-message-v2 ${mine ? "is-mine" : "is-theirs"}`}><span>{initials(sender)}</span><div><strong>{sender}</strong><p>{message.body}</p><small>{formatDate(message.createdAt)}</small></div></article>;
                  }) : <AdminEmptyState icon="inbox" title="No messages in this thread" description="Send the first reply to continue this conversation." />}
                </div>

                <form className="admin-inbox-reply-v2" onSubmit={sendReply}>
                  <label><span>Reply to this conversation</span><textarea value={reply} onChange={(event) => setReply(event.target.value)} rows="3" placeholder="Write a clear administrative reply..." required /></label>
                  <button className="admin-primary-button-v2" type="submit" disabled={sending}>{sending ? "Sending..." : "Send reply"}<AdminIcon name="arrow" size={16} /></button>
                </form>
              </>
            ) : (
              <AdminEmptyState icon="inbox" title="Select a conversation" description="Choose a conversation from the directory or start a new message." action={<button className="admin-primary-button-v2" type="button" onClick={() => setComposeOpen(true)}>New conversation</button>} />
            )}
          </main>
        </div>

        <AdminModal open={composeOpen} onClose={() => setComposeOpen(false)} title="Start a new conversation" eyebrow="Admin message" size="medium">
          <form className="admin-form-v2 admin-inbox-compose-v2" onSubmit={sendNewThread}>
            <label>Recipient<select value={compose.recipientId} onChange={(event) => setCompose((current) => ({ ...current, recipientId: event.target.value }))} required><option value="">Select a customer or team member</option>{recipients.map((recipient) => <option key={recipient.id} value={recipient.id}>{recipient.label}</option>)}</select></label>
            <label>Subject<input value={compose.subject} onChange={(event) => setCompose((current) => ({ ...current, subject: event.target.value }))} placeholder="Example: Update about order #SM-1028" required /></label>
            <label>Message<textarea value={compose.message} onChange={(event) => setCompose((current) => ({ ...current, message: event.target.value }))} placeholder="Write the complete message..." rows="6" required /></label>
            <div className="admin-modal-actions-v2"><button className="admin-primary-button-v2" type="submit" disabled={sending}>{sending ? "Sending..." : "Send message"}</button><button className="admin-secondary-button-v2" type="button" onClick={() => setComposeOpen(false)}>Cancel</button></div>
          </form>
        </AdminModal>
      </section>
    );
  }

  return (
    <section className="ca-account-page ca-inbox-page">
      <AccountPageHeader eyebrow="SmartSell communication" title="Inbox" description="A focused place for order, request, offer, support, product, and service conversations." icon="inbox" actions={<><span className={`ca-live-badge ${connected ? "is-live" : ""}`}><i />{connected ? "Live" : "Offline"}</span><button className="ca-button ca-button--primary" type="button" onClick={() => setComposeOpen(true)}><AccountIcon name="plus" size={16} /> New message</button></>} meta={<><span>{threads.length} conversation{threads.length === 1 ? "" : "s"}</span><span className={unreadTotal ? "is-attention" : "is-success"}>{unreadTotal} unread</span></>} />

      {error && <div className="ca-alert ca-alert--error">{error}</div>}

      <div className="ca-inbox-layout">
        <aside className="ca-thread-panel">
          <div className="ca-thread-panel__head"><div><span className="ca-eyebrow">Conversations</span><h2>Messages</h2></div><b>{visibleThreads.length}</b></div>
          <AccountSearch value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search conversations..." />
          <div className="ca-context-tabs" role="tablist">
            {contextTypes.map((type) => <button key={type} type="button" className={contextFilter === type ? "is-active" : ""} onClick={() => setContextFilter(type)}>{type === "all" ? "All" : contextLabel({ contextType: type })}</button>)}
          </div>

          {loading ? <div className="ca-loading ca-loading--compact">Loading conversations...</div> : visibleThreads.length === 0 ? <div className="ca-thread-empty"><AccountIcon name="message" size={24} /><p>No matching conversations.</p></div> : <>
            <div className="ca-thread-list">
              {pagination.items.map((thread) => {
                const participant = participantName(thread, user);
                return <button key={thread.id} className={`ca-thread-item ${selectedId === thread.id ? "is-active" : ""} ${thread.unreadCount > 0 ? "has-unread" : ""}`} type="button" onClick={() => selectThread(thread.id)}>
                  <span className="ca-thread-avatar">{initials(participant)}</span>
                  <span className="ca-thread-item__copy"><span><strong>{thread.subject}</strong><small>{formatDate(thread.updatedAt || thread.createdAt)}</small></span><b>{participant}</b><p>{thread.lastMessage?.body || "No messages yet"}</p><mark>{contextLabel(thread)}</mark></span>
                  {thread.unreadCount > 0 && <i>{thread.unreadCount}</i>}
                </button>;
              })}
            </div>
            <SmartPagination pagination={pagination} label="threads" compact />
          </>}
        </aside>

        <main className="ca-conversation-panel">
          {threadLoading ? <div className="ca-loading">Opening conversation...</div> : selectedThread ? <>
            <header className="ca-conversation-header">
              <div><span className="ca-conversation-avatar">{initials(participantName(selectedThread, user))}</span><div><span className="ca-eyebrow">{contextLabel(selectedThread)}</span><h2>{selectedThread.subject}</h2><p>{participantName(selectedThread, user)}</p></div></div>
              <div>{contextLink(selectedThread) && <Link className="ca-button ca-button--soft" to={contextLink(selectedThread)}>Open related page</Link>}<AccountStatus value={connected ? "active" : "pending"} label={connected ? "Live" : "Offline"} /></div>
            </header>

            <div className="ca-message-list">
              {(selectedThread.messages || []).map((message) => {
                const mine = message.sender?.id === user?.id;
                return <article key={message.id} className={`ca-message ${mine ? "is-mine" : "is-theirs"}`}><span className="ca-message__avatar">{initials(mine ? user?.name : message.sender?.businessName || message.sender?.name)}</span><div><strong>{mine ? "You" : message.sender?.businessName || message.sender?.name || "SmartSell"}</strong><p>{message.body}</p><small>{formatDate(message.createdAt)}</small></div></article>;
              })}
            </div>

            <form onSubmit={sendReply} className="ca-reply-box"><textarea value={reply} onChange={(event) => setReply(event.target.value)} rows="3" placeholder="Write a clear reply..." required /><button className="ca-button ca-button--primary" type="submit" disabled={sending}>{sending ? "Sending..." : "Send reply"}<AccountIcon name="arrow" size={16} /></button></form>
          </> : <AccountEmpty icon="inbox" title="Select a conversation" text="Choose a thread from the list or start a new message with SmartSell support." actionLabel="New message" action={() => setComposeOpen(true)} />}
        </main>
      </div>

      <AccountModal open={composeOpen} onClose={() => setComposeOpen(false)} title="Start a new conversation" eyebrow="New message" icon="message" size="medium">
        <form className="ca-compose-form" onSubmit={sendNewThread}>
          {isAdmin ? <label>Recipient<select value={compose.recipientId} onChange={(event) => setCompose((current) => ({ ...current, recipientId: event.target.value }))} required><option value="">Select user</option>{recipients.map((recipient) => <option key={recipient.id} value={recipient.id}>{recipient.label}</option>)}</select></label> : <div className="ca-note ca-note--accent"><strong>SmartSell support</strong><p>Your message will be sent to the SmartSell administration team.</p></div>}
          <label>Subject<input value={compose.subject} onChange={(event) => setCompose((current) => ({ ...current, subject: event.target.value }))} placeholder="Example: Question about my order" required /></label>
          <label>Message<textarea value={compose.message} onChange={(event) => setCompose((current) => ({ ...current, message: event.target.value }))} placeholder="Explain what you need help with..." rows="5" required /></label>
          <div className="ca-modal-actions"><button className="ca-button ca-button--primary" type="submit" disabled={sending}>{sending ? "Sending..." : "Send message"}</button><button className="ca-button ca-button--soft" type="button" onClick={() => setComposeOpen(false)}>Cancel</button></div>
        </form>
      </AccountModal>
    </section>
  );
}
