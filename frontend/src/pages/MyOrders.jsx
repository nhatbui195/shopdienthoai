// src/pages/MyOrders.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "../styles/pages/MyOrders.css";
import { api } from "../lib/api"; // ✅ dùng client chung

const fmtVND = (n) =>
  (Number(n) || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

// --- helpers ---
function readUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}
const getCustomerId = (u) => u?.MaTaiKhoan ?? u?.MaKhachHang ?? u?.id ?? null;

// Nhãn trạng thái đơn (mặc định)
const statusLabel = (s) => s || "Chờ xác nhận";

// Nhãn & màu thanh toán
const payLabel = ({ ps, awaitingAdmin, awaitingPickup }) => {
  if (awaitingAdmin) return "Đã gửi xác nhận – chờ duyệt";
  if (ps === "paid" && awaitingPickup) return "Đã thanh toán – chờ nhận hàng";
  if (ps === "paid") return "Đã thanh toán";
  if (ps === "refunded") return "Đã hoàn tiền";
  return "Chưa thanh toán";
};
const payClass = ({ ps, awaitingAdmin, awaitingPickup }) => {
  if (awaitingAdmin) return "myo-badge";
  if (ps === "paid" && awaitingPickup) return "myo-badge";
  if (ps === "paid") return "myo-badge--success";
  if (ps === "refunded") return "myo-badge--muted";
  return "myo-badge--warn";
};

const shipLabel = (s = "") => {
  const v = s.toLowerCase();
  if (v === "picking") return "Đang lấy hàng";
  if (v === "shipping") return "Đang giao";
  if (v === "delivered") return "Đã giao";
  if (v === "canceled") return "Đã hủy vận chuyển";
  return "Chờ xử lý VC";
};
const shipClass = (s = "") => {
  const v = s.toLowerCase();
  if (v === "delivered") return "myo-badge--success";
  if (v === "shipping" || v === "picking") return "myo-badge";
  if (v === "canceled") return "myo-badge--danger";
  return "myo-badge--muted";
};

const isInShippingFlow = (s = "") =>
  ["picking", "shipping", "delivered", "canceled"].includes(String(s || "").toLowerCase());

// Xác định cờ payment từ bảng payments
function inspectPayments(payments = []) {
  const norm = (x) => String(x || "").toLowerCase();
  let hasApproved = false;
  let hasPending = false;
  for (const p of payments) {
    const st = norm(p.TrangThai || p.status);
    if (st === "approved" || st === "success" || st === "thanhcong") hasApproved = true;
    if (st === "pending" || st === "submitted" || st === "awaiting") hasPending = true;
  }
  return { hasApproved, hasPending };
}

// Nhãn/ màu cho “Đơn hàng”
function orderUILabel(o) {
  const canceled = String(o.TrangThai || "").toLowerCase().includes("hủy");
  if (!canceled && o.PaymentStatus === "paid" && !isInShippingFlow(o.ShippingStatus)) {
    return "Chờ nhận hàng";
  }
  return statusLabel(o.TrangThai);
}
function orderUIClass(o) {
  const label = orderUILabel(o).toLowerCase();
  if (label.includes("hủy")) return "myo-badge--danger";
  if (label.includes("đã giao")) return "myo-badge--success";
  if (label.includes("chờ nhận hàng")) return "myo-badge";
  if (label.includes("xác nhận")) return "myo-badge--success";
  return "myo-badge--muted";
}

