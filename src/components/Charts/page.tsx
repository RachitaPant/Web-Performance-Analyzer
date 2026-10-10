import { Graph } from "../Graph/page";
import type { Report } from "@/lib/report";
import { NO_RATING_STYLE, RATING_STYLES, ratingFromScore } from "@/lib/format";

interface ChartsProps {
  report: Report;
}

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const styleFor = (score: number | null) => {
  const rating = ratingFromScore(score == null ? null : score / 100);
  return rating ? RATING_STYLES[rating] : NO_RATING_STYLE;
};

const Charts: React.FC<ChartsProps> = ({ report }) => {
  const { categories } = report;
  const performance = categories.performance;
  const perfStyle = styleFor(performance);

  const rows = [
    { label: "Performance", score: categories.performance },
    { label: "Accessibility", score: categories.accessibility },
    { label: "Best Practices", score: categories.bestPractices },
    { label: "SEO", score: categories.seo },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      <Graph site={report.url} strategy={report.strategy} current={report} />

      <div className="dash-card animate-fade-up p-4" style={{ animationDelay: "80ms" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Lighthouse Categories</h3>
          <span className="text-[10px] text-gray-500">v{report.lighthouseVersion}</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative w-40 h-40 shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r={RADIUS} fill="transparent" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
              <circle
                cx="50"
                cy="50"
                r={RADIUS}
                fill="transparent"
                stroke={perfStyle.stroke}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${(CIRCUMFERENCE * (performance ?? 0)) / 100} ${CIRCUMFERENCE}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${perfStyle.text}`}>{performance ?? "–"}</span>
              <span className="text-[9px] tracking-wide text-gray-400">PERFORMANCE</span>
            </div>
          </div>

          <div className="flex-1 grid gap-3">
            {rows.map(({ label, score }) => {
              const s = styleFor(score);
              return (
                <div key={label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-white">{label}</span>
                    <span className={`font-semibold ${s.text}`}>{score ?? "N/A"}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${score ?? 0}%`, backgroundColor: s.stroke }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Charts;
