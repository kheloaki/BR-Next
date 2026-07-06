"use client";

import type { ProjectDashboard } from "@/components/admin/operations-types";
import { formatDateFr } from "@/lib/admin/date-time-fr";

export function ProjectCumulativeCostChart({
  series,
}: {
  series: ProjectDashboard["cumulativeCost"];
}) {
  if (series.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-[var(--graphite)]/60">
        Aucun coût enregistré pour tracer l&apos;évolution.
      </p>
    );
  }

  const width = 320;
  const height = 140;
  const pad = { top: 12, right: 8, bottom: 28, left: 36 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const maxY = Math.max(...series.map((p) => p.total), 1);

  const points = series.map((p, i) => {
    const x = pad.left + (series.length === 1 ? innerW / 2 : (i / (series.length - 1)) * innerW);
    const y = pad.top + innerH - (p.total / maxY) * innerH;
    return { x, y, ...p };
  });

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const baselineY = pad.top + innerH;
  const area =
    points.length > 0
      ? `${line} L ${points[points.length - 1].x.toFixed(1)} ${baselineY} L ${points[0].x.toFixed(1)} ${baselineY} Z`
      : "";
  const yTicks = [0, maxY / 2, maxY];

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full max-w-full" aria-hidden>
        {yTicks.map((v) => {
          const y = pad.top + innerH - (v / maxY) * innerH;
          return (
            <g key={v}>
              <line
                x1={pad.left}
                y1={y}
                x2={width - pad.right}
                y2={y}
                stroke="var(--border)"
                strokeWidth={1}
              />
              <text
                x={pad.left - 4}
                y={y + 3}
                textAnchor="end"
                className="fill-[var(--graphite)] text-[8px]"
              >
                {v >= 1000 ? `${Math.round(v / 1000)}k` : Math.round(v)}
              </text>
            </g>
          );
        })}
        {area ? <path d={area} fill="var(--gold)" fillOpacity={0.12} /> : null}
        <path d={line} fill="none" stroke="var(--navy)" strokeWidth={2} strokeLinejoin="round" />
        {points.map((p) => (
          <circle key={p.date} cx={p.x} cy={p.y} r={3.5} fill="var(--gold)" stroke="white" strokeWidth={1.5} />
        ))}
        {points.map((p, i) =>
          i === 0 || i === points.length - 1 || points.length <= 4 ? (
            <text
              key={`${p.date}-label`}
              x={p.x}
              y={height - 6}
              textAnchor="middle"
              className="fill-[var(--graphite)] text-[7px]"
            >
              {formatDateFr(p.date)}
            </text>
          ) : null,
        )}
      </svg>
    </div>
  );
}
