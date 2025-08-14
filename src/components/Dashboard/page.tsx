import { useState } from "react";
import Header from "../Header/page";
import StatsCards from "../StatsCards/page";
import Charts from "../Charts/page";
import BottomStats from "../BottomStats/page";
import Form from "../Form/page";
import { AnalysisData } from "../Form/page";

export default function Dashboard() {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);

  return (
    <div className="flex h-screen bg-[#0e1621] w-full">
      <div className="flex-1 overflow-auto">
        <Header />
        <div className="p-4">
          <Form setAnalysisData={setAnalysisData} />
          {analysisData && (
            <>
              <StatsCards data={analysisData || {}} />
              <Charts data={analysisData || {}} />
              <BottomStats data={analysisData || {}} />
            </>
          )}
          {!analysisData && (
            <>
              <div className="w-full text-center">
                <p>Results will appear here !</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
