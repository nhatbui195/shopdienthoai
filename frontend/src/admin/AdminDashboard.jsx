// src/admin/AdminDashboard.jsx
import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import AdminHome from "./AdminHome";
import UserManagement from "./UserManagement";
import ProductManagement from "./ProductManagement";
import OrderManagement from "./OrderManagement";
import RevenueReport from "./RevenueReport";
import InventoryReport from "./InventoryReport";
import CategoryManagement from "./CategoryManagement";

// ✅ 2 file mới
import ProductDetailCMS from "./ProductDetailCMS";
import ReviewManagement from "./ReviewManagement";

import "../styles/admin/AdminDashboard.css";

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className={`ad-layout ${sidebarOpen ? "" : "ad-collapsed"}`}>
      <aside className="ad-sidebar">
        <AdminSidebar collapsed={!sidebarOpen} />
      </aside>

      <section className="ad-main">
        <AdminHeader
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
        />

        <div className="ad-content">
          <Routes>
            {/* Tổng quan */}
            <Route index element={<AdminHome />} />

            {/* Quản trị */}
            <Route path="users" element={<UserManagement />} />
            <Route path="products" element={<ProductManagement />} />
            <Route path="orders" element={<OrderManagement />} />
            <Route path="categories" element={<CategoryManagement />} />
            {/* Báo cáo */}
            <Route path="reports/revenue" element={<RevenueReport />} />
            <Route path="reports/inventory" element={<InventoryReport />} />

            {/* ✅ Trang mới: quản trị nội dung mô tả/bài viết cho sản phẩm
                Mở theo dạng: /admin/content?id=22 */}
            <Route path="content" element={<ProductDetailCMS />} />

            {/* ✅ Trang mới: duyệt đánh giá & bình luận theo sản phẩm
                Mở theo dạng: /admin/reviews?id=22 */}
            <Route path="reviews" element={<ReviewManagement />} />
        

            {/* Khác / Fallback */}
            <Route
              path="suppliers"
              element={<div className="card">Danh sách Nhà cung cấp (TODO)</div>}
            />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </div>
      </section>
    </div>
  );
}
