"use client";
import About from "@/components/About/page";
import Header from "@/components/Header/page";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useState } from "react";
import { FiSearch, FiBell, FiCpu, FiDatabase, FiHardDrive } from "react-icons/fi";
import { HiOutlineDotsHorizontal } from "react-icons/hi";
import ContactSection from "@/components/Contact/page";
import Footer from "@/components/Footer/page";
import HelpSection from "@/components/Help/page";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [performanceMetrics, setPerformanceMetrics] = useState({});
  const [networkRequests, setNetworkRequests] = useState([]);
  const [jsExecutionTime, setJsExecutionTime] = useState(null);
  const [cpuUsage, setCpuUsage] = useState(0);
const [memoryUsage, setMemoryUsage] = useState(0);
const [diskIO, setDiskIO] = useState(0);
const [advice, setAdvice] = useState("");

const getPerformanceAdvice = (cpu, memory, disk) => {
  let adviceText = "";

  // CPU Advice
  if (cpu > 70) {
    adviceText += "⚠️ High CPU usage detected! Consider optimizing JavaScript execution and reducing background tasks.\n";
  } else if (cpu > 40) {
    adviceText += "⚠️ Moderate CPU load. Try minifying JavaScript and reducing DOM manipulations.\n";
  } else {
    adviceText += "✅ CPU performance is optimal.\n";
  }

  // Memory Advice
  if (memory > 4000) {
    adviceText += "⚠️ High Memory usage! Optimize images, reduce memory leaks, and avoid excessive DOM elements.\n";
  } else if (memory > 2000) {
    adviceText += "⚠️ Moderate Memory usage. Consider using lazy loading and efficient data structures.\n";
  } else {
    adviceText += "✅ Memory performance is good.\n";
  }

  // Disk I/O Advice
  if (disk > 300) {
    adviceText += "⚠️ High Disk I/O detected! Optimize database queries and minimize file operations.\n";
  } else if (disk > 100) {
    adviceText += "⚠️ Moderate Disk I/O. Check caching strategies and reduce unnecessary writes.\n";
  } else {
    adviceText += "✅ Disk I/O is within optimal range.\n";
  }

  return adviceText;
};


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) throw new Error("Failed to fetch performance data");

      const data = await res.json();
      setResult(data);

      // Extract and set values in separate state variables
      setPerformanceMetrics(data.performanceMetrics || {});
      setJsExecutionTime(data.jsExecutionTime || 0);
      setNetworkRequests(data.networkRequests || []);
      setCpuUsage(data.cpuUsage || 0);
      setMemoryUsage(data.memoryUsage || 0);
      setDiskIO(data.diskIO || 0);
      const adviceText = getPerformanceAdvice(data.cpuUsage, data.memoryUsage, data.diskIO);
    setAdvice(adviceText);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center  bg-gray-100">
      <Header />
      <header className="flex justify-between items-center bg-white p-4 rounded-xl shadow-md w-full max-w-6xl">
        <div className="text-xl font-semibold flex items-center space-x-3">
          <FiCpu className="text-blue-500 w-6 h-6" />
          <span className="text-gray-600">Resource Allocation Monitor</span>
        </div>
        <div className="flex items-center space-x-4">
          <FiSearch className="text-gray-500 w-5 h-5" />
          <FiBell className="text-gray-500 w-5 h-5" />
          <img
            src="https://randomuser.me/api/portraits/men/10.jpg"
            alt="User"
            className="w-10 h-10 rounded-full"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 max-w-6xl w-full">
  <MetricCard icon={<FiCpu />} label="CPU Usage" value={`${cpuUsage}%`} />
  <MetricCard icon={<FiDatabase />} label="Memory Usage" value={`${memoryUsage} MB`} />
  <MetricCard icon={<FiHardDrive />} label="Disk I/O" value={`${diskIO} MB/s`} />
</div>


      <div className="bg-white p-6 rounded-xl shadow-md mt-6 w-full max-w-6xl">
        <h2 className="text-lg font-semibold">Performance Trends</h2>
        <ResponsiveContainer width="100%" height={250}>
  <LineChart data={[
    { name: "Load Time", value: performanceMetrics.timing?.loadEventEnd },
    { name: "DOM Complete", value: performanceMetrics.timing?.domComplete },
    { name: "Response Time", value: performanceMetrics.timing?.responseEnd - performanceMetrics.timing?.responseStart },
  ]}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    <Line type="monotone" dataKey="value" stroke="#ff7300" />
  </LineChart>
</ResponsiveContainer>
<ResponsiveContainer width="100%" height={250}>
  <LineChart data={[
    { name: "CPU Usage", value: cpuUsage },
    { name: "Memory Usage", value: memoryUsage },
    { name: "Disk I/O", value: diskIO },
  ]}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    <Line type="monotone" dataKey="value" stroke="#ff7300" />
  </LineChart>
</ResponsiveContainer>
{advice && (
  <div className="mt-6 p-4 bg-gray-100 border-l-4 border-yellow-500">
    <h3 className="text-lg font-semibold">💡 Performance Advice:</h3>
    <pre className="whitespace-pre-wrap text-gray-700">{advice}</pre>
  </div>
)}



      </div>

      <div className="items-center bg-white rounded-md p-4  text-black justify-center py-16 my-6 md:w-[78%] shadow-md">
        <h1 className="text-3xl font-semibold">Web Performance Analyzer</h1>
       

        <form className="mt-4 flex gap-2" onSubmit={handleSubmit}>
          <input
            type="url"
            placeholder="Enter website URL"
            className="p-2 border border-gray-300 rounded-md w-full"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-md">
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </form>

        {error && <p className="text-red-500 mt-2">{error}</p>}

        {result && (
  <div className="mt-6 p-6 border border-gray-300 rounded-md w-full max-w-2xl text-wh shadow-lg bg-white">
    <h2 className="text-lg font-semibold">Performance Metrics</h2>
    <div className="grid grid-cols-2 gap-4 mt-4">
      <MetricCard label="JS Execution Time" value={`${jsExecutionTime} ms`} />
      <MetricCard label="Load Event End" value={`${performanceMetrics.timing?.loadEventEnd || 0} ms`} />
      <MetricCard label="DOM Complete" value={`${performanceMetrics.timing?.domComplete || 0} ms`} />
      <MetricCard label="Response Time" value={`${performanceMetrics.timing?.responseEnd - performanceMetrics.timing?.responseStart} ms`} />
      <MetricCard label="DNS Lookup" value={`${performanceMetrics.timing?.domainLookupEnd - performanceMetrics.timing?.domainLookupStart} ms`} />
      <MetricCard label="Connection Time" value={`${performanceMetrics.timing?.connectEnd - performanceMetrics.timing?.connectStart} ms`} />
      <MetricCard label="DOM Interactive" value={`${performanceMetrics.timing?.domInteractive} ms`} />
      <MetricCard label="Redirect Count" value={`${performanceMetrics.navigation?.redirectCount}`} />
    </div>
  </div>
)}

      </div>
      <About />
      <ContactSection/>
      <HelpSection/>
      <Footer/>
    </main>
  );
}

// Reusable Component for Metrics Display
function MetricCard({ label, value, icon }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center text-center">
      {icon && <div className="text-blue-500 mb-2 text-2xl">{icon}</div>}
      <h4 className="text-sm text-gray-500">{label}</h4>
      <p className="text-lg ">{value}</p>
    </div>
  );
}
