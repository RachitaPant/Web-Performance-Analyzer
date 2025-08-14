"use client";
import Footer from "@/components/Footer/page";
import Dashboard from "@/components/Dashboard/page";
import ProtectedRoute from "@/components/ProtectedRoute/page";
import { useState } from "react";
import SideBar from "@/components/SideBar/Page";
import HistoryPage from "@/components/History/page";

export default function Home() {
  const [activePage, setActivePage] = useState<"dashboard" | "history">(
    "dashboard"
  );

  return (
    <ProtectedRoute>
      <main className="h-screen flex flex-row overflow-y-hidden  bg-[#020e1d]">
        <SideBar onSelectPage={setActivePage} activePage={activePage} />
        <div className="flex-1  text-white ">
          {activePage === "dashboard" && <Dashboard />}
          {activePage === "history" && <HistoryPage />}
        </div>
      </main>
    </ProtectedRoute>
  );
}
