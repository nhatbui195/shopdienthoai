// src/admin/Profile.jsx
import React, { useEffect, useState } from "react";
import { api, fileURL } from "../lib/api";
import "../styles/admin/Profile.css";

export default function Profile() {
  const [me, setMe] = useState({
    username: "",
    fullName: "",
    email: "",
    phone: "",
    address: "",
    avatarUrl: "",
  });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  // Load thông tin hiện tại
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/api/admin/me");
        const u = res.data || {};
        setMe({
          username: u.username || u.TenDangNhap || "",
          fullName: u.fullName || u.HoTen || "",
          email: u.email || "",
          phone: u.phone || u.SoDienThoai || "",
          address: u.address || u.DiaChi || "",
          avatarUrl: fileURL(u.avatarUrl || u.AnhDaiDien || ""),
        });
      } catch {
        // noop
      }
    })();
  }, []);

  // Chọn file -> preview ngay
  const onPick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    setMe((m) => ({ ...m, avatarUrl: url }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // 1) cập nhật thông tin text
      await api.put("/api/admin/me", {
        username: me.username,
        fullName: me.fullName,
        email: me.email,
        phone: me.phone,
        address: me.address,
      });

      // 2) nếu có chọn ảnh mới -> upload
      if (file) {
        const fd = new FormData();
        fd.append("avatar", file);
        const up = await api.post("/api/admin/me/avatar", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const newUrl = up?.data?.url || up?.data?.avatarUrl;
        if (newUrl) {
          setMe((m) => ({ ...m, avatarUrl: fileURL(newUrl) }));
        }
      }

      alert("Đã lưu hồ sơ.");
    } catch {
      alert("Lưu thất bại. Vui lòng thử lại!");
    } finally {
      setSaving(false);
    }
  };

  // URL hiển thị (blob giữ nguyên, còn lại ghép base)
  const displayAvatar =
    me.avatarUrl && me.avatarUrl.startsWith("blob:")
      ? me.avatarUrl
      : fileURL(me.avatarUrl);

  return (
    <div className="card profile">
      <div className="profile-title">Hồ sơ cá nhân</div>
      <form onSubmit={onSubmit} className="profile-grid">
        <div className="avatar-col">
          <div className="avatar">
            {displayAvatar ? (
              <img src={displayAvatar} alt="avatar" />
            ) : (
              <i className="bx bx-user" />
            )}
          </div>
          <label className="btn">
            <input type="file" accept="image/*" onChange={onPick} hidden />
            <i className="bx bx-upload" /> Chọn ảnh
          </label>
          <div className="hint">PNG/JPG ≤ 2MB, tỉ lệ vuông hiển thị đẹp.</div>
        </div>

        <div className="form-col">
          <div className="row">
            <label>Tên đăng nhập</label>
            <input
              value={me.username}
              onChange={(e) => setMe((m) => ({ ...m, username: e.target.value }))}
            />
          </div>
          <div className="row">
            <label>Họ và tên</label>
            <input
              value={me.fullName}
              onChange={(e) => setMe((m) => ({ ...m, fullName: e.target.value }))}
            />
          </div>
          <div className="row">
            <label>Email</label>
            <input
              type="email"
              value={me.email}
              onChange={(e) => setMe((m) => ({ ...m, email: e.target.value }))}
            />
          </div>
          <div className="row two">
            <div>
              <label>Số điện thoại</label>
              <input
                value={me.phone}
                onChange={(e) => setMe((m) => ({ ...m, phone: e.target.value }))}
              />
            </div>
            <div>
              <label>Địa chỉ</label>
              <input
                value={me.address}
                onChange={(e) => setMe((m) => ({ ...m, address: e.target.value }))}
              />
            </div>
          </div>

          <div className="actions">
            <button className="btn primary" disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
