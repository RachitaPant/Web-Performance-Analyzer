"use client";
import { useEffect, useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import { db } from "@/lib/firebaseClient";
import { useAuth } from "@/lib/AuthProvider";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { AnalysisData } from "../Form/page";

interface GraphProps {
  site: string;
  metric: "jsExecutionTime" | "cpuUsage" | "memoryUsage" | "diskIO";
  freshAnalysisData?: AnalysisData | number;
}

export const Graph = ({ site, metric, freshAnalysisData }: GraphProps) => {
  const { user } = useAuth();
  const [graphData, setGraphData] = useState<{ date: string; value: number }[]>(
    []
  );
  const maxValue = Math.max(...graphData.map((d) => d.value), 5000); // Fallback max
  const chartWidth = 300;
  const chartHeight = 100;

  useEffect(() => {
    const fetchData = async () => {
      // If fresh data is provided, use it
      if (freshAnalysisData && typeof freshAnalysisData !== "number") {
        const val =
          (freshAnalysisData?.puppeteerData?.[metric] as number) ?? null;
        if (val !== null) {
          const today = new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          setGraphData([{ date: today, value: val }]);
          return;
        }
      }

      // Fetch from Firestore
      if (!user) {
        toast.error("Please log in to view analytics");
        return;
      }

      const historyRef = collection(db, "users", user.uid, "history");
      const q = query(
        historyRef,
        where("url", "==", site),
        orderBy("created_at", "asc")
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const formatted = snapshot.docs
            .map((doc) => {
              const data = doc.data();
              const val =
                (data.analysis_data?.puppeteerData?.[metric] as number) ?? null;
              return val !== null
                ? {
                    date: new Date(data.created_at.toDate()).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                      }
                    ),
                    value: val,
                  }
                : null;
            })
            .filter(Boolean) as { date: string; value: number }[];

          setGraphData(formatted);
        },
        (error) => {
          console.error("Error fetching data:", error);
          toast.error("Failed to load analytics");
        }
      );

      return () => unsubscribe();
    };

    fetchData();
  }, [site, metric, freshAnalysisData, user]);

  const points = graphData
    .map((d, i) => {
      const x = (i / (graphData.length - 1 || 1)) * chartWidth;
      const y = chartHeight - (d.value / maxValue) * chartHeight;
      return `${x},${y}`;
    })
    .join(" ");

  if (!site) {
    return (
      <div className="text-center text-gray-400 text-sm mt-4">
        No site selected. Please select a URL to view analytics.
      </div>
    );
  }

  if (graphData.length === 0) {
    return (
      <div className="text-center text-gray-400 text-sm mt-4">
        No data available for {site}. Try analyzing it first.
      </div>
    );
  }

  return (
    <div className="bg-[#1a2634] rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white">Analytics</h3>
        <button className="h-7 text-xs bg-transparent border border-gray-700 text-gray-400 rounded px-3 flex items-center">
          Site <ChevronDownIcon className="ml-1 w-4 h-4" />
        </button>
      </div>
      <p className="text-[10px] mb-5">
        {metric} across time for {site}
      </p>
      <div className="h-48 relative">
        <div className="absolute inset-0">
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-gray-500">
            <div>High</div>
            <div>↑</div>
            <div>Mid</div>
            <div>↓</div>
            <div>Low</div>
            <div>0</div>
          </div>
          <div className="absolute left-5 right-0 top-0 h-full flex flex-col justify-between">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="border-t border-dashed border-gray-700 w-full h-0"
              ></div>
            ))}
          </div>
          <div className="absolute left-8 right-0 top-4 bottom-4">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-full"
            >
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
              {graphData.length > 0 && (
                <>
                  <line
                    x1={chartWidth - 50}
                    y1="0"
                    x2={chartWidth - 50}
                    y2={chartHeight}
                    stroke="#f97316"
                    strokeWidth="1"
                    strokeDasharray="2,2"
                  />
                  <circle
                    cx={chartWidth - 50}
                    cy={
                      chartHeight -
                      (graphData[graphData.length - 1].value / maxValue) *
                        chartHeight
                    }
                    r="4"
                    fill="#f97316"
                  />
                  <rect
                    x={chartWidth - 60}
                    y={
                      chartHeight -
                      (graphData[graphData.length - 1].value / maxValue) *
                        chartHeight -
                      10
                    }
                    width="20"
                    height="15"
                    rx="2"
                    fill="#f97316"
                  />
                  <text
                    x={chartWidth - 50}
                    y={
                      chartHeight -
                      (graphData[graphData.length - 1].value / maxValue) *
                        chartHeight
                    }
                    textAnchor="middle"
                    fill="white"
                    fontSize="8"
                  >
                    {graphData[graphData.length - 1].value}ms
                  </text>
                </>
              )}
            </svg>
          </div>
          <div className="absolute left-8 right-0 bottom-0 flex justify-between text-[10px] text-gray-500">
            {graphData.map((d, i) => (
              <div key={i}>{d.date}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
