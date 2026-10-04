import type { Rating } from "./report";

export const formatMs = (ms: number | null | undefined): string => {
  if (ms == null) return "N/A";
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${Math.round(ms)} ms`;
};

export const formatBytes = (bytes: number | null | undefined): string => {
  if (bytes == null) return "N/A";
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
};

// Lighthouse's own colour bands: 0.9+ good, 0.5–0.89 needs improvement, below poor.
export const ratingFromScore = (score: number | null | undefined): Rating | null => {
  if (score == null) return null;
  if (score >= 0.9) return "good";
  if (score >= 0.5) return "needs-improvement";
  return "poor";
};

export const RATING_STYLES: Record<Rating, { text: string; dot: string; label: string; stroke: string }> = {
  good: { text: "text-green-400", dot: "bg-green-400", label: "Good", stroke: "#22c55e" },
  "needs-improvement": {
    text: "text-yellow-400",
    dot: "bg-yellow-400",
    label: "Needs improvement",
    stroke: "#eab308",
  },
  poor: { text: "text-red-400", dot: "bg-red-400", label: "Poor", stroke: "#ef4444" },
};

export const NO_RATING_STYLE = { text: "text-gray-400", dot: "bg-gray-500", label: "No data", stroke: "#6b7280" };
