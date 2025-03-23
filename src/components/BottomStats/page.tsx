import Image from "next/image"
import {  ArrowUpIcon,ChevronDownIcon } from "lucide-react"
interface BottomStatsProps {
    data: any;
  }
  
const BottomStats: React.FC<BottomStatsProps> = ({ data }) =>{
    return (    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      
        <div className="bg-[#1a2634] rounded-lg p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Top Selling</h3>
            <button className="h-7 text-xs bg-transparent border border-gray-700 text-gray-400 rounded px-3 flex items-center">
              Sort by <ChevronDownIcon className="ml-1 w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-700">
                  <th className="pb-2 text-left font-medium">PRODUCT NAME</th>
                  <th className="pb-2 text-left font-medium">PRICE</th>
                  <th className="pb-2 text-left font-medium">STATUS</th>
                  <th className="pb-2 text-left font-medium">SOLD</th>
                  <th className="pb-2 text-left font-medium">TOTAL EARNING</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-700">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-md overflow-hidden">
                        <Image
                          src="/placeholder.svg?height=32&width=32"
                          alt="Leather Tote Bag"
                          width={32}
                          height={32}
                          className="object-cover"
                        />
                      </div>
                      <div className="text-xs text-white">
                        Leather Tote Bag
                        <div className="text-gray-400">BAGS BY STELLA</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-xs text-white">$225.00</td>
                  <td className="py-3">
                    <span className="bg-emerald-500/20 text-emerald-500 text-xs py-1 px-2 rounded-md">
                      In Stock
                    </span>
                  </td>
                  <td className="py-3 text-xs text-white">204 pcs</td>
                  <td className="py-3 text-xs text-white">$3,226</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-md overflow-hidden">
                        <Image
                          src="/placeholder.svg?height=32&width=32"
                          alt="Olivia Super Push-up Bra"
                          width={32}
                          height={32}
                          className="object-cover"
                        />
                      </div>
                      <div className="text-xs text-white">
                        Olivia Super Push-up Bra
                        <div className="text-gray-400">OLIVIA LINGERIE</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-xs text-white">$99.99</td>
                  <td className="py-3">
                    <span className="bg-amber-500/20 text-amber-500 text-xs py-1 px-2 rounded-md">Low Stock</span>
                  </td>
                  <td className="py-3 text-xs text-white">124 pcs</td>
                  <td className="py-3 text-xs text-white">$12,226</td>
                </tr>
                <tr>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-md overflow-hidden">
                        <Image
                          src="/placeholder.svg?height=32&width=32"
                          alt="Hammered Drop Earrings"
                          width={32}
                          height={32}
                          className="object-cover"
                        />
                      </div>
                      <div className="text-xs text-white">
                        Hammered Drop Earrings
                        <div className="text-gray-400">LUXURY JEWELS</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-xs text-white">$229.99</td>
                  <td className="py-3">
                    <span className="bg-emerald-500/20 text-emerald-500 text-xs py-1 px-2 rounded-md">
                      In Stock
                    </span>
                  </td>
                  <td className="py-3 text-xs text-white">1000 pcs</td>
                  <td className="py-3 text-xs text-white">$12,226</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Trending Now */}
        <div className="bg-[#1a2634] rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Trending Now</h3>
          </div>
          <div className="relative rounded-lg overflow-hidden">
            <Image
              src="/placeholder.svg?height=300&width=200"
              alt="Single Breasted Blazer"
              width={200}
              height={300}
              className="w-full h-64 object-cover"
            />
            <div className="absolute top-2 left-2 bg-blue-500/20 text-blue-400 text-xs py-1 px-2 rounded flex items-center">
              <ArrowUpIcon className="w-3 h-3 mr-1" />
              +25% vs yesterday
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <h4 className="text-white font-medium">Single Breasted Blazer</h4>
              <div className="text-white font-bold mt-1">$149.99</div>
            </div>
          </div>
        </div>
      </div>)
}
export default BottomStats;