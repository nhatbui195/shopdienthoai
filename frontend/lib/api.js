// frontend/src/lib/api.js
import axios from "axios";

// Đọc base URL từ env (prod: backend vercel; dev: localhost:3001/api)
// Nếu bạn gộp 1 project: dùng "/api"
export const API_BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/+$/,"");

// Axios instance dùng chung
export const api = axios.create({
  baseURL: API_BASE,
  // withCredentials: true, // bật nếu dùng cookie
});

// Helper chuẩn hoá URL ảnh/tệp từ backend
export function fileURL(p) {
  if (!p) return "";
  // nếu đã là URL tuyệt đối -> giữ nguyên
  if (/^https?:\/\//i.test(p)) return p;

  // Nếu backend trả về dạng '/uploads/abc.jpg' hoặc '/api/uploads/...'
  if (p.startsWith("/")) {
    const path = p.replace(/^\/api(?=\/|$)/, ""); // bỏ tiền tố /api nếu có
    return `${API_BASE}${path}`;
  }

  // Nếu chỉ là tên file 'abc.jpg' -> giả định nằm trong /uploads
  return `${API_BASE}/uploads/${p}`;
}

