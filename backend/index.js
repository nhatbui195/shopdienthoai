// ── Phần đầu index.js (sạch, thay thế trực tiếp) ──────────────────────────────
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const cron = require('node-cron');


const app = express();
const PORT = 3001;

/* ===== CORS with credentials (DEV whitelist) ===== */
const whitelist = [
  'http://localhost:5173',
  'https://shopdienthoai-nhat.vercel.app',     // prod FE
];

const isAllowedOrigin = (origin) => {
  if (!origin) return true; // Postman/cURL/file://
  if (whitelist.includes(origin)) return true;

  // Cho phép các bản preview Vercel (subdomain bất kỳ của vercel.app)
  try {
    const url = new URL(origin);
    if (url.hostname.endsWith('.vercel.app')) return true;
  } catch (_) {}

  return false;
};

const corsOptions = {
  origin(origin, cb) {
    return isAllowedOrigin(origin) ? cb(null, true) : cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  // KHÔNG cần allowedHeaders -> cors tự phản chiếu từ preflight
};
app.use(cors(corsOptions));

// (tuỳ chọn) xử lý nhanh preflight để tránh middleware khác can thiệp:
app.options('*', cors(corsOptions));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ===== MySQL Connection ===== */
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',            // chỉnh nếu cần
  database: 'shopdienthoai'
});
const dbp = db.promise();


db.connect(err => {
  if (err) {
    console.error('❌ Không thể kết nối DB:', err);
    process.exit(1);
  }
  console.log('✅ Đã kết nối MySQL');
});

/* ===== Multer setup ===== */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads'),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
}); 
const upload = multer({ storage });

/* ================================
   AUTH - Đăng ký / Đăng nhập
================================ */

// Đăng ký
app.post('/api/register', (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Thiếu tên đăng nhập hoặc mật khẩu' });
  }

  // Chỉ chấp nhận vai trò 'KhachHang' hoặc 'NhanVien'
  const validRoles = ['KhachHang', 'NhanVien'];
  const userRole = validRoles.includes(role) ? role : 'KhachHang';

  db.query('SELECT * FROM taikhoan WHERE TenDangNhap = ?', [username], (err, results) => {
    if (err) return res.status(500).json({ message: 'Lỗi kiểm tra tài khoản' });
    if (results.length > 0) {
      return res.status(409).json({ message: 'Tên đăng nhập đã tồn tại' });
    }

    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) return res.status(500).json({ message: 'Lỗi mã hóa mật khẩu' });

      db.query(
        'INSERT INTO taikhoan (TenDangNhap, MatKhau, VaiTro) VALUES (?, ?, ?)',
        [username, hashedPassword, userRole],
        (err, result) => {
          if (err) return res.status(500).json({ message: 'Lỗi tạo tài khoản' });
          res.status(201).json({ message: 'Đăng ký thành công', id: result.insertId });
        }
      );
    });
  });
});

// Đăng nhập
// app.post('/api/login', ...) – bản chuẩn theo enum trong DB
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Thiếu tên đăng nhập hoặc mật khẩu' });
  }

  db.query(
    'SELECT MaTaiKhoan, TenDangNhap, MatKhau, VaiTro FROM taikhoan WHERE TenDangNhap = ? LIMIT 1',
    [username],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Lỗi truy vấn đăng nhập' });
      if (results.length === 0) {
        return res.status(401).json({ message: 'Tài khoản không tồn tại' });
      }

      const row = results[0];

      bcrypt.compare(password, row.MatKhau, (err2, ok) => {
        if (err2) return res.status(500).json({ message: 'Lỗi kiểm tra mật khẩu' });
        if (!ok)  return res.status(401).json({ message: 'Mật khẩu không đúng' });

        // Chuẩn hoá VaiTro từ enum
        const rawRole = String(row.VaiTro || 'KhachHang'); // 'KhachHang' | 'NhanVien'
        const role = rawRole
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, "")
          .toLowerCase(); // 'khachhang' | 'nhanvien'

        const isAdmin = (role === 'nhanvien');

        // Fake token để test; sau chuyển JWT sau
        const token = Math.random().toString(36).slice(2);

        return res.json({
          message: 'Đăng nhập thành công',
          token,
          user: {
            id: row.MaTaiKhoan,
            username: row.TenDangNhap,
            role,          // 'khachhang' | 'nhanvien'
            isAdmin        // true nếu 'nhanvien'
          }
        });
      });
    }
  );
});

/* ================================
   API Sản phẩm
================================ */

// GET all products


// GET chi tiết sản phẩm theo id
// Lấy danh sách sản phẩm (có thể kèm tìm kiếm)
// Lấy danh sách sản phẩm (Home) + thống kê rating/lượt mua
app.get('/api/products', (req, res) => {
  const keyword = (req.query.search || '').trim().toLowerCase();
  const params = [];
  let sql = `
    SELECT sp.MaSanPham, sp.TenSanPham, sp.HangSanXuat,
           sp.DonGia, sp.GiaCu, sp.GiaEdu, sp.GiaVip,
           sp.BaoHanh, sp.TraGop, sp.UuDai, sp.HinhAnh, sp.HinhAnhList,
           /* thống kê từ bảng phanhoi & chitietdonhang */
           COALESCE(r.DiemTB, 0)       AS SoSao,
           COALESCE(r.SoDanhGia, 0)    AS SoDanhGia,
           COALESCE(o.LuotMua, 0)      AS LuotMua
    FROM sanpham sp
    /* TB sao & số đánh giá */
    LEFT JOIN (
      SELECT MaSanPham, AVG(DanhGia) AS DiemTB, COUNT(*) AS SoDanhGia
      FROM phanhoi
      WHERE (AnHien IS NULL OR AnHien=1)
      GROUP BY MaSanPham
    ) r ON r.MaSanPham = sp.MaSanPham
    /* lượt mua theo chi tiết đơn đã xác nhận */
    LEFT JOIN (
      SELECT c.TenSanPham, SUM(c.SoLuong) AS LuotMua
      FROM chitietdonhang c
      JOIN donhang d ON d.MaDonHang=c.MaDonHang AND d.TrangThai='Đã xác nhận'
      GROUP BY c.TenSanPham
    ) o ON o.TenSanPham = sp.TenSanPham
  `;
  if (keyword) {
    sql += ' WHERE LOWER(sp.TenSanPham) LIKE ?';
    params.push(`%${keyword}%`);
  }
  sql += ' ORDER BY sp.NgayNhap DESC, sp.MaSanPham DESC';

  db.query(sql, params, (err, rows) => {
    if (err) {
      console.error('Lỗi truy vấn:', err);
      return res.status(500).json({ error: 'Lỗi truy vấn cơ sở dữ liệu' });
    }
    const data = rows.map(p => {
      let list = [];
      try { list = p.HinhAnhList ? JSON.parse(p.HinhAnhList) : []; } catch {}
      return { ...p, HinhAnhList: Array.isArray(list) ? list : [] };
    });
    res.json(data);
  });
});

