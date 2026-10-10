import type { Report } from "@/lib/report";
import { formatBytes, formatMs } from "@/lib/format";

interface OpportunitiesProps {
  opportunities: Report["opportunities"];
}

const savingsLabel = (o: Report["opportunities"][number]) => {
  const parts = [];
  if (o.savingsMs > 0) parts.push(`~${formatMs(o.savingsMs)}`);
  if (o.savingsBytes > 0) parts.push(formatBytes(o.savingsBytes));
  return parts.join(" · ");
};

// Failing Lighthouse insights, already ranked by estimated savings in the transform.
const Opportunities: React.FC<OpportunitiesProps> = ({ opportunities }) => (
  <div className="dash-card animate-fade-up p-4 lg:col-span-2" style={{ animationDelay: "120ms" }}>
    <h3 className="font-semibold text-white mb-1">What to fix first</h3>
    <p className="text-xs text-gray-500 mb-4">Failing Lighthouse audits, ranked by estimated savings.</p>

    {opportunities.length === 0 ? (
      <p className="text-sm text-green-400 py-6 text-center">No significant opportunities found — nice work.</p>
    ) : (
      <ol className="space-y-2">
        {opportunities.map((o, i) => (
          <li key={o.id} className="flex gap-3 p-3 bg-blue-950/30 rounded-lg">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-pink-500/20 border border-pink-500/50 flex items-center justify-center text-pink-400 font-bold text-xs">
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">{o.title}</p>
              {o.displayValue && <p className="text-xs text-gray-500 truncate">{o.displayValue}</p>}
            </div>
            <div className="text-pink-400 font-semibold text-xs whitespace-nowrap self-center">
              {savingsLabel(o)}
            </div>
          </li>
        ))}
      </ol>
    )}
  </div>
);

export default Opportunities;
