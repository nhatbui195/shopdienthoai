// src/components/AuthModal.jsx
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

export default function AuthModal({ open, onClose }) {
  const [showRegister, setShowRegister] = useState(false);
  const overlayRef = useRef(null);
  const firstFocusableRef = useRef(null);
  const lastFocusedBeforeOpen = useRef(null);

  // Reset khi đóng
  useEffect(() => {
    if (!open) {
      setShowRegister(false);
      return;
    }
    // Lưu phần tử focus trước khi mở
    lastFocusedBeforeOpen.current = document.activeElement;

    // Khoá scroll + xử lý bù padding
    const prevOverflow = document.body.style.overflow;
    const prevPadding = document.body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;

    // Focus vào nút đóng sau khi mở
    const t = setTimeout(() => {
      firstFocusableRef.current?.focus();
    }, 0);

    return () => {
      clearTimeout(t);
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPadding;
      // Trả focus về chỗ cũ
      lastFocusedBeforeOpen.current?.focus?.();
    };
  }, [open]);

  // Đóng bằng Esc & trap focus đơn giản
  useEffect(() => {
    if (!open) return;

    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
      }
      if (e.key === "Tab") {
        // trap focus trong modal
        const root = overlayRef.current?.querySelector(".login-popup");
        if (!root) return;
        const focusables = root.querySelectorAll(
          'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        const list = Array.from(focusables).filter(el => !el.hasAttribute("disabled"));
        if (list.length === 0) return;

        const first = list[0];
        const last = list[list.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  // An toàn khi SSR: chỉ portal khi có document
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="login-popup-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div
        className="login-popup"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={firstFocusableRef}
          className="login-close"
          onClick={onClose}
          aria-label="Đóng"
        >
          ✕
        </button>

        <h2 id="auth-modal-title" className="sr-only">Đăng nhập / Đăng ký</h2>

        {showRegister ? (
          <RegisterForm onSwitchToLogin={() => setShowRegister(false)} />
        ) : (
          <LoginForm
            onSwitchToRegister={() => setShowRegister(true)}
            onLoginSuccess={onClose}
          />
        )}
      </div>
    </div>,
    document.body
  );
}
