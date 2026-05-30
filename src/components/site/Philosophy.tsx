"use client";

import { useRef } from "react";
import type { Locale } from "@/lib/i18n";
import {
  ScrollRevealWords,
  usePrefersReducedMotion,
  useScrollProgress,
} from "@/components/site/motion";

const SCROLL_RUNWAY_VH = 3;

function philosophyCopy(locale: Locale) {
  if (locale === "en") {
    return {
      titles: [
        "Field execution.",
        "Industrial projects.",
        "Construction & infrastructure.",
        "Logistics & equipment.",
        "Morocco & Africa.",
      ],
      body:
        "BARANE INVEST is a Moroccan industrial group built for demanding B2B environments — construction, infrastructure, logistics and equipment supply — with corporate rigor and uncompromising on-site delivery.",
    };
  }
  if (locale === "es") {
    return {
      titles: [
        "Ejecucion en terreno.",
        "Proyectos industriales.",
        "Construccion e infraestructura.",
        "Logistica y equipamiento.",
        "Marruecos y Africa.",
      ],
      body:
        "BARANE INVEST es un grupo industrial marroqui pensado para entornos B2B exigentes — construccion, infraestructura, logistica y equipamiento — con rigor corporativo y ejecucion en terreno sin compromisos.",
    };
  }
  return {
    titles: [
      "Exécution terrain.",
      "Projets industriels.",
      "Construction & infrastructure.",
      "Logistique & équipement.",
      "Maroc & Afrique.",
    ],
    body:
      "BARANE INVEST est un groupe industriel marocain conçu pour les environnements B2B exigeants — construction, infrastructure, logistique et équipement — avec une rigueur corporate et une exécution terrain sans compromis.",
  };
}

/** Soft crossfade: blur + vertical drift (no 3D flip). */
function titleMotion(progress: number, index: number, total: number) {
  const segmentSize = 1 / total;
  const start = index * segmentSize;
  const end = (index + 1) * segmentSize;
  const isLast = index === total - 1;
  const mid = (start + end) / 2;
  const halfWidth = segmentSize * 0.48;

  if (index === 0 && progress <= start + 0.02) {
    return { opacity: 1, translateY: 0, blur: 0, scale: 1 };
  }

  if (isLast && progress >= start) {
    const local = (progress - start) / segmentSize;
    const fadeIn = Math.min(1, local / 0.28);
    return {
      opacity: fadeIn,
      translateY: (1 - fadeIn) * 28,
      blur: (1 - fadeIn) * 14,
      scale: 0.97 + fadeIn * 0.03,
    };
  }

  const dist = Math.abs(progress - mid) / halfWidth;
  const t = Math.max(0, Math.min(1, 1 - dist));

  return {
    opacity: t,
    translateY: progress < mid ? (1 - t) * 40 : -(1 - t) * 40,
    blur: (1 - t) * 14,
    scale: 0.96 + t * 0.04,
  };
}

function ScrollRotatingTitles({ titles, progress }: { titles: string[]; progress: number }) {
  return (
    <div className="flex items-center justify-center pointer-events-none">
      <div className="relative w-full" style={{ minHeight: "clamp(10rem, 28vh, 18rem)" }}>
        {titles.map((title, index) => {
          const isLast = index === titles.length - 1;
          const { opacity, translateY, blur, scale } = titleMotion(
            progress,
            index,
            titles.length,
          );

          return (
            <h2
              key={title}
              className={`absolute inset-0 flex items-center justify-center px-4 text-center font-display font-medium uppercase leading-[0.9] tracking-tight md:leading-[0.88] ${
                isLast ? "text-[var(--gold)]" : "text-[var(--navy)]"
              } text-[clamp(2.75rem,11vw,8rem)] md:text-[clamp(3rem,9vw,7rem)]`}
              style={{
                opacity,
                transform: `translateY(${translateY}px) scale(${scale})`,
                filter: `blur(${blur}px)`,
                willChange: "transform, opacity, filter",
              }}
            >
              {title}
            </h2>
          );
        })}
      </div>
    </div>
  );
}

function PhilosophyStatic({ locale }: { locale: Locale }) {
  const t = philosophyCopy(locale);

  return (
    <section id="philosophy" className="relative z-10 bg-[var(--ivory)]">
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-6 py-24 md:px-12 lg:px-20">
        {t.titles.map((title, i) => (
          <h2
            key={title}
            className={`max-w-5xl text-center font-display text-[clamp(1.5rem,6vw,3.5rem)] font-medium uppercase leading-[0.92] tracking-tight ${
              i === t.titles.length - 1 ? "text-[var(--gold)]" : "text-[var(--navy)]/35"
            }`}
          >
            {title}
          </h2>
        ))}
      </div>
      <div className="px-6 pb-20 pt-4 md:px-12 md:pb-28 lg:px-20 lg:pb-36">
        <ScrollRevealWords
          text={t.body}
          className="mx-auto max-w-4xl text-center text-xl leading-relaxed text-[var(--graphite)] md:text-2xl lg:text-[1.75rem] lg:leading-snug"
        />
      </div>
    </section>
  );
}

function PhilosophyScroll({ locale }: { locale: Locale }) {
  const t = philosophyCopy(locale);
  const runwayRef = useRef<HTMLDivElement>(null);
  const progress = useScrollProgress(runwayRef, SCROLL_RUNWAY_VH);

  return (
    <section id="philosophy" className="relative z-10 bg-[var(--ivory)]">
      <div
        ref={runwayRef}
        className="relative"
        style={{ height: `${SCROLL_RUNWAY_VH * 100}vh` }}
      >
        <div className="sticky top-0 flex h-[100svh] items-center justify-center overflow-hidden">
          <div className="relative w-full max-w-7xl px-4 md:px-8">
            <p className="mb-6 text-center eyebrow text-[var(--navy)]/50">
              {locale === "en" ? "Our approach" : locale === "es" ? "Nuestro enfoque" : "Notre approche"}
            </p>
            <ScrollRotatingTitles titles={t.titles} progress={progress} />
          </div>
        </div>
      </div>

      <div className="relative px-6 pb-20 pt-8 md:px-12 md:pb-28 md:pt-12 lg:px-20 lg:pb-36 lg:pt-16">
        <ScrollRevealWords
          text={t.body}
          className="mx-auto max-w-4xl text-center text-xl leading-relaxed text-[var(--graphite)] md:text-2xl lg:text-[1.75rem] lg:leading-snug"
        />
      </div>
    </section>
  );
}

export function Philosophy({ locale = "fr" }: { locale?: Locale }) {
  const reduced = usePrefersReducedMotion();
  if (reduced) return <PhilosophyStatic locale={locale} />;
  return <PhilosophyScroll locale={locale} />;
}
