/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

// Maps backend/network errors to short, non-technical messages for end users
const getFriendlyErrorMessage = (status: number | null, rawMessage?: string): string => {
  if (status === null) {
    return "Can't reach the analysis service right now. Check your connection and try again.";
  }
  switch (status) {
    case 400:
      return rawMessage || "That doesn't look like a valid website URL. Please check it and try again.";
    case 404:
      return "The analysis service couldn't be found. Please try again shortly.";
    case 429:
      return "We're getting a lot of requests right now. Please wait a few seconds and try again.";
    case 504:
      return rawMessage || "This site is taking too long to analyze. It may be slow or too heavy — try a different URL.";
    case 500:
    case 502:
    case 503:
      return rawMessage || "Something went wrong on our end. Please try again in a moment.";
    default:
      return rawMessage || "Something unexpected happened. Please try again.";
  }
};

const RETRY_SECONDS = 5;
const MAX_AUTO_RETRIES = 2;

// Modularized hook for form state and validation
const useFormState = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<AnalysisData | null>(null);
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);

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
    retryCountdown,
    setRetryCountdown,
  };
};

// Modularized hook for handling analysis submission, with auto-retry-with-countdown on rate limits
const useAnalysisSubmit = (
  url: string,
  setLoading: (loading: boolean) => void,
  setError: (error: string) => void,
  setResult: (result: AnalysisData | null) => void,
  setAnalysisData: (data: AnalysisData) => void,
  isValidUrl: (str: string) => boolean,
  retryCountdown: number | null,
  setRetryCountdown: (value: number | null) => void
) => {
  const retryAttemptsRef = useRef(0);

  const performAnalysis = useCallback(async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const friendlyMessage = getFriendlyErrorMessage(res.status, body?.error);

        if (res.status === 429 && retryAttemptsRef.current < MAX_AUTO_RETRIES) {
          retryAttemptsRef.current += 1;
          setError(friendlyMessage);
          setLoading(false);
          setRetryCountdown(RETRY_SECONDS);
          return;
        }

        throw new Error(friendlyMessage);
      }

      const analysis_data = await res.json();
      const resultWithUrl: AnalysisData = { ...analysis_data, url };

      retryAttemptsRef.current = 0;
      setResult(resultWithUrl);
      setAnalysisData(resultWithUrl);
      setError("");
    } catch (err) {
      const isNetworkError = err instanceof TypeError;
      const errorMessage = isNetworkError
        ? getFriendlyErrorMessage(null)
        : err instanceof Error
          ? err.message
          : getFriendlyErrorMessage(500);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [url, setLoading, setError, setResult, setAnalysisData, setRetryCountdown]);

  // Ticks the countdown every second; fires the retry once it reaches zero
  useEffect(() => {
    if (retryCountdown === null) return;

    if (retryCountdown <= 0) {
      setRetryCountdown(null);
      performAnalysis();
      return;
    }

    const timer = setTimeout(() => {
      setRetryCountdown(retryCountdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [retryCountdown, setRetryCountdown, performAnalysis]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidUrl(url)) {
      setError("Invalid URL. Please enter a valid website URL.");
      toast.error("Invalid URL");
      return;
    }
    retryAttemptsRef.current = 0;
    setRetryCountdown(null);
    performAnalysis();
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

// Circular countdown badge shown while auto-retrying after a rate-limit error
const RetryCountdown: React.FC<{ secondsLeft: number; total: number }> = ({
  secondsLeft,
  total,
}) => {
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const progress = secondsLeft / total;

  return (
    <div className="mt-4 flex items-center gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 animate-fade-up">
      <div className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 32 32">
          <circle
            cx="16"
            cy="16"
            r={radius}
            fill="none"
            stroke="rgba(234,179,8,0.2)"
            strokeWidth="3"
          />
          <circle
            cx="16"
            cy="16"
            r={radius}
            fill="none"
            stroke="rgb(234,179,8)"
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <span className="text-xs font-bold text-yellow-400">{secondsLeft}</span>
      </div>
      <p className="text-sm text-yellow-300">
        Too many requests — retrying automatically in{" "}
        <span className="font-semibold">{secondsLeft}s</span>...
      </p>
    </div>
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
  retryCountdown: number | null;
}> = ({
  url,
  setUrl,
  loading,
  error,
  success,
  handleSubmit,
  saveSearch,
  result,
  retryCountdown,
}) => {
  const isResultValid = (result: any): result is AnalysisData =>
    result && result.puppeteerData && result.lighthouseData;

  return (
    <div className="w-full mx-auto dash-card animate-fade-up p-6 md:p-8">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">⚡</span>
        <h1 className="text-2xl font-bold text-white">
          Analyze Your Website
        </h1>
      </div>
      <p className="text-sm text-gray-400 mb-6">
        Note: Limited to 1 audit per session to manage GCP costs. Audits may
        take time.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="url"
          placeholder="Enter website URL (e.g., https://example.com)"
          className="flex-1 p-3 bg-blue-950/40 text-white border border-blue-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-400 transition-all placeholder:text-gray-500"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || retryCountdown !== null}
            className="flex-1 sm:flex-none relative overflow-hidden bg-gradient-to-r from-pink-500 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-pink-500/40 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {loading ? "Analyzing..." : "Analyze"}
          </button>
          <button
            type="button"
            onClick={() => saveSearch(result)}
            disabled={!isResultValid(result) || loading || retryCountdown !== null}
            className="flex-1 sm:flex-none border border-blue-500/30 text-white px-6 py-3 rounded-lg hover:border-blue-400 hover:bg-blue-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </form>

      {loading && (
        <div className="mt-6 space-y-2 animate-fade-up">
          <div className="h-2 w-2/3 rounded-full shimmer-bg" />
          <div className="h-2 w-1/2 rounded-full shimmer-bg" />
          <div className="h-2 w-5/6 rounded-full shimmer-bg" />
        </div>
      )}

      {retryCountdown !== null ? (
        <RetryCountdown secondsLeft={retryCountdown} total={RETRY_SECONDS} />
      ) : (
        error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 animate-fade-up">
            <span className="text-red-400 text-base leading-5">⚠️</span>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )
      )}
      {success && (
        <p className="text-green-400 mt-4 animate-fade-up text-sm">
          Saved successfully!
        </p>
      )}
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
    retryCountdown,
    setRetryCountdown,
  } = useFormState();

  const handleSubmit = useAnalysisSubmit(
    url,
    setLoading,
    setError,
    setResult,
    setAnalysisData,
    isValidUrl,
    retryCountdown,
    setRetryCountdown
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
        retryCountdown={retryCountdown}
      />
    </div>
  );
};

export default Form;
