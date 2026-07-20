import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../utils/api.js";

function AlertIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 17h.01" /></svg>;
}

export default function ContextMessageButton({
  contextType,
  contextId,
  subject,
  message,
  label = "Message",
  className = "secondary-btn detail-secondary-action",
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  async function openConversation() {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location } });
      return;
    }

    try {
      setBusy(true);
      setNote("");
      const { data } = await api.post("/communication/context-threads", {
        contextType,
        contextId,
        subject,
        message,
      });
      navigate(`/inbox?thread=${data.data.id}`);
    } catch (error) {
      setNote(error.smartSellMessage || error.response?.data?.message || "Could not open this conversation.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="context-message-action">
      <button className={className} type="button" disabled={busy} onClick={openConversation} aria-busy={busy || undefined}>
        {busy && <span className="context-message-spinner" aria-hidden="true" />}
        {busy ? "Opening conversation..." : label}
      </button>
      {note && (
        <span className="context-message-action__notice" role="alert">
          <AlertIcon />
          <span>{note}</span>
          <button type="button" onClick={() => setNote("")} aria-label="Dismiss message error">×</button>
        </span>
      )}
    </span>
  );
}
