// src/admin/AdminSidebar.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import "../styles/admin/AdminSidebar.css";

export default function AdminSidebar({
  collapsed = false,
  waitingCount = 0,          // đơn chờ xác nhận
  reviewPending = 0,         // đánh giá/bình luận chờ duyệt
  lowStock = 0,              // cảnh báo tồn kho thấp
  city = "Hanoi",
  cityLabel = "Hà Nội",
  timezone = "Asia/Ho_Chi_Minh",
  weatherApiKey,
}) {
  const sideRef = useRef(null);

  const [now, setNow] = useState(() => new Date());
  const [weather, setWeather] = useState({ temp: null, desc: "", icon: "" });

  // Theme chỉ áp cho Sidebar + Header
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem("uiHeaderTheme") || "dark"; }
    catch { return "dark"; }
  });

  useEffect(() => {
    if (sideRef.current) sideRef.current.setAttribute("data-theme", theme);
    try { localStorage.setItem("uiHeaderTheme", theme); } catch (e) { void e; }
    try { window.dispatchEvent(new CustomEvent("ui-theme-change", { detail: theme })); } catch (e) { void e; }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const apiKey = useMemo(
    () =>
      weatherApiKey ||
      (typeof import.meta !== "undefined" ? import.meta.env?.VITE_OPENWEATHER_KEY : undefined),
    [weatherApiKey]
  );

  // Đồng hồ
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeText = useMemo(() => {
    try {
      return new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: timezone,
      }).format(now);
    } catch {
      return now.toLocaleTimeString("vi-VN");
    }
  }, [now, timezone]);

  // Thời tiết
  const fetchWeather = useCallback(async () => {
    if (!apiKey) return;
    try {
      const q = encodeURIComponent(city);
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${q}&appid=${apiKey}&units=metric&lang=vi`
      );
      if (!res.ok) return;
      const j = await res.json();
      setWeather({
        temp: Math.round(j?.main?.temp ?? 0),
        desc: j?.weather?.[0]?.description || "Thời tiết",
        icon: j?.weather?.[0]?.icon || "",
      });
    } catch (e) {
      void e;
    }
  }, [apiKey, city]);

  useEffect(() => {
    fetchWeather();
    const t = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(t);
  }, [fetchWeather]);

  return (
    <aside ref={sideRef} className={`as ${collapsed ? "is-collapsed" : ""}`}>
      <div className="as-top">
        <div className="as-brand">
          <i className="bx bx-mobile-alt" />
          <span className="as-brand-text">NHAT STORE</span>
        </div>
      </div>

      <nav className="as-nav">
        <div className="as-section">Tổng quan</div>
        <NavLink end to="/admin" className={({ isActive }) => `as-link ${isActive ? "active" : ""}`}>
          <span className="ico">
            <i className="bx bx-grid-alt" />
          </span>
          <span className="txt">Tổng quan</span>
        </NavLink>

        <div className="as-section">Quản trị</div>

        {/* Tài khoản */}
        <NavLink to="/admin/users" className={({ isActive }) => `as-link ${isActive ? "active" : ""}`}>
          <span className="ico">
            <i className="bx bx-group" />
          </span>
          <span className="txt">Tài khoản</span>
        </NavLink>

        {/* Danh mục */}
        <NavLink to="/admin/categories" className={({ isActive }) => `as-link ${isActive ? "active" : ""}`}>
          <span className="ico">
            <i className="bx bx-purchase-tag" />
          </span>
          <span className="txt">Danh mục</span>
        </NavLink>

        {/* Sản phẩm tổng */}
        <NavLink to="/admin/products" className={({ isActive }) => `as-link ${isActive ? "active" : ""}`}>
          <span className="ico">
            <i className="bx bx-mobile-alt" />
          </span>
          <span className="txt">Sản phẩm</span>
          {lowStock > 0 && (
            <span className="badge warn" title="Sản phẩm sắp hết hàng">
              {lowStock}
            </span>
          )}
        </NavLink>

        {/* 🔁 Thay cả 3 mục “Ảnh rời / Thông số / Biến thể” bằng một mục duy nhất */}
        <div className="as-section small">Nội dung sản phẩm</div>
        <NavLink to="/admin/content" className={({ isActive }) => `as-link is-sub ${isActive ? "active" : ""}`}>
          <span className="ico">
            <i className="bx bx-detail" />
          </span>
          <span className="txt">Thông tin sản phẩm</span>
        </NavLink>

        {/* Đánh giá & Bình luận */}
        <NavLink to="/admin/reviews" className={({ isActive }) => `as-link ${isActive ? "active" : ""}`}>
          <span className="ico">
            <i className="bx bx-message-square-dots" />
          </span>
          <span className="txt">Đánh giá &amp; Bình luận</span>
          {reviewPending > 0 && <span className="badge">{reviewPending}</span>}
        </NavLink>

        {/* Đơn hàng */}
        <NavLink to="/admin/orders" className={({ isActive }) => `as-link ${isActive ? "active" : ""}`}>
          <span className="ico">
            <i className="bx bx-receipt" />
          </span>
          <span className="txt">Đơn hàng</span>
          {waitingCount > 0 && <span className="badge">{waitingCount}</span>}
        </NavLink>

        {/* Cửa hàng */}
        <NavLink to="/admin/stores" className={({ isActive }) => `as-link ${isActive ? "active" : ""}`}>
          <span className="ico">
            <i className="bx bx-store" />
          </span>
          <span className="txt">Cửa hàng</span>
        </NavLink>

        <div className="as-section">Báo cáo</div>
        <NavLink to="/admin/reports/revenue" className={({ isActive }) => `as-link ${isActive ? "active" : ""}`}>
          <span className="ico">
            <i className="bx bx-line-chart" />
          </span>
          <span className="txt">Doanh thu</span>
        </NavLink>
        <NavLink to="/admin/reports/inventory" className={({ isActive }) => `as-link ${isActive ? "active" : ""}`}>
          <span className="ico">
            <i className="bx bx-package" />
          </span>
          <span className="txt">Tồn kho</span>
        </NavLink>
      </nav>

      {/* Công tắc Sáng/Tối cho Sidebar + Header */}
      <button
        type="button"
        className={`as-switch ${theme === "light" ? "is-light" : ""}`}
        title="Đổi giao diện Sidebar + Header"
        aria-pressed={theme === "light" ? "true" : "false"}
        onClick={toggleTheme}
      >
        <i className="bx bx-moon moon" aria-hidden="true" />
        <span className="knob">
          <i className={`bx ${theme === "light" ? "bx-sun" : "bx-moon"}`} aria-hidden="true" />
        </span>
        <i className="bx bxs-sun sun" aria-hidden="true" />
      </button>

      {/* Widget: Giờ & Thời tiết */}
      <div className="as-widget">
        <div className="as-clock">
          <i className="bx bx-time-five" />
          <div className="as-clock-meta">
            <strong>{timeText}</strong>
            <span>{cityLabel}</span>
          </div>
        </div>

        <div className="as-weather">
          <div className="as-weather-left">
            <i className="bx bx-cloud" />
            <div className="as-weather-meta">
              <strong>{weather.temp !== null ? `${weather.temp}°C` : "—°C"}</strong>
              <span>{weather.desc}</span>
            </div>
          </div>
          {weather.icon ? (
            <img
              src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
              alt="icon thời tiết"
              width={44}
              height={44}
              loading="lazy"
            />
          ) : null}
        </div>

        {!apiKey && (
          <div className="as-note">
            <i className="bx bx-info-circle" /> Thêm khóa OpenWeather:
          </div>
        )}
      </div>

      <div className="as-bottom">
        <a className="as-help" href="/admin/help">
          <i className="bx bx-help-circle" />
          <span className="txt">Trợ giúp</span>
        </a>
        <div className="as-ver">
          <i className="bx bx-shield-quarter" />
          <span className="txt">Admin • v1.0</span>
        </div>
      </div>
    </aside>
  );
}
