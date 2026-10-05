import type { FieldMetric, Report } from "@/lib/report";
import { RATING_STYLES, formatMs } from "@/lib/format";

interface RUMInsightsProps {
  field: Report["field"];
}

const ROWS: { key: keyof NonNullable<Report["field"]>; name: string; desc: string; core: boolean }[] = [
  { key: "lcp", name: "LCP", desc: "Largest Contentful Paint", core: true },
  { key: "inp", name: "INP", desc: "Interaction to Next Paint", core: true },
  { key: "cls", name: "CLS", desc: "Cumulative Layout Shift", core: true },
  { key: "fcp", name: "FCP", desc: "First Contentful Paint", core: false },
  { key: "ttfb", name: "TTFB", desc: "Time to First Byte", core: false },
];

const formatField = (key: string, m: FieldMetric) => (key === "cls" ? m.p75.toFixed(2) : formatMs(m.p75));

// Real-user (CrUX) 75th-percentile data over the last 28 days, as returned by PageSpeed Insights.
const RUMInsights: React.FC<RUMInsightsProps> = ({ field }) => {
  return (
    <div className="dash-card animate-fade-up p-4 lg:col-span-2" style={{ animationDelay: "80ms" }}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 mb-1">
        <h3 className="font-semibold text-white">Real-User Experience (CrUX)</h3>
        {field && (
          <span className="text-[10px] text-gray-500">
            {field.scope === "url" ? "This URL" : "Whole origin"} · p75 · last 28 days
          </span>
        )}
      </div>

      {!field ? (
        <p className="text-sm text-gray-400 py-8 text-center">
          Not enough real-user traffic in the Chrome UX Report for this site yet — only lab data is available.
        </p>
      ) : (
        <div className="overflow-x-auto mt-3">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-blue-500/20">
                <th className="pb-2 text-left font-medium">METRIC</th>
                <th className="pb-2 text-left font-medium">P75</th>
                <th className="pb-2 text-left font-medium">RATING</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(({ key, name, desc, core }) => {
                const m = field[key] as FieldMetric | null;
                const style = m ? RATING_STYLES[m.rating] : null;
                return (
                  <tr key={key} className="border-b border-blue-500/10 last:border-0 hover:bg-blue-500/5 transition-colors">
                    <td className="py-3 text-xs text-white">
                      {name}
                      {core && (
                        <span className="ml-2 rounded bg-blue-500/15 px-1.5 py-0.5 text-[9px] text-blue-300">
                          Core Web Vital
                        </span>
                      )}
                      <div className="text-gray-400">{desc}</div>
                    </td>
                    <td className="py-3 text-sm font-semibold text-white">{m ? formatField(key, m) : "N/A"}</td>
                    <td className="py-3 text-xs">
                      {style ? (
                        <span className={`inline-flex items-center gap-1.5 ${style.text}`}>
                          <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                          {style.label}
                        </span>
                      ) : (
                        <span className="text-gray-500">No data</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RUMInsights;
