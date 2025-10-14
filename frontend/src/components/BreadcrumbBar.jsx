import React from "react";
import "../styles/components/BreadcrumbBar.css";

/**
 * BreadcrumbBar (tái sử dụng)
 * props:
 * - segments: [{ label, href?, icon?, dim?, strong? }]
 * - leftIcon: class icon bên trái (mặc định "bx bx-menu-alt-left")
 * - onLeftClick: handler khi click icon trái
 * - className, style: tuỳ biến thêm (ví dụ: "crumb-docked" để chui vào nền đỏ như ô input)
 */
export default function BreadcrumbBar({
  segments = [],
  leftIcon = "bx bx-menu-alt-left",
  onLeftClick,
  className = "",
  style,
}) {
  return (
    <nav className={`crumb ${className}`} style={style} aria-label="breadcrumb">
      <button
        type="button"
        className="crumb__left"
        onClick={onLeftClick}
        aria-label="Mở menu"
      >
        <i className={leftIcon} />
      </button>

      <ol className="crumb__list">
        {segments.map((s, idx) => (
          <li key={idx} className="crumb__item">
            {idx > 0 && <span className="crumb__sep">/</span>}
            {s.href ? (
              <a
                href={s.href}
                className={`crumb__link ${s.dim ? "is-dim" : ""}`}
              >
                {s.icon && <i className={s.icon} />} {s.label}
              </a>
            ) : (
              <span
                className={`crumb__text ${s.dim ? "is-dim" : ""} ${
                  s.strong ? "is-strong" : ""
                }`}
              >
                {s.icon && <i className={s.icon} />} {s.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
