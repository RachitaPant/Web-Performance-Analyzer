"use client";

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
    <div className="flex h-screen bg-[#020e1d] w-full overflow-hidden">
      <div className="flex-1 overflow-auto">
        <Header />
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
          <Form setAnalysisData={setAnalysisData} />

          {analysisData && (
            <div className="space-y-6">
              <StatsCards data={analysisData || {}} />
              <Charts data={analysisData || {}} />
              <BottomStats data={analysisData || {}} />
            </div>
          )}

          {!analysisData && (
            <div className="dash-card animate-fade-up flex flex-col items-center justify-center text-center py-20 px-6">
              <div className="text-5xl mb-4 animate-glow-pulse rounded-full">
                ⚡
              </div>
              <h2 className="text-lg font-semibold text-white mb-1">
                Results will appear here
              </h2>
              <p className="text-sm text-gray-400 max-w-sm">
                Enter a website URL above and run an audit to see performance
                scores, Core Web Vitals and detailed insights.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
