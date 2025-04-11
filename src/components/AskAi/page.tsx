import Image from "next/Image"
const AskAi=()=>{
return ( <div className="bg-[#1a2634] rounded-lg p-4">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-semibold text-white">Ask Ai</h3>
    </div>

    <div className="relative rounded-lg overflow-hidden">
      <Image
       src="/images/dashboard/dash-1.jpg"
        alt="Pink lighted Keyboard"
        width={200}
        height={300}
        className="w-full h-64 object-cover"
      />

      

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <h4 className="text-white font-medium">Enter Your Query</h4>
        <input
          type="text"
          placeholder="Type here..."
          className="w-full mt-2 px-3 py-2 text-sm rounded bg-white/10 text-white border border-white/20 placeholder:text-white/50 focus:outline-none"
        />
        <button
          onClick={() => console.log("Query Submitted")}
          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Submit
        </button>
      </div>
    </div>
  </div>)
}
export default AskAi