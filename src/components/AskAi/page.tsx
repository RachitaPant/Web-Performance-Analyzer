import Image from "next/image"
import { Sparkles } from "lucide-react"
const AskAi=()=>{
return ( <div className="dash-card animate-fade-up p-4" style={{ animationDelay: "160ms" }}>
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-semibold text-white flex items-center gap-2">
        <Sparkles className="inline h-4 w-4" /> Ask AI
      </h3>
    </div>

    <div className="relative rounded-lg overflow-hidden group">
      <Image
       src="/images/dashboard/dash-1.jpg"
        alt="Pink lighted Keyboard"
        width={200}
        height={300}
        className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105"
      />



      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4">
        <h4 className="text-white font-medium">Enter Your Query</h4>
        <input
          type="text"
          placeholder="Type here..."
          className="w-full mt-2 px-3 py-2 text-sm rounded bg-white/10 text-white border border-white/20 placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-400/50 transition-all"
        />
        <button
          onClick={() => console.log("Query Submitted")}
          className="mt-3 px-4 py-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-pink-500/40 active:scale-[0.98] transition-all"
        >
          Submit
        </button>
      </div>
    </div>
  </div>)
}
export default AskAi