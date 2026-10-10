"use client";
import { useMemo, useState } from "react";
import { Sparkles, ShieldCheck, RefreshCw } from "lucide-react";
import type { Report } from "@/lib/report";
import { InsightsResponseSchema, type Finding, type InsightsResponse } from "@/lib/insights";
import { buildEvidence } from "@/lib/evidence";
import { formatMs } from "@/lib/format";

const SEVERITY_STYLES: Record<Finding["severity"], string> = {
  critical: "bg-red-500/15 text-red-300 border-red-500/40",
  high: "bg-orange-500/15 text-orange-300 border-orange-500/40",
  medium: "bg-yellow-500/15 text-yellow-300 border-yellow-500/40",
  low: "bg-blue-500/15 text-blue-300 border-blue-500/40",
};

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; data: InsightsResponse }
  | { status: "error"; message: string };

// AI audit summary. Generated on request (each run costs money), cached server-side per report.
const AiInsights: React.FC<{ report: Report }> = ({ report }) => {
  const [state, setState] = useState<State>({ status: "idle" });
  const evidenceById = useMemo(() => new Map(buildEvidence(report).map((e) => [e.id, e])), [report]);

  // A new report invalidates insights generated for the previous one.
  const [reportKey, setReportKey] = useState(report.fetchedAt + report.url + report.strategy);
  const currentKey = report.fetchedAt + report.url + report.strategy;
  if (currentKey !== reportKey) {
    setReportKey(currentKey);
    setState({ status: "idle" });
  }

  const generate = async () => {
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? "Couldn't generate insights. Please try again.");
      const parsed = InsightsResponseSchema.safeParse(body);
      if (!parsed.success) throw new Error("Received an unexpected response. Please try again.");
      setState({ status: "done", data: parsed.data });
    } catch (err) {
      setState({ status: "error", message: err instanceof Error ? err.message : "Something went wrong." });
    }
  };

  return (
    <section className="dash-card animate-fade-up p-5" aria-labelledby="ai-insights-heading" aria-busy={state.status === "loading"}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h3 id="ai-insights-heading" className="font-semibold text-white flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-pink-400" /> AI Audit Summary
        </h3>
        {state.status !== "loading" && (
          <button
            type="button"
            onClick={generate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-pink-500 to-pink-600 px-4 py-2 text-sm font-medium text-white hover:shadow-lg hover:shadow-pink-500/40 active:scale-[0.98] transition-all"
          >
            {state.status === "done" ? <RefreshCw className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
            {state.status === "done" ? "Regenerate" : state.status === "error" ? "Try again" : "Generate insights"}
          </button>
        )}
      </div>

      {state.status === "idle" && (
        <p className="text-sm text-gray-400">
          Get a prioritized, plain-English action plan for this audit. Every finding cites the measurements it is based on.
        </p>
      )}

      {state.status === "loading" && (
        <div className="space-y-3" role="status">
          <span className="sr-only">Generating insights…</span>
          <div className="h-3 w-3/4 rounded-full shimmer-bg" />
          <div className="h-3 w-2/3 rounded-full shimmer-bg" />
          <div className="h-16 w-full rounded-lg shimmer-bg" />
          <div className="h-16 w-full rounded-lg shimmer-bg" />
        </div>
      )}

      {state.status === "error" && <p className="text-sm text-red-300">{state.message}</p>}

      {state.status === "done" && (
        <div className="space-y-4">
          <p className="text-sm text-gray-200 leading-relaxed">{state.data.summary}</p>
          <ol className="space-y-3">
            {state.data.findings.map((f, i) => (
              <li key={`${f.title}-${i}`} className="rounded-lg border border-blue-500/15 bg-blue-950/30 p-4">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${SEVERITY_STYLES[f.severity]}`}>
                    {f.severity}
                  </span>
                  <h4 className="text-sm font-semibold text-white">{f.title}</h4>
                  {f.estimatedImpact && f.estimatedImpact !== "Unknown" && (
                    <span className="ml-auto text-xs text-pink-300">{f.estimatedImpact}</span>
                  )}
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">{f.explanation}</p>
                <p className="mt-2 text-xs text-gray-200 leading-relaxed">
                  <span className="font-semibold text-blue-200">Fix: </span>
                  {f.fix}
                </p>
                <ul className="mt-2.5 flex flex-wrap gap-1.5" aria-label="Evidence">
                  {f.evidence.map((id) => {
                    const e = evidenceById.get(id);
                    return (
                      <li
                        key={id}
                        title={e ? `${e.label}: ${e.value}` : id}
                        className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-gray-400"
                      >
                        {e ? `${e.label.replace(/^Failing Lighthouse audit: /, "")} · ${e.value}` : id}
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ol>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-gray-500">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Every finding is checked against the report data
            </span>
            {state.data.meta.droppedFindings > 0 && (
              <span>{state.data.meta.droppedFindings} unsupported finding(s) removed</span>
            )}
            <span>
              {state.data.meta.model} · {formatMs(state.data.meta.latencyMs)}
            </span>
          </p>
        </div>
      )}
    </section>
  );
};

export default AiInsights;
