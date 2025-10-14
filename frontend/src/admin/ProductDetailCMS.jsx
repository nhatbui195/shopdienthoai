// src/admin/ProductCMS.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "../styles/admin/ProductCMS.css";

const API = "http://localhost:3001";

/* ===== Helpers ===== */
const fmtVND = (n) =>
  (Number(n) || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });
const getId = (p) => p?.MaSanPham ?? p?.id ?? p?.ID ?? "";
const getName = (p) => p?.TenSanPham ?? p?.name ?? "Sản phẩm";
const getBrand = (p) => p?.ThuongHieu ?? p?.HangSanXuat ?? p?.Brand ?? "";
const getPrice = (p) => Number(p?.DonGia ?? p?.GiaBan ?? 0) || 0;

export default function ProductCMS() {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null); // sản phẩm đang chọn

  // CMS data cho sản phẩm đã chọn
  const [saving, setSaving] = useState(false);
  const [infos, setInfos] = useState([]);   // [{heading, body}]
  const [topics, setTopics] = useState([]); // [{title}]
  const [faqs, setFaqs] = useState([]);     // [{q, a}]

  /* ===== Load danh sách sản phẩm ===== */
  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API}/api/products`);
        setProducts(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error(e);
        Swal.fire("Lỗi", "Không tải được danh sách sản phẩm", "error");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const filtered = useMemo(() => {
    if (!q) return products;
    const s = q.trim().toLowerCase();
    return products.filter((p) => {
      const id = String(getId(p)).toLowerCase();
      const name = String(getName(p)).toLowerCase();
      const brand = String(getBrand(p)).toLowerCase();
      return id.includes(s) || name.includes(s) || brand.includes(s);
    });
  }, [products, q]);

  /* ===== Chọn một sản phẩm => load CMS ===== */
  const pickProduct = async (p) => {
    setSelected(p);
    try {
      const res = await axios.get(`${API}/api/products/${getId(p)}/extended`);
      const { infos = [], topics = [], faqs = [] } = res.data || {};
      setInfos(infos);
      setTopics(topics);
      setFaqs(faqs);
    } catch  {
      // nếu chưa có dữ liệu CMS thì để rỗng
      setInfos([]);
      setTopics([]);
      setFaqs([]);
    }
  };

  /* ===== Thao tác form ===== */
  const addInfo = () => setInfos((v) => [...v, { heading: "", body: "" }]);
  const addTopic = () => setTopics((v) => [...v, { title: "" }]);
  const addFaq = () => setFaqs((v) => [...v, { q: "", a: "" }]);
  const rmAt = (setter, idx) => setter((v) => v.filter((_, i) => i !== idx));

  /* ===== Lưu CMS ===== */
  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await axios.put(`${API}/api/products/${getId(selected)}/extended`, {
        infos,
        topics,
        faqs,
      });
      Swal.fire("Thành công", "Đã lưu nội dung CMS cho sản phẩm", "success");
    } catch (e) {
      console.error(e);
      Swal.fire("Lỗi", "Không lưu được nội dung CMS", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cms-wrap">
      {/* ===== Sidebar trái: Info chung + nút lưu ===== */}
      <aside className="cms-sidebar">
        <h3>Thông tin sản phẩm</h3>
        <p className="muted">
          Chọn một sản phẩm ở bảng trung tâm để cấu hình nội dung riêng (Infos / Topics / FAQs).
        </p>

        {selected ? (
          <div className="sel-card">
            <div className="sel-title">{getName(selected)}</div>
            <div className="sel-sub">
              Hãng: {getBrand(selected) || "-"} • Giá: {fmtVND(getPrice(selected))}
            </div>
            <button className="btn-save" onClick={save} disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu nội dung"}
            </button>
          </div>
        ) : (
          <div className="sel-empty">Chưa chọn sản phẩm</div>
        )}

        <div className="tips">
          <b>Mẹo:</b> Dùng <i>Infos</i> cho khối mô tả có tiêu đề; <i>Topics</i> cho danh sách ngắn;
          <i> FAQs</i> cho phần Hỏi/Đáp.
        </div>
      </aside>

      {/* ===== Khu giữa: Bảng sản phẩm ===== */}
      <section className="cms-center">
        <div className="bar">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo tên / hãng / ID..."
          />
        </div>

        <div className="tbl-wrap">
          {loading ? (
            <div className="loading">Đang tải danh sách...</div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 80 }}>ID</th>
                  <th>Tên</th>
                  <th style={{ width: 140 }}>Hãng</th>
                  <th style={{ width: 150 }}>Giá</th>
                  <th style={{ width: 110 }}>Chọn</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={getId(p)}
                    className={selected && getId(selected) === getId(p) ? "active" : ""}
                  >
                    <td>{getId(p)}</td>
                    <td>{getName(p)}</td>
                    <td>{getBrand(p)}</td>
                    <td>{fmtVND(getPrice(p))}</td>
                    <td>
                      <button className="btn" onClick={() => pickProduct(p)}>
                        Chọn
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="muted">
                      Không có sản phẩm phù hợp
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* ===== Khu phải: Form CMS ===== */}
      <section className="cms-editor">
        {!selected ? (
          <div className="empty">Chọn một sản phẩm để nhập nội dung</div>
        ) : (
          <>
            <h3>CMS cho: {getName(selected)}</h3>

            {/* Infos */}
            <div className="panel">
              <div className="panel-head">
                <h4>Infos (Tiêu đề & mô tả)</h4>
                <button className="btn" onClick={addInfo}>
                  + Thêm Info
                </button>
              </div>
              {infos.length === 0 && <div className="muted">Chưa có mục nào</div>}
              {infos.map((it, idx) => (
                <div className="group" key={`info-${idx}`}>
                  <input
                    value={it.heading}
                    onChange={(e) =>
                      setInfos((v) =>
                        v.map((x, i) => (i === idx ? { ...x, heading: e.target.value } : x))
                      )
                    }
                    placeholder="Tiêu đề"
                  />
                  <textarea
                    rows={3}
                    value={it.body}
                    onChange={(e) =>
                      setInfos((v) =>
                        v.map((x, i) => (i === idx ? { ...x, body: e.target.value } : x))
                      )
                    }
                    placeholder="Nội dung chi tiết"
                  />
                  <button className="btn-del" onClick={() => rmAt(setInfos, idx)}>
                    Xóa
                  </button>
                </div>
              ))}
            </div>

            {/* Topics */}
            <div className="panel">
              <div className="panel-head">
                <h4>Topics (chủ đề ngắn)</h4>
                <button className="btn" onClick={addTopic}>
                  + Thêm Topic
                </button>
              </div>
              {topics.length === 0 && <div className="muted">Chưa có mục nào</div>}
              {topics.map((it, idx) => (
                <div className="group row" key={`topic-${idx}`}>
                  <input
                    value={it.title}
                    onChange={(e) =>
                      setTopics((v) =>
                        v.map((x, i) => (i === idx ? { ...x, title: e.target.value } : x))
                      )
                    }
                    placeholder="Tiêu đề topic"
                  />
                  <button className="btn-del" onClick={() => rmAt(setTopics, idx)}>
                    Xóa
                  </button>
                </div>
              ))}
            </div>

            {/* FAQs */}
            <div className="panel">
              <div className="panel-head">
                <h4>FAQs (Hỏi / Đáp)</h4>
                <button className="btn" onClick={addFaq}>
                  + Thêm FAQ
                </button>
              </div>
              {faqs.length === 0 && <div className="muted">Chưa có câu hỏi</div>}
              {faqs.map((it, idx) => (
                <div className="group" key={`faq-${idx}`}>
                  <input
                    value={it.q}
                    onChange={(e) =>
                      setFaqs((v) => v.map((x, i) => (i === idx ? { ...x, q: e.target.value } : x)))
                    }
                    placeholder="Câu hỏi"
                  />
                  <textarea
                    rows={2}
                    value={it.a}
                    onChange={(e) =>
                      setFaqs((v) => v.map((x, i) => (i === idx ? { ...x, a: e.target.value } : x)))
                    }
                    placeholder="Câu trả lời"
                  />
                  <button className="btn-del" onClick={() => rmAt(setFaqs, idx)}>
                    Xóa
                  </button>
                </div>
              ))}
            </div>

            <div className="save-bar">
              <button className="btn-save" onClick={save} disabled={saving}>
                {saving ? "Đang lưu..." : "Lưu CMS"}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
