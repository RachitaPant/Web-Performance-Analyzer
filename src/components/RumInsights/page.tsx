import Image from "next/image"
interface RUMStatsProps {
DOMContentLoadTime:number,
thirdPartyRequestCount:number,
totalDOMNodes:number,
}
const  RUMInsights: React.FC<RUMStatsProps>= ({ DOMContentLoadTime,
  thirdPartyRequestCount,
  totalDOMNodes}) => {

return ( <div className="bg-[#1a2634] rounded-lg p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Real User Experience(RUM)-style Insights</h3>
         
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-700">
                  <th className="pb-2 text-left font-medium">METRIC</th>
                  <th className="pb-2 text-left font-medium">VALUE</th>
               
                  <th className="pb-2 text-left font-medium">UNIT</th>
                  <th className="pb-2 text-left font-medium">info</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-700">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-md overflow-hidden">
                        <Image
                          src="/images/dashboard/clock.png"
                          alt="DOM Conetnt Time"
                          width={32}
                          height={32}
                          className="object-cover"
                        />
                      </div>
                      <div className="text-xs text-white">
                       DOM Content Loaded Time
                        <div className="text-gray-400">info</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-xs text-white">{DOMContentLoadTime}</td>
                 
                  <td className="py-3 text-xs text-white">ms</td>
                  <td className="py-3 text-xs text-white"><p className="bg-white rounded-full w-4 text-black text-center">i</p></td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-md overflow-hidden">
                        <Image
                          src="/images/dashboard/numbers.png"
                          alt="Olivia Super Push-up Bra"
                          width={32}
                          height={32}
                          className="object-cover"
                        />
                      </div>
                      <div className="text-xs text-white">
                       Total DOM Nodes
                        <div className="text-gray-400">info</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-xs text-white">{totalDOMNodes}</td>
                 
                  <td className="py-3 text-xs text-white">nodes</td>
                  <td className="py-3 text-xs text-white"><p className="bg-white rounded-full w-4 text-black text-center">i</p></td>
                </tr>
                <tr>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-md overflow-hidden">
                        <Image
                          src="/images/dashboard/counter.png"
                          alt="Hammered Drop Earrings"
                          width={32}
                          height={32}
                          className="object-cover"
                        />
                      </div>
                      <div className="text-xs text-white">
                       Third Party request counts
                        <div className="text-gray-400">info</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-xs text-white">{thirdPartyRequestCount}</td>
                 
                  <td className="py-3 text-xs text-white">reqs</td>
                  <td className="py-3 text-xs text-white"><p className="bg-white rounded-full w-4 text-black text-center">i</p></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>)
}
export default RUMInsights;