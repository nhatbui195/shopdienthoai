import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "../styles/admin/UserManagement.css";

const API = "http://localhost:3001";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentUserId = (() => {
    try { return JSON.parse(localStorage.getItem("user"))?.id || null; }
    catch { return null; }
  })();

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/users`);
      setUsers(res.data || []);
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
      await axios.delete(`${API}/api/users/${id}`);
      await load();
      Swal.fire({ icon: "success", title: "Đã xóa người dùng", timer: 900, showConfirmButton: false });
    } catch (err) {
      console.error("Remove user error:", err);
      Swal.fire({ icon: "error", title: "Xóa thất bại" });
    }
  };

  const roleBadge = (role) => {
    const v = String(role || "").toLowerCase();
    if (v === "nhanvien") return <span className="um-badge um-badge--staff">Nhân viên</span>;
    return <span className="um-badge um-badge--user">Khách hàng</span>;
    // Nếu sau này có thêm vai trò khác thì bổ sung ở đây.
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
              {users.map((u) => (
                <tr key={u.MaTaiKhoan}>
                  <td>{u.MaTaiKhoan}</td>
                  <td>{u.TenDangNhap}</td>
                  <td>{roleBadge(u.VaiTro)}</td>
                  <td>
                    <div className="um-actions">
                      <button
                        className={`um-btn um-btn--danger ${currentUserId && Number(u.MaTaiKhoan) === Number(currentUserId) ? "um-btn--muted" : ""}`}
                        onClick={() => removeUser(u.MaTaiKhoan)}
                        disabled={currentUserId && Number(u.MaTaiKhoan) === Number(currentUserId)}
                        title={currentUserId && Number(u.MaTaiKhoan) === Number(currentUserId) ? "Không thể xóa chính mình" : "Xóa tài khoản"}
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
