export default function HelpSection() {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md mt-6 w-full max-w-3xl text-center">
        <h2 className="text-3xl font-bold text-gray-800">Help & Support</h2>
        <p className="text-gray-600 mt-3">Find answers to common questions and troubleshooting tips.</p>
        <ul className="mt-4 text-left">
          <li className="text-gray-700">✅ How to analyze my website?</li>
          <li className="text-gray-700">✅ Understanding the performance metrics</li>
          <li className="text-gray-700">✅ Improving website speed</li>
        </ul>
        <div className="mt-6 flex justify-center">
          <button className="bg-[#E6B2BA] text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-600 transition-all">
            Visit Help Center
          </button>
        </div>
      </div>
    );
  }