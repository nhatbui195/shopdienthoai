import React, { useState } from "react";
import axios from "axios";
import "../styles/components/LoginForm.css";
import "../styles/components/ToastMini.css";

export default function RegisterForm({ onSwitchToLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3000);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!username || !password || !confirmPassword) {
      showToast("error", "Vui lòng nhập đầy đủ thông tin");
      return;
    }
    if (password !== confirmPassword) {
      showToast("error", "Mật khẩu nhập lại không khớp");
      return;
    }
    try {
      const res = await axios.post("http://localhost:3001/api/register", { username, password });
      showToast("success", (res.data?.message || "Đăng ký thành công") + (res.data?.id ? ` (ID: ${res.data.id})` : ""));
      setUsername("");
      setPassword("");
      setConfirmPassword("");

      // Gợi ý chuyển về màn đăng nhập sau khi đăng ký ok
      setTimeout(() => onSwitchToLogin?.(), 800);

    } catch (err) {
      showToast("error", err.response?.data?.message || "Đăng ký thất bại");
    }
  };

  return (
    <>
      {toast && (
        <div className={`toast-mini ${toast.type}`}>
          <i className={toast.type === "success" ? "bx bxs-check-circle" : "bx bxs-shield"}></i>
          {toast.text}
          <div className="toast-progress"></div>
        </div>
      )}

      <form className="login-form" onSubmit={handleRegister}>
        <h2>Đăng ký</h2>

        <label>Tên đăng nhập:</label>
        <input type="text" value={username} onChange={e => setUsername(e.target.value)} required />

        <label>Mật khẩu:</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />

        <label>Nhập lại mật khẩu:</label>
        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />

        <button type="submit">Đăng ký</button>

        {onSwitchToLogin && (
          <p className="login-register-note">
            Đã có tài khoản?{" "}
            <button type="button" className="register-link" onClick={onSwitchToLogin}>
              Đăng nhập
            </button>
          </p>
        )}
      </form>
    </>
  );
}