// Lấy chi tiết 1 sản phẩm theo ID
// Lấy full chi tiết 1 sản phẩm cho trang ProductDetail
app.get('/api/products/:id', (req, res) => {
  const id = req.params.id;

  const qProd = 'SELECT * FROM sanpham WHERE MaSanPham = ? LIMIT 1';
  const qImgs = 'SELECT Url, ThuTu, IsCover FROM sanpham_anh WHERE MaSanPham=? ORDER BY IsCover DESC, ThuTu ASC, ID ASC';
  const qVars = 'SELECT ID AS MaBienThe, MauSac, DungLuong, Gia, TonKho, HinhAnh FROM sanpham_bienthe WHERE MaSanPham=? ORDER BY DungLuong, MauSac';
  const qAttr = 'SELECT ID, TenThuocTinh, GiaTri, ThuTu FROM sanpham_thuoctinh WHERE MaSanPham=? ORDER BY ThuTu, ID';
  const qPromo= 'SELECT ID, TieuDe, MoTa, ThuTu FROM sanpham_khuyenmai WHERE MaSanPham=? AND IsActive=1 ORDER BY ThuTu, ID';
  const qStat = `
    SELECT COALESCE(AVG(DanhGia),0) AS DiemTB, COUNT(*) AS SoDanhGia
    FROM phanhoi
    WHERE MaSanPham=? AND (AnHien=1 OR AnHien IS NULL)
  `;

  db.query(qProd, [id], (e1, r1) => {
    if (e1) return res.status(500).json({ message:'Lỗi lấy sản phẩm' });
    if (!r1 || r1.length === 0) return res.status(404).json({ message:'Không tìm thấy sản phẩm' });

    const prod = { ...r1[0] };
    try { prod.HinhAnhList = prod.HinhAnhList ? JSON.parse(prod.HinhAnhList) : []; } catch { prod.HinhAnhList = []; }

    db.query(qImgs, [id], (e2, images = []) => {
      db.query(qVars, [id], (e3, variants = []) => {
        db.query(qAttr, [id], (e4, attrs = []) => {
          db.query(qPromo, [id], (e5, promos = []) => {
            db.query(qStat, [id], (e6, statRows = [{ DiemTB:0, SoDanhGia:0 }]) => {
              const stat = statRows[0] || { DiemTB:0, SoDanhGia:0 };
              res.json({
                ...prod,
                AnhRoi: images,      // ảnh rời trong bảng sanpham_anh
                BienThe: variants,   // các phiên bản (màu/dung lượng)
                ThuocTinh: attrs,    // dòng “Thông số kỹ thuật”
                KhuyenMai: promos,   // khuyến mãi liệt kê
                ReviewStats: stat    // {DiemTB, SoDanhGia}
              });
            });
          });
        });
      });
    });
  });
});


