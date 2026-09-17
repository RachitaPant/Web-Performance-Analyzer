"use client";

import {
  Share2,
  Download,
  Save,
  ExternalLink,
  Activity,
} from "lucide-react";

export default function DashboardResults() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold">vercel.com</h1>
            <ExternalLink className="w-5 h-5 text-gray-400 cursor-pointer" />
          </div>
          <p className="text-sm text-gray-400">
            Last analyzed · 16 Sept 2026, 01:24 AM
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-blue-500/30 rounded-lg text-sm hover:border-blue-400 transition flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Share
          </button>
          <button className="px-4 py-2 border border-blue-500/30 rounded-lg text-sm hover:border-blue-400 transition flex items-center gap-2">
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          <button className="px-4 py-2 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-pink-500/50 transition flex items-center gap-2">
            <Save className="w-4 h-4" />
            Save Report
          </button>
        </div>
      </div>

      {/* Device Tabs */}
      <div className="flex gap-2 border-b border-blue-500/20">
        <button className="px-4 py-3 border-b-2 border-blue-400 text-blue-300 font-semibold">
          📱 Mobile
        </button>
        <button className="px-4 py-3 text-gray-400 hover:text-white transition">
          💻 Desktop
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Performance Score */}
        <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-500/20 rounded-xl p-8">
          <h2 className="text-sm text-gray-400 mb-6">Performance Score</h2>
          <div className="flex flex-col items-center">
            <div className="w-40 h-40 mb-6 rounded-full border-8 border-green-500 flex items-center justify-center bg-gradient-to-br from-green-500/10 to-green-500/5">
              <div className="text-center">
                <div className="text-5xl font-bold text-green-400">94</div>
                <div className="text-xs text-gray-400">/100</div>
              </div>
            </div>
            <p className="text-center">
              <span className="font-semibold text-green-400">Excellent</span>
            </p>
            <p className="text-sm text-gray-400 text-center mt-2">
              Your site is faster than 94% of all websites analyzed by Lighthouse.
            </p>
          </div>
        </div>

        {/* Middle Column - Category Scores */}
        <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-500/20 rounded-xl p-8">
          <h2 className="text-sm text-gray-400 mb-6">Category Scores</h2>
          <div className="space-y-3">
            <CategoryScore label="Performance" value={94} color="green" />
            <CategoryScore label="Accessibility" value={92} color="blue" />
            <CategoryScore label="Best Practices" value={96} color="pink" />
            <CategoryScore label="SEO" value={100} color="purple" />
          </div>
        </div>

        {/* Right Column - Opportunities */}
        <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-500/20 rounded-xl p-8">
          <h2 className="text-sm text-gray-400 mb-6">What to fix first</h2>
          <p className="text-xs text-gray-500 mb-4">
            Top opportunities to improve your score.
          </p>
          <div className="space-y-4">
            <OpportunityCard
              number={1}
              title="Reduce unused JavaScript"
              savings="+8 pts"
              detail="Potential savings: 420 KiB"
            />
            <OpportunityCard
              number={2}
              title="Properly size images"
              savings="+4 pts"
              detail="Potential savings: 280 KiB"
            />
            <OpportunityCard
              number={3}
              title="Eliminate render-blocking resources"
              savings="+3 pts"
              detail="Potential savings: 180 KiB"
            />
          </div>
        </div>
      </div>

      {/* Core Web Vitals */}
      <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-500/20 rounded-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="w-5 h-5 text-blue-400" />
          <div>
            <h2 className="text-lg font-semibold">Core Web Vitals</h2>
            <p className="text-xs text-gray-400">Key performance metrics that matter.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <MetricCard
            icon="🎯"
            label="LCP"
            value="1.2s"
            description="Largest Contentful Paint"
            status="Good"
          />
          <MetricCard
            icon="👆"
            label="INP"
            value="89ms"
            description="Interaction to Next Paint"
            status="Good"
          />
          <MetricCard
            icon="📐"
            label="CLS"
            value="0.03"
            description="Cumulative Layout Shift"
            status="Good"
          />
          <MetricCard
            icon="⏱️"
            label="TBT"
            value="120ms"
            description="Total Blocking Time"
            status="Good"
          />
        </div>

        <a href="#" className="text-blue-400 hover:text-blue-300 transition text-sm inline-block mt-4">
          Learn more →
        </a>
      </div>

      {/* Performance Timeline */}
      <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-500/20 rounded-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold">Performance Timeline</h2>
            <p className="text-xs text-gray-400">Visualize how your page loads.</p>
          </div>
          <select className="bg-blue-950/40 border border-blue-500/30 rounded px-3 py-1 text-sm">
            <option>Filmstrip view</option>
          </select>
        </div>

        {/* Simple timeline chart placeholder */}
        <div className="bg-blue-950/20 rounded-lg p-6 min-h-64 flex items-end justify-around gap-2">
          {[30, 45, 60, 50, 70, 85, 95].map((height, i) => (
            <div key={i} className="flex-1 space-y-1">
              <div
                className="w-full bg-gradient-to-t from-pink-500 to-blue-500 rounded-t-lg"
                style={{ height: `${height * 2}px` }}
              ></div>
              <div className="text-xs text-center text-gray-500">{i}s</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-5 gap-2 mt-4 text-xs text-gray-400">
          <div>HTML</div>
          <div>CSS</div>
          <div>JS</div>
          <div>Images</div>
          <div>Other</div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Page Preview */}
        <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-500/20 rounded-xl p-8">
          <h2 className="text-lg font-semibold mb-4">Page Preview</h2>
          <p className="text-xs text-gray-400 mb-4">How the analyzed page looks.</p>
          <div className="bg-blue-950/40 rounded-lg p-2 aspect-video flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl mb-2">📱</div>
              <p className="text-xs text-gray-500">vercel.com preview</p>
            </div>
          </div>
        </div>

        {/* Audit Details */}
        <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-500/20 rounded-xl p-8">
          <h2 className="text-lg font-semibold mb-6">Audit Details</h2>
          <div className="space-y-4">
            <DetailRow label="URL" value="https://vercel.com" />
            <DetailRow label="Device" value="Mobile" />
            <DetailRow label="Lighthouse Version" value="12.2.0" />
            <DetailRow label="Analysis Time" value="2 min 14 sec" />
            <DetailRow label="Tested From" value="United States" />
            <DetailRow
              label="Category"
              value="Performance, Accessibility, Best Practices, SEO"
            />
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10 border border-pink-500/30 rounded-xl p-12 text-center">
        <div className="flex justify-center mb-4">
          <div className="text-5xl">⚡</div>
        </div>
        <h2 className="text-2xl font-bold mb-2">Turn insights into a faster website.</h2>
        <p className="text-gray-400 mb-6">
          Fix issues, improve user experience and keep tracking progress.
        </p>
        <button className="bg-gradient-to-r from-pink-500 to-pink-600 px-8 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-pink-500/50 transition">
          Run Another Audit →
        </button>
      </div>

      {/* Footer Note */}
      <div className="text-center text-sm text-gray-500 py-4">
        <p>&quot;Good performance is a feature.&quot;</p>
        <p>— Alex Russell</p>
      </div>
    </div>
  );
}

