import React, { useEffect, useLayoutEffect, useState, useCallback, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "../styles/components/Header.css";
import AuthModal from "./AuthModal";

const API = "http://localhost:3001";

function readUser() { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } }
function getUsername(u) {
  return (u?.username || u?.tenDangNhap || u?.TenDangNhap || u?.name || u?.fullname || u?.email || "");
}

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  // ===== Account =====
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState(() => readUser());
  const [openAccount, setOpenAccount] = useState(false);
  const userName = getUsername(user);
  const accountRef = useRef(null);
  const refreshUser = useCallback(() => setUser(readUser()), []);

  // ===== Search (gợi ý + overlay) =====
  const [kw, setKw] = useState("");
  const [openSuggest, setOpenSuggest] = useState(false);
  const [suggestions, setSuggestions] = useState([]); // [{IDSanPham, TenSanPham, AnhDaiDien}]
  const [panelStyle, setPanelStyle] = useState({});
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Đặt vị trí panel (fixed) ngay dưới ô input
  // Đặt vị trí panel (fixed) ngay dưới ô input – WIDTH ~500px
const positionPanel = useCallback(() => {
  const el = inputRef.current;
  if (!el) return;
  const r = el.getBoundingClientRect();

  const PANEL_W = Math.min(500, window.innerWidth - 16); // 500px, trừ mép 8px mỗi bên
  // căn trái theo ô input, nhưng không tràn khỏi màn hình
  const left = Math.max(8, Math.min(r.left, window.innerWidth - PANEL_W - 8));

  setPanelStyle({
    position: "fixed",
    top: r.bottom + 8,
    left,
    width: PANEL_W,          // << cố định ~500px
    zIndex: 6500,            // nổi trên overlay
  });
}, []);

  useLayoutEffect(() => { if (openSuggest) positionPanel(); }, [openSuggest, positionPanel]);
  useEffect(() => {
    const reflow = () => openSuggest && positionPanel();
    window.addEventListener("resize", reflow);
    window.addEventListener("scroll", reflow, true);
    return () => {
      window.removeEventListener("resize", reflow);
      window.removeEventListener("scroll", reflow, true);
    };
  }, [openSuggest, positionPanel]);

  // Khóa cuộn body khi overlay mở
  useEffect(() => {
    if (openSuggest) {
      document.body.classList.add("body-modal-open");
    } else {
      document.body.classList.remove("body-modal-open");
    }
    return () => document.body.classList.remove("body-modal-open");
  }, [openSuggest]);

  // API gợi ý (debounce)
  const fetchSuggest = useCallback(async (text) => {
    if (!text) { setSuggestions([]); return; }
    try {
      const url = `${API}/api/suggestions?keyword=${encodeURIComponent(text)}`;
      const res = await fetch(url, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      if (import.meta.env?.DEV) console.debug("suggestions error:", err);
    }
  }, []);

  const onChangeKw = (e) => {
    const v = e.target.value;
    setKw(v);
    setOpenSuggest(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggest(v.trim()), 200);
  };

  const submitSearch = useCallback(() => {
    const key = kw.trim();
    if (!key) return;
    setOpenSuggest(false);
    navigate(`/search?keyword=${encodeURIComponent(key)}`); // sang trang kết quả
  }, [kw, navigate]);

  const onKeyDownSearch = (e) => {
    if (e.key === "Enter") submitSearch();
    if (e.key === "Escape") setOpenSuggest(false);
  };

  const selectSuggest = (item) => {
    setOpenSuggest(false);
    navigate(`/product/${item.IDSanPham}`);
  };

  // ===== Account listeners =====
  useEffect(() => {
    const onAuth = (e) => { setUser(e?.detail?.user ?? readUser()); setOpenAccount(false); setShowLogin(false); };
    const onStorage = (e) => { if (e.key === "user" || e.key === "token") refreshUser(); };
    window.addEventListener("auth-changed", onAuth);
    window.addEventListener("storage", onStorage);
    return () => { window.removeEventListener("auth-changed", onAuth); window.removeEventListener("storage", onStorage); };
  }, [refreshUser]);

  useEffect(() => { refreshUser(); setOpenSuggest(false); }, [location.pathname, refreshUser]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (openAccount && accountRef.current && !accountRef.current.contains(e.target)) setOpenAccount(false);
    };
    const onEsc = (e) => { if (e.key === "Escape") { setOpenAccount(false); setOpenSuggest(false); } };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => { document.removeEventListener("mousedown", onClickOutside); document.removeEventListener("keydown", onEsc); };
  }, [openAccount]);

  const handleAccountClick = () => { if (!user) { setShowLogin(true); return; } setOpenAccount((v) => !v); };

  // Login modal events
  useEffect(() => {
    const open = () => { setOpenAccount(false); setShowLogin(true); };
    const close = () => setShowLogin(false);
    const toggle = () => { setOpenAccount(false); setShowLogin((v) => !v); };
    window.addEventListener("OPEN_LOGIN_MODAL", open);
    window.addEventListener("CLOSE_LOGIN_MODAL", close);
    window.addEventListener("TOGGLE_LOGIN_MODAL", toggle);
    return () => {
      window.removeEventListener("OPEN_LOGIN_MODAL", open);
      window.removeEventListener("CLOSE_LOGIN_MODAL", close);
      window.removeEventListener("TOGGLE_LOGIN_MODAL", toggle);
    };
  }, []);

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Đăng xuất?", html: "Bạn có chắc chắn muốn đăng xuất?",
      icon: undefined, iconHtml: '<i class="bx bx-error"></i>',
      customClass: { icon: "swal2-phone-icon", confirmButton: "swal2-btn-confirm", cancelButton: "swal2-btn-cancel" },
      showCancelButton: true, confirmButtonText: "Đăng xuất", cancelButtonText: "Hủy", reverseButtons: true, focusCancel: true,
    });
    if (result.isConfirmed) {
      try {
        localStorage.removeItem("token"); localStorage.removeItem("user");
        window.dispatchEvent(new CustomEvent("auth-changed", { detail: { user: null } }));
        await Swal.fire({ title: "Đã đăng xuất", text: "Hẹn gặp lại!", icon: "success", timer: 1200, showConfirmButton: false });
      } finally {
        setOpenAccount(false);
        window.location.href = "/";
      }
    }
  };

  const showDevAlert = async () => {
    await Swal.fire({
      title: "Sắp có mặt",
      html: `<div style="line-height:1.6">Tính năng đang phát triển. Vui lòng quay lại sau!</div>`,
      icon: undefined, iconHtml: '<i class="bx bx-wrench"></i>',
      customClass: { icon: "swal2-phone-icon", confirmButton: "swal2-btn-confirm" },
      confirmButtonText: "Đã hiểu",
    });
  };

  return (
    <>
      {/* overlay tối toàn trang, nằm dưới popup suggest */}
      {openSuggest && <div className="hdr-overlay" onClick={() => setOpenSuggest(false)} />}

      <div className="header-bg"></div>

      <header className="header">
        <div className="header-left">
          <Link to="/" className="logo">PHONE STORE</Link>
        </div>

        {/* ô tìm kiếm trên trang chủ */}
        <div className="header-search">
          <input
            ref={inputRef}
            type="text"
            placeholder="Bạn cần tìm gì..."
            value={kw}
            onChange={onChangeKw}
            onFocus={() => { setOpenSuggest(true); positionPanel(); }}
            onKeyDown={onKeyDownSearch}
            aria-label="Tìm kiếm sản phẩm"
          />
          <button className="search-btn" onClick={submitSearch}>
            <i className="bx bx-search" />
          </button>
        </div>

        <nav className="header-actions">
          <a href="tel:1900633471"><i className="bx bx-phone"></i> 1900.633.471</a>
          <Link to="/chinh-sach-bao-hanh"><i className="bx bx-file"></i> Chính sách bảo hành</Link>
          <Link to="/he-thong-cua-hang"><i className="bx bx-store"></i> Hệ thống Cửa hàng</Link>
          <Link to="/gio-hang" className="region-btn" title="Giỏ hàng"><i className="bx bx-cart"></i> Giỏ Hàng</Link>

          <div className="account-pop" ref={accountRef}>
            <button className="account-btn" onClick={handleAccountClick} aria-haspopup="true" aria-expanded={openAccount ? "true" : "false"} title={user ? userName : "Đăng nhập/Đăng ký"}>
              <i className="bx bx-user"></i>
              <span>{user ? userName : "Tài khoản"}</span>
              {user && <i className={`bx ${openAccount ? "bx-chevron-up" : "bx-chevron-down"} caret`} />}
            </button>

            {user && openAccount && (
              <div className="account-menu" role="menu">
                <div className="menu-head">
                  <div className="avatar"><i className="bx bx-user"></i></div>
                  <div className="meta"><strong>{userName}</strong>{user?.email && <div className="sub">{user.email}</div>}</div>
                </div>
                <ul className="menu-list">
                  <li><Link to="/donhang"><i className="bx bx-receipt"></i> Đơn hàng của tôi</Link></li>
                  <li><Link to="/profile" onClick={(e)=>{e.preventDefault();showDevAlert();}}><i className="bx bx-id-card"></i> Hồ sơ</Link></li>
                  <li><Link to="/settings" onClick={(e)=>{e.preventDefault();showDevAlert();}}><i className="bx bx-slider"></i> Cài đặt</Link></li>
                </ul>
                <button className="logout-btn" onClick={handleLogout}><i className="bx bx-log-out"></i> Đăng xuất</button>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* POPUP GỢI Ý – fixed theo vị trí input, z-index > overlay */}
      {openSuggest && (
        <div className="hdr-suggest" style={panelStyle}>
          <div className="hdr-sg-head">
            Xu hướng tìm kiếm <span className="hot">🔥</span>
            <button className="hdr-sg-close" onClick={() => setOpenSuggest(false)} aria-label="Đóng">×</button>
          </div>

          {suggestions.length > 0 ? (
            suggestions.map((s) => (
              <div key={s.IDSanPham} className="hdr-sg-item" onClick={() => selectSuggest(s)} title={s.TenSanPham}>
                <img src={s.AnhDaiDien} alt={s.TenSanPham} />
                <span className="name">{s.TenSanPham}</span>
              </div>
            ))
          ) : (
            <div className="hdr-sg-empty">Nhập từ khóa để tìm sản phẩm…</div>
          )}
        </div>
      )}

      <AuthModal
        open={showLogin}
        onClose={() => setShowLogin(false)}
        onLoginSuccess={(u) => {
          setUser(u ?? readUser());
          window.dispatchEvent(new CustomEvent("auth-changed", { detail: { user: u ?? readUser() } }));
          setShowLogin(false);
        }}
      />
    </>
  );
}
