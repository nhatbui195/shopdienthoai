// src/components/Loading.jsx
import React from "react";
import "../styles/components/Loading.css";

export default function Loading({
  fullscreen = false,
  size = 50,          // px
  speed = 1,          // giây / vòng
  color = "#f03355",  // màu vệt quay
  thickness = 8,      // px
  text = "",
}) {
  const style = {
    "--size": `${size}px`,
    "--color": color,
    "--b": `${thickness}px`,
    // dùng đúng keyframes 'spinner4'
    animation: `spinner4 ${Number(speed)}s steps(10) infinite`,
  };

  return (
    <div
      className={`loading ${fullscreen ? "loading--fullscreen" : ""}`}
      role="status"
      aria-live="polite"
      aria-label={text}
    >
      <div className="spinner-4" style={style} aria-hidden="true" />
      {text ? <div className="loading__text">{text}</div> : null}
    </div>
  );
}
