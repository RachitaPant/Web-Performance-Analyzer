import RUMInsights from "../RumInsights/page";
import AskAi from "../AskAi/page";
interface PuppeteerData {
  jsExecutionTime?: number | null;
  cpuUsage?: number | null;
  memoryUsage?: number | null;
  diskIO?: number | null;
  networkRequests?: string[];
  performanceMetrics?: Record<string, unknown>; 
  totalDomNodes?: number;
  thirdPartyRequestsCount?: number;
  resourceBreakdown?: Record<string, number>;
  domContentLoadedTime?:number|0;
  largeImages?: {
    src: string;
    width: number;
    height: number;
  }[];
  longTasks?: {
    name: string;
    startTime: number;
    duration: number;
  }[];
  unusedJSBytes?: {
    name: string;
    transferSize: number;
    encodedBodySize: number;
  }[];
}

interface LighthouseAudit {
  score?: number|null;
}

interface LighthouseData {
  audits?: {
    "is-on-https"?: LighthouseAudit;
    "first-contentful-paint"?: LighthouseAudit;
    "largest-contentful-paint"?: LighthouseAudit;
  };
}

interface BottomStatsProps {
  data?: {
    puppeteerData?: PuppeteerData;
    lighthouseData?: LighthouseData;
  };
}

const BottomStats: React.FC<BottomStatsProps> = ({ data }) =>{
    return (    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      
      
      <RUMInsights
  DOMContentLoadTime={data?.puppeteerData?.domContentLoadedTime ?? 0}  
  totalDOMNodes={data?.puppeteerData?.totalDomNodes ?? 0}
  thirdPartyRequestCount={data?.puppeteerData?.thirdPartyRequestsCount ?? 0}
/>

    <AskAi></AskAi>
      </div>)
}
export default BottomStats;