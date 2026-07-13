import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../utils/api.js";

export default function ContextMessageButton({
  contextType,
  contextId,
  subject,
  message,
  label = "Message",
  className = "secondary-btn detail-secondary-action",
}) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  async function openConversation() {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
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
      setNote(error.response?.data?.message || "Could not open conversation.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="context-message-action">
      <button className={className} type="button" disabled={busy} onClick={openConversation}>
        {busy ? "Opening..." : label}
      </button>
      {note && <small>{note}</small>}
    </span>
  );
}
