import Image from "next/image";
import type { Report } from "@/lib/report";
import { formatBytes, formatMs } from "@/lib/format";

interface DiagnosticsProps {
  report: Report;
}

const Diagnostics: React.FC<DiagnosticsProps> = ({ report }) => {
  const d = report.diagnostics;
  const rows: [string, string][] = [
    ["Page weight", formatBytes(d.totalBytes)],
    ["Requests", d.requestCount?.toString() ?? "N/A"],
    ["Third-party requests", d.thirdPartyRequests == null ? "N/A" : `${d.thirdPartyRequests} (${formatBytes(d.thirdPartyBytes)})`],
    ["DOM elements", d.domSize?.toLocaleString() ?? "N/A"],
    ["Main-thread work", formatMs(d.mainThreadMs)],
    ["JS execution", formatMs(d.jsBootupMs)],
    ["Server response (TTFB)", formatMs(report.lab.ttfb.value)],
  ];

  return (
    <div className="dash-card animate-fade-up p-4" style={{ animationDelay: "160ms" }}>
      <h3 className="font-semibold text-white mb-3">Page Diagnostics</h3>
      {report.screenshot && (
        <div className="mb-3 rounded-lg overflow-hidden border border-blue-500/20 bg-blue-950/40 flex justify-center">
          <Image
            src={report.screenshot}
            alt={`Screenshot of ${report.finalUrl}`}
            width={report.strategy === "mobile" ? 120 : 320}
            height={report.strategy === "mobile" ? 240 : 200}
            unoptimized
            className="h-40 w-auto object-contain"
          />
        </div>
      )}
      <dl className="space-y-1.5">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between text-xs border-b border-blue-500/10 pb-1.5 last:border-0">
            <dt className="text-gray-400">{label}</dt>
            <dd className="text-white font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      {d.thirdParties.length > 0 && (
        <p className="text-[10px] text-gray-500 mt-3">
          Heaviest third party: <span className="text-gray-300">{d.thirdParties[0].entity}</span> (
          {formatMs(d.thirdParties[0].mainThreadMs)} main thread)
        </p>
      )}
    </div>
  );
};

export default Diagnostics;
