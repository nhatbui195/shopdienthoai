// frontend/src/lib/api.js
import axios from "axios";

// Lấy baseURL từ ENV (Vite) hoặc runtime (window.__API_BASE_URL__)
const RAW = (import.meta.env?.VITE_API_BASE_URL || window.__API_BASE_URL__ || "").trim();
export const API = RAW.replace(/\/+$/, ""); // bỏ dấu / ở cuối nếu có

// Axios instance dùng chung
export const api = axios.create({
  baseURL: API || "",       // "" => cùng origin nếu anh proxy /api
  withCredentials: true,
});

// ===== Helpers chung =====
export const fmtVND = (n) =>
  (Number(n) || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

export const toURL = (src) => {
  if (!src) return "";
  if (/^https?:\/\//i.test(src)) return src;
  return API ? `${API}${src}` : src;
};

// Alias tương thích
export const safeImage = toURL;
export const http = api;
