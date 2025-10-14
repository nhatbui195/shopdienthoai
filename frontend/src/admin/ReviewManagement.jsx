import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useSearchParams, useParams } from "react-router-dom";
import "../styles/admin/ReviewManagement.css";

const API = "http://localhost:3001";

export default function ReviewManagement({ productId: productIdProp }) {
  const params = useParams();
  const [sp] = useSearchParams();
  const productId =
    productIdProp || params?.id || sp.get("id") || sp.get("productId");

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);  // đánh giá sao
  const [comments, setComments] = useState([]); // bình luận
  const [loading, setLoading] = useState(false);
  const [moderating, setModerating] = useState(false);

  const title = useMemo(
    () => (product ? `Đánh giá & bình luận: ${product.TenSanPham}` : "Đánh giá & bình luận"),
    [product]
  );

  // ✅ Bọc loadData bằng useCallback để dùng trong useEffect
  const loadData = useCallback(async () => {
    if (!productId) {
      setReviews([]);
      setComments([]);
      setProduct(null);
      return;
    }
    setLoading(true);
    try {
      const [p, rv, cm] = await Promise.all([
        axios.get(`${API}/api/products/${productId}`),
        axios.get(`${API}/api/reviews?productId=${productId}`),
        axios.get(`${API}/api/comments?productId=${productId}`),
      ]);
      setProduct(p.data || null);
      setReviews(rv.data || []);
      setComments(cm.data || []);
    } catch (e) {
      console.error("Load reviews/comments failed:", e);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  // ✅ Thêm loadData vào deps
  useEffect(() => {
    loadData().catch(() => {});
  }, [loadData]);

  const approveReview = async (id, approved) => {
    setModerating(true);
    try {
      await axios.put(`${API}/api/reviews/${id}/approve`, { approved });
      await loadData();
    } catch (e) {
      console.error(e);
      alert("Cập nhật trạng thái đánh giá thất bại!");
    } finally {
      setModerating(false);
    }
  };

  const deleteReview = async (id) => {
    if (!window.confirm("Xoá đánh giá này?")) return;
    setModerating(true);
    try {
      await axios.delete(`${API}/api/reviews/${id}`);
      await loadData();
    } catch (e) {
      console.error(e);
      alert("Xoá đánh giá thất bại!");
    } finally {
      setModerating(false);
    }
  };

  const deleteComment = async (id) => {
    if (!window.confirm("Xoá bình luận này?")) return;
    setModerating(true);
    try {
      await axios.delete(`${API}/api/comments/${id}`);
      await loadData();
    } catch (e) {
      console.error(e);
      alert("Xoá bình luận thất bại!");
    } finally {
      setModerating(false);
    }
  };

  return (
    <div className="admin-card">
      <div className="admin-card__header">
        <h2>{title}</h2>
        <button className="btn outline" onClick={loadData} disabled={loading}>
          {loading ? "Đang tải..." : "Tải lại"}
        </button>
      </div>

      {loading ? (
        <div className="muted">Đang tải dữ liệu…</div>
      ) : (
        <>
          <section className="admin-block">
            <h3>Đánh giá ({reviews.length})</h3>
            {reviews.length === 0 && <div className="muted">Chưa có đánh giá.</div>}
            {reviews.map((r) => (
              <div className="row review-row" key={r.id || r.MaPhanHoi}>
                <div className="grow">
                  <strong>{r.TieuDe || "Đánh giá"}</strong> • {r.DanhGia || r.rating}★
                  <div className="muted">{r.NoiDung}</div>
                  <div className="muted small">
                    bởi {r.TenKhach || r.khachHang || "Ẩn danh"} • {r.NgayPhanHoi}
                  </div>
                </div>
                <div className="actions">
                  <button
                    className="btn small"
                    disabled={moderating}
                    onClick={() => approveReview(r.id || r.MaPhanHoi, true)}
                  >
                    Duyệt
                  </button>
                  <button
                    className="btn outline small"
                    disabled={moderating}
                    onClick={() => approveReview(r.id || r.MaPhanHoi, false)}
                  >
                    Ẩn
                  </button>
                  <button
                    className="btn danger small"
                    disabled={moderating}
                    onClick={() => deleteReview(r.id || r.MaPhanHoi)}
                  >
                    Xoá
                  </button>
                </div>
              </div>
            ))}
          </section>

          <section className="admin-block">
            <h3>Bình luận ({comments.length})</h3>
            {comments.length === 0 && <div className="muted">Chưa có bình luận.</div>}
            {comments.map((c) => (
              <div className="row comment-row" key={c.id || c.MaPhanHoi}>
                <div className="grow">
                  <strong>{c.TenKhach || c.khachHang || "Khách"}</strong>
                  <div className="muted">{c.NoiDung || c.comment}</div>
                  <div className="muted small">{c.NgayPhanHoi}</div>
                </div>
                <div className="actions">
                  <button
                    className="btn danger small"
                    disabled={moderating}
                    onClick={() => deleteComment(c.id || c.MaPhanHoi)}
                  >
                    Xoá
                  </button>
                </div>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
