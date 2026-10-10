import { ShieldCheck, ExternalLink } from "lucide-react";
import type { Report } from "@/lib/report";

interface SecurityProps {
  security: Report["security"];
  unavailableReason: string | null;
}

// Observatory grades A+ … F; map the letter onto the app's good / needs-improvement / poor colours.
const gradeTone = (grade: string) =>
  grade.startsWith("A") ? "text-green-400" : grade.startsWith("B") || grade.startsWith("C") ? "text-yellow-400" : "text-red-400";

const Security: React.FC<SecurityProps> = ({ security, unavailableReason }) => (
  <div className="dash-card animate-fade-up p-4" style={{ animationDelay: "140ms" }}>
    <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
      <ShieldCheck className="h-4 w-4" /> Security Headers
    </h3>
    <p className="text-xs text-gray-500 mb-4">Mozilla HTTP Observatory</p>

    {security ? (
      <>
        <div className="flex items-end gap-3 mb-4">
          <span className={`text-5xl font-bold ${gradeTone(security.grade)}`}>{security.grade}</span>
          <span className="text-sm text-gray-400 mb-1.5">score {security.score}</span>
        </div>
        <p className="text-xs text-gray-300">
          {security.testsPassed} of {security.testsPassed + security.testsFailed} checks passed
        </p>
        <a
          href={security.detailsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-xs text-blue-300 hover:text-blue-200"
        >
          Full report and fixes <ExternalLink className="h-3 w-3" />
        </a>
      </>
    ) : (
      <p className="text-sm text-gray-400 py-6 text-center">{unavailableReason ?? "Security scan unavailable."}</p>
    )}
  </div>
);

export default Security;
