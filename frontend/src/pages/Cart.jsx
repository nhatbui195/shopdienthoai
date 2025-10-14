// src/pages/Cart.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "../styles/pages/Cart.css";
import TopBar from "../components/TopBar";
import { readCart, writeCart, clearCart, readUser } from "../utils/cart"; // ✅ cart per-user
import { fileURL } from "../lib/api"; // ✅ dùng helper chung cho ảnh

const fmtVND = (n) =>
  (Number(n) || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

/* ========= Helpers ========= */
function countCart(items) {
  return (items || []).reduce((s, it) => s + (Number(it.qty) || 0), 0);
}
function totalCart(items) {
  return (items || []).reduce(
    (s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0),
    0
  );
}
function rowKey(it, idx) {
  return `${it.id || ""}|${it.color || ""}|${it.capacity || ""}|${idx}`;
}
function isLoggedIn() {
  const u = readUser();
  const token = (() => {
    try { return localStorage.getItem("token"); } catch { return null; }
  })();
  const maKhachHang = u?.MaTaiKhoan ?? u?.MaKhachHang ?? null;
  return !!(maKhachHang || token);
}

export default function Cart() {
  const navigate = useNavigate();
  const [items, setItems] = useState(() => readCart());

  useEffect(() => {
    const onStorage = (e) => { if (e?.key?.startsWith?.("cart::")) setItems(readCart()); };
    const onUpdated = (e) => setItems(e?.detail?.items || readCart());
    const onAuthChanged = () => setItems(readCart());

    window.addEventListener("storage", onStorage);
    window.addEventListener("CART_UPDATED", onUpdated);
    window.addEventListener("auth-changed", onAuthChanged);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("CART_UPDATED", onUpdated);
      window.removeEventListener("auth-changed", onAuthChanged);
    };
  }, []);

  const totalQty = useMemo(() => countCart(items), [items]);
  const totalPrice = useMemo(() => totalCart(items), [items]);

  const save = useCallback((next) => { setItems(next); writeCart(next); }, []);

  const updateQty = useCallback((key, nextQty) => {
    const q = Math.max(1, Number(nextQty) || 1);
    const next = items.map((it, idx) =>
      rowKey(it, idx) === key ? { ...it, qty: q } : it
    );
    save(next);
  }, [items, save]);

  const inc = useCallback((key) => {
    const next = items.map((it, idx) =>
      rowKey(it, idx) === key ? { ...it, qty: Math.max(1, Number(it.qty || 0) + 1) } : it
    );
    save(next);
  }, [items, save]);

  const dec = useCallback((key) => {
    const next = items.map((it, idx) =>
      rowKey(it, idx) === key ? { ...it, qty: Math.max(1, Number(it.qty || 0) - 1) } : it
    );
    save(next);
  }, [items, save]);

  const removeOne = useCallback(async (key) => {
    const res = await Swal.fire({
      title: "Xóa sản phẩm?",
      text: "Bạn chắc chắn muốn xóa sản phẩm này khỏi giỏ?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
      reverseButtons: true
    });
    if (res.isConfirmed) {
      const next = items.filter((it, idx) => rowKey(it, idx) !== key);
      save(next);
      Swal.fire({ icon: "success", title: "Đã xóa", timer: 800, showConfirmButton: false });
    }
  }, [items, save]);

  const clearAll = useCallback(async () => {
    if (!items.length) return;
    const res = await Swal.fire({
      title: "Xóa tất cả?",
      text: "Giỏ hàng sẽ trống hoàn toàn.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa tất cả",
      cancelButtonText: "Hủy",
      reverseButtons: true
    });
    if (res.isConfirmed) {
      setItems([]);
      clearCart();
      Swal.fire({ icon: "success", title: "Đã xóa tất cả", timer: 900, showConfirmButton: false });
    }
  }, [items]);

  // ✅ SPA: điều hướng sang /payment, truyền tổng tiền qua query
  const goCheckout = useCallback(async () => {
    if (!isLoggedIn()) {
      const r = await Swal.fire({
        icon: "warning",
        title: "Cần đăng nhập",
        text: "Vui lòng đăng nhập để tiếp tục thanh toán.",
        confirmButtonText: "Đăng nhập",
        showCancelButton: true,
        cancelButtonText: "Hủy"
      });
      if (r.isConfirmed) window.dispatchEvent(new CustomEvent("OPEN_LOGIN_MODAL"));
      return;
    }
    // Nếu muốn tạo đơn trước rồi thanh toán thì thay amount bằng orderId.
    navigate(`/payment?amount=${encodeURIComponent(totalPrice || 0)}`);
  }, [navigate, totalPrice]);

  return (
    <div className="cart">
      <TopBar title="Giỏ hàng" />

      <h1 className="cart__title">
        Giỏ hàng <span className="muted">({totalQty} sản phẩm)</span>
      </h1>

      {!items.length ? (
        <EmptyCart />
      ) : (
        <div className="cart__grid">
          {/* Bảng sản phẩm */}
          <div className="cart__table">
            <div className="cart__thead">
              <div>Sản phẩm</div>
              <div>Đơn giá</div>
              <div>Số lượng</div>
              <div></div>
            </div>

            <div className="cart__tbody">
              {items.map((it, idx) => {
                const key = rowKey(it, idx);
                return (
                  <div className="cart__row" key={key}>
                    <div className="cart__prod">
                      {/* ✅ dùng fileURL để hỗ trợ path tương đối từ BE */}
                      <img className="cart__thumb" src={fileURL(it.image)} alt={it.name} />
                      <div className="cart__meta">
                        <div className="cart__name" title={it.name}>{it.name}</div>
                        <div className="cart__variant">{it.color || ""} {it.capacity || ""}</div>
                        <div className="cart__line-total">
                          Thành tiền: <b>{fmtVND((it.price || 0) * (it.qty || 0))}</b>
                        </div>
                      </div>
                    </div>

                    <div className="cart__price">{fmtVND(it.price)}</div>

                    <div className="cart__qty">
                      <button type="button" className="qty-btn" onClick={() => dec(key)} aria-label="Giảm số lượng">-</button>
                      <input
                        className="qty-input"
                        value={it.qty}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        onChange={(e) => {
                          const v = String(e.target.value).replace(/\D/g, "");
                          updateQty(key, v || 1);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "ArrowUp") { e.preventDefault(); inc(key); }
                          if (e.key === "ArrowDown") { e.preventDefault(); dec(key); }
                        }}
                        aria-label="Số lượng"
                      />
                      <button type="button" className="qty-btn" onClick={() => inc(key)} aria-label="Tăng số lượng">+</button>
                    </div>

                    <div className="cart__remove">
                      <button type="button" className="icon-btn" onClick={() => removeOne(key)} title="Xóa sản phẩm">✕</button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="cart__footer">
              <button type="button" className="btn btn--outline danger" onClick={clearAll}>Xóa tất cả</button>
              <div className="cart__count muted">{totalQty} sản phẩm</div>
            </div>
          </div>

          {/* Tóm tắt */}
          <aside className="cart__summary">
            <h3 className="summary__title">Tóm tắt đơn hàng</h3>
            <div className="summary__row">
              <span>Tạm tính</span>
              <b>{fmtVND(totalPrice)}</b>
            </div>
            <div className="summary__row">
              <span>Phí vận chuyển</span>
              <b>{fmtVND(0)}</b>
            </div>
            <hr className="summary__divider" />
            <div className="summary__total">
              <span className="sumary__price">Tổng cộng</span>
              <b>{fmtVND(totalPrice)}</b>
            </div>

            <button className="btn btn--primary summary__cta" onClick={goCheckout}>
              Tiến hành thanh toán
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}

/* ======= Subcomponent ======= */
function EmptyCart() {
  return (
    <div className="cart-empty">
      <div className="cart-empty__title">Giỏ hàng trống</div>
      <div className="cart-empty__desc">Hãy thêm sản phẩm vào giỏ để tiếp tục mua sắm.</div>
      <Link to="/" className="btn btn--dark">Tiếp tục mua sắm</Link>
    </div>
  );
}
