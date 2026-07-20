import axios from "axios";

const AUTH_STORAGE_KEY = "smartsell_auth";
const AUTH_EXPIRED_EVENT = "smartsell:auth-expired";

function readStoredToken() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token || null;
  } catch {
    return null;
  }
}

function isAuthenticationRequest(url = "") {
  return ["/auth/login", "/auth/register"].some((path) => String(url).includes(path));
}

function getFriendlyNetworkMessage(error) {
  if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError") return "Request cancelled.";
  if (error?.code === "ECONNABORTED") return "The request took too long. Please check your connection and try again.";
  if (!error?.response) return "SmartSell could not reach the server. Check that the backend is running and try again.";
  if (error.response.status === 429) return "Too many requests were sent. Please wait a moment and try again.";
  if (error.response.status >= 500) return "SmartSell is temporarily unable to complete this request. Please try again.";
  return null;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api",
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const existingAuth = config.headers?.Authorization || config.headers?.authorization;
  const storedToken = readStoredToken();

  if (!existingAuth && storedToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${storedToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const friendlyNetworkMessage = getFriendlyNetworkMessage(error);
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      friendlyNetworkMessage ||
      error?.message ||
      "Something went wrong. Please try again.";

    error.smartSellMessage = message;
    error.smartSellStatus = error?.response?.status || null;

    const storedToken = readStoredToken();
    const requestUrl = error?.config?.url || "";
    if (
      typeof window !== "undefined" &&
      error?.response?.status === 401 &&
      storedToken &&
      !isAuthenticationRequest(requestUrl)
    ) {
      window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT, {
        detail: { message: "Your SmartSell session expired. Please sign in again to continue." },
      }));
    }

    return Promise.reject(error);
  }
);

export { AUTH_EXPIRED_EVENT };
export default api;
