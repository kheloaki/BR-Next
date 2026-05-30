"use client";

import { useEffect, useState, type RefObject } from "react";

/** Returns 0–1 scroll progress through a tall section (sticky scroll runway). */
export function useScrollProgress(
  sectionRef: RefObject<HTMLElement | null>,
  scrollableVh = 2,
) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrollableHeight = window.innerHeight * scrollableVh;
      const scrolled = -rect.top;
      setProgress(Math.max(0, Math.min(1, scrolled / scrollableHeight)));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sectionRef, scrollableVh]);

  return progress;
}
