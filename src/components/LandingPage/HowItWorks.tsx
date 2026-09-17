"use client";

import { useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------
   Mini mockups — each one is a tiny abstraction of that step's screen
------------------------------------------------------------------ */

function ShellCard({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent: string;
}) {
  return (
    <div
      className={`relative w-[148px] h-[132px] rounded-2xl border ${accent}
        bg-gradient-to-b from-[#0b1f36] to-[#061426]
        p-3 shadow-[0_20px_40px_-24px_rgba(0,0,0,0.9)]`}
    >
      {children}
    </div>
  );
}

function EnterUrlMock() {
  return (
    <ShellCard accent="border-blue-400/25">
      <div className="h-6 rounded-md bg-blue-500/15 border border-blue-400/25 flex items-center px-2 gap-1.5">
        <span className="w-1 h-1 rounded-full bg-blue-400" />
        <span className="h-1.5 w-14 rounded-full bg-blue-400/40" />
      </div>
      <div className="mt-3 flex gap-2">
        <span className="h-5 flex-1 rounded-md bg-white/[0.04] border border-white/10" />
        <span className="h-5 flex-1 rounded-md bg-white/[0.04] border border-white/10" />
      </div>
      <div className="mt-3 h-1.5 w-20 rounded-full bg-white/10" />
      <div className="mt-2 h-1.5 w-12 rounded-full bg-white/[0.07]" />
      <div className="mt-3 h-6 rounded-md bg-gradient-to-r from-pink-500 to-pink-600" />
    </ShellCard>
  );
}

function AnalyzeMock() {
  return (
    <ShellCard accent="border-cyan-400/25">
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        <span className="h-1.5 w-10 rounded-full bg-cyan-400/40" />
      </div>
      <div className="mt-3 space-y-2">
        {[80, 55, 92, 40].map((w, i) => (
          <div key={i} className="h-1.5 rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
              style={{ width: `${w}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-end gap-1 h-8">
        {[40, 70, 45, 90, 60, 80].map((h, i) => (
          <span
            key={i}
            className="flex-1 rounded-sm bg-cyan-400/30"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </ShellCard>
  );
}

function InsightsMock() {
  return (
    <ShellCard accent="border-purple-400/25">
      <div className="flex items-center gap-3">
        <div className="relative w-10 h-10 rounded-full border-[3px] border-white/[0.07]">
          <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-green-400 border-r-green-400 rotate-45" />
          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-green-400">
            94
          </span>
        </div>
        <div className="flex-1 space-y-1.5">
          <span className="block h-1.5 w-full rounded-full bg-white/10" />
          <span className="block h-1.5 w-2/3 rounded-full bg-white/[0.07]" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {["bg-green-400/60", "bg-blue-400/60", "bg-pink-400/60"].map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${c}`} />
            <span className="h-1.5 flex-1 rounded-full bg-white/[0.06]" />
            <span className="h-1.5 w-4 rounded-full bg-white/10" />
          </div>
        ))}
      </div>
    </ShellCard>
  );
}

function FixMock() {
  return (
    <ShellCard accent="border-pink-400/25">
      <div className="space-y-2.5">
        {[true, true, false].map((done, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className={`w-3.5 h-3.5 rounded-[5px] flex items-center justify-center text-[8px] font-bold
                ${
                  done
                    ? "bg-green-500/20 border border-green-400/40 text-green-400"
                    : "bg-white/[0.04] border border-white/10 text-transparent"
                }`}
            >
              ✓
            </span>
            <span
              className={`h-1.5 rounded-full ${done ? "bg-white/[0.07] w-16" : "bg-white/10 w-20"}`}
            />
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-lg border border-green-400/20 bg-green-500/[0.06] p-2">
        <div className="flex items-center justify-between">
          <span className="h-1.5 w-10 rounded-full bg-green-400/40" />
          <span className="text-[9px] font-mono text-green-400">+18</span>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-white/[0.06]">
          <div className="h-full w-[88%] rounded-full bg-gradient-to-r from-green-400 to-cyan-400" />
        </div>
      </div>
    </ShellCard>
  );
}

/* ------------------------------------------------------------------ */

const STEPS = [
  {
    label: "Enter URL",
    desc: "Paste any public address and pick mobile or desktop.",
    mock: <EnterUrlMock />,
    lift: "md:mt-24",
  },
  {
    label: "We analyze",
    desc: "A full Lighthouse run against Google's infrastructure.",
    mock: <AnalyzeMock />,
    lift: "md:mt-8",
  },
  {
    label: "Read the findings",
    desc: "Scores, vitals and the bottlenecks behind them.",
    mock: <InsightsMock />,
    lift: "md:mt-20",
  },
  {
    label: "Ship the fix",
    desc: "Work the list top down and watch the score climb.",
    mock: <FixMock />,
    lift: "md:mt-0",
  },
];

export default function HowItWorks() {
  const ref = useRef<HTMLElement>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDrawn(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setDrawn(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      id="how"
      className="max-w-7xl mx-auto px-6 py-24 overflow-hidden"
    >
      <div className="text-center max-w-xl mx-auto mb-4">
        <span className="inline-block w-10 h-[2px] bg-pink-500 mb-6" />
        <h2 className="text-4xl font-bold tracking-tight">How it works</h2>
        <p className="text-gray-400 mt-4 leading-relaxed">
          Four steps from a URL you're worried about to a faster site. No setup,
          no agent to install.
        </p>
      </div>

      <div className="relative mt-20">
        {/* Dashed connector — desktop only */}
        <svg
          className="hidden md:block absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 1200 420"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M 150 250 C 240 120, 330 130, 420 190
               S 600 340, 720 250
               S 900 110, 1050 170"
            fill="none"
            stroke="url(#howGradient)"
            strokeWidth="2"
            strokeDasharray="7 9"
            strokeLinecap="round"
            style={{
              strokeDashoffset: drawn ? 0 : 1600,
              transition: "stroke-dashoffset 2.2s cubic-bezier(0.4,0,0.2,1)",
            }}
            pathLength={1600}
          />
          <defs>
            <linearGradient id="howGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
              <stop offset="35%" stopColor="#22d3ee" stopOpacity="0.55" />
              <stop offset="75%" stopColor="#ec4899" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.15" />
            </linearGradient>
          </defs>
        </svg>

        <ol className="relative grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 md:gap-6">
          {STEPS.map((step, i) => (
            <li
              key={step.label}
              className={`flex flex-col items-center text-center ${step.lift}`}
              style={{
                opacity: drawn ? 1 : 0,
                transform: drawn ? "none" : "translateY(14px)",
                transition: `opacity 600ms ease ${i * 140}ms, transform 600ms ease ${i * 140}ms`,
              }}
            >
              {step.mock}

              <h3 className="mt-6 font-semibold text-[15px]">{step.label}</h3>
              <p className="mt-2 text-sm text-gray-400 leading-relaxed max-w-[200px]">
                {step.desc}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
