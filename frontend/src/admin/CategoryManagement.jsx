import React, { useCallback, useEffect, useMemo, useState } from "react";
import { http } from "../lib/api";                // ⬅️ dùng client chung
import "../styles/admin/CategoryManagement.css";

export default function CategoryManagement() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return items;
    return items.filter(
      (it) =>
        String(it.TenDanhMuc || "").toLowerCase().includes(kw) ||
        String(it.MaDanhMuc).includes(kw)
    );
  }, [items, q]);

  const resetForm = useCallback(() => {
    setEditingId(null);
    setName("");
  }, []);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await http.get("/api/categories");
      setItems(res.data || []);
    } catch (e) {
      setError("Không tải được danh mục. Vui lòng thử lại.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const onSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const ten = name.trim();
      if (!ten) {
        alert("Tên danh mục không được trống!");
        return;
      }
      setSaving(true);
      setError("");
      try {
        if (editingId) {
          await http.put(`/api/categories/${editingId}`, { TenDanhMuc: ten });
        } else {
          await http.post("/api/categories", { TenDanhMuc: ten });
        }
        await loadCategories();
        resetForm();
      } catch (err) {
        setError("Lưu danh mục thất bại.");
        console.error(err);
      } finally {
        setSaving(false);
      }
    },
    [editingId, name, loadCategories, resetForm]
  );

  const startEdit = useCallback((item) => {
    setEditingId(item.MaDanhMuc);
    setName(item.TenDanhMuc || "");
  }, []);

  const remove = useCallback(
    async (id) => {
      if (!window.confirm("Xoá danh mục này?")) return;
      setSaving(true);
      setError("");
      try {
        await http.delete(`/api/categories/${id}`);
        await loadCategories();
        if (editingId === id) resetForm();
      } catch (err) {
        setError("Xoá thất bại. Có thể danh mục đang được gán cho sản phẩm.");
        console.error(err);
      } finally {
        setSaving(false);
      }
    },
    [editingId, loadCategories, resetForm]
  );

  return (
    <div className="cat-card">
      <div className="cat-card__header">
        <h2>Danh mục</h2>
      </div>

      <div className="cat-card__body">
        {/* Form thêm / sửa */}
        <form className="cat-form" onSubmit={onSubmit}>
          <label className="cat-form__label" htmlFor="cat-name">
            Tên danh mục
          </label>
          <input
            id="cat-name"
            className="cat-input"
            placeholder="Ví dụ: Điện thoại, Tablet, Phụ kiện…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
          />
          <button className="cat-btn cat-btn--primary" type="submit" disabled={saving}>
            {editingId ? "Lưu thay đổi" : "Thêm mới"}
          </button>
          {editingId && (
            <button
              type="button"
              className="cat-btn"
              onClick={resetForm}
              disabled={saving}
            >
              Huỷ
            </button>
          )}
        </form>

        <div className="cat-tools">
          <input
            className="cat-input"
            placeholder="Tìm theo tên hoặc ID…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="cat-btn" type="button" onClick={loadCategories} disabled={loading}>
            Tải lại
          </button>
        </div>

        {error && <div className="cat-alert cat-alert--error">{error}</div>}

        {loading ? (
          <div className="cat-muted">Đang tải…</div>
        ) : (
          <div className="cat-table__wrap">
            <table className="cat-table">
              <thead>
                <tr>
                  <th style={{ width: 100 }}>ID</th>
                  <th>Tên danh mục</th>
                  <th style={{ width: 220, textAlign: "right" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="cat-muted">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  filtered.map((it) => (
                    <tr key={it.MaDanhMuc}>
                      <td>{it.MaDanhMuc}</td>
                      <td>{it.TenDanhMuc}</td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="cat-btn"
                          type="button"
                          onClick={() => startEdit(it)}
                          disabled={saving}
                        >
                          Sửa
                        </button>
                        <button
                          className="cat-btn cat-btn--danger"
                          type="button"
                          onClick={() => remove(it.MaDanhMuc)}
                          disabled={saving}
                          style={{ marginLeft: 8 }}
                        >
                          Xoá
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
