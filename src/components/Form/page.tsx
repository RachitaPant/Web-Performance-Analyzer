/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useState } from "react";
import { db, auth } from "@/lib/firebaseClient";
import { collection, addDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Shared interfaces (could be moved to a types file for reusability)
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

// Modularized hook for form state and validation
const useFormState = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<AnalysisData | null>(null);

  const isValidUrl = (str: string) => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  return {
    url,
    setUrl,
    loading,
    setLoading,
    error,
    setError,
    success,
    setSuccess,
    result,
    setResult,
    isValidUrl,
  };
};

// Modularized hook for handling analysis submission
const useAnalysisSubmit = (
  url: string,
  setLoading: (loading: boolean) => void,
  setError: (error: string) => void,
  setResult: (result: AnalysisData | null) => void,
  setAnalysisData: (data: AnalysisData) => void,
  isValidUrl: (str: string) => boolean
) => {
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
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return handleSubmit;
};

// Modularized hook for saving search to Firebase
const useSaveSearch = (url: string, setSuccess: (success: boolean) => void) => {
  return useCallback(
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
        toast.success("Saved successfully!");
      } catch (error) {
        console.error("Error saving history:", error);
        toast.error("Failed to save history");
      }
    },
    [url]
  );
};

// Modularized component for the form UI
const AnalysisFormUI: React.FC<{
  url: string;
  setUrl: (url: string) => void;
  loading: boolean;
  error: string;
  success: boolean;
  handleSubmit: (e: React.FormEvent) => void;
  saveSearch: (result: AnalysisData | null) => void;
  result: AnalysisData | null;
}> = ({
  url,
  setUrl,
  loading,
  error,
  success,
  handleSubmit,
  saveSearch,
  result,
}) => {
  const isResultValid = (result: any): result is AnalysisData =>
    result && result.puppeteerData && result.lighthouseData;

  return (
    <div className="w-full  mx-auto bg-gray-800 p-6 rounded-xl shadow-lg">
      <h1 className="text-2xl font-bold text-white mb-6">
        Analyze Your Website
      </h1>
      <p className="text-sm text-gray-400 mb-4">
        Note: Limited to 1 audit per session to manage GCP costs. Audits may
        take time.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="url"
          placeholder="Enter website URL (e.g., https://example.com)"
          className="p-3 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>
          <button
            type="button"
            onClick={() => saveSearch(result)}
            disabled={!isResultValid(result) || loading}
            className="flex-1 bg-gray-600 text-white py-3 rounded-md hover:bg-gray-500 transition disabled:opacity-50"
          >
            {loading ? "Please wait..." : "Save"}
          </button>
        </div>
      </form>
      {error && <p className="text-red-400 mt-4">{error}</p>}
      {success && <p className="text-green-400 mt-4">Saved successfully!</p>}
    </div>
  );
};

// Main Form component, now simplified and composed of modular parts
const Form: React.FC<FormProps> = ({ setAnalysisData }) => {
  const {
    url,
    setUrl,
    loading,
    setLoading,
    error,
    setError,
    success,
    setSuccess,
    result,
    setResult,
    isValidUrl,
  } = useFormState();

  const handleSubmit = useAnalysisSubmit(
    url,
    setLoading,
    setError,
    setResult,
    setAnalysisData,
    isValidUrl
  );

  const saveSearch = useSaveSearch(url, setSuccess);

  return (
    <div className="flex justify-center items-center my-8 px-4 w-full ">
      <AnalysisFormUI
        url={url}
        setUrl={setUrl}
        loading={loading}
        error={error}
        success={success}
        handleSubmit={handleSubmit}
        saveSearch={saveSearch}
        result={result}
      />
    </div>
  );
};

export default Form;
