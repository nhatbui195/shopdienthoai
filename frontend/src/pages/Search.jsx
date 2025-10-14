import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import "../styles/pages/Search.css";

const API = "http://localhost:3001";

/* ===== Helpers ===== */
const fmtVND = (n) =>
  (Number(n) || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

const safeImage = (src) => (src && src.startsWith("http") ? src : `${API}${src || ""}`);

/* ===== Result Card (compact) ===== */
function ResultCard({ p, onClick }) {
  const cover =
    (Array.isArray(p?.HinhAnhList) && p.HinhAnhList[0]) || p?.HinhAnh || "";

  return (
    <div className="sr-card" onClick={onClick} title={p?.TenSanPham || ""}>
      <div className="sr-thumb">
        <img src={safeImage(cover)} alt={p?.TenSanPham || "product"} loading="lazy" />
      </div>
      <div className="sr-name">{p?.TenSanPham}</div>
      <div className="sr-price">{fmtVND(p?.DonGia)}</div>
    </div>
  );
}

/* ===== Page ===== */
export default function Search() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  // Track lifecycle để tránh alert sớm
  const requestedKwRef = useRef(null);
  const completedKwRef = useRef(null);
  const alertedRef = useRef(null);

  // Lấy keyword từ URL
  const keyword = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return (params.get("keyword") || "").trim();
  }, [location.search]);

  const doSearch = useCallback(async (kw) => {
    if (!kw) {
      setResults([]);
      return;
    }
    requestedKwRef.current = kw;
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/products`, { params: { search: kw } });
      const data = Array.isArray(res.data) ? res.data : [];

      const normalized = data.map((p) => {
        let list = [];
        try {
          list = Array.isArray(p.HinhAnhList)
            ? p.HinhAnhList
            : JSON.parse(p.HinhAnhList || "[]");
        } catch {
          list = [];
        }
        return { ...p, HinhAnhList: list };
      });

      setResults(normalized);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
      completedKwRef.current = kw;
    }
  }, []);

  useEffect(() => {
    if (!keyword) {
      navigate("/");
      return;
    }
    alertedRef.current = null;
    doSearch(keyword);
  }, [keyword, doSearch, navigate]);

  // Alert khi fetch xong mà không có kết quả
  useEffect(() => {
    const fetchDoneForThisKw = completedKwRef.current === keyword;
    if (!fetchDoneForThisKw) return;
    if (loading) return;

    const noResult = keyword && Array.isArray(results) && results.length === 0;
    if (noResult && alertedRef.current !== keyword) {
      alertedRef.current = keyword;
      Swal.fire({
        icon: "info",
        title: "Không tìm thấy sản phẩm phù hợp",
        text: `Từ khóa: “${keyword}”`,
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
      }).then(() => navigate("/"));
    }
  }, [results, loading, keyword, navigate]);

  const isEmpty = !loading && results.length === 0;

  return (
    <div className={`sr-shell ${isEmpty ? "is-empty" : ""}`}>
      {loading ? (
        <div className="sr-loading" aria-live="polite">Đang tìm kiếm…</div>
      ) : results.length > 0 ? (
        <div className="sr-grid">
          {results.map((p) => (
            <ResultCard
              key={p.MaSanPham}
              p={p}
              onClick={() => navigate(`/product/${p.MaSanPham}`)}
            />
          ))}
        </div>
      ) : (
        // Placeholder để giữ khoảng giữa header/footer (alert đã hiển thị bằng Swal)
        <div className="sr-empty-placeholder" aria-hidden="true" />
      )}
    </div>
  );
}
