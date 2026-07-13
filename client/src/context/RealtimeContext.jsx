import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import api from "../utils/api.js";
import { createSmartSellSocket } from "../utils/socket.js";

const RealtimeContext = createContext(null);

const EMPTY_SUMMARY = { unreadNotifications: 0, unreadMessages: 0 };

function toastTitle(event) {
  if (event?.notification?.title) return event.notification.title;
  if (event?.message?.sender?.name) return `New message from ${event.message.sender.name}`;
  return "SmartSell update";
}

function toastBody(event) {
  if (event?.notification?.message) return event.notification.message;
  if (event?.message?.body) return event.message.body;
  return "You have a new realtime update.";
}

function toastLink(event) {
  if (event?.notification?.link) return event.notification.link;
  if (event?.thread?.id) return `/inbox?thread=${event.thread.id}`;
  return null;
}

export function RealtimeProvider({ children }) {
  const { token, isAuthenticated, user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [lastNotification, setLastNotification] = useState(null);
  const [lastMessageEvent, setLastMessageEvent] = useState(null);
  const [lastThreadEvent, setLastThreadEvent] = useState(null);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [toasts, setToasts] = useState([]);

  const refreshSummary = useCallback(async () => {
    if (!isAuthenticated) {
      setSummary(EMPTY_SUMMARY);
      return EMPTY_SUMMARY;
    }

    try {
      const { data } = await api.get("/communication/summary");
      const nextSummary = data.data || EMPTY_SUMMARY;
      setSummary(nextSummary);
      if (Array.isArray(nextSummary.onlineUserIds)) setOnlineUserIds(nextSummary.onlineUserIds);
      return nextSummary;
    } catch {
      setSummary(EMPTY_SUMMARY);
      return EMPTY_SUMMARY;
    }
  }, [isAuthenticated]);

  const pushToast = useCallback((event) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const item = {
      id,
      title: toastTitle(event),
      body: toastBody(event),
      link: toastLink(event),
    };

    setToasts((current) => [item, ...current].slice(0, 3));
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 6500);
  }, []);

  useEffect(() => {
    if (!token || !isAuthenticated) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
      setSummary(EMPTY_SUMMARY);
      setOnlineUserIds([]);
      return undefined;
    }

    const socket = createSmartSellSocket(token);
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      refreshSummary();
    });

    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));

    socket.on("realtime:ready", () => {
      setConnected(true);
      refreshSummary();
    });

    socket.on("presence:update", (payload) => {
      if (!payload?.userId) return;
      setOnlineUserIds((current) => {
        const set = new Set(current);
        if (payload.isOnline) set.add(payload.userId);
        else set.delete(payload.userId);
        return Array.from(set);
      });
    });

    socket.on("communication:summary", (payload) => {
      setSummary(payload || EMPTY_SUMMARY);
    });

    socket.on("notification:new", (payload) => {
      setLastNotification(payload);
      pushToast(payload);
      refreshSummary();
    });

    socket.on("message:new", (payload) => {
      setLastMessageEvent(payload);
      setLastThreadEvent(payload);
      pushToast(payload);
      refreshSummary();
    });

    socket.on("thread:updated", (payload) => {
      setLastThreadEvent(payload);
      refreshSummary();
    });

    socket.on("thread:read", (payload) => {
      if (payload?.summary) setSummary(payload.summary);
    });

    socket.connect();

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [token, isAuthenticated, user?.id, pushToast, refreshSummary]);

  const value = useMemo(
    () => ({
      socket: socketRef.current,
      connected,
      summary,
      lastNotification,
      lastMessageEvent,
      lastThreadEvent,
      onlineUserIds,
      refreshSummary,
      joinThread(threadId) {
        socketRef.current?.emit("thread:join", threadId);
      },
      leaveThread(threadId) {
        socketRef.current?.emit("thread:leave", threadId);
      },
      dismissToast(id) {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      },
    }),
    [connected, summary, lastNotification, lastMessageEvent, lastThreadEvent, onlineUserIds, refreshSummary]
  );

  return (
    <RealtimeContext.Provider value={value}>
      {children}
      {toasts.length > 0 && (
        <div className="realtime-toast-stack" aria-live="polite" aria-label="Realtime SmartSell updates">
          {toasts.map((toast) => (
            <article key={toast.id} className="realtime-toast">
              <div className="realtime-toast-icon" aria-hidden="true">SS</div>
              <div>
                <strong>{toast.title}</strong>
                <p>{toast.body}</p>
                <div className="realtime-toast-actions">
                  {toast.link && <Link to={toast.link}>Open</Link>}
                  <button type="button" onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}>Dismiss</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const value = useContext(RealtimeContext);
  if (!value) throw new Error("useRealtime must be used inside RealtimeProvider");
  return value;
}
