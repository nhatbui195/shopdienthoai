import React, { useState } from 'react';
import 'boxicons/css/boxicons.min.css';   
import '../styles/components/SidebarMenu.css';

const menuItems = [
  { label: "IPHONE 16", hot: true, icon: "bxl-apple",
    submenu: [
      { title: "Chọn theo dòng", items: [
        "iPhone 17 Series","iPhone 16 Series","iPhone 15 Series",
        "iPhone 14 Series","iPhone 13 Series","iPhone 12 Series","iPhone 11 Series"
      ]}
    ]
  },
  { label: "IPHONE 15", hot: true, icon: "bxl-apple",
    submenu: [
      { title: "Chọn theo dòng", items: [
        "iPhone 17 Series","iPhone 16 Series","iPhone 15 Series",
        "iPhone 14 Series","iPhone 13 Series","iPhone 12 Series","iPhone 11 Series"
      ]}
    ]
  },
  { label: "Điện thoại", icon: "bx-mobile-alt",
    submenu: [
      { title: "Chọn theo hãng", items: [
        "iPhone","Samsung","Xiaomi","TECNO","Realme","INFINIX","TCL","Oscal",
        "INOI","ZTE Nubia","Nokia","Oppo"
      ]},
      { title: "Điện thoại hot", items: [
        "iPhone 16","Galaxy S25 Ultra","Xiaomi Note 14","iPhone 15","iPhone 13","iPhone cũ giá rẻ"
      ]}
    ]
  },
  { label: "Tablet", icon: "bx-tab",
    submenu: [
      { title: "Apple iPad", items: ["iPad A16","iPad Air M3","iPad Mini 7","iPad Pro M4","iPad Gen 10"]},
      { title: "Table android", items: ["Samsung Tab","Lenovo Tab","Mi Pad","Nokia Tab","Masstel"]}
    ]
  },
  { label: "Laptop", icon: "bx-laptop",
    submenu: [
      { title: "Macbook", items: ["Macbook Air","Macbook Pro","Mac Mini"]},
      { title: "Laptop Windows", items: ["Dell","HP","Acer","Asus"]}
    ]
  },
  { label: "Đồng hồ", icon: "bx-time",
    submenu: [
      { title: "Apple watch", items: [
        "Apple Watch Ultra 3","Apple Watch Series 11","Apple Watch SE 3",
        "Apple Watch Ultra 2","Apple Watch Series 10","Watch SE 2024","Apple Watch Series 9"
      ]},
      { title: "Hãng khác", items: ["Samsung watch","Miband"]}
    ]
  },
  { label: "Hàng cũ", icon: "bx-store-alt",
    submenu: [
      { title: "Chọn loại sản phẩm cũ", items: ["iPhone cũ","iPad cũ","Samsung cũ","Sony cũ","Google","Macbook cũ"]},
      { title: "iPhone cũ", items: [
        "iPhone 15 series cũ","iPhone 14 Series cũ","iPhone 13 Series cũ","iPhone 12 Series cũ",
        "iPhone 11 Series cũ","iPhone Xs Max","iPhone Xs"
      ]},
      { title: "Samsung cũ", items: [
        "Galaxy Z cũ","S23 Series","S22 Series","S21 Series","S20 Series"
      ]}
    ]
  },
  { label: "Thu cũ", icon: "bx-refresh",
    submenu: [
      { title: "Tin mới", items: ["Tin công nghệ","Khuyến mãi","Góc thủ thuật","Sự kiện"]}
    ]
  },
  { label: "Sửa chữa", icon: "bx-wrench",
    submenu: [
      { title: "Chọn theo dòng", items: ["Airpods","Tai nghe Samsung","Loa"]}
    ]
  },
  { label: "Phụ kiện", icon: "bx-headphone",
    submenu: [
      { title: "Phụ kiện điện thoại", items: [
        "Ốp lưng, bao da","Cáp, sạc","Dán màn hình","Pin dự phòng",
        "Phụ kiện Apple","Phụ kiện Samsung","Phụ kiện Xiaomi"
      ]},
      { title: "Phụ kiện khác", items: [
        "Loa","Phụ kiện laptop","Tai nghe","Camera giám sát"
      ]}
    ]
  },
];

export default function SidebarMenu() {
  const [hoveredItem, setHoveredItem] = useState(null);
  const handleMouseEnter = (label) => setHoveredItem(label);
  const handleMouseLeave = () => setHoveredItem(null);
  const activeSubmenu = menuItems.find(item => item.label === hoveredItem)?.submenu;

  return (
    <div className="left-side" onMouseLeave={handleMouseLeave}>
      <ul>
        {menuItems.map((item, index) => (
          <li
            key={index}
            className={item.submenu ? "has-submenu-wrapper" : ""}
            onMouseEnter={() => item.submenu && handleMouseEnter(item.label)}
          >
            <div className="has-submenu">
              {/* ✅ icon */}
              <i className={`bx ${item.icon} menu-icon`}></i>
              {item.label} {item.hot && <span className="hot">HOT</span>}
            </div>
          </li>
        ))}
      </ul>

      {activeSubmenu && (
        <>
          <div className="submenu-buffer" />
          <div
            className={`submenu ${hoveredItem === "Điện thoại" ? "submenu-phone" : ""}`}
          >
            <div className="submenu-multi">
              {activeSubmenu.map((col, i) => (
                <div className="submenu-col" key={i}>
                  <h4>{col.title}</h4>
                  <ul>
                    {col.items.map((p, j) => (
                      <li key={j}>{p}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
