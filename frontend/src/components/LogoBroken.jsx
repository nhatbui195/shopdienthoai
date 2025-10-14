import React, { useLayoutEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";

export default function LogoBroken({
  to = "/",
  text = "PHONE STORE",
  className = "",
}) {
  const rootRef = useRef(null);
  const tlRef = useRef(null);

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    // Tắt hiệu ứng cho người dùng giảm chuyển động
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const chars = el.querySelectorAll(".lb-char");

    // Set trạng thái ban đầu (vỡ tung)
    gsap.set(chars, {
      x: () => gsap.utils.random(-80, 80, 1),
      y: () => gsap.utils.random(-50, 50, 1),
      rotation: () => gsap.utils.random(-180, 180, 1),
      scale: 0,
      opacity: 0,
      transformOrigin: "50% 50%",
    });

    // Tạo timeline vòng lặp + yoyo
    const tl = gsap.timeline({
      repeat: -1,
      yoyo: true,
      repeatDelay: 0.65,
      defaults: { ease: "power4.inOut" },
    });

    tl.to(chars, {
      x: 0,
      y: 0,
      rotation: 0,
      scale: 1,
      opacity: 1,
      duration: 0.75,
      stagger: 0.0125,
    });

    // Hover để chạy chậm
    const onEnter = () => tl.timeScale(0.15);
    const onLeave = () => tl.timeScale(1);
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);

    tlRef.current = tl;

    return () => {
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
      tl.kill();
    };
  }, []);

  return (
    <Link to={to} className={`logo-broken ${className}`} aria-label={text}>
      <span className="logo-broken__inner" ref={rootRef}>
        {Array.from(text).map((ch, i) => (
          <span className="lb-char" key={i} aria-hidden="true">
            {ch === " " ? "\u00A0" : ch}
          </span>
        ))}
      </span>
      <span className="sr-only">{text}</span>
    </Link>
  );
}
