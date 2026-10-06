import RUMInsights from "../RumInsights/page";
import AskAi from "../AskAi/page";
import Opportunities from "../Opportunities/page";
import Diagnostics from "../Diagnostics/page";
import FieldTrend from "../FieldTrend/page";
import Security from "../Security/page";
import type { Report } from "@/lib/report";

interface BottomStatsProps {
  report: Report;
}

const BottomStats: React.FC<BottomStatsProps> = ({ report }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Opportunities opportunities={report.opportunities} />
      <Diagnostics report={report} />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <FieldTrend history={report.fieldHistory} unavailableReason={report.sources.cruxHistory.message} />
      <Security security={report.security} unavailableReason={report.sources.observatory.message} />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <RUMInsights field={report.field} />
      <AskAi report={report} />
    </div>
  </div>
);

export default BottomStats;
