
import {  ChevronDownIcon } from "lucide-react"
interface ChartsProps {
  data?: {
    puppeteerData?: {
      jsExecutionTime?: number;
      cpuUsage?: number;
      memoryUsage?: number;
      diskIO?: number;
    };
    lighthouseData?: {
      audits?: {
        "interactive"?:{
          score?: number;
          numericValue?:number;
          displayValue?:String;
        }
        "max-potential-fid"?:{
          score?: number;
          numericValue?:number;
          displayValue?:String;
        }
        "speed-index"?:{
          score?: number;
          numericValue?:number;
          displayValue?:String;
        }
        "cumulative-layout"?:{
          score?: number;
          numericValue?:number;
          displayValue?:String;
        }
        "server-response-time"?:{
          score?: number;
          numericValue?:number;
          displayValue?:String;
        }
        "mainthread-work-breakdown"?:{
          score?: number;
          numericValue?:number;
          displayValue?:String;
        }
      };
    };
  };
}
  
  const Charts: React.FC<ChartsProps> = ({ data }) =>{
    const performanceScore =
  data?.lighthouseData?.audits?.["interactive"]?.score ?? 0;
  const speedIndex = {
    score: data?.lighthouseData?.audits?.["speed-index"]?.score ?? 0,
    displayValue: data?.lighthouseData?.audits?.["speed-index"]?.displayValue ?? "N/A",
    numericValue: data?.lighthouseData?.audits?.["speed-index"]?.numericValue ?? 0, 
  };
  
const maxPotentialFID ={
  score: data?.lighthouseData?.audits?.["max-potential-fid"]?.score ?? 0,
  displayValue: data?.lighthouseData?.audits?.["max-potential-fid"]?.displayValue ?? "N/A",
  numericValue: data?.lighthouseData?.audits?.["max-potential-fid"]?.numericValue ?? 0, 
};
 
const serverResponseTime ={
  score:data?.lighthouseData?.audits?.["server-response-time"]?.score ?? 0,
  displayValue:data?.lighthouseData?.audits?.["server-response-time"]?.displayValue ?? "N/A",
  numericValue:data?.lighthouseData?.audits?.["server-response-time"]?.numericValue ?? 0,
}
  
  const cumulativeLayout={
    score: data?.lighthouseData?.audits?.["cumulative-layout"]?.score?? 0,
    displayValue: data?.lighthouseData?.audits?.["cumulative-layout"]?.displayValue ?? "N/A",
    numeriValue: data?.lighthouseData?.audits?.["cumulative-layout"]?.numericValue ?? 0,
  }
 
  const mainThreadWork={
    score: data?.lighthouseData?.audits?.["mainthread-work-breakdown"]?.score??0,
    displayValue:data?.lighthouseData?.audits?.["mainthread-work-breakdown"]?.displayValue??"N/A",
    numericValue:data?.lighthouseData?.audits?.["mainthread-work-breakdown"]?.numericValue??0,
  }
  const weights = {
    speedIndex: 0.30,
    maxPotentialFID: 0.20,
    serverResponseTime: 0.15,
    cumulativeLayout: 0.20,
    mainThreadWork: 0.15,
  };
  const calculatePerformanceScore = () => {
    
  
    const performanceScore =
      (speedIndex.score * weights.speedIndex) +
      (maxPotentialFID.score * weights.maxPotentialFID) +
      (serverResponseTime.score * weights.serverResponseTime) +
      (cumulativeLayout.score * weights.cumulativeLayout) +
      (mainThreadWork.score * weights.mainThreadWork);
  
    return (performanceScore * 100).toFixed(2); 
  };
  
  const score = calculatePerformanceScore()||0;
  const dummyInteractiveData = [
    { date: "Mar 12", value: 4000 },
    { date: "Mar 13", value: 3500 },
    { date: "Mar 14", value: 5000 },
    { date: "Mar 15", value: 2500 },
    { date: "Mar 16", value: 1000 },
    { date: "Mar 17", value: 3000 },
    { date: "Mar 18", value: 2000 },
  ];
  
  
  const maxValue = 5000; 
  const chartWidth = 300;
  const chartHeight = 100;
  const points = dummyInteractiveData
    .map((d, i) => {
      const x = (i / (dummyInteractiveData.length - 1)) * chartWidth;
      const y = chartHeight - (d.value / maxValue) * chartHeight;
      return `${x},${y}`;
    })
    .join(" ");
  
    return (  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        
        <div className="bg-[#1a2634] rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Analytics</h3>
         
            <button className="h-7 text-xs bg-transparent border border-gray-700 text-gray-400 rounded px-3 flex items-center">
              Week <ChevronDownIcon className="ml-1 w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] mb-5">Time to Interactive is the amount of time it takes for the page to become fully interactive</p>
          <div className="h-48 relative">
    <div className="absolute inset-0">
      <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-gray-500">
        <div>5s</div>
        <div>4s</div>
        <div>3s</div>
        <div>2s</div>
        <div>1s</div>
        <div>0</div>
      </div>

      {/* Horizontal grid lines */}
      <div className="absolute left-5 right-0 top-0 h-full flex flex-col justify-between">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="border-t border-dashed border-gray-700 w-full h-0"></div>
        ))}
      </div>

      {/* Chart */}
      <div className="absolute left-8 right-0 top-4 bottom-4">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full">
          <polyline
            points={points}
            fill="none"
            stroke="#f97316"
            strokeWidth="2"
          />
          <polygon
            points={`${points} ${chartWidth},${chartHeight} 0,${chartHeight}`}
            fill="url(#gradient)"
            fillOpacity="0.2"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Marker for latest value */}
          <line x1={chartWidth - 50} y1="0" x2={chartWidth - 50} y2={chartHeight} stroke="#f97316" strokeWidth="1" strokeDasharray="2,2" />
          <circle cx={chartWidth - 50} cy={chartHeight - (dummyInteractiveData[dummyInteractiveData.length - 1].value / maxValue) * chartHeight} r="4" fill="#f97316" />
          <rect x={chartWidth - 60} y={chartHeight - (dummyInteractiveData[dummyInteractiveData.length - 1].value / maxValue) * chartHeight - 10} width="20" height="15" rx="2" fill="#f97316" />
          <text x={chartWidth - 50} y={chartHeight - (dummyInteractiveData[dummyInteractiveData.length - 1].value / maxValue) * chartHeight} textAnchor="middle" fill="white" fontSize="8">
            {dummyInteractiveData[dummyInteractiveData.length - 1].value}ms
          </text>
        </svg>
      </div>

      {/* X-axis labels */}
      <div className="absolute left-8 right-0 bottom-0 flex justify-between text-[10px] text-gray-500">
        {dummyInteractiveData.map((d, i) => (
          <div key={i}>{d.date}</div>
        ))}
      </div>
    </div>
  </div>
        </div>

        {/* Sales by Category Chart */}
        <div className="bg-[#1a2634] rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Metrics by Category</h3>
            <button className="h-7 text-xs bg-transparent border border-gray-700 text-gray-400 rounded px-3 flex items-center">
              Week <ChevronDownIcon className="ml-1 w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Donut chart segments */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#f43f5e"
                  strokeWidth="20"
                  strokeDasharray="75.4 176.6"
                  strokeDashoffset="0"
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
                />

              
                <text x="50" y="45" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
               {score}
                </text>
                <text x="50" y="60" textAnchor="middle" fill="gray" fontSize="6">
                  TOTAL SCORE
                </text>
              </svg>
            </div>

            <div className="flex-1 grid gap-2">
              {/* Category legend items */}
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#f43f5e]"></div>
                <span className="text-xs text-white">Speed-Index </span>
                <span className="text-xs text-gray-400 ml-auto">{speedIndex.displayValue}</span>
              </div>
              <div className="text-[10px] text-gray-500">{speedIndex.score}</div>

              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#06b6d4]"></div>
                <span className="text-xs text-white">Max Potential First Input Delay </span>
                <span className="text-xs text-gray-400 ml-auto">{maxPotentialFID.displayValue}</span>
              </div>
              <div className="text-[10px] text-gray-500">{maxPotentialFID.score}</div>

              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#8b5cf6]"></div>
                <span className="text-xs text-white">Server Response Time </span>
                <span className="text-xs text-gray-400 ml-auto">{serverResponseTime.displayValue}</span>
              </div>
              <div className="text-[10px] text-gray-500">{serverResponseTime.score}</div>

              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#f59e0b]"></div>
                <span className="text-xs text-white">Cumulative Layout</span>
                <span className="text-xs text-gray-400 ml-auto">{cumulativeLayout.displayValue}</span>
              </div>
              <div className="text-[10px] text-gray-500">{cumulativeLayout.score}</div>

              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#10b981]"></div>
                <span className="text-xs text-white">Minimize main-thread work </span>
                <span className="text-xs text-gray-400 ml-auto">{mainThreadWork.displayValue}</span>
              </div>
              <div className="text-[10px] text-gray-500">{mainThreadWork.score}</div>
            </div>
          </div>
        </div>
      </div>)
}
export default Charts;