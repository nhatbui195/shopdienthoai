// src/pages/BackToSchool.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "../styles/pages/BackToSchool.css";
import BreadcrumbBar from "../components/BreadcrumbBar";
import { api, fileURL } from "../lib/api"; // ✅ dùng client chung

void motion;

/* ============== Helpers ============== */
const safeImage = (src) => fileURL(src || "");
const getId = (p) => p?.MaSanPham ?? p?.id ?? p?.ID ?? String(Math.random());
const getPrice = (p) => Number(p?.DonGia ?? p?.GiaBan ?? 0) || 0;
const nameOf = (p) => String(p?.TenSanPham || p?.name || "");
const norm = (s = "") => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const brandOf = (p) =>
  String(p?.ThuongHieu || p?.Brand || p?.Hang || p?.brand || p?.thuongHieu || "").toLowerCase();

const isClickbuyImg = (url) => {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname.includes("clickbuy.com.vn");
  } catch {
    return false;
  }
};

/* ============== Predicates ============== */
const byMacbook = (p) => {
  const n = norm(nameOf(p));
  const b = brandOf(p);
  const hasMac =
    n.includes("macbook") ||
    n.includes("mac book") ||
    /\bmbp\b/.test(n) ||
    /\bmba\b/.test(n) ||
    (n.includes("macbook") && (n.includes("air") || n.includes("pro")));
  const appleHint = b.includes("apple") || n.includes("apple");
  return hasMac || (appleHint && n.includes("mac"));
};
const byIpad = (p) => {
  const n = norm(nameOf(p));
  const b = brandOf(p);
  const hasIpad = n.includes("ipad") || n.includes("i pad");
  const series = hasIpad || n.includes("air") || n.includes("mini") || n.includes("pro");
  const appleHint = b.includes("apple") || n.includes("apple");
  return hasIpad || (appleHint && series);
};
const byPhone     = (p) => /(iphone|samsung|xiaomi|realme|oppo|vivo|nokia|tecno)/i.test(norm(nameOf(p)));
const byWatch     = (p) => /(watch|dong ho|đong ho|đồng ho|đồng hồ|galaxy watch|apple watch)/i.test(norm(nameOf(p)));
const byEarbuds   = (p) => /(airpods|buds|earbuds|tai nghe|headphone|headset)/i.test(norm(nameOf(p)));
const byOld       = (p) => /(cu|cũ|renew|99%|95%|like new|hang cu|hàng cũ)/i.test(norm(nameOf(p)));
const byClearance = (p) =>
  /(xa kho|xả kho|clearance|sale|gia soc|giá sốc)/i.test(norm(nameOf(p))) || getPrice(p) > 0;

/* ============== Framer Motion variants ============== */
const revealUp = {
  hidden: { opacity: 0, y: 22, scale: 0.98, filter: "saturate(0.95) contrast(0.98)" },
  show:   { opacity: 1, y: 0,  scale: 1,    filter: "none", transition: { duration: 0.6, ease: [0.2,0.7,0.2,1] } }
};
const revealLeft = {
  hidden: { opacity: 0, x: -28, filter: "saturate(0.95) contrast(0.98)" },
  show:   { opacity: 1, x: 0,   filter: "none", transition: { duration: 0.6, ease: [0.2,0.7,0.2,1] } }
};
const revealRight = {
  hidden: { opacity: 0, x: 28, filter: "saturate(0.95) contrast(0.98)" },
  show:   { opacity: 1, x: 0,  filter: "none", transition: { duration: 0.6, ease: [0.2,0.7,0.2,1] } }
};
const zoomIn = {
  hidden: { opacity: 0, scale: 1.03, filter: "saturate(0.95) contrast(0.98)" },
  show:   { opacity: 1, scale: 1,    filter: "none", transition: { duration: 0.7, ease: [0.2,0.7,0.2,1] } }
};
const tapWiggle = {
  scale: [1, 0.985, 1],
  rotate: [0, -1.2, 1.2, -0.8, 0.8, 0],
  transition: { duration: 0.45, ease: "easeInOut" }
};

