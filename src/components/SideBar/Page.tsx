/* eslint-disable @typescript-eslint/no-unused-vars */
import Link from "next/link";
import { ChevronDownIcon } from "lucide-react";
import { signOutUser } from "@/lib/auth";

interface SideBarProps {
  onSelectPage: (page: "dashboard" | "history") => void;
  activePage: string;
}

export default function SideBar({ onSelectPage, activePage }: SideBarProps) {
  return (
    <div className="w-56 bg-[#1a2634] text-white flex flex-col h-screen">
      <div className="p-4 border-b border-gray-700 flex items-center gap-2 ">
        <div className="bg-emerald-500 rounded p-1"></div>
        <span className="font-bold text-lg">AnalyseAi</span>
      </div>

      <div className="px-4 py-2 text-xs text-gray-400 ">MENU</div>

      <nav className="flex-1">
        <Link
          href="#"
          className="flex items-center gap-3 px-4 py-2 bg-orange-500 text-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="7" height="9" x="3" y="3" rx="1" />
            <rect width="7" height="5" x="14" y="3" rx="1" />
            <rect width="7" height="9" x="14" y="12" rx="1" />
            <rect width="7" height="5" x="3" y="16" rx="1" />
          </svg>
          <span onClick={() => onSelectPage("dashboard")}>Analytics</span>
          <div className="ml-auto w-2 h-2 rounded-full bg-white"></div>
        </Link>

        <Link
          href="#"
          className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-[#243242]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m7.5 4.27 9 5.15" />
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <path d="m3.3 7 8.7 5 8.7-5" />
            <path d="M12 22V12" />
          </svg>
          <button onClick={() => onSelectPage("history")}>
            <span>History</span>
          </button>
          <ChevronDownIcon className="ml-auto w-4 h-4" />
        </Link>
      </nav>

      <nav className="mb-auto">
        <button
          onClick={() => {
            signOutUser();
          }}
          className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-[#243242] w-full text-left"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Logout</span>
        </button>
      </nav>

      <div className="p-4 mt-auto">
        <div className="bg-[#243242] rounded-lg p-3 relative overflow-hidden">
          <div className="relative z-10">
            <h4 className="font-medium text-sm">
              Improve Your
              <br />
              Website Efficiency
            </h4>
          </div>
          <div className="absolute bottom-0 right-0">
            <svg
              width="50"
              height="70"
              viewBox="0 0 70 70"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 60L20 40L30 50L40 30L50 45L60 10"
                stroke="#FF7A00"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
