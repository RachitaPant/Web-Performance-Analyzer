import React from "react";
import type { LabMetric, Report } from "@/lib/report";
import { NO_RATING_STYLE, RATING_STYLES, formatMs, ratingFromScore } from "@/lib/format";

interface StatsProps {
  report: Report;
}

// Lab metrics from the Lighthouse run. INP needs real users, so it lives in the field-data card.
const StatsCards: React.FC<StatsProps> = ({ report }) => {
  const { lab, categories, strategy } = report;
  const performanceScore = categories.performance;

  const cards: { title: string; hint: string; metric: LabMetric; format?: (m: LabMetric) => string }[] = [
    { title: "Largest Contentful Paint", hint: "When the main content is visible", metric: lab.lcp },
    { title: "Total Blocking Time", hint: "Lab proxy for responsiveness (INP)", metric: lab.tbt },
    {
      title: "Cumulative Layout Shift",
      hint: "Visual stability",
      metric: lab.cls,
      format: (m) => (m.value == null ? "N/A" : m.value.toFixed(3)),
    },
    { title: "First Contentful Paint", hint: "When anything first renders", metric: lab.fcp },
    { title: "Speed Index", hint: "How quickly content fills in", metric: lab.speedIndex },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <StatCard
        index={0}
        title={`Performance (${strategy})`}
        hint="Lighthouse performance score"
        value={performanceScore == null ? "N/A" : `${performanceScore}`}
        unit="/100"
        score={performanceScore == null ? null : performanceScore / 100}
      />
      {cards.map((c, i) => (
        <StatCard
          key={c.title}
          index={i + 1}
          title={c.title}
          hint={c.hint}
          value={c.format ? c.format(c.metric) : formatMs(c.metric.value)}
          score={c.metric.score}
        />
      ))}
    </div>
  );
};

interface StatCardProps {
  index: number;
  title: string;
  hint: string;
  value: string;
  unit?: string;
  score: number | null;
}

const StatCard: React.FC<StatCardProps> = ({ index, title, hint, value, unit, score }) => {
  const rating = ratingFromScore(score);
  const style = rating ? RATING_STYLES[rating] : NO_RATING_STYLE;

  return (
    <div className="dash-card animate-fade-up p-4" style={{ animationDelay: `${index * 80}ms` }}>
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-2 h-2 rounded-full ${style.dot}`}></div>
        <span className="text-xs text-gray-400">{title}</span>
      </div>
      <h3 className="text-2xl font-bold text-white">
        {value}
        {unit && value !== "N/A" && <span className="text-sm text-gray-400 ml-1">{unit}</span>}
      </h3>
      <div className="flex items-center justify-between text-xs mt-1">
        <span className="text-gray-500">{hint}</span>
        <span className={`font-medium ${style.text}`}>{style.label}</span>
      </div>
    </div>
  );
};

export default StatsCards;