export default function BackToSchool() {
  const [data, setData] = useState([]);
  const navigate = useNavigate();

  /* ============== Fetch products ============== */
  useEffect(() => {
    const ctrl = new AbortController();
    api.get("/api/products", { signal: ctrl.signal })
      .then((res) => setData(res.data || []))
      .catch(() => {});
    return () => ctrl.abort();
  }, []);

  /* ============== pick ============== */
  const pick = useCallback((pred, limit = 10, sortBy = "descPrice") => {
    const arr = (data || []).filter(pred);
    if (sortBy === "descPrice") arr.sort((a, b) => getPrice(b) - getPrice(a));
    if (sortBy === "ascPrice")  arr.sort((a, b) => getPrice(a) - getPrice(b));
    return arr.slice(0, limit);
  }, [data]);

  /* ============== Groups ============== */
  const macbooks   = useMemo(() => pick(byMacbook,   10, "descPrice"), [pick]);
  const ipads      = useMemo(() => pick(byIpad,      10, "descPrice"), [pick]);
  const phones     = useMemo(() => pick(byPhone,     10, "descPrice"), [pick]);
  const oldItems   = useMemo(() => pick(byOld,       10, "descPrice"), [pick]);
  const earbuds    = useMemo(() => pick(byEarbuds,   10, "ascPrice"),  [pick]);
  const watches    = useMemo(() => pick(byWatch,     10, "descPrice"), [pick]);
  const clearance  = useMemo(() => pick(byClearance, 10, "ascPrice"),  [pick]);

  /* ============== Assets ============== */
  const hero = useMemo(() => ({
    top:   "https://clickbuy.com.vn/uploads/landingpage/2_55876.png?v=2",
    cta:   "https://clickbuy.com.vn/uploads/landingpage/2_55992.png?v=2",
    title: "https://clickbuy.com.vn/uploads/landingpage/2_55895.png?v=2",
  }), []);

  const strips = useMemo(() => ({
    mac:   "https://clickbuy.com.vn/uploads/2025/6/a5d505a5fccc4984b9ffc649ff94a80b.png",
    ipad:  "https://clickbuy.com.vn/uploads/2025/6/fd9b1427c7c24285b71b1a6e739ea348.png",
    phone: "https://clickbuy.com.vn/uploads/2025/6/ac56b37ffc3641f6af945c3daf52abd6.png",
    old:   "https://clickbuy.com.vn/uploads/2025/6/e04bf382561547b29c33e1e42d5a6311.png",
    ear:   "https://clickbuy.com.vn/uploads/2025/6/1a33041ab2494dc98b883d7dcbe609c8.png",
    watch: "https://clickbuy.com.vn/uploads/2025/6/b5cd5da9c6b94e12ac668aaaed722d9b.png",
    xakho: "https://clickbuy.com.vn/uploads/2025/7/2b8ccfffd5314c58b5178a34d99d3f69.png",
  }), []);

  const tiles = useMemo(() => ([
    { key: "mac",    href: "#macbook",  img: "https://clickbuy.com.vn/uploads/landingpage/2_56513.png" },
    { key: "ipad",   href: "#ipad",     img: "https://clickbuy.com.vn/uploads/landingpage/2_55886.png" },
    { key: "phone",  href: "#phone",    img: "https://clickbuy.com.vn/uploads/landingpage/2_55887.png" },
    { key: "old",    href: "#old",      img: "https://clickbuy.com.vn/uploads/landingpage/2_55888.png" },
    { key: "ear",    href: "#ear",      img: "https://clickbuy.com.vn/uploads/landingpage/2_55889.png" },
    { key: "watch",  href: "#watch",    img: "https://clickbuy.com.vn/uploads/landingpage/2_55890.png" },
    { key: "xakho",  href: "#xakho",    img: "https://clickbuy.com.vn/uploads/landingpage/2_55891.png" },
    { key: "tradein",href: "/trade-in", img: "https://clickbuy.com.vn/uploads/landingpage/2_55892.png" },
  ]), []);

  const crumbs = useMemo(() => ([
    { label: "Trang chủ", href: "/", icon: "bx bxs-home" },
    { label: "Khuyến mãi", dim: true },
    { label: "Back to School 2025", strong: true }
  ]), []);

  /* ============== Smooth hash nav ============== */
  const navigateHash = useCallback((href) => {
    const id = href.slice(1);
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, "", href);
    } else {
      navigate(href);
    }
  }, [navigate]);

  const handleHashClick = useCallback((e, href) => {
    if (!href.startsWith("#")) return;
    e.preventDefault();
    navigateHash(href);
  }, [navigateHash]);

  /* ============== Product card ============== */
  const renderItem = (p) => {
    const img = safeImage(p?.HinhAnhList?.[0] || p?.HinhAnh);
    const price = getPrice(p);
    return (
      <div className="product-item" key={getId(p)}>
        {p?.TraGop && <div className="installment-badge">{p.TraGop}</div>}
        <Link to={`/product/${p.MaSanPham}`}>
          <img src={img} alt={p?.TenSanPham} loading="lazy" />
          <h3 title={p?.TenSanPham}>{p?.TenSanPham}</h3>
          <div className="price">
            {price.toLocaleString("vi-VN")} đ
            {p?.GiaCu && <span className="old-price">{Number(p.GiaCu).toLocaleString("vi-VN")} đ</span>}
          </div>
          <div className="rating">
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} className="star">
                {i < Math.round(Number(p?.SoSao || 0)) ? "★" : "☆"}
              </span>
            ))}
            <span className="rating-count">({Number(p?.SoDanhGia || 0)})</span>
          </div>
          <div className="edu-vip-row">
            {p?.GiaEdu && <div className="edu">Ưu đãi Edu: {Number(p.GiaEdu).toLocaleString("vi-VN")} đ</div>}
            {p?.GiaVip && <div className="vip">Khách thân thiết: {Number(p.GiaVip).toLocaleString("vi-VN")} đ</div>}
          </div>
        </Link>
      </div>
    );
  };

  /* ============== View ============== */
  return (
    <div className="bts-wrap">
      {/* Breadcrumb “đè” lên nền đỏ */}
      <BreadcrumbBar
        segments={crumbs}
        leftIcon="bx bx-menu-alt-left"
        className="crumb-docked bts-crumb"
      />

      {/* Hero / CTA / Title */}
      <motion.img
        className="bts-hero cb-clickable"
        src={"https://clickbuy.com.vn/uploads/landingpage/2_55876.png?v=2"}
        alt=""
        variants={zoomIn}
        initial="hidden"
        whileInView="show"
        whileTap={tapWiggle}
        viewport={{ once: false, amount: 0.25 }}
      />

      <div className="bts-cta">
        <motion.img
          className="cb-clickable"
          src={"https://clickbuy.com.vn/uploads/landingpage/2_55992.png?v=2"}
          alt=""
          variants={revealLeft}
          initial="hidden"
          whileInView="show"
          whileTap={tapWiggle}
          viewport={{ once: false, amount: 0.25 }}
        />
      </div>

      <div className="bts-title">
        <motion.img
          className="cb-clickable"
          src={"https://clickbuy.com.vn/uploads/landingpage/2_55895.png?v=2"}
          alt=""
          variants={revealRight}
          initial="hidden"
          whileInView="show"
          whileTap={tapWiggle}
          viewport={{ once: false, amount: 0.25 }}
        />
      </div>

      {/* 8 ô cam */}
      <div className="bts-tiles">
        {tiles.map((t, i) => {
          const isHash = t.href.startsWith("#");
          const hoverFx = { scale: 1.015, y: -3, transition: { duration: 0.18 } };

          const inner = (
            <motion.img
              className="bts-tile-full cb-clickable"
              src={t.img}
              alt=""
              variants={revealUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: false, amount: 0.3 }}
              transition={{ delay: i * 0.06 }}
              whileHover={hoverFx}
              whileTap={tapWiggle}
            />
          );

          if (isHash) {
            return (
              <a
                key={t.key}
                href={t.href}
                className="bts-tile"
                onClick={(e) => handleHashClick(e, t.href)}
                aria-label={t.key}
              >
                {inner}
              </a>
            );
          }
          if (t.href.startsWith("/")) {
            return (
              <Link key={t.key} to={t.href} className="bts-tile" aria-label={t.key}>
                {inner}
              </Link>
            );
          }
          return (
            <a key={t.key} href={t.href} className="bts-tile" aria-label={t.key}>
              {inner}
            </a>
          );
        })}
      </div>

      {/* Sections */}
      <section id="macbook" className="bts-section">
        <motion.img
          className="bts-strip cb-clickable"
          src={strips.mac}
          alt=""
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          whileTap={tapWiggle}
          viewport={{ once: false, amount: 0.3 }}
        />
        <div className="product-list-grid wide">{macbooks.map(renderItem)}</div>
      </section>

      <section id="ipad" className="bts-section">
        <motion.img
          className="bts-strip cb-clickable"
          src={strips.ipad}
          alt=""
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          whileTap={tapWiggle}
          viewport={{ once: false, amount: 0.3 }}
        />
        <div className="product-list-grid wide">{ipads.map(renderItem)}</div>
      </section>

      <section id="phone" className="bts-section">
        <motion.img
          className="bts-strip cb-clickable"
          src={strips.phone}
          alt=""
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          whileTap={tapWiggle}
          viewport={{ once: false, amount: 0.3 }}
        />
        <div className="product-list-grid wide">{phones.map(renderItem)}</div>
      </section>

      <section id="old" className="bts-section">
        <motion.img
          className="bts-strip cb-clickable"
          src={strips.old}
          alt=""
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          whileTap={tapWiggle}
          viewport={{ once: false, amount: 0.3 }}
        />
        <div className="product-list-grid wide">{oldItems.map(renderItem)}</div>
      </section>

      <section id="ear" className="bts-section">
        <motion.img
          className="bts-strip cb-clickable"
          src={strips.ear}
          alt=""
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          whileTap={tapWiggle}
          viewport={{ once: false, amount: 0.3 }}
        />
        <div className="product-list-grid wide">{earbuds.map(renderItem)}</div>
      </section>

      <section id="watch" className="bts-section">
        <motion.img
          className="bts-strip cb-clickable"
          src={strips.watch}
          alt=""
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          whileTap={tapWiggle}
          viewport={{ once: false, amount: 0.3 }}
        />
        <div className="product-list-grid wide">{watches.map(renderItem)}</div>
      </section>

      <section id="xakho" className="bts-section">
        <motion.img
          className="bts-strip cb-clickable"
          src={strips.xakho}
          alt=""
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          whileTap={tapWiggle}
          viewport={{ once: false, amount: 0.3 }}
        />
        <div className="product-list-grid wide">{clearance.map(renderItem)}</div>
      </section>
    </div>
  );
}
