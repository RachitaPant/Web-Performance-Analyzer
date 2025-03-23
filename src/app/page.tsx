"use client";
import Footer from "@/components/Footer/page";
import Dashboard from "@/components/Dashboard/page";
import { useState } from "react";

export default function Home() {
  const [analysisData, setAnalysisData] = useState(null);

  return (
    <>
    <main className="scroll-smooth flex  flex-col items-center  bg-[#020e1d]">
      <Dashboard/>
      <Footer/>
    </main>
  
    </>
  );
}