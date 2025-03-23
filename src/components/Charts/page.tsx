
import {  ChevronDownIcon } from "lucide-react"
interface ChartsProps {
    data: any;
  }
  
  const Charts: React.FC<ChartsProps> = ({ data }) =>{
    return (  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Sales Analytics Chart */}
        <div className="bg-[#1a2634] rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Sales Analytics</h3>
            <button className="h-7 text-xs bg-transparent border border-gray-700 text-gray-400 rounded px-3 flex items-center">
              Week <ChevronDownIcon className="ml-1 w-4 h-4" />
            </button>
          </div>
          <div className="h-48 relative">
            <div className="absolute inset-0">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-gray-500">
                <div>5k</div>
                <div>4k</div>
                <div>3k</div>
                <div>2k</div>
                <div>1k</div>
                <div>0</div>
              </div>

              {/* Horizontal grid lines */}
              <div className="absolute left-5 right-0 top-0 h-full flex flex-col justify-between">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="border-t border-dashed border-gray-700 w-full h-0"></div>
                ))}
              </div>

              {/* Chart */}
              <div className="absolute left-8 right-0 top-4 bottom-4">
                <svg viewBox="0 0 300 100" className="w-full h-full">
                  <path
                    d="M0,70 C10,60 20,40 30,50 C40,60 50,80 60,70 C70,60 80,30 90,20 C100,10 110,30 120,40 C130,50 140,70 150,60 C160,50 170,20 180,30 C190,40 200,60 210,50 C220,40 230,20 240,30 C250,40 260,60 270,50 C280,40 290,30 300,40"
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="2"
                  />
                  <path
                    d="M0,70 C10,60 20,40 30,50 C40,60 50,80 60,70 C70,60 80,30 90,20 C100,10 110,30 120,40 C130,50 140,70 150,60 C160,50 170,20 180,30 C190,40 200,60 210,50 C220,40 230,20 240,30 C250,40 260,60 270,50 C280,40 290,30 300,40"
                    fill="url(#gradient)"
                    fillOpacity="0.2"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#f97316" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Vertical marker line */}
                  <line x1="150" y1="0" x2="150" y2="100" stroke="#f97316" strokeWidth="1" strokeDasharray="2,2" />
                  <circle cx="150" cy="60" r="4" fill="#f97316" />
                  <rect x="140" y="40" width="20" height="15" rx="2" fill="#f97316" />
                  <text x="150" y="50" textAnchor="middle" fill="white" fontSize="8">
                    $2k
                  </text>
                </svg>
              </div>

              {/* X-axis labels */}
              <div className="absolute left-8 right-0 bottom-0 flex justify-between text-[10px] text-gray-500">
                <div>Mar 12</div>
                <div>Mar 13</div>
                <div>Mar 14</div>
                <div>Mar 15</div>
                <div>Mar 16</div>
                <div>Mar 17</div>
                <div>Mar 18</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sales by Category Chart */}
        <div className="bg-[#1a2634] rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Sales by Category</h3>
            <button className="h-7 text-xs bg-transparent border border-gray-700 text-gray-400 rounded px-3 flex items-center">
              Week <ChevronDownIcon className="ml-1 w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Donut chart segments */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#f43f5e"
                  strokeWidth="20"
                  strokeDasharray="75.4 176.6"
                  strokeDashoffset="0"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#06b6d4"
                  strokeWidth="20"
                  strokeDasharray="37.7 176.6"
                  strokeDashoffset="-75.4"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#8b5cf6"
                  strokeWidth="20"
                  strokeDasharray="25.1 176.6"
                  strokeDashoffset="-113.1"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#f59e0b"
                  strokeWidth="20"
                  strokeDasharray="25.1 176.6"
                  strokeDashoffset="-138.2"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#10b981"
                  strokeWidth="20"
                  strokeDasharray="12.6 176.6"
                  strokeDashoffset="-163.3"
                />

                {/* Center text */}
                <text x="50" y="45" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
                  $6.8K
                </text>
                <text x="50" y="60" textAnchor="middle" fill="gray" fontSize="6">
                  TOTAL SALES
                </text>
              </svg>
            </div>

            <div className="flex-1 grid gap-2">
              {/* Category legend items */}
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#f43f5e]"></div>
                <span className="text-xs text-white">Clothing (42%)</span>
                <span className="text-xs text-gray-400 ml-auto">$3,620</span>
              </div>
              <div className="text-[10px] text-gray-500">1,456 CLOTHING PRODUCTS</div>

              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#06b6d4]"></div>
                <span className="text-xs text-white">Lingerie & Nightwear (15%)</span>
                <span className="text-xs text-gray-400 ml-auto">$2,280</span>
              </div>
              <div className="text-[10px] text-gray-500">834 LINGERIE PRODUCTS</div>

              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#8b5cf6]"></div>
                <span className="text-xs text-white">Tech (10%)</span>
                <span className="text-xs text-gray-400 ml-auto">$1,280</span>
              </div>
              <div className="text-[10px] text-gray-500">258 TECH PRODUCTS</div>

              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#f59e0b]"></div>
                <span className="text-xs text-white">Sportswear (22%)</span>
                <span className="text-xs text-gray-400 ml-auto">$1,420</span>
              </div>
              <div className="text-[10px] text-gray-500">670 SPORTSWEAR PRODUCTS</div>

              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#10b981]"></div>
                <span className="text-xs text-white">Accessories (11%)</span>
                <span className="text-xs text-gray-400 ml-auto">$1,224</span>
              </div>
              <div className="text-[10px] text-gray-500">364 ACCESSORY PRODUCTS</div>
            </div>
          </div>
        </div>
      </div>)
}
export default Charts;