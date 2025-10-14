import React from "react";
import { Link } from "react-router-dom";
import "../styles/pages/WarrantyPolicy.css";

export default function WarrantyPolicy() {
  return (
    <div className="wp-wrap">
      <div className="page-hero">
        <div className="container">
          <nav className="breadcrumb-bar" aria-label="breadcrumbs">
            <span className="ico" aria-hidden>
              {/* icon menu */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
              </svg>
            </span>
            <Link to="/" className="bc-link">
              <span className="ico" aria-hidden>
                {/* icon home */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3l9 8h-3v9h-12v-9h-3l9-8z" />
                </svg>
              </span>
              Trang chủ
            </Link>
            <span className="bc-sep">/</span>
            <span className="bc-dim">Nhật Store</span>
            <span className="bc-sep">/</span>
            <strong className="bc-current">Chính sách bảo hành</strong>
          </nav>
        </div>
      </div>

      {/* ==== NỘI DUNG TRANG ==== */}
      <section className="wp-section">
        <h2>Nội dung chính</h2>
        <ol className="wp-toc">
          <li>I - BẢO HÀNH IPHONE CHÍNH HÃNG VNA</li>
          <li>II - BẢO HÀNH IPHONE, IPAD, MACBOOK, AIRPODS, WATCH CŨ</li>
          <li>III - BẢO HÀNH ANDROID MỚI (SAMSUNG, XIAOMI, TECNO, REALME, VIVO, OPPO... CHÍNH HÃNG)</li>
          <li>IV - BẢO HÀNH ANDROID CŨ (SAMSUNG, XIAOMI, TECNO, REALME, VIVO, OPPO... CŨ)</li>
          <li>V - BẢO HÀNH NONPHONE (MACBOOK, AIRPODS, WATCH,....)</li>
          <li>VI - TRƯỜNG HỢP TỪ CHỐI BẢO HÀNH</li>
        </ol>
      </section>

      <section className="wp-section">
        <p>
          Nhật Store rất tiếc và xin lỗi vì sự bất tiện của Quý khách khi sản phẩm không may phát sinh lỗi phải bảo hành.
          Hi vọng chi tiết chính sách đổi trả – bảo hành tại Nhật Store cũng như thông tin liên hệ các bộ phận hỗ trợ dưới
          đây có thể giúp Quý khách yên tâm hơn trong quá trình sử dụng sản phẩm.
        </p>
        <p><strong>Hotline khiếu nại về sản phẩm dịch vụ:</strong> 1900.633.471</p>
        <p><strong>Hotline tiếp nhận bảo hành:</strong> 0246.683.9292</p>
      </section>

      {/* Bảng quy định đổi/nhập lại */}
      <section className="wp-section">
        <div className="wp-table">
          <div className="wp-tr wp-tr--head">
            <div>Loại sản phẩm</div>
            <div>Quy định đổi máy</div>
            <div>Quy định nhập lại, trả lại</div>
          </div>

          <div className="wp-tr">
            <div>Điện thoại iPhone chính hãng VNA</div>
            <div>30 ngày đổi miễn phí nếu máy lỗi phần cứng từ nhà sản xuất</div>
            <div>
              - Trong 30 ngày đầu nhập lại máy, trừ phí 20% trên giá hiện tại (hoặc giá mua nếu giá mua thấp hơn giá hiện tại)
              <br />- Sau 30 ngày nhập lại máy theo giá thoả thuận
            </div>
          </div>

          <div className="wp-tr">
            <div>iPad/ Macbook/ Apple watch/ Airpods</div>
            <div>12 tháng đổi miễn phí nếu máy lỗi phần cứng từ nhà sản xuất</div>
            <div>
              - Trong 30 ngày đầu nhập lại máy, trừ phí 20% trên giá hiện tại (hoặc giá mua nếu giá mua thấp hơn giá hiện tại)
              <br />- Sau 30 ngày nhập lại máy theo giá thoả thuận
            </div>
          </div>

          <div className="wp-tr">
            <div>Điện thoại, máy tính bảng Androi: Samsung, xiaomi, tecno....</div>
            <div>12 tháng đổi miễn phí nếu máy lỗi phần cứng từ nhà sản xuất</div>
            <div>
              - Trong 30 ngày đầu nhập lại máy, trừ phí 20% trên giá hiện tại (hoặc giá mua nếu giá mua thấp hơn giá hiện tại)
              <br />- Sau 30 ngày nhập lại máy theo giá thoả thuận
            </div>
          </div>

          <div className="wp-tr">
            <div>Samsung Watch, Galaxy Buds</div>
            <div>30 ngày đổi miễn phí nếu máy lỗi phần cứng từ nhà sản xuất</div>
            <div>
              - Trong 30 ngày đầu nhập lại máy, trừ phí 30% trên giá hiện tại (hoặc giá mua nếu giá mua thấp hơn giá hiện tại)
              <br />- Sau 30 ngày nhập lại máy theo giá thoả thuận
            </div>
          </div>

          <div className="wp-tr">
            <div>Laptop</div>
            <div>30 ngày đổi miễn phí nếu máy lỗi phần cứng từ nhà sản xuất</div>
            <div>
              - Trong 30 ngày đầu nhập lại máy, trừ phí 20% trên giá hiện tại (hoặc giá mua nếu giá mua thấp hơn giá hiện tại)
              <br />- Sau 30 ngày: Nhập lại theo thoả thuận
            </div>
          </div>

          <div className="wp-tr">
            <div>Máy cũ</div>
            <div>
              - Có gói BHV: Thời gian đổi máy miễn phí nếu máy có lỗi từ nhà sản xuất: Máy Apple cũ 12 tháng, máy Androi cũ 30 ngày.
              <br />- Không có BHV: 15 ngày đổi miễn phí nếu máy lỗi phần cứng từ nhà sản xuất
            </div>
            <div>
              Trong 30 ngày trả lại máy:
              <br />- Có BHV: Trừ phí 10% trên giá hiện tại (hoặc giá mua nếu giá mua thấp hơn giá hiện tại)
              <br />- Không có BHV: Trừ 15% trên giá bán hiện tại (hoặc giá mua nếu giá mua thấp hơn giá hiện tại)
              <br />
              Trong 30 ngày nếu khách muốn đổi lên đời máy.
              <br />- Có bảo hành vàng: Trừ 10% giá hiện tại (hoặc giá mua nếu giá mua thấp hơn giá hiện tại).
              <br />- Không có bảo hành vàng: Trừ 15% giá hiện tại (hoặc giá mua nếu giá mua thấp hơn giá hiện tại).
              <br />- Sau 30 ngày nhập lại máy theo giá thoả thuận
            </div>
          </div>

          <div className="wp-tr">
            <div>Gói bảo hành vàng</div>
            <div>
              Trong 30 ngày khách muốn lên đời máy khác.
              <br />- Trừ 20% để khách chuyển qua gói bảo hành vàng cho máy lên đời.
              <br />- Trừ 50% nếu máy lên đời không mua BHV
              <br />- Khách bán lại máy, không lên đời. Nhập lại gói BHV trừ phí 50%
            </div>
            <div>
              Sau 30 ngày:
              <br />- Nếu khách lên đời máy khác. Trừ phí 15% cho mỗi tháng sử dụng để chuyển qua gói BHV cho máy lên đời.
              <br />- Nếu khách bán lại máy: Không nhập lại gói BHV
            </div>
          </div>
        </div>
      </section>

      {/* I - VNA */}
      <section className="wp-section">
        <h2>I - BẢO HÀNH IPHONE CHÍNH HÃNG VNA</h2>

        <h3>1. Bảo hành tiêu chuẩn</h3>
        <p><strong>APPLE VNA</strong></p>
        <ul className="wp-list">
          <li>Thời gian bao test sản phẩm: 30 ngày đầu.</li>
          <li>
            Điều kiện:
            <ul>
              <li>
                - Nếu lỗi xác định chính xác (vd: Lỗi cảm ứng….) và máy không rơi vỡ vào nước,
                có xác nhận của Trung tâm bảo hành Ủy quyền Apple. Đổi máy mới nguyên seal khác.
              </li>
              <li>
                - Nếu lỗi chập chờn, thi thoảng (thi thoảng mất loa, chập chờn sóng,…) cần có video quay lại lỗi và có xác nhận
                của Trung tâm bảo hành Ủy quyền Apple, không rơi vỡ, vào nước: Đổi máy mới  nguyên seal khác.
              </li>
              <li>- Hỗ trợ rơi vỡ vào nước: 3 tháng</li>
            </ul>
          </li>
          <li>Thời gian bảo hành: 12 Tháng</li>
          <li>Hình thức bảo hành: Tại Trung tâm bảo hành ủy quyền Apple</li>
          <li>
            Nhật Store khuyến khích các bạn nếu lỗi mang qua TTBH của Nhật Store để được kiểm tra và tư vấn trước về bảo hành. Hoặc
            gọi trước số Hotline: <strong>0966062468</strong> để được tư vấn vì trong thời gian bảo hành tại hãng, có thể lâu dự
            kiến từ 1-45 ngày. Nhật Store có thể cho Quý khách mượn tạm chiếc máy để dùng trong thời gian chờ đợi bảo hành.
          </li>
          <li>
            -Nếu trong quá trình sử dụng sản phẩm, trường hợp máy của khách không may bị rơi vỡ, vào nước và Trung tâm bảo hành
            ủy quyền Apple từ chối bảo hành, Nhật Store sẽ hỗ trợ khách hàng theo chính sách sau:
          </li>
        </ul>

        <h4>HỖ TRỢ RƠI VỠ, VÀO NƯỚC</h4>
        <ul className="wp-list">
          <li>- Điều kiện: Sản phẩm còn thời gian bảo hành tại hãng</li>
          <li>- Chi tiết gói Hỗ trợ rơi vỡ, vào nước:</li>
        </ul>

        <div className="wp-table">
          <div className="wp-tr wp-tr--head"><div>LỖI</div><div>NHẬT STORE HỖ TRỢ</div></div>
          <div className="wp-tr">
            <div>Các lỗi hãng từ chối bảo hành (làm rơi móp, tỳ đè, cong máy, vào nước…)</div>
            <div>-</div>
          </div>
          <div className="wp-tr">
            <div>Vỡ kính màn, Kính lưng</div>
            <div>Ép kính miễn phí, tiếp tục bảo hành kính và các linh kiện khác đến hết thời hạn 3 tháng tính từ lúc mua.</div>
          </div>
          <div className="wp-tr">
            <div>Màn hình</div>
            <div>Hỗ trợ 30% phí thay màn, tiếp tục bảo hành màn và các linh kiện khác đến hết thời hạn 3 tháng tính từ lúc mua.</div>
          </div>
          <div className="wp-tr">
            <div>Mất Face, chết nguồn, các lỗi khác</div>
            <div>Bảo hành sửa chữa miễn phí,  sữa xong tiếp tục bảo hành cho đến khi hết thời thời hạn 3 tháng tính từ lúc mua.</div>
          </div>
          <div className="wp-tr">
            <div>Không sửa được</div>
            <div>Hỗ trợ hoàn 20% giá máy cũ hiện tại</div>
          </div>
        </div>

        <h3>2. Bảo hành vàng - bảo hành 1 đổi 24 tháng iPhone chính hãng VNA</h3>
        <p><strong>NỘI DUNG BẢO HÀNH — BẢO HÀNH 1 ĐỔI 1 24 THÁNG - ICAREPRO24_APPLECTY</strong></p>

        <div className="wp-table">
          <div className="wp-tr wp-tr--head"><div>Nội dung</div><div>Từ 0-12 tháng</div><div>Từ tháng 13 đến 24 tháng</div></div>
          <div className="wp-tr">
            <div>Nơi bảo hành</div>
            <div>Nhật Store, Apple</div>
            <div>TTBH Nhật Store</div>
          </div>
          <div className="wp-tr">
            <div>
              Linh kiện phần cứng: Nguồn, màn hình, Main, Face ID, Loa míc, camera…
              <br />/ iPhone 16 Pro/ 16 Pro Max
            </div>
            <div>
              Đổi máy mới nguyên seal
              <br />/ Bao test 30 ngày, bảo hành tại trung tâm bảo hành chính hãng
            </div>
            <div>Bảo hành 1 đổi 1 máy cũ tương đương</div>
          </div>
          <div className="wp-tr">
            <div>Pin ( dung lượng pin &lt; 80%, pin báo ảo)*</div>
            <div>Sữa chữa thay thế</div>
            <div>Sữa chữa thay thế</div>
          </div>
          <div className="wp-tr">
            <div>Hỗ trợ Bảo hành rơi vỡ, vào nước 24 tháng</div>
            <div>Có hỗ trợ</div>
            <div>Có hỗ trợ</div>
          </div>
        </div>

        <p>
          Trường hợp máy của khách không may bị rơi vỡ, vào nước và TTBH chính hãng từ chối bảo hành Nhật Store sẽ hỗ trợ khách hàng
          theo chính sách sau:
        </p>

        <div className="wp-table">
          <div className="wp-tr wp-tr--head"><div>Hỗ trợ Bảo hành rơi vỡ, vào nước</div><div>CHÍNH SÁCH HỖ TRỢ</div></div>
          <div className="wp-tr">
            <div>Vỡ kính màn, Kính lưng</div>
            <div>Ép kính miễn phí, tiếp tục bảo hành kính và các linh kiện khác đến hết thời gian bảo hành máy (2 năm).</div>
          </div>
          <div className="wp-tr">
            <div>Màn hình</div>
            <div>Hỗ trợ 30% phí thay màn, tiếp tục bảo hành màn và các linh kiện khác đến hết thời gian bảo hành máy (2 năm).</div>
          </div>
          <div className="wp-tr">
            <div>Mất Face, chết nguồn, các lỗi khác</div>
            <div>Bảo hành sửa chữa miễn phí, sữa xong tiếp tục bảo hành cho đến khi hết thời hạn bảo hành máy (2 năm).</div>
          </div>
          <div className="wp-tr">
            <div>Không sửa được</div>
            <div>Hỗ trợ hoàn 20% giá máy cũ hiện tại</div>
          </div>
        </div>

        <h4>LƯU Ý:</h4>
        <ul className="wp-list">
          <li>
            <strong>Trong 12 tháng đầu:</strong> Máy lỗi sẽ được đổi sang máy mới nguyên seal nếu đáp ứng các điều kiện sau:
          </li>
          <li>
            Nếu lỗi xác định chính xác (vd: Lỗi cảm ứng….) và máy không rơi vỡ vào nước, có xác nhận của Trung tâm bảo hành Ủy
            quyền Apple. Đổi máy mới nguyên seal khác.
          </li>
          <li>
            Nếu lỗi chập chờn, thi thoảng (thi thoảng mất loa, chập chờn sóng,…) cần có video quay lại lỗi và có xác nhận của
            Trung tâm bảo hành Ủy quyền Apple, không rơi vỡ, vào nước: Đổi máy mới  nguyên seal khác.
          </li>
          <li>iPhone 16 Pro/ Pro Max sẽ được đổi sản phẩm mới nếu lỗi sau 30 ngày đầu, sau thời gian này sẽ bảo hành tại TTBH chính hãng.</li>
          <li>
            Các máy bị rơi móp, rơi vỡ, cấn xước, vào nước nếu lỗi sẽ không được đổi mới. Chỉ được hỗ trợ theo chính sách ở mục
            hỗ trợ rơi vỡ vào nước.
          </li>
          <li>
            Trong trường hợp sản phẩm được đổi phát sinh lỗi tiếp (thuộc phạm vi bảo hành), Nhật Store vẫn sẽ bảo hành cho sản phẩm
            theo chế độ 1 đổi 1 trong thời gian bảo hành còn lại.
          </li>
          <li>Chỉ áp dụng máy đổi máy, tất cả các phụ kiện kèm theo như: tai nghe, cáp, sạc... không đổi kèm.</li>
          <li>
            <strong>Từ tháng thứ 13:</strong> Máy lỗi sẽ được đổi sang máy cũ khác bản quốc tế tương đương với máy khách hàng đang dùng gặp lỗi.
          </li>
          <li>Máy lỗi trong trường hợp bị cấn móp sẽ được sửa chữa thay thế, không được đổi máy.</li>
          <li>Nếu máy được đổi có lỗi tiếp, máy vẫn sẽ được bảo hành 1 đổi 1 trong thời gian bảo hành còn lại.</li>
          <li>
            Lỗi pin sẽ không đổi máy mới, chỉ thay pin. Pin sẽ được thay mới khi pin dưới 80% hoặc pin báo ảo. Pin thay là pin do
            đơn vị thứ 3 cung cấp, đã được kiểm soát chất lượng và được bảo hành tại Nhật Store.
          </li>
          <li>
            Trường hợp Nhật Store có sản phẩm để đổi cho Khách hàng nhưng Khách hàng muốn đổi sang sản phẩm khác thì phải chịu phí
            10% giá trị sản phẩm khi nhập lại:
            <br />Giá nhập lại sản phẩm = Giá bán hiện tại sản phẩm x 90%
            <br />(Nếu giá bán sản phẩm hiện tại thấp hơn giá thời điểm mua thì lấy giá tại thời điểm hiện tại x 90%, Nếu giá bán
            sản phẩm hiện tại cao hơn giá thời điểm mua thì lấy giá tại thời điểm mua x90%)
          </li>
          <li>
            Với các trường hợp không có sản phẩm để đổi ngay hoặc vòng đời sản phẩm không còn, Nhật Store cam kết thời gian xử lý
            đổi sản phẩm tối đa 07 ngày làm việc (trừ 7 + CN). Sau thời gian này, nếu không có sản phẩm đổi cho khách hàng,
            Nhật Store sẽ nhập lại máy để khách chuyển qua mua sản phẩm khác hoặc hoàn tiền:
            <br />Giá nhập lại = Giá máy tại thời điểm mua x (100% – 3% x số tháng sử dụng)
          </li>
          <li>
            * Trường hợp máy bị sọc màn, chảy mực: Cần xác nhận từ Trung tâm bảo hành ủy quyền chính hãng. Nếu xác định lỗi NSX
            sẽ được đổi máy mới; nếu do người dùng sẽ hỗ trợ 30% chi phí thay màn.
          </li>
        </ul>
      </section>

      {/* II - iPhone/iPad/Macbook/AirPods/Watch cũ */}
      <section className="wp-section">
        <h2>II - BẢO HÀNH IPHONE, IPAD, MACBOOK, AIRPODS, WATCH CŨ</h2>

        <h3>1. Bảo hành tiêu chuẩn</h3>
        <div className="wp-table">
          <div className="wp-tr wp-tr--head"><div>Hạng mục</div><div>Chính sách</div></div>
          <div className="wp-tr"><div>Thời gian bảo hành</div><div>6 tháng</div></div>
          <div className="wp-tr"><div>Mất Nguồn, màn hình, vân tay, Face ID</div><div>Không bảo hành</div></div>
          <div className="wp-tr"><div>Linh kiện phần cứng khác</div><div>Bảo hành sửa chữa</div></div>
          <div className="wp-tr"><div>Pin(*) (Dưới 80% hoặc báo ảo)</div><div>Bảo hành 6 tháng</div></div>
          <div className="wp-tr"><div>Trầy móp, nứt vỡ, vào nước, hóa chất</div><div>Không bảo hành</div></div>
          <div className="wp-tr"><div>Thời gian bao test đổi mới</div><div>15 ngày</div></div>
          <div className="wp-tr"><div>Thời gian xử lý bảo hành</div><div>15 ngày</div></div>
        </div>

        <ul className="wp-list">
          <li>- Máy được tiếp nhận bảo hành nếu lỗi xác định/hoặc có video lỗi chập chờn; máy không rơi vỡ, cấn móp, vào nước.</li>
          <li>- Gói tiêu chuẩn không bảo hành các lỗi màn hình, cảm ứng, vân tay, Face ID.</li>
          <li>- Lỗi pin không đổi máy mới; chỉ thay pin (pin &lt; 80% hoặc báo ảo). Pin do bên thứ 3 cung cấp và bảo hành tại Nhật Store.</li>
          <li>
            - Được bảo hành nhưng muốn đổi sản phẩm khác: phí 10% khi nhập lại.
            <br />Giá nhập lại = Giá bán hiện tại x 90%
          </li>
          <li>
            - Không sửa được lỗi: thời gian xử lý tối đa 07 ngày làm việc. Quá hạn sẽ nhập lại/hoàn tiền:
            <br />Giá nhập lại = Giá máy tại thời điểm mua x (100% – 3% x số tháng sử dụng)
          </li>
        </ul>

        <h3>2. Bảo hành 1 đổi 1 12 tháng</h3>
        <div className="wp-table">
          <div className="wp-tr wp-tr--head"><div>Mục</div><div>12 tháng đầu</div><div>Tháng 13 – Tháng 24</div></div>
          <div className="wp-tr">
            <div>2. Mất Nguồn, màn hình, cảm ứng, vân tay, Face ID</div>
            <div>1 Đổi 1</div>
            <div>
              Tháng 13–24: nếu lỗi MÀN HÌNH và máy không rơi vỡ/vào nước → hỗ trợ 20% phí thay màn (các lỗi khác không bảo hành).
              <br />
              Riêng iPhone 13 Pro/13 Pro Max: hỗ trợ 100% phí thay màn.
            </div>
          </div>
          <div className="wp-tr"><div>3. Linh kiện phần cứng: Main, ổ cứng, camera, wifi...</div><div>1 Đổi 1</div><div>-</div></div>
          <div className="wp-tr"><div>4. Pin (*)</div><div>Bảo hành sửa chữa, không đổi</div><div>-</div></div>
          <div className="wp-tr"><div>5. Phím bấm vật lý</div><div>Bảo hành sửa chữa, không đổi</div><div>-</div></div>
          <div className="wp-tr"><div>6. Cấn, móp</div><div>Không đổi – Hỗ trợ rơi vỡ</div><div>-</div></div>
          <div className="wp-tr"><div>7. Đặc quyền Reset bảo hành iPhone cũ</div><div>Có</div><div>-</div></div>
          <div className="wp-tr"><div>8. Hỗ trợ rơi vỡ, vào nước</div><div>12 Tháng</div><div>-</div></div>
        </div>

        <h4>Điều kiện 1 đổi 1</h4>
        <ul className="wp-list">
          <li>Hình thức giống với phiếu Bảo Hành (đối chiếu video lúc mua).</li>
          <li>Không rơi vỡ, vào nước (kỹ thuật viên kiểm tra trước mặt khách hàng).</li>
          <li>Sản phẩm còn tem bảo hành Nhật Store bên trong máy.</li>
        </ul>

        <h4>Nội dung gói 1 đổi 1 12 tháng</h4>
        <ul className="wp-list">
          <li>Máy đổi là máy tương đương dòng máy lỗi.</li>
          <li>Máy lỗi do cấn móp: nếu có iCare Pro sẽ sửa chữa thay thế, không đổi; nếu không có iCare Pro: từ chối bảo hành.</li>
          <li>Pin: chỉ thay mới khi &lt; 80% hoặc báo ảo; pin bên thứ 3; bảo hành tại Nhật Store.</li>
          <li>Chỉ áp dụng máy đổi máy; phụ kiện kèm theo không đổi.</li>
          <li>
            Quá thời hạn xử lý vẫn chưa có máy đổi: 
            <br />– Đổi sản phẩm tương đương hoặc hoàn tiền theo: Giá máy cũ hiện tại × 90%.
            <br />– Nếu khách muốn đổi lên dòng khác/hoàn tiền: nhập lại = Giá máy cũ hiện tại × 90%.
          </li>
          <li>
            <strong>Đặc quyền reset bảo hành trọn đời:</strong>
            <ul>
              <li>Trong thời gian còn bảo hành, nếu máy lỗi → tính lại bảo hành 12 tháng từ đầu.</li>
              <li>Trong 12 tháng kể từ ngày mua đầu: áp dụng 1 đổi 1; sau 12 tháng: sửa chữa miễn phí (không đổi).</li>
              <li>Pin chỉ bảo hành 12 tháng kể từ ngày mua ban đầu.</li>
            </ul>
          </li>
        </ul>

        <h4>Hỗ trợ rơi vỡ vào nước 12 tháng</h4>
        <p>Trong 12 tháng đầu, nếu máy rơi vỡ/vào nước, Nhật Store hỗ trợ như sau:</p>

        <div className="wp-table">
          <div className="wp-tr wp-tr--head"><div>LỖI</div><div>NHẬT STORE HỖ TRỢ</div></div>
          <div className="wp-tr"><div>Vỡ kính màn, kính lưng</div><div>Ép kính miễn phí; tiếp tục bảo hành đến hết hạn.</div></div>
          <div className="wp-tr"><div>Màn hình</div><div>Hỗ trợ 30% phí thay màn; tiếp tục bảo hành đến hết hạn.</div></div>
          <div className="wp-tr"><div>Mất Face, chết nguồn, lỗi khác</div><div>Sửa chữa miễn phí; tiếp tục bảo hành đến hết hạn.</div></div>
        </div>

        <p>
          Sau khi sửa các trường hợp rơi vỡ/vào nước, máy vẫn được bảo hành miễn phí tới hết hạn.
          Nếu không sửa được: hỗ trợ 20% giá máy cũ tại thời điểm lỗi.
        </p>
      </section>

      {/* III - Android mới */}
      <section className="wp-section">
        <h2>III - BẢO HÀNH ANDROID MỚI (SAMSUNG, XIAOMI, TECNO, REALME, VIVO, OPPO... CHÍNH HÃNG)</h2>

        <h3>1. Bảo hành tiêu chuẩn 1 đổi 1 12 tháng</h3>
        <div className="wp-table">
          <div className="wp-tr wp-tr--head"><div>Mục</div><div>Chính sách</div></div>
          <div className="wp-tr"><div>Thời gian bảo hành</div><div>12 tháng</div></div>
          <div className="wp-tr"><div>Linh kiện phần cứng</div><div>Đổi máy mới chưa qua sử dụng (đổi nhiều lần nếu tiếp tục lỗi)</div></div>
          <div className="wp-tr"><div>Màn hình sọc/chảy mực do lỗi NSX</div><div>Đổi máy mới chưa qua sử dụng</div></div>
          <div className="wp-tr"><div>Màn hình sọc/chảy mực do người dùng (rơi vỡ, tỳ đè)</div><div>Không bảo hành</div></div>
          <div className="wp-tr"><div>Pin (&lt;80% hoặc báo ảo)</div><div>Sửa chữa thay thế</div></div>
          <div className="wp-tr"><div>Hỗ trợ rơi vỡ, vào nước 12 tháng</div><div>Không hỗ trợ</div></div>
        </div>

        <p><strong>Quy định đổi máy lỗi (12 tháng đầu):</strong></p>
        <ul className="wp-list">
          <li>Máy không rơi vỡ, cấn móp, vào nước; lỗi xác định rõ.</li>
          <li>Lỗi chập chờn cần có video.</li>
          <li>Các máy rơi móp, xước, vào nước sẽ không bảo hành.</li>
          <li>Phát sinh lỗi tiếp trong thời gian BH: vẫn áp dụng 1 đổi 1 cho phần thời gian còn lại.</li>
          <li>Chỉ đổi thân máy; phụ kiện không đổi kèm.</li>
          <li>Lỗi pin chỉ thay pin (pin bên thứ 3, bảo hành tại Nhật Store).</li>
          <li>
            Muốn đổi sang sản phẩm khác: nhập lại = Giá bán hiện tại × 90%.
          </li>
          <li>
            Không có sản phẩm đổi ngay/đã hết vòng đời: tối đa 07 ngày làm việc, sau đó nhập lại:
            <br />Giá nhập lại = Giá máy tại thời điểm mua × (100% – 3% × số tháng sử dụng)
          </li>
          <li>* Trường hợp sọc/chảy mực: cần xác nhận TTBH ủy quyền; nếu lỗi NSX → đổi mới; nếu do người dùng → không bảo hành (hoặc hỗ trợ 30% thay màn nếu có gói gia hạn 24 tháng).</li>
        </ul>
      </section>

      {/* IV - Android cũ */}
      <section className="wp-section">
        <h2>IV - BẢO HÀNH ANDROID CŨ (SAMSUNG, XIAOMI, TECNO, REALME, VIVO, OPPO... CŨ)</h2>

        <h3>1. Bảo hành tiêu chuẩn</h3>
        <div className="wp-table">
          <div className="wp-tr wp-tr--head"><div>Mục</div><div>Chính sách</div></div>
          <div className="wp-tr"><div>Thời gian bảo hành</div><div>6 tháng</div></div>
          <div className="wp-tr"><div>Mất nguồn, màn hình, vân tay, Face ID</div><div>Không bảo hành</div></div>
          <div className="wp-tr"><div>Linh kiện phần cứng khác</div><div>Bảo hành sửa chữa</div></div>
          <div className="wp-tr"><div>Pin(*)</div><div>Bảo hành 6 tháng</div></div>
          <div className="wp-tr"><div>Trầy móp, nứt vỡ, vào nước, hóa chất</div><div>Không bảo hành</div></div>
          <div className="wp-tr"><div>Thời gian bao test đổi mới</div><div>15 ngày</div></div>
          <div className="wp-tr"><div>Thời gian xử lý bảo hành</div><div>15 ngày</div></div>
        </div>

        <ul className="wp-list">
          <li>- Nhận bảo hành khi lỗi xác định/hoặc video lỗi chập chờn; máy không rơi vỡ, cấn móp, vào nước.</li>
          <li>- Gói tiêu chuẩn không bảo hành màn hình/cảm ứng/vân tay/Face ID.</li>
          <li>- Pin chỉ thay khi &lt;80% hoặc báo ảo (pin bên thứ 3, bảo hành tại Nhật Store).</li>
          <li>- Muốn đổi sản phẩm khác: nhập lại = Giá bán hiện tại × 90%.</li>
          <li>- Không sửa được: tối đa 07 ngày làm việc; quá hạn nhập lại/hoàn tiền = Giá mua × (100% – 3% × số tháng sử dụng).</li>
        </ul>
      </section>

      {/* V - Nonphone */}
      <section className="wp-section">
        <h2>V - BẢO HÀNH NONPHONE (MACBOOK, AIRPODS, WATCH,...)</h2>

        <h3>1. Bảo hành tiêu chuẩn mặc định 1 đổi 1</h3>
        <div className="wp-table">
          <div className="wp-tr wp-tr--head"><div>Mục</div><div>Chính sách</div></div>
          <div className="wp-tr"><div>Thời gian bảo hành</div><div>12 tháng</div></div>
          <div className="wp-tr"><div>Linh kiện phần cứng</div><div>Đổi máy mới chưa qua sử dụng (đổi nhiều lần nếu lỗi tiếp)</div></div>
          <div className="wp-tr"><div>Màn hình sọc/chảy mực do lỗi NSX</div><div>Đổi máy mới chưa qua sử dụng</div></div>
          <div className="wp-tr"><div>Màn hình sọc/chảy mực do người dùng</div><div>Không bảo hành</div></div>
          <div className="wp-tr"><div>Pin (&lt;80% hoặc báo ảo)</div><div>Sửa chữa thay thế</div></div>
          <div className="wp-tr"><div>Hỗ trợ rơi vỡ, vào nước 12 tháng</div><div>Không hỗ trợ</div></div>
        </div>

        <p><strong>Quy định đổi máy lỗi (12 tháng đầu):</strong></p>
        <ul className="wp-list">
          <li>Không rơi vỡ/cấn móp/vào nước; lỗi xác định rõ hoặc có video.</li>
          <li>Phát sinh lỗi tiếp: vẫn áp dụng 1 đổi 1 cho phần thời gian còn lại.</li>
          <li>Chỉ đổi thân máy; phụ kiện không đổi.</li>
          <li>Pin chỉ thay (bên thứ 3, bảo hành tại Nhật Store).</li>
          <li>Muốn đổi sang sản phẩm khác: nhập lại = Giá bán hiện tại × 90%.</li>
          <li>Không có sản phẩm đổi ngay/đã hết vòng đời: tối đa 07 ngày làm việc; quá hạn nhập lại = Giá mua × (100% – 3% × số tháng sử dụng).</li>
          <li>* Sọc/chảy mực: cần xác nhận TTBH ủy quyền; nếu NSX → đổi mới; nếu người dùng → không bảo hành (hoặc hỗ trợ 30% thay màn nếu có gói gia hạn 24 tháng).</li>
        </ul>

        <h3>2. Bảo hành vàng gia hạn 24 tháng (nonphone)</h3>
        <p><strong>NỘI DUNG GIA HẠN 24 THÁNG</strong></p>
        <div className="wp-table">
          <div className="wp-tr wp-tr--head"><div>Nội dung</div><div>Từ 0–12 tháng</div><div>Tháng 13–24</div></div>
          <div className="wp-tr"><div>Linh kiện phần cứng</div><div>Đổi máy mới chưa qua sử dụng</div><div>Sửa chữa thay thế linh kiện</div></div>
          <div className="wp-tr"><div>Màn hình lỗi NSX</div><div>Đổi máy mới chưa qua sử dụng</div><div>Sửa chữa thay thế linh kiện</div></div>
          <div className="wp-tr"><div>Màn hình lỗi do người dùng (tỳ đè/rơi vỡ)</div><div>Hỗ trợ 30% phí thay màn</div><div>Không bảo hành</div></div>
          <div className="wp-tr"><div>Pin (&lt;80% hoặc báo ảo)</div><div>Sửa chữa thay thế</div><div>Sửa chữa thay thế</div></div>
          <div className="wp-tr"><div>Hỗ trợ rơi vỡ/vào nước 12 tháng</div><div>Có</div><div>Không</div></div>
        </div>

        <p><strong>Hỗ trợ rơi vỡ/vào nước (khi hãng từ chối):</strong></p>
        <div className="wp-table">
          <div className="wp-tr wp-tr--head"><div>Hỗ trợ</div><div>Chính sách</div></div>
          <div className="wp-tr"><div>Vỡ kính màn, kính lưng</div><div>Ép kính miễn phí; tiếp tục bảo hành đến hết 1 năm.</div></div>
          <div className="wp-tr"><div>Màn hình</div><div>Hỗ trợ 30% phí thay màn; tiếp tục bảo hành đến hết 1 năm.</div></div>
          <div className="wp-tr"><div>Mất Face/nguồn/lỗi khác</div><div>Sửa chữa miễn phí; tiếp tục bảo hành đến hết 1 năm.</div></div>
          <div className="wp-tr"><div>Không sửa được</div><div>Hỗ trợ hoàn 20% giá máy cũ hiện tại</div></div>
        </div>

        <h4>Các lưu ý</h4>
        <ul className="wp-list">
          <li>Điều kiện đổi máy 12 tháng đầu: không rơi vỡ/cấn móp/vào nước; lỗi xác định rõ/hoặc video; phụ kiện không đổi.</li>
          <li>Từ tháng 13: bảo hành sửa chữa tại Nhật Store (Xiaomi 13–18 tháng bảo hành hãng; 18–24 tháng tại Nhật Store).</li>
          <li>Pin: chỉ thay; pin bên thứ 3; bảo hành tại Nhật Store.</li>
          <li>Muốn đổi sang sản phẩm khác: nhập lại = Giá bán hiện tại × 90%.</li>
          <li>Không có sản phẩm đổi: tối đa 07 ngày; quá hạn nhập lại = Giá mua × (100% – 3% × số tháng sử dụng).</li>
        </ul>
      </section>

      {/* VI - Từ chối bảo hành + Lưu ý + Điều kiện đổi trả */}
      <section className="wp-section">
        <h2>VI - TRƯỜNG HỢP TỪ CHỐI BẢO HÀNH</h2>
        <ul className="wp-list">
          <li>Sản phẩm hư do thiên tai, hỏa hoạn, lụt lội, sét đánh.</li>
          <li>Sản phẩm biến dạng do tác động nhiệt hoặc tác động bên ngoài.</li>
        </ul>

        <h3>Lưu ý</h3>
        <ul className="wp-list">
          <li>Gói bảo hành mặc định không hỗ trợ nhập lại máy; hỗ trợ chạy phần mềm miễn phí (trừ ROM mất phí).</li>
          <li>
            Gói bảo hành vàng (nguồn/màn) chỉ áp dụng khi lỗi cảm ứng/liệt cảm ứng; không áp dụng các lỗi lão hoá tự nhiên
            (điểm chết sau 15 ngày, hồng/ám màn...). Nếu lỗi này xuất hiện trong thời hạn đổi máy → được đổi máy mới.
          </li>
          <li>Thiết bị chống nước sau khi bảo hành không cam kết khả năng chống nước.</li>
        </ul>

        <h3>Điều kiện tiếp nhận đổi trả</h3>
        <ul className="wp-list">
          <li>Máy: như mới, không xước xát, không dán decal/hình trang trí.</li>
          <li>Máy cũ: tình trạng như lúc mua.</li>
          <li>Hộp: như mới, không móp/rách; IMEI/Serial trùng thân máy.</li>
          <li>Phụ kiện & quà tặng: đầy đủ, nguyên vẹn; phụ kiện theo hộp bảo hành 1 đổi 1 trong thời gian bao test.</li>
          <li>Tài khoản: đã đăng xuất mọi tài khoản (iCloud/Google/Mi...).</li>
          <li>Các lỗi từ NSX cần xác định bởi TTBH chính hãng/ủy quyền.</li>
          <li>Lỗi NSX gồm: nguồn, mainboard, ổ cứng, màn hình và linh kiện phần cứng bên trong.</li>
          <li>Lỗi điểm chết màn: ≥3 điểm (điện thoại) hoặc ≥5 điểm (laptop/màn rời) hay 1 điểm lớn hơn 1mm.</li>
          <li>Không đủ điều kiện trên, Nhật Store có quyền từ chối đổi mới/nhập lại.</li>
        </ul>

        <h3>Ghi chú</h3>
        <ul className="wp-list">
          <li>Trong thời gian bao test máy mới: nếu máy đã trầy xước, sẽ nhận bảo hành theo gói đã chọn (không đổi mới).</li>
          <li>Ngoài thời gian đổi mới, giá nhập lại theo thỏa thuận với cửa hàng.</li>
        </ul>
      </section>
    </div>
  );
}
