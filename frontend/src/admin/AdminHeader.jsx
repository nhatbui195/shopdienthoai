import React, { useCallback, useEffect, useRef, useState } from "react";
 import Swal from "sweetalert2";
 import "../styles/admin/AdminHeader.css";
 import { http, API } from "../../lib/api"; 
const LS_LAST_SEEN_KEY = "admin_last_seen_order_marker";

/** Thuần: chuẩn hoá dữ liệu đơn hàng */
function normalizeOrders(arr) {
  return (arr || []).map((o) => {
    const id =
      o.MaDonHang || o.maDonHang || o.OrderId || o.id || o.ID || String(Math.random());
    const name =
      o.TenKhachHang || o.tenKhachHang || o.CustomerName || o.customerName ||
      (o.KhachHang && (o.KhachHang.Ten || o.KhachHang.name)) ||
      (o.khach && (o.khach.ten || o.khach.name)) ||
      "Khách hàng";
    const time =
      o.CreatedAt || o.createdAt || o.NgayTao || o.ngayTao || o.ThoiGian || o.thoiGian || null;
    const status = o.TrangThai || o.trangThai || o.Status || o.status || "";
    return { id: String(id), name, time, status };
  });
}

export default function AdminHeader({ onToggleSidebar, sidebarOpen }) {
  const [openMenu, setOpenMenu] = useState(false);
  const [openNotif, setOpenNotif] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const [recentOrders, setRecentOrders] = useState([]); // [{id, name, time, status}]

  const menuRef = useRef(null);
  const notifRef = useRef(null);
  const headerRef = useRef(null);

  // NEW: theme chỉ cho Header (đồng bộ với Sidebar qua localStorage + event)
  const [uiTheme, setUiTheme] = useState(() => {
    try { return localStorage.getItem("uiHeaderTheme") || "dark"; }
    catch { return "dark"; }
  });

  useEffect(() => {
    if (headerRef.current) headerRef.current.setAttribute("data-theme", uiTheme);
    const onTheme = (e) => setUiTheme(e?.detail === "light" ? "light" : "dark");
    window.addEventListener("ui-theme-change", onTheme);
    return () => window.removeEventListener("ui-theme-change", onTheme);
  }, [uiTheme]);

  const user = (() => {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  })();

  // đóng popup khi click ra ngoài
  useEffect(() => {
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setOpenNotif(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  /** Fetch đơn gần đây (ổn định tham chiếu) */
  const fetchRecent = useCallback(async () => {
    try {
    const { data: raw } = await http.get("/api/admin/orders/recent", { params: { limit: 5 } });
     if (Array.isArray(raw)) {
        const list = normalizeOrders(raw);
        setRecentOrders(list);

        const marker = localStorage.getItem(LS_LAST_SEEN_KEY) || "";
        const newest = list[0];
        const newestMarker = newest?.id || newest?.time || "";
        if (newestMarker && newestMarker !== marker) setHasNew(true);
        return;
      }
      // fallback: nếu chưa có endpoint recent -> dùng số đơn chờ
      const waitRes = await fetch(`${API}/api/admin/thongke/doncho`);
      if (waitRes.ok) {
        const j = await waitRes.json();
        const waiting = Number(j?.DonHangChoXacNhan || 0);
        setRecentOrders([]);
        setHasNew(waiting > 0);
      }
    } catch {
      // giữ trạng thái cũ nếu lỗi mạng
    }
  }, []);

  // gọi lần đầu & poll mỗi 15s
  useEffect(() => {
    fetchRecent();
    const t = setInterval(fetchRecent, 15000);
    return () => clearInterval(t);
  }, [fetchRecent]);

  // mở popup thông báo => đánh dấu đã xem
  const handleOpenNotif = () => {
    const next = !openNotif;
    setOpenNotif(next);
    if (next) {
      const newest = recentOrders[0];
      const marker = newest?.id || newest?.time || "";
      if (marker) localStorage.setItem(LS_LAST_SEEN_KEY, marker);
      setHasNew(false);
    }
  };

  // SweetAlert2: xác nhận trước khi đăng xuất
  const handleLogout = async () => {
    const confirm = await Swal.fire({
      title: "Đăng xuất?",
      text: "Anh có chắc chắn muốn đăng xuất khỏi trang quản trị không?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Đăng xuất",
      cancelButtonText: "Hủy",
      reverseButtons: true,
      focusCancel: true,
    });

    if (confirm.isConfirmed) {
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } finally {
        // reload cứng để tránh còn tên admin ở header
        window.location.href = "/";
      }
    }
  };

  // Ẩn role nếu là "Nhân viên" để tránh dính chữ
  const roleLabel = (() => {
    const r = user?.VaiTro || user?.role;
    if (!r) return "";
    return String(r).toLowerCase() === "nhân viên" || String(r).toLowerCase() === "nhan vien"
      ? ""
      : r;
  })();

  return (
    <header ref={headerRef} className="ah">
      <button
        className="ah-burger"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
        aria-pressed={sidebarOpen ? "true" : "false"}
        title="Mở/đóng menu"
      >
        <i className={`bx ${sidebarOpen ? "bx-menu" : "bx-menu-alt-right"}`} />
      </button>

      <div className="ah-title"></div>

      <div className="ah-search" role="search">
        <i className="bx bx-search" aria-hidden="true" />
        <input
          placeholder="Tìm kiếm trong quản trị (đơn hàng, sản phẩm, khách...)"
          aria-label="Tìm kiếm trong quản trị"
        />
      </div>

      <div className="ah-actions">
        {/* Thông báo */}
        <div className="ah-pop" ref={notifRef}>
          <button
            className="ah-icon ah-badge"
            title="Thông báo"
            aria-haspopup="true"
            aria-expanded={openNotif ? "true" : "false"}
            onClick={handleOpenNotif}
          >
            <i className="bx bx-bell" />
            {hasNew && <span className="dot" />}
          </button>
          {openNotif && (
            <div className="ah-pop-menu">
              <div className="ah-pop-head">Thông báo</div>
              <ul className="ah-list">
                {recentOrders.length > 0 ? (
                  recentOrders.map((o) => (
                    <li key={o.id} title={o.time ? String(o.time) : undefined}>
                      <i className="bx bx-cart" />
                      <span>
                        <strong>{o.name}</strong> vừa đặt hàng
                        {o.status ? ` (${o.status})` : ""}.
                      </span>
                    </li>
                  ))
                ) : (
                  <li><i className="bx bx-check-circle" /> Chưa có đơn mới.</li>
                )}
              </ul>
              <button className="ah-link" onClick={() => (window.location.href = "/admin/orders")}>
                Xem tất cả đơn hàng
              </button>
            </div>
          )}
        </div>

        {/* Cài đặt nhanh */}
        <button className="ah-icon" title="Cài đặt">
          <i className="bx bx-cog" />
        </button>

        {/* Tài khoản PRO */}
        <div className="ah-me" ref={menuRef}>
          <button
            className="ah-me-btn"
            aria-haspopup="true"
            aria-expanded={openMenu ? "true" : "false"}
            onClick={() => setOpenMenu(!openMenu)}
            title="Tài khoản"
          >
            <span className="ah-avatar">
              <span className="ring" />
              <i className="bx bx-user" aria-hidden="true" />
              <span className="online" aria-label="Đang trực tuyến" />
            </span>

            <div className="ah-me-meta">
              <strong className="ah-name">
                {user?.username || "admin"}
                <span className="ah-pro">
                  <i className="bx bxs-crown" /> PRO
                </span>
              </strong>

              {/* Chỉ hiển thị role khi khác "Nhân viên" */}
              {roleLabel && <span className="ah-role">{roleLabel}</span>}
            </div>

            <i className={`bx ${openMenu ? "bx-chevron-up" : "bx-chevron-down"} ah-caret`} />
          </button>

          {openMenu && (
            <div className="ah-menu">
              <div className="ah-menu-head">
                <div className="ah-avatar sm">
                  <i className="bx bx-user" />
                </div>
                <div>
                  <div className="ah-name-row">
                    <strong>{user?.username || "admin"}</strong>
                    <span className="ah-pro sm"><i className="bx bxs-crown" /> PRO</span>
                  </div>
                  {roleLabel && <div className="ah-role sm">{roleLabel}</div>}
                </div>
              </div>
              <ul className="ah-menu-list">
                <li><a href="/admin/profile"><i className="bx bx-id-card" /> Hồ sơ của tôi</a></li>
                <li><a href="/admin/settings"><i className="bx bx-slider" /> Cài đặt</a></li>
                <li><a href="/admin/billing"><i className="bx bx-credit-card" /> Gói & thanh toán</a></li>
              </ul>
              <div className="ah-menu-sep" />
              <button className="ah-logout" onClick={handleLogout}>
                <i className="bx bx-log-out" /> Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
