import { render, screen, within } from "@testing-library/react";
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
    expect(screen.getByRole("button", { name: /submit/i })).toBeDisabled();
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
});
