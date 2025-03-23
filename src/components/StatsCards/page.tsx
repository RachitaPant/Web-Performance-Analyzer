
import React from "react";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";

interface StatsProps {
  data?: {
    puppeteerData?: {
      jsExecutionTime?: number;
      cpuUsage?: number;
      memoryUsage?: number;
      diskIO?: number;
    };
    lighthouseData?: {
      categories?: any;
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
  const safeData = data || {};
  const puppeteerData = safeData.puppeteerData || {};

  // Dummy Previous Data
  const previousData = {
    jsExecutionTime: 500,
    cpuUsage: 30,
    memoryUsage: 1200,
    diskIO: 50,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Execution Time Card */}
      <div className="bg-[#1a2634] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <span className="text-xs text-gray-400">Execution Time</span>
        </div>
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-white">
            {puppeteerData.jsExecutionTime ?? "N/A"}
          </h3>
          <div className="h-10 w-20">
            <svg viewBox="0 0 100 30" className="w-full h-full">
              <path
                d="M0,15 L10,20 L20,10 L30,15 L40,5 L50,15 L60,10 L70,20 L80,15 L90,5 L100,10"
                fill="none"
                stroke="#22c55e"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>
        <div className="flex items-center text-xs">
          <ArrowUpIcon className="w-3 h-3 text-green-500" />
          <span className="text-green-500 mr-1">
            {previousData.jsExecutionTime
              ? "+14%"
              : "No previous data available"}
          </span>
          <span className="text-gray-400">vs previous</span>
        </div>
      </div>

      {/* CPU Usage Card */}
      <div className="bg-[#1a2634] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <span className="text-xs text-gray-400">CPU Usage</span>
        </div>
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-white">
            {puppeteerData.cpuUsage ?? "N/A"}%
          </h3>
          <div className="h-10 w-20">
            <svg viewBox="0 0 100 30" className="w-full h-full">
              <path
                d="M0,15 L10,10 L20,15 L30,5 L40,15 L50,10 L60,15 L70,5 L80,15 L90,10 L100,5"
                fill="none"
                stroke="#22c55e"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>
        <div className="flex items-center text-xs">
          <ArrowUpIcon className="w-3 h-3 text-green-500" />
          <span className="text-green-500 mr-1">
            {previousData.cpuUsage ? "+5%" : "No previous data available"}
          </span>
          <span className="text-gray-400">vs previous</span>
        </div>
      </div>

      {/* Memory Usage Card */}
      <div className="bg-[#1a2634] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <span className="text-xs text-gray-400">Memory Usage</span>
        </div>
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-white">
            {puppeteerData.memoryUsage ?? "N/A"} MB
          </h3>
          <div className="h-10 w-20">
            <svg viewBox="0 0 100 30" className="w-full h-full">
              <path
                d="M0,10 L10,15 L20,10 L30,15 L40,20 L50,15 L60,20 L70,25 L80,20 L90,25 L100,20"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>
        <div className="flex items-center text-xs">
          <ArrowDownIcon className="w-3 h-3 text-red-500" />
          <span className="text-red-500 mr-1">
            {previousData.memoryUsage ? "-3.5%" : "No previous data available"}
          </span>
          <span className="text-gray-400">vs previous</span>
        </div>
      </div>

      {/* Disk I/O Card */}
      <div className="bg-[#1a2634] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <span className="text-xs text-gray-400">Disk I/O:</span>
        </div>
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-white">
            {puppeteerData.diskIO ?? "N/A"} MB/s
          </h3>
          <div className="h-10 w-20">
            <svg viewBox="0 0 100 30" className="w-full h-full">
              <path
                d="M0,15 L10,20 L20,15 L30,10 L40,15 L50,20 L60,15 L70,5 L80,15 L90,20 L100,15"
                fill="none"
                stroke="#22c55e"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>
        <div className="flex items-center text-xs">
          <ArrowDownIcon className="w-3 h-3 text-red-500" />
          <span className="text-red-500 mr-1">
            {previousData.diskIO ? "-0%" : "No previous data available"}
          </span>
          <span className="text-gray-400">vs previous</span>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
