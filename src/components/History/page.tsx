"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabase/supabaseClient"; 

interface HistoryItem {
  id: string;
  url: string;
  analysis_data: any;
  created_at: string;
  user_id: string;
}

interface GroupedHistory {
  [url: string]: HistoryItem[];
}

const HistoryPage = () => {
  const [groupedHistory, setGroupedHistory] = useState<GroupedHistory>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Session error:", sessionError.message);
        setLoading(false);
        return;
      }

      const userId = session?.user?.id;
      if (!userId) {
        console.warn("No user session found.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("history")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching history:", error.message);
        setLoading(false);
        return;
      }

      const grouped: GroupedHistory = {};
      data?.forEach((item) => {
        if (!grouped[item.url]) grouped[item.url] = [];
        grouped[item.url].push(item);
      });

      setGroupedHistory(grouped);
      setLoading(false);
    };

    fetchHistory();
  }, []);

  if (loading) return <div className="p-6">Loading history...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Your Analysis History</h1>

      {Object.entries(groupedHistory).length === 0 ? (
        <p className="text-gray-600">No history found.</p>
      ) : (
        Object.entries(groupedHistory).map(([url, entries]) => (
          <div key={url} className="mb-8">
            <h2 className="text-xl font-semibold text-blue-700 underline mb-2">
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
                  <summary className="text-sm font-medium text-blue-600">
                    View Analysis Data
                  </summary>
                  <pre className="mt-2 p-2 text-sm bg-white rounded overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(entry.analysis_data, null, 2)}
                  </pre>
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
