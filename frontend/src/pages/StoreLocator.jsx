import React, { useMemo, useState } from "react";
import "../styles/pages/StoreLocator.css";
import Swal from "sweetalert2";

/** ====== DATA ====== */
const RAW_STORES = [
  {
    key: "mien-bac",
    name: "Khu vực Miền Bắc",
    items: [
      { addr: "375 Cầu Giấy, Hà Nội" },
      { addr: "111 Trần Đăng Ninh, Cầu Giấy, Hà Nội" },
      { addr: "118 Thái Hà, Đống Đa, Hà Nội" },
      { addr: "446 Xã Đàn, Đống Đa, Hà Nội" },
      {
        addr:
          "312 Nguyễn Trãi, P.Trung Văn, Q.Nam Từ Liêm, Hà Nội (gần Đại học Hà Nội)",
      },
      { addr: "TTBH Hà Nội 1: Tầng 2, 111 Trần Đăng Ninh, Cầu Giấy" },
      { addr: "TTBH Hà Nội 2: Tầng 2, 375 Cầu Giấy, Hà Nội" },
      {
        addr:
          "Ngã 3 Đồng Yên, Yên Phong, Bắc Ninh (KCN Yên Phong)",
      },
      { addr: "269 Nguyễn Hữu Tiến, TT Đồng Văn, Duy Tiên, Hà Nam" },
      { addr: "380 Trần Phú, Ba Đình, Thanh Hóa" },
    ],
  },
  {
    key: "nghe-an-da-nang",
    name: "Khu vực Nghệ An - Đà Nẵng",
    items: [
      { addr: "233 Lê Duẩn, TP Vinh, Nghệ An" },
      { addr: "161 Hàm Nghi, Q.Thanh Khê, TP Đà Nẵng" },
    ],
  },
  {
    key: "mien-nam",
    name: "Khu vực Miền Nam",
    items: [
      { addr: "379 Hoàng Văn Thụ, P.2, Q.Tân Bình, TP Hồ Chí Minh" },
      { addr: "535 Lê Hồng Phong, P.10, Q.10, TP Hồ Chí Minh" },
    ],
  },
];

/** ====== HELPERS ====== */
function normalize(s = "") {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Hàm hash đơn giản để sinh số điện thoại ổn định theo địa chỉ
function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0; // 32-bit
  }
  return Math.abs(h);
}

// Tạo số ĐT Việt Nam 10 chữ số với đầu số phổ biến (03/07/08/09)
function makeVNPhone(addr) {
  const heads = ["032", "033", "034", "035", "036", "037", "038", "039", "070", "079", "081", "082", "083", "084", "085", "086", "088", "089", "090", "091", "096", "097", "098"];
  const h = hashCode(addr);
  const head = heads[h % heads.length];
  const tail = String((h % 10_000_000) + 10_000_000).slice(1); // 7 digits
  // Format kiểu 09xx.xxx.xxx
  return `${head}.${tail.slice(0,3)}.${tail.slice(3)}`;
}

const STORES = RAW_STORES.map(g => ({
  ...g,
  items: g.items.map(it => ({ ...it, phone: makeVNPhone(it.addr) })),
}));

/** ====== COMPONENT ====== */
export default function StoreLocator() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(() =>
    Object.fromEntries(STORES.map(s => [s.key, true]))
  );

  const total = useMemo(
    () => STORES.reduce((acc, s) => acc + s.items.length, 0),
    []
  );
  const regions = useMemo(
    () => STORES.map(s => s.name.replace("Khu vực ", "")).join(" | "),
    []
  );

  const filtered = useMemo(() => {
    const nq = normalize(q);
    if (!nq) return STORES;
    return STORES.map(group => ({
      ...group,
      items: group.items.filter(
        it =>
          normalize(it.addr).includes(nq) ||
          normalize(it.phone).includes(nq)
      ),
    }));
  }, [q]);

  const copyPhone = async (phone) => {
    try {
      await navigator.clipboard.writeText(phone.replace(/\./g, ""));
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Đã copy số điện thoại",
        showConfirmButton: false,
        timer: 1400,
      });
    } catch {
      Swal.fire({
        icon: "info",
        title: "Sao chép thất bại",
        text: phone,
      });
    }
  };

  return (
    <div className="sl-wrap">
      {/* Breadcrumb */}
      <nav className="sl-bc">
        <i className="bx bx-menu-alt-left sl-bc__icon"></i>
        <a href="/" className="sl-bc__home">
          <i className="bx bxs-home"></i> Trang chủ
        </a>
        <span className="sep">/</span>
        <span className="dim">Nhat Store</span>
        <span className="sep">/</span>
        <strong>Hệ thống cửa hàng</strong>
      </nav>

      {/* Title */}
      <h1 className="sl-title">Hệ thống cửa hàng Nhat Store</h1>
      <p className="sl-sub">
        Hệ thống {total} cửa hàng tại: {regions}
      </p>

      {/* Search */}
      <div className="sl-search">
        <i className="bx bx-search search-icon"></i>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Tìm kiếm địa chỉ hoặc số điện thoại"
          aria-label="Tìm kiếm địa chỉ hoặc số điện thoại"
        />
        {q && (
          <button className="clear-btn" onClick={() => setQ("")} aria-label="Xóa tìm kiếm">
            <i className="bx bx-x"></i>
          </button>
        )}
      </div>

      {/* Regions */}
      <div className="sl-regions">
        {filtered.map(group => (
          <section key={group.key} className="sl-region">
            <button
              className="sl-region__head"
              onClick={() => setOpen(o => ({ ...o, [group.key]: !o[group.key] }))}
              aria-expanded={open[group.key] ? "true" : "false"}
            >
              <i className={`bx ${open[group.key] ? "bx-chevron-down" : "bx-chevron-right"}`}></i>
              {group.name}
              <span className="count">{group.items.length}</span>
            </button>

            {open[group.key] && (
              <ul className="sl-list">
                {group.items.length === 0 && (
                  <li className="sl-empty">
                    <i className="bx bx-search-alt-2"></i>
                    Không tìm thấy cửa hàng phù hợp.
                  </li>
                )}
                {group.items.map((it, idx) => (
                  <li key={idx} className="sl-item">
                    <span className="dot" aria-hidden>•</span>
                    <span className="addr">{it.addr}</span>
                    <a className="phone" href={`tel:${it.phone.replace(/\./g, "")}`}>
                      <i className="bx bx-phone-call"></i>{it.phone}
                    </a>
                    <button
                      className="copy-btn"
                      onClick={() => copyPhone(it.phone)}
                      title="Copy số điện thoại"
                    >
                      <i className="bx bx-copy"></i>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
