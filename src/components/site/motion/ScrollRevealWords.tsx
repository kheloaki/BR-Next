"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

interface ScrollRevealWordsProps {
  text: string;
  className?: string;
}

export function ScrollRevealWords({ text, className = "" }: ScrollRevealWordsProps) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLParagraphElement>(null);
  const [progress, setProgress] = useState(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;

    const handleScroll = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = vh * 0.85;
      const end = vh * 0.25;
      const p = (start - rect.top) / (start - end);
      setProgress(Math.max(0, Math.min(1, p)));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [reduced]);

  const words = text.split(/\s+/);

  return (
    <p ref={ref} className={className}>
      {words.map((word, i) => {
        const threshold = i / words.length;
        const visible = progress > threshold;
        return (
          <span
            key={`${word}-${i}`}
            className="inline-block mr-[0.25em] transition-all duration-500"
            style={{
              opacity: visible ? 1 : 0.15,
              filter: visible ? "blur(0px)" : "blur(8px)",
              transform: visible ? "translateY(0)" : "translateY(0.35em)",
            }}
          >
            {word}
          </span>
        );
      })}
    </p>
  );
}
