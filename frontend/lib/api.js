// src/lib/api.js
import axios from "axios";

export const API = import.meta.env.VITE_API_BASE_URL || "";

export const http = axios.create({
  baseURL: API,
  withCredentials: true, // nếu cần cookie
});

// Dùng khi build src ảnh từ API (tránh hardcode localhost)
export const safeImage = (src) =>
  src && src.startsWith("http") ? src : `${API}${src || ""}`;

