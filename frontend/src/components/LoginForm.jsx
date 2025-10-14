// src/components/LoginForm.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/components/LoginForm.css";
import "../styles/components/ToastMini.css";

// Cấu hình thời gian chờ (ms)
const ADMIN_REDIRECT_DELAY = 2500; // ~2.5s cho nhân viên/admin
const USER_REDIRECT_DELAY  = 120;  // giữ nhanh cho khách (có thể đổi thành 2500 nếu anh muốn)

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

      const res = await axios.post("http://localhost:3001/api/login", {
        username,
        password,
      });

      const token = res.data?.token;
      const rawUser = res.data?.user;

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

      // Lưu & set headers
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      axios.defaults.headers.common["X-User-Role"] = user.role || "";
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Cập nhật UI ngay
      window.dispatchEvent(new CustomEvent("auth-changed", { detail: { user } }));

      // Toast thành công: đặt đúng 2.5s để khớp thời gian chờ
      appToast("success", `Đăng nhập thành công! Xin chào ${user.username || username}`, ADMIN_REDIRECT_DELAY);

      // Đóng modal (nếu có)
      onLoginSuccess?.();

      // Bỏ nháy loader ở lần chuyển route kế
      window.__SKIP_NEXT_PULSE__ = true;

      // Điều hướng: NHÂN VIÊN đợi ~2.5s rồi mới vào admin
      const goAdmin = user.isAdmin === true;
      navTimer.current = setTimeout(() => {
        if (goAdmin) {
          navigate("/admin", { replace: true });
        } else {
          // khách có thể đi nhanh; nếu anh muốn cũng đợi 2.5s thì đổi sang ADMIN_REDIRECT_DELAY
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
