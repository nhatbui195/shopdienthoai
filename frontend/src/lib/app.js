// src/lib/api.js
import axios from "axios";

// Dùng localhost chỉ khi chạy dev, còn build thì dùng biến deploy
const API_BASE = import.meta.env.DEV
  ? "http://localhost:3001"
  : import.meta.env.VITE_API_URL;   // ⬅️ trùng tên biến trên Vercel

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

export const fileURL = (p) =>
  p?.startsWith("http") ? p : `${API_BASE}${p || ""}`;
