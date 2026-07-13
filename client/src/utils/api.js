import axios from "axios";

const AUTH_STORAGE_KEY = "smartsell_auth";

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
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Something went wrong. Please try again.";

    error.smartSellMessage = message;
    return Promise.reject(error);
  }
);

export default api;
