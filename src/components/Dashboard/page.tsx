import { useState } from "react"

import Header from "../Header/page"
import StatsCards from "../StatsCards/page"
import Charts from "../Charts/page"
import BottomStats from "../BottomStats/page"
import Form from "../Form/page"

export default function Dashboard() {
      const [analysisData, setAnalysisData] = useState(null);
     

     
  return (
    <div className="flex h-screen bg-[#0e1621] w-full">

      
      <div className="flex-1 overflow-auto">
        <Header/>
        <div className="p-4">
        <Form setAnalysisData={setAnalysisData} />
          <StatsCards data={analysisData}/>
          <Charts data={analysisData}/>
         <BottomStats data={analysisData}/>
        </div>
      </div>
    </div>
  )
}

