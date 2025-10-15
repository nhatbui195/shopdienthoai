// src/lib/api.js
import axios from "axios";

// Dev thì dùng localhost, build/preview/prod thì lấy từ ENV (Vercel)
// .replace(/\/+$/, "") để bỏ dấu "/" thừa ở cuối, tránh "//uploads"
const API_BASE = (
  import.meta.env?.DEV
    ? "http://localhost:3001"
    : (import.meta.env?.VITE_API_URL || import.meta.env?.VITE_API_BASE_URL || "")
).replace(/\/+$/, "");

export const api = axios.create({
  baseURL: API_BASE || "/",   // để trống vẫn không lỗi
  withCredentials: true,      // nếu có cookie/session
  timeout: 15000,
});

// Ghép URL cho ảnh/tệp tĩnh BE (ví dụ: "/uploads/abc.png" -> "https://be.vercel.app/uploads/abc.png")
export const fileURL = (p) => {
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p; // đã là URL tuyệt đối
  const prefix = API_BASE || "";
  const slash = p.startsWith("/") ? "" : "/";
  return `${prefix}${slash}${p}`;
};

// (tuỳ chọn) export luôn BASE để debug
export { API_BASE };
