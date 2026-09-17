"use client";

import { useState } from "react";
import Link from "next/link";
import { Zap } from "lucide-react";
import FeatureCarousel from "./FeatureCarousal";
import HowItWorks from "./HowItWorks";
import SampleResult from "./SampleResult";
import BuiltForDevelopers from "./BuiltForDevelopers";

export default function LandingPage() {
  const [url, setUrl] = useState("");
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");

  const handleAnalyze = () => {
    if (url) {
      const encoded = encodeURIComponent(url);
      window.location.href = `/login?url=${encoded}&device=${device}`;
    }
  };

  const handleCtaAnalyze = () => {
    const inputElement = document.querySelector(
      'input[placeholder="https://example.com"]',
    ) as HTMLInputElement;
    if (inputElement?.value) {
      handleAnalyze();
    } else {
      window.location.href = "/login";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#020e1d] via-[#0a1929] to-[#020e1d] text-white">
      {/* Header */}
      <header className="border-b border-blue-500/20 bg-[#020e1d]/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-pink-500" />
            <span className="text-lg font-bold">SitePulse</span>
            <span className="text-xs text-gray-400 ml-1">SPEED MATTERS</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-gray-300 hover:text-white transition"
            >
              Features
            </a>
            <a
              href="#how"
              className="text-gray-300 hover:text-white transition"
            >
              How it works
            </a>
            <a
              href="#metrics"
              className="text-gray-300 hover:text-white transition"
            >
              Metrics
            </a>
            <a
              href="#about"
              className="text-gray-300 hover:text-white transition"
            >
              About
            </a>
          </nav>

          <Link href="/login">
            <button className="bg-gradient-to-r from-pink-500 to-pink-600 px-6 py-2 rounded-full font-semibold hover:shadow-lg hover:shadow-pink-500/50 transition">
              Run an Audit →
            </button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-blue-400 text-sm font-semibold mb-4">
              REAL INSIGHTS. FASTER WEBSITES.
            </p>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Know why your website is{" "}
              <span className="text-pink-500">slow.</span>
            </h1>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              SitePulse runs website performance audits, analyzes Lighthouse
              data to identify bottlenecks and optimization opportunities, and
              turns the findings into prioritized, developer-ready
              recommendations.
            </p>

            <div className="space-y-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1 bg-blue-950/40 border border-blue-500/50 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-400"
                  onKeyPress={(e) => e.key === "Enter" && handleAnalyze()}
                />
                <button
                  onClick={handleAnalyze}
                  className="bg-gradient-to-r from-pink-500 to-pink-600 px-8 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-pink-500/50 transition"
                >
                  Analyze →
                </button>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setDevice("mobile")}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    device === "mobile"
                      ? "bg-blue-500/30 border border-blue-400 text-blue-200"
                      : "bg-blue-950/20 border border-blue-500/30 text-gray-400 hover:border-blue-400"
                  }`}
                >
                  📱 Mobile
                </button>
                <button
                  onClick={() => setDevice("desktop")}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    device === "desktop"
                      ? "bg-blue-500/30 border border-blue-400 text-blue-200"
                      : "bg-blue-950/20 border border-blue-500/30 text-gray-400 hover:border-blue-400"
                  }`}
                >
                  💻 Desktop
                </button>
              </div>

              <p className="text-sm text-gray-500">
                No installation. No signup. Just real insights.
              </p>
            </div>
          </div>

          {/* Hero Visual */}

          <div className="relative hero-audit-visual">
            {/* Ambient glow */}
            <div className="absolute -inset-10 bg-blue-500/5 rounded-full blur-3xl" />

            <div className="relative overflow-hidden rounded-2xl border border-blue-500/25 bg-[#061426]/90 backdrop-blur-xl shadow-2xl shadow-blue-950/40">
              {/* Top bar */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-blue-500/15">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-400/70" />
                    <span className="w-2 h-2 rounded-full bg-yellow-400/70" />
                    <span className="w-2 h-2 rounded-full bg-green-400/70" />
                  </div>

                  <span className="text-xs text-gray-500 font-mono">
                    sitepulse / audit
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-blue-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  Running
                </div>
              </div>

              <div className="p-5">
                {/* URL */}
                <div className="audit-url mb-6">
                  <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-950/40 border border-blue-500/20">
                    <span className="text-blue-400 text-xs font-mono">GET</span>
                    <span className="text-sm text-gray-300 font-mono truncate">
                      https://example.com
                    </span>

                    <span className="ml-auto text-[10px] text-gray-500 font-mono">
                      200 OK
                    </span>
                  </div>
                </div>

                {/* Pipeline */}
                <div className="relative mb-7">
                  <div className="absolute left-[10px] right-[10px] top-[10px] h-px bg-blue-500/20" />

                  <div className="audit-progress-line absolute top-[8px] left-0 h-[4px] w-10 rounded-full" />

                  <div className="relative flex justify-between">
                    {["Audit", "Collect", "Analyze", "Findings", "Report"].map(
                      (label, i) => (
                        <div
                          key={label}
                          className={`audit-node audit-node-${i} flex flex-col items-center gap-2`}
                        >
                          <div className="audit-node-dot w-5 h-5 rounded-full border border-blue-500/30 bg-[#061426] flex items-center justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                          </div>

                          <span className="text-[9px] text-gray-500">
                            {label}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <AuditMetric
                    label="Performance"
                    value="94"
                    unit="/100"
                    accent="blue"
                    delay="0s"
                  />

                  <AuditMetric
                    label="LCP"
                    value="1.2"
                    unit="s"
                    accent="purple"
                    delay="0.4s"
                  />

                  <AuditMetric
                    label="CLS"
                    value="0.03"
                    unit=""
                    accent="pink"
                    delay="0.8s"
                  />

                  <AuditMetric
                    label="TBT"
                    value="120"
                    unit="ms"
                    accent="cyan"
                    delay="1.2s"
                  />
                </div>

                {/* Finding */}
                <div className="audit-finding rounded-lg border border-pink-500/15 bg-pink-500/[0.04] p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded-md bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                      <span className="text-pink-400 text-[10px]">!</span>
                    </div>

                    <span className="text-xs font-semibold text-gray-300">
                      Optimization opportunity
                    </span>

                    <span className="ml-auto text-[9px] text-pink-400 uppercase tracking-wider">
                      High impact
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-500">
                      Render-blocking resources
                    </span>

                    <span className="text-[10px] text-gray-400 font-mono">
                      −420ms
                    </span>
                  </div>
                </div>

                {/* Bottom status */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-blue-500/10">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    <span className="text-[10px] text-gray-500">
                      18 metrics analyzed
                    </span>
                  </div>

                  <span className="text-[10px] text-gray-600 font-mono">
                    1.84s
                  </span>
                </div>
              </div>

              {/* Scanning line */}
              <div className="audit-scan-line" />
            </div>

            {/* Floating diagnostic */}
            <div className="audit-floating absolute -right-4 top-12 hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg border border-blue-400/20 bg-[#08182b]/95 shadow-xl">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span className="text-[10px] text-gray-400">
                Bottleneck detected
              </span>
            </div>

            {/* Floating score */}
            <div className="audit-score absolute -left-5 bottom-10 hidden lg:block px-3 py-2 rounded-lg border border-pink-500/20 bg-[#08182b]/95 shadow-xl">
              <span className="block text-[9px] text-gray-600 uppercase tracking-wider">
                Score
              </span>
              <span className="text-lg font-bold text-pink-400">94</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <div id="features">
        <FeatureCarousel />
      </div>

      {/* How It Works */}
      <HowItWorks />

      {/* Sample Results */}
      <SampleResult />
      {/* Features Section */}

      <BuiltForDevelopers />
      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <p className="text-blue-400 text-sm font-semibold mb-4">
          SPEED FUELS BETTER EXPERIENCES
        </p>
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          Ready to analyze <span className="text-pink-500">your website?</span>
        </h2>
        <p className="text-gray-400 mb-8 text-lg">
          Get real insights. Fix issues. Build a faster web.
        </p>

        <div className="flex gap-3 max-w-md mx-auto">
          <input
            type="text"
            placeholder="https://example.com"
            defaultValue={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 bg-blue-950/40 border border-blue-500/50 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-400"
            onKeyPress={(e) => e.key === "Enter" && handleCtaAnalyze()}
          />
          <button
            onClick={handleCtaAnalyze}
            className="bg-gradient-to-r from-pink-500 to-pink-600 px-8 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-pink-500/50 transition"
          >
            Analyze Now →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-blue-500/20 bg-[#020e1d] py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-pink-500" />
                <span className="font-bold">SitePulse</span>
              </div>
              <p className="text-sm text-gray-500">Speed matters</p>
            </div>
            <div>
              <p className="font-semibold mb-4">Features</p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Lighthouse
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Insights
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-4">Company</p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition">
                    GitHub
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Twitter
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-4">Legal</p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-blue-500/20 pt-8 text-center text-sm text-gray-500">
            <p>Built with ❤️ for a faster web.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function AuditMetric({
  label,
  value,
  unit,
  accent,
  delay,
}: {
  label: string;
  value: string;
  unit: string;
  accent: "blue" | "purple" | "pink" | "cyan";
  delay: string;
}) {
  const accents = {
    blue: "border-blue-500/20",
    purple: "border-purple-500/20",
    pink: "border-pink-500/20",
    cyan: "border-cyan-500/20",
  };

  return (
    <div
      className={`audit-metric rounded-lg border ${accents[accent]} bg-white/[0.02] p-3`}
      style={{ animationDelay: delay }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-gray-500 uppercase tracking-wider">
          {label}
        </span>

        <span className="w-1 h-1 rounded-full bg-green-400/70" />
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-xl font-semibold text-gray-200 font-mono">
          {value}
        </span>

        {unit && (
          <span className="text-[10px] text-gray-600 font-mono">{unit}</span>
        )}
      </div>
    </div>
  );
}
