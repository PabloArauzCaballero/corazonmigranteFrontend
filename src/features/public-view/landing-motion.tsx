"use client";

import { useEffect, useRef, useState, type ReactNode, type Ref } from "react";

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
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setShown(true); return; }

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
  }, [repeat]);

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
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
  }, [to, duration]);

  return <span ref={ref} className={className}>{prefix}{value}{suffix}</span>;
}

// ── AnimatedChatBubbles ────────────────────────────────────────────
// Reveals chat bubbles one at a time with a typing indicator,
// mimicking a live therapy conversation.
type Bubble = { variant?: string; text?: string };

export function AnimatedChatBubbles({ bubbles }: { bubbles: Bubble[] }) {
  const [visible, setVisible] = useState(1);
  const [typing, setTyping] = useState(false);
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
    if (bubbles.length <= 1) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setVisible(bubbles.length); return; }

    let timer: ReturnType<typeof setTimeout>;
    const advance = () => {
      setTyping(true);
      timer = setTimeout(() => {
        setTyping(false);
        setVisible((v) => {
          const next = v >= bubbles.length ? 1 : v + 1;
          return next;
        });
        timer = setTimeout(advance, 2200);
      }, 900);
    };
    timer = setTimeout(advance, 1800);
    return () => clearTimeout(timer);
  }, [bubbles.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [visible, typing]);

  const shown = bubbles.slice(0, visible);

  return (
    <div ref={containerRef} className="max-h-[34rem] space-y-4 overflow-y-auto scroll-smooth bg-[#f7f1e9] px-5 py-6">
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
                  ? "rounded-br-md bg-[#622f22] text-white"
                  : "rounded-bl-md border border-[#e5d9cc] bg-white text-[#4e4a44]"
              }`}
            >
              {bubble.text}
            </p>
          </div>
        );
      })}
      {typing && (
        <div className="flex justify-start animate-bubble-in">
          <div className="flex items-center gap-1.5 rounded-[1.3rem] rounded-bl-md border border-[#e5d9cc] bg-white px-4 py-3.5 shadow-sm">
            <span className="h-2 w-2 animate-typing-dot rounded-full bg-[#b09a86]" style={{ animationDelay: "0ms" }} />
            <span className="h-2 w-2 animate-typing-dot rounded-full bg-[#b09a86]" style={{ animationDelay: "180ms" }} />
            <span className="h-2 w-2 animate-typing-dot rounded-full bg-[#b09a86]" style={{ animationDelay: "360ms" }} />
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
    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, [sectionIds.join(",")]);

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

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

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
  }, [speed]);

  return <div ref={ref} className={className}>{children}</div>;
}