// POST add product
app.post('/api/products', (req, res) => {
  const {
    TenSanPham, HangSanXuat, CauHinh, DonGia, SoLuongTon, NgayNhap,
    GiaCu, GiaEdu, GiaVip, BaoHanh, TraGop, UuDai, HinhAnhList
  } = req.body;

  db.query(
    `INSERT INTO sanpham 
    (TenSanPham, HangSanXuat, CauHinh, DonGia, SoLuongTon, NgayNhap,
    GiaCu, GiaEdu, GiaVip, BaoHanh, TraGop, UuDai, HinhAnhList)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      TenSanPham, HangSanXuat, CauHinh, DonGia, SoLuongTon, NgayNhap,
      GiaCu, GiaEdu, GiaVip, BaoHanh, TraGop, UuDai,
      JSON.stringify(HinhAnhList || [])
    ],
    (err, result) => {
      if (err) return res.status(500).json({ message: 'Lỗi thêm sản phẩm' });
      res.status(201).json({ message: 'Thêm sản phẩm thành công', id: result.insertId });
    }
  );
});

// PUT update product
app.put('/api/products/:id', (req, res) => {
  const id = req.params.id;
  const {
    TenSanPham, HangSanXuat, CauHinh, DonGia, SoLuongTon, NgayNhap,
    GiaCu, GiaEdu, GiaVip, BaoHanh, TraGop, UuDai, HinhAnhList
  } = req.body;

  db.query(
    `UPDATE sanpham SET
    TenSanPham=?, HangSanXuat=?, CauHinh=?, DonGia=?, SoLuongTon=?, NgayNhap=?,
GiaCu=?, GiaEdu=?, GiaVip=?, BaoHanh=?, TraGop=?, UuDai=?, HinhAnhList=?
    WHERE MaSanPham=?`,
    [
      TenSanPham, HangSanXuat, CauHinh, DonGia, SoLuongTon, NgayNhap,
      GiaCu, GiaEdu, GiaVip, BaoHanh, TraGop, UuDai,
      JSON.stringify(HinhAnhList || []), id
    ],
    (err) => {
      if (err) return res.status(500).json({ message: 'Lỗi cập nhật sản phẩm' });
      res.json({ message: 'Cập nhật sản phẩm thành công' });
    }
  );
});

// DELETE product
app.delete('/api/products/:id', (req, res) => {
  db.query('DELETE FROM sanpham WHERE MaSanPham = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: 'Lỗi xoá sản phẩm' });
    res.json({ message: 'Xoá sản phẩm thành công' });
  });
});
/* =========================================
 * PRODUCTS – Reviews: Lấy danh sách đánh giá của 1 sản phẩm
 * ========================================= */
app.get('/api/products/:id/reviews', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ message: 'ID sản phẩm không hợp lệ' });

  const sql = `
    SELECT MaPhanHoi, MaKhachHang, DanhGia, NoiDung, TieuDe, HinhAnhMinhHoa,
           TraLoiAdmin, NgayPhanHoi, (AnHien IS NULL OR AnHien=1) AS AnHien
    FROM phanhoi
    WHERE MaSanPham=?
    ORDER BY NgayPhanHoi DESC, MaPhanHoi DESC
  `;
  db.query(sql, [id], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Lỗi lấy đánh giá' });
    res.json(rows || []);
  });
});

/* =========================================
 * PRODUCTS – Reviews: Gửi đánh giá cho 1 sản phẩm
 * ========================================= */
app.post('/api/products/:id/reviews', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ message: 'ID sản phẩm không hợp lệ' });

  const {
    MaKhachHang = null,
    DanhGia = 5,
    NoiDung = '',
    TieuDe = null,
    HinhAnhMinhHoa = null
  } = req.body || {};

  const sql = `
    INSERT INTO phanhoi (MaKhachHang, MaSanPham, NoiDung, DanhGia, TieuDe, HinhAnhMinhHoa, AnHien, NgayPhanHoi)
    VALUES (?,?,?,?,?,?,1,NOW())
  `;
  db.query(sql, [MaKhachHang, id, NoiDung, DanhGia, TieuDe, HinhAnhMinhHoa], (err, r) => {
    if (err) return res.status(500).json({ message: 'Lỗi gửi đánh giá' });
    res.status(201).json({ message: 'Đã gửi đánh giá', MaPhanHoi: r.insertId });
  });
});

/* =========================================
 * ADMIN – Reviews: ẩn/hiện & trả lời bình luận
 * ========================================= */
app.put('/api/admin/reviews/:MaPhanHoi', (req, res) => {
  const MaPhanHoi = parseInt(req.params.MaPhanHoi, 10);
  if (!MaPhanHoi) return res.status(400).json({ message: 'ID không hợp lệ' });

  const { AnHien, TraLoiAdmin } = req.body || {};
  const sql = `
    UPDATE phanhoi
    SET AnHien = COALESCE(?, AnHien),
        TraLoiAdmin = ?,
        UpdatedAt = NOW()
    WHERE MaPhanHoi=?
  `;
  db.query(sql, [AnHien, TraLoiAdmin || null, MaPhanHoi], (err) => {
    if (err) return res.status(500).json({ message: 'Lỗi cập nhật đánh giá' });
    res.json({ message: 'Đã cập nhật đánh giá' });
  });
});


/* ================================
   API Chi tiết sản phẩm (thêm/cập nhật)
================================ */
/* ================================
   1) UPSERT chi tiết kỹ thuật
   POST /api/chitietsanpham
   Body: {
     MaSanPham, KichThuocManHinh, CPU, HeDieuHanh,
     BoNhoTrong, CameraChinh, HangSanXuat, TinhTrang
   }
================================ */
app.post('/api/chitietsanpham', (req, res) => {
  const {
    MaSanPham,
    KichThuocManHinh = null,
    CPU = null,
    HeDieuHanh = null,
    BoNhoTrong = null,
    CameraChinh = null,
    HangSanXuat = null,
    TinhTrang = null,
  } = req.body;

  if (!MaSanPham) {
    return res.status(400).json({ message: 'MaSanPham bắt buộc' });
  }

  const qCheck = 'SELECT MaChiTiet FROM chitietsanpham WHERE MaSanPham = ? LIMIT 1';
  db.query(qCheck, [MaSanPham], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Lỗi truy vấn', error: err });

    if (rows.length) {
      // UPDATE nếu đã có dòng specs cho sản phẩm này
      const qUpdate = `
        UPDATE chitietsanpham SET
          KichThuocManHinh = ?, CPU = ?, HeDieuHanh = ?, BoNhoTrong = ?,
          CameraChinh = ?, HangSanXuat = ?, TinhTrang = ?
        WHERE MaSanPham = ?
      `;
      const params = [
        KichThuocManHinh, CPU, HeDieuHanh, BoNhoTrong,
        CameraChinh, HangSanXuat, TinhTrang,
        MaSanPham,
      ];
      db.query(qUpdate, params, (e2) => {
        if (e2) return res.status(500).json({ message: 'Lỗi cập nhật chi tiết', error: e2 });
        res.json({ message: 'Cập nhật chi tiết sản phẩm thành công' });
      });
    } else {
      // INSERT nếu chưa có
      const qInsert = `
        INSERT INTO chitietsanpham
          (MaSanPham, KichThuocManHinh, CPU, HeDieuHanh, BoNhoTrong, CameraChinh, HangSanXuat, TinhTrang)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [
        MaSanPham, KichThuocManHinh, CPU, HeDieuHanh, BoNhoTrong,
        CameraChinh, HangSanXuat, TinhTrang,
      ];
      db.query(qInsert, params, (e3) => {
        if (e3) return res.status(500).json({ message: 'Lỗi thêm chi tiết', error: e3 });
        res.json({ message: 'Thêm chi tiết sản phẩm thành công' });
      });
    }
  });
});

// API lấy chi tiết kỹ thuật sản phẩm
/* ==========================================
   2) GET chi tiết kỹ thuật theo MaSanPham
   GET /api/chitietsanpham/:id
========================================== */
app.get('/api/chitietsanpham/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ message: 'Thiếu/ID không hợp lệ' });

  const q = 'SELECT * FROM chitietsanpham WHERE MaSanPham = ? LIMIT 1';
  db.query(q, [id], (err, rows) => {
    if (err) {
      console.error('SQL chitietsanpham error:', err);
      return res.status(500).json({ message: 'Lỗi lấy chi tiết sản phẩm' });
    }
    if (!rows?.length) {
      console.warn('No detail for MaSanPham =', id);
      return res.status(404).json({ message: 'Chưa có chi tiết cho sản phẩm này' });
    }
    return res.json(rows[0]);
  });
});

