// src/lib/api.js
import axios from "axios";

// Lấy BASE URL:
// - Dev: localhost:3001
// - Prod: ưu tiên VITE_API_URL (anh đã tạo trên Vercel), fallback sang VITE_API_BASE_URL
const API_BASE =
  (import.meta.env?.DEV
    ? "http://localhost:3001"
    : (import.meta.env?.VITE_API_URL || import.meta.env?.VITE_API_BASE_URL || "")
  ).replace(/\/+$/, ""); // bỏ dấu "/" cuối cho sạch

export const api = axios.create({
  baseURL: API_BASE || "/",       // để trống vẫn không lỗi
  withCredentials: true,          // nếu dùng cookie/session
  timeout: 15000,
});

// (tuỳ chọn) Interceptor nhỏ: log lỗi gọn gàng
api.interceptors.response.use(
  (r) => r,
  (err) => {
    // console.error("API error:", err?.response?.data || err.message);
    return Promise.reject(err);
  }
);

// Ghép URL file/tệp tĩnh từ BE (vd: /uploads/xxx.png)
export const fileURL = (p) => {
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p;       // đã là URL tuyệt đối
  if (!API_BASE) return p;                     // chưa set BASE thì trả nguyên
  return `${API_BASE}${p.startsWith("/") ? "" : "/"}${p}`;
};

// (tuỳ chọn) export ra dùng nơi khác
export { API_BASE };
