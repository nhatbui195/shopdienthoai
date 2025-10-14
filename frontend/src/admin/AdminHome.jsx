import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from "recharts";
import { useNavigate } from "react-router-dom";
import { http } from "../lib/api";           // ⬅️ dùng client chung
import "../styles/admin/AdminHome.css";

export default function AdminHome() {
  const navigate = useNavigate();

  const [cards, setCards] = useState({
    totalUsers: 0,
    totalStaff: 0,
    totalProducts: 0,
    waitingOrders: 0,
    totalRevenue12M: 0
  });
  const [revenueData, setRevenueData] = useState([]);  // [{ month, revenue }]
  const [dailySales, setDailySales] = useState([]);    // [{ day, sales }]
  const [products, setProducts] = useState([]);        // để phân tích brand
  const [activeTab, setActiveTab] = useState("work");  // work | warehouse | website | care
  const [todos, setTodos] = useState([
    { id: 1, text: "Kiểm tra tồn kho các mẫu iPhone/Android bán chạy", done: false },
    { id: 2, text: "Phản hồi đánh giá của 5 khách hàng mới", done: false },
    { id: 3, text: "Cập nhật banner khuyến mãi cuối tuần", done: false },
    { id: 4, text: "Duyệt các đơn chờ xác nhận và gọi xác minh", done: false },
  ]);

  // Load/Lưu todo
  useEffect(() => {
    const saved = localStorage.getItem("admin_home_todos");
    if (saved) {
      try { setTodos(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);
  useEffect(() => {
    localStorage.setItem("admin_home_todos", JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    (async () => {
      try {
        // Doanh thu theo tháng
        const rev = await http.get("/api/admin/thongke/doanhthu");
        const rdata = (rev.data || []).map(r => ({
          month: r.Thang,
          revenue: Number(r.DoanhThu || 0)
        }));
        setRevenueData(rdata);
        const totalRevenue12M = rdata.reduce((s, i) => s + i.revenue, 0);

        // Số tài khoản theo vai trò
        const acc = await http.get("/api/admin/thongke/taikhoan");
        const totalUsers = acc.data?.find(x => x.VaiTro === "KhachHang")?.SoLuong || 0;
        const totalStaff = acc.data?.find(x => x.VaiTro === "NhanVien")?.SoLuong || 0;

        // Đơn chờ
        const wait = await http.get("/api/admin/thongke/doncho");
        const waitingOrders = Number(wait.data?.DonHangChoXacNhan || 0);

        // Sản phẩm (để vẽ pie)
        const productsRes = await http.get("/api/products");
        const prodList = (productsRes.data || []);
        const totalProducts = prodList.length;
        setProducts(prodList);

        // Bán ra theo ngày (demo)
        const pts = [];
        for (let i = 0; i < 7; i++) {
          pts.push({
            day: `Ngày ${i + 1}`,
            sales: Math.max(5, waitingOrders + i * 3),
          });
        }
        setDailySales(pts);

        setCards({
          totalUsers,
          totalStaff,
          totalProducts,
          waitingOrders,
          totalRevenue12M
        });
      } catch (e) {
        console.error("Load dashboard error:", e);
      }
    })();
  }, []);

  // Điều hướng nhanh từ tile
  const handleTileClick = (target) => {
    switch (target) {
      case "users":    navigate("/admin/users?role=KhachHang"); break;
      case "staff":    navigate("/admin/users?role=NhanVien");  break;
      case "products": navigate("/admin/products");             break;
      case "waiting":  navigate("/admin/orders?status=cho-xac-nhan"); break;
      default: break;
    }
  };

  // Click cột doanh thu theo tháng
  const handleBarClick = (data) => {
    const month = data?.payload?.month;
    if (month) navigate(`/admin/reports/revenue?month=${encodeURIComponent(month)}`);
  };

  // Click dòng nhân viên
  const handleStaffRowClick = (name) => {
    navigate(`/admin/staff?search=${encodeURIComponent(name)}`);
  };

  // Phân tích brand từ TenSanPham
  const brandPieData = useMemo(() => {
    const buckets = { Apple: 0, Samsung: 0, Xiaomi: 0, Oppo: 0, Vivo: 0, Realme: 0, Khac: 0 };
    const up = (brand) => { buckets[brand] = (buckets[brand] || 0) + 1; };
    products.forEach(p => {
      const name = (p?.TenSanPham || p?.tenSanPham || "").toLowerCase();
      if (!name) { up("Khac"); return; }
      if (name.includes("iphone") || name.includes("macbook") || name.includes("apple")) up("Apple");
      else if (name.includes("samsung") || name.includes("galaxy")) up("Samsung");
      else if (name.includes("xiaomi") || name.includes("redmi") || name.includes("poco")) up("Xiaomi");
      else if (name.includes("oppo")) up("Oppo");
      else if (name.includes("vivo")) up("Vivo");
      else if (name.includes("realme")) up("Realme");
      else up("Khac");
    });
    const arr = Object.entries(buckets)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
    return arr.length ? arr : [
      { name: "Apple", value: 4 },
      { name: "Samsung", value: 3 },
      { name: "Xiaomi", value: 2 },
      { name: "Khac", value: 1 },
    ];
  }, [products]);

  const PIE_COLORS = ["#0ea5e9", "#22c55e", "#f97316", "#ef4444", "#8b5cf6", "#14b8a6", "#64748b"];

  const tabContent = useMemo(() => {
    switch (activeTab) {
      case "work":
        return todos;
      case "warehouse":
        return [
          { id: "w1", text: "Kiểm tra nhập kho buổi sáng", done: false },
          { id: "w2", text: "Đối soát phiếu xuất 3 đơn lớn", done: false },
        ];
      case "website":
        return [
          { id: "wb1", text: "Cập nhật landing khuyến mãi 9.9", done: false },
          { id: "wb2", text: "Tối ưu ảnh banner trang chủ", done: false },
        ];
      case "care":
        return [
          { id: "c1", text: "Gọi lại 10 khách hàng để CSKH", done: false },
          { id: "c2", text: "Soạn kịch bản upsell phụ kiện", done: false },
        ];
      default:
        return todos;
    }
  }, [activeTab, todos]);

  const toggleTodo = (id) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  return (
    <div className="mh">
      {/* KPI */}
      <div className="mh-kpi">
        <div className="tile tile--blue clickable" onClick={() => handleTileClick("users")}>
          <div className="tile-icon"><i className="bx bx-group"></i></div>
          <div className="tile-meta">
            <div className="tile-title">Khách hàng</div>
            <div className="tile-value">{cards.totalUsers}</div>
            <div className="tile-sub">Tổng khách đã đăng ký</div>
          </div>
        </div>

        <div className="tile tile--green clickable" onClick={() => handleTileClick("staff")}>
          <div className="tile-icon"><i className="bx bx-id-card"></i></div>
          <div className="tile-meta">
            <div className="tile-title">Nhân viên</div>
            <div className="tile-value">{cards.totalStaff}</div>
            <div className="tile-sub">Tài khoản nội bộ</div>
          </div>
        </div>

        <div className="tile tile--orange clickable" onClick={() => handleTileClick("products")}>
          <div className="tile-icon"><i className="bx bx-mobile-alt"></i></div>
          <div className="tile-meta">
            <div className="tile-title">Sản phẩm đang bán</div>
            <div className="tile-value">{cards.totalProducts}</div>
            <div className="tile-sub">Điện thoại/biến thể</div>
          </div>
        </div>

        <div className="tile tile--red clickable" onClick={() => handleTileClick("waiting")}>
          <div className="tile-icon"><i className="bx bx-time-five"></i></div>
          <div className="tile-meta">
            <div className="tile-title">Đơn chờ xác nhận</div>
            <div className="tile-value">{cards.waitingOrders}</div>
            <div className="tile-sub">Cần xử lý sớm</div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="mh-grid">
        {/* Bán ra theo ngày */}
        <div className="card">
          <div className="card-title">Bán ra theo ngày</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dailySales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="sales" stroke="#ef4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
          <div className="card-note">
            Minh hoạ xu hướng đơn bán ra trong 7 ngày.
            <button className="btn-link" onClick={() => navigate(`/admin/orders?date=today`)}>
              Xem đơn hôm nay
            </button>
          </div>
        </div>

        {/* Doanh thu theo tháng */}
        <div className="card">
          <div className="card-title">Doanh thu theo tháng</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="revenue"
                radius={[6, 6, 0, 0]}
                fill="#4f46e5"
                cursor="pointer"
                onClick={handleBarClick}
              />
            </BarChart>
          </ResponsiveContainer>
          <div className="card-note">Tổng 12 tháng: {cards.totalRevenue12M.toLocaleString()} đ</div>
        </div>

        {/* Hiệu suất xử lý */}
        <div className="card">
          <div className="card-title">Hiệu suất xử lý</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={revenueData.map((x, i) => ({ name: i + 1, tasks: Math.round(x.revenue / 1e7) }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" hide />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="tasks" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="card-note">Dựa theo số đơn/khối lượng công việc (minh hoạ).</div>
        </div>

        {/* Pie thương hiệu */}
        <div className="card">
          <div className="card-title">Tỷ trọng sản phẩm theo thương hiệu</div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={brandPieData}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                label
              >
                {brandPieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="card-note">Tự động phân loại theo tên sản phẩm (iPhone/Apple, Samsung, Xiaomi, ...).</div>
        </div>

        {/* Việc cần làm */}
        <div className="card span-2">
          <div className="tabs">
            <span className={`tag ${activeTab === "work" ? "blue" : ""}`} onClick={() => setActiveTab("work")}>CÔNG VIỆC</span>
            <span className={`tag ${activeTab === "warehouse" ? "blue" : ""}`} onClick={() => setActiveTab("warehouse")}>KHO</span>
            <span className={`tag ${activeTab === "website" ? "blue" : ""}`} onClick={() => setActiveTab("website")}>WEBSITE</span>
            <span className={`tag ${activeTab === "care" ? "blue" : ""}`} onClick={() => setActiveTab("care")}>CSKH</span>
          </div>
          <ul className="todo">
            {tabContent.map(item => (
              <li key={item.id}>
                {activeTab === "work" ? (
                  <>
                    <input
                      type="checkbox"
                      checked={!!todos.find(t => t.id === item.id)?.done}
                      onChange={() => toggleTodo(item.id)}
                    />
                    <span className={todos.find(t => t.id === item.id)?.done ? "done" : ""}>{item.text}</span>
                  </>
                ) : (
                  <span>{item.text}</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Top nhân viên */}
        <div className="card span-full orange">
          <div className="card-title white">Top nhân viên theo doanh thu</div>
          <table className="mini">
            <thead>
              <tr><th>Nhân viên</th><th>Doanh thu</th><th>Khu vực</th></tr>
            </thead>
            <tbody>
              {[
                { name: "Nguyễn Minh", revenue: "₫ 156,700,000", region: "Hà Nội" },
                { name: "Trần Hoài",  revenue: "₫ 123,450,000", region: "Đà Nẵng" },
                { name: "Phạm Long",  revenue: "₫ 98,320,000",  region: "TP.HCM" },
                { name: "Võ Quân",    revenue: "₫ 87,900,000",  region: "Cần Thơ" },
              ].map(row => (
                <tr
                  key={row.name}
                  className="clickable"
                  onClick={() => handleStaffRowClick(row.name)}
                  title="Xem chi tiết nhân viên"
                >
                  <td>{row.name}</td><td>{row.revenue}</td><td>{row.region}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="card-note">Dữ liệu minh hoạ — có thể nối API báo cáo thật.</div>
        </div>
      </div>
    </div>
  );
}
