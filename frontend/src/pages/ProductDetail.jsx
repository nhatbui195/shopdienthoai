// src/pages/ProductDetail.jsx
import React, { useEffect, useRef, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import TopBar from "../components/TopBar";
import "../styles/pages/ProductDetail.css";
import OrderSheet from "./OrderSheet.jsx"; // ✅ gọi OrderSheet để đặt hàng
import Swal from "sweetalert2";
import { upsertCartItem } from "../utils/cart";
import { Link } from "react-router-dom";


const API = "http://localhost:3001";

/* ================= Helpers ================= */
const safeImage = (src) => (src && src.startsWith("http") ? src : `${API}${src || ""}`);
const getId    = (p) => p?.MaSanPham ?? p?.id ?? p?.ID ?? "";
const getName  = (p) => p?.TenSanPham ?? p?.name ?? "Sản phẩm";
const getPrice = (p) => Number(p?.DonGia ?? p?.GiaBan ?? p?.price ?? 0) || 0;
const fmtVND   = (n) => (Number(n) || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

const pickImages = (p) => {
  let list = [];
  try {
    if (Array.isArray(p?.HinhAnhList)) list = p.HinhAnhList;
    else if (typeof p?.HinhAnhList === "string") list = JSON.parse(p.HinhAnhList);
  } catch { list = []; }
  const single = p?.HinhAnh || p?.image;
  const merged = [...list];
  if (single && !merged.includes(single)) merged.unshift(single);
  return merged.length ? merged : ["/placeholder.png"];
};

const uniq = (arr) => Array.from(new Set((arr || []).map((x) => String(x).trim()).filter(Boolean)));
const splitCSV = (s) =>
  String(s ?? "")
    .split(/[,;\n]/g)
    .map((t) => t.trim())
    .filter(Boolean);

/* ===== Rule tăng giá demo (không có giá theo biến thể ở BE) ===== */
const colorExtraCache = new Map();
function colorExtra(labelRaw) {
  const label = String(labelRaw || "").trim();
  if (!label) return 0;
  if (label.toLowerCase() === "đen" || label.toLowerCase() === "den") return 1_000_000;
  if (colorExtraCache.has(label)) return colorExtraCache.get(label);
  const rand = Math.round((Math.random() * 500_000) / 100_000) * 100_000;
  colorExtraCache.set(label, rand);
  return rand;
}
function capacityExtra(capRaw) {
  const s = String(capRaw || "").toUpperCase();
  if (s.includes("1TB")) return 4_000_000;
  if (s.includes("512")) return 3_000_000;
  if (s.includes("256")) return 2_000_000;
  if (s.includes("128")) return 1_000_000;
  return 0; // 64GB hoặc khác
}

/* ================ Spec row ================ */
function SpecRow({ label, value }) {
  const val = value ?? "Đang cập nhật";
  const isUpdating = typeof val === "string" && /đang cập nhật/i.test(val.trim());
  return (
    <div className="spec-row">
      <span className="spec-label">{label}</span>
      <span className={`spec-value ${isUpdating ? "updating" : ""}`}>{val}</span>
    </div>
  );
}

export default function ProductDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const slugify = (s = "") =>
    s.toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const [prod, setProd] = useState(null);
  const [specs, setSpecs] = useState(null);
  const [variants, setVariants] = useState([]);   // mảng { MaCTThem, MauSac, PhienBan }
  const [activeImg, setActiveImg] = useState(0);
  const [color, setColor] = useState(null);
  const [capacity, setCapacity] = useState(null);
  const [qty, setQty] = useState(1);
  const [stores, setStores] = useState([]);
  const [province, setProvince] = useState("Hà Nội");
  const [cms, setCms] = useState({ infos: [], topics: [], faqs: [] });

  // ✅ trạng thái mở OrderSheet + ref để scroll
  const [openSheet, setOpenSheet] = useState(false);
  const sheetRef = useRef(null);

  // Reveal queues
  const leftQueue = useRef([]);
  const rightQueue = useRef([]);

  /* ============ Load product & stores ============ */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    leftQueue.current = [];
    rightQueue.current = [];
    setActiveImg(0);

    const ctrl = new AbortController();

    axios
      .get(`${API}/api/products/${id}`, { signal: ctrl.signal })
      .then((res) => setProd(res.data || {}))
      .catch((e) => {
        if (e.name !== "CanceledError") console.error("Load product error:", e);
      });

    axios.get(`${API}/api/stores`).then((r) => setStores(r.data || [])).catch(() => {});

    return () => ctrl.abort();
  }, [id]);

  /* ============ Load specs, variants, cms ============ */
  useEffect(() => {
    if (!id) return;

    axios
      .get(`${API}/api/chitietsanpham/${id}`)
      .then((r) => setSpecs(r.data || null))
      .catch(() => setSpecs(null));

    axios
      .get(`${API}/api/products/${id}/variants`)
      .then((r) => setVariants(Array.isArray(r.data) ? r.data : []))
      .catch(() => setVariants([]));

    axios
      .get(`${API}/api/products/${id}/extended`)
      .then((r) => {
        const data = r.data || {};
        const cmsObj = {
          infos: Array.isArray(data.infos) ? data.infos : [],
          topics: Array.isArray(data.topics) ? data.topics : [],
          faqs: Array.isArray(data.faqs) ? data.faqs : [],
        };
        setCms(cmsObj);
      })
      .catch(() => setCms({ infos: [], topics: [], faqs: [] }));
  }, [id]);

  /* ============ Suy ra danh sách màu & phiên bản từ variants ============ */
  const colorList = useMemo(() => {
    const fromVariants = uniq(variants.map((v) => v.MauSac));
    if (fromVariants.length) return fromVariants;
    return uniq([
      ...splitCSV(prod?.MauSac),
      ...splitCSV(specs?.MauSac),
      ...(Array.isArray(prod?.MauSacList) ? prod.MauSacList : []),
    ]);
  }, [variants, prod, specs]);

  const capacityList = useMemo(() => {
    const fromVariants = uniq(variants.map((v) => v.PhienBan));
    if (fromVariants.length) return fromVariants;
    return uniq([
      ...splitCSV(specs?.BoNhoTrong),
      ...splitCSV(specs?.PhienBan),
      ...splitCSV(prod?.BoNhoTrong),
      ...splitCSV(prod?.PhienBan),
      ...splitCSV(prod?.DungLuong),
      ...(Array.isArray(prod?.PhienBanList) ? prod.PhienBanList : []), /* ✅ fix typo */
      ...(Array.isArray(prod?.BoNhoTrongList) ? prod.BoNhoTrongList : []),
    ]);
  }, [variants, prod, specs]);
  const segments = useMemo(() => {
  if (!prod) return [];
  return [
    { label: "Điện thoại", href: "/dien-thoai", dim: true },      // mục trung gian (tùy anh)
    prod?.HangSanXuat
      ? { label: prod.HangSanXuat, href: `/hang/${slugify(prod.HangSanXuat)}`, dim: true }
      : null,
    { label: getName(prod) },                                     // mục cuối (current)
  ].filter(Boolean);
}, [prod]);


  /* ============ Đặt lựa chọn mặc định hợp lệ ============ */
  useEffect(() => {
    if (colorList.length && (!color || !colorList.includes(color))) {
      setColor(colorList[0]);
    }
  }, [colorList, color]);

  useEffect(() => {
    if (capacityList.length && (!capacity || !capacityList.includes(capacity))) {
      setCapacity(capacityList[0]);
    }
  }, [capacityList, capacity]);

  /* ============ Tính toán các giá trị hiển thị ============ */
  const images = pickImages(prod);
  const name = getName(prod);

  const basePrice = getPrice(prod);
  const variantExtra =
    (color ? colorExtra(String(color)) : 0) +
    (capacity ? capacityExtra(String(capacity)) : 0);

  const unitPrice = Math.max(0, basePrice + variantExtra);
  const totalPrice = unitPrice * qty;

  const oldPriceWithExtra = (() => {
    const suggest = basePrice > 0 ? Math.round((basePrice * 1.03) / 1000) * 1000 : 0;
    const baseOld = prod?.GiaNiemYet || suggest;
    return Math.max(0, baseOld + variantExtra);
  })();
  const oldTotalPrice = oldPriceWithExtra * qty;

  const loyalPrice = unitPrice > 0 ? Math.max(0, unitPrice - 100000) : 0;
  const eduPrice   = unitPrice > 0 ? Math.max(0, unitPrice - 100000) : 0;

  /* ===== Cart & Buy ===== */
  const handleAddToCart = async () => {
  const imagesArr = pickImages(prod);
  const item = {
    id: getId(prod) || `${getName(prod)}:${String(color)}:${String(capacity)}`,
    name: getName(prod),
    image: safeImage(imagesArr[0]),
    price: Number(unitPrice || 0),
    color: String(color || ""),
    capacity: String(capacity || ""),
  };

  const qtyNum = Math.max(1, Number(qty) || 1);
  const nextList = upsertCartItem(item, qtyNum); // ghi vào localStorage("cart") + dispatch CART_UPDATED

  const totalQty = nextList.reduce((s, it) => s + (Number(it.qty) || 0), 0);
  await Swal.fire({
    toast: true,
    position: "top-end",
    icon: "success",
    title: "Đã thêm vào giỏ!",
    html: `<div style="text-align:left">
             <b>${item.name}</b><br/>${item.color} ${item.capacity} × +${qtyNum}<br/>
             <small>Tổng SL trong giỏ: ${totalQty}</small>
           </div>`,
    showConfirmButton: true,
    confirmButtonText: "Xem giỏ hàng",
    timer: 1600,
    timerProgressBar: true,
  }).then(r => { if (r.isConfirmed) window.location.href = "/gio-hang"; });
};


  // ✅ Mua ngay: mở OrderSheet với dữ liệu đang chọn + scroll tới form
  const handleBuyNow = () => {
   setOpenSheet(true); // mở overlay — KHÔNG scroll
  };

  /* ===== TOC động từ CMS ===== */
  const tocItems = useMemo(() => {
    const fromInfos = (cms?.infos || [])
      .map((it, i) => (it?.heading ? { text: it.heading, anchor: `cms-info-${i}` } : null))
      .filter(Boolean);
    const fromTopics = (cms?.topics || []).length > 0 ? [{ text: "Chủ đề nổi bật", anchor: "cms-topics" }] : [];
    const fromFaqs   = (cms?.faqs   || []).length > 0 ? [{ text: "Câu hỏi thường gặp", anchor: "cms-faqs" }] : [];
    return [...fromInfos, ...fromTopics, ...fromFaqs];
  }, [cms]);

  /* ===== Reveal theo nhóm ===== */
  const makeRevealer = (group) => (node) => {
    if (!node) return;
    const q = group === "left" ? leftQueue.current : rightQueue.current;
    if (!q.includes(node)) {
      node.classList.add("reveal");
      q.push(node);
    }
  };

  useEffect(() => {
    const setup = (nodes) => {
      if (!nodes.length) return null;
      let lastReveal = 0;
      const stagger = 140;

      const io = new IntersectionObserver(
        (entries) => {
          entries
            .filter((en) => en.isIntersecting)
            .sort((a, b) => nodes.indexOf(a.target) - nodes.indexOf(b.target))
            .forEach((en) => {
              const el = en.target;
              const now = Date.now();
              const delay = Math.max(0, lastReveal + stagger - now);
              el.style.transitionDelay = `${delay}ms`;
              el.classList.add("reveal--in");
              lastReveal = now + delay;
              io.unobserve(el);
            });
        },
        { threshold: 0.12 }
      );
      nodes.forEach((el) => io.observe(el));
      return io;
    };

    const leftIO  = setup(leftQueue.current.filter(Boolean));
    const rightIO = setup(rightQueue.current.filter(Boolean));
    return () => {
      leftIO?.disconnect();
      rightIO?.disconnect();
    };
  }, [prod, cms, variants]);

  if (!prod) {
    return (
      <div className="pd-loading" style={{ padding: 20, textAlign: "left" }}>
        Đang tải dữ liệu sản phẩm…
      </div>
    );
  }

  return (
    <div className="pd-wrap">
      <TopBar
        showBack={true}
        segments={segments}           // ✅ giữ cái này
        className="crumb-docked"
        leftIcon="bx bx-home-alt"
        onLeftClick={() => navigate("/")}
      />
            <div className="pd-top">
        {/* ===== LEFT: Gallery & Stores ===== */}
        <section className="pd-gallery" ref={makeRevealer("left")}>
          <div className="pd-gallery__main">
            <img src={safeImage(pickImages(prod)[activeImg])} alt={getName(prod)} />
            <button
              className="pd-gallery__nav pd-gallery__nav--left"
              onClick={() => setActiveImg((p) => (p - 1 + pickImages(prod).length) % pickImages(prod).length)}
              aria-label="Ảnh trước"
            >
              ‹
            </button>
            <button
              className="pd-gallery__nav pd-gallery__nav--right"
              onClick={() => setActiveImg((p) => (p + 1) % pickImages(prod).length)}
              aria-label="Ảnh sau"
            >
              ›
            </button>
          </div>

          <div className="pd-gallery__thumbs">
            <button className="pd-thumb pd-thumb--lib" title="Thư viện">
              Thư viện
            </button>
            {pickImages(prod).map((src, i) => (
              <button
                key={i}
                className={`pd-thumb ${i === activeImg ? "active" : ""}`}
                onClick={() => setActiveImg(i)}
                aria-label={`Ảnh ${i + 1}`}
              >
                <img src={safeImage(src)} alt={`${getName(prod)} - ảnh ${i + 1}`} />
              </button>
            ))}
          </div>

         
            <div className="pd-banner">
              <Link to="/back-to-school" aria-label="Back to School" style={{ display: "block" }}>
                <img
                  src="https://clickbuy.com.vn/core/img/EduScoreMultiplier.png"
                  alt="Back to School"
                  loading="lazy"
                 
                />
              </Link>
            </div>

          {/* Cửa hàng */}
          <div className="pd-stores card">
            <h3>Địa chỉ cửa hàng</h3>
            <div className="pd-stores__row">
              <select value={province} onChange={(e) => setProvince(e.target.value)}>
                <option>Hà Nội</option>
                <option>Hồ Chí Minh</option>
                <option>Đà Nẵng</option>
              </select>
            </div>
            <ul className="pd-stores__list">
              {(stores || [])
                .filter((s) => !province || (s.city || s.City || "").includes(province))
                .slice(0, 6)
                .map((s, i) => (
                  <li key={i}>
                    <span className="zalo">Zalo</span>
                    <a href={`tel:${s.phone || s.Phone}`}>{s.phone || s.Phone}</a>
                    <span className="addr">{s.address || s.Address}</span>
                  </li>
                ))}
            </ul>

            <div className="pd-stores__consult">
              <button className="btn outline">Đăng ký để được tư vấn</button>
              <div className="pd-stores__consult-row">
                <input placeholder="Tư vấn qua số điện thoại" />
                <button className="btn danger">Gửi</button>
              </div>
            </div>

            <div className="pd-b2b">
              <h4>Khách hàng doanh nghiệp</h4>
              <p>Đối tác liên hệ Phòng Kinh Doanh B2B để được hỗ trợ tốt nhất.</p>
              <p><strong>Mr.Nhật:</strong> 0393138346</p>
              <p>Email: nhatbui642893@gmail.com.vn</p>
            </div>
          </div>
        </section>

        {/* ===== RIGHT: Info & Buy ===== */}
        <aside className="pd-info" ref={makeRevealer("right")}>
          <h1 className="pd-title">{getName(prod)}</h1>

          <div className="pd-rating">
            <div className="stars">★★★★★</div>
            <span>
              ({Number(prod?.ReviewStats?.SoDanhGia || 0)} đánh giá, trung bình{" "}
              {Number(prod?.ReviewStats?.DiemTB || 0).toFixed(1)}/5)
            </span>
            <a className="link" href="#pd-specs">
              Thông số kỹ thuật<i className="bx bx-chip" />
            </a>
          </div>

          <div className="pd-prices">
            {!!oldPriceWithExtra && oldTotalPrice > totalPrice ? (
              <div className="pd-old">{fmtVND(oldTotalPrice)}</div>
            ) : (
              <div className="pd-old pd-old--empty">&nbsp;</div>
            )}
            <div className="pd-current">{fmtVND(totalPrice)}</div>
            <button className="pd-emi" type="button">Trả góp 0%</button>
            <div className="pd-zero">Trả góp chỉ từ 0₫</div>
          </div>

          {!!capacityList?.length && (
            <div className="pd-variants">
              <div className="v-title">Phiên bản khác</div>
              <div className="v-group">
                {capacityList.map((cap) => (
                  <button
                    key={String(cap)}
                    className={`chip ${String(cap) === String(capacity) ? "active" : ""}`}
                    onClick={() => setCapacity(cap)}
                    type="button"
                  >
                    {cap}
                    <span className="price-mini">
                      {fmtVND(
                        getPrice(prod) +
                        capacityExtra(String(cap)) +
                        (color ? colorExtra(String(color)) : 0)
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!!colorList?.length && (
            <div className="pd-variants">
              <div className="v-title">Màu sắc:</div>
              <div className="v-group">
                {colorList.map((c) => {
                  const val = c?.value || c;
                  const label = c?.label || c;
                  return (
                    <button
                      key={String(val)}
                      className={`chip ${String(val) === String(color) ? "active" : ""}`}
                      onClick={() => setColor(val)}
                      type="button"
                      title={label}
                    >
                      <span>{label}</span>
                      <span className="price-mini">
                        {fmtVND(
                          getPrice(prod) +
                          colorExtra(String(label)) +
                          (capacity ? capacityExtra(String(capacity)) : 0)
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ✅ Đã đổi nút: Mua ngay + Thêm vào giỏ */}
          <div className="pd-actions">
            <div className="qty">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))}>-</button>
              <input
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
              />
              <button type="button" onClick={() => setQty((q) => q + 1)}>+</button>
            </div>

            {/* MUA NGAY -> mở OrderSheet */}
            <button className="btn primary" type="button" onClick={handleBuyNow}>
              Mua ngay
            </button>

            {/* THÊM VÀO GIỎ */}
            <button className="btn outline" type="button" onClick={handleAddToCart}>
              Thêm vào giỏ
            </button>
          </div>

          <div className="pd-special-prices">
            <div>
              <div className="sp-title">Khách hàng thân thiết</div>
              <div className="sp-price">{fmtVND(loyalPrice)}</div>
            </div>
            <div>
              <div className="sp-title">Ưu đãi Edu</div>
              <div className="sp-price">{fmtVND(eduPrice)}</div>
            </div>
          </div>

          {/* Khuyến mãi */}
          <div className="pd-promos card" ref={makeRevealer("right")}>
            <h3>Khuyến mãi hấp dẫn</h3>
            {(() => {
              const fromDb = (Array.isArray(prod?.KhuyenMai) ? prod.KhuyenMai : []).map(k => ({
                title: k.TieuDe,
                desc: k.MoTa || "",
              }));
              const fallback = [
                { title: "Trả góp 0% lãi – 0 phụ phí", desc: "Kỳ hạn 3–6 tháng (chi tiết)" },
                { title: "Tặng mua bảo hiểm chính hãng", desc: "Đến khi hết quà (chi tiết)" },
                { title: "Dán màn hình chính hãng", desc: "Rẻ vỡ – Vào nước" },
                { title: "Thu cũ – Đổi mới trợ giá", desc: "Tối đa 1.000.000₫" },
              ];
              const promos = fromDb.length ? fromDb : fallback;

              const guessType = (s="") => {
                s = s.toLowerCase();
                if (s.includes("trả góp") || s.includes("0%")) return "installment";
                if (s.includes("bảo hiểm")) return "insurance";
                if (s.includes("dán màn") || s.includes("màn hình")) return "screen";
                if (s.includes("thu cũ") || s.includes("đổi mới")) return "tradein";
                if (s.includes("tặng")) return "gift";
                if (s.includes("giảm")) return "discount";
                return "default";
              };

              const PromoIcon = ({ type }) => {
                switch (type) {
                  case "installment": return (<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="2" fill="none" stroke="currentColor" /><rect x="3.5" y="9" width="17" height="2" fill="currentColor" /></svg>);
                  case "insurance":  return (<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 3l7 3v6c0 4.418-3.134 6.99-7 9-3.866-2.01-7-4.582-7-9V6l7-3z" fill="none" stroke="currentColor"/><path d="M9 12l2 2 4-4" fill="none" stroke="currentColor" strokeWidth="1.6"/></svg>);
                  case "screen":     return (<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="7" y="3" width="10" height="18" rx="2" fill="none" stroke="currentColor"/><circle cx="12" cy="18" r="1" fill="currentColor"/></svg>);
                  case "tradein":    return (<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M3 12a9 9 0 0115.5-6.36" fill="none" stroke="currentColor"/><path d="M19 5v4h-4" fill="none" stroke="currentColor"/><path d="M21 12a9 9 0 01-15.5 6.36" fill="none" stroke="currentColor"/><path d="M5 19v-4h4" fill="none" stroke="currentColor"/></svg>);
                  case "gift":       return (<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="3" y="8" width="18" height="12" rx="2" fill="none" stroke="currentColor"/><path d="M12 8v12M3 12h18" fill="none" stroke="currentColor"/><path d="M7.5 8c-1.657 0-3-1.12-3-2.5S5.5 3 7 5l2 3h-1.5zM16.5 8c1.657 0 3-1.12 3-2.5S18.5 3 17 5l-2 3h1.5z" fill="none" stroke="currentColor"/></svg>);
                  case "discount":   return (<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 14l10-10 6 6-10 10H4v-6z" fill="none" stroke="currentColor"/><circle cx="8.5" cy="8.5" r="1.2" fill="currentColor"/></svg>);
                  default:           return (<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 3l3 6 6 .9-4.5 4.3 1 6-5.5-3-5.5 3 1-6L3 9.9 9 9l3-6z" fill="none" stroke="currentColor"/></svg>);
                }
              };

              return (
                <ul className="promo-grid">
                  {promos.map((p, i) => (
                    <li className="promo-item" key={i}>
                      <div className="promo-icon"><PromoIcon type={guessType(`${p.title} ${p.desc}`)} /></div>
                      <div className="promo-text">
                        <div className="promo-title">{p.title}</div>
                        {p.desc && <div className="promo-desc">{p.desc}</div>}
                      </div>
                    </li>
                  ))}
                </ul>
              );
            })()}

            <div className="pd-cta">
              {/* ✅ Nút MUA NGAY ở block khuyến mãi cũng mở OrderSheet */}
              <button className="btn danger" type="button" onClick={handleBuyNow}>MUA NGAY</button>
              <button className="btn outline" type="button" onClick={handleAddToCart}>THÊM VÀO GIỎ</button>
            </div>
          </div>

          {/* Chủ đề nổi bật từ CMS */}
          <div className="pd-topics card" ref={makeRevealer("right")} id="cms-topics">
            <h3>Chủ đề nổi bật</h3>
            {cms?.topics?.length ? (
              <ul className="topics-list dotless">
                {cms.topics.map((t, i) => (<li key={i}>{t.title || t}</li>))}
              </ul>
            ) : (
              <div className="muted">Đang cập nhật</div>
            )}
          </div>
        </aside>
      </div>

      {/* ===== Nội dung chính (CMS) ===== */}
      <section className="pd-content">
        <div className="toc" ref={makeRevealer("left")}>
          <h3>Nội dung chính</h3>
          {tocItems.length > 0 ? (
            <ol className="dotless">
              {tocItems.map((t) => (
                <li key={t.anchor}>
                  <a href={`#${t.anchor}`}>{t.text}</a>
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted">Chưa có nội dung mô tả cho sản phẩm này.</p>
          )}
        </div>

        <article className="article" ref={makeRevealer("right")}>
          {(cms?.infos || []).map((it, idx) => (
            <div key={idx} id={`cms-info-${idx}`} className="cms-block">
              {it?.heading && <h4>{it.heading}</h4>}
              {it?.body && <p>{it.body}</p>}
            </div>
          ))}

          {(cms?.faqs || []).length > 0 && (
            <div id="cms-faqs" className="cms-block">
              <h3>Câu hỏi thường gặp</h3>
              <div className="cms-faqs">
                {cms.faqs.map((f, i) => (
                  <details key={i} className="faq-item">
                    <summary>{f.q}</summary>
                    <div className="faq-a">{f.a}</div>
                  </details>
                ))}
              </div>
            </div>
          )}
        </article>
      </section>

      {/* ===== Thông số kỹ thuật ===== */}
      <section id="pd-specs" className="pd-specs card" ref={makeRevealer("left")}>
        <h3>Thông số kỹ thuật {getName(prod)}</h3>
        <div className="specs-stack">
          <SpecRow label="Kích thước màn hình" value={specs?.KichThuocManHinh || prod?.ManHinh} />
          <SpecRow label="CPU" value={specs?.CPU || prod?.CPU} />
          <SpecRow label="Hệ điều hành" value={specs?.HeDieuHanh || prod?.HeDieuHanh} />
          <SpecRow label="Bộ nhớ trong" value={capacity || specs?.BoNhoTrong || prod?.BoNhoTrong} />
          <SpecRow label="Camera chính" value={specs?.CameraChinh || prod?.CameraChinh} />
          <SpecRow label="Màu sắc" value={color || specs?.MauSac || prod?.MauSac} />
          <SpecRow label="Phiên bản" value={capacity || specs?.PhienBan || prod?.DungLuong} />
          <SpecRow label="Hãng sản xuất" value={specs?.HangSanXuat || prod?.HangSanXuat || "Đang cập nhật"} />
          <SpecRow label="Tình trạng SP" value={specs?.TinhTrang || prod?.TinhTrang || "New"} />
        </div>
        <button className="btn outline block" type="button">Xem chi tiết ▾</button>
      </section>

      {/* ===== Review ===== */}
      <section className="pd-reviews" ref={makeRevealer("right")}>
        <h3>Bình luận và Đánh giá</h3>
        <div className="rv-summary">
          <div className="rv-score">
            <div className="score">{Number(prod?.ReviewStats?.DiemTB || 0).toFixed(1)}/5</div>
            <div className="stars">★★★★★</div>
            <div className="note">({Number(prod?.ReviewStats?.SoDanhGia || 0)} đánh giá)</div>
          </div>
          <ul className="rv-bars">
            {[5, 4, 3, 2, 1].map((s) => (
              <li key={s}>
                <span>{s} Sao</span>
                <div className="bar"><i style={{ width: "0%" }} /></div>
                <span>0 đánh giá</span>
              </li>
            ))}
          </ul>
        </div>

        <form className="rv-form" onSubmit={(e) => e.preventDefault()}>
          <div className="stars-input" title="Chấm sao">★★★★★</div>
          <textarea placeholder="Hãy để lại bình luận của bạn tại đây!" rows={4} />
          <div className="rv-form__row">
            <input placeholder="Tên *" required />
            <input placeholder="Điện thoại" />
          </div>
          <button className="btn danger" type="submit">Gửi</button>
        </form>
      </section>

      {/* ================== OrderSheet ================== */}
      {openSheet && (
        <div id="order-sheet" ref={sheetRef}>
          <OrderSheet
            open={true}
            onClose={() => setOpenSheet(false)}
            isLoggedIn={!!localStorage.getItem("token")}
            product={{
              id: getId(prod),
              name,
              image: safeImage(images[0]),
              price: unitPrice,
              oldPrice: oldPriceWithExtra,
            }}
            colors={(Array.isArray(colorList) ? colorList : []).map((m) => ({
              key: m?.value || m,
              label: m?.label || m,
              img: safeImage(images[0]),
              price: unitPrice,
            }))}
            capacities={Array.isArray(capacityList) ? capacityList : []}
            initialColor={color}
            initialCapacity={capacity}
            initialQty={qty}
          />
        </div>
      )}
    </div>
  );
}
