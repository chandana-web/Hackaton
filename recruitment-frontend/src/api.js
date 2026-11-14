import axios from "axios";
import { getApiToken, getDataMode } from "./dataMode";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  if (getDataMode() === "demo" && config.method !== "get") {
    return Promise.reject(new Error("Demo mode is read-only. Switch to API mode to make changes."));
  }

  const token = getApiToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use((response) => response, (error) => {
  const validationErrors = error.response?.data?.errors;
  const validationDetails = Array.isArray(validationErrors)
    ? validationErrors.map((item) => {
      const field = item.field?.replace(/^body\./, "");
      return field ? `${field}: ${item.message}` : item.message;
    }).join("; ")
    : "";
  const message = validationDetails
    ? `${error.response?.data?.message || "Validation failed"}: ${validationDetails}`
    : error.response?.data?.message
    || error.message;
  error.message = message;
  return Promise.reject(error);
});

export const endpoints = {
  requisitions: "/requisitions",
  candidates: "/candidates",
  applications: "/applications",
  interviews: "/interviews",
  feedback: "/feedback",
  offers: "/offers",
};

export default api;