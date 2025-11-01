import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function BackButton({
  fallback = "/landing",
  title = "Go back",
  className = "",
}) {
  const navigate = useNavigate();
  const btnRef = useRef(null);

  const onClick = () => {
    // Ripple effect
    const btn = btnRef.current;
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      const ripple = document.createElement("span");
      ripple.className = "ripple-circle";
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${(rect.width - size) / 2}px`;
      ripple.style.top = `${(rect.height - size) / 2}px`;
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 650);
    }

    // Navigation logic
    try {
      if (window.history.length > 1) navigate(-1);
      else navigate(fallback);
    } catch {
      navigate(fallback);
    }
  };

  return (
    <button
      type="button"
      ref={btnRef}
      onClick={onClick}
      aria-label={title}
      title={title}
      className={`ripple-parent inline-flex items-center justify-center h-9 w-9 
        rounded-full border border-ink-200 bg-white/70 dark:bg-slate-900/70 
        backdrop-blur hover:bg-ink-100 dark:hover:bg-ink-800 
        text-ink-700 dark:text-ink-200 transition-colors shadow-sm 
        ${className}`}
    >
      {/* Left Arrow */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <polygon points="15,6 9,12 15,18" />
      </svg>
    </button>
  );
}
