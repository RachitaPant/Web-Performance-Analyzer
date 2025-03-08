export default function About(){
    return ( <div className="bg-white p-8 rounded-lg shadow-md mt-6 w-full max-w-3xl text-center">
        <h2 className="text-3xl font-bold text-gray-800">Why Web Performance Matters?</h2>
        <p className="text-gray-600 mt-3 leading-relaxed">
          A fast and optimized website ensures a seamless user experience, better search engine rankings, and higher conversion rates.
        </p>
        <div className="grid grid-cols-3 gap-6 mt-6">
          <FeatureCard title="Faster Load Times" description="Reduce bounce rates with optimized performance." />
          <FeatureCard title="Improved UX" description="Enhance customer satisfaction with smooth interactions." />
          <FeatureCard title="SEO Boost" description="Rank higher on search engines with better Core Web Vitals." />
        </div>
        <div className="mt-6 flex justify-center">
          <button className="bg-blue-500 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-600 transition-all">
            Learn More
          </button>
        </div>
      </div>
    );
}
function FeatureCard({ title, description }) {
    return (
      <div className="bg-gray-100 p-4 rounded-lg shadow-md text-center">
        <h4 className="text-lg font-semibold text-gray-700">{title}</h4>
        <p className="text-sm text-gray-600 mt-2">{description}</p>
      </div>
    );
  }