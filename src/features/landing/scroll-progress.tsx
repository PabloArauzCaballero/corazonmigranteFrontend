"use client";

import { useEffect, useState } from "react";

export function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const root = document.documentElement;
      const max = root.scrollHeight - root.clientHeight;
      if (max <= 0) {
        setProgress(0);
        return;
      }
      setProgress(Math.min(100, Math.max(0, (root.scrollTop / max) * 100)));
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div
      className="fixed left-0 top-0 z-[60] h-1 bg-primary shadow-[0_0_18px_rgba(35,99,89,0.38)] transition-[width] duration-150 ease-out"
      style={{ width: `${progress}%` }}
      aria-hidden="true"
    />
  );
}