// GET /api/products/:id/variants   (id = MaSanPham)
app.get('/api/products/:id/variants', (req, res) => {
  const id = req.params.id;
  const sql = `
    SELECT v.MaCTThem, v.MauSac, v.PhienBan
    FROM chitietthem v
    JOIN chitietsanpham c ON c.MaChiTiet = v.MaChiTiet
    WHERE c.MaSanPham = ?
    ORDER BY v.PhienBan, v.MauSac
  `;
  db.query(sql, [id], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Lỗi lấy biến thể' });
    res.json(rows);
  });
});
// POST /api/products/:id/variants/replace
// body: [{ MauSac, PhienBan }, ...]
app.post('/api/products/:id/variants/replace', (req, res) => {
  const id = req.params.id;
  const variants = Array.isArray(req.body) ? req.body : [];

  const qFind = 'SELECT MaChiTiet FROM chitietsanpham WHERE MaSanPham=? LIMIT 1';
  db.query(qFind, [id], (e1, rows) => {
    if (e1) return res.status(500).json({ message: 'Lỗi lấy MaChiTiet' });
    if (!rows.length) return res.status(404).json({ message: 'Chưa có chitietsanpham cho sản phẩm này' });

    const MaChiTiet = rows[0].MaChiTiet;

    db.query('DELETE FROM chitietthem WHERE MaChiTiet=?', [MaChiTiet], (e2) => {
      if (e2) return res.status(500).json({ message: 'Lỗi xoá biến thể cũ' });
      if (!variants.length) return res.json({ message: 'Đã xoá hết biến thể' });

      const values = variants.map(v => [MaChiTiet, String(v.MauSac||'').trim(), String(v.PhienBan||'').trim()]);
      const ins = 'INSERT INTO chitietthem (MaChiTiet, MauSac, PhienBan) VALUES ?';
      db.query(ins, [values], (e3) => {
        if (e3) return res.status(500).json({ message: 'Lỗi chèn biến thể mới' });
        res.json({ message: 'Đồng bộ biến thể thành công', count: variants.length });
      });
    });
  });
});

/* ================================
   UPLOAD FILE
================================ */
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Không có file tải lên' });
  res.json({ path: `/uploads/${req.file.filename}` });
});

app.get('/api/users', (req, res) => {
  db.query('SELECT MaTaiKhoan, TenDangNhap, VaiTro FROM taikhoan', (err, results) => {
    if (err) return res.status(500).json({ message: 'Lỗi lấy danh sách tài khoản' });
    res.json(results);
  });
});
// DELETE người dùng (chỉ dùng cho Admin)
app.delete('/api/users/:id', (req, res) => {
  const userId = req.params.id;

  db.query('DELETE FROM taikhoan WHERE MaTaiKhoan = ?', [userId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Lỗi xoá tài khoản' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng để xoá' });
    }

    res.json({ message: 'Xoá người dùng thành công' });
  });
});
app.post('/api/donhang', (req, res) => {
  const {
    MaKhachHang,
    MauSac,
    TongTien,
    HoTen,
    SDT,
    Email,
    HinhThucNhanHang,
    TinhThanh,
    DiaChi,
    GhiChu,
    TenSanPham,
    PhienBan,
    SoLuong,
    DonGia
  } = req.body;

  // Kiểm tra dữ liệu đầu vào
  if (
    !MaKhachHang || !HoTen || !SDT || !TongTien ||
    !TenSanPham || !PhienBan || !SoLuong || !DonGia
  ) {
    return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
  }

  const sqlDonHang = `
    INSERT INTO donhang (
      MaKhachHang, NgayDatHang, MauSac, TongTien,
      HoTen, SDT, Email, HinhThucNhanHang,
      TinhThanh, DiaChi, GhiChu, YeuCauHuy
    )
    VALUES (?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
  `;

  db.query(
    sqlDonHang,
    [
      MaKhachHang,
      MauSac,
      TongTien,
      HoTen,
      SDT,
      Email,
      HinhThucNhanHang,
      TinhThanh,
      DiaChi,
      GhiChu
    ],
    (err, result) => {
      if (err) {
        console.error('❌ Lỗi khi thêm đơn hàng:', err);
        return res.status(500).json({
          message: 'Thêm đơn hàng thất bại',
          error: err.message
        });
      }

      const MaDonHang = result.insertId;

      const sqlChiTiet = `
        INSERT INTO chitietdonhang (
          MaDonHang, TenSanPham, PhienBan, SoLuong, DonGia
        )
        VALUES (?, ?, ?, ?, ?)
      `;

      db.query(
        sqlChiTiet,
        [MaDonHang, TenSanPham, PhienBan, SoLuong, DonGia],
        (err2) => {
          if (err2) {
            console.error('❌ Lỗi thêm chi tiết đơn hàng:', err2);
            return res.status(500).json({
              message: 'Thêm chi tiết đơn hàng thất bại',
              error: err2.message
            });
          }

          res.status(200).json({ message: 'Đặt hàng thành công!', MaDonHang });
        }
      );
    }
  );
});

/* ================================
 * USER – Lấy danh sách đơn theo khách hàng
 * ================================ */
/* =========================================
 * USER – Đơn hàng theo khách hàng
 * ========================================= */
