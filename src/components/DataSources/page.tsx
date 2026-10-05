import { CheckCircle2, CircleSlash, AlertTriangle } from "lucide-react";
import type { Report, SourceId, SourceStatus } from "@/lib/report";
import { formatMs } from "@/lib/format";

const LABELS: Record<SourceId, string> = {
  pagespeed: "PageSpeed Insights",
  cruxHistory: "CrUX history",
  observatory: "HTTP Observatory",
};

const STATUS: Record<SourceStatus["status"], { Icon: typeof CheckCircle2; className: string; label: string }> = {
  ok: { Icon: CheckCircle2, className: "text-green-400", label: "loaded" },
  unavailable: { Icon: CircleSlash, className: "text-gray-400", label: "unavailable" },
  error: { Icon: AlertTriangle, className: "text-yellow-400", label: "failed" },
};

// Shows which data sources contributed to this report, so missing sections are explained.
const DataSources: React.FC<{ sources: Report["sources"] }> = ({ sources }) => (
  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 px-1">
    <span className="text-gray-500">Data sources:</span>
    {(Object.keys(LABELS) as SourceId[]).map((id) => {
      const s = sources[id];
      const { Icon, className, label } = STATUS[s.status];
      const tooltip = [s.message, s.ms != null ? `took ${formatMs(s.ms)}` : null].filter(Boolean).join(" · ");
      return (
        <span key={id} className="inline-flex items-center gap-1" title={tooltip || undefined}>
          <Icon className={`h-3.5 w-3.5 ${className}`} aria-hidden />
          {LABELS[id]} <span className="sr-only">{label}</span>
        </span>
      );
    })}
  </div>
);

export default DataSources;
