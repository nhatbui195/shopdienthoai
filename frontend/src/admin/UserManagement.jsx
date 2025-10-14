// src/admin/UserManagement.jsx
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { api } from "../lib/api";                 // ✅ client chung (đã set baseURL & credentials)
import "../styles/admin/UserManagement.css";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // lấy id của user hiện tại (fallback nhiều key)
  const currentUserId = (() => {
    try {
      const u = JSON.parse(localStorage.getItem("user")) || {};
      return u.MaTaiKhoan || u.id || u.userId || null;
    } catch {
      return null;
    }
  })();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/users");
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Load users error:", err);
      Swal.fire({ icon: "error", title: "Lỗi", text: "Không tải được danh sách người dùng." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const removeUser = async (id) => {
    if (currentUserId && Number(id) === Number(currentUserId)) {
      Swal.fire({ icon: "info", title: "Không thể tự xóa chính mình" });
      return;
    }

    const ok = await Swal.fire({
      title: `Xóa tài khoản #${id}?`,
      text: "Hành động không thể hoàn tác.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#ef4444",
    });
    if (!ok.isConfirmed) return;

    Swal.fire({ title: "Đang xóa...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    try {
      await api.delete(`/api/users/${id}`);
      await load();
      Swal.fire({ icon: "success", title: "Đã xóa người dùng", timer: 900, showConfirmButton: false });
    } catch (err) {
      console.error("Remove user error:", err);
      Swal.fire({ icon: "error", title: "Xóa thất bại" });
    }
  };

  const roleBadge = (role) => {
    const v = String(role || "").toLowerCase();
    if (v === "nhanvien" || v === "nhân viên" || v === "staff")
      return <span className="um-badge um-badge--staff">Nhân viên</span>;
    return <span className="um-badge um-badge--user">Khách hàng</span>;
  };

  return (
    <div className="um-wrap">
      <div className="um-card" style={{ overflowX: "auto" }}>
        <h2 className="um-header">Quản lý người dùng</h2>

        {loading ? (
          <p>Đang tải...</p>
        ) : (
          <table className="um-table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Tên đăng nhập</th>
                <th>Vai trò</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const id = u.MaTaiKhoan || u.id || u.userId;
                const username = u.TenDangNhap || u.username || u.email || `user-${id}`;
                return (
                  <tr key={id}>
                    <td>{id}</td>
                    <td>{username}</td>
                    <td>{roleBadge(u.VaiTro || u.role)}</td>
                    <td>
                      <div className="um-actions">
                        <button
                          className={`um-btn um-btn--danger ${
                            currentUserId && Number(id) === Number(currentUserId) ? "um-btn--muted" : ""
                          }`}
                          onClick={() => removeUser(id)}
                          disabled={currentUserId && Number(id) === Number(currentUserId)}
                          title={
                            currentUserId && Number(id) === Number(currentUserId)
                              ? "Không thể xóa chính mình"
                              : "Xóa tài khoản"
                          }
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4}>Không có dữ liệu</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
