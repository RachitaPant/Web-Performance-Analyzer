/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useState } from "react";

import { supabase } from "@/supabase/supabaseClient"

export interface PuppeteerData {
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

export interface LighthouseAudit {
  score?: number | null;
  numericValue?: number | null;
  displayValue?: string;
}


export interface LighthouseAudits {
  "is-on-https": LighthouseAudit;
  "first-contentful-paint": LighthouseAudit;
  "largest-contentful-paint": LighthouseAudit;
  "max-potential-fid":LighthouseAudit;
  "speed-index":LighthouseAudit;
  "interactive":LighthouseAudit;
  "cumulative-layout":LighthouseAudit;
  "server-response-time":LighthouseAudit
  "mainthread-work-breakdown":LighthouseAudit;
}

export interface LighthouseCategories {
  performance?: { score: number };
  accessibility?: { score: number };
  "best-practices"?: { score: number };
  seo?: { score: number };
}

export interface LighthouseData {
  audits?: Partial<LighthouseAudits>;
  categories?: Partial<LighthouseCategories>;
}

export interface AnalysisData {
  puppeteerData?: PuppeteerData;
  lighthouseData?: LighthouseData;
}

interface FormProps {
  setAnalysisData: (data: AnalysisData) => void; 
}

const Form: React.FC<FormProps> = ({ setAnalysisData }) =>{

  const [success,setSuccess]=useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState({});
  const [networkRequests, setNetworkRequests] = useState([]);
  const [jsExecutionTime, setJsExecutionTime] = useState<number | null>(null);
  const [cpuUsage, setCpuUsage] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState(0);
  const [diskIO, setDiskIO] = useState(0);
  
  const [lighthouseReport, setLighthouseReport] = useState<LighthouseData | null>(null);



const [lighthousePerformance, setLighthousePerformance] = useState<number>(0);
const [lighthouseAccessibility, setLighthouseAccessibility] = useState<number>(0);
const [lighthouseBestPractices, setLighthouseBestPractices] = useState<number>(0);
const [lighthouseSEO, setLighthouseSEO] = useState<number>(0);
  const isValidUrl = (str: string) => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  const isResultValid = (result: any): result is AnalysisData =>
    result && result.puppeteerData && result.lighthouseData;
  

  const defaultAnalysisData: AnalysisData = {
    puppeteerData: {
      jsExecutionTime: 0,
      cpuUsage: 0,
      memoryUsage: 0,
      diskIO: 0,
    },
    lighthouseData: {
      audits: {
        "is-on-https": { score: 0 },
        "first-contentful-paint": { score: 0 },
        "largest-contentful-paint": { score: 0 },
      },
      categories: {
        performance: { score: 0 },
        accessibility: { score: 0 },
        "best-practices": { score: 0 },
        seo: { score: 0 },
      },
    },
  };
  
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidUrl(url)) {
      setError("Invalid URL. Please enter a valid website URL.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
  
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
  
      if (!res.ok) throw new Error("Failed to fetch analysis data");
  
      const analysis_data = await res.json();
  
      setResult(analysis_data);
      setAnalysisData(analysis_data);
  
    
      setPerformanceMetrics(analysis_data.puppeteerData?.performanceMetrics || {});
      setJsExecutionTime(analysis_data.puppeteerData?.jsExecutionTime ?? undefined);
      setNetworkRequests(analysis_data.puppeteerData?.networkRequests ?? []);
      setCpuUsage(analysis_data.puppeteerData?.cpuUsage ?? 0);
      setMemoryUsage(analysis_data.puppeteerData?.memoryUsage ?? 0);
      setDiskIO(analysis_data.puppeteerData?.diskIO ?? 0);
  
      
      setLighthouseReport(analysis_data.lighthouseData); 
      setLighthousePerformance(analysis_data.lighthouseData?.categories?.performance?.score * 100 || 0);
      setLighthouseAccessibility(analysis_data.lighthouseData?.categories?.accessibility?.score * 100 || 0);
      setLighthouseBestPractices(analysis_data.lighthouseData?.categories['best-practices']?.score * 100 || 0);
      setLighthouseSEO(analysis_data.lighthouseData?.categories?.seo?.score * 100 || 0);
     
    
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
    }
     finally {
      setLoading(false);
    }
  };
  
  const saveSearch = useCallback(async (result: AnalysisData|null) => {
    if (!result) {
      console.error("Result is null");
      return;
    }
  
   
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();
  
    if (userError || !user) {
      console.error("User not authenticated:", userError);
      return;
    }
    const analysis_json = {
      puppeteerData: {
        jsExecutionTime: result?.puppeteerData?.jsExecutionTime ?? null,
        cpuUsage: result?.puppeteerData?.cpuUsage ?? null,
        memoryUsage: result?.puppeteerData?.memoryUsage ?? null,
        diskIO: result?.puppeteerData?.diskIO ?? null,
      },
      lighthouseData: {
        audits: {
          "is-on-https": {
            score: result?.lighthouseData?.audits?.["is-on-https"]?.score ?? null,
          },
          "first-contentful-paint": {
            score: result?.lighthouseData?.audits?.["first-contentful-paint"]?.score ?? null,
          },
          "largest-contentful-paint": {
            score: result?.lighthouseData?.audits?.["largest-contentful-paint"]?.score ?? null,
          },
        },
      },
    };
    const { data, error } = await supabase
  .from("history")
  .insert([
    {
      url,
      user_id: user.id,
      analysis_data: analysis_json, 
    },
  ]);

  
      if (error) {
        console.error("Error saving history:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
      } else {
        console.log("Saved to history:", data);
        setSuccess(true);
      }
      setUrl("");


  },[url]);
  
  
  return (
    <div className=" flex flex-row gap-2 rounded-md text-white justify-center items-center my-6 w-[100%]  ">
      <div className="w-1/2 bg-[#1a2634] p-2 h-72 items-center justify-center rounded-md">
      <h1 className="text-3xl font-semibold text-left my-10">Lets Help You Analyze Your Site</h1>

<form className="mt-4 flex gap-2 " onSubmit={handleSubmit}>
  <input
    type="url"
    placeholder="Enter website URL"
    className="p-2 border border-gray-300 rounded-md w-full"
    value={url}
    onChange={(e) => setUrl(e.target.value)}
    required
  />
 <button disabled={loading} type="submit" className="bg-white text-black px-4 py-2 rounded-md hover:bg-amber-200">
  {loading ? "Analyzing..." : "Analyze"}
</button>

<button
 disabled={!isResultValid(result) || loading}

  type="button"
  onClick={() => saveSearch(result || defaultAnalysisData)}
  className="bg-gray-300 text-black px-4 py-2 rounded-md hover:bg-amber-200"
>
{loading ? "Please wait..." : "Save"}


</button>

</form>
{error && <p className="text-red-500 mt-2">{error}</p>}
{success && <p className="text-green-400 mt-2">Saved successfully!</p>}

      </div>
     
      <div className="w-1/2 bg-[#1a2634] p-2 h-72 items-center justify-center rounded-md"></div>

    </div>
  );
};

export default Form;
