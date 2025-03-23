import { useState } from "react";
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

  const getPerformanceAdvice = (cpu: number, memory: number, disk: number) => {
    let adviceText = "";

    if (cpu > 70) {
      adviceText += "⚠️ High CPU usage detected! Optimize JavaScript execution.\n";
    } else if (cpu > 40) {
      adviceText += "⚠️ Moderate CPU load. Reduce DOM manipulations.\n";
    } else {
      adviceText += "✅ CPU performance is optimal.\n";
    }

    if (memory > 4000) {
      adviceText += "⚠️ High Memory usage! Optimize images and reduce memory leaks.\n";
    } else if (memory > 2000) {
      adviceText += "⚠️ Moderate Memory usage. Use lazy loading.\n";
    } else {
      adviceText += "✅ Memory performance is good.\n";
    }

    if (disk > 300) {
      adviceText += "⚠️ High Disk I/O detected! Optimize database queries.\n";
    } else if (disk > 100) {
      adviceText += "⚠️ Moderate Disk I/O. Check caching strategies.\n";
    } else {
      adviceText += "✅ Disk I/O is within optimal range.\n";
    }

    return adviceText;
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
  
      const data = await res.json();
  
      setResult(data);
      setAnalysisData(data);
  
    
      setPerformanceMetrics(data.puppeteerData?.performanceMetrics || {});
      setJsExecutionTime(data.puppeteerData?.jsExecutionTime ?? 0);
      setNetworkRequests(data.puppeteerData?.networkRequests ?? []);
      setCpuUsage(data.puppeteerData?.cpuUsage ?? 0);
      setMemoryUsage(data.puppeteerData?.memoryUsage ?? 0);
      setDiskIO(data.puppeteerData?.diskIO ?? 0);
  
      
      setLighthouseReport(data.lighthouseData); 
      setLighthousePerformance(data.lighthouseData?.categories?.performance?.score * 100 || 0);
      setLighthouseAccessibility(data.lighthouseData?.categories?.accessibility?.score * 100 || 0);
      setLighthouseBestPractices(data.lighthouseData?.categories['best-practices']?.score * 100 || 0);
      setLighthouseSEO(data.lighthouseData?.categories?.seo?.score * 100 || 0);
  
      setAdvice(getPerformanceAdvice(data.puppeteerData?.cpuUsage, data.puppeteerData?.memoryUsage, data.puppeteerData?.diskIO));
  
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
  <button   disabled={loading} type="submit" className="bg-white text-black px-4 py-2 rounded-md hover:bg-amber-200">
    {loading ? "Analyzing..." : "Analyze"}
  </button>
</form>
      </div>
     
      <div className="w-1/2 bg-[#1a2634] p-2 h-72 items-center justify-center rounded-md"></div>

    </div>
  );
};

export default Form;