app.get('/api/donhang/:MaKhachHang', (req, res) => {
  const MaKhachHang = parseInt(req.params.MaKhachHang, 10);
  if (!MaKhachHang) return res.status(400).json({ message: 'MaKhachHang không hợp lệ' });

  const sql = `
    SELECT
      d.MaDonHang, d.NgayDatHang, d.TongTien, d.HinhThucNhanHang, d.MauSac,
      d.HoTen, d.SDT, d.Email, d.TinhThanh, d.DiaChi, d.GhiChu,
      d.YeuCauHuy, d.TrangThai,

      d.PaymentStatus, d.PaymentMethod, d.ThoiGianTT,
      COALESCE(d.ShippingStatus, s.Status) AS ShippingStatus,
      s.DeliveredAt AS ThoiGianGiao,
      d.UpdatedAt,

      c.TenSanPham, c.SoLuong, c.PhienBan, c.DonGia,
      (c.SoLuong * c.DonGia) AS ThanhTien
    FROM donhang d
    LEFT JOIN shipping s       ON s.MaDonHang = d.MaDonHang
    LEFT JOIN chitietdonhang c ON c.MaDonHang = d.MaDonHang
    WHERE d.MaKhachHang = ?
    ORDER BY d.NgayDatHang DESC, d.MaDonHang DESC
  `;

  db.query(sql, [MaKhachHang], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Lỗi server', error: err.message });

    const map = {};
    for (const r of rows || []) {
      if (!map[r.MaDonHang]) {
        map[r.MaDonHang] = {
          MaDonHang: r.MaDonHang,
          NgayDatHang: r.NgayDatHang,
          TongTien: r.TongTien,
          HinhThucNhanHang: r.HinhThucNhanHang,
          MauSac: r.MauSac,
          HoTen: r.HoTen, SDT: r.SDT, Email: r.Email,
          TinhThanh: r.TinhThanh, DiaChi: r.DiaChi, GhiChu: r.GhiChu,
          YeuCauHuy: r.YeuCauHuy === 1,
          TrangThai: r.TrangThai,

          PaymentStatus: r.PaymentStatus,
          PaymentMethod: r.PaymentMethod,
          ThoiGianTT: r.ThoiGianTT,
          ShippingStatus: r.ShippingStatus,
          ThoiGianGiao: r.ThoiGianGiao,
          UpdatedAt: r.UpdatedAt,

          SanPham: []
        };
      }
      if (r.TenSanPham) {
        map[r.MaDonHang].SanPham.push({
          TenSanPham: r.TenSanPham,
          PhienBan: r.PhienBan,
          SoLuong: r.SoLuong,
          DonGia: r.DonGia,
          ThanhTien: r.ThanhTien
        });
      }
    }
    res.json(Object.values(map));
  });
});

/* Nhẹ để poll 1 đơn (MyOrders auto-refresh) */
app.get('/api/orders/:id/mini', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ message: 'ID không hợp lệ' });

  const sql = `
    SELECT
      d.MaDonHang, d.TrangThai,
      d.PaymentStatus, d.PaymentMethod,
      COALESCE(d.ShippingStatus, s.Status) AS ShippingStatus,
      d.YeuCauHuy, d.UpdatedAt
    FROM donhang d
    LEFT JOIN shipping s ON s.MaDonHang = d.MaDonHang
    WHERE d.MaDonHang=?
    LIMIT 1
  `;
  db.query(sql, [id], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    if (!rows?.length) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    res.json(rows[0]);
  });
});

/* =========================================
 * USER – Gửi yêu cầu hủy
 * ========================================= */
app.put('/api/donhang/huy/:MaDonHang', (req, res) => {
  const MaDonHang = parseInt(req.params.MaDonHang, 10);
  if (!MaDonHang) return res.status(400).json({ message: 'MaDonHang không hợp lệ' });

  const sql = `
    UPDATE donhang
    SET YeuCauHuy = 1, UpdatedAt = NOW()
    WHERE MaDonHang = ?
  `;
  db.query(sql, [MaDonHang], (err) => {
    if (err) return res.status(500).json({ message: 'Lỗi server', error: err.message });
    res.json({ message: 'Yêu cầu hủy đã được gửi. Chờ admin xác nhận.' });
  });
});

/* =========================================
 * ADMIN – Danh sách đơn (kèm ShippingStatus)
 * ========================================= */
app.get('/api/admin/donhang', (req, res) => {
  const sql = `
    SELECT 
      d.*,
      COALESCE(s.Status, d.ShippingStatus) AS ShippingStatus
    FROM donhang d
    LEFT JOIN shipping s ON s.MaDonHang = d.MaDonHang
    ORDER BY d.NgayDatHang DESC, d.MaDonHang DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: 'Lỗi lấy đơn hàng' });
    res.json(results || []);
  });
});

/* =========================================
 * ADMIN – 5 đơn hàng gần nhất (Recent Orders)
 * ========================================= */
app.get('/api/admin/orders/recent', (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit || '5', 10), 1), 20);
  const sql = `
    SELECT d.MaDonHang, d.NgayDatHang, d.TrangThai,
           tk.TenDangNhap AS TenKhachHang
    FROM donhang d
    JOIN taikhoan tk ON tk.MaTaiKhoan = d.MaKhachHang
    ORDER BY d.NgayDatHang DESC, d.MaDonHang DESC
    LIMIT ?
  `;
  db.query(sql, [limit], (err, rows) => {
    if (err) {
      console.error('GET /api/admin/orders/recent error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json(rows || []);
  });
});
/* =========================================
 * ADMIN – Thống kê: Doanh thu theo tháng (12 tháng gần nhất)
 * ========================================= */
app.get('/api/admin/thongke/doanhthu', (req, res) => {
  const sql = `
    SELECT 
      DATE_FORMAT(d.NgayDatHang, '%Y-%m') AS Thang,
      SUM(c.SoLuong * c.DonGia) AS DoanhThu
    FROM donhang d
    JOIN chitietdonhang c ON d.MaDonHang = c.MaDonHang
    WHERE d.TrangThai = 'Đã xác nhận'
    GROUP BY Thang
    ORDER BY Thang DESC
    LIMIT 12
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ message: 'Lỗi truy vấn', error: err.message });
    res.json(rows || []);
  });
});

/* =========================================
 * ADMIN – Thống kê: Số lượng tài khoản theo vai trò
 * ========================================= */
app.get('/api/admin/thongke/taikhoan', (req, res) => {
  const sql = `
    SELECT VaiTro, COUNT(*) AS SoLuong
    FROM taikhoan
    GROUP BY VaiTro
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ message: 'Lỗi truy vấn', error: err.message });
    res.json(rows || []);
  });
});

/* =========================================
 * ADMIN – Thống kê: Top bán hàng (theo TenSanPham)
 * ========================================= */
app.get('/api/admin/thongke/banhang', (req, res) => {
  const sql = `
    SELECT 
      c.TenSanPham,
      SUM(c.SoLuong) AS TongDaBan,
      SUM(c.SoLuong * c.DonGia) AS DoanhThu
    FROM chitietdonhang c
    JOIN donhang d ON c.MaDonHang = d.MaDonHang
    WHERE d.TrangThai = 'Đã xác nhận'
    GROUP BY c.TenSanPham
    ORDER BY TongDaBan DESC
    LIMIT 10
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ message: 'Lỗi truy vấn', error: err.message });
    res.json(rows || []);
  });
});

