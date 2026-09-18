import { Graph } from "../Graph/page";
interface ChartsProps {
  data?: {
    puppeteerData?: {
      jsExecutionTime?: number | null;
      cpuUsage?: number | null;
      memoryUsage?: number | null;
      diskIO?: number | null;
      networkRequests?: string[];
    };
    lighthouseData?: {
      audits?: {
        interactive?: {
          score?: number | null;
          numericValue?: number | null;
          displayValue?: string;
        };
        "max-potential-fid"?: {
          score?: number | null;
          numericValue?: number | null;
          displayValue?: string;
        };
        "speed-index"?: {
          score?: number | null;
          numericValue?: number | null;
          displayValue?: string;
        };
        "cumulative-layout"?: {
          score?: number | null;
          numericValue?: number | null;
          displayValue?: string;
        };
        "server-response-time"?: {
          score?: number | null;
          numericValue?: number | null;
          displayValue?: string;
        };
        "mainthread-work-breakdown"?: {
          score?: number | null;
          numericValue?: number | null;
          displayValue?: string;
        };
      };
    };
    url?: string;
  };
}

const Charts: React.FC<ChartsProps> = ({ data }) => {
  const speedIndex = {
    score: data?.lighthouseData?.audits?.["speed-index"]?.score ?? 0,
    displayValue:
      data?.lighthouseData?.audits?.["speed-index"]?.displayValue ?? "N/A",
    numericValue:
      data?.lighthouseData?.audits?.["speed-index"]?.numericValue ?? 0,
  };

  const maxPotentialFID = {
    score: data?.lighthouseData?.audits?.["max-potential-fid"]?.score ?? 0,
    displayValue:
      data?.lighthouseData?.audits?.["max-potential-fid"]?.displayValue ??
      "N/A",
    numericValue:
      data?.lighthouseData?.audits?.["max-potential-fid"]?.numericValue ?? 0,
  };

  const serverResponseTime = {
    score: data?.lighthouseData?.audits?.["server-response-time"]?.score ?? 0,
    displayValue:
      data?.lighthouseData?.audits?.["server-response-time"]?.displayValue ??
      "N/A",
    numericValue:
      data?.lighthouseData?.audits?.["server-response-time"]?.numericValue ?? 0,
  };

  const cumulativeLayout = {
    score: data?.lighthouseData?.audits?.["cumulative-layout"]?.score ?? 0,
    displayValue:
      data?.lighthouseData?.audits?.["cumulative-layout"]?.displayValue ??
      "N/A",
    numeriValue:
      data?.lighthouseData?.audits?.["cumulative-layout"]?.numericValue ?? 0,
  };

  const mainThreadWork = {
    score:
      data?.lighthouseData?.audits?.["mainthread-work-breakdown"]?.score ?? 0,
    displayValue:
      data?.lighthouseData?.audits?.["mainthread-work-breakdown"]
        ?.displayValue ?? "N/A",
    numericValue:
      data?.lighthouseData?.audits?.["mainthread-work-breakdown"]
        ?.numericValue ?? 0,
  };
  const weights = {
    speedIndex: 0.3,
    maxPotentialFID: 0.2,
    serverResponseTime: 0.15,
    cumulativeLayout: 0.2,
    mainThreadWork: 0.15,
  };
  const calculatePerformanceScore = () => {
    const performanceScore =
      speedIndex.score * weights.speedIndex +
      maxPotentialFID.score * weights.maxPotentialFID +
      serverResponseTime.score * weights.serverResponseTime +
      cumulativeLayout.score * weights.cumulativeLayout +
      mainThreadWork.score * weights.mainThreadWork;

    return (performanceScore * 100).toFixed(2);
  };

  const score = calculatePerformanceScore() || 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      <Graph
        site={data?.url ?? ""}
        metric="jsExecutionTime"
        freshAnalysisData={data?.puppeteerData?.jsExecutionTime ?? 0}
      />

      <div className="dash-card animate-fade-up p-4" style={{ animationDelay: "80ms" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Metrics by Category</h3>
        </div>
        <div className="flex items-center">
          <div className="relative w-40 h-40">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="20"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#f43f5e"
                strokeWidth="20"
                strokeDasharray="75.4 176.6"
                strokeDashoffset="0"
                strokeLinecap="round"
                className="animate-ring-fill"
                style={{ ["--ring-start" as string]: 251.2, ["--ring-end" as string]: 0 }}
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#06b6d4"
                strokeWidth="20"
                strokeDasharray="37.7 176.6"
                strokeDashoffset="-75.4"
                strokeLinecap="round"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#8b5cf6"
                strokeWidth="20"
                strokeDasharray="25.1 176.6"
                strokeDashoffset="-113.1"
                strokeLinecap="round"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#f59e0b"
                strokeWidth="20"
                strokeDasharray="25.1 176.6"
                strokeDashoffset="-138.2"
                strokeLinecap="round"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#10b981"
                strokeWidth="20"
                strokeDasharray="12.6 176.6"
                strokeDashoffset="-163.3"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-white">{score}</span>
              <span className="text-[9px] tracking-wide text-gray-400">
                TOTAL SCORE
              </span>
            </div>
          </div>

          <div className="flex-1 grid gap-2">
            <LegendRow color="#f43f5e" label="Speed-Index" value={speedIndex.displayValue} score={speedIndex.score} />
            <LegendRow color="#06b6d4" label="Max Potential First Input Delay" value={maxPotentialFID.displayValue} score={maxPotentialFID.score} />
            <LegendRow color="#8b5cf6" label="Server Response Time" value={serverResponseTime.displayValue} score={serverResponseTime.score} />
            <LegendRow color="#f59e0b" label="Cumulative Layout" value={cumulativeLayout.displayValue} score={cumulativeLayout.score} />
            <LegendRow color="#10b981" label="Minimize main-thread work" value={mainThreadWork.displayValue} score={mainThreadWork.score} />
          </div>
        </div>
      </div>
    </div>
  );
};

const LegendRow = ({
  color,
  label,
  value,
  score,
}: {
  color: string;
  label: string;
  value: string;
  score: number;
}) => (
  <div className="group rounded-md px-2 py-1 -mx-2 hover:bg-white/5 transition-colors">
    <div className="flex items-center gap-2">
      <div
        className="w-2 h-2 rounded-full transition-transform group-hover:scale-125"
        style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
      ></div>
      <span className="text-xs text-white">{label}</span>
      <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">
        {value}
      </span>
    </div>
    <div className="text-[10px] text-gray-500 pl-4">{score}</div>
  </div>
);
export default Charts;
