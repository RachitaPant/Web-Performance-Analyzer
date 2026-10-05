import type { Report, SourceStatus, Strategy } from "@/lib/report";
import { fetchCruxHistory } from "./cruxHistory";
import { fetchObservatory } from "./observatory";
import { fetchPageSpeed } from "./pagespeed";
import { SourceUnavailableError } from "./sources";
import { transformPageSpeed } from "./transformPageSpeed";

interface Settled<T> {
  value: T | null;
  status: SourceStatus;
}

// Runs an optional source; never throws — failures become a status the UI can explain.
const settle = async <T>(name: string, run: () => Promise<T>): Promise<Settled<T>> => {
  const start = Date.now();
  try {
    const value = await run();
    return { value, status: { status: "ok", message: null, ms: Date.now() - start } };
  } catch (error) {
    const ms = Date.now() - start;
    if (error instanceof SourceUnavailableError) {
      return { value: null, status: { status: "unavailable", message: error.message, ms } };
    }
    console.error(`${name} source failed:`, error);
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return {
      value: null,
      status: { status: "error", message: timedOut ? "Timed out." : "Temporarily unavailable.", ms },
    };
  }
};

// Fans out to every source in parallel. PageSpeed is required (its errors propagate);
// CrUX history and Observatory are optional and degrade to a status entry.
export const analyze = async (url: string, strategy: Strategy): Promise<Report> => {
  const timedPageSpeed = async () => {
    const start = Date.now();
    const psi = await fetchPageSpeed(url, strategy);
    return { psi, ms: Date.now() - start };
  };

  const [pagespeed, fieldHistory, security] = await Promise.all([
    timedPageSpeed(),
    settle("cruxHistory", () => fetchCruxHistory(url, strategy)),
    settle("observatory", () => fetchObservatory(url)),
  ]);

  return {
    ...transformPageSpeed(pagespeed.psi, url, strategy),
    fieldHistory: fieldHistory.value,
    security: security.value,
    sources: {
      pagespeed: { status: "ok", message: null, ms: pagespeed.ms },
      cruxHistory: fieldHistory.status,
      observatory: security.status,
    },
  };
};
