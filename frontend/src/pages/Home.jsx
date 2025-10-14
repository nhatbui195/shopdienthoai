// src/pages/Home.jsx
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import SidebarMenu from "../components/SidebarMenu";
import "../styles/pages/Home.css";
import { api, fileURL } from "../lib/api";

/* ================= Helpers ================= */
// CHANGED: bỏ random để key/link ổn định
const getId = (p) => p?.MaSanPham ?? p?.id ?? p?.ID ?? null;
const safeImage = (src) => fileURL(src);
const stripDiacritics = (s = "") =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const pickBrand = (p) =>
  p?.ThuongHieu || p?.Brand || p?.Hang || p?.brand || p?.thuongHieu || "";
const getPrice = (p) => Number(p?.DonGia ?? p?.GiaBan ?? 0) || 0;

/** Từ khóa phụ kiện -> gom về nhóm Khác */
const ACCESSORY_KEYWORDS = [
  "ốp","op","case","bao da","bao-da",
  "sạc","sac","củ sạc","cu sac","adapter","dock","hub",
  "cáp","cap","cable","dây","day","sạc nhanh","sac nhanh",
  "kính cường lực","dán","dan man","kinh cuong luc","film",
  "chuột","chuot","bàn phím","ban phim","stylus","bút","but",
  "dây đeo","day deo","strap","airtag","mica","giá đỡ","stand"
];

