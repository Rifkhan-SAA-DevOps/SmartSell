import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api, { AUTH_EXPIRED_EVENT } from "../utils/api.js";

const AuthContext = createContext(null);

const STORAGE_KEY = "smartsell_auth";

function readStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { user: null, token: null };
  } catch {
    return { user: null, token: null };
  }
}

export function AuthProvider({ children }) {
  const stored = readStoredAuth();
  const [user, setUser] = useState(stored.user);
  const [token, setToken] = useState(stored.token);
  const [loading, setLoading] = useState(Boolean(stored.token));

  useEffect(() => {
    function handleExpiredSession(event) {
      setUser(null);
      setToken(null);
      setLoading(false);
      try {
        sessionStorage.setItem(
          "smartsell_auth_notice",
          event?.detail?.message || "Your SmartSell session expired. Please sign in again."
        );
      } catch {
        // Session storage can be unavailable in restrictive browser modes.
      }
    }

    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpiredSession);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpiredSession);
  }, []);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token }));
    } else {
      delete api.defaults.headers.common.Authorization;
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [token, user]);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      if (!token) return;
      try {
        const { data } = await api.get("/auth/me");
        if (!cancelled) setUser(data.data.user);
      } catch {
        if (!cancelled) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();
    if (!token) setLoading(false);

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function login(payload) {
    const { data } = await api.post("/auth/login", payload);
    setUser(data.data.user);
    setToken(data.data.token);
    return data.data.user;
  }

  async function register(payload) {
    const { data } = await api.post("/auth/register", payload);
    setUser(data.data.user);
    setToken(data.data.token);
    return data.data.user;
  }

  async function refreshUser() {
    if (!token) return null;
    const { data } = await api.get("/auth/me");
    setUser(data.data.user);
    return data.data.user;
  }

  function updateLocalUser(nextUser) {
    setUser((currentUser) => ({ ...(currentUser || {}), ...(nextUser || {}) }));
  }

  function logout() {
    setUser(null);
    setToken(null);
  }

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user && token),
      login,
      register,
      refreshUser,
      updateLocalUser,
      logout,
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
