import React from "react";
import "../styles/components/Footer.css";

export default function Footer() {
  return (
    // ft--red: token đỏ | ft--flush: tràn mép 2 bên
    <footer className="ft ft--red ft--flush" role="contentinfo">
      {/* TOP */}
      <div className="ft-top">
        {/* COL 1: Brand & contacts */}
        <div className="ft-col">
          <div className="ft-logo" aria-label="NHAT STORE">
            NHAT <span>STORE</span>
          </div>

          <p className="ft-desc">
            Hệ thống bán lẻ thiết bị di động &amp; phụ kiện chính hãng.
            Cam kết giá tốt, bảo hành minh bạch, giao nhanh toàn quốc.
          </p>

          <ul className="ft-contacts" aria-label="Thông tin liên hệ">
            <li>
              <span className="ft-ico" aria-hidden="true">
                <i className="bx bx-phone"></i>
              </span>
              <a className="ft-link" href="tel:1900633471">1900.633.471</a>
              <span className="ft-muted">&nbsp;(8:30 – 21:30)</span>
            </li>
            <li>
              <span className="ft-ico" aria-hidden="true">
                <i className="bx bx-envelope"></i>
              </span>
              <a className="ft-link" href="mailto:support@nhatstore.vn">
                support@nhatstore.vn
              </a>
            </li>
            <li>
              <span className="ft-ico" aria-hidden="true">
                <i className="bx bx-map"></i>
              </span>
              <span>123 Nguyễn Trãi, Thanh Xuân, Hà Nội</span>
            </li>
          </ul>

          <div className="ft-social" aria-label="Mạng xã hội">
            <a href="#" aria-label="Facebook">
              <i className="bx bxl-facebook"></i>
            </a>
            {/* Boxicons không có Zalo, dùng message-dots làm biểu tượng chung */}
            <a href="#" aria-label="Zalo">
              <i className="bx bx-message-dots"></i>
            </a>
            <a href="#" aria-label="Telegram">
              <i className="bx bxl-telegram"></i>
            </a>
          </div>
        </div>

        {/* COL 2: Chính sách */}
        <div className="ft-col">
          <h4>Chính sách</h4>
          <ul className="ft-list">
            <li><a href="#">Bảo hành</a></li>
            <li><a href="#">Đổi trả &amp; Hoàn tiền</a></li>
            <li><a href="#">Vận chuyển</a></li>
            <li><a href="#">Trả góp</a></li>
            <li><a href="#">Bảo mật thông tin</a></li>
            <li><a href="#">Điều khoản sử dụng</a></li>
          </ul>
        </div>

        {/* COL 3: Hỗ trợ */}
        <div className="ft-col">
          <h4>Hỗ trợ khách hàng</h4>
          <ul className="ft-list">
            <li><a href="#">Hướng dẫn mua hàng</a></li>
            <li><a href="#">Kiểm tra đơn hàng</a></li>
            <li><a href="#">Tra cứu bảo hành</a></li>
            <li><a href="#">Hệ thống cửa hàng</a></li>
            <li><a href="#">Liên hệ</a></li>
          </ul>
        </div>

        {/* COL 4: Newsletter + Payments */}
        <div className="ft-col">
          <h4>Đăng ký nhận tin</h4>
          <p className="ft-desc small">Ưu đãi sớm &amp; thông tin mở bán mỗi tuần.</p>

          <form className="ft-newsletter" onSubmit={(e)=>e.preventDefault()} aria-label="Đăng ký email">
            <input type="email" placeholder="Nhập email của bạn" aria-label="Email của bạn" />
            <button type="submit" aria-label="Đăng ký">
              <i className="bx bx-right-arrow-alt"></i>
            </button>
          </form>

          <div className="ft-payments" aria-label="Cổng thanh toán">
            <span className="pay">VISA</span>
            <span className="pay">MC</span>
            <span className="pay">JCB</span>
            <span className="pay">MoMo</span>
            <span className="pay">ZLP</span>
            <span className="pay">VNPAY</span>
          </div>

          <div className="ft-badges" aria-label="Ứng dụng">
            <a className="badge" href="#">
              <i className="bx bxl-apple"></i>&nbsp;App Store
            </a>
            <a className="badge" href="#">
              <i className="bx bxl-play-store"></i>&nbsp;Google Play
            </a>
          </div>
        </div>
      </div>

      {/* MID: chips */}
      <div className="ft-mid">
        <div className="ft-mid-grid">
          {["iPhone","iPad","MacBook","Tai nghe","Đồng hồ","Samsung","Xiaomi","Realme"].map(x => (
            <a key={x} className="chip" href={`/search?keyword=${encodeURIComponent(x)}`}>
              {x}
            </a>
          ))}
        </div>
      </div>

      {/* BOTTOM */}
      <div className="ft-bottom">
        <div className="ft-bottom-inner">
          <div className="ft-license">Giấy phép TMDT số 0123/GP-TTĐT</div>
          <div className="ft-copy">© 2025 NHAT STORE — All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}