export default function Home() {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  /* ================= Banners & Tabs ================= */
  const banners = useMemo(
    () => [
      "https://clickbuy.com.vn/uploads/media/777-osXFs.png",
      "https://clickbuy.com.vn/uploads/media/765-AgzQl.png",
      "https://clickbuy.com.vn/uploads/media/768-tpfEf.png",
      "https://clickbuy.com.vn/uploads/media/764-GeDyD.png",
      "https://clickbuy.com.vn/uploads/media/777-osXFs.png",
    ],
    []
  );
  const bannerRoutes = useMemo(
    () => [
      "/back-to-school",
      "/product/13",
      "/product/33",
      "/product/42",
      "/promo-finance",
    ],
    []
  );

  const dealTabs = useMemo(
    () => [
      { text: "Back To Shool 2025 - EDU DEAL XỊN", bannerIndex: 0 },
      { text: "iPad Gen 11 giá hấp dẫn",           bannerIndex: 1 },
      { text: "iPad Pro M4 - Cấu Hình Đỉnh, Giá Rẻ", bannerIndex: 2 },
      { text: "Z Flip 7 Tính Năng Vượt Trội",    bannerIndex: 3 },
      { text: "Ưu Đãi Dành Cho Tân Sinh Viên", bannerIndex: 4 },
    ],
    []
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const autoplayRef = useRef(null);

  /* ================= Fetch products ================= */
  useEffect(() => {
    const ctrl = new AbortController();
    api
      .get("/api/products", { signal: ctrl.signal })
      .then((res) => setProducts(res.data || []))
      .catch((err) => {
        if (err.name !== "CanceledError") console.error("Lỗi tải sản phẩm:", err);
      });
    return () => ctrl.abort();
  }, []);

  /* ================= Slider controls ================= */
  const prevSlide = useCallback(
    () => setCurrentIndex((p) => (p - 1 + banners.length) % banners.length),
    [banners.length]
  );
  const nextSlide = useCallback(
    () => setCurrentIndex((p) => (p + 1) % banners.length),
    [banners.length]
  );

  useEffect(() => {
    autoplayRef.current = setInterval(nextSlide, 3000);
    return () => clearInterval(autoplayRef.current);
  }, [nextSlide]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") prevSlide();
      if (e.key === "ArrowRight") nextSlide();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prevSlide, nextSlide]);

  useEffect(() => {
    setActiveTab(currentIndex);
  }, [currentIndex]);

  const onTabClick = (e, idx) => {
    e.preventDefault();
    setCurrentIndex(idx);
    setActiveTab(idx);
    clearInterval(autoplayRef.current);
    autoplayRef.current = setInterval(nextSlide, 3000);
  };
  const onBannerClick = (idx) => {
    const route = bannerRoutes[idx];
    if (route) navigate(route);
  };

  /* ================= Grouping sản phẩm ================= */
  const groups = useMemo(
    () => [
      { key: "iphone",  label: "IPHONE",   brands: ["apple"],  keywords: ["iphone"] },
      { key: "macbook", label: "MACBOOK",  brands: ["apple"],  keywords: ["macbook","mac book"] },
      { key: "ipad",    label: "IPAD",     brands: ["apple"],  keywords: ["ipad"] },
      { key: "samsung", label: "SAMSUNG",  brands: ["samsung"], keywords: ["galaxy","samsung"] },
      { key: "xiaomi",  label: "XIAOMI",   brands: ["xiaomi"],  keywords: ["xiaomi","redmi","mi"] },
      { key: "realme",  label: "REALME",   brands: ["realme"],  keywords: ["realme"] },
      { key: "dongho",  label: "ĐỒNG HỒ",  brands: [], keywords: ["đồng hồ","dong ho","watch"] },
      { key: "tainghe", label: "TAI NGHE", brands: [], keywords: ["tai nghe","earbuds","airpods","headphone"] },
      { key: "apple",   label: "APPLE",    brands: ["apple"],  keywords: [] },
    ],
    []
  );
  const RIGHT_BANNERS = [
    { id: 29, src: "https://clickbuy.com.vn/uploads/media/676-vqobu.png", alt: "QC 1" },
    { id: 45, src: "https://clickbuy.com.vn/uploads/media/671-sKdOs.png", alt: "QC 2" },
    { id: 69, src: "https://clickbuy.com.vn/uploads/media/678-GGcvA.jpg",  alt: "QC 3" },
  ];

  const goProduct = (id) => navigate(`/product/${id}`);
  const relevanceScore = useCallback((p, g) => {
    const brand = String(pickBrand(p) || "").toLowerCase();
    const nm = stripDiacritics(String(p?.TenSanPham || p?.name || ""));
    let score = 0;
    if (g.brands?.length) {
      if (!brand) score += 1;
      else if (g.brands.some((b) => brand.includes(b))) score += 3;
    }
    if (g.keywords?.length) {
      g.keywords.forEach((kw) => {
        const k = stripDiacritics(kw);
        if (nm.startsWith(k)) score += 4;
        else if (nm.includes(k)) score += 2;
      });
    }
    score += Math.min(3, Math.floor(getPrice(p) / 10_000_000));
    return score;
  }, []);
  const SMALL_BANNER = {
    id: 24,
    src: "https://clickbuy.com.vn/uploads/media/657-ydoyn.png",
    alt: "Quảng cáo",
  };

  const matchGroup = useCallback((p, g) => {
    const brandRaw = pickBrand(p);
    const brand = String(brandRaw || "").toLowerCase();
    const name = stripDiacritics(String(p?.TenSanPham || p?.name || ""));
    if (ACCESSORY_KEYWORDS.some((kw) => name.includes(stripDiacritics(kw)))) return false;

    const hasBrand = !!brandRaw;
    const brandHit = !g.brands?.length || (hasBrand && g.brands.some((b) => brand.includes(b)));
    const keywordHit = !g.keywords?.length || g.keywords.some((kw) => name.includes(stripDiacritics(kw)));

    if (["iphone","ipad","macbook"].includes(g.key)) return keywordHit && (g.brands?.length ? brandHit || !hasBrand : true);
    if (["samsung","xiaomi","realme"].includes(g.key)) return brandHit || keywordHit;
    if (["dongho","tainghe"].includes(g.key)) return keywordHit;
    if (g.key === "apple") return hasBrand && g.brands.some((b) => brand.includes(b));
    return false;
  }, []);

  const grouped = useMemo(() => {
    const byKey = {};
    const used = new Set();
    groups.forEach((g) => (byKey[g.key] = []));
    const rest = [];

    (products || []).forEach((p) => {
      const id = getId(p);
      if (!id || used.has(id)) return;
      const g = groups.find((gr) => matchGroup(p, gr));
      if (g) {
        byKey[g.key].push(p);
        used.add(id);
      } else rest.push(p);
    });

    Object.keys(byKey).forEach((k) => {
      const g = groups.find((x) => x.key === k);
      if (g) byKey[k].sort((a, b) => relevanceScore(b, g) - relevanceScore(a, g));
    });

    return { byKey, rest };
  }, [products, groups, matchGroup, relevanceScore]);

  const [expanded, setExpanded] = useState({});
  const toggleGroup = (key) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  /* ================= Render product item ================= */
  // CHANGED: điều hướng toàn thẻ bằng navigate
  const renderItem = (p) => {
    const id = getId(p);
    if (!id) return null;
    const img = safeImage(p?.HinhAnhList?.[0] || p?.HinhAnh);
    const price = getPrice(p);

    const goDetail = () => navigate(`/product/${id}`);

    return (
      <article
        className="product-item"
        key={id}
        role="link"
        tabIndex={0}
        onClick={goDetail}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && goDetail()}
        aria-label={`Xem chi tiết ${p?.TenSanPham || "sản phẩm"}`}
      >
        {p?.TraGop && <div className="installment-badge">{p.TraGop}</div>}

        <div className="product-clickable">
          <img src={img} alt={p?.TenSanPham || "Sản phẩm"} loading="lazy" />
          <h3 title={p?.TenSanPham}>{p?.TenSanPham}</h3>

          <div className="price">
            {price.toLocaleString("vi-VN")} đ
            {p?.GiaCu && (
              <span className="old-price">
                {Number(p.GiaCu).toLocaleString("vi-VN")} đ
              </span>
            )}
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
            {p?.GiaEdu && (
              <div className="edu">Ưu đãi Edu: {Number(p.GiaEdu).toLocaleString("vi-VN")} đ</div>
            )}
            {p?.GiaVip && (
              <div className="vip">Khách thân thiết: {Number(p.GiaVip).toLocaleString("vi-VN")} đ</div>
            )}
          </div>
        </div>
      </article>
    );
  };

  /* ================= View ================= */
  return (
    <>
      <div className="container">
        <SidebarMenu />

        <div className="center-side">
          {/* ===== HERO ===== */}
          <div className="hero">
            {/* Slider */}
            <div className="slider-container">
              <div
                className="slider-track"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              >
                {banners.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt={`Banner ${idx + 1}`}
                    loading="lazy"
                    onClick={() => onBannerClick(idx)}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onBannerClick(idx)}
                    role="button"
                    tabIndex={0}
                    style={{ cursor: bannerRoutes[idx] ? "pointer" : "default" }}
                  />
                ))}
              </div>

              <button className="slider-prev" aria-label="Ảnh trước" onClick={prevSlide}>
                &#10094;
              </button>
              <button className="slider-next" aria-label="Ảnh sau" onClick={nextSlide}>
                &#10095;
              </button>

              <div className="slider-dots" role="tablist" aria-label="Chọn banner">
                {banners.map((_, i) => (
                  <button
                    key={i}
                    className={`dot ${i === currentIndex ? "active" : ""}`}
                    aria-label={`Đến banner ${i + 1}`}
                    aria-selected={i === currentIndex}
                    onClick={() => setCurrentIndex(i)}
                  />
                ))}
              </div>
            </div>

            {/* Tabs sát ảnh */}
            <div className="deal-tabs">
              {dealTabs.map((t, i) => (
                <button
                  key={i}
                  className={`deal-tab ${activeTab === i ? "active" : ""}`}
                  onClick={(e) => onTabClick(e, t.bannerIndex)}
                >
                  {t.text}
                </button>
              ))}
            </div>
          </div>

          <div className="small-image-block">
            <img
              src={SMALL_BANNER.src}
              alt={SMALL_BANNER.alt}
              loading="lazy"
              role="button"
              tabIndex={0}
              onClick={() => goProduct(SMALL_BANNER.id)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && goProduct(SMALL_BANNER.id)}
              style={{ cursor: "pointer" }}
              title="Xem chi tiết sản phẩm"
            />
          </div>
        </div>

        <div className="right-side">
          <div className="image-block">
            {RIGHT_BANNERS.map(b => (
              <img
                key={b.id}
                src={b.src}
                alt={b.alt}
                loading="lazy"
                role="button"
                tabIndex={0}
                onClick={() => goProduct(b.id)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && goProduct(b.id)}
                style={{ cursor: "pointer" }}
                title="Xem chi tiết sản phẩm"
              />
            ))}
          </div>
        </div>
      </div>

      {/* ===== GROUP SECTIONS ===== */}
      {[
        "iphone", "macbook", "ipad",
        "samsung", "xiaomi", "realme",
        "dongho", "tainghe", "apple",
      ].map((key) => {
        const g = groups.find((x) => x.key === key);
        const all = grouped.byKey[key] || [];
        if (!g || !all.length) return null;

        const showAll = !!expanded[key];
        const visible = showAll ? all : all.slice(0, 10);

        return (
          <section className="group-section" key={key}>
            <button
              className="group-tag"
              onClick={() =>
                navigate(`/search?keyword=${encodeURIComponent(g.label)}`)
              }
              title={`Xem tất cả ${g.label}`}
            >
              {g.label}
            </button>

            <div className="group-body">
              <div className="product-list-grid wide">
                {visible.map((p) => renderItem(p))}
              </div>

              {all.length > 10 && (
                <div className="group-footer">
                  <button
                    className="group-more"
                    onClick={() => toggleGroup(key)}
                    aria-expanded={showAll ? "true" : "false"}
                  >
                    {showAll ? "Thu gọn" : `Xem thêm (${all.length - 10})`}
                  </button>
                </div>
              )}
            </div>
          </section>
        );
      })}

      {/* ===== SẢN PHẨM KHÁC ===== */}
      {(grouped.rest || []).length > 0 && (
        <section className="group-section" key="others">
          <button className="group-tag" disabled>
            Khác
          </button>
          <div className="group-body">
            <div className="product-list-grid wide">
              {grouped.rest.map((p) => renderItem(p))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

