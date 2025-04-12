
import React from "react";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";

interface StatsProps {
  data?: {
    puppeteerData?: {
      jsExecutionTime?: number | null;
      cpuUsage?: number | null;
      memoryUsage?: number | null;
      diskIO?: number | null;
    };
    lighthouseData?: {
      audits?: {
        "is-on-https"?: {
          score?: number | null;
        };
        "first-contentful-paint"?: {
          score?: number | null;
        };
        "largest-contentful-paint"?: {
          score?: number | null;
        };
      };
    };
  };
}



const StatsCard: React.FC<StatsProps> = ({ data }) => {
  if (!data || Object.keys(data).length === 0) {
    return (
        <div className="flex items-center justify-center h-40 bg-[#1a2634] rounded-lg p-6 mb-2">
            <p className="text-gray-400 text-center">No stats available. Enter a URL to analyze.</p>
        </div>
    );
}
  const puppeteerData = data?.puppeteerData || {};
  const lighthouseData = data?.lighthouseData?.audits || {};

 
  const previousData = {
    jsExecutionTime: 500,
    cpuUsage: 30,
    memoryUsage: 1200,
    diskIO: 50,
    firstContentfulPaint: 1.8,
    largestContentfulPaint: 2.5,
    httpsScore: 1,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {/* Execution Time */}
      <StatCard
        title="Execution Time"
        value={puppeteerData.jsExecutionTime?? undefined}
        unit="ms"
        prevValue={previousData.jsExecutionTime}
        isPositive={true}
      />

     
     

      {/* First Contentful Paint */}
      <StatCard
        title="First Contentful Paint"
        value={lighthouseData["first-contentful-paint"]?.score?? undefined}
        unit="s"
        prevValue={previousData.firstContentfulPaint}
        isPositive={false}
      />

      {/* Largest Contentful Paint */}
      <StatCard
        title="Largest Contentful Paint"
        value={lighthouseData["largest-contentful-paint"]?.score?? undefined}
        unit="s"
        prevValue={previousData.largestContentfulPaint}
        isPositive={false}
      />

      {/* HTTPS Score */}
      <StatCard
        title="HTTPS Score"
        value={lighthouseData["is-on-https"]?.score?? undefined}
        unit=""
        prevValue={previousData.httpsScore}
        isPositive={true}
      />
    </div>
  );
};

interface StatCardProps {
  title: string;
  value?: number;
  unit: string;
  prevValue: number;
  isPositive: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit,
  prevValue,
  isPositive,
}) => {
  const percentageChange = prevValue
    ? (((value ?? prevValue) - prevValue) / prevValue) * 100
    : 0;
  const formattedChange =
    prevValue && value !== undefined
      ? `${percentageChange > 0 ? "+" : ""}${percentageChange.toFixed(1)}%`
      : "No previous data";

  return (
    <div className="bg-[#1a2634] rounded-lg p-4">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
        <span className="text-xs text-gray-400">{title}</span>
      </div>
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-white">
          {value !== undefined ? `${value} ${unit}` : "N/A"}
        </h3>
        <div className="h-10 w-20">
          <svg viewBox="0 0 100 30" className="w-full h-full">
            <path
              d="M0,15 L10,20 L20,10 L30,15 L40,5 L50,15 L60,10 L70,20 L80,15 L90,5 L100,10"
              fill="none"
              stroke={isPositive ? "#22c55e" : "#ef4444"}
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>
      <div className="flex items-center text-xs">
        {percentageChange >= 0 ? (
          <ArrowUpIcon className="w-3 h-3 text-green-500" />
        ) : (
          <ArrowDownIcon className="w-3 h-3 text-red-500" />
        )}
        <span
          className={`mr-1 ${
            percentageChange >= 0 ? "text-green-500" : "text-red-500"
          }`}
        >
          {formattedChange}
        </span>
        <span className="text-gray-400">vs previous</span>
      </div>
    </div>
  );
};

export default StatsCard;
