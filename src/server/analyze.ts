import type { Report, SourceStatus, Strategy } from "@/lib/report";
import type { PageSpeedReport } from "@/lib/transformPageSpeed";
import { fetchCruxHistory } from "./cruxHistory";
import { fetchObservatory } from "./observatory";
import { fetchPageSpeed } from "./pagespeed";
import { SourceUnavailableError } from "./sources";
import { transformPageSpeed } from "@/lib/transformPageSpeed";

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

const optionalSources = (url: string, strategy: Strategy) =>
  Promise.all([
    settle("cruxHistory", () => fetchCruxHistory(url, strategy)),
    settle("observatory", () => fetchObservatory(url)),
  ]);

const assemble = (
  pagespeed: PageSpeedReport,
  pagespeedMs: number | null,
  [fieldHistory, security]: Awaited<ReturnType<typeof optionalSources>>
): Report => ({
  ...pagespeed,
  fieldHistory: fieldHistory.value,
  security: security.value,
  sources: {
    pagespeed: { status: "ok", message: null, ms: pagespeedMs },
    cruxHistory: fieldHistory.status,
    observatory: security.status,
  },
});

// Server path: fans out to every source in parallel. PageSpeed is required (its errors
// propagate); CrUX history and Observatory are optional and degrade to a status entry.
export const analyze = async (url: string, strategy: Strategy): Promise<Report> => {
  const timedPageSpeed = async () => {
    const start = Date.now();
    const psi = await fetchPageSpeed(url, strategy);
    return { psi, ms: Date.now() - start };
  };

  const [pagespeed, optional] = await Promise.all([timedPageSpeed(), optionalSources(url, strategy)]);
  return assemble(transformPageSpeed(pagespeed.psi, url, strategy), pagespeed.ms, optional);
};

// Browser path: PageSpeed already ran client-side; add the server-side sources.
export const enrichPageSpeedReport = async (pagespeed: PageSpeedReport, pagespeedMs: number | null): Promise<Report> =>
  assemble(pagespeed, pagespeedMs, await optionalSources(pagespeed.url, pagespeed.strategy));
