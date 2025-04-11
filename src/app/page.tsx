"use client";
import Footer from "@/components/Footer/page";
import Dashboard from "@/components/Dashboard/page";
import ProtectedRoute from "@/components/ProtectedRoute/page"
import { useState } from "react";
import SideBar from "@/components/SideBar/Page";
import HistoryPage from "@/components/History/page";

export default function Home() {
  const [activePage, setActivePage] = useState<"dashboard" | "history">("dashboard");

  return (
    <ProtectedRoute>
    <main className="scroll-smooth flex flex-row  bg-[#020e1d]">
        <SideBar onSelectPage={setActivePage} activePage={activePage} />
      <div className="flex-1 p-4 text-white overflow-y-auto">
          {activePage === "dashboard" && <Dashboard />}
          {activePage === "history" && <HistoryPage />}
        </div>
    </main>
    <Footer />
    </ProtectedRoute>
  );
}
