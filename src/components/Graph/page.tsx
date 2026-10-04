"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebaseClient";
import { useAuth } from "@/lib/AuthProvider";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import type { HistorySnapshot, Report, Strategy } from "@/lib/report";

interface GraphProps {
  site: string;
  strategy: Strategy;
  current: Report;
}

interface Point {
  time: number;
  score: number;
  unsaved?: boolean;
}

const CHART_W = 300;
const CHART_H = 100;

const formatDate = (time: number) =>
  new Date(time).toLocaleDateString("en-US", { month: "short", day: "numeric" });

// Performance score trend for this URL + device, from the user's saved history.
export const Graph = ({ site, strategy, current }: GraphProps) => {
  const { user } = useAuth();
  const [history, setHistory] = useState<Point[]>([]);

  useEffect(() => {
    if (!user || !site) return;

    // Single-field filter needs no composite index; ordering happens client-side.
    const q = query(collection(db, "users", user.uid, "history"), where("url", "==", site));

    return onSnapshot(
      q,
      (snapshot) => {
        const points = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            const snap = data.analysis_data as Partial<HistorySnapshot> | undefined;
            const score = snap?.categories?.performance;
            if (snap?.strategy !== strategy || typeof score !== "number") return null;
            return { time: (data.created_at as Timestamp).toMillis(), score };
          })
          .filter((p): p is Point => p !== null)
          .sort((a, b) => a.time - b.time);
        setHistory(points);
      },
      (error) => console.error("Error loading history:", error)
    );
  }, [user, site, strategy]);

  const currentScore = current.categories.performance;
  const currentTime = Date.parse(current.fetchedAt);
  const alreadySaved = history.some((p) => Math.abs(p.time - currentTime) < 5 * 60_000);
  const points: Point[] =
    currentScore != null && !alreadySaved
      ? [...history, { time: currentTime, score: currentScore, unsaved: true }]
      : history;

  if (points.length === 0) {
    return (
      <div className="dash-card animate-fade-up flex items-center justify-center text-center text-gray-400 text-sm p-8 min-h-[200px]">
        No performance score available for {site}.
      </div>
    );
  }

  const coords = points.map((p, i) => ({
    ...p,
    x: points.length === 1 ? CHART_W / 2 : (i / (points.length - 1)) * CHART_W,
    y: CHART_H - (p.score / 100) * CHART_H,
  }));
  const polyline = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const last = coords[coords.length - 1];

  return (
    <div className="dash-card animate-fade-up p-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-white">Performance Trend</h3>
        <span className="text-[10px] text-gray-500 capitalize">{strategy}</span>
      </div>
      <p className="text-[10px] text-gray-400 mb-5 truncate">
        {points.length === 1
          ? "Save this run to start tracking the score over time."
          : `Lighthouse performance score across ${points.length} runs of ${site}`}
      </p>
      <div className="h-48 relative">
        <div className="absolute left-0 top-4 bottom-4 flex flex-col justify-between text-[10px] text-gray-500">
          <div>100</div>
          <div>50</div>
          <div>0</div>
        </div>
        <div className="absolute left-8 right-0 top-4 bottom-4 flex flex-col justify-between">
          {[0, 1, 2].map((i) => (
            <div key={i} className="border-t border-dashed border-gray-700 w-full h-0" />
          ))}
        </div>
        <div className="absolute left-8 right-2 top-4 bottom-4">
          <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
            <defs>
              <linearGradient id="trend-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
              </linearGradient>
            </defs>
            {coords.length > 1 && (
              <>
                <polygon
                  points={`${polyline} ${last.x},${CHART_H} ${coords[0].x},${CHART_H}`}
                  fill="url(#trend-gradient)"
                  fillOpacity="0.4"
                />
                <polyline points={polyline} fill="none" stroke="#f97316" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              </>
            )}
          </svg>
          {coords.map((c) => (
            <div
              key={c.time}
              title={`${formatDate(c.time)}: ${c.score}${c.unsaved ? " (not saved)" : ""}`}
              className={`absolute w-2.5 h-2.5 -ml-[5px] -mt-[5px] rounded-full ${
                c.unsaved ? "border-2 border-orange-400 bg-[#020e1d]" : "bg-orange-400"
              }`}
              style={{ left: `${(c.x / CHART_W) * 100}%`, top: `${(c.y / CHART_H) * 100}%` }}
            />
          ))}
          <div
            className="absolute -translate-x-1/2 -translate-y-7 rounded bg-orange-500 px-1.5 py-0.5 text-[10px] font-semibold text-white"
            style={{ left: `${(last.x / CHART_W) * 100}%`, top: `${(last.y / CHART_H) * 100}%` }}
          >
            {last.score}
          </div>
        </div>
        <div className="absolute left-8 right-2 bottom-0 flex justify-between text-[10px] text-gray-500">
          {coords.length > 1 && <div>{formatDate(coords[0].time)}</div>}
          <div className={coords.length === 1 ? "mx-auto" : ""}>{formatDate(last.time)}</div>
        </div>
      </div>
    </div>
  );
};
