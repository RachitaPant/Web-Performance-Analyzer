import { fireEvent, render, screen, within } from "@testing-library/react";
import AiInsights from "@/components/AiInsights/page";
import StatsCards from "@/components/StatsCards/page";
import BottomStats from "@/components/BottomStats/page";
import FieldTrend from "@/components/FieldTrend/page";
import Security from "@/components/Security/page";
import DataSources from "@/components/DataSources/page";
import { makeReport } from "./helpers";

// next/image needs the Next runtime; a plain <img> is enough to assert on.
type MockImageProps = React.ImgHTMLAttributes<HTMLImageElement> & { unoptimized?: boolean };
jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt }: MockImageProps) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

const report = makeReport();

describe("dashboard renders real report data", () => {
  test("StatsCards shows formatted lab metrics with Lighthouse ratings", () => {
    render(<StatsCards report={report} />);
    expect(screen.getByText("53")).toBeInTheDocument();
    expect(screen.getByText("Total Blocking Time").closest("div.dash-card")).toHaveTextContent("963 ms");
    expect(screen.getByText("Cumulative Layout Shift").closest("div.dash-card")).toHaveTextContent("0.119");
    expect(screen.queryByText(/vs previous/i)).not.toBeInTheDocument();
  });

  test("BottomStats shows ranked opportunities, CrUX field data and diagnostics", () => {
    render(<BottomStats report={report} />);

    const fixList = screen.getByRole("list");
    expect(within(fixList).getAllByRole("listitem")[0]).toHaveTextContent("Render-blocking requests");

    const inpRow = screen.getByText("Interaction to Next Paint").closest("tr")!;
    expect(inpRow).toHaveTextContent("218 ms");
    expect(inpRow).toHaveTextContent("Needs improvement");

    expect(screen.getByText("DOM elements").parentElement).toHaveTextContent("838");
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Why is my LCP slow?" })).toBeEnabled();
  });

  test("FieldTrend shows the latest p75 per Core Web Vital with its rating", () => {
    render(<FieldTrend history={report.fieldHistory} unavailableReason={null} />);
    const lcp = screen.getByRole("img", { name: /LCP p75 over 4 weeks, latest 3\.1 s/ });
    expect(lcp).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /INP p75 over 4 weeks, latest 218 ms/ })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /CLS p75 over 4 weeks, latest 0\.01/ })).toBeInTheDocument();
  });

  test("FieldTrend and Security explain why a source is missing", () => {
    render(
      <>
        <FieldTrend history={null} unavailableReason="Chrome UX Report API isn't enabled for this API key." />
        <Security security={null} unavailableReason="Temporarily unavailable." />
      </>
    );
    expect(screen.getByText(/isn't enabled for this API key/)).toBeInTheDocument();
    expect(screen.getByText("Temporarily unavailable.")).toBeInTheDocument();
  });

  test("Security shows the Observatory grade and DataSources lists every source", () => {
    render(
      <>
        <Security security={report.security} unavailableReason={null} />
        <DataSources sources={{ ...report.sources, cruxHistory: { status: "unavailable", message: "not enabled", ms: 5 } }} />
      </>
    );
    expect(screen.getByText("A+")).toBeInTheDocument();
    expect(screen.getByText("11 of 12 checks passed")).toBeInTheDocument();
    expect(screen.getByText("CrUX history").parentElement).toHaveTextContent("unavailable");
  });

  describe("AiInsights", () => {
    const respond = (status: number, body: unknown) =>
      (global.fetch = jest.fn().mockResolvedValue({ ok: status < 400, status, json: async () => body }) as jest.Mock);
    afterEach(() => {
      // jsdom has no fetch of its own; drop the stub so tests stay independent.
      delete (global as { fetch?: unknown }).fetch;
    });

    test("generates on request and shows findings with readable evidence", async () => {
      respond(200, {
        summary: "Render-blocking CSS is the biggest win.",
        findings: [
          {
            severity: "critical",
            title: "Defer render-blocking CSS",
            explanation: "It delays first paint.",
            fix: "Inline critical CSS.",
            estimatedImpact: "~2.3 s faster LCP",
            evidence: ["opportunity:render-blocking-insight", "lab:tbt"],
          },
        ],
        meta: { model: "claude-opus-5-5", droppedFindings: 1, latencyMs: 4200, inputTokens: 1, outputTokens: 1, cacheReadTokens: 0 },
      });
      render(<AiInsights report={report} />);
      fireEvent.click(screen.getByRole("button", { name: "Generate insights" }));

      expect(await screen.findByText("Render-blocking CSS is the biggest win.")).toBeInTheDocument();
      expect(screen.getByText("critical")).toBeInTheDocument();
      const evidence = within(screen.getByRole("list", { name: "Evidence" }));
      expect(evidence.getByText(/^Render-blocking requests · est\. 2\.3 s savings/)).toBeInTheDocument();
      expect(evidence.getByText(/963 ms/)).toBeInTheDocument();
      expect(screen.getByText("1 unsupported finding(s) removed")).toBeInTheDocument();
      expect(JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body).report.url).toBe(report.url);
    });

    test("shows the server's message when AI isn't available", async () => {
      respond(503, { error: "AI features aren't configured on this deployment yet." });
      render(<AiInsights report={report} />);
      fireEvent.click(screen.getByRole("button", { name: "Generate insights" }));

      expect(await screen.findByText(/aren't configured/)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    });
  });
});
