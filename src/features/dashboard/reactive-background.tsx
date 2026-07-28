"use client";

import { useEffect, useRef } from "react";

/**
 * Fondo dinámico y reactivo al ratón para los portales.
 * - Un halo radial (glow) sigue el cursor en tiempo real (vía CSS vars, sin re-render).
 * - Blobs suaves animados dan movimiento constante de fondo.
 * - En pantallas táctiles / con prefers-reduced-motion, degrada a estático.
 */
export function ReactiveBackground() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--mx", `${e.clientX}px`);
        el.style.setProperty("--my", `${e.clientY}px`);
        // Desplaza sutilmente los blobs en dirección contraria al cursor (parallax).
        const dx = (e.clientX / window.innerWidth - 0.5) * 40;
        const dy = (e.clientY / window.innerHeight - 0.5) * 40;
        el.style.setProperty("--px", `${dx}px`);
        el.style.setProperty("--py", `${dy}px`);
      });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={
        {
          "--mx": "50vw",
          "--my": "35vh",
          "--px": "0px",
          "--py": "0px",
        } as React.CSSProperties
      }
    >
      {/* Base suave */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#fbf8f3] via-[#f7f2ec] to-[#f3ece3]" />

      {/* Halo que sigue el cursor */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(560px circle at var(--mx) var(--my), rgba(128,13,13,0.10), transparent 62%)",
        }}
      />
      {/* Segundo halo más pequeño y cálido, ligeramente desfasado */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(240px circle at var(--mx) var(--my), rgba(201,138,75,0.08), transparent 65%)",
        }}
      />

      {/* Blobs animados con leve parallax al mover el ratón */}
      <div
        className="animate-aurora absolute -left-40 -top-40 h-[38rem] w-[38rem] rounded-full bg-primary/[0.07] blur-3xl"
        style={{ transform: "translate(var(--px), var(--py))" }}
      />
      <div
        className="animate-blob absolute -bottom-52 -right-36 h-[42rem] w-[42rem] rounded-full bg-[#8c4a62]/[0.07] blur-3xl"
        style={{ transform: "translate(calc(var(--px) * -1), calc(var(--py) * -1))" }}
      />
      <div
        className="animate-blob absolute left-[45%] top-[40%] h-[24rem] w-[24rem] rounded-full bg-[#c98a4b]/[0.06] blur-3xl"
        style={{ transform: "translate(var(--px), calc(var(--py) * -1))", animationDelay: "3s" }}
      />
    </div>
  );
}
