"use client";

import { useEffect, useRef, useState } from "react";
import { Monitor, Smartphone, Share2, ArrowRight } from "lucide-react";

type Device = "mobile" | "desktop";

const DATA: Record<
  Device,
  {
    score: number;
    categories: { label: string; value: number }[];
    vitals: {
      label: string;
      name: string;
      value: string;
      /* 0–1 position along the good→poor rail */
      position: number;
      status: "Good" | "Needs work" | "Poor";
    }[];
    opportunities: { title: string; saving: string; impact: string }[];
  }
> = {
  mobile: {
    score: 78,
    categories: [
      { label: "Performance", value: 78 },
      { label: "Accessibility", value: 92 },
      { label: "Best practices", value: 96 },
      { label: "SEO", value: 100 },
    ],
    vitals: [
      {
        label: "LCP",
        name: "Largest Contentful Paint",
        value: "2.8s",
        position: 0.52,
        status: "Needs work",
      },
      {
        label: "CLS",
        name: "Cumulative Layout Shift",
        value: "0.06",
        position: 0.24,
        status: "Good",
      },
      {
        label: "TBT",
        name: "Total Blocking Time",
        value: "410ms",
        position: 0.71,
        status: "Poor",
      },
      {
        label: "INP",
        name: "Interaction to Next Paint",
        value: "180ms",
        position: 0.3,
        status: "Good",
      },
    ],
    opportunities: [
      {
        title: "Defer offscreen images",
        saving: "1.2s",
        impact: "High",
      },
      {
        title: "Eliminate render-blocking resources",
        saving: "620ms",
        impact: "High",
      },
      { title: "Reduce unused JavaScript", saving: "340ms", impact: "Medium" },
    ],
  },
  desktop: {
    score: 94,
    categories: [
      { label: "Performance", value: 94 },
      { label: "Accessibility", value: 92 },
      { label: "Best practices", value: 96 },
      { label: "SEO", value: 100 },
    ],
    vitals: [
      {
        label: "LCP",
        name: "Largest Contentful Paint",
        value: "1.2s",
        position: 0.18,
        status: "Good",
      },
      {
        label: "CLS",
        name: "Cumulative Layout Shift",
        value: "0.03",
        position: 0.12,
        status: "Good",
      },
      {
        label: "TBT",
        name: "Total Blocking Time",
        value: "120ms",
        position: 0.28,
        status: "Good",
      },
      {
        label: "INP",
        name: "Interaction to Next Paint",
        value: "96ms",
        position: 0.16,
        status: "Good",
      },
    ],
    opportunities: [
      {
        title: "Eliminate render-blocking resources",
        saving: "420ms",
        impact: "High",
      },
      {
        title: "Serve images in next-gen formats",
        saving: "210ms",
        impact: "Medium",
      },
      { title: "Reduce unused CSS", saving: "90ms", impact: "Low" },
    ],
  },
};

const toneFor = (v: number) =>
  v >= 90
    ? {
        text: "text-green-400",
        stroke: "#4ade80",
        bar: "from-green-500 to-green-400",
      }
    : v >= 50
      ? {
          text: "text-amber-400",
          stroke: "#fbbf24",
          bar: "from-amber-500 to-amber-400",
        }
      : {
          text: "text-red-400",
          stroke: "#f87171",
          bar: "from-red-500 to-red-400",
        };

const statusTone: Record<string, string> = {
  Good: "text-green-400",
  "Needs work": "text-amber-400",
  Poor: "text-red-400",
};

const impactTone: Record<string, string> = {
  High: "border-pink-400/30 bg-pink-500/10 text-pink-300",
  Medium: "border-amber-400/30 bg-amber-500/10 text-amber-300",
  Low: "border-blue-400/30 bg-blue-500/10 text-blue-300",
};