export default function MyOrders() {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => readUser());
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);

  const pollTimerRef = useRef(null);

  useEffect(() => {
    const onAuth = (e) => setUser(e?.detail?.user ?? readUser());
    const onStorage = (e) => {
      if (e.key === "user" || e.key === "token") setUser(readUser());
    };
    window.addEventListener("auth-changed", onAuth);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("auth-changed", onAuth);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const maKhachHang = useMemo(() => getCustomerId(user), [user]);
  const isAuthed = !!maKhachHang;

  const fetchOrders = useCallback(async () => {
    if (!isAuthed) return;
    const setBusy = loading ? setLoading : setReloading;
    setBusy(true);
    try {
      // 1) lấy danh sách đơn
      const res = await api.get(`/api/donhang/${maKhachHang}`);
      const list = Array.isArray(res.data) ? res.data : [];

      // 2) enrich payments -> ưu tiên PaymentStatus từ donhang
      const enriched = await Promise.all(
        list.map(async (o) => {
          let hasApproved = false;
          let hasPending = false;
          try {
            const pr = await api.get(`/api/payments/${o.MaDonHang}`);
            const payments = Array.isArray(pr.data) ? pr.data : [];
            const r = inspectPayments(payments);
            hasApproved = r.hasApproved;
            hasPending = r.hasPending;
          } catch (e) {
            console.debug("payments fetch ignored:", e?.message || e);
          }
          if (o.PaymentStatus === "paid") {
            hasApproved = true;
            hasPending = false;
          }
          return { ...o, _payApproved: hasApproved, _payPending: hasPending };
        })
      );

      setOrders(enriched);

      // 3) bật/tắt polling
      const needPoll = enriched.some((o) => {
        const awaitingAdmin = o._payPending && o.PaymentStatus !== "paid";
        const awaitingPickup = o.PaymentStatus === "paid" && !isInShippingFlow(o.ShippingStatus);
        return awaitingAdmin || awaitingPickup;
      });

      if (needPoll && !pollTimerRef.current) {
        pollTimerRef.current = setInterval(async () => {
          try {
            const r = await api.get(`/api/donhang/${maKhachHang}`);
            const base = Array.isArray(r.data) ? r.data : [];
            const again = await Promise.all(
              base.map(async (o) => {
                let hasApproved = false;
                let hasPending = false;
                try {
                  const pr = await api.get(`/api/payments/${o.MaDonHang}`);
                  const payments = Array.isArray(pr.data) ? pr.data : [];
                  const r2 = inspectPayments(payments);
                  hasApproved = r2.hasApproved;
                  hasPending = r2.hasPending;
                } catch (e) {
                  console.debug("poll payments ignored:", e?.message || e);
                }
                if (o.PaymentStatus === "paid") {
                  hasApproved = true;
                  hasPending = false;
                }
                return { ...o, _payApproved: hasApproved, _payPending: hasPending };
              })
            );
            setOrders(again);
          } catch (e) {
            console.debug("poll orders ignored:", e?.message || e);
          }
        }, 8000);
      }
      if (!needPoll && pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "Không tải được đơn hàng",
        text: err?.response?.data?.message || "Vui lòng thử lại.",
      });
    } finally {
      setBusy(false);
    }
  }, [isAuthed, maKhachHang, loading]);

  useEffect(() => {
    if (!isAuthed) return;
    fetchOrders();
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [isAuthed, fetchOrders]);

  const canCancel = (o) => {
    const isCanceled = String(statusLabel(o.TrangThai)).toLowerCase().includes("hủy");
    const paid = o.PaymentStatus === "paid";
    const shipping = isInShippingFlow(o.ShippingStatus);
    const awaitingAdmin = o._payPending && !paid;
    return !o.YeuCauHuy && !isCanceled && !paid && !shipping && !awaitingAdmin;
  };

  const requestCancel = useCallback(
    async (order) => {
      if (!order?.MaDonHang) return;

      if (!canCancel(order)) {
        await Swal.fire({
          icon: "info",
          title: "Không thể hủy",
          text: "Đơn đã hủy/đang xử lý/đã thanh toán/đã gửi xác nhận thanh toán hoặc đã gửi yêu cầu hủy.",
        });
        return;
      }

      const ok = await Swal.fire({
        icon: "warning",
        title: `Gửi yêu cầu hủy đơn #${order.MaDonHang}?`,
        html:
          "<div style='text-align:left;line-height:1.5'>" +
          "• Yêu cầu sẽ được gửi tới Admin để xem xét.<br/>" +
          "• Nếu được chấp thuận, trạng thái sẽ chuyển sang <b>Đã hủy</b>.<br/>" +
          "</div>",
        showCancelButton: true,
        confirmButtonText: "Gửi yêu cầu",
        cancelButtonText: "Không",
        confirmButtonColor: "#ef4444",
      });
      if (!ok.isConfirmed) return;

      try {
        await api.put(`/api/donhang/huy/${order.MaDonHang}`);
        await Swal.fire({
          icon: "success",
          title: "Đã gửi yêu cầu hủy",
          timer: 1200,
          showConfirmButton: false,
        });
        fetchOrders();
      } catch (err) {
        await Swal.fire({
          icon: "error",
          title: "Gửi yêu cầu thất bại",
          text: err?.response?.data?.message || "Vui lòng thử lại.",
        });
      }
    },
    [fetchOrders]
  );

  const goPay = (o) => {
    navigate(
      `/payment?orderId=${encodeURIComponent(o.MaDonHang)}&amount=${encodeURIComponent(
        o.TongTien || 0
      )}&name=${encodeURIComponent(o.HoTen || "")}`
    );
  };

  if (!isAuthed) {
    return (
      <div className="myo-wrap">
        <div className="myo-card">
          <h2>Đơn hàng của tôi</h2>
          <p>Bạn cần đăng nhập để xem đơn hàng.</p>
          <button
            className="myo-btn myo-btn--primary"
            onClick={() => window.dispatchEvent(new CustomEvent("OPEN_LOGIN_MODAL"))}
          >
            Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="myo-wrap">
      <div className="myo-card">
        <div className="myo-head">
          <h2>Đơn hàng của tôi</h2>
          <div className="myo-actions">
            <button
              className="myo-btn"
              onClick={fetchOrders}
              disabled={loading || reloading}
              aria-busy={loading || reloading}
            >
              {reloading ? "Đang làm mới..." : "Làm mới"}
            </button>
          </div>
        </div>

        {loading ? (
          <p>Đang tải...</p>
        ) : orders.length === 0 ? (
          <div className="myo-empty">
            <div>Chưa có đơn hàng nào.</div>
            <a className="myo-btn myo-btn--primary" href="/">Mua sắm ngay</a>
          </div>
        ) : (
          <div className="myo-list">
            {orders.map((o) => {
              const sOrder = orderUILabel(o);
              const sOrderClass = orderUIClass(o);
              const createdAt = o.NgayDatHang ? new Date(o.NgayDatHang).toLocaleString() : "";

              const paid = o.PaymentStatus === "paid";
              const awaitingAdmin = o._payPending && !paid;
              const awaitingPickup = paid && !isInShippingFlow(o.ShippingStatus);

              const payTxt = payLabel({ ps: o.PaymentStatus, awaitingAdmin, awaitingPickup });
              const payCss = payClass({ ps: o.PaymentStatus, awaitingAdmin, awaitingPickup });

              const shipTxt = shipLabel(o.ShippingStatus);
              const shipCss = shipClass(o.ShippingStatus);

              const isCanceled = sOrder.toLowerCase().includes("hủy");
              const canPay = !paid && !awaitingAdmin && !isCanceled;

              return (
                <div key={o.MaDonHang} className="myo-item">
                  <div className="myo-row myo-row--top">
                    <div className="myo-id">
                      <b>Đơn hàng #{o.MaDonHang}</b>
                      <span className={`myo-badge ${sOrderClass}`}>{sOrder}</span>
                      <span className={`myo-badge ${payCss}`}>{payTxt}</span>
                      {o.ShippingStatus ? (
                        <span className={`myo-badge ${shipCss}`}>{shipTxt}</span>
                      ) : null}
                      {o.YeuCauHuy ? (
                        <span className="myo-badge myo-badge--warn" title="Đang chờ admin xác nhận">
                          Đã gửi yêu cầu hủy
                        </span>
                      ) : null}
                    </div>
                    <div className="myo-date">{createdAt}</div>
                  </div>

                  {awaitingAdmin && (
                    <div className="myo-info-banner">
                      Bạn đã gửi xác nhận thanh toán. Đơn đang <b>chờ admin duyệt</b>.
                    </div>
                  )}
                  {awaitingPickup && (
                    <div className="myo-info-banner">
                      Thanh toán đã được duyệt. Đơn của bạn đang <b>chờ nhà bán chuẩn bị hàng</b>.
                    </div>
                  )}

                  <div className="myo-grid">
                    <div className="myo-col">
                      <div className="myo-field"><span>Họ tên</span><b>{o.HoTen}</b></div>
                      <div className="myo-field"><span>SĐT</span><b>{o.SDT}</b></div>
                      <div className="myo-field"><span>Hình thức</span><b>{o.HinhThucNhanHang || "-"}</b></div>
                      <div className="myo-field">
                        <span>Địa chỉ</span>
                        <b>{[o.DiaChi, o.TinhThanh].filter(Boolean).join(", ") || "-"}</b>
                      </div>
                      {o.GhiChu ? (<div className="myo-field"><span>Ghi chú</span><b>{o.GhiChu}</b></div>) : null}
                    </div>

                    <div className="myo-col myo-products">
                      {(o.SanPham || []).map((sp, idx) => (
                        <div key={`${o.MaDonHang}-${idx}`} className="myo-prod">
                          <div className="myo-prod-name">
                            {sp.TenSanPham} <small>({sp.PhienBan})</small>
                          </div>
                          <div className="myo-prod-qty">x{sp.SoLuong}</div>
                          <div className="myo-prod-price">{fmtVND(sp.DonGia)}</div>
                          <div className="myo-prod-total">{fmtVND(sp.ThanhTien)}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="myo-row myo-row--bottom">
                    <div className="myo-total">
                      Tổng tiền: <b>{fmtVND(o.TongTien)}</b>
                    </div>
                    <div className="myo-btns">
                      {canPay && (
                        <button
                          className="myo-btn myo-btn--primary"
                          onClick={() => goPay(o)}
                          title="Thanh toán đơn hàng"
                        >
                          Thanh toán
                        </button>
                      )}
                      <button
                        className="myo-btn myo-btn--danger"
                        onClick={() => requestCancel(o)}
                        disabled={!canCancel(o)}
                        title={
                          !canCancel(o)
                            ? "Không thể hủy (đã thanh toán/đã gửi xác nhận/đang giao/đã hủy hoặc đã gửi yêu cầu)"
                            : "Gửi yêu cầu hủy"
                        }
                      >
                        Gửi yêu cầu hủy
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