/* =========================================
 * ADMIN – Thống kê: Số đơn đang "Chờ xác nhận"
 * ========================================= */
app.get('/api/admin/thongke/doncho', (req, res) => {
  const sql = `
    SELECT COUNT(*) AS DonHangChoXacNhan
    FROM donhang
    WHERE TrangThai = 'Chờ xác nhận'
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ message: 'Lỗi truy vấn', error: err.message });
    res.json(rows?.[0] || { DonHangChoXacNhan: 0 });
  });
});


/* Danh sách đơn có yêu cầu hủy */
app.get('/api/admin/yeucauhuy', (req, res) => {
  const sql = `
    SELECT d.MaDonHang
    FROM donhang d
    WHERE d.YeuCauHuy = 1
    ORDER BY d.NgayDatHang DESC
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    res.json(rows || []);
  });
});

/* Xác nhận hủy / Từ chối hủy */
app.put('/api/admin/xacnhan-huy/:MaDonHang', (req, res) => {
  const id = parseInt(req.params.MaDonHang, 10);
  const sql = `UPDATE donhang SET TrangThai='Đã hủy', YeuCauHuy=0, UpdatedAt=NOW() WHERE MaDonHang=? AND YeuCauHuy=1`;
  db.query(sql, [id], (err) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    res.json({ message: '✅ Đơn hàng đã được hủy.' });
  });
});
app.put('/api/admin/tuchoi-huy/:MaDonHang', (req, res) => {
  const id = parseInt(req.params.MaDonHang, 10);
  const sql = `UPDATE donhang SET YeuCauHuy=0, UpdatedAt=NOW() WHERE MaDonHang=? AND YeuCauHuy=1`;
  db.query(sql, [id], (err) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    res.json({ message: '⛔ Yêu cầu hủy đã bị từ chối.' });
  });
});

/* Xác nhận đơn */
app.put('/api/admin/xacnhan-don/:MaDonHang', (req, res) => {
  const id = parseInt(req.params.MaDonHang, 10);
  const sql = `UPDATE donhang SET TrangThai='Đã xác nhận', UpdatedAt=NOW() WHERE MaDonHang=? AND TrangThai='Chờ xác nhận'`;
  db.query(sql, [id], (err) => {
    if (err) return res.status(500).json({ message: 'Lỗi xác nhận đơn' });
    res.json({ message: '✅ Đã xác nhận đơn hàng.' });
  });
});

/* Cập nhật trạng thái text bất kỳ (không đụng Payment/Shipping) */
app.put('/api/admin/capnhat-trangthai/:MaDonHang', (req, res) => {
  const id = parseInt(req.params.MaDonHang, 10);
  const { TrangThai } = req.body || {};
  if (!TrangThai) return res.status(400).json({ message: 'Thiếu TrangThai' });
  db.query('UPDATE donhang SET TrangThai=?, UpdatedAt=NOW() WHERE MaDonHang=?', [TrangThai, id], (err) => {
    if (err) return res.status(500).json({ message: 'Lỗi cập nhật' });
    res.json({ message: `✅ Đã cập nhật trạng thái đơn hàng ${id}.` });
  });
});

/* Xoá đơn */
app.delete('/api/admin/xoadonhang/:MaDonHang', (req, res) => {
  const id = parseInt(req.params.MaDonHang, 10);
  db.query('DELETE FROM donhang WHERE MaDonHang=?', [id], (err) => {
    if (err) return res.status(500).json({ message: 'Lỗi xoá' });
    res.json({ message: `🗑️ Đơn hàng ${id} đã được xóa.` });
  });
});

/* =========================================
 * PAYMENTS – ghi nhận & duyệt
 * ========================================= */
app.post('/api/payments', (req, res) => {
  const { MaDonHang, SoTien, NoiDungCK, MaGiaoDich, Method, AnhBienLai } = req.body || {};
  const orderId = Number(MaDonHang);
  const amount  = Number(SoTien);
  if (!orderId || !amount) return res.status(400).json({ message: 'Thiếu MaDonHang hoặc SoTien' });

  db.query('SELECT MaDonHang FROM donhang WHERE MaDonHang=? LIMIT 1', [orderId], (e1, rows) => {
    if (e1) return res.status(500).json({ message: 'Lỗi kiểm tra đơn hàng' });
    if (!rows?.length) return res.status(404).json({ message: 'Đơn hàng không tồn tại' });

    const ins = `
      INSERT INTO payments (MaDonHang, SoTien, NoiDungCK, MaGiaoDich, AnhBienLai, TrangThai, CreatedAt)
      VALUES (?, ?, ?, ?, ?, 'submitted', NOW())
    `;
    db.query(ins, [orderId, amount, NoiDungCK || null, MaGiaoDich || null, AnhBienLai || null], (e2, r2) => {
      if (e2) return res.status(500).json({ message: 'Lỗi ghi nhận thanh toán' });

      const method = (Method === 'cod') ? 'cod' : 'bank';
      const upd = `
        UPDATE donhang
        SET PaymentMethod=?, SoTienTT=?, NoiDungTT=?, MaGiaoDich=?, AnhBienLai=?, UpdatedAt=NOW()
        WHERE MaDonHang=?
      `;
      db.query(upd, [method, amount, NoiDungCK || null, MaGiaoDich || null, AnhBienLai || null, orderId], () =>
        res.status(201).json({ message: 'Đã ghi nhận thanh toán, chờ admin duyệt.', paymentId: r2.insertId })
      );
    });
  });
});
/* DUYỆT THEO MaDonHang – cập nhật cả shipping pending */
app.put('/api/admin/donhang/approve-payment/:MaDonHang', (req, res) => {
  const id = parseInt(req.params.MaDonHang, 10);
  if (!id) return res.status(400).json({ message: 'ID không hợp lệ' });

  const sqlPaid = `
    UPDATE donhang
    SET PaymentStatus='paid',
        PaymentMethod=COALESCE(PaymentMethod,'bank'),
        TrangThai=IFNULL(TrangThai,'Đã xác nhận'),
        ThoiGianTT=NOW(),
        UpdatedAt=NOW()
    WHERE MaDonHang=?
  `;
  db.query(sqlPaid, [id], (err, r1) => {
    if (err) return res.status(500).json({ message: 'Lỗi duyệt thanh toán (donhang)' });
    if (r1.affectedRows === 0) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

    const approveLatestPayment = `
      UPDATE payments
      SET TrangThai='approved', ApprovedAt=NOW()
      WHERE MaDonHang=? AND TrangThai IN ('submitted','pending','awaiting')
      ORDER BY CreatedAt DESC LIMIT 1
    `;
    db.query(approveLatestPayment, [id], () => {
      const upsertShipping = `
        INSERT INTO shipping (MaDonHang, Status, UpdatedAt)
        VALUES (?, 'pending', NOW())
        ON DUPLICATE KEY UPDATE Status='pending', UpdatedAt=NOW()
      `;
      db.query(upsertShipping, [id], () => {
        db.query('UPDATE donhang SET ShippingStatus="pending", UpdatedAt=NOW() WHERE MaDonHang=?', [id], () =>
          res.json({ message: 'Đã duyệt thanh toán', MaDonHang: id })
        );
      });
    });
  });
});