function ScoreRing({ score }: { score: number }) {
  const [shown, setShown] = useState(0);
  const tone = toneFor(score);
  const radius = 62;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(score);
      return;
    }
    let raf: number;
    const start = performance.now();
    const from = shown;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 900);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(from + (score - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  return (
    <div className="relative w-40 h-40">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 150 150">
        <circle
          cx="75"
          cy="75"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="8"
        />
        <circle
          cx="75"
          cy="75"
          r={radius}
          fill="none"
          stroke={tone.stroke}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - shown / 100)}
          style={{ transition: "stroke 400ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-5xl font-bold tabular-nums ${tone.text}`}>
          {shown}
        </span>
        <span className="text-[10px] text-gray-500 mt-1">out of 100</span>
      </div>
    </div>
  );
}

export default function SampleResult() {
  const [device, setDevice] = useState<Device>("desktop");
  const data = DATA[device];
  const ref = useRef<HTMLElement>(null);

  return (
    <section ref={ref} id="metrics" className="max-w-7xl mx-auto px-6 py-24">
      <div className="max-w-xl mb-12">
        <span className="inline-block w-10 h-[2px] bg-pink-500 mb-6" />
        <h2 className="text-4xl font-bold tracking-tight">
          What a report looks like
        </h2>
        <p className="text-gray-400 mt-4 leading-relaxed">
          This is a real audit of vercel.com. Switch devices to see how much the
          picture changes.
        </p>
      </div>

      <div className="rounded-2xl border border-blue-400/15 bg-gradient-to-b from-[#0a1c31] to-[#050f1e] overflow-hidden">
        {/* Report header */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 border-b border-white/5">
          <div>
            <p className="font-mono text-sm text-gray-300">
              https://vercel.com
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Analyzed just now · Lighthouse 12
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div
              role="tablist"
              aria-label="Device"
              className="flex p-1 rounded-lg bg-white/[0.03] border border-white/10"
            >
              {[
                { id: "mobile" as Device, Icon: Smartphone, label: "Mobile" },
                { id: "desktop" as Device, Icon: Monitor, label: "Desktop" },
              ].map(({ id, Icon, label }) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={device === id}
                  onClick={() => setDevice(id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60
                    ${
                      device === id
                        ? "bg-blue-500/20 text-blue-200 border border-blue-400/40"
                        : "text-gray-400 hover:text-gray-200 border border-transparent"
                    }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-gray-300 border border-white/10 hover:border-white/25 transition">
              <Share2 className="w-3.5 h-3.5" />
              Share
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_1fr] gap-10 p-6 lg:p-8">
          {/* Score */}
          <div className="flex flex-col items-center lg:items-start">
            <p className="text-xs text-gray-500 mb-5">Performance</p>
            <ScoreRing score={data.score} />
            <p className="text-sm text-gray-400 mt-5 max-w-[180px] text-center lg:text-left leading-relaxed">
              {device === "desktop"
                ? "Faster than most sites on desktop connections."
                : "Slower on mobile, where most of the traffic is."}
            </p>
          </div>

          {/* Categories */}
          <div>
            <p className="text-xs text-gray-500 mb-5">Categories</p>
            <div className="space-y-5">
              {data.categories.map((c) => {
                const tone = toneFor(c.value);
                return (
                  <div key={c.label}>
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-sm text-gray-300">{c.label}</span>
                      <span
                        className={`text-sm font-semibold tabular-nums ${tone.text}`}
                      >
                        {c.value}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${tone.bar}`}
                        style={{
                          width: `${c.value}%`,
                          transition: "width 700ms cubic-bezier(0.4,0,0.2,1)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Vitals */}
          <div>
            <p className="text-xs text-gray-500 mb-5">Core Web Vitals</p>
            <div className="space-y-5">
              {data.vitals.map((v) => (
                <div key={v.label}>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-sm text-gray-300">
                      {v.label}
                      <span className="hidden xl:inline text-gray-600 text-xs ml-2">
                        {v.name}
                      </span>
                    </span>
                    <span className="text-sm font-mono text-gray-200">
                      {v.value}
                    </span>
                  </div>

                  {/* threshold rail */}
                  <div className="relative h-1.5 rounded-full overflow-hidden flex">
                    <span className="h-full flex-[0.4] bg-green-500/25" />
                    <span className="h-full flex-[0.25] bg-amber-500/25" />
                    <span className="h-full flex-[0.35] bg-red-500/25" />
                    <span
                      className="absolute top-1/2 w-2.5 h-2.5 -translate-y-1/2 -translate-x-1/2 rounded-full bg-white ring-2 ring-[#050f1e]"
                      style={{
                        left: `${v.position * 100}%`,
                        transition: "left 700ms cubic-bezier(0.4,0,0.2,1)",
                      }}
                    />
                  </div>

                  <p className={`text-[11px] mt-1.5 ${statusTone[v.status]}`}>
                    {v.status}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Opportunities */}
        <div className="border-t border-white/5 px-6 lg:px-8 py-6">
          <p className="text-xs text-gray-500 mb-4">
            Top opportunities on {device}
          </p>
          <ul className="divide-y divide-white/5">
            {data.opportunities.map((o) => (
              <li
                key={o.title}
                className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
              >
                <span
                  className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-medium border ${impactTone[o.impact]}`}
                >
                  {o.impact}
                </span>
                <span className="text-sm text-gray-300 flex-1 min-w-0 truncate">
                  {o.title}
                </span>
                <span className="font-mono text-sm text-gray-400 tabular-nums">
                  −{o.saving}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer CTA */}
        <div className="border-t border-white/5 px-6 lg:px-8 py-5">
          <button className="group flex items-center gap-2 text-sm font-medium text-pink-400 hover:text-pink-300 transition">
            Run this on your own site
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
}
