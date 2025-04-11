import RUMInsights from "../RumInsights/page";
import AskAi from "../AskAi/page";
interface PuppeteerData {
  jsExecutionTime?: number;
  cpuUsage?: number;
  memoryUsage?: number;
  diskIO?: number;
  domContentLoadedTime?: number;
  networkRequests?: string[];
  totalDomNodes?: number;
  thirdPartyRequestsCount?: number;
  resourceBreakdown?: Record<string, number>;
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
  score?: number;
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
      
      
       <RUMInsights  DOMContentLoadTime={data?.puppeteerData?.domContentLoadedTime} totalDOMNodes={data?.puppeteerData?.totalDomNodes} thirdPartyRequestCount={data?.puppeteerData?.thirdPartyRequestsCount}/>
    <AskAi></AskAi>
      </div>)
}
export default BottomStats;