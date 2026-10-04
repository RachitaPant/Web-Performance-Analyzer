import { render, screen, within } from "@testing-library/react";
import fixture from "./fixtures/psi-webdev-mobile.json";
import StatsCards from "@/components/StatsCards/page";
import BottomStats from "@/components/BottomStats/page";
import { transformPageSpeed, type PsiResponse } from "@/server/transformPageSpeed";

// next/image needs the Next runtime; a plain <img> is enough to assert on.
type MockImageProps = React.ImgHTMLAttributes<HTMLImageElement> & { unoptimized?: boolean };
jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt }: MockImageProps) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

const report = transformPageSpeed(fixture as unknown as PsiResponse, "https://web.dev/", "mobile");

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
});
