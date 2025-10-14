import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/components/TopBar.css";

/**
 * TopBar
 * - segments: [{ label: string, href?: string, dim?: boolean }]
 * - showBack: boolean (default: true)
 * - className: string
 */
export default function TopBar({ segments = [], showBack = true, className = "" }) {
  const navigate = useNavigate();

  const goBack = () => {
    if (window.history.length > 2) navigate(-1);
    else navigate("/");
  };

  return (
    <div className={`tb-hero ${className}`}>
      <div className="tb-container">
        <nav className="tb-bar" aria-label="Breadcrumb">
          {/* Back button */}
          {showBack && (
            <button type="button" className="tb-back" onClick={goBack} aria-label="Quay lại">
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
            </button>
          )}

          {/* Scroller to avoid wrap */}
          <div className="tb-scroller">
            <ol className="tb-bc" role="list">
              <li className="tb-item">
                <Link to="/" className="tb-link">
                  <span className="tb-ico" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M12 3 3 10h2v10h6v-6h2v6h6V10h2z"/>
                    </svg>
                  </span>
                  Trang chủ
                </Link>
              </li>

              {segments.map((seg, i) => (
                <li key={i} className="tb-item">
                  {seg.href ? (
                    <Link
                      to={seg.href}
                      className={`tb-link ${seg.dim ? "is-dim" : ""}`}
                      title={seg.label}
                    >
                      {seg.label}
                    </Link>
                  ) : (
                    <strong className="tb-current" title={seg.label}>
                      {seg.label}
                    </strong>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </nav>
      </div>
    </div>
  );
}
