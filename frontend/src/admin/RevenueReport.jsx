// src/admin/RevenueReport.jsx
import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from "recharts";

export default function RevenueReport() {
  const [range, setRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1), // 1/1 năm nay
    to: new Date(),                                 // hôm nay
  });
  const [data, setData] = useState([]);   // [{ month: '2025-01', revenue: 123456789 }]
  const [loading, setLoading] = useState(false);

  // yyyy-MM cho 2 input month
  const query = useMemo(() => {
    const f = `${range.from.getFullYear()}-${String(range.from.getMonth()+1).padStart(2,"0")}`;
    const t = `${range.to.getFullYear()}-${String(range.to.getMonth()+1).padStart(2,"0")}`;
    return { f, t };
  }, [range]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.get("/api/admin/reports/revenue", {
          params: { from: query.f, to: query.t },
        });
        const rows = (res.data || []).map(r => ({
          month: r.Thang || r.month,
          revenue: Number(r.DoanhThu || r.revenue || 0),
        }));
        setData(rows);
      } finally {
        setLoading(false);
      }
    })();
  }, [query.f, query.t]);

  const total = useMemo(() => data.reduce((s, i) => s + (i.revenue||0), 0), [data]);

  return (
    <div className="card" style={{ background:"#fff" }}>
      <div className="card-title">Báo cáo doanh thu</div>

      <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:10 }}>
        <label>Từ</label>
        <input
          type="month"
          value={query.f}
          onChange={e => {
            const [y,m] = e.target.value.split("-").map(Number);
            setRange(r => ({ ...r, from: new Date(y, m-1, 1) }));
          }}
        />
        <label>Đến</label>
        <input
          type="month"
          value={query.t}
          onChange={e => {
            const [y,m] = e.target.value.split("-").map(Number);
            setRange(r => ({ ...r, to: new Date(y, m-1, 1) }));
          }}
        />
        <span style={{ marginLeft:"auto", fontWeight:700 }}>
          Tổng: {total.toLocaleString("vi-VN")} đ
        </span>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="revenue" radius={[6,6,0,0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="card-note">Xu hướng doanh thu</div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="revenue" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>

      {loading && <div className="card-note">Đang tải...</div>}
      {!loading && data.length === 0 && <div className="card-note">Không có dữ liệu trong khoảng thời gian.</div>}
    </div>
  );
}
