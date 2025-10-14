// src/pages/OrderSheet.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import Swal from "sweetalert2";
import "../styles/pages/OrderSheet.css";
import { upsertCartItem } from "../utils/cart";

const API = "http://localhost:3001";
const fmtVND = (n) =>
  (Number(n) || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

/* =================== helpers =================== */
const readJSON = (k, fb) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } };
const readUser = () => readJSON("user", {});

const keyOfCap = (cap) =>
  (typeof cap === "string" ? cap : (cap?.key || cap?.label || cap?.value || ""));
const keyOfColor = (c) =>
  (c?.key || c?.value || c?.label || "");

const getId = (p) => p?.MaSanPham ?? p?.id ?? p?.ID ?? null;
const getProductName = (p) =>
  p?.TenSanPham ?? p?.tenSanPham ?? p?.name ?? p?.Name ?? p?.title ?? null;

const isEmail = (s) => !s || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s).trim());

/* ----- SĐT VN: chấp nhận 0/84/+84 và chuẩn hoá về dạng nội địa 0xxxxxxxx(x) ----- */
const normalizePhoneVNLocal = (raw) => {
  let v = String(raw || "").trim().replace(/[^\d+]/g, "");
  if (!v) return null;
  if (v.startsWith("+84")) v = "0" + v.slice(3);
  else if (v.startsWith("84")) v = "0" + v.slice(2);
  if (!/^0\d{8,9}$/.test(v)) return null; // 9–10 số nội địa
  return v;
};

