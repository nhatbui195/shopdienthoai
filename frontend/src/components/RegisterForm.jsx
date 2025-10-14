// src/components/RegisterForm.jsx
import React, { useState } from "react";
import "../styles/components/LoginForm.css";
import "../styles/components/ToastMini.css";
import { api } from "../lib/api"; // ✅ dùng client chung, không hardcode localhost

export default function RegisterForm({ onSwitchToLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const showToast = (type, text, ms = 3000) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), ms);
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    const u = username.trim();
    const p = password;
    const cp = confirmPassword;

    if (!u || !p || !cp) {
      showToast("error", "Vui lòng nhập đầy đủ thông tin");
      return;
    }
    if (u.length < 4) {
      showToast("error", "Tên đăng nhập phải ≥ 4 ký tự");
      return;
    }
    if (p.length < 6) {
      showToast("error", "Mật khẩu phải ≥ 6 ký tự");
      return;
    }
    if (p !== cp) {
      showToast("error", "Mật khẩu nhập lại không khớp");
      return;
    }

    try {
      setLoading(true);
      // ✅ gọi qua client chung api
      const res = await api.post("/api/register", { username: u, password: p });

      showToast(
        "success",
        (res.data?.message || "Đăng ký thành công") +
          (res.data?.id ? ` (ID: ${res.data.id})` : "")
      );

      setUsername("");
      setPassword("");
      setConfirmPassword("");

      // Gợi ý chuyển về màn đăng nhập sau khi đăng ký OK
      setTimeout(() => onSwitchToLogin?.(), 800);
    } catch (err) {
      showToast("error", err?.response?.data?.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {toast && (
        <div className={`toast-mini ${toast.type}`}>
          <i
            className={
              toast.type === "success" ? "bx bxs-check-circle" : "bx bxs-shield"
            }
          />
          {toast.text}
          <div className="toast-progress"></div>
        </div>
      )}

      <form className="login-form" onSubmit={handleRegister}>
        <h2>Đăng ký</h2>

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
          autoComplete="new-password"
          required
        />

        <label>Nhập lại mật khẩu:</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          required
        />

        <button type="submit" disabled={loading} aria-busy={loading}>
          {loading ? "Đang đăng ký..." : "Đăng ký"}
        </button>

        {onSwitchToLogin && (
          <p className="login-register-note">
            Đã có tài khoản?{" "}
            <button
              type="button"
              className="register-link"
              onClick={onSwitchToLogin}
              disabled={loading}
            >
              Đăng nhập
            </button>
          </p>
        )}
      </form>
    </>
  );
}
