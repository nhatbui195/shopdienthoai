import React, { useEffect, useState, useCallback, useRef } from "react";
import Swal from "sweetalert2";
import "../styles/admin/ProductManagement.css";
import ProductSpecsModal from "./ProductSpecsModal"; // ✅ modal thông số
import { http, API, safeImage } from "../lib/api";

const emptyProduct = {
  TenSanPham: "", HangSanXuat: "", CauHinh: "",
  DonGia: "", SoLuongTon: "", NgayNhap: "",
  GiaCu: "", GiaEdu: "", GiaVip: "",
  BaoHanh: "", TraGop: "", UuDai: "",
  HinhAnhList: []
};


export default function ProductManagement() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // ✅ trạng thái modal Thông số
  const [specOpen, setSpecOpen] = useState(false);
  const [specProduct, setSpecProduct] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await http.get("/api/products", {
           params: search ? { search } : undefined,
         });
      setList(res.data || []);
    } catch (err) {
      console.error("Load products error:", err);
      Swal.fire({ icon: "error", title: "Lỗi", text: "Không tải được danh sách sản phẩm" });
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const onSubmit = async (e) => {
    e.preventDefault();

    const isEdit = !!editingId;
    const confirm = await Swal.fire({
      title: isEdit ? "Cập nhật sản phẩm?" : "Thêm sản phẩm mới?",
      text: "Kiểm tra thông tin trước khi xác nhận.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Xác nhận",
      cancelButtonText: "Hủy"
    });
    if (!confirm.isConfirmed) return;

    const payload = {
      ...form,
      DonGia: Number(form.DonGia || 0),
      SoLuongTon: Number(form.SoLuongTon || 0),
      HinhAnhList: form.HinhAnhList
    };

    Swal.fire({
      title: "Đang lưu...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      if (isEdit) {
        await http.put(`/api/products/${editingId}`, payload);
      } else {
        await http.post(`/api/products`, payload);
      }

      Swal.fire({
        icon: "success",
        title: isEdit ? "Đã cập nhật" : "Đã thêm sản phẩm",
        timer: 1200,
        showConfirmButton: false
      });

      setForm(emptyProduct);
      setEditingId(null);
      await load();
    } catch (err) {
      console.error("Save product error:", err);
      Swal.fire({
        icon: "error",
        title: "Lưu thất bại",
        text: err.response?.data?.message || "Có lỗi khi lưu sản phẩm"
      });
    }
  };

  const onEdit = (p) => {
    setEditingId(p.MaSanPham);
    setForm({
      TenSanPham: p.TenSanPham || "",
      HangSanXuat: p.HangSanXuat || "",
      CauHinh: p.CauHinh || "",
      DonGia: p.DonGia || "",
      SoLuongTon: p.SoLuongTon || "",
      NgayNhap: p.NgayNhap ? p.NgayNhap.slice(0,10) : "",
      GiaCu: p.GiaCu || "",
      GiaEdu: p.GiaEdu || "",
      GiaVip: p.GiaVip || "",
      BaoHanh: p.BaoHanh || "",
      TraGop: p.TraGop || "",
      UuDai: p.UuDai || "",
      HinhAnhList: Array.isArray(p.HinhAnhList) ? p.HinhAnhList : []
    });

    Swal.fire({
      icon: "info",
      title: "Kéo lên trên để sửa",
      text: `Đang sửa: ${p.TenSanPham}`,
      timer: 1200,
      showConfirmButton: false
    });
  };

  const onDelete = async (id) => {
    const item = list.find(x => x.MaSanPham === id);
    const result = await Swal.fire({
      title: `Xóa "${item?.TenSanPham || "sản phẩm"}"?`,
      text: "Hành động không thể hoàn tác.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#ef4444"
    });
    if (!result.isConfirmed) return;

    try {
       await http.delete(`/api/products/${id}`);
      await load();
      Swal.fire({ icon: "success", title: "Đã xóa", timer: 1000, showConfirmButton: false });
    } catch (err) {
      console.error("Delete product error:", err);
      Swal.fire({ icon: "error", title: "Xóa thất bại", text: err.response?.data?.message || "Không thể xóa sản phẩm" });
    }
  };

  // ---- Ảnh: thêm bằng URL
  const addImageLink = async () => {
    const { value: link } = await Swal.fire({
      title: "Thêm ảnh bằng URL",
      input: "text",
      inputPlaceholder: "https://... hoặc /uploads/xxx.png",
      showCancelButton: true,
      confirmButtonText: "Thêm"
    });
    if (link) {
      setForm(f => ({ ...f, HinhAnhList: [...(f.HinhAnhList || []), link.trim()] }));
      Swal.fire({ icon: "success", title: "Đã thêm ảnh", timer: 800, showConfirmButton: false });
    }
  };

  // ---- Ảnh: upload nhiều file từ máy
  const openFilePicker = () => fileInputRef.current?.click();

  const uploadFiles = async (files) => {
    if (!files || !files.length) return;

    setUploading(true);
    Swal.fire({
      title: "Đang tải ảnh...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      const uploadedPaths = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
          const res = await http.post(`/api/upload`, fd, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        uploadedPaths.push(res.data?.path);
      }
      setForm(f => ({ ...f, HinhAnhList: [...(f.HinhAnhList || []), ...uploadedPaths] }));
      Swal.fire({ icon: "success", title: `Đã tải ${files.length} ảnh`, timer: 1000, showConfirmButton: false });
    } catch (err) {
      console.error("Upload error:", err);
      Swal.fire({ icon: "error", title: "Upload thất bại", text: "Vui lòng thử lại" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = async (idx) => {
    const ok = await Swal.fire({
      title: "Xóa ảnh này?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    });
    if (!ok.isConfirmed) return;
    setForm(f => ({ ...f, HinhAnhList: f.HinhAnhList.filter((_, i) => i !== idx) }));
  };

  const imgUrl = (src) => (src?.startsWith("http") ? src : `${API}${src}`);
  const imgUrl = (src) => safeImage(src);

  // ✅ mở modal Thông số
  const openSpecs = (p) => {
    setSpecProduct(p);
    setSpecOpen(true);
  };

  return (
    <div className="pm-wrap">
      {/* Tìm kiếm */}
      <div className="pm-card pm-search">
        <input
          placeholder="Tìm sản phẩm..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className="pm-btn" onClick={load}>Tìm</button>
        <button className="pm-btn" onClick={() => setSearch("")}>Reset</button>
      </div>

      {/* Form */}
      <form className="pm-card" onSubmit={onSubmit}>
        <h3 style={{ marginTop: 0 }}>Quản lý sản phẩm</h3>

        <div className="pm-grid">
          <label>TenSanPham
            <input value={form.TenSanPham} onChange={e=>setForm({...form, TenSanPham:e.target.value})} required />
          </label>
          <label>HangSanXuat
            <input value={form.HangSanXuat} onChange={e=>setForm({...form, HangSanXuat:e.target.value})} />
          </label>
          <label>CauHinh
            <input value={form.CauHinh} onChange={e=>setForm({...form, CauHinh:e.target.value})} />
          </label>
          <label>DonGia
            <input type="number" value={form.DonGia} onChange={e=>setForm({...form, DonGia:e.target.value})} />
          </label>
          <label>SoLuongTon
            <input type="number" value={form.SoLuongTon} onChange={e=>setForm({...form, SoLuongTon:e.target.value})} />
          </label>
          <label>NgayNhap
            <input type="date" value={form.NgayNhap} onChange={e=>setForm({...form, NgayNhap:e.target.value})} />
          </label>
          <label>GiaCu
            <input value={form.GiaCu} onChange={e=>setForm({...form, GiaCu:e.target.value})} />
          </label>
          <label>GiaEdu
            <input value={form.GiaEdu} onChange={e=>setForm({...form, GiaEdu:e.target.value})} />
          </label>
          <label>GiaVip
            <input value={form.GiaVip} onChange={e=>setForm({...form, GiaVip:e.target.value})} />
          </label>
          <label>BaoHanh
            <input value={form.BaoHanh} onChange={e=>setForm({...form, BaoHanh:e.target.value})} />
          </label>
          <label>TraGop
            <input value={form.TraGop} onChange={e=>setForm({...form, TraGop:e.target.value})} />
          </label>
          <label>UuDai
            <input value={form.UuDai} onChange={e=>setForm({...form, UuDai:e.target.value})} />
          </label>
        </div>

        {/* Ảnh */}
        <div style={{ marginTop: 12 }}>
          <div className="pm-images">
            {(form.HinhAnhList || []).map((src, i) => (
              <div className="pm-thumb" key={i}>
                <img src={imgUrl(src)} alt="" />
                <button type="button" className="pm-remove" onClick={() => removeImage(i)}>×</button>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
            <button type="button" className="pm-btn" onClick={addImageLink}>+ Thêm link ảnh</button>
            <button type="button" className="pm-btn" onClick={openFilePicker} disabled={uploading}>
              {uploading ? "Đang tải..." : "Chọn ảnh từ máy"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={(e) => uploadFiles(e.target.files)}
            />
          </div>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button type="submit" className="pm-btn primary">{editingId ? "Cập nhật" : "Thêm mới"}</button>
          {editingId && (
            <button type="button" className="pm-btn" onClick={() => { setEditingId(null); setForm(emptyProduct); }}>
              Hủy sửa
            </button>
          )}
        </div>
      </form>

      {/* Danh sách */}
      <div className="pm-card" style={{ overflowX: "auto" }}>
        <table className="pm-table">
          <thead>
            <tr>
              <th>ID</th><th>Tên</th><th>Hãng</th><th>Giá</th><th>Tồn</th><th>Ảnh</th><th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {list.map(p => (
              <tr key={p.MaSanPham}>
                <td>{p.MaSanPham}</td>
                <td>{p.TenSanPham}</td>
                <td>{p.HangSanXuat}</td>
                <td>{Number(p.DonGia || 0).toLocaleString()} đ</td>
                <td>{p.SoLuongTon}</td>
                <td>
                  {Array.isArray(p.HinhAnhList) && p.HinhAnhList[0] && (
                    <img alt="" src={imgUrl(p.HinhAnhList[0])} style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6 }} />
                  )}
                </td>
                <td>
                  <div className="pm-actions">
                    <button className="pm-btn" onClick={() => onEdit(p)}>Sửa</button>
                    <button className="pm-btn" onClick={() => openSpecs(p)}>
                      <i className="bx bx-cog" style={{marginRight:6}}></i> Thông số
                    </button>
                    <button className="pm-btn danger" onClick={() => onDelete(p.MaSanPham)}>Xóa</button>
                  </div>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={7}>Không có dữ liệu</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ Modal Thông số kỹ thuật */}
      <ProductSpecsModal
        open={specOpen}
        product={specProduct}
        onClose={() => setSpecOpen(false)}
        onSaved={() => {
          // nếu cần, có thể reload list sau khi lưu chi tiết
          // load();
        }}
      />
    </div>
  );
}
