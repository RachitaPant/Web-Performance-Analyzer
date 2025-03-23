import Image from "next/image"
import { BellIcon, SearchIcon, ShoppingCartIcon } from "lucide-react"
export default function Header(){
    return (<header className="bg-[#1a2634] p-4 flex items-center justify-between border-b border-gray-700">

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
        
        <div className="flex items-center gap-4">
          <button className="text-gray-400 hover:text-white">
            <SearchIcon className="w-5 h-5" />
          </button>
          <button className="text-gray-400 hover:text-white relative">
            <BellIcon className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <button className="text-gray-400 hover:text-white relative">
            <ShoppingCartIcon className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-teal-500 rounded-full flex items-center justify-center text-[10px]">
              3
            </span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden">
              <Image
                src="/placeholder.svg?height=32&width=32"
                alt="User avatar"
                width={32}
                height={32}
                className="object-cover"
              />
            </div>
            <div className="text-xs">
              <div className="text-white">Olivia's Clothing</div>
              <div className="text-gray-400">Admin</div>
            </div>
          </div>
        </div>
        </header>)
}
