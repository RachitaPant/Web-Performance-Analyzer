import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { z } from "zod";
import { STRATEGIES } from "@/lib/report";
import { AiError } from "@/server/ai/llm";
import { formatInsightsForMcp, formatReportForMcp } from "@/server/mcp/format";
import { AnalysisError } from "@/server/pagespeed";
import { getInsights, getReport, RateLimitedError } from "@/server/services";

// MCP server (stateless Streamable HTTP) exposing SitePulse to AI assistants such as Claude Code
// or Cursor. Server-side audits can take up to the PSI deadline, like /api/analyze.
export const maxDuration = 180;

// Shared rate-limit bucket for MCP callers (they all present the same deployment key).
const MCP_CLIENT_ID = "mcp";

const AuditInput = z.object({
  url: z.string().min(1).describe("Public website URL or domain, e.g. https://example.com or example.com"),
  strategy: z.enum(STRATEGIES).default("mobile").describe("Device to emulate: mobile (default) or desktop"),
});

const toolError = (error: unknown) => {
  const message =
    error instanceof RateLimitedError || error instanceof AnalysisError || error instanceof AiError
      ? error.message
      : "Something went wrong running the audit. Please try again.";
  if (!(error instanceof RateLimitedError || error instanceof AnalysisError || error instanceof AiError)) {
    console.error("MCP tool error:", error);
  }
  return { content: [{ type: "text" as const, text: message }], isError: true };
};

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "analyze_url",
      {
        title: "Audit a website's performance",
        description:
          "Runs a Lighthouse audit (via Google PageSpeed Insights) on a public URL and returns lab metrics, " +
          "real-user Core Web Vitals (CrUX), failing audits ranked by estimated savings, diagnostics and a " +
          "security-header grade, as id-tagged evidence. Takes 10-60 s; heavy pages can take longer. " +
          "Results are cached for an hour.",
        inputSchema: AuditInput,
        annotations: { readOnlyHint: true, openWorldHint: true },
      },
      async ({ url, strategy }) => {
        try {
          const { report, cached } = await getReport(url, strategy, MCP_CLIENT_ID);
          return { content: [{ type: "text", text: formatReportForMcp(report, cached) }] };
        } catch (error) {
          return toolError(error);
        }
      }
    );

    server.registerTool(
      "get_ai_insights",
      {
        title: "Get a prioritized fix plan",
        description:
          "Audits the URL (reusing a cached audit when available) and returns an AI-generated, prioritized fix " +
          "plan. Every finding cites the evidence ids it is based on; unsupported findings are removed.",
        inputSchema: AuditInput,
        annotations: { readOnlyHint: true, openWorldHint: true },
      },
      async ({ url, strategy }) => {
        try {
          const { report } = await getReport(url, strategy, MCP_CLIENT_ID);
          const { insights } = await getInsights(report, MCP_CLIENT_ID);
          return { content: [{ type: "text", text: formatInsightsForMcp(report, insights) }] };
        } catch (error) {
          return toolError(error);
        }
      }
    );
  },
  { serverInfo: { name: "sitepulse", version: "1.0.0" } }
);

// The endpoint spends PageSpeed and LLM quota, so it requires a bearer token (MCP_API_KEY) and is
// disabled entirely when none is configured.
const verifyToken = (_req: Request, bearerToken?: string) => {
  const expected = process.env.MCP_API_KEY;
  if (!expected || !bearerToken) return undefined;
  const a = Buffer.from(bearerToken);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return undefined;
  return { token: bearerToken, clientId: MCP_CLIENT_ID, scopes: [] };
};

const authed = withMcpAuth(handler, verifyToken, { required: true });

const serve = (req: Request) =>
  process.env.MCP_API_KEY
    ? authed(req)
    : Promise.resolve(NextResponse.json({ error: "The SitePulse MCP server isn't enabled on this deployment." }, { status: 503 }));

export { serve as GET, serve as POST, serve as DELETE };