function CategoryScore({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "green" | "blue" | "pink" | "purple";
}) {
  const colors = {
    green: "bg-green-500/20 border-green-500/50 text-green-400",
    blue: "bg-blue-500/20 border-blue-500/50 text-blue-400",
    pink: "bg-pink-500/20 border-pink-500/50 text-pink-400",
    purple: "bg-purple-500/20 border-purple-500/50 text-purple-400",
  };

  return (
    <div
      className={`flex justify-between items-center p-3 border rounded-lg ${colors[color]}`}
    >
      <span className="text-sm">{label}</span>
      <span className="font-bold text-lg">{value}</span>
    </div>
  );
}

function OpportunityCard({
  number,
  title,
  savings,
  detail,
}: {
  number: number;
  title: string;
  savings: string;
  detail: string;
}) {
  return (
    <div className="flex gap-3 p-3 bg-blue-950/30 rounded-lg hover:bg-blue-950/50 transition cursor-pointer">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-500/20 border border-pink-500/50 flex items-center justify-center text-pink-400 font-bold text-sm">
        {number}
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-gray-500">{detail}</p>
      </div>
      <div className="text-pink-400 font-semibold text-sm whitespace-nowrap">{savings}</div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  description,
  status,
}: {
  icon: string;
  label: string;
  value: string;
  description: string;
  status: string;
}) {
  return (
    <div className="bg-blue-950/30 border border-blue-500/30 rounded-lg p-4">
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-sm font-semibold">{label}</p>
      <p className="text-2xl font-bold text-blue-300 my-1">{value}</p>
      <p className="text-xs text-gray-500 mb-2">{description}</p>
      <span className="text-xs text-green-400 font-semibold">{status}</span>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-blue-500/10 last:border-0">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-sm text-right max-w-xs">{value}</span>
    </div>
  );
}