/* Đánh dấu hoàn tiền */
app.put('/api/admin/donhang/refund-payment/:MaDonHang', (req, res) => {
  const id = parseInt(req.params.MaDonHang, 10);
  if (!id) return res.status(400).json({ message: 'ID không hợp lệ' });
  const sql = `UPDATE donhang SET PaymentStatus='refunded', UpdatedAt=NOW() WHERE MaDonHang=?`;
  db.query(sql, [id], (err) => {
    if (err) return res.status(500).json({ message: 'Lỗi hoàn tiền' });
    res.json({ message: 'Đã đánh dấu hoàn tiền', MaDonHang: id });
  });
});

/* =========================================
 * SHIPPING – cập nhật shipping + mirror
 * ========================================= */
function setShipping(orderId, status, extraSetSql = '') {
  return new Promise((resolve, reject) => {
    const sql = `UPDATE shipping SET Status=?, UpdatedAt=NOW() ${extraSetSql} WHERE MaDonHang=?`;
    db.query(sql, [status, orderId], (err, r) => {
      const done = () => db.query('UPDATE donhang SET ShippingStatus=?, UpdatedAt=NOW() WHERE MaDonHang=?',
        [status, orderId], (e2) => e2 ? reject(e2) : resolve());
      if (err) return reject(err);
      if (r.affectedRows === 0) {
        db.query('INSERT INTO shipping (MaDonHang, Status, UpdatedAt) VALUES (?, ?, NOW())',
          [orderId, status], (e1) => e1 ? reject(e1) : done());
      } else done();
    });
  });
}

app.put('/api/admin/donhang/mark-picking/:MaDonHang', async (req, res) => {
  const id = parseInt(req.params.MaDonHang, 10);
  if (!id) return res.status(400).json({ message: 'ID không hợp lệ' });
  try { await setShipping(id, 'picking', ', PickedAt=NOW()'); res.json({ message: 'Đã chuyển "Đang lấy hàng"', MaDonHang: id }); }
  catch { res.status(500).json({ message: 'Không thể chuyển "Đang lấy hàng"' }); }
});
app.put('/api/admin/donhang/mark-shipping/:MaDonHang', async (req, res) => {
  const id = parseInt(req.params.MaDonHang, 10);
  if (!id) return res.status(400).json({ message: 'ID không hợp lệ' });
  try { await setShipping(id, 'shipping', ', ShippedAt=NOW()'); res.json({ message: 'Đã chuyển "Đang giao"', MaDonHang: id }); }
  catch { res.status(500).json({ message: 'Không thể chuyển "Đang giao"' }); }
});
app.put('/api/admin/donhang/mark-delivered/:MaDonHang', async (req, res) => {
  const id = parseInt(req.params.MaDonHang, 10);
  if (!id) return res.status(400).json({ message: 'ID không hợp lệ' });
  try { await setShipping(id, 'delivered', ', DeliveredAt=NOW()'); res.json({ message: 'Đã chuyển "Đã giao"', MaDonHang: id }); }
  catch { res.status(500).json({ message: 'Không thể chuyển "Đã giao"' }); }
});
app.put('/api/admin/donhang/cancel-shipping/:MaDonHang', async (req, res) => {
  const id = parseInt(req.params.MaDonHang, 10);
  if (!id) return res.status(400).json({ message: 'ID không hợp lệ' });
  try { await setShipping(id, 'canceled', ', CanceledAt=NOW()'); res.json({ message: 'Đã hủy vận chuyển', MaDonHang: id }); }
  catch { res.status(500).json({ message: 'Không thể hủy vận chuyển' }); }
});

app.get('/api/stores', (req, res) => {
  res.json([
    { id: 1, name: 'NHAT STORE Hà Nội', address: 'Q. Hoàn Kiếm, Hà Nội', phone: '1900633471' },
    { id: 2, name: 'NHAT STORE HCM', address: 'Q.1, TP.HCM', phone: '1900633471' },
  ]);
});
/* =========================================
 * CRON – Tự động xác nhận đơn sau 12 giờ
 * Chạy mỗi giờ: đơn "Chờ xác nhận" đủ 12h và chưa yêu cầu hủy → "Đã xác nhận"
 * ========================================= */
cron.schedule('0 * * * *', () => { // Chạy đầu mỗi giờ
  const sql = `
    UPDATE donhang
    SET TrangThai = 'Đã xác nhận', UpdatedAt = NOW()
    WHERE TrangThai = 'Chờ xác nhận'
      AND TIMESTAMPDIFF(HOUR, NgayDatHang, NOW()) >= 12
      AND COALESCE(YeuCauHuy, 0) = 0
  `;
  db.query(sql, (err, result) => {
    if (err) {
      console.error('❌ Lỗi CRON auto-confirm:', err);
    } else if (result?.affectedRows > 0) {
      console.log(`✅ CRON: tự xác nhận ${result.affectedRows} đơn hàng.`);
    }
  });
});
/* =========================================
 * SEARCH – Gợi ý sản phẩm theo keyword (sửa ORDER BY)
 * ========================================= */