export default function OrderSheet({
  open,
  onClose,
  product,
  colors = [],
  capacities = [],
  initialColor,
  initialCapacity,
  initialQty = 1,
  onSubmitted,
}) {
  /* ---------- Portal mount ---------- */
  const portalElRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  if (!portalElRef.current) {
    const el = document.createElement("div");
    el.setAttribute("id", "ordersheet-portal");
    portalElRef.current = el;
  }

  useEffect(() => {
    const el = portalElRef.current;
    document.body.appendChild(el);
    setMounted(true);
    return () => {
      setMounted(false);
      try { document.body.removeChild(el); } catch (err) { void err; }
    };
  }, []);

  /* ---------- State ---------- */
  const firstColorKey = colors?.length ? keyOfColor(colors[0]) : "";
  const firstCapKey = capacities?.length ? keyOfCap(capacities[0]) : "";

  const [color, setColor] = useState(initialColor || firstColorKey || "");
  const [capacity, setCapacity] = useState(initialCapacity || firstCapKey || "");
  const [qty, setQty] = useState(Math.max(1, Number(initialQty) || 1));

  const [hoTen, setHoTen] = useState("");
  const [sdt, setSDT] = useState("");
  const [email, setEmail] = useState("");
  const [delivery, setDelivery] = useState("GIAO TẬN NƠI");
  const [city, setCity] = useState("");
  const [diaChi, setDiaChi] = useState("");
  const [ghiChu, setGhiChu] = useState("");
  const [voucher, setVoucher] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // User từ localStorage
  const [user, setUser] = useState(() => readUser());
  useEffect(() => {
    const onAuth = (e) => setUser(e?.detail?.user || readUser());
    const onStorage = (e) => { if (e.key === "user" || e.key === "token") setUser(readUser()); };
    window.addEventListener("auth-changed", onAuth);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("auth-changed", onAuth);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const maKhachHang = user?.MaTaiKhoan ?? user?.MaKhachHang ?? user?.id ?? null;
  const token = (() => { try { return localStorage.getItem("token"); } catch { return null; } })();
  const isAuthed = !!(maKhachHang || token);

  /* ---------- Giá theo biến thể ---------- */
  const basePrice = Number(product?.price || 0);
  const findColor = (k) => colors.find((c) => keyOfColor(c) === k);
  const findCapacity = (k) => capacities.find((cap) => keyOfCap(cap) === k);

  const computePrice = (colorKey, capacityKey) => {
    const cObj = findColor(colorKey) || {};
    const capObj = findCapacity(capacityKey) || {};

    const capHasAbs = typeof capObj === "object" && capObj?.price != null;
    const capHasDelta = typeof capObj === "object" && capObj?.priceDelta != null;

    const colorHasAbs = cObj?.price != null;
    const colorHasDelta = cObj?.priceDelta != null;

    let price;
    if (capHasAbs) price = Number(capObj.price);
    else if (capHasDelta) price = basePrice + Number(capObj.priceDelta);
    else if (!capHasAbs && colorHasAbs) price = Number(cObj.price);
    else price = basePrice;

    if (colorHasDelta) price += Number(cObj.priceDelta);
    return Math.max(0, Number(price) || 0);
  };

  const donGia = computePrice(color, capacity);
  const tongTien = donGia * qty;

  // Đồng bộ default khi props thay đổi
  useEffect(() => {
    if (!color && colors.length) setColor(keyOfColor(colors[0]));
    if (!capacity && capacities.length) setCapacity(keyOfCap(capacities[0]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colors, capacities]);

  // Khoá cuộn body khi mở sheet
  useEffect(() => {
    if (!open) return undefined;
    const root = document.documentElement;
    const sbw = window.innerWidth - root.clientWidth;
    root.style.setProperty("--sbw", `${sbw}px`);
    document.body.classList.add("lock-scroll");
    return () => {
      document.body.classList.remove("lock-scroll");
      root.style.removeProperty("--sbw");
    };
  }, [open]);

  // Bắt đăng nhập khi mở sheet
  useEffect(() => {
    if (!open || isAuthed) return;
    Swal.fire({
      icon: "warning",
      title: "Tài khoản chưa đăng nhập",
      text: "Vui lòng đăng nhập để tiếp tục đặt hàng.",
      confirmButtonText: "Đăng nhập ngay",
      showCancelButton: true,
      cancelButtonText: "Để sau",
      allowOutsideClick: false,
      allowEscapeKey: true,
    }).then((r) => {
      if (r.isConfirmed) {
        window.dispatchEvent(new CustomEvent("OPEN_LOGIN_MODAL"));
      } else {
        onClose?.();
      }
    });
  }, [open, isAuthed, onClose]);

  /* =================== VALIDATION =================== */
  const validateBeforeSubmit = React.useCallback(() => {
    const errors = [];
    const tenSanPham = getProductName(product);
    const phienBan = String(capacity || "").trim();
    const hoTenTrim = String(hoTen || "").trim();
    const sdtTrim = String(sdt || "").trim();
    const sdtLocal = normalizePhoneVNLocal(sdtTrim);
    const emailTrim = String(email || "").trim();
    const cityTrim = String(city || "").trim();
    const diaChiTrim = String(diaChi || "").trim();
    const soLuongNum = Math.max(1, Number(qty) || 1);
    const donGiaNum = Math.max(0, Number(donGia) || 0);

    if (!hoTenTrim) errors.push("• Họ và tên không được để trống");
    if (!sdtTrim) errors.push("• Số điện thoại không được để trống");
    if (sdtTrim && !sdtLocal) errors.push("• Số điện thoại không hợp lệ (0…, 84… hoặc +84…, 9–10 số)");
    if (!cityTrim) errors.push("• Vui lòng chọn Tỉnh/Thành phố");
    if (!diaChiTrim) errors.push("• Vui lòng nhập Địa chỉ nhận hàng");
    if (!tenSanPham) errors.push("• Không lấy được tên sản phẩm");
    if (!phienBan) errors.push("• Vui lòng chọn Phiên bản");
    if (!soLuongNum || !donGiaNum) errors.push("• Số lượng/Đơn giá không hợp lệ");
    if (!isEmail(emailTrim)) errors.push("• Email không hợp lệ");

    return {
      ok: errors.length === 0,
      errors,
      values: {
        tenSanPham, phienBan, hoTenTrim,
        sdtOut: sdtLocal, // dùng số nội địa 0xxxxxxxx(x) đã chuẩn hoá
        emailTrim, cityTrim, diaChiTrim, soLuongNum, donGiaNum
      }
    };
  }, [product, capacity, hoTen, sdt, email, city, diaChi, qty, donGia]);

  /* =================== ACTIONS =================== */

  // THÊM VÀO GIỎ
  const handleAddToCart = useCallback(async () => {
    if (!isAuthed) {
      const r = await Swal.fire({
        icon: "warning",
        title: "Cần đăng nhập",
        text: "Vui lòng đăng nhập để thêm vào giỏ hàng.",
        confirmButtonText: "Đăng nhập",
        showCancelButton: true,
        cancelButtonText: "Hủy",
      });
      if (r.isConfirmed) window.dispatchEvent(new CustomEvent("OPEN_LOGIN_MODAL"));
      return;
    }

    const id = getId(product) ?? `${getProductName(product) || "SP"}:${color}:${capacity}`;
    const item = {
      id,
      name: getProductName(product) || "Sản phẩm",
      image: product?.image,
      price: donGia,
      color,
      capacity,
    };

    const nextList = upsertCartItem(item, qty);
    const totalQty = nextList.reduce((s, it) => s + (Number(it.qty) || 0), 0);

    await Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Đã thêm vào giỏ hàng",
      html: `<div style="text-align:left"><b>${item.name}</b><br/>${color || ""} ${capacity || ""} × +${qty}<br/><small>Tổng số lượng trong giỏ: ${totalQty}</small></div>`,
      showConfirmButton: true,
      confirmButtonText: "Xem giỏ hàng",
      timer: 1800,
      timerProgressBar: true,
    }).then((r) => {
      if (r.isConfirmed) window.location.href = "/gio-hang";
    });
  }, [isAuthed, product, donGia, color, capacity, qty]);

  // ĐẶT HÀNG NGAY
  const handleSubmit = useCallback(async () => {
    if (!isAuthed) {
      const r = await Swal.fire({
        icon: "warning",
        title: "Cần đăng nhập",
        text: "Vui lòng đăng nhập để tiếp tục đặt hàng.",
        confirmButtonText: "Đăng nhập",
        showCancelButton: true,
        cancelButtonText: "Hủy",
      });
      if (r.isConfirmed) window.dispatchEvent(new CustomEvent("OPEN_LOGIN_MODAL"));
      return;
    }
    if (submitting) return;

    const { ok, errors, values } = validateBeforeSubmit();
    if (!ok) {
      await Swal.fire({
        icon: "warning",
        title: "Thiếu/không hợp lệ thông tin",
        html: errors.join("<br/>"),
      });
      return;
    }

    const {
      tenSanPham, phienBan, hoTenTrim, sdtOut, emailTrim, cityTrim, diaChiTrim, soLuongNum, donGiaNum
    } = values;
    const tongTienNum = Math.max(0, donGiaNum * soLuongNum);

    const payload = {
      MaKhachHang: maKhachHang,
      MauSac: color || "",
      TongTien: tongTienNum,
      HoTen: hoTenTrim,
      SDT: sdtOut, // gửi số đã chuẩn hoá
      Email: emailTrim,
      HinhThucNhanHang: delivery,
      TinhThanh: cityTrim,
      DiaChi: diaChiTrim,
      GhiChu: String(ghiChu || "").trim(),
      TenSanPham: tenSanPham,
      PhienBan: phienBan,
      SoLuong: soLuongNum,
      DonGia: donGiaNum,
    };

    try {
      setSubmitting(true);
      const res = await axios.post(`${API}/api/donhang`, payload);
      const maDonHang = res?.data?.MaDonHang;

      const r = await Swal.fire({
        icon: "success",
        title: "Đặt hàng thành công!",
        html: `
          <div style="text-align:left">
            Anh đã đặt <b>${tenSanPham}</b><br/>
            Màu: <b>${color || "-"}</b> &nbsp;|&nbsp; Phiên bản: <b>${phienBan || "-"}</b><br/>
            Số lượng: <b>${soLuongNum}</b> &nbsp;|&nbsp; Tổng tiền: <b>${fmtVND(tongTienNum)}</b><br/>
            Đơn hàng sẽ được <b>Admin</b> duyệt sớm.
          </div>
        `,
        confirmButtonText: "Xem đơn hàng",
        showCancelButton: true,
        cancelButtonText: "Đóng",
      });

      onSubmitted?.(maDonHang);
      if (r.isConfirmed) window.location.href = "/donhang";
      onClose?.();
    } catch (e) {
      console.error("Đặt hàng lỗi:", {
        status: e?.response?.status,
        data: e?.response?.data,
        payloadTried: payload,
      });
      const msg = e?.response?.data?.message || e?.message || "Vui lòng thử lại sau.";
      await Swal.fire({ icon: "error", title: "Đặt hàng thất bại", text: msg });
    } finally {
      setSubmitting(false);
    }
  }, [
    isAuthed, color, delivery, ghiChu,
    maKhachHang, onSubmitted, onClose,
    validateBeforeSubmit, submitting
  ]);

  if (!open || !mounted) return null;

  const addDisabled = !isAuthed || !getProductName(product) || !capacity || !color || !qty;
  const submitDisabled = !isAuthed || submitting;

  const sheetUI = (
    <div className="os-overlay" aria-modal="true" role="dialog">
      <div className="os-backdrop" onClick={onClose} />
      <div className="os-panel" role="document">
        <div className="os-header">
          <h3>ĐẶT HÀNG SẢN PHẨM</h3>
          <button className="os-close" onClick={onClose} aria-label="Đóng">✕</button>
        </div>

        {!isAuthed && (
          <div
            style={{
              background: "#FEF3C7",
              color: "#92400E",
              padding: "10px 14px",
              border: "1px solid #F59E0B",
              margin: "0 16px 12px",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Vui lòng đăng nhập để đặt hàng / thêm vào giỏ.
          </div>
        )}

        <div className="os-body">
          {/* LEFT */}
          <div className="os-left">
            <div className="os-product">
              <img src={product?.image} alt={getProductName(product) || "Sản phẩm"} />
              <div className="os-product__meta">
                <h4>{getProductName(product)}</h4>
                <div className="os-variant-line">
                  {color ? <span>{color}</span> : null}
                  {capacity ? <> , <span>{capacity}</span></> : null}
                </div>
                {product?.oldPrice
                  ? <div className="os-old">{fmtVND(product.oldPrice)}</div>
                  : <div className="os-old os-old--empty">&nbsp;</div>}
                <div className="os-price">{fmtVND(donGia)}</div>
                <div className="os-emi">Trả góp 0% từ {fmtVND(Math.ceil(donGia / 36_000) * 1000)}</div>
              </div>
            </div>

            <div className="os-variants">
              {colors?.length ? (
                <div className="os-field">
                  <label>Màu sắc:</label>
                  <div className="os-color-grid">
                    {colors.map((c) => {
                      const cKey = keyOfColor(c);
                      const priceForColor = computePrice(cKey, capacity);
                      return (
                        <button
                          key={cKey}
                          type="button"
                          className={`os-chip ${color === cKey ? "active" : ""}`}
                          onClick={() => setColor(cKey)}
                          title={c.label || cKey}
                        >
                          {c.img ? <img src={c.img} alt={c.label || cKey} /> : null}
                          <div className="os-chip__text">
                            <div>{c.label || cKey}</div>
                            <small>{fmtVND(priceForColor)}</small>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {capacities?.length ? (
                <div className="os-field">
                  <label>Phiên bản:</label>
                  <div className="os-cap-grid">
                    {capacities.map((cap) => {
                      const capKey = keyOfCap(cap);
                      const priceForCap = computePrice(color, capKey);
                      return (
                        <button
                          key={capKey}
                          type="button"
                          className={`os-chip ${capacity === capKey ? "active" : ""}`}
                          onClick={() => setCapacity(capKey)}
                          title={capKey}
                        >
                          <div className="os-chip__text">
                            <div>{capKey}</div>
                            <small>{fmtVND(priceForCap)}</small>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* RIGHT */}
          <div className="os-right">
            <div className="os-field">
              <label>Thông tin khách hàng</label>
              <div className="os-grid-3">
                <input placeholder="Họ và tên *" value={hoTen} onChange={(e) => setHoTen(e.target.value)} />
                <input placeholder="Điện thoại *" value={sdt} onChange={(e) => setSDT(e.target.value)} />
                <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>

            <div className="os-field">
              <label>Mã ưu đãi (Voucher)</label>
              <div className="os-voucher-row">
                <input placeholder="VD: STOREVIP" value={voucher} onChange={(e) => setVoucher(e.target.value)} />
                <button
                  type="button"
                  className="btn outline"
                  onClick={() => Swal.fire({ icon: "info", title: "Voucher", text: "Tính năng sẽ cập nhật sau." })}
                >
                  Áp dụng
                </button>
              </div>
            </div>

            <div className="os-field">
              <label>Chọn cách thức nhận hàng</label>
              <div className="os-radio-row">
                <label className="radio">
                  <input type="radio" name="delivery" checked={delivery === "GIAO TẬN NƠI"} onChange={() => setDelivery("GIAO TẬN NƠI")} />
                  <span>GIAO TẬN NƠI</span>
                </label>
                <label className="radio">
                  <input type="radio" name="delivery" checked={delivery === "NHẬN TẠI CỬA HÀNG"} onChange={() => setDelivery("NHẬN TẠI CỬA HÀNG")} />
                  <span>NHẬN TẠI CỬA HÀNG</span>
                </label>
              </div>
            </div>

            <div className="os-field">
              <label>Thông tin nhận hàng</label>
              <select value={city} onChange={(e) => setCity(e.target.value)}>
                <option value="">Tỉnh/ thành phố (*)</option>
                <option>Hà Nội</option>
                <option>Hồ Chí Minh</option>
                <option>Đà Nẵng</option>
              </select>
              <input placeholder="Địa chỉ *" value={diaChi} onChange={(e) => setDiaChi(e.target.value)} />
              <textarea rows={3} placeholder="Ghi chú cho đơn hàng..." value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} />
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                * Bắt buộc: Họ tên, SĐT (0… hoặc +84…, 9–10 số), Tỉnh/TP, Địa chỉ, phiên bản sản phẩm
              </div>
            </div>

            {/* Số lượng + Tổng */}
            <div className="os-summary">
              <div className="os-qty" role="group" aria-label="Chọn số lượng">
                <button type="button" aria-label="Giảm" onClick={() => setQty((q) => Math.max(1, q - 1))}>-</button>
                <input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  aria-label="Số lượng"
                  value={qty}
                  onChange={(e) => {
                    const v = Math.max(1, Number(String(e.target.value).replace(/\D/g, "")) || 1);
                    setQty(v);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowUp") { e.preventDefault(); setQty((q) => q + 1); }
                    if (e.key === "ArrowDown") { e.preventDefault(); setQty((q) => Math.max(1, q - 1)); }
                  }}
                />
                <button type="button" aria-label="Tăng" onClick={() => setQty((q) => q + 1)}>+</button>
              </div>

              <div className="os-total">
                <span>Tổng tiền</span>
                <b>{fmtVND(tongTien)}</b>
              </div>
            </div>

            {/* CTA */}
            <div className="os-actions">
              <button
                className="btn outline block"
                type="button"
                onClick={handleAddToCart}
                disabled={addDisabled}
                title={!isAuthed ? "Vui lòng đăng nhập để thêm vào giỏ" : undefined}
              >
                THÊM VÀO GIỎ
              </button>

              <button
                className="btn danger block"
                type="button"
                onClick={handleSubmit}
                disabled={submitDisabled}
                aria-busy={submitting}
                title={!isAuthed ? "Vui lòng đăng nhập để đặt hàng" : undefined}
              >
                {submitting ? "Đang gửi..." : "TIẾN HÀNH ĐẶT HÀNG"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(sheetUI, portalElRef.current);
}
