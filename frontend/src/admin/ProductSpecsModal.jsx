// src/admin/ProductSpecsModal.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "../styles/admin/ProductSpecsModal.css";

const API = "http://localhost:3001";

/* --------- Helpers --------- */
const toArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(s => String(s).trim()).filter(Boolean);
  // hỗ trợ CSV: phẩy, chấm phẩy, xuống dòng
  return String(val)
    .split(/[,;\n]/g)
    .map((s) => s.trim())
    .filter(Boolean);
};
const uniq = (arr) => Array.from(new Set(arr.map((s) => String(s).trim()).filter(Boolean)));
const toCSV = (arr) => uniq(arr).join(", ");

// tạo tổ hợp MauSac × PhienBan cho API replace
const makeCombos = (colors = [], caps = []) => {
  const C = uniq(colors);
  const P = uniq(caps);
  const out = [];
  C.forEach(c => P.forEach(p => out.push({ MauSac: c, PhienBan: p })));
  return out;
};

/* --------- TagInput (mini) --------- */
function TagInput({ label, items, onChange, placeholder }) {
  const [input, setInput] = useState("");

  useEffect(() => setInput(""), [items]);

  const handleKeyDown = (e) => {
    const key = e.key;
    if (key === "Enter" || key === ",") {
      e.preventDefault();
      const batch = toArray(input);
      if (batch.length) {
        onChange(uniq([...items, ...batch]));
        setInput("");
      }
    } else if (key === "Backspace" && !input && items.length) {
      onChange(items.slice(0, -1));
    }
  };

  const addFromPaste = (e) => {
    const text = e.clipboardData?.getData("text") || "";
    const batch = toArray(text);
    if (batch.length > 1) {
      e.preventDefault();
      onChange(uniq([...items, ...batch]));
    }
  };

  const removeAt = (i) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div className="psm-field">
      <label>{label}</label>
      <div className="psm-tags">
        {items.map((t, i) => (
          <span key={`${t}-${i}`} className="psm-tag">
            {t}
            <button type="button" className="psm-tag__x" onClick={() => removeAt(i)} aria-label="Xoá">
              ×
            </button>
          </span>
        ))}
        <input
          className="psm-tag-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={addFromPaste}
          placeholder={placeholder}
        />
      </div>
      <div className="psm-help">Nhấn Enter hoặc dấu phẩy để thêm; dán “Đen, Xanh, Tím…” cũng được.</div>
    </div>
  );
}

/**
 * Props:
 *  - open
 *  - product: { MaSanPham, TenSanPham, HangSanXuat, ... }
 *  - onClose
 *  - onSaved
 */
