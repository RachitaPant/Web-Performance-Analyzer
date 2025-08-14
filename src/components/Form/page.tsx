// components/Form/page.tsx
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useCallback, useState } from "react";
import { db, auth } from "@/lib/firebaseClient";
import { collection, addDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
  domContentLoadedTime?: number | 0;
  largeImages?: { src: string; width: number; height: number }[];
  longTasks?: { name: string; startTime: number; duration: number }[];
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
  "max-potential-fid": LighthouseAudit;
  "speed-index": LighthouseAudit;
  interactive: LighthouseAudit;
  "cumulative-layout": LighthouseAudit;
  "server-response-time": LighthouseAudit;
  "mainthread-work-breakdown": LighthouseAudit;
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
  url?: string;
}

interface FormProps {
  setAnalysisData: (data: AnalysisData) => void;
}

const Form: React.FC<FormProps> = ({ setAnalysisData }) => {
  const [success, setSuccess] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalysisData | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState({});
  const [networkRequests, setNetworkRequests] = useState([]);
  const [jsExecutionTime, setJsExecutionTime] = useState<number | null>(null);
  const [cpuUsage, setCpuUsage] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState(0);
  const [diskIO, setDiskIO] = useState(0);
  const [lighthouseReport, setLighthouseReport] =
    useState<LighthouseData | null>(null);
  const [lighthousePerformance, setLighthousePerformance] = useState(0);
  const [lighthouseAccessibility, setLighthouseAccessibility] = useState(0);
  const [lighthouseBestPractices, setLighthouseBestPractices] = useState(0);
  const [lighthouseSEO, setLighthouseSEO] = useState(0);

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
    url: "",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidUrl(url)) {
      setError("Invalid URL. Please enter a valid website URL.");
      toast.error("Invalid URL");
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
      const resultWithUrl: AnalysisData = { ...analysis_data, url };

      setResult(resultWithUrl);
      setAnalysisData(resultWithUrl);
      setPerformanceMetrics(
        analysis_data.puppeteerData?.performanceMetrics || {}
      );
      setJsExecutionTime(analysis_data.puppeteerData?.jsExecutionTime ?? null);
      setNetworkRequests(analysis_data.puppeteerData?.networkRequests ?? []);
      setCpuUsage(analysis_data.puppeteerData?.cpuUsage ?? 0);
      setMemoryUsage(analysis_data.puppeteerData?.memoryUsage ?? 0);
      setDiskIO(analysis_data.puppeteerData?.diskIO ?? 0);
      setLighthouseReport(analysis_data.lighthouseData);
      setLighthousePerformance(
        analysis_data.lighthouseData?.categories?.performance?.score * 100 || 0
      );
      setLighthouseAccessibility(
        analysis_data.lighthouseData?.categories?.accessibility?.score * 100 ||
          0
      );
      setLighthouseBestPractices(
        analysis_data.lighthouseData?.categories["best-practices"]?.score *
          100 || 0
      );
      setLighthouseSEO(
        analysis_data.lighthouseData?.categories?.seo?.score * 100 || 0
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const saveSearch = useCallback(
    async (result: AnalysisData | null) => {
      if (!result) {
        toast.error("No analysis data to save");
        return;
      }

      const user = auth.currentUser;
      if (!user) {
        toast.error("You must be logged in to save");
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
              score:
                result?.lighthouseData?.audits?.["is-on-https"]?.score ?? null,
            },
            "first-contentful-paint": {
              score:
                result?.lighthouseData?.audits?.["first-contentful-paint"]
                  ?.score ?? null,
            },
            "largest-contentful-paint": {
              score:
                result?.lighthouseData?.audits?.["largest-contentful-paint"]
                  ?.score ?? null,
            },
          },
        },
      };

      try {
        await addDoc(collection(db, "users", user.uid, "history"), {
          url,
          user_id: user.uid,
          analysis_data: analysis_json,
          created_at: new Date(),
        });
        setSuccess(true);
        setUrl("");
        toast.success("Saved successfully!");
      } catch (error) {
        console.error("Error saving history:", error);
        toast.error("Failed to save history");
      }
    },
    [url]
  );

  return (
    <div className="flex flex-row gap-2 rounded-md text-white justify-center items-center my-6 w-[100%]">
      <div className="w-1/2 bg-[#1a2634] p-2 h-72 items-center justify-center rounded-md">
        <h1 className="text-3xl font-semibold text-left my-10">
          Lets Help You Analyze Your Site
        </h1>
        <form className="mt-4 flex gap-2" onSubmit={handleSubmit}>
          <input
            type="url"
            placeholder="Enter website URL"
            className="p-2 border border-gray-300 rounded-md w-full"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <button
            disabled={loading}
            type="submit"
            className="bg-white text-black px-4 py-2 rounded-md hover:bg-amber-200"
          >
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
      <div className="w-1/2 bg-[#1a2634] p-2 h-72 items-center justify-center rounded-md">
        <></>
      </div>
    </div>
  );
};

export default Form;
