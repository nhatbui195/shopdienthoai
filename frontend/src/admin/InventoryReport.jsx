import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const API = "http://localhost:3001";

export default function InventoryReport() {
  const [products, setProducts] = useState([]); // [{ TenSanPham, SoLuongTon, NhaCungCap }]
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({ q: "", supplier: "all" });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API}/api/admin/reports/inventory`);
        const rows = (res.data || []).map(p => ({
          name: p.TenSanPham || p.tenSanPham || p.Name || p.name,
          stock: Number(p.SoLuongTon ?? p.soLuongTon ?? p.Stock ?? p.stock ?? 0),
          supplier: p.NhaCungCap || p.nhaCungCap || p.Supplier || p.supplier || "—"
        }));
        setProducts(rows);
      } finally { setLoading(false); }
    })();
  }, []);

  const suppliers = useMemo(() => {
    const set = new Set(products.map(p => p.supplier || "—"));
    return ["all", ...Array.from(set)];
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const okName = !filter.q || (p.name || "").toLowerCase().includes(filter.q.toLowerCase());
      const okSupplier = filter.supplier === "all" || p.supplier === filter.supplier;
      return okName && okSupplier;
    });
  }, [products, filter]);

  const chartData = useMemo(() => {
    // Top 12 mặt hàng tồn nhiều nhất
    return [...filtered].sort((a,b)=>b.stock-a.stock).slice(0,12);
  }, [filtered]);

  return (
    <div className="card" style={{ background:"#fff" }}>
      <div className="card-title">Báo cáo tồn kho</div>

      <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:10 }}>
        <input
          placeholder="Tìm theo tên sản phẩm..."
          value={filter.q}
          onChange={e => setFilter(f => ({ ...f, q: e.target.value }))}
          style={{ flex:1, padding:"8px 10px", borderRadius:8, border:"1px solid #e5e7eb" }}
        />
        <select
          value={filter.supplier}
          onChange={e => setFilter(f => ({ ...f, supplier: e.target.value }))}
          style={{ padding:"8px 10px", borderRadius:8, border:"1px solid #e5e7eb" }}
        >
          {suppliers.map(s => <option key={s} value={s}>{s === "all" ? "Tất cả NCC" : s}</option>)}
        </select>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" hide />
          <YAxis />
          <Tooltip />
          <Bar dataKey="stock" radius={[6,6,0,0]} fill="#f59e0b" />
        </BarChart>
      </ResponsiveContainer>

      <div className="card-title" style={{ marginTop:12 }}>Danh sách tồn kho</div>
      <table className="mini">
        <thead>
          <tr>
            <th>Sản phẩm</th>
            <th>Kho</th>
            <th>Nhà cung cấp</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((p, i) => (
            <tr key={`${p.name}-${i}`}>
              <td>{p.name}</td>
              <td>{p.stock.toLocaleString()}</td>
              <td>{p.supplier}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {loading && <div className="card-note">Đang tải...</div>}
      {!loading && products.length === 0 && <div className="card-note">Chưa có dữ liệu tồn kho.</div>}
    </div>
  );
}
