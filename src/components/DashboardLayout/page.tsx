"use client";

import { useState } from "react";
import {
  Home,
  Plus,
  Clock,
  Shuffle,
  Bookmark,
  Settings,
  Sun,
  Menu,
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  activePage?: "overview" | "new-audit" | "history" | "compare" | "saved" | "settings";
}

export default function DashboardLayout({ children, activePage = "overview" }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "new-audit", label: "New Audit", icon: Plus },
    { id: "history", label: "History", icon: Clock },
    { id: "compare", label: "Compare", icon: Shuffle },
    { id: "saved", label: "Saved Reports", icon: Bookmark },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[#020e1d] text-white">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen bg-gradient-to-b from-[#0a1929] to-[#020e1d] border-r border-blue-500/20 transition-all duration-300 z-40 ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-blue-500/20 flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            S
          </div>
          {sidebarOpen && (
            <div>
              <div className="font-bold text-sm">SitePulse</div>
              <div className="text-xs text-gray-500">SPEED MATTERS</div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive
                    ? "bg-gradient-to-r from-pink-500/30 to-purple-500/30 border border-pink-500/50 text-pink-300"
                    : "text-gray-400 hover:text-white hover:bg-blue-500/10"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-blue-500/20">
          <div className={`text-center text-xs text-gray-500 ${!sidebarOpen && "hidden"}`}>
            <p>Faster websites</p>
            <p className="text-pink-400">Happier users.</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-20"}`}>
        {/* Top Bar */}
        <div className="sticky top-0 z-30 border-b border-blue-500/20 bg-[#020e1d]/95 backdrop-blur">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-blue-500/20 rounded-lg transition"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-blue-500/20 rounded-lg transition">
                <Sun className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                R
              </div>
              <div className="text-sm">
                <p className="font-semibold">Rachita</p>
                <p className="text-xs text-gray-500">View Profile</p>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="overflow-auto h-[calc(100vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  );
}
