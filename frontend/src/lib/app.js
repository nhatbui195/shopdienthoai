// src/lib/api.js
import axios from "axios";

export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // bật nếu dùng cookie/session
});

// (tuỳ chọn) helper cho ảnh tĩnh
export const fileURL = (p) => (p?.startsWith("http") ? p : `${API_BASE}${p || ""}`);