export default function ProductSpecsModal({ open, product, onClose, onSaved }) {
  const [form, setForm] = useState({
    KichThuocManHinh: "",
    CPU: "",
    HeDieuHanh: "",
    BoNhoTrong: "",
    CameraChinh: "",
    // CSV để tương thích API cũ (không còn dùng nếu BE đã bỏ)
    MauSac: "",
    PhienBan: "",
    HangSanXuat: "",
    TinhTrang: "",
    // mảng cho TagInput
    MauSacList: [],
    PhienBanList: [],
  });
  const [loading, setLoading] = useState(false);

  // Load chi tiết + variants khi mở
  useEffect(() => {
    if (!open || !product?.MaSanPham) return;
    (async () => {
      setLoading(true);
      try {
        // 1) specs
        const res = await axios.get(`${API}/api/chitietsanpham/${product.MaSanPham}`);
        const d = res.data || {};
        setForm((f) => ({
          ...f,
          ...d,
          MauSacList: d.MauSacList ? toArray(d.MauSacList) : toArray(d.MauSac),
          PhienBanList: d.PhienBanList ? toArray(d.PhienBanList) : toArray(d.PhienBan),
          HangSanXuat: d.HangSanXuat || product?.HangSanXuat || "",
        }));
      } catch {
        setForm({
          KichThuocManHinh: "",
          CPU: "",
          HeDieuHanh: "",
          BoNhoTrong: "",
          CameraChinh: "",
          MauSac: "",
          PhienBan: "",
          HangSanXuat: product?.HangSanXuat || "",
          TinhTrang: "",
          MauSacList: [],
          PhienBanList: [],
        });
      }

      // 2) variants từ bảng chitietthem -> để đổ TagInput
      try {
        const vres = await axios.get(`${API}/api/products/${product.MaSanPham}/variants`);
        const variants = Array.isArray(vres.data) ? vres.data : [];
        const colors = Array.from(new Set(variants.map(v => v.MauSac).filter(Boolean)));
        const caps   = Array.from(new Set(variants.map(v => v.PhienBan).filter(Boolean)));

        setForm((f) => ({
          ...f,
          MauSacList: colors.length ? colors : f.MauSacList,
          PhienBanList: caps.length ? caps : f.PhienBanList,
        }));
      } catch {
        // bỏ qua nếu sản phẩm chưa có biến thể
      }

      setLoading(false);
    })();
  }, [open, product]);

  const update = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!product?.MaSanPham) return;

    try {
      Swal.fire({
        title: "Đang lưu...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      // luôn đồng bộ CSV từ mảng trước khi gửi
      const payload = {
        MaSanPham: product.MaSanPham,
        ...form,
        MauSac: form.MauSac || toCSV(form.MauSacList),
        PhienBan: form.PhienBan || toCSV(form.PhienBanList),
        MauSacList: uniq(form.MauSacList),
        PhienBanList: uniq(form.PhienBanList),
        HangSanXuat: form.HangSanXuat || product.HangSanXuat || "",
      };

      // 1) Lưu specs (API cũ)
      await axios.post(`${API}/api/chitietsanpham`, payload);

      // 2) Replace variants theo TagInput vào bảng chitietthem
      const combos = makeCombos(form.MauSacList, form.PhienBanList);
      await axios.post(`${API}/api/products/${product.MaSanPham}/variants/replace`, combos);

      Swal.fire({ icon: "success", title: "Đã lưu thông số & biến thể", timer: 1100, showConfirmButton: false });
      onSaved && onSaved();
      onClose && onClose();
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Lưu thất bại",
        text: err.response?.data?.message || "Vui lòng thử lại.",
      });
    }
  };

  if (!open) return null;

  return (
    <div className="psm-overlay" onClick={onClose}>
      <div className="psm" onClick={(e) => e.stopPropagation()}>
        <div className="psm-head">
          <div className="psm-title">
            <i className="bx bx-cog" />
            Thông số kỹ thuật – {product?.TenSanPham || `#${product?.MaSanPham}`}
          </div>
          <button className="psm-close" onClick={onClose}><i className="bx bx-x" /></button>
        </div>

        {loading ? (
          <div className="psm-loading">Đang tải...</div>
        ) : (
          <form className="psm-form" onSubmit={handleSubmit}>
            <div className="psm-grid">
              <div className="psm-field">
                <label>Kích thước màn hình</label>
                <input
                  value={form.KichThuocManHinh}
                  onChange={(e) => update("KichThuocManHinh", e.target.value)}
                  placeholder='VD: 6.7" OLED 120Hz'
                />
              </div>
              <div className="psm-field">
                <label>CPU</label>
                <input
                  value={form.CPU}
                  onChange={(e) => update("CPU", e.target.value)}
                  placeholder="VD: A17 Pro / Snapdragon 8 Gen 3"
                />
              </div>
              <div className="psm-field">
                <label>Hệ điều hành</label>
                <input
                  value={form.HeDieuHanh}
                  onChange={(e) => update("HeDieuHanh", e.target.value)}
                  placeholder="iOS / Android"
                />
              </div>
              <div className="psm-field">
                <label>Bộ nhớ trong</label>
                <input
                  value={form.BoNhoTrong}
                  onChange={(e) => update("BoNhoTrong", e.target.value)}
                  placeholder="128GB / 256GB..."
                />
              </div>
              <div className="psm-field">
                <label>Camera chính</label>
                <input
                  value={form.CameraChinh}
                  onChange={(e) => update("CameraChinh", e.target.value)}
                  placeholder="48MP / 50MP..."
                />
              </div>

              {/* ====== Tag inputs ====== */}
              <TagInput
                label="Màu sắc"
                items={form.MauSacList}
                onChange={(arr) => update("MauSacList", arr)}
                placeholder="Nhập màu rồi Enter… (VD: Đen, Xanh, Tím)"
              />
              <TagInput
                label="Phiên bản"
                items={form.PhienBanList}
                onChange={(arr) => update("PhienBanList", arr)}
                placeholder="Nhập phiên bản rồi Enter… (VD: 128GB, 256GB)"
              />

              {/* Các trường text truyền thống giữ để tương thích */}
              <div className="psm-field">
                <label>Hãng sản xuất</label>
                <input
                  value={form.HangSanXuat}
                  onChange={(e) => update("HangSanXuat", e.target.value)}
                  placeholder="Apple / Samsung..."
                />
              </div>
              <div className="psm-field">
                <label>Tình trạng</label>
                <input
                  value={form.TinhTrang}
                  onChange={(e) => update("TinhTrang", e.target.value)}
                  placeholder="Mới 100% / Like New..."
                />
              </div>
            </div>

            <div className="psm-actions">
              <button type="button" className="psm-btn" onClick={onClose}>
                <i className="bx bx-x" /> Hủy
              </button>
              <button type="submit" className="psm-btn primary">
                <i className="bx bx-save" /> Lưu thông số
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
