// src/pages/PaymentPage.jsx
import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
// import axios from "axios";
import Swal from "sweetalert2";
import "../styles/pages/Payment.css";
import { clearCart } from "../utils/cart"; // ✅ xóa giỏ sau khi thanh toán
import { api } from "../lib/api";          // ✅ dùng axios instance chung

// const API = "http://localhost:3001";

const BANK = {
  code: "mbbank",                 // slug VietQR
  accountNumber: "5523453639",
  accountName: "BUI VAN NHAT",
};

export default function PaymentPage() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();

  // Lấy amount & orderId từ query
  const amount = Number(sp.get("amount") || 0);
  const orderId = sp.get("orderId"); // nếu OrderSheet truyền orderId=? thì sẽ có
  const hoTen = sp.get("name") || ""; // optional để show thêm trong nội dung CK

  const [method, setMethod] = useState("vietqr"); // vietqr | bank | cod
  const [agree, setAgree] = useState(false);
  const [refCode, setRefCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const info = useMemo(() => {
    const base = orderId ? `DH#${orderId}` : "NHAT STORE";
    return hoTen ? `${base} ${hoTen}` : base;
  }, [orderId, hoTen]);

  const qrUrl = useMemo(() => {
    if (!BANK.code || !BANK.accountNumber || !amount) return "";
    const p = new URLSearchParams({
      amount: String(amount),
      addInfo: info,
    });
    return `https://img.vietqr.io/image/${encodeURIComponent(BANK.code)}-${encodeURIComponent(
      BANK.accountNumber
    )}-print.png?${p.toString()}`;
  }, [amount, info]);

  const copyText = async (text, msg = "Đã sao chép") => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      void err;
    }
    Swal.fire({
      toast: true,
      position: "top-end",
      timer: 1200,
      showConfirmButton: false,
      icon: "success",
      title: msg,
    });
  };

  const afterSuccess = async () => {
    // ✅ dọn giỏ hàng local
    clearCart();

    await Swal.fire({
      icon: "success",
      title: "Đã ghi nhận thanh toán",
      text: orderId ? "Đơn hàng chuyển sang trạng thái Đang giao hàng." : "Cảm ơn bạn đã thanh toán.",
      timer: 1400,
      showConfirmButton: false,
    });

    navigate("/donhang");
  };

  const confirmPaid = async () => {
    if (submitting) return;

    if (method !== "cod" && !agree) {
      await Swal.fire({ icon: "info", title: "Vui lòng xác nhận đã chuyển khoản" });
      return;
    }

    // Có orderId: gọi API ghi nhận thanh toán + chuyển trạng thái giao hàng
    if (orderId) {
      try {
        setSubmitting(true);

        // 1) Lưu record thanh toán (bảng payments)
        await api.post(`/api/payments`, {
          MaDonHang: Number(orderId),
          SoTien: amount,
          NoiDungCK: info,
          MaGiaoDich: refCode.trim() || null,
          Method: method === "cod" ? "cod" : "bank",
        });

        // 2) Cập nhật đơn sang shipping + paid (tuỳ backend, giữ một route gọn)
        await api.put(`/api/donhang/mark-shipping/${orderId}`, {
          ShippingStatus: "shipping",
          PaymentStatus: method === "cod" ? "unpaid" : "paid",
          PaymentMethod: method === "cod" ? "cod" : "bank",
        });

        await afterSuccess();
        return;
      } catch (err) {
        const msg = err?.response?.data?.message || err?.message || "Không thể ghi nhận thanh toán.";
        await Swal.fire({ icon: "error", title: "Lỗi", text: msg });
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Không có orderId: chỉ xác nhận ở frontend (ví dụ thanh toán tạm)
    await afterSuccess();
  };

  return (
    <div className="pay-page">
      <div className="pay-card">
        <div className="pay-head">
          <h2>Thanh toán {orderId ? `đơn #${orderId}` : ""}</h2>
          <div className="pay-amount">{amount.toLocaleString("vi-VN")} đ</div>
        </div>

        {/* Tabs */}
        <div className="pay-tabs">
          <button className={`pay-tab ${method === "vietqr" ? "active" : ""}`} onClick={() => setMethod("vietqr")}>
            VietQR
          </button>
          <button className={`pay-tab ${method === "bank" ? "active" : ""}`} onClick={() => setMethod("bank")}>
            Chuyển khoản
          </button>
          <button className={`pay-tab ${method === "cod" ? "active" : ""}`} onClick={() => setMethod("cod")}>
            COD
          </button>
        </div>

        {/* VietQR */}
        {method === "vietqr" && (
          <div className="pay-section">
            <div className="pay-two">
              <div className="pay-box">
                <div className="pay-kv"><span>Ngân hàng</span><b>{BANK.code.toUpperCase()}</b></div>
                <div className="pay-kv">
                  <span>Số tài khoản</span>
                  <b style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {BANK.accountNumber}
                    <button className="pay-mini" onClick={() => copyText(BANK.accountNumber, "Đã copy STK")}>Copy</button>
                  </b>
                </div>
                <div className="pay-kv"><span>Chủ tài khoản</span><b>{BANK.accountName}</b></div>
                <div className="pay-kv">
                  <span>Nội dung CK</span>
                  <b style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {info}
                    <button className="pay-mini" onClick={() => copyText(info, "Đã copy nội dung")}>Copy</button>
                  </b>
                </div>
                <div className="pay-kv total"><span>Số tiền</span><b>{amount.toLocaleString("vi-VN")} đ</b></div>
              </div>

              <div className="pay-qr">
                {qrUrl ? (
                  <>
                    <img src={qrUrl} alt="VietQR" />
                    <div className="pay-qr-help">Mở app ngân hàng → Quét mã để thanh toán</div>
                    <a className="pay-mini" href={qrUrl} target="_blank" rel="noreferrer">Mở ảnh QR</a>
                  </>
                ) : (
                  <div className="pay-empty">Không tạo được ảnh VietQR</div>
                )}
              </div>
            </div>

            <div className="pay-ack">
              <label>
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                <span> Tôi đã chuyển khoản và ghi đúng nội dung <b>{info}</b></span>
              </label>
              <input
                className="pay-ref"
                placeholder="Mã giao dịch (khuyến khích điền)"
                value={refCode}
                onChange={(e) => setRefCode(e.target.value)}
              />
            </div>

            <div className="pay-actions">
              <button
                className="btn outline"
                onClick={() => copyText(`${BANK.accountNumber} - ${BANK.accountName}`, "Đã copy STK")}
              >
                Copy STK
              </button>
              <button className="btn primary" onClick={confirmPaid} disabled={!agree || submitting} aria-busy={submitting}>
                {submitting ? "Đang xử lý..." : "Xác nhận đã thanh toán"}
              </button>
            </div>
          </div>
        )}

        {/* CK tay */}
        {method === "bank" && (
          <div className="pay-section">
            <div className="pay-box">
              <div className="pay-kv"><span>Ngân hàng</span><b>{BANK.code.toUpperCase()}</b></div>
              <div className="pay-kv"><span>Số tài khoản</span><b>{BANK.accountNumber}</b></div>
              <div className="pay-kv"><span>Chủ tài khoản</span><b>{BANK.accountName}</b></div>
              <div className="pay-kv"><span>Nội dung CK</span><b>{info}</b></div>
              <div className="pay-kv total"><span>Số tiền</span><b>{amount.toLocaleString("vi-VN")} đ</b></div>
            </div>

            <div className="pay-ack">
              <label>
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                <span> Tôi đã chuyển khoản và ghi đúng nội dung <b>{info}</b></span>
              </label>
              <input
                className="pay-ref"
                placeholder="Mã giao dịch (khuyến khích điền)"
                value={refCode}
                onChange={(e) => setRefCode(e.target.value)}
              />
            </div>

            <div className="pay-actions">
              <button
                className="btn outline"
                onClick={() => copyText(`${BANK.accountNumber} - ${BANK.accountName}`, "Đã copy STK")}
              >
                Copy STK
              </button>
              <button className="btn primary" onClick={confirmPaid} disabled={!agree || submitting} aria-busy={submitting}>
                {submitting ? "Đang xử lý..." : "Xác nhận đã thanh toán"}
              </button>
            </div>
          </div>
        )}

        {/* COD */}
        {method === "cod" && (
          <div className="pay-section">
            <div className="pay-info">
              <p><b>Thanh toán khi nhận hàng (COD)</b></p>
              <p>Nhân viên giao hàng sẽ thu <b>{amount.toLocaleString("vi-VN")} đ</b>.</p>
            </div>
            <div className="pay-actions">
              <button className="btn primary" onClick={confirmPaid} disabled={submitting} aria-busy={submitting}>
                {submitting ? "Đang xử lý..." : "Xác nhận đặt COD"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
