"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthProvider";
import { db } from "@/lib/firebaseClient";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";

interface HistoryItem {
  id: string;
  url: string;
  analysis_data: AnalysisData;
  created_at: string | Date;
  user_id: string;
}

interface GroupedHistory {
  [url: string]: HistoryItem[];
}

interface AnalysisData {
  puppeteerData?: {
    jsExecutionTime?: number;
    cpuUsage?: number | null;
    memoryUsage?: number | null;
    diskIO?: number | null;
  };
  lighthouseData?: {
    audits?: {
      "is-on-https"?: { score?: number };
      "first-contentful-paint"?: { score?: number };
      "largest-contentful-paint"?: { score?: number };
    };
  };
}

const HistoryPage = () => {
  const { user } = useAuth();
  const [groupedHistory, setGroupedHistory] = useState<GroupedHistory>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) {
        console.warn("No user session found.");
        setLoading(false);
        return;
      }

      try {
        const historyRef = collection(db, "users", user.uid, "history");
        const q = query(
          historyRef,
          where("user_id", "==", user.uid),
          orderBy("created_at", "desc")
        );
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          created_at: doc.data().created_at.toDate().toISOString(),
        })) as HistoryItem[];

        const grouped: GroupedHistory = {};
        data.forEach((item) => {
          if (!grouped[item.url]) grouped[item.url] = [];
          grouped[item.url].push(item);
        });

        setGroupedHistory(grouped);
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  if (loading) return <div className="p-6">Loading history...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Your Analysis History</h1>
      {Object.entries(groupedHistory).length === 0 ? (
        <p className="text-gray-600">No history found.</p>
      ) : (
        Object.entries(groupedHistory).map(([url, entries]) => (
          <div key={url} className="mb-8">
            <h2 className="text-xl font-semibold text-amber-500/40 underline mb-2">
              {url}
            </h2>
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="bg-gray-100 rounded-md shadow-sm p-4 mb-3"
              >
                <div className="text-sm text-gray-500 mb-1">
                  {new Date(entry.created_at).toLocaleString()}
                </div>
                <details className="cursor-pointer">
                  <summary className="text-sm font-medium text-yellow-600">
                    View Analysis Data
                  </summary>
                  <div className="mt-2 p-2 text-sm bg-white text-black rounded space-y-3">
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-1">
                        Puppeteer Data
                      </h3>
                      <ul className="list-disc list-inside">
                        <li>
                          JS Execution Time:{" "}
                          {entry.analysis_data?.puppeteerData
                            ?.jsExecutionTime ?? "N/A"}{" "}
                          ms
                        </li>
                        <li>
                          CPU Usage:{" "}
                          {entry.analysis_data?.puppeteerData?.cpuUsage ??
                            "N/A"}
                        </li>
                        <li>
                          Memory Usage:{" "}
                          {entry.analysis_data?.puppeteerData?.memoryUsage ??
                            "N/A"}
                        </li>
                        <li>
                          Disk IO:{" "}
                          {entry.analysis_data?.puppeteerData?.diskIO ?? "N/A"}
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-1">
                        Lighthouse Data
                      </h3>
                      <ul className="list-disc list-inside">
                        <li>
                          HTTPS:{" "}
                          {entry.analysis_data?.lighthouseData?.audits?.[
                            "is-on-https"
                          ]?.score ?? "N/A"}
                        </li>
                        <li>
                          First Contentful Paint:{" "}
                          {entry.analysis_data?.lighthouseData?.audits?.[
                            "first-contentful-paint"
                          ]?.score ?? "N/A"}
                        </li>
                        <li>
                          Largest Contentful Paint:{" "}
                          {entry.analysis_data?.lighthouseData?.audits?.[
                            "largest-contentful-paint"
                          ]?.score ?? "N/A"}
                        </li>
                      </ul>
                    </div>
                  </div>
                </details>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
};

export default HistoryPage;
