"use client";
import { useState } from "react";
import type { FieldHistoryWeek, Rating, Report } from "@/lib/report";
import { RATING_STYLES, formatMs } from "@/lib/format";

interface FieldTrendProps {
  history: Report["fieldHistory"];
  unavailableReason: string | null;
}

type MetricKey = "lcp" | "inp" | "cls";

// Core Web Vitals thresholds (p75): at or under `good` is good, above `poor` is poor.
const METRICS: { key: MetricKey; name: string; good: number; poor: number; format: (v: number) => string }[] = [
  { key: "lcp", name: "LCP", good: 2500, poor: 4000, format: formatMs },
  { key: "inp", name: "INP", good: 200, poor: 500, format: formatMs },
  { key: "cls", name: "CLS", good: 0.1, poor: 0.25, format: (v) => v.toFixed(2) },
];

const rate = (v: number, good: number, poor: number): Rating =>
  v <= good ? "good" : v <= poor ? "needs-improvement" : "poor";

const formatWeek = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

const W = 240;
const H = 90;

// Contiguous runs of non-null points, so weeks without data break the line instead of bridging it.
const segments = (pts: ({ x: number; y: number } | null)[]) => {
  const out: string[] = [];
  let run: string[] = [];
  for (const p of pts) {
    if (p) {
      run.push(`${p.x},${p.y}`);
    } else if (run.length) {
      out.push(run.join(" "));
      run = [];
    }
  }
  if (run.length) out.push(run.join(" "));
  return out;
};

const Sparkline = ({ weeks, metric }: { weeks: FieldHistoryWeek[]; metric: (typeof METRICS)[number] }) => {
  const [hover, setHover] = useState<number | null>(null);
  const values = weeks.map((w) => w[metric.key]);
  const present = values.filter((v): v is number => v != null);
  if (present.length === 0) {
    return <p className="text-xs text-gray-500 py-8 text-center">No {metric.name} data</p>;
  }

  const max = Math.max(...present, metric.poor) * 1.1;
  const x = (i: number) => (weeks.length === 1 ? W / 2 : (i / (weeks.length - 1)) * W);
  const y = (v: number) => H - (v / max) * H;
  const pts = values.map((v, i) => (v == null ? null : { x: x(i), y: y(v) }));

  const latestIdx = values.map((v, i) => (v == null ? -1 : i)).filter((i) => i >= 0).pop()!;
  const shownIdx = hover != null && values[hover] != null ? hover : latestIdx;
  const shown = values[shownIdx]!;
  const style = RATING_STYLES[rate(shown, metric.good, metric.poor)];

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - rect.left) / rect.width) * (weeks.length - 1));
    setHover(Math.min(weeks.length - 1, Math.max(0, i)));
  };

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xs text-white font-medium">{metric.name}</span>
        <span className="text-[10px] text-gray-500">
          {hover != null ? `Week ending ${formatWeek(weeks[shownIdx].end)}` : "Latest"}
        </span>
      </div>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-lg font-bold text-white">{metric.format(shown)}</span>
        <span className={`inline-flex items-center gap-1 text-[10px] ${style.text}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
          {style.label}
        </span>
      </div>
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block w-full h-24 overflow-visible touch-none"
          preserveAspectRatio="none"
          role="img"
          aria-label={`${metric.name} p75 over ${weeks.length} weeks, latest ${metric.format(values[latestIdx]!)}`}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        >
          {[
            { v: metric.good, color: RATING_STYLES.good.stroke },
            { v: metric.poor, color: RATING_STYLES.poor.stroke },
          ].map(({ v, color }) => (
            <line key={v} x1={0} x2={W} y1={y(v)} y2={y(v)} stroke={color} strokeOpacity={0.45} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
          ))}
          {segments(pts).map((p) => (
            <polyline key={p} points={p} fill="none" stroke="#60a5fa" strokeWidth={2} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          ))}
          {hover != null && (
            <line x1={x(hover)} x2={x(hover)} y1={0} y2={H} stroke="rgba(255,255,255,0.25)" vectorEffect="non-scaling-stroke" />
          )}
        </svg>
        {/* Markers are HTML so they stay round while the SVG stretches. Shown for the active
            point and for isolated weeks, which a polyline alone can't draw. */}
        {pts.map((p, i) => {
          if (!p) return null;
          const isolated = !pts[i - 1] && !pts[i + 1];
          const active = i === shownIdx;
          if (!isolated && !active) return null;
          return (
            <span
              key={i}
              className={`pointer-events-none absolute -ml-1 -mt-1 h-2 w-2 rounded-full ${
                active ? "bg-blue-300 ring-2 ring-[#020e1d]" : "bg-blue-400"
              }`}
              style={{ left: `${(p.x / W) * 100}%`, top: `${(p.y / H) * 100}%` }}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-gray-500 mt-1">
        <span>{formatWeek(weeks[0].end)}</span>
        <span>{formatWeek(weeks[weeks.length - 1].end)}</span>
      </div>
      <p className="text-[10px] text-gray-500 mt-0.5">
        <span className={RATING_STYLES.good.text}>- -</span> good ≤ {metric.format(metric.good)}
        <span className="mx-1.5">·</span>
        <span className={RATING_STYLES.poor.text}>- -</span> poor &gt; {metric.format(metric.poor)}
      </p>
    </div>
  );
};

// Weekly real-user (CrUX) p75 trend for the three Core Web Vitals, one chart each.
const FieldTrend: React.FC<FieldTrendProps> = ({ history, unavailableReason }) => (
  <div className="dash-card animate-fade-up p-4 lg:col-span-2" style={{ animationDelay: "100ms" }}>
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 mb-4">
      <h3 className="font-semibold text-white">Core Web Vitals Trend (real users)</h3>
      {history && (
        <span className="text-[10px] text-gray-500">
          {history.scope === "url" ? "This URL" : "Whole origin"} · p75 · {history.weeks.length} weeks
        </span>
      )}
    </div>
    {history && history.weeks.length > 0 ? (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {METRICS.map((m) => (
          <Sparkline key={m.key} weeks={history.weeks} metric={m} />
        ))}
      </div>
    ) : (
      <p className="text-sm text-gray-400 py-8 text-center">
        {unavailableReason ?? "No real-user trend data is available for this site."}
      </p>
    )}
  </div>
);

export default FieldTrend;
