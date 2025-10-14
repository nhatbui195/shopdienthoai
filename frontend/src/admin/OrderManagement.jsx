// src/admin/OrderManagement.jsx
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "../styles/admin/OrderManagement.css";

const API = "http://localhost:3001";
const fmtVND = (n) =>
  (Number(n) || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

/* ===== Label & CSS helpers ===== */
const orderStatusLabel = (s) => s || "Chờ xác nhận";
const orderStatusClass = (s) => {
  const v = String(s || "").toLowerCase();
  if (v.includes("hủy")) return "om-badge--danger";
  if (v.includes("xác nhận") || v.includes("đã giao")) return "om-badge--success";
  if (v.includes("lỗi")) return "om-badge--warn";
  return "om-badge--muted";
};

const payLabel = (ps) =>
  ps === "paid" ? "Đã thanh toán" : ps === "refunded" ? "Đã hoàn tiền" : "Chưa thanh toán";
const payClass = (ps) =>
  ps === "paid" ? "om-badge--success" : ps === "refunded" ? "om-badge--muted" : "om-badge--warn";

/* Thêm case 'pending' để hiển thị rõ khi shipping mới tạo */
const shipLabel = (s) => {
  const v = String(s || "").toLowerCase();
  if (v === "pending") return "Chờ xử lý VC";
  if (v === "picking") return "Đang lấy hàng";
  if (v === "shipping") return "Đang giao";
  if (v === "delivered") return "Đã giao";
  if (v === "canceled") return "VC hủy";
  return "Chưa xử lý VC";
};
const shipClass = (s) => {
  const v = String(s || "").toLowerCase();
  if (v === "delivered") return "om-badge--success";
  if (v === "shipping" || v === "picking") return "om-badge";
  if (v === "canceled") return "om-badge--danger";
  if (v === "pending") return "om-badge--muted";
  return "om-badge--muted";
};

export default function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [cancelReqIds, setCancelReqIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [statusUpdate, setStatusUpdate] = useState({}); // { [MaDonHang]: "Trạng thái mới" }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/admin/donhang`);
      setOrders(Array.isArray(res.data) ? res.data : []);

      const req = await axios.get(`${API}/api/admin/yeucauhuy`);
      const ids = new Set((Array.isArray(req.data) ? req.data : []).map((d) => d.MaDonHang));
      setCancelReqIds(ids);
    } catch (err) {
      console.error("Load orders failed:", err);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: err?.response?.data?.message || "Không tải được danh sách đơn hàng.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const withLoading = (title = "Đang xử lý...") =>
    Swal.fire({ title, allowOutsideClick: false, didOpen: () => Swal.showLoading() });

  /* ====== Thao tác trạng thái đơn ====== */
  const confirmOrder = async (id) => {
    const ok = await Swal.fire({
      title: `Xác nhận đơn #${id}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Xác nhận",
      cancelButtonText: "Hủy",
    });
    if (!ok.isConfirmed) return;

    withLoading("Đang xác nhận...");
    try {
      await axios.put(`${API}/api/admin/xacnhan-don/${id}`);
      await load();
      Swal.fire({ icon: "success", title: "Đã xác nhận đơn", timer: 900, showConfirmButton: false });
    } catch (err) {
      console.error("Confirm order failed:", err);
      Swal.fire({
        icon: "error",
        title: "Thất bại",
        text: err?.response?.data?.message || "Không thể xác nhận đơn.",
      });
    }
  };

  const confirmCancel = async (id) => {
    const ok = await Swal.fire({
      title: `Xác nhận hủy đơn #${id}?`,
      text: "Đơn sẽ chuyển sang 'Đã hủy' & dừng vận chuyển.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xác nhận hủy",
      cancelButtonText: "Không",
      confirmButtonColor: "#ef4444",
    });
    if (!ok.isConfirmed) return;

    withLoading("Đang hủy đơn...");
    try {
      await axios.put(`${API}/api/admin/xacnhan-huy/${id}`);
      await load();
      Swal.fire({ icon: "success", title: "Đã hủy đơn", timer: 900, showConfirmButton: false });
    } catch (err) {
      console.error("Confirm cancel failed:", err);
      Swal.fire({
        icon: "error",
        title: "Thất bại",
        text: err?.response?.data?.message || "Không thể hủy đơn.",
      });
    }
  };

  const rejectCancel = async (id) => {
    const ok = await Swal.fire({
      title: `Từ chối yêu cầu hủy #${id}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Từ chối",
      cancelButtonText: "Hủy",
    });
    if (!ok.isConfirmed) return;

    withLoading("Đang từ chối...");
    try {
      await axios.put(`${API}/api/admin/tuchoi-huy/${id}`);
      await load();
      Swal.fire({ icon: "success", title: "Đã từ chối yêu cầu hủy", timer: 900, showConfirmButton: false });
    } catch (err) {
      console.error("Reject cancel failed:", err);
      Swal.fire({
        icon: "error",
        title: "Thất bại",
        text: err?.response?.data?.message || "Không thể từ chối yêu cầu hủy.",
      });
    }
  };

  const updateStatusManual = async (id) => {
    const TrangThai = (statusUpdate[id] || "").trim();
    if (!TrangThai) {
      Swal.fire({ icon: "info", title: "Chưa nhập trạng thái mới" });
      return;
    }
    const ok = await Swal.fire({
      title: `Cập nhật trạng thái đơn #${id}?`,
      text: `Trạng thái mới: ${TrangThai}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Cập nhật",
      cancelButtonText: "Hủy",
    });
    if (!ok.isConfirmed) return;

    withLoading("Đang cập nhật...");
    try {
      await axios.put(`${API}/api/admin/capnhat-trangthai/${id}`, { TrangThai });
      await load();
      Swal.fire({ icon: "success", title: "Đã cập nhật", timer: 900, showConfirmButton: false });
    } catch (err) {
      console.error("Manual update status failed:", err);
      Swal.fire({
        icon: "error",
        title: "Cập nhật thất bại",
        text: err?.response?.data?.message || "Không thể cập nhật.",
      });
    }
  };

  const removeOrder = async (id) => {
    const ok = await Swal.fire({
      title: `Xóa đơn hàng #${id}?`,
      text: "Hành động không thể hoàn tác.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#ef4444",
    });
    if (!ok.isConfirmed) return;

    withLoading("Đang xóa...");
    try {
      await axios.delete(`${API}/api/admin/xoadonhang/${id}`);
      await load();
      Swal.fire({ icon: "success", title: "Đã xóa đơn", timer: 900, showConfirmButton: false });
    } catch (err) {
      console.error("Remove order failed:", err);
      Swal.fire({
        icon: "error",
        title: "Xóa thất bại",
        text: err?.response?.data?.message || "Không thể xóa đơn.",
      });
    }
  };

  /* ====== Thanh toán ====== */
  const approvePayment = async (orderId) => {
    const ok = await Swal.fire({
      title: `Duyệt thanh toán đơn #${orderId}?`,
      text: "Đơn sẽ chuyển PaymentStatus='paid'.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Duyệt",
      cancelButtonText: "Hủy",
    });
    if (!ok.isConfirmed) return;

    withLoading("Đang duyệt thanh toán...");
    try {
      await axios.put(`${API}/api/admin/donhang/approve-payment/${orderId}`);
      await load();
      Swal.fire({ icon: "success", title: "Đã duyệt thanh toán", timer: 900, showConfirmButton: false });
    } catch (err) {
      console.error("Approve payment failed:", err);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: err?.response?.data?.message || "Không thể duyệt thanh toán.",
      });
    }
  };

  const refundPayment = async (id) => {
    const ok = await Swal.fire({
      title: `Đánh dấu hoàn tiền đơn #${id}?`,
      text: "Đơn sẽ chuyển PaymentStatus='refunded'.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Đồng ý",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#ef4444",
    });
    if (!ok.isConfirmed) return;

    withLoading("Đang cập nhật hoàn tiền...");
    try {
      await axios.put(`${API}/api/admin/donhang/refund-payment/${id}`);
      await load();
      Swal.fire({ icon: "success", title: "Đã đánh dấu hoàn tiền", timer: 900, showConfirmButton: false });
    } catch (err) {
      console.error("Refund payment failed:", err);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: err?.response?.data?.message || "Không thể cập nhật hoàn tiền.",
      });
    }
  };

  /* ====== Vận chuyển ====== */
  const markPicking = async (id) => {
    withLoading("Đang chuyển trạng thái VC...");
    try {
      await axios.put(`${API}/api/admin/donhang/mark-picking/${id}`);
      await load();
      Swal.fire({ icon: "success", title: "Đã chuyển 'Đang lấy hàng'", timer: 800, showConfirmButton: false });
    } catch (err) {
      console.error("Mark picking failed:", err);
      Swal.fire({
        icon: "error",
        title: "Lỗi cập nhật vận chuyển",
        text: err?.response?.data?.message || "",
      });
    }
  };

  const markShipping = async (id) => {
    withLoading("Đang chuyển trạng thái VC...");
    try {
      await axios.put(`${API}/api/admin/donhang/mark-shipping/${id}`);
      await load();
      Swal.fire({ icon: "success", title: "Đã chuyển 'Đang giao'", timer: 800, showConfirmButton: false });
    } catch (err) {
      console.error("Mark shipping failed:", err);
      Swal.fire({
        icon: "error",
        title: "Lỗi cập nhật vận chuyển",
        text: err?.response?.data?.message || "",
      });
    }
  };

  const markDelivered = async (id) => {
    withLoading("Đang chuyển trạng thái VC...");
    try {
      await axios.put(`${API}/api/admin/donhang/mark-delivered/${id}`);
      await load();
      Swal.fire({ icon: "success", title: "Đã chuyển 'Đã giao'", timer: 800, showConfirmButton: false });
    } catch (err) {
      console.error("Mark delivered failed:", err);
      Swal.fire({
        icon: "error",
        title: "Lỗi cập nhật vận chuyển",
        text: err?.response?.data?.message || "",
      });
    }
  };

  const cancelShipping = async (id) => {
    const ok = await Swal.fire({
      title: `Hủy vận chuyển đơn #${id}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Đồng ý",
      cancelButtonText: "Không",
      confirmButtonColor: "#ef4444",
    });
    if (!ok.isConfirmed) return;

    withLoading("Đang hủy vận chuyển...");
    try {
      await axios.put(`${API}/api/admin/donhang/cancel-shipping/${id}`);
      await load();
      Swal.fire({ icon: "success", title: "Đã hủy vận chuyển", timer: 800, showConfirmButton: false });
    } catch (err) {
      console.error("Cancel shipping failed:", err);
      Swal.fire({
        icon: "error",
        title: "Lỗi cập nhật vận chuyển",
        text: err?.response?.data?.message || "",
      });
    }
  };

  return (
    <div className="om-wrap">
      <div className="om-card" style={{ overflowX: "auto" }}>
        <h2 style={{ marginTop: 0 }}>Quản lý đơn hàng</h2>

        {loading ? (
          <p>Đang tải...</p>
        ) : (
          <table className="om-table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Ngày</th>
                <th>Khách</th>
                <th>SĐT</th>
                <th>Tổng</th>
                <th>Đơn hàng</th>
                <th>Thanh toán</th>
                <th>Vận chuyển</th>
                <th>YC hủy</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const oLabel = orderStatusLabel(o.TrangThai);
                const oClass = orderStatusClass(o.TrangThai);
                const pLabel = payLabel(o.PaymentStatus);
                const pClass = payClass(o.PaymentStatus);
                const sLabel = shipLabel(o.ShippingStatus);
                const sClass = shipClass(o.ShippingStatus);

                const isCanceledOrder = oLabel.toLowerCase().includes("hủy");
                const hasCancelReq = cancelReqIds.has(o.MaDonHang);
                const isPaid = o.PaymentStatus === "paid";
                const hasShipping = ["pending", "picking", "shipping", "delivered", "canceled"].includes(
                  String(o.ShippingStatus || "").toLowerCase()
                );
                const isConfirmed = String(o.TrangThai || "").toLowerCase().includes("xác nhận");

                return (
                  <tr key={o.MaDonHang}>
                    <td>{o.MaDonHang}</td>
                    <td>{o.NgayDatHang ? new Date(o.NgayDatHang).toLocaleString() : ""}</td>
                    <td>{o.HoTen}</td>
                    <td>{o.SDT}</td>
                    <td>{fmtVND(o.TongTien)}</td>

                    <td>
                      <span className={`om-badge ${oClass}`}>{oLabel}</span>
                    </td>
                    <td>
                      <div className="om-col">
                        <span className={`om-badge ${pClass}`}>{pLabel}</span>
                        <small className="om-sub">{o.PaymentMethod ? `(${o.PaymentMethod.toUpperCase()})` : ""}</small>
                      </div>
                    </td>
                    <td>
                      <span className={`om-badge ${sClass}`}>{sLabel}</span>
                    </td>
                    <td>
                      {hasCancelReq ? (
                        <span className="om-badge om-badge--warn">Có</span>
                      ) : (
                        <span className="om-badge om-badge--muted">Không</span>
                      )}
                    </td>
                    <td>
                      <div className="om-actions">
                        {!isCanceledOrder && !isConfirmed && !hasShipping && (
                          <button className="om-btn om-btn--success" onClick={() => confirmOrder(o.MaDonHang)}>
                            Xác nhận
                          </button>
                        )}

                        {hasCancelReq && !isCanceledOrder && (
                          <>
                            <button className="om-btn om-btn--danger" onClick={() => confirmCancel(o.MaDonHang)}>
                              Xác nhận hủy
                            </button>
                            <button className="om-btn om-btn--warn" onClick={() => rejectCancel(o.MaDonHang)}>
                              Từ chối hủy
                            </button>
                          </>
                        )}

                        {!isCanceledOrder && (
                          <>
                            {!isPaid && (
                              <button
                                className="om-btn om-btn--primary"
                                onClick={() => approvePayment(o.MaDonHang)}
                              >
                                Duyệt thanh toán
                              </button>
                            )}
                            {isPaid && (
                              <button
                                className="om-btn om-btn--muted"
                                onClick={() => refundPayment(o.MaDonHang)}
                              >
                                Đánh dấu hoàn tiền
                              </button>
                            )}
                          </>
                        )}

                        {!isCanceledOrder && (
                          <>
                            <button className="om-btn" onClick={() => markPicking(o.MaDonHang)}>
                              Lấy hàng
                            </button>
                            <button className="om-btn" onClick={() => markShipping(o.MaDonHang)}>
                              Đang giao
                            </button>
                            <button className="om-btn om-btn--success" onClick={() => markDelivered(o.MaDonHang)}>
                              Đã giao
                            </button>
                            <button className="om-btn om-btn--danger" onClick={() => cancelShipping(o.MaDonHang)}>
                              Hủy VC
                            </button>
                          </>
                        )}

                        <input
                          className="om-input"
                          placeholder={oLabel || "Trạng thái mới"}
                          disabled={isCanceledOrder}
                          value={statusUpdate[o.MaDonHang] || ""}
                          onChange={(e) =>
                            setStatusUpdate((s) => ({ ...s, [o.MaDonHang]: e.target.value }))
                          }
                        />
                        <button
                          className="om-btn om-btn--primary"
                          disabled={isCanceledOrder}
                          onClick={() => updateStatusManual(o.MaDonHang)}
                        >
                          Cập nhật
                        </button>
                        <button className="om-btn om-btn--danger" onClick={() => removeOrder(o.MaDonHang)}>
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={10}>Không có dữ liệu</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
