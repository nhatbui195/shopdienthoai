// src/components/LoginForm.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/components/LoginForm.css";
import "../styles/components/ToastMini.css";
import { api } from "../lib/api"; // ✅ dùng client chung

// Cấu hình thời gian chờ (ms)
const ADMIN_REDIRECT_DELAY = 2500; // ~2.5s cho nhân viên/admin
const USER_REDIRECT_DELAY  = 120;  // khách đi nhanh; đổi 2500 nếu muốn hiệu ứng đồng nhất

function normalizeRole(r) {
  return String(r || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase(); // 'khachhang' | 'nhanvien'
}
function computeIsAdmin(u) {
  if (!u) return false;
  if (u.isAdmin === true || u.isAdmin === 1 || u.isAdmin === "1") return true;
  const r = normalizeRole(u.role || u.VaiTro || u.type);
  return r === "nhanvien"; // theo CSDL hiện tại
}

export default function LoginForm({ onSwitchToRegister, onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const navTimer = useRef(null);

  useEffect(() => {
    return () => { if (navTimer.current) clearTimeout(navTimer.current); };
  }, []);

  const appToast = (type, text, ms = 2500) => {
    window.dispatchEvent(new CustomEvent("app-toast", { detail: { type, text, ms } }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      appToast("error", "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu");
      return;
    }

    try {
      setLoading(true);

      // ✅ dùng api client (baseURL lấy từ env/localhost tuỳ môi trường)
      const { data } = await api.post("/api/login", { username, password });

      const token = data?.token;
      const rawUser = data?.user;

      if (!rawUser || !token) {
        appToast("error", "Phản hồi đăng nhập không hợp lệ");
        return;
      }

      const normalizedRole = normalizeRole(rawUser.role || rawUser.VaiTro);
      const user = {
        ...rawUser,
        role: normalizedRole,
        isAdmin: computeIsAdmin({ ...rawUser, role: normalizedRole }),
      };

      // ✅ Lưu token & user
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // ✅ Set header chỉ cho client `api` (tránh đụng global axios)
      api.defaults.headers.common["X-User-Role"] = user.role || "";
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Cập nhật UI ngay
      window.dispatchEvent(new CustomEvent("auth-changed", { detail: { user } }));

      // Toast thành công
      appToast(
        "success",
        `Đăng nhập thành công! Xin chào ${user.username || username}`,
        ADMIN_REDIRECT_DELAY
      );

      // Đóng modal (nếu có)
      onLoginSuccess?.();

      // Bỏ nháy loader ở lần chuyển route kế
      window.__SKIP_NEXT_PULSE__ = true;

      // Điều hướng
      const goAdmin = user.isAdmin === true;
      navTimer.current = setTimeout(() => {
        if (goAdmin) {
          navigate("/admin", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      }, goAdmin ? ADMIN_REDIRECT_DELAY : USER_REDIRECT_DELAY);

    } catch (err) {
      appToast("error", err?.response?.data?.message || "Đăng nhập thất bại", 2500);
    } finally {
      setLoading(false);
      setPassword(""); // clear password sau submit
    }
  };

  return (
    <form className="login-form" onSubmit={handleLogin}>
      <h2>Đăng nhập</h2>

      <label>Tên đăng nhập:</label>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        autoComplete="username"
        required
      />

      <label>Mật khẩu:</label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        required
      />

      <button type="submit" disabled={loading} aria-busy={loading}>
        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>

      {onSwitchToRegister && (
        <p className="login-register-note">
          Bạn chưa có tài khoản?{" "}
          <button type="button" className="register-link" onClick={onSwitchToRegister}>
            Đăng ký ngay
          </button>
        </p>
      )}
    </form>
  );
}
