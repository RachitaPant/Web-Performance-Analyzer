
import {  ChevronDownIcon } from "lucide-react"
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
        "interactive"?:{
          score?: number|null;
          numericValue?:number|null;
          displayValue?:string;
        }
        "max-potential-fid"?:{
          score?: number|null;
          numericValue?:number|null;
          displayValue?:string;
        }
        "speed-index"?:{
          score?: number|null;
          numericValue?:number|null;
          displayValue?:string;
        }
        "cumulative-layout"?:{
          score?: number|null;
          numericValue?:number|null;
          displayValue?:string;
        }
        "server-response-time"?:{
          score?: number|null;
          numericValue?:number|null;
          displayValue?:string;
        }
        "mainthread-work-breakdown"?:{
          score?: number|null;
          numericValue?:number|null;
          displayValue?:string;
        }
      };
    };
    url?:string;
  };
}
  
  const Charts: React.FC<ChartsProps> = ({ data }) =>{
  
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
  
  
    return (  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        
      

        <Graph site={data?.url??""} metric="jsExecutionTime"  freshAnalysisData={data?.puppeteerData?.jsExecutionTime??0} />
      

     
        <div className="bg-[#1a2634] rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Metrics by Category</h3>
           
          </div>
          <div className="flex items-center">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 100 100" className="w-full h-full">
               
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