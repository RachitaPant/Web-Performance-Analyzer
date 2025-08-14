import Image from "next/image";

export default function Header() {
  return (
    <header className="bg-[#1a2634] p-4 flex items-center justify-between border-b border-gray-700">
      <div className="flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-gray-400"
        >
          <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
          <path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4" />
          <path d="M21 9H3" />
          <path d="M12 13v3" />
        </svg>
        <span className="font-semibold text-white">Dashboard</span>
      </div>
    </header>
  );
}
