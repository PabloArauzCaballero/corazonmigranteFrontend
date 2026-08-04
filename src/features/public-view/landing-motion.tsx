"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode, type Ref } from "react";
import { usePrefersReducedMotion } from "@/shared/hooks/use-media-query";

// ── Reveal ─────────────────────────────────────────────────────────
// Scroll-triggered entrance using IntersectionObserver.
// Respects prefers-reduced-motion.
type RevealProps = {
  children: ReactNode;
  className?: string;
  /** ms delay before the animation starts once in view */
  delay?: number;
  /** direction the element travels in from */
  variant?: "up" | "down" | "left" | "right" | "zoom" | "fade";
  /** re-run every time it enters the viewport */
  repeat?: boolean;
  as?: "div" | "section" | "li" | "article" | "span";
};

const HIDDEN: Record<NonNullable<RevealProps["variant"]>, string> = {
  up: "opacity-0 translate-y-10",
  down: "opacity-0 -translate-y-10",
  left: "opacity-0 translate-x-12",
  right: "opacity-0 -translate-x-12",
  zoom: "opacity-0 scale-95",
  fade: "opacity-0",
};

export function Reveal({
  children,
  className = "",
  delay = 0,
  variant = "up",
  repeat = false,
  as = "div",
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const reduce = usePrefersReducedMotion();
  const [entered, setEntered] = useState(false);
  // Con "reducir movimiento" activo el contenido se muestra directamente: nunca debe
  // quedar oculto esperando a un IntersectionObserver que no vamos a montar.
  const shown = reduce || entered;

  useEffect(() => {
    const el = ref.current;
    if (!el || reduce) return;

    const setShown = setEntered;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            if (!repeat) observer.unobserve(entry.target);
          } else if (repeat) {
            setShown(false);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [repeat, reduce]);

  const Tag = as as "div";
  return (
    <Tag
      ref={ref as Ref<HTMLDivElement>}
      style={{ transitionDelay: shown ? `${delay}ms` : "0ms" }}
      className={[
        "transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform motion-reduce:transition-none",
        shown ? "opacity-100 translate-x-0 translate-y-0 scale-100 blur-0" : HIDDEN[variant],
        className,
      ].join(" ")}
    >
      {children}
    </Tag>
  );
}

// ── Counter ────────────────────────────────────────────────────────
// Animated number that counts up when it scrolls into view.
export function Counter({
  to,
  suffix = "",
  prefix = "",
  duration = 1600,
  className = "",
}: {
  to: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const reduce = usePrefersReducedMotion();
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          if (reduce) { setValue(to); return; }
          const start = performance.now();
          const tick = (now: number) => {
            const p = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            setValue(Math.round(to * eased));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      }
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [to, duration, reduce]);

  return <span ref={ref} className={className}>{prefix}{value}{suffix}</span>;
}

// ── AnimatedChatBubbles ────────────────────────────────────────────
// Reveals chat bubbles one at a time with a typing indicator,
// mimicking a live therapy conversation.
type Bubble = { variant?: string; text?: string };

export function AnimatedChatBubbles({ bubbles }: { bubbles: Bubble[] }) {
  const reduce = usePrefersReducedMotion();
  const [revealed, setRevealed] = useState(1);
  const [typingState, setTypingState] = useState(false);
  // Con "reducir movimiento" se muestra la conversación completa y sin indicador de
  // escritura, en vez de forzarlo desde un efecto.
  const visible = reduce ? bubbles.length : revealed;
  const typing = reduce ? false : typingState;
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const startedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) startedRef.current = true;
    }, { threshold: 0.2 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (bubbles.length <= 1 || reduce) return;

    let timer: ReturnType<typeof setTimeout>;
    const advance = () => {
      setTypingState(true);
      timer = setTimeout(() => {
        setTypingState(false);
        setRevealed((v) => (v >= bubbles.length ? 1 : v + 1));
        timer = setTimeout(advance, 2200);
      }, 900);
    };
    timer = setTimeout(advance, 1800);
    return () => clearTimeout(timer);
  }, [bubbles.length, reduce]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [visible, typing, reduce]);

  const shown = bubbles.slice(0, visible);

  return (
    <div ref={containerRef} className="max-h-[34rem] space-y-4 overflow-y-auto scroll-smooth bg-background px-5 py-6">
      {shown.map((bubble, index) => {
        const isUser = bubble.variant === "user";
        return (
          <div
            className={`flex ${isUser ? "justify-end" : "justify-start"} animate-bubble-in`}
            key={`${index}-${bubble.text?.slice(0, 12)}`}
          >
            <p
              className={`max-w-[82%] rounded-[1.3rem] px-4 py-3 text-sm leading-6 shadow-sm ${
                isUser
                  ? "rounded-br-md bg-brand-clay text-surface-inverse-foreground"
                  : "rounded-bl-md border border-line bg-card text-ink-soft"
              }`}
            >
              {bubble.text}
            </p>
          </div>
        );
      })}
      {typing && (
        <div className="flex justify-start animate-bubble-in">
          <div className="flex items-center gap-1.5 rounded-[1.3rem] rounded-bl-md border border-line bg-card px-4 py-3.5 shadow-sm">
            <span className="h-2 w-2 animate-typing-dot rounded-full bg-brand-sand" style={{ animationDelay: "0ms" }} />
            <span className="h-2 w-2 animate-typing-dot rounded-full bg-brand-sand" style={{ animationDelay: "180ms" }} />
            <span className="h-2 w-2 animate-typing-dot rounded-full bg-brand-sand" style={{ animationDelay: "360ms" }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── ScrollNavbar ───────────────────────────────────────────────────
// Adds a "scrolled" state so the parent navbar can shrink / solidify,
// plus tracks the active section for underline highlighting.
export function useScrollNavbar(sectionIds: string[]) {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("");
  // `sectionIds` suele llegar como literal nuevo en cada render; se estabiliza por
  // contenido para que el observer no se desmonte y remonte en cada scroll.
  const sectionKey = sectionIds.join(",");
  const observedIds = useMemo(() => sectionKey.split(",").filter(Boolean), [sectionKey]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    for (const id of observedIds) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, [observedIds]);

  return { scrolled, active };
}

// ── Parallax float wrapper ─────────────────────────────────────────
export function Parallax({
  children,
  speed = 0.15,
  className = "",
}: {
  children: ReactNode;
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduce = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduce) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * -speed;
        el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, [speed, reduce]);

  return <div ref={ref} className={className}>{children}</div>;
}