app.get('/api/suggestions', (req, res) => {
  const keyword = (req.query.keyword || '').trim().toLowerCase();

  const sql = `
    SELECT MaSanPham AS IDSanPham, TenSanPham, HinhAnhList
    FROM sanpham
    WHERE LOWER(TenSanPham) LIKE ?
    ORDER BY MaSanPham DESC
    LIMIT 10
  `;

  db.query(sql, [`%${keyword}%`], (err, results = []) => {
    if (err) {
      console.error('❌ Lỗi truy vấn gợi ý:', err);
      return res.status(500).json({ error: 'Lỗi truy vấn gợi ý sản phẩm.' });
    }

    const formatted = results.map(product => {
      let firstImage = '/default-image.png';

      // Ưu tiên JSON array, fallback CSV
      try {
        const list = product.HinhAnhList ? JSON.parse(product.HinhAnhList) : [];
        if (Array.isArray(list) && list.length > 0) firstImage = list[0];
      } catch {
        const list = String(product.HinhAnhList || '')
          .split(',').map(s => s.trim()).filter(Boolean);
        if (list.length > 0) firstImage = list[0];
      }

     const origin = `${req.protocol}://${req.headers.host}`; // ex: https://shop-be.vercel.app
   const formattedUrl = firstImage.startsWith('http')
   ? firstImage
   : `${origin}${firstImage}`;
      return {
        IDSanPham: product.IDSanPham,
        TenSanPham: product.TenSanPham,
        AnhDaiDien: formattedUrl,
      };
    });

    res.json(formatted);
  });
});
/* =========================================
 * ADMIN – Duyệt thanh toán theo paymentId
 * ========================================= */
app.put('/api/admin/payments/:id/approve', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ message: 'Thiếu ID payment' });

  // 1) Lấy payment
  db.query('SELECT * FROM payments WHERE ID=? LIMIT 1', [id], (e1, rows) => {
    if (e1) return res.status(500).json({ message: 'Lỗi lấy payment' });
    if (!rows?.length) return res.status(404).json({ message: 'Payment không tồn tại' });

    const p = rows[0];

    // 2) Duyệt payment
    db.query(
      'UPDATE payments SET TrangThai="approved", ApprovedAt=NOW() WHERE ID=?',
      [id],
      (e2) => {
        if (e2) return res.status(500).json({ message: 'Lỗi duyệt payment' });

        // 3) Cập nhật đơn
        db.query(
          `UPDATE donhang 
           SET PaymentStatus='paid', PaymentMethod='bank',
               SoTienTT=?, NoiDungTT=?, MaGiaoDich=?, ThoiGianTT=NOW(), UpdatedAt=NOW()
           WHERE MaDonHang=?`,
          [p.SoTien, p.NoiDungCK, p.MaGiaoDich, p.MaDonHang],
          (e3) => {
            if (e3) return res.status(500).json({ message: 'Lỗi cập nhật đơn sau khi duyệt' });

            // 4) Upsert shipping pending + mirror
            const upsertShipping = `
              INSERT INTO shipping (MaDonHang, Status, UpdatedAt)
              VALUES (?, 'pending', NOW())
              ON DUPLICATE KEY UPDATE Status='pending', UpdatedAt=NOW()
            `;
            db.query(upsertShipping, [p.MaDonHang], (e4) => {
              if (e4) console.warn('⚠️ upsert shipping lỗi nhẹ:', e4?.message);
              db.query('UPDATE donhang SET ShippingStatus="pending", UpdatedAt=NOW() WHERE MaDonHang=?',
                [p.MaDonHang],
                () => res.json({ message: 'Đã duyệt thanh toán & cập nhật đơn hàng.', MaDonHang: p.MaDonHang })
              );
            });
          }
        );
      }
    );
  });
});

/* =========================================
 * PAYMENTS – xem danh sách theo orderId
 * ========================================= */


app.get('/api/payments/:orderId', (req, res) => {
  const orderId = Number(req.params.orderId);
  if (!orderId) return res.status(400).json({ message: 'Thiếu orderId' });
  db.query('SELECT * FROM payments WHERE MaDonHang=? ORDER BY CreatedAt DESC', [orderId], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Lỗi lấy danh sách thanh toán' });
    res.json(rows || []);
  });
});
// ===== Product CMS (infos/topics/faqs) =====
app.get('/api/products/:id/extended', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ message: 'ID sản phẩm không hợp lệ' });

  db.query('SELECT CMSJson FROM sanpham WHERE MaSanPham=? LIMIT 1', [id], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Lỗi truy vấn CMS' });
    if (!rows || rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

    let cms = { infos: [], topics: [], faqs: [] };
    try {
      if (rows[0].CMSJson) {
        const parsed = JSON.parse(rows[0].CMSJson);
        if (Array.isArray(parsed?.infos))  cms.infos  = parsed.infos;
        if (Array.isArray(parsed?.topics)) cms.topics = parsed.topics;
        if (Array.isArray(parsed?.faqs))   cms.faqs   = parsed.faqs;
      }
    } catch {}
    res.json(cms);
  });
});

app.put('/api/products/:id/extended', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ message: 'ID sản phẩm không hợp lệ' });

  const { infos = [], topics = [], faqs = [] } = req.body || {};
  const safe = {
    infos:  (Array.isArray(infos)  ? infos  : []).map(x => ({ heading: String(x?.heading ?? ''), body: String(x?.body ?? '') })),
    topics: (Array.isArray(topics) ? topics : []).map(x => ({ title: String(x?.title ?? '') })),
    faqs:   (Array.isArray(faqs)   ? faqs   : []).map(x => ({ q: String(x?.q ?? ''), a: String(x?.a ?? '') })),
  };

  db.query('UPDATE sanpham SET CMSJson=? WHERE MaSanPham=?', [JSON.stringify(safe), id], (err, r) => {
    if (err) return res.status(500).json({ message: 'Lỗi lưu CMS' });
    if (r.affectedRows === 0) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    res.json({ message: 'Đã lưu nội dung mở rộng' });
  });
});




module.exports = app;

// Backend (index.js)