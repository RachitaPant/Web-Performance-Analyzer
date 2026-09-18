export default function Header() {
  return (
    <header className="sticky top-0 z-30 bg-[#0a1929]/80 backdrop-blur-md p-4 flex items-center justify-between border-b border-blue-500/20">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-pink-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
            <path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4" />
            <path d="M21 9H3" />
            <path d="M12 13v3" />
          </svg>
        </div>
        <div>
          <span className="font-semibold text-white block leading-tight">
            Performance Dashboard
          </span>
          <span className="text-xs text-gray-400">
            Audit and track your site&apos;s speed
          </span>
        </div>
      </div>
    </header>
  );
}
