/* eslint-disable @typescript-eslint/no-unused-vars */

import { useState } from "react";

import { supabase } from "@/supabase/supabaseClient"

interface FormProps {
  setAnalysisData: (data: any) => void;
}
const Form: React.FC<FormProps> = ({ setAnalysisData }) =>{

  
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
  const [advice, setAdvice] = useState("");
  const [lighthouseReport, setLighthouseReport] = useState<any>(null); // Or more specific type
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
      setJsExecutionTime(analysis_data.puppeteerData?.jsExecutionTime ?? 0);
      setNetworkRequests(analysis_data.puppeteerData?.networkRequests ?? []);
      setCpuUsage(analysis_data.puppeteerData?.cpuUsage ?? 0);
      setMemoryUsage(analysis_data.puppeteerData?.memoryUsage ?? 0);
      setDiskIO(analysis_data.puppeteerData?.diskIO ?? 0);
  
      
      setLighthouseReport(analysis_data.lighthouseData); 
      setLighthousePerformance(analysis_data.lighthouseData?.categories?.performance?.score * 100 || 0);
      setLighthouseAccessibility(analysis_data.lighthouseData?.categories?.accessibility?.score * 100 || 0);
      setLighthouseBestPractices(analysis_data.lighthouseData?.categories['best-practices']?.score * 100 || 0);
      setLighthouseSEO(analysis_data.lighthouseData?.categories?.seo?.score * 100 || 0);
     
    
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const saveSearch = async (result: any) => {
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
      }
      
  };
  
  
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
  disabled={!result}
  type="button"
  onClick={() => saveSearch(result)}
  className="bg-gray-300 text-black px-4 py-2 rounded-md hover:bg-amber-200"
>
  Save
</button>

</form>
      </div>
     
      <div className="w-1/2 bg-[#1a2634] p-2 h-72 items-center justify-center rounded-md"></div>

    </div>
  );
};

export default Form;
