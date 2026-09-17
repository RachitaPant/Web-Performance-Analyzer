"use client";

import {
  FileJson,
  Smartphone,
  Target,
  Feather,
  type LucideIcon,
} from "lucide-react";

/* A small waterfall bar chart used in the wide cell */
function Waterfall() {
  const rows = [
    { label: "document", start: 0, width: 18, tone: "bg-blue-400/70" },
    { label: "app.css", start: 16, width: 22, tone: "bg-cyan-400/70" },
    { label: "vendor.js", start: 30, width: 44, tone: "bg-pink-400/70" },
    { label: "hero.webp", start: 38, width: 30, tone: "bg-purple-400/70" },
    { label: "analytics.js", start: 62, width: 26, tone: "bg-amber-400/70" },
  ];

  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3">
          <span className="w-20 shrink-0 font-mono text-[10px] text-gray-500 truncate">
            {r.label}
          </span>
          <div className="relative flex-1 h-2 rounded-full bg-white/[0.04]">
            <span
              className={`absolute top-0 h-full rounded-full ${r.tone}`}
              style={{ left: `${r.start}%`, width: `${r.width}%` }}
            />
          </div>
        </div>
      ))}
      <div className="flex justify-between pt-1 font-mono text-[9px] text-gray-600">
        <span>0s</span>
        <span>1.0s</span>
        <span>2.0s</span>
      </div>
    </div>
  );
}

function Cell({
  className = "",
  icon: Icon,
  title,
  description,
  children,
}: {
  className?: string;
  icon: LucideIcon;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`group relative rounded-2xl border border-blue-400/15 bg-gradient-to-b from-[#0a1c31] to-[#061426]
        p-6 flex flex-col overflow-hidden
        hover:border-blue-400/35 transition-colors duration-300 ${className}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="w-8 h-8 rounded-lg border border-blue-400/25 bg-blue-500/10 text-blue-300 flex items-center justify-center">
          <Icon className="w-4 h-4" />
        </span>
        <h3 className="font-semibold text-[15px]">{title}</h3>
      </div>

      <p className="text-sm text-gray-400 leading-relaxed max-w-[42ch]">
        {description}
      </p>

      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}

export default function BuiltForDevelopers() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-24">
      <div className="max-w-xl mb-12">
        <span className="inline-block w-10 h-[2px] bg-pink-500 mb-6" />
        <h2 className="text-4xl font-bold tracking-tight">
          More than just a score
        </h2>
        <p className="text-gray-400 mt-4 leading-relaxed">
          A number tells you something is wrong. These tell you what to change.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:auto-rows-[minmax(0,1fr)]">
        {/* Wide cell */}
        <Cell
          className="md:col-span-2"
          icon={FileJson}
          title="The full audit payload"
          description="Request waterfalls, diagnostics and metric breakdowns — the same data Lighthouse produces, laid out so you can read it."
        >
          <Waterfall />
        </Cell>

        {/* Tall-ish cell */}
        <Cell
          icon={Smartphone}
          title="Mobile and desktop side by side"
          description="Most sites pass on desktop and fail on mobile. See both runs against the same URL."
        >
          <div className="space-y-3">
            {[
              { label: "Desktop", value: 94, tone: "bg-green-400" },
              { label: "Mobile", value: 78, tone: "bg-amber-400" },
            ].map((r) => (
              <div key={r.label}>
                <div className="flex justify-between text-[11px] mb-1.5">
                  <span className="text-gray-500">{r.label}</span>
                  <span className="text-gray-300 tabular-nums font-mono">
                    {r.value}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.06]">
                  <div
                    className={`h-full rounded-full ${r.tone}`}
                    style={{ width: `${r.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Cell>

        {/* Narrow cell */}
        <Cell
          icon={Target}
          title="Fixes, not warnings"
          description="Each finding names the resource and the time you get back."
        >
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 font-mono text-[10px] leading-relaxed">
            <p className="text-gray-500">/_next/static/vendor.js</p>
            <p className="text-pink-300 mt-1">defer → saves 420ms</p>
          </div>
        </Cell>

        {/* Wide cell */}
        <Cell
          className="md:col-span-2"
          icon={Feather}
          title="Nothing to install"
          description="No agent, no snippet, no build step. Paste a URL and the audit runs against Google's infrastructure — which means results you can point your team at without arguing about the setup."
        >
          <div className="flex flex-wrap gap-2">
            {[
              "No script tag",
              "No SDK",
              "No CI config",
              "No account needed",
            ].map((chip) => (
              <span
                key={chip}
                className="px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-xs text-gray-400"
              >
                {chip}
              </span>
            ))}
          </div>
        </Cell>
      </div>
    </section>
  );
}
